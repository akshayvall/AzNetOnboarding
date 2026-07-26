const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

function loadEngine() {
    const context = {};
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
