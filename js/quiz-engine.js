/* ============================================
   QUIZ ENGINE — Handles quiz rendering & scoring
   ============================================ */

const QuizEngine = {
    currentQuiz: null,
    currentQuestion: 0,
    answers: [],
    
    init(moduleId, questions) {
        this.currentQuiz = moduleId;
        this.currentQuestion = 0;
        this.answers = new Array(questions.length).fill(null);
        this.questions = questions;
        this.submitted = new Set();
        this.render();
    },

    render() {
        const container = document.getElementById('tab-quiz');
        if (!this.questions || this.questions.length === 0) {
            container.innerHTML = '<p>No quiz available for this module yet.</p>';
            return;
        }

        const q = this.questions[this.currentQuestion];
        const totalQ = this.questions.length;
        const answered = this.answers.filter(a => a !== null).length;
        const isMulti = q.type === 'multi-select' || Array.isArray(q.correct);
        const typeBadge = q.type === 'scenario'
            ? '<span class="quiz-type-badge scenario" title="Scenario-based question">🎯 Scenario</span>'
            : isMulti
                ? '<span class="quiz-type-badge multi" title="Select all that apply">☑ Select all that apply</span>'
                : '';
        const current = this.answers[this.currentQuestion];
        const selectedSet = isMulti ? new Set(Array.isArray(current) ? current : []) : null;

        container.innerHTML = `
            <div class="quiz-container fade-in">
                <div class="quiz-header">
                    <span class="quiz-question-counter">Question ${this.currentQuestion + 1} of ${totalQ}</span>
                    <span class="quiz-score">${answered} answered</span>
                </div>
                
                <div class="quiz-question">
                    <h3>${this.currentQuestion + 1}. ${typeBadge} ${this.escapeHtml(q.question)}</h3>
                    <div class="quiz-options">
                        ${q.options.map((opt, i) => `
                            <div class="quiz-option ${this.getOptionClass(i)}" 
                                 onclick="QuizEngine.selectOption(${i})"
                                 data-index="${i}">
                                <input type="${isMulti ? 'checkbox' : 'radio'}" name="q${this.currentQuestion}" 
                                       ${isMulti ? (selectedSet.has(i) ? 'checked' : '') : (current === i ? 'checked' : '')}
                                       ${this.isAnswered() ? 'disabled' : ''}>
                                <span>${this.escapeHtml(opt)}</span>
                            </div>
                        `).join('')}
                    </div>
                    <div class="quiz-explanation ${this.isAnswered() ? 'show' : ''}" id="quizExplanation">
                        ${this.isAnswered() ? this.getExplanationHtml() : ''}
                    </div>
                </div>

                <div class="quiz-actions">
                    <button class="btn-secondary" onclick="QuizEngine.prevQuestion()" 
                            ${this.currentQuestion === 0 ? 'disabled style="opacity:0.3"' : ''}>
                        ← Previous
                    </button>
                    ${!this.isAnswered() ? 
                        `<button class="btn-primary" onclick="QuizEngine.submitAnswer()" id="submitBtn"
                                 ${this.isAnswerReady() ? '' : 'disabled style="opacity:0.5"'}>
                            Check Answer
                        </button>` : ''}
                    ${this.currentQuestion < totalQ - 1 ?
                        `<button class="btn-primary" onclick="QuizEngine.nextQuestion()">
                            Next Question →
                        </button>` :
                        `<button class="btn-primary" onclick="QuizEngine.showResults()" 
                                 style="background:var(--success)">
                            See Results
                        </button>`
                    }
                </div>

                <div style="display:flex;gap:6px;margin-top:20px;flex-wrap:wrap;">
                    ${this.questions.map((_, i) => {
                        const ans = this.answers[i];
                        const isCorrect = ans !== null && this.isQuestionCorrect(i);
                        const style = i === this.currentQuestion ? 'background:var(--azure-blue);color:#fff;' :
                            ans !== null ? (isCorrect ? 'background:var(--success);color:#fff;' : 'background:var(--error);color:#fff;') :
                            'background:#eee;color:#666;';
                        return `<div onclick="QuizEngine.goToQuestion(${i})" style="width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;cursor:pointer;${style}">${i + 1}</div>`;
                    }).join('')}
                </div>
            </div>
        `;
    },

    selectOption(index) {
        if (this.isAnswered()) return;
        const q = this.questions[this.currentQuestion];
        const isMulti = q.type === 'multi-select' || Array.isArray(q.correct);
        if (isMulti) {
            const cur = Array.isArray(this.answers[this.currentQuestion]) ? this.answers[this.currentQuestion].slice() : [];
            const pos = cur.indexOf(index);
            if (pos >= 0) cur.splice(pos, 1); else cur.push(index);
            cur.sort((a, b) => a - b);
            this.answers[this.currentQuestion] = cur.length ? cur : null;
        } else {
            this.answers[this.currentQuestion] = index;
        }
        this.render();
    },

    isAnswerReady() {
        const ans = this.answers[this.currentQuestion];
        if (ans === null || ans === undefined) return false;
        if (Array.isArray(ans)) return ans.length > 0;
        return true;
    },

    isQuestionCorrect(i) {
        const q = this.questions[i];
        const ans = this.answers[i];
        if (ans === null || ans === undefined) return false;
        if (Array.isArray(q.correct)) {
            const a = Array.isArray(ans) ? ans.slice().sort() : [];
            const c = q.correct.slice().sort();
            return a.length === c.length && a.every((v, idx) => v === c[idx]);
        }
        return ans === q.correct;
    },

    submitAnswer() {
        if (!this.isAnswerReady()) return;
        // Mark as submitted by storing in a submitted array
        if (!this.submitted) this.submitted = new Set();
        this.submitted.add(this.currentQuestion);
        this.render();
    },

    isAnswered() {
        return this.submitted && this.submitted.has(this.currentQuestion);
    },

    getOptionClass(index) {
        const q = this.questions[this.currentQuestion];
        const ans = this.answers[this.currentQuestion];
        const isMulti = q.type === 'multi-select' || Array.isArray(q.correct);
        const selected = isMulti ? (Array.isArray(ans) && ans.includes(index)) : ans === index;
        if (!this.isAnswered()) return selected ? 'selected' : '';
        const correctSet = isMulti ? new Set(Array.isArray(q.correct) ? q.correct : []) : null;
        if (isMulti) {
            if (correctSet.has(index) && selected) return 'correct';
            if (!correctSet.has(index) && selected) return 'incorrect';
            if (correctSet.has(index) && !selected) return 'correct-answer';
            return '';
        }
        if (index === q.correct) return 'correct';
        if (index === ans && index !== q.correct) return 'incorrect';
        return '';
    },

    getExplanationHtml() {
        const q = this.questions[this.currentQuestion];
        const isCorrect = this.isQuestionCorrect(this.currentQuestion);
        return `
            <strong style="color:${isCorrect ? 'var(--success)' : 'var(--error)'}">
                ${isCorrect ? '✓ Correct!' : '✗ Incorrect'}
            </strong>
            <p style="margin-top:8px">${q.explanation}</p>
        `;
    },

    prevQuestion() {
        if (this.currentQuestion > 0) {
            this.currentQuestion--;
            this.render();
        }
    },

    nextQuestion() {
        if (this.currentQuestion < this.questions.length - 1) {
            this.currentQuestion++;
            this.render();
        }
    },

    goToQuestion(index) {
        this.currentQuestion = index;
        this.render();
    },

    showResults() {
        const container = document.getElementById('tab-quiz');
        const total = this.questions.length;
        const correct = this.questions.reduce((count, q, i) => {
            return count + (this.isQuestionCorrect(i) ? 1 : 0);
        }, 0);
        const pct = Math.round((correct / total) * 100);
        const passed = pct >= 70;

        // Save score
        ProgressManager.saveQuizScore(this.currentQuiz, correct, total);

        container.innerHTML = `
            <div class="quiz-results fade-in">
                <h2>${passed ? '🎉 Quiz Passed!' : '📝 Keep Studying'}</h2>
                <div class="score-display ${passed ? 'passed' : 'failed'}">${pct}%</div>
                <p>${correct} out of ${total} correct</p>
                <p style="color:var(--text-secondary);margin:12px 0">
                    ${passed ? 'Great job! You\'ve demonstrated solid understanding of this topic.' : 
                    'You need 70% to pass. Review the material and try again.'}
                </p>
                <div style="display:flex;gap:12px;justify-content:center;margin-top:20px">
                    <button class="btn-secondary" onclick="QuizEngine.init('${this.currentQuiz}', QuizEngine.questions)">
                        ↺ Retake Quiz
                    </button>
                    <button class="btn-primary" onclick="app.switchTab('learn')">
                        📖 Review Material
                    </button>
                </div>

                <div style="margin-top:32px;text-align:left">
                    <h3 style="margin-bottom:16px">Question Review:</h3>
                    ${this.questions.map((q, i) => {
                        const ok = this.isQuestionCorrect(i);
                        const correctLabel = Array.isArray(q.correct)
                            ? q.correct.map(ci => q.options[ci]).join(' + ')
                            : q.options[q.correct];
                        return `<div style="padding:12px;margin-bottom:8px;border-radius:8px;background:${ok ? '#e6f9e6' : '#fde7e9'}">
                            <strong>${i + 1}. ${ok ? '✓' : '✗'}</strong> 
                            ${this.escapeHtml(q.question).substring(0, 100)}...
                            ${!ok ? `<br><small style="color:var(--success)">Correct: ${this.escapeHtml(correctLabel)}</small>` : ''}
                        </div>`;
                    }).join('')}
                </div>
            </div>
        `;

        app.updateProgress();
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};
