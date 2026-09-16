const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

function loadQuizEngine(globals = {}) {
    const context = { console, ...globals };
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

test('80 percent passes without an implicit first critical question', () => {
    const engine = loadQuizEngine();
    engine.questions = Array.from({ length: 5 }, (_, index) => ({
        question: `Q${index}`,
        options: ['A', 'B'],
        correct: 0
    }));
    engine.answers = [1, 0, 0, 0, 0];

    const result = engine.calculateResult();

    assert.equal(result.pct, 80);
    assert.equal(result.criticalMisses, 0);
    assert.equal(result.passed, true);
});

function originalQuestions(count = 5, optionCount = 4) {
    return Object.freeze(Array.from({ length: count }, (_, questionIndex) => Object.freeze({
        question: `Question ${questionIndex}`,
        options: Object.freeze(Array.from({ length: optionCount }, (_, optionIndex) => `Answer ${questionIndex}:${optionIndex}`)),
        correct: 0,
        explanation: `Explanation ${questionIndex}`
    })));
}

test('preparation is pure and keeps stable question and option identities across attempts', () => {
    const engine = loadQuizEngine();
    const originals = originalQuestions();
    const before = JSON.stringify(originals);
    const first = engine.prepareQuestions('module-a', originals);
    assert.equal(new Set(first.map(question => question.id)).size, originals.length);
    assert.deepEqual(JSON.parse(JSON.stringify(first)), JSON.parse(JSON.stringify(engine.prepareQuestions('module-a', originals))));

    for (let attempt = 1; attempt < 12; attempt++) {
        const prepared = engine.prepareQuestions('module-a', originals, attempt);
        prepared.forEach(question => {
            const previous = first.find(candidate => candidate.id === question.id);
            const original = originals.find(candidate => candidate.question === question.question);
            assert.ok(previous);
            assert.equal(question.question, previous.question);
            assert.equal(question.explanation, original.explanation);
            assert.equal(question.options[question.correct], original.options[original.correct]);
            assert.equal(new Set(question.optionIds).size, question.options.length);
            question.optionIds.forEach((optionId, optionIndex) => {
                assert.equal(question.options[optionIndex], previous.options[previous.optionIds.indexOf(optionId)]);
            });
        });
    }
    const second = engine.prepareQuestions('module-a', originals, 1);
    assert.notDeepEqual(Array.from(first, question => question.id), Array.from(second, question => question.id));
    assert.notDeepEqual(Array.from(first[0].optionIds), Array.from(second.find(question => question.id === first[0].id).optionIds));
    assert.equal(JSON.stringify(originals), before);
});

test('authored critical indexes are applied to originals before question reordering', () => {
    const engine = loadQuizEngine({ LEARNING_CONTENT: { modules: { policy: { criticalQuestions: [2, 4] } } } });
    const originals = originalQuestions();
    for (let attempt = 0; attempt < 8; attempt++) {
        const questions = engine.prepareQuestions('policy', originals, attempt);
        assert.deepEqual(Array.from(questions.filter(question => question.critical), question => question.question).sort(), ['Question 2', 'Question 4']);
    }
});

test('standalone preparation uses explicit critical tags only', () => {
    const engine = loadQuizEngine();
    const originals = originalQuestions();
    assert.ok(engine.prepareQuestions('standalone', originals).every(question => question.critical !== true));
    const tagged = originals.map((question, questionIndex) => ({ ...question, critical: questionIndex === 3 }));
    assert.deepEqual(Array.from(engine.prepareQuestions('standalone', tagged, 2).filter(question => question.critical), question => question.question), ['Question 3']);
});

test('no fixed single-choice position reaches 80 percent on quizzes with at least three questions', () => {
    const engine = loadQuizEngine();
    for (let count = 3; count <= 12; count++) {
        for (let optionCount = 2; optionCount <= 6; optionCount++) {
            for (let attempt = 0; attempt < 8; attempt++) {
                const prepared = engine.prepareQuestions(`balanced-${count}`, originalQuestions(count, optionCount), attempt);
                for (let optionIndex = 0; optionIndex < optionCount; optionIndex++) {
                    const correct = prepared.filter(question => question.correct === optionIndex).length;
                    assert.ok(correct / count < 0.8, `${count} questions, ${optionCount} options, attempt ${attempt}, position ${optionIndex}`);
                }
            }
        }
    }
});

test('multi-select preparation remaps every correct option without changing its text', () => {
    const engine = loadQuizEngine();
    const originals = [{ question: 'Select two', options: ['One', 'Two', 'Three', 'Four'], correct: [0, 2], type: 'multi-select', explanation: 'One and Three' }];
    for (let attempt = 0; attempt < 8; attempt++) {
        const [question] = engine.prepareQuestions('multi', originals, attempt);
        assert.deepEqual(Array.from(question.correct, answerIndex => question.options[answerIndex]).sort(), ['One', 'Three']);
        assert.equal(question.explanation, 'One and Three');
        engine.questions = [question];
        engine.answers = [Array.from(question.correct).reverse()];
        assert.equal(engine.calculateResult().passed, true);
        engine.answers = [[question.correct[0]]];
        assert.equal(engine.calculateResult().passed, false);
    }
});

function createQuizHarness(progressOverrides = {}, globals = {}) {
    const listeners = {};
    const nodes = new Map();
    const calls = { scores: [], reviews: [], updates: 0 };
    let markup = '';
    let inputs = [];
    const createNode = (dataset = {}) => ({
        dataset,
        isConnected: true,
        focus() { document.activeElement = this; },
        closest(selector) {
            if (selector === '[data-option-index]' && this.dataset.optionIndex !== undefined) return this;
            if (selector === '[data-quiz-action]' && this.dataset.quizAction) return this;
            return null;
        },
        click() {
            if (this.disabled) return;
            const wasChecked = this.checked;
            this.checked = this.type === 'checkbox' ? !wasChecked : true;
            listeners.click?.({ target: this });
            if (this.checked !== wasChecked) listeners.change?.({ target: this });
        }
    });
    const container = {
        dataset: {},
        addEventListener(type, listener) { listeners[type] = listener; },
        get innerHTML() { return markup; },
        set innerHTML(value) {
            markup = value;
            for (const node of [...nodes.values(), ...inputs]) node.isConnected = false;
            nodes.clear();
            inputs = [];
            for (const match of value.matchAll(/<[a-z][a-z0-9]*\b([^>]*)>/gi)) {
                const attributes = match[1];
                const id = attributes.match(/\bid="([^"]+)"/);
                const option = attributes.match(/\bdata-option-index="(\d+)"/);
                if (id) nodes.set(id[1], createNode());
                if (option) inputs.push(Object.assign(createNode({ optionIndex: option[1] }), {
                    checked: /\bchecked\b/.test(attributes),
                    disabled: /\bdisabled\b/.test(attributes),
                    type: attributes.match(/\btype="([^"]+)"/)?.[1]
                }));
            }
        },
        querySelector(selector) {
            if (selector.startsWith('#')) return nodes.get(selector.slice(1)) || null;
            const option = selector.match(/^\[data-option-index="(\d+)"\]$/);
            return option ? inputs.find(input => input.dataset.optionIndex === option[1]) : null;
        }
    };
    const document = {
        activeElement: null,
        getElementById(id) { return id === 'tab-quiz' ? container : nodes.get(id) || null; },
        createElement() {
            return {
                textContent: '',
                get innerHTML() { return String(this.textContent).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
            };
        }
    };
    const engine = loadQuizEngine({
        document,
        app: { updateProgress() { calls.updates++; } },
        ProgressManager: {
            isReviewDue() { return false; },
            saveQuizScore(...values) { calls.scores.push(values); return {}; },
            recordReview(...values) { calls.reviews.push(values); return {}; },
            getStorageStatus() { return { saved: true, message: '', recoveryRequired: false }; },
            ...progressOverrides
        },
        ...globals
    });
    return { engine, container, document, calls, listeners, createNode };
}

