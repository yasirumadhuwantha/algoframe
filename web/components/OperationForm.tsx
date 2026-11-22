import { Play } from 'lucide-react';
import type { Lesson } from '../data/curriculum';
import { OPERATION_LABELS } from '../data/curriculum';
import type { SimulationParams } from '../types/traceTypes';

interface Props {
  lesson: Lesson;
  draft: SimulationParams;
  onDraft: (next: SimulationParams) => void;
  onOperation: (operation: string) => void;
  values: string;
  onValues: (values: string) => void;
  edges: string;
  onEdges: (edges: string) => void;
  definitionMode: 'empty' | 'custom';
  onDefinitionMode: (mode: 'empty' | 'custom') => void;
  loading: boolean;
  onRun: () => void;
}

export function OperationForm({ lesson, draft, onDraft, onOperation, values, onValues, edges, onEdges, definitionMode, onDefinitionMode, loading, onRun }: Props) {
  const defining = draft.operation === 'define';
  const graph = lesson.id === 'graph';
  const empty = defining && definitionMode === 'empty';
  const noun = lesson.id === 'dynamic_array' ? 'array' : graph ? 'graph' : 'structure';
  const input = 'mt-1 w-full min-w-0 rounded-md border border-slate-300 bg-white px-2.5 py-2 font-mono text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100';
  const label = 'min-w-0 text-[11px] font-medium text-slate-600 dark:text-slate-300';
  const numeric = (name: string, key: 'insertValue' | 'insertIndex' | 'capacity' | 'payloadValue' | 'frontIndex' | 'targetVertex', min = -1000000, max = 1000000) => <label className={label}>{name}<input className={input} type="number" step="1" min={min} max={max} required value={Number.isFinite(draft[key]) ? draft[key] : ''} onChange={e => onDraft({ ...draft, [key]: e.target.value === '' ? NaN : Number(e.target.value) })} /></label>;
  const indexed = ['dynamic_array', 'singly_linked_list', 'doubly_linked_list'].includes(lesson.id) && ['insert', 'delete', 'access'].includes(draft.operation!);
  const needsValue = ['insert', 'search', 'push', 'enqueue'].includes(draft.operation!) || (['binary_tree', 'hash_table'].includes(lesson.id) && draft.operation === 'delete');
  return <form onSubmit={e => { e.preventDefault(); onRun(); }} className="algo-panel-enter space-y-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
    <div className="grid grid-cols-2 items-end gap-3 sm:grid-cols-3 2xl:flex 2xl:flex-wrap">
      <label className={label}>Operation<select className={input} value={draft.operation} onChange={e => onOperation(e.target.value)}>{lesson.operations.map(op => <option key={op} value={op}>{OPERATION_LABELS[op]}</option>)}</select></label>
      {defining && <fieldset className="col-span-2 min-w-0 sm:col-span-2" aria-describedby="definition-help"><legend className="mb-1 text-[11px] font-medium text-slate-600 dark:text-slate-300">Initial definition</legend><div className="flex flex-wrap gap-2">{(['empty', 'custom'] as const).map(mode => <label key={mode} className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-xs transition-colors ${definitionMode === mode ? 'algo-selected' : 'border-slate-300 dark:border-slate-700'}`}><input type="radio" name="definition" value={mode} checked={definitionMode === mode} onChange={() => onDefinitionMode(mode)} className="accent-sage-700 dark:accent-sage-300" />{mode === 'empty' ? `Empty ${noun}` : `User-defined ${noun}`}</label>)}</div></fieldset>}
      {!empty && <label className={`${label} col-span-2 sm:col-span-1 2xl:w-[205px]`}>{graph ? 'Vertices' : 'Initial values'}<input className={input} value={values} onChange={e => onValues(e.target.value)} placeholder="Empty is allowed" aria-describedby="input-help" /></label>}
      {graph && !empty && <label className={`${label} col-span-2 sm:col-span-1 2xl:w-[205px]`}>Initial edges<input className={input} value={edges} onChange={e => onEdges(e.target.value)} placeholder="0-1, 0-2, 1-3" aria-describedby="graph-help" /></label>}
      {needsValue && numeric(lesson.id === 'hash_table' || lesson.id === 'binary_tree' ? 'Key' : 'Value', 'insertValue')}
      {graph && !defining && numeric(['bfs', 'dfs'].includes(draft.operation!) ? 'Start vertex' : ['add_edge', 'remove_edge'].includes(draft.operation!) ? 'From vertex' : 'Vertex', 'insertValue')}
      {graph && ['add_edge', 'remove_edge'].includes(draft.operation!) && numeric('To vertex', 'targetVertex')}
      {indexed && numeric('Index (zero-based)', 'insertIndex', 0, 24)}
      {['dynamic_array', 'stack', 'queue', 'hash_table'].includes(lesson.id) && numeric(lesson.id === 'hash_table' ? 'Buckets' : 'Capacity', 'capacity', 1, 32)}
      {lesson.id === 'hash_table' && draft.operation === 'insert' && numeric('Associated value', 'payloadValue')}
      {lesson.id === 'queue' && numeric('Front index', 'frontIndex', 0, 31)}
      <button type="submit" disabled={loading} className="algo-primary inline-flex min-h-[36px] items-center justify-center gap-2 rounded-md px-4 py-2 text-xs font-semibold disabled:opacity-50"><Play className="h-3.5 w-3.5" aria-hidden="true" />{loading ? 'Running…' : defining ? `Define ${noun}` : 'Run operation'}</button>
    </div>
    <div className="space-y-1 text-[10px] leading-relaxed text-slate-600 dark:text-slate-300">
      {defining && <p id="definition-help">Choose an empty {noun} or build one from your values. {['dynamic_array', 'stack', 'queue', 'hash_table'].includes(lesson.id) ? 'Capacity reserves slots; an empty structure has zero live values.' : graph ? 'An empty graph has no vertices or edges.' : 'An empty structure has no live nodes.'}</p>}
      <p id="input-help">Up to 24 integers. Each run starts from these initial values.{lesson.id === 'hash_table' && ' Initial keys map to key × 10; insertion uses the associated value.'}</p>
      {graph && <p id="graph-help">Undirected, unweighted edges: 0-1, 0-2. Both endpoints must exist. Leave edges blank for isolated vertices.</p>}
    </div>
  </form>;
}
