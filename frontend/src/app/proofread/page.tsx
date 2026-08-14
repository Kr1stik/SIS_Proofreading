'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef, ChangeEvent } from 'react';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import {
  FileText,
  Upload,
  RefreshCw,
  FileType,
  FileSpreadsheet,
  Trash2,
  AlertCircle,
  Search,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  Download,
  LogOut,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  fetchFiles as apiFetchFiles,
  uploadDocument as apiUploadDocument,
  uploadSpreadsheet as apiUploadSpreadsheet,
  getMediaUrl,
  getAuthToken,
} from '@/lib/api';
import { OrbitRing } from '@/components/ui/orbit-ring';
import { ListSkeleton } from '@/components/ui/list-skeleton';

export interface FileItem {
  id?: number | string;
  name: string;
  url: string;
  type: 'document' | 'spreadsheet';
  submissionId?: string;
  size?: number;
  createdAt?: string;
}

function getFilenameFromUrl(url: string, fallback: string): string {
  if (!url) return fallback;
  try {
    const parts = url.split('/');
    const raw = parts[parts.length - 1] || '';
    return raw.replace(/^\d+_/, '') || fallback;
  } catch {
    return fallback;
  }
}

const formatMediaUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  return getMediaUrl(url);
};

// -------------------------------------------------------------------
// 1. INDEPENDENT DOCUMENT WORKSPACE PANE (React.memo)
// -------------------------------------------------------------------
interface DocumentViewerPaneProps {
  url: string;
  availableDocs: FileItem[];
  onSelectDoc: (url: string) => void;
  onUploadSuccess: (newDocUrl: string) => void;
  onDeleteSuccess: (deletedUrl: string) => void;
  onRequestDelete: (fileType: 'document' | 'spreadsheet', url: string, id: string, name: string) => void;
  onShowToast: (message: string, type?: 'success' | 'error' | 'warning') => void;
}

