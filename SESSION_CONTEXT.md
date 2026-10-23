# Session Context — Azure Networking Academy

Running log of AI-assisted work sessions. Newest first.

---

## 2026-10-23 - Shared diagrams and progressive AFD learning
- Completed the approved local diagram upgrade: 26 shared models replace the 22 diagram definitions and 11 authored inline SVGs; simple/detailed walkthroughs, predictions, failure scenarios, mobile step lists, sources, and print transcripts use one semantic model. Added the AFD request lab and preserved existing learning evidence.
- Passed 205 Node tests, 32 browser tests, and syntax checks for all 20 JavaScript files. Refreshed 32 graph screenshots with no page errors or measured path collisions; reviewed the changed cache, fallback, private-capstone, and desktop/mobile walkthrough views. Covered failed saves, recovery, keyboard focus, motion preferences, and both print paths.
- Release is `2026-10-diagrams-1`. Updated README, changelog, and the October audit with dispositions and limitations. Akshay approved pushing to `main`, which publishes through the gated Pages workflow; previous production baseline is `09b3f09`. Roll back with a reviewed revert and a fresh cache token, not history rewriting. No Azure execution; manual screen-reader, Firefox/Safari, and learner-retention checks remain separate.

## 2026-10-23 - Beginner entrance and expanded visual audit
- Implemented three Level 0 lessons, beginner-default presentation, optional placement, all-module plain-language openings and low-pressure checks, teaching before optional cases, and reading-only completion. Preserved full tools and mastery evidence; release candidate is `2026-10-beginner-1`.
- Passed 192 Node tests, all JavaScript syntax checks, and 22 browser tests. Reviewed 33 unique SVGs across 220 render configurations plus reused-preview behavior; found substantive diagram errors, narration mismatches, reduced-motion failure, duplicate IDs, overlaps, and unreadable static mobile labels.
- Saved findings and correction priorities in `docs/diagram-audit-2026-10.md`; the July clean-bill conclusions are superseded. Diagram corrections remain proposed, not implemented. No commit, push, publication, or Azure lab execution.

## 2026-09-16 - Publication approved and release gates repeated
- Akshay requested publication of the completed phases. Release `2026-09-learning-1` targets `main` in `akshayvall/AzNetOnboarding`; the existing Pages workflow must pass before deployment.
- Repeated all 188 Node tests and 19 browser tests successfully, including disposable progress recovery, offline upgrades, and four viewport widths. The pending files contain no matches for the credential patterns checked.
- Previous production baseline: `9eacd111fc807689c2cfc6affc65251e01c08975`. If rollback is needed, use a reviewed revert commit and a fresh cache release token; do not rewrite branch history or reset learner progress. Live deployment results will be recorded in the parent project after verification.

## 2026-09-14 - All-phase local learning release
- Implemented approved progress/assessment repairs, distinct learner destinations, AFD/broad-networking paths, session choices, and guided case learning across all 21 modules. Existing external labs remain separate from subscription-free self-attested practice.
- Integrated bounded subagent content, persistence, assessment, UI, scheduling, and browser-gate work. All 188 academy Node tests and 19 browser tests passed; verified four viewport widths, recovery, drafts, offline isolation, and controlled worker upgrades.
- Release token is `2026-09-learning-1`; no commits, pushes, deployment, or Azure lab execution. Manual screen-reader, human evidence review, and retention checks remain. Local preview: http://127.0.0.1:8891/azure-networking-academy/ .

## 2026-05-07 — AZ-104 decoupling + learning analysis

- Reframed all AZ-104 / exam / certification wording across source + wiki to real-world Azure networking skills framing (README.md, modules-200/300/extras.js, wiki entity, ai-academy cross-ref)
- Kept protected internal IDs (`az104-practice`, `az104-flashcards`, `az104-lb-match`) — invisible localStorage/nav/quiz keys; Module 15 retitled "Real-World Networking Scenarios"; CLI `rg-az104-lab` → `rg-net-lab`
- Created `docs\Learning_Analysis.html` — comprehensive learning-analysis deliverable (PRD-consistent dark theme, self-contained, no AZ-104); added `CHANGELOG.md`

---

## 2026-05-06 — Architecture audit and workspace integration

- Analyzed project structure, content depth, and deployment status
- Project assessed as production-complete (Grade A+)
- Recommended: last-updated date, AZ-700 expansion, analytics
- Added SESSION_CONTEXT.md for workspace consistency
