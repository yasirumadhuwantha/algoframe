export type StructureType =
  | 'singly_linked_list'
  | 'doubly_linked_list'
  | 'dynamic_array'
  | 'binary_tree'
  | 'stack'
  | 'queue'
  | 'hash_table';

export type HighlightState =
  | 'default'
  | 'head'
  | 'active'
  | 'prev'
  | 'new'
  | 'rewired'
  | 'shifted'
  | 'retained'
  | 'verified'
  | 'alloc_buffer';

export type ChecklistStatus = 'completed' | 'active' | 'pending';

export interface VisualEntity {
  id: string;
  role_label: string;
  addr: string;
  val: number | string | null;
  next_addr: string | null;
  status_tag: string;
  highlight_state: HighlightState;
  prev_addr: string | null;
  left_addr: string | null;
  right_addr: string | null;
  index: number | null;
  byte_size: number;
  lane: 'primary' | 'staging' | 'secondary';
  tree_x: number | null;
  tree_y: number | null;
}

export interface PointerEdge {
  id: string;
  from_id: string;
  to_id: string | null;
  label: string;
  edge_style: 'default' | 'rewired' | 'new_link' | 'downstream' | 'prev_link' | 'shift';
  bidirectional: boolean;
}

export interface ChecklistItem {
  id: string;
  label: string;
  status: ChecklistStatus;
}

export interface TimeBreakdownItem {
  label: string;
  duration_us: number;
  category: 'alloc' | 'pointer' | 'memory' | 'compute';
}

export interface TimeBreakdown {
  total_us: number;
  items: TimeBreakdownItem[];
}

export interface MemoryShiftSummary {
  shifted_elements: number;
  comparison_note: string;
}

export interface SimulationStep {
  step_index: number;
  total_steps: number;
  phase: string;
  execution_status: string;
  header_operation: string;
  operation_summary: string;
  complexity_badge: string;
  ram_range: string;
  nodes: VisualEntity[];
  edges: PointerEdge[];
  action_text: string;
  inspector_title: string;
  inspector_body: string;
  checklist: ChecklistItem[];
  time_breakdown: TimeBreakdown;
  memory_shift: MemoryShiftSummary;
  python_line: number;
  variables?: Record<string, string | number | boolean | null | number[]>;
}

export interface SimulationTrace {
  structure: StructureType;
  title: string;
  phases: string[];
  python_filename: string;
  python_code: string;
  default_step_index: number;
  steps: SimulationStep[];
  metadata: Record<string, unknown>;
  analysis?: ComplexityAnalysis | null;
}

export interface ComplexityAnalysis {
  best_time: string;
  average_time: string;
  worst_time: string;
  auxiliary_space: string;
  storage_space: string;
  time_note: string;
  space_note: string;
  memory_note: string;
  executed_lines: number;
  initial_size: number;
  final_size: number;
  peak_model_slots: number;
}

export interface SimulationParams {
  structure: StructureType;
  values: number[];
  insertValue: number;
  insertIndex: number;
  capacity: number;
  operation?: string;
  payloadValue?: number;
  frontIndex?: number;
}
