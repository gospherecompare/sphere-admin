# Hooks Admin UI Redesign

This update modernizes the existing React admin system without changing routes, API calls, authentication, permissions, or business logic.

## What changed

- Added a reusable, route-aware `WorkspacePageHeader` with relevant titles, descriptions, icons, decorative data art, system status, and live India time.
- Added a shared visual system in `src/styles/adminTheme.css`.
- Upgraded the top navigation with a glass surface and refined global search treatment.
- Enhanced the desktop sidebar with deeper layered gradients and stronger brand hierarchy.
- Turned the dashboard welcome area into an advanced hero surface.
- Standardized cards, form controls, focus states, tables, typography, responsive behavior, and reduced-motion support.

## Main files

- `src/styles/adminTheme.css`
- `src/components/Ui/WorkspacePageHeader.jsx`
- `src/App.jsx`
- `src/components/Navbar.jsx`
- `src/components/Sidebar.jsx`
- `src/components/Dashboard.jsx`
- `src/main.jsx`

## Run locally

```bash
npm install
npm run dev
```

The uploaded archive contained Windows-specific `node_modules`. Reinstall dependencies on the target machine instead of reusing that folder.
