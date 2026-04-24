/* ============================================
   PROGRESS TRACKING — localStorage based
   ============================================ */

const ProgressManager = {
    STORAGE_KEY: 'azure-networking-academy-progress',

    getProgress() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : this.defaultProgress();
        } catch {
            return this.defaultProgress();
        }
    },

    defaultProgress() {
        return {
            completedModules: [],
            quizScores: {},
            completedLabs: [],
            flashcardsReviewed: [],
            interactiveCompleted: [],
            lastVisited: null,
            streak: { count: 0, lastDate: null },
            startDate: new Date().toISOString(),
            totalTimeMinutes: 0,
            notes: {}
        };
    },

    saveProgress(progress) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(progress));
        } catch (e) {
            console.error('Failed to save progress:', e);
        }
    },

    completeModule(moduleId) {
        const progress = this.getProgress();
        if (!progress.completedModules.includes(moduleId)) {
            progress.completedModules.push(moduleId);
        }
        this.updateStreak(progress);
        this.saveProgress(progress);
        return progress;
    },

    uncompleteModule(moduleId) {
        const progress = this.getProgress();
        progress.completedModules = progress.completedModules.filter(id => id !== moduleId);
        this.saveProgress(progress);
        return progress;
    },

    saveQuizScore(moduleId, score, total) {
        const progress = this.getProgress();
        progress.quizScores[moduleId] = { score, total, date: new Date().toISOString() };
        this.saveProgress(progress);
        return progress;
    },

    completeLab(moduleId) {
        const progress = this.getProgress();
        if (!progress.completedLabs.includes(moduleId)) {
            progress.completedLabs.push(moduleId);
        }
        this.saveProgress(progress);
        return progress;
    },

    completeInteractive(exerciseId) {
        const progress = this.getProgress();
        if (!progress.interactiveCompleted.includes(exerciseId)) {
            progress.interactiveCompleted.push(exerciseId);
        }
        this.saveProgress(progress);
        return progress;
    },

    setLastVisited(moduleId) {
        const progress = this.getProgress();
        progress.lastVisited = moduleId;
        this.saveProgress(progress);
    },

    updateStreak(progress) {
        const today = new Date().toISOString().split('T')[0];
        if (progress.streak.lastDate === today) return;

        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        if (progress.streak.lastDate === yesterday) {
            progress.streak.count++;
        } else if (progress.streak.lastDate !== today) {
            progress.streak.count = 1;
        }
        progress.streak.lastDate = today;
    },

    getStats() {
        const progress = this.getProgress();
        return {
            modulesCompleted: progress.completedModules.length,
            quizzesPassed: Object.values(progress.quizScores).filter(q => (q.score / q.total) >= 0.7).length,
            labsCompleted: progress.completedLabs.length,
            streak: progress.streak.count,
            interactiveCompleted: progress.interactiveCompleted.length
        };
    },

    getModuleStatus(moduleId) {
        const progress = this.getProgress();
        return {
            completed: progress.completedModules.includes(moduleId),
            quizScore: progress.quizScores[moduleId] || null,
            labCompleted: progress.completedLabs.includes(moduleId)
        };
    },

    resetAll() {
        localStorage.removeItem(this.STORAGE_KEY);
    },

    exportProgress() {
        const progress = this.getProgress();
        const blob = new Blob([JSON.stringify(progress, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `azure-academy-progress-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    },

    importProgress(file) {
        return new Promise((resolve, reject) => {
            if (!file || file.size > 1024 * 100) {
                return reject(new Error('File too large or missing (max 100KB)'));
            }
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    // Strict schema validation — only allow known fields
                    if (!Array.isArray(data.completedModules) || typeof data.quizScores !== 'object') {
                        return reject(new Error('Invalid progress file format'));
                    }
                    const sanitized = {
                        completedModules: data.completedModules.filter(id => typeof id === 'string' && id.length < 100),
                        quizScores: {},
                        completedLabs: Array.isArray(data.completedLabs) ? data.completedLabs.filter(id => typeof id === 'string' && id.length < 100) : [],
                        flashcardsReviewed: Array.isArray(data.flashcardsReviewed) ? data.flashcardsReviewed.filter(id => typeof id === 'string') : [],
                        interactiveCompleted: Array.isArray(data.interactiveCompleted) ? data.interactiveCompleted.filter(id => typeof id === 'string') : [],
                        lastVisited: typeof data.lastVisited === 'string' ? data.lastVisited.substring(0, 100) : null,
                        streak: { count: Math.max(0, parseInt(data.streak?.count) || 0), lastDate: typeof data.streak?.lastDate === 'string' ? data.streak.lastDate.substring(0, 10) : null },
                        startDate: typeof data.startDate === 'string' ? data.startDate.substring(0, 30) : new Date().toISOString(),
                        totalTimeMinutes: Math.max(0, parseInt(data.totalTimeMinutes) || 0),
                        notes: {}
                    };
                    // Validate quiz scores
                    if (data.quizScores && typeof data.quizScores === 'object') {
                        for (const [key, val] of Object.entries(data.quizScores)) {
                            if (typeof key === 'string' && key.length < 100 && val && typeof val.score === 'number' && typeof val.total === 'number') {
                                sanitized.quizScores[key] = { score: Math.max(0, val.score), total: Math.max(1, val.total), date: typeof val.date === 'string' ? val.date.substring(0, 30) : '' };
                            }
                        }
                    }
                    this.saveProgress(sanitized);
                    resolve(sanitized);
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = reject;
            reader.readAsText(file);
        });
    },

    getLevelProgress(level) {
        const progress = this.getProgress();
        const allModules = typeof MODULES !== 'undefined' ? MODULES : [];
        const levelModules = allModules.filter(m => m.level === level);
        const completed = levelModules.filter(m => progress.completedModules.includes(m.id));
        return { completed: completed.length, total: levelModules.length };
    }
};
