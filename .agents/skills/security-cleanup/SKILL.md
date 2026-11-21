---
name: security-cleanup
description: Review pending changes for dependency advisories, exposed secrets, unsafe boundaries, generated files, dumps, dead code, and uncertain assets before completion or a push.
---

# Security and cleanup review

Inspect the actual pending diff, tracked files, and new files when Git is available. Without Git metadata, describe the narrower filesystem review and do not claim a clean index or history.

- Review changed inputs, trust boundaries, authorization, file access, subprocess arguments, error messages, and logging. Keep credentials out of client bundles, source, tests, progress notes, screenshots, and tool output. Use redacted examples and filenames/counts when reporting suspected secrets.
- Use the package manager's existing advisory check with the actual lockfile, for example `npm audit --json`. Record the date, scope, findings, severity, and proposed remediation. A blocked install, missing lockfile, or advisory-service failure is incomplete evidence, not a clean vulnerability result. Do not run force upgrades or audit fixes without reviewing their effect on the stack and tests.
- Inspect environment files, private keys, dumps, database exports, logs, generated output, caches, coverage, and local chat backups. Ensure private/generated artifacts are ignored and absent from the index. Ignore rules do not untrack an already tracked file. Never print a suspected secret to prove it exists.
- Review potential dead code, unused dependencies, and assets using imports, scripts, configuration, dynamic paths, public URLs, build-copy hooks, and documentation. An empty search result alone does not justify deletion. Preserve uncertain files and record the evidence needed to decide.
- Delete only confirmed disposable files within the intended workspace. Resolve targets before recursive operations and use native filesystem commands for the current shell. Do not combine path enumeration and deletion across shells.
- Rerun checks affected by any cleanup. Record findings, retained uncertainties, actual commands/results, and unfinished remediation in the single progress record.

Use existing tools; a new scanner is justified only by an identified gap. Do not call a limited pattern scan a comprehensive security audit.
