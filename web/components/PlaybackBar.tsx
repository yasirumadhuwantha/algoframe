import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from 'lucide-react';
import type { SimulationTrace } from '../types/traceTypes';
import type { StepMode } from '../data/playground';
interface Props {
  trace: SimulationTrace | null; stepIndex: number; playing: boolean; loading: boolean; locked: boolean;
  speed: 0.5 | 1 | 2; onSpeedChange: (speed: 0.5 | 1 | 2) => void;
  frames: number[]; stepMode: StepMode; onStepMode: (mode: StepMode) => void;
  onNavigate: (step: number) => void; onToggle: () => void;
}
export function PlaybackBar({ trace, stepIndex, playing, loading, locked, speed, onSpeedChange, frames, stepMode, onStepMode, onNavigate, onToggle }: Props) {
  const unavailable = !trace || loading || locked;
  const position = Math.max(0, frames.findIndex(index => index >= stepIndex));
  const total = Math.max(1, frames.length);
  return <section aria-label="Steps playback" className="border-t border-slate-200 dark:border-slate-800">
    <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
      <div className="min-w-24"><p className="font-mono text-[11px] font-semibold">{loading ? 'Preparing…' : locked ? 'Your prediction' : `Step ${position + 1} / ${total}`}</p><p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">{trace ? `Python line ${trace.steps[stepIndex - 1].python_line}` : 'Choose an example'}</p></div>
      <div className="flex items-center gap-1">
        <button type="button" className="play-icon" disabled={unavailable} onClick={() => onNavigate(1)} aria-label="Reset to first step"><RotateCcw size={16} /></button>
        <button type="button" className="play-icon" disabled={unavailable || stepIndex === 1} onClick={() => onNavigate([...frames].reverse().find(index => index < stepIndex) ?? 1)} aria-label="Previous step"><ChevronLeft size={18} /></button>
        <button type="button" className="algo-primary flex h-11 w-11 items-center justify-center rounded-full" disabled={unavailable} onClick={onToggle} aria-label={playing ? 'Pause playback' : 'Play execution'}>{playing ? <Pause size={18} /> : <Play size={18} />}</button>
        <button type="button" className="play-icon" disabled={unavailable || stepIndex === trace?.steps.length} onClick={() => onNavigate(frames.find(index => index > stepIndex) ?? frames.at(-1)!)} aria-label="Next step"><ChevronRight size={18} /></button>
      </div>
      <input className="order-last h-5 w-full min-w-0 accent-sage-700 md:order-none md:w-auto md:flex-1 dark:accent-sage-400" type="range" min={1} max={total} value={position + 1} disabled={unavailable} onChange={e => onNavigate(frames[Number(e.target.value) - 1])} aria-label="Execution step" />
      <button type="button" className="play-chip font-mono text-xs" onClick={() => onSpeedChange(speed === 1 ? 2 : speed === 2 ? 0.5 : 1)} aria-label={`Playback speed ${speed}x`}>{speed}×</button>
      <div className="ml-auto flex rounded-xl border border-slate-200 p-1 dark:border-slate-700" role="group" aria-label="Step detail">
        {(['concepts', 'lines'] as const).map(mode => <button key={mode} type="button" data-playback={mode} disabled={locked || loading} aria-pressed={stepMode === mode} className={`min-h-9 rounded-lg px-3 text-xs ${stepMode === mode ? 'bg-slate-100 font-semibold dark:bg-slate-800' : 'text-slate-500 dark:text-slate-400'}`} onClick={() => onStepMode(mode)}>{mode === 'concepts' ? 'Key steps' : 'Python lines'}</button>)}
      </div>
    </div>
  </section>;
}
