# AlgoFrame Trace Generation & Verification Workflow

Use the reusable [TDD procedure](../.agents/skills/tdd/SKILL.md) and record acceptance criteria and actual results in [the progress record](../docs/progress.md). The steps below add trace-specific requirements.

1. Define typed schema invariants in `python_engine/trace_schema.py`.
2. Author failing `pytest` assertions in `python_engine/tests/` before engine code.
3. Implement deterministic Python 3.11+ trace generators (`singly_linked_list.py`, `dynamic_array.py`, `doubly_linked_list.py`, `binary_tree.py`).
4. Execute `python -m python_engine.run_tests` (or `python -m pytest` if installed), then related regression checks. Record failures and blockers; do not weaken assertions to reach a passing result.
5. Serve live traces from Express (`/api/simulate`) using `python3 -m python_engine.cli` and synchronize `python_line` highlights with `PythonCodeBox`.

For the course workspace, `python_engine/learning.py` adds fixed executable Python operations. Test observable results, empty/full/index boundaries, reference/tree invariants, and API parameter forwarding first. Its function-entry frame is followed by post-line snapshots from real operation line events. Keep source on the right at desktop widths and scroll only the code panel. Complexity excludes setup/trace overhead; modeled addresses/storage and legacy illustrative timings must not be described as CPython benchmarks. See `docs/course-map.md` for supported operations and advanced extensions.
