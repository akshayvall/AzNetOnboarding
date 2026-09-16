# Session Context — Azure Networking Academy

Running log of AI-assisted work sessions. Newest first.

---

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
