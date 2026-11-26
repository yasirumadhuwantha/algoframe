import { useState } from 'react';
import { ArrowRight, MousePointerClick, X } from 'lucide-react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import type { SimulationStep, SimulationTrace, VisualEntity } from '../types/traceTypes';
import { LinkedNodeCard } from './LinkedNodeCard';

const SPRING = { type: 'spring' as const, stiffness: 360, damping: 28 };

export function LearningCanvas({ trace, step }: { trace: SimulationTrace; step: SimulationStep }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const kind = trace.structure;
  const selectedNode = step.nodes.find(n => n.id === selectedId) ?? null;

  const nodeTone = (node: VisualEntity) => {
    const selectedRing = node.id === selectedId ? 'ring-2 ring-cyan-500 ring-offset-2 dark:ring-offset-slate-950' : '';
    if (node.highlight_state === 'active') {
      return `algo-node-active border-sage-600 bg-sage-100 text-slate-950 dark:border-sage-400 dark:bg-sage-500 dark:text-slate-950 ${selectedRing}`;
    }
    if (node.highlight_state === 'verified') {
      return `algo-node-verified border-emerald-500 bg-emerald-50 text-emerald-950 dark:border-emerald-500 dark:bg-emerald-900 dark:text-emerald-50 ${selectedRing}`;
    }
    if (node.val !== null && node.val !== undefined) {
      return `border-sage-300 bg-sage-100 text-slate-900 dark:border-sage-500 dark:bg-[#ea6b56] dark:text-slate-950 font-bold ${selectedRing}`;
    }
    return `border-slate-200 bg-white text-slate-400 dark:border-slate-800 dark:bg-[#1f232b] dark:text-slate-400 ${selectedRing}`;
  };
  const nodeStyle = (node: VisualEntity) => `algo-node cursor-pointer rounded-lg border px-3 py-3 shadow-xs ${nodeTone(node)}`;
  const toggleSelect = (id: string) => setSelectedId(prev => (prev === id ? null : id));
  const cell = (node: VisualEntity) => (
    <button type="button" onClick={() => toggleSelect(node.id)} className={`${nodeStyle(node)} min-w-[92px] text-center`} title="Click to inspect this slot">
      <div className="font-mono text-[10px] font-semibold opacity-75">{node.role_label}</div>
      <div className="my-2 font-mono text-xl font-bold">{node.val ?? <span className="opacity-60">None</span>}</div>
      <div className="font-mono text-[10px] opacity-60">{node.addr}</div>
    </button>
  );

  return (
    <MotionConfig reducedMotion="user">
    <section aria-label="Algorithm visualization" className="algo-panel-enter min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <h2 className="font-display text-sm font-bold">{trace.title}</h2>
        <span className="flex items-center gap-1.5 rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 font-mono text-[10px] font-semibold text-cyan-700 dark:border-cyan-800/80 dark:bg-cyan-950/70 dark:text-cyan-300">
          {step.execution_status === 'EXECUTING' && (
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-500 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-600 dark:bg-cyan-400" />
            </span>
          )}
          {step.execution_status}
        </span>
      </div>
      <div className="algo-dot-grid max-h-[480px] min-h-[330px] overflow-auto p-5" aria-label={`${kind} state ${step.execution_status === 'READY' ? 'at function entry on' : 'after'} line ${step.python_line}`}>
        {step.nodes.length === 0 ? <div className="flex min-h-[280px] items-center justify-center font-mono text-sm text-slate-600 dark:text-slate-300">Empty structure · no live nodes</div>
          : kind === 'graph' ? (
            <div className="relative mx-auto" style={{ width: Math.max(360, step.nodes.length * 26), height: Math.max(360, step.nodes.length * 26) }}>
              <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" aria-label="Undirected graph edges">
                {step.edges.map(edge => {
                  const from = step.nodes.find(node => node.id === edge.from_id), to = step.nodes.find(node => node.id === edge.to_id);
                  return from && to ? <line key={edge.id} x1={from.tree_x!} y1={from.tree_y!} x2={to.tree_x!} y2={to.tree_y!} stroke="var(--diagram-edge)" strokeWidth="0.5" /> : null;
                })}
              </svg>
              {step.nodes.map(node => <div key={node.id} data-vertex={node.val} className="absolute -translate-x-1/2 -translate-y-1/2 text-center" style={{ left: `${node.tree_x}%`, top: `${node.tree_y}%` }}>
                <div className="relative">
                  {node.highlight_state === 'active' && <span className="pointer-events-none absolute inset-0 -m-1 rounded-full border-2 border-sage-500 opacity-60 animate-ping" />}
                  <div className={`algo-node flex h-16 w-16 items-center justify-center rounded-full border p-1 shadow-xs ${nodeTone(node)}`}><strong className={`font-mono ${String(node.val).length > 5 ? 'text-[10px]' : 'text-sm'}`}>{node.val}</strong></div>
                </div>
                <span className="mt-1 block rounded bg-white/90 px-1 font-mono text-[9px] text-slate-600 dark:bg-slate-900/90 dark:text-slate-200">{node.role_label}</span>
              </div>)}
            </div>
          ) : kind === 'binary_tree' ? (
            <div className="relative mx-auto" style={{ minWidth: Math.max(440, step.nodes.length * 64), height: Math.max(310, new Set(step.nodes.map(n => n.tree_y)).size * 90) }}>
              <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                {step.edges.map(edge => {
                  const from = step.nodes.find(n => n.id === edge.from_id), to = step.nodes.find(n => n.id === edge.to_id);
                  return from && to ? <line key={edge.id} x1={from.tree_x!} y1={from.tree_y! + 8} x2={to.tree_x!} y2={to.tree_y!} stroke="var(--diagram-edge)" strokeWidth="0.4" /> : null;
                })}
              </svg>
              {step.nodes.map(node => <div key={node.id} className="absolute w-[86px]" style={{ left: `${node.tree_x}%`, top: `${node.tree_y}%`, transform: 'translate(-50%, 0)' }}>
                <div className={`${nodeStyle(node)} text-center`}><span className="block font-mono text-[9px] text-slate-600 dark:text-slate-300">{node.role_label}</span><strong className="font-mono text-lg">{node.val}</strong></div>
              </div>)}
            </div>
          ) : kind === 'hash_table' ? (
            <div className="mx-auto max-w-lg space-y-2">
              {step.nodes.map(node => <div key={node.id} className="flex items-center gap-3"><span className="w-7 shrink-0 text-right font-mono text-xs text-slate-600 dark:text-slate-300">{node.index}</span><ArrowRight className="h-3 w-3 shrink-0 text-slate-500" aria-hidden="true" /><div className={`${nodeStyle(node)} min-w-0 flex-1 break-words font-mono text-xs`}>{node.val ?? <span className="text-slate-500 dark:text-slate-400">Empty bucket</span>}</div></div>)}
            </div>
          ) : kind.includes('linked_list') ? (
            <div className="flex min-h-[280px] w-max min-w-full items-center justify-center gap-3">
              <AnimatePresence mode="popLayout">
                {step.nodes.map((node, i) => (
                  <motion.div
                    key={node.id}
                    layout
                    transition={SPRING}
                    initial={{ opacity: 0, scale: 0.9, y: -6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    className="flex items-center gap-3"
                  >
                    <LinkedNodeCard node={node} doubly={kind === 'doubly_linked_list'} />
                    {i + 1 < step.nodes.length && <span className="font-mono text-lg text-slate-600 dark:text-slate-300" aria-label={node.next_addr === step.nodes[i + 1].addr ? 'Reference' : 'Not linked'}>{node.next_addr !== step.nodes[i + 1].addr ? '·' : kind === 'doubly_linked_list' && step.nodes[i + 1].prev_addr === node.addr ? '⇄' : '→'}</span>}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : kind === 'stack' ? (
            <div className="mx-auto flex w-[190px] flex-col-reverse gap-2 border-x-2 border-b-2 border-slate-600 p-2 dark:border-slate-500">
              <AnimatePresence mode="popLayout">
                {step.nodes.map(node => (
                  <motion.div
                    key={node.id}
                    layout
                    transition={SPRING}
                    initial={{ opacity: 0, y: -14, scale: 0.94 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -14, scale: 0.9 }}
                    className={`${nodeStyle(node)} flex items-center justify-between py-2`}
                  >
                    <span className="font-mono text-[10px] opacity-75">{node.role_label}</span>
                    <strong className="font-mono">{node.val ?? '∅'}</strong>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex min-h-[280px] flex-wrap content-center items-center justify-center gap-2">
              <AnimatePresence mode="popLayout">
                {step.nodes.map(node => (
                  <motion.div
                    key={node.id}
                    layout
                    transition={SPRING}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                  >
                    {cell(node)}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
      </div>
      <div className="space-y-3 border-t border-slate-200 p-4 dark:border-slate-800">
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-950/60">
          <p className="break-words text-xs leading-relaxed text-slate-800 dark:text-slate-100">
            <span className="mr-1.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-sage-600 dark:text-sage-400">
              {step.execution_status === 'READY' ? `Entry · Line ${step.python_line}` : `After Line ${step.python_line}`}
            </span>
            {step.action_text}
          </p>
        </div>
        {selectedNode ? (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs text-cyan-900 dark:border-cyan-800/80 dark:bg-cyan-950/50 dark:text-cyan-200">
            <span className="font-mono text-[11px]">
              <strong>Inspecting:</strong> value = {selectedNode.val ?? 'None'} · role = {selectedNode.role_label} · addr = {selectedNode.addr}
            </span>
            <button type="button" onClick={() => setSelectedId(null)} className="rounded p-0.5 hover:bg-cyan-100 dark:hover:bg-cyan-900" aria-label="Clear selection">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : step.nodes.length > 0 && (kind === 'dynamic_array' || kind === 'queue' || kind === 'stack') ? (
          <p className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <MousePointerClick className="h-3.5 w-3.5" aria-hidden="true" />
            Tip: Click any slot above to inspect its role and simulated memory address.
          </p>
        ) : null}
        {step.variables && <dl className="flex flex-wrap gap-2" aria-label="Python local variables">{Object.entries(step.variables).map(([name, value]) => <div key={name} className="max-w-full break-words rounded border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-[10px] dark:border-slate-700 dark:bg-slate-950"><dt className="inline text-slate-600 dark:text-slate-300">{name} = </dt><dd className="inline font-medium">{value === null ? 'None' : typeof value === 'boolean' ? (value ? 'True' : 'False') : JSON.stringify(value)}</dd></div>)}</dl>}
      </div>
    </section>
    </MotionConfig>
  );
}
