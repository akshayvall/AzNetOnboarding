# 🌐 Azure Networking Academy

> An interactive, self-paced learning platform that takes you from **networking zero** to **Azure Front Door hero** — aligned with the **AZ-104: Microsoft Azure Administrator** certification.

**Live site:** https://akshayvall.github.io/AzNetOnboarding/

---

## 📖 What is this?

A pure-HTML / CSS / JavaScript study site (no build step, no frameworks) designed for people who are **brand new to networking** and want a structured path into **Azure networking**, with a special focus on **Azure Front Door**. Every module combines short lessons, diagrams, quizzes, and hands-on Azure Cloud Shell labs.

Progress is saved in your browser's `localStorage` — you can export/import it as JSON.

---

## 🎯 Who is this for?

- Absolute beginners to computer networking
- Developers moving into cloud / DevOps roles
- Candidates preparing for the **AZ-104** exam
- Anyone who needs to understand **Azure Front Door** end-to-end (architecture → WAF → Rules Engine → Private Link)

No prior Azure or networking experience required.

---

## 🗺️ Curriculum

The content is organized into three levels (21 modules total).

### ⬡ Level 100 — Foundations (4 modules)
Start here if terms like *subnet*, *DNS*, or *TCP handshake* are new to you.

| # | Module | Covers |
|---|---|---|
| 1 | Networking Fundamentals | OSI model, TCP/IP, DNS, HTTP |
| 2 | The Azure Environment | Subscriptions, resource groups, regions, availability zones |
| 3 | Azure Virtual Networks (VNets) | Creating and configuring VNets and subnets |
| 4 | IP Addressing in Azure | Public/private IPs, static vs dynamic, NAT |

### ⬡ Level 200 — Intermediate (9 modules)
Core Azure networking services — where AZ-104 really lives.

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
Deep-dive on Front Door, security, and AZ-104 exam-style scenarios.

| # | Module | Covers |
|---|---|---|
| 1 | **Azure Front Door — Advanced Configuration** | Rules Engine, custom domains, TLS, Private Link |
| 2 | **Front Door Caching & Performance** | Cache behavior, compression, optimization strategies |
| 3 | **Front Door WAF & Security** | WAF policies, managed rules, bot protection, DDoS |
| 4 | Advanced Network Architecture | Hub-spoke, Azure Firewall, Network Virtual Appliances |
| 5 | AZ-104 Networking Scenarios | Exam-style questions and real-world scenarios |
| 6 | **Azure Firewall** | Application/network/NAT rules, Firewall Policy, threat intel |
| 7 | **Network Watcher** | Connection Monitor, NSG flow logs, IP flow verify, packet capture |
| 8 | **Capstone: Hub-Spoke** | End-to-end design: Firewall + Bastion + VPN + peering + UDRs |

---

## 🎓 AZ-104 alignment

The curriculum maps to the **"Configure and manage virtual networking"** domain of AZ-104 (which is ~25–30% of the exam), including:

- Virtual networks, subnets, peering
- Public & private IP addressing
- Network Security Groups & Application Security Groups
- Azure DNS (public + private zones)
- VPN Gateway & ExpressRoute basics
- Load balancing (Basic LB, Application Gateway, Traffic Manager, **Front Door**)
- Network monitoring & troubleshooting

The L300 **AZ-104 Networking Scenarios** module contains exam-style practice questions.

---

## 🚪 Why so much Azure Front Door?

Front Door is Microsoft's global, Layer-7 edge platform — and it's increasingly the "front door" (pun intended) of every modern Azure workload. This academy dedicates **three full modules** to it:

1. **L200 — Fundamentals:** what it is, how routing works, origins, caching
2. **L300 — Advanced Configuration:** Rules Engine, TLS, custom domains, Private Link
3. **L300 — WAF & Security:** managed rule sets, bot protection, DDoS integration
4. **L300 — Caching & Performance:** cache keys, compression, purge strategies

Plus hands-on labs that inspect real Front Door response headers from Cloud Shell.

---

## ✨ Features

- **Interactive diagrams** — animated OSI model, packet flow, VNet topology
- **Quizzes** — multiple-choice, match-the-layer, subnet calculator, flashcards
- **Hands-on labs** — runnable `az cli` / `nslookup` / `tcpping` / `traceroute` steps in Azure Cloud Shell
- **Progress tracking** — per-module, per-level, overall %, day streak
- **Export / Import** progress as JSON
- **Fully offline** — no external CDNs, no trackers, strict CSP

---

## 🚀 Running locally

No build step. Just serve the folder over HTTP (browsers restrict some features on `file://`).

### Windows — one click
```cmd
launch.bat
```
Auto-detects Python or Node, serves on http://localhost:8080.

### Manual
```bash
# Python
python -m http.server 8080

# or Node
npx http-server -p 8080 -c-1
```
Then open http://localhost:8080.

---

## 📁 Project structure

```
index.html              # Single-page app shell
launch.bat              # Windows local-server launcher
css/
  styles.css            # All styling
js/
  app.js                # Router, view management, progress wiring
  progress.js           # localStorage-backed progress tracking
  quiz-engine.js        # Quiz rendering & scoring
  lab-engine.js         # Step-by-step lab runner
  diagrams.js           # Animated SVG/Canvas diagrams
  interactive.js        # Subnet calc, flashcards, drag-drop
  modules-100.js        # L100 content (4 modules)
  modules-200.js        # L200 content (6 core modules)
  modules-300.js        # L300 content (5 core modules)
  modules-extras.js     # +3 L200 + +3 L300 deep-dive modules
.github/workflows/
  pages.yml             # GitHub Pages auto-deploy
```

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
