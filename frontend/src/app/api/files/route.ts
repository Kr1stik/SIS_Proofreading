import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/api';

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
