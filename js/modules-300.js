/* ============================================
   LEVEL 300 MODULES — Advanced
   ============================================ */

const MODULES_300 = [

// ──────────────────────────────────────────────
// MODULE 11: Front Door Standard/Premium Deep Dive
// ──────────────────────────────────────────────
{
    id: 'frontdoor-advanced',
    level: 300,
    title: 'Azure Front Door — Advanced Configuration',
    subtitle: 'Rules Engine, custom domains, TLS, Private Link',
    icon: '⚙️',
    estimatedTime: '50m',
    learn: `
<div class="learn-section">
    <h2>Rules Engine</h2>
    <p>Front Door's Rules Engine lets you customize how HTTP requests and responses are handled at the edge. You can modify headers, perform URL redirects/rewrites, and override routing behavior — all without changing your application.</p>
    
    <h3>Rule Set Components</h3>
    <ul>
        <li><strong>Rule Set:</strong> A named collection of rules, applied to a route</li>
        <li><strong>Rule:</strong> A condition + action pair</li>
        <li><strong>Conditions (Match):</strong> When to trigger the rule (request path, headers, query string, etc.)</li>
        <li><strong>Actions:</strong> What to do (redirect, rewrite, modify headers, etc.)</li>
    </ul>

    <h3>Available Conditions</h3>
    <table class="content-table">
        <tr><th>Condition</th><th>Description</th><th>Example</th></tr>
        <tr><td>Request Path</td><td>Match URL path</td><td>/old-page matches a specific path</td></tr>
        <tr><td>Request Header</td><td>Match HTTP header values</td><td>X-Forwarded-Proto equals HTTP</td></tr>
        <tr><td>Query String</td><td>Match query parameters</td><td>?version=v2</td></tr>
        <tr><td>Request Method</td><td>GET, POST, etc.</td><td>Only apply to POST requests</td></tr>
        <tr><td>URL File Extension</td><td>Match file type</td><td>.jpg, .css, .js</td></tr>
        <tr><td>Remote Address</td><td>Client IP</td><td>Geo-restrict by IP</td></tr>
        <tr><td>Client Port</td><td>Source port</td><td>Rarely used</td></tr>
        <tr><td>Server Port</td><td>443 or 80</td><td>Match HTTPS vs HTTP</td></tr>
        <tr><td>SSL Protocol</td><td>TLS version</td><td>Block TLS 1.0</td></tr>
        <tr><td>Hostname</td><td>Request hostname</td><td>Route by custom domain</td></tr>
    </table>

    <h3>Available Actions</h3>
    <table class="content-table">
        <tr><th>Action</th><th>What It Does</th><th>Common Use</th></tr>
        <tr><td><strong>URL Redirect</strong></td><td>Send 301/302 to a new URL</td><td>HTTP→HTTPS, www→naked, old→new paths</td></tr>
        <tr><td><strong>URL Rewrite</strong></td><td>Change URL path sent to origin (transparent to client)</td><td>/api/v2/* → /v2/* at backend</td></tr>
        <tr><td><strong>Modify Request Header</strong></td><td>Add/overwrite/delete request headers</td><td>Add X-Custom-Header for backend logic</td></tr>
        <tr><td><strong>Modify Response Header</strong></td><td>Add/overwrite/delete response headers</td><td>Add security headers (HSTS, CSP)</td></tr>
        <tr><td><strong>Route Configuration Override</strong></td><td>Change origin group, protocol, caching</td><td>Send specific paths to different backends</td></tr>
    </table>

    <h3>Example: Force HTTPS Redirect</h3>
    <div class="code-block"># Create a Rule Set
az afd rule-set create \\
    --resource-group rg-fd \\
    --profile-name fd-contoso \\
    --rule-set-name SecurityRules

# Add HTTPS redirect rule
az afd rule create \\
    --resource-group rg-fd \\
    --profile-name fd-contoso \\
    --rule-set-name SecurityRules \\
    --rule-name ForceHttps \\
    --order 1 \\
    --match-variable RequestScheme \\
    --operator Equal \\
    --match-values HTTP \\
    --action-name UrlRedirect \\
    --redirect-protocol Https \\
    --redirect-type Moved</div>

    <h3>Example: Add Security Headers</h3>
    <div class="code-block"># Add HSTS header to all responses
az afd rule create \\
    --resource-group rg-fd \\
    --profile-name fd-contoso \\
    --rule-set-name SecurityRules \\
    --rule-name AddHsts \\
    --order 2 \\
    --action-name ModifyResponseHeader \\
    --header-action Overwrite \\
    --header-name Strict-Transport-Security \\
    --header-value "max-age=31536000; includeSubDomains"</div>
</div>

<div class="learn-section">
    <h2>Rules Engine — Advanced Patterns</h2>
    <p>The Rules Engine is what makes Front Door more than just a load balancer. Here are production-grade patterns you should know:</p>

    <h3>Pattern 1: A/B Testing (Canary Deployment)</h3>
    <div class="code-block"># Route 10% of traffic to the canary origin group
az afd rule create \\
    --profile-name fd-contoso \\
    --rule-set-name ABTest \\
    --rule-name CanaryRoute \\
    --order 1 \\
    --match-variable RequestHeader \\
    --selector Cookie \\
    --operator Contains \\
    --match-values "canary=true" \\
    --action-name RouteConfigurationOverride \\
    --origin-group canary-pool</div>

    <h3>Pattern 2: API Versioning via URL Rewrite</h3>
    <div class="code-block"># Clients request /api/v2/users
# Origin expects /v2/users (strip /api prefix)
Condition: Request Path starts with /api/
Action: URL Rewrite → destination /  
# /api/v2/users → /v2/users at origin</div>

    <h3>Pattern 3: Geo-Based Routing</h3>
    <div class="code-block"># Block traffic from specific countries
Condition: Remote Address → Geo Match → [CN, RU]
Action: Route Configuration Override → return 403

# Redirect EU users to EU origin
Condition: Remote Address → Geo Match → [DE, FR, NL, GB]
Action: Route Configuration Override → origin-group: eu-origins</div>

    <h3>Pattern 4: Security Headers Bundle</h3>
    <p>Add all recommended security headers in one rule set:</p>
    <div class="code-block"># Rule 1: HSTS (force HTTPS for 1 year)
Action: Modify Response Header → Overwrite
  Strict-Transport-Security: max-age=31536000; includeSubDomains

# Rule 2: Prevent clickjacking
Action: Modify Response Header → Overwrite
  X-Frame-Options: DENY

# Rule 3: Prevent MIME sniffing
Action: Modify Response Header → Overwrite
  X-Content-Type-Options: nosniff

# Rule 4: XSS Protection
Action: Modify Response Header → Overwrite
  X-XSS-Protection: 1; mode=block

# Rule 5: Content Security Policy
Action: Modify Response Header → Overwrite
  Content-Security-Policy: default-src 'self'</div>

    <h3>Rule Evaluation Order</h3>
    <div class="concept-box">
        <h4>🔑 How Rules Are Processed</h4>
        <p>1. WAF rules execute first (before Rules Engine)<br>
        2. Rule Sets are evaluated in the order they're attached to the route<br>
        3. Within a Rule Set, rules are evaluated by their <strong>order</strong> number (lowest first)<br>
        4. If a rule action is "Route Override", it terminates further rule evaluation<br>
        5. URL Redirect also terminates — the redirect is sent immediately<br>
        6. Header modifications and URL Rewrites do NOT terminate — subsequent rules still execute</p>
    </div>

    <h3>Rules Engine Limits</h3>
    <table class="content-table">
        <tr><th>Resource</th><th>Standard</th><th>Premium</th></tr>
        <tr><td>Rule Sets per profile</td><td>100</td><td>100</td></tr>
        <tr><td>Rules per Rule Set</td><td>100</td><td>100</td></tr>
        <tr><td>Conditions per rule</td><td>10</td><td>10</td></tr>
        <tr><td>Actions per rule</td><td>5</td><td>5</td></tr>
        <tr><td>Rule Sets per route</td><td>Multiple (ordered)</td><td>Multiple (ordered)</td></tr>
    </table>
</div>

<div class="learn-section">
    <h2>Custom Domains & TLS Certificates</h2>
    
    <h3>Adding a Custom Domain</h3>
    <ol>
        <li><strong>Create CNAME</strong> in DNS: <span class="code-inline">www.contoso.com → contoso.azurefd.net</span></li>
        <li><strong>Add domain</strong> to Front Door profile</li>
        <li><strong>Validate ownership</strong> via DNS TXT record (_dnsauth.www.contoso.com)</li>
        <li><strong>Associate domain</strong> with an endpoint and route</li>
        <li><strong>Configure TLS</strong> certificate</li>
    </ol>

    <h3>TLS Certificate Options</h3>
    <table class="content-table">
        <tr><th>Option</th><th>Description</th><th>Best For</th></tr>
        <tr><td><strong>AFD Managed</strong></td><td>Front Door provisions and auto-renews certs from DigiCert</td><td>Simplest option — recommended</td></tr>
        <tr><td><strong>Bring Your Own (BYOC)</strong></td><td>Upload your cert to Key Vault, Front Door pulls it</td><td>Custom/EV certs, compliance requirements</td></tr>
    </table>

    <div class="concept-box">
        <h4>🔑 Zone Apex (Naked Domain) with Front Door</h4>
        <p>To use contoso.com (no www), you need an <strong>Alias record</strong> in Azure DNS pointing to the Front Door endpoint. Standard CNAME cannot be used at zone apex. TLS validation at zone apex uses a TXT record at <span class="code-inline">_dnsauth.contoso.com</span>.</p>
    </div>
</div>

<div class="learn-section">
    <h2>Private Link Origins (Premium)</h2>
    <p>Front Door Premium can connect to origins via Azure Private Link. This means your origin doesn't need a public IP — Front Door reaches it through the Microsoft backbone privately.</p>
    
    <h3>Supported Private Link Origins</h3>
    <ul>
        <li>Azure App Service / Web Apps</li>
        <li>Azure Storage (Blob)</li>
        <li>Azure Application Gateway (Internal LB)</li>
        <li>Internal Load Balancer</li>
        <li>Any Private Link-enabled service</li>
    </ul>

    <div class="diagram-container">
        <svg viewBox="0 0 650 220" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:650px;font-family:'Segoe UI',sans-serif">
          <defs>
            <marker id="pl-arrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6" fill="#0078D4"/></marker>
            <marker id="pl-arrow-g" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6" fill="#107C10"/></marker>
          </defs>
          <!-- User -->
          <rect x="10" y="50" width="90" height="50" rx="10" fill="#0078D4"/>
          <text x="55" y="72" text-anchor="middle" fill="#fff" font-size="12" font-weight="600">👤 Users</text>
          <text x="55" y="88" text-anchor="middle" fill="#d0e8ff" font-size="9">Internet</text>
          <!-- Arrow 1 -->
          <line x1="100" y1="75" x2="160" y2="75" stroke="#0078D4" stroke-width="2" marker-end="url(#pl-arrow)"/>
          <!-- Front Door -->
          <rect x="168" y="42" width="130" height="66" rx="10" fill="#0078D4"/>
          <text x="233" y="66" text-anchor="middle" fill="#fff" font-size="12" font-weight="700">Azure Front Door</text>
          <text x="233" y="82" text-anchor="middle" fill="#d0e8ff" font-size="9">Edge POP</text>
          <text x="233" y="96" text-anchor="middle" fill="#d0e8ff" font-size="9">WAF + TLS</text>
          <!-- Private Link tunnel -->
          <line x1="298" y1="75" x2="420" y2="75" stroke="#107C10" stroke-width="2" stroke-dasharray="6,3" marker-end="url(#pl-arrow-g)"/>
          <rect x="318" y="54" width="82" height="18" rx="4" fill="#e6f4ea"/>
          <text x="359" y="66" text-anchor="middle" fill="#107C10" font-size="8" font-weight="600">Private Link</text>
          <text x="359" y="92" text-anchor="middle" fill="#555" font-size="7">Microsoft Backbone</text>
          <!-- Origin -->
          <rect x="428" y="35" width="200" height="80" rx="10" fill="#107C10"/>
          <text x="528" y="60" text-anchor="middle" fill="#fff" font-size="12" font-weight="700">App Service</text>
          <text x="528" y="78" text-anchor="middle" fill="#d0f0d0" font-size="10">No public endpoint</text>
          <text x="528" y="94" text-anchor="middle" fill="#d0f0d0" font-size="10">10.0.1.4</text>
          <!-- Key points -->
          <text x="60" y="150" fill="#107C10" font-size="11" font-weight="600">✓ No public endpoint</text>
          <text x="250" y="150" fill="#107C10" font-size="11" font-weight="600">✓ Traffic stays on backbone</text>
          <text x="475" y="150" fill="#107C10" font-size="11" font-weight="600">✓ Maximum security</text>
          <!-- Subtle border -->
          <rect x="2" y="2" width="646" height="216" rx="12" fill="none" stroke="#e0e0e0" stroke-width="1"/>
        </svg>
    </div>

    <div class="tip-box">
        <h4>💡 Why Private Link Origins Matter</h4>
        <p>Without Private Link, your origin needs a public endpoint (even if restricted by NSG/service tag). With Private Link, the origin has zero public exposure. This is the most secure pattern: Front Door (edge security) + Private Link (private connectivity) + WAF (application security).</p>
    </div>
</div>
`,
    diagrams: [
        {
            id: 'fd-rules-engine',
            type: 'frontdoor-rules-engine',
            title: 'Front Door Rules Engine Pipeline',
            icon: '🔧',
            description: 'See how Front Door\'s Rules Engine processes requests through multiple rule sets — modifying headers, enforcing security, rewriting URLs, and controlling caching.',
            steps: [
                'An incoming HTTP request arrives at Front Door: GET /api/v2/users.',
                'Request enters the Rules Engine pipeline — rule sets are evaluated in order.',
                'Rule Set 1: Request Modifications — add custom headers, route mobile users to different pools.',
                'Rule Set 2: Security Rules — geo-block restricted countries, enforce rate limits.',
                'Rule Set 3: URL Rewrites — redirect old API paths to new versioned endpoints.',
                'Rule Set 4: Cache Overrides — set custom TTLs for static assets like .js and .css.',
                'Modified request forwarded to the origin. All rule transformations applied.'
            ],
            legend: [
                { color: '#0078d4', label: 'Request Modifications' },
                { color: '#d13438', label: 'Security Rules' },
                { color: '#ff8c00', label: 'URL Rewrites' },
                { color: '#107c10', label: 'Cache Overrides' }
            ]
        }
    ],
    quiz: [
        {
            question: 'A Rules Engine rule has a condition "Request Scheme = HTTP" and action "URL Redirect to HTTPS". What type of redirect should you use for permanent HTTPS enforcement?',
            options: ['302 Found (temporary)', '301 Moved Permanently', '307 Temporary Redirect', '200 OK'],
            correct: 1,
            explanation: '301 Moved Permanently tells browsers and search engines that the redirect is permanent. They will remember and go directly to HTTPS next time. 302 is temporary — browsers will check the redirect each time.'
        },
        {
            question: 'What is the URL Rewrite action in Rules Engine?',
            options: ['Sends a redirect response to the client', 'Changes the URL transparently before forwarding to the origin', 'Modifies the response URL', 'Creates a new DNS record'],
            correct: 1,
            explanation: 'URL Rewrite changes the URL path that Front Door sends to the origin without the client knowing. The client sees the original URL, but the origin receives a different path. This is transparent to the end user.'
        },
        {
            question: 'Which Front Door SKU is required for Private Link origins?',
            options: ['Standard only', 'Premium only', 'Both Standard and Premium', 'External add-on'],
            correct: 1,
            explanation: 'Private Link origins are exclusive to the Premium SKU. Standard SKU requires origins to have public endpoints.'
        },
        {
            question: 'How do you validate custom domain ownership in Azure Front Door?',
            options: ['Upload a file to your web server', 'Create a TXT DNS record with a validation token', 'Send an email to domain admin', 'Configure an MX record'],
            correct: 1,
            explanation: 'Front Door validates domain ownership using a DNS TXT record. You add a TXT record at _dnsauth.[yourdomain] with a validation token provided by Azure.'
        },
        {
            question: 'What is the easiest way to handle TLS certificates with Azure Front Door?',
            options: ['Buy from a third-party CA and upload to Key Vault', 'Use Front Door Managed certificates (auto-provisioned and renewed)', 'Generate self-signed certificates', 'Use Let\'s Encrypt manually'],
            correct: 1,
            explanation: 'Azure Front Door Managed certificates are the simplest option. Front Door automatically provisions certificates from DigiCert and handles renewal — no manual management needed.'
        }
    ],
    interactive: [
        {
            type: 'drag-drop',
            id: 'rules-engine-builder',
            title: 'Build a Rules Engine Configuration',
            description: 'Match each scenario to the correct Rules Engine action.',
            items: ['HTTP to HTTPS redirect', 'Add HSTS header to responses', 'Rewrite /blog/* to /wordpress/*', 'Send /api/* to API origin group', 'Remove Server header from responses', 'Redirect old domain to new domain'],
            targets: {
                'URL Redirect': ['HTTP to HTTPS redirect', 'Redirect old domain to new domain'],
                'URL Rewrite': ['Rewrite /blog/* to /wordpress/*'],
                'Modify Response Header': ['Add HSTS header to responses', 'Remove Server header from responses'],
                'Route Configuration Override': ['Send /api/* to API origin group']
            }
        },
        {
            type: 'flashcards',
            id: 'fd-advanced-flashcards',
            title: 'Advanced Front Door Concepts',
            cards: [
                { front: 'What is the difference between URL Redirect and URL Rewrite?', back: 'Redirect: Client sees the new URL (browser URL bar changes). Returns 301/302 to client.\nRewrite: Client never sees the change (transparent). Front Door modifies the URL before forwarding to origin.' },
                { front: 'Can Front Door Managed certs cover zone apex domains?', back: 'Yes, but the domain must use Azure DNS with an Alias record. Managed certs from DigiCert cover both www and naked domains.' },
                { front: 'What is the _dnsauth TXT record?', back: 'A DNS TXT record Front Door uses to validate domain ownership. Create it at _dnsauth.[yourdomain] with the value provided by Azure. This proves you control the domain.' },
                { front: 'How does Private Link origin approval work?', back: 'When you configure a Private Link origin, the origin resource shows a pending Private Endpoint connection. You must approve this connection on the origin resource side before traffic flows.' }
            ]
        }
    ],
    lab: {
        title: 'Hands-On: Configure Front Door Rules Engine',
        icon: '⚙️',
        scenario: 'You will create a Rules Engine rule set on Azure Front Door to enforce HTTPS redirects and inject security headers — the two most common rules every production Front Door should have.',
        duration: '25-35 min',
        cost: '~$0.50/day (Front Door Standard)',
        difficulty: 'Advanced',
        prerequisites: ['Azure subscription', 'Front Door Standard/Premium profile (from L200 lab or create a new one)', 'A working route with at least one origin'],
        cleanup: `Delete the rule set if desired (Front Door → Rule sets → Delete). The Front Door profile itself can stay for future labs.`,
        steps: [
            {
                title: 'Navigate to Your Front Door Profile',
                subtitle: 'Open or create your Front Door',
                type: 'confirm',
                explanation: 'Open the Front Door profile you created in the L200 lab. If you don\'t have one, create a new Front Door Standard profile via Quick Create with an App Service or Storage origin.',
                portal: `<ol><li>Go to the Azure Portal → search <strong>"Front Door and CDN profiles"</strong></li><li>Click your existing profile (or click <strong>+ Create</strong> → Quick Create to make a new one)</li><li>Verify you have at least one <strong>Endpoint</strong> with a working <strong>Route</strong></li><li>Test: open <code>https://your-endpoint.azurefd.net</code> in a browser — you should see your origin content</li></ol>`,
                cli: `<div class="lab-code-block"># List existing Front Door profiles\naz afd profile list --output table\n\n# If you need to create one:\naz afd profile create \\\n    --resource-group rg-academy \\\n    --profile-name fd-rules-lab \\\n    --sku Standard_AzureFrontDoor</div>`,
                tip: 'If creating a new profile, the Quick Create wizard in the portal sets up endpoint + route + origin in one step.',
                verification: 'You can access your Front Door endpoint URL and see content from your origin.'
            },
            {
                title: 'Create a Rule Set',
                subtitle: 'Add a named rule set container',
                type: 'confirm',
                explanation: 'Rule sets are named containers that hold one or more rules. You\'ll create one called "rules-security" to hold your HTTPS redirect and security header rules.',
                portal: `<ol><li>In your Front Door profile, go to <strong>Settings → Rule sets</strong> in the left menu</li><li>Click <strong>+ Add a rule set</strong></li><li>Name: <strong>rules-security</strong></li><li>Click <strong>Add</strong> — the rule set is created (empty for now)</li></ol>`,
                cli: `<div class="lab-code-block">az afd rule-set create \\\n    --resource-group rg-academy \\\n    --profile-name fd-rules-lab \\\n    --rule-set-name rules-security</div>`,
                tip: 'Rule set names can only contain letters, numbers, and hyphens.',
                verification: 'The rule set "rules-security" appears in the Rule sets list (with 0 rules).'
            },
            {
                title: 'Add Rule: HTTP to HTTPS Redirect',
                subtitle: 'Force all HTTP traffic to HTTPS with a 301 redirect',
                type: 'confirm',
                explanation: 'This rule catches any request arriving over HTTP (not HTTPS) and sends a 301 Moved Permanently redirect to the HTTPS version of the same URL. 301 tells browsers and search engines this is permanent — they\'ll go directly to HTTPS next time. A 302 would be temporary and less SEO-friendly.',
                portal: `<ol><li>Click into <strong>rules-security</strong> rule set</li><li>Click <strong>+ Add a rule</strong></li><li>Rule name: <strong>ForceHttps</strong></li><li><strong>Add condition</strong> → Request protocol → Operator: Equal → Value: <strong>HTTP</strong></li><li><strong>Add action</strong> → URL Redirect → Redirect type: <strong>Moved (301)</strong> → Destination protocol: <strong>HTTPS</strong></li><li>Leave other fields blank (preserves original host and path)</li><li>Click <strong>Save</strong></li></ol>`,
                cli: `<div class="lab-code-block">az afd rule create \\\n    --resource-group rg-academy \\\n    --profile-name fd-rules-lab \\\n    --rule-set-name rules-security \\\n    --rule-name ForceHttps \\\n    --order 1 \\\n    --match-variable RequestScheme \\\n    --operator Equal \\\n    --match-values HTTP \\\n    --action-name UrlRedirect \\\n    --redirect-protocol Https \\\n    --redirect-type Moved</div>`,
                tip: '301 vs 302: Use 301 (Moved Permanently) for permanent HTTPS enforcement. 302 (Found) is for temporary redirects where you might revert later.',
                verification: 'The rule "ForceHttps" appears in the rule set with condition "Request protocol = HTTP" and action "URL Redirect (301 to HTTPS)".'
            },
            {
                title: 'Add Rule: Security Headers',
                subtitle: 'Inject X-Content-Type-Options and X-Frame-Options into all responses',
                type: 'confirm',
                explanation: 'Security headers protect against common web attacks. X-Content-Type-Options: nosniff prevents MIME-type sniffing. X-Frame-Options: DENY prevents your site from being embedded in iframes (clickjacking protection). By adding these at the Front Door level, every response gets them regardless of what your origin sends.',
                portal: `<ol><li>In the <strong>rules-security</strong> rule set, click <strong>+ Add a rule</strong></li><li>Rule name: <strong>SecurityHeaders</strong></li><li><strong>No condition needed</strong> — leave conditions empty (applies to all requests)</li><li><strong>Add action</strong> → Modify response header → Action: <strong>Append</strong> → Header name: <strong>X-Content-Type-Options</strong> → Value: <strong>nosniff</strong></li><li><strong>Add another action</strong> → Modify response header → Action: <strong>Append</strong> → Header name: <strong>X-Frame-Options</strong> → Value: <strong>DENY</strong></li><li>Click <strong>Save</strong></li></ol>`,
                cli: `<div class="lab-code-block"># Note: CLI requires separate commands per header\naz afd rule create \\\n    --resource-group rg-academy \\\n    --profile-name fd-rules-lab \\\n    --rule-set-name rules-security \\\n    --rule-name SecurityHeaders \\\n    --order 2 \\\n    --action-name ModifyResponseHeader \\\n    --header-action Append \\\n    --header-name X-Content-Type-Options \\\n    --header-value nosniff</div>`,
                tip: 'Use "Append" (not "Overwrite") so you don\'t clobber headers the origin might already set. Append adds the header only if it\'s not already present.',
                verification: 'The rule set now shows 2 rules: ForceHttps and SecurityHeaders.'
            },
            {
                title: 'Associate Rule Set with Route',
                subtitle: 'Attach the rule set to your default route',
                type: 'confirm',
                explanation: 'Rule sets don\'t do anything until they\'re associated with a route. A route can have multiple rule sets, and they\'re evaluated in order.',
                portal: `<ol><li>Go to <strong>Front Door manager</strong> in the left menu</li><li>Click on your <strong>Route</strong> (e.g., "default-route")</li><li>Scroll down to the <strong>Rules</strong> section</li><li>Click <strong>+ Associate a rule set</strong></li><li>Select <strong>rules-security</strong></li><li>Click <strong>Update</strong> to save the route</li></ol>`,
                cli: `<div class="lab-code-block"># Associate rule set with route\naz afd route update \\\n    --resource-group rg-academy \\\n    --profile-name fd-rules-lab \\\n    --endpoint-name your-endpoint \\\n    --route-name default-route \\\n    --rule-sets rules-security</div>`,
                tip: 'Changes to routes and rule sets can take a few minutes to propagate to all edge locations worldwide.',
                verification: 'Your route now shows "rules-security" under the Rules section.'
            },
            {
                title: 'Test the Rules',
                subtitle: 'Verify HTTPS redirect and security headers with curl',
                type: 'confirm',
                explanation: 'Use curl with the -I flag (headers only) to verify your rules are working. The HTTP request should return a 301 redirect, and the HTTPS request should include your custom security headers.',
                portal: `<ol><li>Open a terminal (PowerShell, CMD, or Bash)</li><li>Test HTTP redirect:<br><code>curl -I http://your-endpoint.azurefd.net</code><br>Look for: <strong>HTTP/1.1 301 Moved Permanently</strong> and <strong>Location: https://...</strong></li><li>Test security headers:<br><code>curl -I https://your-endpoint.azurefd.net</code><br>Look for: <strong>X-Content-Type-Options: nosniff</strong> and <strong>X-Frame-Options: DENY</strong></li></ol>`,
                cli: `<div class="lab-code-block"># Test 1: HTTP should redirect to HTTPS\ncurl -I http://your-endpoint.azurefd.net\n# Expected: 301 Moved Permanently\n# Location: https://your-endpoint.azurefd.net/\n\n# Test 2: HTTPS should include security headers\ncurl -I https://your-endpoint.azurefd.net\n# Expected headers in response:\n# X-Content-Type-Options: nosniff\n# X-Frame-Options: DENY</div>`,
                tip: 'If you don\'t see the headers immediately, wait 2-3 minutes for propagation. Front Door changes are eventually consistent across all global PoPs.',
                verification: 'HTTP requests return 301 redirect to HTTPS. HTTPS responses include both X-Content-Type-Options and X-Frame-Options headers.'
            },
            {
                title: 'Review: HTTPS Redirect Status Codes',
                subtitle: 'Key takeaway',
                type: 'confirm',
                explanation: 'A permanent HTTPS redirect must use HTTP 301 (Moved Permanently). This tells browsers and search engines to always use HTTPS in the future — they cache the redirect and go directly to HTTPS on subsequent visits. A 302 is temporary and does not update bookmarks or SEO rankings.',
                portal: `<ol><li><strong>301 Moved Permanently</strong> — the correct code for enforcing HTTPS; browsers remember the redirect</li><li><strong>302 Found</strong> — temporary redirect; browsers re-check the original URL each time</li><li><strong>307 Temporary Redirect</strong> — preserves HTTP method but is still temporary</li><li>Front Door Rules Engine uses 301 by default for HTTPS redirect rules</li></ol>`
            }
        ]
    }
},

// ──────────────────────────────────────────────
// MODULE 12: Front Door Caching & Performance
// ──────────────────────────────────────────────
{
    id: 'frontdoor-caching',
    level: 300,
    title: 'Front Door Caching & Performance',
    subtitle: 'Cache behavior, compression, optimization strategies',
    icon: '⚡',
    estimatedTime: '40m',
    learn: `
<div class="learn-section">
    <h2>How Front Door Caching Works</h2>
    <p>Front Door caches content at its 100+ edge locations. When a user requests a resource, Front Door checks if it's cached at the nearest edge. If yes (cache hit), it returns immediately without contacting your origin. If no (cache miss), it fetches from the origin, caches it, and serves it.</p>
    
    <div class="diagram-container">
        <svg viewBox="0 0 650 200" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:650px;font-family:'Segoe UI',sans-serif">
          <defs>
            <marker id="ca-arr" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6" fill="#0078D4"/></marker>
            <marker id="ca-arr-g" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6" fill="#107C10"/></marker>
            <marker id="ca-arr-r" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6" fill="#D13438"/></marker>
          </defs>
          <!-- Row labels -->
          <text x="10" y="18" fill="#333" font-size="12" font-weight="700">Cache Hit</text>
          <text x="10" y="118" fill="#333" font-size="12" font-weight="700">Cache Miss</text>
          <!-- ROW 1: Cache Hit -->
          <rect x="10" y="30" width="75" height="40" rx="8" fill="#0078D4"/>
          <text x="47" y="55" text-anchor="middle" fill="#fff" font-size="11" font-weight="600">👤 User</text>
          <line x1="85" y1="50" x2="130" y2="50" stroke="#0078D4" stroke-width="2" marker-end="url(#ca-arr)"/>
          <rect x="138" y="30" width="100" height="40" rx="8" fill="#0078D4"/>
          <text x="188" y="55" text-anchor="middle" fill="#fff" font-size="11" font-weight="600">Edge POP</text>
          <line x1="238" y1="50" x2="283" y2="50" stroke="#107C10" stroke-width="2" marker-end="url(#ca-arr-g)"/>
          <rect x="291" y="30" width="105" height="40" rx="8" fill="#107C10"/>
          <text x="343" y="48" text-anchor="middle" fill="#fff" font-size="11" font-weight="700">CACHE HIT</text>
          <text x="343" y="62" text-anchor="middle" fill="#d0f0d0" font-size="9">✓ Found</text>
          <line x1="396" y1="50" x2="441" y2="50" stroke="#107C10" stroke-width="2" marker-end="url(#ca-arr-g)"/>
          <rect x="449" y="30" width="130" height="40" rx="8" fill="#107C10"/>
          <text x="514" y="48" text-anchor="middle" fill="#fff" font-size="11" font-weight="600">⚡ Response</text>
          <text x="514" y="62" text-anchor="middle" fill="#d0f0d0" font-size="10">fast! &lt;10ms</text>
          <!-- ROW 2: Cache Miss -->
          <rect x="10" y="130" width="75" height="40" rx="8" fill="#0078D4"/>
          <text x="47" y="155" text-anchor="middle" fill="#fff" font-size="11" font-weight="600">👤 User</text>
          <line x1="85" y1="150" x2="130" y2="150" stroke="#0078D4" stroke-width="2" marker-end="url(#ca-arr)"/>
          <rect x="138" y="130" width="100" height="40" rx="8" fill="#0078D4"/>
          <text x="188" y="155" text-anchor="middle" fill="#fff" font-size="11" font-weight="600">Edge POP</text>
          <line x1="238" y1="150" x2="283" y2="150" stroke="#D13438" stroke-width="2" marker-end="url(#ca-arr-r)"/>
          <rect x="291" y="130" width="105" height="40" rx="8" fill="#D13438"/>
          <text x="343" y="148" text-anchor="middle" fill="#fff" font-size="11" font-weight="700">CACHE MISS</text>
          <text x="343" y="162" text-anchor="middle" fill="#ffd0d0" font-size="9">✗ Not found</text>
          <line x1="396" y1="150" x2="441" y2="150" stroke="#FF8C00" stroke-width="2" marker-end="url(#ca-arr)"/>
          <rect x="449" y="130" width="80" height="40" rx="8" fill="#FF8C00"/>
          <text x="489" y="155" text-anchor="middle" fill="#fff" font-size="11" font-weight="600">Origin</text>
          <line x1="529" y1="150" x2="549" y2="150" stroke="#107C10" stroke-width="2" marker-end="url(#ca-arr-g)"/>
          <rect x="555" y="130" width="85" height="40" rx="8" fill="#107C10"/>
          <text x="597" y="148" text-anchor="middle" fill="#fff" font-size="10" font-weight="600">Response</text>
          <text x="597" y="162" text-anchor="middle" fill="#d0f0d0" font-size="8">+ Store</text>
          <!-- Border -->
          <rect x="2" y="2" width="646" height="196" rx="12" fill="none" stroke="#e0e0e0" stroke-width="1"/>
        </svg>
    </div>

    <h3>Cache Key</h3>
    <p>The cache key determines what makes a request "unique" for caching purposes. By default:</p>
    <ul>
        <li><strong>URL path</strong> — /page1 and /page2 are cached separately</li>
        <li><strong>Query string behavior</strong> (configurable)</li>
    </ul>

    <h3>Query String Caching Modes</h3>
    <table class="content-table">
        <tr><th>Mode</th><th>Behavior</th><th>Use Case</th></tr>
        <tr><td><strong>Ignore Query String</strong></td><td>All query strings map to same cache entry</td><td>Content doesn't change by query param</td></tr>
        <tr><td><strong>Use Query String</strong></td><td>Each unique query string = separate cache</td><td>Dynamic content that varies by params</td></tr>
        <tr><td><strong>Ignore Specified</strong></td><td>Ignore certain params, cache on others</td><td>Ignore tracking params (utm_source)</td></tr>
        <tr><td><strong>Include Specified</strong></td><td>Only specified params affect cache key</td><td>Cache by version param only</td></tr>
    </table>
</div>

<div class="learn-section">
    <h2>Cache Control Headers</h2>
    <p>Front Door respects Cache-Control headers from your origin to determine caching behavior.</p>
    
    <table class="content-table">
        <tr><th>Header</th><th>Effect</th></tr>
        <tr><td><code>Cache-Control: public, max-age=3600</code></td><td>Cache for 1 hour</td></tr>
        <tr><td><code>Cache-Control: private</code></td><td>Don't cache at edge (user-specific content)</td></tr>
        <tr><td><code>Cache-Control: no-cache</code></td><td>Revalidate with origin before serving</td></tr>
        <tr><td><code>Cache-Control: no-store</code></td><td>Never cache this content</td></tr>
        <tr><td><code>Vary: Accept-Encoding</code></td><td>Cache separate versions per encoding</td></tr>
    </table>

    <div class="warning-box">
        <h4>⚠️ Don't Cache Sensitive Data</h4>
        <p>Never cache responses containing user-specific data (auth tokens, personal info, session data). Ensure your application sends <span class="code-inline">Cache-Control: private</span> or <span class="code-inline">no-store</span> for such responses. Caching sensitive data at the edge could expose it to other users.</p>
    </div>
</div>

<div class="learn-section">
    <h2>Compression</h2>
    <p>Front Door can compress responses at the edge before sending to users, reducing bandwidth and improving load times.</p>
    
    <h3>Supported MIME Types for Compression</h3>
    <ul>
        <li>text/html, text/css, text/javascript</li>
        <li>application/javascript, application/json</li>
        <li>application/xml, image/svg+xml</li>
        <li>Minimum file size: 1 KB</li>
        <li>Maximum file size: 8 MB</li>
    </ul>

    <h3>Compression Algorithms</h3>
    <ul>
        <li><strong>Gzip:</strong> Widely supported, good compression</li>
        <li><strong>Brotli:</strong> Better compression than Gzip, supported by modern browsers</li>
    </ul>

    <div class="tip-box">
        <h4>💡 Performance Optimization Checklist</h4>
        <p>1. Enable caching for static assets (images, CSS, JS)<br>
        2. Enable compression for text-based content<br>
        3. Use appropriate Cache-Control headers from your origin<br>
        4. Use query string caching wisely — ignore tracking params<br>
        5. Set up cache purge automation for deployments<br>
        6. Monitor cache hit ratios in Front Door analytics</p>
    </div>
</div>

<div class="learn-section">
    <h2>Cache Purging</h2>
    <p>Sometimes you need to clear cached content (after a deployment, content update, etc.).</p>
    
    <div class="code-block"># Purge specific path
az afd endpoint purge \\
    --resource-group rg-fd \\
    --profile-name fd-contoso \\
    --endpoint-name contoso-endpoint \\
    --content-paths "/images/*" "/css/*"

# Purge everything
az afd endpoint purge \\
    --resource-group rg-fd \\
    --profile-name fd-contoso \\
    --endpoint-name contoso-endpoint \\
    --content-paths "/*"</div>

    <div class="warning-box">
        <h4>⚠️ Purge Propagation</h4>
        <p>Cache purge propagates to all edge locations globally. It may take up to a few minutes for all PoPs to clear the cached content. Plan deployments accordingly.</p>
    </div>
</div>
`,
    diagrams: [
        {
            id: 'fd-caching-flow',
            type: 'frontdoor-caching',
            title: 'Front Door Caching — Cache Miss vs Cache Hit',
            icon: '💾',
            description: 'Understand how Front Door\'s edge caching works. First request = cache miss (goes to origin). Subsequent requests = cache hit (served instantly from edge).',
            steps: [
                'First user request arrives at Front Door for GET /style.css.',
                'Request forwarded to the nearest Edge POP.',
                'Edge POP checks its local cache — MISS! This asset hasn\'t been cached yet.',
                'POP forwards the request to the origin server.',
                'Origin responds with 200 OK + the file. POP caches it and returns it to the user.',
                'Second user (or same user) requests the same file.',
                'Request hits the same Edge POP.',
                'Edge POP checks cache — HIT! Returns the cached copy instantly, no origin contact.',
                'TTL controls: Cache-Control headers, purge API for invalidation, query string caching modes.'
            ],
            legend: [
                { color: '#d13438', label: 'Cache Miss' },
                { color: '#107c10', label: 'Cache Hit' },
                { color: '#0078d4', label: 'User Request' }
            ]
        }
    ],
    quiz: [
        {
            question: 'A user requests /page.html?utm_source=google. You have query string caching set to "Ignore Query String". How is this request cached?',
            options: ['As /page.html?utm_source=google (unique entry)', 'As /page.html (query string ignored)', 'Not cached at all', 'Depends on Cache-Control header'],
            correct: 1,
            explanation: 'With "Ignore Query String" mode, the query string is stripped from the cache key. All requests for /page.html (regardless of query params) share the same cache entry.'
        },
        {
            question: 'Your API returns user-specific data. What Cache-Control header should your origin send?',
            options: ['Cache-Control: public, max-age=3600', 'Cache-Control: private or no-store', 'Cache-Control: max-age=0', 'No header needed — Front Door doesn\'t cache by default'],
            correct: 1,
            explanation: 'User-specific data must use Cache-Control: private (only browser caches) or no-store (no caching at all). Caching user-specific data at the edge could leak data to other users.'
        },
        {
            question: 'Which compression algorithm provides better compression than Gzip?',
            options: ['Deflate', 'LZ4', 'Brotli', 'Snappy'],
            correct: 2,
            explanation: 'Brotli provides better compression ratios than Gzip, especially for text-based content. It\'s supported by all modern browsers and is the preferred choice when available.'
        },
        {
            question: 'How do you force Front Door to fetch fresh content from the origin after a deployment?',
            options: ['Restart Front Door', 'Delete and recreate the route', 'Purge the cache for affected paths', 'Change the origin URL'],
            correct: 2,
            explanation: 'Cache purging clears cached content from all edge locations. After purging, the next request for that content will be a cache miss, forcing Front Door to fetch fresh content from the origin.'
        },
        {
            question: 'What is a "cache hit ratio"?',
            options: ['The percentage of requests served from cache vs total requests', 'The number of cache servers per edge location', 'The time it takes to cache new content', 'The size of the cached content'],
            correct: 0,
            explanation: 'Cache hit ratio = cache hits / total requests. A higher ratio means more requests are served from edge cache (faster, cheaper). Monitor this metric to optimize caching strategy.'
        }
    ],
    interactive: [
        {
            type: 'flashcards',
            id: 'caching-flashcards',
            title: 'Caching Deep Dive',
            cards: [
                { front: 'What is a cache key?', back: 'The unique identifier for a cached resource. By default it includes the URL path and (optionally) query string. Two requests with the same cache key return the same cached content.' },
                { front: 'When should you use "Ignore Query String" caching?', back: 'When the page content doesn\'t change based on query parameters. Common for static assets. Ignoring query strings increases cache hit ratio by consolidating requests.' },
                { front: 'What is cache revalidation?', back: 'When a cached item\'s TTL expires, Front Door checks with the origin if content changed (using If-Modified-Since or ETag). If unchanged, origin returns 304 Not Modified and the cache is refreshed — no full download needed.' },
                { front: 'What is a stale response?', back: 'A cached response past its TTL. Front Door may serve stale content while revalidating with the origin in the background (stale-while-revalidate pattern).' }
            ]
        }
    ],
    lab: {
        title: 'Hands-On: Configure & Test Front Door Caching',
        icon: '⚡',
        scenario: 'You will enable caching on a Front Door route, observe cache hit/miss behavior using response headers, and perform a cache purge — the key operational tasks for managing Front Door performance.',
        duration: '20-30 min',
        cost: '~$0.50/day (Front Door Standard)',
        difficulty: 'Advanced',
        prerequisites: ['Azure subscription', 'Front Door Standard/Premium profile with a working route and origin'],
        cleanup: `Caching can be disabled by editing the route. No additional resources to delete.`,
        steps: [
            {
                title: 'Enable Caching on a Route',
                subtitle: 'Turn on edge caching for your Front Door route',
                type: 'confirm',
                explanation: 'Caching is configured per-route in Front Door. When enabled, Front Door stores responses at its 100+ edge PoPs so subsequent requests are served locally without contacting your origin.',
                portal: `<ol><li>Open your Front Door profile → <strong>Front Door manager</strong></li><li>Click on your <strong>Route</strong> to edit it</li><li>Check the box: <strong>Enable caching</strong></li><li>Set <strong>Query string caching behavior</strong> to: <strong>Ignore Query Strings</strong></li><li>This means /page.html?utm_source=google and /page.html share the same cache entry</li><li>Click <strong>Update</strong></li></ol>`,
                cli: `<div class="lab-code-block">az afd route update \\\n    --resource-group rg-academy \\\n    --profile-name fd-cache-lab \\\n    --endpoint-name your-endpoint \\\n    --route-name default-route \\\n    --enable-caching true \\\n    --query-string-caching-behavior IgnoreQueryString</div>`,
                tip: '"Ignore Query Strings" is best for static content where query params are tracking codes (utm_source, fbclid). It maximizes cache hit ratio.',
                verification: 'The route now shows "Caching: Enabled" with query string behavior set to "Ignore Query Strings".'
            },
            {
                title: 'Configure Cache Duration',
                subtitle: 'Set how long content stays cached at the edge',
                type: 'confirm',
                explanation: 'You can let the origin\'s Cache-Control header dictate TTL (recommended) or override it with a fixed duration. Using the origin header gives your application control over caching behavior.',
                portal: `<ol><li>In the same route edit screen, find <strong>Cache duration</strong></li><li>Set to: <strong>Use origin</strong> (honor the origin\'s Cache-Control header)</li><li>This means if your origin sends <code>Cache-Control: public, max-age=3600</code>, Front Door caches for 1 hour</li><li>Click <strong>Update</strong> if you haven\'t already</li></ol>`,
                cli: `<div class="lab-code-block"># The default behavior honors origin Cache-Control headers\n# To override with a fixed duration (e.g., 1 hour):\naz afd route update \\\n    --resource-group rg-academy \\\n    --profile-name fd-cache-lab \\\n    --endpoint-name your-endpoint \\\n    --route-name default-route \\\n    --enable-caching true \\\n    --content-types-to-compress "text/html" "text/css" "application/javascript"</div>`,
                tip: 'Best practice: Let your origin control TTL via Cache-Control headers. This way developers can set appropriate TTLs per content type in application code.',
                verification: 'Route caching is set to honor origin cache duration.'
            },
            {
                title: 'Test Cache Behavior — Cache Miss',
                subtitle: 'Make the first request and observe a cache miss',
                type: 'confirm',
                explanation: 'The first request for any resource will be a cache miss — Front Door doesn\'t have it cached yet. Look for the X-Cache header in the response. TCP_MISS or CONFIG_NOCACHE means the response came from the origin.',
                portal: `<ol><li>Open a terminal</li><li>Run: <code>curl -I https://your-endpoint.azurefd.net/</code></li><li>Look at the response headers for: <strong>X-Cache</strong></li><li>You should see: <code>X-Cache: TCP_MISS</code> or <code>X-Cache: CONFIG_NOCACHE</code></li><li>This confirms the request went all the way to your origin</li></ol>`,
                cli: `<div class="lab-code-block"># First request — expect a cache MISS\ncurl -I https://your-endpoint.azurefd.net/\n\n# Look for this header in the response:\n# X-Cache: TCP_MISS    (cache miss — fetched from origin)\n# or\n# X-Cache: CONFIG_NOCACHE  (caching not configured for this content)</div>`,
                tip: 'The X-Cache header is your best friend for debugging Front Door caching. Always check it when troubleshooting.',
                verification: 'The curl response shows X-Cache: TCP_MISS (or CONFIG_NOCACHE), confirming the first request was not served from cache.'
            },
            {
                title: 'Test Cache Behavior — Cache Hit',
                subtitle: 'Make a second request and observe a cache hit',
                type: 'confirm',
                explanation: 'The second request to the same URL should be a cache hit — Front Door serves it from the edge PoP\'s local cache without contacting your origin. This is dramatically faster.',
                portal: `<ol><li>Run the same curl command again: <code>curl -I https://your-endpoint.azurefd.net/</code></li><li>Look at <strong>X-Cache</strong> header</li><li>You should now see: <code>X-Cache: TCP_HIT</code></li><li>This means the response was served directly from the edge cache — your origin was NOT contacted</li><li>Compare the response time vs the first request — it should be faster</li></ol>`,
                cli: `<div class="lab-code-block"># Second request — expect a cache HIT\ncurl -I https://your-endpoint.azurefd.net/\n\n# Look for this header:\n# X-Cache: TCP_HIT    (served from edge cache!)\n\n# The difference:\n# TCP_MISS = origin was contacted (slower)\n# TCP_HIT  = served from edge cache (faster, no origin load)</div>`,
                tip: 'TCP_HIT means zero load on your origin for this request. High cache hit ratios reduce origin costs and improve latency.',
                verification: 'The curl response shows X-Cache: TCP_HIT, confirming the second request was served from cache.'
            },
            {
                title: 'Purge Cache',
                subtitle: 'Clear cached content after a deployment or content update',
                type: 'confirm',
                explanation: 'Cache purging forces Front Door to discard cached content. After a purge, the next request becomes a cache miss and Front Door fetches fresh content from the origin. Use "/*" to purge everything, or specific paths like "/css/*" for targeted purges.',
                portal: `<ol><li>In your Front Door profile, click <strong>Purge</strong> in the top toolbar</li><li>Select the endpoint and domain</li><li>Enter content path: <strong>/*</strong> (purge all content)</li><li>Click <strong>Purge</strong></li><li>Wait 1-2 minutes for propagation to all global PoPs</li><li>Run curl again — you should see <code>X-Cache: TCP_MISS</code> (cache was cleared)</li></ol>`,
                cli: `<div class="lab-code-block"># Purge all cached content\naz afd endpoint purge \\\n    --resource-group rg-academy \\\n    --profile-name fd-cache-lab \\\n    --endpoint-name your-endpoint \\\n    --content-paths "/*"\n\n# For targeted purge (more efficient):\naz afd endpoint purge \\\n    --resource-group rg-academy \\\n    --profile-name fd-cache-lab \\\n    --endpoint-name your-endpoint \\\n    --content-paths "/css/*" "/js/*"</div>`,
                tip: 'Purge propagates globally, which can take a few minutes. In CI/CD pipelines, add a purge step after deployment to ensure users get fresh content.',
                verification: 'After purging, a curl request shows X-Cache: TCP_MISS again — confirming the cache was successfully cleared.'
            },
            {
                title: 'Review: X-Cache Header Values',
                subtitle: 'Key takeaway',
                type: 'confirm',
                explanation: 'X-Cache: TCP_HIT means the response was served directly from the Front Door edge cache — the origin was never contacted. This is the ideal outcome for cacheable content: faster response times and zero load on your origin server. TCP_MISS means the edge had to fetch from the origin.',
                portal: `<ol><li><strong>TCP_HIT</strong> — served from edge cache; origin not contacted (fastest)</li><li><strong>TCP_MISS</strong> — cache miss; content fetched from origin then cached at edge</li><li><strong>TCP_REMOTE_HIT</strong> — served from a nearby PoP's cache, not the local one</li><li>High cache-hit ratios reduce origin costs and improve global latency</li></ol>`
            }
        ]
    }
},

// ──────────────────────────────────────────────
// MODULE 13: Front Door WAF & Security
// ──────────────────────────────────────────────
{
    id: 'frontdoor-waf',
    level: 300,
    title: 'Front Door WAF & Security',
    subtitle: 'WAF policies, managed rules, bot protection, DDoS',
    icon: '🔥',
    estimatedTime: '45m',
    learn: `
<div class="learn-section">
    <h2>Web Application Firewall (WAF) on Front Door</h2>
    <p>WAF protects your web applications from common attacks like SQL injection, cross-site scripting (XSS), and other OWASP top 10 threats. On Front Door, WAF operates at the edge — blocking attacks before they reach your origin.</p>
    
    <div class="concept-box">
        <h4>🔑 WAF at the Edge</h4>
        <p>Because Front Door WAF runs at the edge (100+ locations), attacks are blocked close to the attacker, not at your origin. This means:<br>
        • Lower latency for legitimate users (attack traffic doesn't consume origin resources)<br>
        • Global protection regardless of attack source<br>
        • DDoS mitigation at the network edge</p>
    </div>

    <h3>WAF Policy Modes</h3>
    <table class="content-table">
        <tr><th>Mode</th><th>Behavior</th><th>When to Use</th></tr>
        <tr><td><strong>Detection</strong></td><td>Logs threats but doesn't block them</td><td>Initial deployment, tuning phase</td></tr>
        <tr><td><strong>Prevention</strong></td><td>Blocks threats based on rules</td><td>Production — after tuning</td></tr>
    </table>

    <div class="tip-box">
        <h4>💡 Best Practice: Start in Detection Mode</h4>
        <p>Always deploy WAF in Detection mode first. Review the logs for false positives. Tune exclusions for legitimate traffic patterns. Then switch to Prevention mode. Going straight to Prevention can block legitimate users.</p>
    </div>
</div>

<div class="learn-section">
    <h2>WAF Rule Types</h2>
    
    <h3>1. Managed Rule Sets (Premium Only)</h3>
    <p>Pre-configured rules maintained by Microsoft that protect against known attack patterns.</p>
    
    <h4>Default Rule Set (DRS) 2.1</h4>
    <table class="content-table">
        <tr><th>Rule Group</th><th>Protects Against</th></tr>
        <tr><td>SQL Injection</td><td>SQL injection attacks in query strings, headers, body</td></tr>
        <tr><td>Cross-Site Scripting</td><td>XSS attacks via user input</td></tr>
        <tr><td>Local File Inclusion</td><td>Path traversal attacks (../../etc/passwd)</td></tr>
        <tr><td>Remote Code Execution</td><td>Command injection, code execution attempts</td></tr>
        <tr><td>Protocol Violations</td><td>Malformed HTTP requests</td></tr>
        <tr><td>Java Attacks</td><td>Log4j, Java deserialization</td></tr>
        <tr><td>PHP Attacks</td><td>PHP injection attempts</td></tr>
    </table>

    <h3>2. Custom Rules</h3>
    <p>Rules you create for application-specific protection.</p>
    
    <h4>Custom Rule Match Conditions</h4>
    <ul>
        <li><strong>IP Address:</strong> Allow/block specific IPs or ranges</li>
        <li><strong>Geo-location:</strong> Allow/block by country</li>
        <li><strong>Request size:</strong> Block oversized requests</li>
        <li><strong>String match:</strong> Match headers, query strings, body content</li>
        <li><strong>Rate limiting:</strong> Limit requests per source IP</li>
    </ul>

    <div class="code-block"># Create a WAF policy
az network front-door waf-policy create \\
    --resource-group rg-fd \\
    --name wafContoso \\
    --sku Premium_AzureFrontDoor \\
    --mode Detection

# Add a geo-blocking custom rule
az network front-door waf-policy rule create \\
    --resource-group rg-fd \\
    --policy-name wafContoso \\
    --name BlockHighRiskCountries \\
    --priority 100 \\
    --rule-type MatchRule \\
    --action Block \\
    --match-variable RemoteAddr \\
    --operator GeoMatch \\
    --match-values "CN" "RU" "KP"

# Add rate limiting rule
az network front-door waf-policy rule create \\
    --resource-group rg-fd \\
    --policy-name wafContoso \\
    --name RateLimit \\
    --priority 200 \\
    --rule-type RateLimitRule \\
    --action Block \\
    --rate-limit-threshold 100 \\
    --rate-limit-duration-in-minutes 1 \\
    --match-variable RequestUri \\
    --operator Contains \\
    --match-values "/api/"</div>
</div>

<div class="learn-section">
    <h2>Bot Protection (Premium)</h2>
    <p>Front Door Premium includes a Bot Manager rule set that categorizes and handles bot traffic:</p>
    
    <table class="content-table">
        <tr><th>Category</th><th>Examples</th><th>Default Action</th></tr>
        <tr><td><strong>Good Bots</strong></td><td>Googlebot, Bingbot</td><td>Allow</td></tr>
        <tr><td><strong>Bad Bots</strong></td><td>Scrapers, credential stuffers</td><td>Block</td></tr>
        <tr><td><strong>Unknown Bots</strong></td><td>Unclassified automated traffic</td><td>Challenge (CAPTCHA)</td></tr>
    </table>
</div>

<div class="learn-section">
    <h2>End-to-End Security Pattern</h2>
    <div class="diagram-container">
        <svg viewBox="0 0 750 250" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:750px;font-family:'Segoe UI',sans-serif">
          <defs>
            <marker id="sec-arr" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6" fill="#0078D4"/></marker>
            <marker id="sec-arr-g" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6" fill="#107C10"/></marker>
          </defs>
          <!-- Title -->
          <text x="375" y="20" text-anchor="middle" fill="#333" font-size="14" font-weight="700">End-to-End Security</text>
          <!-- User -->
          <rect x="10" y="55" width="70" height="45" rx="8" fill="#0078D4"/>
          <text x="45" y="82" text-anchor="middle" fill="#fff" font-size="11" font-weight="600">👤 User</text>
          <line x1="80" y1="77" x2="115" y2="77" stroke="#0078D4" stroke-width="2" marker-end="url(#sec-arr)"/>
          <!-- DDoS -->
          <rect x="123" y="50" width="90" height="55" rx="8" fill="#7A3B93"/>
          <text x="168" y="73" text-anchor="middle" fill="#fff" font-size="10" font-weight="700">DDoS</text>
          <text x="168" y="88" text-anchor="middle" fill="#e8d0f0" font-size="9">Protection</text>
          <line x1="213" y1="77" x2="248" y2="77" stroke="#0078D4" stroke-width="2" marker-end="url(#sec-arr)"/>
          <!-- WAF -->
          <rect x="256" y="35" width="110" height="115" rx="8" fill="#D13438"/>
          <text x="311" y="56" text-anchor="middle" fill="#fff" font-size="11" font-weight="700">WAF</text>
          <line x1="276" y1="65" x2="346" y2="65" stroke="#ffa0a0" stroke-width="0.5"/>
          <text x="311" y="80" text-anchor="middle" fill="#ffd0d0" font-size="9">• OWASP Rules</text>
          <text x="311" y="95" text-anchor="middle" fill="#ffd0d0" font-size="9">• Bot Mgmt</text>
          <text x="311" y="110" text-anchor="middle" fill="#ffd0d0" font-size="9">• Geo-block</text>
          <text x="311" y="125" text-anchor="middle" fill="#ffd0d0" font-size="9">• Rate limit</text>
          <text x="311" y="142" text-anchor="middle" fill="#ffd0d0" font-size="9">• Custom rules</text>
          <line x1="366" y1="77" x2="401" y2="77" stroke="#0078D4" stroke-width="2" marker-end="url(#sec-arr)"/>
          <!-- Front Door -->
          <rect x="409" y="50" width="110" height="55" rx="8" fill="#0078D4"/>
          <text x="464" y="73" text-anchor="middle" fill="#fff" font-size="11" font-weight="700">Front Door</text>
          <text x="464" y="90" text-anchor="middle" fill="#d0e8ff" font-size="9">Edge POP</text>
          <line x1="519" y1="77" x2="589" y2="77" stroke="#107C10" stroke-width="2" stroke-dasharray="5,3" marker-end="url(#sec-arr-g)"/>
          <!-- Private Link label -->
          <rect x="528" y="58" width="52" height="14" rx="3" fill="#e6f4ea"/>
          <text x="554" y="69" text-anchor="middle" fill="#107C10" font-size="7" font-weight="600">Pvt Link</text>
          <!-- Origin -->
          <rect x="597" y="50" width="140" height="55" rx="8" fill="#107C10"/>
          <text x="667" y="73" text-anchor="middle" fill="#fff" font-size="11" font-weight="700">Origin</text>
          <text x="667" y="90" text-anchor="middle" fill="#d0f0d0" font-size="9">No public access</text>
          <!-- Flow line at bottom -->
          <rect x="10" y="180" width="727" height="55" rx="10" fill="#f5f5f5" stroke="#e0e0e0"/>
          <text x="375" y="200" text-anchor="middle" fill="#555" font-size="11" font-weight="600">Multi-Layer Defense: DDoS → WAF → Front Door → Private Link → Origin</text>
          <text x="375" y="222" text-anchor="middle" fill="#888" font-size="10">Each layer filters threats before they reach the next</text>
          <!-- Border -->
          <rect x="2" y="2" width="746" height="246" rx="12" fill="none" stroke="#e0e0e0" stroke-width="1"/>
        </svg>
    </div>
</div>
`,
    diagrams: [
        {
            id: 'waf-request-flow',
            type: 'waf-inspection',
            title: 'WAF Request Inspection — Blocking Attacks',
            icon: '🛡️',
            description: 'Watch how the Web Application Firewall inspects every incoming request against OWASP rules and custom rules, blocking attacks while allowing legitimate traffic.',
            steps: [
                'Four types of requests arrive: normal GET, SQL injection, XSS attack, and DDoS flood.',
                'All requests pass through the WAF inspection pipeline.',
                'WAF evaluates each request against rule sets: SQL injection detection, XSS patterns, rate limiting, bot protection, geo-filtering, and custom rules.',
                'Legitimate GET /products request passes all checks — forwarded to the web application.',
                'SQL injection, XSS, and DDoS requests are BLOCKED with 403 Forbidden. Logged to Azure Monitor/Sentinel.',
                'WAF modes: Detection (log only, don\'t block) or Prevention (block and log). Always start in Detection!'
            ],
            legend: [
                { color: '#107c10', label: 'Allowed' },
                { color: '#d13438', label: 'Blocked' },
                { color: '#ff8c00', label: 'WAF Rules' }
            ]
        }
    ],
    quiz: [
        {
            question: 'You just deployed a WAF policy on Front Door. What mode should you use initially?',
            options: ['Prevention — block everything immediately', 'Detection — log but don\'t block, review for false positives', 'Passive — do nothing', 'Aggressive — maximum blocking'],
            correct: 1,
            explanation: 'Always start in Detection mode. Review logs for false positives, tune exclusions, and only then switch to Prevention. Going straight to Prevention can block legitimate users.'
        },
        {
            question: 'Which WAF feature is only available in Front Door Premium?',
            options: ['Custom rules', 'HTTPS redirect', 'Managed rule sets and Bot Manager', 'Rate limiting'],
            correct: 2,
            explanation: 'Managed rule sets (DRS, OWASP protection) and the Bot Manager rule set are Premium-only features. Custom rules (including rate limiting) are available in both Standard and Premium.'
        },
        {
            question: 'A rate limiting rule sets threshold to 100 requests per minute. How does it identify the client?',
            options: ['By cookie', 'By source IP address', 'By user agent', 'By session ID'],
            correct: 1,
            explanation: 'Rate limiting in WAF tracks by source IP address (or socket address). If a single IP exceeds the threshold within the time window, subsequent requests are blocked.'
        },
        {
            question: 'Which OWASP attack does the SQL Injection rule group protect against?',
            options: ['Cross-site scripting (XSS)', 'Malicious SQL queries in inputs', 'Denial of service', 'Man-in-the-middle attacks'],
            correct: 1,
            explanation: 'SQL Injection rules detect and block attempts to inject malicious SQL code through user inputs (query strings, form fields, headers). This prevents attackers from accessing or modifying your database.'
        },
        {
            question: 'What is the recommended end-to-end security pattern for a Front Door-protected application?',
            options: [
                'Front Door + public origin with firewall rules',
                'Front Door (WAF at edge) + Private Link origin (zero public exposure)',
                'Application Gateway + NSG rules only',
                'Traffic Manager + DDoS protection'
            ],
            correct: 1,
            explanation: 'The most secure pattern: Front Door with WAF at the edge + Private Link origin (Premium) so the origin has zero public exposure. WAF blocks attacks at the edge, Private Link ensures no direct access to the origin.'
        }
    ],
    interactive: [
        {
            type: 'drag-drop',
            id: 'waf-rule-types',
            title: 'Classify WAF Rules',
            description: 'Sort each protection into the correct WAF rule category.',
            items: ['Block SQL injection', 'Geo-block specific countries', 'Block XSS attacks', 'Rate limit API calls', 'Block bad bots', 'IP allowlist/blocklist', 'Protect against Log4j'],
            targets: {
                'Managed Rules (Premium)': ['Block SQL injection', 'Block XSS attacks', 'Protect against Log4j'],
                'Bot Manager (Premium)': ['Block bad bots'],
                'Custom Rules': ['Geo-block specific countries', 'Rate limit API calls', 'IP allowlist/blocklist']
            }
        }
    ],
    lab: {
        title: 'Hands-On: Deploy a WAF Policy on Front Door',
        icon: '🔥',
        scenario: 'You will create a Web Application Firewall (WAF) policy, enable managed OWASP rules, add a custom rate-limiting rule, and associate the WAF with your Front Door — then test it against simulated attacks.',
        duration: '30-40 min',
        cost: '~$1/day (WAF policy)',
        difficulty: 'Advanced',
        prerequisites: ['Azure subscription', 'Front Door Standard/Premium profile with a working endpoint'],
        cleanup: `Delete the WAF policy: Portal → WAF policies → Select → Delete. Or keep it for production use (switch to Prevention mode after tuning).`,
        steps: [
            {
                title: 'Create a WAF Policy',
                subtitle: 'Create a new Web Application Firewall policy for Front Door',
                type: 'confirm',
                explanation: 'A WAF policy contains the rules that inspect and filter incoming traffic. You\'ll create it in Detection mode first — this logs potential threats without blocking them, letting you tune for false positives before enabling Prevention mode.',
                portal: `<ol><li>Search for <strong>"Web Application Firewall policies"</strong> in the portal search bar</li><li>Click <strong>+ Create</strong></li><li>Policy for: <strong>Azure Front Door</strong></li><li>SKU: <strong>Standard</strong> (or Premium if you want managed OWASP rules)</li><li>Resource group: your existing RG</li><li>Policy name: <strong>waf-academy</strong></li><li>Policy mode: <strong>Detection</strong> (NOT Prevention!) — this is critical for initial deployment</li><li>Click <strong>Review + Create</strong> → <strong>Create</strong></li></ol>`,
                cli: `<div class="lab-code-block">az network front-door waf-policy create \\\n    --resource-group rg-academy \\\n    --name wafacademy \\\n    --sku Premium_AzureFrontDoor \\\n    --mode Detection</div>`,
                tip: 'ALWAYS start in Detection mode on production sites. Going straight to Prevention can block real users. Review logs first, then switch.',
                verification: 'The WAF policy "waf-academy" is created and shows Mode: Detection.'
            },
            {
                title: 'Configure Managed Rules',
                subtitle: 'Enable the Default Rule Set (DRS) for OWASP protection',
                type: 'confirm',
                explanation: 'Managed rule sets are pre-built rules maintained by Microsoft that protect against OWASP Top 10 attacks: SQL injection, XSS, local file inclusion, remote code execution, protocol violations, and more. DRS 2.1 is the latest version.',
                portal: `<ol><li>Open your WAF policy <strong>waf-academy</strong></li><li>Go to <strong>Managed rules</strong> in the left menu</li><li>Click <strong>+ Add managed rule set</strong></li><li>Select: <strong>Microsoft_DefaultRuleSet</strong> version <strong>2.1</strong></li><li>Click <strong>Save</strong></li><li>Review the rule groups that are now enabled: SQL Injection, XSS, LFI, RCE, Protocol Violations, Java, PHP attacks</li></ol>`,
                cli: `<div class="lab-code-block"># Managed rules are typically configured via portal\n# They cover OWASP Top 10:\n# - SQL Injection (SQLi)\n# - Cross-Site Scripting (XSS)\n# - Local File Inclusion (LFI)\n# - Remote Code Execution (RCE)\n# - Protocol violations\n# - Java attacks (Log4j)\n# - PHP injection</div>`,
                tip: 'DRS 2.1 includes protection against Log4j (CVE-2021-44228). Microsoft updates managed rules automatically when new threats emerge.',
                verification: 'Managed rules section shows DefaultRuleSet 2.1 enabled with all rule groups active.'
            },
            {
                title: 'Create a Custom Rate Limiting Rule',
                subtitle: 'Limit requests to 100 per minute per IP',
                type: 'confirm',
                explanation: 'Rate limiting protects against DDoS, brute force, and scraping attacks by capping how many requests a single IP can make in a time window. When exceeded, the client receives a 429 Too Many Requests response.',
                portal: `<ol><li>In your WAF policy, go to <strong>Custom rules</strong></li><li>Click <strong>+ Add custom rule</strong></li><li>Name: <strong>rate-limit-all</strong></li><li>Rule type: <strong>Rate limit</strong></li><li>Priority: <strong>100</strong></li><li>Rate limit duration: <strong>1 minute</strong></li><li>Rate limit threshold: <strong>100</strong> requests</li><li>Condition: Match variable: <strong>RequestUri</strong>, Operator: <strong>Any</strong></li><li>Action: <strong>Block</strong> (returns 429)</li><li>Click <strong>Add</strong></li></ol>`,
                cli: `<div class="lab-code-block">az network front-door waf-policy rule create \\\n    --resource-group rg-academy \\\n    --policy-name wafacademy \\\n    --name RateLimitAll \\\n    --priority 100 \\\n    --rule-type RateLimitRule \\\n    --action Block \\\n    --rate-limit-threshold 100 \\\n    --rate-limit-duration-in-minutes 1 \\\n    --match-variable RequestUri \\\n    --operator Any \\\n    --match-values "/"</div>`,
                tip: 'For production, consider different rate limits for different paths: stricter for /login and /api, more lenient for /static.',
                verification: 'Custom rules section shows "rate-limit-all" with rate limit: 100 requests/1 minute, action: Block.'
            },
            {
                title: 'Associate WAF with Front Door',
                subtitle: 'Link the WAF policy to your Front Door domain',
                type: 'confirm',
                explanation: 'The WAF policy must be associated with a Front Door security policy that specifies which domains the WAF protects. Without this association, the WAF rules are not applied to any traffic.',
                portal: `<ol><li>Go to your <strong>Front Door profile</strong></li><li>Click <strong>Security policies</strong> in the left menu</li><li>Click <strong>+ Add</strong></li><li>Name: <strong>security-waf</strong></li><li>WAF Policy: select <strong>waf-academy</strong></li><li>Domains: select your <strong>endpoint domain</strong> (e.g., your-endpoint.azurefd.net)</li><li>Click <strong>Save</strong></li></ol>`,
                cli: `<div class="lab-code-block">az afd security-policy create \\\n    --resource-group rg-academy \\\n    --profile-name fd-waf-lab \\\n    --security-policy-name security-waf \\\n    --waf-policy /subscriptions/{sub-id}/resourceGroups/rg-academy/providers/Microsoft.Network/FrontDoorWebApplicationFirewallPolicies/wafacademy \\\n    --domains /subscriptions/{sub-id}/resourceGroups/rg-academy/providers/Microsoft.Cdn/profiles/fd-waf-lab/afdEndpoints/your-endpoint</div>`,
                tip: 'One WAF policy can protect multiple domains. You can also have different WAF policies for different domains on the same Front Door.',
                verification: 'Security policies section shows your WAF associated with your endpoint domain.'
            },
            {
                title: 'Test Detection Mode',
                subtitle: 'Send normal and malicious requests to see WAF in action',
                type: 'confirm',
                explanation: 'In Detection mode, WAF logs threats but doesn\'t block them. This lets you verify that rules are triggering correctly and identify any false positives before switching to Prevention mode. Try a simulated SQL injection string in a query parameter.',
                portal: `<ol><li>Test normal traffic (should work fine):<br><code>curl -I https://your-endpoint.azurefd.net/</code></li><li>Test with a simulated SQL injection pattern:<br><code>curl -I "https://your-endpoint.azurefd.net/?id=1' OR 1=1--"</code></li><li>In Detection mode, both requests succeed (200 OK) — but the malicious one is logged</li><li>In Prevention mode, the malicious request would be blocked with 403 Forbidden</li></ol>`,
                cli: `<div class="lab-code-block"># Normal request — should return 200 OK\ncurl -I https://your-endpoint.azurefd.net/\n\n# Simulated SQL injection — logged but not blocked in Detection mode\ncurl -I "https://your-endpoint.azurefd.net/?id=1%27%20OR%201%3D1--"\n\n# In Detection mode: both return 200\n# In Prevention mode: the SQLi attempt returns 403 Forbidden</div>`,
                tip: 'URL-encode special characters in curl: \' → %27, space → %20, = → %3D. The WAF inspects decoded values.',
                verification: 'Both requests return 200 OK (because Detection mode logs but doesn\'t block). The WAF logs will show the SQL injection attempt was detected.'
            },
            {
                title: 'Review WAF Logs',
                subtitle: 'Check what the WAF detected',
                type: 'confirm',
                explanation: 'WAF logs show every request that triggered a rule, including the rule name, action taken (Detected or Blocked), and the request details. Review these logs to identify false positives before switching to Prevention mode.',
                portal: `<ol><li>Go to your WAF policy → <strong>Monitoring</strong> → <strong>Logs</strong> (or use Azure Monitor)</li><li>Look for entries showing your SQL injection test</li><li>Note the rule ID and group that triggered (likely SQL Injection rule group)</li><li>Review for false positives — did any legitimate requests trigger rules?</li><li>Once satisfied there are no false positives, you can switch to <strong>Prevention</strong> mode</li><li>(For this lab, leave it in Detection mode)</li></ol>`,
                cli: `<div class="lab-code-block"># Check WAF logs via Log Analytics (if diagnostic settings configured)\n# KQL query for WAF events:\n# AzureDiagnostics\n# | where Category == "FrontDoorWebApplicationFirewallLog"\n# | project TimeGenerated, ruleName_s, action_s, requestUri_s, clientIP_s\n# | order by TimeGenerated desc</div>`,
                tip: 'Best practice workflow: Deploy in Detection → Review logs for 1-2 weeks → Tune exclusions for false positives → Switch to Prevention → Continue monitoring.',
                verification: 'WAF logs show detected SQL injection attempts from your test, confirming the managed rules are working correctly.'
            },
            {
                title: 'Review: WAF Deployment Best Practice',
                subtitle: 'Key takeaway',
                type: 'confirm',
                explanation: 'Always deploy a new WAF policy in Detection mode first — never Prevention. Detection mode logs every rule match without blocking traffic, letting you identify false positives and tune exclusions. Only switch to Prevention mode after reviewing logs for 1-2 weeks and confirming no legitimate traffic is being flagged.',
                portal: `<ol><li><strong>Detection mode first</strong> — logs threats but does not block; safe for production</li><li>Review WAF logs for 1-2 weeks to identify false positives</li><li>Create exclusions for any legitimate requests that trigger rules</li><li>Switch to <strong>Prevention mode</strong> once tuning is complete — this actively blocks attacks</li><li>Continue monitoring logs after switching to catch new false positives</li></ol>`
            }
        ]
    }
},

// ──────────────────────────────────────────────
// MODULE 14: Advanced Network Architecture
// ──────────────────────────────────────────────
{
    id: 'network-architecture',
    level: 300,
    title: 'Advanced Network Architecture',
    subtitle: 'Hub-spoke, Azure Firewall, Network Virtual Appliances',
    icon: '🏗️',
    estimatedTime: '50m',
    learn: `
<div class="learn-section">
    <h2>Hub-Spoke Network Topology</h2>
    <p>The hub-spoke model is the most common enterprise network architecture in Azure. It provides centralized management while isolating workloads.</p>
    
    <div class="diagram-container">
        <svg viewBox="0 0 650 400" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:650px;font-family:'Segoe UI',sans-serif">
          <defs>
            <marker id="hs-arr" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6" fill="#0078D4"/></marker>
          </defs>
          <!-- On-Premises -->
          <rect x="240" y="10" width="170" height="50" rx="10" fill="#7A3B93"/>
          <text x="325" y="32" text-anchor="middle" fill="#fff" font-size="12" font-weight="700">🏢 On-Premises</text>
          <text x="325" y="48" text-anchor="middle" fill="#e8d0f0" font-size="9">Corporate Network</text>
          <!-- Line from On-Prem to Hub -->
          <line x1="325" y1="60" x2="325" y2="110" stroke="#7A3B93" stroke-width="2" stroke-dasharray="6,3" marker-end="url(#hs-arr)"/>
          <text x="355" y="88" fill="#7A3B93" font-size="8">VPN / ExpressRoute</text>
          <!-- Hub VNet -->
          <rect x="135" y="115" width="380" height="150" rx="14" fill="none" stroke="#0078D4" stroke-width="2" stroke-dasharray="8,4"/>
          <text x="325" y="135" text-anchor="middle" fill="#0078D4" font-size="13" font-weight="700">Hub VNet  10.0.0.0/16</text>
          <!-- VPN Gateway in hub -->
          <rect x="160" y="150" width="140" height="45" rx="8" fill="#7A3B93"/>
          <text x="230" y="170" text-anchor="middle" fill="#fff" font-size="10" font-weight="600">VPN Gateway</text>
          <text x="230" y="185" text-anchor="middle" fill="#e8d0f0" font-size="9">10.0.1.0/27</text>
          <!-- Azure Firewall in hub -->
          <rect x="340" y="150" width="150" height="45" rx="8" fill="#D13438"/>
          <text x="415" y="170" text-anchor="middle" fill="#fff" font-size="10" font-weight="700">🔥 Azure Firewall</text>
          <text x="415" y="185" text-anchor="middle" fill="#ffd0d0" font-size="9">10.0.0.0/26</text>
          <!-- Bastion / DNS label -->
          <text x="325" y="248" text-anchor="middle" fill="#0078D4" font-size="9">+ Bastion, DNS, Monitoring</text>
          <!-- Peering lines -->
          <line x1="225" y1="265" x2="145" y2="310" stroke="#FF8C00" stroke-width="2" marker-end="url(#hs-arr)"/>
          <text x="160" y="285" fill="#FF8C00" font-size="8" font-weight="600">Peering</text>
          <line x1="425" y1="265" x2="505" y2="310" stroke="#FF8C00" stroke-width="2" marker-end="url(#hs-arr)"/>
          <text x="480" y="285" fill="#FF8C00" font-size="8" font-weight="600">Peering</text>
          <!-- Spoke 1 -->
          <rect x="30" y="310" width="230" height="80" rx="10" fill="#107C10"/>
          <text x="145" y="335" text-anchor="middle" fill="#fff" font-size="12" font-weight="700">Spoke 1 — Web</text>
          <text x="145" y="352" text-anchor="middle" fill="#d0f0d0" font-size="10">10.1.0.0/16</text>
          <rect x="100" y="360" width="90" height="22" rx="5" fill="#0a5c0a"/>
          <text x="145" y="376" text-anchor="middle" fill="#fff" font-size="10">🖥 VMs</text>
          <!-- Spoke 2 -->
          <rect x="390" y="310" width="230" height="80" rx="10" fill="#00BCF2"/>
          <text x="505" y="335" text-anchor="middle" fill="#fff" font-size="12" font-weight="700">Spoke 2 — DB</text>
          <text x="505" y="352" text-anchor="middle" fill="#d0f0ff" font-size="10">10.2.0.0/16</text>
          <rect x="460" y="360" width="90" height="22" rx="5" fill="#007a9e"/>
          <text x="505" y="376" text-anchor="middle" fill="#fff" font-size="10">🗄 SQL</text>
          <!-- Border -->
          <rect x="2" y="2" width="646" height="396" rx="12" fill="none" stroke="#e0e0e0" stroke-width="1"/>
        </svg>
    </div>

    <h3>Hub VNet Contains (Shared Services)</h3>
    <ul>
        <li><strong>Azure Firewall</strong> — centralized network security</li>
        <li><strong>VPN/ExpressRoute Gateway</strong> — on-premises connectivity</li>
        <li><strong>Azure Bastion</strong> — secure VM access</li>
        <li><strong>DNS Servers</strong> — centralized name resolution</li>
        <li><strong>Monitoring/Logging</strong> — Log Analytics workspace</li>
    </ul>

    <h3>Spoke VNets Contain (Workloads)</h3>
    <ul>
        <li>Application-specific resources</li>
        <li>Isolated from other spokes</li>
        <li>All internet/on-prem traffic routed through hub (forced tunneling)</li>
    </ul>
</div>

<div class="learn-section">
    <h2>Azure Firewall</h2>
    <p>A managed, cloud-native firewall service that provides centralized network security for your Azure VNets.</p>
    
    <h3>Azure Firewall vs NSG</h3>
    <table class="content-table">
        <tr><th>Feature</th><th>NSG</th><th>Azure Firewall</th></tr>
        <tr><td>Scope</td><td>Subnet or NIC level</td><td>Centralized (hub VNet)</td></tr>
        <tr><td>Layer</td><td>L3/L4 (IP, Port)</td><td>L3/L4/L7 (FQDN, URL filtering)</td></tr>
        <tr><td>FQDN filtering</td><td>No</td><td>Yes (*.microsoft.com)</td></tr>
        <tr><td>Threat intelligence</td><td>No</td><td>Yes</td></tr>
        <tr><td>Logging</td><td>Flow logs</td><td>Full diagnostic logs</td></tr>
        <tr><td>Cost</td><td>Free</td><td>~$1.25/hour + data processing</td></tr>
        <tr><td>SNAT/DNAT</td><td>No</td><td>Yes</td></tr>
    </table>

    <h3>User Defined Routes (UDRs)</h3>
    <p>To force traffic through Azure Firewall, you create UDRs on spoke subnets:</p>
    
    <div class="code-block"># Create route table
az network route-table create \\
    --resource-group rg-networking \\
    --name rt-spoke-to-firewall

# Add default route → Azure Firewall
az network route-table route create \\
    --resource-group rg-networking \\
    --route-table-name rt-spoke-to-firewall \\
    --name toFirewall \\
    --address-prefix 0.0.0.0/0 \\
    --next-hop-type VirtualAppliance \\
    --next-hop-ip-address 10.0.0.4  # Firewall private IP

# Associate with spoke subnet
az network vnet subnet update \\
    --resource-group rg-networking \\
    --vnet-name vnet-spoke-web \\
    --name snet-web \\
    --route-table rt-spoke-to-firewall</div>
</div>

<div class="learn-section">
    <h2>Complete Architecture: Front Door + Hub-Spoke</h2>
    <div class="diagram-container">
        <svg viewBox="0 0 550 420" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:550px;font-family:'Segoe UI',sans-serif">
          <defs>
            <marker id="fd-arr" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6" fill="#0078D4"/></marker>
            <marker id="fd-arr-d" markerWidth="8" markerHeight="6" refX="3" refY="0" orient="auto"><path d="M0,0 L6,0 L3,8" fill="#0078D4"/></marker>
          </defs>
          <!-- Internet Users -->
          <text x="275" y="22" text-anchor="middle" fill="#333" font-size="13" font-weight="700">🌐 Internet Users</text>
          <!-- Arrow down -->
          <line x1="275" y1="30" x2="275" y2="55" stroke="#0078D4" stroke-width="2" marker-end="url(#fd-arr-d)"/>
          <!-- Front Door -->
          <rect x="140" y="60" width="270" height="65" rx="12" fill="#0078D4"/>
          <text x="275" y="82" text-anchor="middle" fill="#fff" font-size="14" font-weight="700">Azure Front Door</text>
          <text x="205" y="105" text-anchor="middle" fill="#d0e8ff" font-size="10">WAF</text>
          <text x="275" y="105" text-anchor="middle" fill="#d0e8ff" font-size="10">CDN</text>
          <text x="345" y="105" text-anchor="middle" fill="#d0e8ff" font-size="10">SSL</text>
          <!-- Arrow down with label -->
          <line x1="275" y1="125" x2="275" y2="170" stroke="#107C10" stroke-width="2" stroke-dasharray="5,3" marker-end="url(#fd-arr-d)"/>
          <rect x="195" y="137" width="160" height="16" rx="4" fill="#e6f4ea"/>
          <text x="275" y="149" text-anchor="middle" fill="#107C10" font-size="8" font-weight="600">Private Link / Service Tag</text>
          <!-- Hub VNet -->
          <rect x="120" y="175" width="310" height="90" rx="12" fill="none" stroke="#D13438" stroke-width="2" stroke-dasharray="8,4"/>
          <text x="275" y="195" text-anchor="middle" fill="#D13438" font-size="12" font-weight="700">Hub VNet</text>
          <!-- Azure Firewall inside hub -->
          <rect x="195" y="205" width="160" height="45" rx="8" fill="#D13438"/>
          <text x="275" y="225" text-anchor="middle" fill="#fff" font-size="11" font-weight="700">🔥 Azure Firewall</text>
          <text x="275" y="242" text-anchor="middle" fill="#ffd0d0" font-size="9">Centralized security</text>
          <!-- Arrows splitting to spokes -->
          <line x1="220" y1="265" x2="145" y2="310" stroke="#FF8C00" stroke-width="2" marker-end="url(#fd-arr)"/>
          <line x1="330" y1="265" x2="405" y2="310" stroke="#FF8C00" stroke-width="2" marker-end="url(#fd-arr)"/>
          <text x="160" y="290" fill="#FF8C00" font-size="8" font-weight="600">UDR</text>
          <text x="385" y="290" fill="#FF8C00" font-size="8" font-weight="600">UDR</text>
          <!-- Spoke Web -->
          <rect x="30" y="315" width="210" height="90" rx="10" fill="#107C10"/>
          <text x="135" y="338" text-anchor="middle" fill="#fff" font-size="12" font-weight="700">Spoke — Web</text>
          <rect x="55" y="350" width="75" height="22" rx="5" fill="#0a5c0a"/>
          <text x="92" y="365" text-anchor="middle" fill="#fff" font-size="9">App GW</text>
          <rect x="140" y="350" width="75" height="22" rx="5" fill="#0a5c0a"/>
          <text x="177" y="365" text-anchor="middle" fill="#fff" font-size="9">VMs</text>
          <text x="135" y="395" text-anchor="middle" fill="#d0f0d0" font-size="9">Web Tier</text>
          <!-- Spoke API -->
          <rect x="310" y="315" width="210" height="90" rx="10" fill="#00BCF2"/>
          <text x="415" y="338" text-anchor="middle" fill="#fff" font-size="12" font-weight="700">Spoke — API</text>
          <rect x="335" y="350" width="75" height="22" rx="5" fill="#007a9e"/>
          <text x="372" y="365" text-anchor="middle" fill="#fff" font-size="9">APIM</text>
          <rect x="420" y="350" width="75" height="22" rx="5" fill="#007a9e"/>
          <text x="457" y="365" text-anchor="middle" fill="#fff" font-size="9">VMs</text>
          <text x="415" y="395" text-anchor="middle" fill="#d0f0ff" font-size="9">API Tier</text>
          <!-- Border -->
          <rect x="2" y="2" width="546" height="416" rx="12" fill="none" stroke="#e0e0e0" stroke-width="1"/>
        </svg>
    </div>
    
    <div class="concept-box">
        <h4>🔑 Multi-Layer Defense</h4>
        <p>1. <strong>Azure DDoS Protection</strong> — Volumetric attack protection<br>
        2. <strong>Front Door WAF</strong> — Application layer protection at edge<br>
        3. <strong>Azure Firewall</strong> — Network layer protection centrally<br>
        4. <strong>NSGs</strong> — Subnet/NIC level micro-segmentation<br>
        5. <strong>Private Endpoints</strong> — Remove public exposure entirely</p>
    </div>
</div>
`,
    diagrams: [
        {
            id: 'hub-spoke-arch',
            type: 'hub-spoke',
            title: 'Hub-Spoke Network Architecture',
            icon: '🏗️',
            description: 'The gold-standard Azure network architecture. Central hub VNet with shared services, spoke VNets for workloads, connected via peering.',
            steps: [
                'Hub VNet: Central network with shared services — Azure Firewall, VPN Gateway, and DNS.',
                'Spoke 1 (Production): Production workloads with web and database tiers. Isolated from other spokes.',
                'Spoke 2 (Dev/Test): Development and testing environment. Separate subscription for cost tracking.',
                'Spoke 3 (Shared Services): Monitoring (Log Analytics), secrets management (Key Vault).',
                'Spoke 4 (DMZ): Public-facing services with NVA firewall and public load balancer.',
                'VNet Peering: All spokes peer with the hub. Spoke-to-spoke traffic routes through the hub firewall.',
                'On-Premises: Connected via VPN Gateway or ExpressRoute through the hub.'
            ],
            legend: [
                { color: '#0078d4', label: 'Hub VNet' },
                { color: '#107c10', label: 'Production' },
                { color: '#ff8c00', label: 'Dev/Test' },
                { color: '#8e44ad', label: 'Shared Services' },
                { color: '#d13438', label: 'DMZ' }
            ]
        }
    ],
    quiz: [
        {
            question: 'In hub-spoke topology, how do spoke VNets communicate with each other by default?',
            options: ['Directly — spoke-to-spoke traffic is allowed', 'Through the hub VNet (via Azure Firewall or NVA with UDRs)', 'They cannot communicate at all', 'Through the internet'],
            correct: 1,
            explanation: 'VNet peering is non-transitive. For spoke-to-spoke communication, traffic must be routed through the hub VNet via Azure Firewall or a Network Virtual Appliance (NVA) using User Defined Routes (UDRs).'
        },
        {
            question: 'What is a User Defined Route (UDR)?',
            options: ['A DNS record type', 'A custom routing rule that overrides Azure\'s default system routes', 'A VPN configuration', 'A type of NSG rule'],
            correct: 1,
            explanation: 'UDRs override Azure\'s automatic system routes. They\'re commonly used to force traffic through Azure Firewall or a Network Virtual Appliance (next-hop = VirtualAppliance).'
        },
        {
            question: 'Which Azure service provides FQDN-based filtering (e.g., allow *.microsoft.com)?',
            options: ['NSG', 'Azure Firewall', 'VNet Peering', 'Azure Load Balancer'],
            correct: 1,
            explanation: 'Azure Firewall supports FQDN (Fully Qualified Domain Name) filtering in application rules. NSGs only support IP-based rules — they cannot filter by domain name.'
        },
        {
            question: 'Where should shared services (VPN Gateway, Firewall, Bastion) be deployed in hub-spoke?',
            options: ['In each spoke VNet', 'In the hub VNet', 'In a separate subscription', 'In Azure Front Door'],
            correct: 1,
            explanation: 'Shared services are deployed in the hub VNet. Spokes connect to the hub via peering and access shared services centrally. This reduces cost and simplifies management.'
        },
        {
            question: 'To force all internet-bound traffic from a spoke through Azure Firewall, what route do you create?',
            options: ['0.0.0.0/0 → Internet', '0.0.0.0/0 → VirtualAppliance (Firewall IP)', '10.0.0.0/8 → VNetGateway', '*.* → AzureFirewall'],
            correct: 1,
            explanation: 'A UDR with destination 0.0.0.0/0 (default route) and next-hop VirtualAppliance pointing to the Firewall\'s private IP forces all internet-bound traffic through the Firewall.'
        }
    ],
    interactive: [
        {
            type: 'flashcards',
            id: 'architecture-flashcards',
            title: 'Network Architecture Concepts',
            cards: [
                { front: 'What is forced tunneling?', back: 'Forcing all internet-bound traffic from Azure to go through an on-premises firewall (via VPN/ExpressRoute) instead of directly to the internet. Done with UDRs. Also used with Azure Firewall in hub-spoke.' },
                { front: 'What is a Network Virtual Appliance (NVA)?', back: 'A VM running a third-party firewall/router (Palo Alto, Fortinet, etc.) in Azure. Used when Azure Firewall doesn\'t meet specific requirements. Deployed in the hub VNet.' },
                { front: 'What is Azure Virtual WAN?', back: 'A managed hub-spoke networking service by Microsoft. Provides a pre-built hub with VPN, ExpressRoute, and SD-WAN integration. Simplifies complex networking at scale.' },
                { front: 'What is micro-segmentation?', back: 'Using NSGs and ASGs to create fine-grained security boundaries within a subnet. E.g., only web servers can talk to db servers on port 1433. Prevents lateral movement if one server is compromised.' }
            ]
        }
    ],
    lab: {
        title: 'Hands-On: Build a Hub-Spoke Network',
        icon: '🏗️',
        scenario: 'You will build the gold-standard Azure network architecture from scratch: a hub VNet with shared services and two spoke VNets for isolated workloads, connected via VNet peering. Then you\'ll verify the topology and understand why spoke-to-spoke traffic doesn\'t flow by default.',
        duration: '35-45 min',
        cost: 'Free (VNets and peering are free)',
        difficulty: 'Advanced',
        prerequisites: ['Azure subscription', 'Resource group (e.g., rg-academy)'],
        cleanup: `Delete the resource group to remove all VNets and peerings: az group delete --name rg-hubspoke --yes`,
        steps: [
            {
                title: 'Create the Hub VNet',
                subtitle: 'Central network for shared services',
                type: 'confirm',
                explanation: 'The hub VNet is the central point of the architecture. It contains shared services like Azure Firewall, VPN Gateway, and Bastion. You\'ll create it with two subnets: AzureFirewallSubnet (required /26 for Firewall) and a shared services subnet.',
                portal: `<ol><li>Search for <strong>"Virtual networks"</strong> → click <strong>+ Create</strong></li><li>Resource group: <strong>rg-hubspoke</strong> (create new)</li><li>Name: <strong>vnet-hub</strong></li><li>Region: <strong>East US</strong></li><li>Address space: <strong>10.0.0.0/16</strong></li><li>Add subnet 1: Name: <strong>AzureFirewallSubnet</strong>, Range: <strong>10.0.1.0/26</strong></li><li>Add subnet 2: Name: <strong>snet-shared</strong>, Range: <strong>10.0.2.0/24</strong></li><li>Click <strong>Review + Create</strong> → <strong>Create</strong></li></ol>`,
                cli: `<div class="lab-code-block"># Create resource group\naz group create --name rg-hubspoke --location eastus\n\n# Create hub VNet\naz network vnet create \\\n    --resource-group rg-hubspoke \\\n    --name vnet-hub \\\n    --address-prefix 10.0.0.0/16 \\\n    --subnet-name AzureFirewallSubnet \\\n    --subnet-prefix 10.0.1.0/26\n\n# Add shared services subnet\naz network vnet subnet create \\\n    --resource-group rg-hubspoke \\\n    --vnet-name vnet-hub \\\n    --name snet-shared \\\n    --address-prefix 10.0.2.0/24</div>`,
                tip: 'The AzureFirewallSubnet name is required exactly as-is (case-sensitive) if you ever deploy Azure Firewall. It must be at least /26.',
                verification: 'VNet vnet-hub exists with address space 10.0.0.0/16 and two subnets: AzureFirewallSubnet (10.0.1.0/26) and snet-shared (10.0.2.0/24).'
            },
            {
                title: 'Create Spoke 1 — Production',
                subtitle: 'Isolated VNet for production workloads',
                type: 'confirm',
                explanation: 'Each spoke VNet is an isolated environment for a specific workload or team. The production spoke will host production application resources. It has its own address space that doesn\'t overlap with the hub or other spokes.',
                portal: `<ol><li>Create another VNet: <strong>+ Create</strong></li><li>Resource group: <strong>rg-hubspoke</strong></li><li>Name: <strong>vnet-spoke-prod</strong></li><li>Region: <strong>East US</strong> (same as hub)</li><li>Address space: <strong>10.1.0.0/16</strong></li><li>Add subnet: Name: <strong>snet-workload</strong>, Range: <strong>10.1.1.0/24</strong></li><li>Click <strong>Review + Create</strong> → <strong>Create</strong></li></ol>`,
                cli: `<div class="lab-code-block">az network vnet create \\\n    --resource-group rg-hubspoke \\\n    --name vnet-spoke-prod \\\n    --address-prefix 10.1.0.0/16 \\\n    --subnet-name snet-workload \\\n    --subnet-prefix 10.1.1.0/24</div>`,
                tip: 'Use non-overlapping address spaces: Hub=10.0.x.x, Spoke1=10.1.x.x, Spoke2=10.2.x.x. Overlapping addresses prevent peering.',
                verification: 'VNet vnet-spoke-prod exists with address space 10.1.0.0/16 and subnet snet-workload (10.1.1.0/24).'
            },
            {
                title: 'Create Spoke 2 — Dev/Test',
                subtitle: 'Isolated VNet for development and testing',
                type: 'confirm',
                explanation: 'The dev/test spoke separates non-production workloads from production. This prevents dev experiments from impacting prod and allows different security policies per environment.',
                portal: `<ol><li>Create another VNet: <strong>+ Create</strong></li><li>Resource group: <strong>rg-hubspoke</strong></li><li>Name: <strong>vnet-spoke-dev</strong></li><li>Region: <strong>East US</strong></li><li>Address space: <strong>10.2.0.0/16</strong></li><li>Add subnet: Name: <strong>snet-workload</strong>, Range: <strong>10.2.1.0/24</strong></li><li>Click <strong>Review + Create</strong> → <strong>Create</strong></li></ol>`,
                cli: `<div class="lab-code-block">az network vnet create \\\n    --resource-group rg-hubspoke \\\n    --name vnet-spoke-dev \\\n    --address-prefix 10.2.0.0/16 \\\n    --subnet-name snet-workload \\\n    --subnet-prefix 10.2.1.0/24</div>`,
                tip: 'In enterprise environments, spokes often live in separate subscriptions for billing isolation. Peering works cross-subscription.',
                verification: 'VNet vnet-spoke-dev exists with address space 10.2.0.0/16 and subnet snet-workload (10.2.1.0/24).'
            },
            {
                title: 'Peer Hub ↔ Spoke-Prod',
                subtitle: 'Create bidirectional VNet peering between hub and production spoke',
                type: 'confirm',
                explanation: 'VNet peering connects two VNets so resources in each can communicate directly via private IPs. You must create peering from BOTH sides (hub→spoke AND spoke→hub). Enable "Allow gateway transit" on the hub side so spokes can use the hub\'s VPN/ExpressRoute gateway.',
                portal: `<ol><li>Go to <strong>vnet-hub</strong> → <strong>Peerings</strong> → <strong>+ Add</strong></li><li>This VNet peering link name: <strong>hub-to-spoke-prod</strong></li><li>Remote VNet peering link name: <strong>spoke-prod-to-hub</strong></li><li>Remote virtual network: <strong>vnet-spoke-prod</strong></li><li>Check: <strong>Allow gateway transit</strong> on the hub side (for future VPN gateway)</li><li>Check: <strong>Use remote gateways</strong> on the spoke side (when a gateway exists)</li><li>Click <strong>Add</strong> — this creates both directions automatically</li></ol>`,
                cli: `<div class="lab-code-block"># Get VNet IDs\nHUB_ID=$(az network vnet show --resource-group rg-hubspoke --name vnet-hub --query id -o tsv)\nSPOKE_PROD_ID=$(az network vnet show --resource-group rg-hubspoke --name vnet-spoke-prod --query id -o tsv)\n\n# Create peering: Hub → Spoke-Prod\naz network vnet peering create \\\n    --resource-group rg-hubspoke \\\n    --name hub-to-spoke-prod \\\n    --vnet-name vnet-hub \\\n    --remote-vnet $SPOKE_PROD_ID \\\n    --allow-vnet-access \\\n    --allow-gateway-transit\n\n# Create peering: Spoke-Prod → Hub\naz network vnet peering create \\\n    --resource-group rg-hubspoke \\\n    --name spoke-prod-to-hub \\\n    --vnet-name vnet-spoke-prod \\\n    --remote-vnet $HUB_ID \\\n    --allow-vnet-access</div>`,
                tip: 'Peering must be created from both sides. The portal does this in one step, but CLI requires two separate commands.',
                verification: 'Both peering connections show status: Connected. Hub peering allows gateway transit.'
            },
            {
                title: 'Peer Hub ↔ Spoke-Dev',
                subtitle: 'Create bidirectional VNet peering between hub and dev spoke',
                type: 'confirm',
                explanation: 'Repeat the same peering process for the dev/test spoke. Each spoke peers independently with the hub.',
                portal: `<ol><li>Go to <strong>vnet-hub</strong> → <strong>Peerings</strong> → <strong>+ Add</strong></li><li>This VNet peering link name: <strong>hub-to-spoke-dev</strong></li><li>Remote VNet peering link name: <strong>spoke-dev-to-hub</strong></li><li>Remote virtual network: <strong>vnet-spoke-dev</strong></li><li>Check: <strong>Allow gateway transit</strong> on hub side</li><li>Check: <strong>Use remote gateways</strong> on spoke side</li><li>Click <strong>Add</strong></li></ol>`,
                cli: `<div class="lab-code-block">SPOKE_DEV_ID=$(az network vnet show --resource-group rg-hubspoke --name vnet-spoke-dev --query id -o tsv)\n\n# Create peering: Hub → Spoke-Dev\naz network vnet peering create \\\n    --resource-group rg-hubspoke \\\n    --name hub-to-spoke-dev \\\n    --vnet-name vnet-hub \\\n    --remote-vnet $SPOKE_DEV_ID \\\n    --allow-vnet-access \\\n    --allow-gateway-transit\n\n# Create peering: Spoke-Dev → Hub\naz network vnet peering create \\\n    --resource-group rg-hubspoke \\\n    --name spoke-dev-to-hub \\\n    --vnet-name vnet-spoke-dev \\\n    --remote-vnet $HUB_ID \\\n    --allow-vnet-access</div>`,
                tip: 'You now have a star topology: hub in the center, two spokes connected to it. This is the foundation of enterprise Azure networking.',
                verification: 'All 4 peering connections (2 per spoke pair) show status: Connected.'
            },
            {
                title: 'Verify the Topology',
                subtitle: 'Visualize your hub-spoke network in Network Watcher',
                type: 'confirm',
                explanation: 'Azure Network Watcher provides a visual topology view of your network resources. You\'ll see all three VNets and the peering connections between them — a clear visual confirmation of your hub-spoke architecture.',
                portal: `<ol><li>Search for <strong>"Network Watcher"</strong> in the portal</li><li>Click <strong>Topology</strong> in the left menu</li><li>Select subscription and resource group: <strong>rg-hubspoke</strong></li><li>You should see all 3 VNets with peering lines connecting spokes to the hub</li><li>Notice: there is NO line between spoke-prod and spoke-dev — they are not directly connected</li></ol>`,
                cli: `<div class="lab-code-block"># List all peerings to verify\naz network vnet peering list \\\n    --resource-group rg-hubspoke \\\n    --vnet-name vnet-hub \\\n    --output table\n\n# Check peering status\naz network vnet peering show \\\n    --resource-group rg-hubspoke \\\n    --vnet-name vnet-hub \\\n    --name hub-to-spoke-prod \\\n    --query peeringState</div>`,
                tip: 'Network Watcher Topology is a great tool for documentation and troubleshooting. Screenshot it for architecture reviews.',
                verification: 'Topology view shows 3 VNets: vnet-hub in the center, vnet-spoke-prod and vnet-spoke-dev connected to it via peering. No direct spoke-to-spoke connection.'
            },
            {
                title: 'Understand Non-Transitivity',
                subtitle: 'Why spoke-to-spoke traffic doesn\'t flow by default',
                type: 'confirm',
                explanation: 'VNet peering is NON-TRANSITIVE. Even though spoke-prod peers with hub, and hub peers with spoke-dev, spoke-prod CANNOT reach spoke-dev. Traffic doesn\'t "transit" through the hub automatically. To enable spoke-to-spoke communication, you need Azure Firewall (or NVA) in the hub plus User Defined Routes (UDRs) on spoke subnets pointing to the firewall.',
                portal: `<ol><li>Look at the topology: spoke-prod ↔ hub ↔ spoke-dev</li><li>Even though both spokes connect to the hub, a VM in spoke-prod (10.1.1.4) CANNOT ping a VM in spoke-dev (10.2.1.4)</li><li>This is by design — it provides security isolation between workloads</li><li>To enable spoke-to-spoke: deploy Azure Firewall in hub + create UDRs on spoke subnets with next-hop = Firewall IP</li><li>The Firewall then inspects and controls all inter-spoke traffic</li></ol>`,
                cli: `<div class="lab-code-block"># Peering is non-transitive!\n# spoke-prod ↔ hub ↔ spoke-dev\n# But spoke-prod ✗ spoke-dev\n\n# To enable spoke-to-spoke, you need:\n# 1. Azure Firewall in the hub\n# 2. UDR on spoke subnets:\n#    0.0.0.0/0 → VirtualAppliance (Firewall IP)\n# 3. Firewall rules allowing spoke-to-spoke traffic</div>`,
                tip: 'Non-transitivity is an AZ-104 exam favorite. Remember: A↔B and B↔C does NOT mean A can reach C.',
                verification: 'You understand that VNet peering is non-transitive and spoke-to-spoke communication requires Azure Firewall + UDRs.'
            },
            {
                title: 'Review: VNet Peering Non-Transitivity',
                subtitle: 'Key takeaway',
                type: 'confirm',
                explanation: 'VNet peering is non-transitive. If Spoke-Prod peers with Hub, and Hub peers with Spoke-Dev, Spoke-Prod still CANNOT reach Spoke-Dev. Traffic does not automatically flow through a peered VNet. To enable spoke-to-spoke communication, you must deploy Azure Firewall (or an NVA) in the hub and create User Defined Routes on spoke subnets pointing to the firewall.',
                portal: `<ol><li><strong>Non-transitive</strong> — A↔B and B↔C does NOT mean A can reach C</li><li>Each spoke can only reach the hub it is directly peered with</li><li>To enable spoke-to-spoke: deploy <strong>Azure Firewall</strong> in the hub VNet</li><li>Add <strong>UDRs</strong> on spoke subnets with next-hop = Firewall private IP</li><li>The Firewall inspects and controls all inter-spoke traffic — this is secure by design</li></ol>`
            }
        ]
    }
},

// ──────────────────────────────────────────────
// MODULE 15: AZ-104 Practice Scenarios
// ──────────────────────────────────────────────
{
    id: 'az104-practice',
    level: 300,
    title: 'AZ-104 Networking Scenarios',
    subtitle: 'Exam-style questions and real-world scenarios',
    icon: '📝',
    estimatedTime: '60m',
    learn: `
<div class="learn-section">
    <h2>AZ-104 Networking Topic Areas</h2>
    <p>The AZ-104 exam covers networking under "Configure and manage virtual networking" (25-30% of the exam). Key topics:</p>
    
    <div class="accordion">
        <div class="accordion-item">
            <div class="accordion-header" onclick="this.parentElement.classList.toggle('open')">Configure Virtual Networks</div>
            <div class="accordion-body">
                <ul>
                    <li>Create and configure VNets and subnets</li>
                    <li>Create and configure VNet peering</li>
                    <li>Configure private and public IP addresses</li>
                    <li>Configure user-defined routes (UDRs)</li>
                    <li>Configure Azure DNS (public and private zones)</li>
                </ul>
            </div>
        </div>
        <div class="accordion-item">
            <div class="accordion-header" onclick="this.parentElement.classList.toggle('open')">Secure Access to Virtual Networks</div>
            <div class="accordion-body">
                <ul>
                    <li>Create and configure NSGs and ASGs</li>
                    <li>Evaluate effective security rules</li>
                    <li>Configure Azure Firewall</li>
                    <li>Configure service endpoints and private endpoints</li>
                </ul>
            </div>
        </div>
        <div class="accordion-item">
            <div class="accordion-header" onclick="this.parentElement.classList.toggle('open')">Configure Load Balancing</div>
            <div class="accordion-body">
                <ul>
                    <li>Configure Azure Load Balancer (basic and standard)</li>
                    <li>Configure Application Gateway</li>
                    <li>Configure Azure Front Door</li>
                    <li>Troubleshoot load balancing</li>
                </ul>
            </div>
        </div>
        <div class="accordion-item">
            <div class="accordion-header" onclick="this.parentElement.classList.toggle('open')">Monitor Virtual Networking</div>
            <div class="accordion-body">
                <ul>
                    <li>Configure Network Watcher</li>
                    <li>Configure monitoring and diagnostics</li>
                    <li>Troubleshoot connectivity issues</li>
                    <li>Analyze NSG flow logs</li>
                </ul>
            </div>
        </div>
    </div>
</div>

<div class="learn-section">
    <h2>Key Numbers to Memorize</h2>
    <table class="content-table">
        <tr><th>Item</th><th>Value</th><th>Why It Matters</th></tr>
        <tr><td>Azure reserved IPs per subnet</td><td><strong>5</strong></td><td>/24 = 251 usable, /28 = 11 usable</td></tr>
        <tr><td>Health probe source IP</td><td><strong>168.63.129.16</strong></td><td>Must be allowed in NSG for LB probes</td></tr>
        <tr><td>Instance metadata IP</td><td><strong>169.254.169.254</strong></td><td>VM self-discovery (no auth needed)</td></tr>
        <tr><td>GatewaySubnet min size</td><td><strong>/27</strong></td><td>Microsoft recommended for VPN/ER gateways</td></tr>
        <tr><td>AzureBastionSubnet min size</td><td><strong>/26</strong></td><td>Required for Bastion deployment</td></tr>
        <tr><td>AzureFirewallSubnet min size</td><td><strong>/26</strong></td><td>Required for Azure Firewall</td></tr>
        <tr><td>Max VNets per subscription</td><td><strong>1000</strong></td><td>Soft limit, can be increased</td></tr>
        <tr><td>Max peerings per VNet</td><td><strong>500</strong></td><td>Hard limit</td></tr>
        <tr><td>Standard LB default</td><td><strong>Closed</strong></td><td>Requires NSG to allow ANY traffic</td></tr>
    </table>
</div>

<div class="learn-section">
    <h2>CLI Commands You Must Know</h2>
    <div class="code-block"># VNet & Subnet
az network vnet create --name vnet-prod --address-prefix 10.0.0.0/16
az network vnet subnet create --vnet-name vnet-prod --name snet-web --address-prefix 10.0.1.0/24

# NSG
az network nsg create --name nsg-web
az network nsg rule create --nsg-name nsg-web --name AllowHTTPS --priority 100 --access Allow --protocol Tcp --destination-port-ranges 443

# Public IP
az network public-ip create --name pip-lb --sku Standard --allocation-method Static

# Load Balancer
az network lb create --name lb-web --sku Standard --frontend-ip-name fe-ip --public-ip-address pip-lb

# DNS
az network dns zone create --name contoso.com
az network dns record-set a add-record --zone-name contoso.com --record-set-name www --ipv4-address 20.0.0.1

# Peering
az network vnet peering create --name peer-a-to-b --vnet-name vnet-a --remote-vnet /sub/.../vnet-b --allow-vnet-access

# Network Watcher
az network watcher test-ip-flow --vm vm-web --direction Inbound --protocol TCP --local 10.0.1.4:80 --remote 203.0.113.1:12345

# Front Door (afd = Azure Front Door)
az afd profile create --profile-name fd-prod --sku Standard_AzureFrontDoor
az afd endpoint create --profile-name fd-prod --endpoint-name ep-prod</div>
</div>

<div class="learn-section">
    <h2>Troubleshooting Flowchart</h2>
    <p>When a VM can't connect to something, follow this order:</p>
    <ol>
        <li><strong>Check NSG rules:</strong> Use Network Watcher → IP flow verify. Is traffic blocked?</li>
        <li><strong>Check effective routes:</strong> Use <code>az network nic show-effective-route-table</code>. Is there a UDR sending traffic to wrong next-hop?</li>
        <li><strong>Check DNS:</strong> Can the VM resolve the destination hostname? Test with <code>nslookup</code></li>
        <li><strong>Check service configuration:</strong> Is the destination service actually listening on that port?</li>
        <li><strong>Check subnet delegation:</strong> Some services require dedicated subnets (App Service, Container Instances)</li>
        <li><strong>Check SKU compatibility:</strong> Standard LB needs Standard PIP, Standard NSG</li>
    </ol>
</div>

<div class="learn-section">
    <h2>Common Exam Traps</h2>
    
    <div class="warning-box">
        <h4>⚠️ Trap #1: VNet Peering is Non-Transitive</h4>
        <p>If A↔B and B↔C, A cannot reach C unless A↔C peering exists. The exam loves testing this.</p>
    </div>

    <div class="warning-box">
        <h4>⚠️ Trap #2: NSG Priority Processing</h4>
        <p>Lower priority number = evaluated first. First match wins. A Deny at priority 100 blocks traffic even if there's an Allow at priority 200 for the same traffic.</p>
    </div>

    <div class="warning-box">
        <h4>⚠️ Trap #3: Azure Reserved IPs</h4>
        <p>Azure reserves 5 IPs per subnet (not 2). A /24 = 251 usable, not 254. A /28 = 11 usable, not 14.</p>
    </div>

    <div class="warning-box">
        <h4>⚠️ Trap #4: Standard vs Basic SKU</h4>
        <p>Standard LB + Standard Public IP + Standard NSG go together. You cannot mix Basic and Standard SKUs. Standard is closed by default (requires NSG).</p>
    </div>

    <div class="warning-box">
        <h4>⚠️ Trap #5: DNS Changes Require Restart</h4>
        <p>When you change DNS settings on a VNet, existing VMs need to renew DHCP lease (restart or ipconfig /renew) to pick up the new DNS servers.</p>
    </div>

    <div class="warning-box">
        <h4>⚠️ Trap #6: CNAME Cannot Be at Zone Apex</h4>
        <p>You cannot create a CNAME for contoso.com (zone apex). Use Azure DNS Alias records instead. Questions about pointing a naked domain to Azure services often test this.</p>
    </div>
</div>

<div class="learn-section">
    <h2>Decision Trees for the Exam</h2>
    
    <h3>Which Load Balancer?</h3>
    <ul>
        <li>Non-HTTP traffic? → <strong>Azure Load Balancer</strong></li>
        <li>Regional HTTP with URL routing? → <strong>Application Gateway</strong></li>
        <li>Global HTTP with CDN/WAF? → <strong>Azure Front Door</strong></li>
        <li>Global non-HTTP failover? → <strong>Traffic Manager</strong></li>
    </ul>

    <h3>Service Endpoint vs Private Endpoint?</h3>
    <ul>
        <li>Need to restrict Azure service access to your VNet? → Start with <strong>Service Endpoint</strong> (free)</li>
        <li>Need the service to have a private IP in your VNet? → <strong>Private Endpoint</strong></li>
        <li>Using Front Door Premium to connect privately? → <strong>Private Endpoint</strong></li>
    </ul>

    <h3>NSG vs Azure Firewall?</h3>
    <ul>
        <li>Simple IP/port filtering at subnet level? → <strong>NSG</strong></li>
        <li>FQDN filtering, centralized logging, threat intel? → <strong>Azure Firewall</strong></li>
        <li>Both? → Yes! Use NSGs for micro-segmentation + Firewall for centralized security</li>
    </ul>
</div>
`,
    diagrams: [],
    quiz: [
        {
            question: 'Scenario: You have VNet-A (10.0.0.0/16) peered with VNet-B (10.1.0.0/16), and VNet-B peered with VNet-C (10.2.0.0/16). A VM in VNet-A (10.0.1.4) tries to ping a VM in VNet-C (10.2.1.4). What happens?',
            options: ['Ping succeeds — peering is transitive', 'Ping fails — peering is non-transitive', 'Ping succeeds but with high latency', 'Ping fails because ICMP is blocked by default'],
            correct: 1,
            explanation: 'VNet peering is non-transitive. VNet-A can reach VNet-B, and VNet-B can reach VNet-C, but VNet-A cannot reach VNet-C without a direct peering (A↔C) or routing through a hub with UDRs.'
        },
        {
            question: 'Scenario: Your NSG has: Priority 100 — Allow TCP 443 from Internet. Priority 200 — Deny TCP 443 from 10.0.1.0/24. A request comes from 10.0.1.5 to port 443. Is it allowed?',
            options: ['Denied — the Deny rule for 10.0.1.0/24 blocks it', 'Allowed — Priority 100 matches first (Internet includes all IPs)', 'Depends on the source — 10.0.1.0/24 is private, not Internet', 'Denied — Deny rules always override Allow rules'],
            correct: 2,
            explanation: 'Tricky! The "Internet" service tag does NOT include private/VNet IPs. 10.0.1.5 comes from within the VNet, so it matches the "VirtualNetwork" tag, not "Internet". Priority 100 won\'t match. Priority 200 (Deny) will match. The request is denied.'
        },
        {
            question: 'You need to deploy a Standard Load Balancer. Which public IP SKU must you use?',
            options: ['Basic', 'Standard', 'Either Basic or Standard', 'No public IP needed'],
            correct: 1,
            explanation: 'Standard Load Balancer requires Standard SKU Public IP. You cannot mix Basic and Standard SKUs. This is a common exam question — remember: Standard goes with Standard.'
        },
        {
            question: 'You want to point the naked domain "contoso.com" to your Azure Front Door. What do you configure?',
            options: ['CNAME record at contoso.com', 'A record with Front Door IP', 'Alias record in Azure DNS pointing to Front Door endpoint', 'MX record to Front Door'],
            correct: 2,
            explanation: 'CNAME cannot be used at zone apex (contoso.com). A regular A record won\'t auto-update if Front Door IPs change. An Azure DNS Alias record pointing to the Front Door endpoint is the correct solution — it automatically resolves to the current IPs.'
        },
        {
            question: 'You create a /28 subnet in Azure. How many usable IP addresses do you get?',
            options: ['16', '14', '11', '13'],
            correct: 2,
            explanation: '/28 = 16 total addresses. Azure reserves 5 (first four + last one). 16 - 5 = 11 usable addresses.'
        },
        {
            question: 'An App Service needs to accept traffic ONLY from Azure Front Door. What should you configure?',
            options: ['Azure Firewall in front of App Service', 'Access Restrictions with AzureFrontDoor.Backend service tag + Front Door header check', 'Private Endpoint only', 'NSG on App Service subnet'],
            correct: 1,
            explanation: 'App Service Access Restrictions can filter by service tag (AzureFrontDoor.Backend) AND check the X-Azure-FDID header (Front Door instance ID) to ensure traffic comes only from YOUR Front Door, not any Front Door.'
        },
        {
            question: 'ExpressRoute provides a private connection to Azure. Is the traffic encrypted?',
            options: ['Yes, always encrypted with AES-256', 'No, but the connection is private so encryption is optional', 'Yes, using SSL/TLS', 'Only when paired with Azure Firewall'],
            correct: 1,
            explanation: 'ExpressRoute does NOT encrypt traffic by default. The circuit is private (doesn\'t cross the internet), but the data is not encrypted. For encryption, you can add IPsec VPN over ExpressRoute.'
        },
        {
            question: 'You have a VM with no public IP and no NAT Gateway. Outbound internet traffic uses Azure\'s default SNAT. What risk does this pose?',
            options: ['No risk — default SNAT always works', 'SNAT port exhaustion under high connection volume', 'Traffic is blocked entirely', 'DNS resolution fails'],
            correct: 1,
            explanation: 'Default SNAT provides a limited number of SNAT ports. Under high outbound connection volume, you may experience port exhaustion — connections fail. NAT Gateway solves this with 64,000+ ports per IP.'
        }
    ],
    interactive: [
        {
            type: 'flashcards',
            id: 'az104-flashcards',
            title: 'AZ-104 Rapid Review — Full Deck',
            cards: [
                { front: 'What is Network Watcher?', back: 'Azure\'s network monitoring and diagnostics tool. Features: IP flow verify (test NSG rules), connection troubleshoot, packet capture, NSG flow logs, topology view, VPN diagnostics.' },
                { front: 'What is Azure Bastion?', back: 'PaaS service for secure RDP/SSH access to VMs directly from the Azure portal — no public IP needed on the VM. Requires AzureBastionSubnet (/26). Developer SKU allows connection from native SSH/RDP clients.' },
                { front: 'What is a system route in Azure?', back: 'Azure automatically creates routes for VNet subnets, VNet peering, service endpoints, and the internet. System routes can be overridden by User Defined Routes (UDRs).' },
                { front: 'Can a subnet belong to multiple VNets?', back: 'No. A subnet exists within exactly one VNet. Subnets cannot span VNets. Each subnet gets a portion of the parent VNet\'s address space.' },
                { front: 'What is the effective security rule?', back: 'The combination of all NSG rules (subnet + NIC level) that apply to a specific network interface. You can use Network Watcher > Effective Security Rules or az network nic list-effective-nsg to see them.' },
                { front: 'What is IP flow verify?', back: 'A Network Watcher feature that tests whether a packet would be allowed or denied by NSG rules. You provide source IP, destination IP, port, and protocol — it tells you which rule allows or denies the traffic.' },
                { front: 'How many IPs does Azure reserve per subnet?', back: '5 addresses: x.x.x.0 (network), x.x.x.1 (default gateway), x.x.x.2 and x.x.x.3 (Azure DNS mapping), x.x.x.255 (broadcast). So /24 = 251 usable, /28 = 11 usable.' },
                { front: 'What IP address do health probes come from?', back: '168.63.129.16 — Azure\'s virtual public IP for platform services. Must be allowed in NSG for LB health probes, DHCP, DNS, and instance metadata to work.' },
                { front: 'Standard vs Basic Load Balancer?', back: 'Standard: zone-redundant, 99.99% SLA, closed by default (needs NSG), uses Standard PIP. Basic: single zone, no SLA, open by default, uses Basic PIP. Cannot mix SKUs. Basic is being retired.' },
                { front: 'What is a Service Endpoint?', back: 'Extends your VNet identity to Azure PaaS services. Traffic stays on MS backbone. The service keeps its public IP but adds a firewall rule to accept traffic only from your VNet. Free, quick to enable.' },
                { front: 'Service Endpoint vs Private Endpoint?', back: 'Service Endpoint: service keeps public IP, adds VNet firewall rule. Free. Private Endpoint: creates a NIC with private IP in your VNet. Service accessible via private IP only. Costs ~$7.50/mo.' },
                { front: 'What is an Application Security Group (ASG)?', back: 'Logical grouping of VMs by role (e.g., asg-webservers, asg-dbservers). Use in NSG rules instead of IP addresses. Makes rules dynamic — add a VM to an ASG and rules auto-apply.' },
                { front: 'CNAME at zone apex — allowed?', back: 'No! DNS standard prohibits CNAME records at the zone apex (e.g., contoso.com). For Azure, use an Alias record pointing to the Azure resource. Alias records auto-update when the target IP changes.' },
                { front: 'What is forced tunneling?', back: 'Routing all internet-bound traffic from Azure through on-premises firewall via VPN/ExpressRoute. Done with UDR: 0.0.0.0/0 → VNetGateway. Also used with Azure Firewall as next-hop.' },
                { front: 'NAT Gateway — what does it do?', back: 'Provides consistent, predictable outbound IPs for a subnet. Each public IP adds ~64,000 SNAT ports. Up to 16 IPs = 1M+ concurrent connections. Replaces unreliable default SNAT.' },
                { front: 'Does ExpressRoute encrypt traffic?', back: 'No! ExpressRoute is private (doesn\'t cross internet) but NOT encrypted. For encryption, configure IPsec VPN over ExpressRoute or use MACsec (hardware-level encryption at peering points).' }
            ]
        },
        {
            type: 'drag-drop',
            id: 'az104-lb-match',
            title: 'Match the Load Balancer to the Scenario',
            description: 'Drag each scenario to the correct Azure load balancing service.',
            items: ['Global HTTP with CDN & WAF', 'Regional TCP/UDP distribution', 'Regional HTTP with URL routing', 'DNS-based global failover', 'Internal API between subnets', 'HTTPS with cookie affinity'],
            targets: {
                'Azure Front Door': ['Global HTTP with CDN & WAF'],
                'Azure Load Balancer': ['Regional TCP/UDP distribution', 'Internal API between subnets'],
                'Application Gateway': ['Regional HTTP with URL routing', 'HTTPS with cookie affinity'],
                'Traffic Manager': ['DNS-based global failover']
            }
        }
    ],
    lab: {
        title: 'Hands-On: AZ-104 Full Scenario Lab',
        icon: '📝',
        scenario: 'Build a complete Azure networking environment from scratch — VNet with proper subnetting, NSG rules with correct priority ordering, Azure DNS private zone, and a Standard Load Balancer. This lab covers the most-tested AZ-104 networking topics in one hands-on exercise.',
        duration: '40-50 min',
        cost: 'Free (VNets, NSGs, DNS zones, and unattached LBs are free)',
        difficulty: 'Advanced',
        prerequisites: ['Azure subscription', 'Resource group', 'Basic familiarity with Azure CLI or Portal'],
        cleanup: `Delete the resource group to remove everything: az group delete --name rg-az104-lab --yes --no-wait`,
        steps: [
            {
                title: 'Scenario Setup — Create the Environment',
                subtitle: 'Create a VNet with exam-realistic subnetting',
                type: 'confirm',
                explanation: 'You\'ll create a VNet with three subnets matching a common AZ-104 exam scenario: a frontend subnet for web servers, a backend subnet for databases, and a GatewaySubnet for future VPN connectivity. Note the GatewaySubnet must be named exactly "GatewaySubnet" and is typically /27.',
                portal: `<ol><li>Create resource group: <strong>rg-az104-lab</strong>, region: <strong>East US</strong></li><li>Create VNet: name: <strong>vnet-exam</strong>, address space: <strong>10.10.0.0/16</strong></li><li>Add subnet 1: <strong>snet-frontend</strong> — <strong>10.10.1.0/24</strong></li><li>Add subnet 2: <strong>snet-backend</strong> — <strong>10.10.2.0/24</strong></li><li>Add subnet 3: <strong>GatewaySubnet</strong> — <strong>10.10.255.0/27</strong></li><li>Click <strong>Review + Create</strong> → <strong>Create</strong></li></ol>`,
                cli: `<div class="lab-code-block"># Create resource group\naz group create --name rg-az104-lab --location eastus\n\n# Create VNet with frontend subnet\naz network vnet create \\\n    --resource-group rg-az104-lab \\\n    --name vnet-exam \\\n    --address-prefix 10.10.0.0/16 \\\n    --subnet-name snet-frontend \\\n    --subnet-prefix 10.10.1.0/24\n\n# Add backend subnet\naz network vnet subnet create \\\n    --resource-group rg-az104-lab \\\n    --vnet-name vnet-exam \\\n    --name snet-backend \\\n    --address-prefix 10.10.2.0/24\n\n# Add GatewaySubnet\naz network vnet subnet create \\\n    --resource-group rg-az104-lab \\\n    --vnet-name vnet-exam \\\n    --name GatewaySubnet \\\n    --address-prefix 10.10.255.0/27</div>`,
                tip: 'GatewaySubnet is a reserved name in Azure — it must be exactly "GatewaySubnet" (case-sensitive). It\'s where VPN/ExpressRoute gateways are deployed. Minimum size: /27.',
                verification: 'VNet vnet-exam exists with 3 subnets: snet-frontend (10.10.1.0/24), snet-backend (10.10.2.0/24), and GatewaySubnet (10.10.255.0/27).'
            },
            {
                title: 'Configure NSG Rules',
                subtitle: 'Create NSGs with proper priority ordering — a key AZ-104 topic',
                type: 'confirm',
                explanation: 'NSG rules are evaluated by priority number (lower = evaluated first). First match wins. You\'ll create two NSGs: nsg-frontend allows HTTP/HTTPS from the internet, and nsg-backend allows SQL (port 1433) ONLY from the frontend subnet while denying all other internet traffic.',
                portal: `<ol><li>Create NSG 1: <strong>nsg-frontend</strong></li><li>Add inbound rule: Priority <strong>100</strong>, Source: Internet, Dest port: <strong>443</strong>, Protocol: TCP, Action: <strong>Allow</strong>, Name: AllowHTTPS</li><li>Add inbound rule: Priority <strong>110</strong>, Source: Internet, Dest port: <strong>80</strong>, Protocol: TCP, Action: <strong>Allow</strong>, Name: AllowHTTP</li><li>Associate nsg-frontend with <strong>snet-frontend</strong></li><li>Create NSG 2: <strong>nsg-backend</strong></li><li>Add inbound rule: Priority <strong>100</strong>, Source: <strong>10.10.1.0/24</strong>, Dest port: <strong>1433</strong>, Protocol: TCP, Action: <strong>Allow</strong>, Name: AllowSQL-FromFrontend</li><li>Add inbound rule: Priority <strong>200</strong>, Source: Internet, Dest port: <strong>*</strong>, Action: <strong>Deny</strong>, Name: DenyAllInternet</li><li>Associate nsg-backend with <strong>snet-backend</strong></li></ol>`,
                cli: `<div class="lab-code-block"># Create frontend NSG\naz network nsg create --resource-group rg-az104-lab --name nsg-frontend\n\n# Allow HTTPS (priority 100)\naz network nsg rule create \\\n    --resource-group rg-az104-lab --nsg-name nsg-frontend \\\n    --name AllowHTTPS --priority 100 \\\n    --source-address-prefixes Internet --destination-port-ranges 443 \\\n    --protocol Tcp --access Allow --direction Inbound\n\n# Allow HTTP (priority 110)\naz network nsg rule create \\\n    --resource-group rg-az104-lab --nsg-name nsg-frontend \\\n    --name AllowHTTP --priority 110 \\\n    --source-address-prefixes Internet --destination-port-ranges 80 \\\n    --protocol Tcp --access Allow --direction Inbound\n\n# Associate with frontend subnet\naz network vnet subnet update \\\n    --resource-group rg-az104-lab --vnet-name vnet-exam \\\n    --name snet-frontend --network-security-group nsg-frontend\n\n# Create backend NSG\naz network nsg create --resource-group rg-az104-lab --name nsg-backend\n\n# Allow SQL only from frontend subnet (priority 100)\naz network nsg rule create \\\n    --resource-group rg-az104-lab --nsg-name nsg-backend \\\n    --name AllowSQL-FromFrontend --priority 100 \\\n    --source-address-prefixes 10.10.1.0/24 --destination-port-ranges 1433 \\\n    --protocol Tcp --access Allow --direction Inbound\n\n# Deny all internet (priority 200)\naz network nsg rule create \\\n    --resource-group rg-az104-lab --nsg-name nsg-backend \\\n    --name DenyAllInternet --priority 200 \\\n    --source-address-prefixes Internet --destination-port-ranges "*" \\\n    --protocol "*" --access Deny --direction Inbound\n\n# Associate with backend subnet\naz network vnet subnet update \\\n    --resource-group rg-az104-lab --vnet-name vnet-exam \\\n    --name snet-backend --network-security-group nsg-backend</div>`,
                tip: 'AZ-104 trap: Priority 100 (Allow SQL from frontend) is evaluated BEFORE priority 200 (Deny Internet). Order matters! If you swapped priorities, SQL from frontend would be denied.',
                verification: 'nsg-frontend allows 443 and 80 from Internet. nsg-backend allows 1433 only from 10.10.1.0/24 and denies all other Internet traffic. Both NSGs are associated with their respective subnets.'
            },
            {
                title: 'Set Up Azure DNS',
                subtitle: 'Create a private DNS zone with auto-registration',
                type: 'confirm',
                explanation: 'Private DNS zones provide name resolution within your VNet without exposing DNS records to the internet. Auto-registration automatically creates DNS records for VMs deployed in linked VNets — so VMs can find each other by name (e.g., webserver1.exam.internal).',
                portal: `<ol><li>Search for <strong>"Private DNS zones"</strong></li><li>Click <strong>+ Create</strong></li><li>Resource group: <strong>rg-az104-lab</strong></li><li>Name: <strong>exam.internal</strong></li><li>Click <strong>Create</strong></li><li>After creation, go to <strong>Virtual network links</strong></li><li>Click <strong>+ Add</strong></li><li>Link name: <strong>link-vnet-exam</strong></li><li>Virtual network: <strong>vnet-exam</strong></li><li>Check: <strong>Enable auto registration</strong></li><li>Click <strong>OK</strong></li></ol>`,
                cli: `<div class="lab-code-block"># Create private DNS zone\naz network private-dns zone create \\\n    --resource-group rg-az104-lab \\\n    --name exam.internal\n\n# Link to VNet with auto-registration\naz network private-dns link vnet create \\\n    --resource-group rg-az104-lab \\\n    --zone-name exam.internal \\\n    --name link-vnet-exam \\\n    --virtual-network vnet-exam \\\n    --registration-enabled true</div>`,
                tip: 'With auto-registration enabled, any VM deployed in vnet-exam will automatically get a DNS record like vm-name.exam.internal. No manual DNS configuration needed!',
                verification: 'Private DNS zone exam.internal exists and is linked to vnet-exam with auto-registration enabled.'
            },
            {
                title: 'Create an Azure Load Balancer',
                subtitle: 'Deploy a Standard Load Balancer — the AZ-104 required SKU',
                type: 'confirm',
                explanation: 'The Standard Load Balancer is required for zone-redundancy, NSG-required backends, and SLA-backed availability. You\'ll create one with a frontend IP, backend pool, health probe, and load balancing rule. Remember: Standard LB requires Standard Public IP — you cannot mix SKUs.',
                portal: `<ol><li>Search for <strong>"Load balancers"</strong> → <strong>+ Create</strong></li><li>SKU: <strong>Standard</strong></li><li>Type: <strong>Public</strong></li><li>Name: <strong>lb-frontend</strong></li><li>Region: <strong>East US</strong></li><li>Frontend IP: Create new → Name: <strong>pip-lb</strong> (Standard SKU auto-selected)</li><li>Backend pool: <strong>bp-web</strong> → Associated to <strong>vnet-exam</strong></li><li>Health probe: <strong>hp-http</strong> → Protocol: HTTP, Port: <strong>80</strong>, Path: /</li><li>Load balancing rule: <strong>rule-http</strong> → Frontend port: <strong>80</strong>, Backend port: <strong>80</strong>, Backend pool: bp-web, Health probe: hp-http</li><li>Click <strong>Review + Create</strong> → <strong>Create</strong></li></ol>`,
                cli: `<div class="lab-code-block"># Create Standard Public IP\naz network public-ip create \\\n    --resource-group rg-az104-lab \\\n    --name pip-lb \\\n    --sku Standard \\\n    --allocation-method Static\n\n# Create Standard Load Balancer\naz network lb create \\\n    --resource-group rg-az104-lab \\\n    --name lb-frontend \\\n    --sku Standard \\\n    --frontend-ip-name fe-ip \\\n    --public-ip-address pip-lb \\\n    --backend-pool-name bp-web\n\n# Create health probe\naz network lb probe create \\\n    --resource-group rg-az104-lab \\\n    --lb-name lb-frontend \\\n    --name hp-http \\\n    --protocol Http \\\n    --port 80 \\\n    --path /\n\n# Create LB rule\naz network lb rule create \\\n    --resource-group rg-az104-lab \\\n    --lb-name lb-frontend \\\n    --name rule-http \\\n    --frontend-ip-name fe-ip \\\n    --backend-pool-name bp-web \\\n    --probe-name hp-http \\\n    --protocol Tcp \\\n    --frontend-port 80 \\\n    --backend-port 80</div>`,
                tip: 'AZ-104 key rule: Standard LB requires Standard Public IP. Basic LB uses Basic Public IP. You CANNOT mix SKUs. The exam tests this frequently.',
                verification: 'Standard Load Balancer lb-frontend exists with a Standard Public IP, backend pool, HTTP health probe on port 80, and a load balancing rule.'
            },
            {
                title: 'Verify Effective Security Rules',
                subtitle: 'Use CLI to check what rules actually apply',
                type: 'confirm',
                explanation: 'Effective security rules show the combined result of all NSG rules (subnet-level + NIC-level) that apply to a specific network interface. This is a critical troubleshooting skill for the AZ-104 exam. You can also use Network Watcher\'s IP Flow Verify to test if specific traffic would be allowed or denied.',
                portal: `<ol><li>If you have a VM NIC, go to: <strong>Network interface</strong> → <strong>Effective security rules</strong></li><li>Or use <strong>Network Watcher</strong> → <strong>IP flow verify</strong> to test specific traffic flows</li><li>Concept check: Frontend allows HTTP/HTTPS from Internet ✓</li><li>Concept check: Backend allows SQL 1433 from frontend subnet only ✓</li><li>Concept check: Backend denies all other Internet traffic ✓</li></ol>`,
                cli: `<div class="lab-code-block"># If you have a NIC, check effective rules:\n# az network nic list-effective-nsg \\\n#     --resource-group rg-az104-lab \\\n#     --name your-nic-name\n\n# Verify NSG rules are correct:\naz network nsg rule list \\\n    --resource-group rg-az104-lab \\\n    --nsg-name nsg-frontend \\\n    --output table\n\naz network nsg rule list \\\n    --resource-group rg-az104-lab \\\n    --nsg-name nsg-backend \\\n    --output table</div>`,
                tip: 'On the AZ-104 exam, "effective security rules" questions test whether you understand NSG rule evaluation order and how subnet + NIC NSGs combine.',
                verification: 'You can list NSG rules and understand the effective security posture: frontend allows web traffic, backend is locked down to SQL from frontend only.'
            },
            {
                title: 'Clean Up and Review',
                subtitle: 'Delete resources and review key exam topics',
                type: 'confirm',
                explanation: 'Delete the resource group to clean up all resources. Then review the key AZ-104 networking topics this lab covered: VNet/subnet design and CIDR planning, NSG rules with priority ordering, Private DNS zones with auto-registration, Standard Load Balancer SKU requirements, and effective security rule evaluation.',
                portal: `<ol><li>Go to <strong>Resource groups</strong> → <strong>rg-az104-lab</strong></li><li>Click <strong>Delete resource group</strong></li><li>Type the name to confirm → <strong>Delete</strong></li><li><strong>Key exam topics covered:</strong></li><li>✅ VNet creation with proper subnet sizing (including reserved IPs)</li><li>✅ NSG rules — priority ordering, first-match-wins</li><li>✅ Private DNS zones — auto-registration for VMs</li><li>✅ Standard LB — requires Standard Public IP (no SKU mixing)</li><li>✅ GatewaySubnet — reserved name, minimum /27</li></ol>`,
                cli: `<div class="lab-code-block"># Delete everything\naz group delete --name rg-az104-lab --yes --no-wait\n\n# Key AZ-104 topics covered:\n# 1. VNet/Subnet design — CIDR planning, Azure reserves 5 IPs per subnet\n# 2. NSG rules — lower priority number = evaluated first, first match wins\n# 3. Private DNS zones — auto-registration links VMs to DNS automatically\n# 4. Standard LB — requires Standard Public IP, closed by default (needs NSG)\n# 5. GatewaySubnet — exact name required, minimum /27 for VPN Gateway</div>`,
                tip: 'For the exam, remember these gotchas: Azure reserves 5 IPs per subnet (not 2), Standard LB is closed by default (must add NSG), CNAME cannot be at zone apex, and VNet peering is non-transitive.',
                verification: 'Resource group deletion is in progress. You\'ve reviewed all key AZ-104 networking topics.'
            },
            {
                title: 'Review: Load Balancer SKU Matching',
                subtitle: 'Key takeaway',
                type: 'confirm',
                explanation: 'A Standard Load Balancer requires a Standard SKU Public IP address — you cannot mix Basic and Standard SKUs. This is one of the most frequently tested AZ-104 concepts. Standard LB is also closed by default (requires an NSG to allow traffic), unlike Basic LB which is open by default.',
                portal: `<ol><li><strong>Standard LB requires Standard Public IP</strong> — SKU mixing is not allowed</li><li>Standard LB is <strong>closed by default</strong> — you must add NSG rules to allow traffic</li><li>Basic LB is open by default but lacks zone redundancy and SLA</li><li>Standard is required for Availability Zones and cross-VNet backends</li><li>This is a top AZ-104 exam question — always match SKUs</li></ol>`
            }
        ]
    }
}

];
