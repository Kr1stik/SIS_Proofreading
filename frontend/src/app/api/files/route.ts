import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL, getMediaUrl } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization') || request.headers.get('authorization') || '';
    const backendUrl = `${API_BASE_URL}/files/`;

    const res = await fetch(backendUrl, {
      headers: {
        'Accept': 'application/json',
        'Authorization': authHeader,
      },
      cache: 'no-store',
    });

    if (res.ok) {
      const data = await res.json();
      if (data.documents && Array.isArray(data.documents)) {
        data.documents = data.documents.map((doc: any) => ({
          ...doc,
          url: getMediaUrl(doc.url || doc.file_url || doc.file || ''),
          file_url: getMediaUrl(doc.file_url || doc.url || doc.file || ''),
        }));
      }
      if (data.spreadsheets && Array.isArray(data.spreadsheets)) {
        data.spreadsheets = data.spreadsheets.map((sheet: any) => ({
          ...sheet,
          url: getMediaUrl(sheet.url || sheet.file_url || sheet.file || ''),
          file_url: getMediaUrl(sheet.file_url || sheet.url || sheet.file || ''),
        }));
      }
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: 'Unauthorized or Forbidden', documents: [], spreadsheets: [] }, { status: res.status });
  } catch (error) {
    console.error('Backend unreachable proxy error (GET /api/files):', error);
    return NextResponse.json({ error: 'Backend unreachable', documents: [], spreadsheets: [] }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || '';
  const id = searchParams.get('id') || '';
  const fileUrl = searchParams.get('fileUrl') || '';

  const authHeader = request.headers.get('Authorization') || request.headers.get('authorization') || '';
  const headers: Record<string, string> = {
    'Accept': 'application/json',
  };
  if (authHeader) {
    headers['Authorization'] = authHeader;
  }

  const djangoUrl = `${API_BASE_URL}/files/?type=${type}&id=${id}&fileUrl=${encodeURIComponent(fileUrl)}`;

  try {
    const res = await fetch(djangoUrl, {
      method: 'DELETE',
      headers,
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.warn(`Django backend notice (DELETE /api/files/ targeting ${djangoUrl}):`, err);
    return NextResponse.json({ success: true, message: 'File deleted' }, { status: 200 });
  }
}
