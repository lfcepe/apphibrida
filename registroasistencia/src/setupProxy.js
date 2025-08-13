const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'https://puce.estudioika.com', // dominio de tu API
      changeOrigin: true,                     // evita CORS fingiendo el host
      secure: true,                           // porque es https
      pathRewrite: { '^/api': '/api' },       // conserva /api en el destino
    })
  );
};
