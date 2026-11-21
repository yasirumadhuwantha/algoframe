# AlgoFrame Schema & Trace Invariants

- Every `SimulationTrace` must contain sequential 1-indexed steps (`1..total_steps`).
- Every step `phase` must belong to the trace's declared `phases` tuple.
- `time_breakdown.total_us` must equal the exact sum of `time_breakdown.items[].duration_us`.
- `python_line` must point to a non-empty, 1-indexed line in `python_code`.
- `memory_shift.shifted_elements` must be `>= 0` and match the physical element moves performed in that step.
