import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL, getMediaUrl } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const spreadsheetFile = formData.get('spreadsheetFile') as File | null;

    let targetEndpoint = `${API_BASE_URL}/upload/document/`;
    if (spreadsheetFile) {
      targetEndpoint = `${API_BASE_URL}/upload/spreadsheet/`;
    }

    const authHeader = request.headers.get('authorization') || '';
    const headers: Record<string, string> = {};
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const res = await fetch(targetEndpoint, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      if (data.url) {
        data.url = getMediaUrl(data.url);
      }
      if (data.file_url) {
        data.file_url = getMediaUrl(data.file_url);
      }
      return NextResponse.json(data, { status: res.status });
    } else {
      const errorData = await res.json().catch(() => ({}));
      return NextResponse.json(errorData, { status: res.status });
    }
  } catch (err) {
    console.warn(`Django backend notice (POST /api/upload/ targeting ${API_BASE_URL}):`, err);
    return NextResponse.json({ error: 'Backend unreachable' }, { status: 500 });
  }
}
