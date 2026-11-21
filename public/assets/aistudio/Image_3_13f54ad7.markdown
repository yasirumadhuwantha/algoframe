---
name: Warm Academic Visualizer
colors:
  surface: '#fff8f6'
  surface-dim: '#e1d8d6'
  surface-bright: '#fff8f6'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fbf2f0'
  surface-container: '#f5ecea'
  surface-container-high: '#efe6e4'
  surface-container-highest: '#e9e1df'
  on-surface: '#1e1b1a'
  on-surface-variant: '#45474c'
  inverse-surface: '#342f2e'
  inverse-on-surface: '#f8efed'
  outline: '#75777d'
  outline-variant: '#c5c6cd'
  surface-tint: '#545f73'
  primary: '#091426'
  on-primary: '#ffffff'
  primary-container: '#1e293b'
  on-primary-container: '#8590a6'
  inverse-primary: '#bcc7de'
  secondary: '#9b4500'
  on-secondary: '#ffffff'
  secondary-container: '#fd8a42'
  on-secondary-container: '#682c00'
  tertiary: '#00180f'
  on-tertiary: '#ffffff'
  tertiary-container: '#002f20'
  on-tertiary-container: '#41a07c'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e3fb'
  primary-fixed-dim: '#bcc7de'
  on-primary-fixed: '#111c2d'
  on-primary-fixed-variant: '#3c475a'
  secondary-fixed: '#ffdbca'
  secondary-fixed-dim: '#ffb68e'
  on-secondary-fixed: '#331200'
  on-secondary-fixed-variant: '#763300'
  tertiary-fixed: '#97f5cc'
  tertiary-fixed-dim: '#7bd8b1'
  on-tertiary-fixed: '#002115'
  on-tertiary-fixed-variant: '#00513a'
  background: '#fff8f6'
  on-background: '#1e1b1a'
  surface-variant: '#e9e1df'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 3rem
    fontWeight: '600'
    lineHeight: 3.5rem
    letterSpacing: -0.025em
  headline-xl-mobile:
    fontFamily: Inter
    fontSize: 2rem
    fontWeight: '600'
    lineHeight: 2.5rem
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 2.25rem
    fontWeight: '600'
    lineHeight: 2.75rem
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 1.75rem
    fontWeight: '600'
    lineHeight: 2.25rem
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 1.5rem
    fontWeight: '600'
    lineHeight: 2rem
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Inter
    fontSize: 1.25rem
    fontWeight: '600'
    lineHeight: 1.75rem
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 1.125rem
    fontWeight: '400'
    lineHeight: 1.75rem
  body-md:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: '400'
    lineHeight: 1.625rem
  body-sm:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: '400'
    lineHeight: 1.375rem
  code-lg:
    fontFamily: JetBrains Mono
    fontSize: 0.9375rem
    fontWeight: '500'
    lineHeight: 1.5rem
  code-md:
    fontFamily: JetBrains Mono
    fontSize: 0.8125rem
    fontWeight: '400'
    lineHeight: 1.375rem
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 0.75rem
    fontWeight: '400'
    lineHeight: 1.125rem
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 0.75rem
    fontWeight: '600'
    lineHeight: 1rem
    letterSpacing: 0.05em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 0.6875rem
    fontWeight: '500'
    lineHeight: 0.875rem
    letterSpacing: 0.06em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-sm: 1rem
  gutter-lg: 2rem
  margin: 2rem
  margin-sm: 1rem
  margin-lg: 3rem
  space-2xs: 0.125rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
  space-2xl: 4rem
---

## Brand & Style

This design system embodies the rigor, clarity, and patient guidance of a premier academic publication merged with an interactive digital lab bench. Designed for engineers, researchers, and computer science students exploring distributed systems, memory layouts, and algorithmic flow, the aesthetic replaces clinical corporate tech tropes with a tactile, humanistic workspace.

The design philosophy balances **Pedagogical Warmth** with **Technical Precision**:
- **Tone:** Methodical, contemplative, erudite, yet immediately legible and approachable.
- **Visual Style:** Warm Minimalist Editorial. It pairs crisp, millimeter-precise boundaries with soft paper-like backgrounds and subdued pastel categorization accents.
- **Emotional Impact:** Reduces cognitive fatigue and intimidation during deep study sessions, evoking the satisfaction of reading a bespoke cloth-bound engineering text alongside live interactive schematics.

## Colors

