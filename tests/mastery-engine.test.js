const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

function loadEngine(globals = {}) {
    const context = { ...globals };
    vm.createContext(context);
    const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'mastery-engine.js'), 'utf8');
    vm.runInContext(`${source}\n;globalThis.__engine = MasteryEngine;`, context);
    return context.__engine;
}

test('real modules exclude activity-only IDs', () => {
    const engine = loadEngine();
    const modules = [{ id: 'lesson' }, { id: 'diagram' }];
    const mastery = { activityIds: ['diagram'] };

    assert.deepEqual(Array.from(engine.getRealModules(modules, mastery), item => item.id), ['lesson']);
});

test('requirements reflect the module evidence surfaces', () => {
    const engine = loadEngine();
    const requirements = engine.getRequirements({ quiz: [{}], lab: {} }, { transfer: {} });

    assert.deepEqual({ ...requirements }, { quiz: true, lab: true, transfer: true });
});

test('diagnostic recommends the first missed competency', () => {
    const engine = loadEngine();
    const questions = [
        { moduleId: 'first', correct: 1 },
        { moduleId: 'second', correct: 0 },
        { moduleId: 'third', correct: 2 }
    ];

    const result = engine.evaluateDiagnostic(questions, [1, 3, 2]);

    assert.equal(result.score, 2);
    assert.equal(result.recommendedModuleId, 'second');
});

test('rubric requires four scored criteria and a meaningful reflection', () => {
    const engine = loadEngine();

    assert.equal(engine.evaluateRubric([3, 3, 3, 3], 'This explains the tradeoff and links the test evidence.').passed, true);
    assert.equal(engine.evaluateRubric([4, 4, 4], 'This explains the tradeoff and links the test evidence.').passed, false);
    assert.equal(engine.evaluateRubric([4, 4, 4, 4], 'Too short').passed, false);
});

test('rubric parser accepts numeric strings and preserves an explicit zero', () => {
    const engine = loadEngine();
    const values = Object.freeze(['0', '4', ' 4 ', '4']);
    const scores = engine.parseRubricValues(values);
    assert.deepEqual(Array.from(scores), [0, 4, 4, 4]);
    assert.equal(engine.evaluateRubric(scores, 'The evidence explains the work and its tradeoffs.').passed, true);
    assert.equal(values[0], '0');
});

test('every missing-score combination stays invalid instead of becoming zero', () => {
    const engine = loadEngine();
    for (const missing of ['', ' \t ', null, undefined]) {
        for (let mask = 1; mask < 16; mask++) {
            const values = Array.from({ length: 4 }, (_, index) => mask & (1 << index) ? missing : '4');
            assert.equal(engine.parseRubricValues(values), null, `Missing fields ${mask}, value ${String(missing)}`);
            assert.equal(engine.evaluateRubric(values, 'The evidence explains the work and its tradeoffs.').passed, false);
        }
    }
});

test('sparse or incorrectly sized rubric arrays cannot pass', () => {
    const engine = loadEngine();
    for (let missingIndex = 0; missingIndex < 4; missingIndex++) {
        const scores = [4, 4, 4, 4];
        delete scores[missingIndex];
        assert.equal(engine.parseRubricValues(scores), null);
        assert.equal(engine.evaluateRubric(scores, 'The evidence explains the work and its tradeoffs.').passed, false);
    }
    for (const values of [null, undefined, {}, [], [4, 4, 4], [4, 4, 4, 4, 4], new Array(4)]) {
        assert.equal(engine.evaluateRubric(values, 'The evidence explains the work and its tradeoffs.').passed, false);
    }
});

test('only finite integer rubric scores from zero to four are valid', () => {
    const engine = loadEngine();
    for (const invalid of [-1, 5, 2.5, NaN, Infinity, -Infinity, true, false, {}, [], 'text', 'Infinity', '2.5']) {
        assert.equal(engine.parseRubricValues([invalid, 4, 4, 4]), null, String(invalid));
        assert.equal(engine.evaluateRubric([invalid, 4, 4, 4], 'The evidence explains the work and its tradeoffs.').passed, false);
    }
    assert.equal(engine.evaluateRubric(['4', '4', '4', '4'], 'The evidence explains the work and its tradeoffs.').passed, false);
});

