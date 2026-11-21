import { useCallback, useEffect, useRef, useState } from 'react';
import { BookOpen, Code2, Moon, Sun, Play, Pause, RotateCcw, ChevronLeft, ChevronRight, Boxes } from 'lucide-react';
import { PythonCodeBox } from '../web/components/PythonCodeBox';
import { LearningCanvas } from '../web/components/LearningCanvas';
import { ComplexityPanel } from '../web/components/ComplexityPanel';
import { LESSONS, OPERATION_LABELS } from '../web/data/curriculum';
import type { Lesson } from '../web/data/curriculum';
import type { SimulationParams, SimulationTrace } from '../web/types/traceTypes';

export default function App() {
  const [lesson, setLesson] = useState<Lesson>(LESSONS[0]);
  const [draft, setDraft] = useState(LESSONS[0].defaults);
  const [valuesText, setValuesText] = useState(LESSONS[0].defaults.values.join(', '));
  const [trace, setTrace] = useState<SimulationTrace | null>(null);
  const [stepIndex, setStepIndex] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [showCode, setShowCode] = useState(true);
  const [dark, setDark] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const controller = useRef<AbortController | null>(null);
  const codeRef = useRef<HTMLElement | null>(null);
  const step = trace?.steps[stepIndex - 1];

  useEffect(() => { document.documentElement.classList.toggle('dark', dark); }, [dark]);
  const load = useCallback(async (params: SimulationParams) => {
    controller.current?.abort();
    const request = new AbortController();
    controller.current = request;
    setLoading(true); setError(null); setPlaying(false); setTrace(null);
    try {
      const response = await fetch('/api/simulate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(params), signal: request.signal });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to run this operation');
      if (!data.analysis || data.metadata?.operation !== params.operation) throw new Error('Restart npm run dev to load the updated Python learning API.');
      if (!request.signal.aborted) { setTrace(data); setStepIndex(1); }
    } catch (e) {
      if (!request.signal.aborted) setError(e instanceof Error ? e.message : 'Unable to load the operation');
    } finally { if (!request.signal.aborted) setLoading(false); }
  }, []);
  useEffect(() => { void load(LESSONS[0].defaults); return () => controller.current?.abort(); }, [load]);
  useEffect(() => {
    if (!playing || !trace) return;
    const timer = window.setInterval(() => setStepIndex(current => {
      if (current >= trace.steps.length) { setPlaying(false); return current; }
      return current + 1;
    }), 1100);
    return () => window.clearInterval(timer);
  }, [playing, trace]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('input, textarea, select, button, [contenteditable="true"]')) return;
      if (e.key === 'c' || e.key === 'C') { e.preventDefault(); setShowCode(value => !value); }
      else if (trace && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
        e.preventDefault(); setPlaying(false); setStepIndex(value => Math.max(1, Math.min(trace.steps.length, value + (e.key === 'ArrowRight' ? 1 : -1))));
      } else if (trace && e.key === ' ') { e.preventDefault(); setPlaying(value => !value); }
      else if (trace && (e.key === 'r' || e.key === 'R')) { e.preventDefault(); setPlaying(false); setStepIndex(1); }
    };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, [trace]);

  const chooseLesson = (next: Lesson) => {
    setLesson(next); setDraft(next.defaults); setValuesText(next.defaults.values.join(', ')); void load(next.defaults);
  };
  const run = () => {
    const tokens = valuesText.trim() ? valuesText.split(',').map(v => v.trim()) : [];
    if (tokens.some(v => !/^-?\d+$/.test(v))) { setError('Enter comma-separated integers, or leave the values empty.'); return; }
    void load({ ...draft, values: tokens.map(Number) });
  };
  const navigate = (next: number) => { setPlaying(false); setStepIndex(next); };
  const button = 'inline-flex items-center justify-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800';
  const input = 'mt-1 w-full min-w-0 rounded-md border border-slate-300 bg-white px-2.5 py-2 font-mono text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100';
  const numeric = (label: string, key: 'insertValue' | 'insertIndex' | 'capacity' | 'payloadValue' | 'frontIndex', min?: number, max?: number) => <label className="min-w-0 text-[11px] font-medium text-slate-600 dark:text-slate-300">{label}<input className={input} type="number" step="1" min={min} max={max} required value={Number.isFinite(draft[key]) ? draft[key] : ''} onChange={e => setDraft({ ...draft, [key]: e.target.value === '' ? NaN : Number(e.target.value) })} /></label>;
  const indexed = ['dynamic_array', 'singly_linked_list', 'doubly_linked_list'].includes(lesson.id) && ['insert', 'delete', 'access'].includes(draft.operation!);
  const needsValue = ['insert', 'search', 'push', 'enqueue'].includes(draft.operation!) || (lesson.id === 'binary_tree' && draft.operation === 'delete') || (lesson.id === 'hash_table' && draft.operation === 'delete');

  return <div className="min-h-screen bg-slate-100 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
      <div className="mx-auto flex max-w-[1800px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3"><span className="algo-primary flex h-8 w-8 items-center justify-center rounded-lg"><Boxes className="h-4 w-4" aria-hidden="true" /></span><span className="font-display text-base font-bold">AlgoFrame</span><span className="hidden font-mono text-[10px] tracking-wider text-slate-500 sm:inline dark:text-slate-400">/ DSA LEARNING LAB</span></div>
        <div className="ml-auto flex items-center gap-2"><span className="mr-1 hidden rounded-full border border-sage-300 bg-sage-50 px-2 py-1 font-mono text-[10px] text-sage-800 sm:inline dark:border-sage-800 dark:bg-sage-950 dark:text-sage-200">Python 3</span><button className={button} onClick={() => setShowCode(value => !value)} aria-expanded={showCode}><Code2 className="h-3.5 w-3.5" aria-hidden="true" />{showCode ? 'Hide code' : 'Show code'}</button><button className={button} onClick={() => setDark(value => !value)} aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}>{dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</button></div>
      </div>
    </header>
    <div className="mx-auto flex max-w-[1800px] flex-col gap-5 px-4 py-5 sm:px-6 xl:flex-row xl:gap-6">
      <aside className="min-w-0 xl:sticky xl:top-24 xl:w-[190px] xl:shrink-0 xl:self-start">
        <h2 className="mb-3 flex items-center gap-2 font-mono text-[11px] font-semibold tracking-widest text-slate-600 dark:text-slate-300"><BookOpen className="h-3.5 w-3.5" aria-hidden="true" /> YOUR COURSE</h2>
        <nav aria-label="Lecture topics" className="flex gap-2 overflow-x-auto pb-2 xl:flex-col xl:overflow-visible">{LESSONS.map(item => <button key={item.id} aria-current={lesson.id === item.id ? 'page' : undefined} onClick={() => chooseLesson(item)} className={`flex shrink-0 items-center gap-3 rounded-lg border px-3 py-3 text-left text-xs transition-colors xl:shrink ${lesson.id === item.id ? 'algo-selected' : 'border-transparent hover:bg-white dark:hover:bg-slate-900'}`}><span className="font-mono text-[10px] opacity-80">0{item.week}</span><span className="font-medium">{item.title}</span></button>)}</nav>
        <div className="mt-5 hidden border-t border-slate-200 pt-4 xl:block dark:border-slate-800"><p className="font-mono text-[10px] text-slate-500 dark:text-slate-400">6 TOPICS · STEP BY STEP</p><p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">Your semester's data structures. Python you can follow, one line at a time.</p></div>
      </aside>
      <main className="min-w-0 flex-1 space-y-5">
        <div><p className="mb-1 font-mono text-[10px] tracking-wider text-slate-500 dark:text-slate-400">WEEK 0{lesson.week} / DATA STRUCTURES & ALGORITHMS</p><h1 className="font-display text-2xl font-bold tracking-tight">{lesson.title}</h1><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{lesson.description}</p><p className="mt-2 font-mono text-[10px] text-sage-800 dark:text-sage-200">{lesson.principle}</p></div>
        <form onSubmit={e => { e.preventDefault(); run(); }} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="grid grid-cols-2 items-end gap-3 sm:grid-cols-3 2xl:flex 2xl:flex-wrap">
            <label className="min-w-0 text-[11px] font-medium text-slate-600 dark:text-slate-300">Operation<select className={input} value={draft.operation} onChange={e => setDraft({ ...draft, operation: e.target.value })}>{lesson.operations.map(op => <option key={op} value={op}>{OPERATION_LABELS[op]}</option>)}</select></label>
            <label className="col-span-2 min-w-0 text-[11px] font-medium text-slate-600 sm:col-span-1 2xl:w-[205px] dark:text-slate-300">Initial values<input className={input} value={valuesText} onChange={e => setValuesText(e.target.value)} placeholder="Empty is allowed" aria-describedby="input-help" /></label>
            {needsValue && numeric(lesson.id === 'hash_table' || lesson.id === 'binary_tree' ? 'Key' : 'Value', 'insertValue', -1000000, 1000000)}
            {indexed && numeric('Index (zero-based)', 'insertIndex', 0, 24)}
            {['dynamic_array', 'stack', 'queue', 'hash_table'].includes(lesson.id) && numeric(lesson.id === 'hash_table' ? 'Buckets' : 'Capacity', 'capacity', 1, 32)}
            {lesson.id === 'hash_table' && draft.operation === 'insert' && numeric('Associated value', 'payloadValue', -1000000, 1000000)}
            {lesson.id === 'queue' && numeric('Front index', 'frontIndex', 0, 31)}
            <button type="submit" disabled={loading} className="algo-primary inline-flex min-h-[36px] items-center justify-center gap-2 rounded-md px-4 py-2 text-xs font-semibold disabled:opacity-50"><Play className="h-3.5 w-3.5" aria-hidden="true" />{loading ? 'Running...' : 'Run operation'}</button>
          </div><p id="input-help" className="mt-3 text-[10px] leading-relaxed text-slate-500 dark:text-slate-400">Up to 24 integers. Each run starts from these values. For hash tables, initial keys map to key * 10; new entries use the associated value.</p>
        </form>
        {error && <div role="alert" className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200">{error}</div>}
        {loading && <div role="status" className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm dark:border-slate-800 dark:bg-slate-900">Preparing your Python execution...</div>}
        {trace && step && <>
          <div className={`grid min-w-0 items-start gap-5 ${showCode ? 'lg:grid-cols-[minmax(0,1fr)_minmax(340px,0.85fr)]' : ''}`}>
            <div className="min-w-0 space-y-3"><LearningCanvas trace={trace} step={step} /><div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"><span className="font-mono text-[11px] text-slate-600 dark:text-slate-300" aria-live="polite">Step {stepIndex} / {trace.steps.length} · Line {step.python_line}</span><div className="flex items-center gap-2"><button className={button} onClick={() => navigate(1)} aria-label="Reset to first step"><RotateCcw className="h-3.5 w-3.5" /></button><button className={button} onClick={() => navigate(Math.max(1, stepIndex - 1))} disabled={stepIndex === 1} aria-label="Previous step"><ChevronLeft className="h-3.5 w-3.5" /></button><button className={button} onClick={() => { if (stepIndex === trace.steps.length) setStepIndex(1); setPlaying(value => !value); }} aria-label={playing ? 'Pause playback' : 'Play execution'}>{playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}</button><button className="algo-primary inline-flex items-center gap-1 rounded-md px-3 py-2 text-xs font-medium disabled:opacity-50" onClick={() => navigate(Math.min(trace.steps.length, stepIndex + 1))} disabled={stepIndex === trace.steps.length}>Next<ChevronRight className="h-3.5 w-3.5" aria-hidden="true" /></button></div><input className="w-full accent-sage-700 dark:accent-sage-300" type="range" min={1} max={trace.steps.length} value={stepIndex} onChange={e => navigate(Number(e.target.value))} aria-label="Execution step" /></div><p className="text-[10px] text-slate-500 dark:text-slate-400">← / → step · Space play/pause · R reset · C code</p></div>
            {showCode && <div className="min-w-0 lg:sticky lg:top-24"><PythonCodeBox containerRef={codeRef} filename={trace.python_filename} code={trace.python_code} activeLine={step.python_line} isOpen={showCode} onToggleOpen={() => setShowCode(value => !value)} sidePanel /></div>}
          </div>
          <ComplexityPanel trace={trace} />
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 px-4 py-3 dark:border-slate-800"><p className="min-w-0 break-words text-xs"><span className="text-slate-600 dark:text-slate-300">Result at completion: </span><span className="font-mono font-semibold">{stepIndex !== trace.steps.length ? 'Advance to the final step' : trace.metadata.result === null ? 'None' : typeof trace.metadata.result === 'boolean' ? (trace.metadata.result ? 'True' : 'False') : JSON.stringify(trace.metadata.result)}</span></p><span className="font-mono text-[10px] text-slate-600 dark:text-slate-300">n = live entries ? c = capacity ? h = height</span></div>
        </>}
      </main>
    </div>
  </div>;
}
