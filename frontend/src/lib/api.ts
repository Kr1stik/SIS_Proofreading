const rawDjangoUrl = process.env.NEXT_PUBLIC_DJANGO_BASE_URL || 'http://127.0.0.1:8000';
const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_BASE_URL || 'http://127.0.0.1:8000/api';

// Guarantee local backend connections NEVER use HTTPS
export const DJANGO_BASE_URL = rawDjangoUrl
  .replace(/^https:\/\/(127\.0\.0\.1|localhost)/i, 'http://$1')
  .replace(/\/$/, '');

export const API_BASE_URL = rawApiUrl
  .replace(/^https:\/\/(127\.0\.0\.1|localhost)/i, 'http://$1')
  .replace(/\/$/, '');

/**
 * Format relative Django media paths e.g. "/media/documents/CAS_SIS.docx.pdf"
 * Output: "http://127.0.0.1:8000/media/documents/CAS_SIS.docx.pdf"
 */
export function getMediaUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url.replace(/^https:\/\/(127\.0\.0\.1|localhost)/i, 'http://$1');
  }
  if (url.startsWith('/')) {
    return `${DJANGO_BASE_URL}${url}`;
  }
  return `${DJANGO_BASE_URL}/${url}`;
}

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return (
    localStorage.getItem('auth_token') ||
    sessionStorage.getItem('auth_token') ||
    localStorage.getItem('token') ||
    sessionStorage.getItem('token') ||
    localStorage.getItem('jwt')
  );
}

export function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') || getAuthToken() : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Token ${token}` } : {}),
  };
}

export function getMultipartAuthHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') || getAuthToken() : null;
  if (token) {
    return {
      Authorization: `Token ${token}`,
    };
  }
  return {};
}

export function handleAuthError(res: Response) {
  // Silent error handling for dev mode
}

export async function loginUser(identifier: string, password: string) {
  const res = await fetch(`${API_BASE_URL}/auth/login/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: identifier,
      email: identifier,
      password: password,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || errorData.error || 'Invalid Username or Password.');
  }

  const data = await res.json();
  const token = data.token || data.access || 'authenticated-session';
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', token);
    sessionStorage.setItem('auth_token', token);
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
    } else {
      localStorage.setItem('user', JSON.stringify({ email: identifier }));
    }
  }
  return data;
}

export async function uploadDocument(file: File) {
  const formData = new FormData();
  formData.append('documentFile', file);
  formData.append('file', file);
  formData.append('title', file.name);

  const headers = getMultipartAuthHeaders();

  try {
    const res = await fetch(`${API_BASE_URL}/upload/document/`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (res.ok || res.status === 200 || res.status === 201) {
      const data = await res.json();
      if (data.url) data.url = getMediaUrl(data.url);
      return { success: true, status: res.status, ...data };
    }
  } catch (err) {
    console.warn(`Django endpoint upload/document unreachable at ${API_BASE_URL}/upload/document/, falling back:`, err);
  }

  const fallbackRes = await fetch('/api/upload', {
    method: 'POST',
    headers,
    body: formData,
  });
  const fallbackData = await fallbackRes.json();
  if (fallbackData.url) fallbackData.url = getMediaUrl(fallbackData.url);
  return { success: fallbackRes.ok, status: fallbackRes.status, ...fallbackData };
}

export async function uploadSpreadsheet(file: File) {
  const formData = new FormData();
  formData.append('spreadsheetFile', file);
  formData.append('file', file);
  formData.append('title', file.name);

  const headers = getMultipartAuthHeaders();

  try {
    const res = await fetch(`${API_BASE_URL}/upload/spreadsheet/`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (res.ok || res.status === 200 || res.status === 201) {
      const data = await res.json();
      if (data.url) data.url = getMediaUrl(data.url);
      return { success: true, status: res.status, ...data };
    }
  } catch (err) {
    console.warn(`Django endpoint upload/spreadsheet unreachable at ${API_BASE_URL}/upload/spreadsheet/, falling back:`, err);
  }

  const fallbackRes = await fetch('/api/upload', {
    method: 'POST',
    headers,
    body: formData,
  });
  const fallbackData = await fallbackRes.json();
  if (fallbackData.url) fallbackData.url = getMediaUrl(fallbackData.url);
  return { success: fallbackRes.ok, status: fallbackRes.status, ...fallbackData };
}

export async function fetchFiles() {
  const headers = getAuthHeaders();
  try {
    const res = await fetch('/api/files', { headers, cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data.documents && Array.isArray(data.documents)) {
        data.documents = data.documents.map((d: any) => ({
          ...d,
          url: getMediaUrl(d.url),
        }));
      }
      if (data.spreadsheets && Array.isArray(data.spreadsheets)) {
        data.spreadsheets = data.spreadsheets.map((s: any) => ({
          ...s,
          url: getMediaUrl(s.url),
        }));
      }
      return { ok: true, status: res.status, data };
    }
    return { ok: false, status: res.status, data: null };
  } catch (err) {
    console.warn('Error fetching files via /api/files proxy:', err);
    return { ok: false, status: 500, data: null };
  }
}

export async function fetchRecords(sheetName: string = 'Content') {
  const headers = getAuthHeaders();
  try {
    const res = await fetch(`${API_BASE_URL}/records/?sheet=${encodeURIComponent(sheetName)}`, { headers });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn(`Django records endpoint notice at ${API_BASE_URL}/records/:`, err);
  }
  return null;
}
