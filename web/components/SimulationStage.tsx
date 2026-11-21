import React, { useState } from 'react';
import { ArrowRight, Play, SlidersHorizontal } from 'lucide-react';
import type {
  HighlightState,
  SimulationParams,
  SimulationStep,
  StructureType,
  VisualEntity,
} from '../types/traceTypes';

interface SimulationStageProps {
  structure: StructureType;
  step: SimulationStep;
  params: SimulationParams;
  onApplyParams: (nextParams: SimulationParams) => void;
  isLoading: boolean;
  errorMsg: string | null;
}

function cardStyles(highlight: HighlightState): string {
  switch (highlight) {
    case 'new':
      return 'border-sage-600 bg-sage-100 ring-2 ring-sage-500/15 dark:border-sage-400 dark:bg-sage-950 dark:ring-sage-400/20';
    case 'rewired':
      return 'border-lavender-500 bg-lavender-100 ring-2 ring-lavender-500/15 dark:border-lavender-400 dark:bg-lavender-950 dark:ring-lavender-400/20';
    case 'head':
      return 'border-slate-400 bg-white dark:border-slate-600 dark:bg-slate-900';
    case 'active':
    case 'prev':
      return 'border-amber-500 bg-white ring-2 ring-amber-500/20 dark:border-amber-400 dark:bg-slate-900';
    case 'shifted':
    case 'alloc_buffer':
      return 'border-amber-400 bg-amber-50/40 dark:border-amber-500/60 dark:bg-amber-950/30';
    case 'verified':
      return 'border-emerald-500 bg-white ring-1 ring-emerald-500/20 dark:border-emerald-500/80 dark:bg-slate-900';
    case 'retained':
      return 'border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900';
    default:
      return 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900';
  }
}

function roleStyles(highlight: HighlightState): string {
  switch (highlight) {
    case 'new':
      return 'text-sage-700 dark:text-sage-300';
    case 'rewired':
      return 'text-lavender-700 dark:text-lavender-300';
    case 'active':
    case 'prev':
    case 'shifted':
    case 'alloc_buffer':
      return 'text-amber-700 dark:text-amber-300';
    case 'verified':
      return 'text-emerald-700 dark:text-emerald-300';
    default:
      return 'text-slate-600 dark:text-slate-400';
  }
}