The palette is rooted in an unbleached drafting-paper substrate, avoiding harsh blue-light screens while preserving razor-sharp text contrast. Accent colors are muted, desaturated tints designed to distinguish data structures, thread states, and memory allocations without visual strain.

- **Canvas & Surfaces:**
  - Base Canvas (`bg-canvas`): `#FAF8F5` (Warm Cream)
  - Surface Card / Node (`bg-surface`): `#FFFFFF` (Crisp Pure Chalk)
  - Secondary Inset / Code Canvas (`bg-subtle`): `#F4EFEA` (Warm Sand Tint)
  - Active / Hover Canvas (`bg-muted`): `#EDE7DE` (Muted Warm Stone)
- **Lines & Boundaries:**
  - Structural Outline: `#E5DFD7` (Subtle boundary)
  - Strong Border / Node Frame: `#D8D1C5` (Crisp separation)
  - Active / Focus Border: `#1E293B` (High-contrast slate ink)
- **Ink & Typography:**
  - Primary Text: `#1C1917` (Deep Warm Charcoal)
  - Secondary Text: `#57534E` (Muted Umber Slate)
  - Tertiary / Metadata: `#857F77` (Pencil Gray)
- **Pedagogical Categorical Tints (Nodes, Memory Blocks, Buffers):**
  - Compute & Workers (Amber Tint): `#FEF3C7` (Fill) | `#B45309` (Stroke & Text)
  - Network & Packets (Sky Tint): `#E0F2FE` (Fill) | `#0369A1` (Stroke & Text)
  - Success, Heap & Pointers (Mint Tint): `#DCFCE7` (Fill) | `#047857` (Stroke & Text)
  - Metadata, Cache & Isolation (Lavender Tint): `#F3E8FF` (Fill) | `#6D28D9` (Stroke & Text)
  - Faults & Memory Hazards (Rose Tint): `#FFE4E6` (Fill) | `#BE123C` (Stroke & Text)

## Typography

Typography functions as the primary visual architecture. Proportional relationships are tightly calibrated to ensure high scannability during complex algorithmic state changes.

- **Primary Body and Display (`Inter`):** Utilized for titles, documentation prose, guided tutorials, and primary structural headers. Tight tracking is applied to display sizes to deliver an authoritative, high-end editorial cadence.
- **System Monospace (`JetBrains Mono`):** Non-negotiable for system diagnostics, register values, byte offsets, memory pointers, line numbers, and interactive terminal replays. Use tabular numbers (`font-variant-numeric: tabular-nums`) across all mono levels to eliminate jitter during value ticking and state morphing.
- **Labels and Sub-tags:** Micro labels employ uppercase tracking (`+0.05em` to `+0.06em`) in `JetBrains Mono` to cleanly contrast with continuous natural prose.

## Layout & Spacing

Layouts follow an asymmetric workbench layout with deliberate breathing room:

- **Desktop (1024px+):** A 12-column fluid workbench grid with a persistent left-hand or top-docked narrative panel (columns 1–4) and an open visualizer viewport (columns 5–12). Gutters hold steady at `1.5rem` (`24px`), framed by a minimum outer canvas margin of `2rem` (`32px`).
- **Tablet (768px - 1023px):** Adapts to an 8-column layout. The visualizer viewport commands the upper half of the view with a fixed aspect ratio; explanation modules collapse below it in stacked sequence.
- **Mobile (< 768px):** Single-column stacked stream. Interactive controls lock into a pinned bottom drawer or docked control dock. Side margins shrink to `1rem` (`16px`).
- **Spacing Rhythm:** Spacing is strictly calculated on an 8pt base grid with a 4pt sub-grid for internal component padding. High macro-spacing (`space-xl`, `space-2xl`) isolates algorithmic stages to prevent information overload.

## Elevation & Depth

To sustain the look of warm academic manuals and tactile engineering schematics, this system eliminates heavy dropshadows and glossy glass refraction. Depth is constructed purely through structured borders, warm tone offsets, and crisp isometric perspective layering.

- **Baseline Level 0 (Workbench Background):** `#FAF8F5`. Raw matte paper background with an optional faint 16px isometric grid or dot pattern rendered in `#EAE3D9`.
- **Level 1 (Panels, Inspect Cards, Code Blocks):** `#FFFFFF` surface bounded by a crisp 1px solid border (`#E5DFD7`). Flat, stable, no shadow.
- **Level 2 (Interactive Floating Nodes, Popovers, Dragged Nodes):** `#FFFFFF` surface with a 1px solid border in `#D8D1C5` paired with a sharp, low-spread ambient lift: `0 4px 12px rgba(45, 41, 37, 0.05), 0 1px 3px rgba(45, 41, 37, 0.08)`.
- **Isometric Visualizer Blocks:** Memory buffers and queue items utilize clean pastel fills (`#FEF3C7`, `#E0F2FE`, `#DCFCE7`, `#F3E8FF`) outlined in their respective darkened accent border. 2.5D top and side facets use 12% darkened overlays to establish volume without gradient mush.

