const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

function loadQuizEngine() {
    const context = { console };
    vm.createContext(context);
    const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'quiz-engine.js'), 'utf8');
    vm.runInContext(`${source}\n;globalThis.__quizEngine = QuizEngine;`, context);
    return context.__quizEngine;
}

test('80 percent fails when the critical question is missed', () => {
    const engine = loadQuizEngine();
    engine.questions = [
        { question: 'Critical', options: ['A', 'B'], correct: 0, critical: true },
        ...Array.from({ length: 4 }, (_, index) => ({ question: `Q${index}`, options: ['A', 'B'], correct: 0 }))
    ];
    engine.answers = [1, 0, 0, 0, 0];

    const result = engine.calculateResult();

    assert.equal(result.pct, 80);
    assert.equal(result.criticalMisses, 1);
    assert.equal(result.passed, false);
});

test('80 percent passes when the default first critical question is correct', () => {
    const engine = loadQuizEngine();
    engine.questions = Array.from({ length: 5 }, (_, index) => ({
        question: `Q${index}`,
        options: ['A', 'B'],
        correct: 0
    }));
    engine.answers = [0, 1, 0, 0, 0];

    const result = engine.calculateResult();

    assert.equal(result.pct, 80);
    assert.equal(result.criticalMisses, 0);
    assert.equal(result.passed, true);
});
