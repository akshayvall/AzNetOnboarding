const assert = require('node:assert/strict');
const test = require('node:test');

const TodayEngine = require('../js/today-engine.js');

const modules = [
    { id: 'foundations', title: 'Foundations', estimatedTime: '20 min', lab: { steps: [{}, {}] } },
    { id: 'systems', title: 'Systems', estimatedTime: '30 min', lab: { steps: [{}, {}, {}] } },
    { id: 'capstone', title: 'Capstone', estimatedTime: '1 hour' }
];
const metadata = {
    foundations: { prerequisites: [] },
    systems: { prerequisites: ['foundations'] },
    capstone: { prerequisites: ['systems'] }
};
const state = overrides => ({
    modules,
    metadata,
    statuses: {
        foundations: { state: 'not_started', missing: ['quiz', 'lab'] },
        systems: { state: 'not_started', missing: ['quiz', 'lab'] },
        capstone: { state: 'not_started', missing: ['quiz'] }
    },
    progress: { diagnostic: null, lastVisited: null, labSteps: {}, moduleMastery: {} },
    uiState: { lastModuleId: null, lastSectionByModule: {}, lastTabByModule: {}, lastTouchedAtByModule: {} },
    activityIds: [],
    now: '2026-07-29T12:00:00.000Z',
    ...overrides
});

const onPath = (moduleIds, overrides = {}) => state({
    paths: [{ id: 'selected', moduleIds }],
    progress: { diagnostic: {} },
    ...overrides,
    uiState: { activePath: 'selected', ...overrides.uiState }
});

test('new learners receive the diagnostic as the only primary action', () => {
    assert.equal(TodayEngine.select(state()).primary.kind, 'diagnostic');
});

test('an unfinished active lab beats an overdue review', () => {
    const result = TodayEngine.select(state({
        progress: { diagnostic: { recommendedModuleId: 'foundations' }, lastVisited: 'systems', labSteps: { systems: [true, null, null] }, moduleMastery: { foundations: { review: { nextDue: '2026-07-20T12:00:00.000Z' }, transfer: { score: 3, max: 4 } } } },
        uiState: { lastModuleId: 'systems', lastSectionByModule: {}, lastTabByModule: { systems: 'lab' }, lastTouchedAtByModule: { systems: '2026-07-29T11:00:00.000Z' } }
    }));
    assert.equal(result.primary.kind, 'active_lab');
    assert.equal(result.alsoDue[0].moduleId, 'foundations');
});

test('overdue reviews sort by due date', () => {
    const result = TodayEngine.select(state({
        progress: { diagnostic: { recommendedModuleId: 'foundations' }, lastVisited: null, labSteps: {}, moduleMastery: {
            foundations: { review: { nextDue: '2026-07-21T12:00:00.000Z' }, transfer: { score: 3, max: 4 } },
            systems: { review: { nextDue: '2026-07-20T12:00:00.000Z' }, transfer: { score: 3, max: 4 } }
        } }
    }));
    assert.equal(result.primary.moduleId, 'systems');
});

test('a review due today beats an active lesson', () => {
    const result = TodayEngine.select(state({
        progress: { diagnostic: { recommendedModuleId: 'foundations' }, lastVisited: 'systems', labSteps: {}, moduleMastery: { foundations: { review: { nextDue: '2026-07-29T12:00:00.000Z' }, transfer: { score: 3, max: 4 } } } },
        uiState: { lastModuleId: 'systems', lastSectionByModule: { systems: 'retrieval' }, lastTabByModule: { systems: 'learn' }, lastTouchedAtByModule: { systems: '2026-07-29T11:00:00.000Z' } }
    }));
    assert.equal(result.primary.kind, 'review_due_today');
    assert.equal(result.alsoDue[0].sectionId, 'retrieval');
});

