# 🌐 Azure Networking Academy

> An interactive, self-paced learning platform that takes you from **networking zero** to **Azure Front Door hero** — built around real-world Azure networking skills.

**Live site:** https://akshayvall.github.io/AzNetOnboarding/

---

## 📖 What is this?

A pure-HTML / CSS / JavaScript study site (no build step, no frameworks) for people starting networking from zero, with a structured path into Azure networking and Azure Front Door. The required course runs without an Azure account. Full quizzes and Azure Cloud Shell labs are optional.

Progress is saved in your browser's `localStorage` — you can export/import it as JSON.

## One integrated course

**Status:** Active. Release `2026-10-course-4` was approved for publication on October 26, 2026. GitHub Pages publishes `main` after its automated validation gates pass; see the [deployment runs](https://github.com/akshayvall/AzNetOnboarding/actions/workflows/pages.yml).

Release `2026-10-course-4` restores a consistent sidebar at desktop widths and an outlined Contents control on smaller screens. The recommended lesson is labelled Start here/Continue here; passed checks have a checkmark, and other lessons have no status label.

Open `index.html` through a local HTTP server. There is now one recommended sequence: **Start here -> L100 -> L200 -> L300**. All **21 modules** are integrated into **79 lessons**, including three starters and a checkpoint after each technical level. `course.html` is a compatibility redirect, not a separate pilot.

Each ordinary lesson teaches a concrete question through explanation, a complete relevant visual, a worked example, an activity, checks, and a next lesson on one page. There are no Learn/Try/Check tabs. Eight additional configuration/operations lessons and explicit OSI/CIDR lessons put useful depth inside the course rather than requiring reference browsing. Module-end evidence cases and level checkpoints ask for interpretation, not just definitions.

**Course** provides the syllabus and one Start/Continue action. **Progress** holds learning records and backups. Continue follows the first unfinished lesson even after previewing a later module. Answers, explanation drafts, comparison choice, and reading section persist. Failed saves expose retry/backup and do not claim saved completion.

Diagrams match their subject: labelled request/reply arrows, a seven-layer stack, nested Azure management containers, address partitions, TCP sequences, and decision/configuration tables. Essential relationships remain visible without a separate viewer, autoplay, or inner scrolling. Mobile diagrams reflow rather than shrinking their text.

Full references open inside the course with a return link. The earlier app lives at `reference.html` for optional full quizzes, Azure labs, exercises, and legacy records. The Front Door sandbox is supplementary; completing the required course never depends on visiting it.

Progress uses `course-v2:` keys inside the existing version-2 backup schema. Stable module/unit IDs remain unchanged. Earlier reading, quizzes, labs, drafts, and evidence are preserved without being promoted to new checks; matching pilot checks, answers, and reading sections remain usable. The offline worker caches the main course, compatibility redirect, and optional tools as distinct documents.

The design principle is **teach one idea, apply it, then connect it to the next**. Checks and self-explanations are practice evidence, not certification, independent mastery, or proof of Azure execution. Beginner start/continue acceptance and delayed recall still need a human trial.

Historical releases and validation counts are recorded in `CHANGELOG.md` and the [October diagram audit](docs/diagram-audit-2026-10.md).

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
| 3 | IP Addressing in Azure | Prefixes, subnet sizing, public/private IPs, address lifetime |
| 4 | Azure Virtual Networks (VNets) | Address spaces, subnets, policy, connectivity |

### ⬡ Level 200 — Intermediate (9 modules)
Core Azure networking services — the day-to-day building blocks of any deployment.

| # | Module | Covers |
|---|---|---|
| 1 | Network Security Groups (NSGs) | Rules, priorities, default rules, ASGs |
| 2 | Azure DNS & Private DNS Zones | Public zones, private zones, record management |
| 3 | Azure Load Balancing Options | Load Balancer, App Gateway, Traffic Manager, Front Door |
| 4 | **Azure Front Door Fundamentals** | Architecture, origins, routing, caching basics |
| 5 | VNet Peering & Service Endpoints | Peering, private access, service and private endpoints |
| 6 | **Route Tables & UDRs** | Route selection, forwarding, return paths |
| 7 | **NAT Gateway** | Outbound SNAT, reply mappings, finite ports |
| 8 | VPN Gateway & ExpressRoute | Site-to-Site, Point-to-Site, private circuit fundamentals |
| 9 | **Azure Bastion** | Secure management paths without VM public IPs |

### ⬡ Level 300 — Advanced (8 modules)
Deep-dive on Front Door, security, and real-world architecture scenarios.

| # | Module | Covers |
|---|---|---|
| 1 | **Azure Front Door — Advanced Configuration** | Rules Engine, custom domains, TLS, Private Link |
| 2 | **Front Door Caching & Performance** | Cache behavior, compression, optimization strategies |
| 3 | **Front Door WAF & Security** | WAF policies, managed rules, bot protection, DDoS |
| 4 | **Azure Firewall** | Inspection paths, policy, return routing |
| 5 | Advanced Network Architecture | Hub-spoke, failure domains, Network Virtual Appliances |
| 6 | **Network Watcher** | Connection Monitor, VNet flow logs, IP Flow Verify, packet capture |
| 7 | Real-World Networking Scenarios | Troubleshooting drills and production design scenarios |
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

Embedded request scenarios connect these modules. The standalone sandbox and Cloud Shell labs are optional, not another required learning track.

---

## ✨ Features

- **One course** — 79 lessons across starters, all 21 modules, and three level checkpoints
- **One next action** — uninterrupted learning with a collapsible syllabus
- **Relevant visuals** — labelled traffic paths, concept stacks, address partitions, and responsive tables
- **Applied reasoning** — embedded predictions, 21 fictional module cases, checks, and self-explanations
- **Preserved evidence** — browser-local records and validated JSON export/import
- **Offline support** — separate cached course and optional-tool shells, self-hosted assets, strict script CSP
- **Optional tools** — full quizzes, subnet exercises, flashcards, legacy evidence, and Azure labs under reference links

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
index.html              # Integrated course shell
reference.html          # Preserved optional quizzes, labs, exercises, and legacy records
course.html             # Old pilot link compatibility redirect
launch.bat              # Windows local-server launcher
css/
  guided-course.css     # Course typography, native controls, starter diagrams
  course.css            # Integrated syllabus, lessons, responsive visuals and evidence
  styles.css            # Shared shell and learning tools
  learning.css          # Guided lessons and beginner presentation
  diagrams.css          # Diagrams, mobile alternatives, and printing
js/
  course-app.js         # Main course router, lessons, reference and progress
  course-curriculum.js  # Prerequisite order, extra foundations, checkpoints, course record adapter
  course-depth.js       # Eight in-course configuration/operations lessons
  course-cases.js       # Fictional evidence case for every module
  course-visuals.js     # Concept-specific complete visual renderer
  guided-course.js     # Starter content and pilot record compatibility
  course-entry.js       # Redirect old pilot links into the main course
  unit-content.js       # Existing 63 authored units, reused without changing their IDs
  app.js                # Optional legacy-tool router
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

The main-course browser gate completes every lesson from start to finish, exercises resume, draft and backup recovery, old bookmarks, reading order, responsive visuals, keyboard controls, and offline shell separation. The legacy browser gates still run against `reference.html`. Node contracts cover the curriculum, record preservation, all authored visual conditions, and retained tools.

Install `tests\requirements.txt` and Playwright Chromium only if missing. The browser runner manages a local server and disposable progress; it never executes Azure labs. Functional and screenshot checks do not replace human screen-reader testing, real Azure execution, or a retention study.

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
