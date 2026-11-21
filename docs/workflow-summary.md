# Workflow summary

Updated 2026-11-21. Project facts and commands are in [project context](project-context.md); actual evidence and unfinished work are in [progress](progress.md).

- `AGENTS.md` is the concise entry point. Existing trace invariants and UI conventions remain project-specific references.
- `.agents/skills/` contains reusable TDD, planning/progress, UI review, security/cleanup, and explicit Git push procedures.
- Behavior changes begin with acceptance criteria and a focused failing test, then a minimal implementation, refactor, and regressions using existing tools. Documentation changes receive consistency review.
- `docs/features.md` inventories capabilities. `docs/progress.md` is the single evidence-based progress record; blocked or unverified criteria stay open.
- `npm run check` runs typecheck, existing lint, engine/workflow tests, build, and development/production HTTP smoke tests in order. Lint is currently another compiler check. Use `npm ci` for the repository dependency lockfile; `start` and `clean` now use portable Node helpers.
- Local startup is `npm run dev` at localhost:3000. New Windows VS Code terminals default to Command Prompt; existing PowerShell terminals can use `npm.cmd`. No machine-wide execution policy changes or API keys are needed for simulations.
- UI changes require design consistency, responsive and accessibility review, with browser evidence or explicit limitations. Security/cleanup review covers advisories, secrets, private/generated files, and uncertain assets.
- Project theme rules now use the user's warm cream/sage reference, with shared palette/control/SVG tokens in `src/index.css`. See `skills/dsa_visualizer_design.md`; keep product-specific color choices out of reusable skills.
- The course workspace covers six lecture topics with 23 fixed Python operations. Code belongs beside the desktop canvas and below it on narrow screens; executed-line traces drive both. Complexity must distinguish operation costs, storage/auxiliary space, and illustrative memory. See `docs/course-map.md` for the adaptation scope.
- `npm run chat:backup` makes a manual, filtered snapshot of the active local conversation into ignored `.local/chat-backups/`. Identity, privacy, and filesystem/cleanup failures are reported safely. It does not run automatically; see [backup limits](chat-backup.md).
- An explicit user push instruction authorizes reviewing all eligible pending changes, checking, committing with a capitalized relevant message, and pushing the current branch. Local completion does not authorize remote actions.

Update this brief file and the progress record whenever a rule, skill, or workflow changes.
