/* ============================================
   PROGRESS TRACKING — cookie-anchored identity,
   localStorage-backed data (per-user namespaced)
   ============================================ */

const ProgressManager = {
    LEGACY_STORAGE_KEY: 'azure-networking-academy-progress',
    STORAGE_PREFIX: 'ana-progress:',
    USER_COOKIE: 'ana_uid',
    NAME_COOKIE: 'ana_uname',
    COOKIE_MAX_AGE_DAYS: 365,

    // ---- Cookie helpers ----
    readCookie(name) {
        const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/[-.+*?^$(){}|[\]\\]/g, '\\$&') + '=([^;]*)'));
        return match ? decodeURIComponent(match[1]) : null;
    },

    writeCookie(name, value, days) {
        const maxAge = Math.max(1, days || this.COOKIE_MAX_AGE_DAYS) * 86400;
        // Secure only when served over HTTPS; SameSite=Lax for normal navigation
        const secure = location.protocol === 'https:' ? '; Secure' : '';
        document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax${secure}`;
    },

    deleteCookie(name) {
        document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
    },

    generateUserId() {
        // RFC4122-ish v4 via crypto.getRandomValues, falling back to Math.random
        try {
            if (crypto && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
            const b = new Uint8Array(16);
            crypto.getRandomValues(b);
            b[6] = (b[6] & 0x0f) | 0x40;
            b[8] = (b[8] & 0x3f) | 0x80;
            const h = Array.from(b, x => x.toString(16).padStart(2, '0')).join('');
            return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;
        } catch {
            return 'u-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
        }
    },

    getUserId() {
        let uid = this.readCookie(this.USER_COOKIE);
        if (!uid || !/^[A-Za-z0-9_-]{6,64}$/.test(uid)) {
            uid = this.generateUserId();
            this.writeCookie(this.USER_COOKIE, uid, this.COOKIE_MAX_AGE_DAYS);
            // First-time user: migrate legacy single-tenant progress if present
            this.migrateLegacyProgress(uid);
        } else {
            // Refresh cookie lifetime on each visit so active users never lose identity
            this.writeCookie(this.USER_COOKIE, uid, this.COOKIE_MAX_AGE_DAYS);
        }
        return uid;
    },

    getUserName() {
        const n = this.readCookie(this.NAME_COOKIE);
        return n ? n.substring(0, 60) : null;
    },

    setUserName(name) {
        const clean = (name || '').toString().replace(/[<>\r\n\t]/g, '').trim().substring(0, 60);
        if (clean) this.writeCookie(this.NAME_COOKIE, clean, this.COOKIE_MAX_AGE_DAYS);
        else this.deleteCookie(this.NAME_COOKIE);
    },

    storageKey() {
        return this.STORAGE_PREFIX + this.getUserId();
    },

    migrateLegacyProgress(uid) {
        try {
            const legacy = localStorage.getItem(this.LEGACY_STORAGE_KEY);
            if (legacy) {
                const newKey = this.STORAGE_PREFIX + uid;
                if (!localStorage.getItem(newKey)) {
                    localStorage.setItem(newKey, legacy);
                }
                localStorage.removeItem(this.LEGACY_STORAGE_KEY);
            }
        } catch (e) { /* ignore */ }
    },

    getProgress() {
        try {
            const data = localStorage.getItem(this.storageKey());
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
            localStorage.setItem(this.storageKey(), JSON.stringify(progress));
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
        // Clear this user's progress but keep their identity cookie
        try { localStorage.removeItem(this.storageKey()); } catch {}
    },

    resetAllAndForgetUser() {
        // Full wipe: remove data + identity cookies
        try { localStorage.removeItem(this.storageKey()); } catch {}
        this.deleteCookie(this.USER_COOKIE);
        this.deleteCookie(this.NAME_COOKIE);
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
