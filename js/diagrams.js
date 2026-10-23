const DiagramEngine = {
    serial: 0,
    instances: new Map(),
    kinds: { request: 'Request', response: 'Response', config: 'Configuration', blocked: 'Blocked path' },

    escapeHtml(value) {
        const characters = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
        return String(value ?? '').replace(/[&<>"']/g, character => characters[character]);
    },

    transition(state, action, count) {
        if (action === 'overview' || action === 'reset') return { ...state, step: 0, overview: true, pending: false, answer: null };
        const step = action === 'previous' ? Math.max(0, state.step - 1) : state.overview ? 1 : Math.min(count, state.step + 1);
        return { ...state, step, overview: false, pending: false, answer: null };
    },

    geometry(model) {
        const nodes = model.nodes.map(node => ({ ...node, x: 64 + node.col * 304, y: 96 + node.row * 204, width: 232, height: 112 }));
        return {
            nodes,
            width: Math.max(...nodes.map(node => node.x + node.width)) + 64,
            height: Math.max(...nodes.map(node => node.y + node.height)) + 60
        };
    },

    wrap(value, length) {
        const lines = [];
        for (const word of String(value).split(/\s+/)) {
            if (!lines.length || lines.at(-1).length + word.length + 1 > length) lines.push(word);
            else lines[lines.length - 1] += ` ${word}`;
        }
        return lines;
    },

    nodeSvg(node, focused) {
        const title = this.wrap(node.label, 25);
        const detail = this.wrap(node.detail, 31);
        return `<g class="trace-node${focused ? ' is-current' : ''}" data-item="${node.id}" transform="translate(${node.x},${node.y})">
            <rect width="${node.width}" height="${node.height}" rx="10"/>
            <text x="14" y="26" font-size="16" class="trace-node-title">${title.map((line, index) => `<tspan x="14" dy="${index ? 19 : 0}">${this.escapeHtml(line)}</tspan>`).join('')}</text>
            <text x="14" y="${title.length > 1 ? 68 : 56}" font-size="13" class="trace-node-detail">${detail.map((line, index) => `<tspan x="14" dy="${index ? 16 : 0}">${this.escapeHtml(line)}</tspan>`).join('')}</text>
        </g>`;
    },

    boundarySvg(group, nodes) {
        const members = nodes.filter(node => node.group === group.id);
        if (!members.length) return '';
        const x = Math.min(...members.map(node => node.x)) - 18;
        const y = Math.min(...members.map(node => node.y)) - 56;
        const width = Math.max(...members.map(node => node.x + node.width)) - x + 18;
        const height = Math.max(...members.map(node => node.y + node.height)) - y + 18;
        const lines = this.wrap(group.label, Math.floor((width - 24) / 7.5));
        return `<g class="trace-boundary"><rect x="${x}" y="${y}" width="${width}" height="${height}" rx="14"/>
            <text x="${x + 12}" y="${y + 21}" font-size="13">${lines.map((line, index) => `<tspan x="${x + 12}" dy="${index ? 16 : 0}">${this.escapeHtml(line)}</tspan>`).join('')}</text></g>`;
    },

    edgePath(link, nodes, index) {
        const from = nodes.find(node => node.id === link.from);
        const to = nodes.find(node => node.id === link.to);
        const lane = link.kind === 'response' ? -12 : link.kind === 'config' ? 12 : 0;
        const fx = from.x + from.width / 2 + lane;
        const fy = from.y + from.height / 2 + lane;
        const tx = to.x + to.width / 2 + lane;
        const ty = to.y + to.height / 2 + lane;
        if (from.row === to.row && Math.abs(from.col - to.col) === 1) {
            const right = to.col > from.col;
            return `M ${right ? from.x + from.width : from.x} ${fy} H ${right ? to.x - 4 : to.x + to.width + 4}`;
        }
        if (from.row === to.row) {
            const corridor = from.y + from.height + 30 + lane;
            return `M ${fx} ${from.y + from.height} V ${corridor} H ${tx} V ${to.y + to.height + 4}`;
        }
        if (from.col === to.col && from.group === to.group && Math.abs(from.row - to.row) === 1) {
            const down = to.row > from.row;
            return `M ${fx} ${down ? from.y + from.height : from.y} V ${down ? to.y - 4 : to.y + to.height + 4}`;
        }
        if (Math.abs(from.col - to.col) === 1) {
            const right = to.col > from.col;
            const sx = right ? from.x + from.width : from.x;
            const ex = right ? to.x - 4 : to.x + to.width + 4;
            const bend = (sx + ex) / 2 + lane;
            return `M ${sx} ${fy} H ${bend} V ${ty} H ${ex}`;
        }
        const sharedBoundary = from.col === to.col && from.group && from.group === to.group;
        const outer = sharedBoundary ? from.x - 12 + lane / 4 : Math.min(from.x, to.x) - 30 - (index % 3) * 8;
        return `M ${from.x} ${fy} H ${outer} V ${ty} H ${to.x - 4}`;
    },

    svg(model, instance, state = { overview: true, step: 0 }) {
        const geometry = this.geometry(model);
        const selected = state.overview ? [] : model.steps[state.step - 1]?.focus || [];
        const focus = new Set(selected);
        model.edges.filter(link => focus.has(link.id)).forEach(link => { focus.add(link.from); focus.add(link.to); });
        const markers = Object.keys(this.kinds).map(kind => `<marker id="${instance}-${kind}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M 1 1 L 9 5 L 1 9 Z" class="trace-marker-${kind}"/></marker>`).join('');
        return `<svg class="trace-map" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${geometry.width} ${geometry.height}" width="${geometry.width}" height="${geometry.height}" role="img" aria-labelledby="${instance}-title ${instance}-description">
            <title id="${instance}-title">${this.escapeHtml(model.title)}</title>
            <desc id="${instance}-description">${this.escapeHtml(`${model.summary} ${model.scenarioSummary} Arrows show direction. Solid: request; dashed: response; dotted: configuration; cross-dashed: blocked path. The ordered explanation below describes every connection.`)}</desc>
            <defs>${markers}</defs>
            ${model.groups.map(group => this.boundarySvg(group, geometry.nodes)).join('')}
            ${model.edges.map((link, index) => `<g class="trace-edge trace-${link.kind}${focus.has(link.id) ? ' is-current' : ''}" data-item="${link.id}" data-from="${link.from}" data-to="${link.to}"><title>${this.escapeHtml(link.label)}</title><path d="${this.edgePath(link, geometry.nodes, index)}" marker-end="url(#${instance}-${link.kind})"/></g>`).join('')}
            ${geometry.nodes.map(node => this.nodeSvg(node, focus.has(node.id))).join('')}
        </svg>`;
    },

    connections(model, step) {
        const links = model.edges.filter(link => step.focus.includes(link.id));
        if (!links.length) return step.focus.map(id => model.nodes.find(node => node.id === id)?.label).filter(Boolean).map(value => `<span class="diagram-node-chip">${this.escapeHtml(value)}</span>`).join('');
        return links.map(link => {
            const from = model.nodes.find(node => node.id === link.from).label;
            const to = model.nodes.find(node => node.id === link.to).label;
            return `<div class="diagram-connection trace-${link.kind}"><span class="diagram-connection-kind">${this.kinds[link.kind]}</span>
                <span>${this.escapeHtml(from)} <span aria-hidden="true">&rarr;</span><span class="sr-only">to</span> ${this.escapeHtml(to)}</span>
                <small>${this.escapeHtml(link.label)}</small></div>`;
        }).join('');
    },

    pathList(model, state) {
        return `<ol class="diagram-path-list" aria-label="The same network story as a readable list">${model.steps.map((step, index) => {
            const revealed = state.overview || index < state.step;
            return `<li class="${index + 1 === state.step && !state.overview ? 'is-current' : ''}" ${index + 1 === state.step && !state.overview ? 'aria-current="step"' : ''}>
                <span class="diagram-path-number" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span><div>
                <strong>${revealed ? this.escapeHtml(step.title) : `Step ${index + 1} / not revealed yet`}</strong>
                ${revealed ? `<div class="diagram-step-links">${this.connections(model, step)}</div>` : ''}</div></li>`;
        }).join('')}</ol>`;
    },

    select(instance, id, label, value, options, disabled = false) {
        return `<label class="diagram-select" for="${instance}-${id}"><span>${this.escapeHtml(label)}</span>
            <select id="${instance}-${id}" data-diagram-setting="${id}" ${disabled ? 'disabled' : ''}>${options.map(option =>
                `<option value="${this.escapeHtml(option.id)}" ${option.id === value ? 'selected' : ''} ${option.disabled ? 'disabled' : ''}>${this.escapeHtml(option.label)}</option>`
            ).join('')}</select></label>`;
    },

    settingsHtml(model, instance, state) {
        return `<div class="diagram-settings">
            ${this.select(instance, 'level', 'Learning depth', model.settings.level, [{ id: 'basic', label: 'Start simple' }, { id: 'detailed', label: 'Go in depth' }])}
            ${this.select(instance, 'scenario', 'Change the scenario', model.settings.scenario, model.scenarios, model.scenarios.length === 1)}
            ${(model.controls || []).filter(control => model.settings.level === 'detailed' || !['tier', 'connection'].includes(control.id)).map(control => this.select(instance, control.id, control.label, model.settings[control.id],
                control.options.map(option => ({ ...option, disabled: control.id === 'connection' && option.id === 'private' && model.settings.tier !== 'premium' })))).join('')}
            <label class="diagram-predict-toggle" for="${instance}-predictions"><input id="${instance}-predictions" type="checkbox" data-diagram-setting="predictions" ${state.predictions ? 'checked' : ''}>Pause to predict</label>
        </div>`;
    },

    predictionHtml(model, instance, state) {
        const prediction = state.pending ? model.steps[state.step]?.predict : null;
        if (!prediction) return '';
        const feedback = state.answer === null ? 'Choose an answer before revealing the next step. You can also reveal it without answering.' :
            `${state.answer === prediction.answer ? 'Correct.' : 'Not quite.'} ${prediction.explanation}`;
        return `<fieldset class="diagram-prediction"><legend>Before the next step: ${this.escapeHtml(prediction.prompt)}</legend>
            <div class="diagram-prediction-options">${prediction.options.map((option, index) => `<button type="button" data-diagram-answer="${index}" aria-pressed="${state.answer === index}">${this.escapeHtml(option)}</button>`).join('')}</div>
            <p id="${instance}-prediction-feedback" class="diagram-prediction-feedback" role="status">${this.escapeHtml(feedback)}</p></fieldset>`;
    },

    html(model, instance, state) {
        const current = state.overview ? null : model.steps[state.step - 1];
        const heading = current?.title || 'See the whole story, then follow one step';
        const description = current?.text || model.takeaway;
        const count = state.overview ? `${model.steps.length} steps / overview` : `Step ${state.step} of ${model.steps.length}`;
        return `<header class="diagram-heading"><div><p class="diagram-eyebrow">Network field guide / ${model.settings.level === 'basic' ? 'start simple' : 'in depth'}</p>
            <h3>${this.escapeHtml(model.title)}</h3><p>${this.escapeHtml(model.summary)}</p></div>
            <span class="diagram-format-label">Interactive explanation<br>No Azure account needed</span></header>
            ${this.settingsHtml(model, instance, state)}
            <p class="diagram-setting-notice" role="status">${this.escapeHtml(state.notice || '')}</p>
            <div class="diagram-scenario"><strong>${this.escapeHtml(model.scenarioLabel)}</strong><p>${this.escapeHtml(model.scenarioSummary)}</p></div>
            <div class="diagram-view-bar"><div class="diagram-view-switch" role="group" aria-label="Diagram presentation">
                <button type="button" data-diagram-action="map" aria-pressed="${state.layout === 'map'}">Network map</button>
                <button type="button" data-diagram-action="steps" aria-pressed="${state.layout === 'steps'}">Step list</button></div>
                <ul class="diagram-key" aria-label="Connection legend">${Object.entries(this.kinds).map(([kind, label]) => `<li><span class="diagram-key-line trace-${kind}" aria-hidden="true"></span>${label}</li>`).join('')}</ul></div>
            <div class="diagram-coach"><div class="diagram-status" role="status" aria-live="polite" aria-atomic="true"><p class="diagram-eyebrow">${count}</p>
                <h4>${this.escapeHtml(heading)}</h4><p>${this.escapeHtml(description)}</p></div>
                <nav class="diagram-navigation" aria-label="Walkthrough controls">
                    <button type="button" data-diagram-action="previous" ${state.step === 0 && !state.pending ? 'disabled' : ''}>Previous</button>
                    <button type="button" class="diagram-next" data-diagram-action="next" ${state.step === model.steps.length && !state.overview ? 'disabled' : ''}>${state.pending ? 'Reveal step' : state.step === model.steps.length && !state.overview ? 'Walkthrough complete' : 'Next step'}</button>
                    <button type="button" data-diagram-action="overview">Show all</button>
                    <button type="button" data-diagram-action="reset">Reset</button>
                </nav></div>
            ${this.predictionHtml(model, instance, state)}
            <div class="diagram-map" tabindex="0" aria-label="Network map: ${this.escapeHtml(model.title)}" aria-describedby="${instance}-map-help">${this.svg(model, instance, state)}</div>
            <p class="diagram-map-help" id="${instance}-map-help">Arrows show direction; outlined regions show service or network boundaries. Scroll the map with arrow keys if needed, or use Step list.</p>
            <div class="diagram-list-view">${this.pathList(model, state)}</div>
            <p class="diagram-takeaway"><strong>Keep this idea:</strong> ${this.escapeHtml(model.takeaway)}</p>
            <details class="diagram-transcript" data-disclosure="transcript"><summary>Full explanation / text alternative</summary>
                <ol>${model.steps.map(step => `<li><h4>${this.escapeHtml(step.title)}</h4><p>${this.escapeHtml(step.text)}</p><div class="diagram-step-links">${this.connections(model, step)}</div></li>`).join('')}</ol></details>
            <details class="diagram-sources" data-disclosure="sources"><summary>Sources and limits / reviewed ${DiagramCatalog.reviewed}</summary>
                <p>${this.escapeHtml(model.caveat)}</p><ul>${model.sources.map(key => { const source = DiagramCatalog.sources[key]; return `<li><a href="${this.escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">${this.escapeHtml(source.title)}</a></li>`; }).join('')}</ul>
                <p>Learning model, not live telemetry. Predicting a step does not award quiz, lab or demonstrated-skill credit.</p></details>`;
    },

    cleanup() {
        for (const [id, entry] of this.instances) if (!entry.host.isConnected) this.instances.delete(id);
    },

    preparePrint() {
        if (this.printDisclosures) return;
        this.printDisclosures = [...document.querySelectorAll('.visual-diagram details')].map(element => ({ element, open: element.open }));
        this.printDisclosures.forEach(({ element }) => { element.open = true; });
    },

    restorePrint() {
        (this.printDisclosures || []).forEach(({ element, open }) => { if (element.isConnected) element.open = open; });
        this.printDisclosures = null;
    },

    render(diagrams) {
        const container = document.getElementById('tab-diagrams');
        container.innerHTML = '<div class="diagrams-wrapper"></div>';
        const wrapper = container.firstElementChild;
        if (!diagrams?.length) {
            wrapper.innerHTML = '<p class="no-content">This lesson uses text examples. Explore a complete request in the <a href="#visual-lab">AFD request lab</a>.</p>';
            return;
        }
        for (const diagram of diagrams) {
            const host = document.createElement('section');
            wrapper.append(host);
            this.mount(host, diagram.type);
        }
        this.cleanup();
    },

    renderPreview(diagram, container) {
        this.mount(container, diagram.type);
    },

    renderInline(container) {
        container.querySelectorAll('[data-diagram-model]').forEach(host => {
            const options = {};
            if (host.dataset.diagramScenario) options.scenario = host.dataset.diagramScenario;
            if (host.dataset.diagramOriginKind) options.originKind = host.dataset.diagramOriginKind;
            this.mount(host, host.dataset.diagramModel, options);
        });
    },

    mount(host, type, options = {}) {
        const model = DiagramCatalog.resolve(type, options);
        const instance = host.dataset.instance || `trace-${++this.serial}`;
        const state = { step: 0, overview: true, pending: false, answer: null, predictions: true,
            layout: window.matchMedia('(max-width: 768px)').matches ? 'steps' : 'map', notice: '' };
        host.dataset.instance = instance;
        host.dataset.diagramType = type;
        host.classList.add('visual-diagram');
        this.instances.set(instance, { host, type, model, state });
        if (!host.dataset.diagramBound) {
            host.dataset.diagramBound = 'true';
            host.addEventListener('click', event => this.handleClick(host, event));
            host.addEventListener('change', event => this.handleChange(host, event));
        }
        this.paint(instance);
        this.cleanup();
    },

    paint(instance, focusSelector) {
        const entry = this.instances.get(instance);
        const disclosures = [...entry.host.querySelectorAll('details[open]')].map(details => details.dataset.disclosure);
        const { host, model, state } = entry;
        const previousMap = host.querySelector('.diagram-map');
        const scroll = { top: previousMap?.scrollTop || 0, left: previousMap?.scrollLeft || 0 };
        host.dataset.step = String(state.step);
        host.dataset.overview = String(state.overview);
        host.dataset.layout = state.layout;
        host.innerHTML = this.html(model, instance, state);
        disclosures.forEach(name => { const disclosure = host.querySelector(`[data-disclosure="${name}"]`); if (disclosure) disclosure.open = true; });
        const map = host.querySelector('.diagram-map');
        map.scrollTop = state.overview ? 0 : scroll.top;
        map.scrollLeft = state.overview ? 0 : scroll.left;
        if (state.layout === 'map' && !state.pending && /next|previous/.test(focusSelector || '')) {
            const current = map.querySelector('.trace-node.is-current');
            if (current) {
                const item = current.getBoundingClientRect();
                const frame = map.getBoundingClientRect();
                if (item.top < frame.top || item.bottom > frame.bottom) map.scrollTop += item.top - frame.top - 24;
                if (item.left < frame.left || item.right > frame.right) map.scrollLeft += item.left - frame.left - 24;
            }
        }
        if (focusSelector) {
            const target = host.querySelector(focusSelector);
            if (target?.disabled) host.querySelector('.diagram-navigation button:not(:disabled)')?.focus({ preventScroll: true });
            else target?.focus({ preventScroll: true });
        }
    },

    handleClick(host, event) {
        const button = event.target.closest('[data-diagram-action], [data-diagram-answer]');
        if (!button || button.disabled) return;
        const entry = this.instances.get(host.dataset.instance);
        const state = entry.state;
        if (button.hasAttribute('data-diagram-answer')) {
            const answer = Number(button.dataset.diagramAnswer);
            const prediction = entry.model.steps[state.step]?.predict;
            if (!state.pending || !prediction || !Number.isInteger(answer) || answer < 0 || answer >= prediction.options.length) return;
            state.answer = answer;
            this.paint(host.dataset.instance, `[data-diagram-answer="${answer}"]`);
            return;
        }
        const action = button.dataset.diagramAction;
        if (['map', 'steps'].includes(action)) state.layout = action;
        else if (action === 'next' && !state.pending && state.predictions && entry.model.steps[state.overview ? 0 : state.step]?.predict) {
            if (state.overview) state.step = 0;
            state.overview = false;
            state.pending = true;
            state.answer = null;
        } else entry.state = this.transition(state, action, entry.model.steps.length);
        this.paint(host.dataset.instance, `[data-diagram-action="${action}"]`);
    },

    handleChange(host, event) {
        const control = event.target.closest('[data-diagram-setting]');
        if (!control) return;
        const entry = this.instances.get(host.dataset.instance);
        const setting = control.dataset.diagramSetting;
        if (setting === 'predictions') {
            entry.state.predictions = control.checked;
            entry.state.pending = false;
            entry.state.answer = null;
        } else {
            const options = { ...entry.model.settings, [setting]: control.value };
            entry.state.notice = '';
            if (setting === 'tier' && options.tier !== 'premium' && options.connection === 'private') {
                options.connection = 'public';
                entry.state.notice = 'Private Link requires Premium. Origin connectivity changed to the restricted public-origin example.';
            }
            entry.model = DiagramCatalog.resolve(entry.type, options);
            entry.state = this.transition(entry.state, 'reset', entry.model.steps.length);
        }
        this.paint(host.dataset.instance, `[data-diagram-setting="${setting}"]`);
    }
};

if (typeof window !== 'undefined') {
    window.addEventListener('beforeprint', () => DiagramEngine.preparePrint());
    window.addEventListener('afterprint', () => DiagramEngine.restorePrint());
}

const DiagramLab = {
    questions: [
        {
            prompt: 'A fresh logo response matches the request’s cache key. WAF allows the request. Which path is needed for this hit?',
            options: ['Edge -> origin -> edge -> browser every time', 'Edge -> browser, without fetching the origin response', 'Origin -> browser directly'],
            answer: 1, explanation: 'A fresh eligible hit can be returned at the edge. The browser still uses its existing Front Door connection.'
        },
        {
            prompt: 'A custom Block rule matches in Detection mode. Diagnostics are configured. What changes?',
            options: ['The request is logged and can continue', 'Every match returns 403', 'A Rule Set overrides WAF and removes the log'],
            answer: 0, explanation: 'Detection observes matches rather than enforcing the configured block. Prevention with that Block action is a different scenario.'
        },
        {
            prompt: 'Origin A has priority 1 but is unhealthy. Origin B has priority 2 and is healthy. Which is the normal candidate?',
            options: ['A, because its numeric priority always wins', 'Whichever is geographically closest, regardless of health', 'B, after filtering by health'],
            answer: 2, explanation: 'Filter healthy enabled origins first, then apply priority. Lower numeric priority cannot make an unhealthy origin eligible in the normal selection flow.'
        },
        {
            prompt: 'A Premium private origin is a VM behind an internal load balancer. Which missing component would make “managed endpoint -> internal LB” an incomplete explanation?',
            options: ['A Private Link Service publishing the internal LB', 'A public IP on every backend VM', 'A Traffic Manager profile inside the workload subnet'],
            answer: 0, explanation: 'This pattern uses an approved AFD-managed private endpoint -> Private Link Service -> internal LB -> application. App Service has a different supported origin pattern.'
        },
        {
            prompt: 'All enabled origins fail health probes. What should you expect rather than assuming instant recovery?',
            options: ['Front Door guarantees a successful cached page', 'Normal priority selection is unchanged', 'Round-robin fallback across the origins; requests can still fail'],
            answer: 2, explanation: 'The documented all-unhealthy fallback distributes attempts across origins. A fallback is not proof of health or a guaranteed successful response.'
        }
    ],

    assess(answers) {
        if (!Array.isArray(answers) || answers.length !== this.questions.length ||
            Array.from(answers).some((answer, index) => !Number.isInteger(answer) || answer < 0 || answer >= this.questions[index].options.length)) {
            throw new Error('Choose an answer for every one of the five cases.');
        }
        const score = this.questions.filter((question, index) => question.answer === answers[index]).length;
        return { score, total: this.questions.length, passed: score >= 4 };
    },

    savedMessage() {
        const saved = ProgressManager.getProgress().practiceChecks['afd-request-lab'];
        const status = ProgressManager.getStorageStatus();
        if (!status.saved || status.recoveryRequired) return 'Latest progress is not saved. Retry saving or export a recovery backup before leaving.';
        return saved ? `Last saved attempt: ${saved.passed ? 'threshold met (at least 4 of 5)' : 'needs more practice'}. Attempts: ${saved.attempts}.` : 'No trace-check attempt saved yet.';
    },

    render(container) {
        const escape = value => DiagramEngine.escapeHtml(value);
        container.innerHTML = `<article class="request-lab">
            <header class="request-lab-header"><p class="diagram-eyebrow">Practice without a subscription</p><h1 id="destinationTitle" tabindex="-1">Follow one request. Understand Front Door.</h1>
                <p>No commands or Azure resources. Follow a request at your pace, then change one condition and explain the difference.</p>
                <button type="button" class="btn-primary" data-lab-action="start">Start tracing</button></header>
            <ol class="request-lab-method"><li><strong>Trace</strong><span>Follow a normal request.</span></li><li><strong>Change</strong><span>Try a hit, block or failure.</span></li><li><strong>Explain</strong><span>Check five new cases.</span></li></ol>
            <div id="requestLabDiagram"></div>
            <section class="request-lab-check" aria-labelledby="requestLabCheckTitle"><p class="diagram-eyebrow">Can you explain the path?</p><h2 id="requestLabCheckTitle">Five-case trace check</h2>
                <p>Try these without opening the explanation. Aim for at least four correct, then say why the fifth differs. This is practice, not certification or demonstrated mastery.</p>
                <p id="requestLabSaved">${escape(this.savedMessage())}</p>
                <form id="requestLabCheck">${this.questions.map((question, index) => `<fieldset><legend>${index + 1}. ${escape(question.prompt)}</legend>${question.options.map((option, choice) =>
                    `<label class="learning-choice"><input type="radio" name="request-check-${index}" value="${choice}"><span>${escape(option)}</span></label>`).join('')}</fieldset>`).join('')}
                    <button type="button" class="btn-primary" data-lab-action="check">Check my reasoning</button></form>
                <div id="requestLabFeedback" role="status" aria-live="polite"></div></section>
            <nav class="request-lab-next" aria-label="Continue the Front Door path"><h2>Keep building the same mental model</h2>
                <a href="#frontdoor-basics">Understand origins and routing</a><a href="#frontdoor-advanced">Configure rules and private origins</a>
                <a href="#frontdoor-caching">Reason about safe caching</a><a href="#frontdoor-waf">Distinguish detection from prevention</a></nav>
        </article>`;
        DiagramEngine.mount(container.querySelector('#requestLabDiagram'), 'afd-request');
        if (!container.dataset.requestLabBound) {
            container.dataset.requestLabBound = 'true';
            container.addEventListener('click', event => {
                if (event.target.closest('[data-lab-action="check"]')) this.check(container);
                if (event.target.closest('[data-lab-action="start"]')) {
                    const host = container.querySelector('#requestLabDiagram');
                    host.querySelector('[data-diagram-action="reset"]').click();
                    host.querySelector('[data-diagram-action="next"]').click();
                    host.querySelector('.diagram-coach').scrollIntoView({ block: 'start', behavior: 'instant' });
                    host.querySelector('[data-diagram-action="next"]').focus({ preventScroll: true });
                }
            });
            container.addEventListener('submit', event => {
                if (event.target.id !== 'requestLabCheck') return;
                event.preventDefault();
                this.check(container);
            });
            document.addEventListener('academy-storage-change', () => {
                const label = container.querySelector('#requestLabSaved');
                if (label) label.textContent = this.savedMessage();
            });
        }
    },

    check(container) {
        const answers = this.questions.map((_, index) => {
            const choice = container.querySelector(`input[name="request-check-${index}"]:checked`);
            return choice ? Number(choice.value) : null;
        });
        const feedback = container.querySelector('#requestLabFeedback');
        if (answers.some(answer => answer === null)) {
            feedback.textContent = 'Choose an answer for every case before checking.';
            return;
        }
        const result = this.assess(answers);
        const saved = ProgressManager.savePracticeResult('afd-request-lab', result.passed);
        LearningEngine.renderStorageStatus();
        const escape = value => DiagramEngine.escapeHtml(value);
        feedback.innerHTML = `<p><strong>${result.score} of ${result.total} correct.</strong> ${result.passed ? 'Trace-check threshold met. Explain your reasoning, then try again after a week.' : 'Revisit the branches below and try again. Mistakes show you which idea to practise.'}</p>
            <p>${saved ? 'Practice attempt saved locally. No quiz, lab or mastery credit was awarded.' : 'This attempt is not saved. Retry saving or export a recovery backup before leaving.'}</p>
            <ol>${this.questions.map((question, index) => `<li><strong>Case ${index + 1}: ${answers[index] === question.answer ? 'Correct' : 'Review'}</strong> ${escape(question.explanation)}</li>`).join('')}</ol>`;
        container.querySelector('#requestLabSaved').textContent = this.savedMessage();
    }
};
