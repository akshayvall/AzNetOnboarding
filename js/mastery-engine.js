/* Shared mastery logic and UI for diagnostics, evidence, transfer, and review. */
const MasteryEngine = {
    STATE_RANK: Object.freeze({ not_started: 0, learned: 1, practiced: 2, demonstrated: 3, durable: 4 }),
    STATE_LABELS: Object.freeze({
        not_started: 'Not started',
        learned: 'Learned',
        practiced: 'Practiced',
        demonstrated: 'Demonstrated',
        durable: 'Durable'
    }),
    modules: [],

    escapeHtml(value) {
        const characters = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
        return String(value ?? '').replace(/[&<>"']/g, character => characters[character]);
    },

    init(modules) {
        this.modules = modules;
        if (!document.body.dataset.masteryBound) {
            document.body.dataset.masteryBound = 'true';
            document.addEventListener('click', event => {
                const control = event.target.closest('[data-mastery-action]');
                if (!control) return;
                const action = control.dataset.masteryAction;
                if (action === 'open-diagnostic') this.openDiagnostic();
                if (action === 'close-diagnostic') this.closeDiagnostic();
                if (action === 'submit-diagnostic') this.submitDiagnostic();
                if (action === 'go-module') this.goToModule(control.dataset.moduleId);
                if (action === 'submit-transfer') this.submitTransfer(control.dataset.moduleId);
            });
        }
        this.renderDashboard(modules);
    },

    getRealModules(modules, mastery) {
        const activityIds = new Set((mastery && mastery.activityIds) || []);
        return modules.filter(module => !activityIds.has(module.id));
    },

    isActivity(moduleId, mastery = ACADEMY_MASTERY) {
        return (mastery.activityIds || []).includes(moduleId);
    },

    getMetadata(moduleId, mastery = ACADEMY_MASTERY) {
        return mastery.modules[moduleId] || null;
    },

    getRequirements(module, metadata) {
        return {
            quiz: Boolean(module && Array.isArray(module.quiz) && module.quiz.length),
            lab: Boolean(module && module.lab),
            transfer: Boolean(metadata && metadata.transfer)
        };
    },

    evaluateDiagnostic(questions, answers) {
        let score = 0;
        let recommendedModuleId = null;
        questions.forEach((question, index) => {
            const correct = answers[index] === question.correct;
            if (correct) score += 1;
            else if (!recommendedModuleId) recommendedModuleId = question.moduleId;
        });
        return {
            score,
            total: questions.length,
            recommendedModuleId: recommendedModuleId || questions[questions.length - 1]?.moduleId || null,
            answers: answers.slice()
        };
    },

    evaluateRubric(scores, reflection) {
        const validScores = Array.isArray(scores) && scores.length === 4 &&
            scores.every(score => Number.isFinite(score) && score >= 0 && score <= 4);
        const average = validScores ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
        const meaningfulReflection = String(reflection || '').trim().length >= 20;
        return { average, passed: validScores && average >= 3 && meaningfulReflection, meaningfulReflection };
    },

    getStatus(module) {
        const metadata = this.getMetadata(module.id);
        return ProgressManager.getMasteryStatus(module.id, this.getRequirements(module, metadata));
    },

    getStateCounts(modules = this.modules) {
        const counts = { not_started: 0, learned: 0, practiced: 0, demonstrated: 0, durable: 0 };
        this.getRealModules(modules, ACADEMY_MASTERY).forEach(module => {
            counts[this.getStatus(module).state] += 1;
        });
        return counts;
    },

    renderDashboard(modules = this.modules) {
        const container = document.getElementById('masteryDashboard');
        if (!container) return;
        const progress = ProgressManager.getProgress();
        const realModules = this.getRealModules(modules, ACADEMY_MASTERY);
        const dueIds = ProgressManager.getDueReviews();
        const counts = this.getStateCounts(modules);
        const diagnostic = progress.diagnostic;
        const recommended = diagnostic ? modules.find(module => module.id === diagnostic.recommendedModuleId) : null;
        const dueModules = dueIds.map(id => modules.find(module => module.id === id)).filter(Boolean);

        container.innerHTML = `
            <div class="mastery-dashboard-head">
                <div>
                    <p class="mastery-eyebrow">Your learning route</p>
                    <h2>Build evidence, not checkmarks</h2>
                </div>
                <button type="button" class="btn-primary" data-mastery-action="open-diagnostic">${diagnostic ? 'Retake diagnostic' : 'Take diagnostic'}</button>
            </div>
            <div class="mastery-summary-grid" aria-label="Mastery summary">
                <div><strong>${realModules.length}</strong><span>real modules</span></div>
                <div><strong>${counts.practiced + counts.demonstrated + counts.durable}</strong><span>practiced</span></div>
                <div><strong>${counts.demonstrated + counts.durable}</strong><span>demonstrated</span></div>
                <div><strong>${dueModules.length}</strong><span>reviews due</span></div>
            </div>
            <div class="mastery-route-grid">
                <section class="mastery-route-card" aria-labelledby="diagnostic-route-title">
                    <h3 id="diagnostic-route-title">Recommended start</h3>
                    ${recommended ? `
                        <p><strong>${this.escapeHtml(recommended.title)}</strong></p>
                        <p>Your diagnostic score was ${diagnostic.score}/${diagnostic.total}. Start at the first missed competency, then move forward.</p>
                        <button type="button" class="btn-secondary" data-mastery-action="go-module" data-module-id="${this.escapeHtml(recommended.id)}">Open recommendation</button>
                    ` : '<p>Take the ten-question diagnostic to find the earliest competency worth practicing.</p>'}
                </section>
                <section class="mastery-route-card" aria-labelledby="review-queue-title">
                    <h3 id="review-queue-title">Review queue</h3>
                    ${dueModules.length ? dueModules.map(module => `
                        <button type="button" class="review-queue-item" data-mastery-action="go-module" data-module-id="${this.escapeHtml(module.id)}">
                            <span>${this.escapeHtml(module.title)}</span><span>Review now</span>
                        </button>`).join('') : '<p>No reviews are due. Demonstrated modules enter the 1, 3, 7, 21, and 60-day review cycle.</p>'}
                </section>
            </div>`;
    },

    renderModulePanel(module) {
        const container = document.getElementById('masteryPanel');
        if (!container) return;
        const metadata = this.getMetadata(module.id);
        if (!metadata) {
            container.hidden = true;
            return;
        }
        container.hidden = false;
        const status = this.getStatus(module);
        const entry = status.entry;
        const requirementRows = [
            ['Learned', status.quizPassed, 'Pass the retrieval check at 80% with no critical miss'],
            ['Practiced', status.labPassed, module.lab ? 'Complete and verify the required lab' : 'No lab required'],
            ['Demonstrated', status.transferPassed, 'Pass the independent transfer rubric at 3/4'],
            ['Durable', entry.review.successfulReviews >= 4, 'Pass reviews through the 21-day interval']
        ];
        const transfer = metadata.transfer;
        const savedScores = entry.transfer && Array.isArray(entry.transfer.scores) ? entry.transfer.scores : [];
        const savedReflection = entry.transfer ? entry.transfer.reflection : '';
        container.innerHTML = `
            <div class="mastery-panel-head">
                <div>
                    <p class="mastery-eyebrow">Observable outcome</p>
                    <h2>${this.escapeHtml(metadata.outcome)}</h2>
                </div>
                <span class="mastery-state mastery-state-${status.state}">${this.escapeHtml(this.STATE_LABELS[status.state])}</span>
            </div>
            ${metadata.prerequisites.length ? `<p class="mastery-prereqs"><strong>Prerequisites:</strong> ${metadata.prerequisites.map(id => this.escapeHtml(this.modules.find(item => item.id === id)?.title || id)).join(' · ')}</p>` : ''}
            <div class="mastery-evidence-grid">
                ${requirementRows.map(([label, complete, description]) => `
                    <div class="mastery-evidence ${complete ? 'is-complete' : ''}">
                        <span aria-hidden="true">${complete ? '✓' : '○'}</span>
                        <div><strong>${label}</strong><small>${this.escapeHtml(description)}</small></div>
                    </div>`).join('')}
            </div>
            <details class="transfer-challenge" ${status.state === 'practiced' ? 'open' : ''}>
                <summary>Independent transfer challenge</summary>
                <p>${this.escapeHtml(transfer.prompt)}</p>
                <p><strong>Artifact:</strong> <code>${this.escapeHtml(transfer.artifact)}</code></p>
                <div class="transfer-rubric">
                    ${transfer.rubric.map((criterion, index) => `
                        <label>
                            <span><strong>${this.escapeHtml(criterion.label)}</strong><small>${this.escapeHtml(criterion.description)}</small></span>
                            <select id="transfer-score-${index}" aria-label="Score ${this.escapeHtml(criterion.label)} from zero to four">
                                <option value="">Score</option>
                                ${[0, 1, 2, 3, 4].map(score => `<option value="${score}" ${savedScores[index] === score ? 'selected' : ''}>${score}/4</option>`).join('')}
                            </select>
                        </label>`).join('')}
                </div>
                <label class="transfer-reflection-label" for="transfer-reflection">Evidence and explanation</label>
                <textarea id="transfer-reflection" rows="5" maxlength="4000" placeholder="Link or name the artifact, summarize the test evidence, and explain the main tradeoff.">${this.escapeHtml(savedReflection)}</textarea>
                <div class="transfer-actions">
                    <button type="button" class="btn-primary" data-mastery-action="submit-transfer" data-module-id="${this.escapeHtml(module.id)}">Evaluate evidence</button>
                    <span id="transfer-feedback" role="status" aria-live="polite"></span>
                </div>
            </details>`;
    },

    submitTransfer(moduleId) {
        const module = this.modules.find(item => item.id === moduleId);
        const feedback = document.getElementById('transfer-feedback');
        if (!module || !feedback) return;
        const scores = [0, 1, 2, 3].map(index => Number(document.getElementById(`transfer-score-${index}`)?.value));
        const reflection = document.getElementById('transfer-reflection')?.value || '';
        const result = this.evaluateRubric(scores, reflection);
        if (!result.passed) {
            feedback.textContent = 'Score all four criteria. The average must be at least 3/4 and the evidence note must explain the work.';
            return;
        }
        ProgressManager.saveTransferResult(moduleId, result.average, 4, reflection, scores);
        feedback.textContent = 'Transfer evidence recorded. This module is now Demonstrated.';
        this.renderModulePanel(module);
        this.renderDashboard(this.modules);
        if (typeof app !== 'undefined') app.updateProgress();
    },

    openDiagnostic() {
        const dialog = document.getElementById('diagnosticDialog');
        const form = document.getElementById('diagnosticForm');
        if (!dialog || !form) return;
        form.innerHTML = ACADEMY_MASTERY.diagnostic.questions.map((question, index) => `
            <fieldset>
                <legend>${index + 1}. ${this.escapeHtml(question.question)}</legend>
                ${question.options.map((option, optionIndex) => `
                    <label><input type="radio" name="diagnostic-${index}" value="${optionIndex}"> <span>${this.escapeHtml(option)}</span></label>`).join('')}
            </fieldset>`).join('');
        document.getElementById('diagnosticFeedback').textContent = '';
        if (typeof dialog.showModal === 'function') dialog.showModal();
        else dialog.setAttribute('open', '');
    },

    closeDiagnostic() {
        const dialog = document.getElementById('diagnosticDialog');
        if (!dialog) return;
        if (typeof dialog.close === 'function') dialog.close();
        else dialog.removeAttribute('open');
    },

    submitDiagnostic() {
        const questions = ACADEMY_MASTERY.diagnostic.questions;
        const answers = questions.map((_, index) => {
            const selected = document.querySelector(`input[name="diagnostic-${index}"]:checked`);
            return selected ? Number(selected.value) : null;
        });
        const feedback = document.getElementById('diagnosticFeedback');
        if (answers.some(answer => answer === null)) {
            feedback.textContent = 'Answer all ten questions before submitting.';
            return;
        }
        const result = this.evaluateDiagnostic(questions, answers);
        ProgressManager.saveDiagnosticResult(result.recommendedModuleId, result.score, result.total, answers);
        this.closeDiagnostic();
        this.renderDashboard(this.modules);
        const module = this.modules.find(item => item.id === result.recommendedModuleId);
        if (typeof app !== 'undefined') app.showToast(`Recommended start: ${module ? module.title : result.recommendedModuleId}`, 'success');
    },

    goToModule(moduleId) {
        this.closeDiagnostic();
        if (typeof app !== 'undefined') {
            app.loadModule(moduleId);
            const module = this.modules.find(item => item.id === moduleId);
            if (module && ProgressManager.isReviewDue(moduleId)) app.switchTab('quiz');
        }
    }
};
