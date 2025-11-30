# Repository Guidelines

## Project Structure & Module Organization
- `earth.html` hosts all HTML/CSS/JS for the gesture-driven 3D earth. Three.js and MediaPipe Hands load from version-pinned CDNs; keep new includes explicit and minimal.
- Add assets only when necessary; place any helpers beside `earth.html` (e.g., `shaders/`, `assets/`) with clear names.

## Build, Test, and Development Commands
- Serve locally for camera access: `python3 -m http.server 8000` from the repo root, then open `http://localhost:8000/earth.html`.
- Quick preview via double-click works for visuals only; gesture tests need the local server. Use DevTools Performance/Network when profiling.

## Coding Style & Naming Conventions
- Language: vanilla HTML/CSS/JS; indent with 4 spaces to match the file.
- JavaScript: `camelCase` for variables/functions; `PascalCase` only for library constructors. Keep helpers small and scoped to avoid globals.
- CSS: descriptive kebab-case selectors; hex colors; introduce CSS variables only when reused.
- Dependencies: pin CDN versions and note purpose/version in a short comment near new includes.

## Testing Guidelines
- No automated tests yet; run a manual smoke test:
  - Serve locally, click “启动摄像头”, allow camera.
  - Verify earth renders and idles; gestures update rotation; debug video mirrors input.
  - Resize window to confirm canvas and status bar respond.
- When adding logic, include your manual checklist and expected outcomes in the PR.

## Commit & Pull Request Guidelines
- Use Conventional Commits (e.g., `feat: add inertia damping`, `fix: handle camera denial error`).
- PRs include a short summary, manual test notes (browser + OS), UX impact (camera prompts/gesture behavior), and screenshots or clips for visual tweaks.
- Keep changes minimal and reversible; justify CDN version bumps or new libraries in the PR description.

## Security & Configuration Tips
- Do not commit secrets or tokens; current runtime uses public CDNs only. If caching assets locally, confirm license compatibility.
- Camera access is required; keep UI copy clear about intent. Do not persist media or telemetry without explicit consent.
