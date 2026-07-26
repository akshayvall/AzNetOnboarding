/* Observable outcomes, diagnostics, and transfer evidence for the networking track. */
const NETWORK_MASTERY_RUBRIC = Object.freeze([
    Object.freeze({ id: 'correctness', label: 'Technical correctness', description: 'The design or diagnosis applies Azure networking behavior accurately.' }),
    Object.freeze({ id: 'evidence', label: 'Verification evidence', description: 'Commands, logs, headers, diagrams, or tests support the conclusion.' }),
    Object.freeze({ id: 'judgment', label: 'Tradeoff judgment', description: 'The learner explains alternatives, failure modes, security, reliability, and cost.' }),
    Object.freeze({ id: 'communication', label: 'Clear explanation', description: 'An engineer and an executive can understand the decision and next action.' })
]);

const defineNetworkMastery = (outcome, prerequisites, prompt, artifact) => Object.freeze({
    outcome,
    prerequisites: Object.freeze(prerequisites),
    transfer: Object.freeze({ prompt, artifact, rubric: NETWORK_MASTERY_RUBRIC })
});

const ACADEMY_MASTERY = Object.freeze({
    activityIds: Object.freeze([]),
    diagnostic: Object.freeze({
        title: 'Azure networking mastery diagnostic',
        description: 'Ten questions route you to the earliest networking competency that needs practice. This is not a certification test.',
        questions: Object.freeze([
            Object.freeze({ moduleId: 'net-fundamentals', question: 'Which sequence occurs before an HTTPS response can return?', options: ['HTTP, DNS, TLS, TCP', 'DNS, TCP, TLS, HTTP', 'TLS, DNS, HTTP, TCP', 'DNS, HTTP, TCP, TLS'], correct: 1 }),
            Object.freeze({ moduleId: 'azure-vnets', question: 'What is a subnet in Azure?', options: ['A DNS zone', 'A range carved from one VNet address space', 'A public endpoint', 'A subscription boundary'], correct: 1 }),
            Object.freeze({ moduleId: 'azure-ip-addressing', question: 'How many addresses can workloads use in an Azure /28 subnet?', options: ['16', '14', '11', '8'], correct: 2 }),
            Object.freeze({ moduleId: 'nsgs', question: 'How are NSG rules evaluated?', options: ['Highest number first', 'First matching lowest-priority number wins', 'Deny always beats allow regardless of priority', 'Randomly'], correct: 1 }),
            Object.freeze({ moduleId: 'azure-dns', question: 'What receives conditionally forwarded on-premises queries for Azure private zones?', options: ['NAT Gateway', 'DNS Private Resolver inbound endpoint', 'Front Door endpoint', 'NSG'], correct: 1 }),
            Object.freeze({ moduleId: 'load-balancing-overview', question: 'Which service is the normal choice for global HTTP routing, CDN, and edge WAF?', options: ['Standard Load Balancer', 'Traffic Manager only', 'Azure Front Door', 'VPN Gateway'], correct: 2 }),
            Object.freeze({ moduleId: 'frontdoor-basics', question: 'How do you bind a public origin allow rule to your Front Door profile?', options: ['AzureFrontDoor.Backend only', 'X-Azure-FDID only', 'Service tag plus X-Azure-FDID validation', 'A public CNAME only'], correct: 2 }),
            Object.freeze({ moduleId: 'vpn-connectivity', question: 'What does BGP provide for hybrid connectivity?', options: ['Dynamic prefix exchange and convergence', 'TLS termination', 'Web caching', 'Private DNS registration'], correct: 0 }),
            Object.freeze({ moduleId: 'route-tables-udr', question: 'Which route wins?', options: ['/16 over /24 because it is broader', 'The longest matching prefix', 'The oldest route', 'The highest metric only'], correct: 1 }),
            Object.freeze({ moduleId: 'network-watcher', question: 'What is the current replacement for new NSG flow-log deployments?', options: ['Packet capture only', 'VNet flow logs', 'Activity Log', 'Front Door logs'], correct: 1 })
        ])
    }),
    modules: Object.freeze({
        'net-fundamentals': defineNetworkMastery(
            'Trace DNS, TCP, TLS, HTTP, routing, and return traffic for an application request and identify likely failure layers.',
            [],
            'Trace an unfamiliar browser request from client to Azure Front Door and origin, annotate every protocol transition, and diagnose three injected failures from symptoms.',
            'request-path-teachback.md'
        ),
        'azure-environment': defineNetworkMastery(
            'Explain control plane, data plane, RBAC scope, policy, regions, zones, quotas, and failure domains for a network change.',
            ['net-fundamentals'],
            'Review a proposed multi-region network deployment and identify its control-plane permissions, data-plane dependencies, policy gates, quotas, and failure domains.',
            'azure-environment-review.md'
        ),
        'azure-vnets': defineNetworkMastery(
            'Design VNets and subnets with explicit egress, delegation, DNS, peering limits, growth space, and failure isolation.',
            ['azure-environment', 'azure-ip-addressing'],
            'Design a three-tier VNet for an unfamiliar workload, include private-subnet egress and growth, and prove no address overlap or hidden public dependency.',
            'vnet-design.md'
        ),
        'azure-ip-addressing': defineNetworkMastery(
            'Allocate IPv4 and IPv6 ranges without overlap while preserving Azure reservations, scale headroom, and future peering.',
            ['net-fundamentals'],
            'Create an address plan for three regions and two environments, detect one deliberate overlap, and defend the reserved capacity and IPv6 strategy.',
            'ip-address-plan.md'
        ),
        'nsgs': defineNetworkMastery(
            'Predict effective NSG behavior across subnet and NIC rules, service tags, ASGs, statefulness, and priority.',
            ['azure-vnets'],
            'Given an unfamiliar traffic matrix and conflicting NSGs, predict every decision, validate with IP Flow Verify, and simplify the rule set without widening access.',
            'nsg-evidence-pack.md'
        ),
        'azure-dns': defineNetworkMastery(
            'Design public, private, split-horizon, Private Endpoint, and hybrid DNS resolution using Private Resolver when appropriate.',
            ['azure-vnets'],
            'Design DNS for on-premises clients, two spoke VNets, and a Private Endpoint, then prove approved clients resolve privately and the public path is denied.',
            'hybrid-dns-design.md'
        ),
        'load-balancing-overview': defineNetworkMastery(
            'Choose among Standard Load Balancer, Application Gateway, Traffic Manager, and Front Door from protocol, scope, security, and failover needs.',
            ['net-fundamentals'],
            'Select load-balancing services for four unfamiliar traffic patterns, draw the data path for each, and explain rejected options and failure behavior.',
            'load-balancing-decision.md'
        ),
        'frontdoor-basics': defineNetworkMastery(
            'Trace an Azure Front Door request through DNS, edge TLS, WAF, routing, health selection, origin security, and response.',
            ['load-balancing-overview', 'azure-dns'],
            'Configure or review a Front Door route for a new application, prove the Front Door path succeeds, prove direct origin bypass fails, and capture headers and logs.',
            'afd-fundamentals-evidence.md'
        ),
        'vpn-connectivity': defineNetworkMastery(
            'Compare VPN and ExpressRoute using BGP, redundancy, zones, FastPath, encryption, convergence, capacity, and failure tradeoffs.',
            ['azure-vnets', 'route-tables-udr'],
            'Design resilient hybrid connectivity for a two-site workload, show advertisements and failure paths, and run a tabletop failover and failback review.',
            'hybrid-connectivity-design.md'
        ),
        'peering-endpoints': defineNetworkMastery(
            'Explain peering non-transitivity, gateway transit, routing, and the security and DNS differences among service and private endpoints.',
            ['azure-vnets', 'azure-dns'],
            'Connect two workloads and one PaaS service using an unfamiliar topology, choose peering and endpoint patterns, and prove routing plus DNS behavior.',
            'connectivity-pattern-review.md'
        ),
        'azure-bastion': defineNetworkMastery(
            'Design private administrative access using Bastion, RBAC, JIT, native client options, logging, and cost-aware SKU selection.',
            ['azure-vnets', 'nsgs'],
            'Remove public management access from an unfamiliar VM design, configure a Bastion-based path, and prove internet RDP or SSH is unavailable.',
            'bastion-access-evidence.md'
        ),
        'nat-gateway': defineNetworkMastery(
            'Design and diagnose explicit egress using routing priority, NAT Gateway, SNAT capacity, metrics, and application connection behavior.',
            ['azure-vnets', 'azure-ip-addressing'],
            'Diagnose intermittent outbound failures in a new workload, distinguish routing from SNAT pressure, and justify the chosen egress capacity and controls.',
            'egress-diagnostic-report.md'
        ),
        'route-tables-udr': defineNetworkMastery(
            'Predict effective routes across system, UDR, BGP, service-tag, and longest-prefix rules without creating asymmetric paths.',
            ['azure-vnets'],
            'Given an unfamiliar hub-spoke route table and BGP advertisements, predict five flows, find an asymmetric path, and propose a verified correction.',
            'effective-route-analysis.md'
        ),
        'frontdoor-advanced': defineNetworkMastery(
            'Design Front Door origins, groups, probes, routes, rules, domains, TLS, Private Link, diagnostics, and staged migration through IaC.',
            ['frontdoor-basics'],
            'Review a complex Front Door configuration, identify an origin-security and health-probe defect, express the fix as IaC, and define staged rollout and rollback.',
            'afd-advanced-review.md'
        ),
        'frontdoor-caching': defineNetworkMastery(
            'Predict cache keys, TTL, origin directives, cookies, purge behavior, compression, logs, and authenticated-content risk.',
            ['frontdoor-basics'],
            'Run a cache experiment with query strings, cookies, and origin headers, explain every X-Cache result, and prove private content is never cached.',
            'afd-cache-experiment.md'
        ),
        'frontdoor-waf': defineNetworkMastery(
            'Tune Front Door WAF from detection to prevention using managed rules, exclusions, bot controls, rate limits, logs, and incident evidence.',
            ['frontdoor-basics'],
            'Test a new WAF policy with normal and malicious requests, tune one false positive, move to prevention, and document logs plus rollback criteria.',
            'afd-waf-evidence.md'
        ),
        'network-architecture': defineNetworkMastery(
            'Choose self-managed hub-spoke or Virtual WAN using scale, routing, shared services, DNS, inspection, reliability, cost, and operations.',
            ['route-tables-udr', 'azure-dns'],
            'Compare hub-spoke and Virtual WAN for an unfamiliar multi-region enterprise, select one, diagram failure domains, and defend operational tradeoffs.',
            'network-topology-decision.md'
        ),
        'az104-practice': defineNetworkMastery(
            'Diagnose production networking incidents using competing hypotheses, evidence order, safe mitigation, and a clear stakeholder explanation.',
            ['nsgs', 'azure-dns', 'route-tables-udr'],
            'Complete a timed incident with DNS, routing, and security symptoms, record competing hypotheses, collect evidence, mitigate safely, and write the incident summary.',
            'timed-network-incident.md'
        ),
        'azure-firewall': defineNetworkMastery(
            'Design Azure Firewall policy, DNS proxy, IDPS, TLS inspection, SNAT, forced tunneling, availability, logging, and cost controls.',
            ['route-tables-udr', 'network-architecture'],
            'Review a new Firewall policy and route design, find one rule-order and one asymmetric-routing defect, then prove the corrected path in logs.',
            'firewall-design-review.md'
        ),
        'network-watcher': defineNetworkMastery(
            'Choose and safely use IP Flow Verify, Next Hop, Connection Troubleshoot, Connection Monitor, VNet flow logs, and packet capture.',
            ['nsgs', 'route-tables-udr'],
            'Diagnose an unfamiliar connectivity failure using the least invasive tools first, correlate immediate and historical evidence, and clean up all telemetry resources.',
            'network-watcher-evidence.md'
        ),
        'capstone-hub-spoke': defineNetworkMastery(
            'Design, automate, secure, observe, cost, test, clean up, and defend an end-to-end Azure network with Front Door.',
            ['frontdoor-advanced', 'azure-firewall', 'network-watcher', 'network-architecture'],
            'Complete the capstone as IaC, accept an unseen routing or origin change, inject one failure, estimate cost, prove observability, clean up, and defend the architecture live.',
            'networking-capstone-portfolio/'
        )
    })
});
