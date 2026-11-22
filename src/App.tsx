import { useCallback, useEffect, useRef, useState } from 'react';
import { Code2, Moon, Sun, Boxes } from 'lucide-react';
import { PythonCodeBox } from '../web/components/PythonCodeBox';
import { LearningCanvas } from '../web/components/LearningCanvas';
import { ComplexityPanel } from '../web/components/ComplexityPanel';
import { OperationForm } from '../web/components/OperationForm';
import { PlaybackBar } from '../web/components/PlaybackBar';
import { LESSONS } from '../web/data/curriculum';
import type { Lesson } from '../web/data/curriculum';
import type { SimulationParams, SimulationTrace } from '../web/types/traceTypes';

export default function App() {
  const [lesson, setLesson] = useState<Lesson>(LESSONS[0]);
  const [draft, setDraft] = useState(LESSONS[0].defaults);
  const [valuesText, setValuesText] = useState('');
  const [edgesText, setEdgesText] = useState('');
  const [definitionMode, setDefinitionMode] = useState<'empty' | 'custom'>('empty');
  const customValues = useRef(LESSONS[0].exampleValues.join(', '));
  const customEdges = useRef('');
  const [trace, setTrace] = useState<SimulationTrace | null>(null);
  const [executionId, setExecutionId] = useState(0);
  const [stepIndex, setStepIndex] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [showCode, setShowCode] = useState(true);
  const [dark, setDark] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const controller = useRef<AbortController | null>(null);
  const codeRef = useRef<HTMLElement | null>(null);
  const headerRef = useRef<HTMLElement | null>(null);
  const step = trace?.steps[stepIndex - 1];

  useEffect(() => { document.documentElement.classList.toggle('dark', dark); }, [dark]);
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const measure = () => document.documentElement.style.setProperty('--app-header-height', `${header.getBoundingClientRect().height}px`);
    const observer = new ResizeObserver(measure);
    measure(); observer.observe(header);
    return () => observer.disconnect();
  }, []);

  const load = useCallback(async (params: SimulationParams) => {
    controller.current?.abort();
    const request = new AbortController();
    controller.current = request;
    setLoading(true); setError(null); setPlaying(false); setTrace(null);
    try {
      const response = await fetch('/api/simulate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params), signal: request.signal,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to run this operation');
      if (!data.analysis || data.metadata?.operation !== params.operation) throw new Error('Restart npm run dev to load the updated Python learning API.');
      if (!request.signal.aborted) { setTrace(data); setStepIndex(1); setExecutionId(value => value + 1); }
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
      if (e.key.toLowerCase() === 'c') { e.preventDefault(); setShowCode(value => !value); }
      else if (trace && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
        e.preventDefault(); setPlaying(false);
        setStepIndex(value => Math.max(1, Math.min(trace.steps.length, value + (e.key === 'ArrowRight' ? 1 : -1))));
      } else if (trace && e.key === ' ') {
        e.preventDefault(); if (stepIndex === trace.steps.length) setStepIndex(1); setPlaying(value => !value);
      } else if (trace && e.key.toLowerCase() === 'r') { e.preventDefault(); setPlaying(false); setStepIndex(1); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [trace, stepIndex]);

  const chooseLesson = (next: Lesson) => {
    setLesson(next); setDraft(next.defaults); setDefinitionMode('empty');
    setValuesText(''); setEdgesText('');
    customValues.current = next.exampleValues.join(', ');
    customEdges.current = next.id === 'graph' ? '0-1, 0-2, 1-3, 2-4' : '';
    void load(next.defaults);
  };
  const chooseDefinition = (mode: 'empty' | 'custom') => {
    setDefinitionMode(mode);
    setValuesText(mode === 'empty' ? '' : customValues.current);
    setEdgesText(mode === 'empty' ? '' : customEdges.current);
  };
  const chooseOperation = (operation: string) => {
    setDraft(value => ({ ...value, operation }));
    if (operation === 'define') chooseDefinition(definitionMode);
  };
  const run = () => {
    const empty = draft.operation === 'define' && definitionMode === 'empty';
    const tokens = empty || !valuesText.trim() ? [] : valuesText.split(',').map(value => value.trim());
    if (tokens.some(value => !/^-?\d+$/.test(value))) {
      setError('Enter comma-separated integers, or leave the values empty.'); return;
    }
    const edges: number[][] = [];
    if (lesson.id === 'graph' && !empty && edgesText.trim()) {
      for (const item of edgesText.split(',')) {
        const match = item.match(/^\s*(-?\d+)\s*-\s*(-?\d+)\s*$/);
        if (!match) { setError('Use edges such as 0-1, 0-2. Each edge needs two integer vertices.'); return; }
        edges.push([Number(match[1]), Number(match[2])]);
      }
    }
    void load({ ...draft, values: tokens.map(Number), edges });
  };
  const navigate = (next: number) => { setPlaying(false); setStepIndex(next); };
  const button = 'inline-flex items-center justify-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium transition-colors hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800';

  return <div className="min-h-screen bg-slate-100 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
    <header ref={headerRef} className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
      <div className="mx-auto flex max-w-[1800px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="algo-primary flex h-8 w-8 items-center justify-center rounded-lg"><Boxes className="h-4 w-4" aria-hidden="true" /></span>
          <span className="font-display text-base font-bold">AlgoFrame</span>
          <span className="hidden font-mono text-[10px] tracking-wider text-slate-500 sm:inline dark:text-slate-400">/ DSA LEARNING LAB</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="mr-1 hidden rounded-full border border-sage-300 bg-sage-50 px-2 py-1 font-mono text-[10px] text-sage-800 sm:inline dark:border-sage-800 dark:bg-sage-950 dark:text-sage-200">Python 3</span>
          <button className={button} onClick={() => setShowCode(value => !value)} aria-expanded={showCode}><Code2 className="h-3.5 w-3.5" aria-hidden="true" />{showCode ? 'Hide code' : 'Show code'}</button>
          <button className={button} onClick={() => setDark(value => !value)} aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}>{dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</button>
        </div>
      </div>
      {/* Fresh range tracking per execution avoids stale input state after loading clamps max to 1. */}
      <PlaybackBar key={executionId} trace={trace} stepIndex={stepIndex} playing={playing} loading={loading} onNavigate={navigate} onToggle={() => {
        if (!trace) return;
        if (stepIndex === trace.steps.length) setStepIndex(1);
        setPlaying(value => !value);
      }} />
    </header>
    <div className="mx-auto flex max-w-[1800px] flex-col gap-5 px-4 py-5 sm:px-6 xl:flex-row xl:gap-6">
      <aside className="workspace-sticky min-w-0 xl:sticky xl:w-[190px] xl:shrink-0 xl:self-start">
        <nav aria-label="Lecture topics" className="flex gap-2 overflow-x-auto pb-2 xl:flex-col xl:overflow-visible">
          {LESSONS.map(item => <button key={item.id} aria-current={lesson.id === item.id ? 'page' : undefined} onClick={() => chooseLesson(item)} className={`flex shrink-0 items-center gap-3 rounded-lg border px-3 py-3 text-left text-xs transition-colors xl:shrink ${lesson.id === item.id ? 'algo-selected' : 'border-transparent hover:bg-white dark:hover:bg-slate-900'}`}>
            <span className="font-mono text-[10px] opacity-80">0{item.week}</span><span className="font-medium">{item.title}</span>
          </button>)}
        </nav>
      </aside>
      <main className="min-w-0 flex-1 space-y-5">
        <div className="algo-panel-enter" key={lesson.id}>
          <p className="mb-1 font-mono text-[10px] tracking-wider text-slate-500 dark:text-slate-400">{lesson.week > 6 ? 'EXTRA TOPIC' : `WEEK 0${lesson.week}`} / DATA STRUCTURES &amp; ALGORITHMS</p>
          <h1 className="font-display text-2xl font-bold tracking-tight">{lesson.title}</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{lesson.description}</p>
          <p className="mt-2 font-mono text-[10px] text-sage-800 dark:text-sage-200">{lesson.principle}</p>
        </div>
        <OperationForm lesson={lesson} draft={draft} onDraft={setDraft} onOperation={chooseOperation} values={valuesText} onValues={value => { setValuesText(value); customValues.current = value; }} edges={edgesText} onEdges={value => { setEdgesText(value); customEdges.current = value; }} definitionMode={definitionMode} onDefinitionMode={chooseDefinition} loading={loading} onRun={run} />
        {error && <div role="alert" className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200">{error}</div>}
        {loading && <div role="status" className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm dark:border-slate-800 dark:bg-slate-900">Preparing your Python execution...</div>}
        {trace && step && <>
          <div className={`grid min-w-0 items-start gap-5 ${showCode ? 'lg:grid-cols-[minmax(0,1fr)_minmax(340px,0.85fr)]' : ''}`}>
            <LearningCanvas key={`${trace.structure}:${trace.metadata.operation}`} trace={trace} step={step} />
            {showCode && <div className="workspace-sticky min-w-0 lg:sticky"><PythonCodeBox containerRef={codeRef} filename={trace.python_filename} code={trace.python_code} activeLine={step.python_line} isOpen={showCode} onToggleOpen={() => setShowCode(value => !value)} sidePanel /></div>}
          </div>
          <ComplexityPanel trace={trace} />
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 px-4 py-3 dark:border-slate-800">
            <p className="min-w-0 break-words text-xs"><span className="text-slate-600 dark:text-slate-300">Result at completion: </span><span className="font-mono font-semibold">{stepIndex !== trace.steps.length ? 'Advance to the final step' : trace.metadata.result === null ? 'None' : typeof trace.metadata.result === 'boolean' ? (trace.metadata.result ? 'True' : 'False') : JSON.stringify(trace.metadata.result)}</span></p>
            <span className="font-mono text-[10px] text-slate-600 dark:text-slate-300">{lesson.id === 'graph' ? 'V = vertices / E = edges' : 'n = live entries / c = capacity / h = height'}</span>
          </div>
        </>}
      </main>
    </div>
  </div>;
}
