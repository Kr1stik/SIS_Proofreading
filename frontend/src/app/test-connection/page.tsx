'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, RefreshCw, Server } from 'lucide-react';

interface ConnectionStatus {
  success: boolean;
  missingSettings?: string[];
  error?: string;
}

export default function TestConnectionPage() {
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const checkConnection = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/test-connection');
      const data = await res.json();
      setStatus(data);
    } catch (err: any) {
      setStatus({
        success: false,
        missingSettings: [],
        error: err.message || 'Network error while checking connection.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  return (
    <div className="min-h-screen w-full bg-slate-100 text-slate-900 font-sans p-8 flex flex-col items-center justify-center">
      <div className="w-full max-w-xl bg-white border border-slate-300 rounded-lg p-8 shadow-sm space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center space-x-3">
            <Server className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl font-bold text-slate-900">
              System Connection Check
            </h1>
          </div>

          <button
            onClick={checkConnection}
            disabled={loading}
            className="flex items-center space-x-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Testing...' : 'Re-test'}</span>
          </button>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-sm font-medium text-slate-600">
              Checking database and file storage connections...
            </p>
          </div>
        ) : status?.success ? (
          /* Success Green Status Card */
          <div className="p-6 bg-emerald-50 border-2 border-emerald-600 rounded-lg space-y-2">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
              <h2 className="text-base font-bold text-emerald-950">
                Database and File Storage connected successfully.
              </h2>
            </div>
            <p className="text-xs text-emerald-900 pl-9">
              Your system is fully configured and ready to parse documents and manage records.
            </p>
          </div>
        ) : (
          /* Failure Red Alert Card */
          <div className="p-6 bg-rose-50 border-2 border-rose-600 rounded-lg space-y-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h2 className="text-base font-bold text-rose-950">
                  Connection failed. Please check your .env.local file settings.
                </h2>
                {status?.error && (
                  <p className="text-xs text-rose-900 mt-1 font-medium">
                    {status.error}
                  </p>
                )}
              </div>
            </div>

            {/* Missing Settings List */}
            {status?.missingSettings && status.missingSettings.length > 0 && (
              <div className="pt-3 border-t border-rose-200">
                <p className="text-xs font-bold text-rose-950 mb-2">
                  Missing Configuration Settings:
                </p>
                <ul className="list-disc list-inside space-y-1 text-xs text-rose-900 font-mono bg-white/70 p-3 rounded border border-rose-200">
                  {status.missingSettings.map((setting) => (
                    <li key={setting}>
                      <span className="font-semibold text-rose-950">{setting}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Footer Note */}
        <div className="pt-4 border-t border-slate-200 text-xs text-slate-500 text-center">
          Next.js App Router • Firestore & Cloud Storage Health Monitor
        </div>

      </div>
    </div>
  );
}
