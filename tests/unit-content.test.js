const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const js = path.join(__dirname, '..', 'js');
const expected = [
    'net-fundamentals', 'azure-environment', 'azure-vnets', 'azure-ip-addressing',
    'nsgs', 'azure-dns', 'load-balancing-overview', 'frontdoor-basics',
    'vpn-connectivity', 'peering-endpoints', 'azure-bastion', 'nat-gateway',
    'route-tables-udr', 'frontdoor-advanced', 'frontdoor-caching', 'frontdoor-waf',
    'network-architecture', 'az104-practice', 'azure-firewall', 'network-watcher',
    'capstone-hub-spoke'
];
const context = vm.createContext({});
for (const file of ['modules-100', 'modules-200', 'modules-300', 'modules-extras', 'diagram-models', 'diagram-afd']) {
    vm.runInContext(fs.readFileSync(path.join(js, `${file}.js`), 'utf8'), context);
}
const modules = vm.runInContext('[...MODULES_100, ...MODULES_200, ...MODULES_300, ...MODULES_EXTRAS]', context);
const diagrams = vm.runInContext('DiagramCatalog', context);

function loadUnits() {
    const filename = path.join(js, 'unit-content.js');
    assert.ok(fs.existsSync(filename), 'Authored unit-content.js must exist');
    const source = fs.readFileSync(filename, 'utf8');
    const standalone = vm.createContext({ module: { exports: {} } });
    vm.runInContext(source, standalone, { filename });
    const units = vm.runInContext('ACADEMY_UNITS', standalone);
    assert.equal(standalone.module.exports, units, 'CommonJS and browser consumers share the registry');
    return units;
}

function text(value, label) {
    assert.equal(typeof value, 'string', label);
    assert.ok(value.trim().length >= 8, `${label} needs meaningful text`);
    assert.doesNotMatch(value, /<[^>]+>/, `${label} must be plain text`);
}

function question(q, label, field) {
    assert.deepEqual(Object.keys(q).sort(), [field, 'options', 'correct', 'explanation'].sort(), label);
    text(q[field], label);
    text(q.explanation, `${label} explanation`);
    assert.ok(Array.isArray(q.options) && q.options.length >= 2 && q.options.length <= 4, label);
    q.options.forEach(option => text(option, `${label} option`));
    assert.equal(new Set(q.options).size, q.options.length, label);
    assert.ok(Number.isInteger(q.correct) && q.correct >= 0 && q.correct < q.options.length, label);
}

test('21 real modules each have three authored units, without replacing references', () => {
    const units = loadUnits();
    assert.deepEqual(Object.keys(units).sort(), expected.slice().sort());
    assert.deepEqual(Array.from(modules, m => m.id).sort(), expected.slice().sort());
    for (const id of expected) {
        assert.equal(units[id].length, 3, id);
        assert.ok(modules.find(m => m.id === id).learn.length > 1000, `${id} retains technical reference`);
    }
});

test('fundamentals DNS teaching uses the same reserved shop hostname as its diagram', () => {
    const units = loadUnits();
    const dns = units['net-fundamentals'].find(unit => unit.id === 'names-before-connections');
    assert.ok(dns);
    assert.match(dns.paragraphs.join(' '), /\bshop\.example\.com\b/);
    const visual = diagrams.resolve(dns.diagram.type, { scenario: dns.diagram.scenario });
    assert.match(visual.steps.map(step => step.text).join(' '), /\bshop\.example\.com\b/);
    assert.doesNotMatch(JSON.stringify(units), /\b(?:[\w-]+\.)*example\.test\b/);
});

test('first DNS example explains the resolver role before presenting the failure', () => {
    const dns = loadUnits()['net-fundamentals'].find(unit => unit.id === 'names-before-connections');
    const example = dns.example.text;
    assert.match(example, /directory helper \(a DNS resolver\)/i);
    assert.match(example, /finds.*address.*browser/i);
    assert.ok(example.indexOf('DNS resolver') < example.indexOf('stopped'));
    assert.ok(example.trim().split(/\s+/).length <= 50);
});

