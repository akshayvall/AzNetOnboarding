# 🌐 Azure Networking Academy

> An interactive, self-paced learning platform that takes you from **networking zero** to **Azure Front Door hero** — built around real-world Azure networking skills.

**Live site:** https://akshayvall.github.io/AzNetOnboarding/

---

## 📖 What is this?

A pure-HTML / CSS / JavaScript study site (no build step, no frameworks) designed for people who are **brand new to networking** and want a structured path into **Azure networking**, with a special focus on **Azure Front Door**. Every module combines short lessons, diagrams, quizzes, and hands-on Azure Cloud Shell labs.

Progress is saved in your browser's `localStorage` — you can export/import it as JSON.

## Networking field guide (local, unpublished)

**Status:** Active. Field-guide release `2026-10-fieldguide-3`, approved for publication on October 24, 2026. GitHub Pages deployment runs after the automated validation gates pass.

The primary curriculum is now **63 short units across all 21 modules**, after three Level 0 starter lessons. Each unit has one outcome, a short explanation, a concrete example, a shared-model visual, a changed-condition prediction, two relevant checks, and a self-explanation prompt. The suggested 8-12 minutes includes exploration and practice; it is an estimate, not a measured completion target.

Use **Your path -> Learn -> Try it -> Quick check**. Continue learning returns to the saved unit and step, including unfinished practice after reading. The full technical lesson, extra exercises, full quiz and optional Azure lab remain under **Reference and extra practice**. Old section bookmarks open the matching full reference instead of silently moving a beginner into it.

**Progress** distinguishes units read, correct predictions, checks passed and self-explanations. Level 0 reading counts are visible too. These records are local practice, not certification or demonstrated mastery. Existing quiz results, applied evidence, lab records, drafts and backups remain separate and compatible.

Diagram configuration is secondary to the explanation. Redundant depth/scenario choices are omitted; AFD scenarios keep stable positions and show when an origin is not contacted. TCP uses lifelines, NSG/UDR use decision tables, and NAT includes the before/after mapping. Level 0 offers small condition-changing sketches. Movement is learner-controlled, with readable mobile alternatives.

For the content/runtime boundary, see `js\unit-content.js` and `js\unit-engine.js`. Unit IDs are durable navigation and storage keys: renaming them requires a migration. Navigation adds `?unit=<id>&tab=<step>`; progress uses namespaced entries in the existing version-2 backup schema, not a replacement data store. Explanation drafts use the existing recoverable progress storage.

The design principle is **one complete idea before the next layer of complexity**. Functional browser checks cannot establish learning retention. A real learner should still complete a unit, explain its changed-condition example without the page, and repeat that explanation later before this is called an effective course.

## Earlier navigation simplification (superseded locally)

Release candidate `2026-10-simple-1` replaces the competing navigation systems with **Your path**, **AFD request lab**, and **Progress** on desktop and mobile. These changes are local; the live site still serves the previously published diagram upgrade until a new publication is approved.

Each technical module follows **1 Learn -> 2 Try it -> 3 Quick check**. Read the plain-language opening and lesson, explore the diagrams and activities, then answer three low-pressure practice questions. Worked cases are collapsed after the quick check; full quizzes, Azure labs, and skill evidence remain under **Go deeper (optional)**. Reading and practice do not award demonstrated mastery.

The three Level 0 lessons finish with a completion screen and an explicit choice to continue into foundations. Saved sections are offered as optional resume links, never automatic jumps into advanced content. Existing progress, drafts, evidence, bookmarks, and offline support are retained. The optional catalog still supports path filtering; its preferences no longer advertise a session length that the beginner sequence does not use.

The learning principle is **teach first, explore second, check third**: the interface should reveal depth as it becomes useful, rather than ask a beginner to organize the entire course. This release simplifies the flow; it does not rewrite the technical L100-L300 lesson bodies or establish measured learning outcomes.

## Published October diagram upgrade

Release `2026-10-diagrams-1` combines the beginner-first entrance with rebuilt diagrams and an AFD request lab. Publication was approved on October 23; GitHub Pages serves it only after the deployment workflow's validation gates pass.

