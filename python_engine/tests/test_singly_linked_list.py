"""Strict TDD pytest suite for Singly Linked List Insertion Splice."""

from __future__ import annotations

import pytest

from python_engine.singly_linked_list import (
    PYTHON_SOURCE,
    generate_singly_linked_insert_trace,
)
from python_engine.trace_schema import SimulationTrace


def test_default_singly_linked_list_splice_has_five_steps() -> None:
    trace = generate_singly_linked_insert_trace(
        initial_values=[14, 29, 42],
        insert_value=67,
        insert_index=2,
    )
    assert isinstance(trace, SimulationTrace)
    trace.validate()
    assert trace.structure == "singly_linked_list"
    assert trace.phases == ("Traverse", "Alloc", "Splice Pointer", "Verify")
    assert len(trace.steps) == 5
    assert trace.default_step_index == 3


def test_step_three_matches_algoframe_splice_mechanics() -> None:
    trace = generate_singly_linked_insert_trace(
        initial_values=[14, 29, 42],
        insert_value=67,
        insert_index=2,
    )
    step3 = trace.steps[2]
    assert step3.step_index == 3
    assert step3.total_steps == 5
    assert step3.phase == "Splice Pointer"
    assert step3.header_operation == "Singly Linked List · Insertion Splice"
    assert step3.complexity_badge == "O(1) Rewire"
    assert step3.ram_range == "RAM: 0x1000 - 0x1100"
    assert "0x1080" in step3.operation_summary
    assert "67" in step3.operation_summary
    assert step3.time_breakdown.total_us == 22
    assert step3.memory_shift.shifted_elements == 0

    roles = [node.role_label for node in step3.nodes]
    assert "HEAD · [0]" in roles
    assert "PREV · [1]" in roles
    assert "NEW NODE" in roles
    assert "[2] (OLD NEXT)" in roles

    new_node = next(n for n in step3.nodes if n.role_label == "NEW NODE")
    prev_node = next(n for n in step3.nodes if n.role_label == "PREV · [1]")
    old_next = next(n for n in step3.nodes if n.role_label == "[2] (OLD NEXT)")

    assert new_node.val == 67
    assert new_node.addr == "0x1080"
    assert prev_node.next_addr == new_node.addr
    assert new_node.next_addr == old_next.addr
    assert new_node.status_tag == "Spliced in mid-list"
    assert prev_node.status_tag == "rewired pointer"
    assert old_next.status_tag == "Retained"


def test_python_lines_point_to_non_empty_valid_source_lines() -> None:
    trace = generate_singly_linked_insert_trace()
    lines = PYTHON_SOURCE.splitlines()
    for step in trace.steps:
        assert 1 <= step.python_line <= len(lines)
        assert lines[step.python_line - 1].strip() != ""


def test_final_step_preserves_inserted_sequence() -> None:
    trace = generate_singly_linked_insert_trace(
        initial_values=[14, 29, 42],
        insert_value=67,
        insert_index=2,
    )
    final_step = trace.steps[-1]
    assert final_step.phase == "Verify"
    values = [n.val for n in final_step.nodes]
    assert values == [14, 29, 67, 42]
    assert final_step.nodes[-1].next_addr is None


def test_invalid_insert_index_raises_value_error() -> None:
    with pytest.raises(ValueError):
        generate_singly_linked_insert_trace(
            initial_values=[14, 29, 42],
            insert_value=67,
            insert_index=9,
        )
