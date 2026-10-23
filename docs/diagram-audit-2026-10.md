# Beginner experience and visual accuracy audit

Date: 2026-10-23

## Implementation update: approved local upgrade

Release **`2026-10-diagrams-1`** implements the approved diagram and learning changes. Publication was approved on October 23, subject to the GitHub Pages validation gates; no Azure execution occurred. The original audit below remains the historical baseline, not a description of the repaired renderer.

### Learning design

The path now runs from three Level 0 lessons through plain-language module openings, simple visual walkthroughs, the reusable AFD request lab, and detailed failure/capstone scenarios. Advanced tier and connection controls stay out of the simple AFD view. A visible **Start tracing** action brings the learner to the explanation and navigation controls.

The learning loop is **read -> trace -> predict -> change a condition -> explain**. This favors understanding cause and effect over watching motion. The five-question AFD check targets four correct answers, but its saved result is practice evidence, not proof of deployment ability, retained knowledge, or demonstrated mastery.

### Disposition of the visual findings

All 22 diagram entries and 11 separately authored inline SVGs now use a shared catalog of **26 models**. The catalog includes the additional foundation/reference models and the reusable AFD request journey. Original module and diagram identifiers remain stable.

| Area | Implemented correction |
|---|---|
| Foundations | OSI steps name their highlighted layer; DNS uses resolver queries, referrals, replies, and a cached branch; the direct-VM packet story is distinct from AFD; the three-tier request includes the application tier. |
| Network paths | Inspected east-west and return paths cross the firewall. Peering relationships are distinct from forwarding, NSG defaults and subnet/NIC checks are explicit, NAT uses finite mappings, and route selection does not imply reachable or translated egress. |
| Service boundaries | Bastion has separate browser and VM legs. Private-origin models include the managed endpoint, approval, Private Link Service and internal load balancer where applicable. Managed SQL stays outside the VNet while its private endpoint stays inside the subnet. |
| AFD processing | HTTPS terminates before WAF, route/rules, cache and origin decisions. Standard/Premium and Classic are distinguished. Hit, block, and redirect branches omit origin traffic. The all-unhealthy scenario replaces normal selection with a labeled round-robin fallback, not a recovery guarantee. |
| Content qualifications | Removed universal latency/failover promises, unlimited NAT claims, unconditional cache fill, and absolute security claims. Updated directly related TCP/HTTP, caching, WAF, Bastion, quota, quiz, and flashcard explanations. |
| Interaction | One resolved model drives maps, steps, narration, predictions, and transcripts. Previous/Next are bounded; Show all and Reset have explicit state transitions. There is no autoplay, timer-driven motion, or reduced-motion-only workaround. |
| SVG and geometry | Each render has its own accessible name and marker IDs. Labels remain at reading size. Paths avoid unrelated node interiors and boundary captions; paths within one service group remain within its boundary. |
| Mobile and printing | Mobile starts with a step list; optional maps scroll locally and keep the current node visible. Both the cheat-sheet action and native printing expose complete scenario transcripts and sources rather than dead controls or partial steps. |
| Evidence and persistence | AFD check results use existing practice storage without quiz/lab/mastery credit. A rejected save remains explicitly unsaved after navigation, supports retry, and survives reload only after persistence succeeds. |

The catalog and source definitions live in `js/diagram-models.js` and `js/diagram-afd.js`; `js/diagrams.js` contains the renderer, controller, print handling, and request lab. The 11 inline lesson hosts now reference these models instead of maintaining a second set of drawings.

### Source clarifications

The review used current official documentation, with **27 catalog source URLs** responding successfully after redirects. Link availability alone does not prove an explanation correct.

