import React from 'react';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import type { SimulationStep } from '../types/traceTypes';

interface PhaseControlBarProps {
  phases: string[];
  currentStep: SimulationStep;
  allSteps: SimulationStep[];
  onSelectStepIndex: (stepIndex: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onReset: () => void;
}

export const PhaseControlBar: React.FC<PhaseControlBarProps> = ({
  phases,
  currentStep,
  allSteps,
  onSelectStepIndex,
  onPrev,
  onNext,
  onReset,
}) => {
  const currentPhaseIdx = phases.indexOf(currentStep.phase);

  const handlePhaseClick = (phase: string) => {
    const firstMatch = allSteps.find((s) => s.phase === phase);
    if (firstMatch) {
      onSelectStepIndex(firstMatch.step_index);
    }
  };

  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 bg-white px-4 py-3 sm:px-5 dark:border-slate-800 dark:bg-slate-900/90">
      {/* Phase Steps */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {phases.map((phase, idx) => {
            const isCurrent = phase === currentStep.phase;
            const isPast = idx < currentPhaseIdx;
            return (
              <button
                key={phase}
                type="button"
                onClick={() => handlePhaseClick(phase)}
                className={`inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-600 dark:focus-visible:outline-sage-300 ${
                  isCurrent
                    ? 'algo-selected'
                    : isPast
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
              >
                <span className="font-mono text-[11px] opacity-80">{idx + 1}</span>
                <span>{phase}</span>
              </button>
            );
          })}
        </div>

        {/* Playback Navigation Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onReset}
            aria-label="Reset simulation to step 1"
            className="inline-flex items-center gap-1 whitespace-nowrap shrink-0 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          <button
            type="button"
            onClick={onPrev}
            disabled={currentStep.step_index <= 1}
            className="inline-flex items-center gap-1 whitespace-nowrap shrink-0 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Prev</span>
          </button>

          <button
            type="button"
            onClick={onNext}
            disabled={currentStep.step_index >= currentStep.total_steps}
            className="algo-primary inline-flex items-center gap-1 whitespace-nowrap shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-45"
          >
            <span>Next</span>
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Live Action Readout */}
      <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200/90 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-950">
        <div className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 font-mono text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            Action:
          </span>
          <code
            className="truncate font-mono text-xs font-medium text-slate-900 dark:text-sage-300"
            title={currentStep.action_text}
          >
            {currentStep.action_text}
          </code>
        </div>
        <span className="shrink-0 font-mono text-[11px] text-slate-500 dark:text-slate-400">
          Line {currentStep.python_line}
        </span>
      </div>
    </div>
  );
};
