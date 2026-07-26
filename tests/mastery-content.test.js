const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

function loadCurriculum() {
    const jsDir = path.join(__dirname, '..', 'js');
    const files = ['modules-100.js', 'modules-200.js', 'modules-300.js', 'modules-extras.js', 'mastery-content.js'];
    const context = {};
    vm.createContext(context);
    const source = files.map(file => fs.readFileSync(path.join(jsDir, file), 'utf8')).join('\n');
    vm.runInContext(`${source}\n;globalThis.__result = { modules: [...MODULES_100, ...MODULES_200, ...MODULES_300, ...MODULES_EXTRAS], mastery: ACADEMY_MASTERY };`, context);
    return context.__result;
}

test('networking diagnostic has ten scored questions', () => {
    const { mastery } = loadCurriculum();
    assert.equal(mastery.diagnostic.questions.length, 10);
    mastery.diagnostic.questions.forEach(question => {
        assert.equal(question.options.length, 4);
        assert.ok(Number.isInteger(question.correct));
        assert.ok(question.moduleId);
    });
});

test('every networking module has outcomes, prerequisites, transfer, and rubric metadata', () => {
    const { modules, mastery } = loadCurriculum();

    assert.equal(modules.length, 21);
    modules.forEach(module => {
        const metadata = mastery.modules[module.id];
        assert.ok(metadata, `Missing mastery metadata for ${module.id}`);
        assert.ok(metadata.outcome.length >= 20, `Outcome too short for ${module.id}`);
        assert.ok(Array.isArray(metadata.prerequisites), `Prerequisites missing for ${module.id}`);
        assert.ok(metadata.transfer.prompt.length >= 40, `Transfer prompt too short for ${module.id}`);
        assert.equal(metadata.transfer.rubric.length, 4, `Rubric must have four criteria for ${module.id}`);
    });
});
