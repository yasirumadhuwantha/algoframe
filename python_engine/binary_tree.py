"""Deterministic Python 3.11+ trace generator for Binary Search Tree insertion."""

from __future__ import annotations

from .trace_schema import (
    ChecklistItem,
    MemoryShiftSummary,
    PointerEdge,
    SimulationStep,
    SimulationTrace,
    TimeBreakdown,
    TimeBreakdownItem,
    VisualEntity,
)

PYTHON_SOURCE = """class TreeNode:
    def __init__(self, val: int) -> None:
        self.val = val
        self.left: TreeNode | None = None
        self.right: TreeNode | None = None


def bst_insert(root: TreeNode | None, val: int) -> TreeNode:
    if root is None:
        return TreeNode(val)
    curr = root
    while True:
        if val < curr.val:
            if curr.left is None:
                curr.left = TreeNode(val)
                return root
            curr = curr.left
        else:
            if curr.right is None:
                curr.right = TreeNode(val)
                return root
            curr = curr.right"""

PHASES: tuple[str, ...] = ("Root Compare", "Branch Descend", "Alloc Leaf", "Verify")


def generate_binary_tree_insert_trace(
    initial_values: list[int] | None = None,
    insert_value: int = 67,
) -> SimulationTrace:
    """Generate a deterministic 5-step BST insertion trace."""
    values = list(initial_values) if initial_values is not None else [50, 29, 75, 14, 42]
    if not values:
        raise ValueError("initial_values must contain at least one root value")

    # Build lightweight BST layout with deterministic coordinates (0..100%)
    tree_nodes: dict[int, dict[str, int | str | float | None]] = {}
    root_val = values[0]

    def insert_layout(val: int, addr_idx: int) -> tuple[list[int], int | None, str | None]:
        if not tree_nodes:
            tree_nodes[val] = {
                "id": f"bst_{val}",
                "val": val,
                "addr": f"0x{0x4000 + addr_idx * 0x28:04X}",
                "left": None,
                "right": None,
                "x": 50.0,
                "y": 14.0,
                "depth": 0,
            }
            return [], None, None

        path: list[int] = []
        curr = root_val
        span = 26.0
        while True:
            path.append(curr)
            node = tree_nodes[curr]
            depth = int(node["depth"]) + 1  # type: ignore[arg-type]
            offset = span / (2 ** (depth - 1))
            if val < curr:
                nxt = node["left"]
                if nxt is None:
                    node["left"] = val
                    tree_nodes[val] = {
                        "id": f"bst_{val}",
                        "val": val,
                        "addr": f"0x{0x4000 + addr_idx * 0x28:04X}",
                        "left": None,
                        "right": None,
                        "x": float(node["x"]) - offset,  # type: ignore[arg-type]
                        "y": 14.0 + depth * 30.0,
                        "depth": depth,
                    }
                    return path, curr, "left"
                curr = int(nxt)
            else:
                nxt = node["right"]
                if nxt is None:
                    node["right"] = val
                    tree_nodes[val] = {
                        "id": f"bst_{val}",
                        "val": val,
                        "addr": f"0x{0x4000 + addr_idx * 0x28:04X}",
                        "left": None,
                        "right": None,
                        "x": float(node["x"]) + offset,  # type: ignore[arg-type]
                        "y": 14.0 + depth * 30.0,
                        "depth": depth,
                    }
                    return path, curr, "right"
                curr = int(nxt)

    for idx, v in enumerate(values):
        insert_layout(v, idx)

    path, parent_val, branch_side = insert_layout(insert_value, len(values))
    new_node_info = tree_nodes[insert_value]
    parent_info = tree_nodes[parent_val] if parent_val is not None else new_node_info
    mid_val = path[1] if len(path) > 1 else path[0]
    ram_range = "RAM: 0x4000 - 0x4140"
    header_op = "Binary Search Tree · Ordered Insert"
    note = "BST insertion follows O(h) pointer comparisons (~log2 N) and allocates 1 leaf with 0 shifts."

    def build_tree_snapshot(*, include_new: bool, active_val: int | None, mode: str) -> tuple[tuple[VisualEntity, ...], tuple[PointerEdge, ...]]:
        entities: list[VisualEntity] = []
        edges: list[PointerEdge] = []
        for v, info in tree_nodes.items():
            if v == insert_value and not include_new:
                continue
            left_v = info["left"]
            right_v = info["right"]
            if not include_new:
                if left_v == insert_value:
                    left_v = None
                if right_v == insert_value:
                    right_v = None

            l_addr = str(tree_nodes[int(left_v)]["addr"]) if left_v is not None else None
            r_addr = str(tree_nodes[int(right_v)]["addr"]) if right_v is not None else None

            hl = "head" if v == root_val else "default"
            status = "40B · Root" if v == root_val else "40B · Node"
            if v == insert_value:
                hl = "new" if mode != "final" else "verified"
                status = f"Leaf ({branch_side})" if mode != "final" else "Verified Leaf"
            elif active_val is not None and v == active_val:
                hl = "active"
                status = f"Compare {insert_value} vs {v}"
            elif v in path and mode in ("attach", "final"):
                hl = "verified" if mode == "final" else "prev"
                status = "Visited path"

            role = "ROOT" if v == root_val else ("NEW LEAF" if v == insert_value else f"DEPTH {info['depth']}")
            entities.append(
                VisualEntity(
                    id=str(info["id"]),
                    role_label=role,
                    addr=str(info["addr"]),
                    val=v,
                    next_addr=None,
                    left_addr=l_addr,
                    right_addr=r_addr,
                    status_tag=status,
                    highlight_state=hl,  # type: ignore[arg-type]
                    byte_size=40,
                    tree_x=float(info["x"]),  # type: ignore[arg-type]
                    tree_y=float(info["y"]),  # type: ignore[arg-type]
                )
            )
            if left_v is not None:
                edges.append(
                    PointerEdge(
                        id=f"tedge_{v}_{left_v}",
                        from_id=str(info["id"]),
                        to_id=str(tree_nodes[int(left_v)]["id"]),
                        label="L (<)",
                        edge_style="rewired" if left_v == insert_value else "default",
                    )
                )
            if right_v is not None:
                edges.append(
                    PointerEdge(
                        id=f"tedge_{v}_{right_v}",
                        from_id=str(info["id"]),
                        to_id=str(tree_nodes[int(right_v)]["id"]),
                        label="R (>=)",
                        edge_style="rewired" if right_v == insert_value else "default",
                    )
                )
        return tuple(entities), tuple(edges)

    e1, ed1 = build_tree_snapshot(include_new=False, active_val=root_val, mode="compare")
    e2, ed2 = build_tree_snapshot(include_new=False, active_val=mid_val, mode="descend")
    e3, ed3 = build_tree_snapshot(include_new=True, active_val=parent_val, mode="alloc")
    e4, ed4 = build_tree_snapshot(include_new=True, active_val=insert_value, mode="attach")
    e5, ed5 = build_tree_snapshot(include_new=True, active_val=None, mode="final")

    compare_op = "<" if insert_value < root_val else ">="
    leaf_line = 15 if branch_side == "left" else 20

    steps = (
        SimulationStep(
            step_index=1,
            total_steps=5,
            phase="Root Compare",
            execution_status="COMPARING",
            header_operation=header_op,
            operation_summary=f"compare {insert_value} {compare_op} root({root_val})",
            complexity_badge="O(log n) Step",
            ram_range=ram_range,
            nodes=e1,
            edges=ed1,
            action_text=f"curr = root ({root_val}); {insert_value} {compare_op} {root_val}",
            inspector_title="Root Order Invariant Check",
            inspector_body=(
                f"Compare candidate key {insert_value} against root {root_val}. "
                f"Since {insert_value} {compare_op} {root_val}, descend into the {'left' if insert_value < root_val else 'right'} subtree."
            ),
            checklist=(
                ChecklistItem("c1", f"Compare {insert_value} vs root {root_val}", "active"),
                ChecklistItem("c2", f"Descend to parent {parent_val}", "pending"),
                ChecklistItem("c3", f"Allocate leaf {new_node_info['addr']}", "pending"),
                ChecklistItem("c4", "Verify BST ordering invariant", "pending"),
            ),
            time_breakdown=TimeBreakdown(
                total_us=5,
                items=(
                    TimeBreakdownItem("Key comparison", 2, "compute"),
                    TimeBreakdownItem("Root pointer read", 3, "pointer"),
                ),
            ),
            memory_shift=MemoryShiftSummary(0, note),
            python_line=13 if insert_value < root_val else 18,
        ),
        SimulationStep(
            step_index=2,
            total_steps=5,
            phase="Branch Descend",
            execution_status="DESCENDING",
            header_operation=header_op,
            operation_summary=f"descend -> parent {parent_val} ({parent_info['addr']})",
            complexity_badge="O(h) Seek",
            ram_range=ram_range,
            nodes=e2,
            edges=ed2,
            action_text=f"curr = curr.{'left' if insert_value < root_val else 'right'} -> {mid_val}",
            inspector_title="Subtree Branch Descent",
            inspector_body=(
                f"Follow pointer to node {mid_val}. Every comparison halves the remaining search space in a balanced BST, "
                f"reaching open {branch_side} child slot under {parent_val}."
            ),
            checklist=(
                ChecklistItem("c1", f"Root {root_val} comparison complete", "completed"),
                ChecklistItem("c2", f"Locate empty .{branch_side} under {parent_val}", "active"),
                ChecklistItem("c3", f"Allocate leaf node {insert_value}", "pending"),
                ChecklistItem("c4", "Verify BST ordering invariant", "pending"),
            ),
            time_breakdown=TimeBreakdown(
                total_us=9,
                items=(
                    TimeBreakdownItem("Subtree pointer chase", 5, "pointer"),
                    TimeBreakdownItem("Branch comparison", 4, "compute"),
                ),
            ),
            memory_shift=MemoryShiftSummary(0, note),
            python_line=17 if insert_value < root_val else 22,
        ),
        SimulationStep(
            step_index=3,
            total_steps=5,
            phase="Alloc Leaf",
            execution_status="EXECUTING",
            header_operation=header_op,
            operation_summary=f"malloc({new_node_info['addr']}) -> {parent_val}.{branch_side} = {insert_value}",
            complexity_badge="O(1) Attach",
            ram_range=ram_range,
            nodes=e3,
            edges=ed3,
            action_text=f"curr.{branch_side} = TreeNode({insert_value})",
            inspector_title="Leaf Allocation & Child Pointer Bind",
            inspector_body=(
                f"Allocate 40-byte TreeNode at {new_node_info['addr']} for val={insert_value} and attach it to "
                f"parent {parent_val}.{branch_side}."
            ),
            checklist=(
                ChecklistItem("c1", "Descended BST search path", "completed"),
                ChecklistItem("c2", f"Found NULL .{branch_side} slot", "completed"),
                ChecklistItem("c3", f"Attach {new_node_info['addr']} ({insert_value})", "active"),
                ChecklistItem("c4", "Confirm BST invariant", "pending"),
            ),
            time_breakdown=TimeBreakdown(
                total_us=19,
                items=(
                    TimeBreakdownItem("TreeNode malloc (40B)", 11, "alloc"),
                    TimeBreakdownItem("Child pointer write", 4, "pointer"),
                    TimeBreakdownItem("Cache miss (heap leaf)", 4, "memory"),
                ),
            ),
            memory_shift=MemoryShiftSummary(0, note),
            python_line=leaf_line,
        ),
        SimulationStep(
            step_index=4,
            total_steps=5,
            phase="Verify",
            execution_status="VERIFYING",
            header_operation=header_op,
            operation_summary=f"verify: {parent_val}.{branch_side} == {insert_value}",
            complexity_badge="O(h) Checked",
            ram_range=ram_range,
            nodes=e4,
            edges=ed4,
            action_text=f"assert parent.{branch_side}.val == {insert_value}",
            inspector_title="Ordering Invariant Verification",
            inspector_body=(
                f"Verify all left descendants remain < parent and right descendants >= parent along path "
                f"{' -> '.join(str(x) for x in path)} -> {insert_value}."
            ),
            checklist=(
                ChecklistItem("c1", "Search path traversed", "completed"),
                ChecklistItem("c2", f"Leaf {new_node_info['addr']} attached", "completed"),
                ChecklistItem("c3", "Check BST key ordering", "active"),
                ChecklistItem("c4", "Return root reference", "pending"),
            ),
            time_breakdown=TimeBreakdown(
                total_us=4,
                items=(TimeBreakdownItem("Invariant path check", 4, "compute"),),
            ),
            memory_shift=MemoryShiftSummary(0, note),
            python_line=leaf_line + 1,
        ),
        SimulationStep(
            step_index=5,
            total_steps=5,
            phase="Verify",
            execution_status="COMPLETED",
            header_operation=header_op,
            operation_summary=f"BST size: {len(values)} -> {len(values) + 1} · leaf {insert_value}",
            complexity_badge="O(h) Complete",
            ram_range=ram_range,
            nodes=e5,
            edges=ed5,
            action_text="return root",
            inspector_title="BST Insertion Complete",
            inspector_body=(
                f"Tree now holds {len(values) + 1} nodes. In-order traversal yields sorted keys with zero element shifts."
            ),
            checklist=(
                ChecklistItem("c1", "Root compare", "completed"),
                ChecklistItem("c2", "Subtree descent", "completed"),
                ChecklistItem("c3", "Leaf allocated & linked", "completed"),
                ChecklistItem("c4", "BST invariant verified", "completed"),
            ),
            time_breakdown=TimeBreakdown(
                total_us=2,
                items=(TimeBreakdownItem("Return root pointer", 2, "compute"),),
            ),
            memory_shift=MemoryShiftSummary(0, note),
            python_line=leaf_line + 1,
        ),
    )

    return SimulationTrace(
        structure="binary_tree",
        title="Binary Search Tree · Ordered Insert",
        phases=PHASES,
        python_filename="python_engine/binary_tree.py",
        python_code=PYTHON_SOURCE,
        default_step_index=3,
        steps=steps,
        metadata={
            "initial_values": values,
            "insert_value": insert_value,
        },
    )