function createMasteryHarness(options = {}) {
    const nodes = new Map();
    const listeners = {};
    const calls = { transfers: [], updates: 0 };
    const lesson = { id: 'lesson', title: 'Lesson', quiz: [{}], lab: {}, ...options.module };
    const labels = ['Correctness', 'Evidence', 'Tradeoffs', 'Clarity'];
    const metadata = { outcome: 'Explain the decision', prerequisites: ['prerequisite'], transfer: {
        prompt: 'Adapt the design to a changed constraint.', artifact: 'design.md',
        rubric: labels.map(label => ({ label, description: `${label} evidence` }))
    } };
    const status = {
        state: 'learned', missing: ['lab'], quizPassed: true, labPassed: false,
        labProvenance: null, transferPassed: false,
        entry: { legacy: false, contentReviewed: true, quiz: { latestScore: 5, total: 5, criticalMisses: 0 },
            lab: { completed: false }, transfer: null, review: { successfulReviews: 0, nextDue: null } },
        ...options.status
    };
    const decode = value => value.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
    let markup = '';
    let disclosure;
    const makeNode = (id, attributes = {}, value = '') => ({
        id, value, textContent: '', isConnected: true,
        hidden: Object.hasOwn(attributes, 'hidden'), required: Object.hasOwn(attributes, 'required'), disabled: Object.hasOwn(attributes, 'disabled'),
        setAttribute(name, content) { attributes[name] = String(content); if (name === 'open') this.open = true; },
        getAttribute(name) { return attributes[name] ?? null; },
        removeAttribute(name) { delete attributes[name]; if (name === 'open') this.open = false; },
        focus() { document.activeElement = this; }
    });
    const container = {
        dataset: {}, hidden: false,
        get innerHTML() { return markup; },
        set innerHTML(value) {
            markup = value;
            for (const node of nodes.values()) node.isConnected = false;
            nodes.clear();
            for (const match of value.matchAll(/<(select|textarea|span|small|input|p|div|button)\b([^>]*\sid="([^"]+)"[^>]*)>/gi)) {
                const [, tag, rawAttributes, id] = match;
                const attributes = Object.fromEntries(Array.from(rawAttributes.matchAll(/([\w:-]+)="([^"]*)"/g), attribute => [attribute[1], decode(attribute[2])]));
                for (const name of ['hidden', 'disabled', 'required']) if (new RegExp(`\\b${name}\\b`).test(rawAttributes)) attributes[name] = '';
                const body = value.slice(match.index + match[0].length).split(`</${tag}>`)[0];
                const selected = tag === 'select' ? body.match(/<option\b[^>]*value="([^"]*)"[^>]*\bselected\b/) || body.match(/<option\b[^>]*value="([^"]*)"/) : null;
                const initialValue = tag === 'textarea' ? decode(body) : selected ? decode(selected[1]) : attributes.value || '';
                const node = makeNode(id, attributes, initialValue);
                if (['span', 'small', 'p', 'button'].includes(tag)) node.textContent = decode(body);
                nodes.set(id, node);
            }
            disclosure = makeNode('disclosure');
            disclosure.open = /<details\b[^>]*\bopen\b/.test(value);
        },
        querySelector(selector) {
            if (selector === '.evidence-disclosure' || selector === 'details') return disclosure;
            return selector.startsWith('#') ? nodes.get(selector.slice(1)) || null : null;
        }
    };
    const document = {
        body: { dataset: {} }, activeElement: null,
        addEventListener(type, listener) { listeners[type] = listener; },
        getElementById(id) { return id === 'masteryPanel' ? container : nodes.get(id) || null; }
    };
    const engine = loadEngine({
        document,
        ACADEMY_MASTERY: { activityIds: [], modules: { lesson: metadata } },
        ProgressManager: {
            getMasteryStatus() { return status; },
            saveTransferResult(...values) {
                calls.transfers.push(values);
                if (options.accepted === false) return false;
                status.entry.transfer = { score: values[1], max: values[2], reflection: values[3], scores: values[4], ...values[6] };
                status.transferPassed = true;
                return {};
            },
            getStorageStatus() { return options.storage || { saved: true, message: '', recoveryRequired: false }; }
        },
        app: { updateProgress() { calls.updates++; if (options.rerenderFromApp) engine.renderModulePanel(lesson); } }
    });
    engine.modules = [lesson, { id: 'prerequisite', title: 'Prerequisite & basics' }];
    engine.renderModulePanel(lesson);
    return { engine, container, document, nodes, listeners, calls, lesson, status, labels };
}

function fillTransfer(harness, values = ['4', '4', '4', '4'], note = 'The artifact records the test evidence and explains the tradeoff.') {
    values.forEach((value, index) => { harness.document.getElementById(`transfer-score-${index}`).value = value; });
    harness.document.getElementById('transfer-reflection').value = note;
    harness.container.querySelector('.evidence-disclosure').open = true;
    return note;
}

test('form rejects every blank-score combination, marks criteria, and focuses the first invalid field', () => {
    for (let mask = 1; mask < 16; mask++) {
        const harness = createMasteryHarness();
        const values = Array.from({ length: 4 }, (_, index) => mask & (1 << index) ? '' : '4');
        const note = fillTransfer(harness, values);
        harness.engine.submitTransfer('lesson');
        assert.equal(harness.calls.transfers.length, 0, `Missing fields ${mask}`);
        const firstInvalid = values.indexOf('');
        assert.equal(harness.document.activeElement, harness.document.getElementById(`transfer-score-${firstInvalid}`));
        values.forEach((value, index) => {
            assert.equal(harness.document.getElementById(`transfer-score-${index}`).getAttribute('aria-invalid'), String(value === ''));
            if (value === '') assert.match(harness.document.getElementById(`transfer-score-error-${index}`).textContent, /0.*4/);
        });
        assert.match(harness.document.getElementById('transfer-feedback').textContent, new RegExp(harness.labels[firstInvalid]));
        assert.equal(harness.document.getElementById('transfer-reflection').value, note);
    }
});

test('a missing score control or fractional score cannot be submitted', () => {
    for (const missingControl of [false, true]) {
        const harness = createMasteryHarness();
        fillTransfer(harness, ['4', '4', '4', '2.5']);
        if (missingControl) harness.nodes.delete('transfer-score-3');
        harness.engine.submitTransfer('lesson');
        assert.equal(harness.calls.transfers.length, 0);
        assert.match(harness.document.getElementById('transfer-feedback').textContent, /Clarity/);
    }
});

test('a short evidence note is retained, marked invalid, and focused', () => {
    const harness = createMasteryHarness();
    fillTransfer(harness, undefined, 'Needs work');
    harness.engine.submitTransfer('lesson');
    const reflection = harness.document.getElementById('transfer-reflection');
    assert.equal(reflection.value, 'Needs work');
    assert.equal(reflection.getAttribute('aria-invalid'), 'true');
    assert.equal(harness.document.activeElement, reflection);
    assert.equal(harness.calls.transfers.length, 0);
});

test('explicit zero can pass the average gate and records self-assessment in the seventh argument', () => {
    const harness = createMasteryHarness({ rerenderFromApp: true });
    fillTransfer(harness, ['0', '4', '4', '4']);
    const oldFeedback = harness.document.getElementById('transfer-feedback');
    harness.engine.submitTransfer('lesson');
    assert.equal(harness.calls.transfers.length, 1);
    assert.equal(harness.calls.transfers[0][1], 3);
    assert.deepEqual(Array.from(harness.calls.transfers[0][4]), [0, 4, 4, 4]);
    assert.deepEqual({ ...harness.calls.transfers[0][6] }, { provenance: 'self-assessed', reviewer: '' });
    const feedback = harness.document.getElementById('transfer-feedback');
    assert.notEqual(feedback, oldFeedback);
    assert.equal(feedback.isConnected, true);
    assert.match(feedback.textContent, /Self-assessment saved/);
    assert.match(feedback.textContent, /Learned/);
    assert.doesNotMatch(feedback.textContent, /now Demonstrated/);
    assert.equal(harness.document.activeElement, feedback);
    assert.equal(harness.container.querySelector('.evidence-disclosure').open, true);
});

test('failed saves retain the note and do not claim a persisted assessment', () => {
    for (const options of [
        { storage: { saved: false, message: 'Not saved on this device. Export a backup.', recoveryRequired: true } },
        { accepted: false }
    ]) {
        const harness = createMasteryHarness(options);
        const note = fillTransfer(harness);
        harness.engine.submitTransfer('lesson');
        const feedback = harness.document.getElementById('transfer-feedback');
        assert.match(feedback.textContent, /not saved/i);
        assert.doesNotMatch(feedback.textContent, /assessment saved|now Demonstrated/i);
        assert.equal(harness.document.getElementById('transfer-reflection').value, note);
        assert.equal(harness.calls.updates, 0);
    }
});

test('provenance controls are labelled and only allow human assessment modes', () => {
    const harness = createMasteryHarness();
    harness.engine.init(harness.engine.modules);
    const provenance = harness.document.getElementById('transfer-provenance');
    assert.ok(provenance);
    assert.equal(provenance.value, 'self-assessed');
    assert.match(harness.container.innerHTML, /for="transfer-provenance"/);
    assert.match(harness.container.innerHTML, /Record self-assessment/);
    assert.match(harness.container.innerHTML, /Reviewer identity is self-reported, not certification/);
    assert.doesNotMatch(harness.container.innerHTML, /Evaluate evidence|value="automatically-verified"|on(?:click|change)=/);
    provenance.value = 'reviewer-assessed';
    assert.equal(typeof harness.listeners.change, 'function');
    harness.listeners.change({ target: provenance });
    assert.equal(harness.document.getElementById('transfer-reviewer-fields').hidden, false);
    assert.equal(harness.document.getElementById('transfer-reviewer').required, true);
    assert.equal(harness.document.getElementById('transfer-submit').textContent, 'Record reviewer assessment');
    provenance.value = 'self-assessed';
    harness.listeners.change({ target: provenance });
    assert.equal(harness.document.getElementById('transfer-reviewer-fields').hidden, true);
    assert.equal(harness.document.getElementById('transfer-reviewer').required, false);
});

test('reviewer assessments require a trimmed name of at least two characters', () => {
    for (const name of ['', ' ', 'A', '  A  ']) {
        const harness = createMasteryHarness();
        fillTransfer(harness);
        const provenance = harness.document.getElementById('transfer-provenance');
        assert.ok(provenance);
        provenance.value = 'reviewer-assessed';
        const reviewer = harness.document.getElementById('transfer-reviewer');
        reviewer.value = name;
        harness.engine.submitTransfer('lesson');
        assert.equal(harness.calls.transfers.length, 0);
        assert.equal(reviewer.getAttribute('aria-invalid'), 'true');
        assert.equal(harness.document.activeElement, reviewer);
    }
    const harness = createMasteryHarness();
    fillTransfer(harness);
    harness.document.getElementById('transfer-provenance').value = 'reviewer-assessed';
    harness.document.getElementById('transfer-reviewer').value = '  Pat Reviewer  ';
    harness.engine.submitTransfer('lesson');
    assert.deepEqual({ ...harness.calls.transfers[0][6] }, { provenance: 'reviewer-assessed', reviewer: 'Pat Reviewer' });
    assert.match(harness.document.getElementById('transfer-feedback').textContent, /Reviewer assessment saved/);
});

test('unsupported provenance cannot be submitted as automatically verified evidence', () => {
    const harness = createMasteryHarness();
    fillTransfer(harness);
    const provenance = harness.document.getElementById('transfer-provenance');
    assert.ok(provenance);
    provenance.value = 'automatically-verified';
    harness.engine.submitTransfer('lesson');
    assert.equal(harness.calls.transfers.length, 0);
    assert.equal(provenance.getAttribute('aria-invalid'), 'true');
    assert.equal(harness.document.activeElement, provenance);
});

test('practice labels distinguish a self-reported external lab from a self-attested local artifact', () => {
    for (const external of [false, true]) {
        const harness = createMasteryHarness();
        harness.status.labPassed = true;
        harness.status.labProvenance = 'self-attested';
        harness.status.entry.lab.completed = external;
        harness.engine.renderModulePanel(harness.lesson);
        assert.match(harness.container.innerHTML, external ? /External lab[^<]*self-reported/ : /Local artifact practice[^<]*self-attested/);
        assert.doesNotMatch(harness.container.innerHTML, /Complete and verify|automated proof/i);
    }
});

test('no-lab modules do not gain a completed practice check merely because no lab is required', () => {
    const harness = createMasteryHarness({ module: { lab: undefined }, status: { labPassed: true, labProvenance: null } });
    assert.match(harness.container.innerHTML, /1\/3 evidence checks complete/);
    const practice = Array.from(harness.container.innerHTML.matchAll(/<div class="mastery-evidence([^"]*)">[\s\S]*?<strong>([^<]+)<\/strong>/g)).find(row => row[2] === 'Practiced');
    assert.ok(practice);
    assert.doesNotMatch(practice[1], /is-complete/);
});

test('legacy records and prerequisite anchors are explicit and escaped', () => {
    const harness = createMasteryHarness();
    harness.status.entry.legacy = true;
    harness.status.entry.transfer = { scores: [4, 4, 4, 4], reflection: '<script>example</script>', provenance: 'legacy-unknown' };
    harness.status.transferPassed = true;
    harness.engine.renderModulePanel(harness.lesson);
    assert.match(harness.container.innerHTML, /Legacy[^<]*(?:unknown|imported)/i);
    assert.match(harness.container.innerHTML, /href="#prerequisite"/);
    assert.match(harness.container.innerHTML, /Prerequisite &amp; basics/);
    assert.match(harness.container.innerHTML, /&lt;script&gt;example&lt;\/script&gt;/);
    assert.doesNotMatch(harness.container.innerHTML, /<script>/);
});
