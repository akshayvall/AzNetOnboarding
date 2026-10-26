const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
function system() {
    const context = vm.createContext({});
    for (const file of ['diagram-models.js', 'diagram-afd.js', 'diagrams.js', 'illustrated-diagrams.js']) {
        const filename = path.join(root, 'js', file);
        if (fs.existsSync(filename)) vm.runInContext(fs.readFileSync(filename, 'utf8'), context);
    }
    return vm.runInContext(`({
        catalog: DiagramCatalog, legacy: DiagramEngine,
        engine: typeof IllustratedDiagrams === 'undefined' ? null : IllustratedDiagrams
    })`, context);
}

const originalTypes = [
    'osi-model', 'tcp-handshake', 'dns-resolution', 'vnet-architecture', 'frontdoor-routing',
    'hub-spoke', 'nsg-filtering', 'load-balancer', 'vpn-tunnel', 'waf-inspection',
    'packet-journey', 'frontdoor-rules-engine', 'azure-regions', 'vnet-peering',
    'frontdoor-caching', 'expressroute', 'bastion', 'natgw', 'udr', 'firewall',
    'nwatcher', 'hub-spoke-capstone'
];

test('a separate illustrated engine supports every original type and the integration API', () => {
    const { engine, legacy } = system();
    assert.ok(engine, 'IllustratedDiagrams must be defined without replacing DiagramEngine');
    assert.notEqual(engine, legacy);
    for (const name of ['render', 'renderInline', 'renderPreview', 'cleanup', 'init']) {
        assert.equal(typeof engine[name], 'function', name);
    }
    for (const type of originalTypes) assert.equal(engine.normalize({ type }).type, type);
});

test('normalization retains scenarios, validates unknown input and escapes user labels', () => {
    const { engine } = system();
    assert.ok(engine);
    const definition = engine.normalize({ type: 'frontdoor-caching', scenario: 'hit', title: '<img onerror=alert(1)>' });
    assert.equal(definition.model.settings.scenario, 'hit');
    assert.equal(definition.model.settings.level, 'detailed');
    assert.throws(() => engine.normalize({ type: '__proto__' }), /Unknown/);
    assert.throws(() => engine.normalize({ type: 'natgw', scenario: 'not-real' }), /Unknown/);
    const html = engine.html(definition);
    assert.ok(html.includes('&lt;img onerror=alert(1)&gt;'));
    assert.ok(!html.includes('<img'));
});

