import { ArrowRight } from 'lucide-react';
import type { SimulationStep, SimulationTrace, VisualEntity } from '../types/traceTypes';
import { LinkedNodeCard } from './LinkedNodeCard';

export function LearningCanvas({ trace, step }: { trace: SimulationTrace; step: SimulationStep }) {
  const kind = trace.structure;
  const nodeTone = (node: VisualEntity) => node.highlight_state === 'active' ? 'border-sage-600 bg-sage-100 dark:border-sage-400 dark:bg-sage-950' : node.highlight_state === 'verified' ? 'border-emerald-500 bg-emerald-50 dark:border-emerald-500 dark:bg-emerald-950' : 'border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900';
  const nodeStyle = (node: VisualEntity) => `algo-node rounded-lg border px-3 py-3 shadow-xs ${nodeTone(node)}`;
  const cell = (node: VisualEntity) => (
    <div className={`${nodeStyle(node)} min-w-[92px] text-center`}>
      <div className="font-mono text-[10px] font-semibold text-slate-600 dark:text-slate-300">{node.role_label}</div>
      <div className="my-2 font-mono text-xl font-bold">{node.val ?? <span className="text-slate-400">∅</span>}</div>
      <div className="font-mono text-[10px] text-slate-500 dark:text-slate-400">{node.addr}</div>
    </div>
  );

  return (
    <section aria-label="Algorithm visualization" className="algo-panel-enter min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <h2 className="font-display text-sm font-bold">{trace.title}</h2>
        <span className="rounded-full border border-sage-300 bg-sage-50 px-2 py-1 font-mono text-[10px] text-sage-800 dark:border-sage-700 dark:bg-sage-950 dark:text-sage-200">{step.execution_status}</span>
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
                <div className={`algo-node flex h-16 w-16 items-center justify-center rounded-full border p-1 shadow-xs ${nodeTone(node)}`}><strong className={`font-mono ${String(node.val).length > 5 ? 'text-[10px]' : 'text-sm'}`}>{node.val}</strong></div>
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
              {step.nodes.map((node, i) => <div key={node.id} className="flex items-center gap-3">
                <LinkedNodeCard node={node} doubly={kind === 'doubly_linked_list'} />
                {i + 1 < step.nodes.length && <span className="font-mono text-lg text-slate-600 dark:text-slate-300" aria-label={node.next_addr === step.nodes[i + 1].addr ? 'Reference' : 'Not linked'}>{node.next_addr !== step.nodes[i + 1].addr ? '·' : kind === 'doubly_linked_list' && step.nodes[i + 1].prev_addr === node.addr ? '⇄' : '→'}</span>}
              </div>)}
            </div>
          ) : kind === 'stack' ? (
            <div className="mx-auto flex w-[190px] flex-col-reverse gap-2 border-x-2 border-b-2 border-slate-600 p-2 dark:border-slate-500">
              {step.nodes.map(node => <div key={node.id} className={`${nodeStyle(node)} flex items-center justify-between py-2`}><span className="font-mono text-[10px] text-slate-600 dark:text-slate-300">{node.role_label}</span><strong className="font-mono">{node.val ?? '∅'}</strong></div>)}
            </div>
          ) : (
            <div className="flex min-h-[280px] flex-wrap content-center items-center justify-center gap-2">
              {step.nodes.map(node => <div key={node.id}>{cell(node)}</div>)}
            </div>
          )}
      </div>
      <div className="space-y-3 border-t border-slate-200 p-4 dark:border-slate-800">
        <p className="break-words font-mono text-xs leading-relaxed"><span className="text-slate-500 dark:text-slate-400">{step.execution_status === 'READY' ? 'Function entry' : 'After line'} {step.python_line}: </span>{step.action_text}</p>
        {step.variables && <dl className="flex flex-wrap gap-2" aria-label="Python local variables">{Object.entries(step.variables).map(([name, value]) => <div key={name} className="max-w-full break-words rounded border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-[10px] dark:border-slate-700 dark:bg-slate-950"><dt className="inline text-slate-600 dark:text-slate-300">{name} = </dt><dd className="inline font-medium">{value === null ? 'None' : typeof value === 'boolean' ? (value ? 'True' : 'False') : JSON.stringify(value)}</dd></div>)}</dl>}
        <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">Addresses and slots are illustrative. Horizontal diagrams can be scrolled; data is not hidden outside the page.</p>
      </div>
    </section>
  );
}
