# Repository agent instructions

## Project facts

- AlgoFrame uses React/TypeScript, Tailwind, Vite, Express, and a deterministic Python engine. Preserve the stack and existing behavior.
- Read [project context](docs/project-context.md) for architecture, commands, domain rules, and known limitations. Keep project facts there; reusable workflows belong in `.agents/skills/`.
- Existing domain guidance remains in `rules/`, `skills/`, and `workflows/`; do not import descriptions or styling from unrelated repositories.

## Instructions and workflow

- Follow system/developer instructions, then the user's current authorized scope, then applicable `AGENTS.md` instructions. More deeply scoped agent instructions refine these rules for their files. Skills supply task procedures; they do not grant permission or override higher-priority instructions.
- Inspect Git status, relevant code, scripts, tests, documentation, and scoped agent instructions before editing. Preserve pre-existing work. If Git metadata is absent, report that limitation; do not initialize a repository as a substitute for inspection.
- Define acceptance criteria before behavior changes or bug fixes. Use [TDD](.agents/skills/tdd/SKILL.md): a focused, meaningful failing test, smallest maintainable implementation, refactor, related regressions. Never manufacture failures, weaken assertions, or test only implementation details.
- Use existing test tools. New tooling requires a concrete coverage gap; explain the need before adding dependencies. Documentation-only edits need review, not invented failing tests.
- Use [planning and progress](.agents/skills/planning-progress/SKILL.md). Keep `docs/features.md` as the feature inventory and `docs/progress.md` as the single progress record. Record criteria, decisions, actual test results, and unfinished work; unverified work stays unverified.
- Whenever a rule, skill, or workflow changes, update the brief [workflow summary](docs/workflow-summary.md) and the progress record in the same change.

## Verification and security

- Run focused tests during work and `npm run check` for behavior or executable workflow changes. Preserve existing scripts. A failed or unavailable check must be reported with its cause; never present blocked checks as passing.
- For UI changes, apply [UI review](.agents/skills/ui-review/SKILL.md), using the project's existing typography, tokens, spacing, transitions, responsive behavior, and accessibility conventions. Record actual browser evidence or the missing verification.
- Apply [security and cleanup review](.agents/skills/security-cleanup/SKILL.md) before completion. Review dependency advisories, inputs, subprocess boundaries, secrets, generated files, dumps, dead code, and unused assets. Never delete uncertain files based solely on missing search references.
- Keep credentials, local environments, transcript backups, and tool caches out of Git. Do not print secrets or copy raw transcripts, system instructions, tool output, or reasoning into documentation or backups.
- Backups are opt-in manual snapshots via `npm run chat:backup`; see `docs/chat-backup.md`. Do not claim automatic or complete chat archival.

## Completion and remote actions

- Completion requires acceptance criteria supported by evidence, appropriate checks, updated documentation/progress, and a review of intended changes. Summarize changed files, actual results, risks, and remaining work.
- Only an explicit user instruction to push activates [Git push](.agents/skills/git-push/SKILL.md): review all eligible pending changes, check, commit with a relevant message beginning with a capital letter, push the current branch, and report the commit and outcome.
- Finishing a local task never authorizes pushing or deploying. This setup does not authorize either action.
