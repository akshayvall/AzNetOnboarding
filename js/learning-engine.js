const LearningEngine = {
    DESTINATIONS: ['today', 'learn', 'practice', 'build', 'more', 'start', 'visual-lab'],
    TABS: ['learn', 'try', 'check', 'reference', 'diagrams', 'interactive', 'quiz', 'lab'],

    escapeHtml(value) {
        const characters = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
        return String(value ?? '').replace(/[&<>"']/g, character => characters[character]);
    },

    parseRoute(hash) {
        const [target, query = ''] = String(hash || '').replace(/^#/, '').split('?');
        const params = new URLSearchParams(query);
        const destination = this.DESTINATIONS.includes(target) ? target : target ? null : 'today';
        return {
            destination,
            moduleId: destination ? null : /^[A-Za-z0-9_-]+$/.test(target) ? target : null,
            tab: this.TABS.includes(params.get('tab')) ? params.get('tab') : 'learn',
            unitId: /^[a-z0-9-]+$/.test(params.get('unit') || '') ? params.get('unit') : null,
            sectionId: /^[A-Za-z0-9_-]+$/.test(params.get('section') || '') ? params.get('section') : null,
            mode: params.get('mode') === 'browse' ? 'browse' : 'guided',
            query: (params.get('query') || '').slice(0, 160),
            level: ['100', '200', '300', '400'].includes(params.get('level')) ? params.get('level') : '',
            state: ['not_started', 'learned', 'practiced', 'demonstrated', 'durable'].includes(params.get('state')) ? params.get('state') : '',
            pathOnly: params.get('path') === 'selected',
            lesson: /^[0-2]$/.test(params.get('lesson') || '') ? Number(params.get('lesson')) : 0,
            finished: params.get('finished') === '1'
        };
    },

    formatRoute(route) {
        const params = new URLSearchParams();
        if (route.moduleId) {
            if (route.unitId) params.set('unit', route.unitId);
            if (route.tab && route.tab !== 'learn') params.set('tab', route.tab);
            if (route.sectionId) params.set('section', route.sectionId);
            if (route.mode === 'browse') params.set('mode', 'browse');
        } else {
            if (route.destination === 'start') params.set('lesson', route.lesson || 0);
            if (route.destination === 'start' && route.finished) params.set('finished', '1');
            if (route.query) params.set('query', route.query);
            if (route.level) params.set('level', route.level);
            if (route.state) params.set('state', route.state);
            if (route.pathOnly) params.set('path', 'selected');
        }
        const target = route.moduleId || route.destination || 'today';
        return `#${target}${params.size ? `?${params}` : ''}`;
    },

    selectModules(modules, progress, statuses, options = {}) {
        const now = new Date(options.now || Date.now()).getTime();
        const query = String(options.query || '').toLowerCase().trim();
        const due = module => {
            const entry = progress.moduleMastery?.[module.id];
            return Boolean(entry?.transfer && entry.transfer.score / entry.transfer.max >= 0.75 &&
                entry.review?.nextDue && new Date(entry.review.nextDue).getTime() <= now);
        };
        const weak = module => Boolean(progress.moduleMastery?.[module.id]?.quiz && statuses[module.id]?.missing?.includes('quiz')) || progress.practiceChecks?.[module.id]?.passed === false;
        const active = module => (progress.labSteps?.[module.id] || []).some(Boolean);
        const entries = modules.filter(module => {
            if (options.pathIds && !options.pathIds.includes(module.id)) return false;
            if (options.level && String(module.level) !== options.level) return false;
            if (options.state && statuses[module.id]?.state !== options.state) return false;
            if (query && !`${module.title} ${module.subtitle || ''} ${module.id}`.toLowerCase().includes(query)) return false;
            if (options.destination === 'build') return !['demonstrated', 'durable'].includes(statuses[module.id]?.state);
            return true;
        });
        if (options.destination === 'practice') entries.sort((left, right) => Number(due(right)) - Number(due(left)) || Number(weak(right)) - Number(weak(left)));
        if (options.destination === 'build') entries.sort((left, right) => Number(active(right)) - Number(active(left)));
        return entries;
    },

    STATE_LABELS: { not_started: 'Not started', learned: 'Learned', practiced: 'Practiced', demonstrated: 'Demonstrated', durable: 'Durable' },
    RUBRIC_LABELS: ['Technical correctness', 'Verification evidence', 'Tradeoff judgment', 'Clear explanation'],
    DRAFT_FIELDS: { artifactEvidence: 'artifact', 'transfer-reflection': 'reflection' },
    modules: [],

    init(modules) {
        this.modules = modules;
        this._pendingDrafts ||= new Map();
        this._draftErrors ||= new Set();
        if (this._boundDocument === document) return;
        this._boundDocument = document;
        document.addEventListener('click', event => {
            const control = event.target?.closest?.('[data-learning-action]');
            if (!control || control.disabled) return;
            event.preventDefault();
            this.handleAction(control.dataset.learningAction, control.dataset.moduleId);
        });
        document.addEventListener('submit', event => {
            if (event.target.id !== 'catalogFilters') return;
            event.preventDefault();
            app.navigateDestination('learn', {
                query: (document.getElementById('catalogQuery')?.value || '').trim().slice(0, 160),
                level: document.getElementById('catalogLevel')?.value || '',
                state: document.getElementById('catalogState')?.value || '',
                pathOnly: document.getElementById('catalogPathOnly')?.checked === true
            });
        });
        document.addEventListener('input', event => this.trackDraft(event.target));
        document.addEventListener('change', event => {
            if (['learningPath', 'sessionMinutes'].includes(event.target.id)) this.savePreferences();
            if (Object.hasOwn(this.DRAFT_FIELDS, event.target.id)) {
                const moduleId = this.trackDraft(event.target);
                if (moduleId) this.saveDrafts(moduleId);
            }
        });
        document.addEventListener('academy-storage-change', () => this.renderStorageStatus());
        window.addEventListener('beforeunload', event => {
            if (!this.hasUnsavedChanges()) return;
            event.preventDefault();
            event.returnValue = '';
        });
        this.renderStorageStatus();
    },

    getContent() {
        return typeof LEARNING_CONTENT === 'undefined' ? { modules: {}, paths: [] } : LEARNING_CONTENT;
    },

    getUIState() {
        try { return UIStateManager.get(this.modules.map(module => module.id)); }
        catch { return { drafts: {} }; }
    },

    getStorageStatus() {
        try {
            const status = ProgressManager.getStorageStatus();
            return { saved: status.saved === true, message: String(status.message || ''), recoveryRequired: status.recoveryRequired === true };
        } catch {
            return { saved: false, message: 'Storage is unavailable. Keep this page open and export a backup.', recoveryRequired: false };
        }
    },

    getContext(route = {}) {
        const activityIds = typeof ACADEMY_MASTERY === 'undefined' ? [] : ACADEMY_MASTERY.activityIds || [];
        const progress = ProgressManager.getProgress();
        const statuses = Object.fromEntries(this.modules.filter(module => !activityIds.includes(module.id)).map(module => [module.id, MasteryEngine.getStatus(module)]));
        return { modules: this.modules, progress, statuses, activityIds, content: this.getContent(), preferences: this.getUIState(), route };
    },

    renderDestination(destination, route = {}) {
        const container = document.getElementById('destinationView');
        if (container && destination === 'start') {
            if (route.finished) BeginnerEngine.renderStarterComplete();
            else BeginnerEngine.renderStarter(route.lesson);
            return true;
        }
        if (container && destination === 'visual-lab') {
            DiagramLab.render(container);
            return true;
        }
        if (!container || !['learn', 'practice', 'build', 'more'].includes(destination)) return false;
        container.innerHTML = this.renderDestinationHtml(destination, this.getContext(route));
        if (destination === 'more') this.renderPreferences();
        return true;
    },

    renderPreferences() {
        const container = document.getElementById('learningPreferences');
        if (!container) return false;
        const paths = this.getContent().paths || [];
        const preferences = this._pendingPreferences || this.getUIState();
        const activePath = paths.some(path => path.id === preferences.activePath) ? preferences.activePath : paths[0]?.id;
        container.innerHTML = `<div class="learning-surface learning-preferences"><h2 id="learningPreferencesTitle">Catalog preferences</h2>
            <p>Choose which modules the optional lesson catalog shows when you select its Selected path filter. This does not change the beginner learning sequence.</p>
            <div class="learning-preference-fields"><div class="learning-field"><label for="learningPath">Catalog path</label>
                <select id="learningPath">${paths.map(path => `<option value="${this.escapeHtml(path.id)}" ${path.id === activePath ? 'selected' : ''}>${this.escapeHtml(path.title)}</option>`).join('')}</select></div></div>
            <p id="learningPreferencesFeedback" class="learning-feedback" role="status" aria-live="polite"></p></div>`;
        return true;
    },

    savePreferences(preferences) {
        const selected = preferences || { activePath: document.getElementById('learningPath')?.value, sessionMinutes: (this._pendingPreferences || this.getUIState()).sessionMinutes };
        if (!this.getContent().paths.some(path => path.id === selected.activePath) || ![10, 25, 60].includes(selected.sessionMinutes)) return false;
        this._pendingPreferences = selected;
        try {
            const result = UIStateManager.setPreferences(selected);
            const stored = this.getUIState();
            if (result !== false && stored.activePath === selected.activePath && stored.sessionMinutes === selected.sessionMinutes) this._pendingPreferences = null;
        } catch {}
        const saved = this._pendingPreferences === null;
        this.setFeedback('learningPreferencesFeedback', saved ? 'Preferences saved' : 'Preferences are not saved. Retry saving before leaving.', !saved);
        this.renderStorageStatus();
        if (saved) MasteryEngine.renderDashboard(this.modules);
        return saved;
    },

    renderCoaching(module) {
        this.currentModuleId = module.id;
        const container = document.getElementById('coachingHost') || document.getElementById('tab-learn');
        const content = this.getContent().modules[module.id];
        if (!container || !content) return false;
        const existing = document.getElementById('moduleCoaching');
        if (existing?.dataset.moduleId === module.id) return true;
        existing?.remove();
        container.insertAdjacentHTML('beforeend', this.renderCoachingHtml(module, content));
        return true;
    },

    renderLabPracticeHtml(module, content = {}, draft = '') {
        const lab = content.lab;
        if (!lab) return '';
        const fields = [['Environment', lab.environment], ['Expected result', lab.expected], ['Failure case', lab.failure], ['Cost', lab.cost], ['Safety', lab.safety], ['Source status', lab.status]];
        return `<section id="localPractice" class="learning-surface learning-local-practice" data-module-id="${this.escapeHtml(module.id)}" aria-labelledby="learningCaseTitle">
            <h2 id="learningCaseTitle">Local case practice</h2><p class="learning-meta">Subscription-free case analysis. No external execution.</p>
            <dl class="learning-metadata">${fields.map(([label, value]) => `<dt>${label}</dt><dd>${this.escapeHtml(value)}</dd>`).join('')}</dl>
            <h3>Verification checks</h3>${this.renderTextList(lab.verify)}
            <h3>Cleanup plan</h3>${this.renderTextList(lab.cleanup)}
            <h3>Changed task</h3><p id="learningCasePrompt">${this.escapeHtml(content.transfer?.prompt)}</p>${this.renderTextList(content.transfer?.checks)}
            <label for="artifactEvidence">Your case analysis</label>
            <p id="artifactEvidenceHelp" class="learning-meta">40-4,000 characters. Synthetic case only; no secrets or workplace data.</p>
            <textarea id="artifactEvidence" rows="8" minlength="40" maxlength="4000" aria-describedby="learningCasePrompt artifactEvidenceHelp artifactFeedback">${this.escapeHtml(String(draft).slice(0, 4000))}</textarea>
            <div class="learning-actions"><button type="button" class="learning-action" data-learning-action="save-artifact-practice" data-module-id="${this.escapeHtml(module.id)}" aria-controls="artifactFeedback">Save practice</button>
                <button type="button" class="learning-action" data-learning-action="download-worksheet" data-module-id="${this.escapeHtml(module.id)}">Download worksheet</button></div>
            <p id="artifactFeedback" class="learning-feedback" role="status" aria-live="polite" aria-atomic="true"></p>
        </section>`;
    },

    renderLabPractice(module) {
        this.currentModuleId = module.id;
        const container = document.getElementById('tab-lab');
        const content = this.getContent().modules[module.id];
        if (!container || !content) return false;
        const existing = document.getElementById('localPractice');
        if (existing?.dataset.moduleId === module.id) return true;
        existing?.remove();
        const artifact = ProgressManager.getProgress().artifactPractice?.[module.id];
        const draft = this.getDraft(module.id);
        const evidence = Object.hasOwn(draft, 'artifact') ? draft.artifact : artifact?.evidence || '';
        container.insertAdjacentHTML('afterbegin', this.renderLabPracticeHtml(module, content, evidence));
        this.restoreDrafts(module.id);
        if (artifact && this.getStorageStatus().saved) this.setFeedback('artifactFeedback', `Self-attested case practice recorded ${this.formatDate(artifact.completedAt)} (UTC).`);
        return true;
    },

    setFeedback(id, message, failed = false) {
        const feedback = document.getElementById(id);
        if (!feedback) return;
        feedback.textContent = message;
        feedback.dataset.state = failed ? 'error' : 'success';
    },

    persistProgress(write) {
        let accepted = false;
        this._writingProgress = true;
        try { accepted = write() === true; } catch {}
        const status = this.getStorageStatus();
        const saved = accepted && status.saved && !status.recoveryRequired;
        this._progressWriteFailed = !saved;
        this._writingProgress = false;
        this.renderStorageStatus();
        return saved;
    },

    checkPrediction(moduleId) {
        if (moduleId !== this.currentModuleId || !this.modules.some(module => module.id === moduleId)) return false;
        const fieldset = document.getElementById('predictionOptions');
        if (!fieldset) return false;
        const choice = fieldset.querySelector('input[name="prediction-option"]:checked')?.value;
        const result = this.validatePrediction(this.getContent().modules[moduleId]?.prediction, choice);
        fieldset.setAttribute('aria-invalid', String(!result.valid));
        if (!result.valid) {
            this.setFeedback('predictionFeedback', result.message, true);
            fieldset.querySelector('input[name="prediction-option"]')?.focus();
            return false;
        }
        const saved = this.persistProgress(() => ProgressManager.savePracticeResult(moduleId, result.passed));
        this.setFeedback('predictionFeedback', `${result.message} ${saved ? 'Prediction check saved; no quiz credit.' : 'This prediction check is not saved. Retry saving or export progress before closing.'}`, !saved || !result.passed);
        if (saved) MasteryEngine.renderDashboard(this.modules);
        return saved;
    },

    saveArtifact(moduleId) {
        const module = this.modules.find(item => item.id === moduleId);
        const control = document.getElementById('artifactEvidence');
        if (!module || moduleId !== this.currentModuleId || !control) return false;
        const evidence = control.value.trim();
        const valid = evidence.length >= 40 && control.value.length <= 4000;
        control.setAttribute('aria-invalid', String(!valid));
        if (!valid) {
            this.setFeedback('artifactFeedback', 'Add a case analysis of 40-4,000 characters before saving.', true);
            control.focus();
            return false;
        }
        this.saveDrafts(moduleId);
        const saved = this.persistProgress(() => ProgressManager.saveArtifactPractice(moduleId, evidence));
        this.setFeedback('artifactFeedback', saved ? 'Self-attested case practice saved' : 'Your case practice is not saved. Retry saving or export progress before closing.', !saved);
        if (saved) {
            MasteryEngine.renderModulePanel(module);
            this.restoreDrafts(moduleId);
            app.updateProgress();
        }
        return saved;
    },

    getDraft(moduleId) {
        return { ...this.getUIState().drafts?.[moduleId], ...this._pendingDrafts?.get(moduleId) };
    },

    trackDraft(control) {
        if (!control || !Object.hasOwn(this.DRAFT_FIELDS, control.id)) return null;
        const moduleId = control.closest?.('[data-module-id]')?.dataset.moduleId || this.currentModuleId;
        if (!this.modules.some(module => module.id === moduleId)) return null;
        const draft = { ...this._pendingDrafts.get(moduleId), [this.DRAFT_FIELDS[control.id]]: String(control.value).slice(0, 4000) };
        this._pendingDrafts.set(moduleId, draft);
        return moduleId;
    },

    persistDraft(moduleId, draft) {
        this._pendingDrafts.set(moduleId, draft);
        let saved = false;
        try {
            const result = UIStateManager.saveDraft(moduleId, draft);
            const stored = this.getUIState().drafts?.[moduleId];
            saved = result !== false && Boolean(stored) && Object.entries(draft).every(([field, value]) => Object.hasOwn(stored, field) && stored[field] === value);
        } catch {}
        if (saved) {
            this._pendingDrafts.delete(moduleId);
            this._draftErrors.delete(moduleId);
        } else this._draftErrors.add(moduleId);
        return saved;
    },

    saveDrafts(moduleId) {
        if (!this.modules.some(module => module.id === moduleId)) return false;
        const draft = { ...this._pendingDrafts.get(moduleId) };
        if (!this.currentModuleId || moduleId === this.currentModuleId) {
            Object.entries(this.DRAFT_FIELDS).forEach(([id, field]) => {
                const control = document.getElementById(id);
                const owner = control?.closest?.('[data-module-id]')?.dataset.moduleId;
                if (control && (!owner || owner === moduleId)) draft[field] = String(control.value).slice(0, 4000);
            });
        }
        if (!Object.keys(draft).length) return true;
        const saved = this.persistDraft(moduleId, draft);
        this.renderStorageStatus();
        return saved;
    },

    restoreDrafts(moduleId) {
        if (!this.modules.some(module => module.id === moduleId)) return;
        this.currentModuleId = moduleId;
        const draft = this.getDraft(moduleId);
        Object.entries(this.DRAFT_FIELDS).forEach(([id, field]) => {
            const control = document.getElementById(id);
            const owner = control?.closest?.('[data-module-id]')?.dataset.moduleId;
            if (control && (!owner || owner === moduleId) && Object.hasOwn(draft, field) && typeof draft[field] === 'string') {
                const value = draft[field].slice(0, 4000);
                if (control.value !== value) control.value = value;
            }
        });
    },

    hasUnsavedChanges() {
        const status = this.getStorageStatus();
        return !status.saved || status.recoveryRequired || Boolean(this._progressWriteFailed || this._pendingDrafts?.size || this._pendingPreferences);
    },

    renderStorageStatus() {
        if (this._writingProgress) return false;
        const status = this.getStorageStatus();
        const notice = document.getElementById('storageNotice');
        const messages = [
            !status.saved || status.recoveryRequired ? status.message || 'Progress is not saved on this device. Retry or export a backup before closing.' : '',
            this._progressWriteFailed && status.saved ? 'A progress write did not complete. Retry saving before closing.' : '',
            this._draftErrors?.size ? 'Case or assessment drafts are not saved. Retry or download unsaved drafts before leaving.' : '',
            this._pendingPreferences ? 'Learning preferences are not saved on this device.' : '',
            this._downloadError || ''
        ].filter(Boolean);
        if (!notice) return messages.length === 0;
        if (!messages.length) {
            const restoreFocus = !notice.hidden && notice.contains(document.activeElement);
            notice.hidden = true;
            if (restoreFocus) {
                const target = document.querySelector('main .view.active h1, main .view.active h2');
                target?.setAttribute('tabindex', '-1');
                target?.focus();
            }
            return true;
        }
        const html = `<div class="storage-notice-body"><h2>Local save needs attention</h2>${messages.map(message => `<p>${this.escapeHtml(message)}</p>`).join('')}</div>
            <div class="learning-actions"><button type="button" class="learning-action" data-learning-action="retry-save">Retry saving</button>
                <button type="button" class="learning-action" data-learning-action="export-progress">Export progress backup</button>
                ${this._pendingDrafts?.size ? '<button type="button" class="learning-action" data-learning-action="export-drafts">Download unsaved drafts</button>' : ''}
                ${status.recoveryRequired ? '<button type="button" class="learning-action" data-learning-action="import-progress">Import progress backup</button>' : ''}</div>`;
        if (this._storageNotice !== notice || this._storageMarkup !== html) {
            const focusedAction = notice.contains(document.activeElement) ? document.activeElement?.dataset.learningAction : null;
            notice.innerHTML = html;
            this._storageNotice = notice;
            this._storageMarkup = html;
            if (focusedAction) notice.querySelector(`[data-learning-action="${focusedAction}"]`)?.focus();
        }
        notice.hidden = false;
        return false;
    },

    retrySave() {
        const progressSaved = this.persistProgress(() => ProgressManager.retrySave());
        for (const [moduleId, draft] of [...this._pendingDrafts]) this.persistDraft(moduleId, draft);
        if (this._pendingPreferences) this.savePreferences(this._pendingPreferences);
        this.renderStorageStatus();
        return progressSaved && !this._pendingDrafts.size && !this._pendingPreferences;
    },

    markdownText(value) {
        return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/([\\`*_{}\[\]()#!|+])/g, '\\$1');
    },

    createWorksheet(module, content = {}) {
        const text = value => this.markdownText(value);
        const list = items => (items || []).map(item => `- [ ] ${text(item)}`).join('\n');
        const lab = content.lab || {};
        return [`# ${text(module.title)}: case worksheet`, 'Subscription-free practice. This worksheet is not completion evidence.',
            '## Worked scenario', text(content.workedExample?.scenario), '## Prediction', text(content.prediction?.prompt), list(content.prediction?.options),
            '## Changed task', text(content.transfer?.prompt), list(content.transfer?.checks), '## Your case analysis', '',
            'Artifact reference:', 'Observation:', 'Expected versus observed result:', 'Tradeoff and remaining uncertainty:',
            '## Verification checks', list(lab.verify), '## Environment', text(lab.environment), '## Expected result', text(lab.expected), '## Failure case', text(lab.failure),
            '## Cost and safety', text(lab.cost), text(lab.safety), '## Cleanup plan', list(lab.cleanup), '## Source status', text(lab.status),
            'Execution: not verified by the academy.', '## Human assessment', 'Provenance: self-assessed / reviewer-assessed (reviewer identity is self-reported).',
            ...this.RUBRIC_LABELS.map(label => `${label} (0-4):`), 'Rationale:'
        ].join('\n\n');
    },

    createEvidenceReport(exported, modules = this.modules, content = this.getContent()) {
        const text = value => this.markdownText(value);
        const history = this.getEvidenceHistory(modules, exported);
        const records = history.map(item => [`## ${text(item.title)}: ${text(item.kind)}`, `Date: ${text(this.formatDate(item.date))} (UTC)`,
            `Result: ${text(item.result)}`, `Provenance: ${text(item.provenance)}`, item.note ? text(item.note) : ''].filter(Boolean).join('\n\n'));
        return ['# Learning evidence report', `Academy: ${text(exported.academyId)}`, `Exported: ${text(exported.exportedAt)}`,
            `Curriculum date: ${text(content.version || 'Not recorded')}`, 'Recorded local progress only. Human assessments and external lab completion are self-reported, not certification or verified cloud execution.',
            records.length ? records.join('\n\n') : 'No evidence recorded yet.'
        ].join('\n\n');
    },

    downloadMarkdown(filename, text) {
        const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = filename.replace(/[^A-Za-z0-9_.-]/g, '-');
        anchor.hidden = true;
        document.body.appendChild(anchor);
        try { anchor.click(); }
        finally { anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
    },

    handleAction(action, moduleId) {
        if (action === 'check-prediction') return this.checkPrediction(moduleId);
        if (action === 'save-artifact-practice') return this.saveArtifact(moduleId);
        if (action === 'retry-save') return this.retrySave();
        if (action === 'clear-filters') {
            app.navigateDestination('learn', { query: '', level: '', state: '', pathOnly: false });
            document.getElementById('catalogQuery')?.focus();
            return true;
        }
        try {
            if (action === 'export-progress') ProgressManager.exportProgress();
            else if (action === 'import-progress') {
                const button = document.getElementById('importProgress');
                if (!button) return false;
                button.click();
                return true;
            } else if (action === 'download-report') {
                const context = this.getContext();
                this.downloadMarkdown('learning-evidence.md', this.createEvidenceReport(ProgressManager.createExport(), context.modules.filter(module => !context.activityIds.includes(module.id)), context.content));
            } else if (action === 'download-worksheet') {
                const module = this.modules.find(item => item.id === moduleId);
                const content = this.getContent().modules[moduleId];
                if (!module || !content) return false;
                this.downloadMarkdown(`${moduleId}-worksheet.md`, this.createWorksheet(module, content));
            } else if (action === 'export-drafts') {
                const records = [...this._pendingDrafts].map(([id, draft]) => [`## ${this.markdownText(this.modules.find(module => module.id === id)?.title || id)}`,
                    ...Object.entries(draft).map(([field, value]) => `### ${field === 'artifact' ? 'Your case analysis' : 'Transfer reflection'}\n\n${this.markdownText(value)}`)].join('\n\n'));
                this.downloadMarkdown('learning-unsaved-drafts.md', ['# Unsubmitted drafts', 'These drafts are not practice or assessment evidence.', ...records].join('\n\n'));
            } else return false;
            this._downloadError = '';
            this.setFeedback('learningExportStatus', 'Download requested. Check your downloads.');
            this.renderStorageStatus();
            return true;
        } catch {
            this._downloadError = 'The download could not start. Keep this page open and try again.';
            this.setFeedback('learningExportStatus', this._downloadError, true);
            this.renderStorageStatus();
            return false;
        }
    },

    renderTextList(items = [], ordered = false) {
        const tag = ordered ? 'ol' : 'ul';
        return `<${tag}>${items.map(item => `<li>${this.escapeHtml(item)}</li>`).join('')}</${tag}>`;
    },

    validatePrediction(prediction, choice) {
        if (!Array.isArray(prediction?.options) || !Number.isInteger(prediction.correct) ||
            prediction.correct < 0 || prediction.correct >= prediction.options.length) {
            return { valid: false, message: 'This prediction is unavailable.' };
        }
        const index = typeof choice === 'number' || typeof choice === 'string' && /^(0|[1-9]\d*)$/.test(choice) ? Number(choice) : NaN;
        if (!Number.isInteger(index) || index < 0 || index >= prediction.options.length) {
            return { valid: false, message: 'Choose an answer before checking your prediction.' };
        }
        const passed = index === prediction.correct;
        return { valid: true, passed, message: `${passed ? 'Correct prediction.' : 'Revisit your prediction.'} ${prediction.options[prediction.correct]} ${prediction.explanation || ''}` };
    },

    renderCoachingHtml(module, content = {}) {
        const example = content.workedExample;
        if (!example) return '';
        const prediction = content.prediction;
        const transfer = content.transfer;
        const exemplar = content.exemplar;
        const moduleId = this.escapeHtml(module.id);
        return `<section id="moduleCoaching" class="learning-surface module-coaching" data-module-id="${moduleId}" aria-labelledby="learningWorkedTitle">
            <details id="optionalChallenge"><summary>Apply it: a worked case (optional)</summary>
            <h2 id="learningWorkedTitle">Worked case: ${this.escapeHtml(example.title)}</h2>
            <p>${this.escapeHtml(example.scenario)}</p>
            ${this.renderTextList(example.steps, true)}
            <details class="learning-disclosure"><summary>Worked result</summary><p>${this.escapeHtml(example.result)}</p></details>
            ${prediction ? `<section id="prediction-challenge" class="learning-block" aria-labelledby="learningPredictionTitle">
                <h2 id="learningPredictionTitle">Predict the result</h2>
                <fieldset id="predictionOptions" aria-describedby="predictionFeedback">
                    <legend>${this.escapeHtml(prediction.prompt)}</legend>
                    ${prediction.options.map((option, index) => `<label class="learning-choice" for="prediction-option-${index}"><input type="radio" id="prediction-option-${index}" name="prediction-option" value="${index}"><span>${this.escapeHtml(option)}</span></label>`).join('')}
                </fieldset>
                <button type="button" class="learning-action" data-learning-action="check-prediction" data-module-id="${moduleId}" aria-controls="predictionFeedback">Check prediction</button>
                <p id="predictionFeedback" class="learning-feedback" role="status" aria-live="polite" aria-atomic="true"></p>
            </section>` : ''}
            ${transfer ? `<section class="learning-block" aria-labelledby="learningTransferTitle">
                <h2 id="learningTransferTitle">Changed-task brief</h2>
                <p>${this.escapeHtml(transfer.prompt)}</p>${this.renderTextList(transfer.checks)}
                <div class="learning-actions">
                    <a class="learning-action" href="${this.escapeHtml(this.formatRoute({ moduleId: module.id, tab: 'lab' }))}">Write case analysis</a>
                    <button type="button" class="learning-action" data-learning-action="download-worksheet" data-module-id="${moduleId}">Download worksheet</button>
                    <a class="learning-action" href="${this.escapeHtml(this.formatRoute({ moduleId: module.id, sectionId: 'transfer-evidence' }))}">Record transfer assessment</a>
                </div>
            </section>` : ''}
            ${exemplar ? `<details class="learning-disclosure learning-exemplar"><summary>Illustrative example, not your evidence</summary>
                <h3>${this.escapeHtml(exemplar.artifact)}</h3><p>${this.escapeHtml(exemplar.sample)}</p>
                <dl class="learning-scores">${this.RUBRIC_LABELS.map((label, index) => `<div><dt>${label}</dt><dd>${this.escapeHtml(exemplar.scores?.[index] ?? 'Unscored')}/4</dd></div>`).join('')}</dl>
                <p>${this.escapeHtml(exemplar.rationale)}</p>
            </details>` : ''}
            </details>
        </section>`;
    },

    formatDate(value) {
        const date = value ? new Date(value) : null;
        return date && Number.isFinite(date.getTime()) ? date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' }) : 'Date not recorded';
    },

    getModuleFlags(module, progress = {}, statuses = {}, now = Date.now()) {
        const entry = progress.moduleMastery?.[module.id] || {};
        const transfer = entry.transfer;
        const dueAt = entry.review?.nextDue;
        const dueTime = dueAt ? new Date(dueAt).getTime() : NaN;
        const passingTransfer = Number.isFinite(transfer?.score) && Number.isFinite(transfer?.max) && transfer.max > 0 && transfer.score <= transfer.max && transfer.score / transfer.max >= 0.75;
        const consumed = (entry.review?.attempts || []).some(attempt => new Date(attempt.dueAt).getTime() === dueTime || new Date(attempt.reviewedAt).getTime() >= dueTime);
        const eligible = passingTransfer && Number.isFinite(dueTime) && !consumed;
        const steps = module.lab?.steps || [];
        const savedSteps = progress.labSteps?.[module.id] || [];
        const completedSteps = steps.filter((step, index) => savedSteps[index] === true).length;
        const firstIncomplete = steps.findIndex((step, index) => savedSteps[index] !== true);
        return {
            due: eligible && dueTime <= new Date(now).getTime(),
            upcoming: eligible && dueTime > new Date(now).getTime(),
            dueAt,
            weak: Boolean(entry.quiz && statuses[module.id]?.missing?.includes('quiz')) || progress.practiceChecks?.[module.id]?.passed === false,
            active: completedSteps > 0 && firstIncomplete >= 0 && !entry.lab?.completed,
            completedSteps, totalSteps: steps.length, firstIncomplete,
            caseComplete: Boolean(progress.artifactPractice?.[module.id] || entry.lab?.completed || steps.length && firstIncomplete < 0)
        };
    },

    renderModuleRow(module, { detail = '', meta = [], action = 'Learn', route = {} } = {}) {
        const href = this.escapeHtml(this.formatRoute({ moduleId: module.id, ...route }));
        return `<li class="learning-row"><div class="learning-row-body">
            <h3>${this.escapeHtml(module.title)}</h3>${detail ? `<p>${this.escapeHtml(detail)}</p>` : ''}
            <p class="learning-meta">${meta.map(value => `<span>${this.escapeHtml(value)}</span>`).join('')}</p>
            </div><div class="learning-row-actions"><a class="learning-action" href="${href}" aria-label="${this.escapeHtml(`${action}: ${module.title}`)}">${this.escapeHtml(action)}</a></div></li>`;
    },

    renderListSection(title, rows, empty) {
        return `<section class="learning-group"><h2>${this.escapeHtml(title)}</h2>${rows.length ? `<ul class="learning-list">${rows.join('')}</ul>` : `<p class="learning-empty">${this.escapeHtml(empty)}</p>`}</section>`;
    },

    renderDestinationHtml(destination, context = {}) {
        const renderers = { learn: this.renderCatalogHtml, practice: this.renderPracticeHtml, build: this.renderBuildHtml, more: this.renderMoreHtml };
        if (!Object.hasOwn(renderers, destination)) return '';
        const activityIds = new Set(context.activityIds || []);
        const modules = (context.modules || []).filter(module => !activityIds.has(module.id));
        const model = { progress: {}, statuses: {}, content: { modules: {}, paths: [] }, preferences: {}, route: {}, ...context, modules };
        model.activities = (context.modules || []).filter(module => activityIds.has(module.id)).slice(0, 10);
        const title = { learn: 'Lesson catalog', practice: 'Extra practice', build: 'Case practice', more: 'Progress' }[destination];
        return `<div class="learning-surface learning-destination"><h1 id="destinationTitle" tabindex="-1">${title}</h1>${renderers[destination].call(this, model)}</div>`;
    },

    renderCatalogHtml(context) {
        const { modules, progress, statuses, content, preferences, route } = context;
        const path = (content.paths || []).find(item => item.id === preferences.activePath) || content.paths?.[0];
        const selected = this.selectModules(modules, progress, statuses, { ...route, destination: 'learn', pathIds: route.pathOnly ? path?.moduleIds || [] : undefined });
        const rows = selected.map(module => this.renderModuleRow(module, {
            detail: module.subtitle,
            meta: [`Level ${module.level}`, this.STATE_LABELS[statuses[module.id]?.state] || 'Not started']
        }));
        return `${this.requestLabLink()}
            <form id="catalogFilters" class="learning-filters" role="search" aria-label="Module catalog">
                <div class="learning-field learning-query"><label for="catalogQuery">Search modules</label><input type="search" id="catalogQuery" name="query" maxlength="160" value="${this.escapeHtml(route.query || '')}"></div>
                <div class="learning-field"><label for="catalogLevel">Level</label><select id="catalogLevel" name="level"><option value="">All levels</option>${[100, 200, 300, 400].map(level => `<option value="${level}" ${String(level) === String(route.level) ? 'selected' : ''}>${level}</option>`).join('')}</select></div>
                <div class="learning-field"><label for="catalogState">Evidence state</label><select id="catalogState" name="state"><option value="">All states</option>${Object.entries(this.STATE_LABELS).map(([state, label]) => `<option value="${state}" ${state === route.state ? 'selected' : ''}>${label}</option>`).join('')}</select></div>
                <label class="learning-choice learning-path-filter" for="catalogPathOnly"><input type="checkbox" id="catalogPathOnly" name="path" value="selected" ${route.pathOnly ? 'checked' : ''}><span>Selected path${path ? `: ${this.escapeHtml(path.title)}` : ''}</span></label>
                <div class="learning-actions"><button type="submit" class="learning-action">Apply filters</button><button type="button" class="learning-action" data-learning-action="clear-filters">Clear filters</button></div>
            </form>
            <p class="learning-meta" role="status">${selected.length} of ${modules.length} modules</p>
            ${this.renderListSection('Modules', rows, 'No modules match these filters.')}
            ${context.activities.length ? this.renderListSection('Visual review', context.activities.map(module => this.renderModuleRow(module, { action: 'Open visual review', route: { tab: 'diagrams' } })), '') : ''}`;
    },

    renderPracticeHtml(context) {
        const { modules, progress, statuses, content, now } = context;
        const selected = this.selectModules(modules, progress, statuses, { destination: 'practice', now });
        const groups = { due: [], weak: [], upcoming: [], voluntary: [] };
        selected.forEach(module => {
            const flags = this.getModuleFlags(module, progress, statuses, now);
            groups[flags.due ? 'due' : flags.weak ? 'weak' : flags.upcoming ? 'upcoming' : 'voluntary'].push({ module, flags });
        });
        const row = ({ module, flags }) => this.renderModuleRow(module, {
            detail: flags.weak ? content.modules?.[module.id]?.prediction?.prompt || module.subtitle : module.subtitle,
            meta: [flags.due ? `Due ${this.formatDate(flags.dueAt)} (UTC)` : flags.upcoming ? `Next review ${this.formatDate(flags.dueAt)} (UTC)` : 'Voluntary practice', flags.weak ? 'A recorded check needs practice' : ''],
            action: flags.due ? 'Review now' : 'Practice',
            route: module.quiz?.length ? { tab: 'quiz' } : { sectionId: 'prediction-challenge' }
        });
        groups.due.sort((left, right) => new Date(left.flags.dueAt) - new Date(right.flags.dueAt));
        groups.upcoming.sort((left, right) => new Date(left.flags.dueAt) - new Date(right.flags.dueAt));
        return this.requestLabLink() + this.renderListSection('Due reviews', groups.due.map(row), 'No reviews due.') +
            this.renderListSection('Weak concepts', groups.weak.map(row), 'No weak checks recorded.') +
            this.renderListSection('Upcoming reviews', groups.upcoming.map(row), 'No upcoming reviews scheduled.') +
            this.renderListSection('Voluntary practice', groups.voluntary.map(row), 'No other practice tasks.');
    },

    renderBuildHtml(context) {
        const { modules, progress, statuses, content } = context;
        const selected = this.selectModules(modules, progress, statuses, { destination: 'build' });
        const inProgress = [];
        const outstanding = [];
        selected.forEach(module => {
            const flags = this.getModuleFlags(module, progress, statuses, context.now);
            const lab = content.modules?.[module.id]?.lab;
            const step = flags.firstIncomplete >= 0 ? module.lab.steps[flags.firstIncomplete] : null;
            const detail = flags.caseComplete ? content.modules?.[module.id]?.transfer?.prompt : step ? `Next external step ${flags.firstIncomplete + 1}: ${step.title || 'Continue the checklist'}` : content.modules?.[module.id]?.transfer?.prompt;
            const meta = [flags.totalSteps ? `${flags.completedSteps}/${flags.totalSteps} external steps checked (self-reported)` : 'Case artifact; no external lab required', lab?.mode === 'cloud-optional' ? '$0 local case; external work optional' : '$0 subscription-free case'];
            const row = this.renderModuleRow(module, { detail, meta, action: flags.caseComplete ? 'Add transfer evidence' : flags.active ? 'Continue lab' : 'Start case practice', route: flags.caseComplete ? { sectionId: 'transfer-evidence' } : { tab: 'lab' } });
            (flags.active ? inProgress : outstanding).push(row);
        });
        if (!selected.length) return '<p class="learning-empty">No unfinished build tasks.</p>';
        return this.renderListSection('In-progress labs', inProgress, 'No external labs in progress.') + this.renderListSection('Outstanding transfer', outstanding, 'No other transfer tasks.');
    },

    provenanceLabel(transfer) {
        if (transfer?.provenance === 'self-assessed') return 'Self-assessed';
        if (transfer?.provenance === 'reviewer-assessed') return `Reviewer-assessed by ${transfer.reviewer || 'unnamed reviewer'}; identity is self-reported`;
        return 'Legacy assessment; provenance unknown';
    },

    requestLabLink() {
        return '<a class="request-lab-link" href="#visual-lab"><strong>Follow a request through Front Door</strong><span>Start simple, change a scenario, and explain what happens next. No Azure subscription or commands.</span></a>';
    },

    getEvidenceHistory(modules, progress = {}) {
        const history = [];
        modules.forEach(module => {
            const entry = progress.moduleMastery?.[module.id] || {};
            const prediction = progress.practiceChecks?.[module.id];
            const artifact = progress.artifactPractice?.[module.id];
            const add = (kind, date, result, provenance, note = '') => history.push({ moduleId: module.id, title: module.title, kind, date, result, provenance, note: String(note).slice(0, 4000) });
            if (entry.quiz) add('Retrieval check', entry.quiz.completedAt, `${entry.quiz.latestScore}/${entry.quiz.total}; ${entry.quiz.criticalMisses || 0} critical misses`, 'Recorded quiz result');
            if (prediction) add('Prediction', prediction.completedAt, prediction.passed ? 'Correct prediction' : 'Needs practice', 'Locally checked answer; no quiz credit');
            if (artifact) add('Case practice', artifact.completedAt, 'Case analysis recorded', 'Self-attested; execution not verified', artifact.evidence);
            if (entry.lab?.completed) add('External lab', entry.lab.completedAt, 'Completion recorded', 'Self-reported; execution not verified');
            if (entry.transfer) add('Transfer assessment', entry.transfer.completedAt, `${entry.transfer.score}/${entry.transfer.max}`, this.provenanceLabel(entry.transfer), entry.transfer.reflection);
            (entry.review?.attempts || []).forEach(attempt => add('Scheduled review', attempt.reviewedAt, attempt.passed ? 'Passed' : 'Needs practice', 'Recorded review result'));
        });
        const traceCheck = progress.practiceChecks?.['afd-request-lab'];
        if (traceCheck) history.push({
            moduleId: 'afd-request-lab', title: 'AFD request lab', kind: 'Five-case trace check',
            date: traceCheck.completedAt, result: traceCheck.passed ? 'Threshold met (at least 4 of 5)' : 'Needs practice',
            provenance: 'Locally checked practice; no quiz, lab or mastery credit', note: ''
        });
        return history.sort((left, right) => (new Date(right.date).getTime() || 0) - (new Date(left.date).getTime() || 0));
    },

    renderMoreHtml(context) {
        const { modules, progress, statuses, content } = context;
        const history = this.getEvidenceHistory(modules, progress);
        const counts = Object.fromEntries(Object.keys(this.STATE_LABELS).map(state => [state, modules.filter(module => (statuses[module.id]?.state || 'not_started') === state).length]));
        const sources = [...new Set(modules.map(module => content.modules?.[module.id]?.lab?.status || 'Not recorded'))];
        const readings = modules.filter(module => progress.moduleMastery?.[module.id]?.contentReviewed).length;
        return `${typeof UnitEngine !== 'undefined' ? UnitEngine.progressHtml(modules, progress) : `<section class="learning-group"><h2>Your learning so far</h2><p>${readings} of ${modules.length} module readings done. Reading, practice, and applied skill are tracked separately.</p><a href="#today">Continue learning</a></section>`}
            <details class="learning-group"><summary>Catalog preferences</summary><section id="learningPreferences"></section></details>
            <details class="learning-group"><summary>Optional practice and skill records</summary>
            <div class="learning-actions"><a href="#practice">Review and extra practice</a><a href="#build">Case practice</a><a href="#learn">Search the lesson catalog</a></div>
            <dl class="learning-scores">${Object.entries(counts).map(([state, count]) => `<div><dt>${this.STATE_LABELS[state]}</dt><dd>${count}</dd></div>`).join('')}</dl></details>
            <details class="learning-group"><summary>Backups and evidence</summary><div class="learning-actions">
                <button type="button" class="learning-action" data-learning-action="export-progress">Export progress backup</button>
                <button type="button" class="learning-action" data-learning-action="import-progress">Import progress backup</button>
                <button type="button" class="learning-action" data-learning-action="download-report">Download evidence report</button>
            </div><p id="learningExportStatus" class="learningExportStatus learning-feedback" role="status" aria-live="polite"></p></details>
            <details class="learning-group"><summary>Practice history</summary>${history.length ? `<p class="learning-meta">Showing ${Math.min(history.length, 100)} of ${history.length} records. Dates are UTC.</p><ol class="learning-list learning-history">${history.slice(0, 100).map(item => `<li class="learning-row"><div class="learning-row-body"><h3>${this.escapeHtml(item.title)}: ${this.escapeHtml(item.kind)}</h3><p>${this.escapeHtml(item.result)}</p><p class="learning-meta"><span>${this.escapeHtml(this.formatDate(item.date))}</span><span>${this.escapeHtml(item.provenance)}</span></p>${item.note ? `<details class="learning-disclosure"><summary>Recorded evidence</summary><p class="learning-recorded-text">${this.escapeHtml(item.note)}</p></details>` : ''}</div></li>`).join('')}</ol>` : '<p class="learning-empty">Your practice results will appear here after you try a check.</p>'}</details>
            <details class="learning-group"><summary>Source review</summary><dl class="learning-metadata"><dt>Curriculum date</dt><dd>${this.escapeHtml(content.version || 'Not recorded')}</dd><dt>Module source labels</dt><dd>${sources.map(source => this.escapeHtml(source)).join(', ') || 'Not recorded'}</dd><dt>Method</dt><dd>Curriculum and documentation review. Source-reviewed does not mean cloud or provider tests were executed.</dd></dl></details>`;
    }
};

if (typeof module !== 'undefined' && module.exports) module.exports = LearningEngine;