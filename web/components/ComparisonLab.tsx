import { useEffect, useRef, useState } from 'react';
import { ArrowRightLeft } from 'lucide-react';
import type { SimulationTrace, StructureType } from '../types/traceTypes';

export function ComparisonLab() {
  const [size, setSize] = useState(4);
  const [results, setResults] = useState<SimulationTrace[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  const compare = async () => {
    controller.current?.abort();
    const request = new AbortController(); controller.current = request;
    setLoading(true); setError(''); setResults(null);
    try {
      const values = Array.from({ length: size }, (_, i) => (i + 1) * 10);
      const traces = await Promise.all((['dynamic_array', 'singly_linked_list'] as StructureType[]).map(async structure => {
        const response = await fetch('/api/simulate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: request.signal,
          body: JSON.stringify({ structure, operation: 'insert', values, capacity: size + 1, insertIndex: 0, insertValue: 5 }) });
        const trace = await response.json();
        if (!response.ok) throw new Error(trace.error || 'Comparison could not run');
        return trace as SimulationTrace;
      }));
      if (!request.signal.aborted) setResults(traces);
    } catch (e) { if (!request.signal.aborted) setError(e instanceof Error ? e.message : 'Comparison could not run'); }
    finally { if (!request.signal.aborted) setLoading(false); }
  };
  return <section aria-label="Insertion comparison" className="play-panel p-5">
    <h2 className="flex items-center gap-2 font-display text-lg font-bold"><ArrowRightLeft size={20} />Same task. Different work.</h2>
    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Insert 5 at the front of an array and a linked list. The array has a spare slot, so this comparison isolates shifting from allocation.</p>
    <div className="my-4 flex flex-wrap items-end gap-3"><label className="grid gap-1 text-xs">Starting entries<input type="number" className="play-input w-28" min={2} max={12} value={size} disabled={loading} onChange={e => { setSize(Number(e.target.value)); setResults(null); }} /></label>
      <button data-action="run-comparison" className="algo-primary min-h-11 rounded-xl px-4 text-sm font-semibold" onClick={compare} disabled={loading || !Number.isInteger(size) || size < 2 || size > 12}>{loading ? 'Comparing…' : 'Run comparison'}</button></div>
    {error && <p role="alert" className="text-sm text-rose-700 dark:text-rose-200">{error}</p>}
    {results && <><div className="grid gap-3 md:grid-cols-2">{results.map(trace => <article key={trace.structure} data-comparison={trace.structure} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
      <h3 className="font-semibold">{trace.structure === 'dynamic_array' ? 'Array · O(n)' : 'Linked list · O(1) at the head'}</h3>
      <p className="my-3 font-mono text-lg font-bold text-sage-700 dark:text-sage-300">{trace.steps.at(-1)!.memory_shift.shifted_elements} element moves</p>
      <div className="flex flex-wrap gap-1">{(trace.metadata.final_values as number[]).map((value, i) => <span className="rounded bg-slate-100 px-2 py-1 font-mono text-xs dark:bg-slate-800" key={i}>{value}</span>)}</div>
      <p className="mt-3 text-xs text-slate-600 dark:text-slate-300">{trace.structure === 'dynamic_array' ? 'Each existing value shifts one slot to the right.' : 'A new node points to the old head. Existing values stay in their nodes.'}</p>
    </article>)}</div><p role="status" className="mt-3 text-sm font-semibold">Same result, different operations.</p>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Counts come from these Python traces. They are element copies/shifts, not measured runtime. Inserting elsewhere in a list can require O(n) traversal.</p></>}
  </section>;
}
