"""Deterministic Python 3.11+ trace generator for Singly Linked List Insertion Splice."""

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

PYTHON_SOURCE = """class ListNode:
    def __init__(self, val: int, next_node: "ListNode | None" = None) -> None:
        self.val = val
        self.next = next_node


def insert_splice(head: ListNode | None, index: int, val: int) -> ListNode | None:
    if index < 0:
        raise ValueError("index must be non-negative")
    if index == 0:
        return ListNode(val, head)

    curr = head
    for _ in range(index - 1):
        if curr is None:
            raise ValueError("index out of bounds")
        curr = curr.next

    if curr is None:
        raise ValueError("index out of bounds")

    new_node = ListNode(val)
    new_node.next = curr.next
    curr.next = new_node
    return head"""

PHASES: tuple[str, ...] = ("Traverse", "Alloc", "Splice Pointer", "Verify")


def _addr_for_slot(slot: int) -> str:
    return f"0x{0x1000 + slot * 0x20:04X}"


def generate_singly_linked_insert_trace(
    initial_values: list[int] | None = None,
    insert_value: int = 67,
    insert_index: int = 2,
) -> SimulationTrace:
    """Generate a deterministic 5-step trace for mid-list pointer splice insertion."""
    values = list(initial_values) if initial_values is not None else [14, 29, 42]
    if not values:
        raise ValueError("initial_values must contain at least one element")
    if insert_index < 0 or insert_index > len(values):
        raise ValueError(
            f"insert_index={insert_index} out of bounds for list of length {len(values)}"
        )

    base_addrs = [_addr_for_slot(i) for i in range(len(values))]
    new_addr = "0x1080" if len(values) <= 4 else _addr_for_slot(len(values) + 1)
    ram_range = "RAM: 0x1000 - 0x1100"
    header_op = "Singly Linked List · Insertion Splice"
    n_shifts_array = max(len(values) - insert_index, 0)
    array_note = (
        f"Contiguous Dynamic Array insertion at index [{insert_index}] requires shifting "
        f"{n_shifts_array} (N - {insert_index}) elements in memory."
        if insert_index > 0
        else f"Array prepend requires shifting all {len(values)} (N) elements."
    )

    prev_idx = max(insert_index - 1, 0)
    old_next_idx = insert_index if insert_index < len(values) else None

    def make_base_nodes(
        *,
        step_mode: str,
    ) -> tuple[VisualEntity, ...]:
        entities: list[VisualEntity] = []
        for idx, val in enumerate(values):
            addr = base_addrs[idx]
            next_addr = base_addrs[idx + 1] if idx + 1 < len(values) else None

            if idx == 0 and idx == prev_idx and insert_index > 0:
                role = "HEAD · PREV · [0]"
            elif idx == 0:
                role = "HEAD · [0]"
            elif insert_index > 0 and idx == prev_idx:
                role = f"PREV · [{idx}]"
            elif old_next_idx is not None and idx == old_next_idx:
                role = f"[{idx}] (OLD NEXT)" if step_mode != "final" else f"[{idx + 1}]"
            elif step_mode == "final" and idx > insert_index:
                role = f"[{idx + 1}]"
            else:
                role = f"[{idx}]"

            status = "32 Bytes"
            hl: str = "head" if idx == 0 else "default"

            if step_mode == "traverse":
                if idx == 0:
                    hl = "head"
                    status = "32 Bytes"
                if insert_index > 0 and idx == prev_idx:
                    hl = "active"
                    status = "target prev"
            elif step_mode == "alloc":
                if insert_index > 0 and idx == prev_idx:
                    hl = "prev"
                    status = "predecessor"
                elif old_next_idx is not None and idx == old_next_idx:
                    hl = "retained"
                    status = "Retained"
            elif step_mode == "splice":
                if insert_index > 0 and idx == prev_idx:
                    next_addr = new_addr
                    hl = "rewired"
                    status = "rewired pointer"
                elif old_next_idx is not None and idx == old_next_idx:
                    hl = "retained"
                    status = "Retained"
            elif step_mode in ("verify", "final"):
                if insert_index > 0 and idx == prev_idx:
                    next_addr = new_addr
                    hl = "verified" if step_mode == "final" else "rewired"
                    status = "linked -> new" if step_mode == "final" else "rewired pointer"
                elif old_next_idx is not None and idx == old_next_idx:
                    hl = "verified" if step_mode == "final" else "retained"
                    status = "Retained"

            entities.append(
                VisualEntity(
                    id=f"node_{idx}",
                    role_label=role,
                    addr=addr,
                    val=val,
                    next_addr=next_addr,
                    status_tag=status,
                    highlight_state=hl,  # type: ignore[arg-type]
                    index=idx if step_mode != "final" or idx < insert_index else idx + 1,
                    byte_size=32,
                    lane="primary",
                )
            )

        if step_mode in ("alloc", "splice", "verify", "final"):
            new_next_addr = base_addrs[old_next_idx] if old_next_idx is not None else None
            new_status = (
                "Heap allocated"
                if step_mode == "alloc"
                else "Spliced in mid-list"
                if step_mode in ("splice", "verify")
                else "Verified · 32 Bytes"
            )
            new_role = "NEW NODE" if step_mode != "final" else f"[{insert_index}] · INSERTED"
            new_entity = VisualEntity(
                id="node_new",
                role_label=new_role,
                addr=new_addr,
                val=insert_value,
                next_addr=new_next_addr,
                status_tag=new_status,
                highlight_state="new" if step_mode != "final" else "verified",
                index=insert_index,
                byte_size=32,
                lane="staging" if step_mode in ("alloc", "splice") else "primary",
            )
            if step_mode == "final":
                entities.insert(insert_index, new_entity)
            else:
                entities.insert(insert_index, new_entity)

        return tuple(entities)

    def make_edges(nodes: tuple[VisualEntity, ...], step_mode: str) -> tuple[PointerEdge, ...]:
        by_addr = {n.addr: n for n in nodes}
        edges: list[PointerEdge] = []
        for node in nodes:
            if node.next_addr and node.next_addr in by_addr:
                target = by_addr[node.next_addr]
                style = "default"
                label = "next"
                if step_mode == "alloc" and node.id == "node_new":
                    style = "new_link"
                    label = "next -> old"
                elif step_mode in ("splice", "verify") and node.id == f"node_{prev_idx}" and insert_index > 0:
                    style = "rewired"
                    label = "O(1) link"
                elif step_mode in ("splice", "verify") and node.id == "node_new":
                    style = "downstream"
                    label = "downstream"
                edges.append(
                    PointerEdge(
                        id=f"edge_{node.id}_{target.id}",
                        from_id=node.id,
                        to_id=target.id,
                        label=label,
                        edge_style=style,  # type: ignore[arg-type]
                    )
                )
        return tuple(edges)

    s1_nodes = make_base_nodes(step_mode="traverse")
    s2_nodes = make_base_nodes(step_mode="alloc")
    s3_nodes = make_base_nodes(step_mode="splice")
    s4_nodes = make_base_nodes(step_mode="verify")
    s5_nodes = make_base_nodes(step_mode="final")

    steps = (
        SimulationStep(
            step_index=1,
            total_steps=5,
            phase="Traverse",
            execution_status="TRAVERSING",
            header_operation=header_op,
            operation_summary=f"curr = head ({base_addrs[0]}) -> seek index {prev_idx}",
            complexity_badge="O(n) Seek",
            ram_range=ram_range,
            nodes=s1_nodes,
            edges=make_edges(s1_nodes, "traverse"),
            action_text=f"curr = head; advance {prev_idx} hop(s) to {base_addrs[prev_idx]}",
            inspector_title="Pointer Chain Traversal",
            inspector_body=(
                f"Linked lists do not support O(1) random indexing. Starting at HEAD ({base_addrs[0]}), "
                f"follow .next pointers until reaching predecessor index [{prev_idx}] at {base_addrs[prev_idx]}."
            ),
            checklist=(
                ChecklistItem("c1", "Initialize cursor at HEAD", "completed"),
                ChecklistItem("c2", f"Follow next pointers to [{prev_idx}]", "active"),
                ChecklistItem("c3", "Allocate new heap node", "pending"),
                ChecklistItem("c4", "Rewire prev.next = new_node", "pending"),
            ),
            time_breakdown=TimeBreakdown(
                total_us=11,
                items=(
                    TimeBreakdownItem("Pointer dereference (head -> prev)", 5, "pointer"),
                    TimeBreakdownItem("Cache miss (non-contiguous hop)", 6, "memory"),
                ),
            ),
            memory_shift=MemoryShiftSummary(
                shifted_elements=0,
                comparison_note=array_note,
            ),
            python_line=17 if insert_index > 1 else 13,
        ),
        SimulationStep(
            step_index=2,
            total_steps=5,
            phase="Alloc",
            execution_status="ALLOCATING",
            header_operation=header_op,
            operation_summary=f"malloc({new_addr}) -> val: {insert_value}",
            complexity_badge="O(1) Alloc",
            ram_range=ram_range,
            nodes=s2_nodes,
            edges=make_edges(s2_nodes, "alloc"),
            action_text=f"new_node = ListNode({insert_value}); new_node.next = curr.next",
            inspector_title="Heap Allocation & Suffix Binding",
            inspector_body=(
                f"Allocate a 32-byte node at {new_addr} storing val={insert_value}. "
                "Bind new_node.next to the existing downstream node BEFORE updating prev.next so the tail is never orphaned."
            ),
            checklist=(
                ChecklistItem("c1", f"Locate predecessor [{prev_idx}]", "completed"),
                ChecklistItem("c2", f"malloc(32B) at {new_addr} -> {insert_value}", "active"),
                ChecklistItem("c3", "Attach new_node.next -> old_next", "active"),
                ChecklistItem("c4", "Rewire prev_node.next = new_node", "pending"),
            ),
            time_breakdown=TimeBreakdown(
                total_us=18,
                items=(
                    TimeBreakdownItem("Node malloc (sizeof Node)", 10, "alloc"),
                    TimeBreakdownItem("Write val + initial next pointer", 4, "pointer"),
                    TimeBreakdownItem("Allocator freelist lookup", 4, "memory"),
                ),
            ),
            memory_shift=MemoryShiftSummary(
                shifted_elements=0,
                comparison_note=array_note,
            ),
            python_line=23,
        ),
        SimulationStep(
            step_index=3,
            total_steps=5,
            phase="Splice Pointer",
            execution_status="EXECUTING",
            header_operation=header_op,
            operation_summary=f"malloc({new_addr}) -> val: {insert_value}",
            complexity_badge="O(1) Rewire",
            ram_range=ram_range,
            nodes=s3_nodes,
            edges=make_edges(s3_nodes, "splice"),
            action_text="prev_node.next = new_node",
            inspector_title="Pointer Splicing Mechanics",
            inspector_body=(
                f"Assigning prev_node.next = {new_addr} atomically splices val={insert_value} into position [{insert_index}]. "
                "Neighboring heap blocks stay pinned in place—zero bytes of existing payloads are copied or shifted."
            ),
            checklist=(
                ChecklistItem("c1", f"Locate predecessor [{prev_idx}] ({base_addrs[prev_idx]})", "completed"),
                ChecklistItem("c2", f"Allocate new node at {new_addr} & bind .next", "completed"),
                ChecklistItem("c3", f"Rewire {base_addrs[prev_idx]}.next -> {new_addr}", "active"),
                ChecklistItem("c4", "Verify downstream chain integrity", "pending"),
            ),
            time_breakdown=TimeBreakdown(
                total_us=22,
                items=(
                    TimeBreakdownItem("Node malloc (sizeof Node)", 10, "alloc"),
                    TimeBreakdownItem("2x Pointer rewrite", 4, "pointer"),
                    TimeBreakdownItem("Cache miss (non-contiguous)", 8, "memory"),
                ),
            ),
            memory_shift=MemoryShiftSummary(
                shifted_elements=0,
                comparison_note=array_note,
            ),
            python_line=24,
        ),
        SimulationStep(
            step_index=4,
            total_steps=5,
            phase="Verify",
            execution_status="VERIFYING",
            header_operation=header_op,
            operation_summary=f"verify chain: {base_addrs[prev_idx]} -> {new_addr} -> {base_addrs[old_next_idx] if old_next_idx is not None else 'NULL'}",
            complexity_badge="O(1) Verified",
            ram_range=ram_range,
            nodes=s4_nodes,
            edges=make_edges(s4_nodes, "verify"),
            action_text="assert prev.next.val == new_val and prev.next.next == old_next",
            inspector_title="Link Continuity Verification",
            inspector_body=(
                f"Walk from HEAD through {new_addr} to confirm the spliced node bridges predecessor [{prev_idx}] "
                "and the retained downstream tail with no cycles or dangling pointers."
            ),
            checklist=(
                ChecklistItem("c1", f"Predecessor [{prev_idx}] points to {new_addr}", "completed"),
                ChecklistItem("c2", f"{new_addr} preserves downstream tail", "completed"),
                ChecklistItem("c3", "Confirm cycle-free NULL termination", "active"),
                ChecklistItem("c4", "Commit logical index shift", "pending"),
            ),
            time_breakdown=TimeBreakdown(
                total_us=6,
                items=(
                    TimeBreakdownItem("Pointer chain check", 3, "pointer"),
                    TimeBreakdownItem("NULL sentinel assertion", 3, "compute"),
                ),
            ),
            memory_shift=MemoryShiftSummary(
                shifted_elements=0,
                comparison_note=array_note,
            ),
            python_line=25,
        ),
        SimulationStep(
            step_index=5,
            total_steps=5,
            phase="Verify",
            execution_status="COMPLETED",
            header_operation=header_op,
            operation_summary=f"list size: {len(values)} -> {len(values) + 1} · inserted {insert_value}",
            complexity_badge="O(1) Complete",
            ram_range=ram_range,
            nodes=s5_nodes,
            edges=make_edges(s5_nodes, "final"),
            action_text="return head",
            inspector_title="Insertion Splice Complete",
            inspector_body=(
                f"The list now contains {len(values) + 1} nodes with {insert_value} at logical index [{insert_index}]. "
                "All original nodes remained stationary at their original heap addresses."
            ),
            checklist=(
                ChecklistItem("c1", "Traverse to insertion boundary", "completed"),
                ChecklistItem("c2", f"Allocate {new_addr} (32 Bytes)", "completed"),
                ChecklistItem("c3", "Complete O(1) pointer rewire", "completed"),
                ChecklistItem("c4", f"Final sequence length = {len(values) + 1}", "completed"),
            ),
            time_breakdown=TimeBreakdown(
                total_us=2,
                items=(
                    TimeBreakdownItem("Return updated head reference", 2, "compute"),
                ),
            ),
            memory_shift=MemoryShiftSummary(
                shifted_elements=0,
                comparison_note=array_note,
            ),
            python_line=25,
        ),
    )

    return SimulationTrace(
        structure="singly_linked_list",
        title="Singly Linked List · Insertion Splice",
        phases=PHASES,
        python_filename="python_engine/singly_linked_list.py",
        python_code=PYTHON_SOURCE,
        default_step_index=3,
        steps=steps,
        metadata={
            "initial_values": values,
            "insert_value": insert_value,
            "insert_index": insert_index,
        },
    )
