# Changelog

All notable changes to the Azure Networking Academy are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### October 26 integrated course (release `2026-10-course-3`)
- The first publication attempt was blocked by Linux CI: deferred lesson focus could steal a newly focused comparison control or skip link. Removed the unnecessary animation-frame delay and added a deterministic focus-race regression. All 10 guided-course browser checks and 245 Node tests passed locally after repair; the Pages workflow rechecks the complete suite before publishing.
- Replaced the main entry with one continuous Start -> L100 -> L200 -> L300 course: all 21 modules, 79 lessons, 21 fictional module evidence cases, and three level checkpoints. Added in-course CIDR/OSI foundations and eight configuration/operations lessons; full references are supplementary, not the only route to depth.
- Removed required lesson-mode tabs and standalone-lab navigation. Added one first-unfinished Start/Continue, a compact four-stage map, collapsible syllabus, explanation-before-example reading order, and next-lesson transitions across every level.
- Rebuilt essential visuals as complete labelled conversations, stacks, hierarchy, address partitions, sequences, and responsive tables. Clarified repeated endpoints and added a concrete Front Door domain/route/group/origin association example. No autoplay or inner diagram scrolling.
- Preserved earlier records, matching pilot answers/completion/reading position, JSON backups, and old links. `course.html` redirects into the main course; optional legacy tools remain at `reference.html`. The worker caches those documents separately and upgrades atomically without reloading open drafts.
- Passed all 245 Node tests, 61 Chromium browser tests, syntax checks for 29 JavaScript files, and diff whitespace checks. The complete browser journey finishes all 79 lessons. A separate finish reviewer resolved all three material UI findings after one correction batch; refreshed desktop/mobile captures confirm the final verdict.
- Publication approved October 26 with "push and publish"; targets `main` through the gated GitHub Pages workflow. Local preview remains `http://127.0.0.1:8894/index.html`. No Azure execution. Beginner acceptance, manual screen-reader testing, physical touch, and delayed recall are not established by these gates.

### October 26 guided-course pilot (local only)
- Added a separate `course.html` journey: request/reply, DNS lookup, and Front Door caching. Replaced the pilot's simulator-style controls with one labelled, connected diagram and one changed condition per lesson.
- Added a real three-lesson itinerary, first-unfinished continuation independent of browsing, remembered reading sections and answers, matching checks and a clear pilot finish.
- Reused existing progress storage with isolated pilot keys; preserved legacy evidence and provided visible failed-save retry/backup. No changes to the main academy, advanced lab or published offline release.
- Scope approved as a three-lesson user trial before broader redesign. Previous functional/visual acceptance did not establish beginner usability. No commit, push or deployment requested for this pilot.
- Passed 235 Node and 57 browser tests after correcting reading-position recovery. A bounded independent finish review found no material fixes; beginner acceptance and learning retention still require a human trial.

### October full field-guide redesign (release `2026-10-fieldguide-3`)
- Applied the approved small-unit learning model across all 21 modules: 63 authored outcomes, explanations, examples, visuals, predictions, paired checks and teach-back prompts. Preserved full technical references and optional advanced exercises.
- Added stable unit URLs, exact unit/step resume, recoverable explanation drafts and separate read/prediction/check/self-explanation records. Reading does not skip unfinished practice or grant skill mastery.
- Reworked Path, lessons, Progress and Level 0 into the restrained field-guide design; reduced navigation weight and collapsed maintenance. Repaired mobile header clipping and accessibility live-region overflow that let wheel scrolling move the entire app offscreen.
- Made diagrams primary, removed ineffective depth and single-scenario controls, preserved stable AFD context, and introduced appropriate TCP, NSG, UDR and NAT presentations. Added condition-changing Level 0 sketches without autoplay.
- Corrected tightly related reference and assessment contradictions; retained legacy section bookmarks, evidence, full quizzes, labs, print and offline compatibility.
- Final review corrections put concrete examples and compact model-owned relationships before explanation, preserve explicitly chosen modules over unread starters, unify the DNS hostname, and remove repeated mobile connections and the Path header stripe.
- Passed 230 Node and 52 browser tests; final independent review resolved all six material findings. Rechecked release/cache contracts and atomic offline upgrades after the final cache-generation change, including a guard against browser fixture version drift.
- Publication approved October 24 with "implement and push"; release targets `main` through the gated GitHub Pages workflow. No Azure execution. Human retention, screen-reader and physical-touch evaluation remain separate gates.

