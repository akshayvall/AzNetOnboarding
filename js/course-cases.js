/* Fictional, read-only evidence. These examples never execute Azure commands. */
const CourseCases = {
    'net-fundamentals': {
        evidence: 'DNS: address returned\nTCP: established\nTLS: certificate name mismatch\nHTTP: request not sent',
        question: 'Which change addresses the first observed failure without weakening protection?',
        options: ['Correct the certificate/domain configuration and verify the chain', 'Disable certificate validation', 'Add a DNS record with the same existing answer'],
        correct: 0, explanation: 'The observed failure is TLS identity validation. Fix the name, certificate, or binding that is wrong; do not remove validation to hide the symptom.'
    },
    'azure-environment': {
        evidence: 'Application replicas: region A, zones 1 and 2\nDatabase: region A only\nRegion B: empty VNet\nRequirement: survive loss of region A',
        question: 'Which dependency prevents the proposed regional recovery?',
        options: ['The two zones have different names', 'The second region lacks a usable application and data path', 'The resource groups have different deployment dates'],
        correct: 1, explanation: 'Regional recovery needs the application, data, traffic steering, capacity, and operations in the recovery region. An empty VNet is not a standby application.'
    },
    'azure-ip-addressing': {
        evidence: 'NIC private allocation: Dynamic\nPrivate address: 10.20.1.10\nDNS A record: manually set to 10.20.1.10\nPlan: delete and recreate the NIC',
        question: 'What should the team plan for?',
        options: ['The old address is permanently reserved by the DNS record', 'The recreated NIC may receive a different address; verify addressing and DNS', 'Dynamic allocation changes the address on every TCP connection'],
        correct: 1, explanation: 'The address belongs to the resource allocation, not the DNS record. Recreating the interface can change it. Dynamic does not mean per-request randomization.'
    },
    'azure-vnets': {
        evidence: 'Application subnet: 10.20.1.0/26\nDatabase subnet: 10.20.1.64/26\nVNet system routing: present\nDatabase traffic rule: not configured',
        question: 'What does this subnet split establish by itself?',
        options: ['Separate address ranges, not a complete security policy', 'A default block of all application-to-database traffic', 'Public Internet access to the database'],
        correct: 0, explanation: 'Subnets organize address space. Routing and traffic controls must implement the intended conversations; a subnet name or boundary alone is not isolation.'
    },
    'nsgs': {
        evidence: 'New flow: TCP client -> VM:443\nSubnet NSG priority 200: Allow TCP 443\nNIC NSG priority 100: Deny TCP 443\nExisting established flows are a separate observation',
        question: 'Which conclusion fits this new flow?',
        options: ['Priority 200 is evaluated after 100 across one combined NSG list', 'The subnet allow makes the NIC rules irrelevant', 'The applicable NIC deny blocks it despite the subnet allow'],
        correct: 2, explanation: 'Each applicable NSG evaluates its own rules. Both must permit the new flow. Do not confuse a new-flow result with stateful handling of an established connection.'
    },
    'azure-dns': {
        evidence: 'Record changed from address A to B at 10:00\nResolver 1 cached A at 09:58 with TTL 300 seconds\nResolver 2 has no cached answer\nObservation time: 10:01',
        question: 'Why can the resolvers return different answers?',
        options: ['Resolver 1 can still use its unexpired cached A answer', 'Azure DNS must be serving two different application pages', 'Every DNS change invalidates every resolver immediately'],
        correct: 0, explanation: 'The earlier answer has remaining cache lifetime. TTL and cache history explain different answers without proving a DNS-service fault or application failure.'
    },
    'load-balancing-overview': {
        evidence: 'Service A: selects a regional endpoint in a DNS answer\nService B: receives HTTP, evaluates the path, then contacts a backend\nBoth can influence which application instance gets work',
        question: 'Which distinction matters when investigating HTTP headers?',
        options: ['Both services necessarily rewrite headers', 'The HTTP proxy can inspect the request; DNS-based selection does not carry it', 'DNS-based selection terminates the browser TLS session'],
        correct: 1, explanation: 'Traffic Manager makes a DNS steering decision. Front Door or Application Gateway is in the HTTP conversation and can apply supported request-level behavior.'
    },
    'frontdoor-basics': {
        evidence: 'Origin A: enabled, unhealthy, priority 1\nOrigin B: enabled, healthy, priority 2\nObservation: probe results already reflect A failure',
        question: 'Which origin is eligible under normal health-based selection?',
        options: ['A because priority always overrides health', 'Both must receive equal traffic', 'B; the unhealthy A is excluded in this scenario'],
        correct: 2, explanation: 'Normal selection considers enabled, healthy origins before priority and the other routing criteria. If all enabled origins are unhealthy, the documented fallback is different.'
    },
    'peering-endpoints': {
        evidence: 'Private endpoint address: 10.30.2.5\nClient DNS answer for the service name: public address\nApplication access succeeds\nClaim: success proves the private endpoint was used',
        question: 'What should you challenge?',
        options: ['Success alone does not prove the private path; inspect resolution and the actual connection', 'Private endpoints never need DNS', 'Any public DNS answer is automatically rewritten by peering'],
        correct: 0, explanation: 'A working request can take the unintended public path. Verify the client resolution path, destination address, routing, and access policy together.'
    },
    'route-tables-udr': {
        evidence: 'Request: spoke A -> stateful firewall -> spoke B\nResponse effective route: spoke B -> spoke A directly\nNSGs: allow the intended ports\nObserved: connection is unreliable',
        question: 'Which design issue should you investigate?',
        options: ['DNS TTL is always the cause of asymmetric paths', 'The response bypasses stateful inspection; verify symmetric forwarding', 'An NSG allow guarantees the firewall sees both directions'],
        correct: 1, explanation: 'Stateful inspection depends on seeing the relevant connection traffic. Trace effective routes and next-hop forwarding in both directions before changing policy.'
    },
    'nat-gateway': {
        evidence: 'Many short-lived outbound connections to the same destination\nNew connection failures increase during bursts\nExisting connections often continue\nApplication creates a new connection for every operation',
        question: 'Which investigation is better than assuming that NAT capacity is unlimited?',
        options: ['Expose inbound VM ports', 'Assume the public address changes per operation', 'Inspect SNAT/connection metrics and connection reuse, then size against supported limits'],
        correct: 2, explanation: 'Translation resources are finite. Correlate bursts and platform metrics, review connection pooling and destination patterns, and verify current service limits before sizing.'
    },
    'vpn-connectivity': {
        evidence: 'Connectivity: ExpressRoute private peering\nApplication transport: plain HTTP\nRequirement: encrypt sensitive application data in transit',
        question: 'Does the private circuit alone satisfy application encryption?',
        options: ['No; use an appropriate encryption design such as TLS for the application', 'Yes; private routing is the same as TLS', 'Yes; BGP encrypts the application payload'],
        correct: 0, explanation: 'Private connectivity and encryption are different properties. ExpressRoute alone is not proof that the application payload is encrypted.'
    },
    'azure-bastion': {
        evidence: 'Requirement: browser-based administration\nTarget VM: private IP only\nBastion page opens successfully\nRDP session to target fails',
        question: 'What does opening the Bastion page leave unproven?',
        options: ['Whether the browser has any network connection', 'Whether Bastion can reach and authenticate to the target VM service', 'Whether the VM must have a public IP'],
        correct: 1, explanation: 'The browser-to-Bastion and Bastion-to-target legs are separate. Verify target service, routes, permitted traffic, credentials, and supported configuration.'
    },
    'frontdoor-advanced': {
        evidence: 'Front Door Premium -> approved Private Link -> origin\nPublic origin endpoint: still allows arbitrary callers\nWAF: enabled on Front Door\nClaim: every origin request now passes WAF',
        question: 'Which boundary remains open?',
        options: ['The browser can no longer use HTTPS', 'Private Link disables all other origin ingress automatically', 'Direct public origin access can bypass the Front Door WAF path'],
        correct: 2, explanation: 'Private Link creates a private connection; it does not automatically prove other ingress is closed. Restrict or disable the unwanted public path and verify bypass is prevented.'
    },
    'frontdoor-caching': {
        evidence: 'Old URL: /assets/logo.png\nNew content deployed at the same URL\nSome serving caches still have a fresh old response\nPersonal account responses use a separate non-caching route',
        question: 'Which release plan best separates static versioning from private content?',
        options: ['Use versioned asset URLs and update references; purge specific old paths when needed', 'Cache every account response under /assets/logo.png', 'Assume an origin deploy instantly invalidates all edge copies'],
        correct: 0, explanation: 'Versioned names avoid accidental reuse of a fresh old object. Purge is a targeted operational action, not a replacement for safe cache keys and private-response policy.'
    },
    'frontdoor-waf': {
        evidence: 'New managed rule matches a legitimate checkout payload\nPrevention-mode block correlates with customer failure\nOther malicious requests are also blocked by the policy',
        question: 'Which response best preserves the security boundary?',
        options: ['Disable the whole WAF policy permanently', 'Investigate the match, apply a narrow justified exclusion or tuning, and retest legitimate and malicious cases', 'Treat every rule match as a confirmed attack'],
        correct: 1, explanation: 'A false positive calls for scoped tuning supported by request evidence. Broadly disabling protection removes controls for unrelated malicious traffic.'
    },
    'azure-firewall': {
        evidence: 'Outbound dependency: HTTPS to api.supplier.example\nPolicy proposal: allow all destinations and all ports\nRequirement: only the named business dependency\nReturn path: through the same stateful firewall',
        question: 'Which policy direction is better justified?',
        options: ['Keep the broad rule because HTTPS is always safe', 'Use inbound DNAT for all outbound requests', 'Use a supported narrowly scoped application rule and verify DNS, routes, and logs'],
        correct: 2, explanation: 'A named outbound web dependency can fit application-layer policy. Scope it narrowly and verify the complete path; do not substitute unrestricted network access.'
    },
    'network-architecture': {
        evidence: 'Spokes share central firewall and DNS resolver\nFirewall path unavailable\nApplications still running\nProposed fix: bypass inspection permanently',
        question: 'What should the recovery design establish?',
        options: ['Supported resilience and a tested recovery path that preserves intended controls', 'That healthy VMs guarantee customer availability', 'That peering supplies automatic firewall failover'],
        correct: 0, explanation: 'Shared dependencies affect multiple spokes. Design and test their resilience and recovery; application health alone does not establish a working secure end-to-end path.'
    },
    'network-watcher': {
        evidence: 'IP flow verify: Allow for the tested tuple\nConnection test: failed at 11:04 UTC\nApplication owner: service may not be listening\nReport omits source, destination, and port',
        question: 'What should a useful diagnostic note add?',
        options: ['Only the VM display name', 'The exact tuple, time, tool scope, listener evidence, and remaining uncertainty', 'A claim that an Allow result proves the application is healthy'],
        correct: 1, explanation: 'Policy evaluation and live connectivity answer different questions. Record a reproducible scope and time, then correlate listener and path evidence.'
    },
    'az104-practice': {
        evidence: 'Hypothesis: one specific route sends checkout traffic to a dead next hop\nChange: correct that route only\nAfter change: one test succeeds\nNo peak-load or return-path evidence collected',
        question: 'What is justified?',
        options: ['All future failures are ruled out', 'Delete the rollback plan', 'The test supports the hypothesis, but broader affected-path and regression verification is still needed'],
        correct: 2, explanation: 'A targeted success is useful evidence, not proof of every condition. Verify the affected operation, return path, representative load, and rollback readiness.'
    },
    'capstone-hub-spoke': {
        evidence: 'Customer ingress: Front Door -> private web origin\nData path: web tier -> database private endpoint\nEgress: web tier -> firewall -> supplier\nManagement: operator -> Bastion -> private VM',
        question: 'What would make the design review convincing?',
        options: ['Evidence for each distinct conversation, including DNS, return paths, failure behavior, and bypass controls', 'One screenshot of all resources in a group', 'A successful cached-logo request only'],
        correct: 0, explanation: 'These are separate conversations with separate dependencies. A resource inventory or cache hit cannot prove the data, egress, management, and private ingress paths.'
    }
};
