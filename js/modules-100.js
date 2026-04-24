/* ============================================
   LEVEL 100 MODULES — Foundations
   ============================================ */

const MODULES_100 = [

// ──────────────────────────────────────────────
// MODULE 1: Networking Fundamentals
// ──────────────────────────────────────────────
{
    id: 'net-fundamentals',
    level: 100,
    title: 'Networking Fundamentals',
    subtitle: 'OSI Model, TCP/IP, DNS, HTTP — the building blocks',
    icon: '🔌',
    estimatedTime: '45m',
    learn: `
<div class="learn-section">
    <h2>Why Networking Matters for Azure</h2>
    <p>Before diving into Azure networking, you need a solid understanding of how networks work. Every Azure service communicates over a network, and understanding the fundamentals will make Azure concepts click naturally.</p>
    
    <div class="concept-box">
        <h4>🎯 AZ-104 Relevance</h4>
        <p>The AZ-104 exam assumes foundational networking knowledge. Understanding OSI layers, IP addressing, DNS, and routing is critical for configuring Azure Virtual Networks, NSGs, and load balancers.</p>
    </div>
</div>

<div class="learn-section">
    <h2>The OSI Model — 7 Layers</h2>
    <p>The Open Systems Interconnection (OSI) model is a conceptual framework that describes how data travels from one application to another across a network. Think of it as a stack of 7 layers, each with a specific job.</p>
    
    <table class="content-table">
        <tr><th>Layer</th><th>Name</th><th>What It Does</th><th>Protocols/Examples</th></tr>
        <tr><td>7</td><td><strong>Application</strong></td><td>User-facing services (web, email)</td><td>HTTP, HTTPS, FTP, SMTP, DNS</td></tr>
        <tr><td>6</td><td><strong>Presentation</strong></td><td>Data format, encryption, compression</td><td>SSL/TLS, JPEG, JSON</td></tr>
        <tr><td>5</td><td><strong>Session</strong></td><td>Manages connections/sessions</td><td>NetBIOS, RPC</td></tr>
        <tr><td>4</td><td><strong>Transport</strong></td><td>End-to-end delivery, flow control</td><td>TCP, UDP</td></tr>
        <tr><td>3</td><td><strong>Network</strong></td><td>Routing, IP addressing</td><td>IP, ICMP, ARP</td></tr>
        <tr><td>2</td><td><strong>Data Link</strong></td><td>MAC addressing, error detection</td><td>Ethernet, Wi-Fi, Switches</td></tr>
        <tr><td>1</td><td><strong>Physical</strong></td><td>Cables, signals, bits on the wire</td><td>Fiber, Copper, Radio</td></tr>
    </table>

    <div class="tip-box">
        <h4>💡 Memory Trick</h4>
        <p><strong>Bottom-up:</strong> "Please Do Not Throw Sausage Pizza Away" — Physical, Data Link, Network, Transport, Session, Presentation, Application</p>
    </div>

    <h3>Why OSI Matters for Azure</h3>
    <ul>
        <li><strong>Layer 4 (Transport):</strong> Azure Load Balancer operates here — forwards TCP/UDP traffic</li>
        <li><strong>Layer 7 (Application):</strong> Azure Application Gateway & Azure Front Door operate here — understands HTTP, can route by URL path</li>
        <li><strong>Layer 3 (Network):</strong> NSGs filter traffic based on IP addresses and ports</li>
        <li><strong>Layer 2 (Data Link):</strong> Azure VNets handle this for you internally</li>
    </ul>
</div>

<div class="learn-section">
    <h2>TCP/IP Model — The Practical Model</h2>
    <p>While OSI is a teaching model, TCP/IP is what the internet actually uses. It has 4 layers:</p>
    
    <table class="content-table">
        <tr><th>TCP/IP Layer</th><th>OSI Equivalent</th><th>Key Protocols</th></tr>
        <tr><td><strong>Application</strong></td><td>Layers 5-7</td><td>HTTP, DNS, FTP, SSH</td></tr>
        <tr><td><strong>Transport</strong></td><td>Layer 4</td><td>TCP, UDP</td></tr>
        <tr><td><strong>Internet</strong></td><td>Layer 3</td><td>IP, ICMP, ARP</td></tr>
        <tr><td><strong>Network Access</strong></td><td>Layers 1-2</td><td>Ethernet, Wi-Fi</td></tr>
    </table>

    <h3>TCP vs UDP</h3>
    <div class="comparison-grid">
        <div class="comparison-card">
            <h4>TCP (Transmission Control Protocol)</h4>
            <ul>
                <li>Connection-oriented (3-way handshake)</li>
                <li>Reliable — guarantees delivery</li>
                <li>Ordered — data arrives in sequence</li>
                <li>Slower but dependable</li>
                <li>Used by: HTTP, SSH, FTP, SMTP</li>
            </ul>
        </div>
        <div class="comparison-card">
            <h4>UDP (User Datagram Protocol)</h4>
            <ul>
                <li>Connectionless — fire and forget</li>
                <li>Unreliable — no delivery guarantee</li>
                <li>Unordered — packets may arrive jumbled</li>
                <li>Faster, lower overhead</li>
                <li>Used by: DNS, DHCP, video streaming</li>
            </ul>
        </div>
    </div>
</div>

<div class="learn-section">
    <h2>IP Addressing Basics</h2>
    <p>Every device on a network needs a unique identifier. That's an IP address.</p>
    
    <h3>IPv4 Addresses</h3>
    <p>An IPv4 address is a 32-bit number written as four octets: <span class="code-inline">192.168.1.100</span></p>
    <p>Each octet ranges from 0–255. Total possible addresses: ~4.3 billion.</p>

    <h3>Public vs. Private IP Addresses</h3>
    <table class="content-table">
        <tr><th>Type</th><th>Range</th><th>Use</th></tr>
        <tr><td><strong>Private (Class A)</strong></td><td>10.0.0.0 – 10.255.255.255</td><td>Large enterprise networks</td></tr>
        <tr><td><strong>Private (Class B)</strong></td><td>172.16.0.0 – 172.31.255.255</td><td>Medium networks</td></tr>
        <tr><td><strong>Private (Class C)</strong></td><td>192.168.0.0 – 192.168.255.255</td><td>Small/home networks</td></tr>
        <tr><td><strong>Public</strong></td><td>Everything else</td><td>Internet-routable</td></tr>
    </table>

    <div class="concept-box">
        <h4>🔑 Key Concept: CIDR Notation</h4>
        <p>CIDR (Classless Inter-Domain Routing) specifies how many bits are the "network" part. Example: <span class="code-inline">10.0.0.0/16</span> means the first 16 bits (10.0) are the network, leaving 16 bits for hosts = 65,536 addresses. Azure VNets use CIDR extensively.</p>
    </div>

    <h3>Common CIDR Blocks</h3>
    <table class="content-table">
        <tr><th>CIDR</th><th>Subnet Mask</th><th>Addresses</th><th>Usable Hosts</th></tr>
        <tr><td>/8</td><td>255.0.0.0</td><td>16,777,216</td><td>16,777,214</td></tr>
        <tr><td>/16</td><td>255.255.0.0</td><td>65,536</td><td>65,534</td></tr>
        <tr><td>/24</td><td>255.255.255.0</td><td>256</td><td>254</td></tr>
        <tr><td>/27</td><td>255.255.255.224</td><td>32</td><td>30</td></tr>
        <tr><td>/28</td><td>255.255.255.240</td><td>16</td><td>14</td></tr>
        <tr><td>/32</td><td>255.255.255.255</td><td>1</td><td>1 (single host)</td></tr>
    </table>

    <div class="warning-box">
        <h4>⚠️ Azure Reserved Addresses</h4>
        <p>Azure reserves 5 addresses per subnet: the first four and the last. So a /24 subnet gives you 251 usable addresses (256 - 5), not 254. This is different from standard networking!</p>
    </div>
</div>

<div class="learn-section">
    <h2>DNS — Domain Name System</h2>
    <p>DNS translates human-readable names (like <span class="code-inline">www.microsoft.com</span>) into IP addresses (like <span class="code-inline">20.70.246.20</span>).</p>
    
    <h3>How DNS Resolution Works</h3>
    <ol>
        <li>You type <span class="code-inline">www.microsoft.com</span> in your browser</li>
        <li>Your OS checks its local DNS cache</li>
        <li>If not cached, it queries your configured DNS resolver</li>
        <li>The resolver queries root servers → TLD servers (.com) → authoritative servers</li>
        <li>The authoritative server returns the IP address</li>
        <li>Your browser connects to that IP</li>
    </ol>

    <h3>DNS Record Types</h3>
    <table class="content-table">
        <tr><th>Type</th><th>Purpose</th><th>Example</th></tr>
        <tr><td><strong>A</strong></td><td>Maps name to IPv4 address</td><td>www → 20.70.246.20</td></tr>
        <tr><td><strong>AAAA</strong></td><td>Maps name to IPv6 address</td><td>www → 2001:db8::1</td></tr>
        <tr><td><strong>CNAME</strong></td><td>Alias to another domain</td><td>blog → bloghost.azurefd.net</td></tr>
        <tr><td><strong>MX</strong></td><td>Mail server routing</td><td>@ → mail.example.com</td></tr>
        <tr><td><strong>TXT</strong></td><td>Arbitrary text (verification, SPF)</td><td>@ → "v=spf1 include:..."</td></tr>
        <tr><td><strong>NS</strong></td><td>Nameserver delegation</td><td>@ → ns1.azure-dns.com</td></tr>
        <tr><td><strong>SOA</strong></td><td>Start of authority</td><td>Zone metadata</td></tr>
    </table>

    <div class="tip-box">
        <h4>💡 Azure DNS</h4>
        <p>Azure DNS hosts your DNS zones on Azure infrastructure. You'll use A records and CNAME records extensively when configuring Azure Front Door custom domains.</p>
    </div>
</div>

<div class="learn-section">
    <h2>HTTP/HTTPS & Ports</h2>
    <p>HTTP (HyperText Transfer Protocol) is how web browsers talk to web servers.</p>
    
    <h3>Key Concepts</h3>
    <ul>
        <li><strong>HTTP</strong> runs on port 80 — unencrypted</li>
        <li><strong>HTTPS</strong> runs on port 443 — encrypted with TLS</li>
        <li><strong>Methods:</strong> GET (read), POST (create), PUT (update), DELETE (remove)</li>
        <li><strong>Status codes:</strong> 200 OK, 301 Redirect, 404 Not Found, 500 Server Error</li>
    </ul>

    <h3>Common Ports to Know</h3>
    <table class="content-table">
        <tr><th>Port</th><th>Protocol</th><th>Use</th></tr>
        <tr><td>22</td><td>SSH</td><td>Secure remote access to Linux VMs</td></tr>
        <tr><td>53</td><td>DNS</td><td>Name resolution</td></tr>
        <tr><td>80</td><td>HTTP</td><td>Web traffic (unencrypted)</td></tr>
        <tr><td>443</td><td>HTTPS</td><td>Web traffic (encrypted)</td></tr>
        <tr><td>3389</td><td>RDP</td><td>Remote Desktop to Windows VMs</td></tr>
        <tr><td>3306</td><td>MySQL</td><td>Database access</td></tr>
        <tr><td>1433</td><td>MS SQL</td><td>SQL Server access</td></tr>
    </table>

    <div class="warning-box">
        <h4>⚠️ Security Note</h4>
        <p>In Azure, you'll use NSGs (Network Security Groups) to control which ports are open. Never expose management ports (22, 3389) to the entire internet — always restrict to your IP or use Azure Bastion.</p>
    </div>
</div>
`,
    diagrams: [
        {
            id: 'osi-layers',
            type: 'osi-model',
            title: 'The OSI Model — 7 Layers with Azure Mapping',
            icon: '📶',
            description: 'Step through each OSI layer and see which Azure services operate at that layer. Hover over layers for details.',
            steps: [
                'Layer 7 — Application: HTTP/DNS. Azure Front Door & Application Gateway work here.',
                'Layer 6 — Presentation: SSL/TLS encryption. Azure handles TLS termination at the edge.',
                'Layer 5 — Session: Manages connections. Azure uses session affinity (sticky sessions).',
                'Layer 4 — Transport: TCP/UDP. Azure Load Balancer operates at this layer.',
                'Layer 3 — Network: IP routing. VNets, NSGs, and User-Defined Routes live here.',
                'Layer 2 — Data Link: MAC addressing. Azure manages virtual NICs internally.',
                'Layer 1 — Physical: Cables & signals. Azure datacenters handle all physical infrastructure.'
            ],
            legend: [
                { color: '#d13438', label: 'Upper Layers (7-5)' },
                { color: '#ff8c00', label: 'Transport (4)' },
                { color: '#107c10', label: 'Lower Layers (3-1)' }
            ]
        },
        {
            id: 'tcp-3way',
            type: 'tcp-handshake',
            title: 'TCP 3-Way Handshake',
            icon: '🤝',
            description: 'Watch how TCP establishes a reliable connection before any data is sent. This is why TCP is "connection-oriented."',
            steps: [
                'Step 1 — SYN: Client sends a SYN packet with an initial sequence number (seq=100) to the server.',
                'Step 2 — SYN-ACK: Server responds with its own sequence number (seq=300) and acknowledges the client (ack=101).',
                'Step 3 — ACK: Client acknowledges the server\'s sequence (ack=301). Three-way handshake complete!',
                'Connection Established! Both sides can now send data reliably. Every Azure service using TCP (HTTP, SSH, SQL) does this.'
            ]
        },
        {
            id: 'dns-flow',
            type: 'dns-resolution',
            title: 'DNS Resolution — How Names Become IPs',
            icon: '🔍',
            description: 'Follow a DNS query from your browser all the way to the authoritative server. This happens every time you visit a website.',
            steps: [
                'Your browser needs to reach "app.contoso.com" — it needs an IP address.',
                'First check: local DNS cache. If you visited recently, the IP is cached.',
                'If not cached, ask the ISP\'s recursive resolver to find it.',
                'Resolver asks a Root DNS server: "Who manages .com?"',
                'Root says: "Ask the .com TLD server at this address."',
                'TLD says: "The authoritative server for contoso.com is at this address."',
                'Authoritative server responds with the final IP: 20.245.156.100 — browser connects!'
            ]
        },
        {
            id: 'packet-travel',
            type: 'packet-journey',
            title: 'How a Packet Travels to Azure',
            icon: '📦',
            description: 'Trace a network packet from your computer through the internet to an Azure VM. Each hop processes headers at different layers.',
            steps: [
                'Your PC creates an HTTP request. The NIC driver frames it for the local network.',
                'Your router performs NAT — replaces your private IP with the public IP for the internet.',
                'Your ISP routes the packet through the internet backbone using BGP routing tables.',
                'Packet enters Microsoft\'s network at the nearest edge POP via Anycast.',
                'Microsoft\'s private backbone routes it to the destination Azure region.',
                'Azure\'s SDN delivers it to the VM\'s virtual NIC inside your VNet.'
            ]
        }
    ],
    quiz: [
        {
            question: 'Which OSI layer does Azure Application Gateway operate at?',
            options: ['Layer 3 — Network', 'Layer 4 — Transport', 'Layer 7 — Application', 'Layer 2 — Data Link'],
            correct: 2,
            explanation: 'Azure Application Gateway is a Layer 7 (Application layer) load balancer. It understands HTTP/HTTPS and can make routing decisions based on URL paths, host headers, and other HTTP attributes.'
        },
        {
            question: 'What is the CIDR notation for a subnet mask of 255.255.255.0?',
            options: ['/8', '/16', '/24', '/32'],
            correct: 2,
            explanation: '/24 means the first 24 bits are the network portion, which corresponds to 255.255.255.0. This gives you 256 addresses (2^8 = 256 host bits).'
        },
        {
            question: 'How many usable IP addresses does Azure provide in a /24 subnet?',
            options: ['256', '254', '251', '250'],
            correct: 2,
            explanation: 'Azure reserves 5 addresses per subnet (first four + last). So 256 - 5 = 251 usable addresses. This is different from standard networking which reserves only 2 (network + broadcast).'
        },
        {
            question: 'Which DNS record type creates an alias to another domain name?',
            options: ['A record', 'MX record', 'CNAME record', 'TXT record'],
            correct: 2,
            explanation: 'CNAME (Canonical Name) records create aliases. For example, you might CNAME blog.example.com to yourapp.azurewebsites.net. This is commonly used with Azure Front Door custom domains.'
        },
        {
            question: 'What is the key difference between TCP and UDP?',
            options: ['TCP is faster than UDP', 'UDP guarantees delivery, TCP does not', 'TCP is connection-oriented and reliable, UDP is connectionless', 'UDP uses port numbers, TCP does not'],
            correct: 2,
            explanation: 'TCP establishes a connection (3-way handshake) and guarantees ordered, reliable delivery. UDP is "fire and forget" — faster but no delivery guarantee. DNS uses UDP for quick lookups, while HTTP uses TCP for reliable web page delivery.'
        },
        {
            question: 'Which IP range is a private (non-routable) address space?',
            options: ['8.8.8.0/24', '10.0.0.0/8', '168.63.129.16/32', '20.0.0.0/8'],
            correct: 1,
            explanation: '10.0.0.0/8 is one of three private IP ranges (RFC 1918). The others are 172.16.0.0/12 and 192.168.0.0/16. Azure VNets use these private ranges.'
        },
        {
            question: 'What port does SSH use by default?',
            options: ['80', '443', '22', '3389'],
            correct: 2,
            explanation: 'SSH (Secure Shell) uses port 22. This is how you remotely access Linux VMs in Azure. RDP (port 3389) is used for Windows VMs.'
        },
        {
            question: 'In the TCP/IP model, which layer handles routing?',
            options: ['Application', 'Transport', 'Internet', 'Network Access'],
            correct: 2,
            explanation: 'The Internet layer (equivalent to OSI Layer 3) handles IP addressing and routing. This is where routers make forwarding decisions based on destination IP addresses.'
        }
    ],
    interactive: [
        {
            type: 'drag-drop',
            id: 'osi-layer-match',
            title: 'Match the OSI Layer',
            description: 'Drag each technology/protocol to its correct OSI layer.',
            items: ['HTTP', 'TCP', 'IP Address', 'Ethernet', 'TLS/SSL', 'Switch'],
            targets: {
                'Layer 7 - Application': ['HTTP'],
                'Layer 6 - Presentation': ['TLS/SSL'],
                'Layer 4 - Transport': ['TCP'],
                'Layer 3 - Network': ['IP Address'],
                'Layer 2 - Data Link': ['Ethernet', 'Switch']
            }
        },
        {
            type: 'subnet-calculator',
            id: 'cidr-calc',
            title: 'Subnet Calculator',
            description: 'Enter a CIDR block and see how many hosts it provides. Try different values and note how Azure reserves 5 addresses per subnet.'
        },
        {
            type: 'flashcards',
            id: 'net-flashcards',
            title: 'Key Terms Flashcards',
            cards: [
                { front: 'What is a subnet?', back: 'A logical subdivision of an IP network. It divides a larger network into smaller, more manageable segments. In Azure, subnets live inside VNets.' },
                { front: 'What does CIDR stand for?', back: 'Classless Inter-Domain Routing. It\'s a notation like /24 that specifies how many bits are used for the network portion of an IP address.' },
                { front: 'What is the 3-way handshake?', back: 'TCP connection establishment: SYN → SYN-ACK → ACK. The client sends SYN, the server responds SYN-ACK, the client confirms with ACK.' },
                { front: 'What is NAT?', back: 'Network Address Translation. It translates private IP addresses to public IP addresses. Azure uses NAT for outbound internet connectivity from VMs.' },
                { front: 'What does TTL mean in DNS?', back: 'Time To Live. It specifies how long a DNS record should be cached (in seconds). Lower TTL = more frequent lookups but faster propagation of changes.' },
                { front: 'What is ARP?', back: 'Address Resolution Protocol. It maps IP addresses (Layer 3) to MAC addresses (Layer 2). Used within a local network segment.' }
            ]
        }
    ],
    lab: {
        title: 'Hands-On: Explore Networking with Azure Cloud Shell',
        icon: '🔬',
        scenario: 'Use Azure Cloud Shell to explore real networking concepts — DNS lookups, tracing routes, and understanding how Azure resolves network addresses.',
        duration: '20-30 minutes',
        cost: 'Free (Cloud Shell only)',
        difficulty: 'Beginner',
        prerequisites: ['An Azure account (free tier works)', 'Access to Azure Portal (portal.azure.com)'],
        cleanup: '# No resources created — nothing to clean up!\necho "This lab used only Cloud Shell commands"',
        steps: [
            {
                title: 'Open Azure Cloud Shell',
                subtitle: 'Launch your terminal in the cloud',
                type: 'confirm',
                explanation: 'Azure Cloud Shell gives you a free Linux terminal in your browser with Azure CLI pre-installed. No local setup needed.',
                portal: `<ol>
                    <li>Go to <a href="https://portal.azure.com" target="_blank">portal.azure.com</a> and sign in</li>
                    <li>Click the <strong>Cloud Shell icon</strong> (>_) in the top toolbar</li>
                    <li>If prompted, choose <strong>Bash</strong> (not PowerShell)</li>
                    <li>If this is your first time, it will ask to create a storage account — click <strong>Create storage</strong></li>
                    <li>Wait for the terminal to appear at the bottom of your browser</li>
                </ol>`,
                tip: 'You can also go directly to <a href="https://shell.azure.com" target="_blank">shell.azure.com</a> for a full-screen Cloud Shell experience.',
                verification: 'Type <code>az --version</code> and press Enter. You should see the Azure CLI version number.'
            },
            {
                title: 'Perform a DNS Lookup',
                subtitle: 'See DNS resolution in action',
                type: 'confirm',
                explanation: 'Let\'s use the <code>nslookup</code> command to see how DNS resolves domain names to IP addresses — the very first step in any network connection.',
                portal: `<ol>
                    <li>In Cloud Shell, type:<div class="lab-code-block">nslookup microsoft.com</div></li>
                    <li>Observe the output — you\'ll see:
                        <ul>
                            <li><strong>Server:</strong> The DNS server that answered (Azure\'s internal DNS)</li>
                            <li><strong>Address:</strong> The DNS server\'s IP</li>
                            <li><strong>Non-authoritative answer:</strong> The resolved IP address(es) of microsoft.com</li>
                        </ul>
                    </li>
                    <li>Now try an Azure-specific domain:<div class="lab-code-block">nslookup portal.azure.com</div></li>
                    <li>Notice it resolves to a CNAME chain (portal.azure.com → afd.azure.com) — this shows Azure Front Door in action!</li>
                </ol>`,
                cli: `<div class="lab-code-block"># Basic DNS lookup
nslookup microsoft.com

# Dig for more detail (shows record types, TTL)
dig microsoft.com

# Query specific record types
dig microsoft.com MX    # Mail servers
dig microsoft.com NS    # Name servers
dig microsoft.com TXT   # TXT records (SPF, verification)

# See the full CNAME chain for Azure Front Door
dig portal.azure.com CNAME</div>`,
                tip: 'The CNAME chain for portal.azure.com shows Azure Front Door in action — Microsoft uses it to globally load balance the Azure Portal itself!'
            },
            {
                title: 'Trace a Network Route',
                subtitle: 'See how packets travel across the internet',
                type: 'confirm',
                explanation: 'The <code>traceroute</code> command shows every router (hop) between you and a destination. This demonstrates Layer 3 routing in real time.',
                portal: `<ol>
                    <li>In Cloud Shell, run:<div class="lab-code-block">traceroute -m 15 microsoft.com</div></li>
                    <li>Each line is a "hop" — a router the packet passes through</li>
                    <li>You\'ll see: hop number, router hostname/IP, and round-trip times in milliseconds</li>
                    <li>Notice: Cloud Shell runs inside Azure, so the first hops are within Microsoft\'s network</li>
                    <li>Try another target:<div class="lab-code-block">traceroute -m 15 google.com</div></li>
                    <li>Compare — you may see the packet exit Microsoft\'s network to reach Google\'s</li>
                </ol>`,
                tip: 'Some hops show "* * *" — that means the router is configured to not respond to traceroute probes (ICMP). This is normal and common for security.',
                verification: 'You should see numbered hops (1, 2, 3...) with IP addresses and response times. The number of hops tells you how many routers the packet traverses.'
            },
            {
                title: 'Test TCP Connectivity',
                subtitle: 'Verify a port is open using the transport layer',
                type: 'confirm',
                explanation: 'Before Azure route tables and NSGs, let\'s see basic TCP connectivity testing. This is Layer 4 in action.',
                portal: `<ol>
                    <li>Test if a web server is listening on port 443 (HTTPS):<div class="lab-code-block">curl -I https://microsoft.com</div></li>
                    <li>You should see HTTP response headers (HTTP/2 200 or 301) — this confirms the TCP connection succeeded</li>
                    <li>Check the response for key networking info:
                        <ul>
                            <li><strong>HTTP/2:</strong> The protocol version</li>
                            <li><strong>x-azure-ref:</strong> This header proves the request went through Azure Front Door</li>
                            <li><strong>x-cache:</strong> Shows if the response was served from CDN cache</li>
                        </ul>
                    </li>
                    <li>Test a port that should be closed:<div class="lab-code-block">curl -I --connect-timeout 5 http://microsoft.com:8080</div></li>
                    <li>This will timeout — port 8080 is not open. This is how firewalls/NSGs block traffic.</li>
                </ol>`,
                verification: 'The first curl should return HTTP headers with status 200 or 301. The second should timeout — demonstrating port filtering.'
            },
            {
                title: 'Review: Azure Front Door Headers',
                subtitle: 'Confirm your understanding',
                type: 'confirm',
                explanation: 'The x-azure-ref header on microsoft.com tells you the site is behind Azure Front Door (a global load balancer). Azure Front Door adds this header to every request it processes — so seeing it in curl output is proof the request was routed through Front Door\'s global edge network.',
                portal: '<ol><li><strong>Key concept:</strong> The <code>x-azure-ref</code> header is injected by Azure Front Door on every request it handles</li><li>If you see this header, the site is using Azure Front Door as a global load balancer/CDN</li><li>This is a quick way to identify Front Door-backed services during troubleshooting</li></ol>'
            }
        ]
    }
},

// ──────────────────────────────────────────────
// MODULE 2: Azure Environment Basics
// ──────────────────────────────────────────────
{
    id: 'azure-environment',
    level: 100,
    title: 'The Azure Environment',
    subtitle: 'Subscriptions, resource groups, regions, availability zones',
    icon: '☁️',
    estimatedTime: '30m',
    learn: `
<div class="learn-section">
    <h2>Understanding the Azure Hierarchy</h2>
    <p>Before you create any networking resources, you need to understand how Azure organizes everything. Think of it as a tree structure:</p>
    
    <div class="diagram-container">
        <svg viewBox="0 0 600 380" xmlns="http://www.w3.org/2000/svg" style="max-width:600px;width:100%;font-family:'Segoe UI',sans-serif">
          <!-- Azure AD Tenant -->
          <rect x="150" y="10" width="300" height="44" rx="8" fill="#fff" stroke="#0078D4" stroke-width="2"/>
          <text x="300" y="30" text-anchor="middle" font-size="13" font-weight="600" fill="#0078D4">Azure AD Tenant</text>
          <text x="300" y="46" text-anchor="middle" font-size="10" fill="#555">Identity &amp; Access Management</text>
          <!-- Line down -->
          <line x1="300" y1="54" x2="300" y2="74" stroke="#333" stroke-width="1.5" marker-end="url(#ah)"/>
          <!-- Management Groups -->
          <rect x="170" y="74" width="260" height="40" rx="8" fill="#fff" stroke="#0078D4" stroke-width="2"/>
          <text x="300" y="94" text-anchor="middle" font-size="12" font-weight="600" fill="#0078D4">Management Groups</text>
          <text x="300" y="108" text-anchor="middle" font-size="10" fill="#555">Organize subscriptions</text>
          <!-- Line splits -->
          <line x1="300" y1="114" x2="300" y2="130" stroke="#333" stroke-width="1.5"/>
          <line x1="300" y1="130" x2="180" y2="130" stroke="#333" stroke-width="1.5"/>
          <line x1="300" y1="130" x2="420" y2="130" stroke="#333" stroke-width="1.5"/>
          <line x1="180" y1="130" x2="180" y2="148" stroke="#333" stroke-width="1.5" marker-end="url(#ah)"/>
          <line x1="420" y1="130" x2="420" y2="148" stroke="#333" stroke-width="1.5" marker-end="url(#ah)"/>
          <!-- Sub A -->
          <rect x="110" y="148" width="140" height="38" rx="8" fill="#fff" stroke="#107C10" stroke-width="2"/>
          <text x="180" y="166" text-anchor="middle" font-size="12" font-weight="600" fill="#107C10">Sub A (Dev)</text>
          <text x="180" y="180" text-anchor="middle" font-size="9" fill="#555">Development</text>
          <!-- Sub B -->
          <rect x="350" y="148" width="140" height="38" rx="8" fill="#fff" stroke="#FF8C00" stroke-width="2"/>
          <text x="420" y="166" text-anchor="middle" font-size="12" font-weight="600" fill="#FF8C00">Sub B (Prod)</text>
          <text x="420" y="180" text-anchor="middle" font-size="9" fill="#555">Production</text>
          <!-- Lines down -->
          <line x1="180" y1="186" x2="180" y2="210" stroke="#333" stroke-width="1.5" marker-end="url(#ah)"/>
          <line x1="420" y1="186" x2="420" y2="210" stroke="#333" stroke-width="1.5" marker-end="url(#ah)"/>
          <!-- RG 1 -->
          <rect x="110" y="210" width="140" height="36" rx="8" fill="#fff" stroke="#7A3B93" stroke-width="2"/>
          <text x="180" y="228" text-anchor="middle" font-size="11" font-weight="600" fill="#7A3B93">RG: Networking</text>
          <text x="180" y="241" text-anchor="middle" font-size="9" fill="#555">Resource Group 1</text>
          <!-- RG 3 -->
          <rect x="350" y="210" width="140" height="36" rx="8" fill="#fff" stroke="#7A3B93" stroke-width="2"/>
          <text x="420" y="228" text-anchor="middle" font-size="11" font-weight="600" fill="#7A3B93">RG: Frontend</text>
          <text x="420" y="241" text-anchor="middle" font-size="9" fill="#555">Resource Group 3</text>
          <!-- Lines down -->
          <line x1="180" y1="246" x2="180" y2="270" stroke="#333" stroke-width="1.5" marker-end="url(#ah)"/>
          <line x1="420" y1="246" x2="420" y2="270" stroke="#333" stroke-width="1.5" marker-end="url(#ah)"/>
          <!-- Resources 1 -->
          <rect x="95" y="270" width="170" height="54" rx="8" fill="#E8F0FE" stroke="#0078D4" stroke-width="1.5"/>
          <text x="180" y="288" text-anchor="middle" font-size="10" fill="#333">VNet, NSG,</text>
          <text x="180" y="301" text-anchor="middle" font-size="10" fill="#333">Public IP,</text>
          <text x="180" y="314" text-anchor="middle" font-size="10" fill="#333">Load Balancer</text>
          <!-- Resources 3 -->
          <rect x="335" y="270" width="170" height="54" rx="8" fill="#FFF4E5" stroke="#FF8C00" stroke-width="1.5"/>
          <text x="420" y="288" text-anchor="middle" font-size="10" fill="#333">Front Door,</text>
          <text x="420" y="301" text-anchor="middle" font-size="10" fill="#333">App Service,</text>
          <text x="420" y="314" text-anchor="middle" font-size="10" fill="#333">Storage</text>
          <!-- Arrowhead marker -->
          <defs><marker id="ah" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6" fill="#333"/></marker></defs>
        </svg>
    </div>

    <h3>Azure AD Tenant</h3>
    <p>Your organization's identity boundary. It contains all your users, groups, and service principals. One tenant can have many subscriptions.</p>

    <h3>Management Groups</h3>
    <p>Optional containers that help you manage access, policy, and compliance across multiple subscriptions. Think of them as folders for your subscriptions.</p>

    <h3>Subscriptions</h3>
    <p>A billing and access boundary. Each subscription gets its own bill. Common pattern:</p>
    <ul>
        <li><strong>Dev/Test subscription</strong> — lower costs, experimentation</li>
        <li><strong>Production subscription</strong> — strict governance, higher budgets</li>
    </ul>

    <div class="concept-box">
        <h4>🔑 Key Concept: Subscription Limits</h4>
        <p>Many Azure resources have per-subscription limits. For example: max 1,000 VNets per subscription, max 5,000 NSG rules. These are soft limits that can be increased via support requests.</p>
    </div>

    <h3>Resource Groups</h3>
    <p>Logical containers for resources that share the same lifecycle. A resource group has a region, but resources inside it can be in any region.</p>
    <ul>
        <li>Resources can only belong to one resource group</li>
        <li>Deleting a resource group deletes ALL resources inside it</li>
        <li>Apply RBAC (access control) at the resource group level</li>
        <li>Apply tags for cost tracking and organization</li>
    </ul>

    <div class="warning-box">
        <h4>⚠️ Important for AZ-104</h4>
        <p>The resource group region only stores metadata. A VNet in a resource group located in "East US" can be deployed to "West Europe". Don't confuse resource group location with resource location.</p>
    </div>
</div>

<div class="learn-section">
    <h2>Azure Regions & Availability Zones</h2>
    
    <h3>Regions</h3>
    <p>Azure has 60+ regions worldwide. A region is a set of datacenters connected by a low-latency network. Key regions:</p>
    <table class="content-table">
        <tr><th>Geography</th><th>Regions</th><th>Use Case</th></tr>
        <tr><td>US</td><td>East US, West US 2, Central US, etc.</td><td>Most commonly used for US customers</td></tr>
        <tr><td>Europe</td><td>West Europe, North Europe, UK South</td><td>EU data residency compliance</td></tr>
        <tr><td>Asia</td><td>Southeast Asia, East Asia, Japan East</td><td>Asia-Pacific presence</td></tr>
    </table>

    <h3>Region Pairs</h3>
    <p>Each Azure region is paired with another region 300+ miles away. Azure uses pairs for:</p>
    <ul>
        <li>Planned maintenance (never both at once)</li>
        <li>Disaster recovery replication</li>
        <li>Example: East US ↔ West US, North Europe ↔ West Europe</li>
    </ul>

    <h3>Availability Zones</h3>
    <p>Within a region, Availability Zones (AZs) are physically separate datacenters with independent power, cooling, and networking. Most regions have 3 zones.</p>
    
    <div class="diagram-container">
        <svg viewBox="0 0 550 220" xmlns="http://www.w3.org/2000/svg" style="max-width:550px;width:100%;font-family:'Segoe UI',sans-serif">
          <!-- Region box -->
          <rect x="10" y="10" width="530" height="200" rx="12" fill="#E8F4FD" stroke="#0078D4" stroke-width="2"/>
          <text x="275" y="32" text-anchor="middle" font-size="14" font-weight="700" fill="#0078D4">Region: East US</text>
          <!-- Zone 1 -->
          <rect x="35" y="48" width="145" height="120" rx="8" fill="#fff" stroke="#107C10" stroke-width="2"/>
          <text x="107" y="68" text-anchor="middle" font-size="12" font-weight="600" fill="#107C10">Zone 1</text>
          <rect x="55" y="78" width="100" height="28" rx="5" fill="#E8F0FE" stroke="#0078D4" stroke-width="1.2"/>
          <text x="105" y="96" text-anchor="middle" font-size="11" fill="#333">VM-1</text>
          <rect x="55" y="114" width="100" height="28" rx="5" fill="#FFF4E5" stroke="#FF8C00" stroke-width="1.2"/>
          <text x="105" y="132" text-anchor="middle" font-size="11" fill="#333">DB-1</text>
          <!-- Zone 2 -->
          <rect x="202" y="48" width="145" height="120" rx="8" fill="#fff" stroke="#107C10" stroke-width="2"/>
          <text x="274" y="68" text-anchor="middle" font-size="12" font-weight="600" fill="#107C10">Zone 2</text>
          <rect x="222" y="78" width="100" height="28" rx="5" fill="#E8F0FE" stroke="#0078D4" stroke-width="1.2"/>
          <text x="272" y="96" text-anchor="middle" font-size="11" fill="#333">VM-2</text>
          <rect x="222" y="114" width="100" height="28" rx="5" fill="#FFF4E5" stroke="#FF8C00" stroke-width="1.2"/>
          <text x="272" y="132" text-anchor="middle" font-size="11" fill="#333">DB-2</text>
          <!-- Zone 3 -->
          <rect x="369" y="48" width="145" height="120" rx="8" fill="#fff" stroke="#107C10" stroke-width="2"/>
          <text x="441" y="68" text-anchor="middle" font-size="12" font-weight="600" fill="#107C10">Zone 3</text>
          <rect x="389" y="78" width="100" height="28" rx="5" fill="#E8F0FE" stroke="#0078D4" stroke-width="1.2"/>
          <text x="439" y="96" text-anchor="middle" font-size="11" fill="#333">VM-3</text>
          <!-- Latency line -->
          <line x1="60" y1="182" x2="490" y2="182" stroke="#7A3B93" stroke-width="1.5" stroke-dasharray="6,3"/>
          <circle cx="107" cy="182" r="3" fill="#7A3B93"/>
          <circle cx="274" cy="182" r="3" fill="#7A3B93"/>
          <circle cx="441" cy="182" r="3" fill="#7A3B93"/>
          <text x="275" y="198" text-anchor="middle" font-size="11" fill="#7A3B93" font-style="italic">&lt;2ms latency interconnect</text>
        </svg>
    </div>

    <h3>Service Tiers by Availability</h3>
    <table class="content-table">
        <tr><th>Tier</th><th>Description</th><th>Example</th></tr>
        <tr><td><strong>Zonal</strong></td><td>Pinned to a specific zone</td><td>VM in Zone 1</td></tr>
        <tr><td><strong>Zone-Redundant</strong></td><td>Replicated across zones automatically</td><td>Zone-redundant Storage, Standard LB</td></tr>
        <tr><td><strong>Non-regional</strong></td><td>Globally distributed, no specific region</td><td>Azure Front Door, Traffic Manager</td></tr>
    </table>

    <div class="concept-box">
        <h4>🔑 Key Concept: Azure Front Door is Global</h4>
        <p>Azure Front Door is a <strong>non-regional, globally distributed</strong> service. It operates at Microsoft's edge network across 100+ locations worldwide. Unlike a VNet or Load Balancer, you don't pick a region for Front Door — it's everywhere.</p>
    </div>
</div>

<div class="learn-section">
    <h2>Azure Resource Manager (ARM)</h2>
    <p>ARM is the deployment and management layer for Azure. Every action you take — whether through the Portal, CLI, PowerShell, or API — goes through ARM.</p>
    
    <h3>How ARM Works</h3>
    <ol>
        <li>You send a request (e.g., "create a VNet")</li>
        <li>ARM authenticates and authorizes you (Azure AD + RBAC)</li>
        <li>ARM routes the request to the appropriate resource provider (e.g., Microsoft.Network)</li>
        <li>The resource provider creates the resource</li>
        <li>ARM returns the result</li>
    </ol>

    <h3>Resource Providers for Networking</h3>
    <table class="content-table">
        <tr><th>Provider</th><th>Resources</th></tr>
        <tr><td>Microsoft.Network</td><td>VNets, NSGs, Public IPs, Load Balancers, VPN Gateways</td></tr>
        <tr><td>Microsoft.Cdn</td><td>Azure Front Door, CDN Profiles</td></tr>
        <tr><td>Microsoft.Compute</td><td>VMs, VM Scale Sets</td></tr>
    </table>

    <div class="tip-box">
        <h4>💡 CLI Tip</h4>
        <p>You can manage everything via Azure CLI. Install it and run: <span class="code-inline">az login</span> to get started. We'll use CLI commands throughout this course.</p>
    </div>
</div>
`,
    diagrams: [
        {
            id: 'azure-global-infra',
            type: 'azure-regions',
            title: 'Azure Global Infrastructure — Regions & Availability',
            icon: '🌍',
            description: 'Explore Azure\'s 60+ regions worldwide, availability zones within regions, and region pairs for disaster recovery.',
            steps: [
                'US Regions: East US (Virginia) is the most popular. Multiple regions across the US for latency and compliance.',
                'Europe Regions: West Europe (Netherlands) and North Europe (Ireland) are key EU regions.',
                'Asia Regions: Southeast Asia (Singapore), Japan, and India provide APAC coverage.',
                'Microsoft\'s global fiber backbone connects all regions — 165,000+ miles of undersea and land cables.',
                'Availability Zones: 3+ physically separate datacenters within a region. Independent power, cooling, networking.',
                'Region Pairs: Each region is paired for disaster recovery (e.g., East US ↔ West US). GRS storage auto-replicates.'
            ],
            legend: [
                { color: '#0078d4', label: 'Americas' },
                { color: '#107c10', label: 'Europe' },
                { color: '#ff8c00', label: 'Asia Pacific' }
            ]
        }
    ],
    quiz: [
        {
            question: 'What is the correct Azure hierarchy from broadest to narrowest?',
            options: [
                'Resource Group → Subscription → Management Group',
                'Management Group → Subscription → Resource Group',
                'Subscription → Management Group → Resource Group',
                'Resource Group → Management Group → Subscription'
            ],
            correct: 1,
            explanation: 'The hierarchy is: Azure AD Tenant → Management Groups → Subscriptions → Resource Groups → Resources. Management Groups contain subscriptions, and subscriptions contain resource groups.'
        },
        {
            question: 'A resource group is located in East US. Can you create a VNet in West Europe inside this resource group?',
            options: ['No, resources must match the resource group region', 'Yes, the resource group region only stores metadata', 'Yes, but only for networking resources', 'No, unless you use a management group'],
            correct: 1,
            explanation: 'The resource group region only stores metadata about the resource group itself. Resources inside a resource group can be deployed to any Azure region.'
        },
        {
            question: 'How many Availability Zones do most Azure regions have?',
            options: ['1', '2', '3', '5'],
            correct: 2,
            explanation: 'Most Azure regions that support Availability Zones have 3 zones (Zone 1, Zone 2, Zone 3). Each zone is a physically separate datacenter with independent infrastructure.'
        },
        {
            question: 'Azure Front Door is classified as what type of service?',
            options: ['Zonal service', 'Zone-redundant service', 'Regional service', 'Non-regional (global) service'],
            correct: 3,
            explanation: 'Azure Front Door is a non-regional, globally distributed service. It operates from Microsoft\'s edge locations worldwide and is not tied to any specific Azure region.'
        },
        {
            question: 'What happens when you delete a resource group?',
            options: [
                'Only the resource group metadata is deleted',
                'All resources inside the resource group are deleted',
                'Resources are moved to a default resource group',
                'You get a warning but nothing is deleted'
            ],
            correct: 1,
            explanation: 'Deleting a resource group deletes ALL resources contained within it. This is a destructive operation and should be done carefully, especially in production.'
        },
        {
            question: 'Which component authenticates and authorizes all Azure management requests?',
            options: ['Azure Firewall', 'Azure Resource Manager (ARM)', 'Network Security Groups', 'Azure Front Door'],
            correct: 1,
            explanation: 'Azure Resource Manager (ARM) handles authentication (via Azure AD) and authorization (via RBAC) for all management plane operations. Every API call, CLI command, or Portal action goes through ARM.'
        }
    ],
    interactive: [
        {
            type: 'drag-drop',
            id: 'azure-hierarchy',
            title: 'Build the Azure Hierarchy',
            description: 'Arrange these Azure components in order from broadest (top) to narrowest (bottom).',
            items: ['Resource', 'Subscription', 'Management Group', 'Resource Group', 'Azure AD Tenant'],
            targets: {
                'Level 1 (Broadest)': ['Azure AD Tenant'],
                'Level 2': ['Management Group'],
                'Level 3': ['Subscription'],
                'Level 4': ['Resource Group'],
                'Level 5 (Narrowest)': ['Resource']
            }
        },
        {
            type: 'flashcards',
            id: 'azure-env-flashcards',
            title: 'Azure Environment Flashcards',
            cards: [
                { front: 'What is Azure AD Tenant?', back: 'Your organization\'s identity boundary in Azure. Contains users, groups, and service principals. One tenant can have many subscriptions.' },
                { front: 'What is RBAC?', back: 'Role-Based Access Control. Provides fine-grained access management for Azure resources. Roles like Owner, Contributor, Reader can be assigned at any scope.' },
                { front: 'What is a Region Pair?', back: 'Two Azure regions 300+ miles apart in the same geography. Used for disaster recovery. Example: East US ↔ West US.' },
                { front: 'What is ARM?', back: 'Azure Resource Manager — the deployment and management layer. All management actions go through ARM, which handles authentication, authorization, and routing to resource providers.' },
                { front: 'What is a Resource Provider?', back: 'A service that supplies Azure resources. E.g., Microsoft.Network provides VNets and NSGs. Must be registered in your subscription to use its resources.' }
            ]
        }
    ],
    lab: {
        title: 'Hands-On: Create Your First Resource Group & Explore Azure',
        icon: '☁️',
        scenario: 'Set up the foundational Azure environment — create a resource group, explore the portal structure, and understand how Azure organizes resources.',
        duration: '15-20 minutes',
        cost: 'Free',
        difficulty: 'Beginner',
        prerequisites: ['An Azure account (free tier works)', 'Access to Azure Portal'],
        cleanup: `az group delete --name rg-academy-lab --yes --no-wait`,
        steps: [
            {
                title: 'Navigate the Azure Portal',
                subtitle: 'Understand the portal layout',
                type: 'confirm',
                explanation: 'Before creating anything, let\'s understand the Azure Portal layout — the home page, search bar, resource groups, and how to navigate.',
                portal: `<ol>
                    <li>Go to <a href="https://portal.azure.com" target="_blank">portal.azure.com</a> and sign in</li>
                    <li>Look at the <strong>top search bar</strong> — this is your fastest way to find anything in Azure</li>
                    <li>Click <strong>All services</strong> in the left menu — browse the categories:
                        <ul>
                            <li><strong>Networking:</strong> VNets, NSGs, Load Balancers, Front Door</li>
                            <li><strong>Compute:</strong> Virtual Machines, App Services</li>
                            <li><strong>Storage:</strong> Storage Accounts, Disks</li>
                        </ul>
                    </li>
                    <li>Click <strong>Subscriptions</strong> — note your subscription name and ID</li>
                    <li>Click <strong>Resource groups</strong> — this is where all resources are organized</li>
                </ol>`,
                tip: 'Bookmark the search bar shortcut: type <code>/</code> anywhere in the portal to focus the search.'
            },
            {
                title: 'Create a Resource Group',
                subtitle: 'Your first Azure resource container',
                type: 'confirm',
                explanation: 'A Resource Group is a logical container for resources. All the networking resources you create in future labs will go into resource groups like this.',
                portal: `<ol>
                    <li>Search for <strong>"Resource groups"</strong> in the top search bar and click it</li>
                    <li>Click <strong>+ Create</strong></li>
                    <li>Fill in:
                        <ul>
                            <li><strong>Subscription:</strong> Select your subscription</li>
                            <li><strong>Resource group:</strong> <code>rg-academy-lab</code></li>
                            <li><strong>Region:</strong> <code>East US</code></li>
                        </ul>
                    </li>
                    <li>Click <strong>Review + create</strong> → <strong>Create</strong></li>
                </ol>`,
                cli: `<div class="lab-code-block"># Create a resource group in East US
az group create \\
    --name rg-academy-lab \\
    --location eastus

# Verify it was created
az group show --name rg-academy-lab --output table</div>`,
                verification: 'Navigate to Resource groups and verify <code>rg-academy-lab</code> appears in the list with location East US.'
            },
            {
                title: 'Explore Azure Resource Manager',
                subtitle: 'Understand how all Azure operations work',
                type: 'confirm',
                explanation: 'Every action in Azure — whether via Portal, CLI, PowerShell, or API — goes through Azure Resource Manager (ARM). Let\'s see this in action.',
                portal: `<ol>
                    <li>Go to your new resource group <code>rg-academy-lab</code></li>
                    <li>Click <strong>Activity log</strong> in the left menu</li>
                    <li>You should see the "Create Resource Group" operation — this shows ARM processed your request</li>
                    <li>Click the operation to see details:
                        <ul>
                            <li><strong>Initiated by:</strong> Your user account</li>
                            <li><strong>Operation:</strong> Microsoft.Resources/subscriptions/resourceGroups/write</li>
                            <li><strong>Status:</strong> Succeeded</li>
                        </ul>
                    </li>
                    <li>Click <strong>Access control (IAM)</strong> — this shows who has access and what roles they have</li>
                    <li>Click <strong>Tags</strong> — you can add metadata tags like <code>environment: lab</code></li>
                </ol>`,
                tip: 'Tags are critical for cost management and organization in real Azure environments. Always tag your resources with environment, owner, and project.'
            },
            {
                title: 'Review: Resource Group Region vs Resource Region',
                subtitle: 'Confirm your understanding',
                type: 'confirm',
                explanation: 'Yes — you CAN create a Virtual Network in West Europe inside an East US resource group. The resource group\'s region only determines where its metadata is stored, not where its child resources must live. Resources inside a resource group can be deployed to any Azure region.',
                portal: '<ol><li><strong>Key concept:</strong> A resource group\'s region only stores metadata — it does NOT restrict where child resources are deployed</li><li>You can mix resources from any region inside a single resource group</li><li>This is one of the most commonly tested Azure fundamentals — remember it!</li></ol>'
            }
        ]
    }
},

// ──────────────────────────────────────────────
// MODULE 3: Azure Virtual Networks (VNets)
// ──────────────────────────────────────────────
{
    id: 'azure-vnets',
    level: 100,
    title: 'Azure Virtual Networks (VNets)',
    subtitle: 'Creating and configuring VNets and subnets',
    icon: '🔗',
    estimatedTime: '40m',
    learn: `
<div class="learn-section">
    <h2>What is a Virtual Network?</h2>
    <p>An Azure Virtual Network (VNet) is the fundamental building block of your private network in Azure. It's a logically isolated network that enables Azure resources to securely communicate with each other, the internet, and on-premises networks.</p>
    
    <div class="concept-box">
        <h4>🔑 Think of it This Way</h4>
        <p>A VNet is like your own private data center network in Azure, but without the physical hardware. You define the IP address space, create subnets, set up routing, and control security — just like you would in a physical network, but software-defined.</p>
    </div>

    <h3>VNet Key Properties</h3>
    <ul>
        <li><strong>Address Space:</strong> One or more CIDR blocks (e.g., 10.0.0.0/16)</li>
        <li><strong>Region:</strong> A VNet exists in one Azure region</li>
        <li><strong>Subscription:</strong> A VNet belongs to one subscription</li>
        <li><strong>Subnets:</strong> Subdivisions within the VNet's address space</li>
        <li><strong>DNS:</strong> Azure-provided DNS or custom DNS servers</li>
    </ul>
</div>

<div class="learn-section">
    <h2>Designing Your VNet Address Space</h2>
    
    <h3>Best Practices</h3>
    <ul>
        <li>Use private IP ranges: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16</li>
        <li>Don't overlap with on-premises networks (important for VPN/ExpressRoute)</li>
        <li>Plan for growth — it's easier to start big than expand later</li>
        <li>Common starting point: 10.0.0.0/16 (65,536 addresses)</li>
    </ul>

    <div class="warning-box">
        <h4>⚠️ Cannot Change After Resources Deployed</h4>
        <p>While you CAN add address spaces to a VNet, you cannot shrink or modify existing CIDR ranges if resources are deployed to subnets within them. Plan carefully!</p>
    </div>

    <h3>Subnet Design</h3>
    <p>Subnets divide your VNet into smaller segments. Each subnet gets a portion of the VNet's address space.</p>
    
    <div class="diagram-container">
        <svg viewBox="0 0 550 500" xmlns="http://www.w3.org/2000/svg" style="max-width:550px;width:100%;font-family:'Segoe UI',sans-serif">
          <!-- VNet outer -->
          <rect x="10" y="10" width="530" height="480" rx="12" fill="#F0F6FF" stroke="#0078D4" stroke-width="2" stroke-dasharray="8,4"/>
          <text x="275" y="34" text-anchor="middle" font-size="14" font-weight="700" fill="#0078D4">VNet: 10.0.0.0/16</text>
          <!-- Web-Tier Subnet -->
          <rect x="30" y="48" width="490" height="95" rx="8" fill="#E6F4EA" stroke="#107C10" stroke-width="1.5" stroke-dasharray="6,3"/>
          <text x="50" y="66" font-size="12" font-weight="600" fill="#107C10">Subnet: Web-Tier</text>
          <text x="490" y="66" text-anchor="end" font-size="10" fill="#555">10.0.1.0/24</text>
          <rect x="50" y="78" width="90" height="48" rx="6" fill="#fff" stroke="#0078D4" stroke-width="1.5"/>
          <text x="95" y="106" text-anchor="middle" font-size="11" fill="#333">VM-01</text>
          <rect x="160" y="78" width="90" height="48" rx="6" fill="#fff" stroke="#0078D4" stroke-width="1.5"/>
          <text x="205" y="106" text-anchor="middle" font-size="11" fill="#333">VM-02</text>
          <rect x="270" y="78" width="90" height="48" rx="6" fill="#fff" stroke="#0078D4" stroke-width="1.5"/>
          <text x="315" y="106" text-anchor="middle" font-size="11" fill="#333">VM-03</text>
          <!-- App-Tier Subnet -->
          <rect x="30" y="158" width="490" height="95" rx="8" fill="#FFF8E1" stroke="#FF8C00" stroke-width="1.5" stroke-dasharray="6,3"/>
          <text x="50" y="176" font-size="12" font-weight="600" fill="#FF8C00">Subnet: App-Tier</text>
          <text x="490" y="176" text-anchor="end" font-size="10" fill="#555">10.0.2.0/24</text>
          <rect x="50" y="188" width="90" height="48" rx="6" fill="#fff" stroke="#FF8C00" stroke-width="1.5"/>
          <text x="95" y="216" text-anchor="middle" font-size="11" fill="#333">VM-04</text>
          <rect x="160" y="188" width="90" height="48" rx="6" fill="#fff" stroke="#FF8C00" stroke-width="1.5"/>
          <text x="205" y="216" text-anchor="middle" font-size="11" fill="#333">VM-05</text>
          <!-- DB-Tier Subnet -->
          <rect x="30" y="268" width="490" height="95" rx="8" fill="#FCE4EC" stroke="#D13438" stroke-width="1.5" stroke-dasharray="6,3"/>
          <text x="50" y="286" font-size="12" font-weight="600" fill="#D13438">Subnet: DB-Tier</text>
          <text x="490" y="286" text-anchor="end" font-size="10" fill="#555">10.0.3.0/24</text>
          <rect x="50" y="298" width="90" height="48" rx="6" fill="#fff" stroke="#D13438" stroke-width="1.5"/>
          <text x="95" y="326" text-anchor="middle" font-size="11" fill="#333">DB-01</text>
          <!-- GatewaySubnet -->
          <rect x="30" y="378" width="490" height="55" rx="8" fill="#F3E5F5" stroke="#7A3B93" stroke-width="1.5" stroke-dasharray="6,3"/>
          <text x="50" y="400" font-size="12" font-weight="600" fill="#7A3B93">GatewaySubnet</text>
          <text x="490" y="400" text-anchor="end" font-size="10" fill="#555">10.0.255.0/27</text>
          <text x="50" y="420" font-size="10" fill="#777" font-style="italic">(Reserved for VPN/ExpressRoute)</text>
        </svg>
    </div>

    <h3>Reserved Subnet Names</h3>
    <table class="content-table">
        <tr><th>Subnet Name</th><th>Purpose</th><th>Min Size</th></tr>
        <tr><td><strong>GatewaySubnet</strong></td><td>VPN/ExpressRoute gateway</td><td>/27 recommended</td></tr>
        <tr><td><strong>AzureFirewallSubnet</strong></td><td>Azure Firewall</td><td>/26 required</td></tr>
        <tr><td><strong>AzureBastionSubnet</strong></td><td>Azure Bastion</td><td>/26 required</td></tr>
        <tr><td><strong>AzureFirewallManagementSubnet</strong></td><td>Firewall forced tunneling</td><td>/26 required</td></tr>
    </table>
</div>

<div class="learn-section">
    <h2>Creating a VNet — Azure CLI</h2>
    
    <div class="code-block"># Create a resource group
az group create --name rg-networking --location eastus

# Create a VNet with address space 10.0.0.0/16
az network vnet create \\
    --resource-group rg-networking \\
    --name vnet-main \\
    --address-prefix 10.0.0.0/16 \\
    --subnet-name snet-web \\
    --subnet-prefix 10.0.1.0/24

# Add another subnet
az network vnet subnet create \\
    --resource-group rg-networking \\
    --vnet-name vnet-main \\
    --name snet-app \\
    --address-prefix 10.0.2.0/24

# List subnets
az network vnet subnet list \\
    --resource-group rg-networking \\
    --vnet-name vnet-main \\
    --output table</div>

    <h3>VNet Communication</h3>
    <p>Resources within the same VNet can communicate by default. Here's how different communication scenarios work:</p>
    
    <table class="content-table">
        <tr><th>Scenario</th><th>Default Behavior</th><th>How to Enable</th></tr>
        <tr><td>Same subnet</td><td>✅ Allowed</td><td>Automatic</td></tr>
        <tr><td>Different subnets, same VNet</td><td>✅ Allowed</td><td>Automatic (Azure routes internally)</td></tr>
        <tr><td>Different VNets</td><td>❌ Blocked</td><td>VNet Peering or VPN Gateway</td></tr>
        <tr><td>VNet to Internet (outbound)</td><td>✅ Allowed</td><td>Default SNAT or NAT Gateway</td></tr>
        <tr><td>Internet to VNet (inbound)</td><td>❌ Blocked</td><td>Public IP + NSG rule</td></tr>
        <tr><td>VNet to on-premises</td><td>❌ Blocked</td><td>VPN Gateway or ExpressRoute</td></tr>
    </table>
</div>

<div class="learn-section">
    <h2>Azure-Provided DNS & Custom DNS</h2>
    <p>By default, Azure provides DNS name resolution for VMs within the same VNet. VMs get names like <span class="code-inline">myvm.internal.cloudapp.net</span>.</p>
    
    <h3>Custom DNS Options</h3>
    <ul>
        <li><strong>Azure DNS Private Zones:</strong> Custom domain names within your VNet (e.g., myvm.contoso.internal)</li>
        <li><strong>Custom DNS servers:</strong> Point to your own DNS servers (on-premises or Azure-hosted)</li>
        <li><strong>Azure-provided:</strong> Default, works for basic scenarios</li>
    </ul>

    <div class="tip-box">
        <h4>💡 AZ-104 Tip</h4>
        <p>When you change the DNS settings on a VNet, VMs need to renew their DHCP lease to pick up the new DNS servers. Restart the VM or run <span class="code-inline">ipconfig /renew</span> on Windows or restart the networking service on Linux.</p>
    </div>
</div>
`,
    diagrams: [
        {
            id: 'vnet-3tier',
            type: 'vnet-architecture',
            title: 'Azure VNet — 3-Tier Architecture',
            icon: '🏗️',
            description: 'A production VNet with web, app, and database subnets — each protected by NSGs. This is the most common Azure architecture.',
            steps: [
                'Virtual Network (VNet): Your private network in Azure. Address space 10.0.0.0/16 gives you 65,536 IPs.',
                'Web Tier Subnet (10.0.1.0/24): Front-end VMs exposed to the internet via load balancer. NSG allows HTTP/HTTPS.',
                'App Tier Subnet (10.0.2.0/24): Business logic VMs. NSG only allows traffic from the web tier.',
                'DB Tier Subnet (10.0.3.0/24): SQL Server on port 1433. NSG only allows from app tier — never from internet.',
                'GatewaySubnet (10.0.255.0/27): Reserved for VPN Gateway. Connects Azure to your on-premises network.',
                'Traffic flows: Web → App → DB. Each subnet\'s NSG enforces the segmentation.'
            ],
            legend: [
                { color: '#107c10', label: 'Web Tier' },
                { color: '#ff8c00', label: 'App Tier' },
                { color: '#d13438', label: 'DB Tier' },
                { color: '#0078d4', label: 'Gateway' }
            ]
        }
    ],
    quiz: [
        {
            question: 'You create a VNet with address space 10.0.0.0/16. Which of these is a valid subnet CIDR within this VNet?',
            options: ['192.168.1.0/24', '10.0.5.0/24', '10.1.0.0/24', '172.16.0.0/16'],
            correct: 1,
            explanation: '10.0.5.0/24 falls within the 10.0.0.0/16 address space (10.0.0.0 – 10.0.255.255). The other options are outside this range.'
        },
        {
            question: 'Can two VMs in different subnets within the same VNet communicate by default?',
            options: ['No, you need VNet peering', 'No, you need an NSG rule', 'Yes, Azure routes traffic between subnets automatically', 'Yes, but only if they share the same NSG'],
            correct: 2,
            explanation: 'Azure automatically routes traffic between subnets within the same VNet. No additional configuration needed — the system routes handle intra-VNet traffic by default.'
        },
        {
            question: 'What is the minimum recommended size for a GatewaySubnet?',
            options: ['/28', '/27', '/24', '/26'],
            correct: 1,
            explanation: 'Microsoft recommends /27 for the GatewaySubnet to provide enough IP addresses for VPN/ExpressRoute gateway instances. /28 works but limits future scalability.'
        },
        {
            question: 'How many IP addresses does Azure reserve per subnet?',
            options: ['2', '3', '4', '5'],
            correct: 3,
            explanation: 'Azure reserves 5 addresses: x.x.x.0 (network), x.x.x.1 (default gateway), x.x.x.2 and x.x.x.3 (Azure DNS), and x.x.x.255 (broadcast). So a /24 gives you 251 usable addresses.'
        },
        {
            question: 'A VNet spans which Azure scope?',
            options: ['A single Availability Zone', 'A single Azure Region', 'Multiple Azure Regions', 'Global (all regions)'],
            correct: 1,
            explanation: 'A VNet is a regional resource — it exists in one Azure region. However, it automatically spans all Availability Zones within that region. To connect VNets across regions, you use Global VNet Peering.'
        },
        {
            question: 'You change the DNS server settings on a VNet. What must you do for existing VMs to use the new DNS?',
            options: ['Nothing, it updates automatically', 'Delete and recreate the VMs', 'Restart the VMs or renew their DHCP lease', 'Update the NSG rules'],
            correct: 2,
            explanation: 'VMs get DNS settings via DHCP. When you change the VNet DNS settings, existing VMs need to renew their DHCP lease (restart or ipconfig /renew) to pick up the new configuration.'
        }
    ],
    interactive: [
        {
            type: 'subnet-calculator',
            id: 'vnet-subnet-calc',
            title: 'VNet Subnet Planner',
            description: 'Design your VNet by entering an address space and creating subnets. The tool will show you how many usable Azure addresses each subnet provides.'
        },
        {
            type: 'drag-drop',
            id: 'vnet-communication',
            title: 'Communication Scenarios',
            description: 'Classify each communication scenario as "Allowed by Default" or "Requires Configuration".',
            items: ['Same subnet VMs', 'Cross-subnet (same VNet)', 'Cross-VNet', 'VNet to Internet (outbound)', 'Internet to VNet (inbound)', 'VNet to on-premises'],
            targets: {
                'Allowed by Default': ['Same subnet VMs', 'Cross-subnet (same VNet)', 'VNet to Internet (outbound)'],
                'Requires Configuration': ['Cross-VNet', 'Internet to VNet (inbound)', 'VNet to on-premises']
            }
        },
        {
            type: 'flashcards',
            id: 'vnet-flashcards',
            title: 'VNet Key Terms',
            cards: [
                { front: 'What is VNet Peering?', back: 'Connects two VNets so resources can communicate via Microsoft backbone. Can be within-region or global (cross-region). Traffic stays private, never crosses the public internet.' },
                { front: 'What is the GatewaySubnet?', back: 'A special subnet reserved for VPN Gateway or ExpressRoute Gateway. Must be named exactly "GatewaySubnet". Microsoft recommends /27 for future scalability.' },
                { front: 'What is a Service Endpoint?', back: 'Extends your VNet identity to Azure services (like Storage, SQL). Traffic from your VNet to the Azure service stays on the Microsoft backbone network.' },
                { front: 'What is Azure Bastion?', back: 'A PaaS service providing secure RDP/SSH access to VMs without exposing public IPs. Requires its own subnet named AzureBastionSubnet (/26 minimum).' }
            ]
        }
    ],
    lab: {
        title: 'Hands-On: Create a VNet with Subnets in Azure',
        icon: '🔗',
        scenario: 'Build a production-ready 3-tier Virtual Network from scratch — with web, app, and database subnets. You\'ll use both the Azure Portal and CLI.',
        duration: '25-35 minutes',
        cost: 'Free (VNets have no cost)',
        difficulty: 'Beginner',
        prerequisites: ['An Azure account', 'Resource group rg-academy-lab (from previous lab)'],
        cleanup: `# Delete the VNet (it's free, but clean up anyway)
az network vnet delete --name vnet-academy --resource-group rg-academy-lab`,
        steps: [
            {
                title: 'Create a Virtual Network',
                subtitle: 'Your private network in Azure',
                type: 'confirm',
                explanation: 'A VNet is your isolated network in Azure. All VMs, load balancers, and other resources connect to subnets within a VNet. We\'ll create one with a /16 address space (65,536 addresses).',
                portal: `<ol>
                    <li>Search for <strong>"Virtual networks"</strong> in the portal search bar</li>
                    <li>Click <strong>+ Create</strong></li>
                    <li><strong>Basics tab:</strong>
                        <ul>
                            <li>Subscription: Your subscription</li>
                            <li>Resource group: <code>rg-academy-lab</code></li>
                            <li>Name: <code>vnet-academy</code></li>
                            <li>Region: <code>East US</code></li>
                        </ul>
                    </li>
                    <li><strong>IP Addresses tab:</strong>
                        <ul>
                            <li>IPv4 address space: <code>10.0.0.0/16</code> (this gives us 65,536 addresses)</li>
                            <li>Delete the default subnet if one exists</li>
                        </ul>
                    </li>
                    <li>Click <strong>Review + create</strong> → <strong>Create</strong></li>
                </ol>`,
                cli: `<div class="lab-code-block"># Create the VNet with a /16 address space
az network vnet create \\
    --name vnet-academy \\
    --resource-group rg-academy-lab \\
    --location eastus \\
    --address-prefix 10.0.0.0/16

# Verify
az network vnet show \\
    --name vnet-academy \\
    --resource-group rg-academy-lab \\
    --output table</div>`,
                verification: 'Go to the VNet resource and confirm the address space shows 10.0.0.0/16.',
                tip: 'VNets are free! You only pay for resources deployed into them (VMs, gateways, etc.).'
            },
            {
                title: 'Create the Web Tier Subnet',
                subtitle: 'Front-end subnet for web servers',
                type: 'confirm',
                explanation: 'Subnets divide your VNet into smaller segments. The web tier will hold internet-facing web servers. We\'ll use a /24 giving 251 usable IPs (Azure reserves 5).',
                portal: `<ol>
                    <li>Go to your VNet <code>vnet-academy</code></li>
                    <li>Click <strong>Subnets</strong> in the left menu</li>
                    <li>Click <strong>+ Subnet</strong></li>
                    <li>Fill in:
                        <ul>
                            <li>Name: <code>snet-web</code></li>
                            <li>Subnet address range: <code>10.0.1.0/24</code></li>
                            <li>Leave other settings as default</li>
                        </ul>
                    </li>
                    <li>Click <strong>Save</strong></li>
                </ol>`,
                cli: `<div class="lab-code-block"># Create the web tier subnet
az network vnet subnet create \\
    --name snet-web \\
    --resource-group rg-academy-lab \\
    --vnet-name vnet-academy \\
    --address-prefix 10.0.1.0/24</div>`,
                verification: 'In the Subnets view, you should see snet-web with address range 10.0.1.0/24 and 251 available addresses.'
            },
            {
                title: 'Create App and DB Subnets',
                subtitle: 'Middle and back-end tiers',
                type: 'confirm',
                explanation: 'Following the same process, create two more subnets for the application and database tiers with separate address ranges.',
                portal: `<ol>
                    <li>Click <strong>+ Subnet</strong> again and create:
                        <ul>
                            <li>Name: <code>snet-app</code> | Range: <code>10.0.2.0/24</code></li>
                        </ul>
                    </li>
                    <li>Click <strong>Save</strong>, then <strong>+ Subnet</strong> again:
                        <ul>
                            <li>Name: <code>snet-db</code> | Range: <code>10.0.3.0/24</code></li>
                        </ul>
                    </li>
                    <li>Click <strong>Save</strong></li>
                </ol>`,
                cli: `<div class="lab-code-block"># Create app tier subnet
az network vnet subnet create \\
    --name snet-app \\
    --resource-group rg-academy-lab \\
    --vnet-name vnet-academy \\
    --address-prefix 10.0.2.0/24

# Create database tier subnet
az network vnet subnet create \\
    --name snet-db \\
    --resource-group rg-academy-lab \\
    --vnet-name vnet-academy \\
    --address-prefix 10.0.3.0/24

# List all subnets
az network vnet subnet list \\
    --resource-group rg-academy-lab \\
    --vnet-name vnet-academy \\
    --output table</div>`,
                verification: 'You should now see 3 subnets: snet-web (10.0.1.0/24), snet-app (10.0.2.0/24), snet-db (10.0.3.0/24).'
            },
            {
                title: 'Explore the VNet Topology',
                subtitle: 'Visualize your network',
                type: 'confirm',
                explanation: 'Azure provides a visual topology diagram showing your VNet structure, subnets, and connected resources.',
                portal: `<ol>
                    <li>In your VNet, click <strong>Diagram</strong> in the left menu (under Monitoring)</li>
                    <li>You should see your VNet with the 3 subnets visualized</li>
                    <li>Click <strong>Properties</strong> to review:
                        <ul>
                            <li>Resource ID (the ARM path to this VNet)</li>
                            <li>Address space</li>
                            <li>DNS servers (Azure-provided by default)</li>
                        </ul>
                    </li>
                    <li>Click <strong>Connected devices</strong> — currently empty (no VMs deployed yet)</li>
                </ol>`,
                tip: 'In production, use Azure Network Watcher > Topology for a more detailed cross-resource view.'
            },
            {
                title: 'Review: Azure Subnet IP Reservation',
                subtitle: 'Confirm your understanding',
                type: 'confirm',
                explanation: 'A /24 subnet (10.0.1.0/24) has 256 total addresses, but Azure reserves 5: the first 4 (.0 network, .1 default gateway, .2-.3 DNS) and the last (.255 broadcast). That leaves 251 usable IP addresses.',
                portal: '<ol><li><strong>Key concept:</strong> Azure reserves 5 IPs per subnet — so a /24 gives you 251 usable addresses, not 256</li><li>Formula: 2^(32 - prefix) - 5 = usable IPs</li><li>This reservation applies to every subnet regardless of size — critical for capacity planning</li></ol>'
            }
        ]
    }
},

// ──────────────────────────────────────────────
// MODULE 4: IP Addressing in Azure
// ──────────────────────────────────────────────
{
    id: 'azure-ip-addressing',
    level: 100,
    title: 'IP Addressing in Azure',
    subtitle: 'Public IPs, private IPs, static vs dynamic, NAT',
    icon: '🏷️',
    estimatedTime: '35m',
    learn: `
<div class="learn-section">
    <h2>Private IP Addresses</h2>
    <p>Every resource connected to a VNet (VMs, internal load balancers, etc.) gets a private IP from the subnet's address range.</p>
    
    <h3>Dynamic vs Static Private IPs</h3>
    <table class="content-table">
        <tr><th>Type</th><th>Behavior</th><th>Use Case</th></tr>
        <tr><td><strong>Dynamic</strong> (default)</td><td>Azure assigns from subnet range. May change on VM restart</td><td>Most VMs, dev/test environments</td></tr>
        <tr><td><strong>Static</strong></td><td>You pick the IP, it never changes</td><td>DNS servers, domain controllers, apps that require fixed IPs</td></tr>
    </table>

    <div class="concept-box">
        <h4>🔑 Key Concept</h4>
        <p>Dynamic private IPs are "sticky" in Azure — they typically only change when the VM is <strong>deallocated</strong> (stopped/deallocated), not when simply restarted. But don't rely on this — if you need a fixed IP, use static.</p>
    </div>
</div>

<div class="learn-section">
    <h2>Public IP Addresses</h2>
    <p>Public IPs allow resources to communicate with the internet and public-facing Azure services.</p>
    
    <h3>SKUs — Basic vs Standard</h3>
    <table class="content-table">
        <tr><th>Feature</th><th>Basic SKU</th><th>Standard SKU</th></tr>
        <tr><td>Allocation</td><td>Dynamic or Static</td><td>Static only</td></tr>
        <tr><td>Availability Zones</td><td>Not supported</td><td>Zone-redundant by default</td></tr>
        <tr><td>Security</td><td>Open by default</td><td>Closed by default (NSG required)</td></tr>
        <tr><td>Load Balancer</td><td>Basic LB only</td><td>Standard LB only</td></tr>
        <tr><td>SLA</td><td>No SLA</td><td>99.99% SLA</td></tr>
        <tr><td>Price</td><td>Free (while attached)</td><td>Hourly charge</td></tr>
    </table>

    <div class="warning-box">
        <h4>⚠️ Basic SKU Retirement</h4>
        <p>Basic SKU public IPs are being retired (September 2025). Always use Standard SKU for new deployments. Standard IPs are more secure (closed by default) and support Availability Zones.</p>
    </div>

    <h3>Creating a Public IP</h3>
    <div class="code-block"># Create a Standard SKU static public IP
az network public-ip create \\
    --resource-group rg-networking \\
    --name pip-webserver \\
    --sku Standard \\
    --allocation-method Static \\
    --zone 1 2 3

# Create with DNS label
az network public-ip create \\
    --resource-group rg-networking \\
    --name pip-webapp \\
    --sku Standard \\
    --allocation-method Static \\
    --dns-name mywebapp-contoso
    # Results in: mywebapp-contoso.eastus.cloudapp.azure.com</div>
</div>

<div class="learn-section">
    <h2>NAT Gateway</h2>
    <p>Azure NAT Gateway provides outbound internet connectivity for VMs in a subnet. Without a public IP or NAT Gateway, VMs use Azure's default SNAT (which has limitations).</p>
    
    <h3>Why Use NAT Gateway?</h3>
    <ul>
        <li><strong>Predictable outbound IPs:</strong> All outbound traffic uses the NAT Gateway's public IP(s)</li>
        <li><strong>No SNAT port exhaustion:</strong> Supports 64,000+ concurrent connections per IP</li>
        <li><strong>Scalable:</strong> Up to 16 public IPs per NAT Gateway</li>
        <li><strong>Automatic:</strong> No user routes needed; overrides other outbound scenarios</li>
    </ul>

    <div class="diagram-container">
        <svg viewBox="0 0 400 340" xmlns="http://www.w3.org/2000/svg" style="max-width:400px;width:100%;font-family:'Segoe UI',sans-serif">
          <defs>
            <marker id="an" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6" fill="#333"/></marker>
          </defs>
          <!-- Internet cloud -->
          <ellipse cx="200" cy="30" rx="70" ry="24" fill="#E8F4FD" stroke="#0078D4" stroke-width="1.5"/>
          <text x="200" y="35" text-anchor="middle" font-size="13" font-weight="600" fill="#0078D4">Internet</text>
          <!-- Arrow up from NAT to Internet -->
          <line x1="200" y1="54" x2="200" y2="80" stroke="#333" stroke-width="1.5" marker-end="url(#an)"/>
          <text x="218" y="72" font-size="9" fill="#555">outbound</text>
          <!-- NAT Gateway -->
          <rect x="120" y="80" width="160" height="50" rx="8" fill="#fff" stroke="#107C10" stroke-width="2"/>
          <text x="200" y="100" text-anchor="middle" font-size="12" font-weight="600" fill="#107C10">NAT Gateway</text>
          <text x="200" y="118" text-anchor="middle" font-size="10" fill="#555">PIP: 20.x.x.x</text>
          <!-- Arrow down -->
          <line x1="200" y1="130" x2="200" y2="160" stroke="#333" stroke-width="1.5" marker-end="url(#an)"/>
          <!-- Subnet -->
          <rect x="60" y="160" width="280" height="110" rx="8" fill="#F0F6FF" stroke="#0078D4" stroke-width="1.5" stroke-dasharray="6,3"/>
          <text x="200" y="180" text-anchor="middle" font-size="12" font-weight="600" fill="#0078D4">Subnet: 10.0.1.0/24</text>
          <!-- VM-01 -->
          <rect x="90" y="192" width="100" height="55" rx="6" fill="#fff" stroke="#0078D4" stroke-width="1.5"/>
          <text x="140" y="215" text-anchor="middle" font-size="11" font-weight="600" fill="#333">VM-01</text>
          <text x="140" y="233" text-anchor="middle" font-size="10" fill="#777">.10</text>
          <!-- VM-02 -->
          <rect x="210" y="192" width="100" height="55" rx="6" fill="#fff" stroke="#0078D4" stroke-width="1.5"/>
          <text x="260" y="215" text-anchor="middle" font-size="11" font-weight="600" fill="#333">VM-02</text>
          <text x="260" y="233" text-anchor="middle" font-size="10" fill="#777">.11</text>
          <!-- Footer text -->
          <text x="200" y="300" text-anchor="middle" font-size="11" fill="#555">All outbound traffic uses NAT Gateway IP</text>
          <text x="200" y="318" text-anchor="middle" font-size="10" fill="#777">(20.x.x.x for both VM-01 and VM-02)</text>
        </svg>
    </div>
</div>

<div class="learn-section">
    <h2>Special IP Addresses in Azure</h2>
    <table class="content-table">
        <tr><th>IP Address</th><th>Purpose</th></tr>
        <tr><td><strong>168.63.129.16</strong></td><td>Azure's virtual public IP — used for health probes, DNS resolution, DHCP</td></tr>
        <tr><td><strong>169.254.169.254</strong></td><td>Instance Metadata Service (IMDS) — VMs query this for metadata about themselves</td></tr>
        <tr><td><strong>x.x.x.1</strong></td><td>Subnet's default gateway (first host IP in every subnet)</td></tr>
    </table>

    <div class="tip-box">
        <h4>💡 AZ-104 Tip</h4>
        <p>168.63.129.16 is a critical IP to remember. NSG rules must allow traffic from this IP for load balancer health probes to work. It's always the Azure platform communicating with your VMs.</p>
    </div>
</div>
`,
    diagrams: [],
    quiz: [
        {
            question: 'What is the default allocation method for Standard SKU public IPs?',
            options: ['Dynamic', 'Static', 'Automatic', 'Reserved'],
            correct: 1,
            explanation: 'Standard SKU public IPs only support Static allocation. Basic SKU supports both Dynamic and Static, but Basic is being retired.'
        },
        {
            question: 'What is the purpose of IP address 168.63.129.16?',
            options: ['It is the default gateway for all VNets', 'It is Azure\'s virtual public IP used for health probes and DNS', 'It is the Azure AD authentication endpoint', 'It is the default DNS server for all VMs'],
            correct: 1,
            explanation: '168.63.129.16 is Azure\'s virtual public IP. It\'s used by load balancer health probes, Azure DNS, DHCP, and other platform services. NSGs must allow traffic from this IP for these services to work.'
        },
        {
            question: 'What does Azure NAT Gateway provide?',
            options: ['Inbound internet connectivity', 'VNet-to-VNet peering', 'Predictable outbound internet connectivity', 'DNS resolution'],
            correct: 2,
            explanation: 'NAT Gateway provides predictable, scalable outbound internet connectivity. All traffic from associated subnets uses the NAT Gateway\'s public IP(s), preventing SNAT port exhaustion.'
        },
        {
            question: 'When does a Dynamic private IP address change in Azure?',
            options: ['Every time the VM restarts', 'When the VM is deallocated (stopped)', 'Never — dynamic IPs are permanent', 'Every 24 hours'],
            correct: 1,
            explanation: 'Dynamic private IPs may change when a VM is deallocated (stopped/deallocated from the portal). They typically persist through regular restarts, but the only guarantee for a permanent IP is using Static allocation.'
        },
        {
            question: 'Standard SKU public IPs are ____ by default.',
            options: ['Open to all traffic', 'Closed to all traffic (require NSG)', 'Limited to HTTP/HTTPS only', 'Restricted to Azure internal traffic'],
            correct: 1,
            explanation: 'Standard SKU public IPs are secure by default — all inbound traffic is blocked until you explicitly allow it with an NSG rule. This is a key difference from Basic SKU which is open by default.'
        }
    ],
    interactive: [
        {
            type: 'drag-drop',
            id: 'ip-sku-comparison',
            title: 'Public IP SKU Features',
            description: 'Classify each feature as belonging to Basic SKU, Standard SKU, or Both.',
            items: ['Static allocation', 'Dynamic allocation', 'Zone-redundant', 'Open by default', 'Closed by default', '99.99% SLA', 'Free while attached'],
            targets: {
                'Basic SKU Only': ['Dynamic allocation', 'Open by default', 'Free while attached'],
                'Standard SKU Only': ['Zone-redundant', 'Closed by default', '99.99% SLA'],
                'Both SKUs': ['Static allocation']
            }
        },
        {
            type: 'flashcards',
            id: 'ip-flashcards',
            title: 'IP Addressing Flashcards',
            cards: [
                { front: 'What is SNAT?', back: 'Source Network Address Translation. Azure maps private IPs to public IPs for outbound internet traffic. Without NAT Gateway, Azure uses default SNAT which can lead to port exhaustion under heavy load.' },
                { front: 'What is the IMDS endpoint?', back: '169.254.169.254 — The Instance Metadata Service endpoint. VMs can query this (no authentication needed) to get information about themselves: IP, region, tags, etc.' },
                { front: 'What happens to a public IP when a VM is deallocated?', back: 'Dynamic public IPs are released and may change. Static public IPs are retained but you still pay for them. To avoid charges, delete unattached public IPs.' },
                { front: 'How many public IPs can a NAT Gateway have?', back: 'Up to 16 public IP addresses or a public IP prefix. Each IP provides ~64,000 SNAT ports, so 16 IPs = over 1 million concurrent connections.' }
            ]
        }
    ],
    lab: {
        title: 'Hands-On: Deploy a VM & Configure IP Addressing',
        icon: '🏷️',
        scenario: 'Deploy a virtual machine into your VNet, configure public and private IPs, and test connectivity. This is where networking becomes real!',
        duration: '30-40 minutes',
        cost: '~$0.02 (B1s VM for <1 hour)',
        difficulty: 'Beginner-Intermediate',
        prerequisites: ['Resource group rg-academy-lab', 'VNet vnet-academy with snet-web subnet (from previous lab)'],
        cleanup: `# IMPORTANT: Delete resources to avoid charges!
az vm delete --name vm-web-01 --resource-group rg-academy-lab --yes
az network nic delete --name vm-web-01VMNic --resource-group rg-academy-lab
az network public-ip delete --name vm-web-01-pip --resource-group rg-academy-lab
az network nsg delete --name vm-web-01-nsg --resource-group rg-academy-lab

# Or delete the entire resource group to clean everything
# az group delete --name rg-academy-lab --yes --no-wait`,
        steps: [
            {
                title: 'Create a Public IP Address',
                subtitle: 'Standard SKU, static allocation',
                type: 'confirm',
                explanation: 'A Public IP allows your VM to be reachable from the internet. We\'ll create a Standard SKU public IP with static allocation — meaning the IP never changes.',
                portal: `<ol>
                    <li>Search for <strong>"Public IP addresses"</strong> in the portal</li>
                    <li>Click <strong>+ Create</strong></li>
                    <li>Configure:
                        <ul>
                            <li>Name: <code>vm-web-01-pip</code></li>
                            <li>SKU: <strong>Standard</strong></li>
                            <li>Tier: <strong>Regional</strong></li>
                            <li>IP Version: <strong>IPv4</strong></li>
                            <li>Assignment: <strong>Static</strong> (Standard SKU only supports static)</li>
                            <li>Resource group: <code>rg-academy-lab</code></li>
                            <li>Region: <code>East US</code></li>
                        </ul>
                    </li>
                    <li>Click <strong>Review + create</strong> → <strong>Create</strong></li>
                </ol>`,
                cli: `<div class="lab-code-block"># Create a Standard static public IP
az network public-ip create \\
    --name vm-web-01-pip \\
    --resource-group rg-academy-lab \\
    --location eastus \\
    --sku Standard \\
    --allocation-method Static

# Show the allocated IP
az network public-ip show \\
    --name vm-web-01-pip \\
    --resource-group rg-academy-lab \\
    --query ipAddress \\
    --output tsv</div>`,
                tip: 'Standard SKU public IPs are secure by default — they require an NSG to allow inbound traffic. Basic SKU is being retired.',
                verification: 'Note down the assigned public IP address — you\'ll need it later to connect to your VM.'
            },
            {
                title: 'Deploy a Virtual Machine',
                subtitle: 'Linux VM in the web subnet',
                type: 'confirm',
                explanation: 'Now we\'ll deploy a small Linux VM into the web tier subnet. Azure will automatically assign it a private IP from the snet-web range (10.0.1.x).',
                portal: `<ol>
                    <li>Search for <strong>"Virtual machines"</strong> → click <strong>+ Create</strong> → <strong>Azure Virtual Machine</strong></li>
                    <li><strong>Basics tab:</strong>
                        <ul>
                            <li>Resource group: <code>rg-academy-lab</code></li>
                            <li>Name: <code>vm-web-01</code></li>
                            <li>Region: <code>East US</code></li>
                            <li>Image: <code>Ubuntu Server 22.04 LTS</code></li>
                            <li>Size: <code>Standard_B1s</code> (cheapest option — $0.01/hr)</li>
                            <li>Auth type: <strong>Password</strong></li>
                            <li>Username: <code>azureadmin</code></li>
                            <li>Password: Choose a strong password</li>
                        </ul>
                    </li>
                    <li><strong>Networking tab:</strong>
                        <ul>
                            <li>Virtual network: <code>vnet-academy</code></li>
                            <li>Subnet: <code>snet-web (10.0.1.0/24)</code></li>
                            <li>Public IP: <code>vm-web-01-pip</code> (the one you just created)</li>
                            <li>NIC NSG: <strong>Basic</strong></li>
                            <li>Public inbound ports: <strong>Allow selected ports</strong></li>
                            <li>Select: <strong>SSH (22)</strong></li>
                        </ul>
                    </li>
                    <li>Click <strong>Review + create</strong> → <strong>Create</strong></li>
                    <li>Wait 2-3 minutes for deployment to complete</li>
                </ol>`,
                cli: `<div class="lab-code-block"># Create a VM in the web subnet
az vm create \\
    --name vm-web-01 \\
    --resource-group rg-academy-lab \\
    --location eastus \\
    --vnet-name vnet-academy \\
    --subnet snet-web \\
    --public-ip-address vm-web-01-pip \\
    --image Ubuntu2204 \\
    --size Standard_B1s \\
    --admin-username azureadmin \\
    --admin-password 'YourStr0ngP@ssword!' \\
    --nsg-rule SSH

# This takes 2-3 minutes</div>`,
                warning: 'Remember the username and password! You\'ll need them to SSH into the VM. Never use weak passwords in Azure.',
                verification: 'Wait for deployment to complete. Go to the VM and check: the Private IP should be 10.0.1.4 (first available IP after Azure\'s 5 reserved).'
            },
            {
                title: 'Examine IP Configuration',
                subtitle: 'See how Azure assigned IPs',
                type: 'confirm',
                explanation: 'Let\'s examine the VM\'s networking configuration to understand how Azure assigned both private and public IPs.',
                portal: `<ol>
                    <li>Go to your VM <code>vm-web-01</code></li>
                    <li>Click <strong>Networking</strong> → <strong>Network settings</strong></li>
                    <li>Observe:
                        <ul>
                            <li><strong>Private IP:</strong> 10.0.1.4 (first usable IP in snet-web after Azure's 5 reserved)</li>
                            <li><strong>Public IP:</strong> The static public IP you created</li>
                            <li><strong>Virtual network/subnet:</strong> vnet-academy/snet-web</li>
                            <li><strong>Network security group:</strong> vm-web-01-nsg (auto-created)</li>
                        </ul>
                    </li>
                    <li>Click the <strong>NIC</strong> (network interface) link</li>
                    <li>Click <strong>IP configurations</strong> — see the private IP allocation method (Dynamic by default)</li>
                </ol>`,
                cli: `<div class="lab-code-block"># Show VM's IP addresses
az vm show \\
    --name vm-web-01 \\
    --resource-group rg-academy-lab \\
    --show-details \\
    --query '{privateIps:privateIps, publicIps:publicIps}' \\
    --output table

# Show NIC configuration detail
az network nic show \\
    --name vm-web-01VMNic \\
    --resource-group rg-academy-lab \\
    --query 'ipConfigurations[0].{privateIP:privateIpAddress, allocation:privateIpAllocationMethod}' \\
    --output table</div>`,
                tip: 'The private IP 10.0.1.4 is expected because Azure reserves .0-.3 and .255. So .4 is the first usable address.'
            },
            {
                title: 'Connect to Your VM via SSH',
                subtitle: 'Test the network connection',
                type: 'confirm',
                explanation: 'Use SSH to connect to your VM from Cloud Shell. This proves the entire networking chain works: DNS → Public IP → NSG → VM.',
                portal: `<ol>
                    <li>Open <strong>Cloud Shell</strong> (click the >_ icon in the top bar)</li>
                    <li>SSH into your VM (replace IP with your public IP):<div class="lab-code-block">ssh azureadmin@YOUR_PUBLIC_IP</div></li>
                    <li>Type <code>yes</code> to accept the fingerprint, then enter your password</li>
                    <li>Once connected, run these commands to explore:<div class="lab-code-block"># Check the VM's private IP from inside
ip addr show eth0

# Check the default gateway
ip route show

# Check DNS resolver
cat /etc/resolv.conf

# Check which Azure metadata service provides
curl -s -H "Metadata:true" "http://169.254.169.254/metadata/instance?api-version=2021-02-01" | python3 -m json.tool | head -30</div></li>
                    <li>Type <code>exit</code> to disconnect</li>
                </ol>`,
                tip: 'The instance metadata endpoint (169.254.169.254) provides info about the VM without auth. It\'s how VMs discover their own Azure config.',
                verification: 'When you run <code>ip addr show eth0</code>, you should see the private IP 10.0.1.4. The metadata endpoint should return your VM\'s Azure region and resource group.'
            },
            {
                title: 'Clean Up Resources',
                subtitle: 'Avoid unnecessary charges',
                type: 'confirm',
                explanation: 'VMs cost money even when stopped (disk charges). Let\'s deallocate the VM. You can delete everything if you\'re done with the labs.',
                portal: `<ol>
                    <li>Go to your VM <code>vm-web-01</code></li>
                    <li>Click <strong>Stop</strong> to deallocate (stops billing for compute but keeps the disk)</li>
                    <li>Or to fully clean up, click <strong>Delete</strong> and check "Delete with VM":
                        <ul>
                            <li>✅ Network interface</li>
                            <li>✅ Public IP address</li>
                            <li>✅ OS disk</li>
                        </ul>
                    </li>
                </ol>`,
                cli: `<div class="lab-code-block"># Deallocate VM (stop billing for compute)
az vm deallocate --name vm-web-01 --resource-group rg-academy-lab

# OR delete everything
az vm delete --name vm-web-01 --resource-group rg-academy-lab --yes
az network nic delete --name vm-web-01VMNic --resource-group rg-academy-lab
az network public-ip delete --name vm-web-01-pip --resource-group rg-academy-lab
az network nsg delete --name vm-web-01-nsg --resource-group rg-academy-lab</div>`,
                warning: 'Always clean up lab resources when done! A forgotten VM can cost $20-50+/month.'
            }
        ]
    }
}

];