### October learning-flow simplification (local release `2026-10-simple-1`)
- Replaced competing Today/Learn/Practice/Build navigation with Your path, AFD request lab, and Progress on desktop and mobile. Collapsed the full curriculum, placement test, backup controls, and optional advanced destinations.
- Replaced module mode/tool bars with Learn -> Try it -> Quick check. Moved collapsed worked cases after teaching and practice, with full quizzes, Azure labs, and mastery evidence under Go deeper (optional).
- Made the calm beginner entrance and plain-language openings independent of persisted full-tools preferences. Removed automatic saved-section restore; explicit bookmarks and optional resume links remain supported.
- Added a Level 0 completion screen before foundations. Reset scroll and focus on forward lesson steps, and prevented delayed section callbacks from overriding a destination after leaving a module.
- Fixed multi-select quick checks in five modules without granting quiz or mastery credit. Narrowed preferences to the optional catalog filter and removed the inactive session-length control while preserving stored settings.
- Preserved existing progress, drafts, evidence, deep links, and offline upgrade behavior. Advanced technical lesson bodies are not rewritten. No commit, push, or deployment is authorized for this local pass.
- Passed all 205 Node tests, 38 browser tests, JavaScript syntax checks, and diff whitespace checks on October 24. Confirmed the simplified desktop/mobile reading and practice views; learner retention and manual screen-reader review remain separate checks.

### October diagram and learning upgrade (release `2026-10-diagrams-1`)
- Replaced the 22 diagram definitions and 11 separately authored lesson SVGs with 26 shared semantic models. Maps, narration, predictions, and transcripts now use the same nodes, connections, steps, and scenario data.
- Added simple/detailed views, Previous/Next/Show all/Reset, prediction pauses, explicit failure scenarios, mobile step lists, locally scrolling maps, per-instance SVG IDs, sources, and complete print transcripts. Removed the old automatic animations and renderer styles.
- Added the subscription-free AFD request lab with cache, WAF, redirect, origin-health, tier, and connectivity choices; a visible Start tracing action; a five-question practice check; and honest failed-save recovery without granting mastery credit.
- Corrected DNS referrals, OSI highlighting, three-tier and inspected paths, return routing, finite NAT capacity, NSG defaults, route selection, AFD processing/tier distinctions, all-unhealthy fallback, Private Link components, and managed-service boundaries. Updated directly related lesson, quiz, and flashcard explanations.
- Clarified current cache-validation, Bastion SKU, and WAF-response behavior from official sources. Normal and rate-limit WAF blocks have different documented blank-body defaults; 429 does not universally require customization.
- Advanced the offline release candidate to `2026-10-diagrams-1`. Passed 205 Node tests, 32 browser tests, and all 20 JavaScript syntax checks on October 23; refreshed 32 graph screenshots with no reported page errors or measured path collisions.
- Added implementation dispositions and verification limits to the October audit. Publication approved October 23, subject to the Pages workflow gates. No Azure lab execution; manual screen-reader, additional-browser, and human-retention checks remain.

### October beginner experience (earlier local stage)
- Added three Level 0 lessons, beginner-default home and module presentation, optional placement testing, plain-language openings, three-question checks, and teaching before optional advanced cases.
- Kept full learning tools accessible and separated reading completion from quizzes, labs, and demonstrated mastery without discarding existing evidence.
- Added beginner persistence/routing/browser regression coverage and offline release candidate `2026-10-beginner-1`. Passed 192 Node tests and 22 browser tests on October 23.
- Added `docs/diagram-audit-2026-10.md`: all 33 unique SVGs reviewed, including 11 previously uncounted inline lesson diagrams. The findings superseded the older broad claims below and became the repair baseline for the subsequent diagram upgrade.

### September learning release
- Added distinct learning destinations, AFD/broad-networking routes, session choices, all-module guided coaching, predictions, changed tasks, illustrative evidence, and subscription-free case practice.
- Fixed recoverable save/import failures, corrupt-storage protection, drafts, quiz focus and critical policy, rubric validation, and failed/duplicate review handling. Local practice and reviewer labels do not claim external execution or certification.
- Corrected the spoke-transit architecture question and added module-specific cost, data, verification, failure, and cleanup guidance.
- Added self-contained browser deployment gates and release `2026-09-learning-1` with scoped offline caches and coherent upgrades. All 188 Node tests and 19 browser tests passed again on September 16; publication was approved that day. Azure labs remain unexecuted.

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
- Rebuilt the mobile curriculum drawer with readable 48px module rows, a visible close control, wider title space, and no duplicate row padding or time-label crowding.

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
