const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

function loadDiagramSystem() {
    const jsDir = path.join(__dirname, '..', 'js');
    const files = ['modules-100.js', 'modules-200.js', 'modules-300.js', 'modules-extras.js', 'diagrams.js'];
    const context = {};
    vm.createContext(context);
    const source = files.map(file => fs.readFileSync(path.join(jsDir, file), 'utf8')).join('\n');
    vm.runInContext(`${source}\n;globalThis.__result = {
        modules: [...MODULES_100, ...MODULES_200, ...MODULES_300, ...MODULES_EXTRAS],
        engine: DiagramEngine
    };`, context);
    return { ...context.__result, context };
}

function getInstances(modules) {
    return Array.from(modules, module =>
        Array.from(module.diagrams || [], diagram => ({ module, diagram }))
    ).flat();
}

function getMaximumSvgStep(markup) {
    const steps = Array.from(markup.matchAll(/data-step=["'](\d+)["']/g), match => Number(match[1]));
    return steps.length ? Math.max(...steps) : 0;
}

function getTextPosition(markup, text) {
    for (const match of markup.matchAll(/<text\b([^>]*)>([\s\S]*?)<\/text>/g)) {
        if (!match[2].includes(text)) continue;
        const x = Number((match[1].match(/\bx=["']([^"']+)/) || [])[1]);
        const y = Number((match[1].match(/\by=["']([^"']+)/) || [])[1]);
        return { x, y };
    }
    return null;
}

test('networking diagram inventory has complete builder coverage and unique IDs', () => {
    const { modules, engine } = loadDiagramSystem();
    const instances = getInstances(modules);
    const usedTypes = new Set(instances.map(({ diagram }) => diagram.type));
    const missing = [...usedTypes].filter(type => !engine.builders[type]);
    const unused = Object.keys(engine.builders).filter(type => !type.startsWith('_') && !usedTypes.has(type));
    const counts = new Map();
    instances.forEach(({ diagram }) => counts.set(diagram.id, (counts.get(diagram.id) || 0) + 1));

    assert.equal(instances.length, 22);
    assert.deepEqual(missing, []);
    assert.deepEqual(unused, []);
    assert.deepEqual([...counts.entries()].filter(([, count]) => count > 1), []);
});

test('networking diagram step copy matches rendered SVG steps', () => {
    const { modules, engine } = loadDiagramSystem();
    const mismatches = getInstances(modules)
        .map(({ module, diagram }) => {
            const markup = engine.builders[diagram.type].call(engine, diagram);
            return {
                moduleId: module.id,
                diagramId: diagram.id,
                declared: (diagram.steps || []).length,
                rendered: getMaximumSvgStep(markup)
            };
        })
        .filter(result => result.declared !== result.rendered);

    assert.deepEqual(mismatches, []);
});

test('every networking diagram builder returns a valid bounded SVG', () => {
    const { modules, engine } = loadDiagramSystem();
    getInstances(modules).forEach(({ module, diagram }) => {
        const markup = engine.builders[diagram.type].call(engine, diagram);
        assert.match(markup, /^<svg\b/);
        assert.match(markup, /viewBox=["'][^"']+["']/);
        assert.ok(!markup.includes('undefined'), `${module.id}/${diagram.id} contains undefined`);
        assert.ok(!markup.includes('NaN'), `${module.id}/${diagram.id} contains NaN`);
    });
});

test('Azure regions separates the region and global-network labels', () => {
    const { engine } = loadDiagramSystem();
    const markup = engine.builders['azure-regions'].call(engine, {});
    const region = getTextPosition(markup, 'West Europe');
    const globalNetwork = getTextPosition(markup, 'Microsoft global network');

    assert.ok(region && globalNetwork, 'Expected both West Europe and global-network labels');
    assert.ok(!markup.includes('165K+'), 'Avoid volatile backbone mileage in the diagram');
    assert.ok(
        Math.abs(region.y - globalNetwork.y) >= 16 || Math.abs(region.x - globalNetwork.x) >= 120,
        `West Europe (${region.x},${region.y}) overlaps global-network label (${globalNetwork.x},${globalNetwork.y})`
    );
});

test('known networking diagram labels have dedicated space', () => {
    const { engine } = loadDiagramSystem();
    const positions = [
        ['load-balancer', 'TCP/UDP — 5-tuple hash', 'y', 210],
        ['load-balancer', 'HTTP — URL path routing', 'y', 210],
        ['udr', '10.100.1.4', 'y', 195],
        ['firewall', '10.100.1.4', 'y', 375],
        ['frontdoor-rules-engine', 'GET /api/v2/users', 'y', 265],
        ['frontdoor-rules-engine', 'Modified request', 'y', 265],
        ['frontdoor-caching', 'MISS ✗', 'x', 300],
        ['frontdoor-caching', 'HIT ✓', 'x', 300],
        ['hub-spoke-capstone', 'FW SNAT → Internet', 'y', 500]
    ];

    positions.forEach(([type, text, axis, minimum]) => {
        const markup = engine.builders[type].call(engine, {});
        const position = getTextPosition(markup, text);
        assert.ok(position, `Expected ${text} in ${type}`);
        assert.ok(position[axis] >= minimum, `${type}: ${text} ${axis}=${position[axis]} must be at least ${minimum}`);
    });
});

test('networking diagram canvases are keyboard-focusable scroll regions', () => {
    const { modules, engine } = loadDiagramSystem();
    const diagram = getInstances(modules)[0].diagram;
    const html = engine.renderDiagram(diagram, 0);

    assert.match(html, /class="diagram-canvas"[^>]*tabindex="0"/);
    assert.match(html, /class="diagram-canvas"[^>]*aria-label="Scrollable diagram:/);
});

test('networking mobile diagrams preserve a readable local canvas width', () => {
    const css = fs.readFileSync(path.join(__dirname, '..', 'css', 'styles.css'), 'utf8');

    assert.match(css, /\.diagram-canvas svg\s*\{[^}]*min-width:\s*56rem;[^}]*width:\s*56rem;/s);
});

test('networking Step wraps to the ready state after the final step', () => {
    const { modules, engine, context } = loadDiagramSystem();
    const diagram = getInstances(modules)[0].diagram;
    const groups = diagram.steps.map((_, index) => ({
        dataset: { step: String(index + 1) },
        classList: { add() {}, remove() {} }
    }));
    const svg = { classList: { remove() {} }, querySelectorAll: () => groups };
    const canvas = {
        dataset: { step: '0', playing: 'false' },
        classList: { add() {}, remove() {} },
        querySelector: () => svg
    };
    const counter = { textContent: '' };
    const text = { textContent: '' };
    const elements = {
        [`canvas-${diagram.id}`]: canvas,
        [`stepcnt-${diagram.id}`]: counter,
        [`steptxt-${diagram.id}`]: text
    };
    context.document = { getElementById: id => elements[id] || null };
    context.MODULES = modules;
    try {
        for (let index = 0; index <= diagram.steps.length; index++) engine.stepThrough(diagram.id);
        assert.equal(canvas.dataset.step, '0');
        assert.equal(counter.textContent, '0');
    } finally {
        delete context.document;
        delete context.MODULES;
    }
});

test('Azure region guidance distinguishes service support from workload resilience', () => {
    const { modules, engine } = loadDiagramSystem();
    const module = modules.find(item => item.id === 'azure-environment');
    const diagram = module.diagrams[0];
    const narrative = `${module.learn} ${diagram.description} ${diagram.steps.join(' ')} ${engine.builders['azure-regions'].call(engine, diagram)}`;

    assert.doesNotMatch(narrative, /60\+ regions|165,000|3\+ physically|Each Azure region is paired|GRS auto-replication/i);
    assert.match(narrative, /nonpaired/i);
    assert.match(narrative, /does not automatically|not automatic/i);
    assert.match(narrative, /service.*support|service-specific/i);
});

test('Front Door diagrams separate WAF decisions from Rule Set actions', () => {
    const { modules, engine } = loadDiagramSystem();
    const rulesModule = modules.find(item => item.id === 'frontdoor-advanced');
    const wafModule = modules.find(item => item.id === 'frontdoor-waf');
    const rulesNarrative = `${rulesModule.learn} ${rulesModule.diagrams[0].description} ${rulesModule.diagrams[0].steps.join(' ')} ${engine.builders['frontdoor-rules-engine'].call(engine, {})}`;
    const wafNarrative = `${wafModule.diagrams[0].description} ${wafModule.diagrams[0].steps.join(' ')} ${engine.builders['waf-inspection'].call(engine, {})}`;

    assert.doesNotMatch(rulesNarrative, /Return 403|Return 429|Route Configuration Override[^\n<]{0,80}return 403/i);
    assert.match(rulesNarrative, /WAF[^.\n<]{0,80}(first|before)/i);
    assert.match(rulesNarrative, /request header|response header/i);
    assert.doesNotMatch(wafNarrative, /OWASP 3\.2|DDoS flood|1M req\/s/);
    assert.match(wafNarrative, /managed rule set/i);
});

test('connectivity diagrams avoid volatile or overgeneralized service guarantees', () => {
    const { modules, engine } = loadDiagramSystem();
    const vpn = modules.find(item => item.id === 'vpn-connectivity');
    const narrative = `${vpn.diagrams.flatMap(diagram => [diagram.description, ...(diagram.steps || [])]).join(' ')} ${engine.builders['vpn-tunnel'].call(engine, {})} ${engine.builders.expressroute.call(engine, {})}`;

    assert.doesNotMatch(narrative, /AES-256|50 Mbps–100 Gbps|99\.95% SLA/);
    assert.match(narrative, /IPsec\/IKE/);
    assert.match(narrative, /private connectivity|private circuit/i);
});
