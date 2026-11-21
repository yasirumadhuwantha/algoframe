"""Observable outcomes and execution contracts for the course operations."""

import pytest

from python_engine.learning import generate_learning_trace


def run(structure, operation, values, **options):
    trace = generate_learning_trace(structure, operation, values=values, **options)
    trace.validate()
    lines = trace.python_code.splitlines()
    for step in trace.steps:
        assert lines[step.python_line - 1].strip()
    assert trace.steps[-1].execution_status == "COMPLETED"
    assert trace.analysis.executed_lines > 0
    return trace


def test_array_delete_shifts_only_following_values():
    trace = run("dynamic_array", "delete", [10, 20, 30, 40], index=1, capacity=6)
    assert trace.metadata["final_values"] == [10, 30, 40]
    assert trace.metadata["result"] == 20
    assert trace.steps[-1].memory_shift.shifted_elements == 2
    assert trace.analysis.auxiliary_space == "O(1)"


def test_array_full_insertion_grows_and_preserves_order():
    trace = run("dynamic_array", "insert", [10, 20], index=1, value=99, capacity=2)
    assert trace.metadata["final_values"] == [10, 99, 20]
    assert trace.metadata["capacity"] == 4
    assert trace.analysis.auxiliary_space == "O(n)"
    assert trace.analysis.peak_model_slots >= 6


def test_array_search_access_and_empty_insertion():
    assert run("dynamic_array", "search", [7, 9], value=9).metadata["result"] == 1
    assert run("dynamic_array", "search", [7, 9], value=3).metadata["result"] == -1
    assert run("dynamic_array", "access", [7, 9], index=0).metadata["result"] == 7
    assert run("dynamic_array", "insert", [], index=0, value=7).metadata["final_values"] == [7]


def test_linked_insert_and_delete_head_middle_tail():
    for structure in ("singly_linked_list", "doubly_linked_list"):
        for index in (0, 1, 2):
            values = [10, 20, 30]
            trace = run(structure, "delete", values, index=index)
            assert trace.metadata["final_values"] == values[:index] + values[index + 1:]
            assert trace.metadata["result"] == values[index]
            nodes = trace.steps[-1].nodes
            assert all(node.next_addr == (nodes[i + 1].addr if i + 1 < len(nodes) else None) for i, node in enumerate(nodes))
            if structure == "doubly_linked_list":
                assert all(node.prev_addr == (nodes[i - 1].addr if i else None) for i, node in enumerate(nodes))
        assert run(structure, "insert", [], index=0, value=4).metadata["final_values"] == [4]
        assert run(structure, "insert", [1, 3], index=1, value=2).metadata["final_values"] == [1, 2, 3]


def test_stack_lifo_and_peek():
    assert run("stack", "push", [1, 2], value=3, capacity=4).metadata["final_values"] == [1, 2, 3]
    trace = run("stack", "pop", [1, 2], capacity=4)
    assert trace.metadata["result"] == 2
    assert trace.metadata["final_values"] == [1]
    trace = run("stack", "peek", [1, 2], capacity=4)
    assert trace.metadata["result"] == 2
    assert trace.metadata["final_values"] == [1, 2]


def test_stack_and_queue_underflow_overflow_are_explicit():
    for structure, operation in (("stack", "pop"), ("stack", "peek"), ("queue", "dequeue"), ("queue", "peek")):
        with pytest.raises(ValueError):
            generate_learning_trace(structure, operation, values=[])
    for structure, operation in (("stack", "push"), ("queue", "enqueue")):
        with pytest.raises(ValueError):
            generate_learning_trace(structure, operation, values=[1, 2], capacity=2, value=3)


def test_circular_queue_wraps_without_shifting_remaining_values():
    trace = run("queue", "enqueue", [10, 20, 30], capacity=5, front=3, value=99)
    assert trace.metadata["final_values"] == [10, 20, 30, 99]
    assert trace.metadata["rear"] == 2
    trace = run("queue", "dequeue", [10, 20, 30], capacity=5, front=4)
    assert trace.metadata["result"] == 10
    assert trace.metadata["front"] == 0
    assert trace.metadata["final_values"] == [20, 30]
    assert trace.steps[-1].memory_shift.shifted_elements == 0
    assert trace.analysis.worst_time == "O(1)"


def test_bst_delete_leaf_one_child_two_children_and_root():
    for values, key in (([4], 4), ([4, 2, 6], 2), ([4, 2, 1], 2), ([4, 2, 6, 5, 7], 4)):
        trace = run("binary_tree", "delete", values, value=key)
        assert sorted(trace.metadata["final_values"]) == sorted(set(values) - {key})
        nodes = {node.addr: node for node in trace.steps[-1].nodes}
        def ordered(addr, low=float('-inf'), high=float('inf')):
            if addr is None:
                return
            node = nodes[addr]
            assert low < node.val < high
            ordered(node.left_addr, low, node.val)
            ordered(node.right_addr, node.val, high)
        if nodes:
            ordered(next(node.addr for node in nodes.values() if node.role_label == 'ROOT'))
    trace = run("binary_tree", "inorder", [4, 2, 6, 1, 3])
    assert trace.metadata["result"] == [1, 2, 3, 4, 6]
    assert trace.analysis.auxiliary_space == "O(h)"


def test_bst_insert_duplicates_and_search_do_not_corrupt_tree():
    assert run("binary_tree", "insert", [4, 2, 6], value=4).metadata["final_values"] == [4, 2, 6]
    assert run("binary_tree", "search", [4, 2, 6], value=6).metadata["result"] is True
    assert run("binary_tree", "search", [4, 2, 6], value=9).metadata["result"] is False
    assert run("binary_tree", "delete", [4, 2, 6], value=9).metadata["final_values"] == [4, 2, 6]


def test_hash_collisions_update_and_delete_preserve_other_keys():
    trace = run("hash_table", "insert", [1, 6], value=11, payload=110, capacity=5)
    assert trace.metadata["table"][1] == [[1, 10], [6, 60], [11, 110]]
    trace = run("hash_table", "insert", [1, 6], value=6, payload=999, capacity=5)
    assert trace.metadata["table"][1] == [[1, 10], [6, 999]]
    trace = run("hash_table", "delete", [1, 6], value=1, capacity=5)
    assert trace.metadata["table"][1] == [[6, 60]]
    assert run("hash_table", "search", [1, 6], value=6, capacity=5).metadata["result"] == 60
    assert run("hash_table", "search", [1, 6], value=2, capacity=5).metadata["result"] is None


def test_line_snapshots_capture_actual_mutation_and_explicit_memory_model():
    trace = run("stack", "pop", [14, 29], capacity=4)
    clear = next(step for step in trace.steps if trace.python_code.splitlines()[step.python_line - 1].strip() == "data[size] = None")
    assert all(node.val != 29 for node in clear.nodes)
    assert trace.analysis.memory_note
    assert "not" in trace.analysis.memory_note.lower()
    assert trace.analysis.worst_time == "O(1)"


def test_invalid_operations_indices_and_large_inputs_are_rejected():
    for arguments in (
        ("stack", "delete", [1], {}),
        ("dynamic_array", "delete", [1], {"index": -1}),
        ("singly_linked_list", "delete", [1], {"index": 1}),
        ("queue", "enqueue", [1], {"capacity": 0}),
        ("dynamic_array", "search", list(range(25)), {}),
    ):
        structure, operation, values, options = arguments
        with pytest.raises(ValueError):
            generate_learning_trace(structure, operation, values=values, **options)
