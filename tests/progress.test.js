const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');

function loadProgressManager() {
    const values = new Map();
    const context = {
        Blob: class Blob {},
        console,
        crypto: webcrypto,
        Date,
        document: { cookie: '' },
        FileReader: class FileReader {
            readAsText(file) {
                this.onload({ target: { result: file.contents } });
            }
        },
        localStorage: {
            getItem: key => values.has(key) ? values.get(key) : null,
            removeItem: key => values.delete(key),
            setItem: (key, value) => values.set(key, String(value))
        },
        location: { protocol: 'http:' },
        URL: { createObjectURL: () => 'blob:test', revokeObjectURL: () => {} }
    };
    vm.createContext(context);
    const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'progress.js'), 'utf8');
    vm.runInContext(`${source}\n;globalThis.__progressManager = ProgressManager;`, context);
    return context.__progressManager;
}

test('default progress uses the versioned mastery schema', () => {
    const manager = loadProgressManager();
    const progress = manager.defaultProgress();

    assert.equal(progress.schemaVersion, 2);
    assert.equal(Object.keys(progress.moduleMastery).length, 0);
});

test('quiz and lab evidence advance a module from learned to practiced', () => {
    const manager = loadProgressManager();
    const requirements = { quiz: true, lab: true, transfer: true };

    manager.saveQuizScore('module-a', 8, 10);
    assert.equal(manager.getMasteryStatus('module-a', requirements).state, 'learned');

    manager.completeLab('module-a');
    assert.equal(manager.getMasteryStatus('module-a', requirements).state, 'practiced');
});

test('viewing content does not count as learned when its quiz is still missing', () => {
    const manager = loadProgressManager();
    manager.markContentReviewed('module-a');

    const status = manager.getMasteryStatus('module-a', { quiz: true, lab: true, transfer: true });

    assert.equal(status.state, 'not_started');
    assert.deepEqual(Array.from(status.missing), ['quiz', 'lab', 'transfer']);
});

test('transfer evidence advances a practiced module to demonstrated', () => {
    const manager = loadProgressManager();
    const requirements = { quiz: true, lab: true, transfer: true };

    manager.saveQuizScore('module-a', 9, 10);
    manager.completeLab('module-a');
    manager.saveTransferResult('module-a', 3, 4, 'Explained the design and attached test evidence.');

    assert.equal(manager.getMasteryStatus('module-a', requirements).state, 'demonstrated');
});

test('four successful spaced reviews make demonstrated mastery durable', () => {
    const manager = loadProgressManager();
    const requirements = { quiz: true, lab: true, transfer: true };

    manager.saveQuizScore('module-a', 9, 10);
    manager.completeLab('module-a');
    manager.saveTransferResult('module-a', 4, 4, 'Independent task with evidence.');
    ['2026-07-27', '2026-07-30', '2026-08-06', '2026-08-27'].forEach(date => {
        manager.recordReview('module-a', true, `${date}T10:00:00.000Z`);
    });

    assert.equal(manager.getMasteryStatus('module-a', requirements).state, 'durable');
});

test('legacy completion is preserved but marked for revalidation', () => {
    const manager = loadProgressManager();
    const migrated = manager.normalizeProgress({
        completedModules: ['legacy-module'],
        quizScores: {},
        completedLabs: []
    });

    assert.equal(migrated.schemaVersion, 2);
    assert.equal(migrated.moduleMastery['legacy-module'].legacy, true);
    assert.equal(migrated.moduleMastery['legacy-module'].state, 'learned');
});

test('a due review appears only after demonstrated mastery', () => {
    const manager = loadProgressManager();
    manager.saveQuizScore('module-a', 9, 10);
    manager.completeLab('module-a');
    manager.saveTransferResult('module-a', 4, 4, 'Independent task with test evidence and a design explanation.');

    const due = manager.getDueReviews('2026-07-28T00:00:00.000Z');

    assert.deepEqual(Array.from(due), ['module-a']);
});

test('diagnostic results persist with a recommended starting module', () => {
    const manager = loadProgressManager();
    manager.saveDiagnosticResult('azure-dns', 7, 10, [1, 2, 0]);

    const result = manager.getProgress().diagnostic;

    assert.equal(result.recommendedModuleId, 'azure-dns');
    assert.equal(result.score, 7);
    assert.equal(result.total, 10);
    assert.deepEqual(Array.from(result.answers), [1, 2, 0]);
});

test('networking lab steps persist across reloads', () => {
    const manager = loadProgressManager();
    manager.saveLabSteps('azure-dns', [true, null, true]);

    assert.deepEqual(Array.from(manager.getLabSteps('azure-dns', 4)), [true, null, true, null]);
});

test('schema v2 imports preserve mastery, diagnostic, and lab-step evidence', async () => {
    const manager = loadProgressManager();
    const backup = manager.normalizeProgress({
        completedModules: ['azure-dns'],
        quizScores: { 'azure-dns': { score: 9, total: 10, date: '2026-07-26T10:00:00.000Z' } },
        completedLabs: ['azure-dns'],
        labSteps: { 'azure-dns': [true, null, true] },
        diagnostic: {
            recommendedModuleId: 'azure-dns',
            score: 7,
            total: 10,
            answers: [1, 2, 0],
            completedAt: '2026-07-26T10:00:00.000Z'
        },
        moduleMastery: {
            'azure-dns': {
                state: 'demonstrated',
                contentReviewed: true,
                quiz: { firstScore: 9, latestScore: 9, total: 10, criticalMisses: 0 },
                lab: { completed: true },
                transfer: {
                    score: 4,
                    max: 4,
                    scores: [4, 4, 4, 4],
                    reflection: 'Validated the design with an independent artifact and test evidence.'
                }
            }
        }
    });

    const imported = await manager.importProgress({
        size: JSON.stringify(backup).length,
        contents: JSON.stringify(backup)
    });

    assert.equal(imported.schemaVersion, 2);
    assert.equal(imported.diagnostic.recommendedModuleId, 'azure-dns');
    assert.deepEqual(Array.from(imported.labSteps['azure-dns']), [true, null, true]);
    assert.equal(imported.moduleMastery['azure-dns'].transfer.score, 4);
    assert.equal(manager.getProgress().moduleMastery['azure-dns'].state, 'demonstrated');
});
