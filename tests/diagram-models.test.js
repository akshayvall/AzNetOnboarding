const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const moduleFiles = ['modules-100.js', 'modules-200.js', 'modules-300.js', 'modules-extras.js'];
const expectedTypes = [
    'osi-model', 'tcp-handshake', 'dns-resolution', 'packet-journey', 'azure-regions',
    'vnet-architecture', 'nsg-filtering', 'load-balancer', 'frontdoor-routing',
    'vpn-tunnel', 'expressroute', 'vnet-peering', 'frontdoor-rules-engine',
    'frontdoor-caching', 'waf-inspection', 'hub-spoke', 'bastion', 'natgw', 'udr',
    'firewall', 'nwatcher', 'hub-spoke-capstone', 'azure-hierarchy', 'lb-choice',
    'frontdoor-private-link', 'afd-request'
];

function load() {
    const context = vm.createContext({ console });
    for (const file of [...moduleFiles, 'diagram-models.js', 'diagram-afd.js', 'diagrams.js']) {
        const filename = path.join(root, 'js', file);
        if (fs.existsSync(filename)) vm.runInContext(fs.readFileSync(filename, 'utf8'), context, { filename });
    }
    return vm.runInContext(`({
        catalog: typeof DiagramCatalog === 'undefined' ? null : DiagramCatalog,
        engine: typeof DiagramEngine === 'undefined' ? null : DiagramEngine,
        modules: [...MODULES_100, ...MODULES_200, ...MODULES_300, ...MODULES_EXTRAS]
    })`, context);
}

function system() {
    const result = load();
    assert.ok(result.catalog, 'A shared declarative diagram catalog must exist');
    return result;
}

const text = model => [model.summary, model.caveat, ...model.steps.map(step => step.text)].join(' ');
const ids = model => Array.from(model.steps, step => step.id);
const edge = (model, id) => model.edges.find(item => item.id === id);

test('depth is offered only when some scenario has distinct resolved learning content', () => {
    const { catalog } = system();
    assert.equal(typeof catalog.hasDepth, 'function');
    for (const type of expectedTypes) {
        const distinct = catalog.models[type].scenarios.some(scenario => {
            const signature = level => {
                const { nodes, edges, steps } = catalog.resolve(type, { scenario: scenario.id, level });
                return JSON.stringify({ nodes, edges, steps });
            };
            return signature('basic') !== signature('detailed');
        });
        assert.equal(catalog.hasDepth(type), distinct, type);
    }
    assert.equal(catalog.hasDepth('tcp-handshake'), false);
    assert.equal(catalog.hasDepth('afd-request'), true);
});

test('AFD early responses retain stable topology with a clearly uncontacted origin', () => {
    const { catalog, engine } = system();
    for (const level of ['basic', 'detailed']) for (const connection of ['public', 'private']) {
        const baseline = catalog.resolve('afd-request', { level, connection, scenario: 'miss' });
        const positions = new Map(engine.geometry(baseline).nodes.map(node => [node.id, [node.x, node.y]]));
        for (const scenario of ['hit', 'waf-block', 'redirect']) {
            const branch = catalog.resolve('afd-request', { level, connection, scenario });
            for (const node of engine.geometry(branch).nodes) assert.deepEqual([node.x, node.y], positions.get(node.id), `${scenario}/${node.id}`);
            const origin = branch.nodes.find(node => node.id === 'origin');
            assert.ok(origin?.inactive);
            assert.match(origin.detail, /not contacted/i);
            assert.ok(!branch.edges.some(link => link.from === 'origin' || link.to === 'origin'));
        }
    }
});

