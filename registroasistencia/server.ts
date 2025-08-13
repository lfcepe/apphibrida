import express from 'express';
import path from 'path';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();
const PORT = process.env.PORT || 5000;
const buildDir = path.join(process.cwd(), 'build');

app.get('/health', (_req, res) => res.json({ ok: true }));

// PROXY: todo lo que empiece con /api va al backend PHP (HTTP, no HTTPS)
app.use(
  '/api',
  createProxyMiddleware({
    target: 'http://puce.estudioika.com/api', // HTTP
    changeOrigin: true,
    secure: false,
    pathRewrite: { '^/api': '' },
    logger: console,
  })
);

// Archivos estáticos del build de React/Ionic
app.use(express.static(buildDir));

// SPA fallback
app.get('*', (_req, res) => {
  res.sendFile(path.join(buildDir, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Web + proxy listo en http://localhost:${PORT}`);
});
