import type { SimulationTrace } from '../types/traceTypes';

export function ComplexityPanel({ trace }: { trace: SimulationTrace }) {
  const a = trace.analysis;
  if (!a) return null;
  const card = 'min-w-0 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900';
  return <section aria-label="Complexity and execution analysis" className="space-y-3">
    <div className="grid gap-3 md:grid-cols-3">
      <article className={card}><h2 className="font-display text-sm font-bold">Time complexity</h2><dl className="my-3 grid grid-cols-3 gap-2">{[['Best', a.best_time], ['Average', a.average_time], ['Worst', a.worst_time]].map(([name, cost]) => <div key={name}><dt className="text-[11px] text-slate-600 dark:text-slate-300">{name}</dt><dd className="mt-1 font-mono text-sm font-semibold text-sage-800 dark:text-sage-200">{cost}</dd></div>)}</dl><p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">{a.time_note}</p></article>
      <article className={card}><h2 className="font-display text-sm font-bold">Space complexity</h2><dl className="my-3 flex flex-wrap gap-5"><div><dt className="text-[11px] text-slate-600 dark:text-slate-300">Auxiliary space</dt><dd className="mt-1 font-mono text-sm font-semibold text-lavender-700 dark:text-lavender-200">{a.auxiliary_space}</dd></div><div><dt className="text-[11px] text-slate-600 dark:text-slate-300">Structure storage</dt><dd className="mt-1 font-mono text-sm font-semibold">{a.storage_space}</dd></div></dl><p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">{a.space_note}</p></article>
      <article className={card}><h2 className="font-display text-sm font-bold">This execution</h2><dl className="my-3 grid grid-cols-2 gap-3"><div><dt className="text-[11px] text-slate-600 dark:text-slate-300">Python line events</dt><dd className="mt-1 font-mono text-sm font-semibold">{a.executed_lines}</dd></div><div><dt className="text-[11px] text-slate-600 dark:text-slate-300">Live entries</dt><dd className="mt-1 font-mono text-sm font-semibold">{a.initial_size} → {a.final_size}</dd></div></dl><p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">Peak modeled storage: {a.peak_model_slots} slots. Line counts describe this run; they are not a runtime benchmark or a substitute for Big O.</p></article>
    </div>
    <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">{a.memory_note}</p>
  </section>;
}
