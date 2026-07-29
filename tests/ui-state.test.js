const assert = require('node:assert/strict');
const test = require('node:test');

const UIStateManager = require('../js/ui-state.js');

const makeStorage = initial => {
    const values = new Map(initial ? [[UIStateManager.STORAGE_KEY, initial]] : []);
    return {
        getItem: key => values.get(key) ?? null,
        setItem: (key, value) => values.set(key, value),
        removeItem: key => values.delete(key)
    };
};

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