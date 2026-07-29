const TodayEngine = {
    STATE_RANK: Object.freeze({ not_started: 0, learned: 1, practiced: 2, demonstrated: 3, durable: 4 }),

    select(input) {
        const modules = input.modules.filter(module => !(input.activityIds || []).includes(module.id));
        const order = new Map(modules.map((module, index) => [module.id, index]));
        const candidates = [];
        const progress = input.progress || {};
        const uiState = input.uiState || {};
        const today = new Date(input.now || new Date().toISOString()).toISOString().slice(0, 10);

        modules.forEach(module => {
            const entry = (progress.moduleMastery || {})[module.id] || {};
            const steps = (progress.labSteps || {})[module.id] || [];
            const totalSteps = module.lab && Array.isArray(module.lab.steps) ? module.lab.steps.length : steps.length;
            const completedSteps = steps.filter(Boolean).length;
            const labComplete = (progress.completedLabs || []).includes(module.id) || (entry.lab && entry.lab.completed);
            const labActive = Boolean(module.lab && !labComplete && ((totalSteps > 0 && completedSteps > 0 && completedSteps < totalSteps) || (uiState.lastTabByModule || {})[module.id] === 'lab'));
            if (labActive) candidates.push(this.moduleAction('active_lab', module, 1, order, { actionLabel: 'Resume lab', tab: 'lab', description: `${completedSteps} of ${totalSteps} required steps complete`, touchedAt: (uiState.lastTouchedAtByModule || {})[module.id] }));

            const review = entry.review || {};
            const transfer = entry.transfer;
            const dueDate = review.nextDue ? new Date(review.nextDue) : null;
            if (transfer && transfer.score / transfer.max >= 0.75 && dueDate && !Number.isNaN(dueDate.getTime())) {
                const dueDay = dueDate.toISOString().slice(0, 10);
                if (dueDay < today) candidates.push(this.moduleAction('overdue_review', module, 2, order, { actionLabel: 'Review now', tab: 'quiz', dueAt: review.nextDue, description: `Review overdue since ${dueDay}` }));
                else if (dueDay === today) candidates.push(this.moduleAction('review_due_today', module, 3, order, { actionLabel: 'Review now', tab: 'quiz', dueAt: review.nextDue, description: 'Spaced review due today' }));
            }
        });

        const lastModuleId = uiState.lastModuleId || progress.lastVisited;
        const lastModule = modules.find(module => module.id === lastModuleId);
        if (lastModule && !candidates.some(candidate => candidate.kind === 'active_lab' && candidate.moduleId === lastModuleId)) {
            candidates.push(this.moduleAction('active_lesson', lastModule, 4, order, { actionLabel: 'Resume', tab: (uiState.lastTabByModule || {})[lastModuleId] || 'learn', sectionId: (uiState.lastSectionByModule || {})[lastModuleId] || null, description: (uiState.lastSectionByModule || {})[lastModuleId] ? 'Continue from your saved section' : 'Continue your last module', touchedAt: (uiState.lastTouchedAtByModule || {})[lastModuleId] }));
        }

        if (!progress.diagnostic) candidates.push({ kind: 'diagnostic', priority: 5, title: 'Find my starting point', description: '10 questions, about 4 minutes', actionLabel: 'Start diagnostic', tab: null, moduleId: null });
        else {
            const recommended = modules.find(module => module.id === progress.diagnostic.recommendedModuleId);
            if (recommended && this.rank(input.statuses[recommended.id]?.state) === 0) candidates.push(this.moduleAction('diagnostic_recommendation', recommended, 5, order, { actionLabel: 'Start recommendation', description: 'First competency missed in your diagnostic' }));
        }

        const nextModule = modules.find(module => {
            if (this.rank(input.statuses[module.id]?.state) !== 0 || /capstone/i.test(module.id)) return false;
            return (input.metadata[module.id]?.prerequisites || []).every(id => this.rank(input.statuses[id]?.state) >= 1);
        });
        if (nextModule) candidates.push(this.moduleAction('next_module', nextModule, 6, order, { actionLabel: 'Start module', description: 'Next prerequisite-safe module' }));
        const capstone = modules.find(module => /capstone/i.test(module.id));
        if (capstone) candidates.push(this.moduleAction('capstone', capstone, 7, order, { actionLabel: 'Prepare capstone', description: 'Apply the full learning path' }));

        candidates.sort((left, right) => this.compare(left, right));
        const primary = candidates[0] || { kind: 'complete', priority: 8, title: 'Review durable skills', description: 'All current modules have evidence', actionLabel: 'Browse modules', moduleId: null };
        const alsoDue = candidates.filter(candidate => candidate !== primary && ['active_lab', 'overdue_review', 'review_due_today', 'active_lesson'].includes(candidate.kind)).slice(0, 3);
        const startIndex = primary.moduleId ? Math.max(0, order.get(primary.moduleId) || 0) : 0;
        const milestones = modules.slice(startIndex).filter(module => this.rank(input.statuses[module.id]?.state) < 4).slice(0, 3).map(module => ({ moduleId: module.id, title: module.title, state: input.statuses[module.id]?.state || 'not_started' }));
        return { primary, alsoDue, milestones };
    },

    rank(state) { return this.STATE_RANK[state] ?? 0; },
    moduleAction(kind, module, priority, order, details = {}) {
        return { kind, priority, moduleId: module.id, moduleOrder: order.get(module.id) || 0, title: module.title, estimatedTime: module.estimatedTime || null, tab: details.tab || 'learn', sectionId: details.sectionId || null, actionLabel: details.actionLabel || 'Open', description: details.description || '', dueAt: details.dueAt || null, touchedAt: details.touchedAt || null };
    },
    compare(left, right) {
        if (left.priority !== right.priority) return left.priority - right.priority;
        if (left.dueAt || right.dueAt) {
            const difference = new Date(left.dueAt || 8640000000000000) - new Date(right.dueAt || 8640000000000000);
            if (difference) return difference;
        }
        if (left.touchedAt || right.touchedAt) {
            const difference = new Date(right.touchedAt || 0) - new Date(left.touchedAt || 0);
            if (difference) return difference;
        }
        return (left.moduleOrder || 0) - (right.moduleOrder || 0);
    }
};

if (typeof module !== 'undefined' && module.exports) module.exports = TodayEngine;