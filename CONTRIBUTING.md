# Contributing

Thanks for helping improve My Ledger.

## Development

Before opening a pull request, run:

```bash
cd my-ledger-front
npm run lint
npm run build
```

```bash
python -m compileall backend
```

## Pull Requests

- Keep changes focused on one problem.
- Update API summaries, schemas, or README sections when changing public interfaces.
- Reuse existing services or helpers before adding new implementation paths.
- Do not commit local runtime data such as `ledger.db`, `settings.json`, logs, backups, `node_modules`, or build output.
- Include manual verification notes when automated tests are not available.

## Issues

Please include:

- Operating system
- Python and Node.js versions
- Steps to reproduce
- Expected result
- Actual result
