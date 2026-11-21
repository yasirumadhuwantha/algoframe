---
name: tdd
description: Implement behavior changes and bug fixes using acceptance criteria, a focused failing test, a minimal fix, and regression checks with existing project tools.
---

# Test-driven changes

Read the repository's project context and relevant scoped instructions for commands and domain contracts. Keep this procedure independent of its language, framework, and product styling.

1. State the observable acceptance criteria, affected boundaries, and meaningful edge cases in the existing progress record. Inspect the related code and tests; run a relevant baseline to distinguish existing failures.
2. Write the smallest focused test that demonstrates the missing behavior or bug. Exercise an observable result or contract, including a negative case when it matters. Run it before implementation and record the command, failure, and why it demonstrates the requirement. A missing new public entry point can be a valid initial failure; unrelated environment errors cannot prove a regression.
3. Implement the smallest maintainable change that satisfies the requirement. Preserve working behavior and public contracts outside the authorized scope.
4. Rerun the focused test. Refactor duplication or unclear structure with the test green, then run related regression tests and the repository's applicable quality gate.
5. Record actual results, scope limits, and unfinished work. Mark the feature verified only when its criteria have evidence. Report blocked checks separately from passing checks.

Never manufacture a failure by breaking working code, skip a failing test to claim success, weaken assertions, or write tests that only repeat implementation. Prefer realistic inputs and externally observable invariants. Reuse installed test tools; explain a demonstrated gap before adding a framework. Documentation-only edits require consistency/link review, not artificial red tests.