test('init prepares fresh attempts, captures due status, and retakes from original questions', () => {
    let due = true;
    const harness = createQuizHarness({ isReviewDue: () => due }, { LEARNING_CONTENT: { modules: { policy: { criticalQuestions: [2] } } } });
    const originals = originalQuestions();
    harness.engine.init('policy', originals);
    assert.equal(harness.engine.isReviewAttempt, true);
    assert.equal(harness.engine.originalQuestions, originals);
    const firstOrder = Array.from(harness.engine.questions, question => question.id);
    due = false;
    for (let attempt = 1; attempt < 8; attempt++) {
        harness.listeners.click({ target: harness.createNode({ quizAction: 'retake-quiz' }) });
        assert.equal(harness.engine.isReviewAttempt, false);
        assert.deepEqual(Array.from(harness.engine.questions.filter(question => question.critical), question => question.question), ['Question 2']);
        assert.equal(harness.engine.originalQuestions, originals);
    }
    assert.notDeepEqual(Array.from(harness.engine.questions, question => question.id), firstOrder);
});

test('init works without a progress manager in a standalone context', () => {
    const { engine } = createQuizHarness({}, { ProgressManager: undefined });
    engine.init('standalone', originalQuestions());
    assert.equal(engine.isReviewAttempt, false);
});