test('the next module requires learned prerequisites', () => {
    const result = TodayEngine.select(state({
        progress: { diagnostic: { recommendedModuleId: 'systems' } },
        statuses: {
            foundations: { state: 'learned', missing: ['lab'] },
            systems: { state: 'not_started', missing: ['quiz', 'lab'] },
            capstone: { state: 'not_started', missing: ['quiz'] }
        }
    }));
    assert.equal(result.primary.kind, 'diagnostic_recommendation');
    assert.equal(result.primary.moduleId, 'systems');
    assert.deepEqual(result.milestones.map(item => item.moduleId), ['systems', 'capstone']);
});

test('future reviews are not due just because their UTC day is today', () => {
    for (const nextDue of ['2026-07-29T18:00:00.000Z', '2026-07-30T01:00:00+10:00', '2026-07-29T08:00:00-07:00']) {
        const result = TodayEngine.select(state({
            progress: { diagnostic: {}, moduleMastery: { foundations: { review: { nextDue }, transfer: { score: 3, max: 4 } } } },
            uiState: { lastModuleId: 'systems', lastTabByModule: { systems: 'learn' }, lastSectionByModule: { systems: 'retrieval' } }
        }));
        assert.equal(result.primary.kind, 'active_lesson', nextDue);
        assert.equal(result.primary.sectionId, 'retrieval');
        assert.ok(!result.alsoDue.some(candidate => /review/.test(candidate.kind)));
    }
});

test('review timestamps include the exact due instant across timezone offsets', () => {
    for (const nextDue of ['2026-07-29T12:00:00.000Z', '2026-07-30T02:00:00+14:00']) {
        const result = TodayEngine.select(state({
            progress: { diagnostic: {}, moduleMastery: { foundations: { review: { nextDue }, transfer: { score: 3, max: 4 } } } }
        }));
        assert.equal(result.primary.kind, 'review_due_today', nextDue);
    }
});

test('new recommendations and milestones follow selected path order without mutating access or progress', () => {
    const input = onPath(['systems', 'foundations'], { metadata: {} });
    const before = JSON.stringify(input);
    const result = TodayEngine.select(input);
    assert.equal(result.primary.kind, 'next_module');
    assert.equal(result.primary.moduleId, 'systems');
    assert.deepEqual(result.milestones.map(item => item.moduleId), ['systems', 'foundations']);
    assert.equal(JSON.stringify(input), before);
});

test('a diagnostic recommendation resolves the earliest missing prerequisite recursively', () => {
    for (const pathInput of [{}, { paths: [{ id: 'selected', moduleIds: ['capstone'] }], uiState: { activePath: 'selected' } }]) {
        const result = TodayEngine.select(state({
            modules: [...modules].reverse(),
            progress: { diagnostic: { recommendedModuleId: 'capstone' } },
            ...pathInput
        }));
        assert.equal(result.primary.kind, 'diagnostic_recommendation');
        assert.equal(result.primary.moduleId, 'foundations');
        if (pathInput.paths) assert.deepEqual(result.milestones.map(item => item.moduleId), ['foundations', 'systems', 'capstone']);
    }
});

test('all missing prerequisites are added ahead of the selected path module', () => {
    const result = TodayEngine.select(onPath(['systems'], {
        modules: [...modules, { id: 'identity', title: 'Identity' }],
        metadata: { ...metadata, systems: { prerequisites: ['foundations', 'identity'] } },
        progress: { diagnostic: { recommendedModuleId: 'systems' } }
    }));
    assert.equal(result.primary.moduleId, 'foundations');
    assert.deepEqual(result.milestones.map(item => item.moduleId), ['foundations', 'identity', 'systems']);
});

test('a diagnostic miss outside the selected path does not start unrelated work', () => {
    const result = TodayEngine.select(onPath(['foundations'], {
        metadata: {},
        progress: { diagnostic: { recommendedModuleId: 'systems' } }
    }));
    assert.equal(result.primary.kind, 'next_module');
    assert.equal(result.primary.moduleId, 'foundations');
    assert.deepEqual(result.milestones.map(item => item.moduleId), ['foundations']);
});

