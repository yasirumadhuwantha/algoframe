"""Deterministic Python 3.11+ trace generator for Dynamic Array insert_at with shift/resize."""

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

PYTHON_SOURCE = """class DynamicArray:
    def __init__(self, capacity: int = 4) -> None:
        self.capacity = capacity
        self.length = 0
        self.data: list[int | None] = [None] * capacity

    def insert_at(self, index: int, val: int) -> None:
        if index < 0 or index > self.length:
            raise ValueError("index out of bounds")

        if self.length == self.capacity:
            new_cap = self.capacity * 2
            new_buf: list[int | None] = [None] * new_cap
            for i in range(self.length):
                new_buf[i] = self.data[i]
            self.data = new_buf
            self.capacity = new_cap

        for i in range(self.length - 1, index - 1, -1):
            self.data[i + 1] = self.data[i]

        self.data[index] = val
        self.length += 1"""


def _cell_addr(base: int, idx: int) -> str:
    return f"0x{base + idx * 8:04X}"


def generate_dynamic_array_insert_trace(
    initial_values: list[int] | None = None,
    capacity: int = 6,
    insert_value: int = 25,
    insert_index: int = 1,
) -> SimulationTrace:
    """Generate a deterministic 5-step trace for Dynamic Array insert_at(index, val)."""
    values = list(initial_values) if initial_values is not None else [10, 20, 30, 40]
    if capacity < len(values) or capacity < 1:
        raise ValueError("capacity must be >= len(initial_values) and >= 1")
    if insert_index < 0 or insert_index > len(values):
        raise ValueError(
            f"insert_index={insert_index} out of bounds for array of length {len(values)}"
        )

    needs_resize = len(values) == capacity
    old_base = 0x2000
    new_base = 0x2400 if needs_resize else old_base
    new_cap = capacity * 2 if needs_resize else capacity
    shift_count = len(values) - insert_index
    total_moved = (len(values) + shift_count) if needs_resize else shift_count

    phases: tuple[str, ...] = (
        ("Bounds Check", "Realloc", "Shift Right", "Write Slot", "Verify")
        if needs_resize
        else ("Bounds Check", "Shift Right", "Write Slot", "Verify")
    )

    ram_end = new_base + new_cap * 8
    ram_range = f"RAM: 0x{old_base:04X} - 0x{ram_end:04X}"
    header_op = (
        "Dynamic Array · insert_at (2x Realloc + Shift)"
        if needs_resize
        else "Dynamic Array · insert_at (Contiguous Shift)"
    )

    def build_cells(
        buf: list[int | None],
        cap: int,
        base: int,
        *,
        mode: str,
    ) -> tuple[VisualEntity, ...]:
        entities: list[VisualEntity] = []
        for idx in range(cap):
            val = buf[idx]
            addr = _cell_addr(base, idx)
            hl = "default"
            status = "8 Bytes · empty" if val is None else "8 Bytes · occupied"

            if mode == "bounds":
                if idx == insert_index:
                    hl = "active"
                    status = "target slot"
                elif val is not None:
                    hl = "retained"
            elif mode == "realloc":
                if val is not None:
                    hl = "alloc_buffer"
                    status = "copied to 2x buffer"
                else:
                    hl = "new"
                    status = "reserved growth"
            elif mode == "shift":
                if idx == insert_index:
                    hl = "active"
                    status = "vacated slot"
                elif insert_index < idx <= len(values):
                    hl = "shifted"
                    status = f"shifted from [{idx - 1}]"
                elif val is not None:
                    hl = "retained"
            elif mode == "write":
                if idx == insert_index:
                    hl = "new"
                    status = "written in-place"
                elif idx > insert_index and val is not None:
                    hl = "shifted"
                    status = "shifted +1"
                elif val is not None:
                    hl = "retained"
            elif mode == "verify":
                if idx == insert_index:
                    hl = "verified"
                    status = "Inserted · O(1) read"
                elif val is not None:
                    hl = "verified"
                    status = "Contiguous · 8B"

            entities.append(
                VisualEntity(
                    id=f"cell_{idx}",
                    role_label=f"IDX · [{idx}]" if idx != insert_index or mode == "bounds" else f"TARGET · [{idx}]",
                    addr=addr,
                    val=val,
                    next_addr=_cell_addr(base, idx + 1) if idx + 1 < cap else None,
                    status_tag=status,
                    highlight_state=hl,  # type: ignore[arg-type]
                    index=idx,
                    byte_size=8,
                    lane="primary",
                )
            )
        return tuple(entities)

    initial_buf: list[int | None] = list(values) + [None] * (capacity - len(values))
    resized_buf: list[int | None] = list(values) + [None] * (new_cap - len(values))

    shifted_buf: list[int | None] = list(resized_buf)
    for i in range(len(values) - 1, insert_index - 1, -1):
        shifted_buf[i + 1] = shifted_buf[i]
    shifted_buf[insert_index] = None

    written_buf: list[int | None] = list(shifted_buf)
    written_buf[insert_index] = insert_value

    linked_note = (
        f"Singly Linked List insertion at index [{insert_index}] shifts 0 elements (O(1) pointer rewire once positioned)."
    )

    s1_cells = build_cells(initial_buf, capacity, old_base, mode="bounds")

    if needs_resize:
        s2_cells = build_cells(resized_buf, new_cap, new_base, mode="realloc")
        s2_step = SimulationStep(
            step_index=2,
            total_steps=5,
            phase="Realloc",
            execution_status="REALLOCATING",
            header_operation=header_op,
            operation_summary=f"realloc 2x: cap {capacity} -> {new_cap} ({_cell_addr(new_base, 0)})",
            complexity_badge="O(n) Realloc",
            ram_range=ram_range,
            nodes=s2_cells,
            edges=(),
            action_text=f"new_buf = [None] * {new_cap}; copy {len(values)} elements -> 0x{new_base:04X}",
            inspector_title="Geometric Capacity Doubling (2x)",
            inspector_body=(
                f"Buffer at 0x{old_base:04X} reached full capacity ({len(values)}/{capacity}). "
                f"Allocate a new contiguous {new_cap}-slot block at 0x{new_base:04X} and copy all {len(values)} elements before shifting."
            ),
            checklist=(
                ChecklistItem("c1", f"Detect length == capacity ({capacity})", "completed"),
                ChecklistItem("c2", f"Allocate 2x contiguous buffer ({new_cap} slots)", "active"),
                ChecklistItem("c3", f"Shift suffix [{insert_index}..{len(values) - 1}] right", "pending"),
                ChecklistItem("c4", f"Write arr[{insert_index}] = {insert_value}", "pending"),
            ),
            time_breakdown=TimeBreakdown(
                total_us=14 + len(values) * 3,
                items=(
                    TimeBreakdownItem(f"Buffer realloc ({new_cap * 8}B)", 14, "alloc"),
                    TimeBreakdownItem(f"Sequential memcpy ({len(values)} items)", len(values) * 3, "memory"),
                ),
            ),
            memory_shift=MemoryShiftSummary(
                shifted_elements=len(values),
                comparison_note=linked_note,
            ),
            python_line=15,
        )
    else:
        s2_cells = build_cells(initial_buf, capacity, old_base, mode="bounds")
        s2_step = SimulationStep(
            step_index=2,
            total_steps=5,
            phase="Bounds Check",
            execution_status="CAPACITY OK",
            header_operation=header_op,
            operation_summary=f"capacity check: len={len(values)} < cap={capacity} (in-place)",
            complexity_badge="Space Ready",
            ram_range=ram_range,
            nodes=s2_cells,
            edges=(),
            action_text=f"assert self.length ({len(values)}) < self.capacity ({capacity})",
            inspector_title="Contiguous Slack Capacity Check",
            inspector_body=(
                f"Because length ({len(values)}) is strictly below capacity ({capacity}), no heap reallocation is needed. "
                f"However, contiguous layout still forces {shift_count} suffix element(s) to shift right by +8 bytes."
            ),
            checklist=(
                ChecklistItem("c1", f"Validate index [{insert_index}] in [0, {len(values)}]", "completed"),
                ChecklistItem("c2", f"Spare capacity confirmed ({capacity - len(values)} free)", "active"),
                ChecklistItem("c3", f"Shift {shift_count} suffix elements right", "pending"),
                ChecklistItem("c4", f"Write arr[{insert_index}] = {insert_value}", "pending"),
            ),
            time_breakdown=TimeBreakdown(
                total_us=4,
                items=(
                    TimeBreakdownItem("Capacity comparison", 2, "compute"),
                    TimeBreakdownItem("Address offset calculation", 2, "memory"),
                ),
            ),
            memory_shift=MemoryShiftSummary(
                shifted_elements=0,
                comparison_note=linked_note,
            ),
            python_line=11,
        )

    s3_cells = build_cells(shifted_buf, new_cap, new_base, mode="shift")
    shift_edges = tuple(
        PointerEdge(
            id=f"shift_{i}_{i + 1}",
            from_id=f"cell_{i}",
            to_id=f"cell_{i + 1}",
            label="+8B",
            edge_style="shift",
        )
        for i in range(insert_index, len(values))
    )

    s4_cells = build_cells(written_buf, new_cap, new_base, mode="write")
    s5_cells = build_cells(written_buf, new_cap, new_base, mode="verify")

    steps = (
        SimulationStep(
            step_index=1,
            total_steps=5,
            phase="Bounds Check",
            execution_status="CHECKING",
            header_operation=header_op,
            operation_summary=f"insert_at(index={insert_index}, val={insert_value}) · len={len(values)}/{capacity}",
            complexity_badge="O(1) Address",
            ram_range=ram_range,
            nodes=s1_cells,
            edges=(),
            action_text=f"target_addr = base + ({insert_index} * 8) -> {_cell_addr(old_base, insert_index)}",
            inspector_title="Contiguous Index Addressing",
            inspector_body=(
                f"Arrays compute target slot {_cell_addr(old_base, insert_index)} in O(1) via base + idx * stride. "
                f"To preserve contiguous order, elements at indices [{insert_index}..{len(values) - 1}] must vacate."
            ),
            checklist=(
                ChecklistItem("c1", f"Verify 0 <= {insert_index} <= {len(values)}", "active"),
                ChecklistItem("c2", "Inspect spare capacity", "pending"),
                ChecklistItem("c3", f"Shift {shift_count} trailing elements", "pending"),
                ChecklistItem("c4", f"Store {insert_value} at [{insert_index}]", "pending"),
            ),
            time_breakdown=TimeBreakdown(
                total_us=3,
                items=(
                    TimeBreakdownItem("Bounds guard check", 1, "compute"),
                    TimeBreakdownItem("Base + stride arithmetic", 2, "compute"),
                ),
            ),
            memory_shift=MemoryShiftSummary(
                shifted_elements=0,
                comparison_note=linked_note,
            ),
            python_line=8,
        ),
        s2_step,
        SimulationStep(
            step_index=3,
            total_steps=5,
            phase="Shift Right",
            execution_status="SHIFTING",
            header_operation=header_op,
            operation_summary=f"memmove: shift {shift_count} element(s) right by +1 slot",
            complexity_badge="O(n) Shift",
            ram_range=ram_range,
            nodes=s3_cells,
            edges=shift_edges,
            action_text=f"for i in range({len(values) - 1}, {insert_index - 1}, -1): data[i + 1] = data[i]",
            inspector_title="Backward Suffix Memory Shift",
            inspector_body=(
                f"Iterate backwards from index [{len(values) - 1}] down to [{insert_index}] so values are never overwritten. "
                f"This moves {shift_count} element(s) across contiguous L1-cached slots."
            ),
            checklist=(
                ChecklistItem("c1", "Bounds & capacity prepared", "completed"),
                ChecklistItem("c2", f"Shift {shift_count} suffix elements right", "active"),
                ChecklistItem("c3", f"Write {insert_value} into vacated [{insert_index}]", "pending"),
                ChecklistItem("c4", "Increment length counter", "pending"),
            ),
            time_breakdown=TimeBreakdown(
                total_us=max(4, shift_count * 4 + 2),
                items=(
                    TimeBreakdownItem(f"Cache-line shift ({shift_count} writes)", max(2, shift_count * 4), "memory"),
                    TimeBreakdownItem("Reverse loop index step", 2, "compute"),
                ),
            ),
            memory_shift=MemoryShiftSummary(
                shifted_elements=shift_count,
                comparison_note=linked_note,
            ),
            python_line=20,
        ),
        SimulationStep(
            step_index=4,
            total_steps=5,
            phase="Write Slot",
            execution_status="EXECUTING",
            header_operation=header_op,
            operation_summary=f"data[{insert_index}] = {insert_value} @ {_cell_addr(new_base, insert_index)}",
            complexity_badge="O(1) Write",
            ram_range=ram_range,
            nodes=s4_cells,
            edges=(),
            action_text=f"self.data[{insert_index}] = {insert_value}; self.length += 1",
            inspector_title="Direct Slot Assignment",
            inspector_body=(
                f"With slot [{insert_index}] vacated at {_cell_addr(new_base, insert_index)}, write {insert_value} "
                f"directly in a single L1-cached store and increment length to {len(values) + 1}."
            ),
            checklist=(
                ChecklistItem("c1", "Bounds & capacity prepared", "completed"),
                ChecklistItem("c2", f"Shifted {shift_count} elements right", "completed"),
                ChecklistItem("c3", f"Write {insert_value} at [{insert_index}]", "active"),
                ChecklistItem("c4", "Verify contiguous invariant", "pending"),
            ),
            time_breakdown=TimeBreakdown(
                total_us=5,
                items=(
                    TimeBreakdownItem("L1 cache store (8 Bytes)", 3, "memory"),
                    TimeBreakdownItem("Length counter increment", 2, "compute"),
                ),
            ),
            memory_shift=MemoryShiftSummary(
                shifted_elements=total_moved,
                comparison_note=linked_note,
            ),
            python_line=22,
        ),
        SimulationStep(
            step_index=5,
            total_steps=5,
            phase="Verify",
            execution_status="COMPLETED",
            header_operation=header_op,
            operation_summary=f"length: {len(values) + 1}/{new_cap} · O(1) random access preserved",
            complexity_badge="O(n) Total",
            ram_range=ram_range,
            nodes=s5_cells,
            edges=(),
            action_text=f"assert len == {len(values) + 1} and data[{insert_index}] == {insert_value}",
            inspector_title="Contiguous Array Verified",
            inspector_body=(
                f"Insertion complete: {total_moved} total element moves occurred ({shift_count} suffix shift"
                f"{f' + {len(values)} realloc copies' if needs_resize else ''}). "
                "Contiguous addressing keeps subsequent reads at O(1)."
            ),
            checklist=(
                ChecklistItem("c1", "Bounds & capacity verified", "completed"),
                ChecklistItem("c2", f"Memory shifts completed ({total_moved} moves)", "completed"),
                ChecklistItem("c3", f"Slot [{insert_index}] stores {insert_value}", "completed"),
                ChecklistItem("c4", f"Array length = {len(values) + 1}/{new_cap}", "completed"),
            ),
            time_breakdown=TimeBreakdown(
                total_us=3,
                items=(
                    TimeBreakdownItem("Contiguous stride check", 3, "compute"),
                ),
            ),
            memory_shift=MemoryShiftSummary(
                shifted_elements=total_moved,
                comparison_note=linked_note,
            ),
            python_line=23,
        ),
    )

    return SimulationTrace(
        structure="dynamic_array",
        title="Dynamic Array · insert_at",
        phases=phases,
        python_filename="python_engine/dynamic_array.py",
        python_code=PYTHON_SOURCE,
        default_step_index=3,
        steps=steps,
        metadata={
            "initial_values": values,
            "capacity": capacity,
            "insert_value": insert_value,
            "insert_index": insert_index,
            "needs_resize": needs_resize,
        },
    )
