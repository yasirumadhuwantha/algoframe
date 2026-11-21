"""Strict TDD pytest suite for Doubly Linked List and Binary Tree visualizers."""

from __future__ import annotations

from python_engine.binary_tree import generate_binary_tree_insert_trace
from python_engine.doubly_linked_list import generate_doubly_linked_insert_trace


def test_doubly_linked_list_bidirectional_splice() -> None:
    trace = generate_doubly_linked_insert_trace(
        initial_values=[14, 29, 42],
        insert_value=67,
        insert_index=2,
    )
    trace.validate()
    assert trace.structure == "doubly_linked_list"
    assert len(trace.steps) == 5

    splice_step = trace.steps[2]
    assert splice_step.memory_shift.shifted_elements == 0
    assert any(edge.bidirectional for edge in splice_step.edges)
    final_vals = [n.val for n in trace.steps[-1].nodes]
    assert final_vals == [14, 29, 67, 42]


def test_binary_tree_bst_insert_trace() -> None:
    trace = generate_binary_tree_insert_trace(
        initial_values=[50, 29, 75, 14, 42],
        insert_value=67,
    )
    trace.validate()
    assert trace.structure == "binary_tree"
    assert len(trace.steps) == 5

    final_vals = {n.val for n in trace.steps[-1].nodes}
    assert 67 in final_vals
    inserted = next(n for n in trace.steps[-1].nodes if n.val == 67)
    assert inserted.tree_x is not None and inserted.tree_y is not None
