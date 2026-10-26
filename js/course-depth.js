/* Additional lessons where the old three-unit shape omitted useful applied depth. */
const CourseDepth = {
    'net-fundamentals': {
        id: 'http-ports-and-transport', title: 'Read a connection: address, protocol, and port', minutes: 10,
        outcome: 'Describe a connection precisely enough to investigate the right traffic.',
        paragraphs: [
            'An IP address identifies a network destination. A transport protocol and port help identify the conversation and listening service at that destination. In the fictional HTTPS example below, the client uses a temporary source port and the server listens on TCP 443. Replies reverse those endpoints. Opening a destination port in a rule does not start a listener or make the application healthy.',
            'HTTP adds meaning above the transport: a method, host, path, headers, and response status. GET /logo.png and POST /checkout can behave differently at the same address and port. HTTP/3 uses QUIC over UDP, so do not translate every mention of HTTPS into a TCP-only assumption. When reporting a failure, capture the actual protocol and the failing operation.'
        ],
        example: { title: 'Same server, different questions', text: 'A static logo loads while checkout returns HTTP 500. The address can be reachable even though one business operation is failing.' },
        diagram: { type: 'tcp-handshake', scenario: 'connect' },
        visualTable: { caption: 'Fictional TCP HTTPS connection', columns: ['Direction', 'Source', 'Destination'],
            rows: [['Request', '192.0.2.10:51000', '203.0.113.20:443'], ['Reply', '203.0.113.20:443', '192.0.2.10:51000']], note: 'Documentation addresses, not live targets. NAT can alter addresses along the path.' },
        activity: { prompt: 'A rule permits TCP 443. What remains unproven?', options: ['That the application is listening and can serve the operation', 'That TCP has port numbers', 'That the rule exists'], correct: 0, explanation: 'A traffic rule is only one condition. Verify the listener, complete path, TLS, and application operation.' },
        checks: [
            { question: 'Which report best identifies the failing operation?', options: ['The Internet is broken', 'At a recorded time, this client requests POST /checkout over the observed HTTPS transport and receives 500', 'The resource icon is green'], correct: 1, explanation: 'A time, client, destination, protocol, operation, and result make evidence reproducible and distinguish application failure from basic reachability.' },
            { question: 'Does an NSG allow on TCP 443 permit QUIC traffic on UDP 443?', options: ['Yes; the port number alone is sufficient', 'No; protocol is part of the rule match', 'Only if the HTTP path is /logo.png'], correct: 1, explanation: 'TCP and UDP are different transport protocols. A rule matching one does not match the other simply because the destination port number is the same.' }
        ],
        teachBack: { prompt: 'Describe a request without confusing its IP address, port, and HTTP path.', example: 'The IP gets me to the destination, the transport and port identify the conversation, and HTTP describes the requested operation.' },
        takeaway: 'A useful report identifies the connection and the operation.'
    },
    'nsgs': {
        id: 'service-tags-and-asgs', title: 'Use names in traffic policy without losing scope', minutes: 10,
        outcome: 'Distinguish Microsoft-managed service tags from application security groups.',
        paragraphs: [
            'A service tag represents a Microsoft-managed group of IP address prefixes for a supported service or category. It reduces the need to maintain changing address lists yourself. A tag is not an application login, a hostname match, or a guarantee that every destination it represents should be trusted. Check the supported service, direction, and regional scope for the rule you need.',
            'An application security group (ASG) groups supported network interfaces so NSG rules can express application roles, such as web servers talking to database servers. The rule still needs direction, protocol, ports, priority, and the intended source and destination. Neither a tag nor an ASG creates a route or opens a service listener.'
        ],
        example: { title: 'Allow the web role, not an entire VNet', text: 'A database rule can target the intended application interfaces and database port rather than allowing every source in a broad address range.' },
        diagram: { type: 'nsg-filtering', scenario: 'allow' },
        visualTable: { caption: 'Two different abstractions', columns: ['Tool', 'What it represents', 'What you still decide'],
            rows: [['Service tag', 'Microsoft-maintained IP prefixes', 'Supported tag scope, direction, and ports'], ['ASG', 'Application-role grouping of interfaces', 'Membership and narrowly scoped NSG rules']], note: 'These simplify rule expression; they do not establish trust or connectivity by themselves.' },
        activity: { prompt: 'You want a rule to identify your own web-tier interfaces. Which abstraction fits?', options: ['An ASG', 'A DNS TTL', 'A cache key'], correct: 0, explanation: 'ASGs express application groupings in supported NSG configurations. Verify membership and traffic scope.' },
        checks: [
            { question: 'What does Microsoft maintain for a service tag?', options: ['Your application passwords', 'The represented address prefixes', 'Your complete end-to-end firewall policy'], correct: 1, explanation: 'The managed prefix set is the abstraction. You remain responsible for whether the tag and rule scope meet your access requirements.' },
            { question: 'An ASG-based rule allows the intended traffic. What else is needed?', options: ['Only an ASG display name', 'A working route, destination listener, and other applicable permissions', 'An automatic public IP for every member'], correct: 1, explanation: 'NSG permission is not a route or a running service. Confirm the other boundaries and both directions of communication.' }
        ],
        teachBack: { prompt: 'Explain why named groups make policy easier to maintain but do not make it automatically safe.', example: 'The names stand for address sets or interfaces. The rule still has to express the intended least-privilege conversation.' },
        takeaway: 'A convenient policy name still needs a precise scope.'
    },
    'azure-dns': {
        id: 'dns-records-and-forwarding', title: 'Read the record and the resolver path', minutes: 12,
        outcome: 'Choose the right DNS record and distinguish authoritative hosting from recursive resolution.',
        paragraphs: [
            'A public Azure DNS zone holds authoritative records, but creating the zone alone does not delegate your domain to it. Delegation at the parent points queries to the authoritative name servers. An A record contains an IPv4 address; AAAA contains IPv6; CNAME names another DNS name. A conventional CNAME cannot coexist with the required apex records; supported Azure DNS alias configurations have their own target rules.',
            'Private zones answer through the intended private resolution path. VNet links and resolver configuration matter; a public delegation does not publish a private zone. Hybrid clients can use Azure DNS Private Resolver and forwarding rules as part of the design. Forward the intended namespace and check both directions to avoid loops. Validate the answer from the actual client, not just the existence of a zone in the portal.'
        ],
        example: { title: 'A zone that nobody asks', text: 'The team creates a public zone with the right A record, but the registrar still delegates the domain to different name servers. The new record is not the answer clients normally receive.' },
        diagram: { type: 'dns-resolution', scenario: 'cold' },
        visualTable: { caption: 'Read the job of each record or path', columns: ['Item', 'Example', 'Job'],
            rows: [['A record', 'shop → 203.0.113.20', 'Return an IPv4 address'], ['CNAME', 'www → another DNS name', 'Alias one non-apex name to another name'], ['Delegation', 'Parent NS records', 'Identify authoritative name servers'], ['Conditional forwarding', 'Private namespace → chosen resolver', 'Send that lookup to the intended resolver']], note: 'Examples are fictional. DNS records do not carry the later application request.' },
        activity: { prompt: 'A public zone exists but the parent points elsewhere. What should you inspect first?', options: ['Domain delegation', 'The shop image compression setting', 'The subnet broadcast address'], correct: 0, explanation: 'Find which authority the real resolver path uses before editing unrelated network or application settings.' },
        checks: [
            { question: 'Which statement describes an A record?', options: ['It stores the page body', 'It associates a name with an IPv4 address', 'It enables a TCP listener'], correct: 1, explanation: 'An A record supplies addressing information. The browser still needs a working connection and application response.' },
            { question: 'How do you validate a private DNS design?', options: ['Only check that a zone resource exists', 'Resolve from the intended client and verify the resolver/forwarding path and answer', 'Publish private records through public delegation'], correct: 1, explanation: 'The client has to reach the intended resolver path. VNet links, forwarding, cached answers, and actual destination evidence matter.' }
        ],
        teachBack: { prompt: 'Explain the difference between hosting an answer and asking the right server for it.', example: 'The authoritative zone contains the record; delegation and recursive or forwarding paths determine how my client obtains that answer.' },
        takeaway: 'Validate DNS from the client through the actual resolver path.'
    },
    'frontdoor-basics': {
        id: 'profiles-endpoints-and-routes', title: 'Read a Front Door configuration as a request path', minutes: 12,
        outcome: 'Connect profiles, endpoints, domains, routes, origin groups, and origins.',
        paragraphs: [
            'For Front Door Standard/Premium, the profile is a management container. An endpoint provides an entry point. A custom domain gives your application its name. A route matches supported protocol, domain, and path patterns, then applies its configuration and selects an origin group. The group contains origins and routing/health settings. These are configuration relationships, not extra network appliances that each packet physically visits.',
            'Start with the actual request host, scheme, and path, then find the matching route and origin group. Review associated Rule Sets, caching, and security policy separately. Standard and Premium differ in supported capabilities; Classic is a different resource model and should not be mixed into a Standard/Premium procedure. Cost also has multiple drivers, including requests and data transfer: estimate from the intended traffic and the current pricing documentation, not a hard-coded lesson price.'
        ],
        example: { title: 'The right origin, the wrong route', text: 'The origin is healthy, but a new /images/* path is not associated with the intended custom domain and route. An origin-health check alone cannot validate route matching.' },
        diagram: { type: 'afd-request', scenario: 'miss' },
        visualTable: { caption: 'Configuration associations, not packet hops', columns: ['From', 'Association', 'To'],
            rows: [['Profile shop-edge', 'Contains', 'Endpoint shop-entry'], ['www.shop.example /images/logo.png', 'Matches the configured domain and path on', 'Route image-assets'], ['Route image-assets', 'Selects', 'Origin group static-assets'], ['Origin group static-assets', 'Contains', 'Origin images.example.net']], note: 'Fictional configuration: the domain is associated with this endpoint and route. The route selects a group; routing and health settings choose an eligible origin. These are management associations, not additional appliances.' },
        activity: { prompt: 'The backend is healthy but a new path fails. Which evidence is useful first?', options: ['The request host/path and effective route configuration', 'Only the resource-group name', 'Only the backend VM size'], correct: 0, explanation: 'Determine which route the actual request matches before concluding that backend health guarantees delivery.' },
        checks: [
            { question: 'Is a Front Door profile an extra appliance on the packet path?', options: ['Yes; it forwards packets before the endpoint', 'No; it is part of the resource management model', 'Only for cached responses'], correct: 1, explanation: 'Separate configuration hierarchy from runtime traffic. A profile organizes the deployment; the edge processes requests.' },
            { question: 'Which statement is safe for a deployment plan?', options: ['Every Classic setting maps identically to Standard/Premium', 'Verify tier capabilities, resource model, traffic assumptions, and current pricing', 'A successful health probe proves every route is correct'], correct: 1, explanation: 'A reliable plan verifies the chosen product model, supported features, and workload rather than assuming migration or cost equivalence.' }
        ],
        teachBack: { prompt: 'Walk from a request hostname and path to the selected application without turning resource containers into routers.', example: 'Find the endpoint/domain and matching route, evaluate associated behavior, then identify the eligible origin in the route’s group.' },
        takeaway: 'Read configuration in the order the request uses it.'
    },
    'frontdoor-advanced': {
        id: 'rule-order-and-overrides', title: 'Reason about ordered rules and overrides', minutes: 12,
        outcome: 'Predict a rule sequence and distinguish redirect, rewrite, and origin override.',
        paragraphs: [
            'A Rule Set associates ordered conditions and actions with routes. Multiple rules can affect one request unless evaluation is stopped as configured. Read conditions against the actual request, then apply actions in order. A URL redirect returns a response that asks the client to issue a new request. A rewrite changes the path sent onward without necessarily changing the address displayed by the browser.',
            'An origin-group override changes the backend selection for matching traffic; it does not prove the chosen backend is healthy or that the origin path is valid. Keep rule changes narrow and test matching and non-matching requests. When debugging an unexpected header, path, cache behavior, or origin, inspect all applicable rules rather than one rule in isolation.'
        ],
        example: { title: 'A narrower path rule follows a broad rule', text: 'Two rules match /images/logo.png. If processing continues, the later matching action can matter. Reviewing only the first match can give the wrong prediction.' },
        diagram: { type: 'frontdoor-rules-engine', scenario: 'redirect' },
        visualTable: { caption: 'Illustrative actions: identify the kind of change', columns: ['Action', 'Who sees the change?', 'What to verify'],
            rows: [['Redirect', 'Client receives a location and makes a new request', 'Status, Location, destination, and redirect loops'], ['Rewrite', 'Origin receives the rewritten path', 'Forwarded path and origin response'], ['Origin-group override', 'Front Door selects from the overridden group', 'Effective rule, group, health, and response']], note: 'Exact supported action combinations and evaluation settings must match the selected tier and configuration.' },
        activity: { prompt: 'The browser address stays the same, but the backend receives another path. Which action fits?', options: ['Rewrite', 'Redirect', 'DNS delegation'], correct: 0, explanation: 'A rewrite can change the forwarded path within the proxy conversation without instructing the browser to navigate.' },
        checks: [
            { question: 'Why inspect every applicable rule and processing setting?', options: ['Rule order never matters', 'Later matching actions may affect the outcome when processing continues', 'Every rule automatically changes DNS'], correct: 1, explanation: 'The effective configuration is the result of the applicable ordered processing, not merely the first rule you happened to inspect.' },
            { question: 'What is a good regression check for a narrow override?', options: ['Test only a matching request', 'Test matching and non-matching requests and verify the actual chosen backend', 'Assume backend health from the rule name'], correct: 1, explanation: 'A narrow change should affect its intended traffic without changing unrelated routes. Verify the effective selection and response.' }
        ],
        teachBack: { prompt: 'Explain how you would distinguish a redirect from a rewrite in evidence.', example: 'I would inspect the client response and subsequent request for a redirect, and compare the forwarded origin path for a rewrite.' },
        takeaway: 'Predict the whole applicable rule sequence, then verify the actual request.'
    },
    'frontdoor-caching': {
        id: 'cache-headers-and-compression', title: 'Separate freshness, sharing, and compression', minutes: 12,
        outcome: 'Read cache intent without confusing a smaller response with a safer shared response.',
        paragraphs: [
            'Cache-Control communicates response caching intent. A public static asset with an appropriate max-age can be eligible for shared reuse under the route’s configuration. In general HTTP semantics, no-store prohibits storage while no-cache requires validation before reuse. Front Door specifically treats private, no-cache, and no-store responses as uncacheable, even with a Rules Engine caching override. Review the route, rules, and response headers together; do not assume that all caches implement the same behavior.',
            'Compression reduces transferred bytes for supported content and requests; it does not make personalized responses safe to share, change who should receive an object, or automatically solve origin latency. Verify supported types and behavior with actual response headers and measurements. For a performance claim, separate cache hit rate, origin latency, response size, and user-observed latency instead of treating one as proof of all the others.'
        ],
        example: { title: 'A smaller wrong response is still wrong', text: 'Compressing an account response does not fix a cache key or route that lets one customer receive another customer’s content.' },
        diagram: { type: 'frontdoor-caching', scenario: 'uncacheable' },
        visualTable: { caption: 'Illustrative response intent', columns: ['Response', 'Policy to reason about', 'Independent question'],
            rows: [['Versioned public logo', 'public, max-age=3600 with an eligible route', 'Is the requested version and key correct?'], ['Personal account data', 'Non-caching route and appropriate no-store policy', 'Can any other layer store or expose it?'], ['Compressed text', 'Supported encoding and content type', 'Did transferred bytes and user latency improve?']], note: 'Do not copy these examples as a universal production policy. Evaluate the full cache configuration and privacy requirements.' },
        activity: { prompt: 'Does enabling compression make a personalized response safe for shared caching?', options: ['No; encoding and sharing policy solve different problems', 'Yes; compressed content is private', 'Only if the status is 200'], correct: 0, explanation: 'Compression is not access control and does not change the privacy of the representation.' },
        checks: [
            { question: 'Is no-cache equivalent to no-store?', options: ['Yes; neither allows storage', 'No; no-cache concerns validation before reuse, while no-store prohibits storage', 'Both mean cache forever'], correct: 1, explanation: 'These directives have different semantics. Verify the effective proxy configuration rather than inferring no storage from the words no-cache.' },
            { question: 'What supports a performance conclusion?', options: ['A smaller response alone proves every request is faster', 'Correlated cache, origin, payload, and user-latency evidence for the workload', 'The presence of a CDN product name'], correct: 1, explanation: 'A performance change can affect different parts of the request. Measure the actual workload and avoid attributing every improvement to one proxy metric.' }
        ],
        teachBack: { prompt: 'Explain why freshness, privacy, and compression need separate decisions.', example: 'Freshness governs reuse over time, privacy governs who may share a response, and compression changes its representation size.' },
        takeaway: 'Optimize only after defining which responses may be shared.'
    },
    'frontdoor-waf': {
        id: 'waf-rule-types-and-rate-limits', title: 'Choose a protection and interpret its evidence', minutes: 12,
        outcome: 'Distinguish custom rules, managed rules, rate limits, and policy mode.',
        paragraphs: [
            'Custom rules express application-specific conditions and actions, including supported rate-limit rules. Managed rule sets supply maintained protections for classes of HTTP attacks; capabilities and bot protection depend on the chosen Front Door tier. Neither a rule name nor a match count proves malicious intent. False positives must be investigated against the intended request.',
            'Policy mode and action determine enforcement. Detection is for observation rather than normal Prevention-mode blocking. Rate limiting is not authentication and should be designed against the documented counting and distribution behavior, not assumed to be one perfect global counter. Normal block responses and rate-limit block responses can differ; inspect the action and actual response rather than assuming every block is HTTP 429.'
        ],
        example: { title: 'A spike in matches is not a verdict', text: 'A newly released checkout field triggers a managed rule. Correlate samples and legitimate failures before changing enforcement; keep unrelated protections in place.' },
        diagram: { type: 'waf-inspection', scenario: 'waf-detect' },
        visualTable: { caption: 'Protection decisions to make explicitly', columns: ['Control', 'Purpose', 'Evidence to inspect'],
            rows: [['Custom rule', 'Application-specific match and action', 'Matched condition, priority, and action'], ['Managed rules', 'Maintained attack-pattern detection', 'Rule identifier and relevant request details'], ['Rate limit', 'Constrain matching request volume', 'Configuration, counting behavior, action, and response'], ['Detection / Prevention', 'Observation versus enforcement mode', 'Effective policy mode and correlated outcome']], note: 'This is a decision guide, not a guarantee of a particular response code or a universal quota.' },
        activity: { prompt: 'A match is logged in Detection mode. Is that log alone proof that the request was blocked?', options: ['No; inspect policy mode, action, and response evidence', 'Yes; every match blocks', 'Yes; all matches return 429'], correct: 0, explanation: 'A match and a block are different events. Correlate the actual configured behavior and response.' },
        checks: [
            { question: 'What is a safe interpretation of a managed-rule match?', options: ['It is evidence to investigate against the request and policy', 'It conclusively proves a malicious user', 'It means the origin received the request'], correct: 0, explanation: 'A detection is evidence, not an identity or intent verdict. It also does not by itself establish that origin forwarding happened.' },
            { question: 'What must a rate-limit design avoid assuming?', options: ['That rules have conditions', 'That its distributed counting behaves as one exact universal global counter', 'That actual responses can be inspected'], correct: 1, explanation: 'Use the documented enforcement semantics and measured behavior. Do not promise exact global accounting from an unverified rate-limit model.' }
        ],
        teachBack: { prompt: 'Describe the evidence you need before calling a WAF event a customer-impacting block.', example: 'I need the matching request, time, effective policy mode, action, and observed response, then the legitimate intent and impact.' },
        takeaway: 'A rule match, an enforced action, and customer impact are distinct claims.'
    },
    'network-watcher': {
        id: 'choose-time-series-evidence', title: 'Choose evidence that answers the time and scope', minutes: 12,
        outcome: 'Distinguish point-in-time policy tests, repeated connectivity checks, flow records, and packet capture.',
        paragraphs: [
            'A point-in-time diagnostic answers a scoped question. IP flow verify evaluates applicable security rules for a specified tuple; it does not send your business request and prove checkout succeeded. Connection Monitor can track supported connectivity over time, helping distinguish a persistent failure from an intermittent one. Record test endpoints and intervals so another person can interpret the result.',
            'VNet flow logs describe observed network flows, not a decrypted explanation of every application operation. Packet capture provides more detailed traffic evidence for supported scenarios but introduces data-handling and access considerations. Use the narrowest collection that can answer the question, avoid gathering unrelated payloads, and follow retention and authorization requirements. Correlate these sources with application and Front Door logs rather than treating them as interchangeable.'
        ],
        example: { title: 'The problem happened ten minutes ago', text: 'A successful connectivity test now does not disprove a timed failure earlier. Look for matching historical observations and the configuration in effect at the incident time.' },
        diagram: { type: 'nwatcher', scenario: 'allow' },
        visualTable: { caption: 'Choose evidence by question', columns: ['Question', 'Evidence candidate', 'Limit'],
            rows: [['Would these rules permit this flow?', 'IP flow verify', 'Not proof of application success'], ['Is connectivity intermittently failing?', 'Connection Monitor', 'Depends on configured endpoints and tests'], ['Which network flows were observed?', 'VNet flow logs', 'Not complete HTTP business meaning'], ['What packets were exchanged?', 'Scoped packet capture', 'Supported scope, sensitive data, and collection overhead']], note: 'Use current supported logging options; do not assume every tool sees every service or protocol.' },
        activity: { prompt: 'Which evidence better fits a recurring intermittent connection problem?', options: ['Repeated scoped observations correlated with the failure times', 'One successful test at an unrelated time', 'Only a screenshot of the resource list'], correct: 0, explanation: 'Match the time and scope of the reported failure. A single later success is not historical evidence.' },
        checks: [
            { question: 'Does a network flow record necessarily explain why checkout failed?', options: ['Yes; it contains the full business transaction', 'No; correlate network observations with application evidence', 'Yes; every encrypted payload is decoded'], correct: 1, explanation: 'Network flow metadata and application semantics answer different questions. Correlation is needed for an end-to-end explanation.' },
            { question: 'What should govern packet capture?', options: ['Capture all traffic indefinitely', 'The narrow question, supported scope, authorization, data sensitivity, and retention', 'Only available disk space'], correct: 1, explanation: 'Detailed traffic can contain sensitive data and carry operational costs. Scope and handle collection according to the investigation and applicable requirements.' }
        ],
        teachBack: { prompt: 'Explain why a point-in-time Allow result and an earlier customer timeout can both be true.', example: 'They can refer to different times, scopes, and questions. Policy permission also does not establish listener or application success.' },
        takeaway: 'Evidence is useful only when its question, scope, and time match.'
    }
};
