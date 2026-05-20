import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendHost = env.MY_LEDGER_BACKEND_HOST || '127.0.0.1';
  const backendPort = env.MY_LEDGER_BACKEND_PORT || '8000';

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: env.DISABLE_HMR !== 'true',
      watch: env.DISABLE_HMR === 'true' ? null : {},
      proxy: {
        '/api': {
          target: `http://${backendHost}:${backendPort}`,
          changeOrigin: true,
        },
      },
    },
  };
});
