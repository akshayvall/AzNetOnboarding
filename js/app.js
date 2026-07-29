/* ============================================
   MAIN APP CONTROLLER
   ============================================ */

// Combine all modules into single array.
// Insert MODULES_EXTRAS items into the correct level groups so the order is:
//   L100 (built-in), L200 (built-in + extras), L300 (built-in + extras)
const _EXTRAS = (typeof MODULES_EXTRAS !== 'undefined') ? MODULES_EXTRAS : [];
const MODULES = [
    ...MODULES_100,
    ...MODULES_200,
    ..._EXTRAS.filter(m => m.level === 200),
    ...MODULES_300,
    ..._EXTRAS.filter(m => m.level === 300),
];
const WORKFLOW_PROTOTYPE_ID = 'frontdoor-advanced';
const _sectionCache = {};

const app = {
    currentModule: null,
    currentTab: 'learn',
    mobileNavOpener: null,
    pendingSection: null,
    sectionObserver: null,

    init() {
        this.buildNavigation();
        this.updateProgress();
        this.bindEvents();
        this.registerServiceWorker();
        MasteryEngine.init(MODULES);
        const hash = window.location.hash.slice(1);
        const module = hash ? MODULES.find(item => item.id === hash) : null;
        if (module) this.loadModule(module.id);
        else this.showDashboard();
    },

    slugify(text) {
        return text.toLowerCase().trim()
            .replace(/&[^;]+;/g, '')
            .replace(/<[^>]+>/g, '')
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    },

    parseSections(module) {
        if (_sectionCache[module.id]) return _sectionCache[module.id];
        const sections = [];
        const headingPattern = /<h2[^>]*>([\s\S]*?)<\/h2>/gi;
        let match;
        while ((match = headingPattern.exec(module.learn || '')) !== null) {
            const title = match[1].replace(/<[^>]+>/g, '').trim();
            if (title) sections.push({ slug: this.slugify(title), title });
        }
        _sectionCache[module.id] = sections;
        return sections;
    },

    injectSectionIds(module) {
        const sections = this.parseSections(module);
        document.querySelectorAll('#tab-learn h2').forEach(heading => {
            const slug = this.slugify(heading.textContent);
            if (sections.some(section => section.slug === slug)) heading.id = `section-${slug}`;
        });
    },

    navigateToSection(moduleId, sectionId) {
        if (!moduleId || !sectionId) return;
        this.pendingSection = sectionId;
        if (this.sectionObserver) this.sectionObserver.disconnect();
        if (this.currentModule?.id === moduleId) {
            this.switchTab('learn');
            this.scrollToSection(sectionId);
            this.observeAfterScroll(moduleId);
            return;
        }
        this.loadModule(moduleId);
    },

    scrollToSection(sectionId) {
        const target = document.getElementById(`section-${sectionId}`);
        if (!target) return;
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (this.currentModule) UIStateManager.saveSection(this.currentModule.id, sectionId);
        this.updateOutlinePosition(sectionId);
        this.pendingSection = null;
    },

    observeSections(moduleId) {
        if (this.sectionObserver) this.sectionObserver.disconnect();
        this.sectionObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting || !this.currentModule) return;
                const sectionId = entry.target.id.replace('section-', '');
                UIStateManager.saveSection(moduleId, sectionId);
                this.updateOutlinePosition(sectionId);
            });
        }, { root: document.getElementById('content'), rootMargin: '0px 0px -60% 0px', threshold: 0.1 });
        document.querySelectorAll('#tab-learn h2[id^="section-"]').forEach(heading => this.sectionObserver.observe(heading));
    },

    observeAfterScroll(moduleId) {
        const content = document.getElementById('content');
        let started = false;
        const start = () => {
            if (started) return;
            started = true;
            this.observeSections(moduleId);
        };
        content.addEventListener('scrollend', start, { once: true });
        setTimeout(start, 800);
    },

    updateOutlinePosition(sectionId) {
        document.querySelectorAll('#sectionOutlineList button').forEach(button => {
            const active = button.dataset.sectionId === sectionId;
            button.classList.toggle('active', active);
            if (active) button.setAttribute('aria-current', 'location');
            else button.removeAttribute('aria-current');
        });
    },

    // ─── NAVIGATION ──────────────────────────────
    buildNavigation() {
        const levels = { 100: 'nav-level-100', 200: 'nav-level-200', 300: 'nav-level-300' };
        
        for (const [level, containerId] of Object.entries(levels)) {
            const container = document.getElementById(containerId);
            const levelModules = MODULES.filter(m => m.level === parseInt(level));
            
            container.innerHTML = levelModules.map(mod => {
                const status = ProgressManager.getModuleStatus(mod.id);
                const metadata = MasteryEngine.getMetadata(mod.id);
                const mastery = metadata ? MasteryEngine.getStatus(mod) : null;
                const classes = [
                    mastery && MasteryEngine.STATE_RANK[mastery.state] >= MasteryEngine.STATE_RANK.practiced
                        ? 'completed' : status.completed ? 'completed' : '',
                ].filter(Boolean).join(' ');
                const timeLabel = mod.estimatedTime ? `<span style="font-size:10px;color:#888;margin-left:auto;white-space:nowrap">⏱ ${mod.estimatedTime}</span>` : '';
                
                return `<li class="${classes}" data-module="${this.escapeAttr(mod.id)}">
                    <button type="button" class="module-link" data-app-action="load-module" data-module-id="${this.escapeAttr(mod.id)}">
                        <span style="flex:1">${mod.icon} ${mod.title}</span>${timeLabel}
                    </button>
                </li>`;
            }).join('');
        }
    },

    bindEvents() {
        if (this.eventsBound) return;
        this.eventsBound = true;

        document.addEventListener('click', event => {
            const control = event.target.closest('[data-app-action]');
            if (control) this.handleAppAction(control);
        });

        document.getElementById('resetProgress').addEventListener('click', () => {
            if (confirm('Reset ALL progress? This cannot be undone.')) {
                ProgressManager.resetAll();
                this.buildNavigation();
                this.updateProgress();
                this.showDashboard();
                this.showToast('Progress reset', 'warning');
            }
        });

        document.getElementById('exportProgress').addEventListener('click', () => {
            ProgressManager.exportProgress();
            this.showToast('Progress exported!', 'success');
        });

        document.getElementById('importProgress').addEventListener('click', () => {
            document.getElementById('importFile').click();
        });

        document.getElementById('importFile').addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            try {
                await ProgressManager.importProgress(file);
                this.buildNavigation();
                this.updateProgress();
                this.showDashboard();
                this.showToast('Progress imported!', 'success');
            } catch (err) {
                this.showToast('Invalid progress file', 'error');
            }
            e.target.value = '';
        });

        // Search palette (Ctrl+K / Cmd+K)
        const openSearchBtn = document.getElementById('openSearch');
        if (openSearchBtn) openSearchBtn.addEventListener('click', () => this.openSearch());
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
                e.preventDefault();
                this.openSearch();
            } else if (e.key === 'Escape') {
                this.closeSearch();
                this.closeMobileNav();
            } else if (e.key === 'Tab') {
                this.trapMobileNavFocus(e);
            }
        });
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', () => this.renderSearchResults(searchInput.value));
            searchInput.addEventListener('keydown', (e) => this.handleSearchKey(e));
        }

        // Mobile nav toggle
        const toggle = document.getElementById('mobileNavToggle');
        if (toggle) {
            toggle.addEventListener('click', () => this.toggleMobileNav());
        }
        window.addEventListener('resize', () => this.syncMobileNav());
        this.syncMobileNav();
    },

    handleAppAction(control) {
        switch (control.dataset.appAction) {
            case 'start-level':
                this.startLevel(Number(control.dataset.level));
                break;
            case 'show-dashboard':
                this.showDashboard();
                break;
            case 'switch-tab':
                this.switchTab(control.dataset.tab);
                break;
            case 'prev-module':
                this.prevModule();
                break;
            case 'complete-module':
                this.completeModule();
                break;
            case 'next-module':
                this.nextModule();
                break;
            case 'load-module':
                this.loadModule(control.dataset.moduleId);
                break;
            case 'pick-search':
                this.pickSearch(control.dataset.id);
                break;
            case 'close-search':
                this.closeSearch();
                break;
            case 'set-module-mode':
                this.setModuleMode(control.dataset.moduleMode);
                break;
            case 'open-evidence':
                this.openEvidence(control.dataset.evidenceTarget);
                break;
            case 'navigate-section':
                this.navigateToSection(this.currentModule?.id, control.dataset.sectionId);
                break;
            case 'close-mobile-nav':
                this.closeMobileNav();
                break;
            case 'navigate-destination':
                this.navigateDestination(control.dataset.destination);
                break;
            case 'print-cheat-sheet':
                this.printCheatSheet();
                break;
            case 'toggle-accordion': {
                const item = control.closest('.accordion-item');
                if (!item) return;
                const isOpen = item.classList.toggle('open');
                control.setAttribute('aria-expanded', String(isOpen));
                break;
            }
        }
    },

    isMobileNav() {
        return window.matchMedia('(max-width: 768px)').matches;
    },

    openMobileNav() {
        if (!this.isMobileNav()) return;
        const sidebar = document.getElementById('sidebar');
        const backdrop = document.getElementById('navBackdrop');
        const toggle = document.getElementById('mobileNavToggle');
        this.mobileNavOpener = document.activeElement;
        sidebar.removeAttribute('aria-hidden');
        sidebar.inert = false;
        sidebar.classList.add('mobile-open');
        backdrop.hidden = false;
        document.body.classList.add('nav-drawer-open');
        toggle.setAttribute('aria-expanded', 'true');
        const firstControl = sidebar.querySelector('button, a, input');
        if (firstControl) firstControl.focus({ preventScroll: true });
    },

    closeMobileNav(restoreFocus = true) {
        const sidebar = document.getElementById('sidebar');
        if (!sidebar.classList.contains('mobile-open')) return;
        const backdrop = document.getElementById('navBackdrop');
        const toggle = document.getElementById('mobileNavToggle');
        sidebar.classList.remove('mobile-open');
        backdrop.hidden = true;
        document.body.classList.remove('nav-drawer-open');
        toggle.setAttribute('aria-expanded', 'false');
        if (restoreFocus && this.mobileNavOpener && this.mobileNavOpener.isConnected) this.mobileNavOpener.focus();
        else if (restoreFocus) toggle.focus();
        if (this.isMobileNav()) {
            sidebar.setAttribute('aria-hidden', 'true');
            sidebar.inert = true;
        }
        this.mobileNavOpener = null;
    },

    toggleMobileNav() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar.classList.contains('mobile-open')) this.closeMobileNav();
        else this.openMobileNav();
    },

    trapMobileNavFocus(event) {
        const sidebar = document.getElementById('sidebar');
        if (!sidebar.classList.contains('mobile-open')) return;
        const controls = Array.from(sidebar.querySelectorAll('button:not([disabled]), a[href], input:not([disabled])'));
        if (!controls.length) return;
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    },

    syncMobileNav() {
        const sidebar = document.getElementById('sidebar');
        const backdrop = document.getElementById('navBackdrop');
        if (this.isMobileNav()) {
            if (!sidebar.classList.contains('mobile-open')) {
                sidebar.setAttribute('aria-hidden', 'true');
                sidebar.inert = true;
            }
            return;
        }
        sidebar.classList.remove('mobile-open');
        sidebar.removeAttribute('aria-hidden');
        sidebar.inert = false;
        backdrop.hidden = true;
        document.body.classList.remove('nav-drawer-open');
        document.getElementById('mobileNavToggle').setAttribute('aria-expanded', 'false');
    },

    navigateDestination(destination) {
        UIStateManager.setDestination(destination);
        document.querySelectorAll('.bottom-nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.destination === destination);
        });
        if (destination === 'today') {
            this.closeMobileNav(false);
            this.showDashboard();
            return;
        }
        this.openMobileNav();
    },

    isWorkflowPrototype(moduleId) {
        return moduleId === WORKFLOW_PROTOTYPE_ID;
    },

    setModuleMode(mode) {
        if (!this.currentModule || !this.isWorkflowPrototype(this.currentModule.id)) return;
        const normalizedMode = mode === 'browse' ? 'browse' : 'guided';
        const moduleView = document.getElementById('moduleView');
        moduleView.classList.toggle('guided-mode', normalizedMode === 'guided');
        moduleView.classList.toggle('browse-mode', normalizedMode === 'browse');
        document.querySelectorAll('[data-module-mode]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.moduleMode === normalizedMode)));
    },

    openEvidence(target) {
        const disclosure = document.querySelector('#masteryPanel .evidence-disclosure');
        if (!disclosure) return;
        disclosure.open = true;
        disclosure.dataset.focusTarget = target || 'evidence';
        disclosure.scrollIntoView({ behavior: 'smooth', block: 'start' });
        disclosure.querySelector('summary')?.focus();
    },

    renderSectionOutline(module) {
        const outline = document.getElementById('sectionOutline');
        const list = document.getElementById('sectionOutlineList');
        const sections = this.isWorkflowPrototype(module.id) ? this.parseSections(module) : [];
        outline.hidden = sections.length === 0;
        if (!sections.length) {
            list.innerHTML = '';
            return;
        }
        list.innerHTML = sections.map(section => `<li><button type="button" data-app-action="navigate-section" data-section-id="${this.escapeAttr(section.slug)}">${this.escapeHtml(section.title)}</button></li>`).join('');
        outline.open = !window.matchMedia('(max-width: 1023px)').matches;
    },

    renderInlineCoreVisual(module) {
        document.getElementById('inlineCoreVisual')?.remove();
        if (!this.isWorkflowPrototype(module.id) || !module.diagrams?.length || typeof DiagramEngine.renderPreview !== 'function') return;
        const firstSection = document.querySelector('#tab-learn .learn-section');
        if (!firstSection) return;
        const preview = document.createElement('section');
        preview.id = 'inlineCoreVisual';
        preview.className = 'inline-core-visual';
        preview.setAttribute('aria-label', 'Core visual');
        firstSection.insertAdjacentElement('afterend', preview);
        DiagramEngine.renderPreview(module.diagrams[0], preview);
    },

    configureModuleExperience(module) {
        const enabled = this.isWorkflowPrototype(module.id);
        const moduleView = document.getElementById('moduleView');
        document.getElementById('moduleModeBar').hidden = !enabled;
        moduleView.classList.toggle('workflow-prototype', enabled);
        moduleView.classList.remove('guided-mode', 'browse-mode');
        this.renderSectionOutline(module);
        if (!enabled) return;
        const uiState = UIStateManager.get(MODULES.map(item => item.id));
        if (!this.pendingSection && uiState.lastSectionByModule[module.id]) this.pendingSection = uiState.lastSectionByModule[module.id];
        this.setModuleMode('guided');
        this.renderInlineCoreVisual(module);
    },

    registerServiceWorker() {
        if (!('serviceWorker' in navigator) || !['http:', 'https:'].includes(window.location.protocol)) return;
        navigator.serviceWorker.register('./sw.js').catch(error => {
            console.warn('Service worker registration failed:', error);
        });
    },

    openSearch() {
        const p = document.getElementById('searchPalette');
        if (!p) return;
        p.hidden = false;
        const inp = document.getElementById('searchInput');
        inp.value = '';
        this.renderSearchResults('');
        setTimeout(() => inp.focus(), 10);
    },

    closeSearch() {
        const p = document.getElementById('searchPalette');
        if (p) p.hidden = true;
    },

    renderSearchResults(q) {
        const ul = document.getElementById('searchResults');
        if (!ul) return;
        const query = (q || '').trim().toLowerCase();
        let items = MODULES;
        if (query) {
            items = MODULES.filter(m =>
                m.title.toLowerCase().includes(query) ||
                (m.subtitle || '').toLowerCase().includes(query) ||
                (m.id || '').toLowerCase().includes(query)
            );
        }
        items = items.slice(0, 15);
        if (!items.length) { ul.innerHTML = '<li class="search-empty">No matches</li>'; return; }
        ul.innerHTML = items.map((m, i) =>
            `<li class="search-item ${i === 0 ? 'active' : ''}" data-id="${this.escapeAttr(m.id)}" data-app-action="pick-search">
                <span class="search-icon">${m.icon}</span>
                <span class="search-title">${this.escapeHtml(m.title)}</span>
                <span class="search-sub">L${m.level} · ${this.escapeHtml(m.subtitle || '')}</span>
            </li>`
        ).join('');
    },

    handleSearchKey(e) {
        const ul = document.getElementById('searchResults');
        if (!ul) return;
        const items = Array.from(ul.querySelectorAll('.search-item'));
        const activeIdx = items.findIndex(el => el.classList.contains('active'));
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (activeIdx >= 0) items[activeIdx].classList.remove('active');
            const nxt = items[Math.min(activeIdx + 1, items.length - 1)] || items[0];
            if (nxt) nxt.classList.add('active');
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (activeIdx >= 0) items[activeIdx].classList.remove('active');
            const prv = items[Math.max(activeIdx - 1, 0)] || items[0];
            if (prv) prv.classList.add('active');
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const pick = items[Math.max(0, activeIdx)];
            if (pick) this.pickSearch(pick.dataset.id);
        }
    },

    pickSearch(id) {
        this.closeSearch();
        this.loadModule(id);
    },

    // ─── VIEWS ──────────────────────────────────
    showDashboard() {
        UIStateManager.setDestination('today');
        document.getElementById('dashboard').classList.add('active');
        document.getElementById('moduleView').classList.remove('active');
        
        // Remove active state from nav
        document.querySelectorAll('#sidebar li').forEach(li => li.classList.remove('active'));
        
        window.location.hash = '';
        this.updateProgress();
    },

    loadModule(moduleId) {
        const mod = MODULES.find(m => m.id === moduleId);
        if (!mod) return;

        this.currentModule = mod;
        this.currentTab = 'learn';

        // Switch view
        document.getElementById('dashboard').classList.remove('active');
        document.getElementById('moduleView').classList.add('active');

        // Update header
        document.getElementById('moduleTitle').textContent = mod.title;
        const badge = document.getElementById('moduleLevelBadge');
        badge.textContent = `L${mod.level}`;
        badge.className = 'module-level-badge';
        badge.style.background = mod.level === 100 ? 'var(--l100-color)' : 
                                  mod.level === 200 ? 'var(--l200-color)' : 'var(--l300-color)';

        // Update module index
        const modIndex = MODULES.indexOf(mod);
        document.getElementById('moduleSectionProgress').textContent = 
            `Module ${modIndex + 1} of ${MODULES.length}${mod.estimatedTime ? '  ·  ⏱ ~' + mod.estimatedTime : ''}`;

        // Load content (learn + optional references block + cheat-sheet button)
        let learnHtml = mod.learn || '<p>Content coming soon.</p>';
        if (Array.isArray(mod.references) && mod.references.length) {
            learnHtml += `
                <div class="learn-section references-section">
                    <h2>📚 References &amp; Further Reading</h2>
                    <p style="color:var(--text-secondary);font-size:13px">Official Microsoft Learn and Azure documentation relevant to this module.</p>
                    <ul class="refs-list">
                        ${mod.references.map(r => `<li><a href="${this.escapeAttr(r.url)}" target="_blank" rel="noopener noreferrer">${this.escapeHtml(r.title)}</a> <span class="ref-domain">${this.refDomain(r.url)}</span></li>`).join('')}
                    </ul>
                </div>`;
        }
        learnHtml += `
            <div class="learn-section" style="text-align:right;background:transparent;border:0;padding:0">
                <button class="btn-secondary" data-app-action="print-cheat-sheet" title="Print or save a one-page cheat-sheet">🖨️ Cheat-sheet (PDF)</button>
            </div>`;
        document.getElementById('tab-learn').innerHTML = learnHtml;
        this.initCopyButtons();
        this.injectSectionIds(mod);

        // Initialize diagrams
        if (mod.diagrams) {
            DiagramEngine.cleanup();
            DiagramEngine.render(mod.diagrams);
        } else {
            document.getElementById('tab-diagrams').innerHTML = '<p class="no-content">No visual diagrams for this module yet.</p>';
        }
        
        // Initialize interactive
        if (mod.interactive) {
            InteractiveEngine.render(mod.interactive);
        } else {
            document.getElementById('tab-interactive').innerHTML = '<p>No interactive exercises for this module.</p>';
        }
        
        // Initialize quiz
        if (mod.quiz) {
            QuizEngine.init(mod.id, mod.quiz);
        }

        // Initialize lab
        if (mod.lab) {
            LabEngine.init(mod.id, mod.lab);
        }

        this.configureModuleExperience(mod);

        // Update nav active state
        document.querySelectorAll('#sidebar li').forEach(li => {
            li.classList.toggle('active', li.dataset.module === moduleId);
        });

        // Update navigation buttons
        document.getElementById('prevModule').disabled = modIndex === 0;
        document.getElementById('nextModule').disabled = modIndex === MODULES.length - 1;
        
        // Update complete button
        const status = ProgressManager.getModuleStatus(moduleId);
        const completeBtn = document.getElementById('completeModule');
        const metadata = MasteryEngine.getMetadata(moduleId);
        const mastery = metadata ? MasteryEngine.getStatus(mod) : null;
        completeBtn.textContent = mastery
            ? `${MasteryEngine.STATE_LABELS[mastery.state]} · Check my progress`
            : status.completed ? '✓ Activity complete' : 'Mark activity complete';
        completeBtn.style.background = mastery && MasteryEngine.STATE_RANK[mastery.state] >= MasteryEngine.STATE_RANK.practiced
            ? 'var(--success)' : '';
        MasteryEngine.renderModulePanel(mod);

        // Switch to learn tab
        this.switchTab('learn');

        // Set hash for bookmarking
        window.location.hash = moduleId;

        // Save last visited
        ProgressManager.setLastVisited(moduleId);

        if (this.pendingSection) {
            const sectionId = this.pendingSection;
            setTimeout(() => {
                this.scrollToSection(sectionId);
                this.observeAfterScroll(moduleId);
            }, 120);
        } else {
            document.getElementById('content').scrollTop = 0;
            this.observeSections(moduleId);
        }

    },

    switchTab(tabName) {
        this.currentTab = tabName;
        if (this.currentModule) UIStateManager.touchModule(this.currentModule.id, tabName);
        
        // Update tab buttons
        document.querySelectorAll('.module-tabs .tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `tab-${tabName}`);
        });
        document.querySelectorAll('.guided-stepper [data-tab]').forEach(button => {
            const active = button.dataset.tab === tabName;
            button.classList.toggle('active', active);
            if (active) button.setAttribute('aria-current', 'step');
            else button.removeAttribute('aria-current');
        });
    },

    // ─── MODULE NAVIGATION ──────────────────────
    prevModule() {
        if (!this.currentModule) return;
        const idx = MODULES.indexOf(this.currentModule);
        if (idx > 0) this.loadModule(MODULES[idx - 1].id);
    },

    nextModule() {
        if (!this.currentModule) return;
        const idx = MODULES.indexOf(this.currentModule);
        if (idx < MODULES.length - 1) this.loadModule(MODULES[idx + 1].id);
    },

    completeModule() {
        if (!this.currentModule) return;
        const metadata = MasteryEngine.getMetadata(this.currentModule.id);
        if (metadata) {
            ProgressManager.markContentReviewed(this.currentModule.id);
            const mastery = MasteryEngine.getStatus(this.currentModule);
            const nextTab = mastery.missing.includes('quiz') ? 'quiz' : mastery.missing.includes('lab') ? 'lab' : 'learn';
            const message = mastery.missing.length
                ? `Next evidence: ${mastery.missing.join(', ')}`
                : `${MasteryEngine.STATE_LABELS[mastery.state]} mastery recorded`;
            this.switchTab(nextTab);
            this.showToast(message, mastery.missing.length ? 'warning' : 'success');
            MasteryEngine.renderModulePanel(this.currentModule);
            this.buildNavigation();
            this.updateProgress();
            document.querySelectorAll('#sidebar li').forEach(li => {
                li.classList.toggle('active', li.dataset.module === this.currentModule.id);
            });
            return;
        }
        const status = ProgressManager.getModuleStatus(this.currentModule.id);
        
        if (status.completed) {
            ProgressManager.uncompleteModule(this.currentModule.id);
            this.showToast('Module unmarked', 'warning');
        } else {
            ProgressManager.completeModule(this.currentModule.id);
            this.showToast('Module completed! 🎉', 'success');
        }
        
        this.buildNavigation();
        this.updateProgress();
        
        // Re-highlight active
        document.querySelectorAll('#sidebar li').forEach(li => {
            li.classList.toggle('active', li.dataset.module === this.currentModule.id);
        });

        // Update button
        const newStatus = ProgressManager.getModuleStatus(this.currentModule.id);
        const completeBtn = document.getElementById('completeModule');
        if (newStatus.completed) {
            completeBtn.textContent = '✓ Completed';
            completeBtn.style.background = 'var(--success)';
        } else {
            completeBtn.textContent = '✓ Mark Complete';
            completeBtn.style.background = '';
        }
    },

    startLevel(level) {
        const firstModule = MODULES.find(m => m.level === level);
        if (firstModule) this.loadModule(firstModule.id);
    },

    // ─── PROGRESS ──────────────────────────────
    updateProgress() {
        const stats = ProgressManager.getStats();
        const progress = ProgressManager.getProgress();
        const realModules = MasteryEngine.getRealModules(MODULES, ACADEMY_MASTERY);
        const practicedModules = realModules.filter(module =>
            MasteryEngine.STATE_RANK[MasteryEngine.getStatus(module).state] >= MasteryEngine.STATE_RANK.practiced);
        const overallPct = Math.round((practicedModules.length / realModules.length) * 100);

        // Overall progress bar
        document.getElementById('overallProgress').style.width = `${overallPct}%`;
        document.getElementById('overallProgressText').textContent = `${overallPct}% Complete`;

        // Level progress
        [100, 200, 300].forEach(level => {
            const levelModules = realModules.filter(m => m.level === level);
            const completed = levelModules.filter(module =>
                MasteryEngine.STATE_RANK[MasteryEngine.getStatus(module).state] >= MasteryEngine.STATE_RANK.practiced).length;
            const pct = Math.round((completed / levelModules.length) * 100);
            const totalTime = levelModules.reduce((sum, m) => sum + (parseInt(m.estimatedTime) || 0), 0);
            const completedTime = levelModules.filter(module =>
                MasteryEngine.STATE_RANK[MasteryEngine.getStatus(module).state] >= MasteryEngine.STATE_RANK.practiced).reduce((sum, m) => sum + (parseInt(m.estimatedTime) || 0), 0);

            const bar = document.getElementById(`l${level}Progress`);
            const text = document.getElementById(`l${level}ProgressText`);
            if (bar) bar.style.width = `${pct}%`;
            if (text) text.textContent = `${completed}/${levelModules.length} modules · ~${totalTime - completedTime}m remaining`;
        });

        // Dashboard stats
        const statModules = document.getElementById('statModules');
        const statQuizzes = document.getElementById('statQuizzes');
        const statLabs = document.getElementById('statLabs');
        const statStreak = document.getElementById('statStreak');
        
        if (statModules) statModules.textContent = practicedModules.length;
        if (statQuizzes) statQuizzes.textContent = stats.quizzesPassed;
        if (statLabs) statLabs.textContent = stats.labsCompleted;
        if (statStreak) statStreak.textContent = stats.streak;
        MasteryEngine.renderDashboard(MODULES);

        // Build progress tracker
        this.buildTracker(progress);
    },

    buildTracker(progress) {
        const grid = document.getElementById('trackerGrid');
        const summary = document.getElementById('trackerSummary');
        if (!grid || !summary) return;

        const realModules = MasteryEngine.getRealModules(MODULES, ACADEMY_MASTERY);
        const totalTime = realModules.reduce((s, m) => s + (parseInt(m.estimatedTime) || 0), 0);
        const completedTime = realModules.filter(module =>
            MasteryEngine.STATE_RANK[MasteryEngine.getStatus(module).state] >= MasteryEngine.STATE_RANK.practiced).reduce((s, m) => s + (parseInt(m.estimatedTime) || 0), 0);
        const remainingTime = totalTime - completedTime;
        const completedCount = realModules.filter(module =>
            MasteryEngine.STATE_RANK[MasteryEngine.getStatus(module).state] >= MasteryEngine.STATE_RANK.practiced).length;

        summary.innerHTML = `
            <div class="tracker-summary-item"><span class="dot" style="background:var(--success)"></span> ${completedCount} completed</div>
            <div class="tracker-summary-item"><span class="dot" style="background:#e0e0e0"></span> ${realModules.length - completedCount} remaining</div>
            <div class="tracker-summary-item"><span class="dot" style="background:var(--azure-blue)"></span> ~${totalTime}m total · ~${remainingTime}m left</div>
            <div class="tracker-summary-item"><span class="dot" style="background:var(--warning)"></span> ${Object.keys(progress.quizScores).length} quizzes · ${progress.completedLabs.length} labs</div>
        `;

        let html = '';
        const levelNames = { 100: 'Level 100 — Foundations', 200: 'Level 200 — Intermediate', 300: 'Level 300 — Advanced' };
        const levelClasses = { 100: 'l100', 200: 'l200', 300: 'l300' };

        [100, 200, 300].forEach(level => {
            const mods = realModules.filter(m => m.level === level);
            const done = mods.filter(module =>
                MasteryEngine.STATE_RANK[MasteryEngine.getStatus(module).state] >= MasteryEngine.STATE_RANK.practiced).length;
            html += `<div class="tracker-level-header ${levelClasses[level]}">${levelNames[level]} (${done}/${mods.length})</div>`;

            mods.forEach(mod => {
                const mastery = MasteryEngine.getStatus(mod);
                const isDone = MasteryEngine.STATE_RANK[mastery.state] >= MasteryEngine.STATE_RANK.practiced;
                const quizScore = progress.quizScores[mod.id];
                const labDone = progress.completedLabs.includes(mod.id);
                const quizBadge = quizScore 
                    ? `<span class="tracker-badge quiz-done">Quiz ${quizScore.score}/${quizScore.total}</span>` 
                    : (mod.quiz ? `<span class="tracker-badge quiz-pending">Quiz</span>` : '');
                const labBadge = labDone 
                    ? `<span class="tracker-badge lab-done">Lab ✓</span>` 
                    : (mod.lab ? `<span class="tracker-badge lab-pending">Lab</span>` : '');
                const timeBadge = mod.estimatedTime ? `<span class="tracker-badge time">⏱ ${mod.estimatedTime}</span>` : '';

                html += `<div class="tracker-row ${isDone ? 'completed' : ''}" data-app-action="load-module" data-module-id="${this.escapeAttr(mod.id)}">
                    <div class="tracker-status ${isDone ? 'done' : 'pending'}">${isDone ? '✓' : mod.icon}</div>
                    <div class="tracker-info">
                        <div class="tracker-title">${mod.title}</div>
                        <div class="tracker-subtitle">${MasteryEngine.STATE_LABELS[mastery.state]} · ${mod.subtitle}</div>
                    </div>
                    <div class="tracker-badges">${timeBadge}${quizBadge}${labBadge}</div>
                </div>`;
            });
        });

        grid.innerHTML = html;
    },

    // ─── UTILITIES ──────────────────────────────
    escapeHtml(s) { const d = document.createElement('div'); d.textContent = String(s == null ? '' : s); return d.innerHTML; },
    escapeAttr(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); },
    refDomain(url) {
        try { const u = new URL(url); return `(${u.hostname.replace(/^www\./, '')})`; } catch (e) { return ''; }
    },

    // Add a "Copy" button to every .lab-code-block and .code-block on the page.
    initCopyButtons() {
        document.querySelectorAll('.code-block, .lab-code-block').forEach(block => {
            if (block.dataset.copyInit) return;
            block.dataset.copyInit = '1';
            block.style.position = block.style.position || 'relative';
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'copy-btn';
            btn.textContent = 'Copy';
            btn.setAttribute('aria-label', 'Copy code to clipboard');
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const text = block.innerText.replace(/^Copy\s*/, '');
                if (navigator.clipboard) {
                    navigator.clipboard.writeText(text).then(() => {
                        btn.textContent = 'Copied!';
                        setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
                    });
                }
            });
            block.appendChild(btn);
        });
    },

    // Simple browser-native print-to-PDF cheat-sheet of the current module's Learn tab.
    printCheatSheet() {
        if (!this.currentModule) return;
        const mod = this.currentModule;
        const content = document.getElementById('tab-learn').innerHTML;
        const win = window.open('', '_blank', 'width=900,height=1000');
        if (!win) { this.showToast('Pop-up blocked — allow pop-ups to print', 'warning'); return; }
        win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${this.escapeHtml(mod.title)} — Cheat Sheet</title>
            <style>
                body{font-family:Segoe UI,Arial,sans-serif;max-width:800px;margin:24px auto;padding:0 24px;color:#222;line-height:1.5}
                h1,h2,h3,h4{color:#0078D4;margin-top:18px}
                h1{border-bottom:2px solid #0078D4;padding-bottom:6px}
                table{border-collapse:collapse;width:100%;margin:10px 0;font-size:12.5px}
                th,td{border:1px solid #ccc;padding:6px 8px;text-align:left}
                th{background:#f3f8fd}
                .code-block,.lab-code-block{background:#f5f5f5;border:1px solid #ddd;padding:10px;white-space:pre-wrap;font-family:Consolas,monospace;font-size:11.5px;border-radius:4px;page-break-inside:avoid}
                .code-inline{background:#f0f0f0;padding:1px 4px;border-radius:3px;font-family:Consolas,monospace;font-size:12px}
                .concept-box,.warning-box,.tip-box{border-left:4px solid #0078D4;padding:8px 12px;margin:12px 0;background:#f8fbfe;page-break-inside:avoid}
                .warning-box{border-color:#d13438;background:#fdf5f5}
                .tip-box{border-color:#107c10;background:#f5fcf5}
                .copy-btn{display:none}
                .references-section{page-break-before:always}
                footer{margin-top:24px;padding-top:12px;border-top:1px solid #ddd;color:#888;font-size:11px}
                @media print { a{color:#0078D4} .copy-btn{display:none} }
            </style></head><body>
            <h1>${this.escapeHtml(mod.title)}</h1>
            <p style="color:#666;font-size:12px">Azure Networking Academy — Level ${mod.level} · ~${this.escapeHtml(mod.estimatedTime || '')}</p>
            ${content}
            <footer>Generated ${new Date().toLocaleString()} &mdash; Azure Networking Academy</footer>
            </body></html>`);
        win.document.close();
        win.setTimeout(() => win.print(), 400);
    },

    // ─── TOAST ──────────────────────────────────
    showToast(message, type = '') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type} show`;
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => app.init());
