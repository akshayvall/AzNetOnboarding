const UIStateManager = {
    STORAGE_KEY: 'networking-academy-ui-state:v1',
    VERSION: 1,

    defaultState() {
        return { version: this.VERSION, experience: 'beginner', lastDestination: 'today', lastModuleId: null, lastUnitByModule: {}, lastSectionByModule: {}, lastTabByModule: {}, lastTouchedAtByModule: {}, activePath: 'afd-diagnosis', sessionMinutes: 25, moduleModeByModule: {}, drafts: {}, savedReferenceIds: [], filterPreferences: {} };
    },
    normalize(value, validModuleIds = []) {
        if (!value || typeof value !== 'object' || Array.isArray(value) || value.version !== this.VERSION) return this.defaultState();
        const valid = new Set(validModuleIds);
        const accepts = id => typeof id === 'string' && (valid.size ? valid.has(id) : /^[A-Za-z0-9_-]+$/.test(id));
        const mapOfStrings = input => Object.fromEntries(Object.entries(input && typeof input === 'object' && !Array.isArray(input) ? input : {}).filter(([id, item]) => accepts(id) && typeof item === 'string').map(([id, item]) => [id, item.slice(0, 160)]));
        return {
            version: this.VERSION,
            experience: value.experience === 'full' ? 'full' : 'beginner',
            lastDestination: ['today', 'learn', 'practice', 'build', 'more', 'start', 'visual-lab'].includes(value.lastDestination) ? value.lastDestination : 'today',
            lastModuleId: accepts(value.lastModuleId) ? value.lastModuleId : null,
            lastUnitByModule: Object.fromEntries(Object.entries(mapOfStrings(value.lastUnitByModule)).filter(([, id]) => /^[a-z0-9-]+$/.test(id))),
            lastSectionByModule: mapOfStrings(value.lastSectionByModule),
            lastTabByModule: Object.fromEntries(Object.entries(mapOfStrings(value.lastTabByModule)).filter(([, tab]) => ['learn', 'try', 'check', 'reference', 'diagrams', 'interactive', 'quiz', 'lab'].includes(tab))),
            lastTouchedAtByModule: mapOfStrings(value.lastTouchedAtByModule),
            activePath: typeof value.activePath === 'string' ? value.activePath.slice(0, 80) : 'afd-diagnosis',
            sessionMinutes: [10, 25, 60].includes(value.sessionMinutes) ? value.sessionMinutes : 25,
            moduleModeByModule: Object.fromEntries(Object.entries(mapOfStrings(value.moduleModeByModule)).filter(([, mode]) => ['guided', 'browse'].includes(mode))),
            drafts: Object.fromEntries(Object.entries(value.drafts && typeof value.drafts === 'object' && !Array.isArray(value.drafts) ? value.drafts : {})
                .filter(([id, draft]) => accepts(id) && draft && typeof draft === 'object' && !Array.isArray(draft))
                .slice(0, 100).map(([id, draft]) => [id, Object.fromEntries(['artifact', 'reflection'].filter(field => typeof draft[field] === 'string').map(field => [field, draft[field].slice(0, 4000)]))])),
            savedReferenceIds: Array.isArray(value.savedReferenceIds) ? value.savedReferenceIds.filter(item => typeof item === 'string').slice(0, 200) : [],
            filterPreferences: value.filterPreferences && typeof value.filterPreferences === 'object' && !Array.isArray(value.filterPreferences) ? value.filterPreferences : {}
        };
    },
    get(validModuleIds = []) {
        try { return this.normalize(JSON.parse(localStorage.getItem(this.STORAGE_KEY)), validModuleIds); }
        catch { return this.defaultState(); }
    },
    save(state) {
        const normalized = this.normalize(state);
        try { localStorage.setItem(this.STORAGE_KEY, JSON.stringify(normalized)); }
        catch { return false; }
        return normalized;
    },
    touchModule(moduleId, tab = 'learn', touchedAt = new Date().toISOString()) {
        const state = this.get();
        state.lastModuleId = moduleId;
        state.lastTabByModule[moduleId] = tab;
        state.lastTouchedAtByModule[moduleId] = touchedAt;
        return this.save(state);
    },
    touchUnit(moduleId, unitId, tab) {
        const state = this.get();
        state.lastModuleId = moduleId;
        state.lastUnitByModule[moduleId] = unitId;
        state.lastTabByModule[moduleId] = tab;
        state.lastTouchedAtByModule[moduleId] = new Date().toISOString();
        return this.save(state);
    },
    saveSection(moduleId, sectionId, touchedAt = new Date().toISOString()) {
        const state = this.get();
        state.lastModuleId = moduleId;
        state.lastSectionByModule[moduleId] = sectionId;
        state.lastTouchedAtByModule[moduleId] = touchedAt;
        return this.save(state);
    },
    setDestination(destination) {
        const state = this.get();
        state.lastDestination = destination;
        return this.save(state);
    },
    setPreferences(preferences) {
        const state = this.get();
        state.activePath = preferences.activePath;
        state.sessionMinutes = preferences.sessionMinutes;
        return this.save(state);
    },
    saveMode(moduleId, mode) {
        const state = this.get();
        state.moduleModeByModule[moduleId] = mode;
        return this.save(state);
    },
    setExperience(experience) {
        const state = this.get();
        state.experience = experience;
        return this.save(state);
    },
    saveDraft(moduleId, draft) {
        const state = this.get();
        state.drafts[moduleId] = { ...state.drafts[moduleId], ...draft };
        return this.save(state);
    }
};

if (typeof module !== 'undefined' && module.exports) module.exports = UIStateManager;