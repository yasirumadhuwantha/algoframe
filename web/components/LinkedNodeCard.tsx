import type { VisualEntity } from '../types/traceTypes';

export function LinkedNodeCard({ node, doubly }: { node: VisualEntity; doubly: boolean }) {
  const pointer = (field: 'previous' | 'next', value: string | null) => <div data-field={field} className="flex flex-col items-center justify-center gap-2 bg-slate-50/60 px-2 py-3 dark:bg-slate-950/40"><span className="font-mono text-[10px] text-slate-600 dark:text-slate-300">{field === 'previous' ? 'prev' : 'next'}</span><span className="font-mono text-[11px] font-semibold">{value ?? 'None'}</span></div>;
  const active = node.highlight_state === 'active';
  const verified = node.highlight_state === 'verified';
  return <article className="shrink-0" aria-label={`${doubly ? 'Doubly' : 'Singly'} linked node ${node.val}`}>
    <div className="mb-2 flex items-center justify-between gap-4 px-1 font-mono text-[10px] text-slate-600 dark:text-slate-300"><span>{node.lane === 'staging' ? 'NEW · UNLINKED' : node.role_label}</span><span>@ {node.addr}</span></div>
    <div data-node-id={node.id} className={`algo-node grid divide-x divide-slate-300 overflow-hidden rounded-lg border shadow-xs dark:divide-slate-700 ${doubly ? 'grid-cols-[96px_112px_96px]' : 'grid-cols-[112px_96px]'} ${active ? 'algo-node-active border-sage-600 bg-sage-100 dark:border-sage-400 dark:bg-sage-950' : verified ? 'algo-node-verified border-emerald-500 bg-emerald-50 dark:border-emerald-500 dark:bg-emerald-950' : 'border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900'}`}>
      {doubly && pointer('previous', node.prev_addr)}
      <div data-field="value" className="flex flex-col items-center justify-center gap-1 px-2 py-3"><span className="font-mono text-[10px] text-slate-600 dark:text-slate-300">value</span><strong className="font-mono text-xl">{node.val}</strong></div>
      {pointer('next', node.next_addr)}
    </div>
  </article>;
}
