(() => {
    const { node: n, edge: e, step: s, predict: q } = DiagramCatalog;
    const scenarios = [
        { id: 'miss', label: 'Cache miss', summary: 'A public image is eligible for caching, but no usable cached response is available.' },
        { id: 'hit', label: 'Fresh cache hit', summary: 'The same cache key has a fresh response available at the serving cache.' },
        { id: 'expired', label: 'Cached response expired', summary: 'The cached object is stale. This example uses a reachable origin to revalidate or fetch fresh content.' },
        { id: 'uncacheable', label: 'Private response / do not cache', summary: 'An account response uses a non-caching route and appropriate no-store policy.' },
        { id: 'waf-detect', label: 'WAF match / Detection', summary: 'An illustrative custom rule matches in Detection mode. Logging is configured; the request is not blocked.' },
        { id: 'waf-block', label: 'WAF match / Prevention', summary: 'An illustrative custom Block rule matches in Prevention mode. The request ends at the edge.' },
        { id: 'redirect', label: 'Rule Set redirect', summary: 'A configured URL redirect returns a new location to the client instead of forwarding this request.' },
        { id: 'origin-failure', label: 'Primary origin unhealthy', summary: 'Health probes have marked the primary unhealthy; a healthy secondary is eligible.' },
        { id: 'all-unhealthy', label: 'All origins unhealthy', summary: 'Every enabled origin fails health probes. The documented fallback is not a guaranteed successful response.' }
    ];
    const controls = [
        { id: 'tier', label: 'Front Door tier', options: [
            { id: 'premium', label: 'Premium' }, { id: 'standard', label: 'Standard' }, { id: 'classic', label: 'Classic (comparison only)' }
        ] },
        { id: 'connection', label: 'Origin connectivity', options: [
            { id: 'public', label: 'Restricted public origin' }, { id: 'private', label: 'Private Link (Premium)' }
        ] }
    ];

    const requestGraph = settings => {
        const basic = settings.level === 'basic';
        const privateOrigin = settings.connection === 'private';
        const classic = settings.tier === 'classic';
        const scenario = settings.scenario;
        const early = ['hit', 'waf-block', 'redirect'].includes(scenario);
        const originLabel = scenario === 'origin-failure' ? 'Healthy secondary origin' : 'Application origin';
        const dnsCopy = classic
            ? 'Classic uses anycast for edge entry. It is shown only for comparison: Classic retires on March 31, 2027 (2027-03-31).'
            : 'For Standard/Premium, Front Door’s Traffic Manager profile selects a point of presence (PoP) using health and availability signals and returns that PoP’s unicast IP. The client connects to it.';
        const wafCopy = scenario === 'waf-block'
            ? 'A configured custom Block rule matches in Prevention mode. The edge returns the configured block response, commonly 403, without selecting an origin.'
            : scenario === 'waf-detect'
                ? 'A custom rule matches in Detection mode. The request continues; configured WAF diagnostic logs support investigation. Sentinel integration is not automatic.'
                : 'After HTTPS is decrypted, configured WAF rules inspect the HTTP request. This example passes. Rate limits and geo-filters are custom rules; managed rule sets depend on the tier.';
        const cacheCopy = {
            hit: 'A fresh, eligible response for the same cache key is available. Front Door can return it without contacting an origin for this response.',
            expired: 'The cached response is stale. With a reachable origin in this example, Front Door revalidates or fetches a fresh version. A 304 can reuse the validated body; a changed object can return a new body.',
            uncacheable: 'Bypass shared caching for this private account response. The route disables caching and the response uses appropriate no-store directives. Do not assume that a URL alone makes personalised content safe.',
        }[scenario] || 'No usable cached response is available for this request’s key. It is a miss. A fetched response is stored only if the route and response make it eligible.';
        const healthCopy = scenario === 'all-unhealthy'
            ? 'All enabled origins are unhealthy according to probes. Front Door falls back to round-robin distribution across them. Normal health/priority/latency/weight selection does not guarantee recovery; requests can still fail.'
            : scenario === 'origin-failure'
                ? 'The unhealthy primary is excluded after probes reflect the failure. The healthy secondary can be selected. Detection and failover depend on probe and routing settings, not a universal time guarantee.'
                : 'Consider enabled, healthy origins using the configured health-probe results. A successful probe is evidence, not proof that every application request will succeed.';
        const nodes = [
            n('client', 'Your browser', 'HTTPS request and response', 0, 0),
            n('dns', 'Name resolution', basic ? 'Find the serving edge address' : classic ? 'Classic: anycast address' : 'Selected PoP: unicast address', 0, 1),
            n('edge', 'Front Door edge', 'Checks, routing and cache', 1, 0, 'edge'),
            n('tls', 'Client TLS connection', 'Decrypt HTTPS at the edge', 1, 0, 'edge'),
            n('waf', 'WAF policy', settings.tier === 'standard' ? 'Custom rules / configured mode' : 'Custom + managed policy options', 2, 0, 'edge'),
            n('route', 'Route match', 'Domain, protocol and path', 1, 1, 'edge'),
            n('rules', classic ? 'Rules engine' : 'Rule Set', 'Transform, override or redirect', 2, 1, 'edge'),
            n('cache', 'Cache decision', 'Key, eligibility and freshness', 1, 2, 'edge'),
            n('selection', scenario === 'all-unhealthy' ? 'Fallback selection' : 'Origin selection',
                scenario === 'all-unhealthy' ? 'All unhealthy: round-robin' : 'Health > priority > latency > weight', 2, 2, 'edge'),
            n('origin-tls', 'Separate origin connection', 'HTTPS and certificate validation', 2, 3, 'connection'),
            n('origin', originLabel, privateOrigin ? 'VM app behind the internal LB' : 'Restricted public HTTPS endpoint', 2, basic ? 0 : 4, 'origin'),
            n('managed-pe', 'AFD-managed endpoint', 'Private endpoint / approved', 0, 3, 'managed'),
            n('pls', 'Private Link Service', 'Publishes the internal LB service', 0, 4, 'vnet'),
            n('ilb', 'Internal load balancer', 'Private application frontend', 1, 4, 'vnet')
        ];
        const edges = [
            e('dns-query', 'client', 'dns', 'Resolve the application name', 'config'),
            e('dns-answer', 'dns', 'client', 'Front Door edge address', 'config'),
            e('client-edge', 'client', 'edge', scenario === 'waf-block' ? 'Request blocked by edge policy' : 'Client HTTPS connection', scenario === 'waf-block' ? 'blocked' : 'request'),
            e('edge-origin', 'edge', 'origin', 'Separate origin HTTPS connection'),
            e('origin-edge', 'origin', 'edge', 'Origin response', 'response'),
            e('edge-client', 'edge', 'client', 'Client HTTPS response', 'response'),
            e('client-tls', 'client', 'tls', 'Client TLS handshake and HTTPS'),
            e('tls-waf', 'tls', 'waf', scenario === 'waf-block' ? 'Decrypted request — blocked by WAF' : 'Decrypted HTTP request', scenario === 'waf-block' ? 'blocked' : 'request'),
            e('waf-route', 'waf', 'route', 'Permitted request'),
            e('route-rules', 'route', 'rules', 'Associated route rules'),
            e('rules-cache', 'rules', 'cache', 'Resulting cache configuration'),
            e('cache-selection', 'cache', 'selection', 'Origin needed'),
            e('select-connect', 'selection', 'origin-tls', 'Chosen eligible origin'),
            e('public-origin', 'origin-tls', 'origin', 'Origin HTTPS request'),
            e('public-return', 'origin', 'origin-tls', 'Origin HTTPS response', 'response'),
            e('connect-pe', 'origin-tls', 'managed-pe', 'Approved private-origin path'),
            e('edge-pe', 'edge', 'managed-pe', 'Separate private-origin connection'),
            e('pe-pls', 'managed-pe', 'pls', 'Private Link connection'),
            e('pls-ilb', 'pls', 'ilb', 'Published internal frontend'),
            e('ilb-origin', 'ilb', 'origin', 'Load-balanced application request'),
            e('origin-ilb', 'origin', 'ilb', 'Application response', 'response'),
            e('ilb-pls', 'ilb', 'pls', 'Return via published service', 'response'),
            e('pls-pe', 'pls', 'managed-pe', 'Private return path', 'response'),
            e('pe-connect', 'managed-pe', 'origin-tls', 'Return to origin connection', 'response'),
            e('pe-edge', 'managed-pe', 'edge', 'Return to Front Door', 'response'),
            e('connection-tls', 'origin-tls', 'tls', 'Response over separate client leg', 'response'),
            e('waf-tls', 'waf', 'tls', 'Configured block response', 'response'),
            e('rules-tls', 'rules', 'tls', 'Redirect response', 'response'),
            e('cache-tls', 'cache', 'tls', 'Fresh cached response', 'response'),
            e('tls-client', 'tls', 'client', 'HTTPS response to the browser', 'response')
        ];
        const detailed = [
            s('dns', 'Find the serving edge', dnsCopy, ['dns-query', 'dns-answer']),
            s('tls', 'Establish client-side HTTPS', 'The browser establishes TLS at the selected edge with the configured certificate. Front Door can then read HTTP headers and match the request to its configured domain/profile.', ['client-tls']),
            s('waf', 'Evaluate WAF before routing rules', wafCopy, ['tls-waf'],
                q('Can WAF inspect encrypted HTTPS before TLS termination?', ['Yes, WAF does not need the HTTP request', 'No, the client TLS connection must be terminated first'], 1, 'For HTTPS, Front Door terminates TLS before inspecting the HTTP request. WAF is inside the edge service, not an appliance in front of it.'))
        ];
        if (scenario !== 'waf-block') detailed.push(
            s('route', 'Match the configured route', 'Match domain, protocol and path to a route. The route specifies an origin group, not necessarily one fixed origin.', ['waf-route']),
            s('rules', 'Apply the associated rules', scenario === 'redirect'
                ? 'The configured redirect returns a Location to the browser. A redirect does not forward this request to the origin.'
                : 'Apply associated rules in configured order. They can modify allowed headers, rewrite the URL or override origin-group and cache configuration. Response-header actions apply on the response leg.', ['route-rules'])
        );
        if (!['waf-block', 'redirect'].includes(scenario)) detailed.push(
            s('cache', 'Can a cached response satisfy this request?', cacheCopy, ['rules-cache'],
                q('A fresh response for the same eligible cache key exists. Is an origin request needed for that hit?', ['Yes, every hit is verified at the origin', 'No, the fresh response can be returned by the cache'], 1, 'A usable fresh cache hit can end the request at the edge. Eligibility, the key and freshness all matter.'))
        );
        if (!early) {
            detailed.push(s('health', 'Check origin health', healthCopy, ['cache-selection']));
            if (scenario !== 'all-unhealthy') detailed.push(
                s('priority', 'Keep the highest-priority healthy candidates', 'The lowest numeric priority wins among healthy candidates. A healthy secondary is used when higher-priority origins are unavailable.', ['selection']),
                s('latency', 'Apply the latency-sensitivity range', 'Retain candidates within the configured latency range measured from this Front Door environment. This is not simply physical distance.', ['selection']),
                s('weight', 'Distribute among the remaining candidates', 'Weights distribute traffic among the surviving candidates. Small samples need not match exact ratios. Existing session affinity can keep a session on its eligible origin.', ['selection'])
            );
            detailed.push(
                s('origin-connect', 'Make a separate origin connection', privateOrigin
                    ? 'Premium uses an approved AFD-managed private endpoint, Private Link Service and internal load balancer for this VM origin. Configure origin HTTPS and validate the origin certificate. Do not mix public and private origins in one origin group.'
                    : 'Front Door uses a separate origin connection. This example uses HTTPS with certificate validation. Restrict the public origin by the Front Door network source and your X-Azure-FDID profile ID; the header alone is not trustworthy.', privateOrigin
                    ? ['select-connect', 'connect-pe', 'pe-pls', 'pls-ilb', 'ilb-origin']
                    : ['select-connect', 'public-origin']),
                s('origin-response', 'Receive the origin result', scenario === 'all-unhealthy'
                    ? 'This fallback attempt can still fail or return an error. Do not read the response arrow as a guaranteed 200 OK.'
                    : scenario === 'uncacheable'
                        ? 'Return the private response without storing it in a shared cache. The application and cache configuration must agree.'
                        : 'The origin returns a response. Only an eligible response may populate or refresh the cache; a miss does not guarantee a cache fill.', privateOrigin
                    ? ['origin-ilb', 'ilb-pls', 'pls-pe', 'pe-connect']
                    : ['public-return'])
            );
        }
        detailed.push(s('client-response', 'Return on the client connection', early
            ? 'Front Door returns the cached, redirected or blocked response on the existing client TLS connection. No origin was contacted for this branch.'
            : 'Front Door returns the result on the separate client TLS connection, applying configured response-header actions. Client-to-edge and edge-to-origin TLS are not one continuous encrypted tunnel.',
        [scenario === 'waf-block' ? 'waf-tls' : scenario === 'redirect' ? 'rules-tls' : scenario === 'hit' ? 'cache-tls' : 'connection-tls', 'tls-client']));

        const simple = [
            s('dns', 'Find the edge address', 'Your device asks a name resolver for the application address. It receives an address for a Front Door edge location. This finds where to connect; it does not download the page.', ['dns-query', 'dns-answer']),
            s('edge', 'Connect securely; apply the checks', `Front Door opens the secure HTTPS connection (TLS termination) before the web application firewall (WAF) inspects the request. ${scenario === 'waf-block'
                ? 'The configured security rule blocks this request here.'
                : scenario === 'waf-detect' ? 'This rule is in observation mode: the match is logged, but it does not block the request.'
                    : 'This request passes the configured checks and can continue.'}`, ['client-edge'], detailed[2].predict)
        ];
        if (!['waf-block', 'redirect'].includes(scenario)) simple.push(s('cache', 'Use a safe copy or ask an origin', cacheCopy, ['edge']));
        if (scenario === 'redirect') simple.push(s('redirect', 'Return the configured redirect', 'The rule tells the browser a new location. This request does not continue to an origin.', ['edge']));
        if (!early) simple.push(
            s('origin-connect', 'Contact an eligible origin', `${scenario === 'all-unhealthy'
                ? 'When every application server fails health checks, Front Door tries the origins in turn. Requests can still fail.'
                : scenario === 'origin-failure' ? 'Health checks have detected the failed primary. Front Door can use a healthy secondary instead; detection is not instant.'
                    : 'Front Door chooses an available application server using the configured health and routing rules.'} ${privateOrigin
                ? 'For this Premium private VM origin: AFD-managed private endpoint -> Private Link Service -> internal load balancer -> application. Approval is required; do not mix public and private origins in one origin group.'
                : 'Front Door makes a separate HTTPS request to the restricted public origin.'}`,
            privateOrigin ? ['edge-pe', 'pe-pls', 'pls-ilb', 'ilb-origin'] : ['edge-origin']),
            s('origin-response', 'The origin replies to Front Door', scenario === 'uncacheable'
                ? 'The private response is not stored in the shared cache.'
                : 'The result returns to Front Door. It may be an error; only cacheable responses can fill the cache.',
            privateOrigin ? ['origin-ilb', 'ilb-pls', 'pls-pe', 'pe-edge'] : ['origin-edge'])
        );
        simple.push(s('client-response', 'Front Door replies to you', early
            ? 'The edge answers without an origin request for this cache-hit, redirect or block branch.'
            : 'Front Door returns the result on your client connection. Your browser did not connect directly to the origin.', ['edge-client']));
        return {
            nodes, edges, steps: detailed, simpleSteps: simple,
            retainNodes: basic
                ? ['client', 'dns', 'edge', 'origin', ...(privateOrigin ? ['managed-pe', 'pls', 'ilb'] : [])]
                : ['client', 'dns', 'tls', 'waf', 'route', 'rules', 'cache', 'selection', 'origin-tls', 'origin', ...(privateOrigin ? ['managed-pe', 'pls', 'ilb'] : [])],
            groups: [
                { id: 'edge', label: 'Selected Front Door edge / distributed service' },
                { id: 'connection', label: 'Origin-side connection / not the client TLS session' },
                { id: 'managed', label: 'AFD-managed private network' },
                { id: 'vnet', label: 'Origin VNet / Private Link Service + internal LB' },
                { id: 'origin', label: privateOrigin ? 'Origin VNet / application' : 'Public origin / access restricted' }
            ]
        };
    };

    const base = {
        summary: 'Follow one HTTPS request from name lookup to its response. Change one condition and explain why the path changes.',
        takeaway: 'Many requests end at the edge. Those that reach an origin use a separate connection.',
        caveat: 'A conceptual request-processing map, not a physical appliance chain or a live Azure simulator. WAF and built-in edge DDoS protection are part of Front Door. Private connectivity is not content inspection. Timing, caching and failover depend on configuration.',
        sources: ['afd', 'acceleration', 'origins', 'probes', 'cache', 'rules', 'waf', 'secure', 'private'],
        defaults: { tier: 'premium', connection: 'public' },
        controls, scenarios, build: requestGraph
    };
    DiagramCatalog.register({ ...base, id: 'afd-request', title: 'Life of an Azure Front Door request' });
    DiagramCatalog.register({
        ...base, id: 'frontdoor-routing', title: 'Front Door: edge selection is not origin selection',
        scenarios: scenarios.filter(item => ['miss', 'origin-failure', 'all-unhealthy'].includes(item.id))
    });
    DiagramCatalog.register({
        ...base, id: 'frontdoor-rules-engine', title: 'Rule Sets: transform, redirect or continue',
        scenarios: scenarios.filter(item => ['miss', 'redirect', 'waf-block'].includes(item.id)),
        takeaway: 'WAF decides whether a request may continue before the route and Rule Set. A redirect is a response, not an origin hop.'
    });
    DiagramCatalog.register({
        ...base, id: 'frontdoor-caching', title: 'Cache: a key, a safe response and a freshness decision',
        scenarios: scenarios.filter(item => ['miss', 'hit', 'expired', 'uncacheable'].includes(item.id)),
        takeaway: 'A cache hit is conditional, not a promise that every response is safe to share or fast by a fixed number.'
    });
    DiagramCatalog.register({
        ...base, id: 'waf-inspection', title: 'WAF: a match is not always a block',
        scenarios: scenarios.filter(item => ['waf-detect', 'waf-block', 'miss'].includes(item.id)),
        sources: ['afd', 'waf', 'wafResponse', 'secure'],
        takeaway: 'Separate custom and managed rules, configured actions and policy mode. Exporting diagnostics is explicit configuration.'
    });

    DiagramCatalog.register({
        id: 'frontdoor-private-link', title: 'Private origins: name every connection boundary',
        summary: 'Premium creates a managed private endpoint. The origin owner must approve it before it can carry requests.',
        takeaway: 'Private Link is connectivity. Keep authentication, TLS and origin access restrictions deliberate.',
        caveat: 'Use supported origin types and regions. Do not mix public and private origins in one group. Private Link alone does not disable every public access path. The managed endpoint is not a VM in your workload subnet.',
        sources: ['private', 'appservice', 'secure'],
        defaults: { originKind: 'ilb' },
        controls: [{ id: 'originKind', label: 'Origin pattern', options: [{ id: 'ilb', label: 'VMs behind internal LB' }, { id: 'appservice', label: 'App Service' }] }],
        scenarios: [
            { id: 'approved', label: 'Private connection approved' },
            { id: 'pending', label: 'Approval still pending', summary: 'Configuration exists, but traffic cannot use an unapproved endpoint.' }
        ],
        build(settings) {
            const appservice = settings.originKind === 'appservice';
            const approved = settings.scenario === 'approved';
            const endpoint = appservice ? 'appservice' : 'pls';
            const nodes = [
                n('client', 'Browser', 'Public HTTPS entry', 0, 0),
                n('afd', 'Front Door Premium', 'Edge controls + origin HTTPS', 1, 0),
                n('managed-pe', 'AFD-managed endpoint', 'Private endpoint connection', 1, 1, 'managed'),
                n('pls', 'Private Link Service', 'Publishes the internal LB', 2, 1, 'origin'),
                n('ilb', 'Internal load balancer', 'Private frontend', 2, 2, 'origin'),
                n('vm', 'VM application', 'Backend behind the internal LB', 2, 3, 'origin'),
                n('appservice', 'App Service', 'Supported managed web app', 2, 1, 'paas')
            ];
            const edges = [
                e('client-afd', 'client', 'afd', 'Client HTTPS connection'),
                e('afd-pe', 'afd', 'managed-pe', 'Separate private-origin connection'),
                e('approved', endpoint, 'managed-pe', approved ? 'Origin owner approved connection' : 'Approval is pending', 'config'),
                e('private-link', 'managed-pe', endpoint, 'Approved Private Link path'),
                e('service-lb', 'pls', 'ilb', 'Published frontend'),
                e('lb-app', 'ilb', 'vm', 'Application request'),
                e('app-lb', 'vm', 'ilb', 'Application result', 'response'),
                e('lb-service', 'ilb', 'pls', 'Return to private service', 'response'),
                e('service-pe', endpoint, 'managed-pe', 'Private response', 'response'),
                e('pe-afd', 'managed-pe', 'afd', 'Return on origin connection', 'response'),
                e('afd-client', 'afd', 'client', 'Return on client connection', 'response')
            ];
            const steps = [
                s('client', 'The client still reaches the public edge', 'Private Link protects the origin-side path. It does not make the Front Door frontend private.', ['client-afd']),
                s('approval', 'Check the managed endpoint approval', approved
                    ? 'The origin owner approves the AFD-managed private endpoint. Configure the intended public-network-access restriction and origin HTTPS separately.'
                    : 'The origin owner has not approved this endpoint. Do not claim that an origin request can use it yet.', ['approved', 'afd', 'managed-pe'],
                q('Does enabling Private Link automatically remove every public origin access path?', ['Yes, no other setting matters', 'No, public access and approval must be checked explicitly'], 1, 'Approve the connection, restrict intended public access, and test both paths. Private connectivity is not a replacement for application authorization.'))
            ];
            if (approved) steps.push(
                s('origin', 'Follow the supported origin pattern', appservice
                    ? 'Premium connects through the managed endpoint to the supported App Service origin. Do not draw the App Service instance as a VM inside your subnet.'
                    : 'For an internal-load-balancer origin, the path includes the AFD-managed endpoint, Private Link Service, internal load balancer and backend VM.', appservice ? ['afd-pe', 'private-link'] : ['afd-pe', 'private-link', 'service-lb', 'lb-app']),
                s('return', 'Follow both response connections', 'The origin response returns over the private path to Front Door, then over the separate client connection.', appservice
                    ? ['service-pe', 'pe-afd', 'afd-client']
                    : ['app-lb', 'lb-service', 'service-pe', 'pe-afd', 'afd-client'])
            );
            return { nodes, edges, steps, groups: [
                { id: 'managed', label: 'AFD-managed private network' },
                { id: 'origin', label: 'Origin VNet / published application' },
                { id: 'paas', label: 'App Service / managed PaaS boundary' }
            ] };
        }
    });

    const capstone = DiagramCatalog.routedTopology('hub-spoke-capstone', 'Capstone: explain the complete application path');
    capstone.sources = ['afd', 'private', 'sql', 'routes', 'peering', 'firewall'];
    capstone.caveat = 'These are separate configured paths, not automatic transit. A Premium Private Link origin uses an AFD-managed endpoint and a Private Link Service for this internal-LB pattern. A restricted public-origin pattern instead uses network-source and profile-ID checks; a service tag is not a private tunnel.';
    capstone.scenarios.push({ id: 'private-origin', label: 'Premium private application and SQL', summary: 'Trace public entry, private origin connectivity and a SQL private endpoint.' });
    capstone.scenarios.push({ id: 'egress', label: 'Spoke outbound through Firewall', summary: 'An explicit route and firewall SNAT provide this illustrated outbound path.' });
    const original = { ...capstone };
    capstone.build = settings => {
        if (!['private-origin', 'egress'].includes(settings.scenario)) return original;
        if (settings.scenario === 'egress') return {
            ...original,
            nodes: [...original.nodes, n('internet', 'External service', 'Replies to translated address', 2, 2)],
            edges: [...original.edges,
                e('fw-internet', 'firewall', 'internet', 'Allowed firewall SNAT'),
                e('internet-fw', 'internet', 'firewall', 'Mapped return traffic', 'response')
            ],
            steps: [
                s('route', 'Route the spoke flow to the firewall', 'The applicable UDR selects the firewall as the next hop. More-specific routes still matter.', ['a-fw']),
                s('egress', 'Inspect and translate', 'An allowed outbound flow uses firewall SNAT in this example. A route entry alone would not provide translation.', ['fw-internet']),
                s('return', 'Map the reply back through the firewall', 'The response returns through the stateful mapping and the route to the initiating spoke.', ['internet-fw', 'fw-a'])
            ]
        };
        return {
            groups: [
                { id: 'edge', label: 'Front Door edge / Premium' },
                { id: 'managed', label: 'AFD-managed private network' },
                { id: 'web', label: 'Spoke A / private web origin' },
                { id: 'app', label: 'Spoke B / application + endpoint' },
                { id: 'hub', label: 'Hub / central inspection' },
                { id: 'paas', label: 'Azure SQL / managed service' }
            ],
            nodes: [
                n('client', 'Browser', 'DNS selects a PoP unicast IP', 0, 0),
                n('tls', 'TLS at Front Door', 'Client HTTPS terminates here', 1, 0, 'edge'),
                n('waf', 'WAF + routing', 'Allow this origin-bound request', 2, 0, 'edge'),
                n('managed-pe', 'AFD-managed endpoint', 'Approved private endpoint', 1, 1, 'managed'),
                n('pls', 'Private Link Service', 'Publishes internal LB frontend', 2, 1, 'web'),
                n('ilb', 'Internal load balancer', 'Private frontend', 2, 2, 'web'),
                n('spoke-a', 'Web VM', 'Private origin backend', 2, 3, 'web'),
                n('firewall', 'Azure Firewall', 'Routed spoke-to-spoke inspection', 0, 3, 'hub'),
                n('spoke-b', 'Application VM', 'Separate app connection', 1, 3, 'app'),
                n('sql-pe', 'SQL private endpoint', 'Private endpoint NIC in subnet', 1, 4, 'app'),
                n('sql', 'Azure SQL Database', 'Managed PaaS, outside the VNet', 2, 4, 'paas')
            ],
            edges: [
                e('client-tls', 'client', 'tls', 'Client HTTPS'),
                e('tls-waf', 'tls', 'waf', 'Decrypted request'),
                e('edge-pe', 'waf', 'managed-pe', 'Separate approved origin connection'),
                e('pe-pls', 'managed-pe', 'pls', 'Private Link'),
                e('pls-ilb', 'pls', 'ilb', 'Published frontend'),
                e('ilb-web', 'ilb', 'spoke-a', 'Private origin request'),
                e('web-fw', 'spoke-a', 'firewall', 'Explicit inspection route'),
                e('fw-app', 'firewall', 'spoke-b', 'Permitted app call'),
                e('app-pe', 'spoke-b', 'sql-pe', 'Private DNS resolves endpoint IP'),
                e('pe-sql', 'sql-pe', 'sql', 'Approved database connection'),
                e('sql-pe-return', 'sql', 'sql-pe', 'SQL response', 'response'),
                e('pe-app-return', 'sql-pe', 'spoke-b', 'Database result', 'response'),
                e('app-fw', 'spoke-b', 'firewall', 'Configured return route', 'response'),
                e('fw-web', 'firewall', 'spoke-a', 'Inspected return', 'response'),
                e('web-ilb', 'spoke-a', 'ilb', 'Origin response', 'response'),
                e('ilb-pls-return', 'ilb', 'pls', 'Private service return', 'response'),
                e('pls-pe-return', 'pls', 'managed-pe', 'Private Link return', 'response'),
                e('pe-tls-return', 'managed-pe', 'tls', 'Return to Front Door', 'response'),
                e('tls-client', 'tls', 'client', 'Separate client response', 'response')
            ],
            steps: [
                s('edge', 'Reach the edge, then evaluate HTTP', 'Standard/Premium DNS selects the serving PoP unicast IP. TLS precedes WAF, then route/rules/cache decide whether an origin is needed. This is an allowed cache miss.', ['client-tls', 'tls-waf']),
                s('private', 'Reach the private origin explicitly', 'The approved AFD-managed private endpoint connects through a Private Link Service to the internal load balancer and web VM. Origin HTTPS and access restrictions still matter.', ['edge-pe', 'pe-pls', 'pls-ilb', 'ilb-web']),
                s('app', 'Route the separate application call', 'Web calls App using configured UDRs, peerings, forwarding and firewall policy. Peering alone does not create the transit path.', ['web-fw', 'fw-app']),
                s('database', 'Use the SQL private endpoint', 'Private DNS resolves SQL to the endpoint NIC in the subnet. The Azure SQL managed service itself is outside the VNet; approval and SQL authorization are still required.', ['app-pe', 'pe-sql']),
                s('database-return', 'Return the database and app results', 'Responses follow the endpoint mapping and the intended stateful firewall return path.', ['sql-pe-return', 'pe-app-return', 'app-fw', 'fw-web']),
                s('client-return', 'Return to the original browser', 'The web response traverses the internal LB, Private Link Service and managed endpoint back to Front Door, then the separate client TLS connection.', ['web-ilb', 'ilb-pls-return', 'pls-pe-return', 'pe-tls-return', 'tls-client'])
            ]
        };
    };
    DiagramCatalog.register(capstone);
})();
