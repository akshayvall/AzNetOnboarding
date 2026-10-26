const GuidedCourse = {
    lessons: [
        {
            id: 'request', title: 'What happens when you open a website?', short: 'A request needs a reply',
            outcome: 'Follow a request to a website and its response back to you.',
            setup: 'You open a shop website. Your browser asks the shop for a page. A server, the computer running the website, sends a response. Your browser uses that response to show the page.',
            explanation: 'A request is a message asking for something. A response is the answer. They travel in opposite directions. For now, assume the browser already knows the server address; the next lesson explains how it finds that address.',
            change: 'Change one thing: the reply cannot get back',
            result: ['Both directions work. The browser asks for the page and receives the reply.', 'The request reached the server, but the reply did not reach the browser. The browser may wait and eventually show a timeout.'],
            question: 'The server received the request, but the reply cannot get back. What might you see?',
            options: ['The page must load because the request arrived.', 'The browser can time out even though the request arrived.'],
            correct: 1, feedback: 'Both directions matter. Delivery to the server is not enough when the response cannot reach the browser.',
            takeaway: 'Always follow the request and the reply.',
            connection: 'Front Door also receives requests and sends responses. First, keep this two-way conversation in mind.'
        },
        {
            id: 'address', title: 'How does your browser find the website?', short: 'Find the address first',
            outcome: 'Separate finding a website address from receiving its page.',
            setup: 'You type shop.example.com. Before connecting, the browser needs an address for that name. DNS is the name-lookup system. A DNS resolver is the helper that finds the answer for your device.',
            explanation: 'Follow arrows 1 and 2 first: your device asks the helper and gets an IP address, a destination the network can use. Then follow arrows 3 and 4: the browser contacts the website at that address. The helper does not fetch the page. This sketch starts without a usable local DNS answer and leaves out how the helper finds its answer.',
            change: 'Change one thing: the website is unavailable',
            result: ['The helper returns an address. The browser then contacts the website and receives the page.', 'The helper still returns the correct address. The website is unavailable, so the browser does not get the page. A successful lookup is not a successful website request.'],
            question: 'DNS returns the right address, but the website is unavailable. What did DNS accomplish?',
            options: ['It found the destination, not the page.', 'It delivered the page, so the website must work.'],
            correct: 0, feedback: 'DNS answers the address question. Connecting to the website and receiving its response are separate jobs.',
            takeaway: 'An address is not a page.',
            connection: 'For a Front Door site, name lookup helps the browser find a serving edge address. We will meet that edge in the next lesson.'
        },
        {
            id: 'frontdoor', title: 'Meet Azure Front Door', short: 'Put Front Door in the path',
            outcome: 'Explain when Front Door needs the application and when it can answer from a stored copy.',
            setup: 'Now the shop uses Azure Front Door. Your browser connects to Front Door, not directly to the shop application. Front Door can make a separate request to the application and return its response to you.',
            explanation: 'The edge is where Front Door handles the browser request. The origin is the application behind it. Think of a reception desk and the team behind the desk: two conversations, not one direct conversation through the desk. For a public logo, Front Door may keep a reusable copy in a cache. A fresh matching copy can answer a later allowed request without contacting the origin.',
            change: 'Change one thing: Front Door already has a fresh public logo',
            result: ['There is no usable cached logo. Front Door asks the origin for it, receives the response, and sends it to the browser.', 'The fresh public logo is already available in the edge cache. Front Door returns it to the browser; the origin is not contacted for this response.'],
            question: 'Front Door has a fresh, reusable copy of the public logo and allows the request. Does it need to fetch that logo from the origin?',
            options: ['Yes, every response must come from the origin.', 'No, Front Door can return the cached copy.'],
            correct: 1, feedback: 'For this cache hit, the response comes from Front Door without an origin fetch. Private or personalized responses need different cache handling.',
            takeaway: 'Front Door can answer at the edge or ask the origin.',
            connection: 'This example assumes the request is allowed and caching is configured for the public logo. Security checks and handling failures come later.'
        }
    ],
    prefix: 'guided-v1:',
    lesson(id) {
        const lesson = this.lessons.find(item => item.id === id);
        if (!lesson) throw new Error('Unknown lesson');
        return lesson;
    },
    state(progress, id) {
        this.lesson(id);
        const key = this.prefix + id;
        const notes = progress.notes || {};
        return {
            section: ['story', 'experiment', 'check'].includes(notes[key + ':section']) ? notes[key + ':section'] : 'story',
            answer: ['0', '1'].includes(notes[key + ':answer']) ? Number(notes[key + ':answer']) : null,
            variant: notes[key + ':variant'] === '1',
            completed: progress.practiceChecks?.[key]?.passed === true
        };
    },
    nextLesson(progress) {
        return this.lessons.find(lesson => !this.state(progress, lesson.id).completed) || null;
    },
    record(progress, id, changes) {
        this.lesson(id);
        const key = this.prefix + id;
        const updated = { ...progress, notes: { ...progress.notes }, practiceChecks: { ...progress.practiceChecks } };
        for (const field of ['section', 'answer', 'variant']) {
            if (changes[field] !== undefined) updated.notes[key + ':' + field] = field === 'variant' ? (changes[field] ? '1' : '0') : String(changes[field]);
        }
        if (typeof changes.passed === 'boolean') {
            updated.practiceChecks[key] = {
                passed: changes.passed || progress.practiceChecks?.[key]?.passed === true,
                attempts: (progress.practiceChecks?.[key]?.attempts || 0) + 1,
                completedAt: new Date().toISOString()
            };
        }
        return updated;
    },
    diagram(id, variant) {
        const lesson = this.lesson(id);
        const browser = { title: 'Your browser', detail: 'Asks for the page' };
        const website = { title: 'Website server', detail: variant ? 'Unavailable' : 'Sends the page' };
        const reply = { outward: 'Request', inward: variant ? 'Reply blocked' : 'Response', broken: variant };
        if (id === 'request') return {
            nodes: [browser, { title: 'Website server', detail: 'Receives the request' }],
            links: [reply], caption: lesson.result[Number(variant)]
        };
        if (id === 'address') return {
            nodes: [{ title: 'DNS helper', detail: 'Returns an address' }, browser, website],
            links: [
                { outward: '1 Ask for address', inward: '2 Address reply', reverse: true },
                { outward: '3 Request page', inward: variant ? 'No page received' : '4 Page response', broken: variant }
            ], caption: lesson.result[Number(variant)]
        };
        return {
            nodes: [
                { title: 'Your browser', detail: 'Asks for a public logo' },
                { title: 'Front Door edge', detail: variant ? 'Has a cached logo' : 'No cached logo' },
                { title: 'Application origin', detail: variant ? 'Not contacted' : 'Provides the logo', unused: variant }
            ],
            links: [
                { outward: '1 Request logo', inward: variant ? '2 Cached logo' : '4 Return logo' },
                { outward: variant ? 'No fetch' : '2 Separate request', inward: variant ? 'Not contacted' : '3 Origin response', unused: variant }
            ], caption: lesson.result[Number(variant)]
        };
    },
    escape(value) {
        return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
    },
    arrow(left, broken, unused) {
        const horizontal = unused ? 'M 3 8 H 117' : broken ? 'M 3 8 H 45 M 75 8 H 117 M 54 2 L 66 14 M 66 2 L 54 14'
            : left ? 'M 117 8 H 3 M 11 2 L 3 8 L 11 14' : 'M 3 8 H 117 M 109 2 L 117 8 L 109 14';
        const vertical = unused ? 'M 7 2 V 42' : broken ? 'M 7 2 V 14 M 7 30 V 42 M 2 17 L 12 27 M 12 17 L 2 27'
            : left ? 'M 7 42 V 2 M 1 10 L 7 2 L 13 10' : 'M 7 2 V 42 M 1 34 L 7 42 L 13 34';
        return `<svg class="horizontal" viewBox="0 0 120 16" aria-hidden="true"><path d="${horizontal}"/></svg><svg class="vertical" viewBox="0 0 14 44" aria-hidden="true"><path d="${vertical}"/></svg>`;
    },
    figure(id, variant) {
        const diagram = this.diagram(id, variant);
        const nodes = diagram.nodes.map((node, index) => {
            const link = diagram.links[index];
            return `<div class="journey-node${node.unused ? ' is-unused' : ''}"><strong>${this.escape(node.title)}</strong><span>${this.escape(node.detail)}</span></div>${link ? `<div class="journey-link${link.unused ? ' is-unused' : ''}">
                <div class="journey-lane"><span>${this.escape(link.outward)}</span>${this.arrow(Boolean(link.reverse), false, link.unused)}</div>
                <div class="journey-lane${link.broken ? ' is-broken' : ''}"><span>${this.escape(link.inward)}</span>${this.arrow(!link.reverse, link.broken, link.unused)}</div></div>` : ''}`;
        }).join('');
        return `<div class="journey${diagram.nodes.length === 3 ? ' three' : ''}">${nodes}</div><figcaption>${this.escape(diagram.caption)}</figcaption>`;
    },
    save(changes) {
        if (changes.section) this.readingSection = changes.section;
        const saved = ProgressManager.saveProgress(this.record(ProgressManager.getProgress(), this.current, changes));
        this.notice();
        return saved;
    },
    notice() {
        const status = ProgressManager.getStorageStatus();
        document.getElementById('save-notice').hidden = status.saved && !status.recoveryRequired;
        document.getElementById('save-message').textContent = `${status.message || 'Your latest work is not saved.'} Keep this page open, retry saving, or download a backup.`;
        const next = document.getElementById('lesson-next');
        if (next) next.hidden = !status.saved || status.recoveryRequired || !this.state(ProgressManager.getProgress(), this.current).completed;
        if (next && !next.hidden) document.getElementById('answer-check').classList.remove('course-primary');
    },
    overview(message = '') {
        this.current = null;
        const p = ProgressManager.getProgress();
        const next = this.nextLesson(p);
        const index = this.lessons.indexOf(next);
        const done = this.lessons.filter(l => this.state(p, l.id).completed).length;
        document.getElementById('course').innerHTML = `${message ? `<p role="alert">${this.escape(message)}</p>` : ''}
            <h1 tabindex="-1">${next ? 'Understand the journey of a web request' : 'You can now follow a request'}</h1>
            <p class="course-intro">${next ? 'Start with a browser and a website. Add one idea at a time until Front Door makes sense. No Azure account or networking experience needed.' : 'You have practiced the three ideas below. Try explaining them without reopening the lessons.'}</p>
            ${next ? `<p class="course-position">${done} of 3 lessons completed. About 5 minutes per lesson, at your pace.</p>
            <button class="course-primary" data-course-action="continue">${done ? 'Continue' : 'Start'} lesson ${index + 1}</button>
            <p class="course-meta">Up next: ${this.escape(next.title)}</p>` : `<ol class="course-recap"><li>A request needs a reply: both directions must work.</li><li>DNS finds the address; it does not deliver the page.</li><li>Front Door can answer from a cache or ask the origin.</li></ol>
            <p><strong>This is the end of the three-lesson pilot.</strong> The rest of the academy has not been converted to this format. Stop here; you do not need to enter the advanced lab to finish.</p>`}
            <ol class="course-outline" aria-label="Your three lessons">${this.lessons.map((lesson, i) => {
                const complete = this.state(p, lesson.id).completed;
                return `<li${lesson === next ? ' aria-current="step"' : ''}><span class="lesson-number">${i + 1}</span><div><h2>${this.escape(lesson.short)}</h2><p>${this.escape(lesson.outcome)}</p><span class="course-status">${complete ? 'Completed' : lesson === next ? 'Your next lesson' : 'Upcoming'}</span></div>
                    <a href="#lesson=${lesson.id}&section=story">${complete ? 'Review' : 'Preview'} lesson ${i + 1}</a></li>`;
            }).join('')}</ol>
            <p class="course-meta">Preview any lesson if you wish. Your Continue button follows the first unfinished lesson, not the last page you looked at.</p>`;
    },
    renderLesson(id, section) {
        this.current = id;
        const lesson = this.lesson(id);
        const state = this.state(ProgressManager.getProgress(), id);
        const index = this.lessons.indexOf(lesson);
        const next = this.lessons[index + 1];
        document.getElementById('course').innerHTML = `<a class="course-back" href="#">Course overview</a>
            <article><section id="story"><h1 id="lesson-title" tabindex="-1">${this.escape(lesson.title)}</h1>
            <p class="course-position">Lesson ${index + 1} of 3${state.completed ? ' · Completed; you are reviewing' : ''}</p>
            <p class="course-intro">${this.escape(lesson.setup)}</p></section>
            <section id="experiment" class="course-section">
            <figure class="course-figure" aria-label="Connected request and response diagram" aria-live="polite">${this.figure(id, state.variant)}</figure>
            <label class="course-condition"><input id="condition" type="checkbox"${state.variant ? ' checked' : ''}>${this.escape(lesson.change)}</label>
            <p class="course-meta">Select the condition to change the diagram. Clear it to return to the working example.</p>
            <h2>Why this matters</h2><p>${this.escape(lesson.explanation)}</p>
            <p><strong>Keep this idea:</strong> ${this.escape(lesson.takeaway)}</p></section>
            <section id="check" class="course-section"><h2>Check the idea</h2>
            <fieldset class="course-check"><legend>${this.escape(lesson.question)}</legend>
            ${lesson.options.map((option, i) => `<label class="course-answer"><input type="radio" name="answer" value="${i}"${state.answer === i ? ' checked' : ''}>${this.escape(option)}</label>`).join('')}</fieldset>
            <button id="answer-check" class="${state.completed ? '' : 'course-primary'}" data-course-action="check">Check my answer</button>
            <p id="answer-feedback" role="status">${state.completed ? 'You completed this lesson. You can try the question again or continue.' : ''}</p>
            <div class="course-next"><p>${this.escape(lesson.connection)}</p>
            <button id="lesson-next" class="course-primary" data-course-action="next"${state.completed ? '' : ' hidden'}>${next ? 'Next lesson: ' + this.escape(next.title) : 'Finish these three lessons'}</button>
            <p class="course-meta">You can stop here at any time. Your answer and reading section are saved on this browser.</p></div></section></article>`;
        this.notice();
        this.scrollSection(section || state.section);
    },
    scrollSection(section) {
        this.readingSection = section;
        requestAnimationFrame(() => {
            if (section === 'story') window.scrollTo(0, 0);
            else document.getElementById(section)?.scrollIntoView({ block: 'start' });
            if (section === 'story') document.getElementById('lesson-title')?.focus({ preventScroll: true });
            this.routing = false;
        });
    },
    route() {
        this.routing = true;
        const params = new URLSearchParams(location.hash.slice(1));
        const id = params.get('lesson');
        if (id && this.lessons.some(lesson => lesson.id === id)) {
            const section = params.get('section');
            this.renderLesson(id, ['story', 'experiment', 'check'].includes(section) ? section : null);
            if (section) history.replaceState(null, '', `#lesson=${id}`);
        } else {
            this.overview(id ? 'That lesson is not in this pilot. Choose one of the three lessons below.' : '');
            this.notice();
            window.scrollTo(0, 0);
            document.querySelector('main h1').focus({ preventScroll: true });
            this.routing = false;
        }
    },
    init() {
        this.route();
        window.addEventListener('hashchange', () => this.route());
        document.addEventListener('click', event => {
            if (event.target.closest('.course-skip')) {
                event.preventDefault();
                document.getElementById('course').focus();
                return;
            }
            const action = event.target.closest('[data-course-action]')?.dataset.courseAction;
            if (!action) return;
            if (action === 'export') return ProgressManager.exportProgress();
            if (action === 'retry') { ProgressManager.retrySave(); this.notice(); return; }
            if (action === 'continue') {
                const next = this.nextLesson(ProgressManager.getProgress());
                if (next) location.hash = `lesson=${next.id}`;
                return;
            }
            if (!this.current) return;
            if (action === 'check') {
                const lesson = this.lesson(this.current);
                const answer = document.querySelector('input[name="answer"]:checked');
                const feedback = document.getElementById('answer-feedback');
                if (!answer) { feedback.textContent = 'Choose an answer first. You can look at the diagram again.'; return; }
                const passed = Number(answer.value) === lesson.correct;
                const saved = this.save({ passed, answer: Number(answer.value), section: 'check' });
                feedback.textContent = `${passed ? 'Yes.' : 'Not quite.'} ${lesson.feedback}${saved ? '' : ' Your answer is not saved yet.'}`;
                if (passed && saved) document.getElementById('answer-check').classList.remove('course-primary');
            }
            if (action === 'next') {
                if (!this.state(ProgressManager.getProgress(), this.current).completed || !ProgressManager.getStorageStatus().saved) return;
                const next = this.lessons[this.lessons.findIndex(l => l.id === this.current) + 1];
                location.hash = next ? `lesson=${next.id}` : '';
            }
        });
        document.addEventListener('change', event => {
            if (!this.current) return;
            if (event.target.id === 'condition') {
                this.save({ variant: event.target.checked, section: 'experiment' });
                document.querySelector('.course-figure').innerHTML = this.figure(this.current, event.target.checked);
            }
            if (event.target.name === 'answer') this.save({ answer: Number(event.target.value), section: 'check' });
        });
        window.addEventListener('scroll', () => {
            if (!this.current || this.routing || this.scrollQueued) return;
            this.scrollQueued = true;
            requestAnimationFrame(() => {
                this.scrollQueued = false;
                if (!this.current || this.routing || !ProgressManager.getStorageStatus().saved) return;
                const current = document.getElementById(this.readingSection)?.getBoundingClientRect();
                if (current && current.top < innerHeight && current.bottom > 0) return;
                const section = ['story', 'experiment', 'check'].filter(id => document.getElementById(id).getBoundingClientRect().top <= innerHeight * .35).pop() || 'story';
                if (section !== this.readingSection) {
                    this.readingSection = section;
                    this.save({ section });
                }
            });
        }, { passive: true });
    }
};
if (typeof module !== 'undefined' && module.exports) module.exports = GuidedCourse;
if (typeof document !== 'undefined' && document.body.dataset.pilot === 'true') GuidedCourse.init();
