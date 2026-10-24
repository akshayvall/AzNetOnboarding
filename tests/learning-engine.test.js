const assert = require('node:assert/strict');
const test = require('node:test');
const LearningEngine = require('../js/learning-engine.js');
const { readFileSync, existsSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');

const modules = [
    { id: 'intro', title: 'Foundations', level: 100, lab: { steps: [{}, {}] } },
    { id: 'dns', title: 'DNS and retrieval', level: 200, lab: { steps: [{}] } },
    { id: 'review', title: 'Review decisions', level: 300 }
];
const statuses = {
    intro: { state: 'practiced', missing: ['transfer'] },
    dns: { state: 'demonstrated', missing: ['spaced review'] },
    review: { state: 'not_started', missing: ['quiz'] }
};
const progress = { moduleMastery: { dns: { transfer: { score: 3, max: 4 }, review: { nextDue: '2026-09-01T00:00:00Z' } } }, labSteps: { intro: [true, null] } };

test('routes roundtrip destination filters and lesson state', () => {
    const route = LearningEngine.parseRoute('#dns?tab=quiz&section=case-study&mode=browse');
    assert.equal(route.moduleId, 'dns');
    assert.equal(route.tab, 'quiz');
    assert.equal(route.sectionId, 'case-study');
    assert.equal(route.mode, 'browse');
    assert.equal(LearningEngine.formatRoute(route), '#dns?tab=quiz&section=case-study&mode=browse');
    assert.equal(LearningEngine.parseRoute('#learn?query=DNS').query, 'DNS');
    assert.equal(LearningEngine.parseRoute('#dns').tab, 'learn');
    assert.equal(LearningEngine.parseRoute('#dns?tab=bogus').tab, 'learn');
});

test('practice prioritizes due reviews while build lists unfinished evidence', () => {
    const options = { now: '2026-09-14T12:00:00Z' };
    const practice = LearningEngine.selectModules(modules, progress, statuses, { ...options, destination: 'practice' });
    const builds = LearningEngine.selectModules(modules, progress, statuses, { ...options, destination: 'build' });
    assert.equal(practice[0].id, 'dns');
    assert.deepEqual(builds.map(item => item.id), ['intro', 'review']);
});

test('learn filters by query, level, state, and selected route without mutating content', () => {
    const selected = LearningEngine.selectModules(modules, progress, statuses, { destination: 'learn', query: 'DNS', level: '200', state: 'demonstrated', pathIds: ['dns', 'intro'] });
    assert.deepEqual(selected.map(item => item.id), ['dns']);
    assert.equal(modules[0].id, 'intro');
});

test('coaching content escapes markup and never makes inline event handlers', () => {
    assert.equal(LearningEngine.escapeHtml('<img src=x onerror="bad">'), '&lt;img src=x onerror=&quot;bad&quot;&gt;');
});

test('coaching renderer escapes metadata and withholds prediction answers', () => {
    assert.equal(typeof LearningEngine.renderCoachingHtml, 'function');
    const unsafe = '<img src=x onerror="bad">';
    const content = {
        workedExample: { title: unsafe, scenario: unsafe, steps: [unsafe], result: unsafe },
        prediction: { prompt: unsafe, options: [unsafe, 'Another choice'], correct: 0, explanation: 'ANSWER_ONLY_AFTER_CHECK' },
        transfer: { prompt: unsafe, checks: [unsafe] },
        exemplar: { artifact: unsafe, sample: unsafe, scores: [3, 2, 3, 3], rationale: unsafe }
    };
    const html = LearningEngine.renderCoachingHtml({ id: 'intro', title: unsafe }, content);
    assert.ok(!html.includes(unsafe));
    assert.ok(html.includes('&lt;img src=x onerror=&quot;bad&quot;&gt;'));
    assert.ok(!html.includes('ANSWER_ONLY_AFTER_CHECK'));
    assert.match(html, /<fieldset/);
    assert.match(html, /name="prediction-option"/);
    assert.match(html, /Illustrative example, not your evidence/);
    assert.match(html, /data-learning-action="check-prediction"/);
});

test('destination renderers distinguish empty catalog, due queue, builds, and evidence', () => {
    assert.equal(typeof LearningEngine.renderDestinationHtml, 'function');
    const context = { modules: [], progress: {}, statuses: {}, content: { modules: {}, paths: [] }, now: '2026-09-14T12:00:00Z' };
    const practice = LearningEngine.renderDestinationHtml('practice', context);
    assert.match(practice, /No reviews due\./);
    assert.ok(!practice.includes('Review now'));
    assert.match(LearningEngine.renderDestinationHtml('learn', context), /No modules match these filters\./);
    assert.match(LearningEngine.renderDestinationHtml('build', context), /No unfinished build tasks\./);
    assert.match(LearningEngine.renderDestinationHtml('more', context), /Your practice results will appear here after you try a check\./);
    assert.match(practice, /id="destinationTitle" tabindex="-1"/);
});

test('prediction validation rejects missing or invalid choices before scoring', () => {
    assert.equal(typeof LearningEngine.validatePrediction, 'function');
    const prediction = { options: ['First', 'Second'], correct: 0, explanation: 'The first choice is supported.' };
    for (const choice of [undefined, null, '', ' ', '-1', '2', '0x0', '0oops', true, 0.5]) {
        assert.equal(LearningEngine.validatePrediction(prediction, choice).valid, false);
    }
    assert.equal(LearningEngine.validatePrediction(prediction, '0').passed, true);
    assert.equal(LearningEngine.validatePrediction(prediction, '1').passed, false);
    assert.equal(LearningEngine.validatePrediction({ ...prediction, correct: 8 }, '0').valid, false);
});

function createRuntime() {
    const nodes = new Map();
    const listeners = {};
    const windowListeners = {};
    const calls = { predictions: [], artifacts: [], drafts: [], navigation: [], dashboard: 0, panel: 0, progress: 0, exports: 0, downloads: [] };
    const state = { progress: { moduleMastery: {}, practiceChecks: {}, artifactPractice: {}, completedLabs: [], quizScores: {} }, ui: { drafts: {}, activePath: 'core', sessionMinutes: 25 }, storage: { saved: true, message: '', recoveryRequired: false }, failDraft: false, writeResult: true, retryResult: true };
    const document = {
        activeElement: null,
        getElementById: id => nodes.get(id) || null,
        querySelector: () => null,
        addEventListener: (name, handler) => (listeners[name] ||= []).push(handler)
    };
    const addNode = (id, value = '') => {
        let html = '';
        const node = { id, value, dataset: {}, attributes: {}, queries: {}, hidden: false, writes: 0, insertions: [], textContent: '', checked: false,
            focus() { document.activeElement = this; },
            setAttribute(name, value) { this.attributes[name] = value; },
            removeAttribute(name) { delete this.attributes[name]; },
            querySelector(selector) { return this.queries[selector] || null; },
            closest(selector) { return selector === '[data-learning-action]' && this.dataset.learningAction ? this : this.owner || null; },
            contains(element) { return element === this || element?.owner === this; },
            click() { this.clicks = (this.clicks || 0) + 1; },
            remove() { nodes.delete(this.id); },
            appendChild() {},
            insertAdjacentHTML(position, markup) {
                this.insertions.push({ position, markup });
                const root = markup.match(/<section id="([^"]+)"[^>]*data-module-id="([^"]+)"/);
                if (root) addNode(root[1]).dataset.moduleId = root[2];
            }
        };
        Object.defineProperty(node, 'innerHTML', { get: () => html, set: value => {
            if (node.contains(document.activeElement)) document.activeElement = null;
            html = value;
            node.writes++;
        } });
        nodes.set(id, node);
        return node;
    };
    document.createElement = tag => addNode(`created-${tag}-${nodes.size}`);
    document.body = addNode('body');
    for (const id of ['storageNotice', 'destinationView', 'learningPreferences', 'tab-learn', 'tab-lab', 'predictionOptions', 'predictionFeedback', 'artifactFeedback']) addNode(id);
    nodes.get('storageNotice').hidden = true;
    const content = { version: '2026-09-14', paths: [{ id: 'core', title: 'Core path', moduleIds: ['intro'] }], modules: { intro: {
        workedExample: { title: 'A synthetic case', scenario: 'Inspect the supplied fixture.', steps: ['Compare the two observations.'], result: 'The boundary is identified.' },
        prediction: { prompt: 'Which boundary failed?', options: ['First boundary', 'Second boundary'], correct: 0, explanation: 'Only the first differs.' },
        transfer: { prompt: 'Change one input and explain the result.', checks: ['Name the changed observation.'] },
        exemplar: { artifact: 'example.md', sample: 'FICTIONAL_EXEMPLAR_NOT_REAL', scores: [3, 2, 3, 3], rationale: 'An illustration only.' },
        lab: { mode: 'artifact', environment: 'Offline text editor', expected: 'A boundary table', failure: 'An unsupported conclusion', verify: ['Compare observations.'], cost: '$0', safety: 'Synthetic data only; no secrets.', cleanup: ['Remove scratch notes.'], status: 'source-reviewed' }
    } } };
    const context = { document, URLSearchParams, Blob, setTimeout: callback => callback(),
        window: { addEventListener: (name, handler) => (windowListeners[name] ||= []).push(handler) },
        URL: { createObjectURL: blob => { calls.downloads.push(blob); return 'blob:local-test'; }, revokeObjectURL() {} },
        LEARNING_CONTENT: content, ACADEMY_MASTERY: { activityIds: ['visual'] },
        ProgressManager: {
            getProgress: () => state.progress, getStorageStatus: () => state.storage,
            savePracticeResult: (moduleId, passed) => { calls.predictions.push({ moduleId, passed }); return state.writeResult; },
            saveArtifactPractice: (moduleId, evidence) => { calls.artifacts.push({ moduleId, evidence }); return state.writeResult; },
            retrySave: () => { if (state.retryResult) state.storage = { saved: true, message: '', recoveryRequired: false }; return state.retryResult; },
            exportProgress: () => { calls.exports++; },
            createExport: () => ({ ...state.progress, academyId: 'test-academy', exportedAt: '2026-09-14T12:00:00Z' })
        },
        UIStateManager: {
            get: () => state.ui,
            saveDraft: (moduleId, draft) => { calls.drafts.push({ moduleId, draft }); if (state.failDraft) return false; state.ui.drafts[moduleId] = { ...state.ui.drafts[moduleId], ...draft }; return state.ui; },
            setPreferences: preferences => { Object.assign(state.ui, preferences); return state.ui; }
        },
        MasteryEngine: { getStatus: () => ({ state: 'not_started', missing: ['quiz', 'transfer'] }), renderDashboard: () => { calls.dashboard++; }, renderModulePanel: () => { calls.panel++; } },
        app: { navigateDestination: (destination, filters) => calls.navigation.push({ destination, filters }), updateProgress: () => { calls.progress++; } },
        module: { exports: {} }
    };
    vm.runInNewContext(readFileSync(join(__dirname, '../js/learning-engine.js'), 'utf8'), context);
    const dispatch = (name, target) => { const event = { target, prevented: false, preventDefault() { this.prevented = true; } }; (listeners[name] || []).forEach(handler => handler(event)); return event; };
    return { engine: context.module.exports, context, content, nodes, addNode, listeners, windowListeners, calls, state, dispatch };
}

test('task views use real modules, scheduled dates, first incomplete steps, and escaped input', () => {
    const unsafe = '<script>alert("metadata")</script>';
    const lessonModules = [...modules, { id: 'future', title: 'Future review', quiz: [{}] }, { id: 'visual', title: 'Visual activity' }];
    const context = { modules: lessonModules, progress: { ...progress, moduleMastery: { ...progress.moduleMastery, future: { transfer: { score: 3, max: 4 }, review: { nextDue: '2026-10-01T00:00:00Z' } }, review: { review: { nextDue: '2026-09-01T00:00:00Z' } } } }, statuses, activityIds: ['visual'], route: { query: unsafe }, now: '2026-09-14T12:00:00Z' };
    const catalog = LearningEngine.renderDestinationHtml('learn', context);
    assert.ok(!catalog.includes(unsafe));
    assert.ok(!catalog.split('Visual review')[0].includes('Visual activity'));
    const practice = LearningEngine.renderDestinationHtml('practice', context);
    assert.equal((practice.match(/>Review now<\/a>/g) || []).length, 1);
    assert.match(practice, /Next review .*2026/);
    assert.ok(!practice.includes('Visual activity'));
    const build = LearningEngine.renderDestinationHtml('build', context);
    assert.match(build, /Next external step 2/);
    assert.match(build, /1\/2 external steps checked \(self-reported\)/);
    assert.match(build, /Case artifact; no external lab required/);
    assert.match(build, /href="#review\?tab=lab"/);
});

test('init binds once and destination rendering does not navigate', () => {
    const runtime = createRuntime();
    assert.equal(typeof runtime.engine.init, 'function');
    runtime.engine.init(modules);
    runtime.engine.init(modules);
    for (const name of ['click', 'submit', 'input', 'change', 'academy-storage-change']) assert.equal(runtime.listeners[name].length, 1);
    assert.equal(runtime.windowListeners.beforeunload.length, 1);
    runtime.engine.renderDestination('learn');
    assert.match(runtime.nodes.get('destinationView').innerHTML, /id="catalogFilters"/);
    assert.equal(runtime.calls.navigation.length, 0);
});

test('filters apply only on submit and preferences use the agreed setters', () => {
    const runtime = createRuntime();
    assert.equal(typeof runtime.engine.init, 'function');
    runtime.engine.init(modules);
    runtime.addNode('catalogQuery', 'DNS');
    runtime.addNode('catalogLevel', '200');
    runtime.addNode('catalogState', 'learned');
    runtime.addNode('catalogPathOnly').checked = true;
    runtime.dispatch('input', runtime.nodes.get('catalogQuery'));
    assert.equal(runtime.calls.navigation.length, 0);
    assert.equal(runtime.dispatch('submit', runtime.addNode('catalogFilters')).prevented, true);
    assert.equal(runtime.calls.navigation[0].destination, 'learn');
    assert.equal(runtime.calls.navigation[0].filters.query, 'DNS');
    assert.equal(runtime.calls.navigation[0].filters.pathOnly, true);
    runtime.engine.handleAction('clear-filters');
    assert.equal(runtime.calls.navigation[1].filters.query, '');
    assert.equal(runtime.calls.navigation[1].filters.level, '');
    assert.equal(runtime.calls.navigation[1].filters.state, '');
    assert.equal(runtime.calls.navigation[1].filters.pathOnly, false);
    runtime.engine.renderPreferences();
    assert.match(runtime.nodes.get('learningPreferences').innerHTML, /Core path/);
    assert.match(runtime.nodes.get('learningPreferences').innerHTML, /Catalog preferences/);
    assert.doesNotMatch(runtime.nodes.get('learningPreferences').innerHTML, /Session length|id="sessionMinutes"/);
    runtime.addNode('learningPath', 'core');
    runtime.dispatch('change', runtime.nodes.get('learningPath'));
    assert.equal(runtime.state.ui.sessionMinutes, 25);
    assert.equal(runtime.calls.dashboard, 1);
    assert.deepEqual(runtime.state.progress.completedLabs, []);
});

test('prediction actions validate, use the original answer, and preserve focus without quiz awards', () => {
    const runtime = createRuntime();
    assert.equal(typeof runtime.engine.checkPrediction, 'function');
    runtime.engine.init(modules);
    runtime.engine.renderCoaching(modules[0]);
    const radio = runtime.addNode('prediction-option-0', '0');
    const fieldset = runtime.nodes.get('predictionOptions');
    fieldset.queries['input[name="prediction-option"]'] = radio;
    const button = runtime.addNode('predictionButton');
    assert.equal(runtime.engine.checkPrediction('intro'), false);
    assert.equal(runtime.calls.predictions.length, 0);
    assert.equal(runtime.context.document.activeElement, radio);
    fieldset.queries['input[name="prediction-option"]:checked'] = radio;
    button.focus();
    assert.equal(runtime.engine.checkPrediction('intro'), true);
    assert.deepEqual(runtime.calls.predictions, [{ moduleId: 'intro', passed: true }]);
    assert.equal(runtime.context.document.activeElement, button);
    assert.deepEqual(runtime.state.progress.quizScores, {});
    runtime.state.writeResult = false;
    assert.equal(runtime.engine.checkPrediction('intro'), false);
    assert.match(runtime.nodes.get('predictionFeedback').textContent, /not saved/i);
});

test('coaching and local practice prepend once and preserve external lab nodes', () => {
    const runtime = createRuntime();
    assert.equal(typeof runtime.engine.renderLabPractice, 'function');
    runtime.engine.init(modules);
    const labHost = runtime.nodes.get('tab-lab');
    labHost.innerHTML = '<div id="legacyLab">Existing lab</div>';
    const legacy = runtime.addNode('legacyLab');
    legacy.listener = () => 'still bound';
    runtime.engine.renderCoaching(modules[0]);
    runtime.engine.renderCoaching(modules[0]);
    runtime.engine.renderLabPractice(modules[0]);
    runtime.engine.renderLabPractice(modules[0]);
    assert.equal(labHost.innerHTML, '<div id="legacyLab">Existing lab</div>');
    assert.equal(legacy.listener(), 'still bound');
    assert.equal(labHost.insertions.length, 1);
    assert.equal(labHost.insertions[0].position, 'afterbegin');
    assert.equal(runtime.nodes.get('tab-learn').insertions.length, 1);
    assert.match(labHost.insertions[0].markup, /Your case analysis/);
    assert.match(labHost.insertions[0].markup, /maxlength="4000"/);
});

test('artifact saves require meaningful evidence and never complete an external lab', () => {
    const runtime = createRuntime();
    assert.equal(typeof runtime.engine.saveArtifact, 'function');
    runtime.engine.init(modules);
    runtime.engine.renderLabPractice(modules[0]);
    const evidence = runtime.addNode('artifactEvidence', 'Too short');
    assert.equal(runtime.engine.saveArtifact('intro'), false);
    assert.equal(runtime.calls.artifacts.length, 0);
    evidence.value = 'The first boundary differs in the supplied synthetic case, so the later boundary remains untested.';
    assert.equal(runtime.engine.saveArtifact('intro'), true);
    assert.equal(runtime.calls.artifacts.length, 1);
    assert.equal(runtime.nodes.get('artifactFeedback').textContent, 'Self-attested case practice saved');
    assert.equal(runtime.calls.panel, 1);
    assert.equal(runtime.calls.progress, 1);
    assert.deepEqual(runtime.state.progress.completedLabs, []);
    runtime.state.writeResult = false;
    assert.equal(runtime.engine.saveArtifact('intro'), false);
    assert.match(runtime.nodes.get('artifactFeedback').textContent, /not saved/i);
});

test('drafts are bounded, preserve absent fields, and restore an intentionally empty reflection', () => {
    const runtime = createRuntime();
    assert.equal(typeof runtime.engine.saveDrafts, 'function');
    runtime.engine.init(modules);
    runtime.engine.renderLabPractice(modules[0]);
    runtime.state.ui.drafts.intro = { reflection: '' };
    const evidence = runtime.addNode('artifactEvidence', 'x'.repeat(4100));
    runtime.dispatch('input', evidence);
    assert.equal(runtime.engine.hasUnsavedChanges(), true);
    assert.equal(runtime.engine.saveDrafts('intro'), true);
    assert.equal(runtime.calls.drafts[0].draft.artifact.length, 4000);
    assert.deepEqual(Object.keys(runtime.calls.drafts[0].draft), ['artifact']);
    assert.equal(runtime.state.ui.drafts.intro.reflection, '');
    assert.equal(runtime.engine.hasUnsavedChanges(), false);
    runtime.addNode('transfer-reflection', 'An older assessment');
    runtime.engine.restoreDrafts('intro');
    assert.equal(runtime.nodes.get('transfer-reflection').value, '');
});

test('failed drafts survive view changes, warn before unload, and retry without copying another module', () => {
    const runtime = createRuntime();
    assert.equal(typeof runtime.engine.retrySave, 'function');
    runtime.engine.init(modules);
    runtime.engine.renderLabPractice(modules[0]);
    const evidence = runtime.addNode('artifactEvidence', 'The original draft stays available after a failed storage write.');
    runtime.dispatch('input', evidence);
    runtime.state.failDraft = true;
    assert.equal(runtime.engine.saveDrafts('intro'), false);
    assert.equal(runtime.nodes.get('storageNotice').hidden, false);
    const unload = { preventDefault() { this.prevented = true; } };
    runtime.windowListeners.beforeunload[0](unload);
    assert.equal(unload.prevented, true);
    runtime.engine.currentModuleId = 'dns';
    evidence.value = 'A different module draft';
    runtime.state.failDraft = false;
    assert.equal(runtime.engine.retrySave(), true);
    assert.equal(runtime.state.ui.drafts.intro.artifact, 'The original draft stays available after a failed storage write.');
    assert.equal(runtime.engine.hasUnsavedChanges(), false);
});

test('storage warnings are persistent, escaped, and do not rerender on unchanged events', () => {
    const runtime = createRuntime();
    assert.equal(typeof runtime.engine.renderStorageStatus, 'function');
    runtime.engine.init(modules);
    runtime.state.storage = { saved: false, message: '<img src=x onerror="bad">', recoveryRequired: true };
    runtime.engine.renderStorageStatus();
    const notice = runtime.nodes.get('storageNotice');
    assert.equal(notice.hidden, false);
    assert.ok(!notice.innerHTML.includes('<img'));
    assert.match(notice.innerHTML, /data-learning-action="retry-save"/);
    assert.match(notice.innerHTML, /data-learning-action="export-progress"/);
    const writes = notice.writes;
    runtime.dispatch('academy-storage-change');
    assert.equal(notice.writes, writes);
    runtime.state.retryResult = false;
    assert.equal(runtime.engine.retrySave(), false);
    assert.equal(notice.hidden, false);
    runtime.state.retryResult = true;
    assert.equal(runtime.engine.retrySave(), true);
    assert.equal(notice.hidden, true);
    assert.equal(runtime.calls.dashboard, 0);
});

test('a successful retry moves focus from the resolved alert to the active view heading', () => {
    const runtime = createRuntime();
    runtime.engine.init(modules);
    runtime.state.storage = { saved: false, message: 'Progress is not saved.', recoveryRequired: false };
    runtime.engine.persistProgress(() => false);
    const button = runtime.addNode('retryButton');
    button.owner = runtime.nodes.get('storageNotice');
    button.dataset.learningAction = 'retry-save';
    button.focus();
    const heading = runtime.addNode('destinationTitle');
    const hiddenPreferences = runtime.addNode('learningPath');
    runtime.context.document.querySelector = selector => selector.includes('#learningPath') ? hiddenPreferences : heading;
    runtime.context.ProgressManager.retrySave = () => {
        runtime.state.storage = { saved: true, message: '', recoveryRequired: false };
        runtime.dispatch('academy-storage-change');
        return true;
    };
    assert.equal(runtime.engine.retrySave(), true);
    assert.equal(runtime.context.document.activeElement, heading);
    assert.equal(runtime.nodes.get('storageNotice').hidden, true);
});

test('draft persistence never reports success when the adapter silently drops fields', () => {
    const runtime = createRuntime();
    runtime.engine.init(modules);
    runtime.engine.renderLabPractice(modules[0]);
    const evidence = runtime.addNode('artifactEvidence', 'A recoverable draft that was not written by the storage adapter.');
    runtime.dispatch('input', evidence);
    runtime.context.UIStateManager.saveDraft = () => runtime.state.ui;
    assert.equal(runtime.engine.saveDrafts('intro'), false);
    assert.equal(runtime.engine.hasUnsavedChanges(), true);
    assert.equal(runtime.nodes.get('storageNotice').hidden, false);
});

test('downloads and imports are explicit actions and reports contain only recorded evidence', async () => {
    const runtime = createRuntime();
    assert.equal(typeof runtime.engine.handleAction, 'function');
    runtime.engine.init(modules);
    runtime.addNode('importProgress');
    runtime.engine.handleAction('import-progress');
    assert.equal(runtime.nodes.get('importProgress').clicks, 1);
    runtime.engine.handleAction('export-progress');
    assert.equal(runtime.calls.exports, 1);
    runtime.state.progress.artifactPractice.intro = { evidence: 'OWN_EVIDENCE <script>unsafe</script>', completedAt: '2026-09-14T12:00:00Z' };
    runtime.engine.handleAction('download-report');
    assert.equal(runtime.calls.downloads.length, 1);
    const report = await runtime.calls.downloads[0].text();
    assert.match(report, /OWN/);
    assert.match(report, /Self-attested/);
    assert.ok(!report.includes('<script>'));
    assert.ok(!report.includes('FICTIONAL_EXEMPLAR_NOT_REAL'));
    assert.deepEqual(runtime.state.progress.quizScores, {});
});

test('all authored modules render a local case and structured worksheet without answer leakage', () => {
    assert.equal(typeof LearningEngine.renderLabPracticeHtml, 'function');
    assert.equal(typeof LearningEngine.createWorksheet, 'function');
    const source = readFileSync(join(__dirname, '../js/learning-content.js'), 'utf8');
    const registry = vm.runInNewContext(`${source}\nLEARNING_CONTENT`);
    assert.equal(Object.keys(registry.modules).length, 21);
    for (const [moduleId, content] of Object.entries(registry.modules)) {
        const module = { id: moduleId, title: content.workedExample.title };
        assert.match(LearningEngine.renderLabPracticeHtml(module, content), /data-learning-action="save-artifact-practice"/);
        const worksheet = LearningEngine.createWorksheet(module, content);
        assert.ok(worksheet.includes('Your case analysis'));
        assert.ok(!worksheet.includes(content.prediction.explanation));
        assert.ok(!LearningEngine.renderCoachingHtml(module, content).includes(content.prediction.explanation));
    }
});

test('new CSS uses academy tokens, inherited fonts, inline alerts, and bounded mobile controls', () => {
    const path = join(__dirname, '../css/learning.css');
    assert.ok(existsSync(path), 'learning.css must exist');
    const css = readFileSync(path, 'utf8');
    assert.match(css, /--learning-accent:\s*var\(--azure-blue\)/);
    assert.match(css, /min-height:\s*44px/);
    assert.match(css, /75ch/);
    assert.match(css, /letter-spacing:\s*0/);
    assert.ok(!/@import|https?:|position:\s*fixed|font-family:/i.test(css));
    for (const radius of css.matchAll(/border-radius:\s*(\d+)px/g)) assert.ok(Number(radius[1]) <= 8);
});