const BeginnerEngine = {
    lessons: [
        {
            id: 'starter-names',
            title: 'How does a name become a destination?',
            story: 'You know a friend by name, but a delivery driver needs an address. Websites have the same problem. You type a name such as shop.example.com; your device needs a network address before it can contact the website.',
            concept: 'DNS means Domain Name System. Think of it as a directory that helps find addresses for names. Your device asks a DNS resolver to find the answer. The resolver can reuse a saved answer or ask other DNS servers. An IP address identifies a network destination; it is not the page itself.',
            steps: ['You enter a website name', 'Your device asks for its address', 'DNS returns an address', 'Your device can now try to connect'],
            limit: 'The directory analogy ends here: DNS can return several answers, and saved answers expire. Finding an address does not prove that the website is working.',
            exercise: 'Say which job belongs to DNS: finding the address of the shop, or sending you the product page. Then imagine the address is correct but the shop server is turned off. Would a successful DNS lookup be enough?',
            answer: 'DNS helps find the address. The web service sends the page. A correct address alone cannot make an unavailable service respond.',
            afd: 'For Azure Front Door, DNS helps clients reach the edge service. A custom domain is the familiar name you choose for that service, such as shop.example.com.',
            question: 'What does DNS help a device find?',
            options: ['A network address for a name', 'The price of a product', 'The password for a website'],
            correct: 0
        },
        {
            id: 'starter-routes',
            title: 'How does a request get there and back?',
            story: 'A parcel may pass through several sorting centres before it reaches a shop. Network messages also travel in smaller pieces called packets. Routers choose where each packet should go next.',
            concept: 'An IP address is like a delivery address. A route tells a router the next step towards that address. A port identifies the service at the destination: HTTPS, the secure web protocol, normally uses port 443. The reply needs a working way back too.',
            steps: ['Your device sends a request', 'Routers forward packets', 'The destination service receives them', 'A response travels back'],
            limit: 'Packets are not physical parcels: they can be lost or arrive out of order. TCP, a transport protocol, handles ordering and retries; a connection can still fail. HTTP/3 uses a different transport called QUIC. We will start with the simpler TCP story.',
            exercise: 'Draw four boxes: your device, a router, a web service, and your device again. Draw both directions. If requests arrive but replies cannot get back, what would you notice?',
            answer: 'You might wait and eventually see a timeout. The server receiving your request is not enough: the response must reach you.',
            afd: 'Azure Front Door is a proxy: it receives a web request and, when needed, makes a separate request to the application server. That server is called the origin.',
            question: 'If a server receives a request but its response cannot return, what can happen?',
            options: ['The page must still load', 'The client waits and may time out', 'DNS automatically repairs the route'],
            correct: 1
        },
        {
            id: 'starter-edge',
            title: 'What does Azure Front Door do?',
            story: 'Imagine a shop with a helpful reception desk near its customers. The desk can serve a copy of a public brochure, direct a request to the right branch, and apply entry rules. Azure Front Door plays a similar role for websites and APIs.',
            concept: 'The edge is the distributed network where Front Door handles requests. An origin is the application or content server behind it. A cache stores reusable responses, such as a public image. A web application firewall (WAF) checks web requests against configured rules. TLS is the protocol that protects an HTTPS connection.',
            steps: ['Browser connects securely to Front Door', 'Configured request checks run', 'An eligible cached response can be reused', 'Otherwise Front Door contacts an origin'],
            limit: 'This is a simplified decision path, not a single physical reception desk. A cache hit does not contact the origin for that response. Personalised data needs careful cache rules. Client-to-edge and edge-to-origin connections are separate; origin HTTPS must also be configured correctly.',
            exercise: 'Explain the difference between the edge and the origin to a friend. Then decide whether a public logo and a private account balance should be treated as the same kind of cached content.',
            answer: 'Front Door is the edge entry point; the origin provides the application or content. A public logo can often be shared. A private balance must not be served from a shared cache to another person.',
            afd: 'You now have the core map: find the address, connect to the edge, check the request, use a safe cached response or contact an origin, and return the answer. The later modules explain each decision.',
            question: 'Which description fits an origin?',
            options: ['The DNS directory', 'The person opening the browser', 'The application or content server behind Front Door'],
            correct: 2
        }
    ],

    openings: {
        'net-fundamentals': 'You open a shop website and a page appears. This lesson separates the jobs behind that familiar moment: finding an address, making a connection, and requesting a page. Start with the story; the protocol names will become useful labels, not a memory test.',
        'azure-environment': 'Imagine organising a new shop: someone pays the bills, someone manages each room, and each branch has a location. Azure uses subscriptions, resource groups, and regions for different parts of this organisation.',
        'azure-vnets': 'A virtual network is a private address space for your Azure resources. Think of planning the rooms of a building before deciding which doors need locks. A subnet divides that address space; it is not automatically a security wall.',
        'azure-ip-addressing': 'Your application needs an address, just as a delivery needs a destination. Here you will distinguish addresses used privately inside a network from addresses reachable over the public internet.',
        nsgs: 'A security guard checks a visitor against a list of rules. A network security group does something narrower: it permits or denies network traffic using addresses, ports, and protocol. The first matching rule matters.',
        'azure-dns': 'A shop name stays familiar even when its address changes. DNS connects those two ideas. You will learn why a name can resolve differently inside a private network and on the public internet.',
        'load-balancing-overview': 'Several counters can serve the same queue. A load balancer distributes traffic, but different Azure services inspect different information. Start with what the application needs before choosing a service.',
        'frontdoor-basics': 'A customer should not need to know which application server is healthy. Front Door is the global entry point that makes routing and caching decisions on the customer request.',
        'vpn-connectivity': 'Your office and Azure can communicate across a public-internet encrypted tunnel or a private connectivity service. This lesson separates the path from the protection applied to traffic on that path.',
        'peering-endpoints': 'Two private neighbourhoods need a connecting road. VNet peering connects networks; a service endpoint changes how a subnet accesses a supported Azure service. They solve different problems.',
        'azure-bastion': 'An administrator needs a safe way to reach a virtual machine without giving that machine a public address. Bastion provides a managed connection path, while permissions and network rules still apply.',
        'nat-gateway': 'Many devices can share one outward-facing address. NAT Gateway translates outbound connections so services on the internet can reply to the right private connection.',
        'route-tables-udr': 'A signpost tells traffic where to go next. A user-defined route lets you choose a next hop, for example a firewall. A signpost alone does not create the destination or a working return path.',
        'frontdoor-advanced': 'The shop now needs its own domain name, secure connections, and different handling for different requests. This lesson adds those controls to the Front Door request path you already know.',
        'frontdoor-caching': 'Serving a nearby copy of a public image is quicker than asking the application every time. The difficult question is which responses can safely share a copy and when that copy becomes too old.',
        'frontdoor-waf': 'Some web requests are unwanted; others only look suspicious. A web application firewall applies configured rules. You will learn to distinguish observing a match from blocking a request.',
        'network-architecture': 'A growing set of applications needs shared services without losing clear boundaries. A hub-and-spoke design connects networks around a central hub, but traffic follows routes, not the drawing.',
        'az104-practice': 'A slow or failing application gives clues, not an instant diagnosis. This lesson brings the earlier concepts together so you can choose a useful next check instead of changing several settings at once.',
        'azure-firewall': 'Several networks need the same traffic policy. Azure Firewall provides central inspection, but traffic must actually be routed through it for its rules to matter.',
        'network-watcher': 'A diagram says how a network should work. Troubleshooting tools show evidence of what is configured or happening. Choose the tool that answers your next question, not the one with the most output.',
        'capstone-hub-spoke': 'You are designing a whole application path, not a collection of Azure icons. Bring together public entry, private connectivity, inspection, and recovery, then explain why each component is there.'
    },

    isBeginner() {
        return UIStateManager.get().experience !== 'full';
    },

    setExperience(experience) {
        if (!UIStateManager.setExperience(experience)) {
            app.showToast('Learning view was not saved. Check browser storage and try again.', 'error');
            return false;
        }
        document.body.classList.toggle('beginner-mode', this.isBeginner());
        if (app.currentModule) app.loadModule(app.currentModule.id, { tab: app.currentTab });
        else app.syncHashRoute();
        return true;
    },

    renderHome(container, modules) {
        const progress = ProgressManager.getProgress();
        const entry = id => progress.moduleMastery[id]?.contentReviewed === true;
        const starterIndex = this.lessons.findIndex(lesson => !entry(lesson.id));
        const started = this.lessons.some(lesson => entry(lesson.id)) || progress.lastVisited;
        const next = modules.find(module => !entry(module.id));
        const resume = modules.find(module => module.id === progress.lastVisited && !entry(module.id)) || next;
        const uiState = UIStateManager.get();
        const unitRoute = typeof UnitEngine !== 'undefined' ? UnitEngine.resumeRoute(modules, progress, uiState) : null;
        const resumeUnit = unitRoute?.moduleId ? UnitEngine.units(unitRoute.moduleId).find(unit => unit.id === unitRoute.unitId) : null;
        const choseModule = modules.some(module => module.id === uiState.lastModuleId || module.id === progress.lastVisited);
        const resumeStarter = starterIndex >= 0 && !choseModule;
        const route = resumeStarter ? `#start?lesson=${starterIndex}` : unitRoute ? LearningEngine.formatRoute(unitRoute) : resume ? `#${resume.id}` : '#visual-lab';
        container.innerHTML = `<section class="today-primary beginner-welcome">
            <h2 id="today-title">${started ? 'Keep learning at your pace' : 'You can start with no networking experience'}</h2>
            <p>${resumeStarter ? 'Begin with three short lessons. No Azure account, commands, or test required. Allow about 10 minutes each, including the try-it-yourself prompts.' : 'Read an explanation, explore it, then try a quick check. You can stop after one idea and return whenever you like.'}</p>
            <button type="button" class="btn-primary" data-beginner-action="start" data-route="${route}">${started ? 'Continue learning' : 'Start from zero'}</button>
            ${!resumeStarter && resumeUnit ? `<p class="resume-detail"><strong>${LearningEngine.escapeHtml(resumeUnit.title)}</strong><br>${LearningEngine.escapeHtml({ learn: 'Learn the idea', try: 'Try it', check: 'Quick check', reference: 'Full reference' }[unitRoute.tab] || 'Extra practice')} · about ${resumeUnit.minutes} min for the full unit</p><p>${LearningEngine.escapeHtml(resumeUnit.outcome)}</p>` : ''}
            <details class="placement-choice"><summary>Already know some networking?</summary><button type="button" class="btn-secondary" data-mastery-action="open-diagnostic">Take the placement test</button><p>The test suggests a starting point. It is optional and does not lock any lesson.</p></details>
            <p class="learning-meta">${this.lessons.filter(lesson => entry(lesson.id)).length} of 3 starter lessons read${typeof UnitEngine !== 'undefined' ? ` · ${modules.flatMap(module => UnitEngine.units(module.id).filter(unit => UnitEngine.unitStatus(module.id, unit, progress).checked)).length} short units checked` : ''}</p>
            <section class="beginner-route" aria-label="Your path from zero to applied understanding">
                <h3>Build one mental model, then add depth</h3>
                <ol>
                    <li><span class="route-number">01</span><div><a href="#start?lesson=0">Start with a name and a request</a><small>Explain addresses, routes and replies in everyday language.</small></div></li>
                    <li><span class="route-number">02</span><div><a href="#net-fundamentals">Learn the network underneath</a><small>Follow DNS and connections, then explore VNets and filtering.</small></div></li>
                    <li><span class="route-number">03</span><div><a href="#frontdoor-basics">Understand Front Door</a><small>Learn the edge decisions, then explore them in the <a href="#visual-lab">AFD request lab</a>.</small></div></li>
                    <li><span class="route-number">04</span><div><a href="#frontdoor-advanced">Add depth when you are ready</a><small>Explore routing, caching, security, and eventually a complete application design.</small></div></li>
                </ol>
                <p class="learning-meta">Move on when you can explain the idea without looking. Revisit a scenario after a week; reading a page is not the same as remembering it.</p>
            </section>
        </section>`;
    },

    renderStarter(index = 0) {
        this.lessonIndex = Number.isInteger(index) && index >= 0 && index < this.lessons.length ? index : 0;
        const lesson = this.lessons[this.lessonIndex];
        const escape = value => LearningEngine.escapeHtml(value);
        document.getElementById('destinationView').innerHTML = `<article id="starterLesson" class="starter-lesson">
            <p id="starterPosition">Lesson ${this.lessonIndex + 1} of 3</p>
            <h1 id="destinationTitle" tabindex="-1">${escape(lesson.title)}</h1>
            <p class="beginner-story">${escape(lesson.story)}</p>
            <section id="starterVisual" class="starter-visual" aria-label="Change one condition in the request journey"></section>
            <section id="starterConcept"><h2>The idea</h2><p>${escape(lesson.concept)}</p></section>
            <ol class="beginner-path" aria-label="Simplified request journey">${lesson.steps.map(step => `<li>${escape(step)}</li>`).join('')}</ol>
            <p class="learning-meta">${escape(lesson.limit)}</p>
            <h2>Try explaining it</h2><p>${escape(lesson.exercise)}</p>
            <details><summary>Compare your explanation</summary><p>${escape(lesson.answer)}</p></details>
            <h2>How this connects to Front Door</h2><p>${escape(lesson.afd)}</p>
            <p class="learning-meta">All names here are fictional. You do not need to contact a website or deploy anything.</p>
            <div class="learning-actions">${this.lessonIndex ? `<a class="btn-secondary" href="#start?lesson=${this.lessonIndex - 1}">Previous lesson</a>` : ''}
            <button class="btn-primary" type="button" data-beginner-action="starter-done">Done reading</button>
            </div>
            <p id="starterFeedback" role="status"></p>
        </article>`;
        this.renderStarterVisual(0);
    },

    renderStarterVisual(condition) {
        const examples = [
            {
                choices: ['Working website', 'Server unavailable'],
                nodes: ['Website name', 'Directory reply (DNS)', 'Connection attempt', 'Web page'],
                outcomes: [
                    'The resolver finds an address. A separate connection lets the web service return a page. DNS is not carrying the page.',
                    'DNS succeeded, but the service cannot be reached. Knowing the correct address does not guarantee a working website.'
                ],
                changed: ['Name entered', 'Address found', 'Cannot connect', 'No page returned']
            },
            {
                choices: ['Reply can return', 'Return route missing'],
                nodes: ['Your device', 'Forward route', 'Web service', 'Reply at your device'],
                outcomes: [
                    'The request reaches the service and its reply reaches you. Both directions must work; their exact routes need not be identical.',
                    'The request reaches the service, but the reply has no working route back. Your device waits and can time out.'
                ],
                changed: ['Request sent', 'Request forwarded', 'Reply sent', 'Reply cannot return']
            },
            {
                choices: ['No stored copy', 'Public logo already stored'],
                nodes: ['Your browser', 'Front Door: the reception desk', 'Application server: the origin', 'Response to your browser'],
                outcomes: [
                    'For this allowed request with no reusable copy, Front Door makes a separate request to the origin and returns its response.',
                    'Front Door can return the fresh, shareable logo from its edge cache. The origin is not contacted for this response; a private account balance needs different cache handling.'
                ],
                changed: ['Browser', 'Edge has the logo', 'Origin not contacted', 'Cached response returned']
            }
        ];
        const visual = examples[this.lessonIndex];
        const escape = value => LearningEngine.escapeHtml(value);
        document.getElementById('starterVisual').innerHTML = `<h3>See what changes</h3>
            <div class="starter-conditions">${visual.choices.map((choice, index) => `<button type="button" class="btn-secondary" data-beginner-action="starter-condition" data-condition="${index}" aria-pressed="${condition === index}">${escape(choice)}</button>`).join('')}</div>
            <ol class="starter-nodes" aria-label="A simplified journey">${(condition ? visual.changed : visual.nodes).map((node, index) =>
                `<li data-state="${condition && index === (this.lessonIndex === 2 ? 2 : 3) ? 'unused' : 'active'}"><span aria-hidden="true">${index + 1}</span>${escape(node)}</li>`).join('')}</ol>
            <p id="starterVisualOutcome" role="status" aria-live="polite">${escape(visual.outcomes[condition])}</p>
            <p class="learning-meta">A teaching sketch, not a live network. Choose the other condition to compare.</p>`;
        if (document.activeElement === document.body && condition) document.querySelector(`[data-beginner-action="starter-condition"][data-condition="${condition}"]`)?.focus({ preventScroll: true });
    },

    finishStarter() {
        const lesson = this.lessons[this.lessonIndex];
        if (!lesson || !this.saveReading(lesson.id)) return;
        window.location.hash = this.lessonIndex < 2 ? `#start?lesson=${this.lessonIndex + 1}` : '#start?finished=1';
    },

    renderStarterComplete() {
        document.getElementById('destinationView').innerHTML = `<article id="starterComplete" class="starter-lesson">
            <h1 id="destinationTitle" tabindex="-1">You have the first pieces of the map</h1>
            <p>You have met the ideas behind a web request: find an address, connect, reach the edge, and get a response from a cache or an origin.</p>
            <p>You do not need to remember every new term yet. Try explaining the journey in your own words. The next lesson adds detail to this same story.</p>
            <div class="learning-actions"><a class="btn-primary" href="#net-fundamentals">Continue to Networking Fundamentals</a></div>
            <p>Want to see the story in motion first? <a href="#visual-lab">Explore the AFD request lab</a>, without an Azure account.</p>
            <a href="#start?lesson=0">Revisit the three starter lessons</a>
        </article>`;
    },

    saveReading(id) {
        ProgressManager.markContentReviewed(id);
        const status = ProgressManager.getStorageStatus();
        if (!status.saved || status.recoveryRequired) {
            LearningEngine.renderStorageStatus();
            app.showToast('Reading progress is not saved. Retry saving or export a backup before leaving.', 'error');
            return false;
        }
        return true;
    },

    checkQuestions(module) {
        return module.id === 'net-fundamentals' ? this.lessons : (module.quiz || []).slice(0, 3);
    },

    renderModule(module) {
        const escape = value => LearningEngine.escapeHtml(value);
        const host = document.getElementById('tab-learn');
        host.insertAdjacentHTML('afterbegin', `<section id="beginnerOpening" class="learn-section beginner-opening">
            <h2>Start with the everyday idea</h2><p>${escape(this.openings[module.id] || module.subtitle)}</p>
            <p class="learning-meta">Learn the idea here. Then use Try it to explore, and Quick check for three low-pressure questions. No Azure account needed.</p>
        </section>`);
        const savedSection = UIStateManager.get().lastSectionByModule[module.id];
        const sections = app.parseSections(module);
        const section = sections.find((item, index) => index > 1 && item.slug === savedSection);
        if (section) document.getElementById('beginnerOpening').insertAdjacentHTML('beforeend',
            `<button type="button" class="btn-secondary resume-section" data-app-action="navigate-section" data-section-id="${escape(section.slug)}">Continue at: ${escape(section.title)}</button>`);
        host.insertAdjacentHTML('beforeend', `<button id="doneReadingInline" type="button" class="btn-secondary" data-app-action="complete-module">${ProgressManager.getProgress().moduleMastery[module.id]?.contentReviewed ? 'Reading saved - explore again' : 'Done reading'}</button>`);
        const questions = this.checkQuestions(module);
        const markup = `<section id="beginnerCheck" class="learn-section"><h2>Check your understanding</h2>
            <p>Three low-pressure questions. These are practice, not a module quiz or mastery award.</p>
            ${questions.map((question, index) => `<fieldset><legend>${escape(question.question)}${Array.isArray(question.correct) ? ' Choose all that apply.' : ''}</legend>${question.options.map((option, choice) =>
                `<label class="learning-choice"><input type="${Array.isArray(question.correct) ? 'checkbox' : 'radio'}" name="beginner-check-${index}" value="${choice}"><span>${escape(option)}</span></label>`).join('')}</fieldset>`).join('')}
            <button type="button" class="btn-primary" data-beginner-action="check">Check my understanding</button>
            <div id="beginnerCheckFeedback" role="status" aria-live="polite"></div>
            <p>These questions do not award quiz or applied-skill credit. You can revisit the explanation at any time.</p>
        </section>`;
        document.getElementById('quickCheckHost').innerHTML = markup;
        document.getElementById('completeModule').textContent = ProgressManager.getProgress().moduleMastery[module.id]?.contentReviewed ? 'Reading done - review again' : 'Done reading';
    },

    checkUnderstanding() {
        const questions = this.checkQuestions(app.currentModule);
        const answers = questions.map((_, index) => Array.from(document.querySelectorAll(`input[name="beginner-check-${index}"]:checked`), input => Number(input.value)));
        const feedback = document.getElementById('beginnerCheckFeedback');
        if (answers.some(answer => answer.length === 0)) {
            feedback.textContent = 'Choose an answer for each question, then try again.';
            return;
        }
        const correct = questions.filter((question, index) => {
            const expected = Array.isArray(question.correct) ? question.correct : [question.correct];
            return answers[index].length === expected.length && expected.every(value => answers[index].includes(value));
        }).length;
        feedback.innerHTML = `<p>${correct} of ${questions.length} correct. ${correct === questions.length ? 'You have the main ideas. Keep going.' : 'Use the explanations below and try again. Getting this wrong is part of learning.'}</p>
            <ol>${questions.map(question => `<li>${LearningEngine.escapeHtml(question.explanation || question.answer)}</li>`).join('')}</ol>
            ${correct === questions.length ? `<p>You answered the three questions in ${LearningEngine.escapeHtml(app.currentModule.title)}. Try explaining the ideas without looking. The worked case below is optional.</p>${app.currentModule.id === MODULES[MODULES.length - 1].id ? '<button type="button" class="btn-primary" data-app-action="show-dashboard">Return to your path</button>' : '<button type="button" class="btn-primary" data-app-action="next-module">Continue to the next lesson</button>'}` : '<button type="button" class="btn-secondary" data-app-action="switch-tab" data-tab="learn">Revisit the explanation</button>'}`;
    },

    finishReading(module) {
        if (!this.saveReading(module.id)) return;
        document.getElementById('completeModule').textContent = 'Reading done - review again';
        document.getElementById('doneReadingInline').textContent = 'Reading saved - explore again';
        app.updateProgress();
        app.switchTab('try');
        app.showToast('Reading saved. Explore the idea next, or stop here and return later.', 'success');
    },

    init() {
        document.body.classList.toggle('beginner-mode', this.isBeginner());
        document.addEventListener('click', event => {
            const control = event.target.closest('[data-beginner-action]');
            if (!control) return;
            switch (control.dataset.beginnerAction) {
                case 'start': window.location.hash = control.dataset.route; break;
                case 'starter-done': this.finishStarter(); break;
                case 'starter-condition': this.renderStarterVisual(Number(control.dataset.condition)); break;
                case 'check': this.checkUnderstanding(); break;
                case 'toggle': this.setExperience(this.isBeginner() ? 'full' : 'beginner'); break;
            }
        });
    }
};

if (typeof module !== 'undefined' && module.exports) module.exports = BeginnerEngine;