test('diagram models own concrete sequence, first-match, route and NAT evidence', () => {
    const { catalog } = system();
    assert.equal(catalog.resolve('tcp-handshake').presentation.kind, 'sequence');
    for (const [type, kind] of [['nsg-filtering', 'policy'], ['udr', 'routes'], ['natgw', 'translation']]) {
        const model = catalog.resolve(type);
        assert.equal(model.presentation.kind, kind);
        assert.ok(model.presentation.tables.length);
        for (const table of model.presentation.tables) {
            assert.ok(table.columns.length > 1);
            for (const row of table.rows) {
                assert.equal(row.cells.length, table.columns.length);
                assert.ok(model.steps.some(step => step.id === row.step), `${type}/${row.step}`);
            }
        }
    }
    assert.match(JSON.stringify(catalog.resolve('natgw').presentation), /10\.0\.1\.4:51514/);
    assert.match(JSON.stringify(catalog.resolve('natgw').presentation), /203\.0\.113\.10:62001/);
    assert.match(JSON.stringify(catalog.resolve('udr').presentation), /0\.0\.0\.0\/0/);
    for (const scenario of ['exhausted', 'unsolicited']) {
        const blocked = catalog.resolve('natgw', { scenario });
        assert.match(blocked.presentation.packet, /no.*mapping/i);
        assert.doesNotMatch(blocked.presentation.packet, /⇄/);
    }
});

test('all audited concepts have a shared model, including the AFD request lab', () => {
    const { catalog, modules } = system();
    assert.deepEqual(Object.keys(catalog.models).sort(), expectedTypes.slice().sort());
    for (const module of modules) {
        for (const diagram of module.diagrams || []) {
            assert.ok(catalog.models[diagram.type], `${module.id}/${diagram.id}`);
            assert.equal(diagram.steps, undefined, 'Narration must live with the graph, not a duplicate module array');
        }
        for (const match of module.learn.matchAll(/data-diagram-model="([^"]+)"/g)) {
            assert.ok(catalog.models[match[1]], `${module.id}/${match[1]}`);
        }
        assert.doesNotMatch(module.learn, /<svg\b/, `${module.id}: replace the separate authored SVG`);
    }
});

