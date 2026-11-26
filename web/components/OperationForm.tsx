import { CheckCircle2, Lock, Play, RotateCcw, Sparkles } from 'lucide-react';
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
  isDefined: boolean;
  onResetDefinition: () => void;
  loading: boolean;
  onRun: () => void;
}

export function OperationForm({
  lesson,
  draft,
  onDraft,
  onOperation,
  values,
  onValues,
  edges,
  onEdges,
  definitionMode,
  onDefinitionMode,
  isDefined,
  onResetDefinition,
  loading,
  onRun,
}: Props) {
  const defining = draft.operation === 'define';
  const graph = lesson.id === 'graph';
  const empty = defining && definitionMode === 'empty';
  const noun = lesson.id === 'dynamic_array' ? 'array' : graph ? 'graph' : 'structure';
  const input = 'mt-1 w-full min-w-0 rounded-md border border-slate-300 bg-white px-2.5 py-2 font-mono text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100';
  const label = 'min-w-0 text-[11px] font-medium text-slate-600 dark:text-slate-300';

  const numeric = (
    name: string,
    key: 'insertValue' | 'insertIndex' | 'capacity' | 'payloadValue' | 'frontIndex' | 'targetVertex',
    min = -1000000,
    max = 1000000,
  ) => (
    <label className={label}>
      {name}
      <input
        className={input}
        type="number"
        step="1"
        min={min}
        max={max}
        required
        value={Number.isFinite(draft[key]) ? draft[key] : ''}
        onChange={e => onDraft({ ...draft, [key]: e.target.value === '' ? NaN : Number(e.target.value) })}
      />
    </label>
  );

  const indexed = ['dynamic_array', 'singly_linked_list', 'doubly_linked_list'].includes(lesson.id) && ['insert', 'delete', 'access'].includes(draft.operation!);
  const needsValue = ['insert', 'search', 'push', 'enqueue'].includes(draft.operation!) || (['binary_tree', 'hash_table'].includes(lesson.id) && draft.operation === 'delete');

  const loadSample = () => {
    onDefinitionMode('custom');
    onValues(lesson.exampleValues.join(', '));
    if (graph) onEdges('0-1, 0-2, 1-3, 2-4');
  };

  return (
    <form onSubmit={e => { e.preventDefault(); onRun(); }} className="algo-panel-enter space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
      {/* 2-step student progress bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium transition-colors ${isDefined ? 'border border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' : 'algo-primary'}`}>
            {isDefined ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> : <span className="font-mono text-[10px] font-bold">1</span>}
            <span>{isDefined ? `${noun.charAt(0).toUpperCase() + noun.slice(1)} defined` : `Step 1: Define ${noun}`}</span>
          </span>
          <span className="text-slate-400" aria-hidden="true">→</span>
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-medium transition-colors ${isDefined ? 'border-sage-300 bg-sage-50 text-sage-800 dark:border-sage-800 dark:bg-sage-950/50 dark:text-sage-200' : 'border-slate-200 bg-slate-100 text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400'}`}>
            {!isDefined && <Lock className="h-3 w-3" aria-hidden="true" />}
            <span>Step 2: Try operations</span>
          </span>
        </div>
        {isDefined && !defining && (
          <button
            type="button"
            onClick={onResetDefinition}
            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <RotateCcw className="h-3 w-3" aria-hidden="true" />
            Redefine {noun}
          </button>
        )}
      </div>

      {/* Operation tabs */}
      <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Operations">
        {lesson.operations.map(op => {
          const locked = !isDefined && op !== 'define';
          const active = draft.operation === op;
          return (
            <button
              key={op}
              type="button"
              role="tab"
              aria-selected={active}
              data-operation={op}
              disabled={locked}
              title={locked ? `Define the ${noun} first to unlock ${OPERATION_LABELS[op]}` : OPERATION_LABELS[op]}
              onClick={() => onOperation(op)}
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                active
                  ? 'algo-selected border-sage-600 text-white shadow-xs'
                  : locked
                  ? 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400 opacity-65 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-500'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-sage-400 hover:bg-sage-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-sage-500 dark:hover:bg-slate-800'
              }`}
            >
              {locked && <Lock className="h-3 w-3 opacity-75" aria-hidden="true" />}
              <span>{OPERATION_LABELS[op]}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 items-end gap-3 sm:grid-cols-3 2xl:flex 2xl:flex-wrap">

        {defining && (
          <fieldset className="col-span-2 min-w-0 sm:col-span-2" aria-describedby="definition-help">
            <legend className="mb-1 text-[11px] font-medium text-slate-600 dark:text-slate-300">Initial definition</legend>
            <div className="flex flex-wrap items-center gap-2">
              {(['empty', 'custom'] as const).map(mode => (
                <label
                  key={mode}
                  className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-xs transition-colors ${definitionMode === mode ? 'algo-selected' : 'border-slate-300 dark:border-slate-700'}`}
                >
                  <input
                    type="radio"
                    name="definition"
                    value={mode}
                    checked={definitionMode === mode}
                    onChange={() => onDefinitionMode(mode)}
                    className="accent-sage-700 dark:accent-sage-300"
                  />
                  {mode === 'empty' ? `Empty ${noun}` : `User-defined ${noun}`}
                </label>
              ))}
              {lesson.exampleValues.length > 0 && (
                <button
                  type="button"
                  onClick={loadSample}
                  className="inline-flex items-center gap-1 rounded-md border border-cyan-200 bg-cyan-50 px-2.5 py-2 text-[11px] font-medium text-cyan-800 transition-colors hover:bg-cyan-100 dark:border-cyan-800/80 dark:bg-cyan-950/60 dark:text-cyan-300 dark:hover:bg-cyan-900/60"
                >
                  <Sparkles className="h-3 w-3" aria-hidden="true" />
                  Try sample
                </button>
              )}
            </div>
          </fieldset>
        )}

        {!empty && (
          <label className={`${label} col-span-2 sm:col-span-1 2xl:w-[205px]`}>
            {graph ? (isDefined && !defining ? 'Current vertices' : 'Vertices') : (isDefined && !defining ? 'Current values' : 'Initial values')}
            <input
              className={input}
              value={values}
              onChange={e => onValues(e.target.value)}
              placeholder="e.g. 10, 20, 30"
              aria-describedby="input-help"
            />
          </label>
        )}

        {graph && !empty && (
          <label className={`${label} col-span-2 sm:col-span-1 2xl:w-[205px]`}>
            {isDefined && !defining ? 'Current edges' : 'Initial edges'}
            <input
              className={input}
              value={edges}
              onChange={e => onEdges(e.target.value)}
              placeholder="0-1, 0-2, 1-3"
              aria-describedby="graph-help"
            />
          </label>
        )}

        {needsValue && numeric(lesson.id === 'hash_table' || lesson.id === 'binary_tree' ? 'Key' : 'Value', 'insertValue')}
        {graph && !defining && numeric(['bfs', 'dfs'].includes(draft.operation!) ? 'Start vertex' : ['add_edge', 'remove_edge'].includes(draft.operation!) ? 'From vertex' : 'Vertex', 'insertValue')}
        {graph && ['add_edge', 'remove_edge'].includes(draft.operation!) && numeric('To vertex', 'targetVertex')}
        {indexed && numeric('Position (index)', 'insertIndex', 0, 24)}
        {['dynamic_array', 'stack', 'queue', 'hash_table'].includes(lesson.id) && numeric(lesson.id === 'hash_table' ? 'Buckets' : 'Capacity', 'capacity', 1, 32)}
        {lesson.id === 'hash_table' && draft.operation === 'insert' && numeric('Associated value', 'payloadValue')}
        {lesson.id === 'queue' && numeric('Front index', 'frontIndex', 0, 31)}

        <button
          type="submit"
          disabled={loading}
          className="algo-primary inline-flex min-h-[36px] items-center justify-center gap-2 rounded-md px-4 py-2 text-xs font-semibold disabled:opacity-50 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-[0.98] transition-all duration-150"
        >
          <Play className="h-3.5 w-3.5" aria-hidden="true" />
          {loading ? 'Running…' : defining ? `Define ${noun}` : 'Run operation'}
        </button>
      </div>

      {/* Friendly student guidance */}
      <div className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
        {!isDefined ? (
          <p id="definition-help">
            Start by defining an empty or sample {noun}, then click <strong>Define {noun}</strong> to unlock all {lesson.title.toLowerCase()} operations.
          </p>
        ) : (
          <p id="input-help">
            {graph
              ? 'Vertices are integers and edges look like 0-1, 0-2. Step through the animation below to watch the traversal or update.'
              : 'Pick any operation pill above, adjust your values if needed, and click Run operation to visualize every Python step.'}
          </p>
        )}
      </div>
    </form>
  );
}
