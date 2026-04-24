/* ============================================
   LEVEL 200 MODULES — Intermediate
   ============================================ */

const MODULES_200 = [

// ──────────────────────────────────────────────
// MODULE 5: Network Security Groups (NSGs)
// ──────────────────────────────────────────────
{
    id: 'nsgs',
    level: 200,
    title: 'Network Security Groups (NSGs)',
    subtitle: 'Rules, priorities, default rules, ASGs',
    icon: '🛡️',
    estimatedTime: '40m',
    learn: `
<div class="learn-section">
    <h2>What is a Network Security Group?</h2>
    <p>An NSG is a firewall-like resource that filters network traffic to and from Azure resources in a VNet. It contains a list of security rules that allow or deny traffic based on source, destination, port, and protocol.</p>
    
    <div class="concept-box">
        <h4>🔑 Where NSGs Apply</h4>
        <p>NSGs can be associated with:<br>
        <strong>1. Subnets</strong> — affects ALL resources in the subnet<br>
        <strong>2. Network Interfaces (NICs)</strong> — affects only that specific VM<br>
        Both can be applied simultaneously — traffic must pass both NSGs.</p>
    </div>

    <h3>NSG Rule Properties</h3>
    <table class="content-table">
        <tr><th>Property</th><th>Description</th></tr>
        <tr><td><strong>Priority</strong></td><td>100–4096. Lower number = higher priority. First match wins.</td></tr>
        <tr><td><strong>Source</strong></td><td>IP, CIDR, service tag, or ASG</td></tr>
        <tr><td><strong>Source Port</strong></td><td>Port or range (usually * for any)</td></tr>
        <tr><td><strong>Destination</strong></td><td>IP, CIDR, service tag, or ASG</td></tr>
        <tr><td><strong>Destination Port</strong></td><td>Port or range (e.g., 80, 443, 3389)</td></tr>
        <tr><td><strong>Protocol</strong></td><td>TCP, UDP, ICMP, or Any</td></tr>
        <tr><td><strong>Action</strong></td><td>Allow or Deny</td></tr>
        <tr><td><strong>Direction</strong></td><td>Inbound or Outbound</td></tr>
    </table>

    <h3>Default Rules (Cannot Delete)</h3>
    <p>Every NSG comes with three default inbound and three default outbound rules:</p>
    
    <h4>Default Inbound Rules:</h4>
    <table class="content-table">
        <tr><th>Priority</th><th>Name</th><th>Source</th><th>Dest</th><th>Action</th></tr>
        <tr><td>65000</td><td>AllowVnetInBound</td><td>VirtualNetwork</td><td>VirtualNetwork</td><td>Allow</td></tr>
        <tr><td>65001</td><td>AllowAzureLoadBalancerInBound</td><td>AzureLoadBalancer</td><td>Any</td><td>Allow</td></tr>
        <tr><td>65500</td><td>DenyAllInBound</td><td>Any</td><td>Any</td><td>Deny</td></tr>
    </table>

    <h4>Default Outbound Rules:</h4>
    <table class="content-table">
        <tr><th>Priority</th><th>Name</th><th>Source</th><th>Dest</th><th>Action</th></tr>
        <tr><td>65000</td><td>AllowVnetOutBound</td><td>VirtualNetwork</td><td>VirtualNetwork</td><td>Allow</td></tr>
        <tr><td>65001</td><td>AllowInternetOutBound</td><td>Any</td><td>Internet</td><td>Allow</td></tr>
        <tr><td>65500</td><td>DenyAllOutBound</td><td>Any</td><td>Any</td><td>Deny</td></tr>
    </table>

    <div class="warning-box">
        <h4>⚠️ AZ-104 Critical</h4>
        <p>Priority processing: Rules are evaluated in priority order (lowest number first). The <strong>first matching rule wins</strong>. If no custom rule matches, the default DenyAll at 65500 kicks in. You cannot delete or modify default rules, but you can override them with higher-priority custom rules.</p>
    </div>
</div>

<div class="learn-section">
    <h2>Service Tags</h2>
    <p>Service tags are predefined groups of IP addresses for Azure services. Use them instead of managing IP ranges manually.</p>
    
    <table class="content-table">
        <tr><th>Tag</th><th>Represents</th></tr>
        <tr><td><strong>Internet</strong></td><td>All public internet IPs</td></tr>
        <tr><td><strong>VirtualNetwork</strong></td><td>VNet address space + peered VNets + on-prem (if connected)</td></tr>
        <tr><td><strong>AzureLoadBalancer</strong></td><td>Azure health probe source (168.63.129.16)</td></tr>
        <tr><td><strong>AzureFrontDoor.Backend</strong></td><td>Azure Front Door backend IPs — use to lock access</td></tr>
        <tr><td><strong>Storage</strong></td><td>Azure Storage service IPs</td></tr>
        <tr><td><strong>Sql</strong></td><td>Azure SQL Database IPs</td></tr>
        <tr><td><strong>AzureActiveDirectory</strong></td><td>Azure AD IPs</td></tr>
    </table>

    <div class="tip-box">
        <h4>💡 Front Door + NSG Pattern</h4>
        <p>When using Azure Front Door, restrict your backend to only accept traffic from Front Door by using the <span class="code-inline">AzureFrontDoor.Backend</span> service tag in your NSG. This prevents users from bypassing Front Door.</p>
    </div>
</div>

<div class="learn-section">
    <h2>Application Security Groups (ASGs)</h2>
    <p>ASGs let you group VMs logically and use those groups in NSG rules — no IP addresses needed!</p>
    
    <div class="code-block"># Create ASGs
az network asg create -g rg-prod -n asg-webservers
az network asg create -g rg-prod -n asg-dbservers

# Assign VM NIC to ASG
az network nic update -g rg-prod -n vm-web-nic \\
    --application-security-groups asg-webservers

# NSG rule using ASG
az network nsg rule create -g rg-prod --nsg-name nsg-prod \\
    --name AllowWebToDb \\
    --priority 200 \\
    --source-asgs asg-webservers \\
    --destination-asgs asg-dbservers \\
    --destination-port-ranges 1433 \\
    --protocol Tcp \\
    --access Allow</div>
</div>
`,
    diagrams: [
        {
            id: 'nsg-traffic-flow',
            type: 'nsg-filtering',
            title: 'NSG Traffic Filtering — How Rules Are Evaluated',
            icon: '🛡️',
            description: 'Watch how NSG rules filter incoming traffic. Rules are evaluated by priority (lowest number first). First match wins.',
            steps: [
                'Three types of traffic arrive: legitimate HTTPS, authorized SSH, and an attacker trying RDP.',
                'Each request hits the NSG at the subnet or NIC level.',
                'NSG evaluates rules by priority. Rule 100 (Allow HTTPS) — matches the HTTPS request.',
                'HTTPS traffic passes through to the VM — it matched the Allow rule at priority 100.',
                'SSH from 10.0.x.x matches Rule 200 (Allow SSH from internal) — passes through.',
                'RDP from the attacker matches Rule 300 (Deny RDP) — BLOCKED! Connection refused.'
            ],
            legend: [
                { color: '#107c10', label: 'Allowed Traffic' },
                { color: '#d13438', label: 'Denied Traffic' },
                { color: '#ff8c00', label: 'Default Deny All' }
            ]
        }
    ],
    quiz: [
        {
            question: 'An NSG has these inbound rules: Priority 100: Deny TCP 80 from Any. Priority 200: Allow TCP 80 from 10.0.1.0/24. What happens to HTTP traffic from 10.0.1.5?',
            options: ['Allowed — the Allow rule matches the source', 'Denied — Priority 100 (Deny) is evaluated first', 'Allowed — Allow rules always override Deny rules', 'Depends on the subnet association'],
            correct: 1,
            explanation: 'NSG rules are processed by priority (lowest number first). Priority 100 (Deny TCP 80 from Any) matches first and blocks ALL HTTP traffic, including from 10.0.1.5. The Allow rule at priority 200 is never reached.'
        },
        {
            question: 'Which default NSG rule allows load balancer health probes?',
            options: ['AllowVnetInBound', 'AllowAzureLoadBalancerInBound', 'AllowInternetOutBound', 'There is no default rule for this'],
            correct: 1,
            explanation: 'AllowAzureLoadBalancerInBound (priority 65001) allows traffic from the AzureLoadBalancer service tag (168.63.129.16) to any destination. This enables health probe traffic.'
        },
        {
            question: 'You want to restrict your web app backend to only receive traffic from Azure Front Door. Which service tag do you use?',
            options: ['Internet', 'AzureLoadBalancer', 'AzureFrontDoor.Backend', 'AzureTrafficManager'],
            correct: 2,
            explanation: 'Use the AzureFrontDoor.Backend service tag to allow only Azure Front Door IPs to reach your backend. This ensures traffic cannot bypass Front Door to reach your origin directly.'
        },
        {
            question: 'If an NSG is applied to both a subnet AND a NIC, how is traffic evaluated?',
            options: ['Only the subnet NSG applies', 'Only the NIC NSG applies', 'Inbound: subnet → NIC. Outbound: NIC → subnet. Must pass both.', 'The most restrictive single NSG applies'],
            correct: 2,
            explanation: 'For inbound traffic, the subnet NSG is evaluated first, then the NIC NSG. For outbound, NIC first, then subnet. Traffic must be allowed by BOTH NSGs to pass through.'
        },
        {
            question: 'What are Application Security Groups (ASGs) used for?',
            options: ['Encrypting application traffic', 'Grouping VMs logically for use in NSG rules without IP addresses', 'Monitoring application performance', 'Managing application deployments'],
            correct: 1,
            explanation: 'ASGs let you group VMs by role (e.g., web servers, DB servers) and reference those groups in NSG rules. This simplifies rules — no need to manage individual IP addresses as VMs scale.'
        }
    ],
    interactive: [
        {
            type: 'drag-drop',
            id: 'nsg-rule-builder',
            title: 'NSG Rule Priority',
            description: 'Arrange these NSG rules in the order they would be evaluated (lowest priority number first).',
            items: ['Priority 150: Allow SSH from MyIP', 'Priority 100: Deny All from Internet', 'Priority 65500: DenyAllInBound (default)', 'Priority 200: Allow HTTP from Any', 'Priority 65000: AllowVNetInBound (default)'],
            targets: {
                'Evaluated 1st': ['Priority 100: Deny All from Internet'],
                'Evaluated 2nd': ['Priority 150: Allow SSH from MyIP'],
                'Evaluated 3rd': ['Priority 200: Allow HTTP from Any'],
                'Evaluated 4th': ['Priority 65000: AllowVNetInBound (default)'],
                'Evaluated 5th': ['Priority 65500: DenyAllInBound (default)']
            }
        },
        {
            type: 'flashcards',
            id: 'nsg-flashcards',
            title: 'NSG Key Concepts',
            cards: [
                { front: 'What priority range can custom NSG rules use?', back: '100 to 4096. Default rules use 65000, 65001, and 65500. Lower numbers = higher priority = evaluated first.' },
                { front: 'Can you delete default NSG rules?', back: 'No. Default rules cannot be deleted. But you can override them by creating custom rules with higher priority (lower number).' },
                { front: 'What is the VirtualNetwork service tag?', back: 'Represents the VNet address space, all peered VNet address spaces, and any on-premises address spaces connected via VPN/ExpressRoute. Broader than just the local VNet!' },
                { front: 'Should you associate NSGs with subnets or NICs?', back: 'Best practice is subnet-level NSGs for broad policies and NIC-level NSGs for specific VM rules. Avoid using both on the same resource unless needed — it adds complexity.' }
            ]
        }
    ],
    lab: {
        title: 'Hands-On: Create NSG Rules to Secure a VNet',
        icon: '🛡️',
        scenario: 'Create a Network Security Group with custom rules to protect a web tier — allowing HTTPS from the internet while blocking everything else.',
        duration: '20-30 minutes',
        cost: 'Free (NSGs have no cost)',
        difficulty: 'Intermediate',
        prerequisites: ['Resource group rg-academy-lab', 'VNet vnet-academy with snet-web subnet'],
        cleanup: `az network nsg delete --name nsg-web-tier --resource-group rg-academy-lab --yes`,
        steps: [
            {
                title: 'Create a Network Security Group',
                subtitle: 'Your traffic filter',
                type: 'confirm',
                explanation: 'An NSG is a stateful firewall that filters traffic based on 5-tuple rules (source/dest IP, source/dest port, protocol). Each VNet subnet and NIC can have one NSG applied.',
                portal: `<ol>
                    <li>Search for <strong>"Network security groups"</strong> in the portal</li>
                    <li>Click <strong>+ Create</strong></li>
                    <li>Configure:
                        <ul>
                            <li>Resource group: <code>rg-academy-lab</code></li>
                            <li>Name: <code>nsg-web-tier</code></li>
                            <li>Region: <code>East US</code></li>
                        </ul>
                    </li>
                    <li>Click <strong>Review + create</strong> → <strong>Create</strong></li>
                </ol>`,
                cli: `<div class="lab-code-block"># Create the NSG
az network nsg create \\
    --name nsg-web-tier \\
    --resource-group rg-academy-lab \\
    --location eastus

# View default rules
az network nsg rule list \\
    --nsg-name nsg-web-tier \\
    --resource-group rg-academy-lab \\
    --include-default \\
    --output table</div>`,
                verification: 'Open the NSG and click <strong>Inbound security rules</strong>. You should see 3 default rules at priority 65000-65500.',
                tip: 'Default rules: AllowVNetInBound (65000), AllowAzureLoadBalancerInBound (65001), DenyAllInBound (65500). These CANNOT be deleted.'
            },
            {
                title: 'Add Rule: Allow HTTPS Inbound',
                subtitle: 'Priority 100 — most important rule',
                type: 'confirm',
                explanation: 'We\'ll create a rule at priority 100 to allow HTTPS (port 443) from the internet. This enables users to reach your web application.',
                portal: `<ol>
                    <li>Go to NSG <code>nsg-web-tier</code> → <strong>Inbound security rules</strong></li>
                    <li>Click <strong>+ Add</strong></li>
                    <li>Configure:
                        <ul>
                            <li>Source: <strong>Any</strong></li>
                            <li>Source port ranges: <strong>*</strong></li>
                            <li>Destination: <strong>Any</strong></li>
                            <li>Service: <strong>HTTPS</strong> (auto-fills port 443)</li>
                            <li>Action: <strong>Allow</strong></li>
                            <li>Priority: <code>100</code></li>
                            <li>Name: <code>AllowHTTPS</code></li>
                        </ul>
                    </li>
                    <li>Click <strong>Add</strong></li>
                </ol>`,
                cli: `<div class="lab-code-block"># Allow HTTPS from anywhere
az network nsg rule create \\
    --nsg-name nsg-web-tier \\
    --resource-group rg-academy-lab \\
    --name AllowHTTPS \\
    --priority 100 \\
    --direction Inbound \\
    --access Allow \\
    --protocol Tcp \\
    --source-address-prefixes '*' \\
    --source-port-ranges '*' \\
    --destination-address-prefixes '*' \\
    --destination-port-ranges 443</div>`
            },
            {
                title: 'Add Rule: Allow HTTP (for redirect)',
                subtitle: 'Priority 110',
                type: 'confirm',
                explanation: 'Many web apps listen on port 80 to redirect users to HTTPS. Let\'s allow port 80 as well.',
                portal: `<ol>
                    <li>Click <strong>+ Add</strong> again</li>
                    <li>Source: <strong>Any</strong> | Service: <strong>HTTP</strong> (port 80) | Action: <strong>Allow</strong> | Priority: <code>110</code> | Name: <code>AllowHTTP</code></li>
                    <li>Click <strong>Add</strong></li>
                </ol>`,
                cli: `<div class="lab-code-block"># Allow HTTP for redirect
az network nsg rule create \\
    --nsg-name nsg-web-tier \\
    --resource-group rg-academy-lab \\
    --name AllowHTTP \\
    --priority 110 \\
    --direction Inbound \\
    --access Allow \\
    --protocol Tcp \\
    --source-address-prefixes '*' \\
    --source-port-ranges '*' \\
    --destination-address-prefixes '*' \\
    --destination-port-ranges 80</div>`
            },
            {
                title: 'Add Rule: Deny SSH from Internet',
                subtitle: 'Priority 200 — explicit deny for clarity',
                type: 'confirm',
                explanation: 'While the default DenyAllInBound would block SSH, adding an explicit deny makes the security intent clear and prevents accidental future Allow rules at lower priority.',
                portal: `<ol>
                    <li>Click <strong>+ Add</strong></li>
                    <li>Source: <strong>Internet</strong> (service tag) | Destination port: <code>22</code> | Protocol: <strong>TCP</strong> | Action: <strong>Deny</strong> | Priority: <code>200</code> | Name: <code>DenySSHFromInternet</code></li>
                    <li>Click <strong>Add</strong></li>
                </ol>`,
                cli: `<div class="lab-code-block"># Explicitly deny SSH from internet
az network nsg rule create \\
    --nsg-name nsg-web-tier \\
    --resource-group rg-academy-lab \\
    --name DenySSHFromInternet \\
    --priority 200 \\
    --direction Inbound \\
    --access Deny \\
    --protocol Tcp \\
    --source-address-prefixes Internet \\
    --destination-port-ranges 22</div>`,
                tip: 'In production, use Azure Bastion for SSH/RDP instead of exposing port 22 to the internet.'
            },
            {
                title: 'Associate NSG with Subnet',
                subtitle: 'Attach the rules to your web subnet',
                type: 'confirm',
                explanation: 'An NSG does nothing until you associate it with a subnet or NIC. Let\'s attach it to the web tier subnet so all resources in that subnet are protected.',
                portal: `<ol>
                    <li>Go to NSG <code>nsg-web-tier</code> → <strong>Subnets</strong></li>
                    <li>Click <strong>+ Associate</strong></li>
                    <li>Virtual network: <code>vnet-academy</code></li>
                    <li>Subnet: <code>snet-web</code></li>
                    <li>Click <strong>OK</strong></li>
                </ol>`,
                cli: `<div class="lab-code-block"># Associate NSG with the web subnet
az network vnet subnet update \\
    --name snet-web \\
    --resource-group rg-academy-lab \\
    --vnet-name vnet-academy \\
    --network-security-group nsg-web-tier

# Verify
az network vnet subnet show \\
    --name snet-web \\
    --resource-group rg-academy-lab \\
    --vnet-name vnet-academy \\
    --query networkSecurityGroup.id \\
    --output tsv</div>`,
                verification: 'Go to the Subnets view of the NSG — you should see snet-web listed. All VMs in this subnet are now protected by these rules.'
            },
            {
                title: 'Review: NSG Rule Evaluation Order',
                subtitle: 'Key takeaway',
                type: 'confirm',
                explanation: 'NSG rules are evaluated by priority (lowest number first). An Allow HTTPS rule at priority 100 only matches port 443 — it does NOT affect port 22. Evaluation continues to priority 200 which explicitly denies SSH, so the request is denied by rule 200. Rules are matched on the 5-tuple (source/dest IP, source/dest port, protocol), not just priority order.',
                portal: '<ol><li><strong>Key fact:</strong> The answer is "Denied — rule 200 blocks SSH"</li><li>Priority 100 (Allow HTTPS on 443) does not match port 22 traffic — it is simply skipped</li><li>Priority 200 (Deny SSH on 22) matches and denies the request</li><li>Default DenyAllInBound only applies if NO explicit rule matches first</li></ol>'
            }
        ]
    }
},

// ──────────────────────────────────────────────
// MODULE 6: Azure DNS
// ──────────────────────────────────────────────
{
    id: 'azure-dns',
    level: 200,
    title: 'Azure DNS & Private DNS Zones',
    subtitle: 'Public zones, private zones, record management',
    icon: '📡',
    estimatedTime: '35m',
    learn: `
<div class="learn-section">
    <h2>Azure DNS Overview</h2>
    <p>Azure DNS lets you host your DNS zones in Azure. It uses Microsoft's global network of name servers for fast, reliable resolution.</p>
    
    <h3>Two Types of DNS Zones</h3>
    <div class="comparison-grid">
        <div class="comparison-card">
            <h4>Public DNS Zone</h4>
            <ul>
                <li>Hosts records for internet-facing domains</li>
                <li>Example: contoso.com</li>
                <li>Resolves from anywhere on the internet</li>
                <li>Used for web apps, APIs, Front Door custom domains</li>
            </ul>
        </div>
        <div class="comparison-card">
            <h4>Private DNS Zone</h4>
            <ul>
                <li>Hosts records only within your VNets</li>
                <li>Example: contoso.internal</li>
                <li>Resolves only from linked VNets</li>
                <li>Used for internal services, VMs, private endpoints</li>
            </ul>
        </div>
    </div>

    <h3>Setting Up a Public DNS Zone</h3>
    <div class="code-block"># Create a public DNS zone
az network dns zone create \\
    --resource-group rg-dns \\
    --name contoso.com

# Add an A record
az network dns record-set a add-record \\
    --resource-group rg-dns \\
    --zone-name contoso.com \\
    --record-set-name www \\
    --ipv4-address 20.0.0.1

# Add a CNAME for Azure Front Door
az network dns record-set cname set-record \\
    --resource-group rg-dns \\
    --zone-name contoso.com \\
    --record-set-name cdn \\
    --cname contoso.azurefd.net

# View records
az network dns record-set list \\
    --resource-group rg-dns \\
    --zone-name contoso.com \\
    --output table</div>

    <h3>Private DNS Zones</h3>
    <p>Private DNS zones provide name resolution within your VNets. They support auto-registration — VMs automatically get DNS records when they start.</p>
    
    <div class="code-block"># Create a private DNS zone
az network private-dns zone create \\
    --resource-group rg-dns \\
    --name contoso.internal

# Link to a VNet (with auto-registration)
az network private-dns link vnet create \\
    --resource-group rg-dns \\
    --zone-name contoso.internal \\
    --name link-to-vnet-prod \\
    --virtual-network vnet-prod \\
    --registration-enabled true

# VMs in vnet-prod now auto-register:
# vm-web01.contoso.internal → 10.0.1.4</div>

    <div class="concept-box">
        <h4>🔑 Auto-Registration</h4>
        <p>When auto-registration is enabled, VMs in the linked VNet automatically get A records in the private DNS zone. This eliminates manual DNS management for internal resources. Only ONE VNet can have auto-registration enabled per private DNS zone.</p>
    </div>
</div>
`,
    diagrams: [],
    quiz: [
        {
            question: 'What is the main difference between Azure Public DNS and Private DNS zones?',
            options: ['Public is faster, Private is slower', 'Public resolves from the internet, Private only from linked VNets', 'Public costs more, Private is free', 'Public supports more record types'],
            correct: 1,
            explanation: 'Public DNS zones resolve from anywhere on the internet. Private DNS zones only resolve from VNets that are linked to the zone, providing internal name resolution.'
        },
        {
            question: 'How many VNets can have auto-registration enabled for a single private DNS zone?',
            options: ['Unlimited', '1', '5', '10'],
            correct: 1,
            explanation: 'Only one VNet can have auto-registration enabled per private DNS zone. Other VNets can be linked for resolution (without auto-registration) — up to 1,000 VNets.'
        },
        {
            question: 'To point a custom domain to Azure Front Door, which DNS record type do you typically use?',
            options: ['A record', 'CNAME record', 'MX record', 'PTR record'],
            correct: 1,
            explanation: 'Use a CNAME record to point your custom domain (e.g., www.contoso.com) to the Front Door endpoint (e.g., contoso.azurefd.net). For zone apex (contoso.com without www), use an alias A record.'
        },
        {
            question: 'You delegate your domain to Azure DNS. Where do you configure the Name Server (NS) records?',
            options: ['In the Azure DNS zone', 'At your domain registrar', 'In the VNet DNS settings', 'In Azure AD'],
            correct: 1,
            explanation: 'You update the NS records at your domain registrar to point to Azure DNS name servers (ns1-01.azure-dns.com, etc.). This tells the internet that Azure DNS is authoritative for your domain.'
        }
    ],
    interactive: [
        {
            type: 'flashcards',
            id: 'dns-flashcards',
            title: 'DNS Concepts Review',
            cards: [
                { front: 'What is an Alias record in Azure DNS?', back: 'An Azure-specific feature that lets you point a record to an Azure resource (like a Public IP, Front Door, or Traffic Manager profile). Automatically updates if the resource IP changes. Supports zone apex (naked domain).' },
                { front: 'What is the zone apex?', back: 'The root of your domain without any subdomain — e.g., contoso.com (not www.contoso.com). Standard CNAME records cannot be used at the zone apex per DNS specification. Use Azure Alias records or ANAME/ALIAS instead.' },
                { front: 'What is TTL in DNS?', back: 'Time To Live — how long (in seconds) a DNS answer should be cached. Lower TTL = more frequent lookups but faster change propagation. Higher TTL = fewer lookups but slower updates.' },
                { front: 'How does Private DNS auto-registration work?', back: 'When enabled, VMs in the linked VNet automatically get A records created in the private DNS zone using their hostname. Records are removed when VMs are deleted.' }
            ]
        }
    ],
    lab: {
        title: 'Hands-On: Create a DNS Zone & Manage Records',
        icon: '📡',
        scenario: 'Create both public and private DNS zones in Azure, add various record types, and link a private zone to a VNet for internal name resolution.',
        duration: '20-30 minutes',
        cost: 'Free',
        difficulty: 'Intermediate',
        prerequisites: ['Resource group rg-academy-lab'],
        cleanup: `# Delete DNS resources
az network dns zone delete --name contoso-lab-XXXXX.com --resource-group rg-academy-lab --yes
az network private-dns link vnet delete --name link-to-academy --zone-name contoso.internal --resource-group rg-academy-lab --yes
az network private-dns zone delete --name contoso.internal --resource-group rg-academy-lab --yes`,
        steps: [
            {
                title: 'Create a Public DNS Zone',
                subtitle: 'Host your domain records in Azure',
                type: 'confirm',
                explanation: 'A public DNS zone hosts records that are resolvable from the internet. Use a unique name like contoso-lab-XXXXX.com (replace XXXXX with random numbers) since DNS zone names must be globally unique if you plan to delegate.',
                portal: `<ol>
                    <li>Search for <strong>"DNS zones"</strong> in the portal</li>
                    <li>Click <strong>+ Create</strong></li>
                    <li>Configure:
                        <ul>
                            <li>Resource group: <code>rg-academy-lab</code></li>
                            <li>Name: <code>contoso-lab-XXXXX.com</code> (replace XXXXX with random numbers, e.g., contoso-lab-83721.com)</li>
                        </ul>
                    </li>
                    <li>Click <strong>Review + create</strong> → <strong>Create</strong></li>
                    <li>Once created, note the 4 Azure name servers listed (ns1-xx.azure-dns.com, etc.)</li>
                </ol>`,
                cli: `<div class="lab-code-block"># Create a public DNS zone (replace XXXXX with random numbers)
az network dns zone create \\
    --resource-group rg-academy-lab \\
    --name contoso-lab-XXXXX.com

# View the assigned name servers
az network dns zone show \\
    --resource-group rg-academy-lab \\
    --name contoso-lab-XXXXX.com \\
    --query nameServers \\
    --output tsv</div>`,
                tip: 'In production, you would update your domain registrar\'s NS records to point to these Azure name servers to delegate DNS to Azure.',
                verification: 'Open the DNS zone — you should see NS and SOA records automatically created.'
            },
            {
                title: 'Add an A Record',
                subtitle: 'Map a hostname to an IP address',
                type: 'confirm',
                explanation: 'An A record maps a hostname to an IPv4 address. We\'ll create a "www" record pointing to an example IP (20.0.0.1). In production, this would be your web server or load balancer IP.',
                portal: `<ol>
                    <li>Open your DNS zone <code>contoso-lab-XXXXX.com</code></li>
                    <li>Click <strong>+ Record set</strong></li>
                    <li>Configure:
                        <ul>
                            <li>Name: <code>www</code></li>
                            <li>Type: <strong>A</strong></li>
                            <li>TTL: <code>3600</code></li>
                            <li>IP address: <code>20.0.0.1</code></li>
                        </ul>
                    </li>
                    <li>Click <strong>OK</strong></li>
                </ol>`,
                cli: `<div class="lab-code-block"># Add an A record for "www"
az network dns record-set a add-record \\
    --resource-group rg-academy-lab \\
    --zone-name contoso-lab-XXXXX.com \\
    --record-set-name www \\
    --ipv4-address 20.0.0.1

# Verify the record
az network dns record-set a show \\
    --resource-group rg-academy-lab \\
    --zone-name contoso-lab-XXXXX.com \\
    --name www</div>`,
                tip: 'TTL (Time To Live) controls how long resolvers cache the record. Lower TTL = faster updates but more DNS queries. 3600 seconds (1 hour) is a common default.',
                verification: 'You should see the A record for "www" with IP 20.0.0.1 in the DNS zone record list.'
            },
            {
                title: 'Add a CNAME Record',
                subtitle: 'Alias one name to another',
                type: 'confirm',
                explanation: 'A CNAME record maps one domain name to another (canonical name). This is commonly used to point subdomains to Azure services like App Service or Front Door. Important: CNAME cannot be used at the zone apex (e.g., contoso.com) — only on subdomains (e.g., app.contoso.com).',
                portal: `<ol>
                    <li>In your DNS zone, click <strong>+ Record set</strong></li>
                    <li>Configure:
                        <ul>
                            <li>Name: <code>app</code></li>
                            <li>Type: <strong>CNAME</strong></li>
                            <li>TTL: <code>3600</code></li>
                            <li>Alias: <code>myapp.azurewebsites.net</code></li>
                        </ul>
                    </li>
                    <li>Click <strong>OK</strong></li>
                </ol>`,
                cli: `<div class="lab-code-block"># Add a CNAME record for "app"
az network dns record-set cname set-record \\
    --resource-group rg-academy-lab \\
    --zone-name contoso-lab-XXXXX.com \\
    --record-set-name app \\
    --cname myapp.azurewebsites.net

# Verify
az network dns record-set cname show \\
    --resource-group rg-academy-lab \\
    --zone-name contoso-lab-XXXXX.com \\
    --name app</div>`,
                tip: 'CNAME vs A: Use CNAME when pointing to another hostname (e.g., azurewebsites.net) — if the target IP changes, your record automatically follows. Use A records when you need to specify a static IP directly.',
                verification: 'You should see the CNAME record "app" pointing to myapp.azurewebsites.net.'
            },
            {
                title: 'Create a Private DNS Zone',
                subtitle: 'Internal name resolution for VNets',
                type: 'confirm',
                explanation: 'A Private DNS Zone resolves names only from linked VNets — it is NOT accessible from the public internet. This is ideal for internal service discovery (e.g., database.contoso.internal, api.contoso.internal).',
                portal: `<ol>
                    <li>Search for <strong>"Private DNS zones"</strong> in the portal</li>
                    <li>Click <strong>+ Create</strong></li>
                    <li>Configure:
                        <ul>
                            <li>Resource group: <code>rg-academy-lab</code></li>
                            <li>Name: <code>contoso.internal</code></li>
                        </ul>
                    </li>
                    <li>Click <strong>Review + create</strong> → <strong>Create</strong></li>
                </ol>`,
                cli: `<div class="lab-code-block"># Create a private DNS zone
az network private-dns zone create \\
    --resource-group rg-academy-lab \\
    --name contoso.internal

# Verify
az network private-dns zone show \\
    --resource-group rg-academy-lab \\
    --name contoso.internal \\
    --query "{Name:name, NumberOfRecordSets:numberOfRecordSets}" \\
    --output table</div>`,
                tip: 'You can use any valid DNS name for private zones — they don\'t need to be real registered domains. Common patterns: company.internal, company.private, or company.local.',
                verification: 'The private DNS zone should appear in the portal with SOA records auto-created.'
            },
            {
                title: 'Link Private Zone to VNet',
                subtitle: 'Enable resolution from your virtual network',
                type: 'confirm',
                explanation: 'A private DNS zone does nothing until you link it to a VNet. Once linked, VMs in that VNet can resolve records in the private zone. Enabling auto-registration means VMs automatically get DNS records when they start up.',
                portal: `<ol>
                    <li>Open the private DNS zone <code>contoso.internal</code></li>
                    <li>Click <strong>Virtual network links</strong> in the left menu</li>
                    <li>Click <strong>+ Add</strong></li>
                    <li>Configure:
                        <ul>
                            <li>Link name: <code>link-to-academy</code></li>
                            <li>Virtual network: <code>vnet-academy</code></li>
                            <li>Enable auto registration: <strong>✅ Yes</strong></li>
                        </ul>
                    </li>
                    <li>Click <strong>OK</strong></li>
                </ol>`,
                cli: `<div class="lab-code-block"># Link the private DNS zone to the VNet with auto-registration
az network private-dns link vnet create \\
    --resource-group rg-academy-lab \\
    --zone-name contoso.internal \\
    --name link-to-academy \\
    --virtual-network vnet-academy \\
    --registration-enabled true

# Verify the link
az network private-dns link vnet show \\
    --resource-group rg-academy-lab \\
    --zone-name contoso.internal \\
    --name link-to-academy \\
    --query "{LinkName:name, VNet:virtualNetwork.id, AutoRegistration:registrationEnabled}" \\
    --output table</div>`,
                tip: 'Only ONE VNet can have auto-registration enabled per private DNS zone. Additional VNets can be linked for resolution only (without auto-registration) — up to 1,000 VNets.',
                verification: 'The virtual network link should show status "Completed" and registration enabled = true. Any VMs in vnet-academy will now auto-register as vmname.contoso.internal.'
            },
            {
                title: 'Review: Zone Apex & Alias Records',
                subtitle: 'Key takeaway',
                type: 'confirm',
                explanation: 'You cannot create a CNAME record at the zone apex (e.g., contoso.com). The DNS specification (RFC 1034) prohibits it. The correct approach is to use an Azure Alias record instead — it can point the apex directly to Azure resources like Front Door, Public IP, or Traffic Manager without violating DNS standards.',
                portal: '<ol><li><strong>Key fact:</strong> The answer is "No — use an Azure Alias record instead"</li><li>RFC 1034 forbids CNAME at the zone apex (bare domain)</li><li>Azure Alias records solve this by mapping the apex to Azure resources natively</li><li>Alias records support automatic IP updates if the target resource changes</li></ol>'
            }
        ]
    }
},

// ──────────────────────────────────────────────
// MODULE 7: Azure Load Balancing Overview
// ──────────────────────────────────────────────
{
    id: 'load-balancing-overview',
    level: 200,
    title: 'Azure Load Balancing Options',
    subtitle: 'Load Balancer, App Gateway, Traffic Manager, Front Door',
    icon: '⚖️',
    estimatedTime: '45m',
    learn: `
<div class="learn-section">
    <h2>The Azure Load Balancing Family</h2>
    <p>Azure offers four main load balancing services. Choosing the right one depends on your traffic type, scope, and requirements.</p>

    <div class="diagram-container">
        <svg viewBox="0 0 650 340" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:650px;font-family:'Segoe UI',sans-serif">
          <!-- Header -->
          <rect x="200" y="10" width="250" height="40" rx="8" fill="#0078D4"/>
          <text x="325" y="36" text-anchor="middle" fill="#fff" font-size="14" font-weight="600">Choose Your Load Balancer</text>
          <!-- Arrow down -->
          <line x1="325" y1="50" x2="325" y2="75" stroke="#555" stroke-width="2" marker-end="url(#arrow)"/>
          <!-- Decision: Global or Regional -->
          <rect x="225" y="75" width="200" height="36" rx="6" fill="#F3F2F1" stroke="#0078D4" stroke-width="2"/>
          <text x="325" y="98" text-anchor="middle" fill="#0078D4" font-size="13" font-weight="600">Global or Regional?</text>
          <!-- Left branch: Global -->
          <line x1="275" y1="111" x2="165" y2="145" stroke="#555" stroke-width="2" marker-end="url(#arrow)"/>
          <rect x="105" y="145" width="120" height="32" rx="6" fill="#E8F0FE" stroke="#0078D4" stroke-width="1.5"/>
          <text x="165" y="166" text-anchor="middle" fill="#0078D4" font-size="12" font-weight="600">Global</text>
          <!-- Right branch: Regional -->
          <line x1="375" y1="111" x2="485" y2="145" stroke="#555" stroke-width="2" marker-end="url(#arrow)"/>
          <rect x="425" y="145" width="120" height="32" rx="6" fill="#E8F0FE" stroke="#0078D4" stroke-width="1.5"/>
          <text x="485" y="166" text-anchor="middle" fill="#0078D4" font-size="12" font-weight="600">Regional</text>
          <!-- Global → HTTP(S)? -->
          <line x1="165" y1="177" x2="165" y2="200" stroke="#555" stroke-width="2" marker-end="url(#arrow)"/>
          <rect x="105" y="200" width="120" height="32" rx="6" fill="#F3F2F1" stroke="#FF8C00" stroke-width="1.5"/>
          <text x="165" y="221" text-anchor="middle" fill="#FF8C00" font-size="12" font-weight="600">HTTP/HTTPS?</text>
          <!-- Regional → HTTP(S)? -->
          <line x1="485" y1="177" x2="485" y2="200" stroke="#555" stroke-width="2" marker-end="url(#arrow)"/>
          <rect x="425" y="200" width="120" height="32" rx="6" fill="#F3F2F1" stroke="#FF8C00" stroke-width="1.5"/>
          <text x="485" y="221" text-anchor="middle" fill="#FF8C00" font-size="12" font-weight="600">HTTP/HTTPS?</text>
          <!-- Global Yes → Front Door -->
          <line x1="135" y1="232" x2="90" y2="268" stroke="#107C10" stroke-width="2" marker-end="url(#arrowG)"/>
          <text x="95" y="258" fill="#107C10" font-size="10">Yes</text>
          <rect x="30" y="270" width="130" height="50" rx="8" fill="#0078D4"/>
          <text x="95" y="293" text-anchor="middle" fill="#fff" font-size="12" font-weight="600">Front Door</text>
          <text x="95" y="308" text-anchor="middle" fill="#B3D7F2" font-size="9">L7 · Global · HTTP</text>
          <!-- Global No → Traffic Manager -->
          <line x1="195" y1="232" x2="240" y2="268" stroke="#D13438" stroke-width="2" marker-end="url(#arrowR)"/>
          <text x="225" y="258" fill="#D13438" font-size="10">No</text>
          <rect x="180" y="270" width="130" height="50" rx="8" fill="#7A3B93"/>
          <text x="245" y="293" text-anchor="middle" fill="#fff" font-size="12" font-weight="600">Traffic Manager</text>
          <text x="245" y="308" text-anchor="middle" fill="#D9C2E9" font-size="9">DNS · Global · Any</text>
          <!-- Regional Yes → App Gateway -->
          <line x1="455" y1="232" x2="410" y2="268" stroke="#107C10" stroke-width="2" marker-end="url(#arrowG)"/>
          <text x="415" y="258" fill="#107C10" font-size="10">Yes</text>
          <rect x="340" y="270" width="130" height="50" rx="8" fill="#107C10"/>
          <text x="405" y="293" text-anchor="middle" fill="#fff" font-size="12" font-weight="600">App Gateway</text>
          <text x="405" y="308" text-anchor="middle" fill="#B7E1CD" font-size="9">L7 · Regional · HTTP</text>
          <!-- Regional No → Load Balancer -->
          <line x1="515" y1="232" x2="560" y2="268" stroke="#D13438" stroke-width="2" marker-end="url(#arrowR)"/>
          <text x="545" y="258" fill="#D13438" font-size="10">No</text>
          <rect x="500" y="270" width="130" height="50" rx="8" fill="#00BCF2"/>
          <text x="565" y="293" text-anchor="middle" fill="#fff" font-size="12" font-weight="600">Load Balancer</text>
          <text x="565" y="308" text-anchor="middle" fill="#D6F0FB" font-size="9">L4 · Regional · TCP/UDP</text>
          <!-- Arrow markers -->
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#555"/></marker>
            <marker id="arrowG" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#107C10"/></marker>
            <marker id="arrowR" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#D13438"/></marker>
          </defs>
        </svg>
    </div>

    <table class="content-table">
        <tr><th>Service</th><th>Layer</th><th>Scope</th><th>Traffic</th><th>Best For</th></tr>
        <tr><td><strong>Azure Load Balancer</strong></td><td>L4</td><td>Regional</td><td>TCP/UDP</td><td>VM traffic, internal services, non-HTTP</td></tr>
        <tr><td><strong>Application Gateway</strong></td><td>L7</td><td>Regional</td><td>HTTP/HTTPS</td><td>Web apps needing URL routing, WAF, SSL termination</td></tr>
        <tr><td><strong>Traffic Manager</strong></td><td>DNS</td><td>Global</td><td>Any (DNS-based)</td><td>Multi-region failover for non-HTTP services</td></tr>
        <tr><td><strong>Azure Front Door</strong></td><td>L7</td><td>Global</td><td>HTTP/HTTPS</td><td>Global web apps, CDN, WAF, acceleration</td></tr>
    </table>

    <div class="concept-box">
        <h4>🔑 When to Use Azure Front Door</h4>
        <p>Choose Front Door when you need:<br>
        • Global load balancing across multiple regions<br>
        • CDN/caching at the edge<br>
        • WAF (Web Application Firewall) protection<br>
        • SSL offloading at the edge<br>
        • URL-based routing with global reach<br>
        • Fast failover between regions (< 30 seconds)</p>
    </div>
</div>

<div class="learn-section">
    <h2>Azure Load Balancer Deep Dive</h2>
    
    <h3>Types</h3>
    <ul>
        <li><strong>Public Load Balancer:</strong> Has a public IP. Balances internet traffic to VMs.</li>
        <li><strong>Internal Load Balancer:</strong> Has a private IP. Balances internal VNet traffic.</li>
    </ul>

    <h3>Key Concepts</h3>
    <ul>
        <li><strong>Frontend IP:</strong> The IP that clients connect to</li>
        <li><strong>Backend Pool:</strong> The set of VMs or instances that receive traffic</li>
        <li><strong>Health Probes:</strong> Check backend health (TCP, HTTP, HTTPS)</li>
        <li><strong>Load Balancing Rules:</strong> Map frontend IP:port to backend pool</li>
        <li><strong>Distribution:</strong> Default is 5-tuple hash (src IP, src port, dest IP, dest port, protocol)</li>
    </ul>

    <h3>SKUs</h3>
    <table class="content-table">
        <tr><th>Feature</th><th>Basic</th><th>Standard</th></tr>
        <tr><td>Backend pool size</td><td>300</td><td>1,000</td></tr>
        <tr><td>Health probes</td><td>TCP, HTTP</td><td>TCP, HTTP, HTTPS</td></tr>
        <tr><td>Availability Zones</td><td>No</td><td>Yes</td></tr>
        <tr><td>SLA</td><td>N/A</td><td>99.99%</td></tr>
        <tr><td>Security</td><td>Open by default</td><td>Closed by default</td></tr>
    </table>
</div>

<div class="learn-section">
    <h2>Application Gateway</h2>
    <p>A regional, Layer 7 load balancer for HTTP/HTTPS traffic.</p>
    
    <h3>Key Features</h3>
    <ul>
        <li><strong>URL-based routing:</strong> /images/* → image servers, /api/* → API servers</li>
        <li><strong>SSL termination:</strong> Offload SSL processing from backend servers</li>
        <li><strong>WAF:</strong> Built-in Web Application Firewall (WAF v2)</li>
        <li><strong>Autoscaling:</strong> v2 SKU scales automatically</li>
        <li><strong>Multi-site hosting:</strong> Route based on hostname</li>
        <li><strong>Cookie-based session affinity</strong></li>
    </ul>

    <div class="warning-box">
        <h4>⚠️ App Gateway vs Front Door</h4>
        <p>App Gateway is <strong>regional</strong> — deploy one per region. Front Door is <strong>global</strong> — deploy once, it operates from all edge locations. If you need multi-region routing, use Front Door. If you need regional L7 routing with WAF inside a VNet, use App Gateway.</p>
    </div>
</div>

<div class="learn-section">
    <h2>Traffic Manager</h2>
    <p>DNS-based global traffic distributor. It doesn't proxy traffic — it just resolves DNS to the best endpoint.</p>
    
    <h3>Routing Methods</h3>
    <table class="content-table">
        <tr><th>Method</th><th>How It Works</th><th>Use Case</th></tr>
        <tr><td><strong>Priority</strong></td><td>Primary/secondary failover</td><td>Active-passive DR</td></tr>
        <tr><td><strong>Weighted</strong></td><td>Distribute % of traffic</td><td>Blue-green, canary deployments</td></tr>
        <tr><td><strong>Performance</strong></td><td>Route to lowest-latency endpoint</td><td>Global users, nearest datacenter</td></tr>
        <tr><td><strong>Geographic</strong></td><td>Route by user's geographic location</td><td>Data sovereignty, regional content</td></tr>
        <tr><td><strong>Multivalue</strong></td><td>Return multiple healthy endpoints</td><td>High availability</td></tr>
        <tr><td><strong>Subnet</strong></td><td>Route by client subnet</td><td>Specific clients to specific backends</td></tr>
    </table>
</div>
`,
    diagrams: [
        {
            id: 'lb-comparison',
            type: 'load-balancer',
            title: 'Azure Load Balancing — L4 vs L7 Comparison',
            icon: '⚖️',
            description: 'Compare Azure Load Balancer (Layer 4) with Application Gateway (Layer 7). Understand when to use each.',
            steps: [
                'Incoming requests arrive from multiple users hitting your frontend IP.',
                'Azure Load Balancer (L4): Distributes TCP/UDP traffic using a 5-tuple hash (src IP, dst IP, src port, dst port, protocol).',
                'Application Gateway (L7): Understands HTTP content — can route by URL path, hostname, and inspect headers.',
                'L4 backend: VMs receive raw traffic. Load balancer doesn\'t inspect content.',
                'L7 backend: Requests routed by path — /api/* to API pool, /web/* to web pool, /img/* to static pool.',
                'Key difference: L4 = Fast, protocol-agnostic | L7 = Smart, content-aware with SSL offload and WAF.'
            ],
            legend: [
                { color: '#0078d4', label: 'Layer 4 (Load Balancer)' },
                { color: '#107c10', label: 'Layer 7 (App Gateway)' },
                { color: '#ff8c00', label: 'Backend VMs' }
            ]
        }
    ],
    quiz: [
        {
            question: 'You need to globally load balance HTTPS traffic across multiple Azure regions with caching and WAF. Which service do you choose?',
            options: ['Azure Load Balancer', 'Application Gateway', 'Traffic Manager', 'Azure Front Door'],
            correct: 3,
            explanation: 'Azure Front Door is the only option that provides global L7 load balancing, CDN/caching, and WAF all in one service. It routes traffic at the Microsoft edge to the best backend region.'
        },
        {
            question: 'Azure Load Balancer operates at which OSI layer?',
            options: ['Layer 3', 'Layer 4', 'Layer 7', 'DNS level'],
            correct: 1,
            explanation: 'Azure Load Balancer is a Layer 4 (Transport) load balancer. It forwards TCP/UDP connections without inspecting the application payload (no URL routing, no cookie affinity).'
        },
        {
            question: 'Traffic Manager distributes traffic using which mechanism?',
            options: ['Proxy — traffic flows through Traffic Manager', 'DNS — resolves to the best endpoint IP', 'BGP — advertises routes', 'Layer 7 — inspects HTTP headers'],
            correct: 1,
            explanation: 'Traffic Manager is DNS-based. It doesn\'t proxy traffic — it responds to DNS queries with the IP of the best endpoint. After DNS resolution, traffic flows directly from client to endpoint.'
        },
        {
            question: 'Which load balancing service should you use for non-HTTP TCP traffic within a single region?',
            options: ['Azure Front Door', 'Application Gateway', 'Azure Load Balancer', 'Traffic Manager'],
            correct: 2,
            explanation: 'Azure Load Balancer handles any TCP/UDP traffic at Layer 4 within a region. Front Door and App Gateway are HTTP-only (Layer 7), and Traffic Manager is DNS-based.'
        },
        {
            question: 'What is a key difference between Application Gateway and Azure Front Door?',
            options: ['App Gateway supports WAF, Front Door does not', 'App Gateway is regional, Front Door is global', 'Front Door supports SSL, App Gateway does not', 'App Gateway is Layer 4, Front Door is Layer 7'],
            correct: 1,
            explanation: 'Both support WAF and SSL, and both are Layer 7. The key difference is scope: Application Gateway is a regional resource deployed in one region, while Front Door is a global service operating from Microsoft\'s edge worldwide.'
        }
    ],
    interactive: [
        {
            type: 'drag-drop',
            id: 'lb-selection',
            title: 'Choose the Right Load Balancer',
            description: 'Match each scenario to the best Azure load balancing service.',
            items: ['Global web app with CDN', 'Internal SQL traffic between subnets', 'Multi-region DNS-based failover for TCP', 'Regional web app with URL routing inside VNet', 'Global HTTPS with WAF protection', 'SSH traffic to VM pools'],
            targets: {
                'Azure Front Door': ['Global web app with CDN', 'Global HTTPS with WAF protection'],
                'Azure Load Balancer': ['Internal SQL traffic between subnets', 'SSH traffic to VM pools'],
                'Traffic Manager': ['Multi-region DNS-based failover for TCP'],
                'Application Gateway': ['Regional web app with URL routing inside VNet']
            }
        }
    ],
    lab: {
        title: 'Hands-On: Deploy an Azure Load Balancer',
        icon: '⚖️',
        scenario: 'Deploy a Standard Public Load Balancer with a backend pool, health probe, and load balancing rule to distribute HTTP traffic across web servers.',
        duration: '30-40 minutes',
        cost: '~$0.03 (Standard LB hourly rate for short lab)',
        difficulty: 'Intermediate',
        prerequisites: ['Resource group rg-academy-lab', 'VNet vnet-academy with snet-web subnet'],
        cleanup: `# Delete the load balancer and public IP
az network lb delete --name lb-web --resource-group rg-academy-lab
az network public-ip delete --name pip-lb-web --resource-group rg-academy-lab`,
        steps: [
            {
                title: 'Create a Standard Public Load Balancer',
                subtitle: 'Your Layer 4 traffic distributor',
                type: 'confirm',
                explanation: 'A Standard Public Load Balancer distributes incoming internet traffic across backend VMs. Standard SKU is recommended — it supports availability zones, has a 99.99% SLA, and is closed by default (requires NSG rules to allow traffic).',
                portal: `<ol>
                    <li>Search for <strong>"Load balancers"</strong> in the portal</li>
                    <li>Click <strong>+ Create</strong></li>
                    <li>Configure Basics:
                        <ul>
                            <li>Resource group: <code>rg-academy-lab</code></li>
                            <li>Name: <code>lb-web</code></li>
                            <li>Region: <code>East US</code></li>
                            <li>SKU: <strong>Standard</strong></li>
                            <li>Type: <strong>Public</strong></li>
                            <li>Tier: <strong>Regional</strong></li>
                        </ul>
                    </li>
                    <li>Frontend IP configuration: Click <strong>+ Add</strong>
                        <ul>
                            <li>Name: <code>fe-web</code></li>
                            <li>Create new Public IP: <code>pip-lb-web</code>, SKU Standard, Zone-redundant</li>
                        </ul>
                    </li>
                    <li>Click <strong>Review + create</strong> → <strong>Create</strong></li>
                </ol>`,
                cli: `<div class="lab-code-block"># Create a public IP for the load balancer
az network public-ip create \\
    --resource-group rg-academy-lab \\
    --name pip-lb-web \\
    --sku Standard \\
    --zone 1 2 3 \\
    --allocation-method Static

# Create the Standard Load Balancer
az network lb create \\
    --resource-group rg-academy-lab \\
    --name lb-web \\
    --sku Standard \\
    --frontend-ip-name fe-web \\
    --public-ip-address pip-lb-web \\
    --location eastus</div>`,
                tip: 'Always use Standard SKU in production. Basic SKU is being retired and lacks availability zone support, SLA, and security features.',
                verification: 'Open the load balancer — you should see a frontend IP configuration with the public IP assigned.'
            },
            {
                title: 'Create a Backend Pool',
                subtitle: 'Define where traffic goes',
                type: 'confirm',
                explanation: 'A backend pool is the group of VMs or instances that receive traffic from the load balancer. We\'ll associate it with our VNet and subnet. In production, you\'d add VM NICs or a VMSS to this pool.',
                portal: `<ol>
                    <li>Open <code>lb-web</code> → <strong>Backend pools</strong></li>
                    <li>Click <strong>+ Add</strong></li>
                    <li>Configure:
                        <ul>
                            <li>Name: <code>pool-web</code></li>
                            <li>Virtual network: <code>vnet-academy</code></li>
                            <li>Backend Pool Configuration: <strong>NIC</strong></li>
                        </ul>
                    </li>
                    <li>Click <strong>Save</strong> (we won't add VMs for this lab — just create the pool)</li>
                </ol>`,
                cli: `<div class="lab-code-block"># Create the backend pool
az network lb address-pool create \\
    --resource-group rg-academy-lab \\
    --lb-name lb-web \\
    --name pool-web \\
    --vnet vnet-academy

# Verify
az network lb address-pool show \\
    --resource-group rg-academy-lab \\
    --lb-name lb-web \\
    --name pool-web \\
    --query "{Name:name, BackendAddresses:loadBalancerBackendAddresses}" \\
    --output json</div>`,
                tip: 'Backend pool members can be VMs, VMSS instances, or IP addresses. For high availability, put VMs in different availability zones.',
                verification: 'The backend pool "pool-web" should appear in the backend pools list (empty for now — that\'s OK).'
            },
            {
                title: 'Create a Health Probe',
                subtitle: 'Monitor backend health',
                type: 'confirm',
                explanation: 'Health probes tell the load balancer which backend instances are healthy. The LB sends periodic requests to each backend — if a backend fails the health check, it\'s removed from rotation until it recovers.',
                portal: `<ol>
                    <li>In <code>lb-web</code>, click <strong>Health probes</strong></li>
                    <li>Click <strong>+ Add</strong></li>
                    <li>Configure:
                        <ul>
                            <li>Name: <code>probe-http</code></li>
                            <li>Protocol: <strong>HTTP</strong></li>
                            <li>Port: <code>80</code></li>
                            <li>Path: <code>/</code></li>
                            <li>Interval: <code>5</code> seconds</li>
                            <li>Unhealthy threshold: <code>2</code> consecutive failures</li>
                        </ul>
                    </li>
                    <li>Click <strong>Save</strong></li>
                </ol>`,
                cli: `<div class="lab-code-block"># Create an HTTP health probe
az network lb probe create \\
    --resource-group rg-academy-lab \\
    --lb-name lb-web \\
    --name probe-http \\
    --protocol Http \\
    --port 80 \\
    --path "/" \\
    --interval 5 \\
    --probe-threshold 2</div>`,
                tip: 'In production, create a dedicated /health endpoint that checks dependencies (DB, cache, etc.) rather than probing /. A 5-second interval is aggressive — 15-30 seconds is more common to reduce backend load.',
                verification: 'The health probe should appear in the Health probes list with protocol HTTP, port 80.'
            },
            {
                title: 'Create a Load Balancing Rule',
                subtitle: 'Connect frontend to backend',
                type: 'confirm',
                explanation: 'A load balancing rule maps the frontend IP:port to the backend pool, using the health probe to determine which backends are healthy. This is where the actual traffic distribution logic lives.',
                portal: `<ol>
                    <li>In <code>lb-web</code>, click <strong>Load balancing rules</strong></li>
                    <li>Click <strong>+ Add</strong></li>
                    <li>Configure:
                        <ul>
                            <li>Name: <code>rule-http</code></li>
                            <li>Frontend IP: <code>fe-web</code></li>
                            <li>Backend pool: <code>pool-web</code></li>
                            <li>Protocol: <strong>TCP</strong></li>
                            <li>Frontend port: <code>80</code></li>
                            <li>Backend port: <code>80</code></li>
                            <li>Health probe: <code>probe-http</code></li>
                            <li>Session persistence: <strong>None</strong> (default 5-tuple hash)</li>
                            <li>Idle timeout: <code>4</code> minutes</li>
                        </ul>
                    </li>
                    <li>Click <strong>Save</strong></li>
                </ol>`,
                cli: `<div class="lab-code-block"># Create a load balancing rule
az network lb rule create \\
    --resource-group rg-academy-lab \\
    --lb-name lb-web \\
    --name rule-http \\
    --frontend-ip-name fe-web \\
    --backend-pool-name pool-web \\
    --protocol Tcp \\
    --frontend-port 80 \\
    --backend-port 80 \\
    --probe-name probe-http \\
    --idle-timeout 4</div>`,
                tip: 'The default 5-tuple hash distributes traffic based on: source IP, source port, destination IP, destination port, and protocol. For session stickiness, change to "Client IP" (2-tuple) or "Client IP and protocol" (3-tuple).',
                verification: 'The rule should appear linking frontend port 80 to backend pool-web on port 80 with the HTTP health probe.'
            },
            {
                title: 'Examine the Configuration',
                subtitle: 'Review the complete setup',
                type: 'confirm',
                explanation: 'Let\'s review the full load balancer configuration to understand how all the pieces connect: Frontend IP receives traffic → Load balancing rule routes it → Health probe filters unhealthy backends → Backend pool serves the request.',
                portal: `<ol>
                    <li>Go to <code>lb-web</code> → <strong>Overview</strong></li>
                    <li>Note the public IP address assigned to the frontend</li>
                    <li>Click <strong>Frontend IP configuration</strong> — see the public IP mapping</li>
                    <li>Click <strong>Load balancing rules</strong> — see the rule connecting frontend to backend</li>
                    <li>Click <strong>Backend pools</strong> — see pool-web (empty in this lab)</li>
                    <li>Click <strong>Health probes</strong> — see the HTTP probe configuration</li>
                </ol>`,
                cli: `<div class="lab-code-block"># View the complete LB configuration
az network lb show \\
    --resource-group rg-academy-lab \\
    --name lb-web \\
    --output table

# View the frontend IP
az network lb frontend-ip list \\
    --resource-group rg-academy-lab \\
    --lb-name lb-web \\
    --output table

# View the rules
az network lb rule list \\
    --resource-group rg-academy-lab \\
    --lb-name lb-web \\
    --output table</div>`,
                tip: 'The 5-tuple hash means that different connections from the same client may go to different backends (because the source port changes). This is great for stateless applications but requires sticky sessions for stateful ones.',
                verification: 'You should see a complete chain: Public IP → Frontend → Rule → Health Probe → Backend Pool. This is the fundamental architecture of Azure Load Balancer.'
            },
            {
                title: 'Review: Health Probe IP',
                subtitle: 'Key takeaway',
                type: 'confirm',
                explanation: 'Azure health probes originate from IP 168.63.129.16. Your NSG MUST allow inbound traffic from this IP or health probes will fail and your backend will be marked unhealthy. This is Azure\'s well-known virtual platform IP, also used for DHCP and DNS. The corresponding service tag is "AzureLoadBalancer".',
                portal: '<ol><li><strong>Key fact:</strong> The answer is 168.63.129.16</li><li>This is Azure\'s virtual platform IP used for health probes, DHCP, and DNS</li><li>NSG must explicitly allow inbound from this IP on your probe port</li><li>If blocked, ALL backends appear unhealthy and traffic stops flowing</li></ol>'
            }
        ]
    }
},

// ──────────────────────────────────────────────
// MODULE 8: Azure Front Door Fundamentals
// ──────────────────────────────────────────────
{
    id: 'frontdoor-basics',
    level: 200,
    title: 'Azure Front Door Fundamentals',
    subtitle: 'Architecture, origins, routing, caching basics',
    icon: '🚪',
    estimatedTime: '50m',
    learn: `
<div class="learn-section">
    <h2>What is Azure Front Door?</h2>
    <p>Azure Front Door is a <strong>global, scalable entry point</strong> for fast delivery of your web applications. It operates at Layer 7 (HTTP/HTTPS) from Microsoft's global edge network — over 100 edge locations worldwide.</p>
    
    <div class="concept-box">
        <h4>🔑 Think of it This Way</h4>
        <p>Front Door sits at the "front door" of your application. Users connect to the nearest edge location (low latency), and Front Door routes their request to the best backend (origin) based on your routing rules. It's like having a concierge at every major city directing visitors to the right office.</p>
    </div>

    <h3>Key Capabilities</h3>
    <ul>
        <li><strong>Global HTTP/HTTPS load balancing</strong> — Route users to the nearest healthy backend</li>
        <li><strong>CDN/Caching</strong> — Cache content at the edge for faster delivery</li>
        <li><strong>SSL/TLS termination</strong> — Offload SSL at the edge</li>
        <li><strong>WAF (Web Application Firewall)</strong> — Protect against OWASP top 10, bots, DDoS</li>
        <li><strong>URL-based routing</strong> — Route /api/* to API backends, /images/* to storage</li>
        <li><strong>Session affinity</strong> — Sticky sessions for stateful apps</li>
        <li><strong>Health probes</strong> — Automatically detect unhealthy origins</li>
        <li><strong>Custom domains & certificates</strong> — Bring your own domain with managed TLS</li>
    </ul>
</div>

<div class="learn-section">
    <h2>Front Door Architecture</h2>
    
    <div class="diagram-container">
        <svg viewBox="0 0 750 380" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:750px;font-family:'Segoe UI',sans-serif">
          <!-- Users Column -->
          <text x="60" y="20" text-anchor="middle" fill="#0078D4" font-size="13" font-weight="700">Users</text>
          <rect x="10" y="35" width="100" height="32" rx="6" fill="#E8F0FE" stroke="#0078D4" stroke-width="1.5"/>
          <text x="60" y="56" text-anchor="middle" fill="#323130" font-size="11">👤 NYC</text>
          <rect x="10" y="80" width="100" height="32" rx="6" fill="#E8F0FE" stroke="#0078D4" stroke-width="1.5"/>
          <text x="60" y="101" text-anchor="middle" fill="#323130" font-size="11">👤 London</text>
          <rect x="10" y="125" width="100" height="32" rx="6" fill="#E8F0FE" stroke="#0078D4" stroke-width="1.5"/>
          <text x="60" y="146" text-anchor="middle" fill="#323130" font-size="11">👤 Tokyo</text>
          <rect x="10" y="170" width="100" height="32" rx="6" fill="#E8F0FE" stroke="#0078D4" stroke-width="1.5"/>
          <text x="60" y="191" text-anchor="middle" fill="#323130" font-size="11">👤 Sydney</text>

          <!-- Arrows: Users → Front Door -->
          <defs><marker id="fdArrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#0078D4"/></marker></defs>
          <line x1="110" y1="51" x2="230" y2="100" stroke="#0078D4" stroke-width="1.5" marker-end="url(#fdArrow)"/>
          <line x1="110" y1="96" x2="230" y2="110" stroke="#0078D4" stroke-width="1.5" marker-end="url(#fdArrow)"/>
          <line x1="110" y1="141" x2="230" y2="125" stroke="#0078D4" stroke-width="1.5" marker-end="url(#fdArrow)"/>
          <line x1="110" y1="186" x2="230" y2="140" stroke="#0078D4" stroke-width="1.5" marker-end="url(#fdArrow)"/>

          <!-- Front Door Box -->
          <rect x="230" y="30" width="280" height="185" rx="10" fill="#0078D4" opacity="0.07" stroke="#0078D4" stroke-width="2"/>
          <rect x="265" y="42" width="210" height="32" rx="6" fill="#0078D4"/>
          <text x="370" y="63" text-anchor="middle" fill="#fff" font-size="13" font-weight="700">Azure Front Door</text>
          <text x="370" y="92" text-anchor="middle" fill="#0078D4" font-size="12" font-weight="600">Edge Locations</text>
          <text x="290" y="112" fill="#323130" font-size="11">• Ashburn</text>
          <text x="290" y="128" fill="#323130" font-size="11">• London</text>
          <text x="290" y="144" fill="#323130" font-size="11">• Tokyo</text>
          <text x="400" y="112" fill="#323130" font-size="11">• Sydney</text>
          <text x="400" y="128" fill="#323130" font-size="11">• São Paulo</text>
          <text x="400" y="144" fill="#323130" font-size="11">• + 95 more</text>
          <!-- Features row -->
          <rect x="255" y="160" width="60" height="20" rx="4" fill="#00BCF2" opacity="0.2"/>
          <text x="285" y="174" text-anchor="middle" fill="#005A8C" font-size="9" font-weight="600">WAF</text>
          <rect x="322" y="160" width="60" height="20" rx="4" fill="#00BCF2" opacity="0.2"/>
          <text x="352" y="174" text-anchor="middle" fill="#005A8C" font-size="9" font-weight="600">CDN</text>
          <rect x="389" y="160" width="60" height="20" rx="4" fill="#00BCF2" opacity="0.2"/>
          <text x="419" y="174" text-anchor="middle" fill="#005A8C" font-size="9" font-weight="600">SSL</text>
          <rect x="456" y="160" width="60" height="20" rx="4" fill="#00BCF2" opacity="0.2"/>
          <text x="486" y="174" text-anchor="middle" fill="#005A8C" font-size="9" font-weight="600">Cache</text>
          <!-- Health badge -->
          <rect x="255" y="186" width="120" height="18" rx="4" fill="#107C10" opacity="0.15"/>
          <text x="315" y="199" text-anchor="middle" fill="#107C10" font-size="9" font-weight="600">Health Probes Active</text>

          <!-- Arrows: Front Door → Origins -->
          <line x1="510" y1="100" x2="580" y2="51" stroke="#107C10" stroke-width="1.5" marker-end="url(#fdArrowG)"/>
          <line x1="510" y1="110" x2="580" y2="101" stroke="#107C10" stroke-width="1.5" marker-end="url(#fdArrowG)"/>
          <line x1="510" y1="125" x2="580" y2="151" stroke="#107C10" stroke-width="1.5" marker-end="url(#fdArrowG)"/>
          <line x1="510" y1="140" x2="580" y2="201" stroke="#107C10" stroke-width="1.5" marker-end="url(#fdArrowG)"/>
          <defs><marker id="fdArrowG" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#107C10"/></marker></defs>

          <!-- Origins Column -->
          <text x="670" y="20" text-anchor="middle" fill="#107C10" font-size="13" font-weight="700">Origins</text>
          <rect x="580" y="35" width="160" height="32" rx="6" fill="#E7F3E8" stroke="#107C10" stroke-width="1.5"/>
          <text x="660" y="50" text-anchor="middle" fill="#323130" font-size="10" font-weight="600">App Service</text>
          <text x="660" y="62" text-anchor="middle" fill="#605E5C" font-size="9">East US</text>
          <rect x="580" y="82" width="160" height="32" rx="6" fill="#E7F3E8" stroke="#107C10" stroke-width="1.5"/>
          <text x="660" y="97" text-anchor="middle" fill="#323130" font-size="10" font-weight="600">App Service</text>
          <text x="660" y="109" text-anchor="middle" fill="#605E5C" font-size="9">West Europe</text>
          <rect x="580" y="135" width="160" height="32" rx="6" fill="#FFF4E5" stroke="#FF8C00" stroke-width="1.5"/>
          <text x="660" y="150" text-anchor="middle" fill="#323130" font-size="10" font-weight="600">VM Scale Set</text>
          <text x="660" y="162" text-anchor="middle" fill="#605E5C" font-size="9">East Asia</text>
          <rect x="580" y="185" width="160" height="32" rx="6" fill="#E8F0FE" stroke="#0078D4" stroke-width="1.5"/>
          <text x="660" y="200" text-anchor="middle" fill="#323130" font-size="10" font-weight="600">Storage Account</text>
          <text x="660" y="212" text-anchor="middle" fill="#605E5C" font-size="9">Central US</text>

          <!-- Routing Methods -->
          <text x="375" y="250" text-anchor="middle" fill="#323130" font-size="12" font-weight="700">Routing Methods</text>
          <rect x="55" y="265" width="145" height="44" rx="6" fill="#F3F2F1" stroke="#0078D4" stroke-width="1"/>
          <text x="127" y="283" text-anchor="middle" fill="#0078D4" font-size="11" font-weight="600">⚡ Latency</text>
          <text x="127" y="300" text-anchor="middle" fill="#605E5C" font-size="9">Fastest response</text>
          <rect x="215" y="265" width="145" height="44" rx="6" fill="#F3F2F1" stroke="#FF8C00" stroke-width="1"/>
          <text x="287" y="283" text-anchor="middle" fill="#FF8C00" font-size="11" font-weight="600">🎯 Priority</text>
          <text x="287" y="300" text-anchor="middle" fill="#605E5C" font-size="9">Primary / Secondary</text>
          <rect x="375" y="265" width="145" height="44" rx="6" fill="#F3F2F1" stroke="#7A3B93" stroke-width="1"/>
          <text x="447" y="283" text-anchor="middle" fill="#7A3B93" font-size="11" font-weight="600">⚖️ Weighted</text>
          <text x="447" y="300" text-anchor="middle" fill="#605E5C" font-size="9">% distribution</text>
          <rect x="535" y="265" width="165" height="44" rx="6" fill="#F3F2F1" stroke="#107C10" stroke-width="1"/>
          <text x="617" y="283" text-anchor="middle" fill="#107C10" font-size="11" font-weight="600">💚 Health Probes</text>
          <text x="617" y="300" text-anchor="middle" fill="#605E5C" font-size="9">Automatic failover</text>

          <!-- Flow summary -->
          <text x="375" y="340" text-anchor="middle" fill="#605E5C" font-size="10">Users → Nearest Edge → Intelligent Routing → Best Healthy Origin</text>
          <rect x="120" y="350" width="510" height="22" rx="4" fill="#0078D4" opacity="0.06"/>
          <text x="375" y="365" text-anchor="middle" fill="#0078D4" font-size="10" font-weight="600">Failover in &lt; 30 seconds · 100+ edge locations · Built-in WAF &amp; DDoS protection</text>
        </svg>
    </div>

    <h3>Front Door SKUs</h3>
    <table class="content-table">
        <tr><th>Feature</th><th>Standard</th><th>Premium</th></tr>
        <tr><td>Custom domains</td><td>500</td><td>500</td></tr>
        <tr><td>Rules Engine</td><td>Yes</td><td>Yes</td></tr>
        <tr><td>Caching</td><td>Yes</td><td>Yes</td></tr>
        <tr><td>Compression</td><td>Yes</td><td>Yes</td></tr>
        <tr><td>WAF</td><td>Custom rules only</td><td>Custom + Managed rules + Bot protection</td></tr>
        <tr><td>Private Link origins</td><td>No</td><td>Yes</td></tr>
        <tr><td>Advanced analytics</td><td>Basic</td><td>Enhanced reports + WAF logs</td></tr>
        <tr><td>Price</td><td>Lower</td><td>Higher</td></tr>
    </table>
</div>

<div class="learn-section">
    <h2>Classic vs Standard/Premium — Migration Guide</h2>
    <p>Azure Front Door has gone through a major architecture evolution. Understanding the difference is critical for the AZ-104 exam and real-world deployments.</p>
    
    <div class="warning-box">
        <h4>⚠️ Front Door Classic is Deprecated</h4>
        <p>Azure Front Door (Classic) is on the retirement path. Microsoft recommends migrating all Classic profiles to the new Standard or Premium tier. Classic cannot be created via the Azure Portal anymore — only Standard/Premium.</p>
    </div>

    <h3>Architecture Comparison</h3>
    <table class="content-table">
        <tr><th>Aspect</th><th>Front Door Classic</th><th>Front Door Standard/Premium</th></tr>
        <tr><td><strong>Resource model</strong></td><td>Flat: frontends, backend pools, routing rules</td><td>Hierarchical: profiles → endpoints → routes → origin groups → origins</td></tr>
        <tr><td><strong>SKU</strong></td><td>Single tier</td><td>Standard (CDN-focused) or Premium (security + Private Link)</td></tr>
        <tr><td><strong>Rules Engine</strong></td><td>Separate resource, limited conditions</td><td>Integrated Rule Sets with 10+ match conditions</td></tr>
        <tr><td><strong>WAF</strong></td><td>Basic managed rules</td><td>Standard: custom rules only. Premium: managed rules + Bot Manager</td></tr>
        <tr><td><strong>Private Link</strong></td><td>Not supported</td><td>Premium only — connect to origins without public IPs</td></tr>
        <tr><td><strong>Analytics</strong></td><td>Basic</td><td>Built-in reports, real-time metrics, WAF logs</td></tr>
        <tr><td><strong>CDN integration</strong></td><td>Separate service (Azure CDN)</td><td>Built-in CDN capabilities — replaces Azure CDN Standard</td></tr>
        <tr><td><strong>Terraform/Bicep</strong></td><td>azurerm_frontdoor</td><td>azurerm_cdn_frontdoor_profile</td></tr>
        <tr><td><strong>CLI prefix</strong></td><td>az network front-door</td><td>az afd (Azure Front Door)</td></tr>
    </table>

    <h3>Classic Terminology → Standard/Premium Terminology</h3>
    <table class="content-table">
        <tr><th>Classic Term</th><th>Standard/Premium Term</th></tr>
        <tr><td>Frontend Host</td><td>Endpoint + Custom Domain</td></tr>
        <tr><td>Backend Pool</td><td>Origin Group</td></tr>
        <tr><td>Backend</td><td>Origin</td></tr>
        <tr><td>Routing Rule</td><td>Route</td></tr>
        <tr><td>Rules Engine Configuration</td><td>Rule Set</td></tr>
        <tr><td>WAF Policy</td><td>Security Policy (same WAF, new association model)</td></tr>
    </table>

    <h3>When to Choose Standard vs Premium</h3>
    <div class="comparison-grid">
        <div class="comparison-card">
            <h4>Standard — Best for CDN/Performance</h4>
            <ul>
                <li>Static content delivery (images, JS, CSS)</li>
                <li>Simple web app acceleration</li>
                <li>Custom WAF rules (rate limiting, geo-blocking)</li>
                <li>URL rewriting and redirects</li>
                <li>Cost-sensitive workloads</li>
                <li>Origins with public endpoints</li>
            </ul>
        </div>
        <div class="comparison-card">
            <h4>Premium — Best for Security/Enterprise</h4>
            <ul>
                <li>Everything in Standard, plus:</li>
                <li>Managed WAF rule sets (OWASP DRS 2.1)</li>
                <li>Bot Manager rule set</li>
                <li>Private Link to origins (no public IPs needed)</li>
                <li>Enhanced WAF logs and analytics</li>
                <li>Compliance-heavy workloads (PCI, HIPAA)</li>
            </ul>
        </div>
    </div>

    <div class="concept-box">
        <h4>🔑 Migration Path</h4>
        <p>Microsoft provides a one-click migration from Classic to Standard/Premium in the Portal: Front Door Classic resource → <strong>Migration</strong> blade → choose Standard or Premium. The migration is non-disruptive and preserves your configuration. You cannot migrate back to Classic.</p>
    </div>
</div>

<div class="learn-section">
    <h2>Front Door Pricing Model</h2>
    <p>Front Door pricing has three components — understand these for cost planning:</p>
    
    <table class="content-table">
        <tr><th>Component</th><th>Standard</th><th>Premium</th></tr>
        <tr><td><strong>Base fee</strong> (per hour)</td><td>~$0.035/hr (~$25/mo)</td><td>~$0.165/hr (~$120/mo)</td></tr>
        <tr><td><strong>Requests</strong> (per 10K)</td><td>~$0.01</td><td>~$0.012</td></tr>
        <tr><td><strong>Data transfer</strong> (per GB out)</td><td>~$0.08 (varies by zone)</td><td>~$0.08 (varies by zone)</td></tr>
        <tr><td><strong>Private Link</strong></td><td>N/A</td><td>~$0.01 per GB</td></tr>
    </table>

    <div class="tip-box">
        <h4>💡 Cost Optimization</h4>
        <p>Enable caching aggressively for static content — cached responses don't generate origin traffic charges. Use compression (gzip/brotli) to reduce data transfer. Monitor your analytics to identify cacheable content.</p>
    </div>
</div>

<div class="learn-section">
    <h2>Core Concepts</h2>
    
    <h3>1. Endpoints</h3>
    <p>An endpoint is a Front Door URL that users connect to. Format: <span class="code-inline">contoso.azurefd.net</span>. You can map custom domains to endpoints.</p>

    <h3>2. Routes</h3>
    <p>Routes define how incoming requests are matched and forwarded. A route specifies:</p>
    <ul>
        <li><strong>Domains:</strong> Which domain(s) this route handles</li>
        <li><strong>Patterns to match:</strong> URL paths (e.g., /api/*, /images/*)</li>
        <li><strong>Origin group:</strong> Where to forward matching requests</li>
        <li><strong>Protocol:</strong> HTTP, HTTPS, or match incoming</li>
        <li><strong>Caching:</strong> Whether to cache responses at the edge</li>
    </ul>

    <h3>3. Origin Groups</h3>
    <p>An origin group is a set of equivalent origins (backends) that Front Door can route to. Each group has:</p>
    <ul>
        <li><strong>Origins:</strong> The actual backend endpoints</li>
        <li><strong>Health probes:</strong> How to check origin health</li>
        <li><strong>Load balancing settings:</strong> How to distribute traffic</li>
    </ul>

    <h3>4. Origins</h3>
    <p>An origin is a backend endpoint that Front Door forwards traffic to. Supported origin types:</p>
    <table class="content-table">
        <tr><th>Origin Type</th><th>Example</th></tr>
        <tr><td>App Service</td><td>myapp.azurewebsites.net</td></tr>
        <tr><td>Storage (static website)</td><td>mystorage.z13.web.core.windows.net</td></tr>
        <tr><td>VM / VMSS (with public IP)</td><td>20.x.x.x</td></tr>
        <tr><td>API Management</td><td>myapim.azure-api.net</td></tr>
        <tr><td>Any public endpoint</td><td>api.external-service.com</td></tr>
        <tr><td>Private Link (Premium)</td><td>Internal resources via Private Link</td></tr>
    </table>

    <h3>5. Routing Methods</h3>
    <table class="content-table">
        <tr><th>Method</th><th>How It Works</th><th>Use Case</th></tr>
        <tr><td><strong>Latency</strong></td><td>Routes to the origin with lowest latency</td><td>Default — best performance</td></tr>
        <tr><td><strong>Priority</strong></td><td>Routes to highest priority origin; fails over if unhealthy</td><td>Active-passive DR</td></tr>
        <tr><td><strong>Weighted</strong></td><td>Distributes traffic by percentage</td><td>Canary deployment, A/B testing</td></tr>
        <tr><td><strong>Session Affinity</strong></td><td>Sends same user to same origin</td><td>Stateful applications</td></tr>
    </table>
</div>

<div class="learn-section">
    <h2>Health Probes</h2>
    <p>Front Door sends periodic health probe requests to each origin. If an origin fails the health check, Front Door stops routing traffic to it.</p>
    
    <h3>Health Probe Settings</h3>
    <ul>
        <li><strong>Protocol:</strong> HTTP or HTTPS</li>
        <li><strong>Path:</strong> The URL path to probe (e.g., /health)</li>
        <li><strong>Interval:</strong> How often to probe (default: 30 seconds)</li>
        <li><strong>Method:</strong> GET or HEAD (HEAD is lighter — use it when possible)</li>
    </ul>

    <div class="tip-box">
        <h4>💡 Best Practice: Health Probe Endpoint</h4>
        <p>Create a dedicated health probe endpoint (e.g., /health) that checks the app's dependencies (database, cache, etc.). Return 200 only when the app is truly healthy. Don't probe the root (/) — it's often heavier than needed.</p>
    </div>

    <h3>Creating a Front Door — Azure CLI</h3>
    <div class="code-block"># Create a Front Door profile
az afd profile create \\
    --resource-group rg-frontdoor \\
    --profile-name fd-contoso \\
    --sku Standard_AzureFrontDoor

# Create an endpoint
az afd endpoint create \\
    --resource-group rg-frontdoor \\
    --profile-name fd-contoso \\
    --endpoint-name contoso-endpoint \\
    --enabled-state Enabled

# Create an origin group
az afd origin-group create \\
    --resource-group rg-frontdoor \\
    --profile-name fd-contoso \\
    --origin-group-name og-webapp \\
    --probe-request-type GET \\
    --probe-protocol Https \\
    --probe-path /health \\
    --probe-interval-in-seconds 30

# Add an origin
az afd origin create \\
    --resource-group rg-frontdoor \\
    --profile-name fd-contoso \\
    --origin-group-name og-webapp \\
    --origin-name origin-eastus \\
    --host-name myapp-eastus.azurewebsites.net \\
    --origin-host-header myapp-eastus.azurewebsites.net \\
    --http-port 80 \\
    --https-port 443 \\
    --priority 1 \\
    --weight 1000

# Create a route
az afd route create \\
    --resource-group rg-frontdoor \\
    --profile-name fd-contoso \\
    --endpoint-name contoso-endpoint \\
    --route-name default-route \\
    --origin-group og-webapp \\
    --supported-protocols Https \\
    --patterns-to-match "/*" \\
    --forwarding-protocol HttpsOnly</div>
</div>
`,
    diagrams: [
        {
            id: 'fd-routing-flow',
            type: 'frontdoor-routing',
            title: 'Azure Front Door — Global Request Routing',
            icon: '🚨',
            description: 'See how a user request flows through Front Door\'s global edge network to your backend origins. This is Front Door\'s core architecture.',
            steps: [
                'Users from around the world send HTTPS requests to your Front Door endpoint (contoso.azurefd.net).',
                'DNS resolves to the nearest Edge POP via Anycast — user connects to the closest Microsoft edge location.',
                'Front Door processes the request: WAF inspection, SSL termination, URL-based routing, and caching.',
                'Traffic is forwarded to the primary origin group (East US App Service) over Microsoft\'s backbone.',
                'If primary is unhealthy, Front Door automatically fails over to secondary origin (West Europe).',
                'Health probes continuously monitor origin health. Unhealthy origins are removed from rotation automatically.'
            ],
            legend: [
                { color: '#0078d4', label: 'User Traffic' },
                { color: '#00bcf2', label: 'Edge POPs' },
                { color: '#107c10', label: 'Primary Origin' },
                { color: '#ff8c00', label: 'Secondary Origin' }
            ]
        }
    ],
    quiz: [
        {
            question: 'Azure Front Door operates from which infrastructure?',
            options: ['A single Azure region you choose', 'Multiple Azure regions you deploy to', 'Microsoft\'s global edge network (100+ locations)', 'Your on-premises data center'],
            correct: 2,
            explanation: 'Front Door operates from Microsoft\'s global edge network with 100+ points of presence (PoPs) worldwide. You don\'t deploy to specific regions — it\'s automatically global.'
        },
        {
            question: 'What is the default routing method in Azure Front Door?',
            options: ['Priority', 'Weighted', 'Latency', 'Round-robin'],
            correct: 2,
            explanation: 'Latency-based routing is the default. Front Door measures latency from the edge location to each origin and routes traffic to the origin with the lowest latency.'
        },
        {
            question: 'Which Front Door SKU supports Private Link origins?',
            options: ['Standard only', 'Premium only', 'Both Standard and Premium', 'Neither — Private Link is separate'],
            correct: 1,
            explanation: 'Private Link origins are a Premium-only feature. They allow Front Door to connect to origins through Azure Private Link, keeping traffic entirely on the Microsoft backbone.'
        },
        {
            question: 'What is an Origin Group in Azure Front Door?',
            options: ['A set of Front Door edge locations', 'A set of equivalent backend endpoints that Front Door can route to', 'A group of DNS records', 'A WAF policy assignment'],
            correct: 1,
            explanation: 'An origin group is a collection of equivalent backends (origins). When Front Door receives a request, it routes to the best origin within the matched origin group based on health and routing method.'
        },
        {
            question: 'For health probes, what HTTP method is recommended when you don\'t need to check the response body?',
            options: ['GET', 'POST', 'HEAD', 'OPTIONS'],
            correct: 2,
            explanation: 'HEAD is lighter than GET — it returns only headers without the response body. Use HEAD for health probes when you only need the status code. This reduces load on your origins.'
        },
        {
            question: 'What is the endpoint URL format for Azure Front Door?',
            options: ['contoso.frontdoor.net', 'contoso.azurefd.net', 'contoso.afd.azure.com', 'fd-contoso.azure.com'],
            correct: 1,
            explanation: 'Front Door endpoints use the format: [name].azurefd.net. You can then map custom domains (like www.contoso.com) to this endpoint.'
        }
    ],
    interactive: [
        {
            type: 'drag-drop',
            id: 'fd-architecture',
            title: 'Front Door Request Flow',
            description: 'Place these steps in the correct order for how Front Door handles a request.',
            items: ['Origin processes request and responds', 'Front Door forwards to best origin', 'User connects to nearest edge location', 'Edge sends response to user (may cache)', 'Front Door matches route and applies rules', 'DNS resolves to Front Door edge'],
            targets: {
                'Step 1': ['DNS resolves to Front Door edge'],
                'Step 2': ['User connects to nearest edge location'],
                'Step 3': ['Front Door matches route and applies rules'],
                'Step 4': ['Front Door forwards to best origin'],
                'Step 5': ['Origin processes request and responds'],
                'Step 6': ['Edge sends response to user (may cache)']
            }
        },
        {
            type: 'flashcards',
            id: 'fd-flashcards',
            title: 'Front Door Core Concepts',
            cards: [
                { front: 'What is a Front Door Endpoint?', back: 'The entry point URL for your Front Door profile (e.g., contoso.azurefd.net). Routes are associated with endpoints. Custom domains can be mapped to an endpoint.' },
                { front: 'What is the Origin Host Header?', back: 'The Host header value Front Door sends to the origin. If your App Service expects traffic for "myapp.azurewebsites.net", set this as the origin host header. Without it, the origin may reject the request.' },
                { front: 'How fast does Front Door fail over?', back: 'Front Door can detect origin failure and reroute traffic in under 30 seconds. Health probe intervals (default 30s) and sample size affect detection speed.' },
                { front: 'Does Front Door support WebSockets?', back: 'Yes! Azure Front Door supports WebSocket connections natively. No special configuration needed beyond ensuring your origin supports WebSockets.' }
            ]
        }
    ],
    lab: {
        title: 'Hands-On: Create an Azure Front Door Profile',
        icon: '🚪',
        scenario: 'Create an Azure Front Door Standard profile with an endpoint, origin group, origin, and route. Then test it by accessing the Front Door URL and verifying traffic flows through the global edge network.',
        duration: '25-35 minutes',
        cost: '~$0.50/day (Standard tier — delete after lab to stop charges)',
        difficulty: 'Intermediate',
        prerequisites: ['Resource group rg-academy-lab'],
        cleanup: `# Delete the Front Door profile (this removes all endpoints, origins, and routes)
az afd profile delete \\
    --resource-group rg-academy-lab \\
    --profile-name fd-academy \\
    --yes`,
        steps: [
            {
                title: 'Create a Front Door Profile',
                subtitle: 'Your global entry point',
                type: 'confirm',
                explanation: 'A Front Door profile is the top-level resource that contains all your endpoints, origin groups, origins, and routes. Standard tier includes caching, custom rules WAF, and basic analytics. Premium adds managed WAF rules, bot protection, and Private Link origins.',
                portal: `<ol>
                    <li>Search for <strong>"Front Door and CDN profiles"</strong> in the portal</li>
                    <li>Click <strong>+ Create</strong></li>
                    <li>Select <strong>Azure Front Door</strong> → <strong>Custom create</strong></li>
                    <li>Configure Basics:
                        <ul>
                            <li>Resource group: <code>rg-academy-lab</code></li>
                            <li>Name: <code>fd-academy</code></li>
                            <li>Tier: <strong>Standard</strong></li>
                        </ul>
                    </li>
                    <li>Skip the Endpoint, Route, and other tabs for now — we'll add them step by step</li>
                    <li>Click <strong>Review + create</strong> → <strong>Create</strong></li>
                </ol>`,
                cli: `<div class="lab-code-block"># Create a Standard Front Door profile
az afd profile create \\
    --resource-group rg-academy-lab \\
    --profile-name fd-academy \\
    --sku Standard_AzureFrontDoor

# Verify
az afd profile show \\
    --resource-group rg-academy-lab \\
    --profile-name fd-academy \\
    --query "{Name:name, SKU:sku.name, State:provisioningState}" \\
    --output table</div>`,
                tip: 'Standard tier is sufficient for most workloads. Only upgrade to Premium if you need managed WAF rule sets (OWASP, bot protection) or Private Link origins.',
                verification: 'The Front Door profile should show provisioning state "Succeeded" in the portal.'
            },
            {
                title: 'Add an Endpoint',
                subtitle: 'The URL users connect to',
                type: 'confirm',
                explanation: 'An endpoint is the public-facing URL that users will access. Front Door auto-generates a hostname in the format [name].azurefd.net. This is where all user traffic enters the Front Door network.',
                portal: `<ol>
                    <li>Open <code>fd-academy</code> → <strong>Front Door manager</strong></li>
                    <li>Click <strong>+ Add an endpoint</strong></li>
                    <li>Name: <code>academy-endpoint</code></li>
                    <li>Status: <strong>Enabled</strong></li>
                    <li>Click <strong>Add</strong></li>
                    <li>Note the generated hostname: <code>academy-endpoint-XXXXXXXX.azurefd.net</code></li>
                </ol>`,
                cli: `<div class="lab-code-block"># Create an endpoint
az afd endpoint create \\
    --resource-group rg-academy-lab \\
    --profile-name fd-academy \\
    --endpoint-name academy-endpoint \\
    --enabled-state Enabled

# Get the endpoint hostname
az afd endpoint show \\
    --resource-group rg-academy-lab \\
    --profile-name fd-academy \\
    --endpoint-name academy-endpoint \\
    --query hostName \\
    --output tsv</div>`,
                tip: 'Save the .azurefd.net hostname — you\'ll need it to test later. In production, you\'d map a custom domain (www.contoso.com) to this endpoint via CNAME.',
                verification: 'The endpoint should show as enabled with an auto-generated .azurefd.net hostname.'
            },
            {
                title: 'Create an Origin Group',
                subtitle: 'Backend pool with health monitoring',
                type: 'confirm',
                explanation: 'An origin group is a set of equivalent backends that Front Door can route to. It includes health probe settings that determine how Front Door checks if origins are healthy. Think of it as a "backend pool with health monitoring."',
                portal: `<ol>
                    <li>In <strong>Front Door manager</strong>, click <strong>+ Add an origin group</strong></li>
                    <li>Configure:
                        <ul>
                            <li>Name: <code>og-webapp</code></li>
                            <li>Health probes:
                                <ul>
                                    <li>Protocol: <strong>HTTPS</strong></li>
                                    <li>Path: <code>/</code></li>
                                    <li>Interval: <code>30</code> seconds</li>
                                    <li>Probe method: <strong>HEAD</strong></li>
                                </ul>
                            </li>
                            <li>Load balancing:
                                <ul>
                                    <li>Sample size: <code>4</code></li>
                                    <li>Successful samples: <code>3</code></li>
                                </ul>
                            </li>
                        </ul>
                    </li>
                    <li>Don't click Add yet — we'll add an origin in the next step</li>
                </ol>`,
                cli: `<div class="lab-code-block"># Create an origin group with health probes
az afd origin-group create \\
    --resource-group rg-academy-lab \\
    --profile-name fd-academy \\
    --origin-group-name og-webapp \\
    --probe-request-type HEAD \\
    --probe-protocol Https \\
    --probe-path "/" \\
    --probe-interval-in-seconds 30 \\
    --sample-size 4 \\
    --successful-samples-required 3</div>`,
                tip: 'Use HEAD instead of GET for health probes — it\'s lighter because the server returns only headers, not the full response body. This reduces load on your origins.',
                verification: 'The origin group "og-webapp" should appear with HTTPS health probes configured.'
            },
            {
                title: 'Add an Origin',
                subtitle: 'Point to your backend',
                type: 'confirm',
                explanation: 'An origin is the actual backend that serves your content. We\'ll use httpbin.org as a public test origin — it echoes request details back, making it perfect for verifying Front Door is working. In production, you\'d use an App Service, VM, Storage account, etc.',
                portal: `<ol>
                    <li>In the origin group <code>og-webapp</code>, click <strong>+ Add an origin</strong></li>
                    <li>Configure:
                        <ul>
                            <li>Name: <code>origin-httpbin</code></li>
                            <li>Origin type: <strong>Custom</strong></li>
                            <li>Host name: <code>httpbin.org</code></li>
                            <li>Origin host header: <code>httpbin.org</code></li>
                            <li>HTTP port: <code>80</code></li>
                            <li>HTTPS port: <code>443</code></li>
                            <li>Priority: <code>1</code></li>
                            <li>Weight: <code>1000</code></li>
                        </ul>
                    </li>
                    <li>Click <strong>Add</strong></li>
                </ol>`,
                cli: `<div class="lab-code-block"># Add an origin (using httpbin.org as a test backend)
az afd origin create \\
    --resource-group rg-academy-lab \\
    --profile-name fd-academy \\
    --origin-group-name og-webapp \\
    --origin-name origin-httpbin \\
    --host-name httpbin.org \\
    --origin-host-header httpbin.org \\
    --http-port 80 \\
    --https-port 443 \\
    --priority 1 \\
    --weight 1000 \\
    --enabled-state Enabled</div>`,
                tip: 'The Origin Host Header is critical — it\'s the Host header sent to the backend. For App Services, set it to the App Service hostname (myapp.azurewebsites.net). If wrong, the backend may return 404 or redirect incorrectly.',
                verification: 'The origin should appear in the origin group with host httpbin.org, priority 1.'
            },
            {
                title: 'Create a Route',
                subtitle: 'Connect endpoint to origins',
                type: 'confirm',
                explanation: 'A route connects your endpoint to an origin group. It defines which URL patterns this route handles, what protocols to accept, and whether to cache responses. The pattern /* matches all paths.',
                portal: `<ol>
                    <li>In <strong>Front Door manager</strong>, next to your endpoint, click <strong>+ Add a route</strong></li>
                    <li>Configure:
                        <ul>
                            <li>Name: <code>default-route</code></li>
                            <li>Domains: select your <code>academy-endpoint</code></li>
                            <li>Patterns to match: <code>/*</code></li>
                            <li>Accepted protocols: <strong>HTTPS only</strong></li>
                            <li>Redirect: <strong>Enable HTTP to HTTPS redirect</strong></li>
                            <li>Origin group: <code>og-webapp</code></li>
                            <li>Forwarding protocol: <strong>HTTPS only</strong></li>
                            <li>Caching: <strong>Enable</strong></li>
                        </ul>
                    </li>
                    <li>Click <strong>Add</strong></li>
                </ol>`,
                cli: `<div class="lab-code-block"># Create a route
az afd route create \\
    --resource-group rg-academy-lab \\
    --profile-name fd-academy \\
    --endpoint-name academy-endpoint \\
    --route-name default-route \\
    --origin-group og-webapp \\
    --supported-protocols Https \\
    --patterns-to-match "/*" \\
    --forwarding-protocol HttpsOnly \\
    --https-redirect Enabled \\
    --enable-caching true</div>`,
                tip: 'HTTPS-only with HTTP→HTTPS redirect is a security best practice. Enabling caching dramatically improves performance for static content.',
                verification: 'The route should appear linking the endpoint to the og-webapp origin group for all paths (/*). '
            },
            {
                title: 'Test the Front Door',
                subtitle: 'Verify traffic flows through the edge',
                type: 'confirm',
                explanation: 'Now let\'s test! Access the Front Door endpoint URL and look for the x-azure-ref response header — this is proof that traffic went through Azure Front Door\'s global edge network. It may take 5-10 minutes for the endpoint to become active after creation.',
                portal: `<ol>
                    <li>Copy your endpoint hostname (e.g., <code>academy-endpoint-XXXXXXXX.azurefd.net</code>)</li>
                    <li>Open a browser and navigate to: <code>https://academy-endpoint-XXXXXXXX.azurefd.net/get</code></li>
                    <li>You should see a JSON response from httpbin.org showing your request details</li>
                    <li>Open browser DevTools (F12) → <strong>Network</strong> tab</li>
                    <li>Refresh the page and click on the request</li>
                    <li>In Response Headers, look for <strong>x-azure-ref</strong> — this confirms Front Door processed the request</li>
                </ol>`,
                cli: `<div class="lab-code-block"># Test with curl (replace with your actual endpoint hostname)
curl -I https://academy-endpoint-XXXXXXXX.azurefd.net/get

# Look for these headers in the response:
# x-azure-ref: unique tracking ID (proves Front Door handled it)
# x-cache: HIT or MISS (shows caching status)

# If the endpoint isn't ready yet, wait 5-10 minutes and retry
# You can check endpoint status:
az afd endpoint show \\
    --resource-group rg-academy-lab \\
    --profile-name fd-academy \\
    --endpoint-name academy-endpoint \\
    --query "{Hostname:hostName, State:enabledState, Provisioning:provisioningState}" \\
    --output table</div>`,
                tip: 'The x-azure-ref header is your proof that Front Door processed the request. It contains a unique tracking ID useful for support troubleshooting. If you don\'t see it, traffic may be going directly to the origin.',
                verification: 'You should receive a JSON response from httpbin.org, and the response headers should include x-azure-ref (proving traffic went through Front Door).'
            },
            {
                title: 'Review: Front Door Tracking Header',
                subtitle: 'Key takeaway',
                type: 'confirm',
                explanation: 'The x-azure-ref header is the definitive proof that traffic was routed through Azure Front Door. It is added to every response Front Door processes and contains a unique tracking ID useful for diagnostics and support cases. If you don\'t see this header, traffic may be bypassing Front Door entirely.',
                portal: '<ol><li><strong>Key fact:</strong> The answer is x-azure-ref</li><li>x-azure-ref is added by Front Door to every response it handles</li><li>It contains a unique tracking ID for support and diagnostics</li><li>x-forwarded-for shows client IP but is not Front Door-specific</li></ol>'
            }
        ]
    }
},

// ──────────────────────────────────────────────
// MODULE 9: VPN Gateway & Connectivity
// ──────────────────────────────────────────────
{
    id: 'vpn-connectivity',
    level: 200,
    title: 'VPN Gateway & ExpressRoute',
    subtitle: 'Site-to-Site, Point-to-Site, ExpressRoute fundamentals',
    icon: '🔐',
    estimatedTime: '45m',
    learn: `
<div class="learn-section">
    <h2>Connecting to Azure</h2>
    <p>There are three main ways to connect external networks (on-premises, remote users) to your Azure VNet:</p>
    
    <div class="comparison-grid">
        <div class="comparison-card">
            <h4>Site-to-Site VPN (S2S)</h4>
            <ul>
                <li>Connects on-premises network to Azure</li>
                <li>IPsec/IKE encrypted tunnel over internet</li>
                <li>Requires on-premises VPN device</li>
                <li>Up to 10 Gbps (VpnGw5)</li>
                <li>Cost: ~$140–$3,000/month (gateway)</li>
            </ul>
        </div>
        <div class="comparison-card">
            <h4>Point-to-Site VPN (P2S)</h4>
            <ul>
                <li>Individual devices connect to Azure</li>
                <li>No VPN device needed</li>
                <li>Uses SSTP, OpenVPN, or IKEv2</li>
                <li>Good for remote workers</li>
                <li>Cost: Same gateway as S2S</li>
            </ul>
        </div>
        <div class="comparison-card">
            <h4>ExpressRoute</h4>
            <ul>
                <li>Private, dedicated connection</li>
                <li>Does NOT go over the internet</li>
                <li>Up to 100 Gbps</li>
                <li>Low latency, high reliability</li>
                <li>Cost: $55–$13,000/month + provider</li>
            </ul>
        </div>
    </div>

    <h3>VPN Gateway SKUs</h3>
    <table class="content-table">
        <tr><th>SKU</th><th>S2S Tunnels</th><th>Throughput</th><th>P2S Connections</th></tr>
        <tr><td>VpnGw1</td><td>30</td><td>650 Mbps</td><td>250</td></tr>
        <tr><td>VpnGw2</td><td>30</td><td>1 Gbps</td><td>500</td></tr>
        <tr><td>VpnGw3</td><td>30</td><td>1.25 Gbps</td><td>1,000</td></tr>
        <tr><td>VpnGw5</td><td>100</td><td>10 Gbps</td><td>10,000</td></tr>
    </table>

    <div class="concept-box">
        <h4>🔑 VPN Gateway Requirements</h4>
        <p>A VPN Gateway requires:<br>
        1. A <strong>GatewaySubnet</strong> in your VNet (/27 recommended)<br>
        2. A <strong>Public IP</strong> (Standard SKU for AZ support)<br>
        3. A <strong>Local Network Gateway</strong> resource (represents on-prem network)<br>
        4. A <strong>Connection</strong> resource (links VPN Gateway to Local Network Gateway)</p>
    </div>
</div>

<div class="learn-section">
    <h2>ExpressRoute</h2>
    <p>ExpressRoute creates a private connection between your datacenter and Azure through a connectivity provider (e.g., AT&T, Equinix, Megaport).</p>
    
    <h3>Key Differences from VPN</h3>
    <table class="content-table">
        <tr><th>Feature</th><th>VPN Gateway</th><th>ExpressRoute</th></tr>
        <tr><td>Traverses internet</td><td>Yes</td><td>No — private circuit</td></tr>
        <tr><td>Bandwidth</td><td>Up to 10 Gbps</td><td>Up to 100 Gbps</td></tr>
        <tr><td>Latency</td><td>Variable</td><td>Predictable, low</td></tr>
        <tr><td>Encryption</td><td>IPsec (built-in)</td><td>Not encrypted by default</td></tr>
        <tr><td>Setup time</td><td>Minutes</td><td>Days/weeks (provider provisioning)</td></tr>
        <tr><td>Redundancy</td><td>Active-active possible</td><td>Built-in dual circuits</td></tr>
    </table>

    <div class="warning-box">
        <h4>⚠️ AZ-104 Key Point</h4>
        <p>ExpressRoute does NOT encrypt traffic by default. If you need encryption, you must configure IPsec VPN over ExpressRoute (which adds complexity). For most compliance needs, the private nature of the circuit is sufficient.</p>
    </div>
</div>
`,
    diagrams: [
        {
            id: 'vpn-s2s',
            type: 'vpn-tunnel',
            title: 'Site-to-Site VPN Tunnel',
            icon: '🔒',
            description: 'Watch how a Site-to-Site VPN creates an encrypted tunnel between your on-premises network and Azure over the public internet.',
            steps: [
                'On-premises datacenter with servers and a VPN device (firewall/router) with a public IP.',
                'IPsec/IKE encrypted tunnel established over the public internet. All traffic is AES-256 encrypted.',
                'Azure VNet with a VPN Gateway in the GatewaySubnet receives the encrypted traffic.',
                'Result: On-premises servers (192.168.x.x) can communicate with Azure VMs (10.0.x.x) as if on the same network.'
            ]
        },
        {
            id: 'expressroute-arch',
            type: 'expressroute',
            title: 'ExpressRoute — Private Dedicated Connection',
            icon: '⚡',
            description: 'ExpressRoute provides a private, high-bandwidth connection to Azure that never touches the public internet.',
            steps: [
                'On-premises datacenter with enterprise apps and databases connects via its edge router.',
                'A connectivity provider (Equinix, AT&T, Megaport) establishes BGP peering at a meet-me location.',
                'Microsoft Edge Enterprise (MSEE) routers at the peering location — always a redundant pair for HA.',
                'From MSEE, traffic enters Azure\'s backbone — access VNets, Storage, SQL, and even M365.',
                'Key facts: 50 Mbps to 100 Gbps bandwidth, 99.95% SLA, does NOT encrypt by default.'
            ],
            legend: [
                { color: '#ff8c00', label: 'On-Premises' },
                { color: '#8e44ad', label: 'Connectivity Provider' },
                { color: '#0078d4', label: 'Microsoft Edge' }
            ]
        }
    ],
    quiz: [
        {
            question: 'Which VPN type enables individual remote workers to connect to Azure from their laptops?',
            options: ['Site-to-Site VPN', 'Point-to-Site VPN', 'ExpressRoute', 'Azure Bastion'],
            correct: 1,
            explanation: 'Point-to-Site (P2S) VPN lets individual devices connect to Azure without needing an on-premises VPN device. It\'s ideal for remote workers connecting from home or travel.'
        },
        {
            question: 'Does ExpressRoute traffic travel over the public internet?',
            options: ['Yes, with encryption', 'Yes, without encryption', 'No, it uses a private dedicated circuit', 'Only if no VPN gateway is configured'],
            correct: 2,
            explanation: 'ExpressRoute creates a private, dedicated connection through a connectivity provider. Traffic never traverses the public internet, which provides predictable latency and higher reliability.'
        },
        {
            question: 'What subnet must exist in your VNet before deploying a VPN Gateway?',
            options: ['AzureFirewallSubnet', 'AzureBastionSubnet', 'GatewaySubnet', 'VPNSubnet'],
            correct: 2,
            explanation: 'A VPN Gateway requires a subnet named exactly "GatewaySubnet". Microsoft recommends a /27 CIDR. The VPN Gateway instances are deployed into this subnet.'
        },
        {
            question: 'Is ExpressRoute traffic encrypted by default?',
            options: ['Yes, always encrypted', 'No, you must add IPsec VPN over ExpressRoute for encryption', 'Yes, with Azure-managed keys', 'Encryption is optional in the portal'],
            correct: 1,
            explanation: 'ExpressRoute does NOT encrypt traffic by default. The circuit is private, but not encrypted. For encryption, you can configure IPsec VPN tunnels over the ExpressRoute circuit.'
        }
    ],
    interactive: [
        {
            type: 'flashcards',
            id: 'vpn-flashcards',
            title: 'VPN & Connectivity Flashcards',
            cards: [
                { front: 'What is a Local Network Gateway?', back: 'An Azure resource representing your on-premises VPN device. You specify the public IP of the on-prem device and the address space of the on-prem network.' },
                { front: 'What protocols does P2S VPN support?', back: 'SSTP (Windows only), OpenVPN (cross-platform), IKEv2 (macOS/iOS). OpenVPN is recommended for cross-platform support.' },
                { front: 'What is ExpressRoute Global Reach?', back: 'Connects your on-premises sites through ExpressRoute circuits. Site A → ExpressRoute → Microsoft backbone → ExpressRoute → Site B. Your on-premises traffic flows through Microsoft\'s network, not the internet.' },
                { front: 'Can VPN Gateway and ExpressRoute coexist?', back: 'Yes! You can configure both on the same VNet for redundancy. ExpressRoute is the primary path; VPN is the backup. This requires a special "coexistence" configuration.' }
            ]
        }
    ],
    lab: {
        title: 'Hands-On: Create a VPN Gateway (S2S Simulation)',
        icon: '🔐',
        scenario: 'Set up the Azure-side components for a Site-to-Site VPN connection: create a GatewaySubnet, deploy a VPN Gateway, and configure a Local Network Gateway to simulate an on-premises connection.',
        duration: '35-45 minutes (gateway deployment takes 30-45 min)',
        cost: '~$0.04/hour (VpnGw1 — DELETE IMMEDIATELY after lab!)',
        difficulty: 'Intermediate-Advanced',
        prerequisites: ['Resource group rg-academy-lab', 'VNet vnet-academy (10.0.0.0/16)'],
        cleanup: `⚠️ DELETE IMMEDIATELY AFTER LAB — VPN Gateways cost ~$0.04/hour (~$27/month)!
# Delete in this order:
az network vpn-connection delete --name conn-onprem --resource-group rg-academy-lab --yes 2>/dev/null
az network vnet-gateway delete --name vpngw-academy --resource-group rg-academy-lab --yes
az network local-gateway delete --name lng-onprem --resource-group rg-academy-lab --yes
az network public-ip delete --name pip-vpngw --resource-group rg-academy-lab --yes
# Note: Gateway deletion also takes 15-20 minutes`,
        steps: [
            {
                title: 'Create the GatewaySubnet',
                subtitle: 'Required — must be named exactly "GatewaySubnet"',
                type: 'confirm',
                explanation: 'A VPN Gateway REQUIRES a subnet named exactly "GatewaySubnet" — no other name works. Azure deploys the gateway VM instances into this subnet. Microsoft recommends /27 for the GatewaySubnet to allow room for future configurations (like ExpressRoute coexistence).',
                portal: `<ol>
                    <li>Go to <code>vnet-academy</code> → <strong>Subnets</strong></li>
                    <li>Click <strong>+ Gateway subnet</strong> (note: this is a special button, not the regular "+ Subnet")</li>
                    <li>Configure:
                        <ul>
                            <li>Name: <strong>GatewaySubnet</strong> (auto-filled, cannot change)</li>
                            <li>Subnet address range: <code>10.0.255.0/27</code></li>
                        </ul>
                    </li>
                    <li>Click <strong>Save</strong></li>
                </ol>`,
                cli: `<div class="lab-code-block"># Create the GatewaySubnet (name MUST be "GatewaySubnet")
az network vnet subnet create \\
    --resource-group rg-academy-lab \\
    --vnet-name vnet-academy \\
    --name GatewaySubnet \\
    --address-prefixes 10.0.255.0/27

# Verify
az network vnet subnet show \\
    --resource-group rg-academy-lab \\
    --vnet-name vnet-academy \\
    --name GatewaySubnet \\
    --query "{Name:name, AddressPrefix:addressPrefix, Purpose:purpose}" \\
    --output table</div>`,
                tip: 'Never deploy other resources (VMs, app gateways) into the GatewaySubnet. It\'s exclusively for VPN/ExpressRoute gateway instances. Use /27 minimum — /28 works but limits future expansion.',
                verification: 'The GatewaySubnet should appear in the VNet\'s subnet list with address range 10.0.255.0/27.'
            },
            {
                title: 'Create a Public IP for the Gateway',
                subtitle: 'The VPN endpoint\'s public address',
                type: 'confirm',
                explanation: 'The VPN Gateway needs a public IP address so on-premises devices can establish the IPsec tunnel to it. Use Standard SKU with Static allocation for production workloads.',
                portal: `<ol>
                    <li>Search for <strong>"Public IP addresses"</strong></li>
                    <li>Click <strong>+ Create</strong></li>
                    <li>Configure:
                        <ul>
                            <li>Name: <code>pip-vpngw</code></li>
                            <li>SKU: <strong>Standard</strong></li>
                            <li>Assignment: <strong>Static</strong></li>
                            <li>Resource group: <code>rg-academy-lab</code></li>
                            <li>Region: <code>East US</code></li>
                        </ul>
                    </li>
                    <li>Click <strong>Review + create</strong> → <strong>Create</strong></li>
                </ol>`,
                cli: `<div class="lab-code-block"># Create a public IP for the VPN Gateway
az network public-ip create \\
    --resource-group rg-academy-lab \\
    --name pip-vpngw \\
    --sku Standard \\
    --allocation-method Static \\
    --location eastus

# Note the IP address (you'll need this for on-prem VPN device config)
az network public-ip show \\
    --resource-group rg-academy-lab \\
    --name pip-vpngw \\
    --query ipAddress \\
    --output tsv</div>`,
                tip: 'Standard SKU public IPs support availability zones. Basic SKU works but is being retired. Always use Standard in production.',
                verification: 'The public IP should show as allocated with a static IP address.'
            },
            {
                title: 'Create the VPN Gateway',
                subtitle: '⚠️ WARNING: Takes 30-45 minutes to deploy!',
                type: 'confirm',
                explanation: 'The VPN Gateway is a managed pair of VMs deployed in the GatewaySubnet. VpnGw1 supports up to 650 Mbps and 30 S2S tunnels. ⚠️ THIS TAKES 30-45 MINUTES TO DEPLOY — start it and move on to the Local Network Gateway step while it deploys.',
                portal: `<ol>
                    <li>Search for <strong>"Virtual network gateways"</strong></li>
                    <li>Click <strong>+ Create</strong></li>
                    <li>Configure:
                        <ul>
                            <li>Name: <code>vpngw-academy</code></li>
                            <li>Region: <code>East US</code></li>
                            <li>Gateway type: <strong>VPN</strong></li>
                            <li>SKU: <strong>VpnGw1</strong></li>
                            <li>Generation: <strong>Generation1</strong></li>
                            <li>Virtual network: <code>vnet-academy</code></li>
                            <li>Subnet: <strong>GatewaySubnet</strong> (auto-detected)</li>
                            <li>Public IP: <code>pip-vpngw</code></li>
                            <li>Enable active-active mode: <strong>Disabled</strong></li>
                        </ul>
                    </li>
                    <li>Click <strong>Review + create</strong> → <strong>Create</strong></li>
                    <li>⏱️ <strong>This will take 30-45 minutes — don't wait! Move to the next step.</strong></li>
                </ol>`,
                cli: `<div class="lab-code-block"># Create the VPN Gateway (takes 30-45 minutes!)
# Start this and move to the next step while it deploys
az network vnet-gateway create \\
    --resource-group rg-academy-lab \\
    --name vpngw-academy \\
    --vnet vnet-academy \\
    --gateway-type Vpn \\
    --vpn-type RouteBased \\
    --sku VpnGw1 \\
    --generation Generation1 \\
    --public-ip-addresses pip-vpngw \\
    --no-wait

# Check deployment status (run periodically)
az network vnet-gateway show \\
    --resource-group rg-academy-lab \\
    --name vpngw-academy \\
    --query provisioningState \\
    --output tsv</div>`,
                tip: '30-45 minute deployment is NORMAL — Azure is provisioning two VM instances in an active-standby configuration. Use --no-wait in CLI so you can continue working. Check back later with the status command.',
                verification: 'Check the deployment status. It will show "Updating" for 30-45 minutes, then "Succeeded" when complete.'
            },
            {
                title: 'Create a Local Network Gateway',
                subtitle: 'Simulate your on-premises network',
                type: 'confirm',
                explanation: 'A Local Network Gateway represents your on-premises VPN device in Azure. You specify the on-prem device\'s public IP and the address ranges of your on-premises network. We\'ll use 203.0.113.1 (a documentation-reserved IP) and 192.168.0.0/16 to simulate an on-prem network.',
                portal: `<ol>
                    <li>Search for <strong>"Local network gateways"</strong></li>
                    <li>Click <strong>+ Create</strong></li>
                    <li>Configure:
                        <ul>
                            <li>Name: <code>lng-onprem</code></li>
                            <li>Resource group: <code>rg-academy-lab</code></li>
                            <li>Region: <code>East US</code></li>
                            <li>IP address: <code>203.0.113.1</code> (simulated on-prem VPN device IP)</li>
                            <li>Address space: <code>192.168.0.0/16</code> (simulated on-prem network)</li>
                        </ul>
                    </li>
                    <li>Click <strong>Review + create</strong> → <strong>Create</strong></li>
                </ol>`,
                cli: `<div class="lab-code-block"># Create the Local Network Gateway (simulates on-prem)
az network local-gateway create \\
    --resource-group rg-academy-lab \\
    --name lng-onprem \\
    --gateway-ip-address 203.0.113.1 \\
    --local-address-prefixes 192.168.0.0/16 \\
    --location eastus

# Verify
az network local-gateway show \\
    --resource-group rg-academy-lab \\
    --name lng-onprem \\
    --query "{Name:name, GatewayIP:gatewayIpAddress, AddressSpace:localNetworkAddressSpace.addressPrefixes}" \\
    --output json</div>`,
                tip: 'In production, the gateway IP would be your on-premises firewall/router\'s public IP, and the address space would be your actual on-prem network ranges (e.g., 10.x.x.x corporate network).',
                verification: 'The Local Network Gateway should show gateway IP 203.0.113.1 and address prefix 192.168.0.0/16.'
            },
            {
                title: 'Examine Gateway Configuration',
                subtitle: 'Review what was deployed',
                type: 'confirm',
                explanation: 'Once the VPN Gateway is deployed (or while waiting), let\'s examine the configuration options. A complete S2S VPN requires: VPN Gateway + Local Network Gateway + Connection (which ties them together with a shared key). In this lab, we skip creating the Connection since we don\'t have a real on-prem device.',
                portal: `<ol>
                    <li>Go to <code>vpngw-academy</code> (if deployment is complete)</li>
                    <li>Review:
                        <ul>
                            <li><strong>Overview</strong>: Gateway type, SKU, public IP, provisioning state</li>
                            <li><strong>Connections</strong>: Where you'd add S2S, P2S, or VNet-to-VNet connections</li>
                            <li><strong>Point-to-site configuration</strong>: For remote user VPN access</li>
                            <li><strong>BGP settings</strong>: For dynamic routing with on-prem (ASN, peer IP)</li>
                        </ul>
                    </li>
                    <li>If still deploying, examine the Local Network Gateway instead — review its settings</li>
                </ol>`,
                cli: `<div class="lab-code-block"># View gateway details (once deployed)
az network vnet-gateway show \\
    --resource-group rg-academy-lab \\
    --name vpngw-academy \\
    --query "{Name:name, SKU:sku.name, GatewayType:gatewayType, VpnType:vpnType, ProvisioningState:provisioningState}" \\
    --output table

# View the BGP settings
az network vnet-gateway show \\
    --resource-group rg-academy-lab \\
    --name vpngw-academy \\
    --query bgpSettings \\
    --output json

# To create a connection (shown for reference, requires real on-prem device):
# az network vpn-connection create \\
#     --resource-group rg-academy-lab \\
#     --name conn-onprem \\
#     --vnet-gateway1 vpngw-academy \\
#     --local-gateway2 lng-onprem \\
#     --shared-key "YourSharedKey123!"</div>`,
                tip: 'A VPN connection requires a pre-shared key (PSK) that must match on both the Azure and on-prem sides. In production, use a strong, randomly generated key and store it in Key Vault.',
                verification: 'If the gateway is deployed, you should see SKU VpnGw1, gateway type VPN, and status Succeeded.'
            },
            {
                title: '⚠️ CLEAN UP — Delete the Gateway!',
                subtitle: 'CRITICAL: Avoid ongoing charges',
                type: 'confirm',
                explanation: '⚠️ VPN Gateways cost approximately $0.04/hour (~$27/month) even when idle! DELETE IT NOW unless you plan to use it for further labs. Gateway deletion also takes 15-20 minutes.',
                portal: `<ol>
                    <li><strong>FIRST:</strong> Delete any Connections (go to vpngw-academy → Connections → delete each)</li>
                    <li>Go to vpngw-academy → <strong>Delete</strong> → confirm</li>
                    <li>Go to lng-onprem → <strong>Delete</strong> → confirm</li>
                    <li>Go to pip-vpngw → <strong>Delete</strong> → confirm</li>
                    <li>⏱️ Gateway deletion takes 15-20 minutes</li>
                </ol>`,
                cli: `<div class="lab-code-block"># ⚠️ DELETE EVERYTHING TO STOP CHARGES!
# Delete any connections first
az network vpn-connection delete \\
    --name conn-onprem \\
    --resource-group rg-academy-lab \\
    --yes 2>/dev/null

# Delete the VPN Gateway (takes 15-20 min)
az network vnet-gateway delete \\
    --name vpngw-academy \\
    --resource-group rg-academy-lab \\
    --yes

# Delete the Local Network Gateway
az network local-gateway delete \\
    --name lng-onprem \\
    --resource-group rg-academy-lab \\
    --yes

# Delete the public IP
az network public-ip delete \\
    --name pip-vpngw \\
    --resource-group rg-academy-lab

echo "✅ Cleanup complete — no more VPN Gateway charges!"</div>`,
                tip: 'Set a calendar reminder to verify deletion completed! Check your resource group to confirm the gateway, local gateway, and public IP are all gone.',
                verification: 'Verify that vpngw-academy, lng-onprem, and pip-vpngw no longer appear in your resource group. It may take 15-20 minutes for full deletion.'
            }
        ]
    }
},

// ──────────────────────────────────────────────
// MODULE 10: VNet Peering & Service Endpoints
// ──────────────────────────────────────────────
{
    id: 'peering-endpoints',
    level: 200,
    title: 'VNet Peering & Service Endpoints',
    subtitle: 'Connecting VNets and securing Azure service access',
    icon: '🔀',
    estimatedTime: '35m',
    learn: `
<div class="learn-section">
    <h2>VNet Peering</h2>
    <p>VNet peering connects two VNets so resources in each VNet can communicate as if they're on the same network. Traffic stays on the Microsoft backbone — never crosses the public internet.</p>
    
    <h3>Types of Peering</h3>
    <table class="content-table">
        <tr><th>Type</th><th>Scope</th><th>Latency</th></tr>
        <tr><td><strong>Regional Peering</strong></td><td>Same region</td><td>Very low (sub-ms)</td></tr>
        <tr><td><strong>Global Peering</strong></td><td>Different regions</td><td>Low (region-to-region)</td></tr>
    </table>

    <h3>Key Properties</h3>
    <ul>
        <li><strong>Non-transitive:</strong> If VNet A peers with B, and B peers with C, A and C cannot communicate (unless you also peer A↔C)</li>
        <li><strong>No IP overlap:</strong> Peered VNets cannot have overlapping address spaces</li>
        <li><strong>Bidirectional setup:</strong> Both sides must configure peering</li>
        <li><strong>Gateway transit:</strong> Let one VNet's VPN Gateway be shared by peered VNets</li>
    </ul>

    <div class="warning-box">
        <h4>⚠️ Non-Transitive!</h4>
        <p>This is a very common AZ-104 exam question. VNet peering is NOT transitive. You need explicit peering between each pair of VNets that need to communicate, or use a hub VNet with gateway transit.</p>
    </div>
</div>

<div class="learn-section">
    <h2>Service Endpoints vs Private Endpoints</h2>
    
    <div class="comparison-grid">
        <div class="comparison-card">
            <h4>Service Endpoints</h4>
            <ul>
                <li>Extends VNet identity to Azure services</li>
                <li>Traffic stays on Azure backbone</li>
                <li>Service still has a public IP</li>
                <li>Configured per subnet</li>
                <li>Free</li>
                <li>Good for: restricting service access to your VNet</li>
            </ul>
        </div>
        <div class="comparison-card">
            <h4>Private Endpoints</h4>
            <ul>
                <li>Brings Azure service INTO your VNet</li>
                <li>Gets a private IP in your subnet</li>
                <li>Service accessed via private IP only</li>
                <li>Works with Private DNS zones</li>
                <li>Per-endpoint cost</li>
                <li>Good for: full private access to services</li>
            </ul>
        </div>
    </div>

    <div class="concept-box">
        <h4>🔑 Service Endpoint vs Private Endpoint</h4>
        <p><strong>Service Endpoint:</strong> "I'll keep my public IP, but only accept traffic from your VNet subnet."<br>
        <strong>Private Endpoint:</strong> "I'll move into your VNet and get a private IP. No more public endpoint."<br><br>
        Private Endpoints are more secure but cost more. Azure Front Door Premium can use Private Endpoints to connect to origins.</p>
    </div>
</div>
`,
    diagrams: [
        {
            id: 'vnet-peering-diagram',
            type: 'vnet-peering',
            title: 'VNet Peering — Cross-Region & Cross-Subscription',
            icon: '🔗',
            description: 'VNet Peering connects two VNets so resources can communicate using private IPs. Traffic stays on Microsoft\'s backbone.',
            steps: [
                'VNet A in East US with VMs on 10.0.x.x address space.',
                'VNet B in West Europe with VMs on 10.1.x.x address space (different subscription).',
                'Global VNet Peering established — traffic flows over Microsoft\'s backbone, never the public internet.',
                'Key properties: Non-transitive, no IP overlap allowed, each direction configured independently, gateway transit available.'
            ],
            legend: [
                { color: '#0078d4', label: 'VNet A (East US)' },
                { color: '#107c10', label: 'VNet B (West Europe)' }
            ]
        }
    ],
    quiz: [
        {
            question: 'VNet A is peered with VNet B. VNet B is peered with VNet C. Can VNet A communicate with VNet C?',
            options: ['Yes, peering is transitive', 'No, VNet peering is non-transitive', 'Yes, if gateway transit is enabled', 'Only if all three are in the same region'],
            correct: 1,
            explanation: 'VNet peering is non-transitive. VNet A can only communicate with VNet C if there is a direct peering between them (A↔C) or if you use a hub VNet with gateway transit or a Network Virtual Appliance.'
        },
        {
            question: 'Which provides a private IP address for an Azure service inside your VNet?',
            options: ['Service Endpoint', 'Private Endpoint', 'NAT Gateway', 'VNet Peering'],
            correct: 1,
            explanation: 'Private Endpoints bring Azure services into your VNet by assigning them a private IP address from your subnet. Service Endpoints keep the public IP but restrict access to your VNet.'
        },
        {
            question: 'Can you peer two VNets with overlapping address spaces?',
            options: ['Yes, Azure handles the routing', 'No, peered VNets cannot have overlapping CIDR blocks', 'Yes, but only with Global Peering', 'Yes, if you use UDRs (User Defined Routes)'],
            correct: 1,
            explanation: 'Peered VNets cannot have overlapping address spaces. Azure would not be able to determine which VNet to route to. This is why planning VNet address spaces is critical.'
        },
        {
            question: 'What is Gateway Transit in VNet peering?',
            options: ['A way to connect VNets across regions', 'Allows a peered VNet to use the other VNet\'s VPN Gateway', 'Encrypts traffic between peered VNets', 'Routes traffic through Azure Firewall'],
            correct: 1,
            explanation: 'Gateway Transit lets a peered VNet use the VPN/ExpressRoute gateway in the other VNet. Hub VNet has the gateway, spoke VNets access on-premises through the hub\'s gateway — classic hub-spoke pattern.'
        }
    ],
    interactive: [
        {
            type: 'flashcards',
            id: 'peering-flashcards',
            title: 'Peering & Endpoints Review',
            cards: [
                { front: 'What is Gateway Transit?', back: 'Allows a spoke VNet to use the hub VNet\'s VPN or ExpressRoute gateway. Enabled on the hub side ("Allow gateway transit") and spoke side ("Use remote gateways").' },
                { front: 'What happens to traffic with Service Endpoints?', back: 'Traffic from your subnet to the Azure service takes an optimal route over the Azure backbone. The service\'s public IP is preserved, but you can restrict access to only your VNet/subnet.' },
                { front: 'Can Private Endpoints work across regions?', back: 'Yes! You can create a Private Endpoint in any VNet, regardless of the Azure service\'s region. The private IP in your VNet connects to the service via the Microsoft backbone.' },
                { front: 'What is hub-spoke topology?', back: 'A central "hub" VNet with shared services (VPN Gateway, Firewall, etc.) connected to multiple "spoke" VNets via peering. Spokes communicate through the hub. Common enterprise pattern.' }
            ]
        }
    ],
    lab: {
        title: 'Hands-On: Set Up VNet Peering',
        icon: '🔀',
        scenario: 'Create a second VNet and configure bidirectional peering with your existing vnet-academy. Verify connectivity and understand why VNet peering is non-transitive.',
        duration: '20-25 minutes',
        cost: 'Free (VNet peering has no resource cost — only data transfer charges in production)',
        difficulty: 'Intermediate',
        prerequisites: ['Resource group rg-academy-lab', 'VNet vnet-academy (10.0.0.0/16)'],
        cleanup: `# Delete the second VNet (this also removes its peering connections)
az network vnet delete --name vnet-devtest --resource-group rg-academy-lab
# Remove the peering from the original VNet
az network vnet peering delete --name peer-academy-to-devtest --vnet-name vnet-academy --resource-group rg-academy-lab`,
        steps: [
            {
                title: 'Create a Second VNet',
                subtitle: 'A separate network to peer with',
                type: 'confirm',
                explanation: 'We need a second VNet to demonstrate peering. It MUST have a different address space (no overlap with vnet-academy\'s 10.0.0.0/16). We\'ll use 10.1.0.0/16 for the "development/test" VNet.',
                portal: `<ol>
                    <li>Search for <strong>"Virtual networks"</strong></li>
                    <li>Click <strong>+ Create</strong></li>
                    <li>Configure:
                        <ul>
                            <li>Resource group: <code>rg-academy-lab</code></li>
                            <li>Name: <code>vnet-devtest</code></li>
                            <li>Region: <code>East US</code> (same region for regional peering)</li>
                        </ul>
                    </li>
                    <li>IP Addresses tab:
                        <ul>
                            <li>Address space: <code>10.1.0.0/16</code></li>
                            <li>Add subnet: Name <code>snet-dev</code>, Range <code>10.1.1.0/24</code></li>
                        </ul>
                    </li>
                    <li>Click <strong>Review + create</strong> → <strong>Create</strong></li>
                </ol>`,
                cli: `<div class="lab-code-block"># Create the second VNet
az network vnet create \\
    --resource-group rg-academy-lab \\
    --name vnet-devtest \\
    --address-prefixes 10.1.0.0/16 \\
    --subnet-name snet-dev \\
    --subnet-prefixes 10.1.1.0/24 \\
    --location eastus

# Verify
az network vnet show \\
    --resource-group rg-academy-lab \\
    --name vnet-devtest \\
    --query "{Name:name, AddressSpace:addressSpace.addressPrefixes[0], Subnets:subnets[0].name}" \\
    --output table</div>`,
                tip: 'Always plan non-overlapping address spaces across all VNets you might peer in the future. A common pattern: 10.0.0.0/16 for prod, 10.1.0.0/16 for dev, 10.2.0.0/16 for staging, etc.',
                verification: 'The vnet-devtest VNet should appear with address space 10.1.0.0/16 and subnet snet-dev (10.1.1.0/24).'
            },
            {
                title: 'Create VNet Peering (Academy → DevTest)',
                subtitle: 'First direction of the peering link',
                type: 'confirm',
                explanation: 'Peering must be configured from BOTH sides. This step creates the peering from vnet-academy TO vnet-devtest. We\'ll enable traffic forwarding so that traffic from academy\'s VPN gateway (if any) can reach devtest.',
                portal: `<ol>
                    <li>Go to <code>vnet-academy</code> → <strong>Peerings</strong></li>
                    <li>Click <strong>+ Add</strong></li>
                    <li>Configure this VNet's peering link:
                        <ul>
                            <li>Peering link name: <code>peer-academy-to-devtest</code></li>
                            <li>Traffic to remote VNet: <strong>Allow</strong></li>
                            <li>Traffic forwarded from remote VNet: <strong>Allow</strong></li>
                            <li>Virtual network gateway: <strong>None</strong> (or "Use this VNet's gateway" if you have one)</li>
                        </ul>
                    </li>
                    <li>Configure the remote VNet's peering link:
                        <ul>
                            <li>Peering link name: <code>peer-devtest-to-academy</code></li>
                            <li>Virtual network: <code>vnet-devtest</code></li>
                            <li>Traffic to remote VNet: <strong>Allow</strong></li>
                            <li>Traffic forwarded from remote VNet: <strong>Allow</strong></li>
                        </ul>
                    </li>
                    <li>Click <strong>Add</strong> (the portal creates both directions at once!)</li>
                </ol>`,
                cli: `<div class="lab-code-block"># Create peering from academy → devtest
az network vnet peering create \\
    --resource-group rg-academy-lab \\
    --name peer-academy-to-devtest \\
    --vnet-name vnet-academy \\
    --remote-vnet vnet-devtest \\
    --allow-vnet-access \\
    --allow-forwarded-traffic

# Verify (will show "Initiated" until reverse peering is created)
az network vnet peering show \\
    --resource-group rg-academy-lab \\
    --name peer-academy-to-devtest \\
    --vnet-name vnet-academy \\
    --query "{Name:name, State:peeringState, AllowVNetAccess:allowVirtualNetworkAccess}" \\
    --output table</div>`,
                tip: 'The portal can create both peering directions at once. The CLI requires two separate commands. After creating only one direction, the peering state shows "Initiated" — it won\'t work until both sides are configured!',
                verification: 'The peering should appear with state "Initiated" (waiting for the reverse direction).'
            },
            {
                title: 'Create Reverse Peering (DevTest → Academy)',
                subtitle: 'Complete the bidirectional link',
                type: 'confirm',
                explanation: 'VNet peering is NOT automatically bidirectional. You MUST create the reverse peering from vnet-devtest back to vnet-academy. Without this, the peering status stays "Initiated" and traffic cannot flow. This is a very common mistake!',
                portal: `<ol>
                    <li>If you used the portal in step 2, both directions were created automatically — check vnet-devtest → Peerings to confirm</li>
                    <li>If using CLI, go to <code>vnet-devtest</code> → <strong>Peerings</strong></li>
                    <li>Click <strong>+ Add</strong> and configure the reverse direction:
                        <ul>
                            <li>Peering link name: <code>peer-devtest-to-academy</code></li>
                            <li>Remote VNet: <code>vnet-academy</code></li>
                            <li>Traffic settings: <strong>Allow</strong> for both</li>
                        </ul>
                    </li>
                    <li>Click <strong>Add</strong></li>
                </ol>`,
                cli: `<div class="lab-code-block"># Create the reverse peering (devtest → academy)
az network vnet peering create \\
    --resource-group rg-academy-lab \\
    --name peer-devtest-to-academy \\
    --vnet-name vnet-devtest \\
    --remote-vnet vnet-academy \\
    --allow-vnet-access \\
    --allow-forwarded-traffic

# Both sides should now show "Connected"
az network vnet peering show \\
    --resource-group rg-academy-lab \\
    --name peer-devtest-to-academy \\
    --vnet-name vnet-devtest \\
    --query peeringState \\
    --output tsv</div>`,
                tip: 'Common exam trap: If one side shows "Initiated" and the other doesn\'t exist, peering is NOT working. Both sides must show "Connected" for traffic to flow.',
                verification: 'Both peerings should now show status "Connected". Check both vnet-academy → Peerings and vnet-devtest → Peerings.'
            },
            {
                title: 'Verify Peering Status',
                subtitle: 'Confirm both directions are "Connected"',
                type: 'confirm',
                explanation: 'Let\'s verify that both peering links show "Connected" status. If either shows "Initiated", the reverse peering is missing. If either shows "Disconnected", one side was deleted.',
                portal: `<ol>
                    <li>Go to <code>vnet-academy</code> → <strong>Peerings</strong>
                        <ul><li>peer-academy-to-devtest should show <strong>Connected</strong> ✅</li></ul>
                    </li>
                    <li>Go to <code>vnet-devtest</code> → <strong>Peerings</strong>
                        <ul><li>peer-devtest-to-academy should show <strong>Connected</strong> ✅</li></ul>
                    </li>
                    <li>If any shows "Initiated" — create the missing reverse peering</li>
                    <li>If any shows "Disconnected" — delete both peerings and recreate them</li>
                </ol>`,
                cli: `<div class="lab-code-block"># Check peering status from both VNets
echo "=== Academy peerings ==="
az network vnet peering list \\
    --resource-group rg-academy-lab \\
    --vnet-name vnet-academy \\
    --query "[].{Name:name, State:peeringState, RemoteVNet:remoteVirtualNetwork.id}" \\
    --output table

echo "=== DevTest peerings ==="
az network vnet peering list \\
    --resource-group rg-academy-lab \\
    --vnet-name vnet-devtest \\
    --query "[].{Name:name, State:peeringState, RemoteVNet:remoteVirtualNetwork.id}" \\
    --output table</div>`,
                tip: 'Peering status meanings: "Connected" = working. "Initiated" = reverse peering missing. "Disconnected" = one side was deleted. VMs in peered VNets can now communicate using private IPs (10.0.x.x ↔ 10.1.x.x).',
                verification: 'Both peering connections should show "Connected" status. VMs in either VNet can now reach VMs in the other VNet using private IP addresses.'
            },
            {
                title: 'Understand Non-Transitivity',
                subtitle: 'The most common peering misconception',
                type: 'confirm',
                explanation: 'VNet peering is NOT transitive. If you add a third VNet (vnet-staging, 10.2.0.0/16) and peer it ONLY with vnet-devtest, resources in vnet-staging CANNOT reach vnet-academy — even though devtest is peered with both. Each VNet pair needs direct peering.',
                portal: `<ol>
                    <li>Consider this topology:
                        <pre>
    vnet-academy ←→ vnet-devtest ←→ vnet-staging
    (10.0.0.0/16)   (10.1.0.0/16)   (10.2.0.0/16)
                        </pre>
                    </li>
                    <li>academy can reach devtest ✅</li>
                    <li>devtest can reach staging ✅</li>
                    <li>academy can reach staging? ❌ <strong>NO!</strong> Peering is NOT transitive</li>
                    <li>To fix: Create direct peering academy ↔ staging, OR use a hub VNet with Azure Firewall/NVA for routing</li>
                </ol>`,
                cli: `<div class="lab-code-block"># This is a conceptual step — no CLI commands needed.
# 
# The hub-spoke pattern solves non-transitivity:
#
#            ┌── vnet-spoke1
# vnet-hub ──┤── vnet-spoke2  
#            └── vnet-spoke3
#
# The hub runs Azure Firewall or an NVA that routes
# traffic between spokes. Spokes peer with hub only.
# This is the recommended enterprise pattern.</div>`,
                tip: 'For large environments with many VNets, use the hub-spoke topology. The hub VNet contains shared services (Firewall, VPN Gateway) and all spoke VNets peer with the hub. Azure Firewall or a Network Virtual Appliance (NVA) in the hub routes traffic between spokes.',
                verification: 'This is a conceptual step. Ensure you understand: A↔B and B↔C does NOT mean A↔C. Each pair needs explicit peering.'
            },
            {
                title: 'Review: VNet Peering Transitivity',
                subtitle: 'Key takeaway',
                type: 'confirm',
                explanation: 'VNet peering is NOT transitive. If A peers with B and B peers with C, A cannot reach C — each pair requires direct peering. To solve this in large environments, use a hub-spoke topology where a hub VNet with Azure Firewall or an NVA routes traffic between spokes. This is one of the most commonly tested concepts on AZ-104.',
                portal: '<ol><li><strong>Key fact:</strong> The answer is "No — each VNet pair requires direct peering"</li><li>A↔B and B↔C does NOT mean A↔C</li><li>Use hub-spoke topology with Azure Firewall/NVA for spoke-to-spoke routing</li><li>This is a top AZ-104 exam topic — peering is always non-transitive</li></ol>'
            }
        ]
    }
}

];
