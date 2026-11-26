import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, ChevronUp, Code2, Copy } from 'lucide-react';

interface PythonCodeBoxProps {
  filename: string;
  code: string;
  activeLine: number;
  isOpen: boolean;
  onToggleOpen: () => void;
  containerRef?: React.RefObject<HTMLElement | null>;
  sidePanel?: boolean;
}

const PYTHON_KEYWORDS = new Set([
  'class',
  'def',
  'if',
  'else',
  'elif',
  'for',
  'in',
  'while',
  'return',
  'raise',
  'None',
  'True',
  'False',
  'and',
  'or',
  'not',
  'is',
]);

function renderTokenizedLine(line: string): React.ReactNode {
  if (!line.trim()) return ' ';
  const parts = line.split(/(\s+|[()[\]:.,=<>+-]+|"[^"]*"|'[^']*')/g);
  return parts.map((part, idx) => {
    if (!part) return null;
    if (part.startsWith('"') || part.startsWith("'")) {
      return (
        <span key={idx} className="text-emerald-700 dark:text-emerald-400">
          {part}
        </span>
      );
    }
    if (PYTHON_KEYWORDS.has(part)) {
      return (
        <span key={idx} className="font-semibold text-lavender-700 dark:text-sage-400">
          {part}
        </span>
      );
    }
    if (/^\d+$/.test(part)) {
      return (
        <span key={idx} className="text-amber-700 dark:text-amber-300">
          {part}
        </span>
      );
    }
    if (part === 'self') {
      return (
        <span key={idx} className="italic text-rose-700 dark:text-rose-400">
          {part}
        </span>
      );
    }
    return <span key={idx}>{part}</span>;
  });
}

export const PythonCodeBox: React.FC<PythonCodeBoxProps> = ({
  filename,
  code,
  activeLine,
  isOpen,
  onToggleOpen,
  containerRef,
  sidePanel = false,
}) => {
  const [copied, setCopied] = useState(false);
  const activeLineRef = useRef<HTMLDivElement | null>(null);
  const lines = code.split('\n');

  useEffect(() => {
    if (isOpen && activeLineRef.current) {
      const line = activeLineRef.current;
      const panel = line.parentElement;
      if (panel) {
        const delta = line.getBoundingClientRect().top - panel.getBoundingClientRect().top;
        if (delta < 0 || delta + line.offsetHeight > panel.clientHeight) {
          panel.scrollTo({ top: panel.scrollTop + delta - panel.clientHeight / 3,
            behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
        }
      }
    }
  }, [activeLine, isOpen]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section
      ref={containerRef}
      aria-label="Synchronized Python Implementation"
      className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900"
    >
      {/* Code Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-center gap-2.5 min-w-0">
          <Code2 className="h-4 w-4 shrink-0 text-sage-600 dark:text-sage-400" aria-hidden="true" />
          <span className="truncate font-mono text-xs font-semibold text-slate-800 dark:text-slate-100">
            {filename}
          </span>
          <span className="rounded-full border border-cyan-200 bg-cyan-50 px-2 py-0.5 font-mono text-[10px] font-semibold text-cyan-700 dark:border-cyan-800/80 dark:bg-cyan-950/70 dark:text-cyan-300">
            Active Line
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Copy Python</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onToggleOpen}
            aria-expanded={isOpen}
            className="inline-flex items-center gap-1 whitespace-nowrap rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {isOpen ? (
              <>
                <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Collapse</span>
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Expand</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Lines */}
      {isOpen && (
        <div className={`${sidePanel ? 'max-h-[500px] lg:max-h-[580px]' : 'max-h-[340px]'} overflow-auto bg-white py-2 font-mono text-[13px] leading-6 dark:bg-slate-950/60`}>
          {lines.map((line, index) => {
            const lineNumber = index + 1;
            const isActive = lineNumber === activeLine;
            return (
              <div
                key={lineNumber}
                ref={isActive ? activeLineRef : undefined}
                data-line={lineNumber}
                aria-current={isActive ? 'step' : undefined}
                className={`flex items-start px-4 transition-colors ${
                  isActive
                    ? 'bg-sage-50 text-slate-950 ring-1 ring-inset ring-sage-200 dark:bg-sage-950/50 dark:text-slate-50 dark:ring-sage-800/70'
                    : 'text-slate-700 hover:bg-slate-50/80 dark:text-slate-300 dark:hover:bg-slate-900/50'
                }`}
              >
                <span
                  className={`mr-4 inline-flex w-9 shrink-0 select-none items-center justify-end gap-1 text-right text-xs ${
                    isActive
                      ? 'font-bold text-sage-700 dark:text-sage-400'
                      : 'text-slate-400 dark:text-slate-600'
                  }`}
                >
                  {isActive && (
                    <span className="text-[10px]" aria-hidden="true">
                      ▶
                    </span>
                  )}
                  <span>{lineNumber}</span>
                </span>
                <pre className="whitespace-pre font-mono text-[13px]">
                  {renderTokenizedLine(line)}
                </pre>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
