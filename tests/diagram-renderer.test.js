const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
function system() {
    const context = vm.createContext({});
    for (const file of ['diagram-models.js', 'diagram-afd.js', 'diagrams.js']) {
        vm.runInContext(fs.readFileSync(path.join(root, 'js', file), 'utf8'), context);
    }
    return vm.runInContext(`({ catalog: DiagramCatalog, engine: DiagramEngine,
        lab: typeof DiagramLab === 'undefined' ? null : DiagramLab })`, context);
}

test('every diagram exposes accessible controls and an equivalent ordered explanation', () => {
    const { catalog, engine } = system();
    assert.equal(typeof engine.html, 'function');
    for (const type of Object.keys(catalog.models)) {
        const model = catalog.resolve(type);
        const markup = engine.html(model, 'test-instance', { step: 0, overview: true, layout: 'map', predictions: true });
        for (const action of ['previous', 'next', 'overview', 'reset']) {
            assert.ok(markup.includes(`data-diagram-action="${action}"`), `${type}: ${action}`);
        }
        assert.equal(markup.includes('data-diagram-setting="level"'), catalog.hasDepth(type, model.settings));
        assert.equal(markup.includes('data-diagram-setting="scenario"'), model.scenarios.length > 1);
        assert.match(markup, /role="status"/);
        assert.match(markup, /tabindex="0"[^>]*aria-label="Network map:/);
        assert.match(markup, /Full explanation/);
        assert.match(markup, /Sources and limits/);
        model.steps.forEach(step => assert.ok(markup.includes(engine.escapeHtml(step.text)), `${type}/${step.id}`));
    }
});

test('the visual and current step precede optional settings, with only relevant legend entries', () => {
    const { catalog, engine } = system();
    for (const type of Object.keys(catalog.models)) {
        const model = catalog.resolve(type);
        const html = engine.html(model, 'guide', { step: 0, overview: true, layout: 'map' });
        assert.ok(html.indexOf('class="diagram-map"') < html.indexOf('data-disclosure="options"'), type);
        assert.ok(html.indexOf('class="diagram-coach"') < html.indexOf('data-disclosure="options"'), type);
        const legend = html.match(/<ul class="diagram-key"[^>]*>(.*?)<\/ul>/s)?.[1] || '';
        for (const kind of Object.keys(engine.kinds)) {
            assert.equal(legend.includes(`trace-${kind}`), model.edges.some(edge => edge.kind === kind), `${type}/${kind}`);
        }
        assert.doesNotMatch(html, /class="diagram-scenario"/);
        assert.match(html, />Start tracing<\/button>/);
    }
});

test('TCP has ordered lifelines rather than overlapping horizontal message arrows', () => {
    const { catalog, engine } = system();
    const svg = engine.svg(catalog.resolve('tcp-handshake'), 'sequence');
    assert.match(svg, /trace-lifeline/);
    const paths = [...svg.matchAll(/class="trace-edge[^"]*"[^>]*>.*?<path d="([^"]+)"/gs)].map(match => match[1]);
    assert.equal(new Set(paths).size, 5);
    for (const label of ['SYN / seq 100', 'SYN-ACK / seq 300, ack 101', 'ACK / ack 301']) assert.ok(svg.includes(label));
});

test('semantic policy, routing and translation views expose model-owned evidence and current decisions', () => {
    const { catalog, engine } = system();
    for (const type of ['nsg-filtering', 'udr', 'natgw']) {
        const model = catalog.resolve(type);
        const initial = engine.presentationHtml(model, { step: 0, overview: true });
        assert.match(initial, /<table/);
        assert.match(initial, /<caption>/);
        assert.match(initial, /scope="col"/);
        const progressed = engine.presentationHtml(model, { step: 2, overview: false });
        assert.notEqual(progressed, initial);
        assert.match(progressed, /aria-current="step"/);
    }
});

test('first-match policy highlights only the winning rule, then shows the forwarding outcome', () => {
    const { catalog, engine } = system();
    for (const scenario of ['allow', 'deny']) {
        const model = catalog.resolve('nsg-filtering', { scenario });
        const checking = engine.presentationHtml(model, { step: 2, overview: false });
        assert.equal([...checking.matchAll(/aria-current="step"/g)].length, 1);
        const finished = engine.presentationHtml(model, { step: 3, overview: false });
        assert.match(finished, /diagram-result/);
        assert.ok(finished.includes(scenario === 'allow' ? 'Both NSGs allow' : 'Matching deny / traffic dropped'));
    }
});

test('definition scenario options and static previews retain the existing rendering API', () => {
    const { catalog, engine } = system();
    assert.equal(engine.diagramOptions({ type: 'afd-request', scenario: 'hit' }).scenario, 'hit');
    assert.equal(engine.diagramOptions({ options: { scenario: 'miss' }, scenario: 'hit' }).scenario, 'hit');
    const html = engine.html(catalog.resolve('afd-request', { scenario: 'hit' }), 'preview', { overview: true, step: 0, preview: true });
    assert.doesNotMatch(html, /data-diagram-action|data-diagram-setting/);
    assert.match(html, /Fresh cache hit/);
    assert.match(html, /Full explanation/);
});

test('compact previews lead with one semantic relationship and disclose the complete graph', () => {
    const { catalog, engine } = system();
    for (const type of Object.keys(catalog.models)) {
        const model = catalog.resolve(type);
        const state = { overview: true, step: 0, preview: true, compact: true };
        const html = engine.html(model, 'compact', state);
        assert.match(html, /class="diagram-compact-relationship"/);
        assert.ok(html.indexOf('diagram-compact-relationship') < html.indexOf('data-disclosure="full-visual"'));
        assert.match(html, /<details[^>]*data-disclosure="full-visual"[^>]*>/);
        assert.match(html, /<svg/);
        assert.match(html, /Full explanation/);
        assert.match(html, /Sources and limits/);
        assert.doesNotMatch(html, /data-diagram-action|data-diagram-setting/);
        const regular = engine.html(model, 'regular', { ...state, compact: false });
        assert.doesNotMatch(regular, /diagram-compact-relationship/);
    }
});

test('diagram labels are escaped and all markup IDs stay under the instance namespace', () => {
    const { catalog, engine } = system();
    assert.equal(typeof engine.svg, 'function');
    const model = catalog.resolve('natgw');
    model.title = '<img src=x onerror=alert(1)>';
    model.nodes[0].label = '<script>alert(1)</script>';
    const markup = engine.svg(model, 'safe-instance');
    assert.doesNotMatch(markup, /<script>|<img/);
    assert.match(markup, /&lt;/);
    for (const [, id] of markup.matchAll(/\bid="([^"]+)"/g)) assert.ok(id.startsWith('safe-instance-'), id);
});

test('SVG geometry puts every node and its text within the viewBox', () => {
    const { catalog, engine } = system();
    assert.equal(typeof engine.geometry, 'function');
    for (const type of Object.keys(catalog.models)) {
        for (const scenario of catalog.models[type].scenarios) {
            for (const level of ['basic', 'detailed']) {
                const model = catalog.resolve(type, { level, scenario: scenario.id });
                const geometry = engine.geometry(model);
                assert.ok(geometry.width > 0 && geometry.height > 0);
                geometry.nodes.forEach(node => {
                    assert.ok(node.x >= 0 && node.y >= 0, `${type}: positive coordinates`);
                    assert.ok(node.x + node.width <= geometry.width, `${type}: horizontal bounds`);
                    assert.ok(node.y + node.height <= geometry.height, `${type}: vertical bounds`);
                });
            }
        }
    }
});

test('the mobile list and map are two renderings of the same scenario', () => {
    const { catalog, engine } = system();
    assert.equal(typeof engine.pathList, 'function');
    for (const type of Object.keys(catalog.models)) {
        const model = catalog.resolve(type, { level: 'detailed' });
        const markup = engine.pathList(model, { step: 0, overview: true });
        assert.match(markup, /diagram-path-list/);
        model.edges.forEach(link => {
            assert.ok(markup.includes(engine.escapeHtml(link.label)), `${type}/${link.id}`);
            assert.ok(markup.includes(engine.escapeHtml(model.nodes.find(node => node.id === link.from).label)));
            assert.ok(markup.includes(engine.escapeHtml(model.nodes.find(node => node.id === link.to).label)));
        });
    }
});

test('the request-lab check requires five answers and reports a real score without quiz credit', () => {
    const { lab } = system();
    assert.ok(lab, 'A routed request lab must exist');
    assert.equal(lab.questions.length, 5);
    assert.throws(() => lab.assess([0]), /five|every|answer/i);
    assert.throws(() => lab.assess([99, 99, 99, 99, 99]), /answer/i);
    assert.throws(() => lab.assess(new Array(5)), /answer/i);
    const correct = lab.questions.map(question => question.answer);
    assert.equal(lab.assess(correct).score, 5);
    const oneWrong = Array.from(correct);
    oneWrong[0] = (oneWrong[0] + 1) % lab.questions[0].options.length;
    assert.equal(lab.assess(oneWrong).score, 4);
    assert.equal(lab.assess(oneWrong).passed, true);
    oneWrong[1] = (oneWrong[1] + 1) % lab.questions[1].options.length;
    assert.equal(lab.assess(oneWrong).passed, false);
    const source = fs.readFileSync(path.join(root, 'js', 'diagrams.js'), 'utf8');
    assert.doesNotMatch(source, /saveQuizScore|markLabComplete|saveTransferResult|markContentReviewed/);
});

test('the renderer never starts automatic SVG or JavaScript animation', () => {
    const source = fs.readFileSync(path.join(root, 'js', 'diagrams.js'), 'utf8');
    assert.doesNotMatch(source, /<animateMotion|<animate\b|requestAnimationFrame|setInterval/);
});

test('basic Front Door keeps product configuration choices behind the detailed layer', () => {
    const { catalog, engine } = system();
    const state = { step: 0, overview: true, layout: 'map', predictions: true };
    const simple = engine.html(catalog.resolve('afd-request'), 'simple', state);
    const detailed = engine.html(catalog.resolve('afd-request', { level: 'detailed' }), 'detailed', state);
    assert.doesNotMatch(simple, /data-diagram-setting="tier"|data-diagram-setting="connection"/);
    assert.match(detailed, /data-diagram-setting="tier"/);
    assert.match(detailed, /data-diagram-setting="connection"/);
});
