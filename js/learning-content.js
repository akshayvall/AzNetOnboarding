const LEARNING_CONTENT = Object.freeze({
    version: '2026-09-14',
    paths: [
        {
            id: 'afd-diagnosis',
            title: 'Diagnose an Azure Front Door request',
            description: 'Recommended foundations and request-path investigations, from DNS to origin evidence. Browse any module whenever a reference is useful; this order does not lock lessons or award prerequisite mastery.',
            moduleIds: [
                'net-fundamentals', 'azure-environment', 'azure-ip-addressing', 'azure-vnets',
                'nsgs', 'azure-dns', 'load-balancing-overview', 'frontdoor-basics',
                'route-tables-udr', 'frontdoor-advanced', 'frontdoor-waf', 'frontdoor-caching',
                'network-watcher'
            ]
        },
        {
            id: 'azure-networking',
            title: 'Design and diagnose Azure networks',
            description: 'Recommended prerequisite-aware route through addressing, private connectivity, hybrid routing, edge delivery, and the existing capstone. Reference access stays open; optional cloud work is never a prerequisite for the synthetic route.',
            moduleIds: [
                'net-fundamentals', 'azure-environment', 'azure-ip-addressing', 'azure-vnets',
                'nsgs', 'azure-dns', 'load-balancing-overview', 'frontdoor-basics',
                'route-tables-udr', 'peering-endpoints', 'azure-bastion', 'nat-gateway',
                'vpn-connectivity', 'network-architecture', 'azure-firewall',
                'frontdoor-advanced', 'frontdoor-waf', 'frontdoor-caching',
                'network-watcher', 'az104-practice', 'capstone-hub-spoke'
            ]
        }
    ],
    modules: {
        'net-fundamentals': {
            criticalQuestions: [3, 4, 7],
            workedExample: {
                title: 'Find the first failed boundary',
                scenario: 'Fieldbook Shop is fictional. A fresh HTTP/1.1 client at 203.0.113.10 requests https://shop.example.test/catalog/item-42?currency=AUD. These are synthetic observations, not destinations to contact. Assume no cached DNS, reused connection, proxy, or HTTP/3: DNS returns CNAME edge.example.test and A 192.0.2.80; the final response should contain item-42 and AUD 49.',
                steps: [
                    'Resolve the name before reasoning about packets. The CNAME identifies another name, not a redirect of the browser URL. NXDOMAIN at this stage means there is no destination address for this fresh attempt; changing an origin NSG cannot repair the missing DNS record.',
                    'Follow TCP from client port 51514 to edge port 443. SYN, SYN-ACK, ACK establish this connection. Repeated SYN without a reply suggests a transport or return-path problem; it does not prove which firewall dropped traffic.',
                    'Validate edge TLS for shop.example.test, including name, trust, and validity dates. Front Door terminates that TLS session and establishes a separate HTTPS connection to origin-au.example.test at the fictional public origin 198.51.100.20. A valid browser certificate does not prove valid origin TLS.',
                    'The baseline records WAF Allow, an uncached origin request, HTTP 200, and item-42/AUD 49. A changed fixture instead presents a certificate for old-shop.example.test: TCP still succeeds, but TLS fails before an HTTP request can be sent. An HTTP 403 would require different evidence because an HTTP component responded.'
                ],
                result: 'The successful trace contains two distinct TLS legs and a complete return path. The changed trace stops at client-to-edge certificate validation, which rules out cache selection as its immediate cause. Record the last successful boundary and the next discriminating observation; do not label every timeout a DNS failure.'
            },
            prediction: {
                prompt: 'For a fresh HTTP/1.1 request to shop.example.test, DNS returns 192.0.2.80 and TCP/443 connects, but the trusted certificate covers only old-shop.example.test. What outcome should a normal validating client report?',
                options: ['HTTP 200 because opening port 443 also validates the certificate.', 'TLS hostname validation fails before HTTP can be sent.', 'An origin WAF block because DNS selected the wrong cache entry.'],
                correct: 1,
                explanation: 'Transport reachability is already established, but the requested hostname is outside the certificate names. The client rejects TLS before sending this HTTP request. No WAF or cache conclusion follows from that certificate error; the two origin-facing legs have not been tested.'
            },
            transfer: {
                prompt: 'Extend the existing request-path teachback with two unseen fixtures: an expired but correctly named edge certificate, and a separate HTTP 403 after valid TLS. Decide which boundaries have been crossed and what evidence is still needed to locate the 403.',
                checks: ['Record DNS, TCP, TLS, and HTTP outcomes in a two-row trace with the last successful boundary.', 'Show that the expired-certificate case sends no HTTP request under the stated fresh HTTP/1.1 assumptions.', 'Compare a WAF action record with an origin status record for the 403; explicitly leave its source unresolved without correlation evidence.']
            },
            exemplar: {
                artifact: 'Illustrative request-path teachback',
                sample: 'FICTIONAL trace: DNS=A 192.0.2.80; TCP=connected; SNI=shop.example.test; certificate=old-shop.example.test; HTTP=not sent. Conclusion: fix the certificate/name relationship before investigating cache. Limitations: a synthetic transcript, not a packet capture or a test of origin connectivity; HTTP/3 and connection reuse are outside this case.',
                scores: [3, 2, 3, 3],
                rationale: 'Correctness 3: distinguishes the transport and TLS boundaries and both TLS legs. Evidence 2: cites concrete fixture fields but no independently observed trace. Judgment 3: avoids changing unrelated origin controls and names protocol assumptions. Communication 3: explains the next check clearly; a full return-path diagram would strengthen it.'
            },
            lab: {
                mode: 'artifact',
                environment: 'Subscription-free analysis in VS Code or a text editor. Shell: PowerShell 7 optional for local notes only. Dependencies: none; use the embedded synthetic DNS/TCP/TLS transcript without sending network traffic.',
                expected: 'A boundary table predicts HTTP 200 for the baseline and no HTTP request for the wrong-name certificate, with distinct client-edge and edge-origin TLS legs.',
                failure: 'A note that calls the certificate error an NSG or cache failure contradicts the successful TCP connection and the absence of HTTP in the changed transcript.',
                verify: ['Annotate the address, port, hostname, and certificate check at each boundary.', 'Compare the two traces and identify the earliest differing observation.', 'Explain why a 403 needs correlated HTTP evidence and cannot come from this failed client TLS exchange.'],
                cleanup: ['Local: keep only the chosen synthetic evidence note, then remove disposable scratch copies.', 'Optional Azure work, only after separate approval: stop test requests before removing owned routes and origins, then remove dedicated diagnostics and disposable resources.', 'Verify scratch copies are absent; for an approved cloud run, confirm the owned resource inventory is empty and inspect retained logs separately.'],
                cost: 'Local route: $0 and no subscription. Optional Azure execution requires separate approval and a region/SKU estimate for Front Door plus origins; plan a 60-minute exercise, with billing until actual deletion and any retained storage removed. A stopped VM does not remove disks or edge charges.',
                safety: 'Synthetic .test names and TEST-NET addresses only; never contact these placeholders or include workplace/customer data or credentials. Cloud steps are not executed. Source review 2026-09-14: https://learn.microsoft.com/azure/frontdoor/secure-front-door',
                status: 'source-reviewed'
            }
        },
        'azure-environment': {
            criticalQuestions: [1, 2, 5],
            workedExample: {
                title: 'A failed change is not a failed request',
                scenario: 'The fictional shop.example.test request still returns HTTP 200 from its existing Front Door route. A synthetic change record says AuthorizationFailed for a route update. The learner has Contributor on rg-shop-au, which contains a regional origin, but only Reader on rg-shop-edge, which contains the global Front Door profile. No real account or subscription is involved.',
                steps: [
                    'Separate the data plane, which serves the browser request, from the control plane, which changes the route. A successful customer-style request demonstrates neither permission to update the profile nor permission to read another resource group.',
                    'Evaluate the requested action at its target scope. Contributor on the origin resource group does not extend sideways into the edge resource group. Reader can inspect the edge configuration but cannot write the route, so the existing route remains in effect.',
                    'Compare the authorization failure with two other fixtures: RequestDisallowedByPolicy and a regional capacity rejection. The former needs a policy-compliant design; the latter needs a quota/capacity review. Assigning a broader role is not a universal correction and can create unnecessary write authority.',
                    'Place the two origins in Australia East and Australia Southeast in the design. The resource group metadata location does not move either origin. Front Door is global, but origin availability, zone support, shared DNS, and application data still have their own failure domains.'
                ],
                result: 'The supported conclusion is a denied management action, not an edge outage. Request an approved, narrowly scoped change path and retain the current serving route. The review distinguishes permissions, policy, and capacity and records where each component actually runs instead of treating the resource group as a regional availability boundary.'
            },
            prediction: {
                prompt: 'A fictional operator can modify the origin resource group but has only Reader on the Front Door resource group. Existing shop traffic returns 200. What happens when that operator submits a route change at the edge scope?',
                options: ['The route update is denied; requests keep using the existing route.', 'The route changes because Contributor anywhere in a subscription is sufficient.', 'All existing requests stop because read-only management access disables the data plane.'],
                correct: 0,
                explanation: 'Role assignments apply at their assigned scope and descendants, not to sibling resource groups. Reader cannot perform the write. That control-plane rejection does not by itself disable an already provisioned route or prove that its data-plane dependencies are healthy.'
            },
            transfer: {
                prompt: 'The next synthetic change has the correct write permission but returns RequestDisallowedByPolicy when proposing a public origin address. Add a permitted private-origin alternative and identify what must be checked before calling it deployable.',
                checks: ['Produce an action/scope table that separates authorization from the policy denial.', 'Record the supported origin type, Front Door Premium requirement for Private Link, and regional/SKU availability questions without claiming deployment success.', 'Compare the failure domains of the public and private alternatives, with an approval owner and a rollback decision.']
            },
            exemplar: {
                artifact: 'Illustrative environment change review',
                sample: 'FICTIONAL decision record: edge route write denied at rg-shop-edge; origin Contributor scope is irrelevant to that action. Current request=200. Ask the edge change owner for least-privilege execution. Limitations: policy compliance and regional capacity have not been exercised, and the two origin regions still share an application data dependency.',
                scores: [3, 2, 3, 2],
                rationale: 'Correctness 3: separates resource scope and serving behavior. Evidence 2: the synthetic denial is specific but the policy and quota checks are absent. Judgment 3: avoids broad subscription permissions and identifies shared data risk. Communication 2: names a next action but needs a clearer owner/date and rollback boundary.'
            },
            lab: {
                mode: 'artifact',
                environment: 'Subscription-free change-record review in a text editor. Shell: PowerShell 7 optional for local notes. Dependencies: none; all scopes, roles, errors, and regions in the fixture are illustrative.',
                expected: 'A three-case decision table distinguishes authorization, policy, and capacity failures while preserving the observed HTTP 200 on the existing route.',
                failure: 'Granting subscription-wide Contributor for every failed deployment fails the scope exercise and does not resolve a policy or capacity restriction.',
                verify: ['Match each synthetic error to its control-plane decision and target scope.', 'Show why resource group location and workload region are different facts.', 'List the approved change owner and the evidence needed before any real deployment decision.'],
                cleanup: ['Local: retain the synthetic review, then remove scratch copies of the role matrix.', 'Optional Azure execution: after approval, revoke temporary scoped access after the authorized change or rollback, then remove only dedicated test resources and diagnostics.', 'Verify scratch material is absent; for a cloud run, confirm temporary assignments and owned inventory entries are removed, including separately retained logs.'],
                cost: 'Local route: $0. Optional Azure execution needs separate approval, an explicit region/SKU estimate, and a 60-minute review window; roles themselves are not the workload bill. Origins, edge resources, and retained log storage can continue billing until removed.',
                safety: 'Use synthetic scope names only; no real tenant IDs, workplace/customer data, or credentials. No permission changes or cloud operations were performed; optional execution is not executed. Source review 2026-09-14: https://learn.microsoft.com/azure/frontdoor/secure-front-door',
                status: 'source-reviewed'
            }
        },
        'azure-vnets': {
            criticalQuestions: [0, 1, 5],
            workedExample: {
                title: 'A permitted packet still needs an outbound path',
                scenario: 'Behind fictional shop.example.test, the regional origin forwards to an API VM at 10.20.1.4. The synthetic design uses VNet 10.20.0.0/16, web subnet 10.20.1.0/24, and data subnet 10.20.2.0/26. The public storefront responds, but a new VM cannot retrieve a public dependency at documentation address 203.0.113.200:443.',
                steps: [
                    'Check containment and overlap before adding services. Both subnets fit inside 10.20.0.0/16 and do not intersect. Keep 10.20.3.0/24 unallocated for growth. Subnets are address partitions, not automatic security barriers; the web-to-data path still needs explicit service access rules.',
                    'Read the fixture in order: DNS returns 203.0.113.200, outbound NSG permits TCP/443, the effective route has next hop Internet, and defaultOutboundAccess=false. There is no NAT Gateway, outbound load-balancer rule, instance public IP, or routed translating appliance. An allow rule alone supplies no public source translation.',
                    'Select explicit outbound connectivity for the design. With a NAT Gateway on the web subnet and this Internet route, the external fixture observes source 198.51.100.60 and the dependency succeeds. If a UDR sends the flow to a firewall, inspect that path instead; subnet NAT does not override the route.',
                    'Keep the lifecycle claim scoped: new VNets using API versions released after March 31, 2026 default to private subnets; existing VNets are not changed retroactively. For custom DNS at hub address 10.10.2.4, also require peering/routing, DNS permissions, and updated guest resolver configuration.'
                ],
                result: 'The failed dependency is explained by missing explicit egress under the stated route, not by the successful storefront or an assumed NSG denial. The completed design keeps growth space, records the intended translating resource, and tests private service traffic separately from internet-bound dependencies. No real VNet is created.'
            },
            prediction: {
                prompt: 'A new private subnet has a DNS answer, an Internet next hop, and NSG Allow for TCP/443, but no explicit outbound connectivity method. What should you predict for its VM calling the fictional public dependency?',
                options: ['It succeeds because an NSG allow rule allocates a public source IP.', 'It succeeds because private subnets prohibit inbound traffic only.', 'Public dependency access fails until an explicit outbound method is configured.'],
                correct: 2,
                explanation: 'A private subnet disables reliance on default outbound access. Routing and permission are necessary but do not provide the missing translation. This observation does not imply that all existing VNets changed; inspect the actual subnet setting and effective route.'
            },
            transfer: {
                prompt: 'The changed design adds a second spoke at 10.30.0.0/16 and central DNS at 10.10.2.4. One guest still uses retired resolver 10.20.0.10, although both VNets have the new DNS setting. Explain why only that guest fails and keep egress and DNS fixes separate.',
                checks: ['Draw both DNS paths and record the guest resolver address, VNet setting, and reachable hub next hop.', 'Show that a correct authoritative answer does not repair a guest still using an unreachable resolver; propose an approved guest configuration refresh.', 'Compare private database and public dependency flows with their NSG, route, and outbound method in an evidence table.']
            },
            exemplar: {
                artifact: 'Illustrative three-tier VNet review',
                sample: 'FICTIONAL design: 10.20.1.4 -> 203.0.113.200:443; DNS valid; NSG Allow; route Internet; private subnet; no explicit egress. Proposed NAT source=198.51.100.60. Reserve 10.20.3.0/24 for growth. Limitations: this is a synthetic path analysis, not a capacity test, and DNS reachability from the second spoke remains unproven.',
                scores: [3, 2, 3, 3],
                rationale: 'Correctness 3: distinguishes route, permission, and translation while preserving the API-scoped default. Evidence 2: uses a complete fixture but no live guest or packet observations. Judgment 3: reserves growth space and checks central DNS as a dependency. Communication 3: states the missing control and remaining uncertainty plainly.'
            },
            lab: {
                mode: 'artifact',
                environment: 'Subscription-free VNet and flow-matrix analysis. Shell: PowerShell 7 optional for local arithmetic or notes. Dependencies: none; inspect the embedded route and subnet settings without Azure sign-in.',
                expected: 'A nonoverlapping address diagram plus separate private and public flow rows, showing exactly which row lacks explicit egress and the proposed source address after translation.',
                failure: 'A diagram with NSG Allow but no translating outbound method still predicts failed public access; a VNet-level DNS setting alone cannot prove a guest uses it.',
                verify: ['Check all subnet boundaries against 10.20.0.0/16 and preserve the growth range.', 'Trace DNS, NSG, route, and translation for the failed dependency.', 'Contrast the new-private-subnet fixture with an unchanged existing VNet instead of making a blanket retirement claim.'],
                cleanup: ['Local: retain the synthetic address plan, then remove disposable calculation notes.', 'Optional Azure execution: after approval, stop test traffic, delete owned VMs and NICs, detach NAT and route associations, then remove dedicated gateways, subnets, and VNets in dependency order.', 'Verify scratch copies are absent; after cloud teardown confirm owned network inventory, public IPs, disks, and retained diagnostics separately.'],
                cost: 'Local route: $0. Optional Azure execution requires approval, a selected region and VM/NAT SKU estimate, and a 90-minute lifetime target; NAT, disks, public IPs, and retained logs can bill after a VM stops and until their own cleanup completes.',
                safety: 'Synthetic RFC1918 and TEST-NET addresses only; no real workplace/customer topology or credentials. Do not contact the placeholder dependency. Cloud operations are not executed. Source review 2026-09-14: https://learn.microsoft.com/azure/virtual-network/ip-services/default-outbound-access',
                status: 'source-reviewed'
            }
        },
        'azure-ip-addressing': {
            criticalQuestions: [2, 4],
            workedExample: {
                title: 'Count usable capacity before drawing the subnet',
                scenario: 'The fictional shop.example.test origin needs 30 API instances plus 15 simultaneous upgrade slots. Its synthetic address plan currently proposes 10.20.1.0/27. A separate inventory tier asks for 10.20.1.32/27. The design review must accommodate the 45 API addresses, Azure reservations, a future second region, and later peering.',
                steps: [
                    'Compute the size before accepting the CIDR label. A /27 has 32 IPv4 addresses, of which Azure reserves five, leaving 27. It cannot satisfy 45 concurrent assignments even though the steady-state instance count sounds close. A /26 has 64 total and 59 usable.',
                    'Allocate the API tier 10.20.1.0/26. Its first four addresses, .0 through .3, and last address .63 are reserved; the assignable interval is .4 through .62. The sample VM 10.20.1.4 is valid. Reservations are not a suggestion to configure .1 as a custom appliance.',
                    'Reject the proposed inventory block 10.20.1.32/27 because it lies inside the new API /26. Move inventory to 10.20.1.64/26, whose usable interval is .68 through .126. Different subnet names or resource groups cannot make overlapping addresses safe.',
                    'Reserve 10.30.0.0/16 for the other region and compare it with planned branch range 10.60.0.0/16. Record peak assignments and growth assumptions. Public-facing Standard IP and private addressing are separate decisions; an allocated public address is not proof that inbound traffic should be permitted.'
                ],
                result: 'The corrected plan supports 45 API assignments with 14 usable addresses left and a nonoverlapping inventory subnet. The rejected /27 and overlapping inventory proposal are explicit negative cases. This proves the address arithmetic for the stated scale, not service quotas, IPv6 compatibility, or the availability of a deployment SKU.'
            },
            prediction: {
                prompt: 'A changed shop worker tier requires 24 instance addresses and 3 concurrent upgrade addresses, with no other consumers in the subnet. Which smallest IPv4 subnet among these choices fits after Azure reserves five addresses?',
                options: ['/27, with 27 usable addresses and no remaining headroom.', '/28, with 16 usable addresses after reservations.', '/26, because a /27 always loses seven reserved addresses.'],
                correct: 0,
                explanation: 'The demand is 24 + 3 = 27. A /27 supplies 32 - 5 = 27 usable addresses, so it fits exactly. That mathematical fit has no growth margin; choosing a larger range can still be a sound design decision when the demand assumption is uncertain.'
            },
            transfer: {
                prompt: 'The unseen upgrade doubles peak demand to 70 addresses and a proposed regional VNet reuses 10.20.0.0/16. Revise the plan for future regional connectivity, explaining both the minimum subnet size and the overlap that names cannot solve.',
                checks: ['Calculate /26 capacity as 59 and /25 capacity as 123, with 53 free addresses at peak demand 70.', 'Show nonintersecting regional and subnet intervals, including first usable, last usable, and all five reservations.', 'Record the growth assumption and an IPv6/service-support review question rather than treating IPv4 arithmetic as proof of an entire deployment.']
            },
            exemplar: {
                artifact: 'Illustrative address allocation sheet',
                sample: 'FICTIONAL allocation: API 10.20.1.0/26, usable .4-.62, demand 45, spare 14; inventory 10.20.1.64/26, usable .68-.126. Reject inventory .32/27 as overlap. Limitations: numbers model peak IP assignments only; managed-service subnet requirements, IPv6, regional quotas, and future demand have not been validated.',
                scores: [4, 3, 2, 3],
                rationale: 'Correctness 4: the reservations, intervals, and subtraction are correct for these IPv4 subnets. Evidence 3: the calculation can be independently checked from the sheet. Judgment 2: growth and managed-service sizing remain unresolved. Communication 3: the rejection reason is clear but needs an explicit decision owner for the open capacity assumptions.'
            },
            lab: {
                mode: 'artifact',
                environment: 'Subscription-free address worksheet in a text editor or calculator. Shell: PowerShell 7 optional for integer arithmetic. Dependencies: none; no NIC or subnet is provisioned.',
                expected: 'The worksheet rejects /27 for demand 45, selects /26 with 59 usable addresses, and moves the overlapping inventory interval outside .0-.63.',
                failure: 'Counting only the network and broadcast reservations incorrectly yields 62 usable addresses; accepting .32/27 inside .0/26 creates an overlapping subnet plan.',
                verify: ['Calculate total minus five reservations for /28, /27, /26, and /25.', 'Compare inclusive subnet intervals rather than comparing display names.', 'Record peak demand and remaining headroom, and mark service-specific subnet restrictions as a separate check.'],
                cleanup: ['Local: preserve the synthetic worksheet, then remove disposable calculations.', 'Optional Azure execution: after separate approval, remove test consumers and NICs before deleting their subnet, then remove owned public IPs and the dedicated VNet.', 'Verify scratch copies are absent; for cloud validation confirm subnet consumers and the owned resource inventory are empty, including retained disks and logs.'],
                cost: 'Local route: $0. Optional Azure execution requires approval and a region/SKU estimate for any VM or public IP; use a 60-minute lifetime target. Address arithmetic is free locally, but retained disks, public IPs, and log storage are not made free by stopping a VM.',
                safety: 'Synthetic private ranges only; do not reuse workplace/customer address plans, resource identifiers, or credentials. Cloud allocation is not executed. Source review 2026-09-14: https://learn.microsoft.com/azure/virtual-network/virtual-networks-faq',
                status: 'source-reviewed'
            }
        },
        'nsgs': {
            criticalQuestions: [0, 3],
            workedExample: {
                title: 'Find the first matching rule at both scopes',
                scenario: 'For fictional shop.example.test, a regional reverse proxy at 10.20.0.5 opens TCP/443 to API VM 10.20.1.4. The synthetic subnet NSG has priority 100 Deny Any to TCP/443, then priority 200 Allow 10.20.0.0/24 to TCP/443. The NIC NSG allows the proxy subnet at priority 100. The proxy reports an upstream timeout.',
                steps: [
                    'Write the new-flow tuple: TCP, source 10.20.0.5:52000, destination 10.20.1.4:443, inbound at the API. Evaluate subnet rules in ascending priority number. The priority-100 deny matches, so the subnet rejects the packet before its priority-200 exception or the NIC allow can help.',
                    'Do not merge the two NSGs into one priority list. A NIC priority 100 does not outrank a subnet priority 200 globally. Both scopes must permit the flow, and inbound evaluation visits the subnet first. Outbound evaluation visits the NIC first.',
                    'In the corrected fixture, use priority 100 Allow 10.20.0.0/24 to this API on TCP/443 and priority 200 Deny Any to TCP/443 at the required scope. Keep the matching narrow NIC permission. A new connection from 10.20.0.5 succeeds; one from 10.20.9.5 remains denied.',
                    'Separate state from configuration. An established connection can survive a later NSG rule change because NSGs are stateful. Compare fresh connection tuples after propagation, not only a reused browser session. A timeout also has routing or guest-firewall hypotheses until the matching NSG evidence identifies this deny.'
                ],
                result: 'The baseline failure has a specific matching subnet rule, not a vague claim that the NIC is blocked. The revised matrix allows only the intended proxy source and includes a denied control source. It explains why a successful established session is insufficient evidence that a new restrictive rule is ineffective.'
            },
            prediction: {
                prompt: 'A fresh connection from 10.20.0.5 to 10.20.1.4:443 matches subnet priority 100 Deny Any and NIC priority 100 Allow Proxy. What happens before the application receives the request?',
                options: ['Allowed because a NIC rule is more specific than every subnet rule.', 'Allowed because both matching rules use the same priority number.', 'Denied by the subnet NSG before the NIC allow can admit the flow.'],
                correct: 2,
                explanation: 'Priorities are evaluated within each NSG. Inbound traffic must pass the subnet NSG and then the NIC NSG. The first matching subnet deny ends the evaluation; a different NSG cannot undo it, and the application receives no new connection from this attempt.'
            },
            transfer: {
                prompt: 'The unseen flow is outbound from API 10.20.1.4 to inventory 10.20.2.5:1433. The NIC allows it but the subnet denies it. An old pooled SQL connection still works. Diagnose both observations without widening the database rule to Any.',
                checks: ['Record the outbound NIC-then-subnet evaluation and the exact winning rule at each scope.', 'Compare a new TCP tuple with an established pooled connection and explain statefulness.', 'Produce a least-privilege source/destination/port matrix with one allowed control and one denied control.']
            },
            exemplar: {
                artifact: 'Illustrative NSG evidence matrix',
                sample: 'FICTIONAL new flow: 10.20.0.5:52000 -> 10.20.1.4:443/TCP. Subnet rule 100=deny; NIC evaluation not reached. Revised proxy-only rule admits .0.5, rejects .9.5. Limitations: synthetic rule evaluation is not a connectivity test, and guest firewall, application listener, and existing flow state require separate observations.',
                scores: [4, 3, 3, 3],
                rationale: 'Correctness 4: gets rule order, scope order, and statefulness right. Evidence 3: supplies checkable tuples and a negative control, but not observed packets. Judgment 3: preserves the source restriction and rejects broad bypasses. Communication 3: clearly identifies the first blocking rule while leaving downstream checks open.'
            },
            lab: {
                mode: 'artifact',
                environment: 'Subscription-free NSG decision worksheet. Shell: PowerShell 7 optional for local text handling. Dependencies: none; use the embedded tuples and rules as synthetic IP Flow Verify-style summaries, not real tool output.',
                expected: 'A table identifies subnet priority 100 as the original deny, shows the corrected proxy allow and control-source deny, and distinguishes new from established flows.',
                failure: 'Calling the NIC allow sufficient or using an old pooled session as the only check contradicts scope evaluation and NSG statefulness.',
                verify: ['Write protocol, source port, destination port, addresses, and direction before evaluating rules.', 'Evaluate subnet and NIC lists separately in the correct direction order.', 'Compare fresh allowed and denied control tuples; state that rule simulation does not test routing or a guest listener.'],
                cleanup: ['Local: retain the synthetic matrix, then discard scratch rule permutations.', 'Optional Azure execution: after approval, stop test sessions and restore the scoped original NSG rules before detaching and deleting only lab-owned NSGs and consumers.', 'Verify scratch rules are absent; for cloud cleanup confirm intended rules remain, owned resource inventory is empty, and test diagnostics or retained logs are accounted for.'],
                cost: 'Local route: $0. Optional Azure execution requires separate approval, a VM region/SKU estimate, and a 60-minute test window. NSG rules are not the entire bill: test VMs, public IPs, disks, and retained telemetry can continue charging until cleanup.',
                safety: 'Synthetic packet metadata only, with no workplace/customer traffic, payloads, or credentials. Never open management ports to Any as a diagnostic shortcut. Cloud checks are not executed. Source review 2026-09-14: https://learn.microsoft.com/azure/virtual-network/network-security-group-how-it-works',
                status: 'source-reviewed'
            }
        },
        'azure-dns': {
            criticalQuestions: [2, 4, 5],
            workedExample: {
                title: 'The same request depends on two DNS views',
                scenario: 'The synthetic public request to shop.example.test resolves through edge.example.test to 192.0.2.80. Its API VM 10.20.1.4 then asks for inventory.internal.example.test, which should resolve privately to 10.20.2.5. A fictional branch client 10.60.1.10 must resolve that private name too, using a reachable Private Resolver inbound endpoint at 10.10.2.4.',
                steps: [
                    'Keep public delegation separate from private resolution. The public CNAME helps the browser reach Front Door; it does not publish the private inventory zone. The working fixture links internal.example.test to the resolver VNet and provides a valid record for inventory.',
                    'Trace the branch query: its DNS server conditionally forwards internal.example.test to 10.10.2.4 over the existing hybrid path, with UDP and TCP port 53 permitted. The inbound endpoint receives that query and resolves the linked private zone. An outbound endpoint is for the opposite forwarding direction.',
                    'Compare failure fixtures. Without the conditional forwarder, the branch asks public DNS and receives NXDOMAIN for the private name. With forwarding configured but the hybrid route or DNS port blocked, the query times out. These are different failures; neither is established merely by a healthy Front Door response.',
                    'After private resolution succeeds, evaluate connection and service authorization separately. A Private Endpoint needs its correct service-specific DNS integration, normally a private DNS zone group, rather than VM auto-registration. A private answer also does not disable the service public endpoint; public-network-access policy is an independent control.'
                ],
                result: 'The completed resolution matrix gives the public browser the edge address and the API/approved branch the private inventory address. NXDOMAIN points to the selected resolution view, while a timeout points first to query delivery. Correct DNS narrows the investigation but does not prove that the database connection or public-access restriction works.'
            },
            prediction: {
                prompt: 'Public shop.example.test still resolves, but a branch DNS server loses its conditional forwarder for the private-only internal.example.test zone. Public DNS has no inventory record. What should the branch query return?',
                options: ['The private answer appears automatically because Front Door knows the origin.', 'NXDOMAIN from the public DNS view instead of the private inventory answer.', 'A valid SQL login response because DNS forwarding is only needed for browsers.'],
                correct: 1,
                explanation: 'The branch now queries a DNS view with no private inventory record. The public storefront and private zone are independent. A timeout would instead suggest an unreachable selected resolver or another delivery issue; record which server answered and its response code.'
            },
            transfer: {
                prompt: 'A new spoke can resolve inventory privately but cannot resolve shop.example.test. It is linked to an accidental private zone named example.test with no shop record; public clients still succeed. Explain the shadowed namespace and propose a bounded correction.',
                checks: ['Record authoritative zone, queried resolver, response code, answer, and TTL for internal and public viewpoints.', 'Show why adding a route cannot fix an authoritative negative answer from the wrong private zone.', 'Propose removing the unintended link or supplying a deliberately managed split view, then compare both names without changing unrelated public DNS.']
            },
            exemplar: {
                artifact: 'Illustrative hybrid DNS trace',
                sample: 'FICTIONAL branch trace: 10.60.1.10 -> branch DNS -> conditional internal.example.test forward -> 10.10.2.4 -> A 10.20.2.5. Without the forwarder: public NXDOMAIN. Limitations: fixture names are illustrative rather than Azure service suffixes; the trace does not establish database permissions, endpoint approval, or disabled public access.',
                scores: [3, 3, 2, 3],
                rationale: 'Correctness 3: distinguishes DNS views and inbound forwarding. Evidence 3: supplies a checkable resolver chain and contrasting response. Judgment 2: service policy and resolver redundancy remain unreviewed. Communication 3: explains the immediate failure without treating a DNS answer as end-to-end success.'
            },
            lab: {
                mode: 'artifact',
                environment: 'Subscription-free resolver-path worksheet. Shell: PowerShell 7 optional for local notes only. Dependencies: none; inspect synthetic query/answer rows rather than running DNS queries against placeholder names.',
                expected: 'A resolution matrix distinguishes public 192.0.2.80, private 10.20.2.5, public NXDOMAIN, and an unreachable-resolver timeout with the responsible DNS view.',
                failure: 'A design that sends branch queries directly to Azure platform address 168.63.129.16 or assumes peering publishes private DNS misses the resolver/forwarding dependency.',
                verify: ['Trace the conditional suffix to the inbound endpoint and its linked zone.', 'Compare NXDOMAIN and timeout evidence, including responding server and query transport.', 'List endpoint approval, service-specific zone integration, and public-network-access verification as separate from name resolution.'],
                cleanup: ['Local: preserve the synthetic query matrix, then delete disposable resolver sketches.', 'Optional Azure execution: after approval, restore test DNS/forwarding changes before deleting owned zone links, resolver endpoints/rulesets, and dedicated zones; remove clients before their VNet.', 'Verify scratch copies are absent; after cloud work confirm original DNS behavior and that owned resolver, zone, and telemetry inventory is removed or retained deliberately.'],
                cost: 'Local route: $0. Optional Azure execution requires separate approval, DNS/resolver region and tier estimates, and a 90-minute lifetime target. Resolver endpoints, queries, and retained logs/storage can accrue charges until their own teardown; no free-tier assumption is made.',
                safety: 'Synthetic DNS rows only; never disclose workplace/customer namespaces or credentials. Do not query the placeholders or modify a shared resolver. Cloud validation is not executed. Source review 2026-09-14: https://learn.microsoft.com/azure/dns/private-resolver-hybrid-dns',
                status: 'source-reviewed'
            }
        },
        'load-balancing-overview': {
            criticalQuestions: [0, 3],
            workedExample: {
                title: 'Choose the forwarding layer from the traffic',
                scenario: 'Fictional shop.example.test serves global HTTPS shoppers, requires edge WAF and cacheable product images, and has origins in two regions. The inventory application also has a private TCP/1433 connection that is not HTTP. A synthetic design proposes putting both protocols behind one Front Door endpoint because both need availability.',
                steps: [
                    'Start with protocol and scope, not the service list. Front Door can proxy global HTTP/HTTPS, apply edge web policy, and cache eligible responses. It is a fit for the public shop request, with independently protected HTTPS connections to regional origins.',
                    'Reject Front Door as a generic TCP proxy for the private database connection. A regional Standard Load Balancer can distribute TCP/UDP connections where the database architecture supports it; database replication, leader selection, and client reconnection remain application/service design questions.',
                    'Compare Traffic Manager carefully: it returns a DNS choice and does not inspect the subsequent request. Cached DNS answers and established connections affect failover observations. Application Gateway provides regional HTTP routing and WAF, but does not by itself supply a global edge cache.',
                    'In the working shop fixture, an unhealthy primary origin is excluded after probe evaluation and a healthy backup serves an uncached request. A cached image can still return 200 while the inventory dependency fails. Compare an uncached application result and origin evidence before declaring the whole design available.'
                ],
                result: 'The decision separates public global HTTPS delivery from private regional database traffic and records why the rejected options do not meet each requirement. The concrete outcome is a valid web entry path and a separately designed TCP path, not an unsupported all-protocol Front Door deployment or a claim that HTTP 200 proves database failover.'
            },
            prediction: {
                prompt: 'The fictional shop adds a non-HTTP TCP/1883 device stream and points clients at its existing Front Door endpoint without another ingress service. What should the design review predict?',
                options: ['The TCP/1883 stream will not be proxied by Front Door; it needs a TCP-capable entry path.', 'Front Door will cache the TCP stream after the first successful packet.', 'Enabling WAF managed rules converts the endpoint into a regional TCP load balancer.'],
                correct: 0,
                explanation: 'Front Door is an HTTP/HTTPS application delivery service, not a general TCP/UDP proxy. The new protocol requires a compatible entry path and separate availability design. Traffic Manager can make a DNS selection for suitable endpoints but cannot proxy or inspect that stream.'
            },
            transfer: {
                prompt: 'A new regional internal HTTP application requires path-based routing but no public entry or CDN. Compare it with the global shop and the private TCP inventory flow; choose only the services whose protocol and scope satisfy each requirement.',
                checks: ['Produce a three-row protocol/scope/security matrix with the selected service and a rejected alternative.', 'Draw where DNS selection, TLS termination, and actual data forwarding occur for each path.', 'Record an application-level failover observation, distinguishing fresh connections from DNS-cached or established sessions.']
            },
            exemplar: {
                artifact: 'Illustrative load-balancing decision memo',
                sample: 'FICTIONAL selection: shop HTTPS/global/CDN/WAF -> Front Door; internal regional HTTP paths -> Application Gateway; supported private TCP distribution -> Standard Load Balancer. Traffic Manager is DNS selection, not request inspection. Limitations: database failover behavior and regional service support require separate validation; no service was deployed.',
                scores: [3, 2, 3, 4],
                rationale: 'Correctness 3: matches services to protocols and scope without promising database semantics. Evidence 2: a requirements matrix is useful but lacks measured failover. Judgment 3: rejects unnecessary CDN and separates traffic types. Communication 4: an engineer can identify each decision and its remaining dependency quickly.'
            },
            lab: {
                mode: 'artifact',
                environment: 'Subscription-free service-selection tabletop. Shell: PowerShell 7 optional for local note handling. Dependencies: none; use the embedded protocol and failure cases.',
                expected: 'A justified service matrix rejects generic TCP through Front Door and distinguishes DNS-based selection from a proxy that sees HTTP requests.',
                failure: 'A diagram that draws Traffic Manager in the packet forwarding path or claims a cached 200 proves database availability fails the evidence check.',
                verify: ['Identify protocol, audience, region/global scope, and inspection requirement before naming a service.', 'Trace the chosen service data path and an alternative that fails a stated requirement.', 'Compare cached web success, uncached origin success, and database connection evidence separately.'],
                cleanup: ['Local: keep the synthetic decision matrix, then remove unused draft diagrams.', 'Optional Azure execution: after approval, stop clients, remove owned DNS test records and ingress rules, then remove dedicated backends, gateways/load balancers, public IPs, and diagnostics.', 'Verify unused local drafts are absent; after cloud teardown confirm owned ingress/backend inventory is empty and retained logging resources are accounted for.'],
                cost: 'Local route: $0. Optional Azure execution requires approval and estimates for each region/SKU rather than deploying every service; target a 90-minute lifetime. Gateway hours, edge traffic, public IPs, and retained logs/storage can keep billing until deleted.',
                safety: 'Synthetic requirements only; no workplace/customer hostnames or credentials. Do not send non-HTTP probes to live Front Door endpoints. Cloud work is not executed. Source review 2026-09-14: https://learn.microsoft.com/azure/architecture/guide/technology-choices/load-balancing-overview',
                status: 'source-reviewed'
            }
        },
        'frontdoor-basics': {
            criticalQuestions: [2, 3, 4],
            workedExample: {
                title: 'Explain which healthy origin receives the request',
                scenario: 'The fictional shop.example.test request reaches edge 192.0.2.80 with valid client TLS and WAF Allow. Caching and session affinity are disabled for this fixture. Origin-au.example.test at 198.51.100.20 is enabled, healthy, priority 1, latency 40 ms. Origin-se.example.test at 198.51.100.30 is healthy, priority 2, latency 15 ms.',
                steps: [
                    'Confirm the requested hostname and path match the intended route and origin group. A DNS answer alone does not prove the route association. Both origin TLS configurations are valid in this baseline, so selection can proceed without conflating handshake failure with priority.',
                    'Select enabled healthy origins, then the lowest numerical priority. Australia wins because priority 1 precedes latency comparison; the faster priority-2 backup is not a competing candidate while a priority-1 origin remains healthy. Weights apply only after the eligible latency set is established.',
                    'Change only the health evidence. With sample size four and three successes required, Australia now has two successful HTTP 200 probes and two HTTP 500 probes. It is unhealthy in this completed window, so the healthy priority-2 backup receives the uncached request and returns item-42/AUD 49.',
                    'Validate origin protection separately. For the public-origin fixture, require AzureFrontDoor.Backend source filtering plus X-Azure-FDID validation against the intended profile. A direct internet request fails the source filter; a request from another Front Door profile fails the header check. Neither a service tag alone nor a spoofable header alone binds the full path.'
                ],
                result: 'The baseline selects the slower priority-1 origin and the changed healthy-set fixture selects the backup. The evidence packet contains the matched route, probe window, selected origin, response marker, and two bypass failures. If all origins become unhealthy, Front Door can still route across them; health is not a guarantee of fail-closed origin isolation.'
            },
            prediction: {
                prompt: 'Caching and affinity are off. Origin Australia is enabled and healthy at priority 1 with 40 ms latency; origin Southeast is healthy at priority 2 with 15 ms. Which origin receives the next eligible uncached shop request?',
                options: ['Southeast, because the lowest latency always overrides priority.', 'Both origins receive a copy of every request regardless of priority.', 'Australia, because healthy priority 1 is selected before latency comparison.'],
                correct: 2,
                explanation: 'Front Door filters for enabled healthy origins and then selects the highest configured priority, represented by the lowest number. Latency and weights operate on that candidate set. The backup can receive traffic when the higher-priority candidates are unavailable under the health policy.'
            },
            transfer: {
                prompt: 'Extend the existing Front Door lab with an unseen snapshot where every enabled origin fails its probe but one still serves GET /catalog successfully. Explain why a received request does not prove a healthy probe and how to restore meaningful health evaluation.',
                checks: ['Record every origin probe window and distinguish application GET success from the configured probe method/path.', 'Explain the all-unhealthy routing fallback instead of assuming that all traffic is blocked.', 'Compare direct internet, different-profile, and intended-profile outcomes for the public-origin controls without weakening them to repair a probe.']
            },
            exemplar: {
                artifact: 'Illustrative Front Door fundamentals evidence',
                sample: 'FICTIONAL request learn-afd-01: route=catalog; cache=disabled; affinity=off; Australia priority 1 healthy -> selected despite 40 ms. Changed probe window 200/500/200/500 fails 3-of-4; Southeast selected -> 200. Limitations: timing is a completed synthetic window, not a measured global failover bound; profile-bypass evidence still needs independent review.',
                scores: [3, 3, 3, 3],
                rationale: 'Correctness 3: uses health before priority before latency and identifies the all-unhealthy exception. Evidence 3: provides the probe counts and selected origin. Judgment 3: keeps origin protection separate from health repair. Communication 3: explains the result clearly but must avoid presenting the synthetic window as a production recovery guarantee.'
            },
            lab: {
                mode: 'artifact',
                environment: 'Subscription-free request/header/probe worksheet. Shell: PowerShell 7 optional for local notes. Dependencies: none; the embedded fields are normalized synthetic observations, not an Azure log schema.',
                expected: 'The learner predicts Australia then Southeast, calculates the 3-of-4 health decision, and records source-filter plus profile-header bypass denials.',
                failure: 'Choosing the faster priority-2 origin while priority 1 is healthy, or accepting the service tag as profile-specific protection, contradicts the fixture.',
                verify: ['Calculate health candidates before evaluating priority, latency, or weight.', 'Correlate one synthetic request marker with its route, selected origin, and application result.', 'Check both negative bypass cases and explain the all-unhealthy behavior without claiming it secures the origin.'],
                cleanup: ['Local: retain the synthetic evidence packet, then delete scratch probe permutations.', 'Optional Azure execution: after approval, stop requests, remove owned test DNS records and custom domains before deleting routes/endpoints and dedicated origins; then remove diagnostics and owned public IPs.', 'Verify scratch copies are absent; after cloud work confirm DNS no longer points at removed endpoints and the owned resource inventory is empty, including retained logs.'],
                cost: 'Local route: $0. Optional Azure execution requires approval, a Front Door tier plus origin region/SKU estimate, and a 90-minute lifetime target. Health probes, origin compute, edge traffic, and retained log storage can produce charges; deletion, not session end, bounds resource lifetime.',
                safety: 'Use only synthetic .test names, TEST-NET addresses, and an illustrative profile marker; no workplace/customer data or credentials. No bypass requests or cloud labs were run; they are not executed. Source review 2026-09-14: https://learn.microsoft.com/azure/frontdoor/routing-methods and https://learn.microsoft.com/azure/frontdoor/health-probes',
                status: 'source-reviewed'
            }
        },
        'vpn-connectivity': {
            criticalQuestions: [4, 5],
            workedExample: {
                title: 'Failover needs a route in both directions',
                scenario: 'The fictional branch at 10.60.0.0/16 supports inventory used by shop.example.test. A client at 10.60.1.10 reaches an API at 10.20.1.4 through a hub VPN gateway. The synthetic topology has two on-premises devices, two independent tunnels, BGP prefix exchange, and correctly configured hub gateway transit for the spoke.',
                steps: [
                    'Write both directions before testing availability. The branch has learned 10.20.0.0/16 through both tunnels. The spoke has learned 10.60.0.0/16 through the remote hub gateway. The gateways, peerings, security rules, and guest listeners are prerequisites to the private application path.',
                    'In the failover fixture, tunnel one loses its BGP session and its route is withdrawn. Tunnel two still advertises the destination and has a working return route. New application connections can recover after routing convergence; an established TCP session may still reset. Do not promise zero interruption or a fixed recovery time from the topology alone.',
                    'Contrast a hidden return-path defect. If gateway propagation is disabled on the spoke and there is no approved replacement route, the intended branch route disappears. A tunnel marked connected does not prove application reachability. Inspect the spoke effective route and the branch table before blaming database authentication.',
                    'Compare ExpressRoute as a separate option. Private connectivity is not automatic encryption. Evaluate application TLS or a supported IPsec design against the security requirement, plus carrier provisioning, redundancy, and cost. FastPath changes supported data forwarding, while gateway route exchange still matters.'
                ],
                result: 'The evidence packet shows surviving advertisements and a valid return path for the two-tunnel case, and identifies missing spoke route propagation in the failed case. It distinguishes tunnel status, routing convergence, and application recovery. The exercise is a failover tabletop; no VPN or ExpressRoute circuit is ordered or changed.'
            },
            prediction: {
                prompt: 'After tunnel one fails, a branch router retains a static 10.20.1.0/24 route to that dead tunnel while BGP offers healthy 10.20.0.0/16 via tunnel two. What happens to a new request for 10.20.1.4 on this branch router?',
                options: ['It recovers automatically because all BGP routes outrank static routes regardless of prefix.', 'The stale /24 captures the destination and blackholes the request until corrected.', 'DNS changes the destination subnet to match the working tunnel.'],
                correct: 1,
                explanation: 'In this stated branch-router table, the more specific /24 matches before the broader /16 can help. The surviving tunnel alone does not supply failover for destinations still captured by a stale route. Correct the route lifecycle and verify the return path as well.'
            },
            transfer: {
                prompt: 'A second fictional branch also uses 10.60.0.0/16 and asks to join the same hub. Extend the hybrid design with a nonoverlapping address plan or an explicitly supported translation design, then walk a failover and failback without assuming that connected tunnels prove reachability.',
                checks: ['Show the overlapping prefixes and a corrected advertisement/translation plan with clear owners.', 'Record forward and return next hops before failure, after withdrawal, and after failback.', 'Separate synthetic routing convergence from measured application recovery and explain which encryption requirement a private circuit does or does not satisfy.']
            },
            exemplar: {
                artifact: 'Illustrative hybrid failover tabletop',
                sample: 'FICTIONAL table: branch learns 10.20.0.0/16 via tunnels 1 and 2; spoke learns 10.60.0.0/16 through hub transit. Tunnel 1 withdrawal leaves tunnel 2 and the return route. Limitations: no measured convergence or TCP recovery, no carrier order, and no evidence that ExpressRoute alone encrypts application traffic.',
                scores: [3, 2, 3, 3],
                rationale: 'Correctness 3: includes both directions and route withdrawal. Evidence 2: the tabletop is inspectable but does not measure convergence. Judgment 3: includes device redundancy and the private-versus-encrypted distinction. Communication 3: explains why tunnel state is insufficient and identifies the next application-level validation.'
            },
            lab: {
                mode: 'artifact',
                environment: 'Subscription-free BGP and route-table tabletop. Shell: PowerShell 7 optional for local notes. Dependencies: none; tunnel and prefix records are embedded synthetic snapshots.',
                expected: 'Three forward/return snapshots show a surviving tunnel path, a stale more-specific route failure, and a documented failback assumption without invented convergence measurements.',
                failure: 'A connected tunnel with a missing return advertisement or an overlapping branch prefix cannot establish the intended end-to-end private request.',
                verify: ['Compare destination prefixes and surviving advertisements for both traffic directions.', 'Identify the stale /24 and state why a healthy /16 cannot win that lookup.', 'Record device/tunnel independence, application reconnection, and encryption requirements separately.'],
                cleanup: ['Local: retain the synthetic tabletop, then delete discarded route snapshots.', 'Optional Azure execution: after separate approval, stop test clients, remove only lab connection/advertisement changes, restore gateway-transit dependencies, then delete dedicated connections before gateways and their public IPs.', 'Verify scratch snapshots are absent; after cloud work confirm original route advertisements, empty owned gateway inventory, and any carrier/circuit cancellation and retained logs separately.'],
                cost: 'Local route: $0. Optional Azure execution requires approval, regional gateway SKU and provider estimates, and a 2-hour exercise target after provisioning. Provisioning/deletion can take longer; gateways, public IPs, retained logs, and ExpressRoute provider commitments may outlive the session.',
                safety: 'Synthetic branch data only; no workplace/customer prefixes, tunnel keys, or credentials. No real tunnel is disabled and no carrier service ordered; optional execution is not executed. Source review 2026-09-14: https://learn.microsoft.com/azure/vpn-gateway/vpn-gateway-highlyavailable',
                status: 'source-reviewed'
            }
        },
        'peering-endpoints': {
            criticalQuestions: [0, 2, 4],
            workedExample: {
                title: 'Connectivity and private service access are separate choices',
                scenario: 'Fictional shop.example.test uses API spoke 10.20.0.0/16 and inventory spoke 10.30.0.0/16. Each is peered with hub 10.10.0.0/16, but they are not peered with each other and no transit appliance routes exist. A synthetic API request to inventory VM 10.30.1.5 times out despite both hub peerings showing connected.',
                steps: [
                    'Trace the source route rather than the visual lines on the diagram. Hub peering does not create automatic spoke-to-spoke transit. Without a specific supported connection path, an ordinary private destination outside the known peer prefixes cannot be reached through the hub by implication.',
                    'Choose the path from the requirement. Direct spoke peering with nonoverlapping ranges can provide direct communication; centralized inspection instead needs an appliance, explicit routes, forwarded-traffic permissions, and the reverse path. A successful hub ping proves neither choice is complete.',
                    'Now add a separate PaaS dependency through a Private Endpoint at 10.20.2.5 in the API spoke. Its approved connection and service-specific DNS integration give authorized clients a private destination. Merely creating the endpoint does not disable that service public-network-access setting.',
                    'Compare a service endpoint: clients still use the service public endpoint, with a service route over the Azure backbone and resource access controls that can identify the allowed subnet. It does not allocate a private endpoint address. In both designs, DNS, network reachability, and data authorization need separate evidence.'
                ],
                result: 'The original VM timeout is explained by absent spoke transit, while the PaaS design has an independent endpoint and DNS decision. The final matrix includes allowed private access and an explicitly denied public service path. It avoids claiming that peering shares private DNS automatically or that a private address removes every public exposure.'
            },
            prediction: {
                prompt: 'A fictional PaaS service now has an approved Private Endpoint and resolves privately from the API VM, but its public-network-access policy was left enabled. A permitted public client still connects. Which outcome is consistent with that design?',
                options: ['The private endpoint must be broken because public and private endpoints cannot coexist.', 'Public access can remain available because its policy is a separate setting.', 'VNet peering automatically disables the public service endpoint after DNS propagation.'],
                correct: 1,
                explanation: 'Private Endpoint creation and private DNS resolution do not automatically turn off the service public endpoint. Public-network-access policy and data authorization remain separate. Prove the private route works and then prove the intended public denial using independently scoped evidence.'
            },
            transfer: {
                prompt: 'The unseen design centralizes the Private Endpoint in the hub. One spoke resolves the public endpoint, while another resolves the correct private IP but hits a deny rule. Explain why one shared endpoint does not imply one shared failure cause.',
                checks: ['Produce resolver and route rows for both spokes, including the selected DNS view and private destination.', 'Distinguish the missing DNS link/forwarding case from the correct-answer-but-denied network case.', 'Compare direct peering and inspected transit, including nonoverlap, return routing, and public-access policy evidence.']
            },
            exemplar: {
                artifact: 'Illustrative endpoint connectivity review',
                sample: 'FICTIONAL diagnosis: API 10.20.1.4 cannot infer transit to 10.30.1.5 from two hub peerings. Private service endpoint=10.20.2.5, DNS integrated, public policy still enabled. Limitations: service-specific endpoint support and DNS suffixes must be checked for the selected PaaS service; no live access restriction test was performed.',
                scores: [3, 2, 3, 3],
                rationale: 'Correctness 3: separates nontransitive peering, endpoint addressing, and public policy. Evidence 2: the matrix lacks actual private/public control observations. Judgment 3: compares direct and inspected connectivity without assuming one is always preferable. Communication 3: names the independent failure causes and the remaining service-specific checks.'
            },
            lab: {
                mode: 'artifact',
                environment: 'Subscription-free topology and endpoint matrix. Shell: PowerShell 7 optional for local notes. Dependencies: none; use synthetic DNS and reachability records, with no service connection attempts.',
                expected: 'The matrix rejects implicit spoke transit and separately records private endpoint approval, DNS resolution, network access, public policy, and application authorization.',
                failure: 'A public answer from one spoke and a denied private connection from another cannot both be repaired by adding the same broad NSG allow rule.',
                verify: ['Trace each spoke route and reverse path with explicit next hops.', 'Explain how a service endpoint differs from a private IP endpoint.', 'Compare private success and public denial without treating either as proof of application authorization.'],
                cleanup: ['Local: retain the synthetic topology matrix, then remove discarded diagrams.', 'Optional Azure execution: after approval, stop clients and restore service-access/DNS changes, remove owned private DNS zone groups and endpoints, then remove dedicated peering links and dependent VNets.', 'Verify local scratch diagrams are absent; after cloud work confirm owned endpoint/peering inventory is empty and service public policy plus retained DNS/log resources are accounted for.'],
                cost: 'Local route: $0. Optional Azure execution requires approval, selected region/PaaS SKU estimates, and a 90-minute target. Private endpoint hours, peering data transfer, the PaaS service, and retained log storage can bill separately until cleanup.',
                safety: 'Synthetic topology only; no workplace/customer service names, payloads, or credentials. Never disable a shared public endpoint as part of this exercise. Cloud validation is not executed. Source review 2026-09-14: https://learn.microsoft.com/azure/virtual-network/virtual-network-peering-overview and https://learn.microsoft.com/azure/private-link/private-endpoint-overview',
                status: 'source-reviewed'
            }
        },
        'azure-bastion': {
            criticalQuestions: [1, 4],
            workedExample: {
                title: 'Portal access does not bypass a VM security rule',
                scenario: 'An operator must diagnose the private API VM behind fictional shop.example.test. The synthetic design has VM 10.20.1.4 with no public IP and a dedicated Standard Bastion deployment in hub AzureBastionSubnet 10.10.1.0/26. Peering is complete. Browser sign-in succeeds, but the Bastion-to-VM SSH connection times out.',
                steps: [
                    'Draw the two legs: administrator browser over HTTPS to Bastion, then Bastion private connectivity to 10.20.1.4:22. Successful browser sign-in tests neither that private network path nor authorization to log in to the guest operating system.',
                    'The target NSG fixture has priority 100 Deny Any TCP/22. It has no earlier matching allowance for 10.10.1.0/26. Bastion does not bypass this rule. Replace the design with priority 100 Allow only the Bastion subnet to the intended VM on 22, followed by priority 200 Deny other SSH sources.',
                    'Keep Bastion service-required control and data-plane rules distinct from target VM access. The dedicated /26 design is deliberate for this Standard example; do not assume every Bastion SKU has identical deployment requirements or that a smaller shared offering meets native-client needs.',
                    'The corrected synthetic tuple reaches SSH, but a separate guest-login denial remains possible without the appropriate guest account/role. Select Premium only when its supported recording or private-only capabilities are required, and include the recording data boundary. Never publish VM management ports as a shortcut.'
                ],
                result: 'The evidence distinguishes working administrator HTTPS, a denied Bastion-to-VM network leg, and independent guest authorization. The corrected matrix permits 10.10.1.0/26 to this VM on SSH while denying other sources. A screenshot of the portal connect button is not proof of private management access or of who can log in.'
            },
            prediction: {
                prompt: 'Bastion browser sign-in and MFA succeed, but the target VM NSG denies all new TCP/22 connections from the Bastion subnet. What happens to an SSH connection through Bastion?',
                options: ['The private SSH connection is blocked; browser authentication does not override the VM NSG.', 'SSH succeeds because Bastion ignores target NSG rules.', 'A public IP is automatically assigned to the target VM to complete the connection.'],
                correct: 0,
                explanation: 'Bastion needs network access to the target management port as well as appropriate user and guest permissions. The NSG deny remains effective. Fix the narrow private-source rule in the design and separately validate guest login; do not expose SSH to the internet.'
            },
            transfer: {
                prompt: 'An unseen requirement adds a Windows VM at 10.30.1.4 and requires recording for approved troubleshooting sessions. Extend the private management design without inheriting the Linux SSH rule or assuming Standard provides every Premium feature.',
                checks: ['Record the separate TCP/3389 destination and Bastion-subnet source rule plus a denied internet-management control.', 'Compare SKU capabilities, peered connectivity, guest permissions, and recording retention using current source guidance.', 'Show evidence for browser authentication, private transport, and guest authorization as three independent checks.']
            },
            exemplar: {
                artifact: 'Illustrative private-management evidence',
                sample: 'FICTIONAL access record: browser HTTPS succeeds; Bastion 10.10.1.0/26 -> VM 10.20.1.4:22 denied at target NSG. Proposed narrow allow plus deny-other-SSH permits a fresh connection. Limitations: guest authorization and session recording were not tested; the example uses dedicated Standard deployment assumptions, not every SKU.',
                scores: [3, 2, 3, 3],
                rationale: 'Correctness 3: separates browser identity, network access, and guest login. Evidence 2: the network decision is synthetic and lacks a guest session. Judgment 3: keeps management private and calls out SKU and retention assumptions. Communication 3: identifies the blocking rule without implying that portal access proves completion.'
            },
            lab: {
                mode: 'artifact',
                environment: 'Subscription-free management-path review in a text editor. Shell: PowerShell 7 optional for local notes. Dependencies: none; no RDP, SSH, or Bastion session is opened.',
                expected: 'A two-leg management diagram and access matrix separate browser HTTPS, private SSH/RDP rules, guest permissions, and any recording requirement.',
                failure: 'A note claiming Bastion bypasses target NSGs or assigning a public IP to fix private SSH would violate the stated management boundary.',
                verify: ['Evaluate a fresh Bastion-source tuple and a denied non-Bastion source.', 'Name the target guest protocol, required permission, and supported SKU assumption.', 'Record a session-recording data/retention decision without treating a portal screenshot as a successful guest login.'],
                cleanup: ['Local: retain the synthetic access matrix, then remove disposable login-flow drafts.', 'Optional Azure execution: after approval, end guest sessions and remove temporary guest access, then delete the dedicated Bastion deployment before its owned public IP and subnet; remove disposable targets and diagnostics.', 'Verify local scratch drafts are absent; after cloud teardown confirm Bastion/public-IP inventory and temporary access are removed, and recording/log retention is explicitly checked.'],
                cost: 'Local route: $0. Optional Azure execution needs approval, a region and Standard/Premium SKU estimate, and a 2-hour lifetime target. Dedicated Bastion can bill while idle; stopped target VMs do not remove Bastion, disks, public IPs, or retained recordings/logs.',
                safety: 'Use synthetic identities and addresses only; no workplace/customer sessions, passwords, keys, or credentials. Never record a real troubleshooting session for this artifact. Cloud access is not executed. Source review 2026-09-14: https://learn.microsoft.com/azure/bastion/bastion-nsg',
                status: 'source-reviewed'
            }
        },
        'nat-gateway': {
            criticalQuestions: [1, 3, 4],
            workedExample: {
                title: 'Identify the translating resource before increasing capacity',
                scenario: 'The API VM 10.20.1.4 behind fictional shop.example.test calls pricing.example.test at documentation address 203.0.113.200:443. In the first synthetic snapshot its effective route is Internet and the web subnet has NAT Gateway with public source 198.51.100.60. In the second snapshot a UDR sends the same destination to firewall 10.10.0.4.',
                steps: [
                    'For the first snapshot, follow route selection before source translation. The Internet path uses the subnet NAT Gateway, so the external observer sees 198.51.100.60 rather than the VM private address. DNS success and NSG Allow still need separate checks; NAT is not an application-domain allowlist.',
                    'The second snapshot routes through Azure Firewall. Assume explicitly that no NAT Gateway is associated with the firewall subnet. The external observer now sees the firewall public source 198.51.100.70. Adding more public IPs to the source-subnet NAT Gateway cannot repair capacity on a path that does not use it.',
                    'Distinguish pressure from rejection. The toy incident includes connection failures and high SNAT pressure during 50,000 short-lived concurrent calls; the pooled comparison uses 5,000 connections and has no fixture failures. These are synthetic workload observations, not a universal NAT capacity guarantee. An HTTP 429 instead demonstrates an application response that deserves separate rate-limit analysis.',
                    'Keep the default-outbound distinction explicit: new VNets using API versions released after March 31, 2026 default to private subnets; existing VNets are not retroactively changed. Explicit egress must match the actual route, and a private-subnet Internet route alone does not create default translation.'
                ],
                result: 'The path table assigns the first flow to NAT source .60 and the routed flow to firewall source .70. It rejects spending on the unused NAT path and recommends reviewing connection reuse and the translating resource metrics first. The result is a testable diagnosis plan, not a promise that a particular IP count fixes every outbound failure.'
            },
            prediction: {
                prompt: 'The API subnet has NAT Gateway, but the effective Internet-bound route points to Azure Firewall at 10.10.0.4. There is no NAT Gateway on the firewall subnet. Which source should a successful external observer see?',
                options: ['The API subnet NAT public IP regardless of the route.', 'The firewall public source address for this routed and translated flow.', 'The private VM address because an NSG allow rule disables translation.'],
                correct: 1,
                explanation: 'The UDR selects the appliance path. With no NAT Gateway on the firewall subnet in this fixture, the firewall provides internet SNAT. NAT attached to the originating subnet does not override that routing choice, so inspect the firewall path before changing source-subnet NAT capacity.'
            },
            transfer: {
                prompt: 'An unseen snapshot adds a more-specific Internet route for 203.0.113.0/24 while leaving the default route through the firewall. The source subnet still has NAT Gateway. Compare calls to 203.0.113.200 and 198.51.100.200 and assess whether bypassing inspection is approved.',
                checks: ['Show longest-prefix selection for both destinations and the expected NAT .60 versus firewall .70 source observations.', 'Record an explicit inspection exception decision; do not treat restored connectivity as permission to bypass policy.', 'Compare connection-attempt, failure, and application-response evidence before proposing more IP capacity or retries.']
            },
            exemplar: {
                artifact: 'Illustrative egress diagnosis',
                sample: 'FICTIONAL flow table: Internet route -> subnet NAT 198.51.100.60; appliance route -> firewall 198.51.100.70, with no firewall-subnet NAT. Pooling comparison: 50,000 versus 5,000 concurrent connections. Limitations: no real load test, fixed capacity guarantee, or approved inspection bypass; actual metrics and destination patterns are needed.',
                scores: [3, 2, 3, 3],
                rationale: 'Correctness 3: names the translating resource for each explicit topology. Evidence 2: pressure and pooling numbers are synthetic comparisons. Judgment 3: considers connection reuse and inspection approval before purchasing capacity. Communication 3: states assumptions clearly and avoids turning a sample result into a throughput promise.'
            },
            lab: {
                mode: 'artifact',
                environment: 'Subscription-free egress-path and metrics worksheet. Shell: PowerShell 7 optional for local arithmetic. Dependencies: none; read embedded synthetic observations without generating outbound load.',
                expected: 'Two route/source rows identify which resource performs translation, and a diagnosis separates route defects, SNAT pressure, and an HTTP rate-limit response.',
                failure: 'Increasing NAT capacity while the route uses a firewall is not a supported fix; interpreting every HTTP 429 as SNAT failure also contradicts the observed application response.',
                verify: ['Record the destination-specific effective route and all NAT associations before predicting the public source.', 'Compare short-lived and pooled connection observations without asserting a guaranteed capacity.', 'Check the new-private-subnet scope and mark any inspection exception as an independent approval decision.'],
                cleanup: ['Local: retain the synthetic source/route table, then delete discarded load calculations.', 'Optional Azure execution: after approval, stop load generation first, restore approved routes, detach owned NAT subnet associations, then delete dedicated NAT/public IP resources and diagnostics.', 'Verify no local test process or scratch data remains; after cloud work confirm the owned NAT/firewall/public-IP inventory and retained log storage are accounted for.'],
                cost: 'Local route: $0. Optional Azure execution requires approval, region/NAT and firewall SKU estimates, and a 60-minute lifetime target. Gateway hours, processed data, public IPs, and retained log storage can cost money while compute is stopped; do not infer free egress from a private subnet.',
                safety: 'Synthetic metrics and TEST-NET destinations only; no workplace/customer traffic or credentials. Do not run a load generator against a public dependency. Cloud tests are not executed. Source review 2026-09-14: https://learn.microsoft.com/azure/nat-gateway/nat-gateway-resource and https://learn.microsoft.com/azure/virtual-network/ip-services/default-outbound-access',
                status: 'source-reviewed'
            }
        },
        'route-tables-udr': {
            criticalQuestions: [0, 1, 2],
            workedExample: {
                title: 'A specific inspection route can create a return-path trap',
                scenario: 'The fictional shop.example.test API at 10.20.1.4 needs branch inventory at 10.60.2.8. Its synthetic effective table has 10.60.0.0/16 via BGP VirtualNetworkGateway, 10.60.2.0/24 via user-defined VirtualAppliance 10.10.0.4, and 0.0.0.0/0 via that same firewall. The request reaches the branch, but a new connection does not complete.',
                steps: [
                    'Match the destination against every active candidate. The /24 is more specific than the /16 and /0, so this flow reaches 10.10.0.4. A destination 10.60.3.8 instead uses the BGP /16. A broad UDR is not a blanket override of every more-specific route.',
                    'Use route-source precedence only after prefix comparison in this ordinary-prefix fixture: for identical prefixes, user-defined wins over BGP, then system. Preferred VNet, peering, and service-endpoint routes have documented exceptions; inspect effective route state rather than extending this simplified table to every platform route.',
                    'Follow the return. The firewall network-rule path preserves the private source in this case. The branch sends its reply through the gateway, whose return-side snapshot forwards directly to the spoke, bypassing the stateful firewall. Forward packet delivery therefore does not prove a complete symmetric session.',
                    'The corrected design sends the return-side 10.20.1.0/24 traffic through the same reachable appliance and preserves required gateway routing and propagation. Review both directions and forwarded-traffic permissions; do not add a default route on GatewaySubnet or disable its route propagation to force a shortcut.'
                ],
                result: 'The route worksheet predicts firewall for 10.60.2.8 and gateway for 10.60.3.8, then identifies the asymmetric reply as a competing cause of the failed session. The proposed correction is bounded to the required return prefix. It includes evidence from both routing points and avoids mistaking a single next-hop result for end-to-end validation.'
            },
            prediction: {
                prompt: 'For 10.60.2.8, active routes are BGP 10.60.0.0/16 to the gateway, user 10.60.2.0/24 to appliance 10.10.0.4, and user 0.0.0.0/0 to the same appliance. What is the selected next hop in this ordinary-prefix fixture?',
                options: ['VirtualNetworkGateway because BGP always defeats UDRs.', 'Internet because private ranges ignore more-specific routes.', 'VirtualAppliance 10.10.0.4 through the matching /24 route.'],
                correct: 2,
                explanation: 'The /24 is the longest matching active prefix and selects 10.10.0.4. Source precedence is not needed to decide among these different prefix lengths. The next check is the return route and security policy; selecting a next hop does not prove that the full session will succeed.'
            },
            transfer: {
                prompt: 'The unseen table removes the /24 and adds a user-defined 10.60.0.0/16 route alongside the identical BGP prefix. Predict three destinations and identify a return path that would still bypass inspection after the forward change.',
                checks: ['Produce a destination/prefix/source/next-hop table including an address inside /16 and one outside it.', 'Explain equal-prefix UDR precedence separately from longest-prefix matching and note platform preferred-route exceptions.', 'Draw forward and return paths through the same stateful appliance, preserving GatewaySubnet requirements and naming a negative asymmetric case.']
            },
            exemplar: {
                artifact: 'Illustrative effective-route analysis',
                sample: 'FICTIONAL lookup: 10.60.2.8 -> user /24 -> 10.10.0.4; 10.60.3.8 -> BGP /16 -> gateway. Reply bypasses firewall, so a delivered SYN is not a working session. Limitations: route snapshots are synthetic and exclude service-endpoint/preferred-system exceptions; no gateway route was changed or connection executed.',
                scores: [4, 3, 3, 3],
                rationale: 'Correctness 4: separates prefix choice, source precedence, and return routing in the stated case. Evidence 3: records two lookups and a reverse-path defect. Judgment 3: protects gateway behavior and calls out exceptions. Communication 3: gives a bounded correction but still needs independent traffic evidence before implementation.'
            },
            lab: {
                mode: 'artifact',
                environment: 'Subscription-free effective-route tabletop. Shell: PowerShell 7 optional for local notes or address arithmetic. Dependencies: none; all routes and next-hop observations are synthetic.',
                expected: 'The table chooses /24 for 10.60.2.8 and /16 for 10.60.3.8 and explains why the asymmetric return still prevents a valid stateful path.',
                failure: 'Choosing any UDR before considering prefix length, or validating only the outgoing next hop, can predict success for the deliberately broken session.',
                verify: ['List matching prefixes and their active states before selecting a route.', 'Evaluate an identical-prefix UDR/BGP case separately from the more-specific case.', 'Compare both directional traces and explicitly preserve gateway propagation and documented route exceptions.'],
                cleanup: ['Local: keep the synthetic route worksheet, then remove scratch routing variants.', 'Optional Azure execution: after approval, stop test traffic and restore the original subnet route association before deleting owned route tables or appliances; preserve gateway-required routes.', 'Verify local scratch variants are absent; after cloud work confirm original effective routes, the owned resource inventory, and any retained diagnostics before closing the exercise.'],
                cost: 'Local route: $0. Optional Azure execution requires approval, an appliance/gateway region and SKU estimate, and a 90-minute target. The route table is not the main cost: appliance hours, transfer, public IPs, and retained logs/storage may continue until actual deletion.',
                safety: 'Use synthetic routes only, never workplace/customer prefixes or credentials. A routing correction can remove management access; shared routes are outside this exercise. Cloud changes are not executed. Source review 2026-09-14: https://learn.microsoft.com/azure/virtual-network/virtual-networks-udr-overview',
                status: 'source-reviewed'
            }
        },
        'frontdoor-advanced': {
            criticalQuestions: [1, 5],
            workedExample: {
                title: 'Repair the origin TLS and probe contract independently',
                scenario: 'A synthetic release rewrites shop.example.test/catalog/item-42 to /v2/catalog/item-42 at origin-au.example.test. Client TLS succeeds and WAF allows the request. Origin DNS resolves to 198.51.100.20 and TCP/443 connects, but its certificate covers only legacy-origin.example.test. A healthy backup origin remains available while the new origin is being reviewed.',
                steps: [
                    'Locate the failed TLS leg. The valid shop certificate belongs to client-to-edge TLS. Front Door still needs a valid origin certificate for its configured origin hostname. The synthetic origin TLS name failure occurs before the application can receive the rewritten path, so a rewrite correction alone cannot fix it.',
                    'Align the configured origin hostname, certificate name/trust, and application Host expectations. Do not disable certificate-name checking to hide the mismatch. A changed Host header is not evidence that the TLS hostname contract now passes; record the actual TLS and HTTP expectations separately.',
                    'The next fixture fixes TLS but HEAD /healthz returns 405 while GET returns 200. Front Door needs HTTP 200 for a successful probe. Support the selected probe method or deliberately choose an appropriate supported method, then evaluate its complete success window before admitting the origin.',
                    'Preserve public-origin protection with AzureFrontDoor.Backend filtering and X-Azure-FDID profile validation. Premium Private Link is a separate option for supported origins. Keep rollout checks on both the unchanged /catalog route and the new rewritten path, with a rollback trigger for origin TLS errors or failed probes.'
                ],
                result: 'The staged synthetic repair first restores valid origin TLS, then fixes probe behavior, then demonstrates the rewritten request returning item-42/AUD 49. Managed-identity origin authentication remains preview for supported non-Private-Link origins, not GA or universal support. It requires its own support/security review and is not assumed to repair either observed defect.'
            },
            prediction: {
                prompt: 'An uncached request has valid shop TLS, WAF Allow, correct origin DNS, and a successful origin TCP connection, but the configured origin hostname is absent from the origin certificate. What should the next diagnostic conclusion be?',
                options: ['The rewrite is proven wrong because every origin TLS error is an HTTP 404.', 'Origin certificate/TLS validation fails before the origin receives the HTTP path.', 'The connection is fully verified because browser TLS already authenticated the origin.'],
                correct: 1,
                explanation: 'Front Door uses a separate TLS session to the origin. A successful client session and origin TCP connection do not validate its certificate name. Resolve that contract first; only a successful origin HTTP exchange can test the rewrite or application Host behavior.'
            },
            transfer: {
                prompt: 'Extend the existing advanced lab review with an unseen canary: both origins are healthy at equal priority and weights 50/50, but latency sensitivity is zero and their measured latencies differ. Predict the candidate set and define a controlled rollout/rollback evidence gate.',
                checks: ['Show why equal weights do not guarantee a 50/50 observed split when the latency candidate set excludes the slower origin.', 'Record valid TLS, HTTP 200 probes for the selected method/path, and response markers for both origin versions before traffic movement.', 'Include intended-profile and bypass evidence, a dated preview/support review, and a rollback decision without executing a cloud rollout.']
            },
            exemplar: {
                artifact: 'Illustrative advanced Front Door review',
                sample: 'FICTIONAL release review: browser TLS valid; origin TCP connects; origin cert name mismatch -> no origin HTTP. After certificate repair: HEAD /healthz=405, GET=200; repair the probe contract before admission. Limitations: synthetic rollout only; no verified global propagation, Private Link deployment, or preview managed-identity integration.',
                scores: [3, 3, 3, 2],
                rationale: 'Correctness 3: separates TLS, Host/path, and probe decisions and preserves origin controls. Evidence 3: includes contrasting handshake and method outcomes. Judgment 3: keeps a healthy rollback target and treats preview support separately. Communication 2: the change record still needs a named rollout owner and measured observation window.'
            },
            lab: {
                mode: 'artifact',
                environment: 'Subscription-free review of synthetic TLS, probe, and rule snapshots. Shell: PowerShell 7 optional for local notes. Dependencies: none; no domain validation, certificate request, or Azure CLI invocation is required.',
                expected: 'A staged evidence table fixes origin TLS before evaluating HEAD/GET probe behavior, then checks the rewritten path and both public-origin protections.',
                failure: 'Disabling TLS name checks, treating GET 200 as proof that HEAD probes work, or relying on the service tag alone leaves a concrete defect unresolved.',
                verify: ['Compare the client and origin hostname/certificate contracts and identify the first failure.', 'Evaluate the configured probe method, path, HTTP status, and success window before reading rollout weights.', 'Record approved-profile success, direct/different-profile denials, support limits, and a specific rollback trigger.'],
                cleanup: ['Local: retain the synthetic staged review, then delete abandoned rule/certificate sketches.', 'Optional Azure execution: after approval, stop canary traffic, revert owned rules and DNS associations before removing custom domains/routes, then delete dedicated origins, private connections, and diagnostics in dependency order.', 'Verify scratch sketches are absent; after cloud work confirm rollback behavior, no dangling owned DNS associations, and empty owned resource inventory with certificates and retained logs reviewed separately.'],
                cost: 'Local route: $0. Optional Azure execution requires separate approval, Front Door tier and origin region/SKU estimates, and a 2-hour lifetime target after readiness. Premium, origins, private connections, Key Vault/storage, and retained diagnostics can outlive a short test; deletion and certificate retention require explicit verification.',
                safety: 'Synthetic hosts and observations only; no workplace/customer domains, tokens, or credentials. Cloud work is not executed. Reviewed 2026-09-14; content review owner: academy maintainer, next volatile-feature review 2026-10-14. Managed-identity origin authentication is preview for supported non-Private-Link origins; Premium Private Link is separate. https://learn.microsoft.com/azure/frontdoor/secure-front-door and https://learn.microsoft.com/azure/frontdoor/health-probes',
                status: 'source-reviewed'
            }
        },
        'frontdoor-caching': {
            criticalQuestions: [0, 1, 5],
            workedExample: {
                title: 'Prove the cache key matches the meaning of the response',
                scenario: 'The fictional shop.example.test/catalog/item-42 response changes with currency: AUD 49 or USD 32. The synthetic route caches small anonymous GET responses, honors Cache-Control: public, max-age=120, and includes currency but excludes utm_source in its query-string cache key. Assume one edge, a retained fresh entry, no affinity, and no cookies for these catalog requests.',
                steps: [
                    'At time zero, currency=AUD&utm_source=news is a TCP_MISS and the origin returns AUD 49. At ten seconds, currency=AUD&utm_source=email shares the meaningful key and can be TCP_HIT. Changing tracking alone does not change this public response, so excluding it is deliberate.',
                    'At twenty seconds, currency=USD uses a different key and must obtain USD 32 if no USD entry exists. If the route instead ignores every query parameter, that second currency can incorrectly reuse AUD 49. A high hit ratio would then measure efficient delivery of the wrong representation.',
                    'Handle /account/orders separately. Disable caching on its route and return private, no-store from the origin. The synthetic two-identity comparison returns marker ACCOUNT-ALPHA only to Alpha and ACCOUNT-BETA only to Beta; CONFIG_NOCACHE is the expected route-disabled indicator. A cookie or Authorization header alone is not an unconditional safety guarantee.',
                    'Correlate response markers with X-Cache and origin-request records rather than counting headers alone. Different edges or eviction can cause a miss before the TTL ends, and stale serving can occur in supported conditions. The deterministic HIT expectation belongs to the stated retained-entry fixture, not every global request.'
                ],
                result: 'The table produces MISS/HIT/MISS for the three controlled public requests and isolated, noncached account markers for the two identities. It rejects the ignore-all-query variant because currency changes content. This enriches the existing cache exercise with a semantic key test and a negative privacy case, without claiming that synthetic headers certify real authenticated-content safety.'
            },
            prediction: {
                prompt: 'At the same edge, an unexpired retained AUD catalog response is cached. The route ignores every query parameter. A new anonymous request asks for currency=USD with the same path. What can happen under this faulty cache policy?',
                options: ['The two currencies share the same cache entry, so the USD request can receive the cached AUD representation.', 'Currency always gets a separate entry even when all query strings are ignored.', 'The origin must receive every request because the URL contains a question mark.'],
                correct: 0,
                explanation: 'Ignoring all query parameters collapses currency variants into one cache key while the origin response still depends on currency. That is a correctness defect, even if latency and hit ratio improve. Include response-changing parameters or disable caching for content that cannot be safely shared.'
            },
            transfer: {
                prompt: 'An unseen promotion adds a membership cookie that changes the catalog price. The team wants to keep the anonymous cache rule unchanged. Extend the existing experiment with two fictional identities and decide how to preserve public caching without sharing member-specific content.',
                checks: ['Compare anonymous, Alpha-member, and Beta-member response markers with explicit cache policy and origin observations.', 'Show why the cookie alone does not prove isolation; propose a noncached personalized route with private/no-store defense.', 'Record the incorrect cross-identity marker as a release blocker and define bounded purge/rollback evidence rather than celebrating a higher hit ratio.']
            },
            exemplar: {
                artifact: 'Illustrative cache experiment evidence',
                sample: 'FICTIONAL same-edge table: t0 AUD/news MISS -> AUD 49; t10 AUD/email HIT -> AUD 49; t20 USD MISS -> USD 32. Account route disabled: Alpha sees ACCOUNT-ALPHA, Beta sees ACCOUNT-BETA, both CONFIG_NOCACHE. Limitations: synthetic markers only; other edges, eviction, stale responses, and actual identity integration were not tested.',
                scores: [4, 3, 3, 3],
                rationale: 'Correctness 4: cache keys follow response semantics and personalized traffic is separated. Evidence 3: concrete times, markers, and negative variants are reproducible from the fixture. Judgment 3: privacy is a release gate rather than a hit-ratio tradeoff. Communication 3: states the cache-retention assumptions and the unexecuted integration boundary.'
            },
            lab: {
                mode: 'artifact',
                environment: 'Subscription-free header and cache-key worksheet. Shell: PowerShell 7 optional for local notes. Dependencies: none; all response bodies, identities, and cache observations are embedded synthetic fixtures.',
                expected: 'A key/outcome table predicts MISS/HIT/MISS for the stated catalog cases and distinct noncached account markers, including the wrong-currency negative control.',
                failure: 'An ignore-all-query key serves the wrong currency, or a repeated Alpha marker appears in the Beta case; either invalidates the sharing policy regardless of hit ratio.',
                verify: ['Derive keys from hostname/path and the configured meaningful query parameters.', 'Compare payload markers with X-Cache and origin observation counts under explicit edge/retention assumptions.', 'Treat any cross-identity marker as failure; distinguish route-disabled CONFIG_NOCACHE from origin private/no-store behavior.'],
                cleanup: ['Local: keep the synthetic comparison, then remove disposable identity-marker drafts.', 'Optional Azure execution: after approval, stop requests, disable unsafe test caching and purge only approved test paths before removing owned routes/domains and disposable origins; then remove diagnostics.', 'Verify scratch drafts are absent; after cloud work confirm approved test objects are no longer served, owned endpoint inventory is removed, and retained cache-test logs/storage have an explicit disposition.'],
                cost: 'Local route: $0. Optional Azure execution requires approval, Front Door tier and origin region/SKU estimates, and a 60-minute test window. Purges, origin requests, transfer, and retained logs/storage are not assumed free; TTL is not the lifetime of the billed resources.',
                safety: 'Synthetic identities and markers only; never use real workplace/customer accounts, cookies, tokens, or credentials. No authenticated requests or cache purges were executed; cloud labs are not executed. Source review 2026-09-14: https://learn.microsoft.com/azure/frontdoor/front-door-caching',
                status: 'source-reviewed'
            }
        },
        'frontdoor-waf': {
            criticalQuestions: [0, 1],
            workedExample: {
                title: 'Distinguish an edge block from an origin rejection',
                scenario: 'A fictional shopper requests shop.example.test/catalog/item-42 with a benign searchLabel field. A synthetic Premium WAF record flags that field under a managed rule. Detection mode logs the match and the origin returns 200. A separate labeled control request represents an input that policy should block; no real attack payload or live endpoint is used.',
                steps: [
                    'Correlate the request marker, policy mode, matched rule, action, and origin status. A rule match in detection mode is not evidence of an enforced block. The baseline has action Log and an origin response, so the shopper request completes despite the diagnostic finding.',
                    'In the prevention fixture, request learn-waf-02 has WAF action Block, edge status 403, and no corresponding origin request in the complete toy trace. A different 403 with an origin record and no blocking WAF action belongs to another hypothesis, such as application authorization.',
                    'Review the false positive before broadening policy. Prefer correcting input handling where possible; if an exclusion is justified, limit it to the specific field and managed rule supported by the policy. Do not assume a field exclusion can be scoped by arbitrary URL conditions, or disable an entire rule group to unblock one label.',
                    'Replay the synthetic benign case and a control in an unexcluded sensitive field. The revised fixture allows the benign label and still blocks the control. Inputs inside the excluded field remain a residual risk, so document that boundary, the rollback trigger, and the difference between Standard custom rules and Premium managed capabilities.'
                ],
                result: 'The review identifies an actual edge block from a correlated prevention action, not from HTTP 403 alone. The bounded tuning proposal preserves a blocking control and records what the exclusion no longer inspects. It supplements the existing WAF exercise with evidence for both a false positive and a policy regression risk, without executing either request.'
            },
            prediction: {
                prompt: 'A complete synthetic trace for learn-waf-02 has valid client TLS, prevention mode, WAF action Block, edge status 403, and no origin request. Which explanation fits this particular request?',
                options: ['An origin TCP timeout produced the logged WAF action.', 'A cache miss always returns 403 before contacting an origin.', 'The WAF produced the 403 before this request reached the origin.'],
                correct: 2,
                explanation: 'The correlated blocking WAF action identifies the edge decision in this fixture. The status code by itself would be ambiguous: origins can also return 403. In real evidence, account for logging configuration and completeness before using an absent origin record as confirmation.'
            },
            transfer: {
                prompt: 'The unseen change puts both the benign label and a must-block control in the same candidate excluded field. Reassess the proposed exclusion and the detection-to-prevention release gate without turning off the whole managed rule group.',
                checks: ['Compare pre/post policy outcomes for both labeled fixtures and record the newly uninspected control as a regression.', 'Propose narrower application handling or supported policy isolation, explicitly checking whether the required exclusion scope exists.', 'Record policy mode, rule/action, request correlation, residual risk, and a rollback threshold rather than using a 403 count alone.']
            },
            exemplar: {
                artifact: 'Illustrative WAF tuning review',
                sample: 'FICTIONAL evidence: detection/Log -> origin 200; prevention/Block learn-waf-02 -> edge 403, no origin row in the complete fixture. Per-rule searchLabel exclusion allows the benign case; an unexcluded control stays blocked. Limitations: the excluded field has residual inspection risk, fixture matches are illustrative, and no real rule sensitivity or log completeness was measured.',
                scores: [3, 3, 2, 3],
                rationale: 'Correctness 3: separates mode, rule match, and block attribution. Evidence 3: includes a benign case, blocking control, and correlated origin outcome. Judgment 2: residual exclusion risk still needs acceptance and broader controls. Communication 3: states what changed and what remains unproven without claiming a fully validated WAF.'
            },
            lab: {
                mode: 'artifact',
                environment: 'Subscription-free review of normalized WAF and origin records. Shell: PowerShell 7 optional for local notes. Dependencies: none; labeled synthetic requests replace live payloads.',
                expected: 'A policy matrix separates detection matches, prevention blocks, and origin-generated 403s and rejects a tuning change that allows a must-block control.',
                failure: 'Disabling a whole rule group to fix one field or treating every 403 as a WAF block fails the competing-hypothesis and security regression checks.',
                verify: ['Join the synthetic request marker with mode, matched rule, action, and origin result.', 'Compare both benign and must-block controls before and after the narrow change.', 'Record supported exclusion scope, residual risk, log completeness assumptions, and a concrete rollback condition.'],
                cleanup: ['Local: retain the synthetic policy matrix, then remove discarded labeled payload notes.', 'Optional Azure execution: after approval, stop test requests and restore the prior policy before removing owned policy/domain associations and dedicated WAF resources; then remove approved diagnostics.', 'Verify local scratch payload notes are absent; after cloud work confirm expected policy protection and owned inventory cleanup, with sensitive-log retention explicitly reviewed.'],
                cost: 'Local route: $0. Optional Azure execution requires separate approval, region/origin SKU and Front Door Premium tier estimates, and a 60-minute test window. WAF requests, origins, and retained log ingestion/storage may bill until their respective cleanup completes.',
                safety: 'Synthetic labeled cases only; no workplace/customer request bodies, identifiers, or credentials. Do not send security probes to public systems or retain real sensitive payloads. Cloud testing is not executed. Source review 2026-09-14: https://learn.microsoft.com/azure/frontdoor/secure-front-door',
                status: 'source-reviewed'
            }
        },
        'network-architecture': {
            criticalQuestions: [2, 4],
            workedExample: {
                title: 'An inspection diagram must match the effective routes',
                scenario: 'The fictional shop.example.test design uses hub 10.10.0.0/16 with firewall 10.10.0.4, DNS, and a hybrid gateway; spokes 10.20.0.0/16 and 10.30.0.0/16 host application tiers. A synthetic review finds direct spoke peering plus only a default 0.0.0.0/0 route to the firewall. The diagram claims that every interspoke request is inspected.',
                steps: [
                    'Trace API 10.20.1.4 to inventory VM 10.30.1.5. The direct peering system route for 10.30.0.0/16 is more specific than the default UDR. This packet bypasses the firewall even though an internet-bound request from the same VM follows the appliance path.',
                    'Choose deliberately between direct communication and centralized inspection. For the inspected fixture, add the intended 10.30.0.0/16 user route through 10.10.0.4 and the corresponding return direction for 10.20.0.0/16. Include reachable appliance next hops, forwarded-traffic permissions, and firewall policy; a drawn hub is not automatic transit.',
                    'Compare a small self-managed hub-spoke design with Virtual WAN for a larger branch estate. Managed connectivity can reduce configuration burden, but route intent, supported services, operational skills, migration effort, and hub/data-processing costs still need review. Do not select either topology from a service-count slogan.',
                    'Apply a regional failure to the shop request. Global Front Door can select a surviving origin, but an application in that region can still depend on DNS or inventory in the failed hub. A real resilience claim needs a valid surviving private dependency path and data readiness, not only a second public endpoint.'
                ],
                result: 'The review disproves universal inspection using a specific /16 route, then supplies a symmetric inspected alternative and a failure-domain dependency map. The recommended design is conditional on the inspection and operating requirements. Its concrete acceptance gate is matching forward/return path evidence and a usable regional dependency, rather than a tidy topology picture.'
            },
            prediction: {
                prompt: 'A changed fixture has only hub-to-spoke peerings, no direct spoke peering, no gateway transit for this traffic, and no appliance/UDR transit configuration. What should an API-to-inventory request between the two spokes do?',
                options: ['No automatic spoke-to-spoke transit exists; the intended path is incomplete.', 'It always crosses the hub because connected peerings are transitive.', 'It is automatically inspected because the hub contains a firewall resource.'],
                correct: 0,
                explanation: 'VNet peering is nontransitive. Merely having two connected peerings and a firewall in the hub does not configure a forwarding path through it. Establish the intended connectivity, routes, permissions, and return path before predicting successful interspoke traffic.'
            },
            transfer: {
                prompt: 'The unseen expansion adds forty branches and a requirement that the secondary region operate during a complete primary-hub failure. Extend the existing architecture decision with a hub-spoke versus Virtual WAN comparison and a dependency-level failover gate.',
                checks: ['Compare operational ownership, supported routing intent, service dependencies, and region/SKU cost assumptions without inventing a universal branch threshold.', 'Show every forward/return inspection route and one deliberate bypass negative case.', 'Trace the secondary origin through surviving DNS, inventory, and management dependencies; record any shared primary dependency as an unresolved availability risk.']
            },
            exemplar: {
                artifact: 'Illustrative network topology decision',
                sample: 'FICTIONAL finding: direct spoke /16 peering route beats default firewall UDR, so the diagram overstates inspection. Proposed matching /16 UDRs in both directions plus policy evidence. Limitations: no observed failover, a shared inventory dependency remains, and the forty-branch Virtual WAN operating/cost comparison has not been completed.',
                scores: [3, 3, 2, 3],
                rationale: 'Correctness 3: identifies the actual route selection and nontransitivity. Evidence 3: a concrete tuple contradicts the broad diagram claim. Judgment 2: the regional dependency and operating model are still open. Communication 3: offers a bounded correction and a conditional recommendation rather than an unsupported architecture endorsement.'
            },
            lab: {
                mode: 'artifact',
                environment: 'Subscription-free architecture decision and flow matrix. Shell: PowerShell 7 optional for local notes. Dependencies: none; use embedded synthetic topologies and route records.',
                expected: 'The decision packet identifies a default-route inspection bypass and includes a symmetric alternative, operating-model comparison, and regional dependency gate.',
                failure: 'A diagram claiming all traffic crosses a hub firewall without destination-specific route evidence fails even when the firewall resource exists and peerings are connected.',
                verify: ['Trace one interspoke and one internet-bound tuple in both directions.', 'Compare direct connectivity with explicit inspected transit and name the rejected option reason.', 'Apply primary-hub failure to the entire application dependency chain, not only Front Door origin selection.'],
                cleanup: ['Local: retain the synthetic design decision, then remove abandoned topology drafts.', 'Optional Azure execution: after approval, stop clients, restore test route/peering changes before deleting owned spokes, then remove dedicated shared-service dependencies and hubs in reverse dependency order.', 'Verify local drafts are absent; after cloud work confirm owned hub/spoke inventory is empty and gateway, firewall, public-IP, and retained log resources are checked separately.'],
                cost: 'Local route: $0. Optional Azure execution requires approval, region/SKU estimates for the chosen topology only, and a 2-hour post-provisioning exercise target. Hubs, gateways, firewalls, data processing, and retained logs/storage can outlive the session; no fixed-price or free-tier promise is made.',
                safety: 'Synthetic enterprise requirements only; no workplace/customer topology, identifiers, or credentials. Shared infrastructure is outside scope and cloud experiments are not executed. Source review 2026-09-14: https://learn.microsoft.com/azure/virtual-network/virtual-networks-udr-overview',
                status: 'source-reviewed'
            }
        },
        'az104-practice': {
            criticalQuestions: [0, 1, 5],
            workedExample: {
                title: 'Rank hypotheses from an incomplete incident trace',
                scenario: 'In a fictional incident, shop.example.test returns an application 503 after the edge has accepted TLS and WAF has allowed the request. Origin HTTP logs show the same synthetic request marker, so the origin was reached. API VM 10.20.1.4 then attempts inventory.internal.example.test, but its guest resolver returns old public address 198.51.100.90 instead of 10.20.2.5.',
                steps: [
                    'List competing hypotheses before changing controls: public DNS failure, edge WAF block, origin TLS failure, stale private dependency resolution, and database authorization. The successful client TLS, WAF Allow, and correlated origin HTTP row weaken the first three for this request, though they say nothing about unrelated traffic.',
                    'Compare resolver viewpoints. The guest still uses retired custom resolver 10.20.0.10, whose fixture answers the old public destination. Approved hub resolver 10.10.2.4 returns 10.20.2.5. The service public path is intentionally denied, so opening it would mask the DNS defect and weaken the boundary.',
                    'Inspect the intended private flow before proposing a fix. The synthetic private next hop is valid, the relevant TCP/1433 rule permits the API, and the guest listener exists. These observations support a bounded guest resolver/configuration refresh rather than broad NSG or public-access changes.',
                    'Apply the correction only to the tabletop snapshot, then compare a fresh lookup, private connection, and uncached application result. The new fixture answers 10.20.2.5 and returns HTTP 200 with item-42/AUD 49. Keep the original error and the alternative hypotheses in the evidence packet.'
                ],
                result: 'The supported diagnosis is stale dependency resolution at the guest, not a Front Door WAF block. The evidence connects one browser request to its downstream DNS and connection path, and the proposed mitigation preserves public-service denial. It is a synthetic incident drill; no guest settings or production traffic were changed.'
            },
            prediction: {
                prompt: 'A new synthetic incident returns 403 with a correlated origin access record and application authorization denial; WAF shows Allow and both TLS legs succeeded. Which hypothesis should lead the next investigation?',
                options: ['An edge certificate failure prevented any HTTP from reaching the origin.', 'Origin application authorization rejected the request after the network path succeeded.', 'An NSG deny generated the application authorization record without delivering the request.'],
                correct: 1,
                explanation: 'The same-request origin authorization record is direct evidence of an application decision after the HTTP request arrived. WAF Allow and valid TLS support that path. Changing NSGs or certificate settings is not a justified response to this observed denial.'
            },
            transfer: {
                prompt: 'The unseen incident has correct private DNS but a Next Hop result of None for the inventory address, while IP Flow Verify says Allow. Build a timed evidence plan that distinguishes routing, filtering, and the application without opening public database access.',
                checks: ['Rank at least three hypotheses and record the exact observation that weakens or supports each.', 'Show why an NSG allow does not create a route and identify the destination-specific route that drops the packet.', 'Write a bounded mitigation, expected fresh-connection result, rollback trigger, and a short statement of what remains unverified.']
            },
            exemplar: {
                artifact: 'Illustrative timed incident evidence',
                sample: 'FICTIONAL incident: client TLS valid; WAF Allow; origin received learn-incident-01; guest DNS 10.20.0.10 returns old public 198.51.100.90. Approved resolver returns private 10.20.2.5. Keep public access denied and correct the guest resolver path. Limitations: tabletop correlation only; no measured recovery time, guest change, or database authorization test.',
                scores: [3, 3, 3, 3],
                rationale: 'Correctness 3: follows the successful boundaries to the actual stale resolver. Evidence 3: uses correlated request and DNS viewpoints rather than a status code alone. Judgment 3: preserves the service boundary and retains alternatives. Communication 3: states the bounded next action but needs measured recovery and an operational owner for a real incident.'
            },
            lab: {
                mode: 'artifact',
                environment: 'Subscription-free timed incident tabletop, using a text editor and clock. Shell: PowerShell 7 optional for local notes. Dependencies: none; no real logs, guest access, or cloud commands are needed.',
                expected: 'A hypothesis table and correlated trace locate stale guest DNS, preserve public-service denial, and distinguish the changed routing failure from an NSG allow result.',
                failure: 'Opening database public access or disabling WAF without matching evidence repairs the wrong boundary and cannot qualify as a successful diagnosis.',
                verify: ['Correlate one request across edge, origin, resolver, and dependency records.', 'Record at least one rejected hypothesis and its disconfirming evidence.', 'Compare the proposed fresh-connection result with a rollback condition and clearly mark synthetic elapsed times.'],
                cleanup: ['Local: retain the synthetic incident note, then delete scratch hypotheses and timer notes.', 'Optional Azure execution: after approval, stop tests and restore any scoped guest/DNS/routing changes before removing dedicated clients, diagnostics, and lab resources.', 'Verify scratch notes are absent; after cloud work confirm baseline connectivity, intended access restrictions, and owned inventory cleanup with retained incident logs reviewed separately.'],
                cost: 'Local route: $0. Optional Azure execution requires approval, region and test VM/service SKU estimates, and a 60-minute incident window. Retained disks, monitoring ingestion, storage, and gateways may continue billing beyond the timer or VM stop.',
                safety: 'Synthetic incident records only; no workplace/customer logs, identifiers, credentials, or private packet content. Real incident systems are not queried and cloud validation is not executed. Source review 2026-09-14: https://learn.microsoft.com/azure/virtual-network/virtual-networks-udr-overview and https://learn.microsoft.com/azure/virtual-network/network-security-group-how-it-works',
                status: 'source-reviewed'
            }
        },
        'azure-firewall': {
            criticalQuestions: [0, 1, 3],
            workedExample: {
                title: 'A broad network allow defeats the intended domain filter',
                scenario: 'The fictional shop.example.test API at 10.20.1.4 sends outbound HTTPS through firewall 10.10.0.4. Its synthetic policy should allow pricing.example.test at 203.0.113.200 and deny telemetry.example.test at 203.0.113.201. However, a network rule permits this source to Any destination on TCP/443 before an application rule allows only the pricing hostname.',
                steps: [
                    'Verify that the effective route actually reaches the firewall and that the source NSG allows the intended flow. A policy resource that no packets traverse cannot enforce the diagram. In this fixture the next hop is correct, so inspect the policy decision rather than adding another default route.',
                    'Evaluate rule types in the documented processing order, including parent-policy precedence where present. A matching terminating network allow is evaluated before the application rules. Consequently both destinations are admitted here; the pricing-only application rule does not narrow traffic already permitted by the broad TCP rule.',
                    'Remove the overbroad allowance from the proposed policy while preserving explicitly required infrastructure dependencies. The revised synthetic application rule permits HTTPS for pricing.example.test, while the telemetry connection has no matching allow and is denied. Do not assume an NSG allow can override the firewall decision.',
                    'Trace the return as well. This public egress fixture uses firewall source 198.51.100.70 and no firewall-subnet NAT Gateway, so replies return through its state. For private network-rule traffic, source preservation and routing can differ; inspect both paths rather than assuming public SNAT behavior for every destination.'
                ],
                result: 'The original policy allows two destinations despite its domain-filter intent; the corrected fixture allows pricing and denies telemetry with named rule evidence. The result ties routing, rule processing, and reply handling together. It rejects adding broad TCP permission to fix an application-rule miss and does not confuse edge WAF protection with VM outbound policy.'
            },
            prediction: {
                prompt: 'The API NSG allows TCP/443 and the effective route reaches Azure Firewall, but there is no matching firewall allow rule for the fictional destination. What should the new outbound connection do?',
                options: ['Succeed because an NSG allow outranks firewall policy globally.', 'Fail at the firewall implicit deny despite the NSG allowance.', 'Bypass inspection automatically through the source subnet NAT Gateway.'],
                correct: 1,
                explanation: 'Each enforcement point must permit the traffic. An NSG allow does not override Azure Firewall policy, and NAT does not replace route selection. With this route and no matching allow rule, the firewall denies the new connection; correlate the rule decision before changing policy.'
            },
            transfer: {
                prompt: 'An unseen parent policy contains the broad TCP/443 network allow while a child policy tries to restrict domains. The team also adds a private branch destination with a direct return route. Review both defects and propose a bounded approval-dependent correction.',
                checks: ['Record which parent/type rule terminates evaluation and why a later child application restriction cannot undo it.', 'Produce pricing-allow and telemetry-deny control rows for the revised policy without dropping required infrastructure flows.', 'Draw the private forward and return paths, distinguishing private source preservation from public SNAT and naming the required route correction.']
            },
            exemplar: {
                artifact: 'Illustrative firewall design review',
                sample: 'FICTIONAL policy result: API -> pricing and telemetry both match Network Allow TCP/443 Any; pricing-only Application rule is never decisive. Revised proposal removes that broad match; pricing allowed, telemetry implicit deny. Limitations: no live policy deployment, TLS inspection, capacity test, or proof of private return-path symmetry.',
                scores: [3, 3, 3, 2],
                rationale: 'Correctness 3: gets terminating network/application behavior and independent NSG enforcement right. Evidence 3: compares intended and actual rule matches with a negative destination. Judgment 3: preserves required dependencies and flags private return routing. Communication 2: the proposal needs named parent-policy ownership and an approved change window.'
            },
            lab: {
                mode: 'artifact',
                environment: 'Subscription-free firewall policy and route review. Shell: PowerShell 7 optional for local notes. Dependencies: none; use normalized synthetic rule decisions and addresses, with no outbound probes.',
                expected: 'A before/after policy matrix explains why both hosts originally pass and why only pricing passes after the bounded proposal, plus a checked reply path.',
                failure: 'A later application allowlist cannot constrain an earlier matching network allow; assuming that it can leaves the prohibited destination admitted.',
                verify: ['Identify the active next hop before evaluating policy hierarchy and rule type.', 'Compare matched-rule evidence for the intended and negative destinations.', 'Trace public SNAT and a private return path separately, with rollback and dependency-preservation criteria.'],
                cleanup: ['Local: preserve the synthetic rule review, then remove discarded policy sketches.', 'Optional Azure execution: after approval, stop clients and restore route/policy associations before deleting the lab-owned firewall; then remove dedicated policy, public IPs, diagnostics, and subnet dependencies.', 'Verify local scratch policies are absent; after cloud work confirm original policy intent, owned firewall/public-IP inventory removal, and the disposition of retained logs/storage.'],
                cost: 'Local route: $0. Optional Azure execution requires separate approval, firewall region/SKU and data-processing estimates, and a 2-hour post-provisioning target. Firewall hours, test compute, public IPs, and retained telemetry bill independently; stopped VMs do not end firewall charges.',
                safety: 'Synthetic policies and .test hosts only; no workplace/customer rules, payloads, certificates, or credentials. Never disable a shared parent policy for this exercise. Cloud policy work is not executed. Source review 2026-09-14: https://learn.microsoft.com/azure/firewall/rule-processing',
                status: 'source-reviewed'
            }
        },
        'network-watcher': {
            criticalQuestions: [0, 1, 2],
            workedExample: {
                title: 'Choose evidence that answers the next question',
                scenario: 'The inventory dependency for fictional shop.example.test moves to VM 10.30.1.5:1433. Synthetic DNS from API 10.20.1.4 returns that address correctly. IP Flow Verify says Allow for the new TCP tuple, but the application times out. Its effective table includes intended 10.30.0.0/16 through firewall 10.10.0.4 and an accidental user route 10.30.1.5/32 with next hop None.',
                steps: [
                    'Use IP Flow Verify for the question it answers: whether NSG rules permit the specified tuple and which rule matches. Its Allow result does not inspect the whole routing path, the guest listener, or database authorization. It therefore cannot overrule the observed application failure.',
                    'Use a Next Hop/effective-route observation to test the routing hypothesis. The specific /32 selects None, which drops traffic before the intended /16 appliance path can help. The destination here is an ordinary VM, not a Private Endpoint with additional network-policy routing behavior.',
                    'In the corrected tabletop, remove only the unintended /32. The /16 now selects 10.10.0.4; the fixture includes firewall allowance, a matching return route, and a listening inventory service. A fresh connection and uncached shop request succeed. Record those downstream assumptions instead of declaring success from Next Hop alone.',
                    'Choose historical or continuous evidence separately. Use VNet flow logs for supported flow metadata and Connection Monitor for repeated connectivity observations. New NSG flow logs are unavailable; NSG flow logs retire September 30, 2027. Flow records are not packet payloads, and an absent row in an incomplete log window is not proof that no request happened.'
                ],
                result: 'The evidence chain narrows the failure to the /32 drop without collecting payloads or changing an NSG that already permits the tuple. It records a complete corrected path and explains the limits of immediate, historical, and continuous tools. All tool-like fields are normalized synthetic summaries, not claims that Network Watcher or any cloud lab was executed.'
            },
            prediction: {
                prompt: 'The synthetic private DNS answer is correct and IP Flow Verify says Allow, but you suspect a destination-specific UDR drop. Which next observation best distinguishes that hypothesis before considering packet capture?',
                options: ['A Next Hop result and effective-route entry for the exact destination.', 'A screenshot showing that the VM resource page opens.', 'A complete packet payload capture from unrelated production clients.'],
                correct: 0,
                explanation: 'Next Hop and the effective route directly address the suspected routing decision with less data than a packet capture. NSG permission is already a separate observation. After the route is corrected in the fixture, listener, firewall, return routing, and application checks still matter.'
            },
            transfer: {
                prompt: 'The unseen failure has the correct forward /16 route and firewall allow, but the return route bypasses that stateful appliance. Add an immediate and a historical evidence choice, accounting for an empty flow-log window without treating absence as proof.',
                checks: ['Draw both traffic directions with exact addresses, ports, and next hops and identify the bypass.', 'Compare what IP Flow Verify, Next Hop, Connection Monitor, and VNet flow logs can establish, explicitly excluding packet payload or SQL text from flow-log claims.', 'Record log enablement/time-window limits, the NSG flow-log retirement date, and a minimized collection/retention plan with cleanup verification.']
            },
            exemplar: {
                artifact: 'Illustrative Network Watcher evidence pack',
                sample: 'FICTIONAL normalized records: DNS 10.30.1.5; IP Flow Verify Allow; Next Hop None, user /32. Removing that fixture row selects /16 -> 10.10.0.4, with reply and listener assumptions recorded. Limitations: no Azure tool ran, summaries are not raw log schema, and an absent VNet flow-log row cannot establish no traffic without collection/window evidence.',
                scores: [4, 3, 3, 3],
                rationale: 'Correctness 4: separates rule simulation, routing, application connectivity, and flow-log limits. Evidence 3: the exact /32 explains the failure, but all observations are synthetic. Judgment 3: chooses a less invasive check before payload collection and budgets retention. Communication 3: distinguishes source review from actual tool execution.'
            },
            lab: {
                mode: 'artifact',
                environment: 'Subscription-free diagnostic decision worksheet. Shell: PowerShell 7 optional for local notes. Dependencies: none; embedded normalized synthetic records replace Azure tools, KQL queries, and packet capture.',
                expected: 'A tool-choice table and exact /32-versus-/16 lookup explain the failure while retaining NSG Allow and documenting the corrected return path and listener assumptions.',
                failure: 'Declaring end-to-end reachability from IP Flow Verify Allow, or collecting payloads before testing the explicit route hypothesis, fails the bounded evidence requirement.',
                verify: ['Select the diagnostic that directly answers the current hypothesis and record its limits.', 'Match the destination to the /32 None route, then show the corrected /16 and reverse path.', 'Use VNet flow logs for new designs; record that new NSG flow logs are unavailable and retirement is September 30, 2027, without interpreting missing rows as definitive absence.'],
                cleanup: ['Local: retain the synthetic tool-choice matrix, then remove scratch flow summaries.', 'Optional Azure execution: after approval, stop temporary captures/monitors and disable owned flow-log/diagnostic settings before deleting dedicated monitoring resources; handle generated blobs and workspace retention explicitly.', 'Verify no local scratch captures remain; after cloud work confirm owned monitor/flow-log inventory is absent and retained blobs, workspace data, and any ongoing ingestion are accounted for.'],
                cost: 'Local route: $0. Optional Azure execution requires separate approval, a region/SKU estimate for source VMs and monitoring/storage, and a 60-minute collection limit. Stopping a monitor does not delete retained blobs or workspace data; ingestion, storage, and existing resources have independent lifetimes.',
                safety: 'Synthetic packet metadata only; no workplace/customer traces, payloads, or credentials. Cloud tools are not executed. Source review 2026-09-14; owner: academy maintainer; next lifecycle review 2026-10-14. New NSG flow logs are unavailable; use VNet flow logs, with NSG retirement September 30, 2027. https://learn.microsoft.com/azure/network-watcher/nsg-flow-logs-migrate and https://learn.microsoft.com/azure/network-watcher/network-watcher-overview',
                status: 'source-reviewed'
            }
        },
        'capstone-hub-spoke': {
            criticalQuestions: [0, 2],
            workedExample: {
                title: 'Defend the whole request during a regional failure',
                scenario: 'Extend, rather than replace, the existing capstone with fictional shop.example.test. Its evidence packet has valid public DNS, client and origin TLS, WAF controls, protected origins, hub inspection, and separate noncached catalog traffic. The unseen synthetic outage removes the primary region. The secondary origin answers its process-only health probe with 200 but still depends on primary inventory 10.20.2.5.',
                steps: [
                    'Trace a fresh uncached /catalog/item-42 request after origin selection changes. DNS and client TLS still reach Front Door, WAF allows the request, and the secondary origin receives it. Its inventory lookup still resolves to the primary private address, which is unreachable in the outage fixture; the application therefore returns 503.',
                    'Reject the cached-success shortcut. A previously cached product image can remain available while the catalog dependency is broken. The secondary origin health probe checked only its process, so its 200 is not evidence of inventory readiness or a valid region-level recovery objective.',
                    'Review a proposed secondary inventory replica at 10.30.2.5 with reachable DNS, route, firewall, and return path. The synthetic replication record says 90 seconds of lag, while the agreed data-loss tolerance is five seconds. Moving traffic alone would not satisfy that requirement, even if the HTTP status changes to 200.',
                    'Record a release gate: dependency-aware health, verified permitted/denied flows, isolated account caching, replication evidence within tolerance, and an approved failback procedure. Extend the original capstone artifact with the new failure and cleanup evidence instead of treating generated infrastructure or a diagram as independent implementation proof.'
                ],
                result: 'The correct decision is to withhold the regional-readiness claim: the original surviving origin cannot reach inventory, and the proposed replica exceeds the five-second tolerance by 85 seconds. The evidence packet names the blocking dependency and acceptance gate. This is a synthetic design defense, not a completed deployment, measured failover, or independently certified capstone.'
            },
            prediction: {
                prompt: 'After the primary-region outage, a secondary origin has valid TLS and a process-only 200 health probe, but its catalog code still calls unreachable primary inventory. Caching is disabled for this request. What outcome should the capstone defense predict?',
                options: ['A guaranteed catalog 200 because Front Door selected a healthy origin.', 'A guaranteed cache hit because the origin health probe is cacheable.', 'The uncached catalog can fail with 503 despite healthy edge and process-probe observations.'],
                correct: 2,
                explanation: 'Probe health covers only what that probe checks. Front Door can correctly select the secondary while the application fails on a downstream dependency. Dependency-aware readiness and acceptable data replication must be established before claiming regional recovery for the catalog.'
            },
            transfer: {
                prompt: 'Add an unseen capstone requirement: a new branch must reach private inventory during primary-hub loss, and peak API assignments rise from 45 to 75. Extend your existing portfolio with the hybrid/DNS fallback, corrected subnet capacity, and a defensible release gate.',
                checks: ['Calculate that /26 has 59 usable addresses and cannot fit 75; show a nonoverlapping /25 alternative with 123 usable and 48 spare.', 'Trace branch DNS, advertisements, security decisions, and the return path to surviving inventory without assuming hub peering is transitive.', 'Compare uncached catalog, two-identity account, origin-bypass, and replication-lag evidence; label synthetic, self-assessed, or independently reviewed provenance accurately.', 'Append a reverse-dependency teardown plan and confirmation checklist to the existing capstone evidence rather than claiming completion from a portal screenshot.']
            },
            exemplar: {
                artifact: 'Illustrative addendum to the existing capstone portfolio',
                sample: 'FICTIONAL defense: primary loss -> secondary selected -> uncached catalog 503 because inventory 10.20.2.5 is unavailable. Proposed replica 10.30.2.5 is reachable but 90 seconds stale versus five-second tolerance; readiness remains blocked. Limitations: no deployed infrastructure, measured recovery, real replication, external reviewer, or executed cleanup is evidenced by this illustrative artifact.',
                scores: [3, 2, 4, 3],
                rationale: 'Correctness 3: traces the complete dependency failure and computes the 85-second tolerance gap. Evidence 2: the portfolio contains synthetic observations only. Judgment 4: refuses to equate a healthy probe or cached response with acceptable recovery. Communication 3: names the blocking gate clearly but needs implementation owners and independently reviewed operational evidence.'
            },
            lab: {
                mode: 'artifact',
                environment: 'Subscription-free design-defense addendum to the existing capstone. Shell: PowerShell 7 optional for local arithmetic/notes. Dependencies: none; embedded synthetic request, route, and lag snapshots provide the analysis route.',
                expected: 'An evidence addendum identifies the primary inventory dependency, rejects 90-second lag against five-second tolerance, and includes an unseen capacity/branch variation with bounded cleanup planning.',
                failure: 'Declaring the capstone recovered from a process probe or cached image ignores the uncached application failure; accepting 90-second lag also violates the explicit data objective.',
                verify: ['Trace the entire fresh request and every private dependency through the selected surviving region.', 'Calculate the lag shortfall and changed address demand, with both successful and failed control cases.', 'Review the existing portfolio for routing, TLS, origin protection, caching, observability, cost, and accurate evidence provenance; do not replace its original labs.', 'Record a release blocker, a later reviewer gate, and the cleanup confirmation needed before any separately approved execution can be called complete.'],
                cleanup: ['Local: retain the synthetic addendum with the existing capstone evidence, then remove disposable topology and lag drafts.', 'Optional Azure execution: after separate approval, stop all test traffic and collection, remove test DNS/domain/route associations, then delete owned applications, endpoints, NICs, and disks before their network dependencies.', 'For an approved cloud teardown, detach owned route and peering dependencies before deleting dedicated Bastion/NAT/firewall/VPN components, then remove owned public IPs, subnets, VNets, and diagnostics; retain only explicitly approved evidence.', 'Verify scratch drafts are absent; after cloud work reconcile the complete owned inventory to zero remaining resources, check dangling DNS and temporary access, and separately confirm retained blobs/workspace data and any external circuit obligations.'],
                cost: 'Local route: $0. Optional Azure execution requires separate approval and a two-region/SKU cost worksheet for origins, Front Door tier, gateways, firewall, management, and telemetry. Target a 2-hour exercise after provisioning, with a funded allowance for slower deletion; retained disks/logs/storage, data transfer, and carrier obligations may outlive that window.',
                safety: 'Use only synthetic .test names, private/TEST-NET addresses, replica values, and fictional identities; never include workplace/customer topology, traffic, or credentials. No resources, cloud tests, or cleanup were executed; cloud work is not executed. Source review 2026-09-14: https://learn.microsoft.com/azure/frontdoor/secure-front-door and https://learn.microsoft.com/azure/virtual-network/virtual-networks-udr-overview',
                status: 'source-reviewed'
            }
        }
    }
});