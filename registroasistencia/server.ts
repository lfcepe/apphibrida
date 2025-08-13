import express from 'express';
import path from 'path';
import fs from 'fs';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();
const PORT = process.env.PORT || 5000;
const buildDir = path.join(process.cwd(), 'build');
const DATA_DIR = path.join(process.cwd(), 'data');
const OFFLINE_FILE = path.join(DATA_DIR, 'offline_attendance.json');

// Asegura carpeta/archivo local
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(OFFLINE_FILE)) fs.writeFileSync(OFFLINE_FILE, '[]', 'utf8');

app.use(express.json());

// Helpers simples
const saveOffline = (record: any) => {
  const arr = JSON.parse(fs.readFileSync(OFFLINE_FILE, 'utf8') || '[]');
  arr.push({ ...record, savedAt: new Date().toISOString() });
  fs.writeFileSync(OFFLINE_FILE, JSON.stringify(arr, null, 2), 'utf8');
};

const readOffline = () => {
  try {
    return JSON.parse(fs.readFileSync(OFFLINE_FILE, 'utf8') || '[]');
  } catch {
    return [];
  }
};

// --------- INTERCEPTOR DEL POST ---------
// Intenta POST al remoto; si falla por la tabla inexistente (o devuelve HTML/500), guarda local y responde 200
app.post('/api/examen.php', async (req, res) => {
  try {
    // Intenta hablar con el backend real
    const upstream = await fetch('https://puce.estudioika.com/api/examen.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });

    const contentType = upstream.headers.get('content-type') || '';
    const text = await upstream.text();

    // Si retorna JSON y status OK, lo pasamos tal cual
    if (upstream.ok && contentType.includes('application/json')) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(upstream.status).send(text);
    }

    // Si retorna HTML/500 y menciona la tabla inexistente -> guardamos local
    if (/sys_attendat/i.test(text) && /doesn\'?t exist/i.test(text)) {
      saveOffline({
        source: 'fallback_sys_attendat_missing',
        payload: req.body,
        serverErrorSnippet: text.slice(0, 500),
      });
      return res.json({ message: 'Registro guardado localmente (fallback).' });
    }

    // Otro error distinto: también guardamos local para no romper UX
    saveOffline({
      source: 'fallback_upstream_error',
      payload: req.body,
      status: upstream.status,
      contentType,
      serverErrorSnippet: text.slice(0, 500),
    });
    return res.json({ message: 'Registro guardado localmente (upstream error).' });
  } catch (e: any) {
    // Error de red: guardamos local
    saveOffline({
      source: 'fallback_network_error',
      payload: req.body,
      error: String(e),
    });
    return res.json({ message: 'Registro guardado localmente (network error).' });
  }
});

// --------- ENDPOINTS AUXILIARES (opcionales) ---------
// Listar registros guardados localmente (para usarlos en RegistrosPage si quieres)
app.get('/api/offline-attendance', (_req, res) => {
  res.json(readOffline());
});

// Limpia el archivo local (si necesitas)
app.delete('/api/offline-attendance', (_req, res) => {
  fs.writeFileSync(OFFLINE_FILE, '[]', 'utf8');
  res.json({ message: 'Offline limpiado' });
});

// --------- PROXY PARA TODO LO DEMÁS /api/* ---------
app.use(
  '/api',
  createProxyMiddleware({
    target: 'https://puce.estudioika.com/api',
    changeOrigin: true,
    secure: true,
    pathRewrite: { '^/api': '' }, // /api/x -> /x en el target (porque el target ya termina con /api)
    logger: console,
  })
);

// --------- STATIC + SPA FALLBACK ---------
app.use(express.static(buildDir));
app.get('*', (_req, res) => {
  res.sendFile(path.join(buildDir, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Web + proxy corriendo en http://localhost:${PORT}`);
});
