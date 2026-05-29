# Changelog

All notable changes to the Azure Networking Academy are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Changed
- Repositioned the platform from an "AZ-104 exam–aligned" course to a **real-world Azure networking skills** platform.
- Removed and reframed all AZ-104 / exam / certification wording across source and wiki:
  - `README.md` — dropped the AZ-104 alignment section and inline references.
  - `js/modules-200.js`, `js/modules-300.js`, `js/modules-extras.js` — reframed callouts, prose, and tips (e.g., "AZ-104 Critical" → "Critical"; "exam favorite" → "common real-world gotcha"; "tested on the exam" → "matters in production").
  - `wiki/entities/azure-networking-academy.md` and the `ai-academy` sibling cross-reference.
- Retitled Module 15 to **"Real-World Networking Scenarios"** (user-facing title only).
- Renamed CLI lab resource group `rg-az104-lab` → `rg-net-lab`.

### Added
- `docs/Learning_Analysis.html` — comprehensive learning-analysis deliverable mapping the L100/L200/L300 curriculum and how to learn it (PRD-consistent dark theme, fully self-contained, CSP-safe).

### Notes
- Protected internal IDs `az104-practice`, `az104-flashcards`, and `az104-lb-match` were intentionally **kept**. They are invisible to users and back localStorage progress keys, navigation, and quiz references; renaming them would break saved progress.
- `docs/PRD.html` retains its AZ-104 mentions on purpose — section 9 documents this exact repositioning.
