# LUNAR · Scoreboard — PRD

## Original Problem Statement
"kannst du mir das ui verschönern" — Beautify the existing LUNAR FiveM/RedM NUI Scoreboard UI.
User choices: Dark Mode / Neon, modern futuristisch, schwarz + hellblau.

## App Type
React (CRA) single-page scoreboard NUI built for FiveM/RedM, also runnable in browser preview via a debug-mode NUI shim.

## Architecture
- Frontend: React 19, Tailwind 3, lucide-react icons
- Custom hook `src/hooks/useNui.js` providing `isDebug`, `useNuiEvent`, `fetchNui` so the UI runs both in CEF and in the preview browser.
- Backend: existing FastAPI scaffold (untouched by this redesign).

## Implemented (2026-01)
- Futuristic dark + neon-blue scoreboard shell (glass card with corner brackets, grid, scanlines, noise overlay, ambient glows).
- Animated header with rocket logo + live clock + ESC button.
- Stat strip (Active Units count-up, Departments, Ping).
- Department rows with colored rail, icon-glow, name + id, animated progress bar, count badge.
- Footer with pulsing "Server Online" indicator and version.
- Fonts: Orbitron (display) + JetBrains Mono (numbers) + Rajdhani (body).
- Compatible with FiveM NUI events (`open`, `close`) and ESC key.

## Backlog / Next
- P1: Sort/filter departments, search bar, per-department member dropdown
- P1: Live unit-status colors (on-duty / off-duty / available)
- P2: Sound effect on open/close, configurable accent color