const LinkedNodeCard: React.FC<{
  node: VisualEntity;
  showPrev?: boolean;
}> = ({ node, showPrev = false }) => {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className={`font-mono text-[11px] font-bold tracking-wide ${roleStyles(node.highlight_state)}`}>
        {node.role_label}
      </span>

      <div
        className={`w-[172px] rounded-xl border p-3 shadow-xs transition-all duration-150 ${cardStyles(
          node.highlight_state
        )}`}
      >
        {/* Addr */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 font-mono text-[11px] dark:border-slate-800">
          <span className="text-slate-400 dark:text-slate-500">Addr</span>
          <span className="font-semibold text-slate-700 dark:text-slate-200">{node.addr}</span>
        </div>

        {/* Payload val */}
        <div className="my-2.5 flex items-baseline justify-between">
          <span className="font-mono text-xs text-slate-500 dark:text-slate-400">val</span>
          <span className="font-mono text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            {node.val ?? '—'}
          </span>
        </div>

        {/* Pointers */}
        <div className="space-y-1 border-t border-slate-100 pt-2 font-mono text-[11px] dark:border-slate-800">
          {showPrev && (
            <div className="flex items-center justify-between">
              <span className="text-slate-400 dark:text-slate-500">prev</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {node.prev_addr ?? 'NULL'}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-slate-400 dark:text-slate-500">next</span>
            <span
              className={`font-semibold ${
                node.highlight_state === 'rewired' || node.highlight_state === 'new'
                  ? 'text-sage-700 dark:text-sage-300'
                  : 'text-slate-700 dark:text-slate-200'
              }`}
            >
              {node.next_addr ?? 'NULL'}
            </span>
          </div>
        </div>

        {/* Status Footer */}
        <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-slate-100 pt-1.5 font-mono text-[11px] text-slate-500 dark:border-slate-800 dark:text-slate-400">
          <span>{node.status_tag}</span>
          <span className="shrink-0">{node.byte_size}B</span>
        </div>
      </div>
    </div>
  );
};

export const SimulationStage: React.FC<SimulationStageProps> = ({
  structure,
  step,
  params,
  onApplyParams,
  isLoading,
  errorMsg,
}) => {
  const [showControls, setShowControls] = useState(false);
  const [draftValues, setDraftValues] = useState(params.values.join(', '));
  const [draftInsertVal, setDraftInsertVal] = useState(String(params.insertValue));
  const [draftInsertIdx, setDraftInsertIdx] = useState(String(params.insertIndex));
  const [draftCap, setDraftCap] = useState(String(params.capacity));

  React.useEffect(() => {
    setDraftValues(params.values.join(', '));
    setDraftInsertVal(String(params.insertValue));
    setDraftInsertIdx(String(params.insertIndex));
    setDraftCap(String(params.capacity));
  }, [params]);

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedVals = draftValues
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isFinite(n));
    onApplyParams({
      structure,
      values: parsedVals.length > 0 ? parsedVals : params.values,
      insertValue: Number(draftInsertVal) || 0,
      insertIndex: Math.max(0, Number(draftInsertIdx) || 0),
      capacity: Math.max(parsedVals.length || 1, Number(draftCap) || params.capacity),
    });
  };

  const renderLinkedStage = (isDoubly: boolean) => {
    const primaryNodes = step.nodes.filter((n) => n.lane !== 'staging');
    const stagingNode = step.nodes.find((n) => n.lane === 'staging');

    return (
      <div className="flex flex-col items-center justify-center gap-6 py-4">
        {/* Primary Horizontal Chain */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {primaryNodes.map((node, idx) => {
            const nextPrimary = primaryNodes[idx + 1];
            const directEdge = nextPrimary
              ? step.edges.find((e) => e.from_id === node.id && e.to_id === nextPrimary.id)
              : undefined;

            const isRewiredToStaging =
              stagingNode &&
              step.edges.some((e) => e.from_id === node.id && e.to_id === stagingNode.id);

            return (
              <React.Fragment key={node.id}>
                <LinkedNodeCard node={node} showPrev={isDoubly} />
                {idx < primaryNodes.length - 1 && (
                  <div className="flex flex-col items-center gap-1 px-1">
                    {isRewiredToStaging ? (
                      <div className="flex flex-col items-center">
                        <span className="font-mono text-[10px] font-semibold text-sage-600 dark:text-sage-400">
                          spliced ↓
                        </span>
                        <div className="h-0.5 w-10 border-t-2 border-dashed border-sage-400 dark:border-sage-500" />
                      </div>
                    ) : (
                      <>
                        <span className="font-mono text-[10px] font-medium text-slate-500 dark:text-slate-400">
                          {directEdge?.label ?? 'next'}
                        </span>
                        <div className="flex items-center text-slate-400 dark:text-slate-500">
                          {isDoubly && directEdge?.bidirectional && (
                            <span className="font-mono text-xs">←</span>
                          )}
                          <div className="h-0.5 w-7 bg-current" />
                          <ArrowRight className="h-3.5 w-3.5 -ml-1" />
                        </div>
                      </>
                    )}
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Staged Spliced Node Track */}
        {stagingNode && (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-sage-300 bg-sage-50/50 px-6 py-4 dark:border-sage-800/80 dark:bg-sage-950/25">
            <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
              {step.edges
                .filter((e) => e.to_id === stagingNode.id || e.from_id === stagingNode.id)
                .map((edge) => (
                  <span
                    key={edge.id}
                    className="rounded border border-sage-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-sage-700 dark:border-sage-800 dark:bg-slate-900 dark:text-sage-300"
                  >
                    {edge.from_id === stagingNode.id ? 'new -> target' : 'prev -> new'} · {edge.label}
                  </span>
                ))}
            </div>
            <LinkedNodeCard node={stagingNode} showPrev={isDoubly} />
          </div>
        )}
      </div>
    );
  };

  const renderDynamicArrayStage = () => {
    const occupied = step.nodes.filter((n) => n.val !== null).length;
    return (
      <div className="flex flex-col items-center justify-center gap-5 py-6">
        <div className="flex flex-wrap items-center justify-center gap-3 font-mono text-xs text-slate-600 dark:text-slate-300">
          <span>
            Contiguous Buffer Base: <strong>{step.nodes[0]?.addr ?? '0x2000'}</strong>
          </span>
          <span aria-hidden="true">·</span>
          <span>
            Length: <strong>{occupied}</strong> / Capacity: <strong>{step.nodes.length}</strong>
          </span>
          <span aria-hidden="true">·</span>
          <span>Stride: 8 Bytes</span>
        </div>

        <div className="flex flex-wrap items-stretch justify-center gap-2">
          {step.nodes.map((cell) => {
            const hasShift = step.edges.some((e) => e.to_id === cell.id);
            return (
              <div key={cell.id} className="flex flex-col items-center gap-1.5">
                <div className="h-4 font-mono text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                  {hasShift ? 'shift +8B →' : ''}
                </div>
                <span className={`font-mono text-[11px] font-bold ${roleStyles(cell.highlight_state)}`}>
                  {cell.role_label}
                </span>
                <div
                  className={`flex w-[124px] flex-col justify-between rounded-xl border p-2.5 shadow-xs transition-all duration-150 ${cardStyles(
                    cell.highlight_state
                  )}`}
                >
                  <div className="border-b border-slate-100 pb-1 text-center font-mono text-[10px] text-slate-500 dark:border-slate-800 dark:text-slate-400">
                    {cell.addr}
                  </div>
                  <div className="my-3 text-center font-mono text-2xl font-bold text-slate-900 dark:text-slate-50">
                    {cell.val === null ? (
                      <span className="text-slate-300 dark:text-slate-700">∅</span>
                    ) : (
                      cell.val
                    )}
                  </div>
                  <div className="border-t border-slate-100 pt-1 text-center font-mono text-[10px] text-slate-500 dark:border-slate-800 dark:text-slate-400">
                    {cell.status_tag}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderBinaryTreeStage = () => {
    const byId = new Map(step.nodes.map((n) => [n.id, n]));
    return (
      <div className="relative mx-auto h-[370px] w-full max-w-[780px] overflow-hidden">
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {step.edges.map((edge) => {
            const fromNode = byId.get(edge.from_id);
            const toNode = edge.to_id ? byId.get(edge.to_id) : undefined;
            if (!fromNode || !toNode || fromNode.tree_x === null || toNode.tree_x === null) {
              return null;
            }
            const isRewired = edge.edge_style === 'rewired';
            return (
              <line
                key={edge.id}
                x1={fromNode.tree_x}
                y1={(fromNode.tree_y ?? 15) + 7}
                x2={toNode.tree_x}
                y2={(toNode.tree_y ?? 15) - 2}
                stroke={isRewired ? 'var(--diagram-edge-active)' : 'var(--diagram-edge)'}
                strokeWidth={isRewired ? '0.65' : '0.45'}
                strokeDasharray={isRewired ? '1.2 0.8' : undefined}
              />
            );
          })}
        </svg>

        {step.nodes.map((node) => (
          <div
            key={node.id}
            style={{
              left: `${node.tree_x ?? 50}%`,
              top: `${node.tree_y ?? 20}%`,
              transform: 'translate(-50%, -20%)',
            }}
            className="absolute"
          >
            <div
              className={`w-[126px] rounded-xl border p-2 shadow-xs transition-all ${cardStyles(
                node.highlight_state
              )}`}
            >
              <div className="flex items-center justify-between font-mono text-[10px]">
                <span className={`font-bold ${roleStyles(node.highlight_state)}`}>
                  {node.role_label}
                </span>
                <span className="text-slate-400">{node.addr}</span>
              </div>
              <div className="my-1 text-center font-mono text-xl font-bold text-slate-900 dark:text-slate-50">
                {node.val}
              </div>
              <div className="truncate text-center font-mono text-[10px] text-slate-500 dark:text-slate-400">
                {node.status_tag}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-1 flex-col justify-between">
      {/* Operation Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="font-display text-sm font-bold tracking-tight text-slate-900 sm:text-base dark:text-slate-50">
            {step.header_operation}
          </h1>
          <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">
            ·
          </span>
          <span className="font-mono text-xs font-medium text-slate-600 dark:text-slate-300">
            Step {step.step_index} of {step.total_steps}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
          <code className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-sage-300">
            {step.operation_summary}
          </code>
          <span className="rounded-md border border-sage-200 bg-sage-50 px-2 py-1 text-[11px] font-semibold text-sage-800 dark:border-sage-800/80 dark:bg-sage-950/60 dark:text-sage-300">
            {step.complexity_badge}
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            {step.ram_range}
          </span>
          <button
            type="button"
            onClick={() => setShowControls((v) => !v)}
            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <SlidersHorizontal className="h-3 w-3" aria-hidden="true" />
            <span>Inputs</span>
          </button>
        </div>
      </div>

      {/* Collapsible Parameter Customizer */}
      {showControls && (
        <form
          onSubmit={handleApply}
          className="flex flex-wrap items-end gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs sm:px-5 dark:border-slate-800 dark:bg-slate-950"
        >
          <label className="flex flex-col gap-1">
            <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
              Initial Values (comma-separated)
            </span>
            <input
              type="text"
              value={draftValues}
              onChange={(e) => setDraftValues(e.target.value)}
              className="w-44 rounded-md border border-slate-300 bg-white px-2.5 py-1 font-mono text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
              Insert Value
            </span>
            <input
              type="number"
              value={draftInsertVal}
              onChange={(e) => setDraftInsertVal(e.target.value)}
              className="w-24 rounded-md border border-slate-300 bg-white px-2.5 py-1 font-mono text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </label>
          {structure !== 'binary_tree' && (
            <label className="flex flex-col gap-1">
              <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                Insert Index
              </span>
              <input
                type="number"
                min={0}
                value={draftInsertIdx}
                onChange={(e) => setDraftInsertIdx(e.target.value)}
                className="w-20 rounded-md border border-slate-300 bg-white px-2.5 py-1 font-mono text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </label>
          )}
          {structure === 'dynamic_array' && (
            <label className="flex flex-col gap-1">
              <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                Capacity
              </span>
              <input
                type="number"
                min={1}
                value={draftCap}
                onChange={(e) => setDraftCap(e.target.value)}
                className="w-20 rounded-md border border-slate-300 bg-white px-2.5 py-1 font-mono text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </label>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="algo-primary inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium disabled:opacity-50"
          >
            <Play className="h-3 w-3" aria-hidden="true" />
            <span>{isLoading ? 'Running Python...' : 'Run Python Trace'}</span>
          </button>
          {errorMsg && (
            <span className="font-mono text-xs text-rose-600 dark:text-rose-400">
              {errorMsg}
            </span>
          )}
        </form>
      )}

      {/* Dot-Grid Simulation Surface */}
      <div className="algo-dot-grid relative flex min-h-[390px] flex-1 items-center justify-center p-5 sm:p-8">
        {structure === 'singly_linked_list' && renderLinkedStage(false)}
        {structure === 'doubly_linked_list' && renderLinkedStage(true)}
        {structure === 'dynamic_array' && renderDynamicArrayStage()}
        {structure === 'binary_tree' && renderBinaryTreeStage()}
      </div>
    </div>
  );
};
