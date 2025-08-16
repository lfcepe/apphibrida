// src/utils/api.ts
import { Capacitor } from '@capacitor/core';
import { Http } from '@capacitor-community/http';

const isNative = Capacitor.getPlatform() !== 'web';
const isWeb = !isNative;
const isDev = isWeb && process.env.NODE_ENV !== 'production';

// En dev web: BASE_URL = '' para que /api/... pase por el proxy dev
// En nativo: usamos dominio real para peticiones nativas
// En prod web: por defecto usamos dominio real (o pon proxy en hosting)
export const BASE_URL = isDev ? '' : 'https://puce.estudioika.com';

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const url = `${BASE_URL}${path}`;

  if (!isNative) {
    // Web: fetch normal (en dev pasa por proxy; en prod necesitas CORS o reverse proxy)
    return fetch(url, init);
  }

  // Nativo: plugin sin CORS
  const method = (init?.method || 'GET').toUpperCase();

  const headers: Record<string, string> = {};
  if (init?.headers) {
    Object.entries(init.headers as Record<string, any>).forEach(([k, v]) => (headers[k] = String(v)));
  }

  const ctKey = Object.keys(headers).find(h => h.toLowerCase() === 'content-type');
  const contentType = ctKey ? headers[ctKey] : '';
  const isJson = contentType.includes('application/json');
  const isForm = contentType.includes('application/x-www-form-urlencoded');

  let data: any = {};
  if (init?.body != null) {
    if (isJson && typeof init.body === 'string') {
      try { data = JSON.parse(init.body as string); } catch { data = init.body; }
    } else {
      data = init.body;
    }
  }

  try {
    if (method === 'GET') {
      const res = await Http.get({ url, headers, params: {} });
      const bodyString = typeof res.data === 'string' ? res.data : JSON.stringify(res.data ?? '');
      return new Response(bodyString, { status: res.status ?? 200, headers: (res.headers as any) || {} });
    }
    if (method === 'POST') {
      const res = await Http.post({ url, headers, data, params: {} as any });
      const bodyString = typeof res.data === 'string' ? res.data : JSON.stringify(res.data ?? '');
      return new Response(bodyString, { status: res.status ?? 200, headers: (res.headers as any) || {} });
    }
    const res = await Http.request({ method, url, headers, data, params: {} });
    const bodyString = typeof res.data === 'string' ? res.data : JSON.stringify(res.data ?? '');
    return new Response(bodyString, { status: res.status ?? 200, headers: (res.headers as any) || {} });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || 'Network Error' }), {
      status: 599,
      headers: { 'content-type': 'application/json' },
    });
  }
}
