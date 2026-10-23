const assert = require('node:assert/strict');
const test = require('node:test');

const UIStateManager = require('../js/ui-state.js');

test('beginner presentation is the default and switching never deletes other UI state', () => {
    global.localStorage = makeStorage();
    assert.equal(UIStateManager.get().experience, 'beginner');
    UIStateManager.saveDraft('frontdoor-advanced', { artifact: 'keep this draft' });
    UIStateManager.setExperience('full');
    assert.equal(UIStateManager.get().experience, 'full');
    assert.equal(UIStateManager.get().drafts['frontdoor-advanced'].artifact, 'keep this draft');
    assert.equal(UIStateManager.normalize({ version: 1, experience: 'bogus' }).experience, 'beginner');
});

const makeStorage = initial => {
    const values = new Map(initial ? [[UIStateManager.STORAGE_KEY, initial]] : []);
    return {
        getItem: key => values.get(key) ?? null,
        setItem: (key, value) => values.set(key, value),
        removeItem: key => values.delete(key)
    };
};

test('path, session length, mode, and bounded drafts survive reload', () => {
    global.localStorage = makeStorage();
    UIStateManager.setPreferences({ activePath: 'afd-diagnosis', sessionMinutes: 10 });
    UIStateManager.saveMode('frontdoor-advanced', 'browse');
    UIStateManager.saveDraft('frontdoor-advanced', { artifact: 'case analysis', reflection: 'x'.repeat(5000) });
    UIStateManager.saveDraft('frontdoor-advanced', { artifact: 'updated analysis' });
    const stored = UIStateManager.get(['frontdoor-advanced']);
    assert.equal(stored.activePath, 'afd-diagnosis');
    assert.equal(stored.sessionMinutes, 10);
    assert.equal(stored.moduleModeByModule['frontdoor-advanced'], 'browse');
    assert.equal(stored.drafts['frontdoor-advanced'].artifact, 'updated analysis');
    assert.equal(stored.drafts['frontdoor-advanced'].reflection.length, 4000);
});

test('failed draft writes return false and invalid session choices normalize safely', () => {
    global.localStorage = { ...makeStorage(), setItem() { throw new Error('quota'); } };
    assert.equal(UIStateManager.saveDraft('frontdoor-advanced', { artifact: 'pending draft' }), false);
    assert.equal(UIStateManager.normalize({ version: 1, sessionMinutes: -30 }).sessionMinutes, 25);
});

test('UI state uses a separate versioned academy key', () => {
    assert.equal(UIStateManager.STORAGE_KEY, 'networking-academy-ui-state:v1');
    assert.equal(UIStateManager.defaultState().version, 1);
});

test('corrupt state falls back safely', () => {
    global.localStorage = makeStorage('{bad json');
    assert.deepEqual(UIStateManager.get(['frontdoor-advanced']), UIStateManager.defaultState());
});

test('module, tab, and exact section survive normalized persistence', () => {
    global.localStorage = makeStorage();
    UIStateManager.touchModule('frontdoor-advanced', 'lab', '2026-07-29T10:00:00.000Z');
    UIStateManager.saveSection('frontdoor-advanced', 'rules-engine');
    const saved = UIStateManager.get(['frontdoor-advanced']);
    assert.equal(saved.lastModuleId, 'frontdoor-advanced');
    assert.equal(saved.lastTabByModule['frontdoor-advanced'], 'lab');
    assert.equal(saved.lastSectionByModule['frontdoor-advanced'], 'rules-engine');
});