| Stage | What to do | What to understand before moving on |
|---|---|---|
| Start from zero | Complete the three short Level 0 lessons; placement is optional | Names, addresses, requests, replies, edge vs origin |
| Build foundations | Read the plain-language opening, then trace the simple diagram | Explain the path in your own words |
| Follow one AFD request | Open the AFD request lab and select **Start tracing** | Predict whether a request stops at WAF, a redirect, a cache, or an origin |
| Add depth | Switch to detailed views, change failure scenarios, then attempt the capstone | Explain the decision, the return path, and the evidence needed to diagnose a failure |

All 22 diagram entries and 11 formerly static lesson visuals now use a shared catalog of 26 models. Maps, numbered steps, predictions, narration, and print transcripts come from the same model rather than separately maintained drawings. Simple views hide advanced configuration; detailed views expose tier, private-origin, routing, and failure distinctions where relevant.

The walkthroughs have Previous, Next, Show all, and Reset controls, with no autoplay or looping motion. Mobile defaults to a readable step list; the optional map scrolls locally without shrinking its labels. Each model includes sources and limitations, and printing produces a complete explanation of the selected scenario.

The AFD lab includes a five-question practice check with a four-correct target. Reading and practice remain separate from quiz, Azure-lab, and demonstrated-mastery evidence. Existing progress is preserved; failed saves expose recovery rather than claiming that work was saved.

See the [October audit and implementation record](docs/diagram-audit-2026-10.md) for the corrected findings, evidence, and remaining human-learning checks. The upgrade does not claim that every advanced lesson has been rewritten or that completing a visual lab proves production skills.

## September learning release (historical)

