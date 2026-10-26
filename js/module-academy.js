/* Full chapters are the course; short lessons remain accessible without replacing them. */
const ModuleAcademy = {
    levels: [
        { level: 100, title: 'Foundations', description: 'Understand protocols, Azure resources, addresses, and virtual networks.' },
        { level: 200, title: 'Connect, protect, and deliver', description: 'Work through traffic rules, DNS, connectivity, load balancing, and Front Door.' },
        { level: 300, title: 'Configuration, operations, and architecture', description: 'Study routing decisions, caching, WAF, troubleshooting, and the hub-spoke capstone.' }
    ],
    order: [
        'net-fundamentals', 'azure-environment', 'azure-ip-addressing', 'azure-vnets',
        'nsgs', 'azure-dns', 'load-balancing-overview', 'frontdoor-basics',
        'peering-endpoints', 'route-tables-udr', 'nat-gateway', 'vpn-connectivity', 'azure-bastion',
        'frontdoor-advanced', 'frontdoor-caching', 'frontdoor-waf', 'azure-firewall',
        'network-architecture', 'network-watcher', 'az104-practice', 'capstone-hub-spoke'
    ],
    enabled() { return document.body.classList.contains('module-academy'); },
    escape(value) { return LearningEngine.escapeHtml(value); },
    resume(modules) {
        const state = UIStateManager.get();
        const progress = ProgressManager.getProgress();
        const saved = modules.find(module => module.id === state.lastModuleId);
        const module = saved || modules.find(item => !progress.moduleMastery?.[item.id]?.contentReviewed) || modules[0];
        const tab = saved && ['learn', 'diagrams', 'interactive', 'quiz', 'lab', 'check'].includes(state.lastTabByModule[module.id])
            ? state.lastTabByModule[module.id] : 'learn';
        return { module, tab };
    },
    normalizeRoute(modules) {
        if (this.redirecting) return false;
        const hash = location.hash.slice(1);
        const params = new URLSearchParams(hash);
        if (params.has('lesson')) {
            this.redirecting = true;
            location.replace('guided.html#' + hash);
            return false;
        }
        if (params.has('reference')) {
            const id = params.get('reference');
            if (modules.some(module => module.id === id)) {
                history.replaceState(null, '', LearningEngine.formatRoute({ moduleId: id, sectionId: params.get('section'), tab: 'learn' }));
            }
        } else if (['continue', 'progress'].includes(hash)) {
            const { module, tab } = this.resume(modules);
            history.replaceState(null, '', hash === 'progress' ? '#more' : LearningEngine.formatRoute({ moduleId: module.id, tab }));
        }
        return true;
    },
    init(modules) {
        if (!this.normalizeRoute(modules)) return false;
        for (const module of modules.filter(item => !item.diagrams?.length)) {
            const template = document.createElement('template');
            template.innerHTML = module.learn;
            module.diagrams = [...template.content.querySelectorAll('[data-diagram-model]')].map((el, index) => ({
                id: `${module.id}-chapter-${index}`, type: el.dataset.diagramModel,
                scenario: el.dataset.diagramScenario, title: module.title, description: module.subtitle
            }));
            if (!module.diagrams.length && module.id === 'az104-practice') {
                module.diagrams = [{ id: 'scenario-evidence', type: 'network-watcher', title: 'Choose the right troubleshooting evidence', description: module.subtitle }];
            }
            if (!module.diagrams.length && module.id === 'azure-ip-addressing') {
                module.diagrams = [{ id: 'address-boundaries', type: 'vnet-architecture', title: 'Private addresses within a virtual network', description: 'Locate private addresses and subnet boundaries. Public addressing and address lifetime are explained in the chapter.' }];
            }
            if (!module.diagrams.length && module.id === 'azure-dns') {
                module.diagrams = [{ id: 'public-dns-lookup', type: 'dns-resolution', title: 'Follow a public DNS lookup', description: 'Use this public lookup as a baseline, then compare it with the Private Endpoint and hybrid DNS sections of the chapter.' }];
            }
        }
        IllustratedDiagrams.init?.();
        return true;
    },
    renderHome(container, modules) {
        const { module, tab } = this.resume(modules);
        const progress = ProgressManager.getProgress();
        const started = Boolean(UIStateManager.get().lastModuleId);
        container.innerHTML = `<section class="module-welcome">
            <h2>A complete course in Azure networking</h2>
            <p class="module-lead">Study the full explanations, architectures, configuration examples, and tradeoffs. Then explore the diagrams, work through exercises, and test what you can explain.</p>
            <a class="btn-primary module-resume" href="${this.escape(LearningEngine.formatRoute({ moduleId: module.id, tab }))}">${started ? 'Continue' : 'Start L100'}: ${this.escape(module.title)}</a>
            <p class="module-study-note">New to networking? <a href="#start?lesson=0">Take the three introductory lessons first.</a> They introduce the vocabulary; the full modules below are your course.</p>
        </section>
        <section class="module-study-method" aria-labelledby="study-method-title">
            <h2 id="study-method-title">How to work through a module</h2>
            <p><strong>Read the chapter</strong> and follow its architecture. <strong>Explore the diagrams and exercises</strong> to see what changes. <strong>Take the full quiz</strong>, then work through the case or lab. Stop between sections and resume where you left off.</p>
            <p>Local exercises need no Azure subscription. Azure lab steps are separate and can incur charges; review each lab's prerequisites, cost, and cleanup guidance.</p>
        </section>
        <div class="module-curriculum">${this.levels.map(stage => {
            const group = modules.filter(item => item.level === stage.level);
            return `<section class="module-level" aria-labelledby="level-${stage.level}-title">
                <header><h2 id="level-${stage.level}-title"><span>L${stage.level}</span> ${stage.title}</h2><p>${stage.description}</p></header>
                <ol>${group.map(item => `<li><a href="#${item.id}"><span class="module-row-title">${this.escape(item.title)}</span><span class="module-row-description">${this.escape(item.subtitle)}</span></a>
                    <span class="module-row-meta">${this.escape(item.estimatedTime || '')}${progress.moduleMastery?.[item.id]?.contentReviewed ? ' · Reading saved' : ''}</span></li>`).join('')}</ol>
            </section>`;
        }).join('')}</div>`;
    },
    prepareModule(module) {
        const host = document.getElementById('tab-learn');
        const opening = document.createElement('section');
        opening.className = 'module-orientation';
        opening.innerHTML = `<h2>Before you begin</h2><p>${this.escape(BeginnerEngine.openings[module.id] || module.subtitle)}</p>
            <p><strong>In this module:</strong> ${this.escape(module.subtitle)}. Read the full chapter below; its worked case comes after the explanation.</p>`;
        host.prepend(opening);
        const supporting = typeof CourseDepth !== 'undefined' ? CourseDepth[module.id] : null;
        if (supporting) {
            const section = document.createElement('section');
            section.className = 'learn-section module-operations';
            section.innerHTML = `<h2>${this.escape(supporting.title)}</h2>${supporting.paragraphs.map(text => `<p>${this.escape(text)}</p>`).join('')}
                <h3>${this.escape(supporting.example.title)}</h3><p>${this.escape(supporting.example.text)}</p>`;
            const coaching = host.querySelector('#moduleCoaching');
            if (coaching) coaching.before(section);
            else host.append(section);
        }
        host.insertAdjacentHTML('beforeend', `<div class="module-reading-end"><button type="button" class="btn-primary" data-app-action="complete-module">Save reading and explore diagrams</button>
            <p>Reading, quiz results, and lab practice are separate records. Saving reading does not mark the module mastered.</p></div>`);
        document.querySelectorAll('.module-tabs [data-tab]').forEach(button => {
            const available = { diagrams: module.diagrams?.length, interactive: module.interactive?.length, quiz: module.quiz?.length, lab: module.lab }[button.dataset.tab];
            button.hidden = button.dataset.tab !== 'learn' && !available;
        });
    },
    finishReading(module) {
        if (!BeginnerEngine.saveReading(module.id)) return;
        document.getElementById('completeModule').textContent = 'Reading saved';
        app.updateProgress();
        app.switchTab('diagrams');
        app.showToast('Reading saved. Your quiz and lab records are unchanged.', 'success');
    },
    progressHtml(modules, progress) {
        return `<section class="module-progress-summary"><h2>Your module progress</h2>
            <p>Reading records show what you have covered. Quiz results and practice records show different kinds of evidence; none alone proves production experience.</p>
            <div class="module-record-table"><table class="content-table"><thead><tr><th scope="col">Module</th><th scope="col">Reading</th><th scope="col">Quiz</th><th scope="col">Lab</th></tr></thead><tbody>${modules.map(module => {
                const score = progress.quizScores?.[module.id];
                return `<tr><th scope="row"><a href="#${module.id}">${this.escape(module.title)}</a></th><td>${progress.moduleMastery?.[module.id]?.contentReviewed ? 'Saved' : 'Not recorded'}</td>
                    <td>${score ? `${this.escape(score.score)} / ${this.escape(score.total)}` : 'Not attempted'}</td><td>${progress.completedLabs?.includes(module.id) ? 'Recorded' : 'Not recorded'}</td></tr>`;
            }).join('')}</tbody></table></div>
            <p><a href="guided.html#progress">View saved short-course answers and explanations</a>. Those records are preserved separately, not converted into full-module completion.</p></section>`;
    }
};
