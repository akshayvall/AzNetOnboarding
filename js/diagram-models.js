/* Graphs, explanations and scenario branches share semantic IDs. No SVG lives in lesson copy. */
const DiagramCatalog = {
    reviewed: '2026-10-23',
    models: Object.create(null),
    sources: {
        dns: { title: 'DNS queries and lookups', url: 'https://learn.microsoft.com/windows-server/networking/dns/queries-lookups' },
        tcp: { title: 'TCP specification (RFC 9293)', url: 'https://www.rfc-editor.org/rfc/rfc9293' },
        vnet: { title: 'Azure virtual networks', url: 'https://learn.microsoft.com/azure/virtual-network/virtual-networks-overview' },
        hierarchy: { title: 'Azure resource organization', url: 'https://learn.microsoft.com/azure/cloud-adoption-framework/ready/azure-setup-guide/organize-resources' },
        regions: { title: 'Azure regions and availability zones', url: 'https://learn.microsoft.com/azure/reliability/regions-overview' },
        nsg: { title: 'Network security group rules', url: 'https://learn.microsoft.com/azure/virtual-network/network-security-groups-overview' },
        lb: { title: 'Choose a load-balancing service', url: 'https://learn.microsoft.com/azure/architecture/guide/technology-choices/load-balancing-overview' },
        vpn: { title: 'VPN Gateway', url: 'https://learn.microsoft.com/azure/vpn-gateway/vpn-gateway-about-vpngateways' },
        expressroute: { title: 'ExpressRoute overview', url: 'https://learn.microsoft.com/azure/expressroute/expressroute-introduction' },
        peering: { title: 'Virtual network peering', url: 'https://learn.microsoft.com/azure/virtual-network/virtual-network-peering-overview' },
        bastion: { title: 'Azure Bastion architecture', url: 'https://learn.microsoft.com/azure/bastion/bastion-overview' },
        nat: { title: 'Troubleshoot NAT connectivity', url: 'https://learn.microsoft.com/troubleshoot/azure/nat-gateway/troubleshoot-nat-connectivity' },
        routes: { title: 'Azure route selection and forwarding', url: 'https://learn.microsoft.com/azure/virtual-network/virtual-networks-udr-overview' },
        firewall: { title: 'Firewall rule processing', url: 'https://learn.microsoft.com/azure/firewall/rule-processing' },
        watcher: { title: 'IP flow verify scope', url: 'https://learn.microsoft.com/azure/network-watcher/ip-flow-verify-overview' },
        afd: { title: 'Front Door routing architecture', url: 'https://learn.microsoft.com/azure/frontdoor/front-door-routing-architecture' },
        acceleration: { title: 'Client and origin connections', url: 'https://learn.microsoft.com/azure/frontdoor/front-door-traffic-acceleration' },
        origins: { title: 'Origin selection: health, priority, latency, weight', url: 'https://learn.microsoft.com/azure/frontdoor/routing-methods' },
        probes: { title: 'Health probes and all-unhealthy fallback', url: 'https://learn.microsoft.com/azure/frontdoor/health-probes' },
        cache: { title: 'Front Door caching', url: 'https://learn.microsoft.com/azure/frontdoor/front-door-caching' },
        rules: { title: 'Rule Set actions', url: 'https://learn.microsoft.com/azure/frontdoor/front-door-rules-engine-actions' },
        waf: { title: 'WAF policy modes and actions', url: 'https://learn.microsoft.com/azure/web-application-firewall/afds/afds-overview' },
        wafResponse: { title: 'WAF normal and rate-limit block responses', url: 'https://learn.microsoft.com/azure/web-application-firewall/afds/waf-front-door-configure-custom-response-code' },
        secure: { title: 'Secure Front Door and its origins', url: 'https://learn.microsoft.com/azure/frontdoor/secure-front-door' },
        private: { title: 'Private Link to an internal load balancer', url: 'https://learn.microsoft.com/azure/frontdoor/standard-premium/how-to-enable-private-link-internal-load-balancer' },
        appservice: { title: 'Private Link to App Service', url: 'https://learn.microsoft.com/azure/frontdoor/standard-premium/how-to-enable-private-link-web-app' },
        sql: { title: 'Azure SQL private endpoints', url: 'https://learn.microsoft.com/azure/azure-sql/database/private-endpoint-overview' }
    },

    node: (id, label, detail, col, row, group = '') => ({ id, label, detail, col, row, group }),
    edge: (id, from, to, label, kind = 'request') => ({ id, from, to, label, kind }),
    step: (id, title, text, focus, predict) => ({ id, title, text, focus, ...(predict ? { predict } : {}) }),
    predict: (prompt, options, answer, explanation) => ({ prompt, options, answer, explanation }),

    register(model) {
        if (this.models[model.id]) throw new Error(`Duplicate diagram: ${model.id}`);
        this.models[model.id] = { groups: [], defaults: {}, ...model };
    },

    hasDepth(type, options = {}) {
        return this.models[type].scenarios.some(scenario => {
            const signature = level => {
                const { nodes, edges, steps } = this.resolve(type, { ...options, scenario: scenario.id, level });
                return JSON.stringify({ nodes, edges, steps });
            };
            return signature('basic') !== signature('detailed');
        });
    },

    resolve(type, options = {}) {
        if (!Object.hasOwn(this.models, type)) throw new Error(`Unknown diagram: ${type}`);
        const definition = this.models[type];
        const settings = { level: 'basic', scenario: definition.scenarios[0].id, ...definition.defaults, ...options };
        if (!['basic', 'detailed'].includes(settings.level)) throw new Error('Unknown diagram level');
        const scenario = definition.scenarios.find(item => item.id === settings.scenario);
        if (!scenario) throw new Error(`Unknown scenario for ${type}: ${settings.scenario}`);
        for (const control of definition.controls || []) {
            if (!control.options.some(item => item.id === settings[control.id])) throw new Error(`Unknown ${control.id}: ${settings[control.id]}`);
        }
        if (settings.connection === 'private' && settings.tier !== 'premium') throw new Error('Private Link origins require Premium.');
        const graph = definition.build ? definition.build(settings) : definition;
        const fullSteps = graph.steps || scenario.steps;
        const steps = settings.level === 'basic' ? graph.simpleSteps || scenario.simpleSteps || fullSteps : fullSteps;
        const focus = new Set(steps.flatMap(step => step.focus));
        const edges = graph.edges.filter(link => focus.has(link.id));
        edges.forEach(link => { focus.add(link.from); focus.add(link.to); });
        const selected = graph.nodes.filter(node => focus.has(node.id) || graph.retainNodes?.includes(node.id));
        const columns = [...new Set(selected.map(node => node.col))].sort((a, b) => a - b);
        const rows = [...new Set(selected.map(node => node.row))].sort((a, b) => a - b);
        return {
            ...definition, ...graph, settings, steps, edges,
            presentation: typeof definition.presentation === 'function' ? definition.presentation(settings) : definition.presentation,
            nodes: selected.map(node => ({
                ...node, col: columns.indexOf(node.col), row: rows.indexOf(node.row),
                ...(!focus.has(node.id) ? { inactive: true, detail: node.id === 'origin' ? 'Not contacted in this scenario' : 'Not reached in this scenario' } : {})
            })),
            scenarioLabel: scenario.label, scenarioSummary: scenario.summary || definition.summary
        };
    }
};

