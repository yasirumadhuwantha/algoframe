import { Play, RotateCcw } from 'lucide-react';
import type { Lesson } from '../data/curriculum';
import { OPERATION_LABELS } from '../data/curriculum';
import type { SimulationParams } from '../types/traceTypes';

interface Props {
  lesson: Lesson; draft: SimulationParams; onDraft: (next: SimulationParams) => void;
  onOperation: (operation: string) => void; values: string; onValues: (values: string) => void;
  edges: string; onEdges: (edges: string) => void; definitionMode: 'empty' | 'custom';
  onDefinitionMode: (mode: 'empty' | 'custom') => void; isDefined: boolean;
  onResetDefinition: () => void; loading: boolean; onRun: () => void;
}

export function OperationForm({ lesson, draft, onDraft, onOperation, values, onValues, edges, onEdges,
  definitionMode, onDefinitionMode, isDefined, onResetDefinition, loading, onRun }: Props) {
  const defining = draft.operation === 'define';
  const graph = lesson.id === 'graph';
  const indexed = ['dynamic_array', 'singly_linked_list', 'doubly_linked_list'].includes(lesson.id) && ['insert', 'delete', 'access'].includes(draft.operation!);
  const needsValue = ['insert', 'search', 'push', 'enqueue'].includes(draft.operation!) || (['binary_tree', 'hash_table'].includes(lesson.id) && draft.operation === 'delete');
  const numeric = (name: string, key: 'insertValue' | 'insertIndex' | 'capacity' | 'payloadValue' | 'frontIndex' | 'targetVertex', min = -1000000, max = 1000000) => (
    <label className="grid min-w-0 gap-1 text-xs text-slate-600 dark:text-slate-300">
      {name}<input className="play-input w-28" aria-label={name} type="number" step="1" min={min} max={max} required
        value={Number.isFinite(draft[key]) ? draft[key] : ''}
        onChange={e => onDraft({ ...draft, [key]: e.target.value === '' ? NaN : Number(e.target.value) })} />
    </label>
  );
  return <form aria-label="Operation controls" onSubmit={e => { e.preventDefault(); onRun(); }} className="space-y-4">
    <fieldset disabled={loading} className="min-w-0 space-y-4 disabled:opacity-60">
      <legend className="sr-only">Choose and run an operation</legend>
      <div className="flex min-w-0 items-center gap-2 overflow-x-auto py-1 sm:flex-wrap" aria-label="Operations">
        {lesson.operations.map(op => <button key={op} type="button" data-operation={op}
          disabled={!isDefined && op !== 'define'} aria-pressed={draft.operation === op}
          title={!isDefined && op !== 'define' ? 'Try an example or create your structure first' : undefined}
          onClick={() => onOperation(op)} className={`play-chip ${draft.operation === op ? 'algo-selected' : ''}`}>
          {op === 'define' ? 'Set up' : OPERATION_LABELS[op]}
        </button>)}
        {isDefined && <button type="button" onClick={onResetDefinition} className="play-chip ml-auto" aria-label="Reset structure"><RotateCcw size={14} />Reset</button>}
      </div>
      {defining ? <div className="space-y-3">
        <fieldset className="flex flex-wrap gap-4 text-sm"><legend className="sr-only">Starting values</legend>
          {(['empty', 'custom'] as const).map(mode => <label key={mode} className="flex items-center gap-2">
            <input type="radio" name="definition" value={mode} checked={definitionMode === mode} onChange={() => onDefinitionMode(mode)} />
            {mode === 'empty' ? 'Start empty' : 'Use my own values'}
          </label>)}
        </fieldset>
        {definitionMode === 'custom' && <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-xs">{graph ? 'Vertices' : 'Initial values'}<input className="play-input" value={values} onChange={e => onValues(e.target.value)} placeholder="10, 20, 30" /></label>
          {graph && <label className="grid gap-1 text-xs">Initial edges<input className="play-input" value={edges} onChange={e => onEdges(e.target.value)} placeholder="0-1, 0-2" /></label>}
        </div>}
      </div> : null}
      <div className="flex flex-wrap items-end gap-3">
        {needsValue && numeric(lesson.id === 'hash_table' || lesson.id === 'binary_tree' ? 'Key' : 'Value', 'insertValue')}
        {graph && !defining && numeric(['bfs', 'dfs'].includes(draft.operation!) ? 'Start vertex' : ['add_edge', 'remove_edge'].includes(draft.operation!) ? 'From vertex' : 'Vertex', 'insertValue')}
        {graph && ['add_edge', 'remove_edge'].includes(draft.operation!) && numeric('To vertex', 'targetVertex')}
        {indexed && numeric('Position (index)', 'insertIndex', 0, 24)}
        {lesson.id === 'hash_table' && draft.operation === 'insert' && numeric('Associated value', 'payloadValue')}
        <button type="submit" disabled={loading} className="algo-primary inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold">
          <Play size={16} aria-hidden="true" />{loading ? 'Preparing…' : defining ? 'Create structure' : draft.operation === 'bfs' ? 'Run BFS' : draft.operation === 'dfs' ? 'Run DFS' : `Run ${OPERATION_LABELS[draft.operation!]?.toLowerCase() ?? 'operation'}`}
        </button>
        {!defining && <p className="pb-2 text-xs text-slate-500 dark:text-slate-400">Or select an element on the canvas.</p>}
      </div>
      <details className="play-details">
        <summary>Custom inputs &amp; capacity</summary>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          {!defining && <label className="grid min-w-0 flex-1 gap-1 text-xs">{graph ? 'Current vertices' : 'Current values'}<input className="play-input w-full" value={values} onChange={e => onValues(e.target.value)} placeholder="10, 20, 30" /></label>}
          {graph && !defining && <label className="grid min-w-0 flex-1 gap-1 text-xs">Current edges<input className="play-input w-full" value={edges} onChange={e => onEdges(e.target.value)} placeholder="0-1, 0-2" /></label>}
          {['dynamic_array', 'stack', 'queue', 'hash_table'].includes(lesson.id) && numeric(lesson.id === 'hash_table' ? 'Buckets' : 'Capacity', 'capacity', 1, 32)}
          {lesson.id === 'queue' && numeric('Front index', 'frontIndex', 0, 31)}
          <p className="basis-full text-xs text-slate-500 dark:text-slate-400">Up to 24 integers. Values between −1,000,000 and 1,000,000. Graph edges use pairs such as 0-1, 0-2. Changes apply on the next run.</p>
        </div>
      </details>
    </fieldset>
  </form>;
}
