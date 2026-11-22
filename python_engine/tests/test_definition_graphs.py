"""Definition and undirected graph behavior contracts."""

import pytest

from python_engine.learning import generate_learning_trace


def run(structure, operation, values, **options):
    trace = generate_learning_trace(structure, operation, values=values, **options)
    trace.validate()
    assert trace.metadata["operation"] == operation
    assert trace.steps[-1].execution_status == "COMPLETED"
    assert all(trace.python_code.splitlines()[s.python_line - 1].strip() for s in trace.steps)
    return trace


def test_empty_definition_for_every_structure():
    for structure in ("dynamic_array", "singly_linked_list", "doubly_linked_list", "stack", "queue", "binary_tree", "hash_table", "graph"):
        trace = run(structure, "define", [])
        assert trace.metadata["final_values"] == []
        assert trace.analysis.initial_size == 0
        assert trace.analysis.final_size == 0


def test_user_array_definition_populates_slots_in_input_order():
    trace = run("dynamic_array", "define", [3, -1, 8], capacity=5)
    assert trace.metadata["final_values"] == [3, -1, 8]
    assert [node.val for node in trace.steps[-1].nodes] == [3, -1, 8, None, None]
    assert trace.analysis.initial_size == 0
    assert trace.analysis.final_size == 3
    assert any(0 < len([n for n in s.nodes if n.val is not None]) < 3 for s in trace.steps)


def test_linked_definitions_set_real_next_and_previous_references():
    for structure in ("singly_linked_list", "doubly_linked_list"):
        trace = run(structure, "define", [4, 7, 9])
        nodes = trace.steps[-1].nodes
        assert [node.val for node in nodes] == [4, 7, 9]
        for i, node in enumerate(nodes):
            assert node.next_addr == (nodes[i + 1].addr if i + 1 < len(nodes) else None)
            if structure == "doubly_linked_list":
                assert node.prev_addr == (nodes[i - 1].addr if i else None)


def test_graph_definition_has_symmetric_unique_edges_and_isolated_vertices():
    trace = run("graph", "define", [0, 1, 2, 3], edges=[(0, 1), (1, 2), (1, 0)])
    assert trace.metadata["final_values"] == [0, 1, 2, 3]
    assert trace.metadata["adjacency"] == {"0": [1], "1": [0, 2], "2": [1], "3": []}
    assert len(trace.steps[-1].edges) == 2
    assert trace.analysis.storage_space == "O(V + E)"


def test_graph_vertex_insert_and_delete_remove_incident_edges():
    trace = run("graph", "add_vertex", [0, 1], edges=[(0, 1)], value=2)
    assert trace.metadata["final_values"] == [0, 1, 2]
    trace = run("graph", "remove_vertex", [0, 1, 2], edges=[(0, 1), (1, 2)], value=1)
    assert trace.metadata["adjacency"] == {"0": [], "2": []}
    assert trace.metadata["result"] is True


def test_graph_edge_operations_are_undirected_and_duplicate_safe():
    trace = run("graph", "add_edge", [0, 1], value=0, target=1)
    assert trace.metadata["adjacency"] == {"0": [1], "1": [0]}
    trace = run("graph", "add_edge", [0, 1], edges=[(0, 1)], value=0, target=1)
    assert trace.metadata["adjacency"] == {"0": [1], "1": [0]}
    trace = run("graph", "remove_edge", [0, 1], edges=[(0, 1)], value=0, target=1)
    assert trace.metadata["adjacency"] == {"0": [], "1": []}


def test_graph_traversals_visit_reachable_vertices_once_without_mutation():
    edges = [(0, 1), (0, 2), (1, 3), (2, 3)]
    bfs = run("graph", "bfs", [0, 1, 2, 3, 9], edges=edges, value=0)
    dfs = run("graph", "dfs", [0, 1, 2, 3, 9], edges=edges, value=0)
    assert bfs.metadata["result"] == [0, 1, 2, 3]
    assert dfs.metadata["result"] == [0, 1, 3, 2]
    assert bfs.metadata["adjacency"] == dfs.metadata["adjacency"]
    assert bfs.analysis.worst_time == dfs.analysis.worst_time == "O(V + E)"
    assert bfs.analysis.auxiliary_space == dfs.analysis.auxiliary_space == "O(V)"


def test_invalid_graph_endpoints_and_edges_fail_explicitly():
    for options in ({"edges": [(0, 2)]}, {"edges": [(1, 1)]}, {"edges": [(0,)]}, {"edges": [(0, "1")]}):
        with pytest.raises(ValueError):
            generate_learning_trace("graph", "define", values=[0, 1], **options)
    for operation in ("add_edge", "bfs", "dfs", "remove_vertex"):
        with pytest.raises(ValueError):
            generate_learning_trace("graph", operation, values=[0, 1], value=99, target=0)
