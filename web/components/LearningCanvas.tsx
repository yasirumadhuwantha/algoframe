import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { ArrowRight, MousePointerClick, Plus, X } from 'lucide-react';
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from 'motion/react';
import type { SimulationParams, SimulationStep, SimulationTrace, VisualEntity } from '../types/traceTypes';
import { LinkedNodeCard } from './LinkedNodeCard';

const SPRING = { type: 'spring' as const, stiffness: 240, damping: 26 };
interface Props {
  trace: SimulationTrace; step: SimulationStep; narration: { title: string; text: string }; editable: boolean;
  onInsert: (index: number) => void; onEdit: (index: number, value: number) => void;
  onAction: (operation: string, patch?: Partial<SimulationParams>) => void;
}
export function LearningCanvas({ trace, step, narration, editable, onInsert, onEdit, onAction }: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const [editValue, setEditValue] = useState('');
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [transfer, setTransfer] = useState<{ fromX: number; toX: number; y: number; value: number | string | null } | null>(null);
  const reduced = useReducedMotion();
  const markerId = useId().replace(/:/g, '');
  const kind = trace.structure;
  const selectedNode = step.nodes.find(n => n.id === selected.at(-1));
  const graph = kind === 'graph';
  const linked = kind.includes('linked_list');
  useEffect(() => { setSelected([]); }, [trace]);
  useLayoutEffect(() => {
    setTransfer(null);
    if (kind !== 'dynamic_array' || reduced || !stageRef.current) return;
    const line = trace.python_code.split('\n')[step.python_line - 1];
    const index = step.variables?.i;
    if (typeof index !== 'number') return;
    const source = line.includes('data[i] = data[i - 1]') ? index - 1 : line.includes('data[i] = data[i + 1]') ? index + 1 : null;
    if (source === null) return;
    const stage = stageRef.current;
    const from = stage.querySelector<HTMLElement>(`[data-slot="${source}"]`);
    const to = stage.querySelector<HTMLElement>(`[data-slot="${index}"]`);
    if (!from || !to) return;
    const origin = stage.getBoundingClientRect(), a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
    setTransfer({ fromX: a.left - origin.left + stage.scrollLeft, toX: b.left - origin.left + stage.scrollLeft, y: b.top - origin.top + stage.scrollTop, value: step.nodes.find(n => n.index === index)?.val ?? null });
  }, [trace, step, kind, reduced]);
  const select = (node: VisualEntity) => {
    setSelected(previous => previous.includes(node.id) ? previous.filter(id => id !== node.id) : graph ? [...previous.slice(-1), node.id] : [node.id]);
    setEditValue(String(node.val ?? ''));
  };
  const tone = (node: VisualEntity) => `algo-node rounded-xl border shadow-xs ${selected.includes(node.id) ? 'ring-2 ring-cyan-600 ring-offset-2 dark:ring-offset-slate-900' : ''} ${node.highlight_state === 'active' ? 'algo-node-active border-sage-600 bg-sage-100 text-slate-950 dark:bg-sage-950 dark:text-sage-100' : node.highlight_state === 'verified' ? 'algo-node-verified border-emerald-500 bg-emerald-50 text-emerald-950 dark:bg-emerald-950 dark:text-emerald-100' : node.val !== null ? 'border-sage-300 bg-sage-50 text-slate-900 dark:border-sage-700 dark:bg-sage-950 dark:text-sage-100' : 'border-dashed border-slate-300 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400'}`;
  const nodeProps = (node: VisualEntity) => ({ 'data-node-id': node.id, 'data-node-value': String(node.val), 'aria-label': `Select ${graph ? 'vertex' : 'value'} ${node.val ?? 'empty slot'}`, 'aria-pressed': selected.includes(node.id), onClick: () => select(node) });
  const cell = (node: VisualEntity) => <button type="button" {...nodeProps(node)} data-slot={node.index} className={`${tone(node)} relative min-h-24 w-24 p-2 text-center`}>
    {kind === 'queue' && node.role_label.includes('FRONT') && <motion.span layoutId="queue-front-marker" transition={reduced ? { duration: 0 } : SPRING} className="pointer-events-none absolute -top-3 left-0 rounded-full bg-cyan-700 px-2 py-1 text-[9px] font-bold text-white">FRONT</motion.span>}
    {kind === 'queue' && node.role_label.includes('REAR') && <motion.span layoutId="queue-rear-marker" transition={reduced ? { duration: 0 } : SPRING} className="pointer-events-none absolute -bottom-3 right-0 rounded-full bg-sage-700 px-2 py-1 text-[9px] font-bold text-white">REAR</motion.span>}
    <span className="block font-mono text-[10px] font-semibold">{node.role_label}</span>
    <AnimatePresence mode="popLayout" initial={false}><motion.strong key={String(node.val)} initial={{ opacity: 0, y: -18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: kind === 'stack' ? -40 : 18 }} transition={{ duration: reduced ? 0 : 0.35 }} className="my-2 block font-mono text-xl">{node.val ?? '∅'}</motion.strong></AnimatePresence>
    <span className="block text-[9px] opacity-75">{node.status_tag}</span>
  </button>;
  const gap = (index: number) => <button type="button" aria-label={`Insert at index ${index}`} disabled={!editable} className="insertion-gap" onClick={() => onInsert(index)}><Plus size={15} /></button>;
  const capacity = step.nodes.length;
  const currentIndex = selectedNode ? step.nodes.indexOf(selectedNode) : -1;
  const pair = selected.map(id => step.nodes.find(n => n.id === id)).filter(Boolean) as VisualEntity[];
  const canEditValue = kind === 'dynamic_array' && selectedNode?.val !== null;
  const transition = reduced ? { duration: 0 } : SPRING;
  const drawEdges = (tree: boolean) => <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" aria-label={tree ? 'Tree references' : 'Undirected graph edges'}>
    {step.edges.map(edge => {
      const from = step.nodes.find(n => n.id === edge.from_id), to = step.nodes.find(n => n.id === edge.to_id);
      if (!from || !to) return null;
      const active = from.highlight_state === 'active' || to.highlight_state === 'active';
      return <motion.line key={edge.id} data-edge={edge.id} initial={{ pathLength: 0, opacity: 0 }} animate={{ x1: from.tree_x!, y1: from.tree_y! + (tree ? 7 : 0), x2: to.tree_x!, y2: to.tree_y!, pathLength: 1, opacity: 1 }} transition={transition} stroke={active ? 'var(--diagram-edge-active)' : 'var(--diagram-edge)'} strokeWidth={active ? 0.8 : 0.45} strokeDasharray={active ? '2 1' : undefined} />;
    })}
  </svg>;
  return <MotionConfig reducedMotion="user"><section aria-label="Algorithm visualization" aria-busy={false} className="play-panel min-w-0 overflow-hidden">
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
      <h2 className="font-display text-sm font-bold">{trace.title}</h2>
      <span className="rounded-full bg-cyan-50 px-3 py-1 font-mono text-[10px] font-semibold text-cyan-800 dark:bg-cyan-950 dark:text-cyan-200">{step.execution_status}</span>
    </div>
    <div ref={stageRef} className="algo-dot-grid relative min-h-[350px] overflow-auto p-5 sm:min-h-[390px]" aria-label={`${kind} state ${step.execution_status === 'READY' ? 'at function entry on' : 'after'} line ${step.python_line}`}>
      {transfer && <motion.div key={step.step_index} data-transfer="element-copy" aria-hidden="true" initial={{ left: transfer.fromX, top: transfer.y, opacity: 1, scale: 1 }} animate={{ left: transfer.toX, top: transfer.y, opacity: [1, 1, 0], scale: [1, 1.08, 1] }} transition={{ duration: 0.65, ease: 'easeInOut' }} className="pointer-events-none absolute z-10 flex h-24 w-24 flex-col items-center justify-center rounded-xl border-2 border-amber-500 bg-amber-100 text-amber-950 shadow-lg dark:bg-amber-950 dark:text-amber-100"><span className="font-mono text-xl font-bold">{transfer.value}</span><span className="text-[9px]">copy →</span></motion.div>}
      {step.nodes.length === 0 ? <div className="flex min-h-72 flex-col items-center justify-center gap-3 text-center text-slate-500 dark:text-slate-400"><span className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700"><Plus size={24} /></span><p className="text-sm">A little space for your next idea.</p><p className="text-xs">Try an example, or start with an empty structure.</p>{linked && gap(0)}</div>
        : graph || kind === 'binary_tree' ? <div className="relative mx-auto" style={{ width: graph ? Math.max(300, step.nodes.length * 28) : Math.max(300, step.nodes.length * 55), height: graph ? Math.max(320, step.nodes.length * 28) : Math.max(320, new Set(step.nodes.map(n => n.tree_y)).size * 90) }}>
          {drawEdges(!graph)}
          <AnimatePresence>{step.nodes.map(node => <motion.div key={node.id} initial={{ opacity: 0, scale: 0.5 }} animate={{ left: `${node.tree_x}%`, top: `${node.tree_y}%`, opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} transition={transition} className={`absolute ${graph ? '-translate-y-1/2' : ''} -translate-x-1/2 text-center`}>
            <button type="button" {...nodeProps(node)} data-vertex={graph ? node.val : undefined} className={`${tone(node)} flex h-16 w-16 items-center justify-center ${graph ? 'rounded-full!' : ''}`}><strong className="font-mono text-sm">{node.val}</strong></button>
            <span className="mt-1 block rounded bg-white/90 px-1 font-mono text-[9px] text-slate-600 dark:bg-slate-900/90 dark:text-slate-200">{node.role_label}</span>
          </motion.div>)}</AnimatePresence>
        </div> : linked ? <div className="relative mx-auto min-h-80" style={{ width: step.nodes.length * (kind === 'doubly_linked_list' ? 370 : 275) + 44 }}>
          <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-label="Node references">
            <defs><marker id={markerId} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke" /></marker></defs>
            {step.nodes.flatMap((node, i) => (['next_addr', ...(kind === 'doubly_linked_list' ? ['prev_addr'] : [])] as ('next_addr' | 'prev_addr')[]).map(field => {
              const target = step.nodes.findIndex(n => n.addr === node[field]);
              if (target < 0) return null;
              const width = kind === 'doubly_linked_list' ? 304 : 208, pitch = width + (kind === 'doubly_linked_list' ? 66 : 67);
              const back = field === 'prev_addr';
              const x1 = 22 + i * pitch + (back ? 0 : width), x2 = 22 + target * pitch + (back ? width : 0);
              const y = back ? 206 : 150;
              const bend = Math.abs(target - i) > 1 || (back ? target > i : target < i);
              return <motion.path key={`${node.id}-${field}`} data-edge={`${node.id}-${field}`} initial={{ opacity: 0, pathLength: 0 }} animate={{ d: bend ? `M ${x1} ${y} C ${x1} ${y-90}, ${x2} ${y-90}, ${x2} ${y}` : `M ${x1} ${y} L ${x2} ${y}`, opacity: 1, pathLength: 1 }} transition={transition} fill="none" stroke={node.highlight_state === 'active' ? 'var(--diagram-edge-active)' : 'var(--diagram-edge)'} strokeWidth="2" markerEnd={`url(#${markerId})`} />;
            }))}
          </svg>
          <AnimatePresence>{step.nodes.map((node, i) => <motion.div key={node.id} initial={{ opacity: 0, y: -55 }} animate={{ left: 22 + i * (kind === 'doubly_linked_list' ? 370 : 275), y: node.lane === 'staging' ? -35 : 0, opacity: 1 }} exit={{ opacity: 0, y: 60 }} transition={transition} className="absolute top-24">
            {editable && <div className="absolute -left-6 top-16">{gap(i)}</div>}
            <button type="button" {...nodeProps(node)} className={`rounded-xl text-left ${selected.includes(node.id) ? 'ring-2 ring-cyan-600 ring-offset-4 dark:ring-offset-slate-900' : ''}`}><LinkedNodeCard node={node} doubly={kind === 'doubly_linked_list'} /></button>
            {i === step.nodes.length - 1 && editable && <div className="absolute -right-8 top-16">{gap(i + 1)}</div>}
          </motion.div>)}</AnimatePresence>
        </div> : kind === 'hash_table' ? <div className="mx-auto max-w-xl space-y-2">{step.nodes.map(node => <motion.div layout key={node.id} transition={transition} className="flex items-center gap-3">
          <span className="w-7 shrink-0 text-right font-mono text-xs text-slate-500">{node.index}</span><ArrowRight size={14} className="shrink-0 text-slate-500" />
          <button type="button" {...nodeProps(node)} className={`${tone(node)} min-h-12 min-w-0 flex-1 break-words px-4 py-3 text-left font-mono text-xs`}>{node.val ?? 'Empty bucket'}{node.highlight_state === 'active' && <span className="ml-2 text-[9px]">← CURRENT</span>}</button>
        </motion.div>)}</div> : kind === 'queue' && capacity <= 12 ? <div className="relative mx-auto" style={{ width: Math.max(340, capacity * 45), height: Math.max(340, capacity * 45) }}>
          <div className="absolute inset-1/4 flex items-center justify-center rounded-full border-2 border-dashed border-slate-200 text-center text-xs text-slate-500 dark:border-slate-700">FIFO<br />↻ wrap around</div>
          {step.nodes.map((node, i) => { const angle = 2 * Math.PI * i / capacity - Math.PI / 2; return <motion.div key={node.id} animate={{ left: `${50 + 35 * Math.cos(angle)}%`, top: `${50 + 35 * Math.sin(angle)}%` }} transition={transition} className="absolute -translate-x-1/2 -translate-y-1/2">{cell(node)}</motion.div>; })}
        </div> : kind === 'stack' ? <div className="mx-auto flex w-48 flex-col-reverse gap-2 border-x-2 border-b-2 border-slate-300 p-3 dark:border-slate-600">
          <AnimatePresence mode="popLayout">{step.nodes.filter(n => n.val !== null).map(node => <motion.button type="button" key={node.id} {...nodeProps(node)} layout initial={{ opacity: 0, y: -60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -60 }} transition={transition} className={`${tone(node)} flex min-h-12 items-center justify-between px-3 py-2`}><span className="text-[10px]">{node.role_label}</span><strong className="font-mono">{node.val}</strong></motion.button>)}</AnimatePresence>
          {!step.nodes.some(n => n.val !== null) && <p className="py-10 text-center text-xs text-slate-500">Empty stack</p>}
        </div> : <div className="flex min-h-80 w-max min-w-full items-center justify-center gap-2">
          <AnimatePresence mode="popLayout">{step.nodes.map((node, i) => <motion.div key={node.id} layout transition={transition} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="flex items-center gap-2">
            {kind === 'dynamic_array' && i <= (trace.metadata.final_values as number[]).length && gap(i)}{cell(node)}
          </motion.div>)}</AnimatePresence>
          {kind === 'dynamic_array' && (trace.metadata.final_values as number[]).length === capacity && gap(capacity)}
        </div>}
    </div>
    <div className="space-y-4 border-t border-slate-200 p-5 dark:border-slate-800">
      <div className="flex gap-3" aria-live="polite" aria-atomic="true"><span className="mt-0.5 h-8 w-1 shrink-0 rounded-full bg-sage-500" /><div><h3 className="text-sm font-bold">{narration.title}</h3><p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{narration.text}</p></div></div>
      {graph && <div className="flex flex-wrap gap-2 text-xs">{['order', 'queue'].filter(key => Array.isArray(step.variables?.[key])).map(key => <span key={key} className="rounded-lg bg-slate-100 px-3 py-2 dark:bg-slate-800"><strong>{key === 'order' ? 'Visited' : 'Waiting queue'}:</strong> {(key === 'queue' ? (step.variables![key] as number[]).slice(Number(step.variables?.front ?? 0)) : step.variables![key] as number[]).join(' → ') || 'empty'}</span>)}{typeof step.variables?.stack === 'string' && <span className="rounded-lg bg-slate-100 px-3 py-2 dark:bg-slate-800"><strong>DFS stack:</strong> {step.variables.stack.replace('items', 'iterator frames')}</span>}</div>}
      {selectedNode ? <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-3 dark:border-cyan-800 dark:bg-cyan-950/50">
        <div className="flex items-start justify-between gap-2"><p className="text-xs"><strong>Selected:</strong> {selectedNode.val ?? 'Empty slot'} · {selectedNode.role_label}</p><button type="button" className="play-icon" aria-label="Clear selection" onClick={() => setSelected([])}><X size={16} /></button></div>
        {editable ? <div className="mt-2 flex flex-wrap items-end gap-2">
          {canEditValue && <form className="flex flex-wrap items-end gap-2" onSubmit={e => { e.preventDefault(); onEdit(currentIndex, Number(editValue)); }}><label className="grid gap-1 text-xs">New value<input className="play-input w-28" aria-label="Edit selected value" type="number" min={-1000000} max={1000000} step={1} required value={editValue} onChange={e => setEditValue(e.target.value)} /></label><button data-action="save-value" type="submit" className="play-chip">Save value</button></form>}
          {['dynamic_array', 'singly_linked_list', 'doubly_linked_list'].includes(kind) && selectedNode.val !== null && <><button className="play-chip" onClick={() => onInsert(currentIndex)}>Insert before</button><button className="play-chip" onClick={() => onAction('delete', { insertIndex: currentIndex })}>Delete selected</button></>}
          {kind === 'binary_tree' && <><button className="play-chip" onClick={() => onAction('search', { insertValue: Number(selectedNode.val) })}>Search for {selectedNode.val}</button><button className="play-chip" onClick={() => onAction('delete', { insertValue: Number(selectedNode.val) })}>Delete selected</button></>}
          {kind === 'stack' && <><button className="play-chip" onClick={() => onAction('pop')}>Pop top</button><button className="play-chip" onClick={() => onAction('peek')}>Peek top</button></>}
          {kind === 'queue' && <><button className="play-chip" onClick={() => onAction('dequeue')}>Dequeue front</button><button className="play-chip" onClick={() => onAction('peek')}>Peek front</button></>}
          {graph && <><button className="play-chip" onClick={() => onAction('bfs', { insertValue: Number(selectedNode.val) })}>BFS from {selectedNode.val}</button><button className="play-chip" onClick={() => onAction('dfs', { insertValue: Number(selectedNode.val) })}>DFS from {selectedNode.val}</button><button className="play-chip" onClick={() => onAction('remove_vertex', { insertValue: Number(selectedNode.val) })}>Remove vertex</button>
            {pair.length === 2 ? <><button data-action="connect-vertices" className="play-chip" onClick={() => onAction('add_edge', { insertValue: Number(pair[0].val), targetVertex: Number(pair[1].val) })}>Connect {pair[0].val} ↔ {pair[1].val}</button><button className="play-chip" onClick={() => onAction('remove_edge', { insertValue: Number(pair[0].val), targetVertex: Number(pair[1].val) })}>Disconnect pair</button></> : <p className="w-full pt-1 text-xs">Select a second vertex to connect or disconnect a pair.</p>}</>}
          {kind === 'hash_table' && <p className="text-xs">Use a key in the operation toolbar to search or change entries in this bucket.</p>}
        </div> : <p className="mt-2 text-xs">Finish playback to edit this structure. You can still inspect each element.</p>}
        <details className="play-details mt-3"><summary>Memory &amp; references</summary><p className="mt-2 break-all font-mono text-[10px]">Illustrative address: {selectedNode.addr} {linked ? ` · next: ${selectedNode.next_addr ?? 'None'} · prev: ${selectedNode.prev_addr ?? 'None'}` : ''}</p></details>
      </div> : <p className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400"><MousePointerClick size={15} />{graph ? 'Select two vertices to connect them. Select one to start a traversal.' : linked || kind === 'dynamic_array' ? 'Select an element to inspect it. Use + to choose an insertion position.' : 'Select an element to inspect it and try an operation.'}</p>}
      <details className="play-details"><summary>Python variables &amp; instruction</summary><code className="my-3 block break-words text-xs">{step.action_text}</code><dl className="flex flex-wrap gap-2">{Object.entries(step.variables ?? {}).map(([name, value]) => <div key={name} className="max-w-full break-words rounded bg-slate-100 px-2 py-1 font-mono text-[10px] dark:bg-slate-800"><dt className="inline text-slate-500 dark:text-slate-400">{name} = </dt><dd className="inline">{value === null ? 'None' : JSON.stringify(value)}</dd></div>)}</dl></details>
    </div>
  </section></MotionConfig>;
}
