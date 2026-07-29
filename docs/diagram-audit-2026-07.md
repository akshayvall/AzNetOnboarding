# Diagram Audit - July 2026

## Result

The Azure Networking Academy has 22 diagram instances across 21 modules. Every declared type has an explicit builder, and every builder is used.

Final browser validation rendered every diagram at 1440px, 768px, and 320px:

| Check | Result |
|---|---:|
| Diagram instances | 22 |
| Widths tested | 3 |
| Browser render checks | 66 |
| Missing/fallback diagrams | 0 |
| Duplicate IDs | 0 |
| Step mismatches | 0 |
| Text collisions or clipping | 0 |
| Accessibility/control failures | 0 |
| Runtime errors | 0 |

## Repairs

- Fixed the Azure regions label collision.
- Corrected label intersections in Load Balancer, UDR, Firewall, Front Door Rule Set, caching, and capstone diagrams.
- Preserved readable mobile text with a keyboard-focusable local scroll canvas.
- Fixed Network Watcher step parity and Step wraparound.
- Distinguished paired and nonpaired regions and removed automatic-DR implications.
- Rebuilt Front Door edge processing around WAF first, then route settings and Rule Sets.
- Removed invalid Rule Set actions for 403/rate limiting; those controls now sit with WAF custom rules.
- Replaced a misleading WAF DDoS example with application-layer rate limiting.
- Reframed VPN encryption as negotiated IPsec/IKE policy.
- Removed volatile bandwidth/SLA values from the ExpressRoute visual summary.
- Versioned all changed assets with the offline cache release.

## First-Party Sources

- [Azure region pairs and nonpaired regions](https://learn.microsoft.com/en-us/azure/reliability/regions-paired)
- [Azure Availability Zones](https://learn.microsoft.com/en-us/azure/reliability/availability-zones-overview)
- [Architecture strategies for zones and regions](https://learn.microsoft.com/en-us/azure/well-architected/design-guides/regions-availability-zones)
- [Azure Front Door Rule Sets](https://learn.microsoft.com/en-us/azure/frontdoor/front-door-rules-engine)
- [Front Door match conditions](https://learn.microsoft.com/en-us/azure/frontdoor/rules-match-conditions)
- [Front Door Rule Set actions](https://learn.microsoft.com/en-us/azure/frontdoor/front-door-rules-engine-actions)
- [Front Door caching](https://learn.microsoft.com/en-us/azure/frontdoor/front-door-caching)

## Automated Contract

Run:

```powershell
node --test tests/diagrams.test.js
```

The suite checks builder coverage, IDs, step parity, SVG output, known geometry regressions, keyboard/mobile behavior, Step wraparound, and current region, WAF, Rule Set, VPN, and ExpressRoute framing.

The complete dual-academy audit, per-diagram inventory, learning-structure assessment, and 90-day plan are stored in the parent `Idea_Gen/docs` workspace.
