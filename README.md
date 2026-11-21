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

- Six course topics: arrays, linked lists, stacks, circular queues, trees, and hash tables. Singly and doubly linked lists are separate lessons within week 2.
- Twenty-three selectable operations, including insert/delete, search/access, push/pop/peek, enqueue/dequeue, and inorder traversal.
- Editable small inputs, full/empty/index errors, actual Python operation execution, post-line visualization snapshots, local variables, and final results.
- Canvas and code side by side on desktop; stacked panels on phones. Use Next/Previous, slider, play/pause and reset; keyboard shortcuts are arrows, Space, R and C when focus is outside controls.
- Best/average/worst time complexity, auxiliary/structure space, and observed execution-line counts. Memory addresses and byte sizes are explicitly illustrative, not CPython allocation/timing measurements.

Each run begins from the supplied values. The fixed Python examples can be copied, but arbitrary submitted code is not executed. See [the course map](docs/course-map.md) for lecture references, modeling assumptions, operation coverage, and advanced topics that remain extensions. The source PDFs are not bundled or published.

## Development workflow

- `npm test`: Python engine and workflow-helper tests.
- `npm run check`: typecheck, existing compiler-based lint, tests, build, and real development/production HTTP smoke tests.
- `npm run test:smoke`: HTTP smoke tests after building.
- `npm audit`: dependency advisory review using `package-lock.json`.
- `npm run chat:backup`: optional manual conversation snapshot; read [backup limits](docs/chat-backup.md) first.

Read [project context](docs/project-context.md), [workflow summary](docs/workflow-summary.md), [features](docs/features.md), and the single [progress record](docs/progress.md). Agent instructions start in [AGENTS.md](AGENTS.md), with reusable workflows in `.agents/skills/`.

Source repository: [yasirumadhuwantha/algoframe](https://github.com/yasirumadhuwantha/algoframe). Git publication requires an explicit push instruction; ordinary local development does not imply deployment or pushing.