test('off-path overdue reviews remain recovery work without widening milestones', () => {
    const result = TodayEngine.select(onPath(['systems'], {
        statuses: { foundations: { state: 'durable' }, systems: { state: 'not_started' } },
        progress: { diagnostic: {}, moduleMastery: { foundations: { review: { nextDue: '2026-07-20T12:00:00.000Z' }, transfer: { score: 3, max: 4 } } } }
    }));
    assert.equal(result.primary.kind, 'overdue_review');
    assert.equal(result.primary.moduleId, 'foundations');
    assert.deepEqual(result.milestones.map(item => item.moduleId), ['systems']);
});

test('off-path unfinished labs remain recovery work without widening milestones', () => {
    const result = TodayEngine.select(onPath(['foundations'], {
        progress: { diagnostic: {}, labSteps: { systems: [true, null, null] } },
        uiState: { lastModuleId: 'systems', lastTabByModule: { systems: 'lab' } }
    }));
    assert.equal(result.primary.kind, 'active_lab');
    assert.equal(result.primary.moduleId, 'systems');
    assert.deepEqual(result.milestones.map(item => item.moduleId), ['foundations']);
});

test('capstone recommendations wait for their prerequisites', () => {
    const input = onPath(['capstone'], {
        statuses: { foundations: { state: 'learned' }, systems: { state: 'not_started' }, capstone: { state: 'not_started' } }
    });
    assert.equal(TodayEngine.select(input).primary.moduleId, 'systems');
    input.statuses.systems.state = 'learned';
    assert.equal(TodayEngine.select(input).primary.kind, 'capstone');
});

test('missing and cyclic prerequisites never produce unsafe recommendations', () => {
    for (const prerequisites of [{ foundations: { prerequisites: ['systems'] }, systems: { prerequisites: ['foundations'] } }, { foundations: { prerequisites: ['unknown'] }, systems: { prerequisites: ['foundations'] } }]) {
        const result = TodayEngine.select(onPath(['systems'], {
            modules: modules.filter(module => module.id !== 'capstone'),
            metadata: prerequisites,
            progress: { diagnostic: { recommendedModuleId: 'systems' } }
        }));
        assert.equal(result.primary.moduleId, null);
        assert.doesNotMatch(result.primary.description, /All current modules have evidence/);
    }
});

test('missing metadata and statuses degrade to the default curriculum', () => {
    const result = TodayEngine.select(state({ metadata: undefined, statuses: undefined, progress: { diagnostic: {} } }));
    assert.equal(result.primary.kind, 'next_module');
    assert.equal(result.primary.moduleId, 'foundations');
});

test('absent or unknown path input preserves default order and excludes activities', () => {
    for (const paths of [undefined, [{ id: 'other', moduleIds: ['systems'] }]]) {
        const result = TodayEngine.select(state({
            paths,
            modules: [{ id: 'activity', title: 'Activity' }, ...modules],
            activityIds: ['activity'],
            progress: { diagnostic: {} },
            uiState: { activePath: 'selected' }
        }));
        assert.equal(result.primary.moduleId, 'foundations');
        assert.deepEqual(result.milestones.map(item => item.moduleId), ['foundations', 'systems', 'capstone']);
    }
});

test('durable last modules cannot keep stale lesson or lab resume actions alive', () => {
    for (const tab of ['learn', 'quiz', 'lab']) {
        const result = TodayEngine.select(state({
            statuses: { foundations: { state: 'durable', missing: [] }, systems: { state: 'not_started', missing: ['quiz', 'lab'] } },
            progress: { diagnostic: { recommendedModuleId: 'systems' }, lastVisited: 'foundations' },
            uiState: { lastModuleId: 'foundations', lastTabByModule: { foundations: tab }, lastSectionByModule: { foundations: 'retrieval' } }
        }));
        assert.equal(result.primary.moduleId, 'systems', tab);
        assert.ok(!result.alsoDue.some(candidate => candidate.moduleId === 'foundations'));
    }
});

