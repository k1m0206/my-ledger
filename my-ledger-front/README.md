# My Ledger Frontend

This is the React frontend for My Ledger.

## Requirements

- Node.js 22 or newer
- npm 11 or newer

## Scripts

```bash
npm install
npm run dev
npm run lint
npm run build
```

The development server listens on `127.0.0.1:3000` by default and proxies `/api` requests to `127.0.0.1:8000`.

Remote LAN clients are prompted for the LAN access password. After a successful login, the frontend stores a time-limited token in local storage.

## Configuration

Copy `.env.example` if you want to customize local ports or hosts:

```bash
MY_LEDGER_FRONTEND_HOST=127.0.0.1
MY_LEDGER_FRONTEND_PORT=3000
MY_LEDGER_BACKEND_HOST=127.0.0.1
MY_LEDGER_BACKEND_PORT=8000
```
