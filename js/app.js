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

const app = {
    currentModule: null,
    currentTab: 'learn',

    init() {
        this.buildNavigation();
        this.updateProgress();
        this.bindEvents();
        this.showDashboard();

        // Check if returning to a specific module
        const hash = window.location.hash.slice(1);
        if (hash) {
            const mod = MODULES.find(m => m.id === hash);
            if (mod) this.loadModule(mod.id);
        }
    },

    // ─── NAVIGATION ──────────────────────────────
    buildNavigation() {
        const levels = { 100: 'nav-level-100', 200: 'nav-level-200', 300: 'nav-level-300' };
        
        for (const [level, containerId] of Object.entries(levels)) {
            const container = document.getElementById(containerId);
            const levelModules = MODULES.filter(m => m.level === parseInt(level));
            
            container.innerHTML = levelModules.map(mod => {
                const status = ProgressManager.getModuleStatus(mod.id);
                const classes = [
                    status.completed ? 'completed' : '',
                ].filter(Boolean).join(' ');
                const timeLabel = mod.estimatedTime ? `<span style="font-size:10px;color:#888;margin-left:auto;white-space:nowrap">⏱ ${mod.estimatedTime}</span>` : '';
                
                return `<li class="${classes}" data-module="${mod.id}" onclick="app.loadModule('${mod.id}')">
                    <span style="flex:1">${mod.icon} ${mod.title}</span>${timeLabel}
                </li>`;
            }).join('');
        }
    },

    bindEvents() {
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
            toggle.addEventListener('click', () => {
                const sb = document.getElementById('sidebar');
                const open = sb.classList.toggle('mobile-open');
                toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
            });
        }
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
            `<li class="search-item ${i === 0 ? 'active' : ''}" data-id="${m.id}" onclick="app.pickSearch('${m.id}')">
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
                <button class="btn-secondary" onclick="app.printCheatSheet()" title="Print or save a one-page cheat-sheet">🖨️ Cheat-sheet (PDF)</button>
            </div>`;
        document.getElementById('tab-learn').innerHTML = learnHtml;
        this.initCopyButtons();

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
        if (status.completed) {
            completeBtn.textContent = '✓ Completed';
            completeBtn.style.background = 'var(--success)';
        } else {
            completeBtn.textContent = '✓ Mark Complete';
            completeBtn.style.background = '';
        }

        // Switch to learn tab
        this.switchTab('learn');

        // Set hash for bookmarking
        window.location.hash = moduleId;

        // Save last visited
        ProgressManager.setLastVisited(moduleId);

        // Scroll to top
        document.getElementById('content').scrollTop = 0;

        // Init accordions in content
        setTimeout(() => {
            document.querySelectorAll('.accordion-header').forEach(header => {
                if (!header.dataset.bound) {
                    header.dataset.bound = 'true';
                    header.addEventListener('click', function() {
                        this.parentElement.classList.toggle('open');
                    });
                }
            });
        }, 100);
    },

    switchTab(tabName) {
        this.currentTab = tabName;
        
        // Update tab buttons
        document.querySelectorAll('.module-tabs .tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `tab-${tabName}`);
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
        const totalModules = MODULES.length;
        const overallPct = Math.round((stats.modulesCompleted / totalModules) * 100);

        // Overall progress bar
        document.getElementById('overallProgress').style.width = `${overallPct}%`;
        document.getElementById('overallProgressText').textContent = `${overallPct}% Complete`;

        // Level progress
        [100, 200, 300].forEach(level => {
            const levelModules = MODULES.filter(m => m.level === level);
            const completed = levelModules.filter(m => progress.completedModules.includes(m.id)).length;
            const pct = Math.round((completed / levelModules.length) * 100);
            const totalTime = levelModules.reduce((sum, m) => sum + (parseInt(m.estimatedTime) || 0), 0);
            const completedTime = levelModules.filter(m => progress.completedModules.includes(m.id)).reduce((sum, m) => sum + (parseInt(m.estimatedTime) || 0), 0);

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
        
        if (statModules) statModules.textContent = stats.modulesCompleted;
        if (statQuizzes) statQuizzes.textContent = stats.quizzesPassed;
        if (statLabs) statLabs.textContent = stats.labsCompleted;
        if (statStreak) statStreak.textContent = stats.streak;

        // Build progress tracker
        this.buildTracker(progress);
    },

    buildTracker(progress) {
        const grid = document.getElementById('trackerGrid');
        const summary = document.getElementById('trackerSummary');
        if (!grid || !summary) return;

        const totalTime = MODULES.reduce((s, m) => s + (parseInt(m.estimatedTime) || 0), 0);
        const completedTime = MODULES.filter(m => progress.completedModules.includes(m.id)).reduce((s, m) => s + (parseInt(m.estimatedTime) || 0), 0);
        const remainingTime = totalTime - completedTime;
        const completedCount = progress.completedModules.length;

        summary.innerHTML = `
            <div class="tracker-summary-item"><span class="dot" style="background:var(--success)"></span> ${completedCount} completed</div>
            <div class="tracker-summary-item"><span class="dot" style="background:#e0e0e0"></span> ${MODULES.length - completedCount} remaining</div>
            <div class="tracker-summary-item"><span class="dot" style="background:var(--azure-blue)"></span> ~${totalTime}m total · ~${remainingTime}m left</div>
            <div class="tracker-summary-item"><span class="dot" style="background:var(--warning)"></span> ${Object.keys(progress.quizScores).length} quizzes · ${progress.completedLabs.length} labs</div>
        `;

        let html = '';
        const levelNames = { 100: 'Level 100 — Foundations', 200: 'Level 200 — Intermediate', 300: 'Level 300 — Advanced' };
        const levelClasses = { 100: 'l100', 200: 'l200', 300: 'l300' };

        [100, 200, 300].forEach(level => {
            const mods = MODULES.filter(m => m.level === level);
            const done = mods.filter(m => progress.completedModules.includes(m.id)).length;
            html += `<div class="tracker-level-header ${levelClasses[level]}">${levelNames[level]} (${done}/${mods.length})</div>`;

            mods.forEach(mod => {
                const isDone = progress.completedModules.includes(mod.id);
                const quizScore = progress.quizScores[mod.id];
                const labDone = progress.completedLabs.includes(mod.id);
                const quizBadge = quizScore 
                    ? `<span class="tracker-badge quiz-done">Quiz ${quizScore.score}/${quizScore.total}</span>` 
                    : (mod.quiz ? `<span class="tracker-badge quiz-pending">Quiz</span>` : '');
                const labBadge = labDone 
                    ? `<span class="tracker-badge lab-done">Lab ✓</span>` 
                    : (mod.lab ? `<span class="tracker-badge lab-pending">Lab</span>` : '');
                const timeBadge = mod.estimatedTime ? `<span class="tracker-badge time">⏱ ${mod.estimatedTime}</span>` : '';

                html += `<div class="tracker-row ${isDone ? 'completed' : ''}" onclick="app.loadModule('${mod.id}')">
                    <div class="tracker-status ${isDone ? 'done' : 'pending'}">${isDone ? '✓' : mod.icon}</div>
                    <div class="tracker-info">
                        <div class="tracker-title">${mod.title}</div>
                        <div class="tracker-subtitle">${mod.subtitle}</div>
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
            <script>setTimeout(()=>window.print(), 400);<\/script>
            </body></html>`);
        win.document.close();
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
