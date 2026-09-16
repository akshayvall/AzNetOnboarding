const TodayEngine = {
    STATE_RANK: Object.freeze({ not_started: 0, learned: 1, practiced: 2, demonstrated: 3, durable: 4 }),

    select(input = {}) {
        const modules = (input.modules || []).filter(module => !(input.activityIds || []).includes(module.id));
        const order = new Map(modules.map((module, index) => [module.id, index]));
        const candidates = [];
        const progress = input.progress || {};
        const uiState = input.uiState || {};
        const sessionMinutes = [10, 25, 60].includes(uiState.sessionMinutes) ? uiState.sessionMinutes : 25;
        const statuses = input.statuses || {};
        const now = new Date(input.now || new Date().toISOString());
        const today = now.toISOString().slice(0, 10);
        const moduleById = new Map(modules.map(module => [module.id, module]));
        const path = (input.paths || []).find(candidate => candidate?.id === uiState.activePath && Array.isArray(candidate.moduleIds));
        const missingPrerequisites = module => (input.metadata?.[module.id]?.prerequisites || [])
            .filter(id => this.rank(statuses[id]?.state) < 1);
        const plannedModules = [];
        const plannedIds = new Set();
        const planModule = module => {
            if (!module || plannedIds.has(module.id)) return;
            plannedIds.add(module.id);
            if (path) missingPrerequisites(module).forEach(id => planModule(moduleById.get(id)));
            plannedModules.push(module);
        };
        (path ? path.moduleIds.map(id => moduleById.get(id)) : modules).forEach(planModule);
        const plannedOrder = new Map(plannedModules.map((module, index) => [module.id, index]));
        const resolvePrerequisite = (module, visited = new Set()) => {
            if (!module || visited.has(module.id)) return null;
            visited.add(module.id);
            const missing = missingPrerequisites(module)[0];
            return missing ? resolvePrerequisite(moduleById.get(missing), visited) : module;
        };
        const started = module => this.rank(statuses[module.id]?.state) > 0 || Boolean(
            progress.moduleMastery?.[module.id]?.quiz || progress.moduleMastery?.[module.id]?.lab?.completed ||
            (progress.completedLabs || []).includes(module.id));

        modules.forEach(module => {
            const entry = (progress.moduleMastery || {})[module.id] || {};
            const status = statuses[module.id] || {};
            const steps = (progress.labSteps || {})[module.id] || [];
            const totalSteps = module.lab && Array.isArray(module.lab.steps) ? module.lab.steps.length : steps.length;
            const completedSteps = steps.filter(Boolean).length;
            const labComplete = (progress.completedLabs || []).includes(module.id) || entry.lab?.completed ||
                (Array.isArray(status.missing) ? !status.missing.includes('lab') : this.rank(status.state) >= 2);
            const labActive = Boolean(module.lab && !labComplete && ((totalSteps > 0 && completedSteps > 0 && completedSteps < totalSteps) || (uiState.lastTabByModule || {})[module.id] === 'lab'));
            if (labActive) candidates.push(this.moduleAction('active_lab', module, 1, order, { actionLabel: 'Resume lab', tab: 'lab', description: `${completedSteps} of ${totalSteps} required steps complete`, touchedAt: (uiState.lastTouchedAtByModule || {})[module.id] }));

            const review = entry.review || {};
            const transfer = entry.transfer;
            const dueDate = review.nextDue ? new Date(review.nextDue) : null;
            if (transfer && transfer.score / transfer.max >= 0.75 && dueDate && !Number.isNaN(dueDate.getTime()) && dueDate <= now) {
                const dueDay = dueDate.toISOString().slice(0, 10);
                if (dueDay < today) candidates.push(this.moduleAction('overdue_review', module, 2, order, { actionLabel: 'Review now', tab: 'quiz', dueAt: review.nextDue, description: `Review overdue since ${dueDay}` }));
                else if (dueDay === today) candidates.push(this.moduleAction('review_due_today', module, 3, order, { actionLabel: 'Review now', tab: 'quiz', dueAt: review.nextDue, description: 'Spaced review due today' }));
            }
        });

        const lastModuleId = uiState.lastModuleId || progress.lastVisited;
        const lastModule = modules.find(module => module.id === lastModuleId);
        const lastTab = (uiState.lastTabByModule || {})[lastModuleId] || 'learn';
        const lastStatus = statuses[lastModuleId] || {};
        if (lastModule && this.rank(lastStatus.state) < 4 &&
            !candidates.some(candidate => candidate.kind === 'active_lab' && candidate.moduleId === lastModuleId)) {
            const resumeLesson = !started(lastModule) && lastTab === 'learn' &&
                (!Array.isArray(lastStatus.missing) || lastStatus.missing.includes('quiz'));
            const target = resumeLesson ? {
                actionLabel: 'Resume', tab: 'learn', sectionId: (uiState.lastSectionByModule || {})[lastModuleId] || null,
                description: (uiState.lastSectionByModule || {})[lastModuleId] ? 'Continue from your saved section' : 'Continue your last module',
            } : this.evidenceTarget(lastStatus);
            if (target) candidates.push(this.moduleAction('active_lesson', lastModule, 4, order, {
                ...target,
                touchedAt: (uiState.lastTouchedAtByModule || {})[lastModuleId]
            }));
        }

        plannedModules.forEach(module => {
            const target = this.evidenceTarget(statuses[module.id]);
            if (!target || !started(module) || this.rank(statuses[module.id]?.state) >= 4 ||
                missingPrerequisites(module).length || candidates.some(candidate => candidate.moduleId === module.id &&
                    ['active_lab', 'active_lesson'].includes(candidate.kind))) return;
            candidates.push(this.moduleAction('next_evidence', module, target.sectionId === 'transfer-evidence' ? 4 : 6, plannedOrder, target));
        });

        if (!progress.diagnostic) candidates.push({ kind: 'diagnostic', priority: 5, title: 'Find my starting point', description: '10 questions, about 4 minutes', actionLabel: 'Start diagnostic', tab: null, moduleId: null });
        else {
            const recommended = plannedModules.find(module => module.id === progress.diagnostic.recommendedModuleId);
            if (recommended && this.rank(statuses[recommended.id]?.state) === 0 && !started(recommended)) {
                const target = resolvePrerequisite(recommended);
                if (target) candidates.push(this.moduleAction('diagnostic_recommendation', target, 5, plannedOrder, {
                    actionLabel: 'Start recommendation',
                    description: target === recommended ? 'First competency missed in your diagnostic' : 'Build the missing prerequisite for your diagnostic recommendation',
                    ...(started(target) ? this.evidenceTarget(statuses[target.id]) : {})
                }));
            }
        }

        const nextModule = plannedModules.find(module => {
            if (this.rank(statuses[module.id]?.state) !== 0 || started(module) || /capstone/i.test(module.id)) return false;
            return missingPrerequisites(module).length === 0;
        });
        if (nextModule) candidates.push(this.moduleAction('next_module', nextModule, 6, plannedOrder, { actionLabel: 'Start module', description: 'Next prerequisite-safe module' }));
        const capstone = plannedModules.find(module => /capstone/i.test(module.id) &&
            this.rank(statuses[module.id]?.state) < 4 && missingPrerequisites(module).length === 0);
        if (capstone) candidates.push(this.moduleAction('capstone', capstone, 7, plannedOrder, { actionLabel: 'Prepare capstone', description: 'Apply the full learning path' }));

        candidates.sort((left, right) => this.compare(left, right));
        const pending = plannedModules.some(module => this.rank(statuses[module.id]?.state) < 4);
        let primary = candidates[0] || {
            kind: pending ? 'blocked' : 'complete', priority: 8,
            title: pending ? 'Review missing evidence' : 'Review durable skills',
            description: pending ? 'No prerequisite-safe next step is available. Browse modules to inspect missing evidence.' :
                (path ? 'All modules in the selected path have evidence' : 'All current modules have evidence'),
            actionLabel: 'Browse modules', moduleId: null
        };
        const primaryModule = moduleById.get(primary.moduleId);
        if (sessionMinutes === 10 && primary.tab === 'lab' &&
            this.durationMinutes(primaryModule?.lab?.estimatedTime || primaryModule?.estimatedTime) > sessionMinutes) {
            primary = {
                ...primary, kind: 'practice_case', tab: 'learn', sectionId: 'worked-example', actionLabel: 'Practice case',
                description: '10-minute case using the worked example; no cloud deployment'
            };
        }
        const alsoDue = candidates.filter(candidate => candidate !== primary &&
            (['active_lab', 'overdue_review', 'review_due_today', 'active_lesson'].includes(candidate.kind) ||
                (primary.kind === 'practice_case' && candidate === candidates[0]))).slice(0, 3);
        const startIndex = Math.max(0, plannedModules.findIndex(module => module.id === primary.moduleId));
        const milestones = plannedModules.slice(startIndex).filter(module => this.rank(statuses[module.id]?.state) < 4).slice(0, 3).map(module => ({ moduleId: module.id, title: module.title, state: statuses[module.id]?.state || 'not_started' }));
        return { primary: this.sessionAction(primary, sessionMinutes), alsoDue: alsoDue.map(candidate => this.sessionAction(candidate, sessionMinutes)), milestones };
    },

    rank(state) { return this.STATE_RANK[state] ?? 0; },
    evidenceTarget(status) {
        const missing = Array.isArray(status?.missing) ? status.missing : [];
        if (missing.includes('quiz')) return { tab: 'quiz', actionLabel: 'Take quiz', description: 'Check the concepts that still need quiz evidence' };
        if (missing.includes('lab')) return { tab: 'lab', actionLabel: 'Continue lab', description: 'Work on the lab evidence still missing from this module' };
        if (missing.includes('transfer')) return { tab: 'learn', sectionId: 'transfer-evidence', actionLabel: 'Apply learning', description: 'Apply the skill to a new case and record the remaining transfer evidence' };
        return null;
    },
    durationMinutes(value) {
        let minutes = 0;
        for (const [, amount, unit] of String(value || '').matchAll(/(\d+(?:\.\d+)?)\s*(hours?|hrs?|h|minutes?|mins?|m)\b/gi)) {
            minutes += Number(amount) * (/^h/i.test(unit) ? 60 : 1);
        }
        return minutes || Infinity;
    },
    sessionAction(action, sessionMinutes) {
        return {
            ...action, estimatedTime: `${sessionMinutes}-minute session`,
            description: action.tab === 'lab' ? `${sessionMinutes}-minute session: work on one portion of the lab. ${action.description}` : action.description
        };
    },
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