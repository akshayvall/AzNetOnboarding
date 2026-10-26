/* Complete, labelled relationships from the shared semantic catalog; no inner viewer. */
const CourseVisuals = {
    escape(value) { return DiagramEngine.escapeHtml(value); },
    alternatives: {
        'dns-resolution': ['cold', 'cached'],
        'nsg-filtering': ['allow', 'deny'],
        'afd-request': ['miss', 'hit'],
        'frontdoor-caching': ['miss', 'hit'],
        'frontdoor-routing': ['origin-failure', 'all-unhealthy'],
        'frontdoor-rules-engine': ['miss', 'redirect'],
        'waf-inspection': ['waf-detect', 'waf-block'],
        'natgw': ['mapped', 'unsolicited'],
        'udr': ['route', 'unreachable'],
        'hub-spoke': ['inspected', 'broken-return'],
        'firewall': ['peering-only', 'inspected'],
        'nwatcher': ['deny', 'allow'],
        'hub-spoke-capstone': ['private-origin', 'egress']
    },
    variants(lesson) {
        if (lesson.starter) return [{ id: 'normal', label: 'Original example' }, { id: 'changed', label: lesson.change }];
        if (lesson.visualTable) return [{ id: 'evidence', label: lesson.visualTable.caption }];
        if (['private-dns-needs-a-resolution-path', 'prove-private-service-access', 'service-endpoint-or-private-address'].includes(lesson.unitId)) return [{ id: 'private', label: 'Private access example' }];
        if (lesson.diagram.type === 'address-space' || lesson.unitId === 'count-usable-subnet-space') return [{ id: 'split', label: 'Four /26 subnets' }, { id: 'smaller', label: 'Eight /27 subnets' }];
        const definition = DiagramCatalog.models[lesson.diagram.type];
        if (!definition) throw new Error(`Missing visual: ${lesson.diagram.type}`);
        const ids = [lesson.diagram.scenario, ...(this.alternatives[lesson.diagram.type] || [])];
        return [...new Set(ids)].filter(id => definition.scenarios.some(s => s.id === id)).slice(0, 2)
            .map(id => ({ id, label: definition.scenarios.find(s => s.id === id).label }));
    },
    render(lesson, variant = 0) {
        if (lesson.starter) return GuidedCourse.figure(lesson.id, Boolean(variant));
        if (lesson.visualTable) {
            const table = lesson.visualTable;
            return DiagramEngine.presentationHtml({ steps: [], presentation: { kind: 'decision', packet: lesson.outcome,
                tables: [{ ...table, rows: table.rows.map(cells => ({ cells })) }], note: table.note } }, { overview: true, step: 0 });
        }
        if (lesson.diagram.type === 'address-space' || lesson.unitId === 'count-usable-subnet-space') return this.addressSpace(variant);
        if (['private-dns-needs-a-resolution-path', 'prove-private-service-access'].includes(lesson.unitId)) return this.privateAccess();
        if (lesson.unitId === 'service-endpoint-or-private-address') return `<dl class="concept-definitions">
            <div><dt>Service endpoint</dt><dd>The Azure service retains its public endpoint. The subnet identity and supported service policy can restrict access; this does not allocate a private service address in your subnet.</dd></div>
            <div><dt>Private endpoint</dt><dd>A private IP in your VNet represents access to a specific supported service. DNS, approval, routing, and service access policy must align.</dd></div></dl>
            <figcaption>Private connectivity is a different property from disabling other public access. Verify both.</figcaption>`;
        const choice = this.variants(lesson)[variant] || this.variants(lesson)[0];
        const model = DiagramCatalog.resolve(lesson.diagram.type, {
            level: lesson.diagram.level || 'basic', scenario: choice.id
        });
        let visual;
        if (model.id === 'osi-model') {
            visual = `<ol class="concept-stack">${model.steps.map(step => `<li><strong>${this.escape(step.title)}</strong><p>${this.escape(step.text)}</p></li>`).join('')}</ol>`;
        } else if (model.id === 'azure-hierarchy') {
            visual = `<div class="resource-container"><strong>Microsoft Entra tenant</strong><p>Identities and directory</p>
                <div class="resource-container"><strong>Subscription</strong><p>Billing and management scope</p>
                <div class="resource-container"><strong>Resource group</strong><p>Resources managed together</p>
                <div class="resource-container"><strong>VNet · VM · Public IP</strong><p>Resource grouping does not connect their networks.</p></div></div></div></div>`;
        } else if (model.id === 'vnet-architecture') {
            visual = `<div class="address-container"><strong>Shop VNet · 10.20.0.0/16</strong><ol class="address-partitions">
                <li><strong>Web subnet · 10.20.1.0/26</strong><span>Customer-facing application tier</span></li>
                <li><strong>Data subnet · 10.20.1.64/26</strong><span>Separate, non-overlapping range</span></li></ol>
                <p>Address boundaries are not an automatic deny policy. Define allowed conversations, routes, and applicable network rules.</p></div>`;
        } else if (model.presentation?.tables) {
            visual = DiagramEngine.presentationHtml(model, { overview: true, step: 0 });
        } else if (model.presentation?.kind === 'sequence') {
            visual = `<div class="course-sequence">${model.edges.map((link, i) => this.connection(model, [link], i + 1)).join('')}</div>`;
        } else {
            visual = this.connections(model);
        }
        return `<div class="course-model" data-model="${model.id}">${visual}</div>
            <figcaption><strong>${this.escape(choice.label)}.</strong> ${this.escape(model.scenarioSummary)}</figcaption>
            <details class="visual-explanation"><summary>Read the diagram explanation and sources</summary>
            <ol>${model.steps.map(s => `<li><strong>${this.escape(s.title)}</strong><p>${this.escape(s.text)}</p></li>`).join('')}</ol>
            <p>${this.escape(model.caveat)}</p><ul>${model.sources.map(k => `<li><a href="${this.escape(DiagramCatalog.sources[k].url)}" target="_blank" rel="noopener noreferrer">${this.escape(DiagramCatalog.sources[k].title)}</a></li>`).join('')}</ul></details>`;
    },
    connection(model, links, number) {
        const first = links[0];
        const from = model.nodes.find(n => n.id === first.from);
        const to = model.nodes.find(n => n.id === first.to);
        if (!from || !to) throw new Error(`Unconnected visual: ${model.id}`);
        return `<div class="connection-row">
            <div class="connection-end"><strong>${this.escape(from.label)}</strong><span>${this.escape(from.detail)}</span></div>
            <div class="connection-lines">${links.map(link => {
                const reverse = link.from !== from.id;
                return `<div class="connection-line ${link.kind}" data-from="${link.from}" data-to="${link.to}">
                    <span>${number ? number + '. ' : ''}${this.escape(link.label)}</span>
                    ${GuidedCourse.arrow(reverse, link.kind === 'blocked', false)}
                    <span class="sr-only">${this.escape(model.nodes.find(n => n.id === link.from).label)} to ${this.escape(model.nodes.find(n => n.id === link.to).label)}</span>
                </div>`;
            }).join('')}</div>
            <div class="connection-end"><strong>${this.escape(to.label)}</strong><span>${this.escape(to.detail)}</span></div>
        </div>`;
    },
    connections(model) {
        if (!model.edges.length) return `<dl class="concept-definitions">${model.nodes.map(n => `<div><dt>${this.escape(n.label)}</dt><dd>${this.escape(n.detail)}</dd></div>`).join('')}</dl>`;
        const pairs = new Map();
        for (const link of model.edges) {
            const key = [link.from, link.to].sort().join('--');
            if (!pairs.has(key)) pairs.set(key, []);
            pairs.get(key).push(link);
        }
        const involved = new Set(model.edges.flatMap(e => [e.from, e.to]));
        return `<div class="connection-diagram" aria-label="Connected paths; every row names its endpoints">
            ${pairs.size > 1 ? '<p class="connection-guide">Read one relationship at a time. Repeated names identify the same component, not extra appliances. Each pair of arrows shows its conversation, not the timing of the whole request.</p>' : ''}
            ${[...pairs.values()].map((links, index) => `<div class="connection-phase">${pairs.size > 1 ? `<p class="connection-heading">Relationship ${index + 1}: ${this.escape(model.nodes.find(n => n.id === links[0].from).label)} / ${this.escape(model.nodes.find(n => n.id === links[0].to).label)}</p>` : ''}${this.connection(model, links)}</div>`).join('')}
            ${model.nodes.filter(n => !involved.has(n.id)).map(n => `<p class="unreached"><strong>${this.escape(n.label)}:</strong> ${this.escape(n.detail)}</p>`).join('')}</div>`;
    },
    addressSpace(variant) {
        const prefix = variant ? 27 : 26;
        const size = variant ? 32 : 64;
        return `<div class="address-container"><strong>10.20.1.0/24 · 256 total addresses</strong>
            <ol class="address-partitions">${Array.from({ length: 256 / size }, (_, i) => `<li><strong>10.20.1.${i * size}/${prefix}</strong>
            <span>.${i * size} through .${(i + 1) * size - 1}</span><span>${size} total · ${size - 5} assignable in an ordinary Azure IPv4 subnet</span></li>`).join('')}</ol></div>
            <figcaption>Each range is inside the /24 and does not overlap its neighbors. Azure reserves five addresses in each subnet. Service-specific sizing requirements still apply.</figcaption>`;
    },
    privateAccess() {
        const model = {
            id: 'private-access',
            nodes: [
                { id: 'client', label: 'Application client', detail: 'Uses the service hostname' },
                { id: 'resolver', label: 'DNS resolver', detail: 'Has the intended private-zone resolution path' },
                { id: 'service', label: 'Service via private endpoint', detail: 'Illustrative private IP: 10.30.2.5' }
            ],
            edges: [
                { id: 'query', from: 'client', to: 'resolver', label: '1. Resolve the service name', kind: 'config' },
                { id: 'answer', from: 'resolver', to: 'client', label: '2. Private address answer', kind: 'response' },
                { id: 'request', from: 'client', to: 'service', label: '3. Separate service connection', kind: 'request' },
                { id: 'reply', from: 'service', to: 'client', label: '4. Service response', kind: 'response' }
            ]
        };
        return `${this.connections(model)}<figcaption>Name lookup and service traffic are separate paths. A private DNS answer alone does not prove reachability or authorization. VNet peering alone does not automatically link private DNS zones.</figcaption>
            <p class="course-meta"><a href="https://learn.microsoft.com/azure/private-link/private-endpoint-dns" target="_blank" rel="noopener noreferrer">Private endpoint DNS configuration</a></p>`;
    }
};
