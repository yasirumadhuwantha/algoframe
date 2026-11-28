import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { Asterisk, ArrowRight, BookOpen, Brain, Code2, FlaskConical, Moon, MousePointerClick, Sparkles, Sun, ArrowRightLeft } from 'lucide-react';
import { PythonCodeBox } from '../web/components/PythonCodeBox';
import { LearningCanvas } from '../web/components/LearningCanvas';
import { ComplexityPanel } from '../web/components/ComplexityPanel';
import { OperationForm } from '../web/components/OperationForm';
import { PlaybackBar } from '../web/components/PlaybackBar';
import { PredictionCard } from '../web/components/PredictionCard';
import { ComparisonLab } from '../web/components/ComparisonLab';
import { LESSONS } from '../web/data/curriculum';
import type { Lesson } from '../web/data/curriculum';
import { conceptFrames, describeStep, exampleParams, experimentsFor, makePrediction, nextOperation } from '../web/data/playground';
import type { ExperienceMode, Prediction, StepMode } from '../web/data/playground';
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
  const [speed, setSpeed] = useState<0.5 | 1 | 2>(1);
  const [isDefined, setIsDefined] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [mode, setMode] = useState<ExperienceMode>('learn');
  const modeRef = useRef(mode); modeRef.current = mode;
  const [stepMode, setStepMode] = useState<StepMode>('concepts');
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [dark, setDark] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [experimentNote, setExperimentNote] = useState('');
  const controller = useRef<AbortController | null>(null);
  const codeRef = useRef<HTMLElement | null>(null);
  const headerRef = useRef<HTMLElement | null>(null);
  const operationRef = useRef<HTMLDivElement | null>(null);
  const step = trace?.steps[stepIndex - 1];
  const frames = useMemo(() => trace ? stepMode === 'concepts' ? conceptFrames(trace) : trace.steps.map(s => s.step_index) : [1], [trace, stepMode]);

  useEffect(() => { document.documentElement.classList.toggle('dark', dark); }, [dark]);
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const measure = () => document.documentElement.style.setProperty('--app-header-height', `${header.getBoundingClientRect().height}px`);
    const observer = new ResizeObserver(measure);
    measure(); observer.observe(header);
    return () => observer.disconnect();
  }, []);
  const load = useCallback(async (params: SimulationParams, intent: 'preview' | 'setup' | 'run' = 'run') => {
    controller.current?.abort();
    const request = new AbortController(); controller.current = request;
    setLoading(true); setError(null); setPlaying(false); setPrediction(null);
    try {
      const response = await fetch('/api/simulate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(params), signal: request.signal });
      const data = await response.json() as SimulationTrace & { error?: string };
      if (!response.ok) throw new Error(data.error || 'Unable to run this operation');
      if (!data.analysis || data.metadata?.operation !== params.operation || !data.steps?.length) throw new Error('Restart npm run dev to load the updated Python learning API.');
      if (request.signal.aborted) return;
      setTrace(data); setExecutionId(value => value + 1);
      const quick = intent === 'setup' || modeRef.current === 'explore';
      const challenge = intent === 'run' && modeRef.current === 'predict' ? makePrediction(params, data) : null;
      setPrediction(challenge);
      setStepIndex(intent === 'preview' || challenge ? 1 : quick ? data.steps.length : 1);
      setPlaying(intent === 'run' && !quick && !challenge && data.steps.length > 1);
      if (intent !== 'preview') {
        setIsDefined(true);
        const nextText = (data.metadata.final_values as number[]).join(', ');
        setValuesText(nextText); customValues.current = nextText; setDefinitionMode('custom');
        const nextEdges = (data.metadata.edges as number[][] | undefined)?.map(([u, v]) => `${u}-${v}`).join(', ');
        if (nextEdges !== undefined) { setEdgesText(nextEdges); customEdges.current = nextEdges; }
        setDraft(prev => ({ ...prev,
          ...(typeof data.metadata.capacity === 'number' ? { capacity: data.metadata.capacity } : {}),
          ...(typeof data.metadata.front === 'number' ? { frontIndex: data.metadata.front } : {}),
        }));
      }
    } catch (e) { if (!request.signal.aborted) setError(e instanceof Error ? e.message : 'Unable to load the operation'); }
    finally { if (!request.signal.aborted) setLoading(false); }
  }, []);
  useEffect(() => { void load(LESSONS[0].defaults, 'preview'); return () => controller.current?.abort(); }, [load]);
  useEffect(() => {
    if (!playing || !trace || prediction) return;
    if (stepIndex >= trace.steps.length) { setPlaying(false); return; }
    const timer = window.setTimeout(() => setStepIndex(frames.find(index => index > stepIndex) ?? trace.steps.length), Math.round(900 / speed));
    return () => window.clearTimeout(timer);
  }, [playing, trace, speed, frames, stepIndex, prediction]);
  const navigate = (next: number) => {
    if (prediction || loading || !trace) return;
    setPlaying(false); setStepIndex(Math.max(1, Math.min(trace.steps.length, next)));
  };
  const togglePlayback = () => {
    if (prediction || loading || !trace) return;
    if (stepIndex === trace.steps.length) setStepIndex(1);
    setPlaying(value => !value);
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('input, textarea, select, button, summary, [contenteditable="true"]')) return;
      if (e.key.toLowerCase() === 'c') { e.preventDefault(); setShowCode(value => !value); }
      else if (trace && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
        e.preventDefault(); navigate(e.key === 'ArrowRight' ? frames.find(index => index > stepIndex) ?? trace.steps.length : [...frames].reverse().find(index => index < stepIndex) ?? 1);
      } else if (e.key === ' ') { e.preventDefault(); togglePlayback(); }
      else if (e.key.toLowerCase() === 'r') { e.preventDefault(); navigate(1); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [trace, stepIndex, frames, prediction, loading]);
  const chooseLesson = (next: Lesson) => {
    setLesson(next); setDraft(next.defaults); setDefinitionMode('empty'); setIsDefined(false);
    setValuesText(''); setEdgesText(''); setTrace(null); setPrediction(null); setExperimentNote('');
    customValues.current = next.exampleValues.join(', ');
    customEdges.current = next.id === 'graph' ? '0-1, 0-2, 1-3, 2-4' : '';
    void load(next.defaults, 'preview');
  };
  const chooseDefinition = (next: 'empty' | 'custom') => {
    setDefinitionMode(next); setValuesText(next === 'empty' ? '' : customValues.current); setEdgesText(next === 'empty' ? '' : customEdges.current);
  };
  const chooseOperation = (operation: string) => {
    if (!isDefined && operation !== 'define') return;
    setPlaying(false); setPrediction(null); if (trace && isDefined) setStepIndex(trace.steps.length);
    setDraft(value => ({ ...value, operation }));
    if (operation === 'define') chooseDefinition(definitionMode);
  };
  const prepare = (params: SimulationParams, note = '') => {
    setDraft({ ...params, operation: params.operation === 'define' ? nextOperation(params.structure) : params.operation });
    setDefinitionMode('custom'); setValuesText(params.values.join(', '));
    setEdgesText(params.edges?.map(([u, v]) => `${u}-${v}`).join(', ') ?? ''); setExperimentNote(note);
    void load(params, params.operation === 'define' ? 'setup' : 'run');
  };
  const parseInputs = (): SimulationParams | null => {
    const empty = draft.operation === 'define' && definitionMode === 'empty';
    const tokens = empty || !valuesText.trim() ? [] : valuesText.split(',').map(value => value.trim());
    if (tokens.some(value => !/^-?\d+$/.test(value))) { setError('Enter comma-separated integers, or leave the values empty.'); return null; }
    const edges: number[][] = [];
    if (lesson.id === 'graph' && !empty && edgesText.trim()) {
      for (const item of edgesText.split(',')) {
        const match = item.match(/^\s*(-?\d+)\s*-\s*(-?\d+)\s*$/);
        if (!match) { setError('Use edges such as 0-1, 0-2. Each edge needs two integer vertices.'); return null; }
        edges.push([Number(match[1]), Number(match[2])]);
      }
    }
    return { ...draft, values: tokens.map(Number), edges };
  };
  const run = () => { const params = parseInputs(); if (params) { setExperimentNote(''); void load(params); } };
  const directAction = (operation: string, patch: Partial<SimulationParams> = {}) => {
    const params = parseInputs(); if (!params || !isDefined || loading) return;
    const next = { ...params, ...patch, operation };
    setDraft(next); setExperimentNote(''); void load(next);
  };
  const insertAt = (index: number) => {
    chooseOperation('insert'); setDraft(value => ({ ...value, operation: 'insert', insertIndex: index }));
    operationRef.current?.scrollIntoView({ block: 'nearest', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    window.setTimeout(() => operationRef.current?.querySelector<HTMLInputElement>('[aria-label="Value"]')?.focus({ preventScroll: true }), 0);
  };
  const editAt = (index: number, value: number) => {
    const params = parseInputs(); if (!params || !Number.isInteger(value) || Math.abs(value) > 1000000) return;
    const values = [...params.values]; values[index] = value;
    prepare({ ...params, operation: 'define', values }, 'Value updated. Try an operation on your edited array.');
  };
  const changeMode = (next: ExperienceMode) => { setMode(next); setPrediction(null); setPlaying(false); if (next === 'explore' && trace && isDefined) setStepIndex(trace.steps.length); };
  const reset = () => {
    setIsDefined(false); setDefinitionMode('empty'); setValuesText(''); setEdgesText(''); setDraft(lesson.defaults); setPrediction(null); setExperimentNote('');
    void load(lesson.defaults, 'preview');
  };
  const toggleTheme = (e: React.MouseEvent<HTMLButtonElement>) => {
    const nextDark = !dark;
    const apply = () => { setDark(nextDark); document.documentElement.classList.toggle('dark', nextDark); };
    if (!document.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches || navigator.webdriver) { apply(); return; }
    const rect = e.currentTarget.getBoundingClientRect(), x = e.clientX || rect.left + rect.width / 2, y = e.clientY || rect.top + rect.height / 2;
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const transition = document.startViewTransition(() => flushSync(apply));
    void transition.ready.then(() => document.documentElement.animate({ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] }, { duration: 500, easing: 'ease-in-out', pseudoElement: '::view-transition-new(root)' })).catch(() => apply());
  };
  const modes = [
    { id: 'learn' as const, label: 'Learn', icon: BookOpen, description: 'Follow the changes, one key step at a time.' },
    { id: 'explore' as const, label: 'Explore', icon: MousePointerClick, description: 'Build, edit, and experiment. Results appear immediately.' },
    { id: 'predict' as const, label: 'Predict', icon: Brain, description: 'Make a prediction, then watch the algorithm explain it.' },
  ];
  const complete = !!trace && stepIndex === trace.steps.length;
  const result = trace?.metadata.result;
  const operationControls = <OperationForm lesson={lesson} draft={draft} onDraft={setDraft} onOperation={chooseOperation} values={valuesText} onValues={value => { setValuesText(value); customValues.current = value; }} edges={edgesText} onEdges={value => { setEdgesText(value); customEdges.current = value; }} definitionMode={definitionMode} onDefinitionMode={chooseDefinition} isDefined={isDefined} onResetDefinition={reset} loading={loading} onRun={run} />;
  return <div className="min-h-screen bg-slate-100 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
    <header ref={headerRef} className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <a href="#workspace" className="flex items-center gap-2.5 font-display font-bold"><span className="algo-primary flex h-9 w-9 items-center justify-center rounded-xl"><Asterisk size={22} /></span>AlgoFrame<span className="ml-2 hidden text-xs font-normal text-slate-500 sm:inline dark:text-slate-400">a playground for curious minds</span></a>
        <div className="flex items-center gap-2"><button type="button" data-action="toggle-code" className="play-chip" onClick={() => setShowCode(value => !value)} aria-expanded={showCode}><Code2 size={15} /><span className="hidden sm:inline">{showCode ? 'Hide' : 'Show'}</span> Python</button><button type="button" className="play-icon" onClick={toggleTheme} aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}>{dark ? <Sun size={18} /> : <Moon size={18} />}</button></div>
      </div>
      <PlaybackBar key={executionId} trace={trace} stepIndex={stepIndex} playing={playing} loading={loading} locked={!!prediction} speed={speed} onSpeedChange={setSpeed} frames={frames} stepMode={stepMode} onStepMode={setStepMode} onNavigate={navigate} onToggle={togglePlayback} />
    </header>
    <div className="mx-auto flex max-w-[1600px] flex-col gap-5 px-4 py-6 sm:px-6 xl:flex-row xl:gap-8">
      <aside className="workspace-sticky min-w-0 xl:sticky xl:w-44 xl:shrink-0 xl:self-start">
        <p className="mb-3 hidden px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500 xl:block dark:text-slate-400">Your playground</p>
        <nav aria-label="Lecture topics" className="flex gap-2 overflow-x-auto pb-2 xl:flex-col xl:overflow-visible">{LESSONS.map((item, i) => <button key={item.id} type="button" data-lesson={item.id} aria-current={lesson.id === item.id ? 'page' : undefined} onClick={() => chooseLesson(item)} className={`group flex min-h-11 shrink-0 items-center gap-3 rounded-xl px-3 py-3 text-left text-xs transition-colors ${lesson.id === item.id ? 'algo-selected' : 'text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-900'}`}><span className="font-mono text-[10px] opacity-75">{String(i + 1).padStart(2, '0')}</span>{item.title}{lesson.id === item.id && <ArrowRight className="ml-auto h-3.5 w-3.5" />}</button>)}</nav>
      </aside>
      <main id="workspace" className="min-w-0 flex-1 scroll-mt-44 space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-sage-700 dark:text-sage-300">See it. Try it. Understand it.</p><h1 className="font-display text-3xl font-bold tracking-tight">{lesson.title}</h1><p className="mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-300">{lesson.description}</p></div>
          <div className="flex gap-1 rounded-2xl border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-900" role="group" aria-label="Learning mode">{modes.map(item => <button type="button" key={item.id} data-mode={item.id} aria-pressed={mode === item.id} onClick={() => changeMode(item.id)} className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-xs font-semibold ${mode === item.id ? 'bg-sage-50 text-sage-800 dark:bg-sage-950 dark:text-sage-200' : 'text-slate-500 dark:text-slate-400'}`}><item.icon size={15} />{item.label}</button>)}</div>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">{modes.find(item => item.id === mode)!.description}</p>
        {!isDefined && <section className="play-welcome play-panel p-5 sm:p-7"><div className="flex items-start gap-4"><span className="hidden rounded-2xl bg-sage-100 p-3 text-sage-700 sm:block dark:bg-sage-950 dark:text-sage-300"><Sparkles size={26} /></span><div><h2 className="font-display text-xl font-bold">Make your first move.</h2><p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">Start with a small example, then change it yourself. Every value has a story. Every operation shows you how it works.</p><div className="mt-5 flex flex-wrap gap-3"><button type="button" data-action="try-example" disabled={loading} className="algo-primary inline-flex min-h-11 items-center gap-2 rounded-xl px-5 text-sm font-semibold" onClick={() => prepare(exampleParams(lesson))}>Try this example<ArrowRight size={16} /></button><button type="button" disabled={loading} className="play-chip" onClick={() => prepare({ ...lesson.defaults, operation: 'define' })}>Start empty</button></div></div></div></section>}
        <div ref={operationRef} className="play-panel scroll-mt-44 p-4 sm:p-5">{isDefined ? operationControls : <details><summary className="min-h-8 cursor-pointer content-center text-sm font-semibold">Create my own starting structure</summary><div className="mt-4">{operationControls}</div></details>}</div>
        {error && <div role="alert" className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200">{error}</div>}
        {loading && <p role="status" className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300"><span className="h-2 w-2 animate-pulse rounded-full bg-sage-500" />Preparing your next move…</p>}
        {experimentNote && <p className="flex items-center gap-2 text-sm text-sage-800 dark:text-sage-200"><FlaskConical size={16} />{experimentNote}</p>}
        {prediction && <PredictionCard key={executionId} prediction={prediction} onContinue={() => { setPrediction(null); setPlaying(true); }} />}
        {trace && step && <>
          <div className={`grid min-w-0 items-start gap-5 ${showCode ? 'lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.65fr)]' : ''}`}>
            <LearningCanvas key={lesson.id} trace={trace} step={step} narration={describeStep(trace, stepIndex)} editable={isDefined && complete && !loading && !prediction} onInsert={insertAt} onEdit={editAt} onAction={directAction} />
            {showCode && <div className="workspace-sticky min-w-0 lg:sticky"><PythonCodeBox containerRef={codeRef} filename={trace.python_filename} code={trace.python_code} activeLine={step.python_line} isOpen={showCode} onToggleOpen={() => setShowCode(value => !value)} sidePanel /></div>}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-xs text-slate-500 dark:text-slate-400"><p><strong className="text-slate-700 dark:text-slate-200">{lesson.principle}</strong></p><p aria-live="polite">{complete && !prediction ? `Result: ${result === null ? 'None' : typeof result === 'boolean' ? result ? 'True' : 'False' : JSON.stringify(result)}` : 'Follow the animation, or drag the timeline.'}</p></div>
          <details className="play-panel p-4 sm:p-5"><summary className="cursor-pointer text-sm font-semibold">Why this costs what it costs <span className="ml-2 font-mono text-xs text-sage-700 dark:text-sage-300">{trace.analysis?.worst_time}</span></summary><div className="mt-4"><ComplexityPanel trace={trace} /></div></details>
        </>}
        <section aria-label="Experiments" className="space-y-3"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="flex items-center gap-2 font-display text-base font-bold"><FlaskConical size={18} />What happens if…</h2><span className="text-xs text-slate-500 dark:text-slate-400">Each experiment replaces the current example.</span></div><div className="grid gap-3 sm:grid-cols-2">{experimentsFor(lesson).map(experiment => <button key={experiment.id} type="button" data-experiment={experiment.id} disabled={loading} className="play-panel group flex items-center gap-3 p-4 text-left transition-colors hover:border-sage-400" onClick={() => prepare(experiment.params, experiment.description)}><span className="rounded-xl bg-sage-50 p-2 text-sage-700 dark:bg-sage-950 dark:text-sage-300"><Sparkles size={18} /></span><span className="min-w-0 flex-1"><strong className="block text-sm">{experiment.title}</strong><span className="mt-1 block text-xs leading-relaxed text-slate-500 dark:text-slate-400">{experiment.description}</span></span><ArrowRight size={16} className="shrink-0 text-slate-400 transition-transform group-hover:translate-x-1" /></button>)}</div></section>
        <button type="button" data-action="open-comparison" aria-expanded={showComparison} onClick={() => setShowComparison(value => !value)} className="play-chip"><ArrowRightLeft size={16} />{showComparison ? 'Close comparison' : 'Compare array vs linked list'}</button>
        {showComparison && <ComparisonLab />}
        <p className="pb-4 text-[10px] text-slate-500 dark:text-slate-400">Keyboard: ← / → step · Space play / pause · R replay · C Python. Memory addresses are illustrative.</p>
      </main>
    </div>
  </div>;
}
