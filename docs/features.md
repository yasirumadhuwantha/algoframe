# Feature inventory

Status and dated evidence live only in [the progress record](progress.md). This inventory describes capabilities and acceptance boundaries; presence in source is not proof of browser behavior.

| ID | Capability | Acceptance boundary |
| --- | --- | --- |
| P01 | Singly linked list insertion traces | Ordered values, pointer splice, valid synchronized source lines and trace invariants |
| P02 | Doubly linked list insertion traces | Ordered values, bidirectional splice, trace invariants |
| P03 | Dynamic array insertion traces | In-place shifts and full-capacity reallocation preserve the inserted sequence and reported moves |
| P04 | Binary search tree insertion traces | Inserted value appears with tree coordinates and valid trace structure |
| P05 | Simulation API and visual playback | API invokes Python; structure selection, parameters, playback, phase/step controls, inspector, and code highlight agree |
| P06 | Themes, responsive UI, and keyboard controls | Existing visual conventions, narrow/wide layouts, accessible controls, theme switching, and documented shortcuts work |
| P07 | Warm cream and sage palette | Reference-inspired centralized colors cover surfaces, controls, diagrams, and code; matching dark tokens, readable text, visible focus, and narrow-screen wrapping |
| P08 | Python learning workspace | 37 operations across seven topics: arrays, singly/doubly linked lists, stacks, circular queues, BSTs, chained hash tables and graphs; explicit boundary errors |
| P09 | Synchronized side-by-side code | Actual operation line events, shared step cursor, source highlight and canvas state; desktop right-side panel and stacked mobile view |
| P10 | Complexity and observed execution | Best/average/worst time, auxiliary/structure space, actual line-event count and explicit illustrative memory assumptions |
| P11 | Initialization and top playback | Define first with empty/custom inputs, shared sticky-header playback, compartmentalized linked nodes, responsive transitions and reduced-motion support |
| W01 | Reusable development instructions | Concise root rules; separate project context; discoverable TDD, planning, UI, security/cleanup, and explicit-push skills; summary maintained |
| W02 | Aggregate quality gate | Existing scripts preserved; typecheck, existing lint, engine/workflow tests, and build run sequentially and propagate failure |
| W03 | Conversation-local backup | Only active conversation visible text; internal records excluded; ignored local output; identity, privacy, failure, and live snapshot verification |
| W04 | Dependency and cleanup review | Actual advisory result when resolvable; secrets/artifact review and uncertain-file decisions recorded without unsupported safety claims |
| R01 | Portable local startup | Normal locked installation, `npm run dev` serves frontend/API, built server resolves assets/Python correctly, and Windows start/clean commands work |
