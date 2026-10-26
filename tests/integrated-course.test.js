const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');

const load = () => {
    assert.ok(fs.existsSync(path.join(root, 'js/course-curriculum.js')), 'The integrated curriculum is missing');
    const context = vm.createContext({});
    for (const file of ['modules-100', 'modules-200', 'modules-300', 'modules-extras', 'unit-content', 'guided-course',
        'diagram-models', 'diagram-afd', 'diagrams', 'course-cases', 'course-depth', 'course-curriculum', 'course-visuals']) {
        vm.runInContext(fs.readFileSync(path.join(root, `js/${file}.js`), 'utf8'), context);
    }
    return vm.runInContext(`({
        curriculum: CourseCurriculum, progress: CourseProgress, visuals: CourseVisuals,
        modules: [...MODULES_100, ...MODULES_200, ...MODULES_300, ...MODULES_EXTRAS],
        units: ACADEMY_UNITS, starters: GuidedCourse,
        lessons: CourseCurriculum.build([...MODULES_100, ...MODULES_200, ...MODULES_300, ...MODULES_EXTRAS], ACADEMY_UNITS, GuidedCourse)
    })`, context);
};

test('full modules are primary and the previous short course remains accessible', () => {
    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    const archive = fs.readFileSync(path.join(root, 'guided.html'), 'utf8');
    assert.match(html, /class="module-academy"/);
    assert.match(html, /js\/module-academy\.js/);
    assert.match(html, /class="module-tabs"/);
    assert.match(archive, /js\/course-app\.js/);
    assert.doesNotMatch(html, /class="lesson-steps"/);
});

test('every existing module and durable unit appears exactly once in prerequisite order', () => {
    const { lessons, modules, units, curriculum } = load();
    assert.equal(modules.length, 21);
    assert.equal(new Set(lessons.map(l => l.id)).size, lessons.length);
    for (const m of modules) {
        for (const u of units[m.id]) assert.equal(lessons.filter(l => l.id === `${m.id}--${u.id}`).length, 1);
    }
    const position = id => lessons.findIndex(l => l.moduleId === id);
    assert.ok(position('azure-ip-addressing') < position('azure-vnets'));
    assert.ok(position('peering-endpoints') < position('frontdoor-advanced'));
    assert.ok(position('azure-firewall') < position('network-architecture'));
    assert.ok(position('network-watcher') < position('az104-practice'));
    for (const stage of curriculum.stages.filter(s => s.level)) {
        assert.equal(lessons.filter(l => l.level === stage.level && l.checkpoint).length, 1);
    }
    assert.ok(lessons.filter(l => l.moduleId === 'net-fundamentals').length > 3, 'Do not force every module into three units');
});

test('progress preserves legacy evidence without promoting old reading to new completion', () => {
    const { lessons, progress } = load();
    const original = { notes: { old: 'keep' }, practiceChecks: {}, completedModules: ['net-fundamentals'], quizScores: { old: { score: 2, total: 3 } }, lastVisited: 'frontdoor-waf' };
    assert.equal(progress.next(lessons, original).id, 'request');
    let p = original;
    for (const l of lessons) {
        p = progress.record(p, l, { answers: l.checks.map(q => q.correct), checked: true });
        assert.equal(progress.status(p, l).completed, true);
    }
    assert.equal(progress.next(lessons, p), null);
    assert.deepEqual(original.notes, { old: 'keep' });
    assert.deepEqual(p.completedModules, original.completedModules);
    assert.deepEqual(p.quizScores, original.quizScores);
    assert.equal(p.lastVisited, original.lastVisited);
    p = progress.record(p, lessons[0], { answers: [99], checked: true });
    assert.equal(progress.status(p, lessons[0]).completed, true, 'Review does not erase previous completion');
});

test('answers, draft, condition and reading section survive serialization; invalid answers cannot pass', () => {
    const { lessons, progress } = load();
    const lesson = lessons.find(l => l.level === 300 && !l.checkpoint);
    let p = progress.record({ notes: {}, practiceChecks: {} }, lesson, { answers: [99], checked: true, draft: '<script>kept as text</script>', variant: 1, section: 'practice' });
    let state = progress.status(JSON.parse(JSON.stringify(p)), lesson);
    assert.equal(state.completed, false);
    assert.equal(state.section, 'practice');
    assert.equal(state.variant, 1);
    assert.equal(state.draft, '<script>kept as text</script>');
    p.notes[`course-v2:${lesson.id}:answers`] = '{invalid';
    assert.equal(progress.status(p, lesson).answers.length, 0);
});

test('all lesson visuals render complete endpoints in every authored condition', () => {
    const { lessons, visuals } = load();
    for (const lesson of lessons.filter(l => !l.starter && !l.checkpoint)) {
        const variants = visuals.variants(lesson);
        assert.ok(variants.length >= 1);
        for (let index = 0; index < variants.length; index++) {
            const html = visuals.render(lesson, index);
            assert.ok(html.length > 100, lesson.id);
            assert.doesNotMatch(html, /undefined|NaN|data-diagram-action|Scroll with arrow keys/, lesson.id);
        }
    }
    const osi = lessons.find(l => l.id.endsWith('--layers-after-the-request'));
    assert.match(visuals.render(osi, 0), /concept-stack/);
    assert.doesNotMatch(visuals.render(osi, 0), /Arrows show direction/);
});

test('advanced checkpoints use evidence, plausible choices and a self-explanation rubric', () => {
    const { lessons } = load();
    for (const lesson of lessons.filter(l => l.checkpoint)) {
        assert.ok(lesson.evidence.length >= 3);
        assert.ok(lesson.checks.length >= 3);
        assert.ok(lesson.checks.every(q => q.options.length >= 3 && q.explanation.length > 40));
        assert.ok(lesson.rubric.length >= 3);
    }
});

test('private DNS and subnet lessons do not borrow a whole advanced capstone diagram', () => {
    const { lessons, visuals } = load();
    const dns = lessons.find(l => l.unitId === 'private-dns-needs-a-resolution-path');
    const addresses = lessons.find(l => l.unitId === 'count-usable-subnet-space');
    assert.match(visuals.render(dns), /DNS resolver/);
    assert.doesNotMatch(visuals.render(dns), /Front Door|Firewall/);
    assert.match(visuals.render(addresses), /address-partitions/);
});

test('earlier pilot answers and reading sections survive integration, not only completion', () => {
    const { lessons, progress } = load();
    const p = { notes: { 'guided-v1:address:answer': '0', 'guided-v1:address:section': 'experiment', 'guided-v1:address:variant': '1' }, practiceChecks: {} };
    const state = progress.status(p, lessons.find(l => l.id === 'address'));
    assert.equal(state.answers[0], 0);
    assert.equal(state.section, 'practice');
    assert.equal(state.variant, 1);
});

test('service configuration and operations are taught inside the course, not only in reference', () => {
    const { lessons } = load();
    for (const id of ['http-ports-and-transport', 'service-tags-and-asgs', 'dns-records-and-forwarding',
        'profiles-endpoints-and-routes', 'rule-order-and-overrides', 'cache-headers-and-compression',
        'waf-rule-types-and-rate-limits', 'choose-time-series-evidence']) {
        const lesson = lessons.find(l => l.unitId === id);
        assert.ok(lesson, `Missing in-course depth: ${id}`);
        assert.ok(lesson.visualTable && lesson.checks.length >= 2 && lesson.paragraphs.length >= 2);
    }
});