const DocumentViewerPane = React.memo(function DocumentViewerPane({
  url,
  availableDocs,
  onSelectDoc,
  onUploadSuccess,
  onDeleteSuccess,
  onRequestDelete,
  onShowToast,
}: DocumentViewerPaneProps) {
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const [zoom, setZoom] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const isPdf = Boolean(
    url && (url.toLowerCase().endsWith('.pdf') || url.includes('.pdf?'))
  );

  useEffect(() => {
    setZoom(100);
  }, [url]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!canvasRef.current) return;
    if (!document.fullscreenElement) {
      canvasRef.current.requestFullscreen().catch((err) => {
        console.error('Error enabling fullscreen:', err);
      });
    } else {
      document.exitFullscreen().catch((err) => {
        console.error('Error exiting fullscreen:', err);
      });
    }
  }, []);

  const fullMediaUrl = useMemo(() => {
    return formatMediaUrl(url);
  }, [url]);

  // PDF Binary Payload Loader & Blob Object URL Generator
  useEffect(() => {
    if (!url || !isPdf) {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
        setPdfBlobUrl(null);
      }
      setPdfError(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setPdfError(false);

    let currentBlobUrl: string | null = null;

    fetch(fullMediaUrl)
      .then((res) => {
        if (!res.ok) {
          setPdfError(true);
          setPdfBlobUrl(null);
          return null;
        }
        return res.blob();
      })
      .then((blob) => {
        if (blob) {
          currentBlobUrl = URL.createObjectURL(blob);
          setPdfBlobUrl(currentBlobUrl);
          setPdfError(false);
        }
      })
      .catch((err: any) => {
        console.error('Error loading PDF blob:', err);
        setPdfError(true);
        setPdfBlobUrl(null);
      })
      .finally(() => {
        setIsLoading(false);
      });

    return () => {
      if (currentBlobUrl) {
        URL.revokeObjectURL(currentBlobUrl);
      }
    };
  }, [url, isPdf, fullMediaUrl]);

  useEffect(() => {
    if (!url || isPdf) {
      setPreviewHtml('');
      setIsLoading(false);
      return;
    }

    const isDocx = url.toLowerCase().endsWith('.docx') || url.includes('.docx?');
    if (!isDocx) {
      setPreviewHtml('');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    fetch(fullMediaUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch Word document: ${res.statusText}`);
        return res.arrayBuffer();
      })
      .then((arrayBuffer) => mammoth.convertToHtml({ arrayBuffer }))
      .then((result) => {
        setPreviewHtml(result.value || '');
      })
      .catch((err: any) => {
        console.error('Error rendering Mammoth preview:', err);
        setError('Unable to render Word document HTML preview.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [url, isPdf, fullMediaUrl]);

  const handleFileUpload = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setIsUploading(true);

    try {
      const result = await apiUploadDocument(file);
      if (result && (result.success || result.status === 200 || result.status === 201 || result.url || result.name)) {
        const uploadedUrl = result.url || result.data?.documentUrl || result.data?.fileUrl || result.documentUrl || result.fileUrl || '';
        onShowToast(`Document "${file.name}" uploaded successfully!`, 'success');
        onUploadSuccess(uploadedUrl);
      } else {
        onShowToast(result?.error || result?.message || 'Failed to upload document file.', 'error');
      }
    } catch (err: any) {
      console.error('Error uploading document:', err);
      onShowToast(err.message || 'An error occurred during document upload.', 'error');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  }, [onShowToast, onUploadSuccess]);

  const handleDeleteFile = useCallback(() => {
    if (!url) return;
    const targetDoc = availableDocs.find((d) => d.url === url);
    const docId = targetDoc ? String(targetDoc.id) : '';
    const docName = targetDoc ? targetDoc.name : getFilenameFromUrl(url, 'Document');
    onRequestDelete('document', url, docId, docName);
  }, [url, availableDocs, onRequestDelete]);

  const docFilename = getFilenameFromUrl(url, 'Document');

  return (
    <div className="w-full flex flex-col h-full overflow-hidden">
      {/* LEFT PANE HEADER */}
      <div className="pb-3 border-b border-slate-200 flex items-center justify-between flex-shrink-0 gap-2">
        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
          <FileType className="w-4 h-4 text-[#DC95FF]" />
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Document Workspace
          </h2>

          {/* Independent Document Selector Dropdown */}
          <select
            value={url}
            onChange={(e) => onSelectDoc(e.target.value)}
            className="bg-white text-xs font-semibold text-slate-800 border border-slate-200 rounded-lg px-2.5 py-1 max-w-[180px] truncate focus:outline-none focus:ring-2 focus:ring-[#DC95FF]/30 focus:border-[#DC95FF] shadow-xs cursor-pointer"
          >
            {availableDocs.length === 0 ? (
              <option value="">No Documents Available</option>
            ) : (
              availableDocs.map((doc) => (
                <option key={doc.url} value={doc.url}>
                  {doc.name || getFilenameFromUrl(doc.url, 'Document')}
                </option>
              ))
            )}
          </select>

          {/* Active File Pill Badge */}
          {url && (
            <span className="px-2.5 py-0.5 bg-purple-50 text-[#DC95FF] border border-[#DC95FF]/30 text-xs font-semibold rounded-full max-w-[130px] truncate shadow-xs">
              {docFilename}
            </span>
          )}
        </div>

        {/* Action Buttons: Delete & Upload Document */}
        <div className="flex items-center space-x-2">
          {url && (
            <button
              onClick={handleDeleteFile}
              disabled={isDeleting}
              className="p-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors cursor-pointer"
              title="Delete Document File"
            >
              {isDeleting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            </button>
          )}

          <label className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-[#DC95FF] hover:opacity-90 text-white font-medium text-xs rounded-lg cursor-pointer transition-all shadow-xs">
            {isUploading ? (
              <OrbitRing className="w-3.5 h-3.5 text-white" />
            ) : (
              <Upload className="w-3.5 h-3.5" />
            )}
            <span>{isUploading ? 'Uploading...' : 'Upload Document (.pdf / .docx)'}</span>
            <input
              type="file"
              accept=".docx,.pdf"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Document Canvas Content Container */}
      <div
        ref={canvasRef}
        className={`relative flex-1 w-full h-full mt-3 overflow-hidden rounded-xl bg-slate-100/50 border border-slate-200 ${
          isFullscreen ? 'p-4 bg-slate-900 flex flex-col justify-center items-center' : ''
        }`}
      >
        {/* COMPACT THEMED FLOATING CONTROLS */}
        {url && (
          <div className="absolute top-4 right-4 z-20 flex items-center space-x-2 bg-[#181824]/90 backdrop-blur border border-[#DC95FF]/30 text-white rounded-lg px-3 py-1.5 shadow-lg">
            <span className="text-[11px] font-medium text-purple-200 uppercase tracking-wider font-mono">
              {isPdf ? 'PDF View' : 'DOCX View'}
            </span>
            <div className="h-3 w-[1px] bg-slate-700 mx-1" />
            <button
              onClick={() => setZoom((prev) => Math.min(prev + 10, 200))}
              className="p-1 hover:bg-[#DC95FF]/20 text-purple-200 hover:text-white rounded transition-colors cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-mono font-medium px-1 text-purple-300">{zoom}%</span>
            <button
              onClick={() => setZoom((prev) => Math.max(prev - 10, 50))}
              className="p-1 hover:bg-[#DC95FF]/20 text-purple-200 hover:text-white rounded transition-colors cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom(100)}
              className="p-1 hover:bg-[#DC95FF]/20 text-purple-200 hover:text-white rounded transition-colors cursor-pointer"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <div className="h-3 w-[1px] bg-slate-700 mx-1" />
            <button
              onClick={toggleFullscreen}
              className="p-1 hover:bg-[#DC95FF]/20 text-purple-200 hover:text-white rounded transition-colors cursor-pointer"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
            <a
              href={fullMediaUrl}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="p-1 hover:bg-[#DC95FF]/20 text-purple-200 hover:text-white rounded transition-colors cursor-pointer inline-flex items-center"
              title="Download Source Document"
            >
              <Download className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        {!url ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-300 bg-slate-50 rounded-xl">
            <FileText className="w-10 h-10 mb-3 text-slate-400" />
            <p className="text-xs font-bold text-slate-800">No Document File Selected</p>
            <p className="text-[11px] text-slate-500 mt-1 max-w-sm">
              Select an existing document from the dropdown above or upload a new .pdf / .docx file.
            </p>
            <label className="mt-4 px-4 py-2 bg-[#DC95FF] hover:opacity-90 text-white font-medium text-xs rounded-lg transition-all shadow-xs cursor-pointer inline-flex items-center space-x-2">
              {isUploading ? (
                <OrbitRing className="w-3.5 h-3.5 text-white" />
              ) : (
                <Upload className="w-3.5 h-3.5" />
              )}
              <span>{isUploading ? 'Uploading...' : 'Upload Document'}</span>
              <input
                type="file"
                accept=".docx,.pdf"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="hidden"
              />
            </label>
          </div>
        ) : isLoading ? (
          <div className="h-full w-full p-6 flex flex-col justify-center max-w-xl mx-auto space-y-3">
            <div className="flex items-center space-x-2 text-xs font-semibold text-purple-800 bg-purple-50 p-3 rounded-xl border border-purple-100 shadow-xs">
              <OrbitRing className="w-4 h-4 text-[#DC95FF]" />
              <span>Rendering document layout & typography layers...</span>
            </div>
            <ListSkeleton rows={5} />
          </div>
        ) : pdfError ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-slate-50 rounded-xl border border-dashed border-rose-200">
            <div className="w-12 h-12 mb-3 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 font-bold text-xl">
              ⚠️
            </div>
            <h3 className="text-sm font-semibold text-slate-800 mb-1">Document File Missing on Server</h3>
            <p className="text-xs text-slate-500 max-w-xs mb-4">
              This database entry exists, but the physical PDF file was moved or deleted from media storage.
            </p>
            <button
              onClick={handleDeleteFile}
              className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold rounded-lg shadow-xs transition-all cursor-pointer"
            >
              Remove Orphan Record from Database
            </button>
          </div>
        ) : error ? (
          <div className="w-full p-4 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl text-xs space-y-2 m-4">
            <div className="font-bold flex items-center space-x-1.5 text-rose-800">
              <AlertCircle className="w-4 h-4" />
              <span>Preview Notice</span>
            </div>
            <p>{error}</p>
          </div>
        ) : isPdf && pdfBlobUrl ? (
          <div className="w-full h-full bg-white rounded-xl overflow-hidden flex items-center justify-center">
            <iframe
              src={`${pdfBlobUrl}#toolbar=0&navpanes=0&view=FitH`}
              title="PDF Document Preview"
              className="w-full h-full min-h-[600px] border-0 rounded-xl bg-white shadow-inner"
              style={{ zoom: `${zoom}%` }}
            />
          </div>
        ) : (
          <div className="w-full h-full overflow-y-auto p-4 bg-slate-100/60 rounded-xl">
            <div
              style={{ zoom: `${zoom}%` }}
              className="max-w-3xl mx-auto bg-white text-slate-900 p-8 shadow-xl rounded-sm min-h-full transition-all doc-content-view"
            >
              <div
                className="prose prose-slate max-w-none prose-headings:font-extrabold prose-headings:text-slate-950 prose-headings:tracking-tight prose-strong:font-extrabold prose-strong:text-slate-950 prose-strong:bg-purple-100/70 prose-strong:px-1.5 prose-strong:py-0.5 prose-strong:rounded-sm prose-strong:border-b-2 prose-strong:border-[#DC95FF] prose-b:font-extrabold prose-b:text-slate-950 prose-b:bg-purple-100/70 prose-b:px-1.5 prose-b:py-0.5 prose-b:rounded-sm prose-b:border-b-2 prose-b:border-[#DC95FF] prose-p:leading-relaxed prose-p:mb-4 text-slate-900"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

// -------------------------------------------------------------------
// 2. PARSED PAGE PLAN VIEWER PANE (React.memo)
// -------------------------------------------------------------------
export interface PagePlanRecord {
  name: string;
  role?: string;
  photoStatus: string;
  textStatus: string;
  instruction: string;
  department: string;
  isHeader?: boolean;
  pageLabel?: string;
  pageNumber?: string;
}

interface SpreadsheetViewerPaneProps {
  url: string;
  availableSheets: FileItem[];
  onSelectSheet: (url: string) => void;
  onUploadSuccess: (newSheetUrl: string) => void;
  onDeleteSuccess: (deletedUrl: string) => void;
  onRequestDelete: (fileType: 'document' | 'spreadsheet', url: string, id: string, name: string) => void;
  onShowToast: (message: string, type?: 'success' | 'error' | 'warning') => void;
}

const HighlightedText = React.memo(function HighlightedText({
  text,
  query,
  className,
}: {
  text?: string;
  query?: string;
  className?: string;
}) {
  if (!text) return null;
  if (!query || !query.trim()) {
    return <span className={className}>{text}</span>;
  }

  const q = query.trim();
  const escapedQuery = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'));

  return (
    <span className={className}>
      {parts.map((part, i) =>
        part.toLowerCase() === q.toLowerCase() ? (
          <mark
            key={i}
            className="matched-term bg-amber-200 text-amber-950 font-extrabold px-1 py-0.5 rounded-sm shadow-xs border-b border-amber-400"
          >
            {part}
          </mark>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        )
      )}
    </span>
  );
});

const extractPageLabel = (colAValue: any): string | undefined => {
  if (colAValue === undefined || colAValue === null) return undefined;
  const str = String(colAValue).trim();
  if (!str) return undefined;

  const clean = str
    .replace(/^Page\s+/i, '')
    .replace(/^P-?/i, '')
    .replace(/^Spread\s+/i, '')
    .trim();

  if (clean && clean.length <= 20) {
    return clean;
  }
  return undefined;
};

const parseNameAndRole = (rawStr: string): { name: string; role?: string } => {
  if (!rawStr) return { name: '' };
  let trimmed = rawStr.trim();
  trimmed = trimmed.replace(/^["'\s]+|["'\s]+$/g, '');

  // 1. "Message of [Title] - [Name]" or "Message of [Title]: [Name]"
  const msgMatch = trimmed.match(/^(Message\s+of\s+.+?)\s*[\-–—:]\s*(.+)$/i);
  if (msgMatch) {
    const roleTitle = msgMatch[1].trim();
    const personName = msgMatch[2].trim();
    if (personName && roleTitle) {
      return { name: personName, role: roleTitle };
    }
  }

  // 2. "[Role]: [Name]" pattern (e.g. "Layout Artist: Elmo")
  const colonMatch = trimmed.match(/^([A-Za-z\s\/&]+):\s*(.+)$/);
  if (colonMatch && !colonMatch[1].toLowerCase().includes('http')) {
    const potentialRole = colonMatch[1].trim();
    const potentialName = colonMatch[2].trim();
    if (potentialRole && potentialName && potentialRole.length < 35) {
      return { name: potentialName, role: potentialRole };
    }
  }

  // 3. "[Name] - [Role/Department]" or "[Role] - [Name]" pattern
  const dashMatch = trimmed.match(/^(.+?)\s*[\-–—]\s*(.+)$/);
  if (dashMatch) {
    const leftPart = dashMatch[1].trim();
    const rightPart = dashMatch[2].trim();

    const roleKeywords = ['editor', 'artist', 'proofreader', 'staff', 'secretary', 'adviser', 'president', 'manager', 'head', 'officer', 'photojournalist', 'layout', 'graphic'];
    const leftIsRole = roleKeywords.some((k) => leftPart.toLowerCase().includes(k));

    if (leftIsRole) {
      return { name: rightPart, role: leftPart };
    }
    return { name: leftPart, role: rightPart };
  }

  // 4. "[Name] ([Role])" pattern
  const parenMatch = trimmed.match(/^(.+?)\s*\((.+?)\)$/);
  if (parenMatch) {
    const namePart = parenMatch[1].trim();
    const rolePart = parenMatch[2].trim();
    if (namePart && rolePart) {
      return { name: namePart, role: rolePart };
    }
  }

  return { name: trimmed };
};

const isSectionHeaderCandidate = (str: string): boolean => {
  if (!str) return false;
  const s = str.trim();
  const upper = s.toUpperCase();

  // If this line explicitly contains a role marker with person name (like "Elmo - Layout Artist" or "Elmo Cañet - Layout Artist"), it is a MEMBER record
  if (s.includes(' - ') || s.includes('–') || s.includes('—') || s.includes(':') || s.includes('(')) {
    const roleKeywords = ['LAYOUT ARTIST', 'GRAPHIC ARTIST', 'ASSOCIATE EDITOR', 'MANAGING EDITOR', 'EDITOR-IN-CHIEF', 'BOARD SECRETARY', 'PROOFREADER', 'JUNIOR STAFF', 'COLLEGE EDITOR'];
    if (roleKeywords.some((r) => upper.includes(r))) {
      return false;
    }
  }

  // Section titles
  if (
    upper.startsWith('TORCH BEARER') ||
    upper.startsWith('MESSAGE OF') ||
    upper.startsWith('FLYLEAF') ||
    upper.startsWith('FRONT FLYLEAF') ||
    upper.startsWith('BACK FLYLEAF') ||
    upper.startsWith('ABC FLYLEAF') ||
    upper.startsWith('XYZ FLYLEAF') ||
    upper.startsWith('FLYLEAVES') ||
    upper.includes('EDITORIAL BOARD') ||
    upper.includes('COLLEGE EDITORS') ||
    upper.includes('JUNIOR STAFF') ||
    upper.includes('HEADS AND MANAGERS') ||
    upper.includes('CLASS PICTURES') ||
    upper.includes('UNIVERSITY ORGANIZATIONS') ||
    upper.includes('ORGANIZATIONS') ||
    upper.includes('FACULTY') ||
    upper.includes('ADMINISTRATION') ||
    upper.includes('DEDICATION') ||
    upper.includes('PREAMBLE') ||
    upper.includes('VISION') ||
    upper.includes('MISSION') ||
    upper.includes('PUBLICATION') ||
    upper.includes('COVER') ||
    upper.includes('PAGE PLAN') ||
    upper.includes('SECTION')
  ) {
    return true;
  }

  return false;
};

const formatSectionTitle = (str: string): string => {
  if (!str) return 'General';
  const s = str.trim();
  const upper = s.toUpperCase();

  if (upper.includes('EDITORIAL BOARD')) return 'Torch Bearer 2026 - Editorial Board';
  if (upper.includes('COLLEGE EDITORS') || upper.includes('COLLEGE EDITOR')) return 'Torch Bearer 2026 - College Editors';
  if (upper.includes('JUNIOR STAFF')) return 'Torch Bearer 2026 - Junior Staff';
  if (upper.includes('ABC FLYLEAF') || upper.includes('ABC FLYLEAVES')) return 'ABC Flyleaves';
  if (upper.includes('XYZ FLYLEAF') || upper.includes('XYZ FLYLEAVES')) return 'XYZ Flyleaves';
  if (upper.includes('FLYLEAF') || upper.includes('FLYLEAVES')) return 'Flyleaves';

  return s;
};

const SpreadsheetViewerPane = React.memo(function SpreadsheetViewerPane({
  url,
  availableSheets,
  onSelectSheet,
  onUploadSuccess,
  onDeleteSuccess,
  onRequestDelete,
  onShowToast,
}: SpreadsheetViewerPaneProps) {
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [activeSheetName, setActiveSheetName] = useState<string>('');

  const [extractedRecords, setExtractedRecords] = useState<PagePlanRecord[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Fetch & Read Workbook
  useEffect(() => {
    if (!url) {
      setWorkbook(null);
      setSheetNames([]);
      setActiveSheetName('');
      setExtractedRecords([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const fullMediaUrl = getMediaUrl(url);

    fetch(fullMediaUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch spreadsheet: ${res.statusText}`);
        return res.arrayBuffer();
      })
      .then((buffer) => {
        const wb = XLSX.read(buffer, { type: 'array', codepage: 65001 });
        setWorkbook(wb);
        const names = wb.SheetNames || [];
        setSheetNames(names);
        if (names.length > 0) {
          setActiveSheetName(names[0]);
        }
      })
      .catch((err: any) => {
        console.error('Error parsing spreadsheet:', err);
        setError('Failed to parse spreadsheet file.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [url]);

  // Reset department selection on URL / sheet switch
  useEffect(() => {
    setSelectedDepartment('ALL');
  }, [url, activeSheetName]);

  // Parse Active Sheet Tab dynamically with column detection and section grouping
  useEffect(() => {
    if (!workbook || !activeSheetName) return;

    const ws = workbook.Sheets[activeSheetName];
    if (!ws) return;

    const rawRows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: '' });
    const records: PagePlanRecord[] = [];
    let currentDepartment = activeSheetName || 'General';

    // Dynamic Column Index Detection
    let colPageIdx = 0;
    let colContentIdx = 1;
    let colPhotoIdx = 2;
    let colTextIdx = 3;
    let colInstructionIdx = 4;

    // Scan top rows for column header titles
    for (let r = 0; r < Math.min(5, rawRows.length); r++) {
      const row = rawRows[r];
      if (Array.isArray(row)) {
        row.forEach((cell, idx) => {
          const val = String(cell || '').trim().toLowerCase();
          if (/^page(\s*number|\s*#)?$/i.test(val) || val === 'p#' || val === 'page no.') {
            colPageIdx = idx;
          } else if (/^(contents?(\s*for\s*this\s*page)?|student\s*name|names?|title)$/i.test(val)) {
            colContentIdx = idx;
          } else if (/^(photos?(\/cliparts?)?|pic|picture)$/i.test(val)) {
            colPhotoIdx = idx;
          } else if (/^texts?$/i.test(val)) {
            colTextIdx = idx;
          } else if (/^(instructions?(\s*to\s*midtown)?|remarks?|notes?)$/i.test(val)) {
            colInstructionIdx = idx;
          }
        });
      }
    }

    rawRows.forEach((row) => {
      if (!Array.isArray(row) || row.length === 0) return;

      // Skip row only if it is the literal template column header row
      const rowStr = row.map((c) => String(c || '').trim().toLowerCase()).join(' ');
      if (!rowStr.trim()) return;

      if (
        (rowStr.includes('contents for this page') && rowStr.includes('page number')) ||
        (rowStr.includes('midtown printing') && rowStr.includes('instruction'))
      ) {
        return;
      }

      const colARaw = row[colPageIdx] !== undefined && row[colPageIdx] !== null ? String(row[colPageIdx]).trim() : '';
      const pageLabel = extractPageLabel(colARaw);

      let nameCell = String(row[colContentIdx] || '').trim();

      // If content cell is empty but Col A has text that is not purely a page number
      if (!nameCell && colARaw) {
        if (!/^\d+$/.test(colARaw) && !/^p-?\d+$/i.test(colARaw)) {
          nameCell = colARaw;
        }
      }

      if (!nameCell) return;

      const photoCell = String(row[colPhotoIdx] || '').trim();
      const textCell = String(row[colTextIdx] || '').trim();
      const instructionCell = String(row[colInstructionIdx] || '').trim();

      const lines = nameCell.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      const photoLines = photoCell ? photoCell.split(/\r?\n/).map((l) => l.trim()) : [];
      const textLines = textCell ? textCell.split(/\r?\n/).map((l) => l.trim()) : [];
      const instructionLines = instructionCell ? instructionCell.split(/\r?\n/).map((l) => l.trim()) : [];

      lines.forEach((lineStr, lineIdx) => {
        const trimmed = lineStr.trim();
        if (!trimmed) return;

        // Skip template headers if encountered as single text lines
        if (
          trimmed.toLowerCase() === 'contents for this page' ||
          trimmed.toLowerCase() === 'page number' ||
          trimmed.toLowerCase() === 'photos/cliparts/background' ||
          trimmed.toLowerCase() === 'instruction to midtown'
        ) {
          return;
        }

        // Check if this line is a Section / Department Header
        if (isSectionHeaderCandidate(trimmed)) {
          const headerTitle = formatSectionTitle(trimmed);
          currentDepartment = headerTitle;
          records.push({
            name: headerTitle,
            photoStatus: photoCell || '',
            textStatus: textCell || '',
            instruction: instructionCell || '',
            department: currentDepartment,
            isHeader: true,
            pageLabel: pageLabel,
            pageNumber: pageLabel,
          });
          return;
        }

        // Parse student / editorial board / staff record
        const { name, role } = parseNameAndRole(trimmed);

        const photoStatus = photoLines[lineIdx] !== undefined && photoLines[lineIdx] !== '' ? photoLines[lineIdx] : photoCell;
        const textStatus = textLines[lineIdx] !== undefined && textLines[lineIdx] !== '' ? textLines[lineIdx] : textCell;
        const instruction = instructionLines[lineIdx] !== undefined && instructionLines[lineIdx] !== '' ? instructionLines[lineIdx] : instructionCell;

        if (name && name.trim().length > 0 && name !== 'undefined' && name !== 'null') {
          records.push({
            name: name.trim(),
            role: role ? role.trim() : undefined,
            photoStatus: photoStatus || '',
            textStatus: textStatus || '',
            instruction: instruction || '',
            department: currentDepartment,
            isHeader: false,
            pageLabel: pageLabel,
            pageNumber: pageLabel,
          });
        }
      });
    });

    setExtractedRecords(records);
  }, [workbook, activeSheetName]);

  // Unique Departments List for Active Sheet Tab
  const uniqueDepartments = useMemo(() => {
    const depts = new Set<string>();
    extractedRecords.forEach((rec) => {
      if (rec.department) depts.add(rec.department);
    });
    return Array.from(depts);
  }, [extractedRecords]);

  // Records Count per Department for Active Sheet Tab (counting ONLY real student/staff items, excluding isHeader banner cards)
  const recordsCountByDept = useMemo(() => {
    const counts: Record<string, number> = {};
    extractedRecords.forEach((rec) => {
      if (!rec.isHeader) {
        const dept = rec.department || 'General';
        counts[dept] = (counts[dept] || 0) + 1;
      }
    });
    return counts;
  }, [extractedRecords]);

  // Dynamic Real-time Filter (by Selected Department & Search Query within Active Tab)
  const filteredRecords = useMemo(() => {
    return extractedRecords.filter((rec) => {
      if (selectedDepartment !== 'ALL' && rec.department !== selectedDepartment) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = rec.name.toLowerCase().includes(q);
        const matchRole = rec.role ? rec.role.toLowerCase().includes(q) : false;
        const matchInstruction = rec.instruction.toLowerCase().includes(q);
        const matchDept = rec.department.toLowerCase().includes(q);
        if (!matchName && !matchRole && !matchInstruction && !matchDept) {
          return false;
        }
      }
      return true;
    });
  }, [extractedRecords, selectedDepartment, searchQuery]);

  const copyToClipboard = useCallback((text: string, index: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 1500);
    });
  }, []);

  const handleFileUpload = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setIsUploading(true);

    try {
      const result = await apiUploadSpreadsheet(file);
      if (result && (result.success || result.status === 200 || result.status === 201 || result.url || result.name)) {
        const uploadedUrl = result.url || result.data?.spreadsheetUrl || result.data?.fileUrl || result.spreadsheetUrl || result.fileUrl || '';
        onShowToast(`Spreadsheet "${file.name}" uploaded successfully!`, 'success');
        onUploadSuccess(uploadedUrl);
      } else {
        onShowToast(result?.error || result?.message || 'Failed to upload spreadsheet file.', 'error');
      }
    } catch (err: any) {
      console.error('Error uploading spreadsheet:', err);
      onShowToast(err.message || 'An error occurred during spreadsheet upload.', 'error');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  }, [onShowToast, onUploadSuccess]);

  const handleDeleteFile = useCallback(() => {
    if (!url) return;
    const targetSheet = availableSheets.find((s) => s.url === url);
    const sheetId = targetSheet ? String(targetSheet.id) : '';
    const sheetName = targetSheet ? targetSheet.name : getFilenameFromUrl(url, 'Spreadsheet');
    onRequestDelete('spreadsheet', url, sheetId, sheetName);
  }, [url, availableSheets, onRequestDelete]);

  const sheetFilename = getFilenameFromUrl(url, 'Page Plan');

  // Total student count in active tab (excluding header cards)
  const totalStudentCount = useMemo(() => {
    return extractedRecords.filter((r) => !r.isHeader).length;
  }, [extractedRecords]);

  let studentItemCounter = 0;

  return (
    <div className="w-full flex flex-col h-full overflow-hidden">
      {/* RIGHT PANE HEADER */}
      <div className="pb-3 border-b border-slate-200 flex items-center justify-between flex-shrink-0 gap-2">
        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
          <FileSpreadsheet className="w-4 h-4 text-[#DC95FF]" />
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Page Plan Grid
          </h2>

          {/* Independent Spreadsheet Selector Dropdown */}
          <select
            value={url}
            onChange={(e) => onSelectSheet(e.target.value)}
            className="bg-white text-xs font-semibold text-slate-800 border border-slate-200 rounded-lg px-2.5 py-1 max-w-[180px] truncate focus:outline-none focus:ring-2 focus:ring-[#DC95FF]/30 focus:border-[#DC95FF] shadow-xs cursor-pointer"
          >
            {availableSheets.length === 0 ? (
              <option value="">No Spreadsheets Available</option>
            ) : (
              availableSheets.map((sheet) => (
                <option key={sheet.url} value={sheet.url} className="bg-white text-slate-900">
                  {sheet.name || getFilenameFromUrl(sheet.url, 'Spreadsheet')}
                </option>
              ))
            )}
          </select>

          {/* Active File Pill Badge */}
          {url && (
            <span className="px-2.5 py-0.5 bg-purple-50 text-[#DC95FF] border border-[#DC95FF]/30 text-xs font-semibold rounded-full max-w-[120px] truncate shadow-xs">
              {sheetFilename}
            </span>
          )}
        </div>

        {/* Action Buttons: Delete & Upload Page Plan */}
        <div className="flex items-center space-x-2">
          {url && (
            <button
              onClick={handleDeleteFile}
              disabled={isDeleting}
              className="p-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors cursor-pointer"
              title="Delete Page Plan File"
            >
              {isDeleting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            </button>
          )}

          <label className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-[#DC95FF] hover:opacity-90 text-white font-medium text-xs rounded-lg cursor-pointer transition-all shadow-xs">
            {isUploading ? (
              <OrbitRing className="w-3.5 h-3.5 text-white" />
            ) : (
              <Upload className="w-3.5 h-3.5" />
            )}
            <span>{isUploading ? 'Uploading...' : 'Upload Page Plan (.xlsx / .csv)'}</span>
            <input
              type="file"
              accept=".xlsx,.csv"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Grid Content Controls: Sheet Tabs, Section Dropdown & Real-Time Search */}
      <div className="pt-3 flex-1 flex flex-col min-h-0 overflow-hidden">
        {url && !isLoading && !error && (
          <div className="flex flex-col space-y-2 mb-3">
            {/* Sheet Tabs Switcher */}
            {sheetNames.length > 0 && (
              <div className="flex items-center space-x-1 border-b border-slate-200 pb-2 overflow-x-auto">
                {sheetNames.map((name) => (
                  <button
                    key={name}
                    onClick={() => setActiveSheetName(name)}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                      activeSheetName === name
                        ? 'bg-[#DC95FF] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}

            {/* FULL-WIDTH SIDE-BY-SIDE SECTION DROPDOWN & SEARCH INPUT */}
            <div className="flex items-center gap-3 w-full mb-1">
              {/* Department / Section Dropdown */}
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="flex-1 bg-white border border-slate-200 text-slate-800 text-sm rounded-lg px-3.5 py-2 font-medium focus:ring-2 focus:ring-[#DC95FF]/30 focus:border-[#DC95FF] focus:outline-none shadow-sm cursor-pointer"
              >
                <option value="ALL">All Sections ({totalStudentCount})</option>
                {uniqueDepartments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept} ({recordsCountByDept[dept] || 0})
                  </option>
                ))}
              </select>

              {/* Quick Search Input */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search student name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-800 text-sm rounded-lg pl-9 pr-3.5 py-2 focus:ring-2 focus:ring-[#DC95FF]/30 focus:border-[#DC95FF] focus:outline-none shadow-sm"
                />
              </div>
            </div>
          </div>
        )}

        {!url ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-300 bg-slate-50 rounded-xl">
            <FileSpreadsheet className="w-12 h-12 text-slate-400 mb-3" />
            <h3 className="text-sm font-bold text-slate-800">
              No Page Plan Spreadsheet Selected
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1 leading-relaxed">
              Select an existing page plan from the dropdown above or upload an .xlsx / .csv file.
            </p>
            <label className="mt-4 px-4 py-2 bg-[#DC95FF] hover:opacity-90 text-white font-medium text-xs rounded-lg transition-all shadow-xs cursor-pointer inline-flex items-center space-x-2">
              {isUploading ? (
                <OrbitRing className="w-3.5 h-3.5 text-white" />
              ) : (
                <Upload className="w-3.5 h-3.5" />
              )}
              <span>{isUploading ? 'Uploading...' : 'Upload Page Plan (.xlsx / .csv)'}</span>
              <input
                type="file"
                accept=".xlsx,.csv"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="hidden"
              />
            </label>
          </div>
        ) : isLoading ? (
          <div className="w-full flex-1 p-2 space-y-3">
            <div className="flex items-center space-x-2 text-xs font-semibold text-purple-800 bg-purple-50 p-3 rounded-xl border border-purple-100 shadow-xs">
              <OrbitRing className="w-4 h-4 text-[#DC95FF]" />
              <span>Extracting, sorting, and stacking page plan roster records...</span>
            </div>
            <ListSkeleton rows={6} />
          </div>
        ) : error ? (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl text-xs">
            {error}
          </div>
        ) : (
          /* STACKED FULL STUDENT RECORDS CARDS LIST CONTAINER */
          <div className="w-full flex-1 overflow-y-auto max-h-[calc(100vh-220px)] p-2 space-y-2.5">
            {filteredRecords.length === 0 ? (
              <div className="p-8 text-center text-slate-500 italic bg-white border border-slate-200 rounded-xl">
                {searchQuery ? 'No matching records found.' : 'Spreadsheet has no extracted records.'}
              </div>
            ) : (
              filteredRecords.map((record, index) => {
                // RENDER STYLED PURPLE ACCENT SECTION BANNER FOR HEADER ITEMS ACROSS ALL TABS
                if (record.isHeader) {
                  const isFlyleafHeader =
                    record.department.toLowerCase().includes('flyleaf') ||
                    record.name.toLowerCase().includes('flyleaf') ||
                    record.name.toLowerCase().includes('cover') ||
                    record.name.toLowerCase().includes('preamble') ||
                    record.name.toLowerCase().includes('dedication');

                  const pageNum = record.pageNumber || record.pageLabel;

                  return (
                    <div
                      key={`header-${record.department}-${record.pageNumber || record.pageLabel || ''}-${record.name}-${index}`}
                      className="w-full my-3 p-3.5 bg-gradient-to-r from-[#DC95FF]/15 via-purple-50/60 to-transparent border-l-4 border-[#DC95FF] rounded-r-xl flex flex-col gap-2 shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold tracking-wider uppercase text-purple-900 bg-[#DC95FF]/30 px-2.5 py-0.5 rounded-md font-mono">
                            {isFlyleafHeader ? 'FLYLEAF HEADER' : 'HEADER'}
                          </span>
                          {pageNum && (
                            <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-purple-100 text-purple-900 border border-purple-300 font-mono">
                              Page {pageNum}
                            </span>
                          )}
                          <h4 className="text-sm font-extrabold text-slate-900 tracking-wide ml-1">
                            <HighlightedText text={record.name} query={searchQuery} />
                          </h4>
                        </div>
                      </div>

                      {/* Render metadata badges inside header banner if present */}
                      {(record.role || record.photoStatus || record.textStatus || record.instruction) && (
                        <div className="flex flex-wrap gap-2 text-xs mt-1">
                          {record.role && (
                            <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-900 border border-purple-200 font-bold text-xs inline-flex items-center gap-1">
                              👑 <HighlightedText text={record.role} query={searchQuery} />
                            </span>
                          )}
                          {record.photoStatus && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-emerald-50 text-emerald-800 border border-emerald-200">
                              📷 Photo: {record.photoStatus}
                            </span>
                          )}
                          {record.textStatus && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-emerald-50 text-emerald-800 border border-emerald-200">
                              📝 Text: {record.textStatus}
                            </span>
                          )}
                          {record.instruction && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium font-mono bg-slate-100 text-slate-700 border border-slate-200">
                              📌 Note: <HighlightedText text={record.instruction} query={searchQuery} />
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                }

                // Increment student number counter for standard student/staff cards
                studentItemCounter += 1;
                const studentNum = studentItemCounter;

                return (
                  <div
                    key={`item-${record.department}-${record.pageLabel || ''}-${record.name}-${index}`}
                    className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs hover:border-[#DC95FF]/50 transition-all flex flex-col gap-2 mb-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold font-mono text-[#DC95FF]">#{studentNum}</span>
                        {record.pageLabel && (
                          <span className="text-xs font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200 font-mono">
                            Page {record.pageLabel}
                          </span>
                        )}
                      </div>
                      <span className="font-bold text-slate-900 text-base flex-1 ml-3 select-all break-words tracking-tight">
                        <HighlightedText text={record.name} query={searchQuery} />
                      </span>
                      <button
                        onClick={() => copyToClipboard(record.name, index)}
                        className="text-xs font-bold px-3 py-1 rounded-md bg-purple-50 text-purple-800 hover:bg-[#DC95FF] hover:text-white transition-all duration-150 cursor-pointer shadow-2xs"
                      >
                        {copiedIndex === index ? 'Copied!' : 'Copy'}
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs mt-1">
                      {record.role && (
                        <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-900 border border-purple-200 font-bold text-xs inline-flex items-center gap-1">
                          👑 <HighlightedText text={record.role} query={searchQuery} />
                        </span>
                      )}

                      {record.photoStatus.includes('A') || record.photoStatus === 'A' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-emerald-50 text-emerald-800 border border-emerald-200">
                          📷 Photo: {record.photoStatus || 'A'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-rose-50 text-rose-800 border border-rose-200">
                          📷 Photo: {record.photoStatus || 'N/A'}
                        </span>
                      )}

                      {record.textStatus.includes('A') || record.textStatus === 'A' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-emerald-50 text-emerald-800 border border-emerald-200">
                          📝 Text: {record.textStatus || 'A'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-rose-50 text-rose-800 border border-rose-200">
                          📝 Text: {record.textStatus || 'N/A'}
                        </span>
                      )}

                      {record.instruction && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium font-mono bg-slate-100 text-slate-700 border border-slate-200">
                          📌 Note: <HighlightedText text={record.instruction} query={searchQuery} />
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
});

// -------------------------------------------------------------------
// 3. MAIN PROOFREADING DASHBOARD
// -------------------------------------------------------------------
export default function ProofreadPage() {
  const router = useRouter();
  const [availableDocs, setAvailableDocs] = useState<FileItem[]>([]);
  const [availableSheets, setAvailableSheets] = useState<FileItem[]>([]);

  // DECOUPLED INDEPENDENT SELECTION STATE HOOKS
  const [selectedDocUrl, setSelectedDocUrl] = useState<string>('');
  const [selectedSheetUrl, setSelectedSheetUrl] = useState<string>('');

  const [authError, setAuthError] = useState<boolean>(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState<boolean>(true);

  // User Profile & Notification States
  const [userProfile, setUserProfile] = useState<{ username?: string; email?: string } | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ fileType: 'document' | 'spreadsheet'; url: string; id: string; name: string } | null>(null);

  // Mobile active tab view ('document' | 'spreadsheet')
  const [mobileActiveTab, setMobileActiveTab] = useState<'document' | 'spreadsheet'>('document');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          setUserProfile(JSON.parse(storedUser));
        } catch (e) {}
      }
    }
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const handleLogout = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      sessionStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
    showToast('Logged out successfully', 'success');
    router.push('/login');
  }, [router, showToast]);

  const handleRequestDelete = useCallback((fileType: 'document' | 'spreadsheet', url: string, id: string, name: string) => {
    setPendingDelete({ fileType, url, id, name });
  }, []);

  // Independent Document Delete Success
  const handleDocDeleteSuccess = useCallback((deletedUrl: string) => {
    setAvailableDocs((prev) => {
      const remaining = prev.filter((d) => d.url !== deletedUrl && String(d.id) !== String(deletedUrl));
      setSelectedDocUrl((current) => (current === deletedUrl ? (remaining.length > 0 ? remaining[0].url : '') : current));
      return remaining;
    });
  }, []);

  // Independent Spreadsheet Delete Success
  const handleSheetDeleteSuccess = useCallback((deletedUrl: string) => {
    setAvailableSheets((prev) => {
      const remaining = prev.filter((s) => s.url !== deletedUrl && String(s.id) !== String(deletedUrl));
      setSelectedSheetUrl((current) => (current === deletedUrl ? (remaining.length > 0 ? remaining[0].url : '') : current));
      return remaining;
    });
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!pendingDelete) return;
    const { fileType, url, id, name } = pendingDelete;
    setPendingDelete(null);

    try {
      const res = await fetch(`/api/files?type=${fileType}&id=${encodeURIComponent(id)}&fileUrl=${encodeURIComponent(url)}`, {
        method: 'DELETE',
      });
      if (res && (res.ok || res.status === 200 || res.status === 204)) {
        showToast(`File "${name}" deleted successfully`, 'success');
        if (fileType === 'document') {
          handleDocDeleteSuccess(url);
        } else {
          handleSheetDeleteSuccess(url);
        }
      } else {
        const result = res ? await res.json().catch(() => ({})) : {};
        showToast(result.error || result.message || `Failed to delete ${fileType}`, 'error');
      }
    } catch (err: any) {
      console.error('Error deleting file:', err);
      showToast(err.message || 'An error occurred while deleting file.', 'error');
    }
  }, [pendingDelete, showToast, handleDocDeleteSuccess, handleSheetDeleteSuccess]);

  const fetchFiles = useCallback(async () => {
    setIsLoadingFiles(true);
    const hasToken = typeof window !== 'undefined' && Boolean(localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token'));
    if (!hasToken) {
      setAuthError(true);
    } else {
      setAuthError(false);
    }

    try {
      const res = await apiFetchFiles();
      if (!res.ok && (res.status === 401 || res.status === 403)) {
        if (!hasToken) {
          setAuthError(true);
          return;
        }
      }

      const data = res.data || {};
      const docs: FileItem[] = data.documents || [];
      const sheets: FileItem[] = data.spreadsheets || [];

      setAvailableDocs(docs);
      setAvailableSheets(sheets);

      setSelectedDocUrl((current) => (!current && docs.length > 0 ? docs[0].url : current));
      setSelectedSheetUrl((current) => (!current && sheets.length > 0 ? sheets[0].url : current));
    } catch (err) {
      console.error('Failed to fetch file lists:', err);
    } finally {
      setIsLoadingFiles(false);
    }
  }, []);

  useEffect(() => {
    const hasToken = typeof window !== 'undefined' && Boolean(localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token'));
    if (!hasToken) {
      setAuthError(true);
    } else {
      setAuthError(false);
    }
    fetchFiles();
  }, [fetchFiles]);

  // Independent Document Upload Success
  const handleDocUploadSuccess = useCallback(async (newDocUrl: string) => {
    const res = await apiFetchFiles();
    const data = res.data || {};
    const docs: FileItem[] = data.documents || [];
    setAvailableDocs(docs);
    if (newDocUrl) {
      setSelectedDocUrl(newDocUrl);
    } else if (docs.length > 0) {
      setSelectedDocUrl(docs[0].url);
    }
  }, []);

  // Independent Spreadsheet Upload Success
  const handleSheetUploadSuccess = useCallback(async (newSheetUrl: string) => {
    const res = await apiFetchFiles();
    const data = res.data || {};
    const sheets: FileItem[] = data.spreadsheets || [];
    setAvailableSheets(sheets);
    if (newSheetUrl) {
      setSelectedSheetUrl(newSheetUrl);
    } else if (sheets.length > 0) {
      setSelectedSheetUrl(sheets[0].url);
    }
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      
      {/* TOP NAVIGATION HEADER */}
      <header className="h-[65px] bg-white text-slate-900 border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0 shadow-xs">
        
        {/* LEFT: System Logo & Title */}
        <div className="flex items-center space-x-3">
          <FileText className="w-5 h-5 text-[#DC95FF]" />
          <h1 className="text-base font-extrabold text-slate-900 tracking-wide">
            Torch Bearer 2027 - Proofreading Studio
          </h1>
        </div>

        {/* RIGHT: User Profile Badge, Refresh Files & Logout Button */}
        <div className="flex items-center space-x-3">
          {/* User Profile Badge */}
          <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-purple-50 text-purple-900 border border-purple-100 rounded-lg text-xs font-semibold shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{userProfile?.username || userProfile?.email?.split('@')[0] || 'Staff'}</span>
          </div>

          <button
            onClick={fetchFiles}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg transition-colors flex items-center space-x-1.5 text-xs font-semibold shadow-xs cursor-pointer"
            title="Refresh All Files"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingFiles ? 'animate-spin text-[#DC95FF]' : ''}`} />
            <span className="hidden sm:inline">Refresh Files</span>
          </button>

          {/* Logout Action Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-all shadow-xs active:scale-95 cursor-pointer"
            title="Logout of session"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* MOBILE VIEW TOGGLE TABS */}
      <div className="flex lg:hidden bg-white border-b border-slate-200 p-2 space-x-2">
        <button
          onClick={() => setMobileActiveTab('document')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center space-x-2 transition-all cursor-pointer ${
            mobileActiveTab === 'document'
              ? 'bg-[#DC95FF] text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <FileType className="w-4 h-4" />
          <span>Document Workspace</span>
        </button>

        <button
          onClick={() => setMobileActiveTab('spreadsheet')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center space-x-2 transition-all cursor-pointer ${
            mobileActiveTab === 'spreadsheet'
              ? 'bg-[#DC95FF] text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Page Plan Grid</span>
        </button>
      </div>

      {/* MAIN VIEWER CONTAINER */}
      <main className="flex flex-col lg:flex-row flex-1 w-full h-[calc(100vh-65px)] overflow-hidden gap-4 p-4 bg-slate-50">
        
        {/* LEFT PANE WRAPPER - INDEPENDENT DOCUMENT WORKSPACE */}
        <div className={`flex-1 flex flex-col h-full min-w-0 bg-white border border-slate-200 rounded-xl p-4 shadow-xs overflow-hidden ${mobileActiveTab === 'document' ? 'flex' : 'hidden lg:flex'}`}>
          <DocumentViewerPane
            url={selectedDocUrl}
            availableDocs={availableDocs}
            onSelectDoc={setSelectedDocUrl}
            onUploadSuccess={handleDocUploadSuccess}
            onDeleteSuccess={handleDocDeleteSuccess}
            onRequestDelete={handleRequestDelete}
            onShowToast={showToast}
          />
        </div>

        {/* RIGHT PANE WRAPPER - INDEPENDENT SPREADSHEET WORKSPACE */}
        <div className={`flex-1 flex flex-col h-full min-w-0 bg-white border border-slate-200 rounded-xl p-4 shadow-xs overflow-hidden ${mobileActiveTab === 'spreadsheet' ? 'flex' : 'hidden lg:flex'}`}>
          <SpreadsheetViewerPane
            url={selectedSheetUrl}
            availableSheets={availableSheets}
            onSelectSheet={setSelectedSheetUrl}
            onUploadSuccess={handleSheetUploadSuccess}
            onDeleteSuccess={handleSheetDeleteSuccess}
            onRequestDelete={handleRequestDelete}
            onShowToast={showToast}
          />
        </div>

      </main>

      {/* STYLED TOAST NOTIFICATION CONTAINER */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 animate-in fade-in slide-in-from-top-3 duration-200 font-sans">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border text-xs font-semibold ${
              toast.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : toast.type === 'warning'
                ? 'bg-amber-50 text-amber-900 border-amber-200'
                : 'bg-rose-50 text-rose-900 border-rose-200'
            }`}
          >
            <span className="text-base">
              {toast.type === 'success' ? '✅' : toast.type === 'warning' ? '⚠️' : '🚨'}
            </span>
            <span className="leading-tight">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-2 p-0.5 text-slate-400 hover:text-slate-700 rounded transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* STYLED DELETION CONFIRMATION MODAL */}
      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 font-sans">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              🗑️
            </div>
            <h3 className="text-base font-bold text-slate-800 text-center mb-1">
              Delete {pendingDelete.fileType === 'document' ? 'Document' : 'Spreadsheet'}?
            </h3>
            <p className="text-xs text-slate-500 text-center mb-6 leading-relaxed">
              This action will permanently delete <span className="font-semibold text-slate-700">"{pendingDelete.name}"</span> from PostgreSQL database and disk storage.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setPendingDelete(null)}
                className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-2 text-xs font-semibold text-white bg-rose-500 hover:bg-rose-600 rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 401/403 UNAUTHORIZED OVERLAY BANNER */}
      {authError && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
          <div className="max-w-md w-full bg-white rounded-2xl p-6 shadow-2xl border border-rose-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto text-xl font-bold">
              🔒
            </div>
            <h3 className="text-base font-extrabold text-slate-900">
              Authentication Required
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Your session token is missing, expired, or forbidden (HTTP 401/403). Please log in with authorized staff or superuser credentials to access the workspace.
            </p>
            <button
              onClick={() => router.push('/login')}
              className="w-full py-2.5 bg-[#DC95FF] hover:bg-[#c87deb] text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer"
            >
              Login as Superuser / Staff
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
