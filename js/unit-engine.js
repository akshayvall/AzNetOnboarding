const UnitEngine = {
    current: null,
    catalog() { return typeof ACADEMY_UNITS === 'undefined' ? {} : ACADEMY_UNITS; },
    units(moduleId) { return this.catalog()[moduleId] || []; },
    key(moduleId, unit) { return `unit-${moduleId}--${unit.id}`; },
    unitStatus(moduleId, unit, progress) {
        const key = this.key(moduleId, unit);
        return {
            read: progress.moduleMastery?.[key]?.contentReviewed === true,
            practiced: progress.practiceChecks?.[`${key}-try`]?.passed === true,
            checked: progress.practiceChecks?.[`${key}-check`]?.passed === true,
            explained: typeof progress.notes?.[`${key}-explanation`] === 'string' && progress.notes[`${key}-explanation`].trim().length > 0
        };
    },
    resumeRoute(modules, progress, state, catalog = this.catalog()) {
        const savedModule = modules.find(module => module.id === state.lastModuleId);
        const savedUnit = catalog[savedModule?.id]?.find(unit => unit.id === state.lastUnitByModule?.[savedModule.id]);
        if (savedUnit) return {
            moduleId: savedModule.id, unitId: savedUnit.id,
            tab: ['learn', 'try', 'check', 'reference', 'diagrams', 'interactive', 'quiz', 'lab'].includes(state.lastTabByModule?.[savedModule.id])
                ? state.lastTabByModule[savedModule.id] : 'learn'
        };
        for (const module of modules) {
            const unit = (catalog[module.id] || []).find(item => !this.unitStatus(module.id, item, progress).checked);
            if (unit) return { moduleId: module.id, unitId: unit.id, tab: 'learn' };
        }
        return { destination: 'visual-lab' };
    },
    init() {
        document.addEventListener('click', event => {
            const control = event.target.closest('[data-unit-action]');
            if (!control || control.disabled || !app.currentModule || !this.current) return;
            if (control.dataset.unitAction === 'pick') app.loadModule(app.currentModule.id, { unitId: control.dataset.unitId });
            if (control.dataset.unitAction === 'try') this.checkActivity();
            if (control.dataset.unitAction === 'check') this.checkUnderstanding();
            if (control.dataset.unitAction === 'explain') this.saveExplanation();
            if (control.dataset.unitAction === 'next') this.next();
        });
        document.addEventListener('input', event => {
            if (event.target.id !== 'unitExplanation' || !app.currentModule || !this.current) return;
            const progress = ProgressManager.getProgress();
            progress.notes[`${this.key(app.currentModule.id, this.current)}-draft`] = event.target.value.slice(0, 4000);
            ProgressManager.saveProgress(progress);
            const feedback = document.getElementById('unitExplanationStatus');
            feedback.textContent = ProgressManager.getStorageStatus().saved ? 'Draft saved on this browser.' : 'Draft is not saved. Keep this page open and use Retry saving or export a backup.';
        });
    },
    render(module, requestedId) {
        const units = this.units(module.id);
        if (!units.length) return false;
        const saved = UIStateManager.get().lastUnitByModule[module.id];
        this.current = units.find(unit => unit.id === (requestedId || saved)) || units[0];
        const unit = this.current;
        const escape = value => LearningEngine.escapeHtml(value);
        const index = units.indexOf(unit);
        const progress = ProgressManager.getProgress();
        const status = this.unitStatus(module.id, unit, progress);
        const key = this.key(module.id, unit);
        document.getElementById('moduleView').classList.add('unit-managed');
        document.getElementById('moduleSectionProgress').textContent = `Unit ${index + 1} of ${units.length} · about ${unit.minutes} min`;
        document.getElementById('unitHeading').innerHTML = `<h2 id="unitTitle" tabindex="-1">${escape(unit.title)}</h2>
            <details class="unit-picker"><summary>Unit ${index + 1} of ${units.length} · about ${unit.minutes} min · View units</summary><ol>${units.map((item, i) =>
                `<li><button type="button" data-unit-action="pick" data-unit-id="${escape(item.id)}"${item.id === unit.id ? ' aria-current="step"' : ''}>${i + 1}. ${escape(item.title)}${this.unitStatus(module.id, item, progress).checked ? ' — checked' : ''}</button></li>`).join('')}</ol></details>`;
        document.getElementById('tab-learn').innerHTML = `<article class="unit-lesson">
            <p class="unit-outcome">${escape(unit.outcome)}</p>
            <aside class="unit-example"><h3>${escape(unit.example.title)}</h3><p>${escape(unit.example.text)}</p></aside>
            <section id="unitVisual" aria-label="The idea at a glance"></section>
            <section class="unit-detail"><h3>Why it works this way</h3>${unit.paragraphs.map(text => `<p>${escape(text)}</p>`).join('')}</section>
            <p class="unit-takeaway"><strong>Keep this idea:</strong> ${escape(unit.takeaway)}</p>
            <button id="doneReadingInline" class="btn-primary" type="button" data-app-action="complete-module">${status.read ? 'Reading saved · Try it again' : 'Got the idea · Try it'}</button>
            <p class="learning-meta">Time is a guide, not a deadline. The full reference and optional lab stay available below.</p>
        </article>`;
        const definition = { id: `unit-${module.id}-${unit.id}`, type: unit.diagram.type, title: unit.title, description: unit.outcome, scenario: unit.diagram.scenario };
        DiagramEngine.cleanup();
        DiagramEngine.render([definition]);
        DiagramEngine.renderPreview({ ...definition, compact: true }, document.getElementById('unitVisual'));
        document.getElementById('tab-try').innerHTML = `<section class="unit-activity">
            <h2>Change one thing</h2><p>Use the visual above, then predict the result.</p>
            ${this.questionHtml(unit.activity, 'unit-activity')}
            <button type="button" class="btn-secondary" data-unit-action="try">Compare my prediction</button>
            <p id="unitActivityFeedback" class="unit-feedback" role="status"></p>
        </section>`;
        document.getElementById('quickCheckHost').innerHTML = `<section id="beginnerCheck" class="unit-check">
            <h2>Can you explain what happens?</h2><p>Two checks, then an explanation in your own words. No quiz or mastery credit.</p>
            ${unit.checks.map((question, i) => this.questionHtml(question, `beginner-check-${i}`)).join('')}
            <button type="button" class="btn-primary" data-unit-action="check">Check my understanding</button>
            <div id="beginnerCheckFeedback" class="unit-feedback" role="status"></div>
            <section class="unit-explanation"><h3>Say it in your own words</h3>
                <label for="unitExplanation">${escape(unit.teachBack.prompt)}</label>
                <textarea id="unitExplanation" rows="3" maxlength="4000" placeholder="A few plain-language sentences are enough.">${escape(progress.notes[`${key}-draft`] ?? progress.notes[`${key}-explanation`] ?? '')}</textarea>
                <details><summary>Compare with an example explanation</summary><p>${escape(unit.teachBack.example)}</p><p>This is an illustration, not an automatic grade of your answer.</p></details>
                <button type="button" class="btn-secondary" data-unit-action="explain">Save my explanation</button>
                <p id="unitExplanationStatus" class="unit-feedback" role="status">${status.explained ? 'Your self-explanation is saved. It is not an independent skill assessment.' : ''}</p>
            </section>
            <div id="unitContinue"${status.checked ? '' : ' hidden'}><p>You have checked this idea. Stop here or move to the next small unit.</p>
                <button type="button" class="btn-primary" data-unit-action="next">${index < units.length - 1 ? 'Next unit' : 'Next module'}</button></div>
        </section>`;
        if (status.checked) document.getElementById('beginnerCheckFeedback').textContent = 'You previously passed these two checks. Try them again without looking.';
        return true;
    },
    questionHtml(question, name) {
        const escape = value => LearningEngine.escapeHtml(value);
        return `<fieldset class="unit-question"><legend>${escape(question.question || question.prompt)}</legend>${question.options.map((option, i) =>
            `<label class="learning-choice"><input type="radio" name="${name}" value="${i}"><span>${escape(option)}</span></label>`).join('')}
            <p id="${name}-feedback" class="unit-feedback" role="status" aria-live="polite"></p></fieldset>`;
    },
    storageOk() {
        const status = ProgressManager.getStorageStatus();
        if (status.saved && !status.recoveryRequired) return true;
        LearningEngine.renderStorageStatus();
        app.showToast('Your work is not saved. Retry saving or export a backup before leaving.', 'error');
        return false;
    },
    finishReading(module) {
        if (!BeginnerEngine.saveReading(this.key(module.id, this.current))) return;
        const progress = ProgressManager.getProgress();
        if (this.units(module.id).every(unit => this.unitStatus(module.id, unit, progress).read)) {
            if (!BeginnerEngine.saveReading(module.id)) return;
        }
        app.switchTab('try');
        app.updateProgress();
    },
    checkActivity() {
        const activity = this.current.activity;
        const choice = document.querySelector('input[name="unit-activity"]:checked');
        const feedback = document.getElementById('unitActivityFeedback');
        if (!choice) { feedback.textContent = 'Choose a prediction first.'; return; }
        const passed = Number(choice.value) === activity.correct;
        ProgressManager.savePracticeResult(`${this.key(app.currentModule.id, this.current)}-try`, passed);
        feedback.textContent = `${passed ? 'Yes.' : 'Not quite.'} ${activity.explanation}`;
        this.storageOk();
    },
    checkUnderstanding() {
        const choices = this.current.checks.map((_, i) => document.querySelector(`input[name="beginner-check-${i}"]:checked`));
        const feedback = document.getElementById('beginnerCheckFeedback');
        if (choices.some(choice => !choice)) { feedback.textContent = 'Choose an answer for both questions, then try again.'; return; }
        let correct = 0;
        this.current.checks.forEach((question, i) => {
            const passed = Number(choices[i].value) === question.correct;
            correct += Number(passed);
            document.getElementById(`beginner-check-${i}-feedback`).textContent = `${passed ? 'Correct.' : 'Try this reasoning.'} ${question.explanation}`;
        });
        const passed = correct === this.current.checks.length;
        ProgressManager.savePracticeResult(`${this.key(app.currentModule.id, this.current)}-check`, passed);
        const saved = this.storageOk();
        feedback.textContent = `${correct} of ${choices.length} correct. ${passed ? 'Now try putting the idea into your own words.' : 'Read the feedback beside each question and try again.'}${saved ? '' : ' This attempt is not saved yet.'}`;
        document.getElementById('unitContinue').hidden = !passed || !saved;
        app.updateProgress();
    },
    saveExplanation() {
        const text = document.getElementById('unitExplanation').value.trim();
        const feedback = document.getElementById('unitExplanationStatus');
        if (!text) { feedback.textContent = 'Write your explanation first. It can be short.'; return; }
        const progress = ProgressManager.getProgress();
        progress.notes[`${this.key(app.currentModule.id, this.current)}-explanation`] = text.slice(0, 4000);
        ProgressManager.saveProgress(progress);
        if (this.storageOk()) feedback.textContent = 'Your self-explanation is saved. Revisit it without the example tomorrow; this is not an independent skill assessment.';
    },
    next() {
        const units = this.units(app.currentModule.id);
        const nextUnit = units[units.indexOf(this.current) + 1];
        if (nextUnit) app.loadModule(app.currentModule.id, { unitId: nextUnit.id });
        else {
            const nextModule = MODULES[MODULES.indexOf(app.currentModule) + 1];
            if (nextModule) app.loadModule(nextModule.id, { unitId: this.units(nextModule.id)[0]?.id });
            else app.showDashboard();
        }
    },
    progressHtml(modules, progress) {
        const escape = value => LearningEngine.escapeHtml(value);
        const rows = modules.flatMap(module => this.units(module.id).map(unit => ({ module, unit, status: this.unitStatus(module.id, unit, progress) })));
        const counts = Object.fromEntries(['read', 'practiced', 'checked', 'explained'].map(key => [key, rows.filter(row => row.status[key]).length]));
        const starters = BeginnerEngine.lessons.filter(lesson => progress.moduleMastery?.[lesson.id]?.contentReviewed).length;
        return `<section class="unit-progress"><h2>Your learning so far</h2>
            <p>${starters} of 3 starter lessons read. ${counts.checked} of ${rows.length} short units checked.</p>
            <dl class="unit-counts"><div><dt>Read</dt><dd>${counts.read}</dd></div><div><dt>Prediction correct</dt><dd>${counts.practiced}</dd></div><div><dt>Checks passed</dt><dd>${counts.checked}</dd></div><div><dt>Self-explained</dt><dd>${counts.explained}</dd></div></dl>
            <p>These are learning activities, not proof of mastery. Try explaining a familiar request tomorrow without opening the example.</p>
            <a class="btn-primary" href="#today">Continue learning</a>
            <details class="unit-records"><summary>See unit-by-unit progress</summary><ol>${rows.map(({ module, unit, status }) =>
                `<li><a href="${escape(LearningEngine.formatRoute({ moduleId: module.id, unitId: unit.id }))}">${escape(module.title)}: ${escape(unit.title)}</a><small>${status.checked ? 'Checks passed' : status.read ? 'Read; checks still to do' : 'Not read yet'}${status.explained ? ' · self-explanation saved' : ''}</small></li>`).join('')}</ol></details>
        </section>`;
    }
};
if (typeof module !== 'undefined' && module.exports) module.exports = UnitEngine;