test('a demonstrated lesson waiting for a future review does not starve the next module', () => {
    const result = TodayEngine.select(state({
        statuses: { foundations: { state: 'demonstrated', missing: ['review'] }, systems: { state: 'not_started' } },
        progress: { diagnostic: { recommendedModuleId: 'systems' }, moduleMastery: { foundations: { transfer: { score: 4, max: 4 }, review: { nextDue: '2026-08-01T12:00:00.000Z' } } } },
        uiState: { lastModuleId: 'foundations', lastTabByModule: { foundations: 'learn' } }
    }));
    assert.equal(result.primary.moduleId, 'systems');
    assert.equal(result.alsoDue.length, 0);
});

test('active evidence work routes to the first missing quiz, lab, or transfer step', () => {
    const cases = [
        { status: { state: 'not_started', missing: ['quiz', 'lab', 'transfer'] }, lastTab: 'quiz', tab: 'quiz', sectionId: null },
        { status: { state: 'learned', missing: ['lab', 'transfer'] }, lastTab: 'quiz', tab: 'lab', sectionId: null },
        { status: { state: 'practiced', missing: ['transfer', 'review'] }, lastTab: 'lab', tab: 'learn', sectionId: 'transfer-evidence' }
    ];
    for (const { status, lastTab, tab, sectionId } of cases) {
        const result = TodayEngine.select(state({
            statuses: { foundations: status },
            progress: { diagnostic: {}, completedLabs: status.state === 'practiced' ? ['foundations'] : [] },
            uiState: { lastModuleId: 'foundations', lastTabByModule: { foundations: lastTab }, lastSectionByModule: { foundations: 'retrieval' } }
        }));
        assert.equal(result.primary.kind, 'active_lesson', status.state);
        assert.equal(result.primary.moduleId, 'foundations');
        assert.equal(result.primary.tab, tab);
        assert.equal(result.primary.sectionId, sectionId);
    }
});

test('a failed quiz attempt resumes assessment instead of replaying the saved lesson', () => {
    const result = TodayEngine.select(state({
        progress: { diagnostic: {}, moduleMastery: { foundations: { quiz: { score: 1, max: 4 } } } },
        uiState: { lastModuleId: 'foundations', lastTabByModule: { foundations: 'learn' }, lastSectionByModule: { foundations: 'retrieval' } }
    }));
    assert.equal(result.primary.tab, 'quiz');
    assert.equal(result.primary.sectionId, null);
});

test('remaining transfer evidence takes precedence over starting another diagnostic recommendation', () => {
    const result = TodayEngine.select(state({
        statuses: { foundations: { state: 'practiced', missing: ['transfer'] }, systems: { state: 'not_started' } },
        progress: { diagnostic: { recommendedModuleId: 'systems' }, completedLabs: ['foundations'] }
    }));
    assert.equal(result.primary.moduleId, 'foundations');
    assert.equal(result.primary.tab, 'learn');
    assert.equal(result.primary.sectionId, 'transfer-evidence');
    assert.doesNotMatch(result.primary.description, /All current modules have evidence/);
});

test('started path modules can finish missing evidence even without a last-visited pointer', () => {
    for (const { status, entry, tab } of [
        { status: { state: 'learned', missing: ['lab', 'transfer'] }, entry: {}, tab: 'lab' },
        { status: { state: 'not_started', missing: ['quiz', 'lab'] }, entry: { quiz: { score: 1, max: 4 } }, tab: 'quiz' }
    ]) {
        const result = TodayEngine.select(onPath(['foundations'], {
            statuses: { foundations: status },
            progress: { diagnostic: {}, moduleMastery: { foundations: entry } }
        }));
        assert.equal(result.primary.moduleId, 'foundations');
        assert.equal(result.primary.tab, tab);
    }
});

test('an unfinished off-path reference lesson can still resume without prerequisite gating', () => {
    const result = TodayEngine.select(onPath(['foundations'], {
        uiState: { lastModuleId: 'systems', lastTabByModule: { systems: 'learn' }, lastSectionByModule: { systems: 'retrieval' } }
    }));
    assert.equal(result.primary.kind, 'active_lesson');
    assert.equal(result.primary.moduleId, 'systems');
    assert.equal(result.primary.sectionId, 'retrieval');
    assert.deepEqual(result.milestones.map(item => item.moduleId), ['foundations']);
});

