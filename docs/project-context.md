# Project context

This file holds repository-specific facts. General procedures live in `.agents/skills/`.

## Architecture and existing guidance

- `src/App.tsx` coordinates course navigation, operation inputs, cancellable simulation requests, playback, keyboard shortcuts, theme, and code visibility. `web/data/curriculum.ts` describes six topics / seven lessons and 23 operations.
- `web/components/LearningCanvas.tsx`, `ComplexityPanel.tsx`, and `PythonCodeBox.tsx` render the current course workspace. Source is to the right on desktop, below on mobile; highlight scrolling stays inside the code panel. Older stage/inspector/control components are retained with the legacy generators. `web/types/traceTypes.ts` describes the shared trace contract.
- `server.ts` serves Express API routes and Vite development middleware. `/api/simulate` invokes `python3 -m python_engine.cli` via `execFile`, with a structure allowlist, timeout, and output limit. Both source and built servers resolve Python modules from the project root. `/api/health` reports availability of the HTTP server; it does not execute Python.
- `python_engine/learning.py` executes fixed repository-owned Python examples for array insert/delete/search/access; singly/doubly linked insert/delete/search; stack push/pop/peek; circular queue enqueue/dequeue/peek; unbalanced BST insert/delete/search/inorder; and chained integer-key hash insert/update/delete/search. Line events drive post-line snapshots, with a separate initial function-entry frame. Inputs are data, never submitted Python code. Python 3.11+ is required.
- Original detailed insertion generators remain available through `/api/simulate` requests without `operation`. New requests include `operation`, `insertValue` (value/key), `insertIndex`, `capacity`, and optionally `payloadValue` / `frontIndex`. Empty arrays remain empty. Learning inputs are capped at 24 initial integers, magnitude 1,000,000, capacity 1–32; the Python process has a 5-second timeout and an 8 MiB output bound.
- The trace's optional `analysis` separates best/average/worst time, auxiliary space, storage, observed line events, and an explicitly illustrative memory model. Existing microsecond fields are not displayed as measured runtime in the new workspace. See [course adaptation](course-map.md).
- Engine tests use pytest-compatible functions. `python -m python_engine.run_tests` runs them with installed pytest or the repository's small `raises` shim. No new Python dependency is necessary for this setup.
- `rules/schema_invariants.md` defines domain requirements; `workflows/tdd_trace_pipeline.md` describes the trace workflow; `skills/dsa_visualizer_design.md` contains existing UI conventions. Preserve these references.
- Development Vite WebSockets share the Express HTTP server (Vite 8 `server.ws.server`), avoiding a separate conflicting HMR port. `DISABLE_HMR=true` disables both HMR and its WebSocket connection while retaining the existing watch-control behavior.
- `src/index.css` defines the existing font variables, warm reference-inspired palette, shared selected/primary controls, and dot grid. The `slate` ramp is intentionally warm neutral; `sage` and `lavender` supply the primary/rewiring accents. Stage/SVG variables and dark overrides live in the same file. Components retain Tailwind light/dark variants; `index.html` loads the existing fonts. The older design asset under `public/assets/aistudio/` is retained; current theme guidance lives in `skills/dsa_visualizer_design.md`.

## Commands

New VS Code terminals use Command Prompt on Windows via `.vscode/settings.json`, allowing plain `npm run dev` without changing execution policy. Use `npm.cmd` in an existing Windows PowerShell terminal if policy blocks `npm.ps1`.

| Command | Purpose |
| --- | --- |
| `npm ci` | Reproduce the dependency versions recorded in `package-lock.json` |
| `npm install` | Install dependencies or update the lockfile after a reviewed manifest change |
| `npm run dev` | Existing `tsx server.ts` development server, port 3000 by default |
| `npm run typecheck` | TypeScript compiler, no output |
| `npm run lint` | Existing TypeScript compiler check; no separate ESLint/style lint is configured |
| `npm run test:engine` | Existing Python test runner, using `python` on PATH |
| `npm run test:workflow` | Standard-library unittest tests for workflow helpers |
| `npm run test:smoke` | Development and production HTTP regressions; requires a completed build |
| `npm test` | Engine and workflow suites |
| `npm run build` | Existing Vite frontend and esbuild server build |
| `npm run check` | Typecheck, existing lint, engine/workflow tests, build, then HTTP smoke tests; stops at the first failure |
| `npm start` | Portable Node launcher for the built production server; requires `npm run build` first |
| `npm run clean` | Portable removal of generated `dist/` and legacy `server.js` output, restricted to the project root |
| `npm run chat:backup` | Manual snapshot of this process's current local conversation |

`typecheck` and `lint` currently run the same compiler intentionally, preserving the existing lint script. No new linter or browser test framework was added. For a single engine test module, use `python -m pytest python_engine/tests/<file>.py` only if pytest is installed; otherwise run the existing engine suite.

## Current verification and limitations

See `docs/progress.md` for dated results and follow-up criteria.

- Git metadata is now present following the earlier setup, and `origin` points to the user-specified `https://github.com/yasirumadhuwantha/algoframe.git`. Inspect the current branch, index and upstream with Git before future work. Earlier missing-metadata observations in the progress log are historical.
- Vite/esbuild compatibility has been repaired by aligning esbuild with Vite's supported 0.28 line. Normal install and clean `npm ci` both succeed; the reviewed lockfile is included. Do not hide future conflicts with force flags.
- Tests invoke `python`; the server invokes `python3`. Both were verified locally (3.14.0 and 3.11.9 respectively). Other machines need Python 3.11+ available under these commands.
- Windows `start`/`clean` now use Node launchers. Real HTTP smoke tests verify built frontend serving and Python simulation for all four structures. Production use still requires the project files, including `python_engine/`, alongside `dist/`; this is not a standalone single-file distribution.
- `tests/integration/test_server.py` exercises both development and built servers via HTTP, including frontend entry compilation and GET/POST simulations. Browser controls, responsive layout, and assistive-technology behavior are not established by HTTP tests. No UI styling or interactions were changed during startup repair.
- Simulations do not call Gemini or require an API key. Retain `.env.example` and existing dependencies until their intended role is established.
