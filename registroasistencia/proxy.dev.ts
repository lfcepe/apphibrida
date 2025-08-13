import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";

const app = express();

app.use((req, _res, next) => {
  console.log(`[proxy] ${req.method} ${req.url}`);
  next();
});

app.get("/health", (_req, res) => res.json({ ok: true }));

// /api/* -> https://puce.estudioika.com/api/*
app.use(
  "/api",
  createProxyMiddleware({
    target: "https://puce.estudioika.com/api",
    changeOrigin: true,
    secure: true,
    // /api/examen.php -> /examen.php (porque el target ya incluye /api)
    pathRewrite: { "^/api": "" },
    logger: console
  })
);

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`[TS Proxy] http://localhost:${PORT} -> https://puce.estudioika.com/api`);
});
