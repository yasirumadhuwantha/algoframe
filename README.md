# AlgoFrame

An interactive data structures and algorithms learning lab, adapted from a third-semester DSA course and implemented in Python. Step through data changes on the canvas while the executed Python line highlights alongside it.

## Run locally

Requirements: Node.js 22.12+ (or 20.19+) and Python 3.11+. Check `python3 --version` for the server and `python --version` for tests.

```sh
npm ci
npm run dev
```

Open **http://localhost:3000**. No API key or separate backend command is needed. Stop with `Ctrl+C`. After changing server/Python API integration, restart `npm run dev`; Vite refreshes frontend changes automatically.

On Windows, new VS Code terminals use Command Prompt through workspace settings. An existing PowerShell terminal that blocks `npm.ps1` can use `npm.cmd` instead of `npm`, without changing execution policy.

For a local production run, use `npm run build` then `npm start`. Keep `python_engine/` alongside `dist/`: the built server still executes Python modules. `npm run clean` removes generated build output.

## Learning workspace

- Seven topics: the six course topics (arrays, linked lists, stacks, circular queues, trees, hash tables) plus Graphs. Singly and doubly linked lists are separate lessons within week 2.
- Thirty-seven selectable operations. Start with **Try this example**, **Start empty**, or custom setup; then insert/delete, search/access, push/pop/peek, enqueue/dequeue, inorder, graph editing, BFS and DFS.
- **Learn** automatically animates key changes with short explanations. **Explore** shows immediate results for quick experimentation. **Predict** pauses for a question, offers retries and an explanation, then reveals the animation. Switch between key steps and individual Python lines without losing synchronization.
- Edit array cells, choose insertion gaps, act on linked/tree nodes, or select two graph vertices to connect/disconnect them. Two experiments per lesson explore growth, collisions, wraparound, unbalanced trees, and other edge cases. Experiments replace the current example. Compare real array/list front-insertion traces and their element moves.
- Editable small inputs, full/empty/index errors, actual Python operation execution, post-line visualization snapshots, local variables, and final results.
- The canvas leads the workspace; Python is optional and appears beside it on desktop or below on phones. Custom inputs, variables, memory, and analysis expand on demand. Linked nodes show separate value and pointer compartments. Playback, slider and replay stay in the top header; keyboard shortcuts are arrows, Space, R and C when focus is outside controls. Animations honor reduced-motion preferences.
- Best/average/worst time complexity, auxiliary/structure space, and observed execution-line counts. Memory addresses and byte sizes are explicitly illustrative, not CPython allocation/timing measurements.

Each run begins from the supplied values. The fixed Python examples can be copied, but arbitrary submitted code is not executed. See [the course map](docs/course-map.md) for lecture references, modeling assumptions, operation coverage, and advanced topics that remain extensions. The source PDFs are not bundled or published.

## Development workflow

- `npm test`: Python engine and workflow-helper tests.
- `npm run check`: typecheck, existing compiler-based lint, tests, build, and real development/production HTTP smoke tests.
- `npm run test:smoke`: HTTP smoke tests after building.
- `npm run test:browser`: sequential playground, all-topic, initialization, cumulative-state, native slider/code, and theme regressions using Node 22+ and an installed Edge/Chromium/Chrome browser. Set `BROWSER_EXECUTABLE` for a nonstandard path. This optional check starts/stops its own servers and uses isolated temporary profiles; it does not install a browser.
- `npm run test:browser:visual`: capture responsive browser screenshots into ignored `.local/ui-review/` for visual inspection.
- `npm audit`: dependency advisory review using `package-lock.json`.
- `npm run chat:backup`: optional manual conversation snapshot; read [backup limits](docs/chat-backup.md) first.

Read [project context](docs/project-context.md), [workflow summary](docs/workflow-summary.md), [features](docs/features.md), and the single [progress record](docs/progress.md). Agent instructions start in [AGENTS.md](AGENTS.md), with reusable workflows in `.agents/skills/`.

Source repository: [yasirumadhuwantha/algoframe](https://github.com/yasirumadhuwantha/algoframe). Git publication requires an explicit push instruction; ordinary local development does not imply deployment or pushing.
