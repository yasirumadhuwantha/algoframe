---
name: ui-review
description: Review changed interfaces against the repository's existing design conventions, responsive behavior, interactions, and accessibility, recording actual visual evidence.
---

# Review UI changes

Apply when rendered UI or interaction changes. Read project context, existing components, styles, and design guidance first. This skill defines review criteria; it supplies no palette, fonts, product copy, or styling from another repository.

1. Identify the affected screens, user actions, states, and acceptance criteria. Reuse existing typography, color tokens, spacing scale, component patterns, transitions, and theme conventions. Explain necessary deviations.
2. Run applicable component/behavior tests using available tools. Exercise the affected interaction in a browser when possible, including loading, empty, error, disabled, success, and repeated-action states where relevant.
3. Inspect narrow/mobile, intermediate/tablet, and desktop layouts at recorded viewport sizes. Check overflow, wrapping, zoom, content order, touch targets, and keyboard access. Review light/dark themes when supported.
4. Check heading hierarchy, semantic controls, accessible names, form labels and errors, focus visibility/order, keyboard activation, screen-reader state announcements, and contrast. Do not rely on color alone. Check reduced-motion behavior when transitions or animation change.
5. Record tested browsers/viewports, actual observations or screenshots, regressions fixed, and limitations in the progress record. A build or source inspection does not establish visual or accessibility success. If browser access is unavailable, state which acceptance criteria remain unverified.

Keep fixes within the requested scope. Record pre-existing issues separately rather than redesigning unrelated screens. Pure documentation/workflow setup needs no invented browser evidence.