test('new evidence recommendations do not pull unrelated modules into a selected path', () => {
    const result = TodayEngine.select(onPath(['systems'], {
        statuses: { foundations: { state: 'practiced', missing: ['transfer'] }, systems: { state: 'not_started' } }
    }));
    assert.equal(result.primary.moduleId, 'systems');
    assert.deepEqual(result.milestones.map(item => item.moduleId), ['systems']);
});

test('recovery priority stays stable by recency, due time, and curriculum order', () => {
    const input = onPath(['systems', 'foundations'], {
        progress: {
            diagnostic: {}, labSteps: { foundations: [true, null], systems: [true, null, null] },
            moduleMastery: {
                foundations: { review: { nextDue: '2026-07-20T12:00:00.000Z' }, transfer: { score: 3, max: 4 } },
                systems: { review: { nextDue: '2026-07-29T12:00:00.000Z' }, transfer: { score: 3, max: 4 } }
            }
        },
        uiState: { lastTouchedAtByModule: { foundations: '2026-07-29T10:00:00.000Z', systems: '2026-07-29T11:00:00.000Z' } }
    });
    const result = TodayEngine.select(input);
    assert.deepEqual([result.primary, ...result.alsoDue].map(candidate => [candidate.kind, candidate.moduleId]), [
        ['active_lab', 'systems'], ['active_lab', 'foundations'], ['overdue_review', 'foundations'], ['review_due_today', 'systems']
    ]);
    input.uiState.lastTouchedAtByModule.systems = input.uiState.lastTouchedAtByModule.foundations;
    assert.equal(TodayEngine.select(input).primary.moduleId, 'foundations');
});

const labSession = sessionMinutes => state({
    modules: modules.map(module => module.id === 'systems' ? {
        ...module, estimatedTime: '1 hour', lab: { ...module.lab, estimatedTime: '90 min' }
    } : module),
    statuses: { foundations: { state: 'durable' }, systems: { state: 'learned', missing: ['lab', 'transfer'] } },
    progress: {
        diagnostic: {}, labSteps: { systems: [true, null, null] },
        moduleMastery: { foundations: { review: { nextDue: '2026-07-20T12:00:00.000Z' }, transfer: { score: 3, max: 4 } } }
    },
    uiState: { sessionMinutes, lastModuleId: 'systems', lastTabByModule: { systems: 'lab' } }
});

test('a ten-minute session replaces a long active lab with a case and retains the external lab', () => {
    const input = labSession(10);
    const before = JSON.stringify(input);
    const result = TodayEngine.select(input);
    assert.equal(result.primary.kind, 'practice_case');
    assert.equal(result.primary.moduleId, 'systems');
    assert.equal(result.primary.tab, 'learn');
    assert.equal(result.primary.sectionId, 'worked-example');
    assert.equal(result.primary.actionLabel, 'Practice case');
    assert.match(result.primary.description, /^10-minute case.*no cloud deployment/);
    assert.equal(result.primary.estimatedTime, '10-minute session');
    assert.ok(result.alsoDue.some(candidate => candidate.kind === 'active_lab' && candidate.moduleId === 'systems' && candidate.tab === 'lab'));
    assert.ok(result.alsoDue.some(candidate => candidate.kind === 'overdue_review' && candidate.moduleId === 'foundations'));
    assert.equal(JSON.stringify(input), before);
});

test('25- and 60-minute sessions keep active labs but describe a bounded portion', () => {
    for (const sessionMinutes of [25, 60]) {
        const result = TodayEngine.select(labSession(sessionMinutes));
        assert.equal(result.primary.kind, 'active_lab');
        assert.equal(result.primary.tab, 'lab');
        assert.equal(result.primary.sectionId, null);
        assert.equal(result.primary.estimatedTime, `${sessionMinutes}-minute session`);
        assert.match(result.primary.description, /one portion of the lab/);
        assert.match(result.primary.description, /1 of 3 required steps complete/);
        assert.ok(result.alsoDue.every(candidate => candidate.estimatedTime === `${sessionMinutes}-minute session`));
    }
});

