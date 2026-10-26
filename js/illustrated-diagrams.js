/* Module-first illustrations. Icon artwork and architecture compositions restored
   from 09b3f09; packet direction, scenarios and explanations use DiagramCatalog.
   Deliberately separate from DiagramEngine, which still owns the short course. */
const IllustratedDiagrams = {
    serial: 0,
    instances: new Map(),
    panObservers: new Map(),

    escapeHtml(value) {
        return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    },

    normalize(definition) {
        const input = typeof definition === 'string' ? { type: definition } : definition || {};
        const requested = input.type || input.model;
        const type = requested === 'network-watcher' ? 'nwatcher' : requested;
        if (!Object.hasOwn(DiagramCatalog.models, type)) throw new Error(`Unknown illustrated diagram: ${type}`);
        const options = { ...input.options, level: 'detailed' };
        for (const key of ['scenario', 'tier', 'connection', 'originKind']) {
            if (input[key] !== undefined && input[key] !== '') options[key] = input[key];
        }
        if (type === 'hub-spoke-capstone' && !options.scenario) options.scenario = 'private-origin';
        const model = DiagramCatalog.resolve(type, options);
        return { type, title: input.title || model.title, model };
    },

    // Compact, Azure-like service glyphs from the original hand-drawn diagrams.
    // They are teaching illustrations, not official Azure architecture assets.
    icons: {
        vm: '<rect x="-14" y="-14" width="28" height="22" rx="2"/><rect x="-10" y="-10" width="20" height="14" rx="1" class="icon-light"/><path d="M-4 10h8v3h-8zM-8 13h16v2h-16z"/>',
        vnet: '<rect x="-16" y="-16" width="32" height="32" rx="3"/><path d="M-8-8H8V8H-8zM-4-4H4V4H-4zM0-8v4M0 4v4M-8 0h4M4 0h4" class="icon-line"/>',
        firewall: '<rect x="-14" y="-14" width="28" height="28" rx="2"/><path d="M0-8 6 0H4V8H-4V0H-6Z" class="icon-white"/>',
        gateway: '<rect x="-14" y="-14" width="28" height="28" rx="2"/><path d="M-6-5 0-10 6-5V4H-6Z" class="icon-white"/><rect x="-3" y="-1" width="6" height="5"/>',
        nsg: '<circle r="14"/><path d="M-3-7v7H5M3 7V0H-5" class="icon-line"/>',
        loadbalancer: '<rect x="-14" y="-14" width="28" height="28" rx="2"/><circle cy="-2" r="6" class="icon-line"/><path d="M-4-2H4M0-6V2M-8 7H8" class="icon-line"/>',
        frontdoor: '<rect x="-16" y="-16" width="32" height="32" rx="3"/><path d="M-8-8 0-12 8-8V8H-8Z" class="icon-light"/><rect x="-3" y="-2" width="6" height="10" rx="1"/><circle cx="1" cy="3" r="1" class="icon-white"/>',
        dns: '<rect x="-15" y="-15" width="30" height="30" rx="3"/><text x="0" y="4" text-anchor="middle" class="icon-word">DNS</text>',
        storage: '<path d="M-15-12H15V12H-15Z"/><path d="M-11-7H11M-11-1H11M-11 5H11" class="icon-line"/><circle cx="8" cy="9" r="1" class="icon-white"/>',
        sql: '<path d="M-14-10V10C-14 18 14 18 14 10V-10Z"/><ellipse cy="-10" rx="14" ry="5" class="icon-light"/><path d="M-14 0C-14 8 14 8 14 0" class="icon-line"/>',
        user: '<circle cy="-8" r="7"/><path d="M-13 14V7C-13-3 13-3 13 7V14Z"/>',
        internet: '<circle r="16" class="icon-outline"/><ellipse rx="7" ry="16" class="icon-outline"/><path d="M-16 0H16M-13-9H13M-13 9H13" class="icon-outline"/>',
        waf: '<path d="M0-18 15-11V1C15 10 5 16 0 19C-5 16-15 10-15 1V-11Z"/><path d="m-7 0 5 6 10-12" class="icon-line"/>',
        onprem: '<path d="M-16 16V-12H4V16M4-5H16V16Z"/><path d="M-11-7H-7M-3-7H1M-11 0H-7M-3 0H1M-11 7H-7M-3 7H1M8 1H12M8 8H12" class="icon-line"/>',
        route: '<path d="M-15-3H3V-12L17 0 3 12V3H-15Z"/>',
        lock: '<path d="M-9-3V-9A9 9 0 0 1 9-9V-3" class="icon-outline"/><rect x="-13" y="-4" width="26" height="22" rx="3"/><path d="M0 3V11" class="icon-line"/>',
        watcher: '<path d="M-20 0Q0-25 20 0Q0 25-20 0Z" class="icon-outline"/><circle r="7"/>'
    },

    iconType(node) {
        const key = `${node.id} ${node.label}`.toLowerCase();
        if (/firewall/.test(key)) return 'firewall';
        if (/front door|^afd /.test(key)) return 'frontdoor';
        if (/waf/.test(key)) return 'waf';
        if (/nsg|applicable.*rules/.test(key)) return 'nsg';
        if (/tls|connection|private.*endpoint|managed-pe/.test(key)) return 'lock';
        if (/dns|resolver|root server|tld|authoritative/.test(key)) return 'dns';
        if (/bastion|gateway|vpn device|private.peering/.test(key)) return 'gateway';
        if (/balancer|^ilb /.test(key)) return 'loadbalancer';
        if (/sql|database/.test(key)) return 'sql';
        if (/cache|storage/.test(key)) return 'storage';
        if (/internet|external|global network/.test(key)) return 'internet';
        if (/on-prem|provider|office/.test(key)) return 'onprem';
        if (/browser|client|admin|operator|device|requirement/.test(key)) return 'user';
        if (/vnet|hub|tenant|management|subscription|resource group|zone/.test(key)) return 'vnet';
        if (/watcher|verify|result/.test(key)) return 'watcher';
        if (/route|rules|selection|decision|pls/.test(key)) return 'route';
        return 'vm';
    },

    wrap(value, width = 27) {
        const words = String(value || '').split(/\s+/);
        return words.reduce((lines, word) => {
            const last = lines.length - 1;
            if (last >= 0 && `${lines[last]} ${word}`.length <= width) lines[last] += ` ${word}`;
            else lines.push(word);
            return lines;
        }, []);
    },

    text(value, x, y, className, width = 27) {
        return `<text x="${x}" y="${y}" text-anchor="middle" class="${className}">${this.wrap(value, width)
            .map((line, i) => `<tspan x="${x}" dy="${i ? 16 : 0}">${this.escapeHtml(line)}</tspan>`).join('')}</text>`;
    },

    /* Coordinates describe a teaching composition, not rack locations or latency.
       Each original subject keeps its own composition instead of generic path boxes. */
    layouts: {
        'dns-resolution': { client: [120, 320], resolver: [430, 320], root: [800, 110], tld: [800, 320], authoritative: [800, 530] },
        'packet-journey': { client: [130, 150], router: [450, 150], internet: [450, 410], vm: [800, 410] },
        'vnet-architecture': { web: [170, 210], app: [490, 210], database: [810, 210] },
        'nsg-filtering': { client: [130, 150], 'subnet-nsg': [440, 150], 'nic-nsg': [770, 150], vm: [770, 420] },
        'load-balancer': { client: [140, 240], lb: [450, 240], backend: [800, 240] },
        'vpn-tunnel': { office: [150, 160], device: [390, 160], gateway: [640, 400], vm: [870, 400] },
        'expressroute': { office: [120, 160], provider: [410, 160], 'private-peering': [740, 160], gateway: [740, 410], vm: [410, 410], microsoft: [900, 410] },
        'vnet-peering': { a: [150, 240], hub: [480, 240], b: [810, 240] },
        bastion: { admin: [140, 240], bastion: [460, 240], vm: [800, 240] },
        natgw: { vm: [150, 240], nat: [480, 240], internet: [810, 240] },
        udr: { vm: [140, 150], decision: [140, 420], firewall: [480, 300], internet: [820, 300] },
        'hub-spoke': { 'spoke-a': [140, 270], hub: [480, 130], firewall: [480, 380], 'spoke-b': [820, 270] },
        firewall: { 'spoke-a': [140, 270], hub: [480, 130], firewall: [480, 380], 'spoke-b': [820, 270] },
        'hub-spoke-capstone': { 'spoke-a': [140, 270], hub: [480, 130], firewall: [480, 380], 'spoke-b': [820, 270] },
        nwatcher: { operator: [150, 130], tool: [480, 130], rules: [820, 130], result: [480, 420] },
        'azure-regions': { network: [130, 140], 'zone-a': [470, 140], 'zone-b': [470, 390], recovery: [820, 390] },
        'azure-hierarchy': { tenant: [150, 140], mg: [480, 140], subscription: [480, 350], rg: [480, 560], resource: [820, 560] },
        'frontdoor-private-link': { client: [130, 130], afd: [450, 130], 'managed-pe': [450, 390], pls: [800, 130], ilb: [800, 360], vm: [800, 590], app: [800, 390] }
    },

    scene(definition) {
        const { type, model } = definition;
        const isAfd = ['afd-request', 'frontdoor-routing', 'frontdoor-rules-engine', 'frontdoor-caching', 'waf-inspection'].includes(type);
        const positions = type === 'hub-spoke-capstone' && model.settings.scenario === 'private-origin' ? {
            client: [150, 140], tls: [460, 140], waf: [790, 140],
            'managed-pe': [460, 380], pls: [1100, 140], ilb: [1100, 380],
            'spoke-a': [1100, 620], firewall: [790, 620], 'spoke-b': [460, 620],
            'sql-pe': [460, 860], sql: [790, 860]
        } : isAfd ? {
            client: [115, 160], dns: [115, 425], edge: [360, 160],
            tls: [365, 160], waf: [665, 160], route: [665, 380], rules: [365, 380],
            cache: [365, 600], selection: [665, 600], 'origin-tls': [975, 380],
            origin: [975, 600], 'managed-pe': [975, 160], pls: [1200, 160],
            ilb: [1200, 380], vm: [1200, 600]
        } : this.layouts[type] || {};
        const nodes = model.nodes.map(node => {
            const [x, y] = positions[node.id] || [150 + node.col * 320, 140 + node.row * 215];
            return { ...node, x, y };
        });
        const width = Math.max(980, ...nodes.map(node => node.x + 155));
        const height = Math.max(440, ...nodes.map(node => node.y + 175));
        return { nodes, width, height, isAfd };
    },

    boundary(x, y, width, height, label, kind = '') {
        return `<g class="illustrated-boundary ${kind}"><rect x="${x}" y="${y}" width="${width}" height="${height}" rx="10"/>
            <text x="${x + 16}" y="${y + 25}" class="illustrated-boundary-label">${this.escapeHtml(label)}</text>
            ${kind === 'edge-boundary' ? `<g data-icon="frontdoor" class="illustrated-glyph" transform="translate(${x + width - 26} ${y + 23}) scale(.65)">${this.icons.frontdoor}</g>` : ''}</g>`;
    },

    boundaries(definition, scene) {
        const { type, model } = definition;
        if (type === 'vnet-architecture') {
            return this.boundary(20, 25, 940, 375, 'VNet: production-vnet · 10.0.0.0/16') +
                ['Web subnet · 10.0.1.0/24', 'App subnet · 10.0.2.0/24', 'Data subnet · 10.0.3.0/24']
                    .map((label, index) => this.boundary(40 + index * 320, 85, 260, 275, label, 'subnet')).join('');
        }
        if (type === 'vnet-peering') {
            return scene.nodes.filter(node => ['a', 'hub', 'b'].includes(node.id))
                .map(node => this.boundary(node.x - 125, 100, 250, 280, `${node.label} · separate address space`, 'subnet')).join('');
        }
        return model.groups.map(group => {
            const members = scene.nodes.filter(node => node.group === group.id);
            if (!members.length) return '';
            const left = Math.min(...members.map(node => node.x)) - 120;
            const top = Math.min(...members.map(node => node.y)) - 80;
            const right = Math.max(...members.map(node => node.x)) + 125;
            const bottom = Math.max(...members.map(node => node.y)) + 130;
            const label = group.label.length > 39 ? group.label.split(' / ')[0] : group.label;
            return this.boundary(left, top, right - left, bottom - top, label, group.id === 'edge' ? 'edge-boundary' : '');
        }).join('');
    },

    nodeSvg(node) {
        const icon = this.iconType(node);
        const labelLines = this.wrap(node.label);
        return `<g class="illustrated-node${node.inactive ? ' is-context' : ''}" data-item="${this.escapeHtml(node.id)}" data-icon="${icon}" transform="translate(${node.x} ${node.y})">
            <title>${this.escapeHtml(`${node.label}: ${node.detail}`)}</title>
            <rect x="-43" y="-29" width="86" height="58" rx="5" class="illustrated-icon-card"/>
            <g class="illustrated-glyph">${this.icons[icon]}</g>
            ${this.text(node.label, 0, 52, 'illustrated-node-label')}
            ${this.text(node.detail, 0, 58 + labelLines.length * 16, 'illustrated-node-detail', 31)}
        </g>`;
    },

    edgeGeometry(edge, nodes, edges) {
        const from = nodes.find(node => node.id === edge.from);
        const to = nodes.find(node => node.id === edge.to);
        const dx = to.x - from.x, dy = to.y - from.y;
        const length = Math.hypot(dx, dy) || 1;
        const ux = dx / length, uy = dy / length;
        const samePair = edges.filter(item => [edge.from, edge.to].includes(item.from) && [edge.from, edge.to].includes(item.to));
        const bend = samePair.length > 1 ? 45 + samePair.indexOf(edge) * 12 : 0;
        const start = [from.x + ux * 60, from.y + uy * 38];
        const end = [to.x - ux * 60, to.y - uy * 38];
        // Downward connectors leave beside the caption rather than through it.
        if (Math.abs(dx) < 90 && dy !== 0) {
            start[0] += 80; end[0] += 80;
            start[1] = from.y; end[1] = to.y;
        }
        const cx = (start[0] + end[0]) / 2 - uy * bend;
        const cy = (start[1] + end[1]) / 2 + ux * bend;
        return {
            path: `M ${start.join(' ')} Q ${cx} ${cy} ${end.join(' ')}`,
            x: (start[0] + 2 * cx + end[0]) / 4,
            y: (start[1] + 2 * cy + end[1]) / 4
        };
    },

    edgeSvg(edge, index, geometry, instance) {
        const kind = ['response', 'config', 'blocked'].includes(edge.kind) ? edge.kind : 'request';
        return `<g class="illustrated-edge ${kind}" data-item="${this.escapeHtml(edge.id)}" data-from="${this.escapeHtml(edge.from)}" data-to="${this.escapeHtml(edge.to)}">
            <title>${this.escapeHtml(edge.label)}</title>
            <path d="${geometry.path}" marker-end="url(#${instance}-${kind})"/>
            <g class="illustrated-edge-number" transform="translate(${geometry.x} ${geometry.y})"><circle r="11"/><text y="4" text-anchor="middle">${index + 1}</text></g>
        </g>`;
    },

    sequenceSvg(definition, instance) {
        const nodes = definition.model.nodes.map((node, i) => ({ ...node, x: i ? 790 : 160, y: 90 }));
        const height = 250 + definition.model.edges.length * 80;
        const lines = nodes.map(node => `<line class="illustrated-lifeline" x1="${node.x}" y1="200" x2="${node.x}" y2="${height - 35}"/>`).join('');
        const edges = definition.model.edges.map((edge, i) => {
            const from = nodes.find(node => node.id === edge.from), to = nodes.find(node => node.id === edge.to);
            const y = 235 + i * 80;
            return this.edgeSvg(edge, i, { path: `M ${from.x} ${y} L ${to.x} ${y + 25}`, x: 475, y: y + 12 }, instance) +
                this.text(edge.label, 475, y - 15, 'illustrated-node-label', 60);
        }).join('');
        return { content: lines + edges + nodes.map(node => this.nodeSvg(node)).join(''), width: 980, height };
    },

    osiSvg(definition) {
        const colors = ['#9d2449', '#75429a', '#9b4c13', '#955c00', '#166534', '#0078d4', '#004578'];
        const content = definition.model.nodes.map((node, i) => {
            const y = 60 + i * 95;
            return `<g class="illustrated-layer" data-item="${this.escapeHtml(node.id)}">
                <rect x="35" y="${y}" width="280" height="75" rx="6" fill="${colors[i]}"/>
                ${this.text(node.label, 175, y + 33, 'illustrated-layer-name', 23)}
                <rect x="340" y="${y}" width="600" height="75" rx="6" fill="#f1f5f9" stroke="#cbd5e1"/>
                ${this.text(node.detail, 640, y + 31, 'illustrated-node-label', 66)}
            </g>`;
        }).join('');
        return { content, width: 980, height: 750 };
    },

    svg(definition, instance) {
        const scene = this.scene(definition);
        let drawing = {
            ...scene,
            content: this.boundaries(definition, scene) +
                definition.model.edges.map((edge, i) => this.edgeSvg(edge, i, this.edgeGeometry(edge, scene.nodes, definition.model.edges), instance)).join('') +
                scene.nodes.map(node => this.nodeSvg(node)).join('')
        };
        if (definition.type === 'tcp-handshake') drawing = this.sequenceSvg(definition, instance);
        if (definition.type === 'osi-model') drawing = this.osiSvg(definition);
        const markers = ['request', 'response', 'config', 'blocked'].map(kind =>
            `<marker id="${instance}-${kind}" class="illustrated-marker ${kind}" markerWidth="9" markerHeight="9" refX="8" refY="4" orient="auto" markerUnits="userSpaceOnUse"><path d="M0 0L8 4L0 8Z"/></marker>`).join('');
        return `<svg class="illustrated-svg" style="--illustrated-natural-width:${drawing.width}px" viewBox="0 0 ${drawing.width} ${drawing.height}" role="img" aria-labelledby="${instance}-title ${instance}-desc">
            <title id="${instance}-title">${this.escapeHtml(definition.title)}</title>
            <desc id="${instance}-desc">${this.escapeHtml(definition.model.scenarioSummary)} Complete architecture; numbered arrows are listed below. This is a conceptual illustration, not a physical appliance chain.</desc>
            <defs>${markers}</defs>${drawing.content}</svg>`;
    },

    notes: {
        'vnet-architecture': 'Subnet outlines show address-space membership, not extra packet hops. NSGs and effective routes must permit each tier-to-tier call.',
        'load-balancer': 'The backend icon represents the eligible backend pool. Azure Load Balancer handles TCP/UDP flows; Application Gateway provides regional HTTP-aware routing.',
        'azure-regions': 'Zone and region separation are failure-domain concepts. Replication and failover require an explicit service-specific design.',
        natgw: 'SNAT changes the source address and port for outbound flows. Return traffic needs a matching connection mapping. SNAT capacity is finite.',
        firewall: 'Basic, Standard and Premium have different capacities and capabilities. Premium adds TLS inspection and IDPS; Basic is not restricted to dev/test.',
        'hub-spoke-capstone': 'Follow the selected configured path. Client HTTPS, origin HTTPS, application calls and SQL connections are separate connections. Management services such as Bastion and VPN are not packet hops in the application request.',
        'frontdoor-routing': 'Standard/Premium uses DNS and a Traffic Manager-selected PoP. Origin selection is a separate decision; it is not simply the geographically nearest origin.',
        'frontdoor-rules-engine': 'For HTTPS, client TLS termination precedes WAF inspection. Rule Set actions apply to the matched route; a redirect can end the request without contacting an origin.',
        'frontdoor-caching': 'Cache hits, misses and response eligibility are different decisions. A fresh cache hit returns to the client without fetching the origin.',
        'waf-inspection': 'These are Front Door request-processing stages, not separate deployed appliances. Detection logs a match; configured Prevention actions may terminate a request.',
        'nsg-filtering': 'Default inbound rules include AllowVNetInBound and AllowAzureLoadBalancerInBound before DenyAllInBound. Lowest priority number wins; both subnet and NIC policy apply.',
        expressroute: 'Private connectivity is not encryption. Redundant connections and BGP configuration are part of the design; end-to-end resilience still needs testing.',
        'vnet-peering': 'Dashed lines represent configured peering, not automatic transit. A↔Hub plus Hub↔B does not automatically provide A↔B connectivity.',
        bastion: 'The browser connects to Bastion over HTTPS; Bastion reaches the private VM over the configured SSH/RDP path. The VM does not need a public IP.',
        'vpn-tunnel': 'The VPN devices terminate the IPsec/IKE tunnel. The public internet carries encrypted tunnel traffic; the gateway is not an application proxy.'
    },

    tables(model) {
        const presentation = model.presentation || {};
        return `${presentation.packet ? `<p class="illustrated-packet">${this.escapeHtml(presentation.packet)}</p>` : ''}` +
            (presentation.tables || []).map(table => `<div class="illustrated-table-scroll" tabindex="0" role="region" aria-label="${this.escapeHtml(table.caption)}"><table>
                <caption>${this.escapeHtml(table.caption)}</caption><thead><tr>${table.columns.map(column => `<th scope="col">${this.escapeHtml(column)}</th>`).join('')}</tr></thead>
                <tbody>${table.rows.map(row => `<tr>${row.cells.map(cell => `<td>${this.escapeHtml(cell)}</td>`).join('')}</tr>`).join('')}</tbody>
            </table></div>`).join('') +
            (presentation.note ? `<p class="illustrated-note">${this.escapeHtml(presentation.note)}</p>` : '');
    },

    html(definition, { preview = false } = {}) {
        const instance = `illustrated-${++this.serial}`;
        const { model } = definition;
        return `<section class="illustrated-diagram${preview ? ' illustrated-preview' : ''}" data-illustrated-instance="${instance}" aria-labelledby="${instance}-heading">
            <header><p class="illustrated-kicker">${this.escapeHtml(model.scenarioLabel)}</p><h3 id="${instance}-heading">${this.escapeHtml(definition.title)}</h3>
            <p>${this.escapeHtml(model.scenarioSummary)}</p></header>
            ${preview ? '' : `
                <div class="illustrated-controls" role="group" aria-label="Architecture walkthrough">
                    <button type="button" data-illustrated-action="previous" disabled>Previous</button>
                    <button type="button" data-illustrated-action="step">Step</button>
                    <button type="button" data-illustrated-action="reset">Reset</button>
                </div><p class="illustrated-status" role="status" aria-live="polite">Complete architecture — use Step to highlight one part. Nothing is hidden.</p>`}
            <p class="illustrated-pan-hint" id="${instance}-pan-hint" hidden><strong>More architecture to the right.</strong> Swipe left or scroll horizontally to explore. With a keyboard, focus the diagram and use the left and right arrow keys.</p>
            <div class="illustrated-map" tabindex="0" role="region" aria-label="Architecture: ${this.escapeHtml(definition.title)}">${this.svg(definition, instance)}</div>
            <p class="illustrated-legend"><span>Solid blue: request / forward flow</span><span>Green: response</span><span>Dashed: configuration / control</span></p>
            ${preview ? '<p class="illustrated-note">Complete architecture. Open the module diagram for step controls and the full trace.</p>' : ''}
            ${this.notes[definition.type] ? `<p class="illustrated-note">${this.escapeHtml(this.notes[definition.type])}</p>` : ''}
            <details class="illustrated-connections"><summary>Numbered connections (${model.edges.length})</summary><ol>${model.edges.map(edge =>
                `<li><strong>${this.escapeHtml(model.nodes.find(node => node.id === edge.from).label)} → ${this.escapeHtml(model.nodes.find(node => node.id === edge.to).label)}</strong>: ${this.escapeHtml(edge.label)} <span>(${this.escapeHtml(edge.kind)})</span></li>`).join('')}</ol></details>
            ${preview ? '' : `<div class="illustrated-explanation"><h4>Ordered explanation</h4><ol>${model.steps.map((step, i) =>
                `<li data-illustrated-step="${i}"><strong>${this.escapeHtml(step.title)}</strong><p>${this.escapeHtml(step.text)}</p></li>`).join('')}</ol></div>
                ${this.tables(model)}`}
            <p class="illustrated-limit"><strong>Scope and limits.</strong> ${this.escapeHtml(model.caveat || 'Schematic, not to scale. Validate the actual configuration and effective routes.')}</p>
        </section>`;
    },

    nextStep(current, action, count) {
        if (action === 'reset') return -1;
        if (action === 'previous') return Math.max(-1, current - 1);
        if (action === 'step') return Math.min(count - 1, current + 1);
        return current;
    },

    update(instance, action) {
        instance.step = this.nextStep(instance.step, action, instance.definition.model.steps.length);
        const { host, step, definition } = instance;
        const selected = definition.model.steps[step];
        const focus = new Set(selected?.focus || []);
        host.querySelectorAll('[data-item]').forEach(item => item.classList.toggle('is-focused', focus.has(item.dataset.item)));
        host.querySelectorAll('[data-illustrated-step]').forEach(item => {
            const active = Number(item.dataset.illustratedStep) === step;
            item.classList.toggle('is-current', active);
            if (active) item.setAttribute('aria-current', 'step');
            else item.removeAttribute('aria-current');
        });
        host.querySelector('[data-illustrated-action="previous"]').disabled = step < 0;
        host.querySelector('[data-illustrated-action="step"]').disabled = step === definition.model.steps.length - 1;
        host.querySelector('.illustrated-status').textContent = selected
            ? `Step ${step + 1} of ${definition.model.steps.length}: ${selected.title}. ${selected.text}`
            : 'Complete architecture — use Step to highlight one part. Nothing is hidden.';
    },

    mount(target, definition, preview = false) {
        const normalized = this.normalize(definition);
        this.cleanup(target);
        target.innerHTML = this.html(normalized, { preview });
        const host = target.querySelector('[data-illustrated-instance]');
        this.observePan(host, normalized.title);
        if (!preview) {
            const instance = { host, definition: normalized, step: -1 };
            instance.listener = event => {
                const button = event.target.closest('[data-illustrated-action]');
                if (button && host.contains(button)) this.update(instance, button.dataset.illustratedAction);
            };
            host.addEventListener('click', instance.listener);
            this.instances.set(host.dataset.illustratedInstance, instance);
        }
        return host;
    },

    observePan(host, title) {
        const map = host.querySelector('.illustrated-map');
        const hint = host.querySelector('.illustrated-pan-hint');
        const updateHint = () => {
            const overflow = map.scrollWidth > map.clientWidth + 1;
            hint.hidden = !overflow;
            map.setAttribute('aria-label', `${overflow ? 'Architecture — pan horizontally' : 'Architecture'}: ${title}`);
            if (overflow) map.setAttribute('aria-describedby', hint.id);
            else map.removeAttribute('aria-describedby');
        };
        updateHint();
        if (typeof ResizeObserver !== 'undefined') {
            const observer = new ResizeObserver(updateHint);
            observer.observe(map);
            this.panObservers.set(host, observer);
        }
    },

    render(definitions, container = document.getElementById('tab-diagrams')) {
        if (!container) return;
        this.cleanup(container);
        container.replaceChildren();
        for (const definition of definitions || []) {
            const target = document.createElement('div');
            container.appendChild(target);
            this.mount(target, definition);
        }
    },

    renderInline(root) {
        if (!root) return;
        const placeholders = [...root.querySelectorAll('[data-diagram-model]')];
        if (root.matches?.('[data-diagram-model]')) placeholders.unshift(root);
        for (const target of placeholders) {
            this.mount(target, {
                type: target.dataset.diagramModel,
                scenario: target.dataset.diagramScenario,
                originKind: target.dataset.diagramOriginKind,
                tier: target.dataset.diagramTier,
                connection: target.dataset.diagramConnection,
                title: target.dataset.diagramTitle
            });
        }
    },

    renderPreview(definition, target) {
        if (target) return this.mount(target, definition, true);
    },

    cleanup(root) {
        for (const [host, observer] of this.panObservers) {
            if (!root || root === host || root.contains(host) || !host.isConnected) {
                observer.disconnect();
                this.panObservers.delete(host);
            }
        }
        for (const [id, instance] of this.instances) {
            if (!root || root === instance.host || root.contains(instance.host) || !instance.host.isConnected) {
                instance.host.removeEventListener('click', instance.listener);
                this.instances.delete(id);
            }
        }
    },

    init() {
        // Explicit mounting only: no global listeners, animation timers or autoplay.
    }
};
