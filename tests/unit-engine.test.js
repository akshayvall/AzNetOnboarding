const test = require('node:test');
const assert = require('node:assert/strict');
const { existsSync } = require('node:fs');
const path = require('node:path');
const file = path.join(__dirname, '../js/unit-engine.js');
const units = { dns: [{ id: 'find-address' }, { id: 'cached-answer' }], afd: [{ id: 'edge' }] };
const load = () => {
    assert.ok(existsSync(file), 'a short-unit learning engine must exist');
    return require(file);
};

test('reading a module does not skip its unfinished unit or Try step', () => {
    const engine = load();
    const route = engine.resumeRoute([{ id: 'dns' }, { id: 'afd' }], {
        moduleMastery: { dns: { contentReviewed: true } }, lastVisited: 'dns'
    }, { lastModuleId: 'dns', lastUnitByModule: { dns: 'find-address' }, lastTabByModule: { dns: 'try' } }, units);
    assert.deepEqual(route, { moduleId: 'dns', unitId: 'find-address', tab: 'try' });
});

test('fallback resume skips only completed unit loops, not module readings', () => {
    const engine = load();
    const progress = { practiceChecks: { 'unit-dns--find-address-check': { passed: true } } };
    assert.deepEqual(engine.resumeRoute([{ id: 'dns' }, { id: 'afd' }], progress, {}, units),
        { moduleId: 'dns', unitId: 'cached-answer', tab: 'learn' });
});

test('invalid stored units cannot create missing pages', () => {
    const engine = load();
    assert.deepEqual(engine.resumeRoute([{ id: 'dns' }], {}, {
        lastModuleId: 'dns', lastUnitByModule: { dns: 'removed' }, lastTabByModule: { dns: 'check' }
    }, units), { moduleId: 'dns', unitId: 'find-address', tab: 'learn' });
});

test('unit progress distinguishes reading, practice, checks and self explanation', () => {
    const engine = load();
    const progress = {
        moduleMastery: { 'unit-dns--find-address': { contentReviewed: true } },
        practiceChecks: { 'unit-dns--find-address-try': { passed: true }, 'unit-dns--find-address-check': { passed: true } },
        notes: { 'unit-dns--find-address-explanation': 'The resolver finds an address, not the page.' }
    };
    assert.deepEqual(engine.unitStatus('dns', units.dns[0], progress),
        { read: true, practiced: true, checked: true, explained: true });
    assert.deepEqual(engine.unitStatus('dns', units.dns[1], progress),
        { read: false, practiced: false, checked: false, explained: false });
});
