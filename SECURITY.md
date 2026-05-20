# Security

My Ledger stores personal financial data locally. Treat the database, logs, settings, and backups as sensitive files.

## Supported Use

The default configuration binds services to `127.0.0.1`. This is the recommended mode for normal personal use.

LAN access should only be enabled on trusted networks. If you bind the frontend or backend to `0.0.0.0`, non-local clients must enter the LAN access password. After login, the frontend stores a time-limited token locally.

## Reporting Issues

Please report security issues privately if the repository provides a private advisory channel. If no private channel exists yet, avoid posting exploit details in public issues.

## Known Limitations

- LAN access uses a simple shared password and bearer token, not full multi-user authentication.
- Local requests are trusted automatically.
- The LAN access password is stored in `backend/settings.json` so the local settings page can display and edit it.
- No encryption for the local SQLite database or backup files.
- Logs may contain local paths or operational details.
