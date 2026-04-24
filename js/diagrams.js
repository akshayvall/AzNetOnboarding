/* ============================================
   INTERACTIVE VISUAL DIAGRAMS ENGINE v2
   Azure architecture-style icons with clean arrows
   ============================================ */

const DiagramEngine = {

    activeAnimations: [],

    // ── Azure Service Icon SVG Symbols ──────────
    // Each icon is a 48x48 viewBox with official Azure colors
    icons: {
        vnet: (x, y, label) => `<g transform="translate(${x},${y})">
            <rect x="-40" y="-28" width="80" height="56" rx="4" fill="#fff" stroke="#0078D4" stroke-width="1.5" class="icon-box"/>
            <rect x="-16" y="-16" width="32" height="32" rx="3" fill="#0078D4"/>
            <path d="M-8,-8 L8,-8 L8,8 L-8,8 Z" fill="none" stroke="#fff" stroke-width="1.5"/>
            <path d="M-4,-4 L4,-4 L4,4 L-4,4 Z" fill="none" stroke="#fff" stroke-width="1"/>
            <line x1="0" y1="-8" x2="0" y2="-4" stroke="#fff" stroke-width="1"/>
            <line x1="0" y1="4" x2="0" y2="8" stroke="#fff" stroke-width="1"/>
            <line x1="-8" y1="0" x2="-4" y2="0" stroke="#fff" stroke-width="1"/>
            <line x1="4" y1="0" x2="8" y2="0" stroke="#fff" stroke-width="1"/>
            <text y="42" text-anchor="middle" fill="#333" font-size="11" font-family="Segoe UI,sans-serif">${label}</text>
        </g>`,

        vm: (x, y, label) => `<g transform="translate(${x},${y})">
            <rect x="-40" y="-28" width="80" height="56" rx="4" fill="#fff" stroke="#0078D4" stroke-width="1.5" class="icon-box"/>
            <rect x="-14" y="-14" width="28" height="22" rx="2" fill="#0078D4"/>
            <rect x="-10" y="-10" width="20" height="14" rx="1" fill="#68C8F2"/>
            <rect x="-4" y="10" width="8" height="3" fill="#0078D4"/>
            <rect x="-8" y="13" width="16" height="2" rx="1" fill="#0078D4"/>
            <text y="42" text-anchor="middle" fill="#333" font-size="11" font-family="Segoe UI,sans-serif">${label}</text>
        </g>`,

        firewall: (x, y, label) => `<g transform="translate(${x},${y})">
            <rect x="-40" y="-28" width="80" height="56" rx="4" fill="#fff" stroke="#E8443A" stroke-width="1.5" class="icon-box"/>
            <rect x="-14" y="-14" width="28" height="28" rx="2" fill="#E8443A"/>
            <path d="M0,-8 L6,0 L4,0 L4,8 L-4,8 L-4,0 L-6,0 Z" fill="#fff"/>
            <text y="42" text-anchor="middle" fill="#333" font-size="11" font-family="Segoe UI,sans-serif">${label}</text>
        </g>`,

        gateway: (x, y, label) => `<g transform="translate(${x},${y})">
            <rect x="-40" y="-28" width="80" height="56" rx="4" fill="#fff" stroke="#7A3B93" stroke-width="1.5" class="icon-box"/>
            <rect x="-14" y="-14" width="28" height="28" rx="2" fill="#7A3B93"/>
            <path d="M-6,-5 L0,-10 L6,-5 L6,4 L-6,4 Z" fill="#fff"/>
            <rect x="-3" y="-1" width="6" height="5" fill="#7A3B93"/>
            <text y="42" text-anchor="middle" fill="#333" font-size="11" font-family="Segoe UI,sans-serif">${label}</text>
        </g>`,

        nsg: (x, y, label) => `<g transform="translate(${x},${y})">
            <rect x="-40" y="-28" width="80" height="56" rx="4" fill="#fff" stroke="#E8443A" stroke-width="1.5" class="icon-box"/>
            <rect x="-14" y="-14" width="28" height="28" rx="14" fill="#E8443A"/>
            <path d="M-3,-7 L-3,0 L5,0 M3,7 L3,0 L-5,0" stroke="#fff" stroke-width="2" fill="none"/>
            <text y="42" text-anchor="middle" fill="#333" font-size="11" font-family="Segoe UI,sans-serif">${label}</text>
        </g>`,

        loadbalancer: (x, y, label) => `<g transform="translate(${x},${y})">
            <rect x="-40" y="-28" width="80" height="56" rx="4" fill="#fff" stroke="#0078D4" stroke-width="1.5" class="icon-box"/>
            <rect x="-14" y="-14" width="28" height="28" rx="2" fill="#0078D4"/>
            <circle cx="0" cy="-2" r="6" fill="none" stroke="#fff" stroke-width="1.5"/>
            <path d="M-4,-2 L4,-2 M0,-6 L0,2" stroke="#fff" stroke-width="1.5"/>
            <rect x="-8" y="6" width="16" height="2" fill="#fff"/>
            <text y="42" text-anchor="middle" fill="#333" font-size="11" font-family="Segoe UI,sans-serif">${label}</text>
        </g>`,

        appgateway: (x, y, label) => `<g transform="translate(${x},${y})">
            <rect x="-40" y="-28" width="80" height="56" rx="4" fill="#fff" stroke="#0078D4" stroke-width="1.5" class="icon-box"/>
            <rect x="-14" y="-14" width="28" height="28" rx="2" fill="#3A96DD"/>
            <circle cx="-4" cy="-2" r="5" fill="none" stroke="#fff" stroke-width="1.5"/>
            <path d="M1,-2 L8,-7 M1,-2 L8,3 M1,-2 L8,-2" stroke="#fff" stroke-width="1.2"/>
            <text y="42" text-anchor="middle" fill="#333" font-size="11" font-family="Segoe UI,sans-serif">${label}</text>
        </g>`,

        frontdoor: (x, y, label) => `<g transform="translate(${x},${y})">
            <rect x="-46" y="-28" width="92" height="56" rx="4" fill="#fff" stroke="#0078D4" stroke-width="1.5" class="icon-box"/>
            <rect x="-16" y="-16" width="32" height="32" rx="3" fill="#0078D4"/>
            <path d="M-8,-8 L0,-12 L8,-8 L8,8 L-8,8 Z" fill="#50B0F0"/>
            <rect x="-3" y="-2" width="6" height="10" fill="#004078" rx="1"/>
            <circle cx="1" cy="3" r="1" fill="#50B0F0"/>
            <text y="42" text-anchor="middle" fill="#333" font-size="11" font-family="Segoe UI,sans-serif">${label}</text>
        </g>`,

        dns: (x, y, label) => `<g transform="translate(${x},${y})">
            <rect x="-40" y="-28" width="80" height="56" rx="4" fill="#fff" stroke="#0078D4" stroke-width="1.5" class="icon-box"/>
            <rect x="-14" y="-14" width="28" height="28" rx="2" fill="#0078D4"/>
            <text x="0" y="4" text-anchor="middle" fill="#fff" font-size="10" font-weight="700" font-family="Segoe UI,sans-serif">DNS</text>
            <text y="42" text-anchor="middle" fill="#333" font-size="11" font-family="Segoe UI,sans-serif">${label}</text>
        </g>`,

        storage: (x, y, label) => `<g transform="translate(${x},${y})">
            <rect x="-40" y="-28" width="80" height="56" rx="4" fill="#fff" stroke="#0078D4" stroke-width="1.5" class="icon-box"/>
            <rect x="-14" y="-14" width="28" height="28" rx="2" fill="#0078D4"/>
            <ellipse cx="0" cy="-6" rx="8" ry="4" fill="#68C8F2"/>
            <rect x="-8" y="-6" width="16" height="14" fill="#0078D4"/>
            <ellipse cx="0" cy="8" rx="8" ry="4" fill="#50A0D0"/>
            <ellipse cx="0" cy="-6" rx="8" ry="4" fill="none" stroke="#fff" stroke-width="0.5"/>
            <text y="42" text-anchor="middle" fill="#333" font-size="11" font-family="Segoe UI,sans-serif">${label}</text>
        </g>`,

        sql: (x, y, label) => `<g transform="translate(${x},${y})">
            <rect x="-40" y="-28" width="80" height="56" rx="4" fill="#fff" stroke="#0078D4" stroke-width="1.5" class="icon-box"/>
            <rect x="-14" y="-14" width="28" height="28" rx="2" fill="#0078D4"/>
            <ellipse cx="0" cy="-6" rx="7" ry="3.5" fill="#68C8F2"/>
            <rect x="-7" y="-6" width="14" height="12" fill="#0078D4"/>
            <ellipse cx="0" cy="6" rx="7" ry="3.5" fill="#50A0D0"/>
            <text x="0" y="3" text-anchor="middle" fill="#fff" font-size="7" font-weight="700">SQL</text>
            <text y="42" text-anchor="middle" fill="#333" font-size="11" font-family="Segoe UI,sans-serif">${label}</text>
        </g>`,

        user: (x, y, label) => `<g transform="translate(${x},${y})">
            <rect x="-36" y="-28" width="72" height="56" rx="4" fill="#fff" stroke="#666" stroke-width="1.5" class="icon-box"/>
            <circle cx="0" cy="-6" r="7" fill="#505050"/>
            <circle cx="0" cy="-8" r="4.5" fill="#808080"/>
            <ellipse cx="0" cy="5" rx="9" ry="6" fill="#505050"/>
            <text y="42" text-anchor="middle" fill="#333" font-size="11" font-family="Segoe UI,sans-serif">${label}</text>
        </g>`,

        internet: (x, y, label) => `<g transform="translate(${x},${y})">
            <rect x="-36" y="-28" width="72" height="56" rx="4" fill="#fff" stroke="#666" stroke-width="1.5" class="icon-box"/>
            <circle cx="0" cy="0" r="13" fill="none" stroke="#505050" stroke-width="1.5"/>
            <ellipse cx="0" cy="0" rx="6" ry="13" fill="none" stroke="#505050" stroke-width="1"/>
            <line x1="-13" y1="0" x2="13" y2="0" stroke="#505050" stroke-width="1"/>
            <path d="M-12,-5 Q0,-7 12,-5" fill="none" stroke="#505050" stroke-width="0.8"/>
            <path d="M-12,5 Q0,7 12,5" fill="none" stroke="#505050" stroke-width="0.8"/>
            <text y="42" text-anchor="middle" fill="#333" font-size="11" font-family="Segoe UI,sans-serif">${label}</text>
        </g>`,

        waf: (x, y, label) => `<g transform="translate(${x},${y})">
            <rect x="-40" y="-28" width="80" height="56" rx="4" fill="#fff" stroke="#E8443A" stroke-width="1.5" class="icon-box"/>
            <rect x="-14" y="-14" width="28" height="28" rx="2" fill="#E8443A"/>
            <path d="M0,-10 L8,-4 L8,6 L0,10 L-8,6 L-8,-4 Z" fill="#F7A4A0" stroke="#fff" stroke-width="1"/>
            <path d="M0,-6 L0,6 M-5,0 L5,0" stroke="#fff" stroke-width="1.5"/>
            <text y="42" text-anchor="middle" fill="#333" font-size="11" font-family="Segoe UI,sans-serif">${label}</text>
        </g>`,

        edge: (x, y, label) => `<g transform="translate(${x},${y})">
            <rect x="-40" y="-28" width="80" height="56" rx="4" fill="#fff" stroke="#00BCF2" stroke-width="1.5" class="icon-box"/>
            <rect x="-14" y="-14" width="28" height="28" rx="14" fill="#00BCF2"/>
            <path d="M-5,-5 L0,-9 L5,-5 M-5,0 L0,-4 L5,0 M-5,5 L0,1 L5,5" stroke="#fff" stroke-width="1.5" fill="none"/>
            <text y="42" text-anchor="middle" fill="#333" font-size="11" font-family="Segoe UI,sans-serif">${label}</text>
        </g>`,

        onprem: (x, y, label) => `<g transform="translate(${x},${y})">
            <rect x="-40" y="-28" width="80" height="56" rx="4" fill="#fff" stroke="#505050" stroke-width="1.5" class="icon-box"/>
            <rect x="-12" y="-8" width="24" height="16" rx="1" fill="#505050"/>
            <path d="M-12,-8 L0,-16 L12,-8" fill="#707070" stroke="#505050" stroke-width="1"/>
            <rect x="-6" y="-2" width="5" height="6" fill="#A0A0A0"/>
            <rect x="1" y="-2" width="5" height="6" fill="#A0A0A0"/>
            <text y="42" text-anchor="middle" fill="#333" font-size="11" font-family="Segoe UI,sans-serif">${label}</text>
        </g>`,

        cloud: (x, y, label) => `<g transform="translate(${x},${y})">
            <rect x="-40" y="-28" width="80" height="56" rx="4" fill="#fff" stroke="#0078D4" stroke-width="1.5" class="icon-box"/>
            <path d="M-5,6 A8,8,0,1,1,3,-6 A6,6,0,0,1,10,0 A5,5,0,0,1,6,6 Z" fill="#0078D4"/>
            <path d="M-5,6 A8,8,0,1,1,3,-6 A6,6,0,0,1,10,0 A5,5,0,0,1,6,6 Z" fill="none" stroke="#fff" stroke-width="0.5"/>
            <text y="42" text-anchor="middle" fill="#333" font-size="11" font-family="Segoe UI,sans-serif">${label}</text>
        </g>`,

        subnet: (x, y, w, h, label, color) => `<g>
            <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="${color || '#0078D4'}08" stroke="${color || '#0078D4'}" stroke-width="1.5" stroke-dasharray="6"/>
            <text x="${x + 12}" y="${y + 16}" fill="${color || '#0078D4'}" font-size="11" font-weight="600" font-family="Segoe UI,sans-serif">${label}</text>
        </g>`,
    },

    // ── Arrow helper ──────────────────────────
    arrow(x1, y1, x2, y2, opts = {}) {
        const color = opts.color || '#333';
        const dashed = opts.dashed ? 'stroke-dasharray="6"' : '';
        const width = opts.width || 1.5;
        const label = opts.label || '';
        const id = opts.id || '';
        const bidirectional = opts.bidirectional || false;

        // Shorten arrow to not overlap icons
        const pad = opts.pad || 30;
        const dx = x2 - x1, dy = y2 - y1;
        const len = Math.sqrt(dx * dx + dy * dy);
        const ux = dx / len, uy = dy / len;
        const sx = x1 + ux * pad, sy = y1 + uy * pad;
        const ex = x2 - ux * pad, ey = y2 - uy * pad;

        const markerEnd = `marker-end="url(#ah-${color.replace('#', '')})"`;
        const markerStart = bidirectional ? `marker-start="url(#ahs-${color.replace('#', '')})"` : '';

        let labelSvg = '';
        if (label) {
            const mx = (sx + ex) / 2, my = (sy + ey) / 2;
            labelSvg = `<text x="${mx}" y="${my - 6}" text-anchor="middle" fill="#666" font-size="9" font-family="Segoe UI,sans-serif">${label}</text>`;
        }

        return `<g ${id ? `data-step="${id}"` : ''} class="${id ? 'step-highlight flow-arrow' : ''}">
            <line x1="${sx}" y1="${sy}" x2="${ex}" y2="${ey}" stroke="${color}" stroke-width="${width}" ${dashed} ${markerEnd} ${markerStart} class="anim-line"/>
            ${labelSvg}
        </g>`;
    },

    // Standard arrowhead markers for any color
    arrowDefs(colors) {
        return colors.map(c => {
            const id = c.replace('#', '');
            return `<marker id="ah-${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,1 L10,5 L0,9 Z" fill="${c}"/></marker>
            <marker id="ahs-${id}" viewBox="0 0 10 10" refX="1" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M10,1 L0,5 L10,9 Z" fill="${c}"/></marker>`;
        }).join('\n');
    },

    // ── Render / Control (same API as before) ──
    render(diagrams) {
        const container = document.getElementById('tab-diagrams');
        if (!diagrams || diagrams.length === 0) {
            container.innerHTML = '<p class="no-content">No visual diagrams for this module yet.</p>';
            return;
        }
        container.innerHTML = `<div class="diagrams-wrapper">${diagrams.map(d => this.renderDiagram(d)).join('')}</div>`;
        requestAnimationFrame(() => diagrams.forEach(d => this.initDiagram(d)));
    },

    cleanup() {
        this.activeAnimations.forEach(id => cancelAnimationFrame(id));
        this.activeAnimations = [];
    },

    renderDiagram(diagram) {
        return `
        <div class="visual-diagram" id="diagram-${diagram.id}">
            <div class="diagram-title-bar">
                <h3>${diagram.title}</h3>
                <div class="diagram-controls">
                    ${diagram.steps ? `<button class="diag-btn diag-btn-step" onclick="DiagramEngine.stepThrough('${diagram.id}')">▶ Step</button>` : ''}
                    <button class="diag-btn diag-btn-play" onclick="DiagramEngine.play('${diagram.id}')">▶ Play</button>
                    <button class="diag-btn diag-btn-reset" onclick="DiagramEngine.reset('${diagram.id}')">↺ Reset</button>
                </div>
            </div>
            ${diagram.description ? `<p class="diagram-description">${diagram.description}</p>` : ''}
            <div class="diagram-canvas" id="canvas-${diagram.id}"></div>
            ${diagram.steps ? `
            <div class="diagram-step-info" id="stepinfo-${diagram.id}">
                <div class="step-counter">Step <span id="stepcnt-${diagram.id}">0</span> / ${diagram.steps.length}</div>
                <div class="step-text" id="steptxt-${diagram.id}">Click "Step" to begin</div>
            </div>` : ''}
            ${diagram.legend ? `<div class="diagram-legend">${diagram.legend.map(l => `<span class="legend-item"><span class="legend-dot" style="background:${l.color}"></span>${l.label}</span>`).join('')}</div>` : ''}
        </div>`;
    },

    initDiagram(diagram) {
        const canvas = document.getElementById(`canvas-${diagram.id}`);
        if (!canvas) return;
        canvas.dataset.step = '0';
        canvas.dataset.playing = 'false';
        const builder = this.builders[diagram.type] || this.builders._generic;
        if (builder) canvas.innerHTML = builder.call(this, diagram);
    },

    play(diagramId) {
        const canvas = document.getElementById(`canvas-${diagramId}`);
        if (!canvas) return;
        canvas.dataset.playing = 'true';
        canvas.dataset.step = '0';
        canvas.classList.add('animating');
        const svg = canvas.querySelector('svg');
        if (svg) { svg.classList.remove('animate-all'); void svg.offsetWidth; svg.classList.add('animate-all'); }
    },

    reset(diagramId) {
        const canvas = document.getElementById(`canvas-${diagramId}`);
        if (!canvas) return;
        canvas.dataset.step = '0';
        canvas.dataset.playing = 'false';
        canvas.classList.remove('animating');
        const svg = canvas.querySelector('svg');
        if (svg) {
            svg.classList.remove('animate-all');
            svg.querySelectorAll('.step-highlight').forEach(el => el.classList.remove('active'));
        }
        const stepTxt = document.getElementById(`steptxt-${diagramId}`);
        const stepCnt = document.getElementById(`stepcnt-${diagramId}`);
        if (stepTxt) stepTxt.textContent = 'Click "Step" to begin';
        if (stepCnt) stepCnt.textContent = '0';
    },

    stepThrough(diagramId) {
        const canvas = document.getElementById(`canvas-${diagramId}`);
        if (!canvas) return;
        let step = parseInt(canvas.dataset.step) || 0;
        const svg = canvas.querySelector('svg');
        if (!svg) return;
        const allSteps = svg.querySelectorAll('[data-step]');
        const maxStep = Math.max(...Array.from(allSteps).map(el => parseInt(el.dataset.step)));
        if (step > maxStep) { this.reset(diagramId); return; }
        step++;
        canvas.dataset.step = step;
        allSteps.forEach(el => { if (parseInt(el.dataset.step) === step) el.classList.add('active'); });
        const stepTxt = document.getElementById(`steptxt-${diagramId}`);
        const stepCnt = document.getElementById(`stepcnt-${diagramId}`);
        if (stepCnt) stepCnt.textContent = step;
        const diagramData = this.getDiagramData(diagramId);
        if (diagramData && diagramData.steps && diagramData.steps[step - 1]) {
            if (stepTxt) stepTxt.textContent = diagramData.steps[step - 1];
        }
    },

    getDiagramData(diagramId) {
        for (const mod of MODULES) {
            if (mod.diagrams) { const d = mod.diagrams.find(d => d.id === diagramId); if (d) return d; }
        }
        return null;
    },

    // ══════════════════════════════════════════════
    //  DIAGRAM BUILDERS
    // ══════════════════════════════════════════════

    builders: {

        // ─── OSI MODEL ────────────────────────────
        'osi-model'(diagram) {
            const I = DiagramEngine.icons;
            const layers = [
                { num: 7, name: 'Application',   color: '#D13438', proto: 'HTTP, DNS, FTP',    azure: 'Front Door, App GW' },
                { num: 6, name: 'Presentation',   color: '#E74856', proto: 'SSL/TLS, JSON',    azure: 'TLS Termination' },
                { num: 5, name: 'Session',         color: '#F7630C', proto: 'NetBIOS, RPC',     azure: 'Session Affinity' },
                { num: 4, name: 'Transport',       color: '#FF8C00', proto: 'TCP, UDP',          azure: 'Load Balancer' },
                { num: 3, name: 'Network',         color: '#107C10', proto: 'IP, ICMP, ARP',     azure: 'VNet, NSG, UDR' },
                { num: 2, name: 'Data Link',       color: '#0078D4', proto: 'Ethernet, MAC',     azure: 'Virtual NIC' },
                { num: 1, name: 'Physical',        color: '#004578', proto: 'Fiber, Copper',     azure: 'Azure DC Infra' },
            ];
            return `<svg viewBox="0 0 780 490" class="diagram-svg">
                <defs>${DiagramEngine.arrowDefs(['#333'])}</defs>
                <text x="390" y="28" text-anchor="middle" fill="#333" font-size="15" font-weight="600" font-family="Segoe UI,sans-serif">OSI Reference Model — Azure Mapping</text>
                <text x="115" y="55" text-anchor="middle" fill="#888" font-size="10" font-family="Segoe UI,sans-serif">LAYER</text>
                <text x="330" y="55" text-anchor="middle" fill="#888" font-size="10" font-family="Segoe UI,sans-serif">PROTOCOLS</text>
                <text x="600" y="55" text-anchor="middle" fill="#888" font-size="10" font-family="Segoe UI,sans-serif">AZURE SERVICE</text>
                ${layers.map((l, i) => {
                    const y = 70 + i * 56;
                    return `<g data-step="${7 - i}" class="step-highlight" style="cursor:pointer">
                        <rect x="30" y="${y}" width="170" height="44" rx="5" fill="${l.color}" opacity="0.9"/>
                        <text x="45" y="${y + 18}" fill="#fff" font-size="10" font-weight="600" font-family="Segoe UI,sans-serif">Layer ${l.num}</text>
                        <text x="45" y="${y + 33}" fill="rgba(255,255,255,.85)" font-size="13" font-weight="600" font-family="Segoe UI,sans-serif">${l.name}</text>
                        <rect x="220" y="${y}" width="220" height="44" rx="5" fill="${l.color}15" stroke="${l.color}" stroke-width="1"/>
                        <text x="330" y="${y + 27}" text-anchor="middle" fill="${l.color}" font-size="12" font-family="Segoe UI,sans-serif">${l.proto}</text>
                        <rect x="460" y="${y}" width="280" height="44" rx="5" fill="#0078D410" stroke="#0078D4" stroke-width="1"/>
                        <text x="600" y="${y + 27}" text-anchor="middle" fill="#0078D4" font-size="12" font-weight="500" font-family="Segoe UI,sans-serif">${l.azure}</text>
                    </g>`;
                }).join('')}
                <g data-step="1" class="step-highlight">
                    <text x="15" y="478" fill="#666" font-size="10" font-family="Segoe UI,sans-serif">Data flows down (sender) → across the wire → up (receiver)</text>
                </g>
            </svg>`;
        },

        // ─── TCP 3-WAY HANDSHAKE ──────────────────
        'tcp-handshake'(diagram) {
            const A = DiagramEngine.arrowDefs(['#0078D4', '#107C10', '#FF8C00']);
            const I = DiagramEngine.icons;
            return `<svg viewBox="0 0 680 400" class="diagram-svg">
                <defs>${A}</defs>
                ${I.vm(100, 60, 'Client')}
                ${I.vm(580, 60, 'Server')}
                <line x1="100" y1="95" x2="100" y2="380" stroke="#0078D4" stroke-width="1.5" stroke-dasharray="4"/>
                <line x1="580" y1="95" x2="580" y2="380" stroke="#0078D4" stroke-width="1.5" stroke-dasharray="4"/>
                <g data-step="1" class="step-highlight flow-arrow">
                    <line x1="115" y1="150" x2="565" y2="185" stroke="#0078D4" stroke-width="2" marker-end="url(#ah-0078D4)" class="anim-line"/>
                    <rect x="250" y="148" width="160" height="26" rx="4" fill="#0078D415" stroke="#0078D4" stroke-width="1"/>
                    <text x="330" y="166" text-anchor="middle" fill="#0078D4" font-size="12" font-weight="600" font-family="Segoe UI,sans-serif">SYN  seq=100</text>
                </g>
                <g data-step="2" class="step-highlight flow-arrow">
                    <line x1="565" y1="220" x2="115" y2="255" stroke="#107C10" stroke-width="2" marker-end="url(#ah-107C10)" class="anim-line"/>
                    <rect x="220" y="218" width="220" height="26" rx="4" fill="#107C1015" stroke="#107C10" stroke-width="1"/>
                    <text x="330" y="236" text-anchor="middle" fill="#107C10" font-size="12" font-weight="600" font-family="Segoe UI,sans-serif">SYN-ACK  seq=300 ack=101</text>
                </g>
                <g data-step="3" class="step-highlight flow-arrow">
                    <line x1="115" y1="290" x2="565" y2="320" stroke="#FF8C00" stroke-width="2" marker-end="url(#ah-FF8C00)" class="anim-line"/>
                    <rect x="260" y="288" width="140" height="26" rx="4" fill="#FF8C0015" stroke="#FF8C00" stroke-width="1"/>
                    <text x="330" y="306" text-anchor="middle" fill="#FF8C00" font-size="12" font-weight="600" font-family="Segoe UI,sans-serif">ACK  ack=301</text>
                </g>
                <g data-step="4" class="step-highlight">
                    <rect x="200" y="352" width="260" height="30" rx="6" fill="#107C1018" stroke="#107C10" stroke-width="1.5"/>
                    <text x="330" y="372" text-anchor="middle" fill="#107C10" font-size="13" font-weight="600" font-family="Segoe UI,sans-serif">✓ Connection Established</text>
                </g>
            </svg>`;
        },

        // ─── DNS RESOLUTION ──────────────────────
        'dns-resolution'(diagram) {
            const A = DiagramEngine.arrowDefs(['#333', '#0078D4', '#107C10', '#8E44AD', '#D13438']);
            const I = DiagramEngine.icons;
            return `<svg viewBox="0 0 800 420" class="diagram-svg">
                <defs>${A}</defs>
                <g data-step="1" class="step-highlight">${I.user(80, 80, 'Your Browser')}</g>
                <g data-step="2" class="step-highlight">${I.storage(230, 80, 'Local Cache')}</g>
                <g data-step="3" class="step-highlight">${I.dns(400, 80, 'ISP Resolver')}</g>
                <g data-step="4" class="step-highlight">${I.dns(580, 80, 'Root DNS')}</g>
                <g data-step="5" class="step-highlight">${I.dns(700, 200, 'TLD (.com)')}</g>
                <g data-step="6" class="step-highlight">${I.dns(580, 320, 'Auth DNS')}</g>
                <g data-step="2" class="step-highlight flow-arrow">
                    <line x1="118" y1="80" x2="188" y2="80" stroke="#333" stroke-width="1.5" marker-end="url(#ah-333)" class="anim-line"/>
                </g>
                <g data-step="3" class="step-highlight flow-arrow">
                    <line x1="272" y1="80" x2="358" y2="80" stroke="#333" stroke-width="1.5" marker-end="url(#ah-333)" class="anim-line"/>
                </g>
                <g data-step="4" class="step-highlight flow-arrow">
                    <line x1="442" y1="72" x2="538" y2="72" stroke="#0078D4" stroke-width="1.5" marker-end="url(#ah-0078D4)" class="anim-line"/>
                    <text x="490" y="64" text-anchor="middle" fill="#666" font-size="9" font-family="Segoe UI,sans-serif">Who has .com?</text>
                </g>
                <g data-step="5" class="step-highlight flow-arrow">
                    <line x1="620" y1="100" x2="690" y2="170" stroke="#8E44AD" stroke-width="1.5" marker-end="url(#ah-8E44AD)" class="anim-line"/>
                    <text x="675" y="140" fill="#666" font-size="9" font-family="Segoe UI,sans-serif">Ask TLD</text>
                </g>
                <g data-step="6" class="step-highlight flow-arrow">
                    <line x1="690" y1="230" x2="620" y2="300" stroke="#107C10" stroke-width="1.5" marker-end="url(#ah-107C10)" class="anim-line"/>
                    <text x="674" y="270" fill="#666" font-size="9" font-family="Segoe UI,sans-serif">Ask Auth</text>
                </g>
                <g data-step="7" class="step-highlight flow-arrow">
                    <path d="M540,330 Q300,400 100,120" stroke="#107C10" stroke-width="2" fill="none" stroke-dasharray="6" marker-end="url(#ah-107C10)" class="anim-line"/>
                    <text x="290" y="380" fill="#107C10" font-size="12" font-weight="600" font-family="Segoe UI,sans-serif">IP: 20.245.156.100 ✓</text>
                </g>
            </svg>`;
        },

        // ─── VNET ARCHITECTURE ───────────────────
        'vnet-architecture'(diagram) {
            const A = DiagramEngine.arrowDefs(['#333', '#0078D4']);
            const I = DiagramEngine.icons;
            return `<svg viewBox="0 0 760 520" class="diagram-svg">
                <defs>${A}</defs>
                <g data-step="1" class="step-highlight">
                    ${I.subnet(30, 30, 700, 470, 'VNet: production-vnet — 10.0.0.0/16', '#0078D4')}
                </g>
                <text x="370" y="22" text-anchor="middle" fill="#0078D4" font-size="10" font-family="Segoe UI,sans-serif">☁ Azure East US Region</text>
                <g data-step="2" class="step-highlight">
                    ${I.subnet(55, 65, 320, 180, 'Subnet: web-tier  10.0.1.0/24', '#107C10')}
                    ${I.vm(140, 145, 'web-vm-01')}
                    ${I.vm(270, 145, 'web-vm-02')}
                    <rect x="75" y="205" width="280" height="24" rx="4" fill="#E8443A12" stroke="#E8443A" stroke-width="1"/>
                    <text x="215" y="222" text-anchor="middle" fill="#E8443A" font-size="10" font-family="Segoe UI,sans-serif">NSG: Allow HTTP/HTTPS inbound</text>
                </g>
                <g data-step="3" class="step-highlight">
                    ${I.subnet(395, 65, 320, 180, 'Subnet: app-tier  10.0.2.0/24', '#FF8C00')}
                    ${I.vm(480, 145, 'app-vm-01')}
                    ${I.vm(610, 145, 'app-vm-02')}
                    <rect x="415" y="205" width="280" height="24" rx="4" fill="#E8443A12" stroke="#E8443A" stroke-width="1"/>
                    <text x="555" y="222" text-anchor="middle" fill="#E8443A" font-size="10" font-family="Segoe UI,sans-serif">NSG: Allow from web-tier only</text>
                </g>
                <g data-step="4" class="step-highlight">
                    ${I.subnet(55, 275, 320, 200, 'Subnet: db-tier  10.0.3.0/24', '#D13438')}
                    ${I.sql(215, 370, 'SQL Server')}
                    <rect x="75" y="420" width="280" height="24" rx="4" fill="#E8443A12" stroke="#E8443A" stroke-width="1"/>
                    <text x="215" y="437" text-anchor="middle" fill="#E8443A" font-size="10" font-family="Segoe UI,sans-serif">NSG: Allow from app-tier on 1433</text>
                </g>
                <g data-step="5" class="step-highlight">
                    ${I.subnet(395, 275, 320, 200, 'GatewaySubnet  10.0.255.0/27', '#7A3B93')}
                    ${I.gateway(555, 370, 'VPN Gateway')}
                </g>
                <g data-step="6" class="step-highlight flow-arrow">
                    <line x1="340" y1="145" x2="430" y2="145" stroke="#333" stroke-width="1.5" marker-end="url(#ah-333)" class="anim-line"/>
                    <line x1="215" y1="240" x2="215" y2="310" stroke="#333" stroke-width="1.5" marker-end="url(#ah-333)" class="anim-line"/>
                    <text x="385" y="138" fill="#666" font-size="9" font-family="Segoe UI,sans-serif">→</text>
                </g>
            </svg>`;
        },

        // ─── FRONT DOOR ROUTING ──────────────────
        'frontdoor-routing'(diagram) {
            const A = DiagramEngine.arrowDefs(['#333', '#0078D4', '#107C10', '#FF8C00', '#00BCF2']);
            const I = DiagramEngine.icons;
            return `<svg viewBox="0 0 820 440" class="diagram-svg">
                <defs>${A}</defs>
                <g data-step="1" class="step-highlight">
                    ${I.user(60, 70, 'US East')}
                    ${I.user(60, 190, 'Europe')}
                    ${I.user(60, 310, 'Asia')}
                </g>
                <g data-step="2" class="step-highlight">
                    ${I.edge(210, 70, 'POP: New York')}
                    ${I.edge(210, 190, 'POP: Amsterdam')}
                    ${I.edge(210, 310, 'POP: Singapore')}
                </g>
                <g data-step="2" class="step-highlight flow-arrow">
                    <line x1="98" y1="70" x2="168" y2="70" stroke="#333" stroke-width="1.5" marker-end="url(#ah-333)" class="anim-line"/>
                    <line x1="98" y1="190" x2="168" y2="190" stroke="#333" stroke-width="1.5" marker-end="url(#ah-333)" class="anim-line"/>
                    <line x1="98" y1="310" x2="168" y2="310" stroke="#333" stroke-width="1.5" marker-end="url(#ah-333)" class="anim-line"/>
                </g>
                <g data-step="3" class="step-highlight">
                    <rect x="320" y="50" width="180" height="310" rx="10" fill="#0078D408" stroke="#0078D4" stroke-width="2"/>
                    ${I.frontdoor(410, 100, '')}
                    <text x="410" y="80" text-anchor="middle" fill="#0078D4" font-size="13" font-weight="700" font-family="Segoe UI,sans-serif">Azure Front Door</text>
                    <rect x="340" y="145" width="140" height="24" rx="4" fill="#fff" stroke="#0078D4" stroke-width="1"/>
                    <text x="410" y="161" text-anchor="middle" fill="#0078D4" font-size="10" font-family="Segoe UI,sans-serif">WAF Protection</text>
                    <rect x="340" y="177" width="140" height="24" rx="4" fill="#fff" stroke="#0078D4" stroke-width="1"/>
                    <text x="410" y="193" text-anchor="middle" fill="#0078D4" font-size="10" font-family="Segoe UI,sans-serif">SSL Termination</text>
                    <rect x="340" y="209" width="140" height="24" rx="4" fill="#fff" stroke="#0078D4" stroke-width="1"/>
                    <text x="410" y="225" text-anchor="middle" fill="#0078D4" font-size="10" font-family="Segoe UI,sans-serif">URL Routing</text>
                    <rect x="340" y="241" width="140" height="24" rx="4" fill="#fff" stroke="#0078D4" stroke-width="1"/>
                    <text x="410" y="257" text-anchor="middle" fill="#0078D4" font-size="10" font-family="Segoe UI,sans-serif">Caching</text>
                </g>
                <g data-step="3" class="step-highlight flow-arrow">
                    <line x1="252" y1="70" x2="318" y2="160" stroke="#00BCF2" stroke-width="1.5" marker-end="url(#ah-00BCF2)" class="anim-line"/>
                    <line x1="252" y1="190" x2="318" y2="200" stroke="#00BCF2" stroke-width="1.5" marker-end="url(#ah-00BCF2)" class="anim-line"/>
                    <line x1="252" y1="310" x2="318" y2="240" stroke="#00BCF2" stroke-width="1.5" marker-end="url(#ah-00BCF2)" class="anim-line"/>
                </g>
                <g data-step="4" class="step-highlight">
                    ${I.subnet(560, 50, 230, 140, 'Primary: East US', '#107C10')}
                    ${I.vm(620, 120, 'App Service')}
                    ${I.storage(730, 120, 'Storage')}
                </g>
                <g data-step="5" class="step-highlight">
                    ${I.subnet(560, 210, 230, 140, 'Secondary: West EU', '#FF8C00')}
                    ${I.vm(620, 280, 'App Service')}
                    ${I.storage(730, 280, 'Storage')}
                </g>
                <g data-step="4" class="step-highlight flow-arrow">
                    <line x1="500" y1="160" x2="573" y2="120" stroke="#107C10" stroke-width="2" marker-end="url(#ah-107C10)" class="anim-line"/>
                </g>
                <g data-step="5" class="step-highlight flow-arrow">
                    <line x1="500" y1="230" x2="573" y2="280" stroke="#FF8C00" stroke-width="1.5" stroke-dasharray="6" marker-end="url(#ah-FF8C00)" class="anim-line"/>
                    <text x="530" y="270" fill="#FF8C00" font-size="9" font-family="Segoe UI,sans-serif">failover</text>
                </g>
                <g data-step="6" class="step-highlight">
                    <text x="410" y="400" text-anchor="middle" fill="#333" font-size="13" font-weight="600" font-family="Segoe UI,sans-serif">Azure Front Door — Global L7 Load Balancer</text>
                    <text x="410" y="420" text-anchor="middle" fill="#888" font-size="10" font-family="Segoe UI,sans-serif">Routes users to nearest healthy origin via Microsoft's edge network</text>
                </g>
            </svg>`;
        },

        // ─── HUB-SPOKE ──────────────────────────
        'hub-spoke'(diagram) {
            const A = DiagramEngine.arrowDefs(['#0078D4', '#333']);
            const I = DiagramEngine.icons;
            return `<svg viewBox="0 0 780 550" class="diagram-svg">
                <defs>${A}</defs>
                <g data-step="1" class="step-highlight">
                    ${I.subnet(235, 175, 310, 200, 'Hub VNet  10.0.0.0/16', '#0078D4')}
                    ${I.firewall(330, 265, 'Azure Firewall')}
                    ${I.gateway(450, 265, 'VPN Gateway')}
                    ${I.dns(390, 345, 'DNS')}
                </g>
                <g data-step="2" class="step-highlight">
                    ${I.subnet(20, 20, 230, 130, 'Spoke: Production  10.1.0.0/16', '#107C10')}
                    ${I.vm(80, 90, 'Web VMs')}
                    ${I.sql(175, 90, 'SQL DB')}
                </g>
                <g data-step="3" class="step-highlight">
                    ${I.subnet(530, 20, 230, 130, 'Spoke: Dev/Test  10.2.0.0/16', '#FF8C00')}
                    ${I.vm(590, 90, 'Dev VMs')}
                    ${I.vm(690, 90, 'Test')}
                </g>
                <g data-step="4" class="step-highlight">
                    ${I.subnet(20, 400, 230, 130, 'Spoke: Shared Svc  10.3.0.0/16', '#7A3B93')}
                    ${I.storage(80, 465, 'Log Analytics')}
                    ${I.storage(175, 465, 'Key Vault')}
                </g>
                <g data-step="5" class="step-highlight">
                    ${I.subnet(530, 400, 230, 130, 'Spoke: DMZ  10.4.0.0/16', '#D13438')}
                    ${I.firewall(590, 465, 'NVA')}
                    ${I.loadbalancer(690, 465, 'Public LB')}
                </g>
                <g data-step="6" class="step-highlight flow-arrow">
                    <line x1="235" y1="110" x2="305" y2="210" stroke="#0078D4" stroke-width="2" marker-end="url(#ah-0078D4)" class="anim-line"/>
                    <line x1="545" y1="110" x2="485" y2="210" stroke="#0078D4" stroke-width="2" marker-end="url(#ah-0078D4)" class="anim-line"/>
                    <line x1="235" y1="440" x2="305" y2="375" stroke="#0078D4" stroke-width="2" marker-end="url(#ah-0078D4)" class="anim-line"/>
                    <line x1="545" y1="440" x2="485" y2="375" stroke="#0078D4" stroke-width="2" marker-end="url(#ah-0078D4)" class="anim-line"/>
                    <text x="252" y="152" fill="#0078D4" font-size="9" font-family="Segoe UI,sans-serif" transform="rotate(-35,252,152)">VNet Peering</text>
                    <text x="528" y="152" fill="#0078D4" font-size="9" font-family="Segoe UI,sans-serif" transform="rotate(35,528,152)">VNet Peering</text>
                </g>
                <g data-step="7" class="step-highlight">
                    ${I.onprem(390, 25, 'On-Premises')}
                    <line x1="390" y1="60" x2="390" y2="190" stroke="#333" stroke-width="1.5" stroke-dasharray="6" marker-end="url(#ah-333)" class="anim-line"/>
                    <text x="398" y="135" fill="#888" font-size="9" font-family="Segoe UI,sans-serif">VPN / ExpressRoute</text>
                </g>
            </svg>`;
        },

        // ─── NSG FILTERING ──────────────────────
        'nsg-filtering'(diagram) {
            const A = DiagramEngine.arrowDefs(['#333', '#107C10', '#D13438']);
            const I = DiagramEngine.icons;
            return `<svg viewBox="0 0 780 380" class="diagram-svg">
                <defs>${A}</defs>
                <g data-step="1" class="step-highlight">
                    ${I.internet(70, 80, 'Internet')}
                    ${I.user(70, 190, 'Admin')}
                    ${I.user(70, 300, 'Attacker')}
                </g>
                <g data-step="2" class="step-highlight flow-arrow">
                    <line x1="108" y1="80" x2="280" y2="80" stroke="#333" stroke-width="1.5" marker-end="url(#ah-333)" class="anim-line"/>
                    <text x="190" y="72" fill="#333" font-size="10" font-family="Segoe UI,sans-serif">HTTPS :443</text>
                    <line x1="108" y1="190" x2="280" y2="190" stroke="#333" stroke-width="1.5" marker-end="url(#ah-333)" class="anim-line"/>
                    <text x="190" y="182" fill="#333" font-size="10" font-family="Segoe UI,sans-serif">SSH :22</text>
                    <line x1="108" y1="300" x2="280" y2="300" stroke="#D13438" stroke-width="1.5" marker-end="url(#ah-D13438)" class="anim-line"/>
                    <text x="190" y="292" fill="#D13438" font-size="10" font-family="Segoe UI,sans-serif">RDP :3389</text>
                </g>
                <g data-step="3" class="step-highlight">
                    <rect x="290" y="30" width="200" height="310" rx="8" fill="#E8443A08" stroke="#D13438" stroke-width="2"/>
                    ${I.nsg(390, 65, '')}
                    <text x="390" y="48" text-anchor="middle" fill="#D13438" font-size="13" font-weight="700" font-family="Segoe UI,sans-serif">NSG Rules</text>
                    <rect x="310" y="100" width="160" height="28" rx="4" fill="#107C1015" stroke="#107C10" stroke-width="1"/>
                    <text x="390" y="119" text-anchor="middle" fill="#107C10" font-size="10" font-weight="600" font-family="Segoe UI,sans-serif">100: Allow HTTPS</text>
                    <rect x="310" y="136" width="160" height="28" rx="4" fill="#107C1015" stroke="#107C10" stroke-width="1"/>
                    <text x="390" y="155" text-anchor="middle" fill="#107C10" font-size="10" font-weight="600" font-family="Segoe UI,sans-serif">200: Allow SSH (internal)</text>
                    <rect x="310" y="172" width="160" height="28" rx="4" fill="#D1343815" stroke="#D13438" stroke-width="1"/>
                    <text x="390" y="191" text-anchor="middle" fill="#D13438" font-size="10" font-weight="600" font-family="Segoe UI,sans-serif">300: Deny RDP</text>
                    <rect x="310" y="218" width="160" height="28" rx="4" fill="#D1343815" stroke="#D13438" stroke-width="1"/>
                    <text x="390" y="237" text-anchor="middle" fill="#D13438" font-size="10" font-weight="600" font-family="Segoe UI,sans-serif">65500: Deny All</text>
                    <text x="390" y="280" text-anchor="middle" fill="#888" font-size="9" font-family="Segoe UI,sans-serif">First match wins</text>
                    <text x="390" y="295" text-anchor="middle" fill="#888" font-size="9" font-family="Segoe UI,sans-serif">(lowest priority # first)</text>
                </g>
                <g data-step="4" class="step-highlight flow-arrow">
                    <line x1="490" y1="114" x2="575" y2="114" stroke="#107C10" stroke-width="2" marker-end="url(#ah-107C10)" class="anim-line"/>
                    <text x="530" y="106" fill="#107C10" font-size="11" font-weight="600" font-family="Segoe UI,sans-serif">✓ PASS</text>
                </g>
                <g data-step="5" class="step-highlight flow-arrow">
                    <line x1="490" y1="150" x2="575" y2="150" stroke="#107C10" stroke-width="2" marker-end="url(#ah-107C10)" class="anim-line"/>
                    <text x="530" y="142" fill="#107C10" font-size="11" font-weight="600" font-family="Segoe UI,sans-serif">✓ PASS</text>
                </g>
                <g data-step="6" class="step-highlight">
                    <text x="530" y="178" fill="#D13438" font-size="11" font-weight="600" font-family="Segoe UI,sans-serif">✗ DENY</text>
                    <line x1="490" y1="186" x2="530" y2="186" stroke="#D13438" stroke-width="2"/>
                    <line x1="520" y1="179" x2="530" y2="193" stroke="#D13438" stroke-width="3"/>
                    <line x1="530" y1="179" x2="520" y2="193" stroke="#D13438" stroke-width="3"/>
                </g>
                <g data-step="4" class="step-highlight">
                    ${I.vm(640, 135, 'web-vm-01')}
                </g>
            </svg>`;
        },

        // ─── LOAD BALANCER ──────────────────────
        'load-balancer'(diagram) {
            const A = DiagramEngine.arrowDefs(['#333', '#0078D4', '#107C10']);
            const I = DiagramEngine.icons;
            return `<svg viewBox="0 0 780 420" class="diagram-svg">
                <defs>${A}</defs>
                <g data-step="1" class="step-highlight">
                    ${I.user(80, 45, 'Users')}
                    ${I.user(160, 45, '')}
                    ${I.user(240, 45, '')}
                </g>
                <g data-step="2" class="step-highlight">
                    ${I.subnet(20, 100, 330, 115, 'Azure Load Balancer (L4)', '#0078D4')}
                    ${I.loadbalancer(190, 155, 'Standard LB')}
                    <text x="190" y="190" text-anchor="middle" fill="#888" font-size="9" font-family="Segoe UI,sans-serif">TCP/UDP — 5-tuple hash</text>
                </g>
                <g data-step="3" class="step-highlight">
                    ${I.subnet(400, 100, 360, 115, 'Application Gateway (L7)', '#107C10')}
                    ${I.appgateway(580, 155, 'App Gateway')}
                    <text x="580" y="190" text-anchor="middle" fill="#888" font-size="9" font-family="Segoe UI,sans-serif">HTTP — URL path routing</text>
                </g>
                <g data-step="4" class="step-highlight">
                    ${I.vm(100, 300, 'VM-1')}
                    ${I.vm(200, 300, 'VM-2')}
                    ${I.vm(300, 300, 'VM-3')}
                </g>
                <g data-step="5" class="step-highlight">
                    ${I.vm(460, 300, '/api/*')}
                    ${I.vm(570, 300, '/web/*')}
                    ${I.storage(680, 300, '/img/*')}
                </g>
                <g data-step="4" class="step-highlight flow-arrow">
                    <line x1="140" y1="215" x2="100" y2="268" stroke="#0078D4" stroke-width="1.5" marker-end="url(#ah-0078D4)" class="anim-line"/>
                    <line x1="190" y1="215" x2="200" y2="268" stroke="#0078D4" stroke-width="1.5" marker-end="url(#ah-0078D4)" class="anim-line"/>
                    <line x1="240" y1="215" x2="300" y2="268" stroke="#0078D4" stroke-width="1.5" marker-end="url(#ah-0078D4)" class="anim-line"/>
                </g>
                <g data-step="5" class="step-highlight flow-arrow">
                    <line x1="530" y1="215" x2="460" y2="268" stroke="#107C10" stroke-width="1.5" marker-end="url(#ah-107C10)" class="anim-line"/>
                    <line x1="580" y1="215" x2="570" y2="268" stroke="#107C10" stroke-width="1.5" marker-end="url(#ah-107C10)" class="anim-line"/>
                    <line x1="630" y1="215" x2="680" y2="268" stroke="#107C10" stroke-width="1.5" marker-end="url(#ah-107C10)" class="anim-line"/>
                </g>
                <g data-step="6" class="step-highlight">
                    <rect x="70" y="370" width="640" height="34" rx="6" fill="#0078D408" stroke="#0078D4" stroke-width="1"/>
                    <text x="390" y="392" text-anchor="middle" fill="#333" font-size="11" font-weight="500" font-family="Segoe UI,sans-serif">L4 = Fast, protocol-agnostic  |  L7 = Smart, content-aware  |  Front Door = Global L7</text>
                </g>
            </svg>`;
        },

        // ─── VPN TUNNEL ─────────────────────────
        'vpn-tunnel'(diagram) {
            const A = DiagramEngine.arrowDefs(['#333', '#0078D4']);
            const I = DiagramEngine.icons;
            return `<svg viewBox="0 0 780 300" class="diagram-svg">
                <defs>${A}
                    <linearGradient id="tg" x1="0%" x2="100%"><stop offset="0%" stop-color="#0078D4" stop-opacity="0.08"/><stop offset="50%" stop-color="#00BCF2" stop-opacity="0.18"/><stop offset="100%" stop-color="#0078D4" stop-opacity="0.08"/></linearGradient>
                </defs>
                <g data-step="1" class="step-highlight">
                    ${I.subnet(20, 50, 220, 180, 'On-Premises  192.168.0.0/16', '#505050')}
                    ${I.vm(90, 130, 'Servers')}
                    ${I.onprem(180, 130, 'VPN Device')}
                </g>
                <g data-step="2" class="step-highlight">
                    <rect x="260" y="95" width="260" height="80" rx="40" fill="url(#tg)" stroke="#0078D4" stroke-width="1.5" stroke-dasharray="8"/>
                    <text x="390" y="130" text-anchor="middle" fill="#0078D4" font-size="11" font-weight="600" font-family="Segoe UI,sans-serif">IPsec/IKE Encrypted Tunnel</text>
                    <text x="390" y="148" text-anchor="middle" fill="#888" font-size="9" font-family="Segoe UI,sans-serif">AES-256  |  Over Public Internet</text>
                    <circle r="5" fill="#FFB900"><animateMotion dur="2.5s" repeatCount="indefinite" path="M270,135 L510,135"/></circle>
                </g>
                <g data-step="3" class="step-highlight">
                    ${I.subnet(540, 50, 220, 180, 'Azure VNet  10.0.0.0/16', '#0078D4')}
                    ${I.gateway(610, 130, 'VPN Gateway')}
                    ${I.vm(700, 130, 'Azure VMs')}
                </g>
                <g data-step="4" class="step-highlight">
                    <text x="390" y="270" text-anchor="middle" fill="#333" font-size="13" font-weight="600" font-family="Segoe UI,sans-serif">Site-to-Site VPN Connection</text>
                    <text x="390" y="290" text-anchor="middle" fill="#888" font-size="10" font-family="Segoe UI,sans-serif">Extends on-premises network into Azure securely</text>
                </g>
            </svg>`;
        },

        // ─── WAF INSPECTION ─────────────────────
        'waf-inspection'(diagram) {
            const A = DiagramEngine.arrowDefs(['#333', '#107C10', '#D13438']);
            const I = DiagramEngine.icons;
            return `<svg viewBox="0 0 780 380" class="diagram-svg">
                <defs>${A}</defs>
                <g data-step="1" class="step-highlight">
                    <rect x="15" y="20" width="170" height="48" rx="6" fill="#107C1010" stroke="#107C10" stroke-width="1"/>
                    <text x="100" y="50" text-anchor="middle" fill="#107C10" font-size="11" font-weight="600" font-family="Segoe UI,sans-serif">GET /products</text>
                    <rect x="15" y="80" width="170" height="48" rx="6" fill="#D1343810" stroke="#D13438" stroke-width="1"/>
                    <text x="100" y="110" text-anchor="middle" fill="#D13438" font-size="10" font-weight="600" font-family="Segoe UI,sans-serif">GET /?id=1' OR 1=1</text>
                    <rect x="15" y="140" width="170" height="48" rx="6" fill="#D1343810" stroke="#D13438" stroke-width="1"/>
                    <text x="100" y="170" text-anchor="middle" fill="#D13438" font-size="10" font-weight="600" font-family="Segoe UI,sans-serif">&lt;script&gt;alert()&lt;/script&gt;</text>
                    <rect x="15" y="200" width="170" height="48" rx="6" fill="#D1343810" stroke="#D13438" stroke-width="1"/>
                    <text x="100" y="230" text-anchor="middle" fill="#D13438" font-size="10" font-weight="600" font-family="Segoe UI,sans-serif">1M req/s flood</text>
                </g>
                <g data-step="2" class="step-highlight flow-arrow">
                    <line x1="185" y1="44" x2="250" y2="135" stroke="#107C10" stroke-width="1.5" marker-end="url(#ah-107C10)" class="anim-line"/>
                    <line x1="185" y1="104" x2="250" y2="155" stroke="#D13438" stroke-width="1.5" marker-end="url(#ah-D13438)" class="anim-line"/>
                    <line x1="185" y1="164" x2="250" y2="175" stroke="#D13438" stroke-width="1.5" marker-end="url(#ah-D13438)" class="anim-line"/>
                    <line x1="185" y1="224" x2="250" y2="195" stroke="#D13438" stroke-width="1.5" marker-end="url(#ah-D13438)" class="anim-line"/>
                </g>
                <g data-step="3" class="step-highlight">
                    <rect x="255" y="30" width="230" height="270" rx="10" fill="#E8443A08" stroke="#D13438" stroke-width="2"/>
                    ${I.waf(370, 65, '')}
                    <text x="370" y="48" text-anchor="middle" fill="#D13438" font-size="13" font-weight="700" font-family="Segoe UI,sans-serif">WAF</text>
                    <text x="370" y="105" text-anchor="middle" fill="#888" font-size="9" font-family="Segoe UI,sans-serif">OWASP 3.2 Rules</text>
                    <rect x="275" y="115" width="190" height="22" rx="3" fill="#fff" stroke="#D13438" stroke-width="1"/>
                    <text x="370" y="130" text-anchor="middle" fill="#D13438" font-size="9" font-family="Segoe UI,sans-serif">SQL Injection Detection</text>
                    <rect x="275" y="143" width="190" height="22" rx="3" fill="#fff" stroke="#D13438" stroke-width="1"/>
                    <text x="370" y="158" text-anchor="middle" fill="#D13438" font-size="9" font-family="Segoe UI,sans-serif">XSS Pattern Matching</text>
                    <rect x="275" y="171" width="190" height="22" rx="3" fill="#fff" stroke="#D13438" stroke-width="1"/>
                    <text x="370" y="186" text-anchor="middle" fill="#D13438" font-size="9" font-family="Segoe UI,sans-serif">Rate Limiting</text>
                    <rect x="275" y="199" width="190" height="22" rx="3" fill="#fff" stroke="#D13438" stroke-width="1"/>
                    <text x="370" y="214" text-anchor="middle" fill="#D13438" font-size="9" font-family="Segoe UI,sans-serif">Bot Protection</text>
                    <rect x="275" y="227" width="190" height="22" rx="3" fill="#fff" stroke="#D13438" stroke-width="1"/>
                    <text x="370" y="242" text-anchor="middle" fill="#D13438" font-size="9" font-family="Segoe UI,sans-serif">Geo-Filtering</text>
                    <text x="370" y="278" text-anchor="middle" fill="#888" font-size="9" font-style="italic" font-family="Segoe UI,sans-serif">Detection → Prevention</text>
                </g>
                <g data-step="4" class="step-highlight flow-arrow">
                    <line x1="485" y1="120" x2="570" y2="120" stroke="#107C10" stroke-width="2" marker-end="url(#ah-107C10)" class="anim-line"/>
                    <text x="525" y="112" fill="#107C10" font-size="11" font-weight="600" font-family="Segoe UI,sans-serif">✓ PASS</text>
                </g>
                <g data-step="5" class="step-highlight">
                    <rect x="495" y="170" width="120" height="80" rx="6" fill="#D1343810" stroke="#D13438" stroke-width="1.5"/>
                    <text x="555" y="200" text-anchor="middle" fill="#D13438" font-size="12" font-weight="700" font-family="Segoe UI,sans-serif">BLOCKED</text>
                    <text x="555" y="218" text-anchor="middle" fill="#D13438" font-size="10" font-family="Segoe UI,sans-serif">HTTP 403</text>
                    <text x="555" y="237" text-anchor="middle" fill="#888" font-size="9" font-family="Segoe UI,sans-serif">Logged → Sentinel</text>
                </g>
                <g data-step="4" class="step-highlight">
                    ${I.vm(640, 120, 'Web App')}
                </g>
                <g data-step="6" class="step-highlight">
                    <rect x="80" y="325" width="600" height="30" rx="6" fill="#0078D408" stroke="#0078D4" stroke-width="1"/>
                    <text x="380" y="345" text-anchor="middle" fill="#333" font-size="11" font-family="Segoe UI,sans-serif">WAF Modes: Detection (log only) → Prevention (block+log) | Works with Front Door, App GW, CDN</text>
                </g>
            </svg>`;
        },

        // ─── PACKET JOURNEY ─────────────────────
        'packet-journey'(diagram) {
            const A = DiagramEngine.arrowDefs(['#333', '#0078D4']);
            const I = DiagramEngine.icons;
            const nodes = [
                { fn: 'vm', x: 55, label: 'Your PC' },
                { fn: 'onprem', x: 175, label: 'Router' },
                { fn: 'internet', x: 315, label: 'ISP' },
                { fn: 'edge', x: 455, label: 'Azure Edge' },
                { fn: 'cloud', x: 595, label: 'Azure DC' },
                { fn: 'vm', x: 720, label: 'VM' },
            ];
            return `<svg viewBox="0 0 780 300" class="diagram-svg">
                <defs>${A}</defs>
                ${nodes.map((n, i) => `<g data-step="${i + 1}" class="step-highlight">${I[n.fn](n.x, 120, n.label)}</g>`).join('')}
                ${nodes.slice(0, -1).map((n, i) => `<g data-step="${i + 2}" class="step-highlight flow-arrow">
                    <line x1="${n.x + 42}" y1="120" x2="${nodes[i + 1].x - 42}" y2="120" stroke="#333" stroke-width="1.5" marker-end="url(#ah-333)" class="anim-line"/>
                </g>`).join('')}
                <g data-step="2" class="step-highlight">
                    <text x="115" y="60" text-anchor="middle" fill="#888" font-size="9" font-family="Segoe UI,sans-serif">Private → NAT</text>
                </g>
                <g data-step="4" class="step-highlight">
                    <text x="385" y="60" text-anchor="middle" fill="#00BCF2" font-size="9" font-family="Segoe UI,sans-serif">Enters MS backbone</text>
                </g>
                <line x1="55" y1="220" x2="720" y2="220" stroke="#e0e0e0" stroke-width="1"/>
                ${['NIC/Driver', 'Default GW', 'BGP Routing', 'Anycast', 'Backbone', 'Deliver'].map((label, i) => `
                    <g data-step="${i + 1}" class="step-highlight">
                        <circle cx="${55 + i * 133}" cy="220" r="4" fill="#0078D4"/>
                        <text x="${55 + i * 133}" y="240" text-anchor="middle" fill="#888" font-size="9" font-family="Segoe UI,sans-serif">${label}</text>
                    </g>
                `).join('')}
                <text x="390" y="278" text-anchor="middle" fill="#333" font-size="12" font-weight="600" font-family="Segoe UI,sans-serif">How a packet travels from your PC to an Azure VM</text>
            </svg>`;
        },

        // ─── FRONT DOOR RULES ENGINE ────────────
        'frontdoor-rules-engine'(diagram) {
            const A = DiagramEngine.arrowDefs(['#333', '#0078D4', '#107C10']);
            const I = DiagramEngine.icons;
            return `<svg viewBox="0 0 800 440" class="diagram-svg">
                <defs>${A}</defs>
                <g data-step="1" class="step-highlight">
                    ${I.internet(70, 200, 'Incoming Request')}
                    <text x="70" y="250" text-anchor="middle" fill="#888" font-size="9" font-family="Segoe UI,sans-serif">GET /api/v2/users</text>
                </g>
                <g data-step="2" class="step-highlight">
                    <rect x="180" y="20" width="410" height="400" rx="10" fill="#0078D406" stroke="#0078D4" stroke-width="1.5"/>
                    <text x="385" y="45" text-anchor="middle" fill="#0078D4" font-size="13" font-weight="700" font-family="Segoe UI,sans-serif">Front Door Rules Engine Pipeline</text>
                </g>
                <g data-step="2" class="step-highlight flow-arrow">
                    <line x1="108" y1="200" x2="178" y2="200" stroke="#333" stroke-width="1.5" marker-end="url(#ah-333)" class="anim-line"/>
                </g>
                ${[
                    { y: 60, color: '#0078D4', label: 'Rule Set 1: Request Modifications', rules: ['IF path /api/* → Add header', 'IF device=Mobile → Route mobile pool'] },
                    { y: 160, color: '#D13438', label: 'Rule Set 2: Security', rules: ['IF geo=blocked → Return 403', 'IF rate>100/min → Return 429'] },
                    { y: 260, color: '#FF8C00', label: 'Rule Set 3: URL Rewrites', rules: ['IF /old-api/* → Redirect /api/v2/*'] },
                    { y: 330, color: '#107C10', label: 'Rule Set 4: Cache Overrides', rules: ['IF ext=.js,.css → Cache 7 days'] },
                ].map((rs, i) => `<g data-step="${i + 3}" class="step-highlight">
                    <rect x="200" y="${rs.y}" width="370" height="${rs.rules.length * 28 + 28}" rx="6" fill="#fff" stroke="${rs.color}" stroke-width="1.5"/>
                    <text x="215" y="${rs.y + 18}" fill="${rs.color}" font-size="11" font-weight="600" font-family="Segoe UI,sans-serif">${rs.label}</text>
                    ${rs.rules.map((r, ri) => `<text x="225" y="${rs.y + 38 + ri * 24}" fill="#555" font-size="10" font-family="Segoe UI,sans-serif">${r}</text>`).join('')}
                </g>`).join('')}
                <g data-step="7" class="step-highlight flow-arrow">
                    <line x1="590" y1="200" x2="640" y2="200" stroke="#107C10" stroke-width="2" marker-end="url(#ah-107C10)" class="anim-line"/>
                </g>
                <g data-step="7" class="step-highlight">
                    ${I.vm(700, 200, 'Origin')}
                    <text x="700" y="250" text-anchor="middle" fill="#888" font-size="9" font-family="Segoe UI,sans-serif">Modified request</text>
                </g>
            </svg>`;
        },

        // ─── AZURE REGIONS ──────────────────────
        'azure-regions'(diagram) {
            const A = DiagramEngine.arrowDefs(['#0078D4']);
            const I = DiagramEngine.icons;
            return `<svg viewBox="0 0 780 380" class="diagram-svg">
                <defs>${A}</defs>
                <text x="390" y="28" text-anchor="middle" fill="#333" font-size="14" font-weight="600" font-family="Segoe UI,sans-serif">Azure Global Infrastructure</text>
                <g data-step="1" class="step-highlight">
                    <circle cx="140" cy="130" r="50" fill="#0078D410" stroke="#0078D4" stroke-width="1.5"/>
                    <text x="140" y="100" text-anchor="middle" fill="#0078D4" font-size="11" font-weight="700" font-family="Segoe UI,sans-serif">East US</text>
                    <text x="140" y="115" text-anchor="middle" fill="#888" font-size="9" font-family="Segoe UI,sans-serif">Virginia</text>
                    ${I.cloud(100, 155, '')}  ${I.cloud(180, 155, '')}
                </g>
                <g data-step="2" class="step-highlight">
                    <circle cx="390" cy="110" r="50" fill="#107C1010" stroke="#107C10" stroke-width="1.5"/>
                    <text x="390" y="80" text-anchor="middle" fill="#107C10" font-size="11" font-weight="700" font-family="Segoe UI,sans-serif">West Europe</text>
                    <text x="390" y="95" text-anchor="middle" fill="#888" font-size="9" font-family="Segoe UI,sans-serif">Netherlands</text>
                    ${I.cloud(350, 135, '')}  ${I.cloud(430, 135, '')}
                </g>
                <g data-step="3" class="step-highlight">
                    <circle cx="630" cy="130" r="50" fill="#FF8C0010" stroke="#FF8C00" stroke-width="1.5"/>
                    <text x="630" y="100" text-anchor="middle" fill="#FF8C00" font-size="11" font-weight="700" font-family="Segoe UI,sans-serif">SE Asia</text>
                    <text x="630" y="115" text-anchor="middle" fill="#888" font-size="9" font-family="Segoe UI,sans-serif">Singapore</text>
                    ${I.cloud(590, 155, '')}  ${I.cloud(670, 155, '')}
                </g>
                <g data-step="4" class="step-highlight flow-arrow">
                    <line x1="190" y1="130" x2="340" y2="110" stroke="#0078D4" stroke-width="1.5" stroke-dasharray="6" marker-end="url(#ah-0078D4)" class="anim-line"/>
                    <line x1="440" y1="110" x2="580" y2="130" stroke="#0078D4" stroke-width="1.5" stroke-dasharray="6" marker-end="url(#ah-0078D4)" class="anim-line"/>
                    <text x="390" y="78" text-anchor="middle" fill="#0078D4" font-size="9" font-weight="500" font-family="Segoe UI,sans-serif">Microsoft Backbone (165K+ miles)</text>
                </g>
                <g data-step="5" class="step-highlight">
                    ${I.subnet(50, 225, 300, 80, 'Availability Zones (East US)', '#0078D4')}
                    ${I.cloud(120, 270, 'Zone 1')}
                    ${I.cloud(210, 270, 'Zone 2')}
                    ${I.cloud(300, 270, 'Zone 3')}
                </g>
                <g data-step="6" class="step-highlight">
                    ${I.subnet(420, 225, 320, 80, 'Region Pairs (Disaster Recovery)', '#107C10')}
                    ${I.cloud(490, 270, 'East US')}
                    <text x="570" y="275" text-anchor="middle" fill="#333" font-size="14" font-family="Segoe UI,sans-serif">↔</text>
                    ${I.cloud(640, 270, 'West US')}
                    <text x="580" y="300" text-anchor="middle" fill="#888" font-size="9" font-family="Segoe UI,sans-serif">GRS auto-replication</text>
                </g>
            </svg>`;
        },

        // ─── VNET PEERING ───────────────────────
        'vnet-peering'(diagram) {
            const A = DiagramEngine.arrowDefs(['#0078D4', '#333']);
            const I = DiagramEngine.icons;
            return `<svg viewBox="0 0 780 380" class="diagram-svg">
                <defs>${A}</defs>
                <g data-step="1" class="step-highlight">
                    ${I.subnet(20, 30, 300, 150, 'VNet A: 10.0.0.0/16  (East US)', '#0078D4')}
                    ${I.vm(100, 115, 'VM-A1')}
                    ${I.vm(230, 115, 'VM-A2')}
                    <text x="170" y="165" text-anchor="middle" fill="#888" font-size="9" font-family="Segoe UI,sans-serif">Subscription: Prod-01</text>
                </g>
                <g data-step="2" class="step-highlight">
                    ${I.subnet(460, 30, 300, 150, 'VNet B: 10.1.0.0/16  (West EU)', '#107C10')}
                    ${I.vm(540, 115, 'VM-B1')}
                    ${I.vm(670, 115, 'VM-B2')}
                    <text x="610" y="165" text-anchor="middle" fill="#888" font-size="9" font-family="Segoe UI,sans-serif">Subscription: Dev-02</text>
                </g>
                <g data-step="3" class="step-highlight flow-arrow">
                    <rect x="320" y="75" width="140" height="55" rx="6" fill="#fff" stroke="#0078D4" stroke-width="1.5"/>
                    <text x="390" y="97" text-anchor="middle" fill="#0078D4" font-size="11" font-weight="600" font-family="Segoe UI,sans-serif">VNet Peering</text>
                    <text x="390" y="115" text-anchor="middle" fill="#888" font-size="9" font-family="Segoe UI,sans-serif">MS Backbone</text>
                    <line x1="320" y1="100" x2="275" y2="100" stroke="#0078D4" stroke-width="1.5" marker-end="url(#ah-0078D4)" class="anim-line"/>
                    <line x1="460" y1="100" x2="505" y2="100" stroke="#0078D4" stroke-width="1.5" marker-end="url(#ah-0078D4)" class="anim-line"/>
                </g>
                <g data-step="4" class="step-highlight">
                    <rect x="20" y="210" width="740" height="150" rx="8" fill="#0078D406" stroke="#0078D4" stroke-width="1"/>
                    <text x="390" y="235" text-anchor="middle" fill="#333" font-size="12" font-weight="600" font-family="Segoe UI,sans-serif">Key Properties</text>
                    <text x="50" y="260" fill="#107C10" font-size="11" font-family="Segoe UI,sans-serif">✓ Non-transitive — A↔B and B↔C ≠ A↔C</text>
                    <text x="50" y="282" fill="#107C10" font-size="11" font-family="Segoe UI,sans-serif">✓ Cross-subscription & cross-region (global peering)</text>
                    <text x="50" y="304" fill="#107C10" font-size="11" font-family="Segoe UI,sans-serif">✓ Traffic stays on Microsoft backbone</text>
                    <text x="50" y="326" fill="#107C10" font-size="11" font-family="Segoe UI,sans-serif">✓ No IP overlap allowed</text>
                    <text x="420" y="260" fill="#D13438" font-size="11" font-family="Segoe UI,sans-serif">✗ Cannot peer VNets with overlapping CIDR</text>
                    <text x="420" y="282" fill="#D13438" font-size="11" font-family="Segoe UI,sans-serif">✗ Each direction configured independently</text>
                    <text x="420" y="304" fill="#FF8C00" font-size="11" font-family="Segoe UI,sans-serif">⚠ Gateway transit requires explicit config</text>
                </g>
            </svg>`;
        },

        // ─── FRONT DOOR CACHING ─────────────────
        'frontdoor-caching'(diagram) {
            const A = DiagramEngine.arrowDefs(['#333', '#0078D4', '#107C10', '#FF8C00', '#D13438']);
            const I = DiagramEngine.icons;
            return `<svg viewBox="0 0 780 370" class="diagram-svg">
                <defs>${A}</defs>
                <text x="390" y="24" text-anchor="middle" fill="#333" font-size="14" font-weight="600" font-family="Segoe UI,sans-serif">Front Door Caching — Miss vs Hit</text>
                <g data-step="1" class="step-highlight">${I.user(60, 80, 'User (1st)')}</g>
                <g data-step="2" class="step-highlight flow-arrow">
                    <line x1="98" y1="80" x2="178" y2="80" stroke="#333" stroke-width="1.5" marker-end="url(#ah-333)" class="anim-line"/>
                    <text x="140" y="72" fill="#888" font-size="9" font-family="Segoe UI,sans-serif">GET /style.css</text>
                </g>
                <g data-step="3" class="step-highlight">
                    ${I.edge(240, 80, 'Edge POP')}
                    <text x="240" y="128" text-anchor="middle" fill="#D13438" font-size="10" font-weight="600" font-family="Segoe UI,sans-serif">MISS ✗</text>
                </g>
                <g data-step="4" class="step-highlight flow-arrow">
                    <line x1="282" y1="80" x2="378" y2="80" stroke="#FF8C00" stroke-width="1.5" marker-end="url(#ah-FF8C00)" class="anim-line"/>
                    <text x="330" y="72" fill="#888" font-size="9" font-family="Segoe UI,sans-serif">→ origin</text>
                </g>
                <g data-step="5" class="step-highlight">
                    ${I.vm(440, 80, 'Origin Server')}
                </g>
                <g data-step="5" class="step-highlight flow-arrow">
                    <path d="M440,115 Q440,145 240,145 Q60,145 60,118" stroke="#107C10" stroke-width="1.5" fill="none" marker-end="url(#ah-107C10)" class="anim-line"/>
                    <text x="250" y="140" fill="#107C10" font-size="9" font-weight="500" font-family="Segoe UI,sans-serif">200 OK + cached at edge</text>
                </g>
                <g data-step="6" class="step-highlight">${I.user(60, 230, 'User (2nd)')}</g>
                <g data-step="7" class="step-highlight flow-arrow">
                    <line x1="98" y1="230" x2="178" y2="230" stroke="#333" stroke-width="1.5" marker-end="url(#ah-333)" class="anim-line"/>
                    <text x="140" y="222" fill="#888" font-size="9" font-family="Segoe UI,sans-serif">GET /style.css</text>
                </g>
                <g data-step="8" class="step-highlight">
                    ${I.edge(240, 230, 'Edge POP')}
                    <text x="240" y="278" text-anchor="middle" fill="#107C10" font-size="10" font-weight="700" font-family="Segoe UI,sans-serif">HIT ✓</text>
                </g>
                <g data-step="8" class="step-highlight flow-arrow">
                    <path d="M198,240 Q130,250 80,240" stroke="#107C10" stroke-width="2" fill="none" marker-end="url(#ah-107C10)" class="anim-line"/>
                    <text x="130" y="262" fill="#107C10" font-size="10" font-weight="600" font-family="Segoe UI,sans-serif">Instant! No origin hit</text>
                </g>
                <g data-step="9" class="step-highlight">
                    <rect x="60" y="310" width="660" height="35" rx="6" fill="#0078D406" stroke="#0078D4" stroke-width="1"/>
                    <text x="390" y="332" text-anchor="middle" fill="#333" font-size="11" font-family="Segoe UI,sans-serif">Cache-Control: max-age  |  Purge API  |  Query string modes  |  Compression at edge</text>
                </g>
            </svg>`;
        },

        // ─── EXPRESSROUTE ───────────────────────
        'expressroute'(diagram) {
            const A = DiagramEngine.arrowDefs(['#333', '#0078D4', '#7A3B93']);
            const I = DiagramEngine.icons;
            return `<svg viewBox="0 0 780 310" class="diagram-svg">
                <defs>${A}</defs>
                <g data-step="1" class="step-highlight">
                    ${I.subnet(15, 40, 180, 200, 'On-Premises DC', '#505050')}
                    ${I.vm(105, 110, 'Enterprise Apps')}
                    ${I.sql(105, 190, 'Databases')}
                </g>
                <g data-step="2" class="step-highlight">
                    ${I.subnet(230, 80, 120, 120, 'Provider', '#7A3B93')}
                    ${I.gateway(290, 140, 'Equinix / AT&T')}
                </g>
                <g data-step="2" class="step-highlight flow-arrow">
                    <line x1="195" y1="140" x2="248" y2="140" stroke="#333" stroke-width="2" marker-end="url(#ah-333)" class="anim-line"/>
                </g>
                <g data-step="3" class="step-highlight">
                    ${I.subnet(390, 80, 120, 120, 'MS Edge (MSEE)', '#0078D4')}
                    ${I.edge(450, 140, 'Redundant Pair')}
                </g>
                <g data-step="3" class="step-highlight flow-arrow">
                    <line x1="350" y1="130" x2="408" y2="130" stroke="#0078D4" stroke-width="2.5" marker-end="url(#ah-0078D4)" class="anim-line"/>
                    <line x1="350" y1="150" x2="408" y2="150" stroke="#7A3B93" stroke-width="2.5" marker-end="url(#ah-7A3B93)" class="anim-line"/>
                    <text x="378" y="122" text-anchor="middle" fill="#0078D4" font-size="8" font-family="Segoe UI,sans-serif">Primary</text>
                    <text x="378" y="168" text-anchor="middle" fill="#7A3B93" font-size="8" font-family="Segoe UI,sans-serif">Secondary</text>
                </g>
                <g data-step="4" class="step-highlight">
                    ${I.subnet(550, 40, 210, 220, 'Azure', '#0078D4')}
                    ${I.vnet(655, 100, 'VNet')}
                    ${I.vm(655, 170, 'Azure VMs')}
                    ${I.storage(655, 240, 'Storage / SQL')}
                </g>
                <g data-step="4" class="step-highlight flow-arrow">
                    <line x1="510" y1="140" x2="568" y2="140" stroke="#0078D4" stroke-width="1.5" marker-end="url(#ah-0078D4)" class="anim-line"/>
                </g>
                <g data-step="5" class="step-highlight">
                    <rect x="40" y="270" width="700" height="28" rx="4" fill="#0078D406" stroke="#0078D4" stroke-width="1"/>
                    <text x="390" y="289" text-anchor="middle" fill="#333" font-size="11" font-family="Segoe UI,sans-serif">ExpressRoute: Private circuit | 50 Mbps–100 Gbps | 99.95% SLA | NOT encrypted by default</text>
                </g>
            </svg>`;
        },

        // ─── GENERIC STEP FLOWCHART (fallback) ───
        // Used when a diagram.type has no custom builder. Renders the
        // steps array as a clean vertical flow of numbered cards which
        // light up as the user steps through.
        _generic(diagram) {
            const steps = diagram.steps || [];
            const n = steps.length || 1;
            const cardH = 62;
            const gap = 18;
            const totalH = 70 + n * (cardH + gap) + 30;
            const cards = steps.map((txt, i) => {
                const y = 70 + i * (cardH + gap);
                const step = i + 1;
                const escaped = String(txt).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
                // Wrap long text
                const words = escaped.split(' ');
                const lines = [];
                let cur = '';
                for (const w of words) {
                    if ((cur + ' ' + w).length > 78) { lines.push(cur); cur = w; }
                    else cur = cur ? cur + ' ' + w : w;
                }
                if (cur) lines.push(cur);
                const textSvg = lines.slice(0, 2).map((ln, li) =>
                    `<text x="90" y="${y + 28 + li * 16}" fill="#24292f" font-size="12.5" font-family="Segoe UI,sans-serif">${ln}</text>`
                ).join('');
                return `<g data-step="${step}" class="step-highlight">
                    <rect x="30" y="${y}" width="720" height="${cardH}" rx="10" fill="#fff" stroke="#d0d7de" stroke-width="1.2" filter="url(#genshadow)"/>
                    <circle cx="60" cy="${y + cardH/2}" r="18" fill="#0078D4"/>
                    <text x="60" y="${y + cardH/2 + 5}" text-anchor="middle" fill="#fff" font-size="13" font-weight="700" font-family="Segoe UI,sans-serif">${step}</text>
                    ${textSvg}
                </g>`;
            }).join('');
            const title = String(diagram.icon || '•') + ' ' + (diagram.title || '').replace(/&/g,'&amp;').replace(/</g,'&lt;');
            return `<svg viewBox="0 0 780 ${totalH}" class="diagram-svg">
                <defs>
                    <filter id="genshadow" x="-2%" y="-2%" width="104%" height="110%">
                        <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#000" flood-opacity="0.08"/>
                    </filter>
                </defs>
                <text x="390" y="32" text-anchor="middle" fill="#24292f" font-size="15" font-weight="600" font-family="Segoe UI,sans-serif">${title}</text>
                ${cards}
            </svg>`;
        },
    },
};
