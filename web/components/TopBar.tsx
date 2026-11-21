import React, { useState } from 'react';
import {
  Code2,
  Keyboard,
  Moon,
  Pause,
  Play,
  Sun,
  X,
} from 'lucide-react';
import type { StructureType } from '../types/traceTypes';

interface TopBarProps {
  activeStructure: StructureType;
  onSelectStructure: (structure: StructureType) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  showCode: boolean;
  onToggleCode: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onLoadPreset: (preset: 'sll_default' | 'dll_default' | 'array_shift' | 'array_realloc' | 'bst_default') => void;
}

const STRUCTURE_TABS: { id: StructureType; label: string }[] = [
  { id: 'singly_linked_list', label: 'Singly Linked List' },
  { id: 'doubly_linked_list', label: 'Doubly Linked' },
  { id: 'dynamic_array', label: 'Dynamic Array' },
  { id: 'binary_tree', label: 'Binary Tree' },
];

export const TopBar: React.FC<TopBarProps> = ({
  activeStructure,
  onSelectStructure,
  isPlaying,
  onTogglePlay,
  showCode,
  onToggleCode,
  isDark,
  onToggleTheme,
  onLoadPreset,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2.5 sm:px-6">
        {/* Brand Lockup */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="algo-primary flex h-8 w-8 items-center justify-center rounded-lg">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="4" width="7" height="7" rx="1.5" />
              <rect x="14" y="13" width="7" height="7" rx="1.5" />
              <path d="M10 7.5h4.5a2 2 0 0 1 2 2V13" />
            </svg>
          </div>
          <div className="flex items-baseline gap-2 whitespace-nowrap">
            <span className="font-display text-base font-bold tracking-tight text-slate-900 dark:text-slate-50">
              AlgoFrame
            </span>
            <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">
              /
            </span>
            <span className="font-mono text-[11px] font-semibold tracking-wider text-slate-500 dark:text-slate-400">
              VISUALIZER
            </span>
          </div>
        </div>

        {/* Structure Selector */}
        <nav
          aria-label="Data Structure Selector"
          className="hidden lg:flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100/80 p-1 dark:border-slate-800 dark:bg-slate-900"
        >
          {STRUCTURE_TABS.map((tab) => {
            const active = tab.id === activeStructure;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectStructure(tab.id)}
                className={`whitespace-nowrap shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-600 dark:focus-visible:outline-sage-300 ${
                  active
                    ? 'algo-selected'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Controls */}
        <div className="relative ml-auto flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onTogglePlay}
            className={`inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-600 dark:focus-visible:outline-sage-300 ${
              isPlaying
                ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700/60 dark:bg-emerald-950/60 dark:text-emerald-300'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
            title="Toggle auto-playback (Space)"
          >
            {isPlaying ? (
              <Pause className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <Play className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            <span>{isPlaying ? 'Auto-playing' : 'Paused'}</span>
          </button>

          <button
            type="button"
            onClick={onToggleCode}
            className={`inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-600 dark:focus-visible:outline-sage-300 ${
              showCode
                ? 'algo-selected'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
            title="Toggle & focus Python code box (Shortcut: C)"
          >
            <Code2 className="h-3.5 w-3.5" aria-hidden="true" />
            <span>View Code</span>
            <kbd className="ml-0.5 hidden rounded bg-slate-200/80 px-1 py-0.2 font-mono text-[10px] text-slate-600 sm:inline dark:bg-slate-800 dark:text-slate-300">
              C
            </kbd>
          </button>

          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-600 dark:focus-visible:outline-sage-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Session presets and keyboard shortcuts"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 font-mono text-xs font-semibold text-white transition-colors hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-600 dark:focus-visible:outline-sage-300 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
          >
            AL
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-11 z-40 w-72 rounded-xl border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-2 flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-slate-100">
                  <Keyboard className="h-3.5 w-3.5 text-sage-600 dark:text-sage-400" />
                  <span>Presets & Shortcuts</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  aria-label="Close menu"
                  className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="space-y-1 text-xs">
                <p className="px-1.5 py-1 font-medium text-slate-500 dark:text-slate-400">
                  Quick Scenarios
                </p>
                {[
                  { id: 'sll_default' as const, label: 'SLL Splice (val 67 @ idx 2)' },
                  { id: 'dll_default' as const, label: 'Doubly Linked 4-Ptr Rewire' },
                  { id: 'array_shift' as const, label: 'Dynamic Array In-Place Shift' },
                  { id: 'array_realloc' as const, label: 'Dynamic Array 2x Realloc' },
                  { id: 'bst_default' as const, label: 'BST Ordered Leaf Insert' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onLoadPreset(item.id);
                      setMenuOpen(false);
                    }}
                    className="w-full rounded-md px-2 py-1.5 text-left text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <div className="mt-2.5 border-t border-slate-100 pt-2 text-[11px] text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <div className="flex justify-between py-0.5">
                  <span>Prev / Next Step</span>
                  <span className="font-mono">← / →</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span>Auto-play / Pause</span>
                  <span className="font-mono">Space</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span>Toggle Python Code</span>
                  <span className="font-mono">C</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile/Tablet Structure Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto border-t border-slate-100 px-4 py-1.5 lg:hidden dark:border-slate-800">
        {STRUCTURE_TABS.map((tab) => {
          const active = tab.id === activeStructure;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectStructure(tab.id)}
              className={`whitespace-nowrap shrink-0 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                active
                  ? 'algo-selected'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};
