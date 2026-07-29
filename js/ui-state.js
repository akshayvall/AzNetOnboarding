const UIStateManager = {
    STORAGE_KEY: 'networking-academy-ui-state:v1',
    VERSION: 1,

    defaultState() {
        return { version: this.VERSION, lastDestination: 'today', lastModuleId: null, lastSectionByModule: {}, lastTabByModule: {}, lastTouchedAtByModule: {}, activePath: 'networking-levels', savedReferenceIds: [], filterPreferences: {} };
    },
    normalize(value, validModuleIds = []) {
        if (!value || typeof value !== 'object' || Array.isArray(value) || value.version !== this.VERSION) return this.defaultState();
        const valid = new Set(validModuleIds);
        const accepts = id => typeof id === 'string' && (valid.size ? valid.has(id) : /^[A-Za-z0-9_-]+$/.test(id));
        const mapOfStrings = input => Object.fromEntries(Object.entries(input && typeof input === 'object' && !Array.isArray(input) ? input : {}).filter(([id, item]) => accepts(id) && typeof item === 'string').map(([id, item]) => [id, item.slice(0, 160)]));
        return {
            version: this.VERSION,
            lastDestination: ['today', 'learn', 'practice', 'build', 'more'].includes(value.lastDestination) ? value.lastDestination : 'today',
            lastModuleId: accepts(value.lastModuleId) ? value.lastModuleId : null,
            lastSectionByModule: mapOfStrings(value.lastSectionByModule),
            lastTabByModule: Object.fromEntries(Object.entries(mapOfStrings(value.lastTabByModule)).filter(([, tab]) => ['learn', 'diagrams', 'interactive', 'quiz', 'lab'].includes(tab))),
            lastTouchedAtByModule: mapOfStrings(value.lastTouchedAtByModule),
            activePath: typeof value.activePath === 'string' ? value.activePath.slice(0, 80) : 'networking-levels',
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
        catch { return this.defaultState(); }
        return normalized;
    },
    touchModule(moduleId, tab = 'learn', touchedAt = new Date().toISOString()) {
        const state = this.get();
        state.lastModuleId = moduleId;
        state.lastTabByModule[moduleId] = tab;
        state.lastTouchedAtByModule[moduleId] = touchedAt;
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
    }
};

if (typeof module !== 'undefined' && module.exports) module.exports = UIStateManager;