test('native change selects once, keeps option focus, and leaves Space and arrows to the browser', () => {
    const harness = createQuizHarness();
    harness.engine.init('keyboard', originalQuestions());
    const input = harness.container.querySelector('[data-option-index="1"]');
    input.focus();
    harness.listeners.click({ target: input });
    assert.equal(harness.engine.answers[0], null);
    for (const key of [' ', 'ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight']) {
        harness.listeners.keydown({ target: input, key, preventDefault() { assert.fail(`Native ${key} was intercepted`); } });
        assert.equal(harness.engine.answers[0], null);
    }
    input.checked = true;
    assert.equal(typeof harness.listeners.change, 'function');
    harness.listeners.change({ target: input });
    assert.equal(harness.engine.answers[0], 1);
    assert.equal(harness.document.activeElement, harness.container.querySelector('[data-option-index="1"]'));
    assert.equal(harness.document.activeElement.isConnected, true);
});

test('Enter toggles a native multi-select checkbox once and preserves full-set correctness', () => {
    const harness = createQuizHarness();
    harness.engine.init('multi', [{ question: 'Select two', options: ['One', 'Two', 'Three'], correct: [0, 2], type: 'multi-select', explanation: 'Two required' }]);
    const correct = Array.from(harness.engine.questions[0].correct);
    for (const optionIndex of correct) {
        const input = harness.container.querySelector(`[data-option-index="${optionIndex}"]`);
        assert.equal(input.type, 'checkbox');
        input.focus();
        harness.listeners.keydown({ target: input, key: 'Enter', preventDefault() {} });
        assert.equal(harness.document.activeElement, harness.container.querySelector(`[data-option-index="${optionIndex}"]`));
    }
    assert.equal(harness.engine.isQuestionCorrect(0), true);
    const input = harness.container.querySelector(`[data-option-index="${correct[0]}"]`);
    input.click();
    assert.equal(harness.engine.isQuestionCorrect(0), false);
    assert.equal(harness.engine.answers[0].length, 1);
});

test('question jumps reveal correctness only after Check Answer', () => {
    const { engine, container } = createQuizHarness();
    engine.init('feedback', originalQuestions());
    engine.selectOption(engine.questions[0].correct);
    engine.nextQuestion();
    const pending = container.innerHTML.match(/<button[^>]*data-question-index="0"[^>]*>/)[0];
    assert.doesNotMatch(pending, /var\(--success\)|var\(--error\)/);
    engine.prevQuestion();
    engine.submitAnswer();
    engine.nextQuestion();
    const submitted = container.innerHTML.match(/<button[^>]*data-question-index="0"[^>]*>/)[0];
    assert.match(submitted, /var\(--success\)/);
});

