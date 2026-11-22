"""Typed step-trace schema for AlgoFrame deterministic DSA simulations."""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Any, Literal

StructureType = Literal[
    "singly_linked_list",
    "doubly_linked_list",
    "dynamic_array",
    "binary_tree",
    "stack",
    "queue",
    "hash_table",
    "graph",
]

HighlightState = Literal[
    "default",
    "head",
    "active",
    "prev",
    "new",
    "rewired",
    "shifted",
    "retained",
    "verified",
    "alloc_buffer",
]

ChecklistStatus = Literal["completed", "active", "pending"]


@dataclass(frozen=True, slots=True)
class VisualEntity:
    """Single node, array cell, or tree vertex rendered on the simulation canvas."""

    id: str
    role_label: str
    addr: str
    val: int | str | None
    next_addr: str | None
    status_tag: str
    highlight_state: HighlightState = "default"
    prev_addr: str | None = None
    left_addr: str | None = None
    right_addr: str | None = None
    index: int | None = None
    byte_size: int = 32
    lane: Literal["primary", "staging", "secondary"] = "primary"
    tree_x: float | None = None
    tree_y: float | None = None


@dataclass(frozen=True, slots=True)
class PointerEdge:
    """Directed or bidirectional pointer connector between two visual entities."""

    id: str
    from_id: str
    to_id: str | None
    label: str
    edge_style: Literal["default", "rewired", "new_link", "downstream", "prev_link", "shift"] = "default"
    bidirectional: bool = False


@dataclass(frozen=True, slots=True)
class ChecklistItem:
    """Sub-step progress indicator in the Right Inspector panel."""

    id: str
    label: str
    status: ChecklistStatus


@dataclass(frozen=True, slots=True)
class TimeBreakdownItem:
    """Single microsecond cost row inside WHERE THE TIME WENT."""

    label: str
    duration_us: int
    category: Literal["alloc", "pointer", "memory", "compute"] = "compute"


@dataclass(frozen=True, slots=True)
class TimeBreakdown:
    """Execution time breakdown card data."""

    total_us: int
    items: tuple[TimeBreakdownItem, ...]


@dataclass(frozen=True, slots=True)
class MemoryShiftSummary:
    """Memory shift comparison summary card data."""

    shifted_elements: int
    comparison_note: str


@dataclass(frozen=True, slots=True)
class SimulationStep:
    """One deterministic step of an AlgoFrame DSA operation trace."""

    step_index: int
    total_steps: int
    phase: str
    execution_status: str
    header_operation: str
    operation_summary: str
    complexity_badge: str
    ram_range: str
    nodes: tuple[VisualEntity, ...]
    edges: tuple[PointerEdge, ...]
    action_text: str
    inspector_title: str
    inspector_body: str
    checklist: tuple[ChecklistItem, ...]
    time_breakdown: TimeBreakdown
    memory_shift: MemoryShiftSummary
    python_line: int
    variables: dict[str, Any] = field(default_factory=dict)

    def validate(self) -> None:
        if self.step_index < 1 or self.step_index > self.total_steps:
            raise ValueError(
                f"step_index {self.step_index} out of bounds for total_steps={self.total_steps}"
            )
        if self.python_line < 1:
            raise ValueError(f"python_line must be >= 1, got {self.python_line}")
        computed_sum = sum(item.duration_us for item in self.time_breakdown.items)
        if computed_sum != self.time_breakdown.total_us:
            raise ValueError(
                f"time_breakdown.total_us ({self.time_breakdown.total_us}) != sum of items ({computed_sum})"
            )
        if self.memory_shift.shifted_elements < 0:
            raise ValueError("shifted_elements must be non-negative")


@dataclass(frozen=True, slots=True)
class ComplexityAnalysis:
    best_time: str
    average_time: str
    worst_time: str
    auxiliary_space: str
    storage_space: str
    time_note: str
    space_note: str
    memory_note: str
    executed_lines: int
    initial_size: int
    final_size: int
    peak_model_slots: int


@dataclass(frozen=True, slots=True)
class SimulationTrace:
    """Full deterministic simulation trace plus synchronized Python source code."""

    structure: StructureType
    title: str
    phases: tuple[str, ...]
    python_filename: str
    python_code: str
    default_step_index: int
    steps: tuple[SimulationStep, ...]
    metadata: dict[str, Any] = field(default_factory=dict)
    analysis: ComplexityAnalysis | None = None

    def validate(self) -> None:
        if not self.steps:
            raise ValueError("SimulationTrace must contain at least one step")
        total = len(self.steps)
        line_count = len(self.python_code.splitlines())
        for idx, step in enumerate(self.steps, start=1):
            if step.step_index != idx:
                raise ValueError(f"Expected step_index={idx}, got {step.step_index}")
            if step.total_steps != total:
                raise ValueError(f"Expected total_steps={total}, got {step.total_steps}")
            if step.phase not in self.phases:
                raise ValueError(f"Step phase '{step.phase}' not in trace phases {self.phases}")
            if step.python_line > line_count:
                raise ValueError(
                    f"Step {idx} python_line={step.python_line} exceeds python_code lines ({line_count})"
                )
            step.validate()

    def to_dict(self) -> dict[str, Any]:
        self.validate()
        return asdict(self)
