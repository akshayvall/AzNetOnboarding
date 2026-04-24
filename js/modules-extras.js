/* ============================================
   EXTRA MODULES — Added per content audit
   - Azure Bastion, NAT Gateway, Route Tables/UDR (L200)
   - Azure Firewall, Network Watcher, Hub-Spoke Capstone (L300)
   - Adds scenario + multi-select quiz types & references array per module
   ============================================ */

const MODULES_EXTRAS = [

// ──────────────────────────────────────────────
// AZURE BASTION  (L200)
// ──────────────────────────────────────────────
{
    id: 'azure-bastion',
    level: 200,
    title: 'Azure Bastion',
    subtitle: 'Secure RDP/SSH without public IPs',
    icon: '🚪',
    estimatedTime: '30m',
    learn: `
<div class="learn-section">
    <h2>Why Azure Bastion?</h2>
    <p>The traditional way to manage Azure VMs is to give them a public IP and open port 3389 (RDP) or 22 (SSH). This is dangerous — internet-exposed management ports are the #1 target of brute-force and ransomware attacks.</p>
    <p><strong>Azure Bastion</strong> is a fully managed jump-box service that lets you connect to your VMs through the Azure portal over TLS — no public IP on the VM, no open management ports, no VPN required.</p>

    <div class="concept-box">
        <h4>🔑 Core Idea</h4>
        <p>Bastion sits in a dedicated subnet inside your VNet (<span class="code-inline">AzureBastionSubnet</span>) and proxies HTTPS from the browser to RDP/SSH on the private IP of your VM. The VM never needs a public IP.</p>
    </div>

    <h3>Bastion SKUs (AZ-104 must-know)</h3>
    <table class="content-table">
        <tr><th>Feature</th><th>Developer</th><th>Basic</th><th>Standard</th><th>Premium</th></tr>
        <tr><td>Price</td><td>Free (preview)</td><td>$</td><td>$$</td><td>$$$</td></tr>
        <tr><td>Host scaling</td><td>Shared</td><td>2 instances</td><td>2–50</td><td>2–50</td></tr>
        <tr><td>Connect via native client (<span class="code-inline">az network bastion</span>)</td><td>—</td><td>—</td><td>✔</td><td>✔</td></tr>
        <tr><td>VNet peering connectivity</td><td>—</td><td>✔</td><td>✔</td><td>✔</td></tr>
        <tr><td>File copy (RDP)</td><td>—</td><td>—</td><td>✔</td><td>✔</td></tr>
        <tr><td>Shareable link</td><td>—</td><td>—</td><td>✔</td><td>✔</td></tr>
        <tr><td>Session recording</td><td>—</td><td>—</td><td>—</td><td>✔</td></tr>
        <tr><td>Private-only deployment (no public IP)</td><td>—</td><td>—</td><td>—</td><td>✔</td></tr>
    </table>

    <h3>Requirements</h3>
    <ul>
        <li>A subnet named <strong>exactly</strong> <span class="code-inline">AzureBastionSubnet</span> with at least <strong>/26</strong> (Basic/Developer) or <strong>/26</strong> recommended (Standard). Use <strong>/26 or larger</strong> for autoscale.</li>
        <li>A Standard public IP (for internet-facing SKUs) — Bastion host receives the IP, VMs do not.</li>
        <li>Target VMs in the same VNet or peered VNet (IP-based connection works for any reachable IP with Standard SKU).</li>
    </ul>

    <div class="warning-box">
        <h4>⚠️ Common Exam Trap</h4>
        <p>The subnet name <strong>must be</strong> <span class="code-inline">AzureBastionSubnet</span> (case-sensitive). Any other name is rejected. You cannot apply an NSG that blocks the required inbound ports (443 from Internet, GatewayManager, AzureLoadBalancer) or Bastion will fail health checks.</p>
    </div>
</div>

<div class="learn-section">
    <h2>Bastion vs Alternatives</h2>
    <div class="comparison-grid">
        <div class="comparison-card">
            <h4>❌ Public IP + RDP/SSH</h4>
            <p>Simple, cheapest, but exposes management ports to the entire internet. High risk of compromise.</p>
        </div>
        <div class="comparison-card">
            <h4>⚠️ Self-hosted Jump Box VM</h4>
            <p>You manage patching, HA, scaling. Cheaper up front but high operational burden.</p>
        </div>
        <div class="comparison-card">
            <h4>✅ Azure Bastion</h4>
            <p>Fully managed, no public IP on VMs, MFA via Azure AD, integrates with Just-in-Time access. Recommended for production.</p>
        </div>
    </div>
</div>
`,
    diagrams: [
        {
            id: 'bastion-flow',
            type: 'bastion',
            title: 'Bastion Connection Flow — No Public IPs on Your VMs',
            icon: '🚪',
            description: 'User connects to a Windows VM through Azure Bastion. Traffic stays inside Azure — the VM never gets a public IP.',
            steps: [
                'Admin opens https://portal.azure.com and clicks Connect → Bastion on the target VM.',
                'Portal tunnels HTTPS (443) through the Bastion host in AzureBastionSubnet.',
                'Bastion opens an RDP (3389) session over the VNet to the VM\'s private IP.',
                'Session streams back to the browser as TLS-encrypted HTML5 — no client install needed.',
                'Because the VM has no public IP, attackers on the internet have no surface to attack.'
            ],
            legend: [
                { color: '#0078D4', label: 'HTTPS (443) from browser' },
                { color: '#7A3B93', label: 'RDP/SSH inside VNet' },
                { color: '#d13438', label: 'Blocked — no public exposure' }
            ]
        }
    ],
    quiz: [
        {
            question: 'What must the Bastion subnet be named?',
            options: ['BastionSubnet', 'AzureBastion', 'AzureBastionSubnet', 'Any name you choose'],
            correct: 2,
            explanation: 'The subnet must be named exactly "AzureBastionSubnet" (case-sensitive). Azure will reject any other name during deployment.'
        },
        {
            question: 'Which Bastion SKU is required to connect using the native Windows RDP (mstsc) client via `az network bastion`?',
            options: ['Developer', 'Basic', 'Standard', 'Any SKU supports native client'],
            correct: 2,
            explanation: 'Native client support (SSH/RDP via az CLI tunnel) is a Standard-tier feature. Basic only supports browser-based HTML5 sessions.'
        },
        {
            question: 'SCENARIO: You deploy a VM with no public IP. RDP (3389) is blocked at the NSG. Your admin needs to troubleshoot an app issue on the VM. What is the lowest-cost, most secure way to grant access?',
            options: [
                'Add a public IP to the VM temporarily',
                'Deploy a jump-box VM with a public IP in a separate subnet',
                'Deploy Azure Bastion (Basic) in the same VNet and connect via the portal',
                'Use a Site-to-Site VPN from the admin\'s home router'
            ],
            correct: 2,
            explanation: 'Bastion Basic is the fastest, most secure option. No public IP on the VM, no jump-box to patch, TLS in the browser. VPN from a home router is slow and high-overhead for one admin. Adding a public IP or jump-box re-exposes the management surface.',
            type: 'scenario'
        },
        {
            question: 'Which of these are advantages of Azure Bastion over exposing RDP to the internet? (Select all that apply)',
            options: [
                'No public IP required on target VMs',
                'Integrates with Azure AD + MFA for the portal login',
                'Automatic file-copy between local machine and VM (Standard+)',
                'Free — Azure Bastion has no per-hour cost'
            ],
            correct: [0, 1, 2],
            explanation: 'Bastion removes the public IP, uses Azure AD for authentication, and Standard/Premium support file copy. However, it has a meaningful per-hour cost and outbound data charges — not free.',
            type: 'multi-select'
        },
        {
            question: 'You need session recording for compliance (who connected, what commands ran). Which SKU do you choose?',
            options: ['Basic', 'Standard', 'Premium', 'Bastion does not support session recording'],
            correct: 2,
            explanation: 'Session recording is exclusive to the Premium SKU, along with private-only deployment (no public IP on Bastion itself).'
        }
    ],
    interactive: [
        {
            type: 'drag-drop',
            id: 'bastion-sku-match',
            title: 'Match Feature to Bastion SKU',
            description: 'Drag each feature to the lowest SKU that supports it.',
            items: [
                'Browser-based RDP/SSH',
                'VNet peering to target VMs',
                'Native client (mstsc / ssh)',
                'File copy during RDP sessions',
                'Session recording for audit',
                'Private-only Bastion (no public IP on Bastion)'
            ],
            targets: {
                'Basic': ['Browser-based RDP/SSH', 'VNet peering to target VMs'],
                'Standard': ['Native client (mstsc / ssh)', 'File copy during RDP sessions'],
                'Premium': ['Session recording for audit', 'Private-only Bastion (no public IP on Bastion)']
            }
        },
        {
            type: 'flashcards',
            id: 'bastion-flash',
            title: 'Bastion Quick Recall',
            cards: [
                { front: 'Minimum subnet size for AzureBastionSubnet?', back: '/26 (Basic/Standard need at least /26 to support autoscale and the required Bastion host IPs).' },
                { front: 'What protocol does the browser use to reach Bastion?', back: 'HTTPS (TCP 443) with TLS. Bastion then initiates RDP/SSH to the VM\'s private IP inside the VNet.' },
                { front: 'Does the target VM need a public IP?', back: 'No. That is the main benefit — Bastion eliminates the need to expose VMs to the internet.' },
                { front: 'Can one Bastion host serve multiple VNets?', back: 'Yes, via VNet peering (Basic and above). Deploy Bastion in a hub VNet and connect to VMs in peered spokes.' }
            ]
        }
    ],
    references: [
        { title: 'What is Azure Bastion?', url: 'https://learn.microsoft.com/azure/bastion/bastion-overview' },
        { title: 'Bastion SKUs and features', url: 'https://learn.microsoft.com/azure/bastion/configuration-settings' },
        { title: 'AZ-104 learning path: secure identities and access', url: 'https://learn.microsoft.com/training/paths/az-104-manage-identities-governance/' }
    ],
    lab: {
        title: 'Hands-On: Deploy Azure Bastion and Connect to a VM',
        icon: '🚪',
        scenario: 'Deploy a Basic Bastion host, then connect to an existing Windows VM through your browser — no public IP needed on the VM.',
        duration: '30-40 minutes',
        cost: '~$0.19/hour for Basic Bastion (remember to delete!)',
        difficulty: 'Intermediate',
        prerequisites: ['Resource group rg-academy-lab', 'VNet vnet-academy', 'A Windows VM in vnet-academy (no public IP required)'],
        cleanup: `az network bastion delete --name bastion-academy --resource-group rg-academy-lab
az network vnet subnet delete --name AzureBastionSubnet --vnet-name vnet-academy --resource-group rg-academy-lab
az network public-ip delete --name pip-bastion --resource-group rg-academy-lab`,
        steps: [
            {
                title: 'Create the AzureBastionSubnet',
                subtitle: 'Exact name required',
                type: 'confirm',
                explanation: 'Bastion requires a dedicated subnet named exactly AzureBastionSubnet with a minimum size of /26. Azure rejects any other name.',
                portal: `<ol>
                    <li>Open your VNet <code>vnet-academy</code> → <strong>Subnets</strong> → <strong>+ Subnet</strong></li>
                    <li>Name: <code>AzureBastionSubnet</code> (EXACT case)</li>
                    <li>Address range: e.g. <code>10.0.250.0/26</code> (ensure it doesn't overlap existing subnets)</li>
                    <li>Click <strong>Save</strong></li>
                </ol>`,
                cli: `<div class="lab-code-block">az network vnet subnet create \\
    --name AzureBastionSubnet \\
    --resource-group rg-academy-lab \\
    --vnet-name vnet-academy \\
    --address-prefixes 10.0.250.0/26</div>`,
                tip: 'If you try "BastionSubnet" or "AzureBastion" the deployment will fail with a validation error. Exact name only.'
            },
            {
                title: 'Create a Public IP for Bastion',
                subtitle: 'Standard SKU, Static',
                type: 'confirm',
                explanation: 'Bastion itself needs a Standard Static public IP. This is NOT attached to your VMs — only to the Bastion host.',
                portal: `<ol>
                    <li>Search <strong>Public IP addresses</strong> → <strong>+ Create</strong></li>
                    <li>SKU: <strong>Standard</strong>, Assignment: <strong>Static</strong></li>
                    <li>Name: <code>pip-bastion</code>, Resource group: <code>rg-academy-lab</code>, Region: <code>East US</code></li>
                    <li>Create</li>
                </ol>`,
                cli: `<div class="lab-code-block">az network public-ip create \\
    --name pip-bastion \\
    --resource-group rg-academy-lab \\
    --sku Standard \\
    --allocation-method Static \\
    --location eastus</div>`
            },
            {
                title: 'Deploy the Bastion Host (Basic SKU)',
                subtitle: 'Takes ~5-10 minutes to provision',
                type: 'confirm',
                explanation: 'Now deploy Bastion itself into the subnet you created. This creates the HTML5-based jump host.',
                portal: `<ol>
                    <li>Search <strong>Bastions</strong> → <strong>+ Create</strong></li>
                    <li>Name: <code>bastion-academy</code>, Tier: <strong>Basic</strong></li>
                    <li>Virtual network: <code>vnet-academy</code>, Subnet: <strong>AzureBastionSubnet</strong> (auto-detected)</li>
                    <li>Public IP address: <strong>Use existing</strong> → <code>pip-bastion</code></li>
                    <li>Review + create. Wait ~5-10 min for deployment.</li>
                </ol>`,
                cli: `<div class="lab-code-block">az network bastion create \\
    --name bastion-academy \\
    --resource-group rg-academy-lab \\
    --public-ip-address pip-bastion \\
    --vnet-name vnet-academy \\
    --sku Basic \\
    --location eastus</div>`,
                warning: 'Bastion costs accrue per hour regardless of use. Plan to delete when done with the lab.'
            },
            {
                title: 'Connect to Your VM via Bastion',
                subtitle: 'No public IP needed',
                type: 'confirm',
                explanation: 'Now connect to a VM that has NO public IP. This is the magic — you\'re reaching a private resource through the Azure portal.',
                portal: `<ol>
                    <li>Navigate to your VM in the portal</li>
                    <li>Click <strong>Connect</strong> → <strong>Bastion</strong></li>
                    <li>Enter VM credentials (username + password)</li>
                    <li>Click <strong>Connect</strong> — the browser opens an HTML5 RDP session</li>
                </ol>`,
                cli: `<div class="lab-code-block"># Native client (Standard SKU only):
az network bastion rdp \\
    --name bastion-academy \\
    --resource-group rg-academy-lab \\
    --target-resource-id /subscriptions/&lt;sub&gt;/resourceGroups/rg-academy-lab/providers/Microsoft.Compute/virtualMachines/vm-web01</div>`,
                verification: 'You should see the Windows desktop streamed into your browser — all over TLS, no VPN, no public IP on the VM.',
                tip: 'Compare network flow: your browser → portal.azure.com (HTTPS) → Bastion host (internal RDP) → VM private IP. Attackers on the internet never see your VM.'
            },
            {
                title: 'Observe: The VM Has No Public IP',
                subtitle: 'Confirm the security benefit',
                type: 'confirm',
                explanation: 'Go to your VM\'s Overview page and check the Networking section. Confirm there is no public IP attached. Despite that, you just connected to it.',
                portal: `<ol>
                    <li>VM → <strong>Overview</strong> → Look at "Public IP address" — should be <strong>(none)</strong></li>
                    <li>VM → <strong>Networking</strong> → Confirm NSG does NOT have an inbound rule for 3389 from the internet</li>
                    <li>Yet, you just connected. That\'s the value of Bastion.</li>
                </ol>`,
                verification: 'Public IP = (none), inbound NSG has no 3389-from-Internet rule, but you have an active RDP session.'
            }
        ]
    }
},

// ──────────────────────────────────────────────
// NAT GATEWAY  (L200)
// ──────────────────────────────────────────────
{
    id: 'nat-gateway',
    level: 200,
    title: 'NAT Gateway',
    subtitle: 'Deterministic outbound connectivity',
    icon: '🔀',
    estimatedTime: '30m',
    learn: `
<div class="learn-section">
    <h2>Why NAT Gateway?</h2>
    <p>Every VM in Azure can reach the internet by default using an implicit, shared outbound SNAT mechanism. That works for light workloads — but at scale you run into <strong>SNAT port exhaustion</strong>: the shared pool of source ports runs out and outbound connections fail with mysterious timeouts.</p>
    <p><strong>NAT Gateway</strong> gives a subnet a dedicated pool of public IPs and ~64,000 SNAT ports per attached public IP. It is the Microsoft-recommended way to provide outbound connectivity.</p>

    <div class="concept-box">
        <h4>🔑 Four Ways a VM Can Reach the Internet</h4>
        <ol>
            <li><strong>Public IP on the VM</strong> — direct, but exposes inbound too. Not ideal.</li>
            <li><strong>Public Load Balancer outbound rules</strong> — shared with inbound LB traffic.</li>
            <li><strong>Default outbound</strong> — implicit, will be deprecated Sept 2025 for new VNets!</li>
            <li><strong>NAT Gateway</strong> — <span style="color:var(--success);font-weight:600">Microsoft-recommended</span>. Dedicated, predictable.</li>
        </ol>
    </div>

    <div class="warning-box">
        <h4>⚠️ Default Outbound Deprecation (AZ-104 topical)</h4>
        <p>Microsoft announced that <strong>default outbound access will be retired for new VNets on September 30, 2025</strong>. Any new subnet must have an <em>explicit</em> outbound method (NAT Gateway, Load Balancer rule, or public IP). Existing VNets keep default access but should migrate.</p>
    </div>

    <h3>How NAT Gateway Works</h3>
    <ul>
        <li>Associate a NAT Gateway with one or more subnets.</li>
        <li>All outbound traffic from those subnets is SNAT\'d to the NAT Gateway\'s public IP(s).</li>
        <li>Each attached public IP provides <strong>64,512 SNAT ports</strong>. Attach up to 16 public IPs (~1M ports).</li>
        <li>Idle timeout is configurable 4-120 minutes (default 4).</li>
        <li><strong>NAT Gateway does NOT allow inbound</strong> — it\'s outbound-only.</li>
    </ul>

    <h3>NAT Gateway vs Load Balancer Outbound Rules</h3>
    <table class="content-table">
        <tr><th>Feature</th><th>NAT Gateway</th><th>LB Outbound Rules</th></tr>
        <tr><td>SNAT port allocation</td><td>Dynamic on-demand</td><td>Pre-allocated per VM</td></tr>
        <tr><td>SNAT exhaustion risk</td><td>Very low</td><td>High if under-provisioned</td></tr>
        <tr><td>Inbound traffic</td><td>Not supported</td><td>Supported (same LB)</td></tr>
        <tr><td>Availability zones</td><td>Zonal or zone-redundant</td><td>Depends on LB</td></tr>
        <tr><td>Complexity</td><td>Simple</td><td>Requires LB + backend pool</td></tr>
        <tr><td>Microsoft recommendation</td><td>✔ Preferred</td><td>Only if you also need inbound LB</td></tr>
    </table>
</div>
`,
    diagrams: [
        {
            id: 'natgw-flow',
            type: 'natgw',
            title: 'NAT Gateway — Dedicated Outbound SNAT',
            icon: '🔀',
            description: 'Watch how subnet VMs share a pool of public IPs via NAT Gateway.',
            steps: [
                'Three VMs in snet-web need outbound internet access.',
                'The subnet is associated with a NAT Gateway.',
                'Each outbound connection is SNAT\'d to one of the NAT Gateway\'s public IPs.',
                'Responses return via the NAT Gateway\'s connection-tracking table and back to the originating VM.',
                'Because the pool is dedicated (not shared), SNAT port exhaustion is extremely unlikely.'
            ],
            legend: [
                { color: '#107c10', label: 'Outbound SNAT' },
                { color: '#0078D4', label: 'Response returns via state tracking' },
                { color: '#d13438', label: 'Inbound — NOT supported' }
            ]
        }
    ],
    quiz: [
        {
            question: 'Approximately how many SNAT ports does each public IP attached to a NAT Gateway provide?',
            options: ['1,024', '4,096', '64,000', '1,000,000'],
            correct: 2,
            explanation: 'Each attached public IP provides ~64,512 (~64K) SNAT ports. A NAT Gateway can have up to 16 public IPs attached for ~1M ports total.'
        },
        {
            question: 'SCENARIO: Your app has ~500 VMs in a subnet making many concurrent HTTPS calls to an external API. You see intermittent connection failures. Logs show SNAT port exhaustion on the implicit outbound path. What is the cleanest fix?',
            options: [
                'Give every VM its own public IP',
                'Add a NAT Gateway to the subnet and attach enough public IPs for the workload',
                'Disable the outbound rule in the Network Security Group',
                'Move the VMs to a different Azure region'
            ],
            correct: 1,
            explanation: 'NAT Gateway is the exact solution for SNAT exhaustion. Giving every VM a public IP is expensive and exposes inbound surface. Changing NSGs doesn\'t affect SNAT. Region change doesn\'t help.',
            type: 'scenario'
        },
        {
            question: 'Which of these statements about NAT Gateway are true? (Select all that apply)',
            options: [
                'Supports both inbound and outbound connectivity',
                'Can be associated with multiple subnets in the same VNet',
                'Is zonal — you choose a single availability zone or use "no-zone"',
                'Default idle timeout is 4 minutes but configurable up to 120 minutes'
            ],
            correct: [1, 2, 3],
            explanation: 'NAT Gateway is outbound-only. It can be attached to multiple subnets, is a zonal resource, and has a 4-minute default idle timeout configurable up to 120 minutes.',
            type: 'multi-select'
        },
        {
            question: 'When does default outbound access for NEW Azure VNets retire?',
            options: ['Already retired', 'September 30, 2025', 'January 2027', 'It will not retire'],
            correct: 1,
            explanation: 'Microsoft announced retirement for new VNets on September 30, 2025. New subnets must use NAT Gateway, LB outbound rules, or an instance-level public IP.'
        }
    ],
    interactive: [
        {
            type: 'flashcards',
            id: 'natgw-flash',
            title: 'NAT Gateway Key Facts',
            cards: [
                { front: 'How many public IPs can a single NAT Gateway have?', back: 'Up to 16, giving ~1 million SNAT ports total (16 × ~64K).' },
                { front: 'Can NAT Gateway provide inbound connectivity?', back: 'No. NAT Gateway is outbound-only. For inbound, use Standard Load Balancer, Application Gateway, Front Door, or a public IP on the resource.' },
                { front: 'What happens if a subnet has BOTH a NAT Gateway AND a VM-level public IP?', back: 'NAT Gateway takes precedence for outbound traffic. The instance public IP is still used for inbound when configured.' },
                { front: 'Is NAT Gateway zone-redundant?', back: 'It is zonal. For zone-redundancy deploy one NAT Gateway per zone and associate each to a zonal subnet design.' }
            ]
        }
    ],
    references: [
        { title: 'What is Azure NAT Gateway?', url: 'https://learn.microsoft.com/azure/nat-gateway/nat-overview' },
        { title: 'Default outbound access retirement', url: 'https://learn.microsoft.com/azure/virtual-network/ip-services/default-outbound-access' },
        { title: 'SNAT port exhaustion troubleshooting', url: 'https://learn.microsoft.com/azure/load-balancer/troubleshoot-outbound-connection' }
    ],
    lab: {
        title: 'Hands-On: Deploy NAT Gateway for Deterministic Outbound',
        icon: '🔀',
        scenario: 'Create a NAT Gateway, attach a public IP, associate it with a subnet, and verify outbound traffic is SNAT\'d to the NAT Gateway IP.',
        duration: '20-30 minutes',
        cost: '~$0.045/hour + data processing',
        difficulty: 'Intermediate',
        prerequisites: ['Resource group rg-academy-lab', 'VNet vnet-academy', 'A VM in snet-web (no public IP)'],
        cleanup: `az network nat gateway delete --name natgw-academy --resource-group rg-academy-lab
az network public-ip delete --name pip-natgw --resource-group rg-academy-lab`,
        steps: [
            {
                title: 'Create a Standard Public IP',
                type: 'confirm',
                explanation: 'NAT Gateway requires Standard SKU public IPs only. Each IP provides ~64K SNAT ports.',
                cli: `<div class="lab-code-block">az network public-ip create \\
    --name pip-natgw \\
    --resource-group rg-academy-lab \\
    --sku Standard \\
    --allocation-method Static</div>`,
                portal: '<p>Portal → Public IP addresses → Create → SKU: Standard, Static, Name: <code>pip-natgw</code></p>'
            },
            {
                title: 'Create the NAT Gateway',
                type: 'confirm',
                explanation: 'Create the NAT Gateway resource and attach the public IP.',
                cli: `<div class="lab-code-block">az network nat gateway create \\
    --name natgw-academy \\
    --resource-group rg-academy-lab \\
    --public-ip-addresses pip-natgw \\
    --idle-timeout 10 \\
    --location eastus</div>`,
                portal: '<p>Portal → NAT gateways → Create → attach <code>pip-natgw</code> → set idle timeout to 10 min</p>'
            },
            {
                title: 'Associate NAT Gateway with a Subnet',
                type: 'confirm',
                explanation: 'The NAT Gateway only takes effect for subnets it is attached to.',
                cli: `<div class="lab-code-block">az network vnet subnet update \\
    --name snet-web \\
    --vnet-name vnet-academy \\
    --resource-group rg-academy-lab \\
    --nat-gateway natgw-academy</div>`,
                portal: '<p>VNet → Subnets → <code>snet-web</code> → NAT gateway: <code>natgw-academy</code> → Save</p>'
            },
            {
                title: 'Verify SNAT from the VM',
                type: 'confirm',
                explanation: 'Connect to your VM (via Bastion if no public IP) and confirm outbound traffic uses the NAT Gateway IP.',
                portal: `<ol>
                    <li>Connect to your VM via Bastion</li>
                    <li>Run: <code>curl ifconfig.me</code> (Linux) or <code>(Invoke-WebRequest -Uri ifconfig.me).Content</code> (Windows)</li>
                    <li>The returned IP should match <code>pip-natgw</code> — not the VM\'s implicit default IP.</li>
                </ol>`,
                verification: 'Public IP reported by ifconfig.me matches the NAT Gateway public IP. Confirmed deterministic outbound.'
            }
        ]
    }
},

// ──────────────────────────────────────────────
// ROUTE TABLES & UDR  (L200)
// ──────────────────────────────────────────────
{
    id: 'route-tables-udr',
    level: 200,
    title: 'Route Tables & UDR',
    subtitle: 'Override system routes, force-tunnel traffic',
    icon: '🗺️',
    estimatedTime: '35m',
    learn: `
<div class="learn-section">
    <h2>System Routes vs User-Defined Routes</h2>
    <p>Every subnet in Azure automatically has <strong>system routes</strong> that handle VNet, peering, and internet traffic. When you need to override that default behavior — for example, force all internet traffic through a firewall — you use <strong>User-Defined Routes (UDRs)</strong> in a <strong>Route Table</strong>.</p>

    <h3>Default System Routes (every subnet gets these free)</h3>
    <table class="content-table">
        <tr><th>Source</th><th>Address Prefix</th><th>Next Hop</th></tr>
        <tr><td>Default</td><td>VNet address space</td><td>Virtual Network</td></tr>
        <tr><td>Default</td><td>0.0.0.0/0</td><td>Internet</td></tr>
        <tr><td>Default</td><td>10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16</td><td>None (blocked)</td></tr>
        <tr><td>Virtual network peering</td><td>Peered VNet range</td><td>Vnet peering</td></tr>
        <tr><td>Virtual network gateway</td><td>From BGP</td><td>Virtual network gateway</td></tr>
    </table>

    <div class="concept-box">
        <h4>🔑 Longest Prefix Match</h4>
        <p>When multiple routes match a destination, Azure picks the <strong>most specific</strong> one (longest prefix). A route for <code>10.0.1.0/24</code> beats a route for <code>10.0.0.0/16</code> which beats <code>0.0.0.0/0</code>.</p>
        <p>If two routes have the same prefix length, this priority wins: <strong>User-Defined Route &gt; BGP &gt; System</strong>.</p>
    </div>

    <h3>Next-Hop Types</h3>
    <table class="content-table">
        <tr><th>Next Hop</th><th>Use Case</th></tr>
        <tr><td><strong>Virtual Network Gateway</strong></td><td>Send traffic to on-prem via VPN/ExpressRoute</td></tr>
        <tr><td><strong>Virtual Network</strong></td><td>Route within the VNet (not typically needed manually)</td></tr>
        <tr><td><strong>Internet</strong></td><td>Send to the public internet</td></tr>
        <tr><td><strong>Virtual Appliance</strong></td><td>Force traffic through a firewall / NVA (must specify IP)</td></tr>
        <tr><td><strong>None</strong></td><td>Drop the traffic (blackhole). Useful for blocking specific ranges.</td></tr>
    </table>

    <div class="tip-box">
        <h4>💡 The #1 Use Case: Force-Tunneling to a Firewall</h4>
        <p>In a hub-spoke topology, the spoke subnet has a UDR: <code>0.0.0.0/0 → Virtual Appliance → 10.100.1.4</code> (firewall private IP). All internet traffic gets steered through the firewall for inspection.</p>
    </div>

    <h3>BGP Route Propagation</h3>
    <p>When you connect on-prem via VPN or ExpressRoute, BGP routes are automatically propagated to your VNet subnets. You can disable this with <strong>Propagate gateway routes = No</strong> on the route table — useful when you want the NVA/firewall to handle routing decisions instead.</p>
</div>
`,
    diagrams: [
        {
            id: 'udr-flow',
            type: 'udr',
            title: 'UDR Force-Tunnel to Firewall',
            icon: '🗺️',
            description: 'Without UDR, spoke VM traffic exits to internet directly. With UDR, it goes through hub firewall first.',
            steps: [
                'VM in spoke subnet sends a request to an external IP (8.8.8.8).',
                'Without UDR, system route sends it straight to the internet via SNAT.',
                'With UDR (0.0.0.0/0 → Virtual Appliance → firewall IP), traffic is forwarded through the firewall in the hub VNet.',
                'Firewall inspects, logs, and allows/denies the request.',
                'Allowed traffic exits to the internet via the firewall\'s public IP.'
            ]
        }
    ],
    quiz: [
        {
            question: 'Which route wins when multiple routes match a destination?',
            options: ['The first one created', 'The most specific (longest prefix) route', 'The one with the highest priority number', 'System routes always win'],
            correct: 1,
            explanation: 'Azure uses longest prefix match. If prefixes are equal length, User-Defined Routes beat BGP-learned routes, which beat system routes.'
        },
        {
            question: 'SCENARIO: You want all internet-bound traffic from the spoke VNet to pass through an Azure Firewall (IP 10.100.1.4) in the hub. What UDR do you create on the spoke subnet?',
            options: [
                '10.100.0.0/16 → Virtual Appliance → 10.100.1.4',
                '0.0.0.0/0 → Virtual Appliance → 10.100.1.4',
                '0.0.0.0/0 → Internet',
                '0.0.0.0/0 → Virtual Network Gateway'
            ],
            correct: 1,
            explanation: '0.0.0.0/0 (all non-VNet traffic) pointed at the firewall\'s private IP as a Virtual Appliance next hop. This overrides the default system "0.0.0.0/0 → Internet" route via longest-prefix tie-breaking.',
            type: 'scenario'
        },
        {
            question: 'Which next-hop types are valid in a User-Defined Route? (Select all that apply)',
            options: [
                'Virtual Network Gateway',
                'Virtual Appliance',
                'None (drop traffic)',
                'Azure Front Door',
                'Internet'
            ],
            correct: [0, 1, 2, 4],
            explanation: 'Valid next hops are Virtual Network Gateway, Virtual Network, Virtual Appliance, Internet, and None. Azure Front Door is not a routing next hop — it\'s a global L7 entry point.',
            type: 'multi-select'
        },
        {
            question: 'You connect on-prem via ExpressRoute but want your firewall NVA (not the gateway) to handle routing. What setting do you change?',
            options: ['Delete the ExpressRoute connection', 'Disable BGP on the gateway', 'Set "Propagate gateway routes = No" on the route table', 'Add a UDR for 0.0.0.0/0 → Internet'],
            correct: 2,
            explanation: 'Disabling "Propagate gateway routes" on the route table stops BGP-learned routes from being applied to the subnet, letting your UDR (and thus the NVA) control routing decisions.'
        }
    ],
    interactive: [
        {
            type: 'drag-drop',
            id: 'udr-next-hop',
            title: 'Pick the Right Next Hop',
            description: 'Drag each scenario to its correct UDR next-hop type.',
            items: [
                'Force all internet traffic through an Azure Firewall',
                'Send 10.200.0.0/16 to an on-prem datacenter via ExpressRoute',
                'Blackhole traffic to a known-bad IP range',
                'Let Azure handle normal VNet-to-VNet routing (default)'
            ],
            targets: {
                'Virtual Appliance': ['Force all internet traffic through an Azure Firewall'],
                'Virtual Network Gateway': ['Send 10.200.0.0/16 to an on-prem datacenter via ExpressRoute'],
                'None (blackhole)': ['Blackhole traffic to a known-bad IP range'],
                'Virtual Network (system default)': ['Let Azure handle normal VNet-to-VNet routing (default)']
            }
        }
    ],
    references: [
        { title: 'Virtual network traffic routing', url: 'https://learn.microsoft.com/azure/virtual-network/virtual-networks-udr-overview' },
        { title: 'Create, change, or delete a route table', url: 'https://learn.microsoft.com/azure/virtual-network/manage-route-table' },
        { title: 'Hub-spoke network topology', url: 'https://learn.microsoft.com/azure/architecture/networking/architecture/hub-spoke' }
    ],
    lab: {
        title: 'Hands-On: Force-Tunnel Internet Traffic Through an NVA',
        icon: '🗺️',
        scenario: 'Create a route table that forces all 0.0.0.0/0 traffic from a subnet through a designated firewall/NVA IP.',
        duration: '20-30 minutes',
        cost: 'Free (route tables have no cost)',
        difficulty: 'Intermediate',
        prerequisites: ['Resource group rg-academy-lab', 'VNet vnet-academy with snet-web'],
        cleanup: 'az network route-table delete --name rt-spoke --resource-group rg-academy-lab',
        steps: [
            {
                title: 'Create a Route Table',
                type: 'confirm',
                explanation: 'A route table is a collection of UDRs you attach to one or more subnets.',
                cli: `<div class="lab-code-block">az network route-table create \\
    --name rt-spoke \\
    --resource-group rg-academy-lab \\
    --location eastus \\
    --disable-bgp-route-propagation false</div>`,
                portal: '<p>Portal → Route tables → Create → Name: <code>rt-spoke</code></p>'
            },
            {
                title: 'Add a UDR for 0.0.0.0/0',
                type: 'confirm',
                explanation: 'This is the force-tunnel route. Replace 10.100.1.4 with your firewall\'s private IP.',
                cli: `<div class="lab-code-block">az network route-table route create \\
    --name to-firewall \\
    --route-table-name rt-spoke \\
    --resource-group rg-academy-lab \\
    --address-prefix 0.0.0.0/0 \\
    --next-hop-type VirtualAppliance \\
    --next-hop-ip-address 10.100.1.4</div>`,
                portal: '<p>Route table → Routes → + Add → Prefix: <code>0.0.0.0/0</code>, Next hop: <strong>Virtual appliance</strong>, IP: <code>10.100.1.4</code></p>',
                tip: 'Virtual appliance next hop requires IP forwarding enabled on the NVA\'s NIC.'
            },
            {
                title: 'Associate with Subnet',
                type: 'confirm',
                cli: `<div class="lab-code-block">az network vnet subnet update \\
    --name snet-web \\
    --vnet-name vnet-academy \\
    --resource-group rg-academy-lab \\
    --route-table rt-spoke</div>`,
                portal: '<p>VNet → Subnets → <code>snet-web</code> → Route table: <code>rt-spoke</code> → Save</p>'
            },
            {
                title: 'Verify Effective Routes',
                type: 'confirm',
                explanation: 'Inspect the effective routes on a VM NIC to confirm the UDR is active and has priority over the system route.',
                cli: `<div class="lab-code-block">az network nic show-effective-route-table \\
    --name &lt;vm-nic-name&gt; \\
    --resource-group rg-academy-lab \\
    --output table</div>`,
                portal: '<p>VM → Networking → NIC → Effective routes. Look for a <strong>User</strong> row for 0.0.0.0/0.</p>',
                verification: 'The effective route table shows Source=User, Prefix=0.0.0.0/0, Next hop=VirtualAppliance, IP=10.100.1.4 with state Active.'
            }
        ]
    }
},

// ──────────────────────────────────────────────
// AZURE FIREWALL  (L300)
// ──────────────────────────────────────────────
{
    id: 'azure-firewall',
    level: 300,
    title: 'Azure Firewall',
    subtitle: 'Stateful L3-L7 network firewall, TLS inspection, IDPS',
    icon: '🔥',
    estimatedTime: '45m',
    learn: `
<div class="learn-section">
    <h2>What is Azure Firewall?</h2>
    <p>Azure Firewall is a cloud-native, fully stateful firewall-as-a-service with built-in high availability and unrestricted cloud scalability. Unlike NSGs which only do L3-L4 filtering, Firewall operates at L3-L7 and can filter based on FQDN, inspect TLS, and run IDPS.</p>

    <h3>Firewall SKU Tiers</h3>
    <table class="content-table">
        <tr><th>Feature</th><th>Basic</th><th>Standard</th><th>Premium</th></tr>
        <tr><td>Use case</td><td>SMB, low throughput</td><td>Most enterprise</td><td>Regulated / sensitive</td></tr>
        <tr><td>Throughput</td><td>Up to 250 Mbps</td><td>Up to 30 Gbps</td><td>Up to 100 Gbps</td></tr>
        <tr><td>Network + application rules</td><td>✔</td><td>✔</td><td>✔</td></tr>
        <tr><td>Threat intelligence</td><td>Alert only</td><td>Alert or Deny</td><td>Alert or Deny</td></tr>
        <tr><td>TLS inspection</td><td>—</td><td>—</td><td>✔</td></tr>
        <tr><td>IDPS (intrusion detection/prevention)</td><td>—</td><td>—</td><td>✔</td></tr>
        <tr><td>URL filtering (full URL, not just FQDN)</td><td>—</td><td>—</td><td>✔</td></tr>
        <tr><td>Web categories (social, gambling, etc.)</td><td>—</td><td>Domain only</td><td>Full URL</td></tr>
    </table>

    <h3>Rule Types (Rule Collections)</h3>
    <div class="comparison-grid">
        <div class="comparison-card">
            <h4>NAT Rules</h4>
            <p>DNAT inbound: translate a public IP:port to a private backend IP:port. Useful for exposing internal services.</p>
            <p><em>Example:</em> <code>Public_IP:8080 → 10.0.1.4:80</code></p>
        </div>
        <div class="comparison-card">
            <h4>Network Rules</h4>
            <p>L3/L4 filtering based on source, destination, port, protocol. Like NSG rules but centrally managed with FQDN support.</p>
        </div>
        <div class="comparison-card">
            <h4>Application Rules</h4>
            <p>L7 filtering on FQDNs and FQDN tags (<code>WindowsUpdate</code>, <code>AzureKubernetesService</code>, etc.). Required for most HTTPS egress control.</p>
        </div>
    </div>

    <h3>Processing Order (critical for AZ-104)</h3>
    <div class="concept-box">
        <h4>🔑 Rule Evaluation</h4>
        <p>1. <strong>DNAT rules</strong> processed first.<br>
        2. <strong>Network rules</strong> processed second.<br>
        3. <strong>Application rules</strong> processed last.<br>
        Within each collection type, <strong>lower priority number = higher priority</strong>. Once a rule matches, processing stops.</p>
    </div>

    <h3>Firewall Policy vs Classic Rules</h3>
    <p>New deployments should use <strong>Firewall Policy</strong> — a separate resource that can be shared across multiple firewalls, versioned, and organized hierarchically (parent → child). Classic rules are embedded in the firewall resource and cannot be reused.</p>

    <div class="warning-box">
        <h4>⚠️ Firewall vs NSG — Not Either/Or</h4>
        <p>Use BOTH. NSGs for subnet-level micro-segmentation (free, distributed). Azure Firewall at the hub for centralized east-west and north-south policy, FQDN filtering, and logging. They complement each other.</p>
    </div>
</div>
`,
    diagrams: [
        {
            id: 'firewall-topology',
            type: 'firewall',
            title: 'Azure Firewall in Hub-Spoke',
            icon: '🔥',
            description: 'Azure Firewall in the hub inspects all spoke internet-bound and cross-spoke traffic.',
            steps: [
                'Spoke VM in snet-web initiates request to an external API.',
                'UDR on spoke subnet forces 0.0.0.0/0 through Firewall\'s private IP.',
                'Firewall evaluates application rules — target FQDN is in the allow list.',
                'Traffic is SNAT\'d to the firewall public IP and sent to the internet.',
                'Response returns via firewall connection tracking, back to the spoke VM.',
                'An unrelated spoke-to-spoke request is also forced through the firewall for east-west inspection.'
            ],
            legend: [
                { color: '#E8443A', label: 'Firewall-inspected path' },
                { color: '#107c10', label: 'Allowed via app rule' },
                { color: '#d13438', label: 'Denied (example)' }
            ]
        }
    ],
    quiz: [
        {
            question: 'In what order does Azure Firewall evaluate rule collections?',
            options: [
                'Application → Network → NAT',
                'NAT → Network → Application',
                'Network → NAT → Application',
                'NAT → Application → Network'
            ],
            correct: 1,
            explanation: 'Azure Firewall evaluates DNAT rules first, then Network rules, then Application rules. Within each type, lower-priority-number rules run first.'
        },
        {
            question: 'SCENARIO: You must allow VMs to reach only *.microsoft.com and *.windowsupdate.com over HTTPS, and block everything else. Which rule type do you primarily use?',
            options: ['NSG rules', 'Network rules (L4)', 'Application rules with FQDNs', 'NAT rules'],
            correct: 2,
            explanation: 'FQDN-based HTTPS egress control is exactly what Application rules are for. NSGs and Network rules operate at L3/L4 (IPs/ports), not domains. Application rules support wildcards and FQDN tags like WindowsUpdate.',
            type: 'scenario'
        },
        {
            question: 'Which features are ONLY available in Azure Firewall Premium? (Select all that apply)',
            options: [
                'TLS inspection',
                'IDPS (intrusion detection and prevention)',
                'FQDN-based application rules',
                'URL filtering (full URL path)',
                'Web category filtering by full URL'
            ],
            correct: [0, 1, 3, 4],
            explanation: 'Premium-only: TLS inspection, IDPS, URL filtering, full-URL web categories. FQDN application rules are available in all SKUs (Basic/Standard/Premium).',
            type: 'multi-select'
        },
        {
            question: 'Your spoke subnet has a UDR 0.0.0.0/0 → Virtual Appliance → Firewall IP. A VM tries to reach an IP that is allowed by NSG but the Firewall does not have a matching allow rule. What happens?',
            options: [
                'Traffic is allowed because NSG allows it',
                'Traffic is denied by the implicit firewall deny-all',
                'Traffic bypasses the firewall',
                'Traffic is allowed but logged as suspicious'
            ],
            correct: 1,
            explanation: 'Both NSG and Firewall must allow the traffic. Firewall has an implicit deny-all at the end — if no rule matches, it is dropped. NSG being permissive does not override the firewall.'
        }
    ],
    interactive: [
        {
            type: 'drag-drop',
            id: 'fw-rule-types',
            title: 'Match Scenario → Firewall Rule Type',
            description: 'Drag each requirement to the rule type you would use.',
            items: [
                'Expose a web app on port 8080 via the firewall\'s public IP',
                'Allow spoke VMs to reach only *.windowsupdate.com over HTTPS',
                'Block all outbound SMB (TCP 445) to the internet',
                'Allow DNS (UDP 53) from the spoke to 168.63.129.16'
            ],
            targets: {
                'NAT (DNAT) Rule': ['Expose a web app on port 8080 via the firewall\'s public IP'],
                'Application Rule': ['Allow spoke VMs to reach only *.windowsupdate.com over HTTPS'],
                'Network Rule (Deny)': ['Block all outbound SMB (TCP 445) to the internet'],
                'Network Rule (Allow)': ['Allow DNS (UDP 53) from the spoke to 168.63.129.16']
            }
        }
    ],
    references: [
        { title: 'What is Azure Firewall?', url: 'https://learn.microsoft.com/azure/firewall/overview' },
        { title: 'Azure Firewall SKU comparison', url: 'https://learn.microsoft.com/azure/firewall/choose-firewall-sku' },
        { title: 'Azure Firewall Premium features', url: 'https://learn.microsoft.com/azure/firewall/premium-features' },
        { title: 'Firewall Policy rule processing', url: 'https://learn.microsoft.com/azure/firewall/rule-processing' }
    ],
    lab: {
        title: 'Hands-On: Deploy Azure Firewall with FQDN Rules',
        icon: '🔥',
        scenario: 'Deploy Azure Firewall Standard, configure an application rule allowing only Microsoft-related FQDNs, and verify the policy works from a spoke VM.',
        duration: '45-60 minutes',
        cost: '~$1.25/hour Firewall Standard + data processing (delete after lab!)',
        difficulty: 'Advanced',
        prerequisites: ['Hub VNet with AzureFirewallSubnet (/26)', 'Spoke VNet peered to hub', 'VM in spoke with Bastion access'],
        cleanup: `az network firewall delete --name fw-academy --resource-group rg-academy-lab
az network firewall policy delete --name fwpol-academy --resource-group rg-academy-lab`,
        steps: [
            {
                title: 'Create Firewall Subnet in Hub',
                type: 'confirm',
                explanation: 'Azure Firewall requires a subnet named exactly AzureFirewallSubnet, minimum /26.',
                cli: `<div class="lab-code-block">az network vnet subnet create \\
    --name AzureFirewallSubnet \\
    --vnet-name vnet-hub \\
    --resource-group rg-academy-lab \\
    --address-prefixes 10.100.1.0/26</div>`
            },
            {
                title: 'Create Firewall Policy',
                type: 'confirm',
                explanation: 'Policy is a reusable resource. Classic rules are legacy.',
                cli: `<div class="lab-code-block">az network firewall policy create \\
    --name fwpol-academy \\
    --resource-group rg-academy-lab \\
    --sku Standard \\
    --location eastus</div>`
            },
            {
                title: 'Add Application Rule (Allow Microsoft FQDNs)',
                type: 'confirm',
                explanation: 'Application rules filter on FQDN/URL for HTTPS. We allow wildcard Microsoft domains.',
                cli: `<div class="lab-code-block">az network firewall policy rule-collection-group create \\
    --name DefaultApplicationRuleCollectionGroup \\
    --policy-name fwpol-academy \\
    --resource-group rg-academy-lab \\
    --priority 300

az network firewall policy rule-collection-group collection add-filter-collection \\
    --policy-name fwpol-academy \\
    --rule-collection-group-name DefaultApplicationRuleCollectionGroup \\
    --resource-group rg-academy-lab \\
    --name AllowMSFT \\
    --collection-priority 1000 \\
    --action Allow \\
    --rule-name AllowMicrosoftDomains \\
    --rule-type ApplicationRule \\
    --source-addresses 10.1.0.0/16 \\
    --protocols Https=443 Http=80 \\
    --target-fqdns "*.microsoft.com" "*.windowsupdate.com" "*.windows.com"</div>`
            },
            {
                title: 'Deploy the Firewall and Attach Policy',
                type: 'confirm',
                explanation: 'Deploy Firewall Standard, attach the policy, and give it a public IP for outbound SNAT.',
                cli: `<div class="lab-code-block">az network public-ip create \\
    --name pip-fw \\
    --resource-group rg-academy-lab \\
    --sku Standard \\
    --allocation-method Static

az network firewall create \\
    --name fw-academy \\
    --resource-group rg-academy-lab \\
    --location eastus \\
    --sku AZFW_VNet \\
    --tier Standard \\
    --firewall-policy fwpol-academy

az network firewall ip-config create \\
    --firewall-name fw-academy \\
    --name fwipcfg \\
    --public-ip-address pip-fw \\
    --resource-group rg-academy-lab \\
    --vnet-name vnet-hub</div>`,
                warning: 'Firewall deployment takes 10-15 minutes.'
            },
            {
                title: 'Route Spoke Traffic Through Firewall',
                type: 'confirm',
                explanation: 'Add a UDR to the spoke subnet forcing 0.0.0.0/0 through the firewall.',
                cli: `<div class="lab-code-block">FW_PRIVATE_IP=$(az network firewall show -g rg-academy-lab -n fw-academy --query "ipConfigurations[0].privateIPAddress" -o tsv)

az network route-table create --name rt-spoke --resource-group rg-academy-lab
az network route-table route create \\
    --name to-fw \\
    --route-table-name rt-spoke \\
    --resource-group rg-academy-lab \\
    --address-prefix 0.0.0.0/0 \\
    --next-hop-type VirtualAppliance \\
    --next-hop-ip-address $FW_PRIVATE_IP

az network vnet subnet update \\
    --name snet-app \\
    --vnet-name vnet-spoke \\
    --resource-group rg-academy-lab \\
    --route-table rt-spoke</div>`
            },
            {
                title: 'Test: Allowed vs Denied FQDNs',
                type: 'confirm',
                explanation: 'From the spoke VM, try one allowed and one denied FQDN.',
                portal: `<ol>
                    <li>Bastion into the spoke VM</li>
                    <li>Run: <code>curl -v https://www.microsoft.com</code> — should succeed</li>
                    <li>Run: <code>curl -v https://www.bing.com</code> — should TIMEOUT (not in allow list)</li>
                    <li>Check Firewall logs in Log Analytics for the denied request</li>
                </ol>`,
                verification: 'Allowed FQDN returns 200. Denied FQDN times out and appears in AzureDiagnostics with action=Deny.'
            }
        ]
    }
},

// ──────────────────────────────────────────────
// NETWORK WATCHER  (L300)
// ──────────────────────────────────────────────
{
    id: 'network-watcher',
    level: 300,
    title: 'Network Watcher & Troubleshooting',
    subtitle: 'Connection Monitor, IP Flow Verify, NSG Flow Logs, Packet Capture',
    icon: '🔍',
    estimatedTime: '40m',
    learn: `
<div class="learn-section">
    <h2>What is Network Watcher?</h2>
    <p>Network Watcher is Azure\'s diagnostic and monitoring toolkit for IaaS networking. It\'s <strong>enabled automatically</strong> when you create a VNet in a region (resource group: <code>NetworkWatcherRG</code>).</p>

    <h3>The Essential Tools (AZ-104 staples)</h3>
    <table class="content-table">
        <tr><th>Tool</th><th>What it answers</th></tr>
        <tr><td><strong>IP Flow Verify</strong></td><td>Will this packet (src IP:port → dst IP:port) be allowed or denied by NSG rules? Returns the specific rule that matched.</td></tr>
        <tr><td><strong>Next Hop</strong></td><td>Given a destination IP, what is the effective next hop from this VM? Useful when UDRs are misconfigured.</td></tr>
        <tr><td><strong>Connection Troubleshoot</strong></td><td>Tests connectivity from VM A to any IP/FQDN:port. Shows hop-by-hop latency and identifies firewall/NSG drops.</td></tr>
        <tr><td><strong>Connection Monitor</strong></td><td>Continuous, scheduled connectivity tests with alerts. Replaces the deprecated Connection Monitor v1.</td></tr>
        <tr><td><strong>NSG Flow Logs</strong></td><td>Log every packet 5-tuple (allowed and denied) to a storage account. Feeds Traffic Analytics.</td></tr>
        <tr><td><strong>Packet Capture</strong></td><td>Wireshark-compatible PCAPs from a VM without installing anything (uses the Network Watcher agent VM extension).</td></tr>
        <tr><td><strong>VPN Troubleshoot</strong></td><td>Diagnose VPN gateway connectivity issues with one click.</td></tr>
    </table>

    <div class="concept-box">
        <h4>🔑 Diagnostic Workflow</h4>
        <p>When a user reports "my VM can\'t reach X":<br>
        1. <strong>IP Flow Verify</strong> first — is NSG blocking it?<br>
        2. <strong>Next Hop</strong> — is the UDR sending it somewhere unexpected?<br>
        3. <strong>Connection Troubleshoot</strong> — hop-by-hop trace with latency.<br>
        4. <strong>Packet Capture</strong> — last resort, wire-level evidence.</p>
    </div>

    <h3>NSG Flow Logs v2 + Traffic Analytics</h3>
    <p>NSG Flow Logs (v2) write 5-tuple + state (allow/deny) + bytes to a storage account every minute. When you enable <strong>Traffic Analytics</strong>, Log Analytics ingests this data and provides:</p>
    <ul>
        <li>Top talkers, blocked flows, malicious IP correlation</li>
        <li>Geo-map of traffic sources</li>
        <li>Integration with Azure Sentinel / Microsoft Defender for Cloud</li>
    </ul>

    <div class="warning-box">
        <h4>⚠️ Flow Logs v1 Retirement</h4>
        <p>NSG Flow Logs v1 is retired. New logs must use <strong>v2</strong> format (includes flow state). If you have legacy v1 logs, migrate to v2 — and eventually to <strong>VNet Flow Logs</strong> (which replaces NSG Flow Logs entirely and works without NSGs).</p>
    </div>
</div>
`,
    diagrams: [
        {
            id: 'nw-ipflow',
            type: 'nwatcher',
            title: 'IP Flow Verify — Which Rule Wins?',
            icon: '🔍',
            description: 'IP Flow Verify asks Azure: given src/dst/port/protocol, which NSG rule would match?',
            steps: [
                'User reports VM-A cannot reach 8.8.8.8:443.',
                'Admin opens Network Watcher → IP flow verify.',
                'Selects VM-A, Direction=Outbound, Protocol=TCP, Local=VM IP, Remote=8.8.8.8:443.',
                'Result: DENY. Matched rule: Custom_Block_Internet at priority 200.',
                'Admin now knows exactly which NSG rule to fix — no guessing.'
            ]
        }
    ],
    quiz: [
        {
            question: 'Which Network Watcher tool tells you exactly which NSG rule will match a hypothetical packet?',
            options: ['Connection Troubleshoot', 'IP Flow Verify', 'Next Hop', 'Packet Capture'],
            correct: 1,
            explanation: 'IP Flow Verify takes a 5-tuple (src/dst IP, src/dst port, protocol) and returns Allow/Deny plus the exact NSG rule that matched.'
        },
        {
            question: 'SCENARIO: A spoke VM cannot reach SQL PaaS at sqlsrv.database.windows.net. You want to confirm whether a misconfigured UDR is sending traffic to the wrong next hop. Which tool do you use FIRST?',
            options: ['Packet Capture', 'NSG Flow Logs', 'Next Hop', 'Connection Monitor'],
            correct: 2,
            explanation: 'Next Hop immediately shows the effective next-hop type and IP for a given destination from a specific VM NIC. Perfect for catching UDR misconfigurations without waiting for logs.',
            type: 'scenario'
        },
        {
            question: 'Which of these can NSG Flow Logs v2 provide? (Select all that apply)',
            options: [
                '5-tuple flow records every minute',
                'Allowed vs denied flow state',
                'Full packet payloads (for deep inspection)',
                'Bytes-per-flow counters',
                'Input for Traffic Analytics dashboards'
            ],
            correct: [0, 1, 3, 4],
            explanation: 'Flow logs record 5-tuple, action, and byte counts — but NOT payloads. For payload inspection use Packet Capture or a TAP-like solution.',
            type: 'multi-select'
        },
        {
            question: 'You need CONTINUOUS, scheduled connectivity checks from VMs to an external HTTPS endpoint with alerting. Which tool?',
            options: ['IP Flow Verify', 'Connection Troubleshoot (one-shot)', 'Connection Monitor', 'NSG Flow Logs'],
            correct: 2,
            explanation: 'Connection Monitor runs continuous synthetic tests with configurable frequency, thresholds, and Azure Monitor alerts. The others are one-shot or passive.'
        }
    ],
    interactive: [
        {
            type: 'drag-drop',
            id: 'nw-tool-match',
            title: 'Pick the Right Network Watcher Tool',
            description: 'Drag each troubleshooting task to the correct tool.',
            items: [
                'Check which NSG rule will block an outbound packet',
                'Find what next hop a VM uses for 203.0.113.10',
                'Capture Wireshark-compatible packets from a VM',
                'Continuously monitor connectivity VM-A → api.example.com',
                'See top internet talkers in the last 24 hours',
                'One-click VPN gateway diagnosis'
            ],
            targets: {
                'IP Flow Verify': ['Check which NSG rule will block an outbound packet'],
                'Next Hop': ['Find what next hop a VM uses for 203.0.113.10'],
                'Packet Capture': ['Capture Wireshark-compatible packets from a VM'],
                'Connection Monitor': ['Continuously monitor connectivity VM-A → api.example.com'],
                'NSG Flow Logs + Traffic Analytics': ['See top internet talkers in the last 24 hours'],
                'VPN Troubleshoot': ['One-click VPN gateway diagnosis']
            }
        }
    ],
    references: [
        { title: 'What is Azure Network Watcher?', url: 'https://learn.microsoft.com/azure/network-watcher/network-watcher-overview' },
        { title: 'IP Flow Verify overview', url: 'https://learn.microsoft.com/azure/network-watcher/ip-flow-verify-overview' },
        { title: 'NSG Flow Logs v2', url: 'https://learn.microsoft.com/azure/network-watcher/nsg-flow-logs-overview' },
        { title: 'Connection Monitor', url: 'https://learn.microsoft.com/azure/network-watcher/connection-monitor-overview' }
    ],
    lab: {
        title: 'Hands-On: Diagnose an NSG Block with IP Flow Verify',
        icon: '🔍',
        scenario: 'Intentionally create an NSG rule that blocks outbound HTTPS, then use Network Watcher IP Flow Verify to prove exactly which rule matched — the real-world troubleshooting workflow.',
        duration: '25 minutes',
        cost: 'Free',
        difficulty: 'Intermediate',
        prerequisites: ['A VM in your lab VNet', 'An NSG attached to its subnet or NIC'],
        cleanup: '# Remove the blocking rule after the lab:\naz network nsg rule delete --nsg-name nsg-web-tier --resource-group rg-academy-lab --name BlockOutHttps',
        steps: [
            {
                title: 'Create a Blocking Rule (on purpose)',
                type: 'confirm',
                explanation: 'Add an outbound Deny for HTTPS so we can watch Network Watcher catch it.',
                cli: `<div class="lab-code-block">az network nsg rule create \\
    --nsg-name nsg-web-tier \\
    --resource-group rg-academy-lab \\
    --name BlockOutHttps \\
    --priority 200 \\
    --direction Outbound \\
    --access Deny \\
    --protocol Tcp \\
    --source-address-prefixes '*' \\
    --destination-address-prefixes '*' \\
    --destination-port-ranges 443</div>`
            },
            {
                title: 'Run IP Flow Verify',
                type: 'confirm',
                explanation: 'Ask Network Watcher whether the VM can reach an external HTTPS endpoint.',
                portal: `<ol>
                    <li>Search <strong>Network Watcher</strong> → <strong>IP flow verify</strong></li>
                    <li>Select VM, NIC, Direction: <strong>Outbound</strong>, Protocol: <strong>TCP</strong></li>
                    <li>Local IP: VM\'s private IP, Local port: <code>*</code></li>
                    <li>Remote IP: <code>8.8.8.8</code>, Remote port: <code>443</code></li>
                    <li>Click <strong>Check</strong></li>
                </ol>`,
                cli: `<div class="lab-code-block">az network watcher test-ip-flow \\
    --direction Outbound \\
    --protocol TCP \\
    --local 10.0.1.4:22222 \\
    --remote 8.8.8.8:443 \\
    --vm vm-web01 \\
    --resource-group rg-academy-lab</div>`,
                verification: 'Result shows <strong>Access: Deny</strong> and Rule: <code>BlockOutHttps</code>. This is exactly how real troubleshooting works.'
            },
            {
                title: 'Enable NSG Flow Logs v2',
                type: 'confirm',
                explanation: 'Flow logs give you historical visibility. Requires a storage account.',
                cli: `<div class="lab-code-block"># Create a storage account for logs
az storage account create \\
    --name stflowlogs$RANDOM \\
    --resource-group rg-academy-lab \\
    --location eastus \\
    --sku Standard_LRS

# Enable v2 flow logs
az network watcher flow-log create \\
    --name fl-nsg-web \\
    --nsg nsg-web-tier \\
    --resource-group rg-academy-lab \\
    --storage-account &lt;storage-account-name&gt; \\
    --retention 7 \\
    --format JSON \\
    --log-version 2</div>`,
                tip: 'Combine with Log Analytics workspace to enable Traffic Analytics dashboards.'
            },
            {
                title: 'Remove the Blocking Rule',
                type: 'confirm',
                explanation: 'Cleanup step — rerun IP Flow Verify to confirm the traffic is now allowed.',
                cli: `<div class="lab-code-block">az network nsg rule delete \\
    --nsg-name nsg-web-tier \\
    --resource-group rg-academy-lab \\
    --name BlockOutHttps</div>`,
                verification: 'Rerunning IP Flow Verify now shows <strong>Access: Allow</strong> via the default AllowInternetOutBound rule.'
            }
        ]
    }
},

// ──────────────────────────────────────────────
// CAPSTONE LAB  (L300)
// ──────────────────────────────────────────────
{
    id: 'capstone-hub-spoke',
    level: 300,
    title: 'Capstone: Hub-Spoke with Firewall & Front Door',
    subtitle: 'Bring it all together — enterprise-grade topology',
    icon: '🏆',
    estimatedTime: '60m',
    learn: `
<div class="learn-section">
    <h2>🏆 The Capstone Challenge</h2>
    <p>Congratulations — you\'ve worked through foundations, intermediate, and advanced Azure networking. This capstone pulls it all together in one enterprise-grade deployment.</p>

    <h3>Target Architecture</h3>
    <ul>
        <li><strong>Hub VNet (10.100.0.0/16):</strong> Azure Firewall + Azure Bastion + VPN Gateway subnet</li>
        <li><strong>Spoke VNet A — Web tier (10.1.0.0/16):</strong> Web app VMs behind an internal Load Balancer</li>
        <li><strong>Spoke VNet B — Data tier (10.2.0.0/16):</strong> SQL PaaS with Private Endpoint</li>
        <li><strong>Front Door Premium</strong> → Public entry point with WAF</li>
        <li><strong>Private DNS Zone</strong> for privatelink.database.windows.net</li>
        <li><strong>UDRs</strong> forcing spoke-to-spoke and spoke-to-internet through the firewall</li>
        <li><strong>NSGs</strong> with AzureFrontDoor.Backend service tag on the web tier</li>
        <li><strong>NAT Gateway</strong> on management subnet for deterministic outbound</li>
    </ul>

    <h3>What You\'ll Prove You Can Do</h3>
    <ul>
        <li>✔ Plan non-overlapping CIDR blocks across a hub and two spokes</li>
        <li>✔ Deploy VNet peering with "Use remote gateway" + "Allow gateway transit"</li>
        <li>✔ Force-tunnel spoke traffic through a central firewall</li>
        <li>✔ Secure a backend by locking the NSG to Front Door\'s service tag</li>
        <li>✔ Use Private Endpoints + Private DNS to keep PaaS traffic off the internet</li>
        <li>✔ Troubleshoot with Network Watcher when something doesn\'t route as expected</li>
    </ul>

    <div class="tip-box">
        <h4>💡 Download the Bicep Starter</h4>
        <p>A starter Bicep template is available in the <code>capstone/</code> folder of the GitHub repo. Deploy with:</p>
        <div class="code-block">az deployment group create \\
    --resource-group rg-capstone \\
    --template-file main.bicep \\
    --parameters adminUsername=azureuser</div>
        <p>Then walk through the lab steps on this page to validate each component.</p>
    </div>

    <div class="warning-box">
        <h4>⚠️ Cost Warning</h4>
        <p>This architecture will cost ~$50/day if left running (Firewall + VPN Gateway + Front Door + Bastion). <strong>Deploy, validate, screenshot, delete.</strong> The entire resource group should be deleted with <code>az group delete -n rg-capstone --yes</code> when you finish.</p>
    </div>
</div>
`,
    diagrams: [
        {
            id: 'capstone-arch',
            type: 'hub-spoke-capstone',
            title: 'Enterprise Hub-Spoke Reference Architecture',
            icon: '🏆',
            description: 'The full picture — Front Door at the edge, Firewall in the hub, private endpoints in the data spoke.',
            steps: [
                'User requests app.contoso.com → DNS resolves to Front Door anycast IP.',
                'Front Door Premium evaluates WAF rules, applies caching, then selects healthy backend.',
                'Traffic reaches the web-tier internal Load Balancer in spoke A via Private Link.',
                'Web VM calls SQL PaaS via a Private Endpoint — traffic never touches the public internet.',
                'Separately, any internet-bound traffic from spoke VMs is forced through Azure Firewall via UDR.',
                'Firewall applies FQDN rules, logs everything, and SNATs outbound via its public IP.'
            ]
        }
    ],
    quiz: [
        {
            question: 'SCENARIO: In your hub-spoke deployment, the spoke VMs cannot reach the internet. Effective routes show 0.0.0.0/0 → Virtual Appliance → 10.100.1.4 (firewall). What is the most likely cause?',
            options: [
                'NSG on the spoke subnet is blocking all outbound traffic',
                'The firewall\'s NIC does not have IP forwarding enabled, or the firewall has no Allow rule for this destination',
                'VNet peering is not configured',
                'Front Door is blocking the traffic'
            ],
            correct: 1,
            explanation: 'When UDR is correct (route shows virtual appliance) but traffic still fails, look at the NVA itself: IP forwarding must be enabled on its NIC, AND the firewall must have an Allow rule. Firewall has an implicit deny-all.',
            type: 'scenario'
        },
        {
            question: 'Which of these are required for a spoke VM to call SQL PaaS entirely over the Microsoft backbone (no internet)? (Select all that apply)',
            options: [
                'Private Endpoint for the SQL server in the spoke VNet',
                'Private DNS Zone for privatelink.database.windows.net linked to the spoke VNet',
                'A public IP on the SQL server',
                'Firewall rule allowing TCP 1433 to the SQL public endpoint'
            ],
            correct: [0, 1],
            explanation: 'Private Endpoint + Private DNS Zone linkage is the pattern. A public IP is not needed. Firewall TCP 1433 rule would be for public-endpoint traffic, which is what Private Endpoint eliminates.',
            type: 'multi-select'
        },
        {
            question: 'In a hub-spoke, which peering setting allows a spoke to use the hub\'s VPN Gateway for on-prem connectivity?',
            options: ['"Allow forwarded traffic" on both', '"Use remote gateways" on spoke + "Allow gateway transit" on hub', 'A UDR pointing to the VPN Gateway', 'No special setting; peering is transitive'],
            correct: 1,
            explanation: 'This specific pair is required: spoke must "Use remote gateways", hub must "Allow gateway transit". Without both, the spoke cannot ride the hub gateway.'
        }
    ],
    interactive: [],
    references: [
        { title: 'Hub-spoke network topology (Cloud Adoption Framework)', url: 'https://learn.microsoft.com/azure/architecture/networking/architecture/hub-spoke' },
        { title: 'Azure landing zone reference architecture', url: 'https://learn.microsoft.com/azure/cloud-adoption-framework/ready/landing-zone/' },
        { title: 'Private Endpoint + Private DNS', url: 'https://learn.microsoft.com/azure/private-link/private-endpoint-dns' },
        { title: 'Front Door with internal origin (Private Link)', url: 'https://learn.microsoft.com/azure/frontdoor/private-link' }
    ],
    lab: {
        title: 'Capstone Lab: Full Hub-Spoke Validation',
        icon: '🏆',
        scenario: 'Deploy and validate the enterprise reference topology. Each step validates one layer — peering, UDR, NSG, Private Endpoint, Front Door. If any step fails, use Network Watcher to diagnose.',
        duration: '60-90 minutes',
        cost: '~$2/hour — delete the entire resource group when done',
        difficulty: 'Advanced',
        prerequisites: ['You have completed all L100, L200, L300 modules', 'Azure subscription with Contributor permissions', 'Azure CLI authenticated'],
        cleanup: 'az group delete --name rg-capstone --yes --no-wait',
        steps: [
            {
                title: 'Plan Your Address Spaces',
                type: 'confirm',
                explanation: 'Before any deployment, confirm no overlaps: Hub 10.100.0.0/16, Spoke-Web 10.1.0.0/16, Spoke-Data 10.2.0.0/16. On-prem (planned) 192.168.0.0/16.',
                portal: '<ol><li>Sketch the topology on paper or use Excalidraw</li><li>Verify each CIDR is non-overlapping</li><li>Set aside /26 for AzureFirewallSubnet, AzureBastionSubnet, GatewaySubnet in the hub</li></ol>',
                tip: 'The #1 cause of hub-spoke failures: overlapping CIDR. Peering silently breaks when ranges overlap.'
            },
            {
                title: 'Deploy Hub + 2 Spokes + Peering',
                type: 'confirm',
                explanation: 'Deploy the three VNets and configure bidirectional peering with gateway transit enabled.',
                cli: `<div class="lab-code-block"># See /capstone/main.bicep in the repo for the full template.
az group create -n rg-capstone -l eastus
az deployment group create \\
    -g rg-capstone \\
    --template-file capstone/main.bicep \\
    --parameters adminUsername=azureuser adminPassword='YourStr0ngP@ss!'</div>`,
                verification: 'az network vnet peering list -g rg-capstone --vnet-name vnet-hub shows two peerings in Connected state.'
            },
            {
                title: 'Validate Firewall Force-Tunnel',
                type: 'confirm',
                explanation: 'From a spoke VM, confirm 0.0.0.0/0 routes through the firewall.',
                cli: `<div class="lab-code-block">az network nic show-effective-route-table \\
    --ids $(az vm nic list --vm-name vm-web01 -g rg-capstone --query "[0].id" -o tsv) \\
    --output table | grep 0.0.0.0/0</div>`,
                verification: 'Output shows Source=User, Next hop=VirtualAppliance, IP=<firewall private IP>.'
            },
            {
                title: 'Validate Private Endpoint to SQL',
                type: 'confirm',
                explanation: 'From spoke-web VM, nslookup should return a private IP — not the public SQL endpoint.',
                portal: `<p>Bastion into vm-web01, then run:</p>
                <div class="lab-code-block">nslookup &lt;sqlservername&gt;.database.windows.net</div>
                <p>Expected: the IP returned is in the 10.2.x.x range (spoke-data VNet), NOT a public IP.</p>`,
                verification: 'nslookup returns a 10.x.x.x address from the private endpoint subnet.'
            },
            {
                title: 'Lock Down Web Tier to Front Door Only',
                type: 'confirm',
                explanation: 'Update the web-tier NSG: deny Internet, allow only AzureFrontDoor.Backend. This ensures users cannot bypass Front Door to hit origins directly.',
                cli: `<div class="lab-code-block">az network nsg rule create \\
    --nsg-name nsg-web-tier \\
    --resource-group rg-capstone \\
    --name AllowFrontDoorOnly \\
    --priority 100 \\
    --direction Inbound \\
    --access Allow \\
    --protocol Tcp \\
    --source-address-prefixes AzureFrontDoor.Backend \\
    --destination-port-ranges 443

az network nsg rule create \\
    --nsg-name nsg-web-tier \\
    --resource-group rg-capstone \\
    --name DenyInternet \\
    --priority 200 \\
    --direction Inbound \\
    --access Deny \\
    --protocol '*' \\
    --source-address-prefixes Internet \\
    --destination-port-ranges '*'</div>`,
                verification: 'curl directly to the origin public IP from your laptop times out. curl to the Front Door hostname succeeds.'
            },
            {
                title: 'Clean Up',
                type: 'confirm',
                explanation: 'The capstone deploys ~$2/hour of resources. Delete now.',
                cli: '<div class="lab-code-block">az group delete --name rg-capstone --yes --no-wait</div>',
                warning: 'Forgetting this step is the most common way to rack up an unexpected Azure bill.'
            }
        ]
    }
}

];
