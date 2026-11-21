"""Strict TDD pytest suite for Dynamic Array insert_at with shift and resize."""

from __future__ import annotations

import pytest

from python_engine.dynamic_array import (
    PYTHON_SOURCE,
    generate_dynamic_array_insert_trace,
)


def test_dynamic_array_in_place_shift_trace() -> None:
    trace = generate_dynamic_array_insert_trace(
        initial_values=[10, 20, 30, 40],
        capacity=6,
        insert_value=25,
        insert_index=1,
    )
    trace.validate()
    assert trace.structure == "dynamic_array"
    assert len(trace.steps) == 5

    shift_step = next(s for s in trace.steps if s.phase == "Shift Right")
    assert shift_step.memory_shift.shifted_elements == 3
    assert "3 elements" in shift_step.inspector_body or shift_step.memory_shift.shifted_elements == 3

    final_values = [n.val for n in trace.steps[-1].nodes if n.val is not None]
    assert final_values == [10, 25, 20, 30, 40]


def test_dynamic_array_triggers_realloc_when_full() -> None:
    trace = generate_dynamic_array_insert_trace(
        initial_values=[14, 29, 42, 58],
        capacity=4,
        insert_value=67,
        insert_index=2,
    )
    trace.validate()
    assert "Realloc" in trace.phases
    realloc_steps = [s for s in trace.steps if s.phase == "Realloc"]
    assert len(realloc_steps) >= 1
    assert any("2x" in s.operation_summary or "realloc" in s.operation_summary.lower() for s in realloc_steps)

    final_step = trace.steps[-1]
    assert len(final_step.nodes) == 8
    populated = [n.val for n in final_step.nodes if n.val is not None]
    assert populated == [14, 29, 67, 42, 58]
    assert final_step.memory_shift.shifted_elements >= 4


def test_dynamic_array_python_lines_valid() -> None:
    trace = generate_dynamic_array_insert_trace()
    lines = PYTHON_SOURCE.splitlines()
    for step in trace.steps:
        assert 1 <= step.python_line <= len(lines)
        assert lines[step.python_line - 1].strip() != ""


def test_dynamic_array_invalid_index_raises() -> None:
    with pytest.raises(ValueError):
        generate_dynamic_array_insert_trace(
            initial_values=[10, 20],
            capacity=4,
            insert_value=99,
            insert_index=-1,
        )
