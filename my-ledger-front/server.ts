import express from "express";
import { existsSync } from "fs";
import http from "http";
import { loadEnvFile } from "process";
import { createServer as createViteServer } from "vite";

if (existsSync(".env")) {
  loadEnvFile(".env");
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.MY_LEDGER_FRONTEND_PORT || process.env.PORT || 3000);
  const HOST = process.env.MY_LEDGER_FRONTEND_HOST || '127.0.0.1';
  const BACKEND_HOST = process.env.MY_LEDGER_BACKEND_HOST || '127.0.0.1';
  const BACKEND_PORT = Number(process.env.MY_LEDGER_BACKEND_PORT || 8000);

  // 代理 API 请求到 Python 后端 - 放在 Vite 之前
  app.use('/api', (req, res) => {
    const remoteAddress = req.socket.remoteAddress || '';
    const options = {
      hostname: BACKEND_HOST,
      port: BACKEND_PORT,
      path: '/api' + req.url,
      method: req.method,
      headers: {
        ...req.headers,
        host: `${BACKEND_HOST}:${BACKEND_PORT}`,
        'x-forwarded-for': remoteAddress,
      },
    };
    const proxy = http.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
      proxyRes.pipe(res);
    });
    proxy.on('error', () => {
      res.writeHead(502);
      res.end('Backend unavailable');
    });
    req.pipe(proxy);
  });

  // Vite middleware for development
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);

  app.listen(PORT, HOST, () => {
    console.log(`Server running on http://${HOST}:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