(() => {
    const { node: n, edge: e, step: s, predict: q } = DiagramCatalog;
    const add = model => DiagramCatalog.register(model);

    const osiSteps = [
        s('application', 'Layer 7: Application', 'HTTP gives the request its meaning. Front Door and Application Gateway make HTTP-aware decisions.', ['layer-7']),
        s('presentation', 'Layer 6: Presentation', 'The model separates representation and protection. TLS protects HTTPS; real Internet protocols do not fit neatly into every OSI box.', ['layer-6']),
        s('session', 'Layer 5: Session', 'Conceptually, coordinate a conversation. This is not a one-to-one mapping to an Azure product or a distinct appliance in the request path.', ['layer-5']),
        s('transport', 'Layer 4: Transport', 'TCP orders a byte stream; UDP sends datagrams. Azure Load Balancer uses transport and IP information. HTTP/3 uses QUIC over UDP.', ['layer-4']),
        s('network', 'Layer 3: Network', 'IP addresses and routes guide packets to a destination. NSGs examine IP addresses plus transport ports and protocol.', ['layer-3']),
        s('link', 'Layer 2: Data link', 'Frames carry traffic across a local link. Azure virtual networking abstracts the physical switching implementation.', ['layer-2']),
        s('physical', 'Layer 1: Physical', 'Signals travel through physical networking equipment. You configure cloud resources, not the datacenter cabling.', ['layer-1'])
    ];
    add({
        id: 'osi-model', title: 'Seven layers, seven different jobs',
        summary: 'Read from the application down to the physical network. These are conceptual responsibilities, not seven Azure appliances.',
        takeaway: 'Ask which job failed before choosing a tool.',
        caveat: 'OSI is a conceptual model. TLS and real Internet stacks do not map perfectly to its seven layers.',
        sources: ['tcp', 'vnet'],
        nodes: [
            n('layer-7', 'Layer 7 / Application', 'HTTP meaning and DNS messages', 0, 0),
            n('layer-6', 'Layer 6 / Presentation', 'Representation and protection', 0, 1),
            n('layer-5', 'Layer 5 / Session', 'Conversation coordination', 0, 2),
            n('layer-4', 'Layer 4 / Transport', 'TCP streams or UDP datagrams', 0, 3),
            n('layer-3', 'Layer 3 / Network', 'IP addresses and routing', 0, 4),
            n('layer-2', 'Layer 2 / Data link', 'Frames on a local link', 0, 5),
            n('layer-1', 'Layer 1 / Physical', 'Signals and equipment', 0, 6)
        ],
        edges: [],
        scenarios: [{ id: 'layers', label: 'The conceptual stack', steps: osiSteps, simpleSteps: [osiSteps[0], osiSteps[3], osiSteps[4], osiSteps[6]] }]
    });

    const tcpSteps = [
        s('syn', 'Ask to establish a connection', 'Client sends SYN with illustrative sequence number 100.', ['syn']),
        s('syn-ack', 'The server acknowledges', 'Server sends SYN-ACK: sequence 300, acknowledgement 101. A SYN consumes one sequence number.', ['syn-ack'],
            q('Who sends SYN-ACK?', ['The client again', 'The server', 'A DNS resolver'], 1, 'The server acknowledges the client and supplies its own initial sequence number.')),
        s('ack', 'The client acknowledges', 'Client sends ACK 301. This ordinary TCP handshake has now established a connection.', ['ack']),
        s('data', 'Exchange application data', 'The peers can send and acknowledge data. A TCP connection does not prove that the application will respond correctly.', ['data-out', 'data-back'])
    ];
    add({
        id: 'tcp-handshake', title: 'TCP: a conversation before the request',
        presentation: { kind: 'sequence' },
        summary: 'Follow the direction of SYN, SYN-ACK and ACK in an ordinary TCP connection.',
        takeaway: 'Connection establishment and a successful application response are different checks.',
        caveat: 'Sequence numbers are fictional. TCP Fast Open is not shown. HTTP/3 uses QUIC, not this TCP handshake.',
        sources: ['tcp'],
        nodes: [n('client', 'Client', 'Starts this connection', 0, 0), n('server', 'Server', 'Listening application endpoint', 1, 0)],
        edges: [
            e('syn', 'client', 'server', 'SYN / seq 100'),
            e('syn-ack', 'server', 'client', 'SYN-ACK / seq 300, ack 101', 'response'),
            e('ack', 'client', 'server', 'ACK / ack 301'),
            e('data-out', 'client', 'server', 'Application request'),
            e('data-back', 'server', 'client', 'Application response', 'response')
        ],
        scenarios: [{ id: 'connect', label: 'Connection succeeds', steps: tcpSteps }]
    });

    const dnsSteps = [
        s('ask', 'Ask the recursive resolver', 'After a local cache miss, the client asks its configured recursive DNS resolver for shop.example.com.', ['ask']),
        s('root-query', 'Resolver asks a root server', 'The resolver begins an uncached lookup. The root server is not asked to fetch a web page.', ['root-query']),
        s('root-referral', 'Root returns a referral', 'The root points the resolver to the .com top-level-domain (TLD) servers.', ['root-referral']),
        s('tld-query', 'Resolver follows that referral', 'The resolver, not the root server, sends the next query to the TLD server.', ['tld-query'],
            q('Who queries the TLD server?', ['The root server on the client’s behalf', 'The recursive resolver', 'The web application'], 1, 'The recursive resolver follows referrals. The authoritative hierarchy does not forward the original query down a chain.')),
        s('tld-referral', 'TLD returns another referral', 'The TLD points the resolver to the authoritative servers for example.com.', ['tld-referral']),
        s('authoritative-query', 'Resolver asks the authority', 'The authoritative DNS server owns the requested record for this example zone.', ['authoritative-query']),
        s('authoritative-answer', 'Authority answers the resolver', 'The record and its time to live return to the resolver, which can cache the answer.', ['authoritative-answer']),
        s('answer', 'Resolver answers the client', 'The client receives the address and can now attempt a separate HTTPS connection. DNS success does not prove HTTP success.', ['answer'])
    ];
    add({
        id: 'dns-resolution', title: 'DNS: the resolver follows the clues',
        summary: 'The resolver asks the hierarchy and returns the result. DNS servers do not pass your web request between them.',
        takeaway: 'Name lookup finds a destination; it does not deliver the page.',
        caveat: 'This is a simplified A-record lookup. CNAME chains, DNSSEC, retries and multiple answers are not shown. Caches mean this full lookup is not needed on every visit.',
        sources: ['dns'],
        nodes: [
            n('client', 'Your device', 'Local DNS cache checked first', 0, 1),
            n('resolver', 'Recursive resolver', 'Follows referrals; caches answers', 1, 1),
            n('root', 'Root server', 'Referral to .com servers', 2, 0),
            n('tld', '.com TLD server', 'Referral to example.com', 2, 1),
            n('authoritative', 'Authoritative server', 'The zone’s DNS records', 2, 2)
        ],
        edges: [
            e('ask', 'client', 'resolver', 'Find shop.example.com'),
            e('root-query', 'resolver', 'root', 'Query root'),
            e('root-referral', 'root', 'resolver', 'Referral to .com', 'response'),
            e('tld-query', 'resolver', 'tld', 'Query .com'),
            e('tld-referral', 'tld', 'resolver', 'Referral to example.com', 'response'),
            e('authoritative-query', 'resolver', 'authoritative', 'Query record'),
            e('authoritative-answer', 'authoritative', 'resolver', 'Record and TTL', 'response'),
            e('answer', 'resolver', 'client', 'DNS answer', 'response')
        ],
        scenarios: [
            { id: 'cold', label: 'Uncached lookup', steps: dnsSteps, simpleSteps: [
                dnsSteps[0],
                s('referrals', 'Follow the referrals', 'The resolver asks root, then TLD, then the authority. Each response returns to the resolver.', ['root-query', 'root-referral', 'tld-query', 'tld-referral', 'authoritative-query', 'authoritative-answer'], dnsSteps[3].predict),
                dnsSteps[7]
            ] },
            { id: 'cached', label: 'Resolver cache hit', summary: 'A still-valid cached answer avoids the authoritative hierarchy.', steps: [
                dnsSteps[0], s('answer', 'Reuse a valid answer', 'The resolver answers from its cache while the record is valid. It does not contact root, TLD or authoritative servers for this hit.', ['answer'])
            ] }
        ]
    });

    add({
        id: 'packet-journey', title: 'A direct VM request is not a Front Door request',
        summary: 'Trace an illustrative direct connection to an intentionally published VM application.',
        takeaway: 'A packet route and an HTTP proxy route are different models.',
        caveat: 'Home IPv4 NAT is common, not universal. This direct public-IP example has no Front Door, edge WAF or cache. Production management ports should not be exposed this way.',
        sources: ['vnet', 'routes'],
        nodes: [
            n('client', 'Your device', 'Application request', 0, 0),
            n('router', 'Local router', 'IPv4 NAT in this example', 1, 0),
            n('internet', 'Routed internet', 'Providers forward IP packets', 1, 1),
            n('vm', 'Azure VM', 'Published app; explicit policy', 2, 1, 'vnet')
        ],
        groups: [{ id: 'vnet', label: 'Azure VNet / workload subnet' }],
        edges: [
            e('local', 'client', 'router', 'Send toward destination'),
            e('outbound', 'router', 'internet', 'Translated IPv4 flow'),
            e('arrive', 'internet', 'vm', 'Public-IP mapping and allowed flow'),
            e('vm-reply', 'vm', 'internet', 'Application response', 'response'),
            e('return', 'internet', 'router', 'Reply to mapped address', 'response'),
            e('deliver', 'router', 'client', 'Mapped reply to device', 'response')
        ],
        scenarios: [{ id: 'direct', label: 'Direct VM application', steps: [
            s('local', 'Leave the device', 'The device sends to its next hop. The router uses IPv4 NAT in this example.', ['local', 'outbound']),
            s('arrive', 'Reach the VM application', 'Internet and Azure routing deliver the allowed connection to the VM. An arbitrary VM packet does not select a Front Door point of presence.', ['arrive']),
            s('reply', 'Follow the return path', 'The VM response must return through the internet and the existing local NAT mapping.', ['vm-reply', 'return', 'deliver'])
        ] }]
    });

    add({
        id: 'azure-hierarchy', title: 'Identity is not the resource hierarchy',
        summary: 'Separate who can act from where Azure resources are organized.',
        takeaway: 'Use the tenant for identity and the resource hierarchy for scope and governance.',
        caveat: 'Microsoft Entra ID was formerly Azure AD. Management groups below the tenant root are optional. These are management relationships, not network traffic.',
        sources: ['hierarchy'],
        nodes: [
            n('tenant', 'Microsoft Entra tenant', 'Identity boundary', 0, 0),
            n('mg', 'Management group', 'Optional governance grouping', 1, 0),
            n('subscription', 'Subscription', 'Billing and resource scope', 1, 1),
            n('rg', 'Resource group', 'Related resources and lifecycle', 1, 2),
            n('resource', 'Resource', 'A VNet, VM or Front Door profile', 1, 3)
        ],
        edges: [
            e('identity', 'tenant', 'subscription', 'Subscription trusts one tenant', 'config'),
            e('governance', 'mg', 'subscription', 'Governance scope', 'config'),
            e('contains-rg', 'subscription', 'rg', 'Contains resource groups', 'config'),
            e('contains-resource', 'rg', 'resource', 'Contains resources', 'config')
        ],
        scenarios: [{ id: 'organize', label: 'Organize a workload', steps: [
            s('identity', 'Choose an identity boundary', 'A subscription is associated with a Microsoft Entra tenant. Users and applications authenticate with that tenant.', ['identity']),
            s('governance', 'Apply governance at the right scope', 'Optional management groups organize subscriptions and inherited policy or access assignments.', ['governance']),
            s('resources', 'Group related resources', 'A subscription contains resource groups. Each resource belongs to its resource group; this hierarchy does not create network connectivity.', ['contains-rg', 'contains-resource'])
        ] }]
    });

    add({
        id: 'azure-regions', title: 'Regions and zones: design for failure boundaries',
        summary: 'A configured deployment across failure boundaries, not automatic replication of every resource.',
        takeaway: 'Availability comes from the service configuration and recovery plan, not a region label.',
        caveat: 'Service support and zone availability vary. Paired and nonpaired regions exist. Recovery across regions is not automatic; test application dependencies and data recovery.',
        sources: ['regions'],
        groups: [{ id: 'west', label: 'West Europe / illustrative deployment' }, { id: 'other', label: 'Second region / explicit recovery design' }],
        nodes: [
            n('network', 'Microsoft global network', 'Connectivity between locations', 0, 0),
            n('zone-a', 'Availability zone 1', 'Configured application instance', 1, 0, 'west'),
            n('zone-b', 'Availability zone 2', 'Configured second instance', 1, 1, 'west'),
            n('recovery', 'Recovery deployment', 'Service-specific support required', 2, 1, 'other')
        ],
        edges: [
            e('reach', 'network', 'zone-a', 'Regional connectivity', 'config'),
            e('zones', 'zone-a', 'zone-b', 'Configured workload redundancy', 'config'),
            e('recovery-plan', 'zone-b', 'recovery', 'Configured replication and recovery', 'config')
        ],
        scenarios: [{ id: 'resilience', label: 'Configured resilience', steps: [
            s('region', 'Locate the workload', 'A region is a geographic deployment area. The global network connects regions; it is not inside one availability zone.', ['reach']),
            s('zones', 'Design for a zone failure', 'Distribute supported resources across zones or choose a zone-redundant service. Application failover still depends on the design.', ['zones']),
            s('recovery', 'Plan regional recovery separately', 'Provision supported recovery resources, replicate data where required, and exercise the recovery procedure. A region pair does not automatically replicate your app.', ['recovery-plan'])
        ] }]
    });

    add({
        id: 'vnet-architecture', title: 'Three tiers, two explicit application hops',
        summary: 'The web tier calls the application tier; the application tier calls the database.',
        takeaway: 'Subnet separation organizes addresses. Rules enforce isolation.',
        caveat: 'This database is SQL on a VM, not Azure SQL PaaS. An allow rule alone does not override the default VNet allowance; add appropriately prioritized deny rules for unwanted paths.',
        sources: ['vnet', 'nsg'],
        groups: [{ id: 'vnet', label: 'VNet 10.0.0.0/16 / three workload subnets' }],
        nodes: [
            n('web', 'Web VM', 'Web subnet / 10.0.1.4', 0, 0, 'vnet'),
            n('app', 'Application VM', 'App subnet / 10.0.2.4', 1, 0, 'vnet'),
            n('database', 'SQL on a VM', 'Data subnet / 10.0.3.4', 2, 0, 'vnet')
        ],
        edges: [
            e('web-app', 'web', 'app', 'HTTPS / allowed app call'),
            e('app-db', 'app', 'database', 'SQL / allowed database call'),
            e('db-app', 'database', 'app', 'Database result', 'response'),
            e('app-web', 'app', 'web', 'Application response', 'response')
        ],
        scenarios: [{ id: 'tiers', label: 'Web to app to database', steps: [
            s('web-app', 'Web calls the application', 'The web tier sends an allowed call to the application subnet. It does not skip directly to the database.', ['web-app']),
            s('app-db', 'Application queries its database', 'The application tier makes a separate database call. Each tier has its own address range and policy.', ['app-db'],
                q('Which tier should call the database here?', ['The browser directly', 'The application tier', 'Every VNet by default'], 1, 'The intended application path is Web -> App -> Database. The security rules must enforce that design.')),
            s('return', 'Results travel back through the application', 'The database returns to the app; the app returns to the web tier. Both connections need a valid return path.', ['db-app', 'app-web'])
        ] }]
    });

    const nsgStart = [
        s('subnet', 'Evaluate the subnet NSG', 'For inbound traffic, the subnet NSG is evaluated before a NIC NSG. Rules use the five-tuple: protocol, source and destination addresses and ports.', ['to-subnet']),
        s('nic', 'Evaluate the NIC NSG too', 'Both applicable NSGs must allow the flow. Within each NSG the lowest-numbered matching rule wins.', ['to-nic'],
            q('Subnet NSG allows, but NIC NSG denies. What happens?', ['The subnet allow wins', 'The flow is denied', 'The rules cancel out'], 1, 'An inbound flow must be allowed by both applicable NSGs. An allow in one does not override a deny in the other.'))
    ];
    add({
        id: 'nsg-filtering', title: 'Two policy checks, first match in each',
        presentation: settings => ({
            kind: 'policy',
            packet: 'Illustrative new packet: TCP · 198.51.100.20:51514 → 10.0.1.4:443',
            tables: ['subnet', 'nic'].map(scope => ({
                caption: `${scope === 'subnet' ? 'Subnet' : 'NIC'} NSG — evaluate top to bottom; stop at the first match`,
                columns: ['Priority', 'Rule / destination port', 'Matches packet?', 'Decision'],
                rows: [
                    { step: scope, cells: ['100', 'HTTPS / TCP 443', 'Yes — first match', scope === 'nic' && settings.scenario === 'deny' ? 'Deny — drop packet' : 'Allow — continue'], winner: true, blocked: scope === 'nic' && settings.scenario === 'deny' },
                    { step: scope, cells: ['200', 'SSH / TCP 22', 'Not evaluated', 'Lower priority cannot override'] },
                    { step: scope, cells: ['65500', 'DenyAllInBound / any', 'Not evaluated', 'Default deny'] }
                ]
            })),
            note: 'Selected illustrative rules, not a complete NSG export. Both applicable NSGs must allow this new flow. Return traffic for an allowed connection is stateful.'
        }),
        summary: 'Use an illustrative new inbound TCP 443 connection to distinguish subnet and NIC policy.',
        takeaway: 'An allow in one NSG cannot overrule a deny in another.',
        caveat: 'NSGs are stateful. Defaults include 65000 AllowVNet, 65001 AllowAzureLoadBalancer (inbound) or AllowInternet (outbound), and 65500 DenyAll. A deny commonly causes timeout, not a guaranteed TCP reset.',
        sources: ['nsg'],
        nodes: [
            n('client', 'Client', 'New inbound TCP 443 flow', 0, 0),
            n('subnet-nsg', 'Subnet NSG', 'First matching rule', 1, 0),
            n('nic-nsg', 'NIC NSG', 'First matching rule', 2, 0),
            n('vm', 'VM application', 'An allow is not an app health check', 2, 1),
            n('drop', 'Flow dropped', 'Check the matching deny rule', 1, 1)
        ],
        edges: [
            e('to-subnet', 'client', 'subnet-nsg', 'Inbound policy evaluation'),
            e('to-nic', 'subnet-nsg', 'nic-nsg', 'Subnet allows; NIC evaluates'),
            e('allow', 'nic-nsg', 'vm', 'Both NSGs allow'),
            e('deny', 'nic-nsg', 'drop', 'Matching deny / traffic dropped', 'blocked')
        ],
        scenarios: [
            { id: 'allow', label: 'Both allow', steps: [...nsgStart, s('allow', 'The app may receive the flow', 'Network policy allows the flow. Routes, the guest firewall and the listening application still need to work.', ['allow'])] },
            { id: 'deny', label: 'NIC denies', steps: [...nsgStart, s('deny', 'Stop at the deny', 'A matching NIC deny drops this new flow. Investigate the rule and intended access; do not open every port to make the test pass.', ['deny'])] }
        ]
    });

    add({
        id: 'load-balancer', title: 'Transport routing versus HTTP routing',
        summary: 'Compare two separate architectures. These services are not serial appliances in one request.',
        takeaway: 'Choose based on protocol and routing requirements, not the most feature-rich icon.',
        caveat: 'Azure Load Balancer supports TCP/UDP scenarios; it is not a generic HTTP parser. HTTP can use L4 when HTTP-aware policy is unnecessary. Global/cross-region options also exist.',
        sources: ['lb'],
        nodes: [
            n('client', 'Client', 'Traffic for an application', 0, 0),
            n('lb', 'Azure Load Balancer', 'TCP/UDP flow distribution', 1, 0),
            n('gateway', 'Application Gateway', 'Regional HTTP request routing', 1, 1),
            n('backend', 'Backend application', 'Application health still matters', 2, 0)
        ],
        edges: [
            e('l4-in', 'client', 'lb', 'TCP/UDP flow'),
            e('l4-out', 'lb', 'backend', 'Flow selected using configured distribution'),
            e('l7-in', 'client', 'gateway', 'HTTP(S) request'),
            e('l7-out', 'gateway', 'backend', 'Configured host/path route')
        ],
        scenarios: [
            { id: 'l4', label: 'L4 / TCP or UDP', steps: [
                s('flow', 'Identify the connection', 'The ordinary distribution model uses protocol plus source and destination IPs and ports: the five-tuple.', ['l4-in']),
                s('backend', 'Distribute an eligible flow', 'Health probes and load-balancing configuration determine eligible backends. The service does not choose using /images versus /api.', ['l4-out'])
            ] },
            { id: 'l7', label: 'L7 / HTTP(S)', steps: [
                s('request', 'Receive the web request', 'Application Gateway can terminate HTTPS and inspect HTTP information in a regional application design.', ['l7-in']),
                s('route', 'Use HTTP routing rules', 'Host and path rules can select a backend. Front Door provides a global edge HTTP proxy instead of this regional gateway pattern.', ['l7-out'])
            ] }
        ]
    });

    add({
        id: 'lb-choice', title: 'Choose the path before choosing the service',
        summary: 'A first-pass service comparison. Select a requirement and explain why its path fits.',
        takeaway: 'DNS steering does not proxy requests; a Layer 7 proxy does.',
        caveat: 'This is a simplified decision aid, not a complete architecture decision. HTTP does not require L7 balancing, Traffic Manager can steer HTTP endpoints, and cross-region Azure Load Balancer also exists.',
        sources: ['lb'],
        nodes: [
            n('need', 'Your requirement', 'Protocol, scope and controls', 0, 0),
            n('afd', 'Azure Front Door', 'Global HTTP(S) edge proxy', 1, 0),
            n('appgw', 'Application Gateway', 'Regional HTTP(S) controls', 1, 1),
            n('lb', 'Azure Load Balancer', 'Supported TCP/UDP workloads', 1, 2),
            n('tm', 'Traffic Manager', 'DNS-based endpoint selection', 1, 3)
        ],
        edges: [
            e('edge', 'need', 'afd', 'Global web acceleration or edge WAF', 'config'),
            e('regional', 'need', 'appgw', 'Regional web routing or WAF', 'config'),
            e('transport', 'need', 'lb', 'Transport-level distribution', 'config'),
            e('dns', 'need', 'tm', 'DNS steering; direct client connection', 'config')
        ],
        scenarios: [
            ['edge', 'Global web edge', 'afd', 'Front Door is a candidate when a global HTTP(S) proxy, caching or edge WAF meets the need.'],
            ['regional', 'Regional web controls', 'appgw', 'Application Gateway is a candidate for regional HTTP(S) routing and supported WAF requirements.'],
            ['transport', 'TCP/UDP distribution', 'lb', 'Azure Load Balancer is a candidate for supported transport-level workloads. Check regional versus cross-region scope.'],
            ['dns', 'DNS steering', 'tm', 'Traffic Manager chooses a DNS answer. The client then connects directly to the endpoint; it can be an HTTP endpoint. DNS caching affects response to changes.']
        ].map(([id, label, node, explanation]) => ({ id, label, steps: [
            s('requirement', 'State the requirement', 'Decide whether you need a DNS answer, a connection distributor, or a web proxy. Then decide the geographic scope.', ['need']),
            s('choice', 'Evaluate the candidate', explanation, [id, node])
        ] }))
    });

    add({
        id: 'vpn-tunnel', title: 'A VPN joins routed networks, not broadcast domains',
        summary: 'IPsec/IKE protects a tunnel over public transport between configured VPN devices.',
        takeaway: 'Encryption does not replace routes, address planning or policy.',
        caveat: 'Algorithms, throughput and resilience depend on the device, gateway SKU and configuration. The office and Azure remain separate routed networks.',
        sources: ['vpn'],
        groups: [{ id: 'office', label: 'On-premises network' }, { id: 'azure', label: 'Azure VNet' }],
        nodes: [
            n('office', 'Office application', '192.168.10.0/24 example', 0, 0, 'office'),
            n('device', 'On-prem VPN device', 'Configured tunnel endpoint', 1, 0, 'office'),
            n('gateway', 'VPN Gateway', 'Deployed in GatewaySubnet', 1, 1, 'azure'),
            n('vm', 'Azure VM', 'Nonoverlapping address space', 2, 1, 'azure')
        ],
        edges: [
            e('office-device', 'office', 'device', 'Route toward Azure'),
            e('tunnel', 'device', 'gateway', 'IPsec/IKE over public transport'),
            e('gateway-vm', 'gateway', 'vm', 'Forward to workload subnet'),
            e('vm-gateway', 'vm', 'gateway', 'Return route', 'response'),
            e('tunnel-return', 'gateway', 'device', 'Protected return traffic', 'response'),
            e('device-office', 'device', 'office', 'Deliver to office', 'response')
        ],
        scenarios: [{ id: 'connected', label: 'Configured site-to-site VPN', steps: [
            s('route', 'Route to the VPN device', 'Use nonoverlapping address ranges and routes at both ends.', ['office-device']),
            s('tunnel', 'Cross the protected tunnel', 'The VPN devices establish IPsec/IKE protection. Packets still traverse an underlying public transport.', ['tunnel']),
            s('arrive', 'Forward to the workload', 'The Azure gateway routes decrypted traffic to the VNet workload, subject to its network policies.', ['gateway-vm']),
            s('return', 'Return through the tunnel', 'The VM and office both need working return routes. A tunnel alone does not merge their networks.', ['vm-gateway', 'tunnel-return', 'device-office'])
        ] }]
    });

    add({
        id: 'expressroute', title: 'ExpressRoute: private transport, explicit reachability',
        summary: 'Separate private peering to VNets from Microsoft peering to supported public services.',
        takeaway: 'A private path and encryption are different properties.',
        caveat: 'A private circuit does not encrypt every payload. Use TLS/IPsec or supported MACsec where required. Redundant sessions, gateway design and provider diversity determine resilience.',
        sources: ['expressroute'],
        nodes: [
            n('office', 'On-premises network', 'Customer edge routers', 0, 0),
            n('provider', 'Connectivity provider', 'Provisioned private circuit', 1, 0),
            n('private-peering', 'Private peering', 'Redundant BGP sessions', 2, 0),
            n('gateway', 'ExpressRoute gateway', 'VNet connectivity', 2, 1),
            n('vm', 'Azure VNet workload', 'Private addressing', 1, 1),
            n('microsoft-peering', 'Microsoft peering', 'Configured public-service routes', 2, 2),
            n('service', 'Supported public service', 'Not the private-peering VNet', 1, 2)
        ],
        edges: [
            e('circuit', 'office', 'provider', 'Private transport'),
            e('private', 'provider', 'private-peering', 'Private peering'),
            e('to-gateway', 'private-peering', 'gateway', 'Learned VNet routes'),
            e('workload', 'gateway', 'vm', 'VNet reachability'),
            e('ms-peering', 'provider', 'microsoft-peering', 'Microsoft peering'),
            e('public-service', 'microsoft-peering', 'service', 'Supported public service route')
        ],
        scenarios: [
            { id: 'private', label: 'Private peering / VNet', steps: [
                s('transport', 'Provision the private connectivity', 'Your provider and customer edge connect to the ExpressRoute circuit. Redundant links and routing sessions need deliberate configuration.', ['circuit']),
                s('peering', 'Use private peering', 'BGP advertises permitted private routes. A VNet normally uses an ExpressRoute gateway; supported FastPath designs can optimize the data path.', ['private', 'to-gateway']),
                s('workload', 'Reach the private workload', 'Routing, security policy and the return path still apply. Continue to protect application traffic with appropriate encryption.', ['workload'])
            ] },
            { id: 'microsoft', label: 'Microsoft peering / public services', steps: [
                s('transport', 'Use the provisioned circuit', 'The private transport can also carry separately configured Microsoft peering.', ['circuit']),
                s('peering', 'Configure public-service reachability', 'Use route filters and approved addressing for supported services. Microsoft 365 has additional requirements; it is not automatically enabled by a VNet gateway.', ['ms-peering', 'public-service'])
            ] }
        ]
    });

    add({
        id: 'vnet-peering', title: 'Peering is a relationship, not automatic transit',
        summary: 'Directly peered VNets can communicate privately when routing and policy permit.',
        takeaway: 'A peering diagram is not proof of a working multi-hop route.',
        caveat: 'Address ranges must not overlap. Each peering direction is configured. Gateway transit needs explicit settings and does not create unrestricted transitive peering.',
        sources: ['peering', 'routes'],
        nodes: [n('a', 'VNet A', '10.10.0.0/16 example', 0, 0), n('hub', 'Hub VNet', '10.20.0.0/16 example', 1, 0), n('b', 'VNet B', '10.30.0.0/16 example', 2, 0)],
        edges: [
            e('a-hub', 'a', 'hub', 'Peering A -> Hub', 'config'),
            e('hub-a', 'hub', 'a', 'Peering Hub -> A', 'config'),
            e('hub-b', 'hub', 'b', 'Separate peering to B', 'config')
        ],
        scenarios: [
            { id: 'direct', label: 'Direct peers', steps: [
                s('configure', 'Configure both directions', 'Create the peering relationships and check their connected state. This configuration is not a firewall rule.', ['a-hub', 'hub-a']),
                s('verify', 'Check the actual flow', 'Effective routes, NSGs and application listeners must permit the required traffic. Peering does not bypass them.', ['a', 'hub'])
            ] },
            { id: 'no-transit', label: 'A -> Hub -> B is not automatic', steps: [
                s('relationships', 'Two peerings exist', 'A is peered with the hub and the hub is peered with B.', ['a-hub', 'hub-a', 'hub-b']),
                s('no-transit', 'Do not infer A-to-B connectivity', 'VNet peering is nontransitive. Add direct peering or a supported routed design with forwarding and return paths.', ['a', 'b'])
            ] }
        ]
    });

    const bastionSteps = [
        s('browser', 'Admin opens a secure browser session', 'The authorized admin connects to Bastion over HTTPS. The browser-to-Bastion leg is separate from the VM session.', ['admin-bastion']),
        s('vm', 'Bastion connects to the VM privately', 'Bastion opens RDP 3389 or SSH 22 to the VM private address. The required NSG rules and credentials must allow this.', ['bastion-vm'],
            q('Where should the VM send session data?', ['Directly to the public browser address', 'Back to Bastion', 'To Front Door’s cache'], 1, 'Bastion is the intermediary for the session. The browser does not connect directly to the VM.')),
        s('vm-return', 'VM data returns to Bastion', 'The RDP/SSH connection returns through Bastion, not directly to the browser.', ['vm-bastion']),
        s('browser-return', 'Bastion returns the browser display', 'The existing protected browser session carries the display and input back to the admin.', ['bastion-admin'])
    ];
    add({
        id: 'bastion', title: 'Bastion: two connections, one admin session',
        summary: 'The VM does not need a public IP. Bastion mediates both directions of the session.',
        takeaway: 'Removing a public VM address reduces exposure; it does not remove authorization or patching needs.',
        caveat: 'This is the browser-based deployed Bastion pattern. SKU-specific and private-only options differ. NSGs must allow the required Bastion-to-VM management traffic.',
        sources: ['bastion'],
        groups: [{ id: 'bastion-subnet', label: 'VNet / AzureBastionSubnet' }, { id: 'workload', label: 'VNet / workload subnet' }],
        nodes: [
            n('admin', 'Admin browser', 'Authorized portal session', 0, 0),
            n('bastion', 'Azure Bastion', 'Managed session intermediary', 1, 0, 'bastion-subnet'),
            n('vm', 'Private VM', 'RDP 3389 or SSH 22 permitted', 2, 0, 'workload')
        ],
        edges: [
            e('admin-bastion', 'admin', 'bastion', 'HTTPS / browser session'),
            e('bastion-vm', 'bastion', 'vm', 'Private RDP or SSH'),
            e('vm-bastion', 'vm', 'bastion', 'RDP or SSH response', 'response'),
            e('bastion-admin', 'bastion', 'admin', 'HTTPS display and session data', 'response')
        ],
        scenarios: [{ id: 'session', label: 'Authorized browser session', steps: bastionSteps }]
    });

    const natSteps = [
        s('private-flow', 'VM initiates a connection', 'A VM in an associated subnet opens an outbound flow. A new mapping needs available NAT capacity.', ['vm-nat']),
        s('translate', 'Translate the source', 'NAT Gateway uses its configured public IP and a source port. Standard IPv4 NAT has finite SNAT port and connection capacity.', ['nat-internet']),
        s('reply', 'The reply matches the mapping', 'The remote service replies to the NAT public IP and mapped port. This is solicited return traffic, not a new unsolicited inbound connection.', ['internet-nat'],
            q('Can the response skip NAT and go straight to the private VM?', ['Yes, the private IP is public now', 'No, the reply uses the existing NAT mapping'], 1, 'The external service replies to the translated address and port. NAT maps that response back to the private connection.')),
        s('deliver', 'Deliver to the private connection', 'NAT translates the mapped response back to the initiating VM. Appropriate policy and connection state still matter.', ['nat-vm'])
    ];
    add({
        id: 'natgw', title: 'NAT: translate out, map the reply back',
        presentation: settings => ({
            kind: 'translation',
            packet: settings.scenario === 'mapped'
                ? 'Illustrative IPv4 mapping · private 10.0.1.4:51514 ⇄ public 203.0.113.10:62001'
                : settings.scenario === 'exhausted'
                    ? 'New outbound TCP flow from 10.0.1.4:51514 · no usable mapping available'
                    : 'New inbound TCP flow to 203.0.113.10:62001 · no existing mapping',
            tables: [{
                caption: settings.scenario === 'mapped' ? 'One connection — source translation out, destination translation back' : 'No usable mapping — no forwarded connection',
                columns: ['Stage', 'Source address:port', 'Destination address:port', 'Mapping result'],
                rows: settings.scenario === 'mapped' ? [
                    { step: 'private-flow', cells: ['Before NAT', '10.0.1.4:51514', '198.51.100.80:443', 'VM initiates TCP'] },
                    { step: 'translate', cells: ['After NAT', '203.0.113.10:62001', '198.51.100.80:443', 'Source IP + port translated'], winner: true },
                    { step: 'reply', cells: ['Reply before NAT', '198.51.100.80:443', '203.0.113.10:62001', 'Existing mapping found'] },
                    { step: 'deliver', cells: ['Reply after NAT', '198.51.100.80:443', '10.0.1.4:51514', 'Destination restored to VM'], winner: true }
                ] : settings.scenario === 'exhausted' ? [
                    { step: 'private-flow', cells: ['New outbound flow', '10.0.1.4:51514', '198.51.100.80:443', 'Requests mapping'] },
                    { step: 'exhausted', cells: ['Not forwarded', 'No mapped public port', '198.51.100.80:443', 'Blocked — capacity unavailable'], blocked: true }
                ] : [
                    { step: 'attempt', cells: ['New inbound flow', '198.51.100.80:443', '203.0.113.10:62001', 'Not a solicited reply'] },
                    { step: 'reject', cells: ['Not forwarded', '198.51.100.80:443', 'No private destination', 'Blocked — no existing mapping'], blocked: true }
                ]
            }],
            note: 'Addresses and ports are illustrative, not real resources or guaranteed assigned ports. Public examples use documentation-only address ranges.'
        }),
        summary: 'NAT Gateway provides explicit outbound connectivity for the applicable subnet egress path.',
        takeaway: 'NAT needs a finite mapping resource and a matching return flow.',
        caveat: 'This is an IPv4 source-NAT example. Capacity, port reuse and destination limits can cause exhaustion. NAT does not admit new unsolicited inbound connections, and it does not override a route to a virtual appliance.',
        sources: ['nat', 'routes'],
        groups: [{ id: 'subnet', label: 'Associated workload subnet' }],
        nodes: [
            n('vm', 'Private VM', 'Initiates the outbound connection', 0, 0, 'subnet'),
            n('nat', 'NAT Gateway', 'Public IP + finite SNAT mappings', 1, 0),
            n('internet', 'External service', 'Replies to translated address', 2, 0),
            n('failure', 'New flow fails', 'No usable mapping available', 1, 1)
        ],
        edges: [
            e('vm-nat', 'vm', 'nat', 'Outbound private flow'),
            e('nat-internet', 'nat', 'internet', 'Translated public flow'),
            e('internet-nat', 'internet', 'nat', 'Mapped response', 'response'),
            e('nat-vm', 'nat', 'vm', 'Return to the initiating VM', 'response'),
            e('exhausted', 'nat', 'failure', 'Capacity unavailable', 'blocked'),
            e('unsolicited', 'internet', 'nat', 'No existing mapping / rejected', 'blocked')
        ],
        scenarios: [
            { id: 'mapped', label: 'Successful outbound connection', steps: natSteps },
            { id: 'exhausted', label: 'SNAT capacity exhausted', steps: [
                natSteps[0], s('exhausted', 'No mapping is available', 'NAT has finite resources. New connections can fail when capacity or per-destination limits are reached. Inspect metrics, connection reuse and sizing; adding NAT is not a guarantee against exhaustion.', ['exhausted'])
            ] },
            { id: 'unsolicited', label: 'Unsolicited inbound attempt', steps: [
                s('attempt', 'An outside host starts a new flow', 'This is not a reply to a VM-initiated connection.', ['internet']),
                s('reject', 'No inbound mapping exists', 'NAT Gateway does not create an inbound connection to the VM for this unsolicited flow.', ['unsolicited'])
            ] }
        ]
    });

    add({
        id: 'udr', title: 'Route choice: specificity first, source second',
        presentation: settings => ({
            kind: 'routes',
            packet: 'Illustrative packet destination: 198.51.100.25 · compare effective routes at the source VM',
            tables: [{
                caption: 'Matching route table — longest matching prefix, then route-source preference',
                columns: ['Destination prefix', 'Route source', 'Matches?', 'Next hop / result'],
                rows: [
                    { step: settings.scenario === 'route' ? 'prefix' : 'route', cells: ['10.0.1.0/24', 'System', 'No', 'Virtual network — not a candidate'] },
                    { step: settings.scenario === 'route' ? 'source' : 'route', cells: ['0.0.0.0/0', 'UDR', 'Yes — selected', settings.scenario === 'route' ? 'Virtual appliance 10.0.0.4' : '10.0.0.4 — unreachable'], winner: true },
                    { step: settings.scenario === 'route' ? 'source' : 'route', cells: ['0.0.0.0/0', 'BGP', 'Yes — equal prefix', 'Lower route-source preference'] },
                    { step: settings.scenario === 'route' ? 'source' : 'route', cells: ['0.0.0.0/0', 'System', 'Yes — equal prefix', 'Internet — lower preference'] }
                ]
            }],
            note: 'The /24 is more specific but does not match this destination. Among these matching /0 routes, UDR wins. Selecting a route does not prove next-hop reachability or supply source translation.'
        }),
        summary: 'Compare matching prefixes before comparing route sources. A route is a decision, not an extra appliance.',
        takeaway: 'A next-hop entry is useful only when the next hop and return route work.',
        caveat: 'For equal prefixes the general preference is UDR > BGP > system. Some platform routes have documented exceptions. A route to Internet alone does not provide outbound source translation.',
        sources: ['routes'],
        nodes: [
            n('vm', 'VM', 'Destination: external service', 0, 0),
            n('decision', 'Effective route decision', 'Configuration at the source', 0, 1),
            n('firewall', 'Firewall / NVA', 'Reachable private next hop', 1, 0),
            n('internet', 'External service', 'Explicit egress translation', 2, 0),
            n('failure', 'Unreachable next hop', 'The route cannot forward traffic', 1, 1)
        ],
        edges: [
            e('evaluate', 'vm', 'decision', 'Compare effective routes', 'config'),
            e('via-fw', 'vm', 'firewall', 'Selected virtual-appliance next hop'),
            e('egress', 'firewall', 'internet', 'Allowed egress with SNAT'),
            e('return-fw', 'internet', 'firewall', 'Mapped reply', 'response'),
            e('return-vm', 'firewall', 'vm', 'Configured return path', 'response'),
            e('unreachable', 'vm', 'failure', 'No reachable forwarding hop', 'blocked')
        ],
        scenarios: [
            { id: 'route', label: 'Working routed egress', steps: [
                s('prefix', 'Find the most specific prefix', 'Longest prefix wins: a matching /24 is more specific than /16 or /0.', ['evaluate']),
                s('source', 'Break an equal-prefix tie', 'For an equal /0 prefix, UDR > BGP > system chooses the user route. This is route-source preference, not a longer prefix.', ['decision'],
                    q('A UDR /0 and a system /0 both match. Why choose the UDR?', ['Its /0 is longer', 'Route-source preference breaks the equal-prefix tie', 'The first route created always wins'], 1, 'The prefixes are equal. Route-source preference selects the UDR.')),
                s('forward', 'Reach the forwarding appliance', 'The next hop must be reachable. An NVA also needs Azure NIC IP forwarding and guest forwarding configured. Azure Firewall is a managed service.', ['via-fw']),
                s('egress', 'Apply policy and translation', 'The allowed Internet flow needs explicit egress translation, such as firewall SNAT in this example.', ['egress']),
                s('return', 'Validate the way back', 'Replies must return through the correct stateful path and reach the VM.', ['return-fw', 'return-vm'])
            ] },
            { id: 'unreachable', label: 'Broken next hop', steps: [
                s('route', 'A route is selected', 'Longest prefix and then equal-prefix route-source preference select the intended route.', ['evaluate']),
                s('failure', 'Forwarding cannot happen', 'A route entry does not create an appliance. Check next-hop reachability, forwarding and the return path before changing security rules.', ['unreachable'])
            ] }
        ]
    });

    const routedTopology = (id, title) => ({
        id, title, summary: 'A routed spoke-to-spoke flow must visibly cross the intended inspection point in both directions.',
        takeaway: 'Routes, not the placement of icons, decide whether a firewall sees traffic.',
        caveat: 'Peering is nontransitive. Allow-forwarded-traffic settings, effective routes, appliance policy and return routing must match the design. Azure Firewall network allows can preempt application rules.',
        sources: ['routes', 'peering', 'firewall'],
        groups: [{ id: 'a', label: 'Spoke A VNet' }, { id: 'hub', label: 'Hub VNet' }, { id: 'b', label: 'Spoke B VNet' }],
        nodes: [
            n('spoke-a', 'Workload A', 'Source subnet and route table', 0, 0, 'a'),
            n('hub', 'Hub peering relationships', 'Connectivity is not a transit policy', 1, 0, 'hub'),
            n('firewall', 'Azure Firewall', 'Stateful central inspection', 1, 1, 'hub'),
            n('spoke-b', 'Workload B', 'Destination and return route', 2, 0, 'b'),
            n('lost', 'Reply cannot return', 'Missing or asymmetric route', 2, 1, 'b')
        ],
        edges: [
            e('peer-a', 'spoke-a', 'hub', 'Spoke A / hub peering', 'config'),
            e('peer-b', 'hub', 'spoke-b', 'Hub / spoke B peering', 'config'),
            e('a-fw', 'spoke-a', 'firewall', 'UDR sends traffic to firewall'),
            e('fw-b', 'firewall', 'spoke-b', 'Allowed inspected flow'),
            e('b-fw', 'spoke-b', 'firewall', 'Return through inspection', 'response'),
            e('fw-a', 'firewall', 'spoke-a', 'Stateful return to source', 'response'),
            e('bad-return', 'spoke-b', 'lost', 'Broken return path', 'blocked')
        ],
        scenarios: [
            { id: 'inspected', label: 'Inspected spoke-to-spoke', steps: [
                s('configure', 'Separate connectivity from forwarding', 'Peerings connect each spoke to the hub. Route tables and forwarding settings establish the actual inspected path.', ['peer-a', 'peer-b']),
                s('inspect', 'Send the request through the firewall', 'The source subnet route points at the firewall. Its policy allows the intended flow to the destination.', ['a-fw', 'fw-b'],
                    q('Which path demonstrates central inspection?', ['A -> B because both peer with the hub', 'A -> Firewall -> B', 'A -> Internet -> B by default'], 1, 'A request must cross the inspection point. Two peerings alone do not supply transitive forwarding.')),
                s('return', 'Return through the same inspection path', 'B uses the intended return route through the firewall, which forwards the stateful reply to A.', ['b-fw', 'fw-a'])
            ] },
            { id: 'peering-only', label: 'Peering without transit routes', steps: [
                s('peering', 'The peerings exist', 'Each spoke has a peering relationship with the hub.', ['peer-a', 'peer-b']),
                s('no-transit', 'No working transit is established', 'Do not infer a spoke-to-spoke path. Configure and verify routes, forwarding, security policy and the return path.', ['spoke-a', 'spoke-b'])
            ] },
            { id: 'broken-return', label: 'Request works; return route is broken', steps: [
                s('request', 'The request reaches B', 'A sends through the firewall, whose rule permits the request.', ['a-fw', 'fw-b']),
                s('reply', 'The reply does not follow the intended route', 'An absent or asymmetric return route can break this stateful flow. Arrival at B does not prove end-to-end connectivity.', ['bad-return'])
            ] }
        ]
    });
    DiagramCatalog.routedTopology = routedTopology;
    add(routedTopology('hub-spoke', 'Hub and spoke: prove the inspected path'));
    const firewall = routedTopology('firewall', 'Azure Firewall: inspection must be on the path');
    firewall.scenarios.push({
        id: 'rule-order', label: 'Broad network rule matches first', steps: [
            s('arrive', 'The firewall receives the flow', 'The effective route sends the connection to Azure Firewall.', ['a-fw']),
            s('network', 'A broad network allow terminates evaluation', 'For a new connection, DNAT, network and then application rule processing matters. A broad network allow can admit the flow before a more restrictive application rule is consulted.', ['firewall']),
            s('forward', 'A later application rule is not a second check', 'Review the matching rule and intended policy. Firewall Basic, Standard and Premium are feature and sizing choices, not guarantees of a particular security outcome.', ['fw-b'])
        ]
    });
    add(firewall);

    add({
        id: 'nwatcher', title: 'IP flow verify: a policy answer, not a packet trace',
        summary: 'A fictional configuration query tests one direction and five-tuple against applicable NSG rules.',
        takeaway: 'Ask what the tool proves, and what still needs a different test.',
        caveat: 'These are illustrative results, not a call to Azure. IP flow verify does not prove the route, application, guest firewall or end-to-end reachability.',
        sources: ['watcher', 'nsg'],
        nodes: [
            n('operator', 'Your test input', 'Inbound TCP / remote -> local', 0, 0),
            n('tool', 'IP flow verify', 'Evaluate effective NSG policy', 1, 0),
            n('rules', 'Applicable NSG rules', 'Subnet and NIC configuration', 2, 0),
            n('result', 'Illustrative result', 'Allow or deny + matching rule', 1, 1)
        ],
        edges: [
            e('query', 'operator', 'tool', 'Direction, protocol, addresses, ports', 'config'),
            e('evaluate', 'tool', 'rules', 'Read effective policy', 'config'),
            e('policy-result', 'rules', 'result', 'Configuration result', 'config')
        ],
        scenarios: ['deny', 'allow'].map(outcome => ({
            id: outcome, label: outcome === 'deny' ? 'Illustrative deny' : 'Illustrative allow',
            steps: [
                s('query', 'Describe exactly one flow', 'Local: VM private address and destination port. Remote: client address and source port. Set direction and protocol explicitly.', ['query']),
                s('evaluate', 'Evaluate the configured rules', 'IP flow verify evaluates the relevant NSG rules for those inputs. It is not sending the web request to the app.', ['evaluate']),
                s('result', `Read the ${outcome} result carefully`, outcome === 'deny'
                    ? 'A fictional DenyAllInBound match identifies a policy blocker. Review intended access before adding a narrow rule; do not disable the NSG.'
                    : 'A fictional allow rules out this NSG decision for this tuple. Next check effective routes, the guest firewall and the listening application.', ['policy-result'])
            ]
        }))
    });
})();
