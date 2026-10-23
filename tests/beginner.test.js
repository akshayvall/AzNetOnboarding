const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const BeginnerEngine = require('../js/beginner.js');
const LearningEngine = require('../js/learning-engine.js');

test('Level 0 contains three offline lessons, qualified analogies, and teachbacks', () => {
    assert.equal(BeginnerEngine.lessons.length, 3);
    assert.equal(new Set(BeginnerEngine.lessons.map(lesson => lesson.id)).size, 3);
    for (const lesson of BeginnerEngine.lessons) {
        for (const field of ['story', 'concept', 'limit', 'exercise', 'answer', 'afd']) assert.ok(lesson[field].length > 40);
        assert.equal(lesson.steps.length, 4);
        assert.ok(lesson.options[lesson.correct]);
    }
});

test('all existing modules have a plain-language opening and a three-question practice check', () => {
    const context = {};
    vm.createContext(context);
    for (const file of ['modules-100.js', 'modules-200.js', 'modules-300.js', 'modules-extras.js']) {
        vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', file), 'utf8'), context);
    }
    const modules = vm.runInContext('[...MODULES_100, ...MODULES_200, ...MODULES_300, ...MODULES_EXTRAS]', context);
    assert.equal(Object.keys(BeginnerEngine.openings).length, modules.length);
    for (const module of modules) {
        assert.ok(BeginnerEngine.openings[module.id].length > 60, module.id);
        assert.equal(BeginnerEngine.checkQuestions(module).length, 3, module.id);
    }
});

test('starter lesson deep links roundtrip and reject out-of-range indexes', () => {
    assert.equal(LearningEngine.formatRoute(LearningEngine.parseRoute('#start?lesson=2')), '#start?lesson=2');
    for (const value of ['-1', '30', '<script>', '1.5']) assert.equal(LearningEngine.parseRoute(`#start?lesson=${value}`).lesson, 0);
});
