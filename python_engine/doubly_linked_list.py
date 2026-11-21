"""Deterministic Python 3.11+ trace generator for Doubly Linked List bidirectional splice."""

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

PYTHON_SOURCE = """class DoublyNode:
    def __init__(self, val: int) -> None:
        self.val = val
        self.prev: DoublyNode | None = None
        self.next: DoublyNode | None = None


def insert_doubly(head: DoublyNode | None, index: int, val: int) -> DoublyNode | None:
    curr = head
    for _ in range(index - 1):
        if curr is None:
            raise ValueError("index out of bounds")
        curr = curr.next

    if curr is None:
        raise ValueError("index out of bounds")

    new_node = DoublyNode(val)
    old_next = curr.next
    new_node.next = old_next
    new_node.prev = curr
    if old_next is not None:
        old_next.prev = new_node
    curr.next = new_node
    return head"""

PHASES: tuple[str, ...] = ("Traverse", "Alloc", "Rewire 4 Pointers", "Verify")


def _addr(slot: int) -> str:
    return f"0x{0x3000 + slot * 0x28:04X}"


def generate_doubly_linked_insert_trace(
    initial_values: list[int] | None = None,
    insert_value: int = 67,
    insert_index: int = 2,
) -> SimulationTrace:
    """Generate a deterministic 5-step trace for Doubly Linked List 4-pointer splice."""
    values = list(initial_values) if initial_values is not None else [14, 29, 42]
    if insert_index < 1 or insert_index > len(values):
        raise ValueError(f"insert_index={insert_index} must be within [1, {len(values)}]")

    addrs = [_addr(i) for i in range(len(values))]
    new_addr = "0x30A0"
    prev_idx = insert_index - 1
    old_next_idx = insert_index if insert_index < len(values) else None
    ram_range = "RAM: 0x3000 - 0x3120"
    header_op = "Doubly Linked List · Bidirectional Splice"
    note = "Bidirectional splice rewires 4 pointers in O(1) without shifting any element payloads."

    def build_nodes(mode: str) -> tuple[VisualEntity, ...]:
        out: list[VisualEntity] = []
        for idx, val in enumerate(values):
            p_addr = addrs[idx - 1] if idx > 0 else None
            n_addr = addrs[idx + 1] if idx + 1 < len(values) else None
            role = "HEAD · [0]" if idx == 0 else (f"PREV · [{idx}]" if idx == prev_idx else f"[{idx}] (OLD NEXT)")
            if mode == "final" and idx >= insert_index:
                role = f"[{idx + 1}]"
            hl = "head" if idx == 0 else "default"
            status = "40 Bytes"

            if mode == "traverse" and idx == prev_idx:
                hl = "active"
                status = "target prev"
            elif mode in ("rewire_new", "rewire_neighbors", "final"):
                if idx == prev_idx:
                    n_addr = new_addr
                    hl = "rewired" if mode != "final" else "verified"
                    status = "next -> new"
                elif old_next_idx is not None and idx == old_next_idx:
                    if mode in ("rewire_neighbors", "final"):
                        p_addr = new_addr
                    hl = "rewired" if mode == "rewire_neighbors" else ("verified" if mode == "final" else "retained")
                    status = "prev -> new" if mode in ("rewire_neighbors", "final") else "Retained"

            out.append(
                VisualEntity(
                    id=f"dnode_{idx}",
                    role_label=role,
                    addr=addrs[idx],
                    val=val,
                    prev_addr=p_addr,
                    next_addr=n_addr,
                    status_tag=status,
                    highlight_state=hl,  # type: ignore[arg-type]
                    index=idx,
                    byte_size=40,
                    lane="primary",
                )
            )

        if mode != "traverse":
            n_ptr = addrs[old_next_idx] if old_next_idx is not None else None
            p_ptr = addrs[prev_idx]
            new_ent = VisualEntity(
                id="dnode_new",
                role_label="NEW NODE" if mode != "final" else f"[{insert_index}] · INSERTED",
                addr=new_addr,
                val=insert_value,
                prev_addr=p_ptr if mode in ("rewire_new", "rewire_neighbors", "final") else None,
                next_addr=n_ptr if mode in ("rewire_new", "rewire_neighbors", "final") else None,
                status_tag="40 Bytes · 2x ptrs" if mode == "alloc" else "Bidirectional link",
                highlight_state="new" if mode != "final" else "verified",
                index=insert_index,
                byte_size=40,
                lane="staging" if mode != "final" else "primary",
            )
            out.insert(insert_index, new_ent)
        return tuple(out)

    def build_edges(nodes: tuple[VisualEntity, ...]) -> tuple[PointerEdge, ...]:
        by_addr = {n.addr: n for n in nodes}
        edges: list[PointerEdge] = []
        for n in nodes:
            if n.next_addr and n.next_addr in by_addr:
                target = by_addr[n.next_addr]
                bidir = target.prev_addr == n.addr
                edges.append(
                    PointerEdge(
                        id=f"dedge_{n.id}_{target.id}",
                        from_id=n.id,
                        to_id=target.id,
                        label="prev ⇄ next" if bidir else "next",
                        edge_style="rewired" if bidir and "new" in (n.id + target.id) else "default",
                        bidirectional=bidir,
                    )
                )
        return tuple(edges)

    n1 = build_nodes("traverse")
    n2 = build_nodes("alloc")
    n3 = build_nodes("rewire_new")
    n4 = build_nodes("rewire_neighbors")
    n5 = build_nodes("final")

    steps = (
        SimulationStep(
            step_index=1,
            total_steps=5,
            phase="Traverse",
            execution_status="TRAVERSING",
            header_operation=header_op,
            operation_summary=f"seek predecessor [{prev_idx}] @ {addrs[prev_idx]}",
            complexity_badge="O(n) Seek",
            ram_range=ram_range,
            nodes=n1,
            edges=build_edges(n1),
            action_text=f"curr = head; advance to {addrs[prev_idx]}",
            inspector_title="Bidirectional Predecessor Seek",
            inspector_body=(
                f"Traverse forward from HEAD ({addrs[0]}) to [{prev_idx}] ({addrs[prev_idx]}). "
                "Each node stores both .prev and .next pointers (40 Bytes total)."
            ),
            checklist=(
                ChecklistItem("c1", "Walk chain to predecessor", "active"),
                ChecklistItem("c2", "Allocate 40B DoublyNode", "pending"),
                ChecklistItem("c3", "Rewire 4 bidirectional links", "pending"),
                ChecklistItem("c4", "Verify forward/backward symmetry", "pending"),
            ),
            time_breakdown=TimeBreakdown(
                total_us=10,
                items=(
                    TimeBreakdownItem("Pointer dereference", 4, "pointer"),
                    TimeBreakdownItem("Cache miss (heap hop)", 6, "memory"),
                ),
            ),
            memory_shift=MemoryShiftSummary(0, note),
            python_line=13,
        ),
        SimulationStep(
            step_index=2,
            total_steps=5,
            phase="Alloc",
            execution_status="ALLOCATING",
            header_operation=header_op,
            operation_summary=f"malloc({new_addr}) -> val: {insert_value} (40B)",
            complexity_badge="O(1) Alloc",
            ram_range=ram_range,
            nodes=n2,
            edges=build_edges(n2),
            action_text=f"new_node = DoublyNode({insert_value}); old_next = curr.next",
            inspector_title="40-Byte Heap Node Allocation",
            inspector_body=(
                f"Allocate DoublyNode at {new_addr} with prev=NULL, next=NULL, and cache old_next "
                f"({addrs[old_next_idx] if old_next_idx is not None else 'NULL'}) before modifying neighbors."
            ),
            checklist=(
                ChecklistItem("c1", f"Predecessor [{prev_idx}] ready", "completed"),
                ChecklistItem("c2", f"malloc(40B) at {new_addr}", "active"),
                ChecklistItem("c3", "Bind new_node.next & new_node.prev", "pending"),
                ChecklistItem("c4", "Update neighbor pointers", "pending"),
            ),
            time_breakdown=TimeBreakdown(
                total_us=14,
                items=(
                    TimeBreakdownItem("Node malloc (40B)", 11, "alloc"),
                    TimeBreakdownItem("Save old_next register", 3, "pointer"),
                ),
            ),
            memory_shift=MemoryShiftSummary(0, note),
            python_line=18,
        ),
        SimulationStep(
            step_index=3,
            total_steps=5,
            phase="Rewire 4 Pointers",
            execution_status="EXECUTING",
            header_operation=header_op,
            operation_summary=f"link {new_addr} <-> {addrs[prev_idx]} & {addrs[old_next_idx] if old_next_idx is not None else 'NULL'}",
            complexity_badge="O(1) Rewire",
            ram_range=ram_range,
            nodes=n3,
            edges=build_edges(n3),
            action_text="new_node.next = old_next; new_node.prev = curr; curr.next = new_node",
            inspector_title="Outgoing & Incoming Pointer Binding",
            inspector_body=(
                f"Bind {new_addr}.prev -> {addrs[prev_idx]} and {new_addr}.next -> "
                f"{addrs[old_next_idx] if old_next_idx is not None else 'NULL'}, then point predecessor .next to {new_addr}."
            ),
            checklist=(
                ChecklistItem("c1", "Allocate new node", "completed"),
                ChecklistItem("c2", "Set new_node.prev and new_node.next", "completed"),
                ChecklistItem("c3", "Update old_next.prev = new_node", "active"),
                ChecklistItem("c4", "Verify bidirectional symmetry", "pending"),
            ),
            time_breakdown=TimeBreakdown(
                total_us=24,
                items=(
                    TimeBreakdownItem("Node malloc (40B)", 11, "alloc"),
                    TimeBreakdownItem("4x Pointer writes", 7, "pointer"),
                    TimeBreakdownItem("Non-contiguous cache miss", 6, "memory"),
                ),
            ),
            memory_shift=MemoryShiftSummary(0, note),
            python_line=21,
        ),
        SimulationStep(
            step_index=4,
            total_steps=5,
            phase="Rewire 4 Pointers",
            execution_status="SYNCING PREV",
            header_operation=header_op,
            operation_summary=f"old_next.prev = {new_addr} (symmetry lock)",
            complexity_badge="O(1) Rewire",
            ram_range=ram_range,
            nodes=n4,
            edges=build_edges(n4),
            action_text="if old_next: old_next.prev = new_node; curr.next = new_node",
            inspector_title="Reverse Link Symmetry Lock",
            inspector_body=(
                "Complete the 4th pointer assignment so backward traversal from tail to HEAD passes cleanly through "
                f"{new_addr} without skipping the newly spliced node."
            ),
            checklist=(
                ChecklistItem("c1", "new_node links bound", "completed"),
                ChecklistItem("c2", "curr.next -> new_node", "completed"),
                ChecklistItem("c3", "old_next.prev -> new_node", "completed"),
                ChecklistItem("c4", "Run symmetry invariant check", "active"),
            ),
            time_breakdown=TimeBreakdown(
                total_us=8,
                items=(
                    TimeBreakdownItem("Reverse pointer store", 4, "pointer"),
                    TimeBreakdownItem("Symmetry check", 4, "compute"),
                ),
            ),
            memory_shift=MemoryShiftSummary(0, note),
            python_line=23,
        ),
        SimulationStep(
            step_index=5,
            total_steps=5,
            phase="Verify",
            execution_status="COMPLETED",
            header_operation=header_op,
            operation_summary=f"4 pointers verified · length {len(values) + 1}",
            complexity_badge="O(1) Complete",
            ram_range=ram_range,
            nodes=n5,
            edges=build_edges(n5),
            action_text="return head",
            inspector_title="Bidirectional Chain Verified",
            inspector_body=(
                f"Both forward (.next) and backward (.prev) traversals match across all {len(values) + 1} nodes "
                "with zero element shifting."
            ),
            checklist=(
                ChecklistItem("c1", "Traverse to boundary", "completed"),
                ChecklistItem("c2", "Allocate 40B node", "completed"),
                ChecklistItem("c3", "Rewire 4 pointers", "completed"),
                ChecklistItem("c4", "Symmetry verified", "completed"),
            ),
            time_breakdown=TimeBreakdown(
                total_us=3,
                items=(TimeBreakdownItem("Return head pointer", 3, "compute"),),
            ),
            memory_shift=MemoryShiftSummary(0, note),
            python_line=25,
        ),
    )

    return SimulationTrace(
        structure="doubly_linked_list",
        title="Doubly Linked List · Bidirectional Splice",
        phases=PHASES,
        python_filename="python_engine/doubly_linked_list.py",
        python_code=PYTHON_SOURCE,
        default_step_index=3,
        steps=steps,
        metadata={
            "initial_values": values,
            "insert_value": insert_value,
            "insert_index": insert_index,
        },
    )