test('the lab duration takes precedence over the whole-module estimate for short sessions', () => {
    for (const { moduleTime, labTime, kind } of [
        { moduleTime: '5 min', labTime: '1h 30m', kind: 'practice_case' },
        { moduleTime: '2 hours', labTime: '5 min', kind: 'active_lab' }
    ]) {
        const input = labSession(10);
        input.modules = input.modules.map(module => module.id === 'systems' ? {
            ...module, estimatedTime: moduleTime, lab: { ...module.lab, estimatedTime: labTime }
        } : module);
        assert.equal(TodayEngine.select(input).primary.kind, kind);
    }
});

test('unknown lab duration and missing metadata use the conservative ten-minute case', () => {
    const input = labSession(10);
    input.metadata = undefined;
    input.statuses = undefined;
    input.modules = input.modules.map(module => ({ ...module, estimatedTime: undefined, lab: module.lab ? { steps: module.lab.steps } : undefined }));
    assert.equal(TodayEngine.select(input).primary.sectionId, 'worked-example');
});

test('new module and capstone estimates describe the chosen session rather than the whole task', () => {
    for (const sessionMinutes of [10, 25, 60]) {
        const next = TodayEngine.select(onPath(['foundations'], { uiState: { sessionMinutes } }));
        const capstone = TodayEngine.select(onPath(['capstone'], {
            statuses: { foundations: { state: 'durable' }, systems: { state: 'durable' }, capstone: { state: 'not_started' } },
            uiState: { sessionMinutes }
        }));
        assert.equal(next.primary.estimatedTime, `${sessionMinutes}-minute session`);
        assert.equal(capstone.primary.kind, 'capstone');
        assert.equal(capstone.primary.estimatedTime, `${sessionMinutes}-minute session`);
    }
});

test('absent or unsupported session budgets use a 25-minute session', () => {
    for (const sessionMinutes of [undefined, null, 0, 15, '10']) {
        const result = TodayEngine.select(labSession(sessionMinutes));
        assert.equal(result.primary.kind, 'active_lab');
        assert.equal(result.primary.estimatedTime, '25-minute session');
    }
});

test('a short session preserves the remaining transfer handoff', () => {
    const result = TodayEngine.select(onPath(['foundations'], {
        statuses: { foundations: { state: 'practiced', missing: ['transfer'] } },
        uiState: { sessionMinutes: 10 }
    }));
    assert.equal(result.primary.tab, 'learn');
    assert.equal(result.primary.sectionId, 'transfer-evidence');
    assert.equal(result.primary.estimatedTime, '10-minute session');
});

test('a short session preserves due review assessment', () => {
    const result = TodayEngine.select(state({
        progress: { diagnostic: {}, moduleMastery: { foundations: { transfer: { score: 3, max: 4 }, review: { nextDue: '2026-07-29T12:00:00.000Z' } } } },
        uiState: { sessionMinutes: 10 }
    }));
    assert.equal(result.primary.kind, 'review_due_today');
    assert.equal(result.primary.tab, 'quiz');
    assert.equal(result.primary.estimatedTime, '10-minute session');
});

test('diagnostic prerequisite repair resumes missing quiz evidence already attempted', () => {
    const result = TodayEngine.select(onPath(['systems'], {
        progress: { diagnostic: { recommendedModuleId: 'systems' }, moduleMastery: { foundations: { quiz: { score: 1, max: 4 } } } }
    }));
    assert.equal(result.primary.moduleId, 'foundations');
    assert.equal(result.primary.tab, 'quiz');
    assert.equal(result.primary.sectionId, null);
});

test('selected path completion does not claim evidence for unrelated unfinished modules', () => {
    const result = TodayEngine.select(onPath(['foundations'], {
        statuses: { foundations: { state: 'durable', missing: [] }, systems: { state: 'practiced', missing: ['transfer'] } }
    }));
    assert.equal(result.primary.kind, 'complete');
    assert.doesNotMatch(result.primary.description, /All current modules have evidence/);
    assert.match(result.primary.description, /selected path/);
});