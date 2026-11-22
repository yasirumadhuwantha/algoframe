import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from 'lucide-react';
import type { SimulationTrace } from '../types/traceTypes';

interface Props {
  trace: SimulationTrace | null;
  stepIndex: number;
  playing: boolean;
  loading: boolean;
  onNavigate: (step: number) => void;
  onToggle: () => void;
}

export function PlaybackBar({ trace, stepIndex, playing, loading, onNavigate, onToggle }: Props) {
  const unavailable = !trace || loading;
  const total = trace?.steps.length ?? 1;
  const button = 'inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 text-xs font-medium transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-45 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800';
  return <section aria-label="Steps playback" className="border-t border-slate-200 dark:border-slate-800">
    <div className="mx-auto flex max-w-[1800px] flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5 sm:px-6">
      <div className="min-w-[88px] flex-1 sm:flex-none"><p className="font-mono text-[11px] font-semibold" aria-live="polite">{unavailable ? 'Preparing execution' : `Step ${stepIndex} / ${total}`}</p><p className="mt-0.5 font-mono text-[10px] text-slate-600 dark:text-slate-300">{trace && !loading ? `Python line ${trace.steps[stepIndex - 1].python_line}` : 'Define your initial state'}</p></div>
      <input className="order-last w-full min-w-0 accent-sage-700 sm:order-none sm:w-auto sm:flex-1 dark:accent-sage-300" type="range" min={1} max={total} value={trace ? stepIndex : 1} disabled={unavailable} onChange={e => onNavigate(Number(e.target.value))} aria-label="Execution step" />
      <div className="flex items-center gap-1.5">
        <button className={button} disabled={unavailable} onClick={() => onNavigate(1)} aria-label="Reset to first step"><RotateCcw className="h-3.5 w-3.5" /></button>
        <button className={button} disabled={unavailable || stepIndex === 1} onClick={() => onNavigate(Math.max(1, stepIndex - 1))} aria-label="Previous step"><ChevronLeft className="h-3.5 w-3.5" /></button>
        <button className={button} disabled={unavailable} onClick={onToggle} aria-label={playing ? 'Pause playback' : 'Play execution'}>{playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}</button>
        <button className="algo-primary inline-flex h-9 items-center gap-1 rounded-md px-3 text-xs font-medium disabled:opacity-45" aria-label="Next step" disabled={unavailable || stepIndex === total} onClick={() => onNavigate(Math.min(total, stepIndex + 1))}><span className="hidden sm:inline">Next</span><ChevronRight className="h-3.5 w-3.5" aria-hidden="true" /></button>
      </div>
      <p className="hidden font-mono text-[10px] text-slate-600 2xl:block dark:text-slate-300">← / → step · Space play · R reset · C code</p>
    </div>
  </section>;
}
