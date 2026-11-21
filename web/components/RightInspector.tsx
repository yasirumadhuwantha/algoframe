import React from 'react';
import { Check, Circle, Clock, Cpu, Layers } from 'lucide-react';
import type { SimulationStep } from '../types/traceTypes';

interface RightInspectorProps {
  step: SimulationStep;
}

export const RightInspector: React.FC<RightInspectorProps> = ({ step }) => {
  const maxItemDuration = Math.max(
    1,
    ...step.time_breakdown.items.map((item) => item.duration_us)
  );

  const statusTone =
    step.execution_status === 'COMPLETED'
      ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
      : step.execution_status === 'EXECUTING' || step.execution_status === 'SHIFTING'
      ? 'border-sage-300 bg-sage-50 text-sage-800 dark:border-sage-800 dark:bg-sage-950/60 dark:text-sage-300'
      : 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300';

  return (
    <aside className="flex flex-col justify-between gap-4 border-t border-slate-200 bg-white p-5 lg:border-t-0 lg:border-l dark:border-slate-800 dark:bg-slate-900">
      <div className="space-y-4">
        {/* Step Header & Status */}
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-xs font-semibold tracking-wider text-slate-500 dark:text-slate-400">
            STEP {step.step_index} OF {step.total_steps}
          </span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-[11px] font-semibold tracking-wide ${statusTone}`}
          >
            <Cpu className="h-3 w-3" aria-hidden="true" />
            <span>{step.execution_status}</span>
          </span>
        </div>

        {/* Concept Title & Explanation */}
        <div>
          <h2 className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">
            {step.inspector_title}
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {step.inspector_body}
          </p>
        </div>

        {/* Execution Sub-Step Checklist */}
        <div className="space-y-2 border-t border-slate-100 pt-3.5 dark:border-slate-800">
          {step.checklist.map((item) => {
            const isDone = item.status === 'completed';
            const isActive = item.status === 'active';
            return (
              <div
                key={item.id}
                className={`flex items-start gap-2.5 rounded-lg px-2.5 py-2 text-xs transition-colors ${
                  isActive
                    ? 'bg-sage-50/90 text-slate-900 ring-1 ring-sage-200 dark:bg-sage-950/40 dark:text-slate-100 dark:ring-sage-800/70'
                    : isDone
                    ? 'text-slate-700 dark:text-slate-300'
                    : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                <span className="mt-0.5 shrink-0">
                  {isDone ? (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950">
                      <Check className="h-2.5 w-2.5 stroke-[3]" aria-hidden="true" />
                    </span>
                  ) : isActive ? (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full border-2 border-sage-600 bg-white dark:border-sage-400 dark:bg-slate-950">
                      <span className="h-1.5 w-1.5 rounded-full bg-sage-600 dark:bg-sage-400" />
                    </span>
                  ) : (
                    <Circle className="h-4 w-4 text-slate-300 dark:text-slate-700" aria-hidden="true" />
                  )}
                </span>
                <span className={`font-medium leading-snug ${isDone ? 'line-through decoration-slate-300 dark:decoration-slate-600' : ''}`}>
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Metrics Cards: WHERE THE TIME WENT & Memory Shift */}
      <div className="space-y-3 border-t border-slate-100 pt-4 dark:border-slate-800">
        {/* WHERE THE TIME WENT */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 dark:border-slate-800 dark:bg-slate-950/70">
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              <span>WHERE THE TIME WENT</span>
            </div>
            <span className="font-mono text-sm font-bold text-slate-900 dark:text-slate-50">
              {step.time_breakdown.total_us} µs
            </span>
          </div>

          <div className="space-y-2">
            {step.time_breakdown.items.map((item, idx) => {
              const widthPct = Math.max(12, Math.round((item.duration_us / maxItemDuration) * 100));
              const barColor =
                item.category === 'alloc'
                  ? 'bg-amber-500'
                  : item.category === 'pointer'
                  ? 'bg-sage-600 dark:bg-sage-400'
                  : item.category === 'memory'
                  ? 'bg-rose-500'
                  : 'bg-emerald-500';
              return (
                <div key={`${item.label}-${idx}`} className="space-y-1">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="truncate text-slate-700 dark:text-slate-300">
                      {item.label}
                    </span>
                    <span className="shrink-0 font-mono font-medium text-slate-900 dark:text-slate-200">
                      {item.duration_us} µs
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                    <div
                      className={`h-full rounded-full ${barColor}`}
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Memory Shift Card */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 dark:border-slate-800 dark:bg-slate-950/70">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
              <Layers className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" aria-hidden="true" />
              <span>Memory shift</span>
            </div>
            <span
              className={`font-mono text-sm font-bold ${
                step.memory_shift.shifted_elements === 0
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-amber-700 dark:text-amber-400'
              }`}
            >
              {step.memory_shift.shifted_elements}{' '}
              {step.memory_shift.shifted_elements === 1 ? 'element' : 'elements'}
            </span>
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
            {step.memory_shift.comparison_note}
          </p>
        </div>
      </div>
    </aside>
  );
};
