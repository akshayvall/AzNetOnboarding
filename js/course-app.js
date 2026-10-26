const CourseApp = {
    current: null,
    section: 'story',
    escape: value => DiagramEngine.escapeHtml(value),
    get progress() { return ProgressManager.getProgress(); },
    get next() { return CourseProgress.next(this.lessons, this.progress); },
    get hasStarted() {
        const progress = this.progress;
        return this.lessons.some(lesson => {
            const state = CourseProgress.status(progress, lesson);
            return state.completed || state.read || state.practiced || state.draft.trim() || state.answers.some(Number.isInteger);
        });
    },
    lessonMarker(lesson, next, started) {
        if (CourseProgress.status(this.progress, lesson).completed) return '<span class="lesson-state lesson-complete"><span aria-hidden="true">✓</span><span class="sr-only">Checks passed</span></span>';
        return next?.id === lesson.id ? `<span class="lesson-state">${started ? 'Continue here' : 'Start here'}</span>` : '';
    },
    href(lesson) { return `#lesson=${encodeURIComponent(lesson.id)}`; },
    save(changes) {
        if (!this.current) return false;
        if (changes.section) this.section = changes.section;
        const saved = ProgressManager.saveProgress(CourseProgress.record(this.progress, this.current, changes));
        this.notice();
        return saved;
    },
    notice() {
        const status = ProgressManager.getStorageStatus();
        document.getElementById('save-notice').hidden = status.saved && !status.recoveryRequired;
        document.getElementById('save-message').textContent = `${status.message || 'Your latest work is not saved.'} Keep this page open, retry, or download a backup.`;
        const next = document.getElementById('lesson-next');
        if (next && this.current) next.hidden = !status.saved || status.recoveryRequired || !CourseProgress.status(this.progress, this.current).completed;
    },
    outline() {
        const host = document.getElementById('course-navigation');
        const next = this.next;
        const started = this.hasStarted;
        const reference = new URLSearchParams(location.hash.slice(1)).get('reference');
        const active = this.current || this.lessons.find(l => l.moduleId === reference) || next;
        host.hidden = false;
        document.querySelector('.course-layout').classList.add('with-outline');
        host.innerHTML = `<details class="course-drawer"${this.navigationMedia.matches ? ' open' : ''}>
            <summary>Contents</summary><nav aria-label="Course syllabus">${CourseCurriculum.stages.map(stage => {
                const modules = stage.level ? stage.modules : ['start'];
                return `<details${active?.level === stage.level ? ' open' : ''}><summary>${this.escape(stage.title)}</summary>
                <ul>${modules.map(id => {
                    const lessons = this.lessons.filter(l => l.moduleId === id);
                    return `<li><a href="${this.href(lessons[0])}">${this.escape(lessons[0].moduleTitle)}</a>${active?.moduleId === id ? `<ol>${lessons.map(l =>
                        `<li><a href="${this.href(l)}"${l.id === this.current?.id ? ' aria-current="page"' : ''}>${this.escape(l.title)}${this.lessonMarker(l, next, started)}</a></li>`).join('')}</ol>` : ''}</li>`;
                }).join('')}${stage.level ? `<li><a href="#lesson=checkpoint-${stage.level}"${this.current?.id === `checkpoint-${stage.level}` ? ' aria-current="page"' : ''}>Level checkpoint</a></li>` : ''}</ul></details>`;
            }).join('')}</nav></details>`;
    },
    home(message = '') {
        const next = this.next;
        const done = this.lessons.filter(l => CourseProgress.status(this.progress, l).completed).length;
        const started = this.hasStarted;
        this.main.innerHTML = `${message ? `<p role="alert">${this.escape(message)}</p>` : ''}
            <h1>${next ? 'Your course, from zero to depth' : 'You have checked the complete course'}</h1>
            <p class="course-intro">${next ? 'Start with one web request. Build your understanding through L100, L200, and L300, all the way to a Front Door architecture review.' : 'You have completed the lesson checks and level scenarios. Now explain the capstone without the page, and revisit your reasoning later. This is practice evidence, not independent proof of mastery.'}</p>
            ${next ? `<a class="course-primary course-start" href="${this.href(next)}">${started ? 'Continue' : 'Start'}: ${this.escape(next.title)}</a>
            <p class="course-position">${next.level ? 'L' + next.level + ' · ' + this.escape(next.moduleTitle) : 'Start here'} · ${done} of ${this.lessons.length} lessons checked</p>` : `<a class="course-primary" href="#progress">Review your learning record</a>`}
            <nav class="course-stage-map" aria-label="Explore the four course stages">${CourseCurriculum.stages.map(stage =>
                `<a href="${this.href(this.lessons.find(l => l.level === stage.level))}">${stage.level ? 'L' + stage.level : 'Start here'}<span>${stage.level === 100 ? 'Foundations' : stage.level === 200 ? 'Core services' : stage.level === 300 ? 'Applied depth' : 'First principles'}</span></a>`).join('')}</nav>
            <p class="course-meta">One recommended order. You can preview any lesson; Continue always follows unfinished learning. No Azure account is needed for the guided course.</p>
            <h2 class="syllabus-title">The complete syllabus</h2>
            <div class="syllabus">${CourseCurriculum.stages.map(stage => {
                const lessons = this.lessons.filter(l => l.level === stage.level);
                const checked = lessons.filter(l => CourseProgress.status(this.progress, l).completed).length;
                return `<details class="syllabus-stage"${next?.level === stage.level ? ' open' : ''}><summary><strong>${this.escape(stage.title)}</strong><span>${checked}/${lessons.length} checked</span></summary>
                <p>${this.escape(stage.outcome)}</p><ol>${(stage.level ? stage.modules : ['start']).map(id => {
                    const group = lessons.filter(l => l.moduleId === id);
                    return `<li><details${next?.moduleId === id ? ' open' : ''}><summary>${this.escape(group[0].moduleTitle)} <span>${group.length} lessons</span></summary>
                    <ol>${group.map(l => `<li><a href="${this.href(l)}">${this.escape(l.title)}</a>${this.lessonMarker(l, next, started)}</li>`).join('')}</ol></details></li>`;
                }).join('')}${stage.level ? `<li><a href="#lesson=checkpoint-${stage.level}">Put it together: L${stage.level} checkpoint</a></li>` : ''}</ol></details>`;
            }).join('')}</div>`;
    },
    question(q, name, answer) {
        return `<fieldset class="course-check"><legend>${this.escape(q.question || q.prompt)}</legend>
            ${q.options.map((text, i) => `<label class="course-answer"><input type="radio" name="${name}" value="${i}"${answer === i ? ' checked' : ''}>${this.escape(text)}</label>`).join('')}
            <p id="${name}-feedback" class="answer-detail" role="status"></p></fieldset>`;
    },
    lesson(id, requestedSection) {
        const lesson = this.lessons.find(l => l.id === id);
        this.current = lesson;
        const state = CourseProgress.status(this.progress, lesson);
        const group = this.lessons.filter(l => l.moduleId === lesson.moduleId);
        const next = this.lessons[this.lessons.indexOf(lesson) + 1];
        const previous = this.lessons[this.lessons.indexOf(lesson) - 1];
        const variants = !lesson.checkpoint ? CourseVisuals.variants(lesson) : [];
        this.main.innerHTML = `<a class="course-back" href="#">Course overview</a>
            <article><section id="story"><h1 id="lesson-title" tabindex="-1">${this.escape(lesson.title)}</h1>
            <p class="course-position">${lesson.level ? 'L' + lesson.level : 'Start here'} · ${this.escape(lesson.moduleTitle)} · ${lesson.checkpoint ? 'Level checkpoint' : `Lesson ${group.indexOf(lesson) + 1} of ${group.length}`}${state.completed ? ' · Previously checked' : ''}</p>
            <p class="course-intro">${this.escape(lesson.outcome)}</p>
            ${lesson.paragraphs.map(p => `<p>${this.escape(p)}</p>`).join('')}
            ${lesson.evidence ? `<h2>Examine the evidence</h2><p class="course-meta">Fictional case. No Azure resources are queried or changed.</p><ul class="case-evidence">${lesson.evidence.map(e => `<li>${this.escape(e)}</li>`).join('')}</ul>` : ''}
            </section><section id="practice" class="course-section">
            ${!lesson.checkpoint ? `<h2>${lesson.starter ? 'Follow the conversation' : 'See how it works'}</h2>
                <figure class="course-figure" aria-label="Lesson diagram">${CourseVisuals.render(lesson, state.variant)}</figure>
                ${variants.length > 1 ? `<label class="course-condition"><input id="condition" type="checkbox"${state.variant ? ' checked' : ''}>${lesson.starter ? this.escape(lesson.change) : 'Compare: ' + this.escape(variants[1].label)}</label><p id="condition-status" role="status" class="course-meta">${this.escape(variants[state.variant]?.label || variants[0].label)}</p>` : ''}
                ${lesson.example ? `<div class="worked-example"><h2>${this.escape(lesson.example.title)}</h2><p>${this.escape(lesson.example.text)}</p></div>` : ''}
                ${lesson.activity ? `<h2>Your turn</h2>${this.question(lesson.activity, 'prediction', null)}<button data-course-action="predict">Compare my reasoning</button><p id="prediction-feedback" role="status">${state.practiced ? 'A correct prediction is saved. Try it again from memory.' : ''}</p>` : ''}
                <p class="takeaway"><strong>Keep this idea:</strong> ${this.escape(lesson.takeaway)}</p>` : ''}
            ${lesson.caseStudy ? `<h2>Read the evidence</h2><p class="course-meta">Fictional example for this module. Read it; do not run it.</p><pre class="case-evidence">${this.escape(lesson.caseStudy.evidence)}</pre><p>The final check below asks you to interpret this evidence, not recall a definition.</p>` : ''}
            </section><section id="check" class="course-section"><h2>${lesson.checkpoint ? 'Defend your interpretation' : 'Check your understanding'}</h2>
            ${lesson.checks.map((q, i) => this.question(q, `answer-${i}`, state.answers[i])).join('')}
            <button id="answer-check" class="course-primary" data-course-action="check">Check my understanding</button>
            <p id="answer-feedback" role="status">${state.answerIssue ? 'The saved answer choices could not be read. Your other records are preserved; select your answers again or import a supported backup.' : state.completed ? 'Your previous successful check is saved. Reviewing will not erase it.' : ''}</p>
            <div class="explanation-writing"><h2>Put it in your own words</h2><label for="explanation">${this.escape(lesson.teachBack.prompt)}</label>
            <textarea id="explanation" rows="3" maxlength="4000">${this.escape(state.draft)}</textarea><p id="draft-status" role="status" class="course-meta">${state.draft ? 'Your draft is saved on this browser.' : 'Optional. Saved as you type; not automatically graded.'}</p>
            <details><summary>${lesson.rubric ? 'Review your reasoning against these criteria' : 'Compare with an example explanation'}</summary>
            ${lesson.rubric ? `<ul>${lesson.rubric.map(r => `<li>${this.escape(r)}</li>`).join('')}</ul>` : `<p>${this.escape(lesson.teachBack.example)}</p>`}
            <p>This supports self-review; it is not an independent assessment.</p></details></div>
            <div class="course-next"><button id="lesson-next" class="course-primary" data-course-action="next"${state.completed ? '' : ' hidden'}>${next ? `Next${next.level !== lesson.level ? ' · ' + (next.level ? 'L' + next.level : 'Start here') : ''}: ${this.escape(next.title)}` : 'Finish the course'}</button>
            <p class="course-meta">${next ? 'Stop whenever you need to. Your answers and reading section stay saved.' : 'Completing this course records practice, not certification or live deployment.'}</p>
            ${previous ? `<a href="${this.href(previous)}">Previous: ${this.escape(previous.title)}</a>` : ''}</div>
            </section>${!lesson.starter && !lesson.checkpoint ? `<details class="lesson-reference"><summary>Reference and optional hands-on practice</summary>
            <p>The guided lesson above is the required learning. These are supplementary lookups and exercises.</p>
            <a href="#reference=${lesson.moduleId}&return=${lesson.id}">Read the full module reference here</a>
            <a href="reference.html#${lesson.moduleId}?tab=quiz">Optional full module quiz</a>
            <a href="reference.html#${lesson.moduleId}?tab=lab">Optional case and Azure lab · review prerequisites and costs</a>
            <a href="reference.html#${lesson.moduleId}?tab=interactive">Additional exercises</a></details>` : ''}</article>`;
        this.outline();
        this.notice();
        this.restoreSection(requestedSection || state.section);
    },
    restoreSection(section) {
        this.section = section;
        if (section === 'story') { window.scrollTo(0, 0); document.getElementById('lesson-title')?.focus({ preventScroll: true }); }
        else document.getElementById(section)?.scrollIntoView({ block: 'start' });
        this.routing = false;
    },
    reference(moduleId, returnId, section) {
        const module = this.modules.find(m => m.id === moduleId);
        if (!module) return this.home('That reference is not available. Choose a lesson from the syllabus.');
        const lesson = this.lessons.find(l => l.id === returnId) || this.lessons.find(l => l.moduleId === moduleId);
        this.main.innerHTML = `<a class="course-back" href="${this.href(lesson)}">Return to lesson: ${this.escape(lesson.title)}</a>
            <h1>${this.escape(module.title)}: reference</h1><p>Supplementary detail. This visit does not move your course position.</p><div class="course-reference-body"></div>`;
        const body = this.main.querySelector('.course-reference-body');
        const template = document.createElement('template');
        template.innerHTML = module.learn;
        // Authored reference markup is trusted content, but its legacy inline styles/events are not part of this shell.
        template.content.querySelectorAll('script, style, iframe').forEach(el => el.remove());
        template.content.querySelectorAll('*').forEach(el => {
            for (const attribute of [...el.attributes]) if (attribute.name === 'style' || attribute.name.startsWith('on')) el.removeAttribute(attribute.name);
        });
        body.append(template.content);
        body.querySelectorAll('[data-diagram-model]').forEach(el => {
            const type = el.dataset.diagramModel;
            el.innerHTML = CourseVisuals.render({ diagram: { type, scenario: el.dataset.diagramScenario || DiagramCatalog.models[type].scenarios[0].id } });
        });
        body.querySelectorAll('h2').forEach(el => { el.id = el.textContent.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-'); });
        if (section) requestAnimationFrame(() => [...body.querySelectorAll('h2')].find(el => el.id === section)?.scrollIntoView());
    },
    progressView() {
        const p = this.progress;
        const states = this.lessons.map(l => CourseProgress.status(p, l));
        const checked = states.filter(s => s.completed).length;
        this.main.innerHTML = `<h1>Your learning record</h1><p class="course-intro">${checked} of ${this.lessons.length} lessons checked. ${states.filter(s => s.draft.trim()).length} self-explanations saved.</p>
            <p>Checks, reading, and self-explanations are different evidence. None of them claims that you deployed or independently demonstrated mastery.</p>
            ${this.next ? `<a class="course-primary" href="${this.href(this.next)}">Continue: ${this.escape(this.next.title)}</a>` : '<a href="#">Review the complete course</a>'}
            <section class="course-section"><h2>Progress by level</h2><ul>${CourseCurriculum.stages.map(s => {
                const group = this.lessons.filter(l => l.level === s.level);
                return `<li>${this.escape(s.title)}: ${group.filter(l => CourseProgress.status(p, l).completed).length} of ${group.length} checked</li>`;
            }).join('')}</ul></section>
            <details><summary>Lesson records and saved explanations</summary><ol>${this.lessons.map((l, i) => `<li><a href="${this.href(l)}">${this.escape(l.title)}</a>
                <p class="course-meta">${states[i].completed ? 'Checks passed' : states[i].read ? 'Read; checks not passed' : 'Not checked'}${states[i].practiced ? ' · Prediction correct' : ''}</p>
                ${states[i].draft ? `<blockquote>${this.escape(states[i].draft)}</blockquote>` : ''}</li>`).join('')}</ol></details>
            <details><summary>Your earlier academy evidence</summary><p>${p.completedModules.length} earlier module reading records; ${Object.keys(p.quizScores).length} quiz records; ${p.completedLabs.length} lab records. These are preserved, not converted into new course checks.</p>
            <a href="reference.html#more">Open earlier records and optional tools</a></details>
            <section class="course-section"><h2>Keep a backup</h2><p>A backup includes both your new course work and earlier academy evidence. Import replaces the current browser record after confirmation.</p>
            <button data-course-action="export">Download backup</button><label class="backup-import">Import a JSON backup<input id="course-import" type="file" accept=".json"></label><p id="import-status" role="status"></p></section>
            <details><summary>Optional exploration</summary><a href="#sandbox">Explore Front Door scenarios</a><p>This sandbox is not required to complete the course.</p></details>`;
    },
    sandbox() {
        const first = this.lessons.find(l => l.moduleId === 'frontdoor-basics');
        const scenarios = DiagramCatalog.models['afd-request'].scenarios;
        this.main.innerHTML = `<h1>Front Door scenario sandbox</h1><p>Optional exploration after the relevant lessons. No Azure resources are used. Each scenario keeps the request and return paths explicit.</p>
            <p><a href="${this.href(first)}">Learn Front Door in the course instead</a></p>
            <label for="sandbox-scenario">Choose one situation</label><select id="sandbox-scenario">${scenarios.map(s => `<option value="${s.id}">${this.escape(s.label)}</option>`).join('')}</select>
            <figure class="course-figure">${CourseVisuals.render({ diagram: { type: 'afd-request', scenario: 'miss' } })}</figure><a href="#continue">Return to unfinished learning</a>`;
    },
    route() {
        this.routing = true;
        this.current = null;
        const hash = location.hash.slice(1);
        const params = new URLSearchParams(hash);
        if (hash === 'continue') {
            if (this.next) { location.replace(this.href(this.next)); return; }
        }
        let id = params.get('lesson');
        let section = params.get('section');
        if (hash.startsWith('start?')) id = GuidedCourse.lessons[Number(new URLSearchParams(hash.split('?')[1]).get('lesson'))]?.id;
        if (hash && !hash.includes('=') || hash.includes('?')) {
            const [moduleId, query] = hash.split('?');
            const module = this.modules.find(m => m.id === moduleId);
            if (module) {
                const old = new URLSearchParams(query);
                if (old.has('section') || old.get('tab') === 'reference') {
                    this.reference(module.id, null, old.get('section')); this.outline(); this.notice(); this.routing = false; return;
                }
                if (['quiz', 'lab', 'interactive', 'diagrams'].includes(old.get('tab'))) {
                    location.replace('reference.html#' + hash); return;
                }
                id = this.lessons.find(l => l.moduleId === module.id && (!old.get('unit') || l.unitId === old.get('unit')))?.id;
                section = old.get('tab') === 'check' ? 'check' : old.get('tab') === 'try' ? 'practice' : null;
            }
        }
        if (id && this.lessons.some(l => l.id === id)) {
            this.lesson(id, ['story', 'practice', 'check'].includes(section) ? section : null);
            history.replaceState(null, '', this.href(this.current));
            return;
        }
        if (params.has('reference')) this.reference(params.get('reference'), params.get('return'), params.get('section'));
        else if (['progress', 'more'].includes(hash)) this.progressView();
        else if (['sandbox', 'visual-lab'].includes(hash)) this.sandbox();
        else this.home(hash && !['today', 'learn', 'continue'].includes(hash) ? 'That link is not part of the course. Your progress is unchanged; choose a lesson below.' : '');
        this.outline(); this.notice(); window.scrollTo(0, 0);
        this.main.querySelector('h1')?.setAttribute('tabindex', '-1');
        this.main.querySelector('h1')?.focus({ preventScroll: true });
        this.routing = false;
    },
    check() {
        const answers = this.current.checks.map((_, i) => {
            const selected = this.main.querySelector(`input[name="answer-${i}"]:checked`);
            return selected ? Number(selected.value) : null;
        });
        const feedback = document.getElementById('answer-feedback');
        if (answers.some(a => a === null)) { feedback.textContent = 'Choose an answer for each question. You can revisit the example above.'; return; }
        const correct = this.current.checks.filter((q, i) => q.correct === answers[i]).length;
        const saved = this.save({ answers, checked: true, section: 'check', read: 1 });
        this.current.checks.forEach((q, i) => {
            document.getElementById(`answer-${i}-feedback`).textContent = `${q.correct === answers[i] ? 'Correct.' : 'Not quite.'} ${q.explanation}`;
        });
        feedback.textContent = `${correct} of ${answers.length} correct. ${correct === answers.length ? 'You have checked this idea. Explain it in your own words or continue.' : 'Use the feedback to revisit your reasoning and try again.'}${saved ? '' : ' This attempt is not saved yet.'}`;
    },
    click(event) {
        if (event.target.closest('.course-skip')) { event.preventDefault(); this.main.focus(); return; }
        const action = event.target.closest('[data-course-action]')?.dataset.courseAction;
        if (!action) return;
        if (action === 'export') { ProgressManager.exportProgress(); return; }
        if (action === 'retry') { ProgressManager.retrySave(); this.notice(); return; }
        if (!this.current) return;
        if (action === 'check') this.check();
        if (action === 'predict') {
            const input = this.main.querySelector('input[name="prediction"]:checked');
            const feedback = document.getElementById('prediction-feedback');
            if (!input) { feedback.textContent = 'Choose a prediction first.'; return; }
            const passed = Number(input.value) === this.current.activity.correct;
            const saved = this.save({ practiced: passed, section: 'practice' });
            feedback.textContent = `${passed ? 'Yes.' : 'Not quite.'} ${this.current.activity.explanation}${saved ? '' : ' Not saved yet.'}`;
        }
        if (action === 'next' && CourseProgress.status(this.progress, this.current).completed && ProgressManager.getStorageStatus().saved) {
            const next = this.lessons[this.lessons.indexOf(this.current) + 1];
            location.hash = next ? this.href(next) : '';
        }
    },
    async change(event) {
        if (event.target.id === 'course-import') {
            const status = document.getElementById('import-status');
            const file = event.target.files[0];
            if (!file || !confirm('Replace this browser progress with the selected backup? Download your current backup first if you need to retain it.')) return;
            try { await ProgressManager.importProgress(file); this.progressView(); document.getElementById('import-status').textContent = 'Backup imported.'; }
            catch (error) { status.textContent = `Import failed: ${error.message} Your existing record has not been replaced by invalid data.`; }
            this.notice(); return;
        }
        if (event.target.id === 'sandbox-scenario') {
            this.main.querySelector('figure').innerHTML = CourseVisuals.render({ diagram: { type: 'afd-request', scenario: event.target.value } });
            return;
        }
        if (!this.current) return;
        if (event.target.id === 'condition') {
            const variant = Number(event.target.checked);
            this.save({ variant, section: 'practice' });
            this.main.querySelector('figure').innerHTML = CourseVisuals.render(this.current, variant);
            document.getElementById('condition-status').textContent = CourseVisuals.variants(this.current)[variant].label;
        }
        if (event.target.name?.startsWith('answer-')) {
            const answers = this.current.checks.map((_, i) => {
                const input = this.main.querySelector(`input[name="answer-${i}"]:checked`);
                return input ? Number(input.value) : null;
            });
            this.save({ answers, section: 'check', read: 1 });
        }
    },
    init() {
        this.modules = [...MODULES_100, ...MODULES_200, ...MODULES_300, ...MODULES_EXTRAS];
        this.lessons = CourseCurriculum.build(this.modules, ACADEMY_UNITS, GuidedCourse);
        this.main = document.getElementById('course');
        this.navigationMedia = matchMedia('(min-width: 900px)');
        this.navigationMedia.addEventListener('change', event => {
            document.querySelector('.course-drawer').open = event.matches;
        });
        this.route();
        window.addEventListener('hashchange', () => this.route());
        document.addEventListener('click', e => this.click(e));
        document.addEventListener('change', e => this.change(e));
        document.addEventListener('input', e => {
            if (e.target.id !== 'explanation' || !this.current) return;
            const saved = this.save({ draft: e.target.value, section: 'check' });
            document.getElementById('draft-status').textContent = saved ? 'Draft saved on this browser.' : 'Draft is not saved. Keep this page open and retry or export a backup.';
        });
        window.addEventListener('beforeunload', e => {
            if (!ProgressManager.getStorageStatus().saved) { e.preventDefault(); e.returnValue = ''; }
        });
        window.addEventListener('scroll', () => {
            if (!this.current || this.routing || this.scrollQueued || !ProgressManager.getStorageStatus().saved) return;
            this.scrollQueued = true;
            requestAnimationFrame(() => {
                this.scrollQueued = false;
                if (!this.current || this.routing || !ProgressManager.getStorageStatus().saved) return;
                const bounds = document.getElementById(this.section)?.getBoundingClientRect();
                if (bounds && bounds.top < innerHeight && bounds.bottom > 0) return;
                const section = ['story', 'practice', 'check'].filter(id => document.getElementById(id).getBoundingClientRect().top < innerHeight * .4).pop() || 'story';
                if (section !== this.section) this.save({ section, read: section === 'check' ? 1 : CourseProgress.status(this.progress, this.current).read ? 1 : 0 });
            });
        }, { passive: true });
        if ('serviceWorker' in navigator && ['http:', 'https:'].includes(location.protocol)) navigator.serviceWorker.register('./sw.js').catch(error => {
            console.warn('Offline setup failed:', error);
            document.querySelector('.course-footer').insertAdjacentHTML('beforeend', '<p role="status">Offline setup failed. Keep a network connection and reload to retry.</p>');
        });
    }
};
CourseApp.init();