## Shapes

The geometry reflects surgical precision softened slightly for readability:

- **Default Corners (`roundedness: 1`):** `0.25rem` (`4px`) on nodes, buttons, code blocks, tabs, and diagnostic panels. This preserves an architectural, drafting-board aesthetic.
- **Sub-components & Badges:** Micro-badges and memory addresses maintain sharp `0.25rem` radii, never pill-shaped, ensuring they align flush alongside monospace text columns.
- **Containers (`rounded-lg`):** Main visualization card containers and interactive viewports use `0.5rem` (`8px`) to subtly frame the computational workspace.

## Components

### Buttons & Timeline Controls
- **Primary Action (Run / Step Execution):** Deep charcoal fill (`#1C1917`), crisp white text (`#FFFFFF`), `0.25rem` radius. On hover: shifts to `#2D312E` with a 1px vertical translation.
- **Secondary Action (Reset / Rewind / Speed Toggle):** Pure white background (`#FFFFFF`), 1px solid `#D8D1C5` border, `#1C1917` text. On hover: `#F4EFEA`.
- **Monospace Icon Controls:** Step forward/backward buttons use `JetBrains Mono` glyphs (`[ > ]`, `[ || ]`, `[ �X
H[X�YY[��]X\�H̞̜܈͞͜��[�[����\˂������\�X[^�\���\�	�Y[[ܞH�[H
����X�\�N���\�[��\��Y]�X�܈�ܚY�[��]^X�]�]Hٙ��]�܈�\�XX�H�[Y\�\�^YYX�ݙHXX��[[�X�[\�X
�]��Z[��[ۛ�
K��H
���]\Ί���H
�[�X�]�K�[�[��]Y��ё������[\�Y\�ܙ\��P�X^�Mэ����H
�[��]YԙXY��[�Y\�[�[
ёQ����[X�\�܈�L���X��JK\��Y\��[�YX��[��ܙ\�Y\[��^��H
�ܚ][���X�]�H�[�\���[��\�YY\�\���[�[
�P�NLM�
H�]ܚ\��]H[ۛ��X�H^[�[�[�[X]Y[�\�[�H܈�[�\��XX�ۋ��������H	��X�H�[�\�H
���[�^\�^N����۝Z[�Y[�эQ�PX�[��X��ܛ�[��]H��Y�MQ���ܙ\���H
��X�]�H^X�][ۈ[�N���Y�Y�Y�]H�[]�Y[�وёQ����
[X�\�H[�H��Y�Y��ܙ\�[�ЍL�X�[ۛ��X�H[�H�[X�\���[XZ[�]]Y[��Mэ��������[�]��Y\��	��\\�H
���[X�\�	��\�XX�H[�]Ί��[��]�]H��\�\��Y�P�X�ܙ\�X�]�H�]H�[�\��Hܚ\�\�][�H[��P�NLM���۝\���X�H��K[Y��H
���[][][ۈ�YY�Y\�Ί���]�X��[��MQ��
ZY�
K�X�[��[\�[X�[��P�NLM��]H��Y]\�[��[�\�ܛ���Z\����������XYۛ��X��\�	��[�]H
���ܛX]���ZXܛ��X�[��[\��Y�\�
X�[\�X
K\\��\�Kܚ^�۝[Y[���X�K\�X�\�X�[Y[���X�K^���H
���[[�Ί��\�[�[�X��ܛ�[��ܜ�\�ۙ[����[��[ۘ[�]H
K�ˋܙY[��ѐ�M��܈�����P�W�U���Hё�MM��܈Q�WѐUS
K��[��]Y�X�۝�\�^������[�\�X�]�H��\�	�[��X�[ۈ�ݙ\�H[��ܙY��\�X[^�\���\��]Z\�[�H�[�\�\����ˈё������X��ܛ�[���Y\�P�X�ܙ\�\�^Z[����X�Y[X�\���Y�\�\��]�[������X�H[\�[���X�\�Y��X��[[��^K]�[YHX�\