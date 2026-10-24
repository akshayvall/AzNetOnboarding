/* Authored first-pass lessons. Minutes are study estimates, not measured outcomes.
 * Browser classic-script binding plus CommonJS export; no learner state lives here.
 * Technical references remain in modules-*.js. DiagramCatalog carries visual sources.
 * Current-source checks, 2026-10-24:
 * https://learn.microsoft.com/azure/frontdoor/front-door-routing-architecture
 * https://learn.microsoft.com/azure/frontdoor/apex-domain
 * https://learn.microsoft.com/azure/virtual-network/ip-services/private-ip-addresses
 * https://learn.microsoft.com/azure/load-balancer/load-balancer-overview
 */
const ACADEMY_UNITS = {
    'net-fundamentals': [
        {
            id: 'names-before-connections', title: 'How does a name find the shop?', minutes: 8,
            outcome: 'Explain why finding an address is different from receiving a page.',
            paragraphs: [
                'Imagine opening shop.example.com to buy a notebook. Your browser knows a name, but a network connection needs an IP address: a destination label that devices can route toward. DNS, the Domain Name System, helps translate the name. A recursive resolver is a service that finds answers for your device. When it has no usable cached answer, it follows referrals from other DNS servers until it reaches the authority for the name.',
                'Those DNS servers do not fetch the notebook page. They return information to the resolver, which answers your device. A cache stores an answer temporarily so later lookups can avoid repeating the search. Once an address is available, the browser still has to connect and request the page. A correct DNS answer therefore does not prove that the shop is working.'
            ],
            example: { title: 'The address is not the purchase', text: 'A directory helper (a DNS resolver) finds the shop’s address for your browser; it does not run the shop. Even with the right address, a stopped shop application cannot return a page.' },
            diagram: { type: 'dns-resolution', scenario: 'cold' },
            activity: { prompt: 'Trace who follows a referral to the next DNS server.', options: ['The recursive resolver follows it', 'The shop application follows it'], correct: 0, explanation: 'The resolver follows referrals on behalf of the device; the shop application is not involved in this lookup.' },
            checks: [
                { question: 'What does a successful name lookup give the browser?', options: ['A completed notebook order', 'Information for finding the destination'], correct: 1, explanation: 'DNS supplies addressing information, not the application response.' },
                { question: 'The resolver now has a valid cached answer. What changes?', options: ['It can answer without repeating the hierarchy lookup', 'It must fetch the shop page before answering'], correct: 0, explanation: 'A usable cached DNS answer avoids the repeated lookup, not the separate web request.' }
            ],
            teachBack: { prompt: 'Explain DNS to someone who thinks it delivers the page.', example: 'DNS helps me find the shop address. Connecting and asking for the page happen afterward.' },
            takeaway: 'Finding a destination is only the first step.'
        },
        {
            id: 'connections-before-requests', title: 'What does connecting actually prove?', minutes: 8,
            outcome: 'Distinguish a TCP connection, a TLS handshake, and an HTTP response.',
            paragraphs: [
                'After finding the shop address, consider an HTTPS connection using TCP. TCP is a transport protocol that provides an ordered stream of bytes. The client and server first exchange messages to establish the connection. In the diagram, the client asks to connect, the server acknowledges, and the client acknowledges back. This exchange proves that this connection can be established; it does not prove the shop can process an order.',
                'TLS, Transport Layer Security, then protects the conversation and lets the client validate the server certificate. HTTP is the request-and-response language used to ask for a page. These are different jobs: transport, protection, and application meaning. If certificate validation fails, the browser can stop before sending the ordinary HTTP request. This TCP example is not universal: HTTP/3 uses QUIC over UDP instead.'
            ],
            example: { title: 'A reachable but untrusted shop', text: 'TCP succeeds, but the certificate names another site. The browser rejects the protected connection instead of treating reachability as proof of identity.' },
            diagram: { type: 'tcp-handshake', scenario: 'connect' },
            activity: { prompt: 'The TCP handshake succeeds. Choose what is established so far.', options: ['The order is guaranteed to complete', 'A transport connection is established'], correct: 1, explanation: 'A TCP handshake establishes transport, not application success or certificate validity.' },
            checks: [
                { question: 'Which job does TLS add to this TCP shop connection?', options: ['Protection and certificate-based server validation', 'A replacement for every DNS lookup'], correct: 0, explanation: 'TLS protects the conversation and supports server identity validation; DNS has a separate job.' },
                { question: 'The certificate becomes invalid while TCP still works. What should you predict?', options: ['The browser must accept the order anyway', 'The browser may stop before the HTTP request'], correct: 1, explanation: 'Successful transport does not override failed certificate validation.' }
            ],
            teachBack: { prompt: 'Describe the three jobs without using protocol numbers.', example: 'First establish a conversation, then protect and validate it, then ask the application for something.' },
            takeaway: 'A successful connection is not a successful request.'
        },
        {
            id: 'follow-the-response-home', title: 'How does the reply get back?', minutes: 10,
            outcome: 'Trace both directions of a direct request and explain why a timeout is ambiguous.',
            paragraphs: [
                'A request to the shop travels toward its destination in packets, small pieces of network traffic. Routers choose a next hop: where to send a packet next. The shop server must receive the request, process it, and send a response. That response also needs a working route and permission to travel. A diagram that stops at the server leaves half the conversation unexplained.',
                'The direct VM example has no Front Door proxy in the middle. If a home router translates a private source address into a public address, it keeps a mapping so returning traffic can find the original device. That translation is called NAT. A missing return route or lost mapping can prevent a reply even after the server saw the request. A browser timeout alone therefore cannot tell you which direction or component failed.'
            ],
            example: { title: 'The shop heard you', text: 'The server logs a request, but the reply cannot reach the client. Investigate the response path rather than assuming DNS never worked.' },
            diagram: { type: 'packet-journey', scenario: 'direct' },
            activity: { prompt: 'Point to what the request-only sketch is missing.', options: ['The route for the response back to the client', 'A mandatory cache inside every router'], correct: 0, explanation: 'A complete conversation requires the reply to travel successfully too.' },
            checks: [
                { question: 'What is a next hop in the direct shop path?', options: ['The next product in the shopping cart', 'The next destination used to forward a packet'], correct: 1, explanation: 'Routing chooses where to forward packets, not which application operation to perform.' },
                { question: 'The server receives the request but its return route breaks. What can the shopper see?', options: ['A timeout despite successful request delivery', 'Guaranteed success because the request arrived'], correct: 0, explanation: 'Delivery to the server is insufficient when the reply cannot return.' }
            ],
            teachBack: { prompt: 'Explain why a timeout needs more evidence.', example: 'The request, processing, or reply could have failed. I would locate the last confirmed step in both directions.' },
            takeaway: 'Always draw the way back.'
        }
    ],
    'azure-environment': [
        {
            id: 'where-resources-belong', title: 'Where does the shop live in Azure?', minutes: 8,
            outcome: 'Explain the difference between an identity boundary and a resource container.',
            paragraphs: [
                'Before building the shop network, separate the people who manage it from the resources they manage. A Microsoft Entra tenant is an identity boundary containing users and application identities. A subscription provides a billing and management boundary for Azure resources. A resource group collects resources you want to manage together, such as a fictional shop network and its test machines.',
                'These containers organize ownership, access, and lifecycle; they are not routers that carry a customer request. Putting two machines in the same resource group does not connect their networks. Deleting a resource group can delete its contained resources, so a practice group should not contain unrelated systems. First identify the intended subscription and group. Then reason separately about addresses, routes, and traffic permissions for the shop.'
            ],
            example: { title: 'Same folder, different networks', text: 'Two VMs share a resource group but sit in disconnected VNets. The group helps manage them; it does not create a network connection.' },
            diagram: { type: 'azure-hierarchy', scenario: 'organize' },
            activity: { prompt: 'Place the practice shop resources in the right kind of container.', options: ['A DNS response', 'A resource group in the chosen subscription'], correct: 1, explanation: 'A resource group organizes resources within a subscription; DNS answers names.' },
            checks: [
                { question: 'Which boundary contains the identities that manage the shop?', options: ['The Microsoft Entra tenant', 'The TCP connection'], correct: 0, explanation: 'The tenant contains identities, while TCP carries a transport conversation.' },
                { question: 'Both shop VMs move into one resource group. What is not established by that move?', options: ['A shared management container', 'Network reachability between the VMs'], correct: 1, explanation: 'Resource grouping does not create routes or network permissions.' }
            ],
            teachBack: { prompt: 'Explain the hierarchy without describing it as a packet path.', example: 'The tenant holds identities, subscriptions organize billing and management, and resource groups collect related resources.' },
            takeaway: 'Resource organization and network connectivity are different maps.'
        },
        {
            id: 'permission-is-not-reachability', title: 'Can I change it, or can I reach it?', minutes: 10,
            outcome: 'Distinguish management permission from permission for network traffic.',
            paragraphs: [
                'Suppose you can open the shop resource in the Azure portal but cannot change its network settings. Role-based access control, or RBAC, determines which management actions your identity can perform at a scope. A Reader can inspect resources without becoming their editor. Azure Policy can also restrict which configurations may be created. These checks concern management requests sent to Azure.',
                'Customer traffic uses the data path: the connections carrying page requests and replies. Network rules, routing, and application authentication govern that path. Granting someone a management role does not automatically open an application port, and an application responding does not prove that person can edit its network. If an update is denied, investigate the identity, role scope, and policy before changing traffic rules. Existing customer connections may remain unaffected.'
            ],
            example: { title: 'A denied edit, a working shop', text: 'A Reader receives an authorization error when editing an NSG. Shoppers still receive pages through the unchanged configuration.' },
            diagram: { type: 'azure-hierarchy', scenario: 'organize' },
            activity: { prompt: 'A portal update says authorization failed. Which evidence comes first?', options: ['Identity and management role scope', 'The color of the shop logo'], correct: 0, explanation: 'The failing action is a management operation, so start with its identity and authorization scope.' },
            checks: [
                { question: 'Does Reader access normally grant permission to edit an NSG?', options: ['Yes, viewing always permits editing', 'No, inspection and editing are different permissions'], correct: 1, explanation: 'RBAC distinguishes read operations from configuration changes.' },
                { question: 'An administrator gains an editing role. What does that alone not prove?', options: ['That customer traffic can reach the shop application', 'That the assigned role has a management scope'], correct: 0, explanation: 'A management role does not establish the separate data path.' }
            ],
            teachBack: { prompt: 'Explain the two questions you would ask about access.', example: 'Can this identity perform the Azure operation? Separately, can this client reach and use the application?' },
            takeaway: 'Diagnose the kind of access that actually failed.'
        },
        {
            id: 'separate-failure-locations', title: 'What survives a location failure?', minutes: 10,
            outcome: 'Predict the difference between zone and region failure coverage.',
            paragraphs: [
                'A region is a geographic area where Azure offers services. Availability zones are separate datacenter groups within a supported region, designed with independent power, cooling, and networking. For the shop, spreading supported components across zones can reduce dependence on one local datacenter group. Merely selecting a region does not mean every resource is automatically distributed across its zones.',
                'A second region addresses a different failure boundary. It can help when an entire primary region is unavailable, but only if the application, data, routing, and operations are designed for that move. A second empty network cannot serve a purchase by itself. Define the failure you want to tolerate, then identify every dependency needed for checkout. Geography is a design input, not a guarantee that the complete application will recover.'
            ],
            example: { title: 'A spare place without a shop', text: 'A second-region VNet exists, but no application or replicated data is deployed there. It cannot take over checkout merely because it appears on the diagram.' },
            diagram: { type: 'azure-regions', scenario: 'resilience' },
            activity: { prompt: 'The requirement is to withstand one zone failure. What should you examine?', options: ['Only whether the resource group has a friendly name', 'Whether critical components are distributed across supported zones'], correct: 1, explanation: 'Zone resilience depends on the actual deployment of critical components.' },
            checks: [
                { question: 'What boundary separates availability zones in this lesson?', options: ['Independent datacenter groups within a region', 'Individual products in a cart'], correct: 0, explanation: 'Zones provide a local infrastructure failure boundary within a region.' },
                { question: 'The whole primary region fails. Are replicas only in its zones sufficient?', options: ['Yes, zones always belong to different regions', 'No, region failure requires a broader recovery design'], correct: 1, explanation: 'Zones inside the same region do not constitute a second-region recovery plan.' }
            ],
            teachBack: { prompt: 'Explain why two locations are not automatically a recovery plan.', example: 'The second location needs the application, usable data, routing, and a tested way to take traffic.' },
            takeaway: 'Choose the failure boundary before choosing redundancy.'
        }
    ],
    'azure-vnets': [
        {
            id: 'plan-room-for-addresses', title: 'How much address room does the shop need?', minutes: 10,
            outcome: 'Explain how non-overlapping subnets support a growing network plan.',
            paragraphs: [
                'An Azure virtual network, or VNet, gives the shop a private address space. A subnet divides that space into a smaller range for a group of resources. Think of one neighborhood with different streets, not separate internet connections. Each subnet must fit inside the VNet range and must not overlap another subnet in that VNet. Addresses identify resources; their labels do not describe application permissions.',
                'Plan enough room for growth and for services that require dedicated subnets. A very small subnet can run out of usable addresses even while the wider VNet has space. Also compare the plan with networks you may connect later, such as another shop region or an office. Overlapping ranges make direct connectivity ambiguous and can block peering. Choosing distinct ranges early is easier than renumbering deployed systems later.'
            ],
            example: { title: 'Two streets with the same numbers', text: 'The office and shop both use the same address range. Before connecting them, resolve the overlap rather than assuming a new connection makes addresses unique.' },
            diagram: { type: 'vnet-architecture', scenario: 'tiers' },
            activity: { prompt: 'A future shop service needs its own subnet. What is the useful planning move?', options: ['Leave suitable unused address space', 'Reuse the existing subnet range as a second subnet'], correct: 0, explanation: 'Unused non-overlapping space supports future subnets; overlapping subnet ranges are invalid.' },
            checks: [
                { question: 'What relationship must a shop subnet have to its VNet address space?', options: ['It must sit outside the VNet', 'It must fit inside the VNet without subnet overlap'], correct: 1, explanation: 'Subnets divide the VNet address space into distinct ranges.' },
                { question: 'The office later needs to peer with the shop but their ranges overlap. What changes?', options: ['The addressing conflict must be resolved before direct peering', 'The resource group names automatically fix the overlap'], correct: 0, explanation: 'Peering requires non-overlapping address spaces; management names do not resolve routing ambiguity.' }
            ],
            teachBack: { prompt: 'Describe what makes an address plan useful beyond today.', example: 'It fits current resources, leaves room for dedicated subnets, and avoids ranges used by networks we may connect.' },
            takeaway: 'Address planning is a future-connection decision.'
        },
        {
            id: 'subnets-need-traffic-policy', title: 'Does a subnet keep the database safe?', minutes: 10,
            outcome: 'Predict why subnet separation alone does not enforce application isolation.',
            paragraphs: [
                'The shop has a web subnet and a data subnet. This organization makes it easier to attach different policies, but it is not automatically a wall. Azure provides system routes between subnets in the same VNet. Without a more restrictive rule, the default network security group rules allow virtual-network traffic. A different subnet name therefore does not mean the web server is blocked from every database port.',
                'An NSG, or network security group, filters connections by properties such as source, destination, protocol, and port. Define only the intended flow: for example, web servers to the database listener. A port identifies a service endpoint on a machine; it is not a user identity. The database must still enforce authentication and authorization. Routing, network filtering, and application access each answer a different part of whether the request should succeed.'
            ],
            example: { title: 'One intended doorway', text: 'The web tier needs the database listener but not remote administration access to the data VM. Permit the required flow rather than relying on subnet labels.' },
            diagram: { type: 'vnet-architecture', scenario: 'tiers' },
            activity: { prompt: 'The data subnet has no restrictive policy. Which assumption should you reject?', options: ['System routes can connect subnets', 'Different subnet names block all traffic automatically'], correct: 1, explanation: 'Subnet separation is an organization boundary, not an automatic deny rule.' },
            checks: [
                { question: 'What should enforce the intended web-to-database network flow?', options: ['Explicit traffic policy such as NSG rules', 'The word data in the subnet name'], correct: 0, explanation: 'Filtering rules evaluate traffic; names do not.' },
                { question: 'The database port is now reachable. What must the database still check?', options: ['Whether the subnet name is short enough', 'Whether the application is authenticated and authorized'], correct: 1, explanation: 'Network reachability does not grant application-level permission.' }
            ],
            teachBack: { prompt: 'Explain the difference between a subnet boundary and a security rule.', example: 'A subnet groups addresses. A rule decides which connections may cross the relevant filtering point.' },
            takeaway: 'Separate the tiers, then explicitly control their conversations.'
        },
        {
            id: 'connect-beyond-the-vnet', title: 'How does the shop reach outside?', minutes: 10,
            outcome: 'Distinguish private connectivity from an explicit outbound internet path.',
            paragraphs: [
                'The shop VNet is not automatically connected to every other network. Peering can connect compatible VNets privately, while a VPN can connect an office through an encrypted tunnel. These mechanisms create connectivity between defined networks; they do not remove address conflicts or override security rules. A route describes where traffic goes, while a security rule describes whether matching traffic is allowed.',
                'Internet access is another boundary. For a subnet without implicit outbound access, a VM needs an explicit outbound method to download updates. NAT Gateway is one option for providing source-address translation and public egress addresses. An internet route alone does not supply that translation. Conversely, outbound translation does not invite unsolicited inbound connections. When the shop cannot download a package, examine the route, permitted traffic, name resolution, and the actual outbound method instead of assuming every private VM has internet access.'
            ],
            example: { title: 'Private does not mean disconnected', text: 'A shop VM can talk to a peered inventory VNet but cannot download public updates because no explicit outbound method is configured.' },
            diagram: { type: 'natgw', scenario: 'mapped' },
            activity: { prompt: 'A private subnet needs controlled public downloads. Which design question matters?', options: ['Which explicit outbound method will carry them?', 'Which resource group name enables the internet?'], correct: 0, explanation: 'Public egress requires an actual outbound path, not a management label.' },
            checks: [
                { question: 'Does an internet route alone provide source-address translation?', options: ['Yes, routes and translation are identical', 'No, forwarding and translation are separate jobs'], correct: 1, explanation: 'A route chooses a path; an outbound method supplies the required egress behavior.' },
                { question: 'NAT Gateway is added for downloads. What new inbound permission should you assume?', options: ['None for unsolicited incoming connections', 'Every internet client can now initiate a VM session'], correct: 0, explanation: 'NAT Gateway supports outbound flows and their replies, not unsolicited inbound sessions.' }
            ],
            teachBack: { prompt: 'Explain why an internet route can coexist with failed downloads.', example: 'The VM may still lack an explicit outbound method, or DNS or filtering may fail along the path.' },
            takeaway: 'A boundary needs a designed connection, not an assumption.'
        }
    ],
    'nsgs': [
        {
            id: 'first-matching-nsg-rule', title: 'Which traffic rule wins?', minutes: 10,
            outcome: 'Predict the first matching NSG rule for a described new connection.',
            paragraphs: [
                'The shop NSG is a list of network security rules, not a vote between all the rules. For a new connection, Azure evaluates matching properties such as direction, source, destination, protocol, and port. Rules have priorities; smaller numbers are evaluated first. The first matching rule decides whether that traffic is allowed or denied. A later deny does not automatically override an earlier matching allow.',
                'Matching matters as much as order. The Internet service tag represents public internet address space, not every private source. If priority one hundred allows Internet traffic and priority two hundred denies a particular private subnet, a request from that private subnet does not match the first rule. It reaches the deny rule. Always state the actual source and destination before predicting the result; reading only the rule names can produce the wrong answer.'
            ],
            example: { title: 'A private source is not the internet', text: '10.0.1.5 connects on TCP 443. An Internet-source allow does not match it; the later deny for 10.0.1.0/24 does.' },
            diagram: { type: 'nsg-filtering', scenario: 'deny' },
            activity: { prompt: 'A matching allow has priority 100 and a matching deny has priority 200. Predict the decision.', options: ['Allow at priority 100', 'Deny because denial always wins'], correct: 0, explanation: 'The first matching rule wins, and the lower priority number is evaluated first.' },
            checks: [
                { question: 'Which NSG rule decides a new flow when several rules could match?', options: ['Every deny regardless of order', 'The first matching rule in priority order'], correct: 1, explanation: 'NSGs stop at the first applicable rule, rather than combining every action.' },
                { question: 'The source changes from public internet to a denied private subnet. Does the Internet allow still decide?', options: ['No, it no longer matches that source', 'Yes, Internet includes all private addresses'], correct: 0, explanation: 'The private source must be evaluated against the rules that actually include it.' }
            ],
            teachBack: { prompt: 'Talk through the private-source example without saying deny always wins.', example: 'The earlier rule does not match this source. The next applicable rule denies it, so the new connection is denied.' },
            takeaway: 'Find the first match, not the strongest-sounding rule.'
        },
        {
            id: 'both-nsg-boundaries-matter', title: 'Why can one allow still fail?', minutes: 10,
            outcome: 'Explain why a connection must pass both subnet and interface NSGs.',
            paragraphs: [
                'The shop web VM can have an NSG attached to its subnet and another attached to its network interface. An interface is the VM connection to the network. Where both NSGs apply, the traffic must pass both sets of rules. An allow on one is not a permission slip that overrules a deny on the other. For inbound traffic, the subnet filter is evaluated before the interface filter.',
                'Default rules also matter when no custom rule matches. NSGs include defaults allowing virtual-network traffic and denying other unsolicited inbound traffic. A rule list that looks empty of custom entries is therefore not empty of behavior. Inspect the effective rules for the actual VM and flow rather than just the NSG you last edited. Even when both filters permit the connection, the guest firewall and the application listener can still prevent the shop from answering.'
            ],
            example: { title: 'Two doors on the same path', text: 'The interface NSG allows HTTPS, but the subnet NSG denies the client source. The request cannot use the interface allow to bypass the subnet.' },
            diagram: { type: 'nsg-filtering', scenario: 'allow' },
            activity: { prompt: 'The interface says allow and the subnet says deny. Choose the outcome.', options: ['Allow because the interface is closest to the VM', 'Deny because both filters must permit the flow'], correct: 1, explanation: 'Both applicable NSGs must allow the connection.' },
            checks: [
                { question: 'Does removing all custom NSG rules remove the default rules?', options: ['No, default rules still affect traffic', 'Yes, the NSG becomes behavior-free'], correct: 0, explanation: 'Built-in default rules remain part of effective rule evaluation.' },
                { question: 'Both NSGs now allow HTTPS but the application is stopped. What should you predict?', options: ['The NSG will start the application', 'Network permission alone will not produce a page'], correct: 1, explanation: 'Filtering permission does not create a listening application.' }
            ],
            teachBack: { prompt: 'Explain why checking only the edited NSG is incomplete.', example: 'Other applicable filters, defaults, the guest firewall, and the listener can still stop the same flow.' },
            takeaway: 'An allow at one boundary does not prove the whole path.'
        },
        {
            id: 'stateful-replies-and-new-flows', title: 'Does the reply need another opening?', minutes: 10,
            outcome: 'Distinguish a tracked reply from an independently initiated connection.',
            paragraphs: [
                'An NSG is stateful: it tracks permitted connections and recognizes their return traffic. If the shop VM initiates an allowed outbound connection, its matching reply does not need a separate inbound rule opening the same conversation from scratch. This is different from allowing any outside machine to initiate a new session toward the VM. The direction and connection state matter.',
                'Changing a rule is also not identical to deleting every existing connection. NSG rule updates apply to new connections, while existing tracked flows can continue. When testing a restriction, create a genuinely new connection and record the source, destination, protocol, and ports. Do not declare the change ineffective solely because one established session remains open. Conversely, a successful reply on an existing session does not prove that a fresh connection would be allowed.'
            ],
            example: { title: 'A conversation already in progress', text: 'An update server replies to an allowed VM download. This tracked return traffic is not an unsolicited request to administer the VM.' },
            diagram: { type: 'nsg-filtering', scenario: 'allow' },
            activity: { prompt: 'After tightening a rule, choose the clearer validation.', options: ['Try a fresh connection matching the restricted flow', 'Only watch an old connection that was already established'], correct: 0, explanation: 'New connections are evaluated against the changed NSG rules.' },
            checks: [
                { question: 'What does stateful filtering recognize about an allowed download?', options: ['Every future internet source is trusted', 'Its matching return traffic belongs to the tracked flow'], correct: 1, explanation: 'Connection tracking distinguishes a reply from a new unsolicited session.' },
                { question: 'A deny rule is added while an existing session continues. What is the next useful test?', options: ['Attempt a new matching connection', 'Assume the entire NSG is disabled'], correct: 0, explanation: 'Existing flow state can persist, so test the new-connection behavior directly.' }
            ],
            teachBack: { prompt: 'Explain why replies and new inbound sessions are not equivalent.', example: 'A reply belongs to a permitted tracked conversation; a new session must pass its own rule evaluation.' },
            takeaway: 'Test new policy with a new flow.'
        }
    ],
    'azure-dns': [
        {
            id: 'publish-the-shop-name', title: 'Who answers for our domain?', minutes: 8,
            outcome: 'Explain why creating a public DNS zone is different from delegating to it.',
            paragraphs: [
                'A public DNS zone holds records for a domain, such as the fictional shop.example.com. An A record maps a name to an IPv4 address. A CNAME maps one name to another name, which is useful for a shop subdomain pointing to a managed frontend. The authoritative server is the server responsible for answering from the zone, rather than merely caching someone else’s answer.',
                'Creating a zone in Azure does not automatically tell the rest of DNS to use it. Delegation connects the parent domain to the zone’s assigned name servers. For a registered root domain, you normally update the name servers at the registrar. For a delegated subdomain, its parent zone holds the delegation. If records look correct in Azure but public resolvers still ask the old authority, check delegation before rewriting the application.'
            ],
            example: { title: 'A new directory nobody consults', text: 'The shop record exists in Azure DNS, but the registrar still delegates to the old provider. Clients can continue receiving the old provider’s answer.' },
            diagram: { type: 'dns-resolution', scenario: 'cold' },
            activity: { prompt: 'The public lookup reaches the old provider. What should you inspect?', options: ['Only the VM network interface', 'The parent or registrar name-server delegation'], correct: 1, explanation: 'Delegation tells resolvers which authority to consult.' },
            checks: [
                { question: 'What does a CNAME record map for the shop subdomain?', options: ['One DNS name to another DNS name', 'A customer identity to a password'], correct: 0, explanation: 'CNAME is an alias to a canonical DNS name, not authentication data.' },
                { question: 'The zone is created but delegation is unchanged. Is the public authority necessarily Azure now?', options: ['Yes, creating a zone changes every registrar', 'No, delegation still determines the authority'], correct: 1, explanation: 'Hosting records and delegating the domain are separate actions.' }
            ],
            teachBack: { prompt: 'Explain why a correct record can remain invisible to public clients.', example: 'Resolvers may still be directed to another authority, or may retain an earlier cached answer.' },
            takeaway: 'Check who is authoritative before changing the answer.'
        },
        {
            id: 'private-dns-needs-a-resolution-path', title: 'Why can one client resolve a private name?', minutes: 10,
            outcome: 'Predict how VNet links and forwarding affect private name resolution.',
            paragraphs: [
                'The shop database should be reached through a private endpoint, a private IP attachment for a supported service. Its name must resolve to that private address for the intended clients. An Azure Private DNS zone is not published to everyone on the internet. Linking a VNet to the zone allows clients using the appropriate Azure DNS resolution path to obtain its private records.',
                'Peering networks does not automatically link all their private DNS zones. Custom DNS servers and office clients also need a designed forwarding path, often through Azure DNS Private Resolver or a suitable DNS forwarder. A client can therefore have a valid network route but receive the wrong DNS answer. Compare the exact name and resolver used by a working and failing client. A private DNS answer supplies a destination; it does not replace routing, access rules, or database authentication.'
            ],
            example: { title: 'Same name, different resolver', text: 'The web VM resolves the database privately, while an office client uses public DNS. Inspect its forwarding path before opening database access publicly.' },
            diagram: { type: 'hub-spoke-capstone', scenario: 'private-origin' },
            activity: { prompt: 'A new peered VNet cannot resolve the private record. Which assumption is unsafe?', options: ['Peering automatically shares every private zone link', 'The client resolution path needs checking'], correct: 0, explanation: 'Peering provides connectivity, not automatic private DNS zone visibility.' },
            checks: [
                { question: 'What makes an Azure private zone different from a public zone?', options: ['It carries the database query itself', 'It answers through authorized private resolution paths'], correct: 1, explanation: 'Private zones have scoped visibility through links and configured resolution, rather than public delegation.' },
                { question: 'An office client switches to an appropriate private forwarding path. What still needs validation?', options: ['Routing, access rules, and database authentication', 'Nothing, a DNS answer guarantees database success'], correct: 0, explanation: 'Correct resolution is necessary but not sufficient for the application connection.' }
            ],
            teachBack: { prompt: 'Explain the difference between peering and sharing private DNS answers.', example: 'Peering connects address spaces; DNS links or forwarding determine which records a client can resolve.' },
            takeaway: 'Private connectivity needs private name resolution too.'
        },
        {
            id: 'dns-changes-take-different-paths', title: 'Why do clients see different answers?', minutes: 10,
            outcome: 'Explain DNS caching and distinguish apex routing from domain ownership validation.',
            paragraphs: [
                'DNS answers have a time to live, or TTL, which tells caches how long an answer may be reused. After the shop record changes, a resolver with an unexpired answer can still return the old result. Another resolver may already show the new one. Lowering TTL at the moment of a change does not erase previously cached answers. Plan and verify the transition from multiple client perspectives.',
                'A root name such as example.com is the zone apex. It cannot use an ordinary CNAME. For Front Door, use Azure DNS alias support or an appropriate provider’s CNAME flattening rather than pinning a discovered edge IP. Domain ownership is a separate check using the supplied TXT value. Managed certificates for apex domains require ownership revalidation for renewal, so working name resolution today does not eliminate future certificate maintenance.'
            ],
            example: { title: 'A change is not a cache purge', text: 'One shopper sees the old address until its cached TTL expires. Changing the authoritative record does not directly erase that resolver’s copy.' },
            diagram: { type: 'dns-resolution', scenario: 'cached' },
            activity: { prompt: 'A resolver returns an old but unexpired answer. Choose the explanation.', options: ['The application must have rewritten DNS', 'The resolver can still use its cached answer'], correct: 1, explanation: 'Existing cached answers can remain valid until their original TTL runs out.' },
            checks: [
                { question: 'Should the apex name be pinned to a discovered Front Door edge IP?', options: ['No, use supported alias or flattening behavior', 'Yes, the discovered edge IP is guaranteed permanent'], correct: 0, explanation: 'Front Door does not promise that observed endpoint IPs remain fixed.' },
                { question: 'Apex routing works and its managed certificate approaches renewal. What must remain planned?', options: ['A new VM public IP for every shopper', 'Domain ownership revalidation when required'], correct: 1, explanation: 'Apex managed-certificate renewal needs ownership revalidation; routing and certificate lifecycle are separate.' }
            ],
            teachBack: { prompt: 'Explain three separate checks after a domain change.', example: 'Check the authoritative answer, what clients have cached, and whether ownership and certificate validation are current.' },
            takeaway: 'Names, caches, and certificates have separate lifecycles.'
        }
    ],
    'load-balancing-overview': [
        {
            id: 'choose-by-protocol-and-scope', title: 'Which traffic are we balancing?', minutes: 10,
            outcome: 'Choose a balancing service by protocol and scope rather than its name.',
            paragraphs: [
                'The shop needs to share work across more than one server. First ask what the traffic means and where the service operates. Azure Load Balancer handles TCP or UDP flows using transport and IP information. It does not choose a backend by reading the shopping URL. Application Gateway understands HTTP requests and can make regional web-routing decisions, such as separating image and checkout paths.',
                'Front Door is a global HTTP and HTTPS entry service with edge routing and optional caching and WAF protection. Traffic Manager makes DNS-based destination choices instead of proxying the web request. These are different jobs, not interchangeable versions of the same box. A non-HTTP service should not be forced through an HTTP-only product. Start with protocol, then global versus regional need, then required behavior such as URL routing or edge caching.'
            ],
            example: { title: 'The requirement decides the product', text: 'A regional TCP inventory protocol needs transport balancing. A global public website needing edge caching has a different requirement.' },
            diagram: { type: 'lb-choice', scenario: 'transport' },
            activity: { prompt: 'The regional service uses a custom TCP protocol, not HTTP. Which choice fits?', options: ['Azure Load Balancer', 'An HTTP-only frontend solely for its cache'], correct: 0, explanation: 'Transport balancing fits a TCP service without inventing HTTP semantics.' },
            checks: [
                { question: 'Which service makes DNS choices rather than proxying each shop request?', options: ['Application Gateway', 'Traffic Manager'], correct: 1, explanation: 'Traffic Manager answers through DNS; the client then connects to the selected destination.' },
                { question: 'The requirement changes to global HTTP edge caching. Which product becomes relevant?', options: ['Azure Front Door', 'A private DNS zone alone'], correct: 0, explanation: 'Front Door supplies the global HTTP edge behavior, while DNS hosting alone cannot cache web responses.' }
            ],
            teachBack: { prompt: 'Give the first two questions you ask before choosing a balancer.', example: 'What protocol are clients using, and do we need a regional or global entry point?' },
            takeaway: 'Choose by the job, not by the product label.'
        },
        {
            id: 'frontend-pool-and-health', title: 'How does a healthy server receive work?', minutes: 10,
            outcome: 'Explain frontend, backend pool, and probe roles in a load-balanced service.',
            paragraphs: [
                'A load-balanced shop has a frontend address that clients contact and a backend pool containing servers that can handle the traffic. A balancing rule connects the frontend service to the relevant backend service. A health probe is a repeated check used to judge whether a backend should receive new work. It is not a substitute for an end-to-end purchase test.',
                'An Azure public Standard Load Balancer uses a Standard public IP frontend. An internal Standard Load Balancer uses a private frontend instead. In either design, the intended client flows and probe traffic need the appropriate permissions. If the probe checks only that a port is open, a server with a broken checkout dependency can still appear healthy. Choose a check that represents useful readiness and separately monitor the customer operation you actually care about.'
            ],
            example: { title: 'Listening is not selling', text: 'The web listener accepts connections while its database is unavailable. A shallow probe can pass even though checkout fails.' },
            diagram: { type: 'load-balancer', scenario: 'l4' },
            activity: { prompt: 'Choose what belongs in the backend pool.', options: ['The registrar’s name servers', 'The servers intended to handle the balanced service'], correct: 1, explanation: 'The backend pool contains the target service instances.' },
            checks: [
                { question: 'Does an internal Standard Load Balancer require a public frontend IP?', options: ['No, its frontend uses a private address', 'Yes, Standard always means public'], correct: 0, explanation: 'Standard describes the SKU, not whether the frontend is public or internal.' },
                { question: 'Checkout breaks but the probe still passes. What does that suggest?', options: ['Health probes guarantee every purchase succeeds', 'The probe may not cover the failing dependency'], correct: 1, explanation: 'A probe measures its configured condition, which may be narrower than customer readiness.' }
            ],
            teachBack: { prompt: 'Explain the three roles using the shop metaphor.', example: 'The frontend is the published doorway, the pool contains workers, and the probe checks whether each worker appears ready.' },
            takeaway: 'A probe is evidence of its check, not proof of the whole service.'
        },
        {
            id: 'dns-choice-versus-request-proxy', title: 'Who stays in the conversation?', minutes: 10,
            outcome: 'Predict why DNS steering and proxy routing react differently to a destination change.',
            paragraphs: [
                'Traffic Manager helps a client choose a destination through DNS. After receiving the answer, the client connects to that destination; Traffic Manager is not sitting in the HTTP response path. A DNS cache may preserve the answer, and an existing connection may continue using the already chosen endpoint. Changing the DNS choice does not automatically move every active request.',
                'An HTTP proxy such as Front Door receives the client connection and makes a separate origin-side request when needed. It can route those requests using its configured origin health and selection rules. This still does not promise a universal recovery time: detection, configuration, connection state, and application behavior matter. When comparing designs, ask where a decision is made and when it can be reconsidered. A global label alone does not explain how a failing checkout moves to another destination.'
            ],
            example: { title: 'An old answer is still in use', text: 'A client keeps a cached DNS result for the primary site. Updating the DNS routing decision does not instantly redirect that existing connection.' },
            diagram: { type: 'lb-choice', scenario: 'dns' },
            activity: { prompt: 'Which service stays in the HTTP request path for origin proxying?', options: ['Front Door', 'Traffic Manager after it returns DNS'], correct: 0, explanation: 'Front Door is an HTTP proxy; Traffic Manager provides a DNS choice.' },
            checks: [
                { question: 'Does Traffic Manager carry the shop response body back to the browser?', options: ['Yes, all DNS services proxy response bodies', 'No, the client connects to the chosen destination'], correct: 1, explanation: 'DNS steering is separate from the request and response connection.' },
                { question: 'A DNS routing answer changes while a client connection remains open. Is immediate migration guaranteed?', options: ['No, cached answers and existing connections still matter', 'Yes, changing DNS moves every active flow'], correct: 0, explanation: 'The decision can persist in client state rather than being repeated for every request.' }
            ],
            teachBack: { prompt: 'Explain the operational question hidden behind fast failover.', example: 'I need to know how failure is detected, where routing is decided, and when clients or proxies make a new decision.' },
            takeaway: 'Locate the decision before predicting the recovery.'
        }
    ],
    'frontdoor-basics': [
        {
            id: 'edge-is-not-the-origin', title: 'Where does Front Door meet the shopper?', minutes: 8,
            outcome: 'Explain the edge role and the separate origin connection.',
            paragraphs: [
                'Front Door is a global HTTP and HTTPS entry point. Its edge locations, also called points of presence or PoPs, receive shopper requests before the origin application does. For current Standard and Premium routing, DNS selects a serving PoP and returns its unicast IP address. The client connects to that edge address. Do not substitute the older Classic anycast model for this current behavior.',
                'The origin is the application server or service that produces a response when the edge needs it. Front Door is a proxy: the client connection ends at the edge, and origin access uses a separate connection. With HTTPS configured on both legs, there are separate protected conversations, not one untouched TLS tunnel from browser to application. This separation lets the edge inspect HTTP, apply policy, and sometimes answer without contacting the origin.'
            ],
            example: { title: 'Reception and workroom', text: 'The shopper talks to the reception desk at the edge. If work is needed, the desk starts a separate conversation with the shop application.' },
            diagram: { type: 'afd-request', scenario: 'miss' },
            activity: { prompt: 'Point to the endpoint of the shopper’s connection.', options: ['The private database directly', 'The serving Front Door edge'], correct: 1, explanation: 'The client connection terminates at the edge; origin access is a separate leg.' },
            checks: [
                { question: 'What does current Standard/Premium DNS selection return in this model?', options: ['The selected serving PoP unicast IP', 'A guarantee that every tier uses Classic anycast'], correct: 0, explanation: 'Current Standard/Premium routing uses DNS selection of a PoP unicast address.' },
                { question: 'HTTPS is enabled from edge to origin too. Does the browser TLS session now extend unchanged to the origin?', options: ['Yes, the edge cannot inspect HTTP', 'No, the two HTTPS legs remain separate'], correct: 1, explanation: 'Front Door terminates client TLS and uses a separate protected origin connection.' }
            ],
            teachBack: { prompt: 'Explain edge versus origin without calling both the server.', example: 'The edge receives the shopper’s request. The origin supplies application content when the edge cannot or should not answer locally.' },
            takeaway: 'The edge is a request decision point, not the origin itself.'
        },
        {
            id: 'edge-answer-or-origin-work', title: 'Does every request visit the origin?', minutes: 8,
            outcome: 'Predict whether a safe cache hit needs an origin fetch.',
            paragraphs: [
                'A cache stores a reusable response near the shopper. If caching is enabled and a fresh eligible response matches the request’s cache key, Front Door can answer from the edge. The cache key is the configured identity used to decide which requests can share a response. A miss means that a reusable response is not currently available for that key, so the request may need origin work.',
                'Not every response belongs in a shared cache. A public product image is a better candidate than a personalized cart. Route settings, request details, and response cache policy determine eligibility; the same URL alone is not a safety guarantee. An origin fetch also does not guarantee that the result will be stored. Follow the actual decision: serve a safe reusable response, or contact the origin and respect whether the returned content can be shared.'
            ],
            example: { title: 'A poster versus a personal receipt', text: 'A public product poster can be reused across shoppers. A private receipt should not become a shared response merely because its path is stable.' },
            diagram: { type: 'frontdoor-caching', scenario: 'hit' },
            activity: { prompt: 'A fresh eligible product image is in the serving edge cache. Predict the origin work.', options: ['No origin fetch is needed for that hit', 'The origin must rebuild every cached image'], correct: 0, explanation: 'A valid cache hit can answer locally after the applicable edge processing.' },
            checks: [
                { question: 'What does a cache key decide?', options: ['Which shopper owns the network', 'Which requests are candidates to share a cached response'], correct: 1, explanation: 'The key identifies reusable cached content; eligibility and policy still matter.' },
                { question: 'The response changes from a public image to a personalized cart. Should it remain shared just because the URL matches?', options: ['No, personalized content needs a safe non-shared policy', 'Yes, identical paths always mean identical safe content'], correct: 0, explanation: 'Response privacy and variation take precedence over superficial URL similarity.' }
            ],
            teachBack: { prompt: 'Explain why fewer origin requests can be good but not always safe.', example: 'Reusing public content reduces work. Reusing private content across shoppers can disclose someone else’s data.' },
            takeaway: 'Reuse responses only when sharing is intentional and safe.'
        },
        {
            id: 'select-an-origin-deliberately', title: 'Why did this origin receive the request?', minutes: 10,
            outcome: 'Explain health and priority before interpreting origin weights.',
            paragraphs: [
                'When the shop request needs an origin, Front Door selects within the route’s origin group. Health probes provide evidence about origin availability. Among healthy candidates, priority comes before measured latency and weight. A lower numeric priority represents the preferred group. Weight influences distribution among eligible candidates after the earlier filters; it is not a promise that every set of ten requests splits into an exact ratio.',
                'If the preferred origin becomes unhealthy, another eligible origin can receive work according to the configured selection behavior. Detection depends on probe observations and settings, so there is no single universal failover time. If all origins are unhealthy, Front Door has a fallback that treats them as candidates rather than guaranteeing that no request is forwarded. A probe result is also not proof that every checkout dependency is healthy. Correlate origin selection with application outcomes.'
            ],
            example: { title: 'A preferred worker is unavailable', text: 'The primary origin fails its health checks. The backup becomes relevant; raising the failed origin’s weight does not make it healthy.' },
            diagram: { type: 'frontdoor-routing', scenario: 'origin-failure' },
            activity: { prompt: 'Two healthy origins have different priorities. What should you consider before weights?', options: ['Only the alphabetical order of their names', 'The preferred eligible priority group'], correct: 1, explanation: 'Priority is an earlier selection filter than weight.' },
            checks: [
                { question: 'Does a weight guarantee an exact split in every small request sample?', options: ['No, it influences distribution among eligible candidates', 'Yes, each ten requests must exactly match the ratio'], correct: 0, explanation: 'Weight is not a deterministic small-sample counter.' },
                { question: 'All origins now fail probes. Can you assume Front Door forwards nothing?', options: ['Yes, that is the only possible fallback', 'No, all-unhealthy fallback can still attempt origins'], correct: 1, explanation: 'The documented fallback treats all origins as candidates, so origin attempts can continue.' }
            ],
            teachBack: { prompt: 'Explain an unexpected origin choice without starting with weights.', example: 'I would check the matched route, health, priority, latency eligibility, and then weight and any affinity setting.' },
            takeaway: 'Eligibility comes before distribution.'
        }
    ],
    'vpn-connectivity': [
        {
            id: 'connect-a-person-or-a-site', title: 'Are we connecting a laptop or an office?', minutes: 8,
            outcome: 'Choose point-to-site or site-to-site VPN for the initiating network.',
            paragraphs: [
                'A shop employee needs to reach private Azure resources from outside Azure. A virtual private network, or VPN, carries traffic through an encrypted tunnel across another network. Point-to-site connects an individual client device, such as a remote worker’s laptop, to the Azure network. The device uses a supported VPN client and the configured authentication method.',
                'Site-to-site connects an entire network, such as the shop office, through a compatible VPN device to an Azure VPN gateway. The gateway is the Azure-side tunnel endpoint, not the application server. Choose based on what you are connecting, not which name sounds more secure. Both designs still require compatible address ranges, routes, and access rules. A connected tunnel does not grant every employee permission to every application, and a successful sign-in does not prove the destination service is listening.'
            ],
            example: { title: 'One traveler or the whole warehouse', text: 'A traveling employee uses point-to-site. The warehouse network uses site-to-site through its network VPN device.' },
            diagram: { type: 'vpn-tunnel', scenario: 'connected' },
            activity: { prompt: 'A single remote laptop needs private shop access. Which connection model fits?', options: ['Point-to-site VPN', 'A site-to-site tunnel without any site device'], correct: 0, explanation: 'Point-to-site is designed for individual clients rather than an entire remote network.' },
            checks: [
                { question: 'What is the Azure VPN gateway’s role?', options: ['The shop database engine', 'The Azure-side tunnel endpoint'], correct: 1, explanation: 'The gateway connects networks or clients through the tunnel; it does not serve the business application.' },
                { question: 'The requirement changes from one laptop to the whole office network. Which model becomes relevant?', options: ['Site-to-site with a compatible office VPN device', 'A DNS CNAME alone'], correct: 0, explanation: 'Site-to-site connects a network through its VPN device.' }
            ],
            teachBack: { prompt: 'Explain the choice without quoting bandwidth figures.', example: 'Point-to-site connects one client. Site-to-site connects a remote network through its gateway device.' },
            takeaway: 'Choose the tunnel by what needs connecting.'
        },
        {
            id: 'a-tunnel-needs-two-way-routes', title: 'Why is the tunnel up but the shop unreachable?', minutes: 10,
            outcome: 'Trace application and return routes separately from tunnel status.',
            paragraphs: [
                'A VPN status of connected tells you something about the tunnel, not the complete shop transaction. The office router must send the shop destination range into the tunnel. Azure must have a route back to the office source range. These routes must describe distinct address spaces; overlapping office and Azure ranges can make the destination ambiguous or send traffic locally instead of across the connection.',
                'After routing, filters still matter. The destination NSG, any firewall, and the application must permit the intended connection. Test a specific source, destination, protocol, and port rather than relying only on a green gateway icon. If the shop server sees the request but the employee sees no response, inspect the return route and filtering. Encryption protects traffic in transit; it does not automatically select the right route or repair an application that is stopped.'
            ],
            example: { title: 'The reply takes the wrong exit', text: 'The office request reaches Azure, but Azure has no usable route back to the office subnet. A healthy tunnel alone cannot return the reply.' },
            diagram: { type: 'vpn-tunnel', scenario: 'connected' },
            activity: { prompt: 'The application logs the VPN request but the client times out. What is worth tracing next?', options: ['Only the DNS zone title', 'The response route toward the client subnet'], correct: 1, explanation: 'Observed request delivery narrows the problem; the return path still needs evidence.' },
            checks: [
                { question: 'Does connected VPN status prove the shop application port is permitted?', options: ['No, tunnel and application-path checks are separate', 'Yes, encryption bypasses NSGs'], correct: 0, explanation: 'Network filters and the listener still determine whether the connection succeeds.' },
                { question: 'The office adopts the same range as Azure. What risk has been introduced?', options: ['The tunnel automatically becomes faster', 'Address overlap can make routing ambiguous'], correct: 1, explanation: 'Overlapping ranges can prevent routers from distinguishing local and remote destinations.' }
            ],
            teachBack: { prompt: 'List the evidence beyond a green tunnel icon.', example: 'I need forward and return routes, allowed traffic, a working listener, and a successful application response.' },
            takeaway: 'A healthy tunnel is one link in a longer path.'
        },
        {
            id: 'private-circuit-is-not-encryption', title: 'Does a private circuit encrypt the order?', minutes: 10,
            outcome: 'Distinguish ExpressRoute private connectivity from encryption requirements.',
            paragraphs: [
                'ExpressRoute provides private connectivity between a network and Microsoft cloud services through a connectivity provider. Unlike a usual internet VPN, the circuit does not carry its path over the public internet. That describes the connectivity path, not a blanket encryption property. ExpressRoute traffic is not encrypted by default merely because the circuit is private.',
                'The shop must choose protection appropriate to its data and threat model. Application TLS can protect an HTTPS conversation; other supported encryption designs may protect additional traffic. ExpressRoute private peering can connect to private VNet resources, while Microsoft peering addresses supported Microsoft public services. Keep those destination scopes distinct. A private circuit also needs a resilience plan for provider and connection failures. Privacy of path, encryption of content, reachability, and availability are separate requirements that should each have evidence.'
            ],
            example: { title: 'A private road, an unsealed parcel', text: 'The order travels over a private circuit. The application still uses TLS because private transport alone does not encrypt the order contents.' },
            diagram: { type: 'expressroute', scenario: 'private' },
            activity: { prompt: 'A reviewer says ExpressRoute removes the need to consider encryption. Choose the response.', options: ['Private connectivity and encryption are separate decisions', 'All private circuits automatically encrypt all traffic'], correct: 0, explanation: 'ExpressRoute does not encrypt traffic by default; the protection requirement remains.' },
            checks: [
                { question: 'What does ExpressRoute private peering connect in this lesson?', options: ['Only arbitrary shopper browsers on the internet', 'The remote network to private VNet resources'], correct: 1, explanation: 'Private peering supports private network connectivity to Azure VNets.' },
                { question: 'The circuit is private but the order requires encryption in transit. What must the design add or retain?', options: ['Appropriate encryption such as application TLS', 'Only a more descriptive circuit name'], correct: 0, explanation: 'The content-protection requirement is not satisfied by a private path alone.' }
            ],
            teachBack: { prompt: 'Explain three independent questions about a circuit.', example: 'Where does traffic travel, how is its content protected, and what happens if that connection fails?' },
            takeaway: 'Private does not automatically mean encrypted or resilient.'
        }
    ],
    'peering-endpoints': [
        {
            id: 'peering-connects-only-its-peers', title: 'Does my neighbor connect me to their neighbor?', minutes: 10,
            outcome: 'Predict the limits of non-transitive VNet peering.',
            paragraphs: [
                'The shop web VNet and inventory VNet can use peering to communicate over the Microsoft backbone with private addresses. Their address spaces must not overlap. Each VNet keeps its own identity, routes, and policies; peering does not merge them into one resource. Traffic still needs appropriate rules and a listening destination application.',
                'Peering is non-transitive. If web peers with a hub and the hub peers with inventory, those two links alone do not create web-to-inventory connectivity. You can add a direct peering or deliberately build routed transit through a suitable hub appliance with forwarding, routes, and permissions. The diagram’s no-transit scenario shows the missing connection, not a broken DNS server. Before adding more rules, identify whether the required route exists at all, then verify its return direction.'
            ],
            example: { title: 'Two friendships do not make a tunnel', text: 'Web-to-hub and hub-to-inventory peerings exist. Web cannot use those peerings alone as an automatic transit route to inventory.' },
            diagram: { type: 'vnet-peering', scenario: 'no-transit' },
            activity: { prompt: 'A peers with B, and B peers with C. Choose what follows from those links alone.', options: ['A automatically gains transit to C', 'Only the configured peer relationships are established'], correct: 1, explanation: 'Peering does not automatically provide transit through a third VNet.' },
            checks: [
                { question: 'Can ordinary VNet peering connect overlapping address spaces?', options: ['No, plan non-overlapping ranges', 'Yes, peer names replace IP addresses'], correct: 0, explanation: 'Distinct address ranges are required for peering.' },
                { question: 'A routed hub appliance and two-way routes are deliberately added. Is transit still categorically impossible?', options: ['Yes, no routing design can ever connect spokes', 'No, explicit routed transit can connect them'], correct: 1, explanation: 'Non-transitive peering means no automatic transit; it does not prohibit a deliberately configured routed path.' }
            ],
            teachBack: { prompt: 'Explain the word non-transitive using the shop networks.', example: 'Being connected to the hub does not by itself connect web to inventory. Their intended path must be added explicitly.' },
            takeaway: 'A hub connection is not automatic transit.'
        },
        {
            id: 'service-endpoint-or-private-address', title: 'Did the service gain a private address?', minutes: 10,
            outcome: 'Distinguish a service endpoint from a private endpoint.',
            paragraphs: [
                'The shop needs to reach a supported managed storage service. A service endpoint extends subnet identity to that service’s public endpoint so service-side network rules can restrict access to selected subnets. It does not place a private IP for the service inside the shop VNet. The service still uses its public endpoint addressing even though the selected traffic uses the Azure backbone.',
                'A private endpoint creates a private IP attachment in a VNet for a supported service. DNS must direct intended clients to that address, and the service connection may need approval. Creating it does not necessarily disable the service’s public endpoint. If the requirement is private-only access, verify public access restrictions as a separate control. Choose based on the required address and access model, not because both product names contain endpoint.'
            ],
            example: { title: 'A membership rule versus a private doorway', text: 'A service endpoint identifies the allowed subnet at the public service. A private endpoint gives clients a private destination address for the service.' },
            diagram: { type: 'hub-spoke-capstone', scenario: 'private-origin' },
            activity: { prompt: 'The requirement explicitly asks for a service private IP in the VNet. Which mechanism fits?', options: ['A private endpoint', 'A service endpoint alone'], correct: 0, explanation: 'The private endpoint supplies a private address attachment; a service endpoint does not.' },
            checks: [
                { question: 'Does enabling a service endpoint replace the service public address with a private VNet IP?', options: ['Yes, the terms mean the same thing', 'No, it changes identity and access behavior at the public endpoint'], correct: 1, explanation: 'Service endpoints and private endpoints have different addressing models.' },
                { question: 'A private endpoint is approved. Can you assume public access is now disabled?', options: ['No, verify public access configuration separately', 'Yes, approval always removes every public path'], correct: 0, explanation: 'Private attachment and public exposure are separate service settings.' }
            ],
            teachBack: { prompt: 'Explain the endpoint choice to someone focused on addresses.', example: 'A service endpoint keeps public endpoint addressing; a private endpoint gives the service a private address in my network.' },
            takeaway: 'Ask whether the design needs subnet identity or a private destination.'
        },
        {
            id: 'prove-private-service-access', title: 'How do we prove the private path is used?', minutes: 10,
            outcome: 'Trace DNS, private reachability, and application authorization for a managed service.',
            paragraphs: [
                'A shop deployment can contain a private endpoint and still send a client toward the service’s public address. The object exists, but the client’s DNS path determines the destination it actually uses. Resolve the service name from the client network and compare the answer with the intended private endpoint. Then verify that the endpoint connection is approved and that a route reaches it.',
                'Next test the service operation with the intended identity. A network connection to the private address does not authorize database queries or storage reads. If public access is disabled, a client still resolving the public endpoint may fail even though the private endpoint is healthy. This is useful evidence, not a reason to reopen public access immediately. Work through name, address, route, network permissions, and service authorization in order, preserving the intended private-only boundary.'
            ],
            example: { title: 'An object is not a tested path', text: 'The endpoint is approved, but the warehouse resolver returns the public address. Correct its resolution path before concluding that the private endpoint is broken.' },
            diagram: { type: 'hub-spoke-capstone', scenario: 'private-origin' },
            activity: { prompt: 'Choose the first client-side evidence for the private destination.', options: ['The endpoint resource appears in the portal', 'The service name resolves to the intended private address'], correct: 1, explanation: 'The actual client answer shows which address the connection will target.' },
            checks: [
                { question: 'Does successful private connectivity grant permission to read shop data?', options: ['No, service authentication and authorization still apply', 'Yes, private IPs replace identities'], correct: 0, explanation: 'Network reachability and data access permissions are separate controls.' },
                { question: 'Public access is disabled but a client still resolves the public address. What is the useful next investigation?', options: ['Remove all authentication from the service', 'Inspect the client DNS links and forwarding path'], correct: 1, explanation: 'The observed destination is wrong for the intended private-only design.' }
            ],
            teachBack: { prompt: 'Explain the difference between deployed and verified.', example: 'Deployed means the endpoint exists. Verified means the client resolves, reaches, and is authorized to use the intended private service.' },
            takeaway: 'Validate the path from the client, not just the resource list.'
        }
    ],
    'azure-bastion': [
        {
            id: 'manage-without-public-vm-ports', title: 'How can an operator enter safely?', minutes: 8,
            outcome: 'Explain how Bastion avoids public management ports on a VM.',
            paragraphs: [
                'The shop operator needs to administer a VM, but publishing SSH or Remote Desktop directly to the internet exposes its sign-in service to scanning and password attacks. SSH is a remote shell protocol; Remote Desktop provides a graphical session. Azure Bastion offers a managed connection path so the target VM does not need its own public IP or internet-exposed management port.',
                'In the browser-based pattern, the operator connects to Bastion over HTTPS, and Bastion connects privately to the VM using the required management protocol. The VM’s NSG and guest firewall must permit that private connection, and the operator still needs valid authorization and credentials. Bastion is not a substitute for patching or strong identity controls. It narrows the exposed path while leaving the actual administration permissions and destination protections in place.'
            ],
            example: { title: 'The staff entrance', text: 'Customers use the shop frontend. Operators use Bastion to reach the VM privately instead of publishing port 22 to every internet address.' },
            diagram: { type: 'bastion', scenario: 'session' },
            activity: { prompt: 'Which VM exposure does the Bastion pattern avoid?', options: ['A required public SSH or RDP endpoint on the VM', 'Every need for administrator authentication'], correct: 0, explanation: 'Bastion removes the need for public VM management exposure, not for authentication.' },
            checks: [
                { question: 'In the browser pattern, which connection reaches Bastion from the operator?', options: ['A database replication connection', 'An HTTPS connection'], correct: 1, explanation: 'The operator reaches the Bastion service over HTTPS before the private management leg.' },
                { question: 'The target VM loses its public IP but keeps the permitted private Bastion path. Must management fail?', options: ['No, Bastion can still reach it privately', 'Yes, every managed VM needs a public address'], correct: 0, explanation: 'The target public IP is not required for the Bastion private connection.' }
            ],
            teachBack: { prompt: 'Explain the protection without claiming the VM is invulnerable.', example: 'Bastion removes public management exposure, but identities, private rules, credentials, and patching still matter.' },
            takeaway: 'Give operators a controlled path instead of a public VM door.'
        },
        {
            id: 'bastion-has-two-connection-legs', title: 'Why can Bastion open but the session fail?', minutes: 10,
            outcome: 'Distinguish operator-to-Bastion success from Bastion-to-VM success.',
            paragraphs: [
                'Opening Bastion in the portal is only the start of the management path. There is a connection from the operator to Bastion and another from Bastion to the target VM. The second leg uses the VM private address and the chosen management port. The target needs to be running the relevant service, and its network rules must allow the Bastion source path.',
                'If the browser reaches Bastion but the private leg is denied, granting broader portal permissions may not fix the session. Likewise, a permitted private port does not repair invalid VM credentials. Locate the failing boundary before changing anything: service access, private routing and filtering, listener readiness, or authentication. Keep changes specific to the intended operator path. Opening the management port to the entire internet is not a necessary diagnostic shortcut and introduces the exposure the design was meant to avoid.'
            ],
            example: { title: 'Reception works, the staff door is locked', text: 'The Bastion interface loads, but the VM NSG denies the private management port. The first leg working does not prove the second leg works.' },
            diagram: { type: 'bastion', scenario: 'session' },
            activity: { prompt: 'Bastion loads but the VM NSG blocks its management traffic. Which change addresses the observed boundary?', options: ['Disable all VM authentication', 'Permit the required private Bastion-to-VM flow'], correct: 1, explanation: 'The evidence points to private network filtering, not to removing authentication.' },
            checks: [
                { question: 'What must be listening on the target VM for a remote session?', options: ['The selected management service', 'A Front Door cache'], correct: 0, explanation: 'The remote shell or desktop listener must be available at the destination.' },
                { question: 'The private port now works but the credentials are invalid. What can still fail?', options: ['Only the DNS registrar', 'The VM authentication step'], correct: 1, explanation: 'Network permission is not proof of valid user credentials.' }
            ],
            teachBack: { prompt: 'Explain your troubleshooting sequence for a failed session.', example: 'I separate the browser leg, private VM leg, destination listener, and credentials instead of opening everything.' },
            takeaway: 'A two-leg path needs two-leg evidence.'
        },
        {
            id: 'choose-a-bastion-deployment', title: 'Which management path fits the environment?', minutes: 10,
            outcome: 'Choose Bastion features and exposure based on operator requirements.',
            paragraphs: [
                'Bastion capabilities differ by deployment option and SKU, the product tier you select. Do not assume that every diagram describes every tier. Dedicated deployments use an AzureBastionSubnet with the documented size and required service rules. Developer is a different shared deployment model with its own availability and limitations. Premium also supports a private-only deployment option, which changes how operators must reach the service.',
                'Start with the operator story: where operators connect from, whether browser sessions suffice, what audit evidence is required, and what private connectivity is available. Then verify current tier support before choosing a design. A private-only endpoint is useful only if the operator has a route to it. Finally, separate the management path from the shop’s public customer path. Bastion carries administration sessions; it is not the frontend that serves shoppers or distributes their requests.'
            ],
            example: { title: 'A private entrance needs a way to reach it', text: 'A private-only management design still needs connected operator networks. Removing the public path does not create that operator connectivity automatically.' },
            diagram: { type: 'bastion', scenario: 'session' },
            activity: { prompt: 'An operator has no route to a planned private-only Bastion endpoint. What must the design resolve?', options: ['Operator private connectivity', 'Public caching for product images'], correct: 0, explanation: 'The operator must be able to reach the chosen management endpoint.' },
            checks: [
                { question: 'Should you assume all Bastion tiers have identical deployment requirements?', options: ['Yes, the tier affects only the name', 'No, verify the selected tier and deployment model'], correct: 1, explanation: 'Shared, dedicated, and private-only options have different requirements and capabilities.' },
                { question: 'The shop adds more public customer traffic. Is Bastion the service that balances those HTTP requests?', options: ['No, it remains an administration path', 'Yes, management sessions replace the web frontend'], correct: 0, explanation: 'Bastion is for VM administration, not customer web delivery.' }
            ],
            teachBack: { prompt: 'Explain why the simplest tier is not always the correct tier.', example: 'The chosen option must match operator location, connectivity, required features, and audit needs.' },
            takeaway: 'Design management access around the operator’s actual route.'
        }
    ],
    'nat-gateway': [
        {
            id: 'give-outbound-traffic-an-address', title: 'How does a private VM download an update?', minutes: 8,
            outcome: 'Explain outbound source translation and the public address seen by a destination.',
            paragraphs: [
                'The shop VM has a private address, but its update server is on the public internet. An explicit outbound design must provide a usable path and source identity for that conversation. NAT Gateway is associated with a subnet and translates outbound flows to its configured public IP addresses. This source network address translation is often shortened to SNAT.',
                'The update server sees the translated public source rather than the VM’s private address. NAT keeps a mapping so replies can return to the correct private connection. The destination address still identifies the update server; translation does not turn the request into a different application operation. Routes, network rules, and DNS must also work. The existence of NAT Gateway is therefore evidence of an outbound method, not a guarantee that every internet destination or application request is permitted.'
            ],
            example: { title: 'One return address for a private sender', text: 'The update service records a NAT public IP. NAT’s connection mapping helps deliver its reply back to the correct shop VM flow.' },
            diagram: { type: 'natgw', scenario: 'mapped' },
            activity: { prompt: 'Which source address does the public update server observe in this NAT path?', options: ['The VM resource group name', 'One of the configured translated public addresses'], correct: 1, explanation: 'SNAT changes the source address presented on the public path.' },
            checks: [
                { question: 'What does the NAT mapping help do with a reply?', options: ['Return it to the corresponding private flow', 'Replace the update file with a DNS record'], correct: 0, explanation: 'Connection mapping associates returning traffic with the original internal conversation.' },
                { question: 'NAT is configured, but an NSG denies the outbound update flow. What should you expect?', options: ['NAT overrides the deny automatically', 'The denied connection can still fail'], correct: 1, explanation: 'Translation does not override network filtering.' }
            ],
            teachBack: { prompt: 'Explain SNAT using the outgoing update request.', example: 'The private sender uses a public source on the internet, and a saved mapping directs the reply back.' },
            takeaway: 'NAT translates the conversation; it does not authorize it.'
        },
        {
            id: 'replies-are-not-inbound-publishing', title: 'Can the internet call the VM back at will?', minutes: 8,
            outcome: 'Distinguish replies to outbound flows from unsolicited inbound sessions.',
            paragraphs: [
                'The shop VM starts a connection to a supplier through NAT Gateway. The supplier’s reply belongs to that outbound flow and can return through the recorded mapping. This does not create a public listening endpoint for any internet client to use. NAT Gateway is an outbound connectivity service, not a general inbound publishing service.',
                'An unsolicited inbound connection has no matching outbound conversation to return to. Adding NAT Gateway therefore does not let a shopper initiate an arbitrary web session directly to the VM. For a public shop, choose a deliberate frontend such as Front Door or a suitable public load balancer, with appropriate origin access controls. Keep the outbound supplier path and inbound customer path separate in your sketch. Sharing a public address concept does not make their direction or security behavior identical.'
            ],
            example: { title: 'Returning a call is not opening a switchboard', text: 'The supplier can reply on the VM-initiated connection. A random client cannot use NAT Gateway as a new inbound VM web endpoint.' },
            diagram: { type: 'natgw', scenario: 'unsolicited' },
            activity: { prompt: 'A random internet client starts a new connection to the NAT address. What should you predict?', options: ['It does not become an unsolicited inbound VM session', 'It reaches every VM sharing the subnet'], correct: 0, explanation: 'NAT Gateway does not publish arbitrary inbound sessions to the subnet.' },
            checks: [
                { question: 'Why is the supplier reply different from a fresh inbound request?', options: ['It avoids every firewall in the world', 'It belongs to a recorded outbound flow'], correct: 1, explanation: 'The return mapping identifies the existing conversation.' },
                { question: 'The VM now needs to serve public shoppers. Is attaching NAT Gateway sufficient?', options: ['No, a deliberate inbound frontend is needed', 'Yes, outbound translation publishes the application'], correct: 0, explanation: 'Inbound publishing is a separate design requirement.' }
            ],
            teachBack: { prompt: 'Describe the two arrows you would label differently.', example: 'The supplier reply returns on an existing outbound flow; a shopper’s first request begins a new inbound flow.' },
            takeaway: 'Outbound reachability is not inbound exposure.'
        },
        {
            id: 'outbound-capacity-is-finite', title: 'Why do bursts of connections fail?', minutes: 10,
            outcome: 'Explain finite SNAT capacity and choose evidence before scaling.',
            paragraphs: [
                'During a sale, the shop opens many outbound connections to a supplier. NAT Gateway provides a finite pool of translated source ports, which help distinguish simultaneous flows sharing public addresses. Ports are reusable under service rules, but they are not infinite. High connection churn or many connections toward the same destination can create pressure and failed connection attempts.',
                'Do not assume every timeout is port exhaustion. Check connection and drop metrics, destination behavior, routes, and filtering. If evidence supports SNAT pressure, connection pooling can reuse established application connections rather than opening a new one for every operation. Additional supported public IP capacity may also help when planned against current limits. An old established connection can continue while new attempts fail, so record which kind of failure you observed. The goal is reliable supplier access, not simply adding addresses without understanding demand.'
            ],
            example: { title: 'Too many separate calls', text: 'A process opens a fresh supplier connection for every item. Reusing connections can reduce source-port pressure and connection setup work.' },
            diagram: { type: 'natgw', scenario: 'exhausted' },
            activity: { prompt: 'A burst fails while old sessions continue. Choose a useful observation.', options: ['Only the number of subnet names', 'New connection failures and NAT capacity metrics'], correct: 1, explanation: 'Distinguishing new flows from established ones helps test the capacity hypothesis.' },
            checks: [
                { question: 'Is translated source-port capacity unlimited?', options: ['No, the pool is finite', 'Yes, every public address has infinite ports'], correct: 0, explanation: 'SNAT uses a bounded set of ports with allocation and reuse behavior.' },
                { question: 'Evidence shows excessive short-lived supplier connections. Which application change may reduce pressure?', options: ['Create even more new connections per item', 'Use appropriate connection pooling'], correct: 1, explanation: 'Pooling reduces unnecessary connection churn and demand for new mappings.' }
            ],
            teachBack: { prompt: 'Explain why adding capacity is not the first diagnosis.', example: 'Timeouts have several causes. I would verify connection pressure, then reduce unnecessary churn or size capacity appropriately.' },
            takeaway: 'Measure connection behavior before treating every timeout as capacity.'
        }
    ],
    'route-tables-udr': [
        {
            id: 'most-specific-route-first', title: 'Which next hop does the packet choose?', minutes: 10,
            outcome: 'Predict route selection using the most specific matching destination prefix.',
            paragraphs: [
                'The shop VM sends a packet toward an inventory address. A route table describes destination ranges and the next hop for each range. Azure supplies system routes, and a user-defined route, or UDR, can express an intended override. Start by finding routes that match the destination, then prefer the most specific matching prefix: the narrowest range containing that address.',
                'A default route covers every destination, so it is less specific than a route for one inventory subnet. Sending the default route toward a firewall does not necessarily send a more specific peered-VNet route through that firewall. For equivalent prefixes, route-source precedence and documented exceptions also matter; inspect effective routes rather than guessing from one table. A next hop is a forwarding decision, not proof that the next device is healthy, permits the flow, or knows how to send the reply back.'
            ],
            example: { title: 'The precise instruction beats the general one', text: 'A specific inventory-subnet route can be chosen instead of a default internet route because it matches a narrower destination range.' },
            diagram: { type: 'udr', scenario: 'route' },
            activity: { prompt: 'Both a /24 inventory route and a default route match. Which is more specific?', options: ['The /24 inventory route', 'The default route covering every address'], correct: 0, explanation: 'The narrower matching prefix wins before comparing equivalent-prefix route sources.' },
            checks: [
                { question: 'What does a UDR describe for matching destinations?', options: ['The shopper’s application role', 'The desired next hop for forwarding'], correct: 1, explanation: 'Routes determine forwarding, not application authorization.' },
                { question: 'A default firewall route is added but a more specific peering route remains. Is all private traffic necessarily inspected?', options: ['No, the more specific route can bypass that default', 'Yes, a default route always overrides every specific route'], correct: 0, explanation: 'Longest-prefix matching means a broad default does not override a narrower matching route.' }
            ],
            teachBack: { prompt: 'Explain why a route-table screenshot can mislead.', example: 'I need the destination and effective matching routes, not just proof that one broad firewall route exists.' },
            takeaway: 'Match the destination before naming the next hop.'
        },
        {
            id: 'a-next-hop-must-forward', title: 'What if the chosen next hop cannot carry traffic?', minutes: 10,
            outcome: 'Explain why a configured UDR can lead to a dead path.',
            paragraphs: [
                'The shop subnet has a route to a virtual appliance, a network device implemented as a VM or managed service. Selecting that next hop does not make the device forward automatically. The device must be reachable, configured to forward or proxy the relevant traffic, and permitted to handle the connection. For a VM appliance, both Azure interface settings and the appliance operating system can affect forwarding.',
                'A route pointing at the wrong private address can create a dead path even though the route itself appears valid. Do not expect Azure to ignore every unusable UDR and silently choose your preferred alternate path. Inspect the effective next hop for the destination, then the appliance state, policy, and onward route. This separates a bad direction from a device that received the traffic but refused or failed to pass it onward.'
            ],
            example: { title: 'A sign pointing to a closed bridge', text: 'The UDR directs traffic to a nonexistent appliance address. The route is configured, but the actual forwarding path is unusable.' },
            diagram: { type: 'udr', scenario: 'unreachable' },
            activity: { prompt: 'The effective next hop is an incorrect private IP. What should be corrected first?', options: ['The customer’s product preferences', 'The intended reachable next-hop configuration'], correct: 1, explanation: 'The evidence identifies a routing destination error before any application behavior.' },
            checks: [
                { question: 'Does a virtual-appliance route automatically configure forwarding inside that appliance?', options: ['No, forwarding must be configured and permitted', 'Yes, the route changes every operating system setting'], correct: 0, explanation: 'The route and the appliance’s behavior are distinct configuration layers.' },
                { question: 'The appliance becomes unreachable while its UDR remains selected. Is successful forwarding guaranteed through a fallback?', options: ['Yes, unusable UDRs are always ignored', 'No, the selected path may fail'], correct: 1, explanation: 'Do not assume an automatic alternate path bypasses a selected unusable route.' }
            ],
            teachBack: { prompt: 'Explain the difference between configured and operational routing.', example: 'A route names a next hop; operational routing also needs that hop to receive, permit, and forward traffic.' },
            takeaway: 'A next-hop label is not a working forwarding device.'
        },
        {
            id: 'stateful-inspection-needs-return-routing', title: 'Why must the reply use the inspection path?', minutes: 10,
            outcome: 'Predict the effect of an asymmetric path through a stateful firewall.',
            paragraphs: [
                'The shop sends an inventory request through a stateful firewall. Stateful means the device tracks the conversation so it can interpret return traffic in context. The reply must follow a compatible inspection path for that design. If the request passes through the firewall but the reply takes a direct route elsewhere, the paths are asymmetric: the two directions do not traverse the expected same control point.',
                'Asymmetry can break connection tracking or bypass intended inspection, depending on the devices and translation involved. It is not enough to put one UDR on the sending subnet. Trace the destination’s return decision toward the original or translated source and verify the firewall policy in both directions. A hub icon on the diagram does not prove either route. Show the complete request-and-reply path before claiming that all shop traffic is centrally inspected.'
            ],
            example: { title: 'The reply skips the checkpoint', text: 'Web traffic enters the firewall, but inventory replies directly through another route. Inspect both effective route sets rather than adding another allow rule blindly.' },
            diagram: { type: 'hub-spoke', scenario: 'broken-return' },
            activity: { prompt: 'The request crosses the firewall but the reply bypasses it. Which property needs review?', options: ['Return-path symmetry for the stateful flow', 'The sort order of resource groups'], correct: 0, explanation: 'Stateful inspection depends on seeing the expected conversation, including its return direction.' },
            checks: [
                { question: 'What does asymmetric routing mean here?', options: ['The application has two different page colors', 'The request and reply use different network paths'], correct: 1, explanation: 'The two traffic directions diverge from the intended common inspection path.' },
                { question: 'A UDR is added only on the web subnet. Does that prove inventory replies cross the firewall?', options: ['No, the inventory return route needs its own verification', 'Yes, one sender route controls all remote replies'], correct: 0, explanation: 'Each sender makes a routing decision for its direction of the conversation.' }
            ],
            teachBack: { prompt: 'Describe the two route lookups in one shop request.', example: 'Web chooses a path to inventory; inventory chooses a path back to the observed source. Both must fit the inspection design.' },
            takeaway: 'Central inspection is a two-direction property.'
        }
    ],
    'frontdoor-advanced': [
        {
            id: 'redirect-or-rewrite-the-request', title: 'Does the shopper make another request?', minutes: 10,
            outcome: 'Distinguish a redirect response from an internal URL rewrite.',
            paragraphs: [
                'The shop moves its offers page to a new address. A redirect tells the browser to request another URL. Front Door can return that redirect at the edge without fetching an origin response for the original request. The browser sees the new location and makes another request if it follows the redirect. This is a visible change in the client conversation.',
                'A rewrite instead changes the path used internally when forwarding to the origin. The shopper can keep the original visible URL while the application receives a different path. Front Door rule sets apply configured conditions and actions after route matching, and may also override route behavior. For HTTPS requests, client TLS and applicable WAF processing occur earlier. A redirect or rewrite is therefore not a way to bypass WAF checks. Decide whether the client should learn a new URL before choosing the action.'
            ],
            example: { title: 'New sign or internal hallway', text: 'Redirect /offers to /sale when the browser should use the new address. Rewrite internally when the origin needs a different path but the public URL should stay stable.' },
            diagram: { type: 'frontdoor-rules-engine', scenario: 'redirect' },
            activity: { prompt: 'The browser must display the new sale URL. Choose the action.', options: ['An internal rewrite only', 'A redirect response'], correct: 1, explanation: 'A redirect tells the client to request the new location; a rewrite changes internal forwarding.' },
            checks: [
                { question: 'Does an edge redirect require an origin fetch for the original request?', options: ['No, the edge can return the redirect itself', 'Yes, every redirect must be generated by the origin'], correct: 0, explanation: 'A configured edge rule can end processing with a redirect response.' },
                { question: 'A matching Prevention-mode WAF block occurs before the redirect rule. Does the redirect bypass it?', options: ['Yes, rule sets are a security bypass', 'No, the blocked request stops before that action'], correct: 1, explanation: 'Applicable WAF processing precedes the route’s rule-set action.' }
            ],
            teachBack: { prompt: 'Explain the client-visible difference between rewrite and redirect.', example: 'A redirect asks the browser to go elsewhere. A rewrite changes the origin-facing path without requiring that visible move.' },
            takeaway: 'Choose the action based on who should see the new address.'
        },
        {
            id: 'custom-domain-and-certificate-lifecycle', title: 'What makes our shop name trustworthy?', minutes: 12,
            outcome: 'Explain domain routing, ownership validation, and certificate renewal as separate responsibilities.',
            paragraphs: [
                'A custom domain makes the shop’s own name point toward Front Door. DNS routing sends clients to the service, while domain validation proves you control the name. Front Door supplies a TXT token for that ownership check. The TLS certificate then lets the browser validate the server name during the protected connection. A correct DNS answer alone does not prove ownership validation or certificate deployment is complete.',
                'For a subdomain, a suitable CNAME can point to Front Door. The root, or apex, cannot use an ordinary CNAME; supported alias records or provider flattening are needed. Azure DNS supports this, but other providers can support flattening too. Never pin the apex to a discovered Front Door IP. Managed apex certificates also need ownership revalidation for renewal; when Pending revalidation appears, regenerate and publish the required TXT token. Plan this maintenance rather than assuming managed means no future action.'
            ],
            example: { title: 'The name works, renewal still needs attention', text: 'The apex resolves correctly, but its certificate needs ownership revalidation. Update the generated TXT token through the DNS provider rather than changing the origin application.' },
            diagram: { type: 'afd-request', scenario: 'miss' },
            activity: { prompt: 'Apex ownership is Pending revalidation. Which work is directly relevant?', options: ['Regenerate and publish the required DNS TXT token', 'Give every backend VM a new public address'], correct: 0, explanation: 'The ownership check uses the Front Door-provided TXT token, not backend address changes.' },
            checks: [
                { question: 'Is Azure DNS the only possible provider for apex flattening?', options: ['Yes, all other DNS providers are prohibited', 'No, other providers may support suitable flattening'], correct: 1, explanation: 'Azure DNS is recommended and supported, but the documented pattern also acknowledges other providers.' },
                { question: 'The shop name resolves correctly but its certificate is invalid. Is DNS success sufficient for trusted HTTPS?', options: ['No, certificate validity remains a separate requirement', 'Yes, DNS replaces certificate validation'], correct: 0, explanation: 'Finding the endpoint and validating its TLS identity are separate steps.' }
            ],
            teachBack: { prompt: 'Explain what managed does and does not remove for an apex certificate.', example: 'Front Door manages the certificate process, but apex ownership revalidation and the required DNS token updates still need attention.' },
            takeaway: 'A working name is not a completed certificate lifecycle.'
        },
        {
            id: 'protect-the-origin-from-bypass', title: 'Can someone walk around Front Door?', minutes: 12,
            outcome: 'Choose origin restrictions that preserve the intended Front Door entry path.',
            paragraphs: [
                'A WAF at Front Door cannot inspect a request that bypasses Front Door and reaches a public origin directly. For a supported public origin, restrict the source to AzureFrontDoor.Backend and validate the X-Azure-FDID value for your own profile. The service tag identifies Front Door infrastructure shared across customers; the header identifies the intended profile. Trusting the header alone on an unrestricted public endpoint is not sufficient.',
                'Front Door Premium can use supported Private Link origins. This provides a private origin-side connection, but its managed endpoint must be approved and public access must still be disabled or restricted deliberately. An internal-load-balancer origin also needs the supported Private Link Service arrangement. Keep origin HTTPS and application authorization intact. A private path controls exposure; it does not replace server identity validation or the application’s responsibility to decide who can access shop data.'
            ],
            example: { title: 'A guarded entrance with an open side door', text: 'The edge blocks an attack, but the origin accepts direct internet traffic. The intended protection is incomplete until the origin bypass path is closed.' },
            diagram: { type: 'frontdoor-private-link', scenario: 'approved' },
            activity: { prompt: 'A public origin checks only a user-supplied X-Azure-FDID header. What is missing?', options: ['More product images in the cache', 'A restriction to the intended Front Door source path'], correct: 1, explanation: 'On an unrestricted public endpoint, a client can supply a header; source restrictions and profile validation work together.' },
            checks: [
                { question: 'Does AzureFrontDoor.Backend identify only your Front Door profile?', options: ['No, it covers shared Front Door backend infrastructure', 'Yes, each profile owns that entire service tag'], correct: 0, explanation: 'Profile-specific validation is needed in addition to the source restriction.' },
                { question: 'A Premium private origin endpoint is approved. Can public origin exposure be ignored?', options: ['Yes, approval always disables every public route', 'No, public access still needs explicit verification'], correct: 1, explanation: 'Private Link connectivity does not automatically close all public service access.' }
            ],
            teachBack: { prompt: 'Explain origin protection as two questions.', example: 'Can only the intended Front Door path reach the origin, and does the application still validate identity and access?' },
            takeaway: 'Protect the origin, not just the advertised entrance.'
        }
    ],
    'frontdoor-caching': [
        {
            id: 'cache-hit-miss-and-expiry', title: 'Which copy answers the shopper?', minutes: 10,
            outcome: 'Predict the difference between a fresh hit, a miss, and an expired entry.',
            paragraphs: [
                'The shop product image can be reused for many customers. With caching enabled and a suitable cache policy, Front Door can keep a response at the edge. A fresh hit means a usable response already matches the cache key. A miss means no suitable stored response is available there. On a miss, Front Door may fetch from the selected origin, but storing that response still depends on eligibility.',
                'Expiry is different from never having a copy. An expired response may need revalidation or refresh according to policy. Revalidation asks whether the stored representation is still current; it is not the same as blindly serving stale content forever. Edge locations may have different cache contents, so one shopper’s hit does not guarantee another shopper’s hit. Use cache-status evidence for the actual request rather than treating every response as an origin fetch or every repeated URL as a hit.'
            ],
            example: { title: 'The poster’s freshness window', text: 'A fresh poster copy answers locally. After expiry, the edge may need to check or fetch the origin representation before using an updated response.' },
            diagram: { type: 'frontdoor-caching', scenario: 'expired' },
            activity: { prompt: 'The response is fresh and eligible at this edge. Which branch fits?', options: ['A cache hit can answer without an origin fetch', 'Expiry must already have happened'], correct: 0, explanation: 'Freshness and eligibility permit the local hit path.' },
            checks: [
                { question: 'Does every cache miss guarantee the fetched response will be stored?', options: ['Yes, fetching automatically makes content shareable', 'No, response eligibility and policy still decide'], correct: 1, explanation: 'Origin retrieval and permission to cache are separate decisions.' },
                { question: 'The cached image expires. Is the next request necessarily identical to a fresh hit?', options: ['No, revalidation or refresh may be needed', 'Yes, expiry never affects cache behavior'], correct: 0, explanation: 'An expired entry cannot be treated as an indefinitely fresh copy.' }
            ],
            teachBack: { prompt: 'Explain why repeated requests can take different paths.', example: 'The edge may have a fresh copy, no copy, or an expired copy; policy and cache state determine whether origin work is needed.' },
            takeaway: 'Cache state changes the request path.'
        },
        {
            id: 'cache-keys-define-sharing', title: 'Could two shoppers receive the same wrong copy?', minutes: 12,
            outcome: 'Predict unsafe reuse when response-varying inputs are omitted from cache identity.',
            paragraphs: [
                'A cache key defines which requests can look up the same stored response. The shop might serve a product page whose query string chooses a language or currency. If that input changes the response but the configured key ignores it, different shoppers can collide on one cached representation. Ignoring query strings can improve reuse only when those inputs do not change the response in a way that matters.',
                'Personalized carts and receipts are more sensitive than a wrong currency label. Do not cache them as shared public responses merely because their URLs match. Use a safe route and origin cache policy, and do not assume cookies or authentication always make a custom configuration safe automatically. Before changing a key, list every input that changes the representation and ask whether sharing is intended. Correctness and privacy come before a higher hit ratio.'
            ],
            example: { title: 'Two currency requests, one stored price', text: 'The origin uses ?currency=EUR and ?currency=USD, but the cache ignores currency. The same stored price representation can be returned for both.' },
            diagram: { type: 'frontdoor-caching', scenario: 'uncacheable' },
            activity: { prompt: 'Currency changes the origin response. Should the cache ignore it without redesigning the response?', options: ['Yes, a higher hit ratio is always safe', 'No, response variation must be represented or caching avoided'], correct: 1, explanation: 'Requests that require different content must not accidentally share one representation.' },
            checks: [
                { question: 'What is the first question before excluding a query parameter from the key?', options: ['Does it change the response that should be served?', 'Does its name have fewer than ten characters?'], correct: 0, explanation: 'Response variation determines whether ignoring the input is safe.' },
                { question: 'A public product response becomes a personalized receipt at the same path. What must change?', options: ['Nothing, paths alone determine safe sharing', 'Reassess eligibility and use an appropriate non-shared policy'], correct: 1, explanation: 'Personalized content must not be exposed through inappropriate shared caching.' }
            ],
            teachBack: { prompt: 'Explain the privacy risk without using the word optimization.', example: 'If two people map to the same cached copy when their content should differ, one can receive the other person’s information.' },
            takeaway: 'A cache key is a sharing boundary.'
        },
        {
            id: 'publish-and-refresh-cached-content', title: 'How do we release a changed image safely?', minutes: 10,
            outcome: 'Choose between waiting, purging, and versioned URLs for a content update.',
            paragraphs: [
                'The shop changes a public product image while old copies remain fresh in caches. Updating the origin file does not instantly replace every edge or browser copy. A time to live sets a freshness window, and a purge asks Front Door to invalidate selected cached content. Purging the edge does not erase independent browser caches or make every client observe the change at the same moment.',
                'Versioned URLs give a changed asset a new identity, such as a new filename, while the page begins referencing it. That can avoid reusing the old cached object for the new version. Choose a release method based on how urgently stale content must disappear and which caches exist. After a purge, expect more origin work as caches refill. Verify the returned content and cache evidence from representative clients rather than claiming success solely because a purge request was accepted.'
            ],
            example: { title: 'The new poster has a new label', text: 'The page references poster-v2 instead of poster-v1. The new asset no longer competes with the old version under one cache identity.' },
            diagram: { type: 'frontdoor-caching', scenario: 'miss' },
            activity: { prompt: 'The new image must not reuse the old cache identity. Which approach supports that?', options: ['Use a versioned asset URL and update references', 'Change only the origin file while every cache stays fresh'], correct: 0, explanation: 'A new URL gives the new asset a distinct lookup identity.' },
            checks: [
                { question: 'Does an edge purge directly erase every shopper browser cache?', options: ['Yes, all caches are the same service', 'No, browser caches have independent state'], correct: 1, explanation: 'Purging Front Door targets its cache, not arbitrary client storage.' },
                { question: 'Popular edge objects are purged. What near-term load change should the shop prepare for?', options: ['More origin fetches while caches refill', 'A guarantee of zero origin requests'], correct: 0, explanation: 'Requests that previously hit may now need origin responses.' }
            ],
            teachBack: { prompt: 'Explain what evidence proves the content release reached a shopper.', example: 'I inspect the actual returned version and relevant cache state from that client, not just the purge operation status.' },
            takeaway: 'Content publication and cache invalidation are separate steps.'
        }
    ],
    'frontdoor-waf': [
        {
            id: 'tls-before-http-inspection', title: 'How can WAF inspect an encrypted request?', minutes: 10,
            outcome: 'Explain TLS termination before HTTP-aware WAF evaluation.',
            paragraphs: [
                'A web application firewall, or WAF, evaluates HTTP requests against configured security rules. For an HTTPS shopper request, Front Door first terminates client TLS, the protected connection between browser and edge. It can then inspect the HTTP method, path, headers, and permitted body content according to its policy. WAF is not reading encrypted bytes without terminating the client protection.',
                'If the request continues toward an origin using HTTPS, Front Door establishes or reuses a separate protected origin connection. The WAF decision happens at the edge before origin access and before a cached response is returned through the ordinary processing path. An origin does not have to see every blocked request. This model also explains why the application’s own authentication remains essential: recognizing a suspicious pattern is not the same as deciding which customer is allowed to view an order.'
            ],
            example: { title: 'Inspecting at the reception desk', text: 'The browser’s protected conversation ends at the edge. WAF evaluates the request there, then permitted origin traffic uses its own HTTPS leg.' },
            diagram: { type: 'waf-inspection', scenario: 'miss' },
            activity: { prompt: 'Put these steps in the correct conceptual order.', options: ['Inspect unreadable TLS ciphertext as HTTP, then connect', 'Terminate client TLS, then evaluate the HTTP request'], correct: 1, explanation: 'HTTP-aware evaluation requires the request to be available after client TLS termination.' },
            checks: [
                { question: 'Does Front Door HTTPS to the origin reuse the browser’s unchanged TLS tunnel?', options: ['No, it is a separate protected connection', 'Yes, otherwise WAF cannot operate'], correct: 0, explanation: 'Front Door proxies between separate client-side and origin-side connections.' },
                { question: 'WAF blocks the request at the edge. Must the origin application log that request?', options: ['Yes, blocked requests always run at the origin first', 'No, the edge can stop it before origin access'], correct: 1, explanation: 'An edge block can prevent an origin request entirely.' }
            ],
            teachBack: { prompt: 'Explain why edge TLS termination and encryption can coexist.', example: 'The edge decrypts its client connection for processing, then can encrypt a different connection to the origin.' },
            takeaway: 'TLS protects each connection; WAF evaluates HTTP between the legs.'
        },
        {
            id: 'detection-is-not-prevention', title: 'Was the suspicious request actually blocked?', minutes: 10,
            outcome: 'Predict the difference between Detection and Prevention policy modes.',
            paragraphs: [
                'The shop enables a WAF rule to identify a suspicious request pattern. In Detection mode, matching events can be logged without enforcing the blocking action. This helps observe potential false positives before enforcing policy. A log entry therefore proves that a rule matched, not necessarily that the customer or attacker was stopped.',
                'In Prevention mode, a matching Block action can stop the request at the edge. Rule order, conditions, exclusions, and other actions still affect the outcome, so read the effective policy rather than assuming every match means a block. Compare the same synthetic request in each mode using logs and request results. A test that only counts matches cannot establish enforcement. Avoid using real sensitive customer input for practice; the aim is to understand the decision path, not to create live attack traffic.'
            ],
            example: { title: 'An observer versus a guard', text: 'The same synthetic pattern is logged in Detection. With the relevant Block action enforced in Prevention, it stops before reaching the origin.' },
            diagram: { type: 'waf-inspection', scenario: 'waf-detect' },
            activity: { prompt: 'The policy is in Detection and the log records a rule match. What can you conclude?', options: ['A match was observed, not necessarily blocked', 'The request definitely never reached the origin'], correct: 0, explanation: 'Detection logs matching behavior without enforcing the configured block.' },
            checks: [
                { question: 'Which combination can stop a matching request in this lesson?', options: ['Detection mode regardless of action', 'Prevention mode with an effective Block action'], correct: 1, explanation: 'Enforcement depends on mode and the effective rule action.' },
                { question: 'The policy changes from Detection to Prevention with the same effective Block rule. What outcome should you now test?', options: ['Whether the request stops before origin access', 'Only whether the rule still has the same name'], correct: 0, explanation: 'The changed condition concerns enforcement, so validate the resulting path.' }
            ],
            teachBack: { prompt: 'Explain why a security log is not automatically proof of protection.', example: 'It may record observation only. I need policy mode, the effective action, and the actual request outcome.' },
            takeaway: 'A match and a block are different evidence.'
        },
        {
            id: 'tune-waf-without-removing-the-boundary', title: 'How do we unblock legitimate shoppers carefully?', minutes: 12,
            outcome: 'Choose a narrow evidence-based WAF adjustment rather than disabling protection broadly.',
            paragraphs: [
                'A legitimate checkout field can resemble an attack pattern and trigger a false positive: a rule match on acceptable traffic. Start by identifying the matching rule, request location, policy mode, and action. Use synthetic or appropriately redacted examples to understand the field’s expected content. Do not treat one failed checkout as evidence that every WAF rule is wrong.',
                'A narrow exclusion or carefully scoped rule adjustment can preserve the intended protection while allowing valid input. Test both the legitimate case and a contrasting request that should remain blocked. WAF does not replace application validation or authorization, so those controls remain. Also check that the public origin cannot bypass the edge entirely. A perfect edge policy is insufficient if another route reaches the same application without those checks. Measure customer impact and security behavior together before broadening an exception.'
            ],
            example: { title: 'Fix one over-sensitive checkpoint', text: 'A specific checkout field triggers a known rule. Scope the adjustment to the justified field and verify that unrelated suspicious requests still hit the intended block.' },
            diagram: { type: 'waf-inspection', scenario: 'waf-block' },
            activity: { prompt: 'One valid field triggers a false positive. Choose the safer starting response.', options: ['Disable all WAF checks for the shop permanently', 'Investigate the matching rule and narrowly scope any change'], correct: 1, explanation: 'Specific evidence supports a limited adjustment without discarding unrelated protection.' },
            checks: [
                { question: 'What should accompany a test that valid checkout input is now accepted?', options: ['A contrasting test that intended blocking still works', 'A claim that authentication is no longer needed'], correct: 0, explanation: 'Both legitimate access and the retained security boundary need verification.' },
                { question: 'WAF is correctly configured but the origin accepts direct public traffic. What protection gap remains?', options: ['No gap because the edge policy is correct', 'Requests can bypass the edge inspection path'], correct: 1, explanation: 'Origin restrictions are needed to enforce use of the intended edge path.' }
            ],
            teachBack: { prompt: 'Explain what makes an exception defensible.', example: 'It addresses a demonstrated valid case, is limited to the necessary scope, and preserves tested blocking elsewhere.' },
            takeaway: 'Tune the smallest justified exception and test both sides.'
        }
    ],
    'network-architecture': [
        {
            id: 'hub-shares-services-not-assumptions', title: 'What belongs in the hub?', minutes: 10,
            outcome: 'Explain shared hub services and separate workload spokes.',
            paragraphs: [
                'The shop is growing into several workloads: a public storefront, inventory, and reporting. A hub-spoke design places shared network services in a hub VNet and workloads in separate spoke VNets. Shared services might include a firewall, private DNS resolution, or an office gateway. This organization gives teams a common place to manage selected network capabilities without putting every application into one subnet.',
                'A spoke remains its own network with its own policies. Drawing it beside the hub does not automatically send all traffic through the hub firewall or connect it to every other spoke. Peerings, routes, forwarding, and permissions define the real paths. Decide which capabilities genuinely benefit from being shared and which workloads need isolation. Centralization can simplify policy ownership, but it also creates shared dependencies whose capacity, availability, and operational ownership must be planned.'
            ],
            example: { title: 'One shared service, several workrooms', text: 'Web and inventory use a shared DNS resolver in the hub. Their applications stay in separate spokes, and their traffic paths are still configured explicitly.' },
            diagram: { type: 'hub-spoke', scenario: 'peering-only' },
            activity: { prompt: 'Which is a reasonable reason to place a DNS resolver in the hub?', options: ['To share a managed resolution service across connected workloads', 'To make all peering automatically transitive'], correct: 0, explanation: 'The hub can centralize shared services, but it does not change peering’s non-transitive behavior.' },
            checks: [
                { question: 'Does a hub diagram alone prove every spoke packet crosses the firewall?', options: ['Yes, visual placement determines routes', 'No, effective routing and forwarding determine the path'], correct: 1, explanation: 'Architecture intent must be implemented through actual network configuration.' },
                { question: 'More workloads begin using the same hub resolver. What new concern grows?', options: ['Shared dependency capacity and availability', 'A guarantee that DNS can never fail'], correct: 0, explanation: 'A shared service’s failure or saturation can affect multiple workloads.' }
            ],
            teachBack: { prompt: 'Explain the benefit and cost of sharing a hub service.', example: 'One team can manage common behavior, but many workloads may depend on its capacity and availability.' },
            takeaway: 'Centralize deliberately and own the shared dependency.'
        },
        {
            id: 'draw-only-intended-conversations', title: 'Which spoke conversations should exist?', minutes: 12,
            outcome: 'Trace an explicitly permitted inter-spoke flow through inspection.',
            paragraphs: [
                'Start a hub-spoke policy with a conversation list, not a long rule list. The web tier needs to query inventory, while reporting might need only read access to a data service. For each conversation, state the source, destination, protocol, port, and purpose. That makes the intended boundary testable and reveals which broad permissions are unnecessary.',
                'If the web-to-inventory path must be inspected, configure the relevant routes through the hub firewall, permit the specific flow, and verify its reply path. Peering alone does not provide automatic transit. A default route alone may not override a more specific direct route either. Test both an allowed conversation and one that should remain denied. Network permission does not grant database authorization, so include service identities in the application design without confusing them with packet-filtering rules.'
            ],
            example: { title: 'Permit the order lookup, not every doorway', text: 'Web needs the inventory listener. It does not automatically need every management port on every inventory VM.' },
            diagram: { type: 'hub-spoke', scenario: 'inspected' },
            activity: { prompt: 'Choose the more useful starting policy statement.', options: ['Allow all spokes to everything indefinitely', 'Allow web to the inventory service on its required port'], correct: 1, explanation: 'A purpose-bound flow can be implemented and tested without unnecessary blanket access.' },
            checks: [
                { question: 'What evidence supports a claim of inspected inter-spoke traffic?', options: ['Forward and return paths through the intended firewall', 'The firewall icon being centered on a drawing'], correct: 0, explanation: 'The actual path and policy must match the inspection intent.' },
                { question: 'A direct, more specific route is introduced between spokes. What should be rechecked?', options: ['Only the billing label', 'Whether the flow now bypasses intended inspection'], correct: 1, explanation: 'A routing change can defeat a previously correct inspection path.' }
            ],
            teachBack: { prompt: 'Explain why a denied test belongs in an architecture review.', example: 'The design should permit needed work and still prevent an unintended conversation, not merely make everything reachable.' },
            takeaway: 'Describe allowed conversations before implementing rules.'
        },
        {
            id: 'design-for-a-shared-service-failure', title: 'What happens when the shared path fails?', minutes: 12,
            outcome: 'Predict customer impact from a failed shared network dependency.',
            paragraphs: [
                'The shop can lose checkout even when its web VMs are running. If every database lookup depends on one shared DNS path, failure there can prevent new connections. If all outbound supplier calls use a shared firewall path, an outage or policy mistake there can affect several spokes at once. Healthy compute alone does not establish a healthy transaction.',
                'Map each required dependency and decide what failure the architecture must tolerate. Consider supported high-availability options, capacity headroom, configuration review, and a tested recovery procedure. A backup route that bypasses required inspection is a security decision, not a free reliability improvement. State whether the intended behavior is to fail closed, recover through another equivalent control, or use an explicitly approved alternative. Test with synthetic requests and expected observations before claiming the shop can survive a real outage.'
            ],
            example: { title: 'The workers are ready, the shared directory is down', text: 'Web VMs run normally, but new database name lookups fail because the shared resolver path is unavailable. The transaction is still broken.' },
            diagram: { type: 'hub-spoke', scenario: 'broken-return' },
            activity: { prompt: 'A proposed backup route bypasses the required firewall. What kind of change is this?', options: ['A security and availability tradeoff needing explicit review', 'A harmless reliability improvement with no policy impact'], correct: 0, explanation: 'A bypass changes the security boundary as well as connectivity.' },
            checks: [
                { question: 'Can healthy web VMs coexist with failed checkout because of a shared network dependency?', options: ['No, VM health proves the whole transaction', 'Yes, DNS or inspection paths can still fail'], correct: 1, explanation: 'The transaction depends on more than the compute instances.' },
                { question: 'A second resolver is added but clients cannot reach it. Has DNS resilience been demonstrated?', options: ['No, the alternate path must be configured and tested', 'Yes, counting two resources is enough'], correct: 0, explanation: 'Redundancy must be usable from the actual client path.' }
            ],
            teachBack: { prompt: 'Explain what makes a backup real rather than decorative.', example: 'Clients can use it, it preserves required controls, and a test shows the transaction recovers as intended.' },
            takeaway: 'Resilience is a tested dependency path, not a resource count.'
        }
    ],
    'az104-practice': [
        {
            id: 'diagnose-from-the-first-failed-step', title: 'Where should we investigate first?', minutes: 10,
            outcome: 'Choose the next diagnostic check from the last confirmed request step.',
            paragraphs: [
                'A shopper reports that the site does not work. That description is too broad to choose a fix. Build an evidence ladder: did the name resolve, did the client connect, did TLS validate, did an HTTP response arrive, and did the intended operation succeed? Each confirmed step narrows the next question without proving all later steps. Use the same client and destination when comparing observations.',
                'If DNS fails, changing a database firewall rule is premature. If TLS validates and the server returns an authorization error, repeating a basic name lookup is unlikely to explain that specific failure. Record what happened and what remains unknown. An HTTP error can prove that some HTTP-serving component answered, but not necessarily that the origin application processed the request. Front Door or another intermediary may have generated the response, so identify the responder before attributing the fault.'
            ],
            example: { title: 'The first missing rung', text: 'The browser cannot resolve the shop name. Start with its resolver and DNS answer rather than opening every VM port.' },
            diagram: { type: 'afd-request', scenario: 'miss' },
            activity: { prompt: 'Name resolution fails before any connection attempt. Which investigation is closest to the evidence?', options: ['Immediately enlarge the database subnet', 'Check the client’s DNS resolution path'], correct: 1, explanation: 'The earliest observed failure is name resolution, so start there.' },
            checks: [
                { question: 'Does a valid TLS session prove checkout authorization succeeds?', options: ['No, authorization is a later application decision', 'Yes, encryption grants every customer permission'], correct: 0, explanation: 'Transport protection and application authorization answer different questions.' },
                { question: 'The response is now a WAF-generated block. Should you assume the origin handled the request?', options: ['Yes, all HTTP responses originate in the shop app', 'No, the edge may have stopped it before origin access'], correct: 1, explanation: 'An intermediary can generate an HTTP response without forwarding to the origin.' }
            ],
            teachBack: { prompt: 'Explain how evidence prevents random configuration changes.', example: 'I locate the first unconfirmed or failed step and test that boundary before changing unrelated components.' },
            takeaway: 'Find the failed step before choosing the fix.'
        },
        {
            id: 'read-the-entire-network-scenario', title: 'Which detail changes the answer?', minutes: 10,
            outcome: 'Predict outcomes from actual source scope and frontend type rather than shortcuts.',
            paragraphs: [
                'Small qualifiers can change a networking decision. A public Standard Load Balancer needs a Standard public IP frontend; an internal Standard Load Balancer uses a private frontend. Dropping the word public turns a precise requirement into a misleading blanket claim. Likewise, an Internet-source NSG rule does not match an ordinary private source merely because it allows a familiar web port.',
                'Read a scenario by extracting facts before selecting a product or rule: who initiates, which address they use, which direction traffic travels, and which boundary applies. Then apply the relevant mechanism. An NSG uses the first matching rule, so an earlier rule that does not match cannot decide the result. A subnet capacity question uses usable addresses, not only total addresses. These are reasoning checks, not tricks; the goal is to explain exactly which fact caused the outcome.'
            ],
            example: { title: 'One adjective changes the design', text: 'Public Standard Load Balancer requires a Standard public IP. Internal Standard Load Balancer does not suddenly become public because it shares the same SKU name.' },
            diagram: { type: 'nsg-filtering', scenario: 'deny' },
            activity: { prompt: 'An Internet-source allow precedes a deny for the actual private source subnet. Which rule decides?', options: ['The matching private-subnet deny', 'The Internet allow merely because its number is smaller'], correct: 0, explanation: 'An earlier nonmatching rule is skipped; the first actual match decides.' },
            checks: [
                { question: 'Which qualifier matters when asking whether Standard Load Balancer needs a public IP?', options: ['The length of its resource name', 'Whether its frontend is public or internal'], correct: 1, explanation: 'Frontend exposure determines the relevant address type.' },
                { question: 'The source changes to a public Internet address matching the earlier allow. What should you do?', options: ['Reevaluate matching rules for the changed source', 'Keep the old private-source denial without reevaluation'], correct: 0, explanation: 'A changed source can change which rule matches first.' }
            ],
            teachBack: { prompt: 'Explain why copying an answer from a similar scenario can fail.', example: 'The source, direction, frontend type, or required address count may differ, and that difference can change the mechanism’s result.' },
            takeaway: 'Extract the facts before applying the rule.'
        },
        {
            id: 'change-one-cause-and-retest', title: 'How do we know the fix worked?', minutes: 12,
            outcome: 'Choose a bounded change and verify both restored behavior and preserved restrictions.',
            paragraphs: [
                'The shop’s inventory request is denied by a known rule. A useful fix changes the smallest justified condition, such as permitting the intended source to the correct service port. Opening all ports from every source may make the symptom disappear, but it also removes boundaries and hides whether the original diagnosis was right. Keep the expected outcome specific enough to test.',
                'After the change, repeat the original failing request as a new connection and test a contrasting request that should remain denied. Record the before-and-after evidence and the exact configuration changed. A successful local academy exercise is practice, not proof that an Azure deployment was executed or that production is safe. For live environments, use the required review, rollback, and verification process. The skill to develop here is causal reasoning: one supported hypothesis, one bounded change, and observations that can prove it wrong.'
            ],
            example: { title: 'The right door opens, the others stay closed', text: 'Permit web-to-inventory on the required listener, then verify that an unrelated management connection from the same web source is still denied.' },
            diagram: { type: 'nwatcher', scenario: 'deny' },
            activity: { prompt: 'Choose the more defensible fix for one confirmed blocked application flow.', options: ['Remove every NSG from the environment', 'Add or adjust the narrowly required traffic permission'], correct: 1, explanation: 'A bounded change addresses the observed cause without discarding unrelated restrictions.' },
            checks: [
                { question: 'Why test a request that should remain denied after a fix?', options: ['To verify the intended boundary still holds', 'To make the success count look smaller'], correct: 0, explanation: 'Restoring allowed behavior is only half of a safe network change.' },
                { question: 'The academy simulation passes. What deployment claim is justified?', options: ['Production Azure resources were automatically validated', 'Only the local practice outcome was demonstrated'], correct: 1, explanation: 'Local reasoning practice is not evidence of external deployment or production execution.' }
            ],
            teachBack: { prompt: 'Describe what you would put in a concise change record.', example: 'The failing flow, evidence for the cause, the bounded change, successful retest, and a preserved-denial test.' },
            takeaway: 'A good fix restores the need without erasing the boundary.'
        }
    ],
    'azure-firewall': [
        {
            id: 'firewall-needs-to-be-on-the-path', title: 'Will deploying a firewall inspect the shop?', minutes: 10,
            outcome: 'Explain why a firewall needs deliberate routing before its rules can protect a flow.',
            paragraphs: [
                'Azure Firewall is a managed stateful network security service. It can apply centralized policies to traffic that actually passes through it. Deploying the resource beside the shop VNet does not automatically redirect every connection. The source network needs a suitable route toward the firewall, and the firewall needs a permitted onward path toward the destination.',
                'The reply path must also fit the stateful design, including any address translation. If traffic bypasses the firewall through a more specific route, editing firewall rules may have no effect on that flow. First verify where the packet goes, then evaluate the policy at that point. NSGs can still provide subnet or interface filtering; they are not removed by adding a firewall. Treat the firewall as a specific control in a complete path, not a badge that makes the entire architecture secure.'
            ],
            example: { title: 'A checkpoint on an unused road', text: 'The firewall is healthy, but web traffic follows a direct peering route. That traffic is not inspected merely because the firewall exists in the hub.' },
            diagram: { type: 'firewall', scenario: 'peering-only' },
            activity: { prompt: 'A flow bypasses the firewall. Which evidence should be checked before changing its firewall rule?', options: ['Effective routes for that destination', 'Only the firewall display name'], correct: 0, explanation: 'Rules cannot affect a flow that never traverses the firewall.' },
            checks: [
                { question: 'Does deploying Azure Firewall automatically place it in every VNet flow?', options: ['Yes, placement in the hub is sufficient', 'No, the intended traffic must be routed through it'], correct: 1, explanation: 'A firewall enforces policy on its path, not on all nearby resources automatically.' },
                { question: 'A new specific route bypasses the firewall. What could happen to an existing inspection claim?', options: ['It may no longer be true for that destination', 'It remains true because the firewall still exists'], correct: 0, explanation: 'Changing effective routing can change whether traffic is inspected.' }
            ],
            teachBack: { prompt: 'Explain the order of investigation for an unexpected allow.', example: 'First confirm the flow crosses the firewall, then inspect its effective rules and the rest of the path.' },
            takeaway: 'No traffic through the firewall means no firewall decision for that flow.'
        },
        {
            id: 'choose-network-or-application-policy', title: 'Are we allowing an address or a web destination?', minutes: 12,
            outcome: 'Distinguish network rules from application rules and explain processing-order risks.',
            paragraphs: [
                'The shop calls a supplier website. A network rule describes traffic using properties such as addresses, protocol, and ports. An application rule can use supported application-level destination information, such as a fully qualified domain name, or FQDN. That name is the complete DNS name of the intended service. Choose a rule type that matches the control you actually need rather than allowing broad address ranges just because they are easy to enter.',
                'Azure Firewall has rule-processing order, not one flat list where every later restriction is combined. In the normal rule pipeline, network rules are evaluated before application rules. A broad matching network allow can therefore prevent a later application restriction from doing the job you expected. Features such as threat intelligence and tier-specific inspection add further behavior. Check the effective policy and rule type, then test the real destination with a contrasting destination that should remain blocked.'
            ],
            example: { title: 'A broad permission swallows a narrow intention', text: 'A network rule allows all outbound HTTPS. A later application rule intended to limit the shop to one supplier may not restrict traffic already allowed by the network rule.' },
            diagram: { type: 'firewall', scenario: 'rule-order' },
            activity: { prompt: 'A broad network allow matches before the intended application restriction. What should you review?', options: ['Only the order of product categories', 'The effective rule types and processing order'], correct: 1, explanation: 'A prior matching rule can decide the flow before a later application rule is relevant.' },
            checks: [
                { question: 'What does FQDN mean in a supplier application rule?', options: ['The complete domain name of the destination', 'A special VM power state'], correct: 0, explanation: 'FQDN is a fully qualified domain name used to identify the intended service.' },
                { question: 'An all-destinations HTTPS network allow is introduced. What should be retested?', options: ['Only whether the firewall resource still has an IP', 'Whether unwanted web destinations are now also allowed'], correct: 1, explanation: 'The broader early rule may undermine the narrower intended application policy.' }
            ],
            teachBack: { prompt: 'Explain why more rules do not always mean more restriction.', example: 'A broad earlier matching allow can decide traffic before a later narrow rule is reached.' },
            takeaway: 'Rule type and order matter as much as the written intention.'
        },
        {
            id: 'outbound-inspection-and-inbound-publishing', title: 'Which direction is this firewall decision?', minutes: 10,
            outcome: 'Distinguish outbound source translation from deliberately published inbound destination translation.',
            paragraphs: [
                'The shop can use a firewall for outbound access, where source translation makes private traffic use a public egress address when applicable. The reply returns through the corresponding stateful path. Publishing an inbound service is a different task. Destination translation, or DNAT, maps an incoming address and port to an intended private destination under configured rules.',
                'Do not confuse an outbound reply with permission for arbitrary internet clients to start inbound sessions. A DNAT rule deliberately creates exposure and needs a narrowly defined source and destination, a working backend listener, and a correct return path. Avoid publishing management ports simply to troubleshoot supplier downloads. Also verify the selected firewall tier before assuming features such as TLS inspection are available. The product can play several roles, but each request still has one direction, purpose, and applicable policy.'
            ],
            example: { title: 'Outgoing purchases are not incoming administration', text: 'The shop calls a supplier through outbound policy. That does not justify an inbound DNAT rule exposing the VM’s remote desktop port.' },
            diagram: { type: 'firewall', scenario: 'inspected' },
            activity: { prompt: 'The need is outbound supplier access. Which unrelated change should you avoid?', options: ['Publishing a VM management port through DNAT', 'Checking the outbound route and policy'], correct: 0, explanation: 'Inbound management exposure does not fix the intended outbound supplier path.' },
            checks: [
                { question: 'What does destination translation change for a published inbound flow?', options: ['The customer’s account password', 'The destination address or port used to reach the backend'], correct: 1, explanation: 'DNAT maps an incoming destination to the intended internal service.' },
                { question: 'A firewall tier lacks the required TLS inspection capability. Can adding an ordinary rule create that feature?', options: ['No, verify and choose a supported feature tier', 'Yes, all tiers have identical inspection features'], correct: 0, explanation: 'Rule configuration cannot substitute for unsupported tier capabilities.' }
            ],
            teachBack: { prompt: 'Explain the first distinction before discussing firewall NAT.', example: 'Is this an outbound flow and its reply, or an intentionally published inbound connection? Their exposure is different.' },
            takeaway: 'Name the direction before changing translation policy.'
        }
    ],
    'network-watcher': [
        {
            id: 'ask-the-right-network-tool', title: 'Which question can this tool answer?', minutes: 10,
            outcome: 'Choose IP flow verify or next-hop inspection for the specific network question.',
            paragraphs: [
                'The shop VM cannot reach inventory, and Azure Network Watcher provides several tools with different scopes. IP flow verify evaluates whether the described VM traffic would be allowed or denied by applicable NSG rules. Supply the source, destination, protocol, direction, and ports. Its result can identify a matching rule; it is not a complete live purchase test.',
                'Next-hop inspection answers a routing question: which next hop Azure would use from the VM toward a destination. It does not prove that the next device forwards successfully or that the inventory application is healthy. Choose the tool after writing the question you want answered. If you suspect a wrong UDR, inspect routing. If you suspect a specific NSG deny, evaluate that flow. Keep each tool’s conclusion within its scope so an allow result does not become an unsupported claim of end-to-end health.'
            ],
            example: { title: 'A routing question needs routing evidence', text: 'To learn whether inventory traffic goes to the firewall or directly to a peer, inspect the effective next hop rather than treating NSG allowance as an answer.' },
            diagram: { type: 'nwatcher', scenario: 'deny' },
            activity: { prompt: 'You need to identify the NSG rule denying one VM flow. Which tool question fits?', options: ['Which product page is most popular?', 'Would IP flow verify allow or deny this exact flow?'], correct: 1, explanation: 'IP flow verify is scoped to the described NSG traffic evaluation.' },
            checks: [
                { question: 'Does an IP flow verify allow prove the application is listening?', options: ['No, it addresses NSG policy rather than listener health', 'Yes, it completes a checkout transaction'], correct: 0, explanation: 'The tool’s policy result is narrower than application connectivity.' },
                { question: 'The suspected cause changes to an incorrect UDR. What evidence becomes more relevant?', options: ['The page font size', 'The effective next hop for the destination'], correct: 1, explanation: 'A route question requires route-selection evidence.' }
            ],
            teachBack: { prompt: 'Explain how you avoid overclaiming a tool result.', example: 'I say exactly what it checked: an NSG decision or a next hop, not whether the whole application works.' },
            takeaway: 'A diagnostic answer is only as broad as its question.'
        },
        {
            id: 'combine-policy-with-live-connectivity', title: 'The rules allow it, so why does it fail?', minutes: 10,
            outcome: 'Distinguish a policy evaluation from a live connectivity observation.',
            paragraphs: [
                'The shop flow is allowed by NSGs, but a connection attempt still times out. This is not a contradiction: rules can permit a conversation that cannot otherwise complete. The route may be wrong, the destination may be stopped, a guest firewall may block it, or the reply may not return. An allow result removes one candidate cause only within the scope that was actually checked.',
                'A connection troubleshooting test can add evidence about live reachability to a chosen address or name and port. Compare its source and destination with the failing application request; a test from another VM can follow a different path. Combine DNS answers, effective routes, NSG results, listener state, and connection outcomes. Do not use a successful ping as a universal substitute for testing the actual application port, because ICMP and TCP or UDP can be filtered and handled differently.'
            ],
            example: { title: 'The door is permitted but nobody answers', text: 'NSGs allow TCP to inventory, yet its service is stopped. Policy is correct while the live connection still fails.' },
            diagram: { type: 'nwatcher', scenario: 'allow' },
            activity: { prompt: 'NSGs permit the flow but the inventory listener is stopped. Choose the sensible expectation.', options: ['The application connection can still fail', 'NSG permission automatically starts the service'], correct: 0, explanation: 'An allowed path does not create a destination listener.' },
            checks: [
                { question: 'Why must a connectivity test use the relevant source VM?', options: ['All VMs always share identical routes', 'Different sources can have different routes and policies'], correct: 1, explanation: 'A test only describes the path and conditions used by its source.' },
                { question: 'Ping succeeds but the shop TCP port fails. Does ping settle application health?', options: ['No, test the actual application protocol and port', 'Yes, every successful ping guarantees HTTP success'], correct: 0, explanation: 'ICMP reachability does not establish TCP listener or HTTP behavior.' }
            ],
            teachBack: { prompt: 'Explain the phrase allowed but not working.', example: 'A policy permits the traffic, but routing, a listener, another filter, or the reply can still fail.' },
            takeaway: 'Permission is not a live connection test.'
        },
        {
            id: 'collect-evidence-with-a-time-and-scope', title: 'What should a useful diagnostic note contain?', minutes: 12,
            outcome: 'Choose scoped observations that distinguish causes without exposing sensitive payloads.',
            paragraphs: [
                'A useful shop incident note identifies the time, source, destination, protocol, port, and observed result. Without these details, an allow from yesterday can be mistaken for evidence about today’s failing path. Record which tool produced each observation and what it did not check. Logs, metrics, and packet capture can provide different views; more data is not automatically better evidence.',
                'Packet capture can contain sensitive payloads or identifiers, so collect only the approved scope, duration, and storage needed for the question. Prefer synthetic reproduction when possible. Keep a short hypothesis and the observation that would support or reject it. After a bounded change, repeat the same relevant test and a preserved-restriction test. The academy’s synthetic examples teach this reasoning but do not collect real tenant traffic or prove that a production incident has been resolved.'
            ],
            example: { title: 'A comparable before and after', text: 'Record that the same source VM reached the same inventory port before and after the route fix, with timestamps and the observed next hop.' },
            diagram: { type: 'nwatcher', scenario: 'deny' },
            activity: { prompt: 'Which note makes two test results meaningfully comparable?', options: ['It worked somewhere last week', 'Same source, destination, protocol, port, time, and tool scope'], correct: 1, explanation: 'Comparable inputs and timestamps keep evidence tied to the actual failing flow.' },
            checks: [
                { question: 'Why scope packet capture carefully?', options: ['It can contain sensitive data beyond the diagnostic need', 'It automatically repairs all routing errors'], correct: 0, explanation: 'Captures may expose payloads or identifiers, so collection must be justified and bounded.' },
                { question: 'A rule changed after yesterday’s successful test. Can yesterday’s result prove today’s flow is allowed?', options: ['Yes, network results never become stale', 'No, retest the current relevant conditions'], correct: 1, explanation: 'Evidence is tied to time and configuration, which may have changed.' }
            ],
            teachBack: { prompt: 'Describe a strong diagnostic note in one sentence.', example: 'At this time, this tool observed this result for this exact flow, which supports this hypothesis but leaves these limits.' },
            takeaway: 'Evidence needs a source, a time, and an honest scope.'
        }
    ],
    'capstone-hub-spoke': [
        {
            id: 'capstone-customer-to-private-origin', title: 'Trace one shopper to the private web tier', minutes: 12,
            outcome: 'Trace the public edge and private origin legs without skipping required components.',
            paragraphs: [
                'The capstone shop combines a public Front Door Premium entry point with a private web tier behind an internal load balancer. The browser resolves and connects to a serving edge, establishes TLS, and sends its HTTP request. Applicable WAF and route processing happen at the edge. A safe fresh cache hit could answer there, while a permitted miss needs the origin path.',
                'For this internal-load-balancer origin, the private design includes Front Door’s managed private endpoint, an approved Private Link connection, a Private Link Service, and the internal load balancer leading to the web VMs. Do not draw a magical arrow directly from any Front Door tier into any private VM. Verify supported origin configuration, approval, HTTPS, and public-origin restrictions. The customer connection ends at the edge; origin access and its response use the separate private leg.'
            ],
            example: { title: 'A miss takes the complete private path', text: 'A permitted uncached request crosses the approved private origin connection and reaches the web tier through its internal load balancer, then the response returns through Front Door.' },
            diagram: { type: 'hub-spoke-capstone', scenario: 'private-origin' },
            activity: { prompt: 'Which component belongs between the managed private connection and an internal-load-balancer origin in this design?', options: ['The supported Private Link Service', 'A public IP on every database row'], correct: 0, explanation: 'The internal-load-balancer publishing pattern uses a Private Link Service.' },
            checks: [
                { question: 'Which Front Door tier supports this private-origin connection pattern?', options: ['Every tier without distinction', 'Front Door Premium with supported origin configuration'], correct: 1, explanation: 'Private Link origin support is a Premium capability and still has configuration constraints.' },
                { question: 'The same image becomes a safe fresh edge hit. Is the private origin fetch still required for that request?', options: ['No, the edge can answer that hit locally', 'Yes, every request must traverse the entire diagram'], correct: 0, explanation: 'The cache decision can end the response path at the edge without origin work.' }
            ],
            teachBack: { prompt: 'Narrate the miss without merging the two connections.', example: 'The shopper connects to Front Door. Front Door separately uses the approved private origin path to the internal load balancer and web tier.' },
            takeaway: 'Every private arrow must name a real supported connection.'
        },
        {
            id: 'capstone-data-and-egress-are-separate', title: 'Where do database and supplier calls go?', minutes: 12,
            outcome: 'Distinguish private database access from inspected outbound supplier access.',
            paragraphs: [
                'After receiving the shopper request, the web tier may need both a database lookup and a supplier call. These are different outbound conversations from the web application. The managed database is reached through its supported private endpoint and appropriate private DNS resolution. It is not simply a database VM living behind the same load balancer as the web servers.',
                'The public supplier call follows the designed egress route, such as a UDR through the hub firewall with the required policy and translation. An internet default route does not necessarily override a more specific database private route, and that distinction can be intentional. Trace each destination separately and verify return paths. Database authentication remains necessary after private reachability succeeds. Keeping these calls separate explains why inventory data access can work while supplier checkout fails, or the reverse, without blaming the public Front Door connection.'
            ],
            example: { title: 'Two errands from the same worker', text: 'The web VM reaches the database privately but cannot reach the public supplier because the egress firewall denies that destination. The working private call does not prove public egress.' },
            diagram: { type: 'hub-spoke-capstone', scenario: 'egress' },
            activity: { prompt: 'Database access succeeds while the supplier call fails. Which path needs separate inspection?', options: ['Only the browser’s color settings', 'The supplier egress route and firewall decision'], correct: 1, explanation: 'The two destinations can use different routes and controls even from one web VM.' },
            checks: [
                { question: 'Does a managed database private endpoint make database authentication unnecessary?', options: ['No, the service still enforces identity and permissions', 'Yes, every connected VM gains all database privileges'], correct: 0, explanation: 'Private network access does not grant data-plane authorization.' },
                { question: 'The supplier destination changes but database DNS stays the same. What should be revalidated?', options: ['Only whether Front Door has a friendly name', 'The new supplier route, policy, and application response'], correct: 1, explanation: 'A changed public destination can affect egress policy independently of the private database path.' }
            ],
            teachBack: { prompt: 'Explain why one successful dependency call is not enough.', example: 'Each destination has its own name, route, filtering, and service behavior, so I trace database and supplier calls independently.' },
            takeaway: 'One application can depend on several different network paths.'
        },
        {
            id: 'capstone-prove-and-challenge-the-design', title: 'What evidence would convince a reviewer?', minutes: 12,
            outcome: 'Choose successful and denied-path tests that support a bounded architecture claim.',
            paragraphs: [
                'A complete shop diagram is a hypothesis about traffic, not proof that the deployed system behaves that way. State a few observable claims: permitted shoppers can reach the web tier, direct origin bypass is restricted, web can reach its private database, and supplier egress follows the intended firewall. For each claim, name the observation that would confirm it and a changed condition that should fail.',
                'Use synthetic requests and approved tools to compare DNS, route, policy, and application evidence. Include a broken return path or an unapproved private connection as a deliberate paper exercise before any authorized live test. Record limitations: these local units do not deploy Azure resources, measure production resilience, or establish mastery by being read. A reviewer should see the intended behavior, the evidence, and what remains untested. Strong architecture reasoning makes uncertainty visible instead of hiding it behind a polished diagram.'
            ],
            example: { title: 'One success and one protected failure', text: 'A request through the intended edge path succeeds, while a direct public-origin attempt is rejected. Together they support a stronger claim than the successful page alone.' },
            diagram: { type: 'hub-spoke-capstone', scenario: 'broken-return' },
            activity: { prompt: 'Choose evidence for the claim that the origin cannot be bypassed publicly.', options: ['A controlled direct-origin attempt is rejected while the intended path works', 'Only a screenshot of the Front Door resource'], correct: 0, explanation: 'The contrasting results exercise both the allowed path and the claimed restriction.' },
            checks: [
                { question: 'What does completing the local capstone reading establish?', options: ['A deployed Azure architecture with proven resilience', 'Completion of local learning, not cloud execution'], correct: 1, explanation: 'Reading and synthetic practice do not prove deployment, operational behavior, or mastery.' },
                { question: 'The return route is intentionally broken in a paper scenario. Should a one-way request trace still count as success?', options: ['No, the complete response path must work too', 'Yes, reaching the web VM finishes the transaction'], correct: 0, explanation: 'A customer transaction requires the response to return, not just request arrival.' }
            ],
            teachBack: { prompt: 'Give a reviewer a claim, evidence, and one honest limit.', example: 'The intended request path works in this synthetic case, and the bypass is denied. Live Azure behavior and failure recovery remain separate validation gates.' },
            takeaway: 'A trustworthy design includes evidence and visible limits.'
        }
    ],
    'azure-ip-addressing': [
        {
            id: 'private-and-public-addresses', title: 'Which address should the customer use?', minutes: 8,
            outcome: 'Distinguish a private service address from a public entry address.',
            paragraphs: [
                'Inside the shop VNet, a VM network interface has a private IP address from its subnet. A network interface is the VM attachment to the virtual network. Connected private networks can use that address when routes and rules permit. Internet shoppers cannot simply route to an ordinary private address such as 10.0.1.4. A public entry point is needed for a deliberately internet-facing service.',
                'That entry point does not have to be a public IP on every VM. Front Door, a public load balancer, or another appropriate frontend can receive requests and reach backend resources through the designed path. An internal load balancer instead presents a private frontend for connected clients. Decide who needs to initiate a connection before assigning exposure. Keeping backend management private reduces opportunities for internet scanning without preventing a properly designed public shop.'
            ],
            example: { title: 'Public storefront, private workroom', text: 'Customers use the public frontend name. Backend VMs communicate on private addresses, and management uses a separate controlled path.' },
            diagram: { type: 'load-balancer', scenario: 'l4' },
            activity: { prompt: 'The stock service is only for connected private clients. Which frontend fits that requirement?', options: ['A public frontend solely because all services need one', 'An internal frontend with a private address'], correct: 1, explanation: 'An internal frontend serves the connected private network rather than intentionally exposing the service publicly.' },
            checks: [
                { question: 'Where does a VM interface get its private address?', options: ['From its subnet address range', 'From the product catalog'], correct: 0, explanation: 'The private address belongs to the VNet subnet containing the interface.' },
                { question: 'The shop adds a public frontend. Must every backend VM gain a public IP?', options: ['Yes, otherwise the frontend cannot exist', 'No, backends can remain privately addressed'], correct: 1, explanation: 'The frontend and backend address roles are distinct.' }
            ],
            teachBack: { prompt: 'Explain the address choice in terms of who initiates traffic.', example: 'Public customers need a published entry point; internal services can use private addresses on connected networks.' },
            takeaway: 'Expose the intended entry point, not every machine.'
        },
        {
            id: 'count-usable-subnet-space', title: 'Why are some addresses unavailable?', minutes: 10,
            outcome: 'Predict whether a small Azure subnet can hold a planned set of addresses.',
            paragraphs: [
                'The shop needs a small subnet for a test service. An IPv4 prefix describes a block of addresses; a slash number tells you how much of the address identifies that block. A larger slash number means a smaller block. You do not need to memorize every size now: a /28 contains sixteen total addresses, while a /27 contains thirty-two.',
                'Azure reserves the first four and the last address in each subnet, leaving five addresses unavailable to resources. A /28 therefore has eleven usable addresses, and a /27 has twenty-seven. Count address-consuming interfaces and service requirements, not just the number of VM names. Leave growth room and check any service-specific subnet requirement before deployment. If the shop needs twelve assignable addresses, a /28 is already too small even though its total count is sixteen.'
            ],
            example: { title: 'Twelve guests, eleven seats', text: 'A plan for twelve assigned addresses cannot fit in a /28 Azure subnet. Its sixteen total addresses include five reserved ones.' },
            diagram: { type: 'vnet-architecture', scenario: 'tiers' },
            activity: { prompt: 'Choose the usable count for the shop /28 subnet.', options: ['Eleven usable addresses', 'Sixteen usable addresses'], correct: 0, explanation: 'Sixteen total minus five reserved leaves eleven.' },
            checks: [
                { question: 'What does a larger IPv4 slash number mean for block size?', options: ['A larger block of addresses', 'A smaller block of addresses'], correct: 1, explanation: 'More prefix bits leave fewer bits for addresses within the block.' },
                { question: 'The plan grows from ten to twelve assigned addresses. Can the /28 still fit?', options: ['No, it has only eleven usable addresses', 'Yes, all sixteen can be assigned'], correct: 0, explanation: 'The five Azure-reserved addresses cannot be used to satisfy the increased demand.' }
            ],
            teachBack: { prompt: 'Explain why total addresses are not your deployment budget.', example: 'I subtract the reserved addresses, count actual address consumers, then leave growth room.' },
            takeaway: 'Size for usable addresses and growth, not the headline total.'
        },
        {
            id: 'address-lifetime-follows-interface', title: 'When can a private address change?', minutes: 10,
            outcome: 'Explain dynamic versus static private allocation without confusing VM and interface lifecycles.',
            paragraphs: [
                'Dynamic private allocation means Azure chooses an available address for the network interface. Static private allocation means you select an available address from its subnet. Dynamic does not mean the private address changes on every restart, or simply because a VM is deallocated. Deallocation releases compute capacity; the retained network interface still owns its assigned private address.',
                'The interface lifecycle matters. Deleting the interface, moving it to another subnet, or changing its allocation to a different selected address can release or change the old assignment. A static choice is useful when a service requires a specific address, but it does not make a deleted interface immortal. Configure the address through Azure rather than inventing a conflicting guest setting. Keep DNS and dependent configurations aligned with intentional address changes so the shop does not keep calling an old destination.'
            ],
            example: { title: 'The stopped delivery van keeps its label', text: 'The VM is deallocated but its interface remains unchanged. Do not diagnose a new private address solely from the VM being stopped.' },
            diagram: { type: 'vnet-architecture', scenario: 'tiers' },
            activity: { prompt: 'The inventory service requires a specific free private address. Choose the allocation approach.', options: ['Restart until the desired address happens to appear', 'Select that address with static private allocation'], correct: 1, explanation: 'Static allocation expresses the required address explicitly.' },
            checks: [
                { question: 'Does deallocating a VM alone release its retained interface private IP?', options: ['No, the retained interface keeps the assignment', 'Yes, every stop necessarily gives it a new private IP'], correct: 0, explanation: 'Private address lifetime follows the interface and its configuration, not just compute allocation.' },
                { question: 'The interface moves to a different subnet. What should you recheck?', options: ['Only the browser theme', 'Its new address and dependent DNS configuration'], correct: 1, explanation: 'A subnet move changes the available address range, so clients must not rely on the old assignment.' }
            ],
            teachBack: { prompt: 'Explain dynamic allocation without saying random on every reboot.', example: 'Azure chooses the address, then retains it with the interface until a relevant lifecycle or configuration change.' },
            takeaway: 'Follow the network interface, not just the VM power state.'
        }
    ]
};

if (typeof module !== 'undefined') module.exports = ACADEMY_UNITS;
