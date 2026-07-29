# Changelog

All notable changes to the Azure Networking Academy are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- Versioned mastery progress with Learned, Practiced, Demonstrated, and Durable states, preserving prior completion as legacy evidence pending revalidation.
- Ten-question diagnostic and a dashboard review queue with 1, 3, 7, 21, and 60-day spaced review.
- Observable outcomes, prerequisites, independent transfer challenges, and four-part rubrics for all 21 modules.
- Persistent per-step networking labs, installable PWA assets, offline navigation after first load, and a zero-dependency Node test suite.
- GitHub Pages validation gate for all tests and JavaScript syntax before deployment.
- Exhaustive diagram contracts and `docs/diagram-audit-2026-07.md`, covering all 22 diagram instances and current Microsoft Learn sources.
- Deterministic Today workspace, separate `networking-academy-ui-state:v1` navigation state, and exact-section resume.
- Accessible five-item mobile navigation with a focus-managed secondary drawer.
- Edge Operations Fieldbook identity and a guided Front Door Advanced vertical slice with compact evidence and an inline packet-path visual.

### Changed
- Quiz passing now requires 80% and the critical concept question; module progress is based on Practiced evidence rather than a free completion checkbox.
- Network Watcher now teaches VNet flow logs; NSG flow logs appear only as a migration topic with the 2025 creation block and 2027 retirement date.
- Private-subnet egress, DNS Private Resolver, Private Link DNS, BGP, VPN/ExpressRoute resiliency, FastPath, Virtual WAN, origin security, AFD caching/WAF, and capstone evidence were deepened.
- Basic Load Balancer and hardcoded Azure prices are now historical or source-verification guidance rather than current design advice.
- Keyboard, screen-reader, reduced-motion, diagram, lab, and 320px responsive behavior were improved.
- CSP now blocks inline scripts; runtime controls use delegated event handlers.
- Mobile diagrams preserve readable text in a keyboard-focusable local scroll region instead of shrinking the SVG to fit.
- Region/zone teaching now distinguishes paired and nonpaired architectures, service-specific support, and explicit workload recovery responsibility.
- Front Door teaching now separates WAF block/rate-limit decisions from valid Rule Set transformations and route/cache overrides.
- VPN and ExpressRoute visuals avoid presenting one encryption policy, bandwidth range, or SLA as universal.
- Diagram and curriculum assets use one release token with a new offline cache generation.
- Dashboard delivery now prioritizes one next action, due work, and three path milestones instead of a marketing hero and empty summary cards.

### Fixed
- Removed all measured diagram label collisions and clipping risks across desktop, tablet, and mobile.
- Fixed Network Watcher step parity and Step wraparound after the final visual state.
- Replaced the WAF DDoS-flood example with an application-layer rate-threshold scenario.
- Progress imports now retain schema-v2 mastery evidence, diagnostic routing, and per-step lab state.
- Removed the fixed-offset mobile drawer overlap, restored focus after dismissal, preserved bookmarked module hashes during startup, and synchronized browser Back and Forward navigation.

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