test('all 63 units follow the exact teach, try, check and explain contract', () => {
    const ids = new Set();
    const prompts = new Set();
    const paragraphs = new Set();
    const positions = new Set();
    for (const [moduleId, units] of Object.entries(loadUnits())) {
        for (const unit of units) {
            const label = `${moduleId}/${unit.id}`;
            assert.deepEqual(Object.keys(unit).sort(), [
                'id', 'title', 'minutes', 'outcome', 'paragraphs', 'example',
                'diagram', 'activity', 'checks', 'teachBack', 'takeaway'
            ].sort(), label);
            assert.match(unit.id, /^[a-z][a-z0-9]*(?:-[a-z0-9]+)+$/);
            assert.ok(!ids.has(unit.id), `Duplicate ID ${unit.id}`);
            ids.add(unit.id);
            for (const field of ['title', 'outcome', 'takeaway']) text(unit[field], `${label} ${field}`);
            assert.match(unit.outcome, /explain|predict|trace|distinguish|choose|identify/i, label);
            assert.ok([8, 10, 12].includes(unit.minutes), label);
            assert.ok(Array.isArray(unit.paragraphs) && [2, 3].includes(unit.paragraphs.length), label);
            const words = unit.paragraphs.join(' ').trim().split(/\s+/).length;
            assert.ok(words >= 100 && words <= 190, `${label}: ${words} teaching words; expected 100–190`);
            unit.paragraphs.forEach(p => {
                text(p, label);
                assert.ok(!paragraphs.has(p), `Reused teaching paragraph: ${label}`);
                paragraphs.add(p);
            });
            assert.deepEqual(Object.keys(unit.example).sort(), ['text', 'title']);
            text(unit.example.title, label);
            text(unit.example.text, label);
            assert.deepEqual(Object.keys(unit.diagram).sort(), ['scenario', 'type']);
            const diagram = diagrams.resolve(unit.diagram.type, { scenario: unit.diagram.scenario });
            assert.ok(diagram.steps.length > 0, label);
            question(unit.activity, `${label} activity`, 'prompt');
            assert.equal(unit.checks.length, 2, label);
            unit.checks.forEach((check, i) => {
                question(check, `${label} check ${i}`, 'question');
                const normalized = check.question.toLowerCase().replace(/\W/g, '');
                assert.ok(!prompts.has(normalized), `Copied check: ${label}`);
                prompts.add(normalized);
                positions.add(check.correct);
            });
            assert.deepEqual(Object.keys(unit.teachBack).sort(), ['example', 'prompt']);
            text(unit.teachBack.prompt, label);
            text(unit.teachBack.example, label);
        }
    }
    assert.equal(ids.size, 63);
    assert.equal(prompts.size, 126);
    assert.ok(positions.size >= 2, 'Answer positions should vary');
});

test('scenario answer denies private source rather than claiming it depends', () => {
    const q = modules.find(m => m.id === 'az104-practice').quiz[1];
    assert.equal(q.correct, 0);
    assert.match(q.explanation, /denied|denies/i);
});

test('public Standard Load Balancer SKU question does not exclude internal frontends', () => {
    const q = modules.find(m => m.id === 'az104-practice').quiz[2];
    assert.match(q.question, /public Standard Load Balancer/i);
    assert.equal(q.correct, 1);
    assert.match(q.explanation, /internal.*private/i);
});

test('apex certificate guidance permits other providers and includes revalidation', () => {
    const source = fs.readFileSync(path.join(js, 'modules-300.js'), 'utf8');
    const card = source.match(/front: 'Can Front Door Managed certs cover zone apex domains\?', back: '([^']+)'/);
    assert.ok(card);
    assert.doesNotMatch(card[1], /must use Azure DNS/i);
    assert.match(card[1], /flattening/i);
    assert.match(card[1], /revalidat/i);
    assert.match(source, /https:\/\/learn.microsoft.com\/azure\/frontdoor\/apex-domain/);
});

test('private IP reference does not confuse NIC lifecycle with VM deallocation', () => {
    const m = modules.find(m => m.id === 'azure-ip-addressing');
    assert.doesNotMatch(m.learn, /May change on VM restart|only change when the VM is/i);
    const q = m.quiz.find(q => /dynamic private IP/i.test(q.question));
    assert.ok(q);
    assert.match(q.options[q.correct], /interface|subnet/i);
    assert.doesNotMatch(q.explanation, /may change when a VM is deallocated/i);
});

test('non-transitive peering reference permits explicit routed transit', () => {
    const m = modules.find(m => m.id === 'peering-endpoints');
    assert.doesNotMatch(m.learn, /cannot communicate \(unless you also peer/);
    assert.match(m.learn, /routed transit|routing through/i);
});

test('related reference avoids universal failover timers and fictitious NSG SKUs', () => {
    const balancing = modules.find(m => m.id === 'load-balancing-overview');
    assert.doesNotMatch(balancing.learn, /failover between regions \(< 30 seconds\)/);
    assert.match(balancing.learn, /failover.*depend/i);
    const practice = modules.find(m => m.id === 'az104-practice');
    assert.doesNotMatch(practice.learn, /Standard NSG/);
    assert.doesNotMatch(practice.learn, /Requires NSG to allow ANY traffic/);
});

test('authored explanations retain critical current routing and security distinctions', () => {
    const units = loadUnits();
    const prose = id => units[id].map(u => u.paragraphs.join(' ')).join(' ');
    assert.match(prose('frontdoor-basics'), /Standard and Premium.*unicast/);
    assert.match(prose('frontdoor-basics'), /Classic anycast/);
    assert.match(prose('frontdoor-basics'), /no single universal failover time/);
    assert.match(prose('frontdoor-waf'), /first terminates client TLS/);
    assert.match(prose('frontdoor-waf'), /Detection mode.*without enforcing/);
    assert.match(prose('frontdoor-advanced'), /header alone.*not sufficient/);
    assert.match(prose('frontdoor-caching'), /Personalized carts and receipts/);
    assert.match(prose('nsgs'), /first matching rule/);
    assert.match(prose('route-tables-udr'), /reply.*compatible inspection path/);
    assert.match(prose('capstone-hub-spoke'), /Private Link Service/);
});