Release `2026-09-learning-1` includes the changes below. GitHub Pages publishes `main` only after the Node and browser gates pass; see the [deployment runs](https://github.com/akshayvall/AzNetOnboarding/actions/workflows/pages.yml).

- Today, Learn, Practice, Build, and More have distinct task views. The AFD diagnosis and broad networking paths support 10/25/60-minute sessions with prerequisite-aware recommendations and open reference access.
- All 21 modules support guided/browse mode, worked request-path cases, prediction checks, changed tasks, fictional example evidence, downloadable worksheets, and subscription-free case analysis.
- Quiz choices keep keyboard focus, explicit critical-question policy replaces the hidden first-question rule, and failed due reviews are recorded and rescheduled.
- Progress backups identify their academy and format. Failed saves retain recoverable work, corrupt storage is protected, invalid imports preserve previous progress, and evidence drafts survive navigation.
- Case analysis is self-attested practice. Existing Azure labs remain available, with separate optional-execution, data, cost, verification, and cleanup guidance. No Azure deployment is claimed by completing the local route.

Run the local release gates:

```powershell
node --test tests\*.test.js
python tests\browser_smoke.py
```

For a first browser-test setup, install the requirements from `tests\requirements.txt` and the Playwright Chromium browser if they are missing. The browser runner manages its own local server and disposable progress. It never runs Azure lab commands. Cloud-lab execution, manual screen-reader review, and measured learning outcomes remain separate checks.

---

## 🎯 Who is this for?

- Absolute beginners to computer networking
- Developers moving into cloud / DevOps roles
- TPMs, PMs, and engineers who need to reason about Azure networking in production
- Anyone who needs to understand **Azure Front Door** end-to-end (architecture → WAF → Rules Engine → Private Link)

No prior Azure or networking experience required.

---

## 🗺️ Curriculum

Three short Level 0 lessons introduce names, request/response paths, and Front Door before the three technical levels (21 modules total).

### ⬡ Level 100 — Foundations (4 modules)
Start here if terms like *subnet*, *DNS*, or *TCP handshake* are new to you.

| # | Module | Covers |
|---|---|---|
| 1 | Networking Fundamentals | OSI model, TCP/IP, DNS, HTTP |
| 2 | The Azure Environment | Subscriptions, resource groups, regions, availability zones |
| 3 | Azure Virtual Networks (VNets) | Creating and configuring VNets and subnets |
| 4 | IP Addressing in Azure | Public/private IPs, static vs dynamic, NAT |

### ⬡ Level 200 — Intermediate (9 modules)
Core Azure networking services — the day-to-day building blocks of any deployment.

| # | Module | Covers |
|---|---|---|
| 1 | Network Security Groups (NSGs) | Rules, priorities, default rules, ASGs |
| 2 | Azure DNS & Private DNS Zones | Public zones, private zones, record management |
| 3 | Azure Load Balancing Options | Load Balancer, App Gateway, Traffic Manager, Front Door |
| 4 | **Azure Front Door Fundamentals** | Architecture, origins, routing, caching basics |
| 5 | VPN Gateway & ExpressRoute | Site-to-Site, Point-to-Site, ExpressRoute fundamentals |
| 6 | VNet Peering & Service Endpoints | Connecting VNets and securing Azure service access |
| 7 | **Azure Bastion** | Secure RDP/SSH without public IPs, SKU tiers, shareable links |
| 8 | **NAT Gateway** | Deterministic outbound SNAT, port exhaustion fixes |
| 9 | **Route Tables & UDRs** | Custom routes, NVA forwarding, BGP route propagation |

### ⬡ Level 300 — Advanced (8 modules)
Deep-dive on Front Door, security, and real-world architecture scenarios.

| # | Module | Covers |
|---|---|---|
| 1 | **Azure Front Door — Advanced Configuration** | Rules Engine, custom domains, TLS, Private Link |
| 2 | **Front Door Caching & Performance** | Cache behavior, compression, optimization strategies |
| 3 | **Front Door WAF & Security** | WAF policies, managed rules, bot protection, DDoS |
| 4 | Advanced Network Architecture | Hub-spoke, Azure Firewall, Network Virtual Appliances |
| 5 | Real-World Networking Scenarios | Troubleshooting drills and production design scenarios |
| 6 | **Azure Firewall** | Application/network/NAT rules, Firewall Policy, threat intel |
| 7 | **Network Watcher** | Connection Monitor, VNet flow logs, IP Flow Verify, packet capture |
| 8 | **Capstone: Hub-Spoke** | End-to-end design: Firewall + Bastion + VPN + peering + UDRs |

---

## 🎓 Skills you'll build

The curriculum covers the full **"configure and manage virtual networking"** skill set used in real Azure deployments:

- Virtual networks, subnets, peering
- Public & private IP addressing
- Network Security Groups & Application Security Groups
- Azure DNS (public + private zones)
- VPN Gateway & ExpressRoute basics
- Load balancing (Azure Load Balancer, Application Gateway, Traffic Manager, **Front Door**)
- Network monitoring & troubleshooting

The L300 **Real-World Networking Scenarios** module puts these together with troubleshooting drills and production design challenges.

---

## 🚪 Why so much Azure Front Door?

Front Door is Microsoft's global, Layer-7 edge platform. This academy dedicates **four full modules** to it:

1. **L200 — Fundamentals:** what it is, how routing works, origins, caching
2. **L300 — Advanced Configuration:** Rules Engine, TLS, custom domains, Private Link
3. **L300 — WAF & Security:** managed rule sets, bot protection, DDoS integration
4. **L300 — Caching & Performance:** cache keys, compression, purge strategies

The subscription-free AFD request lab connects these modules through one reusable request story. Optional Cloud Shell labs inspect real Front Door response headers.

---

## ✨ Features

- **Progressive diagrams** — 26 shared models with simple/detailed views, learner-controlled steps, predictions, and failure scenarios
- **AFD request lab** — compare cache, WAF, redirect, origin-health, tier, and connection choices without an Azure subscription
- **Readable alternatives** — mobile step lists, named SVG maps, complete text explanations, and print transcripts
- **Quizzes** — multiple-choice, match-the-layer, subnet calculator, flashcards
- **Hands-on labs** — runnable `az cli` / `nslookup` / `tcpping` / `traceroute` steps in Azure Cloud Shell
- **Progress tracking** — per-module, per-level, overall %, day streak
- **Export / Import** progress as JSON
- **Installable and offline after first load** — service-worker-cached app shell, no external CDNs or trackers, strict script CSP
- **Honest mastery states** — Learned → Practiced → Demonstrated → Durable, with 80% retrieval checks, lab evidence, transfer rubrics, and spaced review
- **Diagnostic learning route** — ten questions recommend the earliest networking competency worth practicing
- **Your path** — one clear starting action, three introductory lessons, and a readable path into deeper networking
- **Mobile study shell** — three destinations matching desktop, plus an accessible, focus-managed module drawer
- **Three-step lessons** — Learn, Try it, and Quick check; worked cases and deeper evidence tools are optional
- **Explicit resume** — choose a saved reading section without being automatically dropped into advanced content

---

## 🚀 Running locally

No build step. Just serve the folder over HTTP (browsers restrict some features on `file://`).

### Windows — one click
```cmd
launch.bat
```
Auto-detects Python or Node, serves on http://localhost:8080.

### Manual
```powershell
# Python
python -m http.server 8080 --bind 127.0.0.1

# or Node
npx http-server -a 127.0.0.1 -p 8080 -c-1
```
Then open http://127.0.0.1:8080. Loopback binding keeps the preview off the local network.

---

## 📁 Project structure

```
index.html              # Single-page app shell
launch.bat              # Windows local-server launcher
css/
  styles.css            # Shared shell and learning tools
  learning.css          # Guided lessons and beginner presentation
  diagrams.css          # Diagrams, mobile alternatives, and printing
js/
  app.js                # Router, view management, progress wiring
  beginner.js           # Level 0 lessons and beginner-first presentation
  progress.js           # localStorage-backed progress tracking
  ui-state.js           # separate versioned navigation and resume state
  today-engine.js       # deterministic daily action selection
  learning-engine.js    # Learning destinations, coaching, and evidence history
  mastery-content.js    # Outcomes, diagnostics, transfer challenges, rubrics
  mastery-engine.js     # Mastery dashboard, evidence flow, review queue
  quiz-engine.js        # Quiz rendering & scoring
  lab-engine.js         # Step-by-step lab runner
  diagram-models.js     # Shared catalog, foundational models, and sources
  diagram-afd.js        # AFD, private-origin, and capstone scenarios
  diagrams.js           # SVG/step renderer, walkthrough controls, and AFD lab
  interactive.js        # Subnet calc, flashcards, drag-drop
  modules-100.js        # L100 content (4 modules)
  modules-200.js        # L200 content (6 core modules)
  modules-300.js        # L300 content (5 core modules)
  modules-extras.js     # +3 L200 + +3 L300 deep-dive modules
manifest.webmanifest    # Install metadata
sw.js                   # Offline app-shell cache
tests/                  # Node contracts and self-contained Chromium regressions
.github/workflows/
  pages.yml             # Validate, then deploy to GitHub Pages
```

### Validation

```powershell
node --test tests\*.test.js
python tests\browser_smoke.py
$files = @((Get-ChildItem js\*.js).FullName) + (Join-Path (Get-Location) 'sw.js')
foreach ($file in $files) {
    node --check $file
    if ($LASTEXITCODE -ne 0) { throw "Syntax check failed: $file" }
}
```

On October 23, the local upgrade passed **205 Node tests, 32 browser tests, and syntax checks for all 20 JavaScript files**. The browser matrix exercises all 26 models at 320/390/768/1440 pixels with normal and reduced-motion preferences, including explicit map inspection on mobile.

Diagram coverage includes semantic paths and branch omissions, scenario/tier changes, isolated SVG IDs, bounded stepping without wraparound, predictions, keyboard focus, label geometry, service boundaries, storage failure/retry, printing, and release-cache coherence. A separate 32-graph visual review reported no page errors or measured path collisions. These checks do not replace human screen-reader testing, real Azure execution, or a retention study. The [October audit](docs/diagram-audit-2026-10.md) supersedes the July clean-bill claims.

---

## 🌍 Deployment (GitHub Pages)

This repo auto-deploys to GitHub Pages on every push to `main` via `.github/workflows/pages.yml`.

**One-time setup** (repo owner, via GitHub UI):
1. Go to **Settings → Pages**
2. Under **Build and deployment → Source**, select **GitHub Actions**

After that, each push to `main` publishes automatically.

---

## 🤝 Contributing

Issues and PRs welcome. The site is intentionally dependency-free — please keep new contributions vanilla JS / CSS / HTML.

---

## 📜 License

MIT