test('every level and scenario resolves named nodes, directed edges, steps, boundaries and sources', () => {
    const { catalog } = system();
    for (const type of expectedTypes) {
        const definition = catalog.models[type];
        assert.ok(definition.scenarios.length > 0, type);
        for (const scenario of definition.scenarios) {
            for (const level of ['basic', 'detailed']) {
                const model = catalog.resolve(type, { scenario: scenario.id, level });
                const nodes = new Map(model.nodes.map(node => [node.id, node]));
                const items = [...model.nodes, ...model.edges];
                const itemIds = new Set(items.map(item => item.id));
                assert.equal(itemIds.size, items.length, `${type}: unique semantic IDs`);
                assert.ok(model.steps.length > 1, type);
                assert.ok(model.takeaway && model.caveat, `${type}: teaching purpose and limits`);
                assert.ok(model.sources.length > 0, `${type}: sources`);
                model.sources.forEach(key => assert.match(catalog.sources[key].url, /^https:\/\//));
                model.nodes.forEach(node => {
                    assert.ok(node.label && node.detail, `${type}/${node.id}: labels`);
                    assert.ok(Number.isInteger(node.col) && node.col >= 0, type);
                    assert.ok(Number.isInteger(node.row) && node.row >= 0, type);
                    if (node.group) assert.ok(model.groups.some(group => group.id === node.group), `${type}: group`);
                });
                assert.equal(new Set(model.nodes.map(node => `${node.col},${node.row}`)).size, nodes.size, `${type}: no overlapping node slots`);
                model.edges.forEach(link => {
                    assert.ok(nodes.has(link.from) && nodes.has(link.to), `${type}/${link.id}: endpoints`);
                    assert.ok(link.label, `${type}/${link.id}: relationship label`);
                    assert.ok(['request', 'response', 'config', 'blocked'].includes(link.kind), type);
                });
                model.steps.forEach(step => {
                    assert.ok(step.id && step.title && step.text && step.focus.length, `${type}: named steps`);
                    step.focus.forEach(id => assert.ok(itemIds.has(id), `${type}/${step.id} references ${id}`));
                    if (step.predict) {
                        assert.ok(step.predict.options.length >= 2);
                        assert.ok(step.predict.answer >= 0 && step.predict.answer < step.predict.options.length);
                        assert.ok(step.predict.explanation);
                    }
                });
            }
        }
    }
});

test('OSI steps name the actual highlighted layer without teaching cookie affinity as layer 5', () => {
    const { catalog } = system();
    const model = catalog.resolve('osi-model', { level: 'detailed' });
    for (let index = 0; index < 7; index++) {
        assert.ok(model.steps[index].focus.includes(`layer-${7 - index}`));
        assert.match(model.steps[index].title, new RegExp(`Layer ${7 - index}`));
    }
    assert.match(text(model), /conceptual|concept/i);
    assert.doesNotMatch(model.steps[2].text, /sticky|cookie|Azure uses session affinity/i);
});

test('DNS referrals return to the resolver and only the resolver answers the client', () => {
    const { catalog } = system();
    const model = catalog.resolve('dns-resolution', { level: 'detailed', scenario: 'cold' });
    for (const server of ['root', 'tld', 'authoritative']) {
        assert.ok(model.edges.some(link => link.from === 'resolver' && link.to === server));
        assert.ok(model.edges.some(link => link.from === server && link.to === 'resolver'));
        assert.ok(!model.edges.some(link => link.from === server && link.to === 'client'));
    }
    assert.ok(model.edges.some(link => link.from === 'resolver' && link.to === 'client'));
    const cached = catalog.resolve('dns-resolution', { level: 'detailed', scenario: 'cached' });
    assert.ok(cached.steps.length < model.steps.length);
    assert.ok(!cached.edges.some(link => ['root', 'tld', 'authoritative'].includes(link.to)));
});

test('application tiers, NAT and Bastion show real intermediaries on both legs', () => {
    const { catalog } = system();
    const tiers = catalog.resolve('vnet-architecture', { level: 'detailed' });
    assert.ok(tiers.edges.some(link => link.from === 'web' && link.to === 'app'));
    assert.ok(tiers.edges.some(link => link.from === 'app' && link.to === 'database'));
    assert.ok(!tiers.edges.some(link => link.from === 'web' && link.to === 'database'));
    for (const [type, middle, left, right] of [['natgw', 'nat', 'vm', 'internet'], ['bastion', 'bastion', 'admin', 'vm']]) {
        const model = catalog.resolve(type, { level: 'detailed' });
        for (const [from, to] of [[left, middle], [middle, right], [right, middle], [middle, left]]) {
            assert.ok(model.edges.some(link => link.from === from && link.to === to), `${type}: ${from} -> ${to}`);
        }
    }
    assert.match(text(catalog.resolve('natgw', { scenario: 'exhausted' })), /finite|exhaust/i);
});

test('inspection paths traverse the firewall, not a peering shortcut', () => {
    const { catalog } = system();
    for (const type of ['hub-spoke', 'firewall', 'hub-spoke-capstone']) {
        const model = catalog.resolve(type, { level: 'detailed', scenario: 'inspected' });
        for (const [from, to] of [['spoke-a', 'firewall'], ['firewall', 'spoke-b'], ['spoke-b', 'firewall'], ['firewall', 'spoke-a']]) {
            assert.ok(model.edges.some(link => link.from === from && link.to === to), `${type}: ${from} -> ${to}`);
        }
        assert.ok(!model.edges.some(link => link.from === 'spoke-a' && link.to === 'spoke-b'));
        assert.match(text(model), /return/i);
    }
});

test('UDR explanation distinguishes longest prefix from equal-prefix route-source preference', () => {
    const { catalog } = system();
    const model = catalog.resolve('udr', { level: 'detailed' });
    assert.match(text(model), /longest|most specific/i);
    assert.match(text(model), /equal.*prefix/i);
    assert.match(text(model), /UDR.*BGP.*system/);
    assert.match(text(model), /forwarding/i);
    assert.match(text(model), /translation|SNAT|NAT/);
});

test('AFD HTTPS processing is ordered and early responses do not reach an origin', () => {
    const { catalog } = system();
    const model = catalog.resolve('afd-request', { level: 'detailed', scenario: 'miss' });
    const ordered = ['dns', 'tls', 'waf', 'route', 'rules', 'cache', 'health', 'priority', 'latency', 'weight', 'origin-connect', 'origin-response', 'client-response'];
    let previous = -1;
    ordered.forEach(id => {
        const index = ids(model).indexOf(id);
        assert.ok(index > previous, `${id} follows the previous processing stage`);
        previous = index;
    });
    for (const scenario of ['hit', 'waf-block', 'redirect']) {
        const early = catalog.resolve('afd-request', { level: 'detailed', scenario });
        assert.ok(!early.edges.some(link => link.to === 'origin' && link.kind === 'request'), scenario);
        assert.ok(early.edges.some(link => link.to === 'client' && link.kind === 'response'), scenario);
    }
    assert.ok(ids(catalog.resolve('afd-request', { level: 'detailed', scenario: 'waf-detect' })).includes('origin-connect'));
});

test('AFD tiers and private origins cannot silently teach an unsupported configuration', () => {
    const { catalog } = system();
    for (const tier of ['standard', 'premium', 'classic']) {
        const model = catalog.resolve('afd-request', { tier, level: 'detailed' });
        assert.match(text(model), tier === 'classic' ? /anycast/i : /unicast/i);
        if (tier === 'classic') assert.match(text(model), /2027-03-31|March 31, 2027/);
    }
    assert.throws(() => catalog.resolve('afd-request', { tier: 'standard', connection: 'private' }), /Premium/);
    assert.throws(() => catalog.resolve('afd-request', { tier: 'classic', connection: 'private' }), /Premium/);
    const model = catalog.resolve('afd-request', { tier: 'premium', connection: 'private', level: 'detailed' });
    for (const [from, to] of [['origin-tls', 'managed-pe'], ['managed-pe', 'pls'], ['pls', 'ilb'], ['ilb', 'origin']]) {
        assert.ok(model.edges.some(link => link.from === from && link.to === to), `${from} -> ${to}`);
    }
    assert.match(text(model), /approv/i);
    assert.match(text(model), /not.*mix|cannot.*mix|separate.*origin group/i);
});

test('origin failure, expired and uncacheable responses have conditional outcomes, not guarantees', () => {
    const { catalog } = system();
    const failed = catalog.resolve('afd-request', { scenario: 'origin-failure', level: 'detailed' });
    assert.match(text(failed), /healthy.*secondary|secondary.*healthy/i);
    const allFailed = catalog.resolve('afd-request', { scenario: 'all-unhealthy', level: 'detailed' });
    assert.match(text(allFailed), /round.robin/i);
    assert.match(allFailed.nodes.find(node => node.id === 'selection').detail, /round.robin/i);
    assert.doesNotMatch(allFailed.nodes.find(node => node.id === 'selection').detail, /priority.*latency/i);
    assert.match(text(allFailed), /not.*guarantee|can still fail/i);
    assert.match(text(catalog.resolve('afd-request', { scenario: 'expired' })), /revalidat|fresh/i);
    assert.match(text(catalog.resolve('afd-request', { scenario: 'uncacheable' })), /not.*stor|no-store|bypass/i);
});

test('capstone places SQL PaaS outside the VNet and its endpoint inside', () => {
    const { catalog } = system();
    const model = catalog.resolve('hub-spoke-capstone', { level: 'detailed', scenario: 'private-origin' });
    const sql = model.nodes.find(node => node.id === 'sql');
    const pe = model.nodes.find(node => node.id === 'sql-pe');
    assert.ok(sql && pe);
    assert.notEqual(sql.group, pe.group);
    assert.match(pe.detail, /private endpoint/i);
    for (const id of ['managed-pe', 'pls', 'ilb']) assert.ok(model.nodes.some(node => node.id === id), id);
});

test('rendered maps have instance-local IDs, named images, readable labels and no animation loops', () => {
    const { catalog, engine } = system();
    assert.equal(typeof engine.svg, 'function', 'Shared SVG renderer');
    for (const type of expectedTypes) {
        const model = catalog.resolve(type, { level: 'detailed' });
        const first = engine.svg(model, 'instance-one');
        const second = engine.svg(model, 'instance-two');
        const allIds = Array.from((first + second).matchAll(/\bid="([^"]+)"/g), match => match[1]);
        assert.equal(new Set(allIds).size, allIds.length, type);
        for (const markup of [first, second]) {
            const localIds = new Set(Array.from(markup.matchAll(/\bid="([^"]+)"/g), match => match[1]));
            for (const ref of markup.matchAll(/url\(#([^)]+)\)/g)) assert.ok(localIds.has(ref[1]), `${type}: ${ref[1]}`);
            assert.match(markup, /role="img"/);
            assert.match(markup, /<title\b/);
            assert.match(markup, /<desc\b/);
            assert.doesNotMatch(markup, /<animate|NaN|undefined/);
            for (const size of markup.matchAll(/font-size="(\d+)"/g)) assert.ok(Number(size[1]) >= 12, type);
        }
    }
});

test('overview, next, previous and reset produce one coherent walkthrough state', () => {
    const { catalog, engine } = system();
    assert.equal(typeof engine.transition, 'function');
    const model = catalog.resolve('dns-resolution', { level: 'detailed' });
    let state = { step: 0, overview: true };
    state = engine.transition(state, 'next', model.steps.length);
    assert.equal(state.step, 1);
    assert.equal(state.overview, false);
    state = engine.transition(state, 'overview', model.steps.length);
    assert.equal(state.overview, true);
    state = engine.transition(state, 'next', model.steps.length);
    assert.equal(state.step, 1);
    state = engine.transition(state, 'previous', model.steps.length);
    assert.equal(state.step, 0);
    state = engine.transition({ step: model.steps.length, overview: false }, 'next', model.steps.length);
    assert.equal(state.step, model.steps.length, 'The final Next does not unexpectedly wrap');
    assert.equal(engine.transition(state, 'reset', model.steps.length).step, 0);
});

test('unknown models and invalid scenarios fail explicitly instead of drawing a generic diagram', () => {
    const { catalog } = system();
    assert.throws(() => catalog.resolve('not-a-model'), /Unknown diagram/i);
    assert.throws(() => catalog.resolve('natgw', { scenario: 'invented' }), /scenario/i);
    assert.throws(() => catalog.resolve('afd-request', { tier: 'invented' }), /tier/i);
});

test('surrounding lesson prose no longer repeats audited guarantees and incorrect paths', () => {
    const { modules } = load();
    const prose = modules.map(module => module.learn).join('\n');
    assert.doesNotMatch(prose, /no SNAT port exhaustion|no port exhaustion|maximum security|&lt;\s*10ms|Failover in &lt;\s*30/i);
    assert.doesNotMatch(prose, /nearest healthy backend|100\+ edge locations|same network/i);
});

test('lesson checks and flashcards do not contradict the qualified diagrams', () => {
    const { modules } = load();
    const prose = JSON.stringify(modules);
    for (const staleClaim of [
        /guarantees ordered, reliable delivery|HTTP uses TCP for reliable web page delivery/,
        /max 5,000 NSG rules|These are soft limits that can be increased/,
        /Basic\/Developer|Developer SKU allows connection from native/,
        /429 requires a supported custom-response|using If-Modified-Since or ETag|stale-while-revalidate pattern/
    ]) assert.equal(staleClaim.test(prose), false, `Stale teaching claim: ${staleClaim}`);
});

test('the optional AFD request lab remains a routed cached reference tool', () => {
    const html = fs.readFileSync(path.join(root, 'reference.html'), 'utf8');
    const learning = fs.readFileSync(path.join(root, 'js', 'learning-engine.js'), 'utf8');
    const beginner = fs.readFileSync(path.join(root, 'js', 'beginner.js'), 'utf8');
    const worker = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
    assert.match(learning, /'visual-lab'/);
    assert.match(html, /href="#visual-lab"/);
    assert.match(beginner, /#visual-lab/);
    for (const asset of ['js/diagram-models.js', 'js/diagram-afd.js', 'css/diagrams.css']) {
        assert.ok(html.includes(asset), `${asset}: app shell`);
        assert.ok(worker.includes(asset), `${asset}: offline shell`);
    }
    assert.ok(html.indexOf('js/diagram-models.js') < html.indexOf('js/diagrams.js'));
});
