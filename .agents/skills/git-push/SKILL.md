---
name: git-push
description: When the user explicitly instructs a push, review all eligible pending changes, verify them, commit with a capitalized relevant message, and push the current branch.
---

# Explicit push workflow

Activate remote mutation only when the user explicitly says to push. Local task completion and the availability of this skill do not authorize a push or deployment. Existing authorization to push persists for the requested operation; do not ask again for routine steps.

1. Verify repository metadata, current branch, remotes, upstream, and Git status. Read applicable instructions. If metadata is missing, HEAD is detached, the destination is genuinely ambiguous, or no usable remote exists, explain the concrete blocker without inventing a repository or branch. Never echo remote credentials.
2. Review all eligible staged, unstaged, and untracked changes, including pending changes outside the most recent task. Inspect their purpose and diff; preserve user work. Check for secrets, ignored/tracked private files, dumps, build output, accidental deletions, and unrelated generated artifacts. Never blindly stage everything or discard unexplained changes.
3. Run the appropriate repository checks and review UI/security requirements for the actual changes. Default to the repository's aggregate quality gate for executable changes. For documentation-only changes, validate links/instructions and record why code checks are not applicable. Record actual evidence and blockers in the progress log; do not bypass a failing check to complete a push.
4. Stage the explicit reviewed paths for all eligible pending changes. Inspect `git diff --cached --stat`, `git diff --cached`, and `git diff --cached --check`. Commit with a relevant message whose first character is capitalized, such as `Add reusable development workflows`. Respect existing hooks and signing requirements; do not amend or rewrite earlier commits unless requested. If there are no pending changes, do not create an empty commit.
5. Push the current branch to its configured upstream. If no upstream exists but the intended remote is unambiguous, push that same branch with upstream tracking. Never force-push, change branches, or deploy as an incidental part of this workflow.
6. Verify the push result and report the branch, abbreviated commit, destination without credentials, checks, and final status. On rejection or network failure, report whether a local commit was created and the exact unresolved condition; do not claim a successful push. Review remote divergence before proposing any merge/rebase or retry that would change history.