- **WAF response codes:** the [custom-response documentation](https://learn.microsoft.com/azure/web-application-firewall/afds/waf-front-door-configure-custom-response-code) specifies a normal block default of 403 and a rate-limit block default of 429 when the block response body is blank. The intermediate claim that 429 always requires customization was incorrect and was removed. Policy mode, action, and custom-response settings still matter.
- **Cache validation:** the [Front Door caching documentation](https://learn.microsoft.com/azure/frontdoor/front-door-caching) specifies Last-Modified/If-Modified-Since validation. The course no longer presents ETag or stale-while-revalidate behavior as a blanket supported guarantee.
- **Bastion:** [configuration settings](https://learn.microsoft.com/azure/bastion/configuration-settings) and the [SKU comparison](https://learn.microsoft.com/azure/bastion/bastion-sku-comparison) distinguish dedicated Basic/Standard/Premium deployments from shared Developer service; native client support requires Standard/Premium.
- **All origins unhealthy:** the [origin-routing documentation](https://learn.microsoft.com/azure/frontdoor/routing-methods) describes round-robin fallback. Both the scenario narration and the visible selection node now show that exception.

### Fresh verification

| Check | October 23 result |
|---|---|
| Full Node suite | 205 passed; none failed or skipped |
| Full Chromium suite | 32 passed, including the beginner route, all-module coverage, evidence recovery, offline isolation, and release upgrades |
| JavaScript syntax | All 20 application/service-worker files passed |
| Responsive model matrix | All 26 models at 320/390/768/1440 pixels under normal and reduced-motion preferences; mobile defaults and actual map label sizes both checked |
| Scenario geometry | Both depths, every declared scenario, and declared control variations checked for unrelated-node/caption crossings and same-group boundary containment |
| Final visual capture | 32 graph screenshots; no page errors or measured path collisions |
| Manual image review | Full contact-sheet review, followed by refreshed desktop/mobile walkthrough, cache-hit, all-unhealthy, and private-capstone inspection |
| Persistence and printing | Failed-save -> revisit -> retry -> reload tested; both cheat-sheet and native-print transcripts tested |

The persistent tests are `tests/diagram-models.test.js`, `tests/diagram-renderer.test.js`, and `tests/browser_diagrams.py`, alongside the existing beginner, platform, and learning tests. Session evidence includes `diagram-final-node.log`, `diagram-final-browser.log`, and `diagram-upgrade-final-review/` with its JSON report, screenshots, and contact sheets.

### Remaining review gates

No real Azure lab execution, manual screen-reader review, Firefox/Safari pass, or human retention study was performed. This is not an exhaustive recertification of every lesson, quiz, lab command, or separate simulator.

Before claiming improved learning, observe a beginner explain four of five changed request scenarios without the transcript, including why a request did or did not reach an origin; repeat the exercise after a week. The implemented practice check is fixed, not an unseen-question generator or a measured retention result. Review actual Azure labs separately before relying on their commands in a subscription.

**Design lesson:** simplify by hiding detail, not by changing causality. Shared models prevent a map and its explanation from drifting, while predictions reveal whether the learner can reason about the next event.

---

## Original audit: pre-upgrade baseline

The remaining sections preserve the original findings and source locations. Their failure counts, proposed repairs, and beginner-only release token refer to the earlier implementation.

## Recommendation

Keep the academy and its depth, but correct its visual explanations before calling it a reliable zero-to-depth course. The structure is valuable; several arrows, boundaries, animation steps, and absolute claims currently teach the wrong mental model.

At the original audit, the beginner-experience changes were implemented locally and the visual corrections below were still recommendations. The implementation update above records their subsequent disposition. Nothing was committed, pushed, published, or deployed to Azure during this audit.

This review supersedes the broad accuracy and accessibility conclusions in the July diagram audit. Passing rendering tests does not establish that a drawing explains networking correctly.

## What changed locally

- Added three Level 0 lessons: names and addresses, requests and replies, and Front Door's edge/origin role. Each has a story, explanation, four-step text visual, analogy limitation, teachback prompt, and AFD connection.
- Made beginner presentation the default. The home page offers "Start from zero"; the placement test is optional.
- Added a plain-language opening to all 21 modules. Teaching now precedes the longer case challenge, which starts collapsed in beginner view.
- Added three-question, low-pressure checks without awarding quiz or mastery credit. The first module uses the new elementary questions; later modules reuse existing questions.
- Simplified module navigation to Read / See it / Try it where available. Full learning tools, assessments, evidence, and labs remain accessible.
- Separated "Done reading" from quiz, lab, and demonstrated-skill evidence. Existing evidence is retained.
- Added persistence and browser coverage, and moved the offline release token to `2026-10-beginner-1`.

This is a gentler entrance, not a complete rewrite of the 21 technical lessons. Some later explanations and questions still need smaller teaching steps. Practice/Build and explicitly selected advanced tools remain advanced.

## Coverage and method

The actual SVG inventory is **33 unique authored visuals**, not just the 22 in the Diagrams tabs:

| Surface | Coverage |
|---|---|
| Interactive diagram builders | All 22: source, narration, step mapping, rendered screenshots, controls, geometry |
| Static SVGs embedded in lessons | All 11: source, rendered screenshots, geometry, accessible-name attributes |
| Generated inline previews | Shared rendering path reviewed; 18 modules reuse an interactive builder as a preview; faint initial state reproduced |
| New Level 0 visuals | All three text journeys reviewed with the lessons and exercised through the browser |
| Responsive interactive diagrams | 22 x 4 widths x 2 motion preferences = 176 configurations |
| Responsive authored inline diagrams | 11 x 4 widths = 44 configurations |
| Viewport widths | 320, 390, 768, 1440 CSS pixels |
| Motion | Normal and reduced for interactive diagrams; direct VPN motion measurement |
| Visual inspection | All nine contact sheets covering the 33 SVGs, plus beginner desktop/mobile screenshots |
| References | Current public Microsoft Learn documentation; important distinctions listed under Sources |

The 220 SVG render configurations are not 220 independent assertions of technical correctness.

### Results

| Check | Observed result |
|---|---|
| JavaScript regression suite | 192/192 passed |
| Browser regression suite | 22/22 passed, including beginner flows, backup recovery, drafts, offline upgrades, and four viewport widths |
| JavaScript syntax | All application JS files and service worker passed `node --check` |
| Browser errors in completed visual audit runs | None |
| Basic Step, wraparound, Show all, Reset handlers | Responded across 176 configurations |
| Show all followed by Step | **Incorrect state transition:** counter returns to 1 while all steps remain highlighted |
| Narration matches highlighted subject | **Fails:** OSI and capstone examples below |
| Missing SVG-local references | Firewall references `ah-888` and `ah-0078D4` without defining them locally |
| Duplicate IDs in module document | Present on every inspected diagram route: 2-12 extra ID occurrences, depending on module |
| Interactive text overlaps | Four overlapping pairs in three diagrams: ExpressRoute, caching, Network Watcher |
| Text beyond SVG viewBox | No text bounding-box overflow detected; this does not test every icon, line, or container boundary |
| Interactive text legibility | Smallest measured desktop label approximately 7.2 CSS pixels |
| Static inline mobile text | Smallest labels approximately 2.3-5.4 CSS pixels at 320px viewport width |
| Static inline SVG accessible names | All 11 lack SVG `title` and explicit `role`; surrounding prose is not an equivalent structured diagram description |
| Reduced-motion VPN | **Fails:** moving circle still changes position |

Regression tests establish feature behavior, not a clean bill of health for the content. Existing diagram tests mostly check inventory and step counts; they miss wrong arrows and wrong step subjects.

## Highest-priority corrections

**P1** means fix before presenting the relevant lesson as trustworthy. **P2** means a misleading omission or qualification that should be corrected before a polished learning release. **P3** means presentation refinement. These are learning/release priorities, not software vulnerability ratings.

1. **Repair the foundational request story.** DNS must show the resolver following referrals and returning the answer. The OSI animation must highlight the layer it names. Distinguish a direct VM connection from a Front Door proxy path.
2. **Redraw AFD processing using the current tier-specific model.** For HTTPS, TLS precedes HTTP WAF inspection; then route/rule evaluation, cache handling, and origin selection. WAF is part of the distributed edge service, not a separate upstream appliance. Current Microsoft documentation distinguishes Standard/Premium's selected PoP unicast model from Classic anycast. [S1], [S2]
3. **Make every path match the claimed control.** Web -> App -> Database must go through App. Spoke-to-spoke traffic claimed to be inspected must visibly pass through the firewall. NAT and Bastion response paths must return through their relevant connection boundary.
4. **Remove false guarantees.** NAT does not eliminate port exhaustion. A private address is not "no attack surface." Cache hits are not guaranteed to be below 10ms; failover is not universally below 30 seconds. Private Link is connectivity, not "maximum security." [S3], [S4], [S6]
5. **Correct Private Link and PaaS boundaries.** AFD Premium access to an internal load balancer needs the Private Link Service / AFD-managed private endpoint relationship and approval. A SQL private endpoint belongs in the subnet; the managed SQL service should not be drawn as if deployed inside it. [S5]
6. **Make the visuals usable without motion or microscopic text.** Fix SVG motion control, ID isolation, static previews, label overlaps, mobile inline scaling, and text alternatives.

## Inventory: 22 interactive diagrams

Source locations refer to the reviewed `js/diagrams.js`. Authored descriptions and narration live in `js/modules-100.js`, `js/modules-200.js`, `js/modules-300.js`, and `js/modules-extras.js`; fixes must update both drawing and narration.

| Visual / source lines | Assessment | What to change |
|---|---|---|
| OSI layers, 416-450 | **P1: step/meaning mismatch.** Narration starts with Layer 7; step 1 highlights Layer 1. Six of seven layer subjects are reversed. | Make visual order match narration. Do not map Front Door's cookie affinity to OSI Layer 5. Identify the OSI mapping as conceptual, and NSGs as using IP and transport information. Remove the unsupported "hover for details" promise or implement it. |
| TCP handshake, 452-483 | Core SYN/SYN-ACK/ACK directions and sequence arithmetic are sound. **P2: overgeneralization.** | Keep the ordinary TCP example. Qualify claims that all HTTP uses TCP or that application data universally waits for this exact sequence; HTTP/3 uses QUIC. Move text off diagonal lines. |
| DNS resolution, 484-520 | **P1: wrong query/response topology.** Root -> TLD -> authoritative -> browser implies servers recurse downstream and answer the browser directly. | Draw browser -> recursive resolver; separate resolver queries/referrals to root, TLD, authoritative; resolver -> browser answer. Add the cache-hit shortcut and remove "every time." [S7] |
| VNet three-tier, 521-562 | **P1: drawing contradicts narrative.** Vertical connector goes from web to database, bypassing App. | Draw Web -> App -> DB. Say SQL-on-VM if placed inside the subnet. An "allow only" example needs a policy that also overrides the default VNet allowance, not just one allow rule. [S8] |
| Front Door routing, 563-625 | **P1: service boundary and HTTPS order wrong.** PoPs feed a separate central AFD box; WAF precedes TLS. Tier-independent anycast wording is stale. | Put processing inside the selected edge location, show separate client/origin connections, use current tier labels, and distinguish origin group from origin. Explain healthy/priority/latency/weight selection rather than "nearest healthy" alone. [S1], [S2], [S6] |
| Hub-spoke, 626-673 | **P1: transit implied by topology alone.** PaaS services look VNet-hosted. | Separate peering relationships from actual traffic. Show required routes/forwarding and return path. Place Key Vault and Log Analytics outside VNet boundaries with private-access components where relevant. [S4] |
| NSG filtering, 674-727 | First-match/lowest-number ordering is correct. **P2: incomplete rules and misleading failure wording.** | Replace automatic "connection refused" with blocked/dropped traffic, commonly seen as timeout; it is not a guaranteed TCP reset. Include relevant default allow rules and subnet + NIC evaluation, or label the subset explicitly. [S8] |
| Load balancing comparison, 728-775 | L4 five-tuple vs L7 request-based routing is useful. **P2: broad labels.** | Qualify "protocol-agnostic" to supported TCP/UDP scenarios. Add user-to-balancer paths; distinguish a service comparison from a complete request diagram. |
| Site-to-site VPN, 776-806 | IPsec/IKE over public transport is a sound basic example. **P1 motion / P2 wording.** | Stop the moving SVG circle under reduced motion. Replace "same network" with connected, routed networks; a tunnel does not merge broadcast domains. |
| WAF inspection, 807-865 | **P1: policy classification and outcomes misleading.** Rate/geo appear under managed rule sets; 403 and Sentinel appear automatic. | Separate custom and managed rules; show detection vs prevention and configured action. Make diagnostic export/Sentinel an explicitly configured branch. Detection-first is useful rollout guidance, not a description of every policy. [S3] |
| Packet journey, 866-900 | **P1: generic Azure VM path conflated with AFD.** | Remove universal nearest-anycast-edge teaching for arbitrary VM packets. Separate direct VM and AFD proxy examples. Make home NAT conditional and show a return path. [S1], [S2] |
| Front Door rule sets, 901-937 | WAF before route/rule-set handling is useful. **P2: linear path overstates forwarding.** | Branch for redirect, blocked request, cache response, or origin request. Put response-header actions on the response leg instead of claiming every transformation is forwarded to origin. [S1] |
| Azure global infrastructure, 938-984 | Region/zone/service-specific pairing caveats are a good improvement. **P2/P3: containment.** | Keep those caveats. Place icons and zone labels clearly within their intended boundaries; distinguish a service-specific replication example from universal paired-region behavior. |
| VNet peering, 985-1023 | Nontransitivity, nonoverlap, and backbone teaching are sound. **P2: contradictory visual cue.** | Replace the red X beside "Each direction configured independently" with a neutral requirement. Show gateway transit as explicit configuration, not automatic transitivity. |
| Front Door caching, 1024-1070 | Miss/fill/hit story is useful for a stated eligible object. **P2: unconditional story; P3 overlap.** | State same cache key, usable location, cacheability, freshness, and possible upstream cache behavior. Replace "instant" with relative benefit; move the hit label away from "Edge POP." [S3] |
| ExpressRoute, 1071-1114 | Private connectivity and redundant sessions are reasonable foundations. **P2: mixed reachability; P3 overlap.** | Separate private peering/VNet gateways from Microsoft peering/public service routes and Microsoft 365 requirements. Move Storage/SQL away from the footer. |
| Bastion, 1115-1163 | Browser HTTPS and private RDP/SSH are useful. **P1: return boundary and security absolute.** | Route the displayed reply through Bastion, showing two separate connection legs. Replace "no surface to attack" with "no direct VM public-IP requirement"; authorization and network controls still matter. |
| NAT Gateway, 1164-1224 | Outbound SNAT concept is useful. **P1: false capacity guarantee and return path.** | Delete "no port exhaustion." Show finite port/connection resources and reuse. Draw replies through the NAT mapping. Say no unsolicited inbound, not no inbound packets. [S9] |
| User-defined routes, 1225-1278 | **P1: route selection and egress assumptions.** | Equal `/0` routes are resolved by route-source preference, not a longer prefix. Route existence is not proof of outbound translation. Replace "no inspection/no logging" with "does not traverse this firewall"; show reachable next hop and return route. [S4] |
| Firewall topology, 1279-1349 | **P1: inspected traffic visibly bypasses firewall.** Also missing local arrowhead definitions. | Draw east-west and return paths through the inspection point. Define/namescope every marker. Explain how a broad network allow can preempt application rules. Rephrase Basic tier as a sizing/feature choice rather than "SMB-only." |
| Network Watcher IP flow, 1350-1412 | Five-tuple/configuration evaluation is useful. **P2 scope / P3 layout.** | Make clear this is a fictional configuration result, not live end-to-end connectivity proof. Keep policy review before changes. Separate local/remote field names from their values. |
| Capstone, 1413-1495 | **P1: missing network components, misleading containment, step mismatch.** | Show AFD-managed PE -> Private Link Service -> internal LB for that origin pattern; SQL PE inside subnet, SQL service outside. Make spoke transit and return routing explicit. Step 5 currently describes egress while highlighting on-prem/VPN/hub services. Distinguish VPN/ExpressRoute gateways and configured diagnostics. [S4], [S5] |

## Inventory: 11 static diagrams inside lesson text

These are separate SVGs, not merely copies of the 22 builders. Their duplicated concepts need the same corrections as the interactive versions. All 11 also need legibility and accessible-name work.

| Diagram / source | Assessment | What to change |
|---|---|---|
| Azure hierarchy, `modules-100.js:466-528` | Core organizational hierarchy is reasonable. **P2 naming.** | Use Microsoft Entra ID, with Azure AD as the former name. Distinguish identity association from the Azure resource-governance hierarchy. Keep management groups optional. |
| Availability zones, `modules-100.js:577-614` | Region contains zones; examples are understandable. **P2 qualification.** | Identify shown deployments as configured examples, not automatic replication. Keep latency as a target, not an application guarantee; define RTT. |
| Subnet design, `modules-100.js:886-931` | Addresses and nonoverlapping subnet containment are sound. **P2 clarification.** | State that subnet separation alone does not block traffic. Identify DB-01 as a VM if intended; distinguish reserved subnet names from generic workload labels. |
| NAT Gateway, `modules-100.js:1311-1350` | **P1: outbound arrow points inbound.** | Reverse Internet -> NAT -> subnet arrows for the outbound example and add mapped replies separately. Scope the caption to the applicable internet-egress path. Correct adjacent "no SNAT port exhaustion" wording. [S9] |
| Load-balancer decision tree, `modules-200.js:766-829` | Useful first-pass heuristic, not a complete decision procedure. **P2.** | Do not imply HTTP always requires L7 or Traffic Manager is only for non-HTTP. Account for global/cross-region Load Balancer and DNS-vs-proxy needs in a "go deeper" branch. Label the tree deliberately simplified. |
| Front Door architecture, `modules-200.js:1226-1312` | Distributed-edge grouping is clearer than the interactive version. **P1 guarantees / P2 selection.** | Remove universal `<30 seconds` failover and volatile location counts. Tie failover to probe/configuration conditions. Show origin-selection ordering; do not present health probes as a separate interchangeable routing policy. Clarify tier/policy-dependent WAF features. [S1], [S3], [S6] |
| Private Link App Service origin, `modules-300.js:206-247` | **P1: "maximum security" and private-IP mental model.** | Show Premium and its managed private-endpoint relationship; label any IP as illustrative endpoint addressing, not an App Service instance in the user's subnet. Show approval and verify intended public-access restrictions rather than implying Private Link replaces all controls. [S3], [S5] |
| Cache hit/miss, `modules-300.js:462-504` | **P1: unsupported `<10ms` promise; P2 conditional fill.** | Replace the timing guarantee with a relative, measured scenario. Show response back to the client; state eligibility/freshness and that a miss need not always populate cache. [S3] |
| End-to-end security, `modules-300.js:880-931` | **P1: wrong service boundaries.** WAF and DDoS are drawn as independent boxes before AFD; every layer supposedly filters threats. | Group edge protection and WAF within the AFD service boundary; place HTTPS processing correctly. Private Link provides a private connectivity path, not content inspection. Distinguish built-in edge protection from other Azure DDoS offerings. [S1], [S3] |
| Hub-spoke topology, `modules-300.js:1098-1154` | **P2: relationships mistaken for forwarding policy.** | Label gateway subnets/components precisely, distinguish gateway types, and do not imply all traffic automatically traverses the hub/firewall. Clarify VM-hosted SQL vs managed SQL. [S4] |
| Complete AFD + hub-spoke, `modules-300.js:1205-1261` | **P1: conflates private connectivity with public-origin filtering.** Arrowheads also point sideways on downward paths. | Split Private Link and service-tag/X-Azure-FDID patterns into alternatives. Do not imply a service tag creates a private tunnel to Azure Firewall. Draw the supported origin/ingress component and explicitly required return routing. Fix the rotated marker. [S3], [S5] |

## Animation and presentation defects

| Finding | Evidence | Recommended repair |
|---|---|---|
| Reduced-motion VPN still moves | Circle transform changed from about x=298 to x=354 over 450ms with reduced motion enabled. Hiding `animateMotion` with CSS does not stop the SVG animation. | Remove/pause SVG animation for reduced motion; render a static complete path. Cover initial load and preference changes. |
| Static preview looks disabled | Sampled OSI preview has eight step groups at opacity 0.15, none active. Preview has no local Step controls. | Render a readable static overview in previews. Start step-by-step interaction only when the learner opens the walkthrough. |
| Show all -> Step is contradictory | OSI counter becomes 1 while active step groups still include 1 through 7. | Either reset and reveal only step 1, or continue coherently from the final state. Test active groups, narration, and counter together. |
| Duplicate SVG IDs | Module documents contain 2-12 duplicate ID occurrences from preview/full instances and shared marker names. | Namespace every marker, filter, and referenced SVG ID by render instance, including previews. Test document-wide uniqueness, not each SVG in isolation. |
| Missing local markers | Firewall references two marker IDs absent from its own SVG. | Make each SVG self-contained; do not rely on a different or hidden SVG's definitions. |
| Labels collide | ExpressRoute Storage/SQL-footer; caching Edge POP-hit text; Network Watcher local/remote label-value pairs. | Re-layout text and connectors. Test intersections and visually inspect at intended reading size. |
| Tiny text despite no page overflow | Static inline diagrams shrink to labels around 2.3-5.4px at 320px. Some interactive desktop labels are around 7.2px. | Use responsive simplified layouts or a focusable pan/zoom region with readable text. "No horizontal page overflow" is not sufficient. |
| Static inline accessibility gaps | Eleven authored SVGs lack explicit image role/title; no per-diagram equivalent step transcript. | Provide named image semantics and an adjacent ordered explanation that conveys directions, decisions, boundaries, and exceptions. Verify with a screen reader. |
| Visual grammar is inconsistent | A line may mean peering, packet travel, containment, or a policy relationship; arrowheads often lack labels. | Distinguish request, response, configuration relationship, and trust/service boundaries. Use a legend and labels, not color alone. |

## How to make the visuals teach from zero to depth

Use the same small request story throughout, adding detail only when it answers a question:

| Learning stage | What the learner sees | Proof of understanding |
|---|---|---|
| Zero | Browser, name lookup, destination, reply; then edge vs origin | Explain DNS vs HTTP and why a return path matters |
| Foundation | One numbered request step at a time, with plain-language captions | Predict the next hop before revealing it |
| AFD core | Client TLS, edge checks, route/rules, cache branch, origin selection, separate origin connection | Explain why a request can stop at WAF/cache/redirect without reaching origin |
| Azure network | Addresses, subnets, NSGs, routes, NAT, peering | Trace an allowed path and identify the missing return route or policy |
| Advanced | Explicit private-origin components, routing alternatives, failure states, telemetry | Diagnose an altered case and identify what evidence would confirm it |

Keep simple and detailed views backed by one underlying diagram model, not independently authored copies. A single source for nodes, edges, steps, and narration reduces contradictory explanations. Start with the highest-risk diagrams; a new diagram framework is not necessary before fixing them.

Prefer a learner-controlled reveal over decorative looping motion. Highlight only the component or connection being explained, keep prior context readable, and provide Previous / Next / Reset plus a static overview.

**Reusable principle:** simplification should remove detail, not reverse causality. A clear, correct arrow is more valuable than an impressive animation.

## Recommended implementation order and acceptance gates

1. **Truth first:** DNS, OSI, packet journey, VNet three-tier, AFD request processing, NAT, Firewall, private origins, and both capstone variants. Update lesson prose and assessment explanations that repeat the same claims.
2. **Usability next:** motion, preview state, unique IDs, missing markers, overlaps, mobile inline layout, and transcripts.
3. **Depth last:** consistent beginner/detail views; cache hit/miss/expired/not-cacheable, WAF detect/block, healthy/failing origins, blocked request, and broken return-path examples.

Before publication, require:

- Every named step highlights the corresponding subject and path; counts alone are not enough.
- Every request/response arrow has correct direction and endpoints.
- Every inspected path actually crosses its inspector; peering is not presented as automatic transit.
- Each service boundary and Private Link component is labeled correctly for the chosen scenario.
- Current AFD tiers are distinguished; volatile values have a dated source or are replaced by conditional explanations.
- Every SVG has unique instance IDs and resolves its own references.
- Reduced-motion mode contains no continuous movement.
- All 33 unique visuals and reused previews remain readable at 320/390/768/1440, with keyboard access to any overflow region.
- Controls and narratives agree after any allowed sequence, including Show all -> Step.
- Beginner users can explain DNS, edge/origin, cache/WAF, and request/return paths without memorizing acronyms. Use a short observed teachback before making a claim about improved learning.

Suggested success measure: the learner can correctly trace four of five unseen request scenarios and explain one important limitation of each analogy, then repeat that explanation after a week. This is a proposed learning evaluation, not a measured result.

## Limits and evidence

This was source inspection, local Chromium execution, screenshot inspection, and documentation comparison. No Azure resources or real network experiments were created. Browser rendering is not proof of Azure deployment viability or packet behavior.

No manual screen-reader validation, Firefox/Safari coverage, production-load testing, exhaustive audit of every prose/quiz/lab statement, or human retention study was performed. The 33-visual inventory does not certify every interactive simulator elsewhere in the application.

Session evidence is retained as `visual-audit.json` (176 configurations), `inline-audit.json` (44 configurations), 33 individual diagram screenshots, nine contact sheets, and two read-only audit scripts. The project regression commands are:

```powershell
node --test tests\*.test.js
python tests\browser_smoke.py
```

The deployed GitHub Pages version was not changed. The original beginner-only stage did not repair these visual findings; the later approved upgrade is documented at the top of this report.

## Sources

Retrieved 2026-10-23. These support the cited product distinctions, not a blanket endorsement of every teaching sentence.

[S1]: https://learn.microsoft.com/azure/frontdoor/front-door-routing-architecture
[S2]: https://learn.microsoft.com/azure/frontdoor/front-door-traffic-acceleration
[S3]: https://learn.microsoft.com/azure/frontdoor/secure-front-door
[S4]: https://learn.microsoft.com/azure/virtual-network/virtual-networks-udr-overview
[S5]: https://learn.microsoft.com/azure/frontdoor/standard-premium/how-to-enable-private-link-internal-load-balancer
[S6]: https://learn.microsoft.com/azure/frontdoor/routing-methods
[S7]: https://learn.microsoft.com/windows-server/networking/dns/queries-lookups
[S8]: https://learn.microsoft.com/troubleshoot/azure/virtual-network/virtual-network-troubleshoot-nsg-blocking-traffic
[S9]: https://learn.microsoft.com/troubleshoot/azure/nat-gateway/troubleshoot-nat-connectivity

- [S1: Front Door routing architecture][S1] - TLS/WAF/route/rules/cache/origin order and tier-specific edge selection.
- [S2: Front Door traffic acceleration][S2] - Classic anycast vs Standard/Premium unicast and separate client/origin connections.
- [S3: Secure Front Door][S3] - custom rate/geo rules, configured diagnostics, origin restrictions, and Private Link limitations.
- [S4: Azure routing][S4] - longest prefix, equal-prefix route preference, next-hop reachability, and forwarding requirements.
- [S5: Private Link to internal load balancer][S5] - Private Link Service, AFD-managed endpoint, and approval.
- [S6: Origin routing methods][S6] - health/priority/latency/weight and cookie-based affinity.
- [S7: DNS queries and lookups][S7] - recursive resolver, referrals, responses, and caching.
- [S8: NSG evaluation][S8] - default rules, priority, subnet and NIC filtering.
- [S9: NAT connectivity troubleshooting][S9] - finite SNAT inventory, connection limits, reuse, and exhaustion.
