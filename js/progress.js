/* ============================================
   PROGRESS TRACKING — cookie-anchored identity,
   localStorage-backed data (per-user namespaced)
   ============================================ */

const ProgressManager = {
    ACADEMY_ID: 'azure-networking',
    LEGACY_STORAGE_KEY: 'azure-networking-academy-progress',
    STORAGE_PREFIX: 'ana-progress:',
    MAX_IMPORT_BYTES: 1024 * 1024,
    USER_COOKIE: 'ana_uid',
    NAME_COOKIE: 'ana_uname',
    COOKIE_MAX_AGE_DAYS: 365,
    CURRENT_SCHEMA_VERSION: 2,
    REVIEW_INTERVAL_DAYS: [1, 3, 7, 21, 60],

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
        if (this._pendingProgress) return this.normalizeProgress(this._pendingProgress);
        return this.readStoredProgress();
    },

    readStoredProgress() {
        let raw;
        try {
            raw = localStorage.getItem(this.storageKey());
        } catch {
            this._readBlockedMessage = 'Saved progress cannot be read. Restore browser storage access, export your work, then import a supported backup or reset after confirmation.';
            this.setStorageStatus(false, this._readBlockedMessage);
            return this.defaultProgress();
        }
        if (raw === null) return this.defaultProgress();
        try {
            const data = JSON.parse(raw);
            this.validateProgress(data);
            return this.normalizeProgress(data);
        } catch {
            this._recoveryRaw = raw;
            this._readBlockedMessage = 'Saved progress is unreadable or uses an unsupported version. Export a recovery backup, then import a supported backup or reset after confirmation. The original record has been kept.';
            this.setStorageStatus(false, this._readBlockedMessage);
            return this.defaultProgress();
        }
    },

    defaultProgress() {
        return {
            schemaVersion: this.CURRENT_SCHEMA_VERSION,
            completedModules: [],
            quizScores: {},
            completedLabs: [],
            flashcardsReviewed: [],
            interactiveCompleted: [],
            lastVisited: null,
            streak: { count: 0, lastDate: null },
            startDate: new Date().toISOString(),
            totalTimeMinutes: 0,
            notes: {},
            labSteps: {},
            diagnostic: null,
            moduleMastery: {},
            practiceChecks: {},
            artifactPractice: {}
        };
    },

    normalizeProgress(data) {
        const defaults = this.defaultProgress();
        const isRecord = value => value && typeof value === 'object' && !Array.isArray(value);
        const stringArray = value => Array.isArray(value) ? value.filter(item => typeof item === 'string') : [];
        data = isRecord(data) ? data : {};
        const completedModules = stringArray(data.completedModules);
        const moduleMastery = isRecord(data.moduleMastery)
            ? Object.fromEntries(Object.entries(data.moduleMastery)
                .filter(([moduleId, value]) => typeof moduleId === 'string' && isRecord(value))
                .map(([moduleId, value]) => [moduleId, this.normalizeMasteryEntry(value)]))
            : {};
        completedModules.forEach(moduleId => {
            if (!moduleMastery[moduleId]) {
                moduleMastery[moduleId] = this.normalizeMasteryEntry({
                    state: 'learned',
                    legacy: true,
                    contentReviewed: true
                });
            }
        });
        const quizScores = isRecord(data.quizScores)
            ? Object.fromEntries(Object.entries(data.quizScores).filter(([, score]) =>
                isRecord(score) && this.isValidScore(score.score, score.total))
                .map(([moduleId, score]) => [moduleId, { ...score, criticalMisses: this.normalizeCriticalMisses(score.criticalMisses) }]))
            : {};
        const labSteps = isRecord(data.labSteps)
            ? Object.fromEntries(Object.entries(data.labSteps)
                .filter(([, steps]) => Array.isArray(steps))
                .map(([moduleId, steps]) => [moduleId, steps.map(step => step === true ? true : null)]))
            : {};
        return {
            schemaVersion: this.CURRENT_SCHEMA_VERSION,
            completedModules,
            quizScores,
            completedLabs: stringArray(data.completedLabs),
            flashcardsReviewed: stringArray(data.flashcardsReviewed),
            interactiveCompleted: stringArray(data.interactiveCompleted),
            lastVisited: typeof data.lastVisited === 'string' ? data.lastVisited : null,
            streak: isRecord(data.streak) && Number.isFinite(data.streak.count)
                ? { count: Math.max(0, data.streak.count), lastDate: typeof data.streak.lastDate === 'string' ? data.streak.lastDate : null }
                : defaults.streak,
            startDate: typeof data.startDate === 'string' ? data.startDate : defaults.startDate,
            totalTimeMinutes: Number.isFinite(data.totalTimeMinutes) && data.totalTimeMinutes >= 0 ? data.totalTimeMinutes : 0,
            notes: isRecord(data.notes) ? data.notes : {},
            labSteps,
            diagnostic: isRecord(data.diagnostic) && typeof data.diagnostic.recommendedModuleId === 'string'
                ? {
                    recommendedModuleId: data.diagnostic.recommendedModuleId,
                    score: Math.max(0, Number(data.diagnostic.score) || 0),
                    total: Math.max(1, Number(data.diagnostic.total) || 1),
                    answers: Array.isArray(data.diagnostic.answers) ? data.diagnostic.answers.slice(0, 50) : [],
                    completedAt: typeof data.diagnostic.completedAt === 'string' ? data.diagnostic.completedAt : null
                }
                : null,
            moduleMastery,
            practiceChecks: isRecord(data.practiceChecks)
                ? Object.fromEntries(Object.entries(data.practiceChecks).filter(([, value]) => isRecord(value))
                    .map(([moduleId, value]) => [moduleId, {
                        passed: value.passed === true,
                        attempts: Math.max(1, this.normalizeCount(value.attempts)),
                        completedAt: typeof value.completedAt === 'string' ? value.completedAt : null
                    }]))
                : {},
            artifactPractice: isRecord(data.artifactPractice)
                ? Object.fromEntries(Object.entries(data.artifactPractice)
                    .filter(([, value]) => isRecord(value) && typeof value.evidence === 'string' && value.evidence.trim().length >= 40)
                    .map(([moduleId, value]) => [moduleId, {
                        evidence: value.evidence.trim().slice(0, 4000),
                        completedAt: typeof value.completedAt === 'string' ? value.completedAt : null
                    }]))
                : {}
        };
    },

    isValidScore(score, total) {
        return Number.isFinite(score) && Number.isFinite(total) && total > 0 && score >= 0 && score <= total;
    },

    normalizeCount(value) {
        return Number.isFinite(Number(value)) ? Math.max(0, Math.floor(Number(value))) : 0;
    },

    normalizeCriticalMisses(value) {
        if (value === undefined) return 0;
        return Number.isSafeInteger(value) && value >= 0 ? value : 1;
    },

    normalizeTransferMetadata(metadata, fallback = 'self-assessed') {
        if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return null;
        const provenance = metadata.provenance === undefined ? fallback : metadata.provenance;
        if (!['self-assessed', 'legacy-self-assessed', 'reviewer-assessed'].includes(provenance)) return null;
        if (provenance !== 'reviewer-assessed') return { provenance };
        const reviewer = typeof metadata.reviewer === 'string' ? metadata.reviewer.trim() : '';
        if (reviewer.length < 2 || reviewer.length > 100) return null;
        return { provenance, reviewer };
    },

    normalizeMasteryEntry(value) {
        const isRecord = item => item && typeof item === 'object' && !Array.isArray(item);
        const quiz = isRecord(value.quiz) && this.isValidScore(value.quiz.latestScore, value.quiz.total)
            ? {
                firstScore: this.isValidScore(value.quiz.firstScore, value.quiz.total) ? value.quiz.firstScore : value.quiz.latestScore,
                latestScore: value.quiz.latestScore,
                total: value.quiz.total,
                criticalMisses: this.normalizeCriticalMisses(value.quiz.criticalMisses),
                completedAt: typeof value.quiz.completedAt === 'string' ? value.quiz.completedAt : null
            }
            : null;
        const transfer = isRecord(value.transfer) && this.isValidScore(value.transfer.score, value.transfer.max)
            ? {
                score: value.transfer.score,
            max: value.transfer.max,
                scores: Array.isArray(value.transfer.scores) ? value.transfer.scores.slice(0, 4) : [],
            reflection: typeof value.transfer.reflection === 'string' ? value.transfer.reflection.trim().slice(0, 4000) : '',
            completedAt: typeof value.transfer.completedAt === 'string' ? value.transfer.completedAt : null,
            ...(this.normalizeTransferMetadata(value.transfer, 'legacy-self-assessed') || { provenance: 'legacy-self-assessed' })
            }
            : null;
        const review = isRecord(value.review) ? value.review : {};
        return {
            state: ['not_started', 'learned', 'practiced', 'demonstrated', 'durable'].includes(value.state) ? value.state : 'not_started',
            legacy: value.legacy === true,
            contentReviewed: value.contentReviewed === true,
            quiz,
            lab: {
                completed: Boolean(value.lab && value.lab.completed === true),
                completedAt: value.lab && typeof value.lab.completedAt === 'string' ? value.lab.completedAt : null
            },
            transfer,
            review: {
                successfulReviews: this.normalizeCount(review.successfulReviews),
                intervalIndex: Math.min(this.normalizeCount(review.intervalIndex), this.REVIEW_INTERVAL_DAYS.length - 1),
                nextDue: typeof review.nextDue === 'string' ? review.nextDue : null,
                attempts: Array.isArray(review.attempts) ? review.attempts.map(attempt => isRecord(attempt) ? { ...attempt } : attempt) : []
            }
        };
    },

    ensureMasteryEntry(progress, moduleId) {
        if (!progress.moduleMastery) progress.moduleMastery = {};
        if (!progress.moduleMastery[moduleId]) progress.moduleMastery[moduleId] = this.normalizeMasteryEntry({});
        return progress.moduleMastery[moduleId];
    },

    addDays(isoDate, days) {
        const date = new Date(isoDate);
        date.setUTCDate(date.getUTCDate() + days);
        return date.toISOString();
    },

    dateTimestamp(value) {
        if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}(?:T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2}))?$/.test(value)) return NaN;
        const timestamp = Date.parse(value);
        const calendarDate = new Date(value.slice(0, 10));
        if (!Number.isFinite(timestamp) || !Number.isFinite(calendarDate.getTime()) ||
            calendarDate.toISOString().slice(0, 10) !== value.slice(0, 10)) return NaN;
        return timestamp;
    },

    hasPassingTransfer(transfer) {
        return Boolean(transfer && this.isValidScore(transfer.score, transfer.max) &&
            transfer.score / transfer.max >= 0.75 && typeof transfer.reflection === 'string' && transfer.reflection.trim().length >= 20);
    },

    isEntryReviewDue(entry, nowMs) {
        if (!entry || !this.hasPassingTransfer(entry.transfer) || !Number.isFinite(nowMs)) return false;
        const dueMs = this.dateTimestamp(entry.review.nextDue);
        return Number.isFinite(dueMs) && dueMs <= nowMs && !entry.review.attempts.some(attempt => attempt &&
            (this.dateTimestamp(attempt.dueAt) === dueMs || this.dateTimestamp(attempt.reviewedAt) >= dueMs));
    },

    markContentReviewed(moduleId) {
        const progress = this.getProgress();
        const entry = this.ensureMasteryEntry(progress, moduleId);
        entry.contentReviewed = true;
        if (entry.state === 'not_started') entry.state = 'learned';
        this.saveProgress(progress);
        return progress;
    },

    saveDiagnosticResult(recommendedModuleId, score, total, answers) {
        const progress = this.getProgress();
        progress.diagnostic = {
            recommendedModuleId,
            score,
            total,
            answers: Array.isArray(answers) ? answers.slice(0, 50) : [],
            completedAt: new Date().toISOString()
        };
        this.saveProgress(progress);
        return progress;
    },

    getLabSteps(moduleId, total) {
        const progress = this.getProgress();
        const saved = (progress.labSteps && progress.labSteps[moduleId]) || [];
        const steps = new Array(total).fill(null);
        saved.forEach((value, index) => { if (index < total) steps[index] = value === true ? true : null; });
        return steps;
    },

    saveLabSteps(moduleId, stepResults) {
        const progress = this.getProgress();
        if (!progress.labSteps) progress.labSteps = {};
        progress.labSteps[moduleId] = stepResults.map(value => value === true ? true : null);
        this.saveProgress(progress);
        return progress;
    },

    saveProgress(progress, { importing = false } = {}) {
        if (!importing) {
            if (!this._readBlockedMessage) this.readStoredProgress();
            if (this._readBlockedMessage) {
                this._pendingProgress = progress;
                return this.setStorageStatus(false, this._readBlockedMessage);
            }
        }
        try {
            localStorage.setItem(this.storageKey(), JSON.stringify(progress));
            this._pendingProgress = null;
            this._readBlockedMessage = '';
            this._recoveryRaw = null;
            return this.setStorageStatus(true);
        } catch {
            if (!importing) this._pendingProgress = progress;
            return this.setStorageStatus(false, 'Progress is not saved on this device. Export a backup or retry before closing this page.' +
                (this._readBlockedMessage ? ' ' + this._readBlockedMessage : ''));
        }
    },

    setStorageStatus(saved, message = '') {
        const previous = this._storageStatus;
        this._storageStatus = { saved, message, recoveryRequired: Boolean(this._readBlockedMessage) };
        const changed = !previous || previous.saved !== saved || previous.message !== message ||
            previous.recoveryRequired !== this._storageStatus.recoveryRequired;
        if (changed && typeof document !== 'undefined' && typeof document.dispatchEvent === 'function' && typeof CustomEvent === 'function') {
            try {
                document.dispatchEvent(new CustomEvent('academy-storage-change', { detail: { ...this._storageStatus } }));
            } catch {}
        }
        return saved;
    },

    getStorageStatus() {
        if (!this._storageStatus) this.readStoredProgress();
        return { ...(this._storageStatus || { saved: true, message: '', recoveryRequired: false }) };
    },

    retrySave() {
        return this.saveProgress(this.getProgress());
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

    saveQuizScore(moduleId, score, total, criticalMisses = 0) {
        if (!this.isValidScore(score, total)) return false;
        criticalMisses = this.normalizeCriticalMisses(criticalMisses);
        const progress = this.getProgress();
        const completedAt = new Date().toISOString();
        progress.quizScores[moduleId] = { score, total, criticalMisses, date: completedAt };
        const entry = this.ensureMasteryEntry(progress, moduleId);
        entry.contentReviewed = true;
        entry.quiz = {
            firstScore: entry.quiz ? entry.quiz.firstScore : score,
            latestScore: score,
            total,
            criticalMisses: Math.max(0, criticalMisses),
            completedAt
        };
        entry.review.nextDue = entry.review.nextDue || this.addDays(completedAt, this.REVIEW_INTERVAL_DAYS[0]);
        this.saveProgress(progress);
        return progress;
    },

    completeLab(moduleId) {
        const progress = this.getProgress();
        if (!progress.completedLabs.includes(moduleId)) {
            progress.completedLabs.push(moduleId);
        }
        const entry = this.ensureMasteryEntry(progress, moduleId);
        entry.contentReviewed = true;
        entry.lab = { completed: true, completedAt: new Date().toISOString() };
        this.saveProgress(progress);
        return progress;
    },

    savePracticeResult(moduleId, passed) {
        const progress = this.getProgress();
        progress.practiceChecks[moduleId] = {
            passed: passed === true,
            attempts: this.normalizeCount(progress.practiceChecks[moduleId]?.attempts) + 1,
            completedAt: new Date().toISOString()
        };
        return this.saveProgress(progress);
    },

    saveArtifactPractice(moduleId, evidence) {
        if (typeof evidence !== 'string' || evidence.trim().length < 40) return false;
        const progress = this.getProgress();
        progress.artifactPractice[moduleId] = {
            evidence: evidence.trim().slice(0, 4000),
            completedAt: new Date().toISOString()
        };
        return this.saveProgress(progress);
    },

    saveTransferResult(moduleId, score, max, reflection = '', scores = [], metadata = {}, reviewerMetadata) {
        const suppliedMetadata = reviewerMetadata === undefined
            ? (metadata && typeof metadata === 'object' && !Array.isArray(metadata) ? metadata : {})
            : reviewerMetadata;
        const assessment = this.normalizeTransferMetadata(suppliedMetadata);
        if (!this.isValidScore(score, max) || !assessment) return false;
        const progress = this.getProgress();
        const entry = this.ensureMasteryEntry(progress, moduleId);
        entry.contentReviewed = true;
        entry.transfer = {
            score,
            max,
            scores: Array.isArray(scores) ? scores.slice(0, 4) : [],
            reflection: String(reflection).trim().slice(0, 4000),
            completedAt: new Date().toISOString(),
            ...assessment
        };
        this.saveProgress(progress);
        return progress;
    },

    recordReview(moduleId, passed, reviewedAt = new Date().toISOString()) {
        const reviewedMs = this.dateTimestamp(reviewedAt);
        if (typeof passed !== 'boolean' || !Number.isFinite(reviewedMs)) return false;
        const progress = this.getProgress();
        const entry = progress.moduleMastery[moduleId];
        if (!this.isEntryReviewDue(entry, reviewedMs)) return false;
        const successfulReviews = entry.review.successfulReviews + (passed ? 1 : 0);
        const intervalIndex = passed ? Math.min(successfulReviews, this.REVIEW_INTERVAL_DAYS.length - 1) : 0;
        const timestamp = new Date(reviewedMs).toISOString();
        let nextDue;
        try {
            nextDue = this.addDays(timestamp, this.REVIEW_INTERVAL_DAYS[intervalIndex]);
        } catch {
            return false;
        }
        entry.review.attempts.push({ passed, reviewedAt: timestamp, dueAt: entry.review.nextDue });
        entry.review.successfulReviews = successfulReviews;
        entry.review.intervalIndex = intervalIndex;
        entry.review.nextDue = nextDue;
        return this.saveProgress(progress) ? progress : false;
    },

    getMasteryStatus(moduleId, requirements = {}) {
        const progress = this.getProgress();
        const entry = this.ensureMasteryEntry(progress, moduleId);
        const quizRequired = requirements.quiz === true;
        const labRequired = requirements.lab === true;
        const transferRequired = requirements.transfer === true;
        const quizPassed = !quizRequired || Boolean(entry.quiz &&
            entry.quiz.latestScore / entry.quiz.total >= 0.8 && entry.quiz.criticalMisses === 0);
        const artifact = progress.artifactPractice[moduleId];
        const labPassed = !labRequired || entry.lab.completed || Boolean(artifact);
        const labProvenance = entry.lab.completed || artifact ? 'self-attested' : null;
        const transferPassed = !transferRequired || this.hasPassingTransfer(entry.transfer);
        const learned = entry.legacy || (quizRequired ? Boolean(entry.quiz) && quizPassed : entry.contentReviewed);
        let state = learned ? 'learned' : 'not_started';
        if (learned && quizPassed && labPassed) state = 'practiced';
        if (state === 'practiced' && transferRequired && transferPassed) state = 'demonstrated';
        if (state === 'demonstrated' && entry.review.successfulReviews >= 4) state = 'durable';
        entry.state = state;
        const missing = [];
        if (!quizPassed) missing.push('quiz');
        if (!labPassed) missing.push('lab');
        if (transferRequired && !transferPassed) missing.push('transfer');
        if (state === 'demonstrated' && entry.review.successfulReviews < 4) missing.push('spaced review');
        return { state, missing, entry, quizPassed, labPassed, labProvenance, transferPassed };
    },

    getDueReviews(now = new Date().toISOString()) {
        const progress = this.getProgress();
        const nowMs = this.dateTimestamp(now);
        return Object.entries(progress.moduleMastery)
            .filter(([, entry]) => this.isEntryReviewDue(entry, nowMs))
            .sort(([, left], [, right]) => new Date(left.review.nextDue) - new Date(right.review.nextDue))
            .map(([moduleId]) => moduleId);
    },

    isReviewDue(moduleId, now = new Date().toISOString()) {
        return this.getDueReviews(now).includes(moduleId);
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
            quizzesPassed: Object.values(progress.quizScores).filter(quiz => quiz.score / quiz.total >= 0.8 && quiz.criticalMisses === 0).length,
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
        try {
            const key = this.storageKey();
            localStorage.removeItem(key);
            if (localStorage.getItem(key) !== null) throw new Error('Progress was not deleted');
            this._pendingProgress = null;
            this._readBlockedMessage = '';
            this._recoveryRaw = null;
            return this.setStorageStatus(true);
        } catch {
            return this.setStorageStatus(false, 'Progress could not be reset. Unsaved work has been kept. Restore browser storage access and retry.');
        }
    },

    resetAllAndForgetUser() {
        // Full wipe: remove data + identity cookies
        if (!this.resetAll()) return false;
        try {
            this.deleteCookie(this.USER_COOKIE);
            this.deleteCookie(this.NAME_COOKIE);
            if (this.readCookie(this.USER_COOKIE) || this.readCookie(this.NAME_COOKIE)) throw new Error('Identity was not deleted');
            return true;
        } catch {
            return this.setStorageStatus(false, 'Progress was reset, but the local identity could not be removed. Check browser cookie settings and retry.');
        }
    },

    createExport() {
        return {
            ...this.getProgress(),
            academyId: this.ACADEMY_ID,
            exportVersion: 1,
            exportedAt: new Date().toISOString()
        };
    },

    exportProgress() {
        const exported = this.createExport();
        const recovering = typeof this._recoveryRaw === 'string';
        const progress = recovering ? {
            academyId: this.ACADEMY_ID,
            recoveryVersion: 1,
            exportedAt: exported.exportedAt,
            rawProgress: this._recoveryRaw,
            pendingProgress: this._pendingProgress ? exported : null
        } : exported;
        const blob = new Blob([JSON.stringify(progress, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `azure-academy-progress-${recovering ? 'recovery-' : ''}${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    },

    importProgress(file) {
        return new Promise((resolve, reject) => {
            if (!file) return reject(new Error('Progress file is missing'));
            if (file.name !== undefined && (typeof file.name !== 'string' || !/\.json$/i.test(file.name))) {
                return reject(new Error('Progress file must be JSON'));
            }
            if (file.type !== undefined && (typeof file.type !== 'string' ||
                !['', 'application/json', 'text/json', 'text/plain', 'application/octet-stream'].includes(file.type.toLowerCase()))) {
                return reject(new Error('Progress file type must be JSON'));
            }
            if (!Number.isFinite(file.size) || file.size < 0 || file.size > this.MAX_IMPORT_BYTES) {
                return reject(new Error('Progress file is too large'));
            }
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const text = event.target.result;
                    if (typeof text !== 'string') throw new Error('Invalid progress file format');
                    if (new Blob([text]).size > this.MAX_IMPORT_BYTES) throw new Error('Progress file is too large');
                    const data = JSON.parse(text);
                    this.validateProgress(data, { importing: true });
                    const normalized = this.normalizeProgress(data);
                    if (!this.saveProgress(normalized, { importing: true })) {
                        throw new Error(this.getStorageStatus().message);
                    }
                    resolve(normalized);
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = () => reject(new Error('Unable to read progress file'));
            reader.onabort = () => reject(new Error('Progress file read was cancelled'));
            reader.readAsText(file);
        });
    },

    validateProgress(data, { importing = false } = {}) {
        const isRecord = value => value && typeof value === 'object' && !Array.isArray(value);
        if (!isRecord(data) || !Array.isArray(data.completedModules) || !isRecord(data.quizScores)) {
            throw new Error('Invalid progress file format');
        }
        if (data.schemaVersion !== undefined && (!Number.isInteger(data.schemaVersion) ||
            data.schemaVersion < 1 || data.schemaVersion > this.CURRENT_SCHEMA_VERSION)) {
            throw new Error('Unsupported progress schema version');
        }
        const hasMetadata = ['academyId', 'exportVersion', 'exportedAt'].some(field => Object.hasOwn(data, field));
        if (hasMetadata) {
            if (data.academyId !== this.ACADEMY_ID) throw new Error('Progress file belongs to a different academy');
            if (data.exportVersion !== 1) throw new Error('Unsupported progress export version');
            if (data.schemaVersion === undefined) throw new Error('Progress export is missing its schema version');
            if (!Number.isFinite(this.dateTimestamp(data.exportedAt))) {
                throw new Error('Invalid progress export date');
            }
        }
        const moduleIds = [...data.completedModules];
        for (const field of ['completedLabs', 'flashcardsReviewed', 'interactiveCompleted']) {
            if (data[field] === undefined) continue;
            if (!Array.isArray(data[field]) || data[field].some(value => typeof value !== 'string')) {
                throw new Error('Invalid progress file format');
            }
            if (field === 'completedLabs') moduleIds.push(...data[field]);
        }
        for (const field of ['quizScores', 'notes', 'labSteps', 'visitedSections', 'moduleMastery', 'practiceChecks', 'artifactPractice']) {
            if (data[field] === undefined) continue;
            if (!isRecord(data[field])) throw new Error('Invalid progress file format');
            if (['quizScores', 'moduleMastery', 'practiceChecks', 'artifactPractice'].includes(field) &&
                Object.values(data[field]).some(value => !isRecord(value))) throw new Error('Invalid progress file format');
            if (['labSteps', 'visitedSections'].includes(field) &&
                Object.values(data[field]).some(value => !Array.isArray(value))) throw new Error('Invalid progress file format');
            moduleIds.push(...Object.keys(data[field]));
        }
        for (const entry of Object.values(data.moduleMastery || {})) {
            if (['quiz', 'lab', 'transfer', 'review'].some(field => entry[field] != null && !isRecord(entry[field]))) {
                throw new Error('Invalid progress file format');
            }
            if (entry.review?.attempts !== undefined && !Array.isArray(entry.review.attempts)) {
                throw new Error('Invalid progress file format');
            }
        }
        if (data.lastVisited != null) moduleIds.push(data.lastVisited);
        if (data.diagnostic != null) {
            if (!isRecord(data.diagnostic)) throw new Error('Invalid progress file format');
            moduleIds.push(data.diagnostic.recommendedModuleId);
        }
        if (moduleIds.some(moduleId => typeof moduleId !== 'string' || !moduleId.trim() || moduleId.length > 100 ||
            ['__proto__', 'prototype', 'constructor'].includes(moduleId))) {
            throw new Error('Invalid module ID in progress file');
        }
        if (importing && !hasMetadata && moduleIds.some(moduleId => !this.isLegacyModuleId(moduleId))) {
            throw new Error('Legacy progress contains a module from a different or unknown academy');
        }
    },

    isLegacyModuleId(moduleId) {
        if (typeof MODULES !== 'undefined') {
            return Array.isArray(MODULES) && MODULES.some(module => module.id === moduleId);
        }
        return moduleId === 'nsgs' ||
            /^(?:net-|azure-|frontdoor-|load-balancing-|vpn-|peering-|network-|az104-|nat-|route-tables-|capstone-hub-)[a-z0-9][a-z0-9-]*$/.test(moduleId);
    },

    getLevelProgress(level) {
        const progress = this.getProgress();
        const allModules = typeof MODULES !== 'undefined' ? MODULES : [];
        const levelModules = allModules.filter(m => m.level === level);
        const completed = levelModules.filter(m => progress.completedModules.includes(m.id));
        return { completed: completed.length, total: levelModules.length };
    }
};