test('navigation, explanation, and results move focus deliberately and expose live status', () => {
    const { engine, container, document } = createQuizHarness();
    engine.init('focus', originalQuestions());
    for (const navigate of [() => engine.nextQuestion(), () => engine.prevQuestion(), () => engine.goToQuestion(3)]) {
        navigate();
        assert.ok(document.activeElement);
        assert.equal(document.activeElement, container.querySelector('#quizQuestionHeading'));
        assert.match(container.innerHTML, /id="quizQuestionHeading"[^>]*tabindex="-1"/);
    }
    engine.selectOption(engine.questions[3].correct);
    engine.submitAnswer();
    assert.equal(document.activeElement, container.querySelector('#quizExplanation'));
    assert.match(container.innerHTML, /aria-live="polite"/);
    engine.showResults();
    assert.equal(document.activeElement, container.querySelector('#quizResultsHeading'));
    assert.match(container.innerHTML, /id="quizResultsHeading"[^>]*tabindex="-1"/);
    assert.match(container.innerHTML, /role="status"/);
});

for (const passed of [false, true]) {
    test(`a due ${passed ? 'passed' : 'failed'} result is recorded only once`, () => {
        const { engine, calls } = createQuizHarness({ isReviewDue: () => true });
        engine.init('review', originalQuestions());
        engine.answers = engine.questions.map(question => passed ? question.correct : (question.correct + 1) % question.options.length);
        engine.showResults();
        engine.showResults();
        assert.equal(calls.scores.length, 1);
        assert.deepEqual(calls.reviews, [['review', passed]]);
        assert.equal(calls.updates, 1);
    });
}

test('an early attempt cannot gain review credit by becoming due during the quiz', () => {
    let due = false;
    const { engine, calls } = createQuizHarness({ isReviewDue: () => due });
    engine.init('early', originalQuestions());
    due = true;
    engine.answers = engine.questions.map(question => question.correct);
    engine.showResults();
    assert.equal(calls.reviews.length, 0);
});

test('a review rejected by the progress guard does not claim durable credit', () => {
    const { engine, container } = createQuizHarness({ isReviewDue: () => true, recordReview: () => false });
    engine.init('duplicate', originalQuestions());
    engine.answers = engine.questions.map(question => question.correct);
    engine.showResults();
    assert.doesNotMatch(container.innerHTML, /Review attempt recorded|durable credit earned/i);
});

test('a failed storage write is not presented as a persisted result', () => {
    const { engine, container, calls } = createQuizHarness({
        isReviewDue: () => true,
        getStorageStatus: () => ({ saved: false, message: 'Not saved: <quota>. Export a backup.', recoveryRequired: true })
    });
    engine.init('unsaved', originalQuestions());
    engine.answers = engine.questions.map(question => question.correct);
    engine.showResults();
    engine.showResults();
    assert.match(container.innerHTML, /Not saved: &lt;quota&gt;\. Export a backup\./);
    assert.doesNotMatch(container.innerHTML, /Quiz result saved|Review attempt recorded/);
    assert.equal(calls.scores.length, 1);
    assert.equal(calls.reviews.length, 1);
});

test('critical failure feedback identifies the actual authored question', () => {
    const { engine, container } = createQuizHarness({}, { LEARNING_CONTENT: { modules: { critical: { criticalQuestions: [2] } } } });
    engine.init('critical', originalQuestions());
    engine.answers = engine.questions.map(question => question.question === 'Question 2' ? (question.correct + 1) % question.options.length : question.correct);
    engine.showResults();
    assert.match(container.innerHTML, /Review critical questions:[^<]*Question 2/);
    assert.doesNotMatch(container.innerHTML, /first critical concept/);
});