test('all diagrams have complete accessible architecture, scoped references and ordered explanation', () => {
    const { engine } = system();
    assert.ok(engine);
    const allIds = new Set();
    for (const type of originalTypes) {
        for (let copy = 0; copy < 2; copy++) {
            const definition = engine.normalize({ type, id: 'same-id' });
            const html = engine.html(definition);
            assert.match(html, /<svg[^>]+role="img"/, type);
            assert.match(html, /<title id="/, type);
            assert.match(html, /<desc id="/, type);
            assert.match(html, /<ol/, type);
            assert.match(html, /Complete architecture/, type);
            for (const step of definition.model.steps) assert.ok(html.includes(engine.escapeHtml(step.text)), `${type}/${step.id}`);
            const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
            for (const id of ids) {
                assert.ok(!allIds.has(id), `${type}: duplicate ID ${id}`);
                allIds.add(id);
            }
            for (const match of html.matchAll(/url\(#([^)]+)\)/g)) assert.ok(ids.includes(match[1]), `${type}: unresolved ${match[1]}`);
            assert.ok(!/\son[a-z]+\s*=|<animate\b|<script\b/.test(html), type);
            assert.ok(!/opacity="0"|display:\s*none/.test(html), type);
            for (const action of ['previous', 'step', 'reset']) assert.ok(html.includes(`data-illustrated-action="${action}"`), type);
        }
    }
});

test('drawings retain distinct architecture: subnet containers, service icons, lifelines and DNS referrals', () => {
    const { engine } = system();
    assert.ok(engine);
    const draw = type => engine.html(engine.normalize({ type }));
    assert.match(draw('tcp-handshake'), /illustrated-lifeline/);
    assert.match(draw('osi-model'), /Application/);
    assert.match(draw('vnet-architecture'), /10\.0\.1\.0\/24/);
    assert.match(draw('hub-spoke'), /Hub VNet/);
    assert.match(draw('natgw'), /SNAT/);
    assert.match(draw('firewall'), /Premium/);
    assert.match(draw('dns-resolution'), /data-item="root-referral"/);
    assert.match(draw('bastion'), /data-icon="gateway"/);
    assert.match(draw('frontdoor-routing'), /data-icon="frontdoor"/);
});

test('authoritative scenario semantics and connection direction survive illustration', () => {
    const { engine, catalog } = system();
    assert.ok(engine);
    for (const type of Object.keys(catalog.models)) {
        for (const scenario of catalog.models[type].scenarios) {
            const definition = engine.normalize({ type, scenario: scenario.id });
            const html = engine.html(definition);
            for (const edge of definition.model.edges) {
                assert.ok(html.includes(`data-item="${edge.id}"`), `${type}/${scenario.id}/${edge.id}`);
                assert.ok(html.includes(`data-from="${edge.from}" data-to="${edge.to}"`));
            }
            for (const step of definition.model.steps) assert.ok(html.includes(engine.escapeHtml(step.text)));
        }
    }
    const afd = engine.normalize({ type: 'frontdoor-routing' }).model;
    assert.ok(afd.steps.findIndex(step => step.id === 'tls') < afd.steps.findIndex(step => step.id === 'waf'));
    assert.match(afd.steps.find(step => step.id === 'dns').text, /Traffic Manager/);
    const hit = engine.normalize({ type: 'frontdoor-caching', scenario: 'hit' });
    assert.ok(!hit.model.edges.some(edge => edge.to === 'origin'));
    assert.match(engine.html(hit), /Not contacted/);
});

test('step transition never hides architecture or starts an autoplay loop', () => {
    const { engine } = system();
    assert.ok(engine);
    assert.equal(engine.nextStep(-1, 'step', 3), 0);
    assert.equal(engine.nextStep(0, 'previous', 3), -1);
    assert.equal(engine.nextStep(2, 'step', 3), 2);
    assert.equal(engine.nextStep(1, 'reset', 3), -1);
    const preview = engine.html(engine.normalize({ type: 'natgw' }), { preview: true });
    assert.ok(!preview.includes('data-illustrated-action'));
    const source = fs.readFileSync(path.join(root, 'js', 'illustrated-diagrams.js'), 'utf8');
    assert.ok(!/\beval\s*\(|new Function|setInterval|setTimeout|requestAnimationFrame/.test(source));
});

test('definitions preserve supported origin options and the network-watcher alias', () => {
    const { engine } = system();
    assert.equal(engine.normalize({ type: 'network-watcher' }).type, 'nwatcher');
    const paas = engine.normalize({ type: 'frontdoor-private-link', originKind: 'appservice' });
    assert.equal(paas.model.settings.originKind, 'appservice');
    assert.ok(!paas.model.nodes.some(node => node.id === 'pls'));
    assert.throws(() => engine.normalize({ type: 'afd-request', tier: 'standard', connection: 'private' }), /Premium/);
});

test('the original capstone opens its complete private application architecture, not only two spokes', () => {
    const { engine } = system();
    const definition = engine.normalize({ type: 'hub-spoke-capstone' });
    assert.equal(definition.model.settings.scenario, 'private-origin');
    const html = engine.html(definition);
    for (const id of ['tls', 'waf', 'managed-pe', 'pls', 'ilb', 'firewall', 'sql-pe', 'sql']) {
        assert.ok(html.includes(`data-item="${id}"`), id);
    }
    assert.equal(engine.normalize({ type: 'hub-spoke-capstone', scenario: 'egress' }).model.settings.scenario, 'egress');
});
