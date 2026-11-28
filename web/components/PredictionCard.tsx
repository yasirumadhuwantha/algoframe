import { useEffect, useRef, useState } from 'react';
import { Brain, ArrowRight } from 'lucide-react';
import type { Prediction } from '../data/playground';

export function PredictionCard({ prediction, onContinue }: { prediction: Prediction; onContinue: () => void }) {
  const [picked, setPicked] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const correct = picked === prediction.answer;
  useEffect(() => { headingRef.current?.focus({ preventScroll: true }); }, []);
  return <section aria-label="Prediction challenge" className="algo-panel-enter rounded-2xl border border-lavender-300 bg-lavender-50 p-5 dark:border-lavender-700 dark:bg-lavender-950">
    <p className="mb-2 flex items-center gap-2 text-xs font-semibold text-lavender-700 dark:text-lavender-200"><Brain size={16} />PAUSE &amp; PREDICT</p>
    <h2 ref={headingRef} tabIndex={-1} className="font-display text-lg font-bold">{prediction.question}</h2>
    <div className="my-4 flex flex-wrap gap-2">{prediction.choices.map(choice => <button type="button" key={choice} disabled={correct} data-answer={choice === prediction.answer ? 'correct' : 'wrong'}
      aria-pressed={picked === choice} className={`play-chip min-w-16 ${picked === choice ? 'algo-selected' : ''}`} onClick={() => setPicked(choice)}>{choice}</button>)}</div>
    <p role="status" className="min-h-5 text-sm">{correct ? `Exactly! ${prediction.explanation}` : picked !== null ? 'Try again. Think about the starting structure and the operation you chose.' : 'Take a guess. You can retry as often as you like.'}</p>
    <button type="button" data-action="reveal-prediction" onClick={onContinue} className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-lavender-800 dark:text-lavender-200">{correct ? 'Watch it happen' : 'Show me how'}<ArrowRight size={16} /></button>
  </section>;
}
