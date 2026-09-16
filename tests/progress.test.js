const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');

function cookieDocument() {
    const cookies = new Map();
    return {
        get cookie() { return Array.from(cookies, ([name, value]) => `${name}=${value}`).join('; '); },
        set cookie(value) {
            const pair = value.split(';')[0];
            const separator = pair.indexOf('=');
            const name = pair.slice(0, separator);
            if (/max-age=0(?:;|$)/i.test(value)) cookies.delete(name);
            else cookies.set(name, pair.slice(separator + 1));
        }
    };
}

function loadProgressManager({ failWrites = false, values = new Map(), faults = {}, globals = {} } = {}) {
    const context = {
        Blob,
        console: failWrites ? { error() {} } : console,
        crypto: webcrypto,
        Date,
        document: cookieDocument(),
        FileReader: class FileReader {
            readAsText(file) {
                this.onload({ target: { result: file.contents } });
            }
        },
        localStorage: {
            getItem: key => {
                if (faults.failReads && key === faults.key) throw new Error('Storage read denied');
                return values.has(key) ? values.get(key) : null;
            },
            removeItem: key => {
                if (faults.failDeletes && key === faults.key) throw new Error('Storage delete denied');
                if (!faults.ignoreDeletes) values.delete(key);
            },
            setItem: (key, value) => {
                if (failWrites || (faults.failWrites && key === faults.key)) {
                    faults.rejectedWrites = (faults.rejectedWrites || 0) + 1;
                    throw new Error('Storage quota exceeded');
                }
                values.set(key, String(value));
            }
        },
        location: { protocol: 'http:' },
        URL: { createObjectURL: () => 'blob:test', revokeObjectURL: () => {} },
        ...globals
    };
    vm.createContext(context);
    const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'progress.js'), 'utf8');
    vm.runInContext(`${source}\n;globalThis.__progressManager = ProgressManager;`, context);
    return context.__progressManager;
}

function progressFile(data, overrides = {}) {
    const contents = typeof data === 'string' ? data : JSON.stringify(data);
    return { name: 'progress.json', type: 'application/json', size: Buffer.byteLength(contents), contents, ...overrides };
}

function seedDueReview(manager, moduleId = 'azure-dns') {
    const progress = manager.defaultProgress();
    progress.moduleMastery[moduleId] = manager.normalizeMasteryEntry({
        contentReviewed: true,
        quiz: { firstScore: 9, latestScore: 9, total: 10, criticalMisses: 0, completedAt: '2026-07-26T10:00:00.000Z' },
        lab: { completed: true, completedAt: '2026-07-26T10:00:00.000Z' },
        transfer: { score: 4, max: 4, reflection: 'Independent artifact with test evidence.', completedAt: '2026-07-26T10:00:00.000Z' },
        review: { nextDue: '2026-07-27T10:00:00.000Z' }
    });
    manager.saveProgress(progress);
}

test('quota-rejected imports preserve the committed record and report failure', async () => {
    const values = new Map();
    const faults = {};
    const manager = loadProgressManager({ values, faults });
    const previous = manager.defaultProgress();
    previous.completedModules = ['azure-dns'];
    assert.equal(manager.saveProgress(previous), true);
    const key = manager.storageKey();
    const raw = values.get(key);
    faults.key = key;
    faults.failWrites = true;

    await assert.rejects(manager.importProgress(progressFile(manager.defaultProgress())), /save|storage/i);

    assert.equal(faults.rejectedWrites, 1);
    assert.equal(values.get(key), raw);
    assert.deepEqual(Array.from(manager.getProgress().completedModules), ['azure-dns']);
    assert.equal(manager.getStorageStatus().saved, false);
});

test('quota-rejected imports restore the previous pending snapshot for retry', async () => {
    const values = new Map();
    const faults = {};
    const manager = loadProgressManager({ values, faults });
    manager.saveProgress(manager.defaultProgress());
    const key = manager.storageKey();
    const raw = values.get(key);
    faults.key = key;
    faults.failWrites = true;
    manager.saveQuizScore('azure-dns', 8, 10);
    const pending = JSON.stringify(manager.getProgress());

    await assert.rejects(manager.importProgress(progressFile(manager.defaultProgress())), /save|storage/i);

    assert.equal(faults.rejectedWrites, 2);
    assert.equal(values.get(key), raw);
    assert.equal(JSON.stringify(manager.getProgress()), pending);
    assert.equal(manager.getStorageStatus().saved, false);
    faults.failWrites = false;
    assert.equal(manager.retrySave(), true);
    assert.equal(values.get(key), pending);
});

test('failed saves are signaled and retain exportable work', () => {
    const manager = loadProgressManager({ failWrites: true });
    const progress = manager.defaultProgress();
    progress.completedModules = ['module-a'];

    assert.equal(manager.saveProgress(progress), false);
    assert.deepEqual(Array.from(manager.getProgress().completedModules), ['module-a']);
    assert.equal(manager.getStorageStatus().saved, false);
});

test('successful saves explicitly confirm persistence', () => {
    const manager = loadProgressManager();

    assert.equal(manager.saveProgress(manager.defaultProgress()), true);
    assert.equal(manager.getStorageStatus().saved, true);
});

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

    seedDueReview(manager, 'module-a');
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

    const nextDue = manager.getProgress().moduleMastery['module-a'].review.nextDue;
    const due = manager.getDueReviews(nextDue);

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

test('exports identify the academy and round trip all existing progress fields', async () => {
    const values = new Map();
    const manager = loadProgressManager({ values });
    const progress = manager.defaultProgress();
    progress.completedModules = ['azure-dns'];
    progress.quizScores['azure-dns'] = { score: 8, total: 10, criticalMisses: 1, date: '2026-07-26' };
    progress.notes['azure-dns'] = 'Keep this note and its evidence.';
    progress.labSteps['azure-dns'] = [true, null, true];
    progress.lastVisited = 'azure-dns';
    manager.saveProgress(progress);
    const key = manager.storageKey();
    const raw = values.get(key);
    const exported = manager.createExport();

    assert.equal(exported.academyId, 'azure-networking');
    assert.equal(exported.exportVersion, 1);
    assert.equal(exported.schemaVersion, 2);
    assert.ok(Number.isFinite(Date.parse(exported.exportedAt)));
    assert.equal(Object.hasOwn(exported, 'data'), false);
    assert.equal(values.get(key), raw);
    const target = loadProgressManager();
    await target.importProgress(progressFile(exported));
    assert.equal(JSON.stringify(target.getProgress()), JSON.stringify(manager.getProgress()));
});

test('exportProgress downloads the versioned payload without mutating storage', async () => {
    const values = new Map();
    let downloadedBlob;
    let clicks = 0;
    const anchor = { click() { clicks += 1; } };
    const manager = loadProgressManager({ values, globals: {
        document: { cookie: 'ana_uid=test-user-123', createElement: () => anchor },
        URL: { createObjectURL(blob) { downloadedBlob = blob; return 'blob:test'; }, revokeObjectURL() {} }
    } });
    manager.saveQuizScore('azure-dns', 8, 10, 1);
    const key = manager.storageKey();
    const raw = values.get(key);

    manager.exportProgress();

    const payload = JSON.parse(await downloadedBlob.text());
    assert.equal(payload.academyId, 'azure-networking');
    assert.equal(payload.exportVersion, 1);
    assert.equal(payload.quizScores['azure-dns'].criticalMisses, 1);
    assert.match(anchor.download, /^azure-academy-progress-\d{4}-\d{2}-\d{2}\.json$/);
    assert.equal(clicks, 1);
    assert.equal(values.get(key), raw);
});

test('invalid imports leave stored and pending data untouched', async () => {
    const values = new Map();
    const faults = {};
    const manager = loadProgressManager({ values, faults });
    manager.saveQuizScore('azure-dns', 8, 10);
    const key = manager.storageKey();
    const raw = values.get(key);
    faults.key = key;
    faults.failWrites = true;
    manager.completeLab('azure-dns');
    const pending = JSON.stringify(manager.getProgress());
    const empty = { completedModules: [], quizScores: {} };
    const envelope = { ...empty, academyId: 'azure-networking', exportVersion: 1, exportedAt: '2026-09-14T10:00:00.000Z' };
    const invalid = [
        null, [], {}, { completedModules: {}, quizScores: {} },
        { completedModules: [], quizScores: null }, { completedModules: [], quizScores: [] },
        { ...envelope, academyId: 'ai-mastery' },
        { ...empty, exportVersion: 1 },
        ...[0, -1, 1.5, 3, '2', null].map(schemaVersion => ({ ...empty, schemaVersion })),
        ...[undefined, 0, 2, '1', null].map(exportVersion => ({ ...envelope, exportVersion })),
        ...[undefined, null, 'invalid'].map(exportedAt => ({ ...envelope, exportedAt }))
    ];

    for (const data of invalid) {
        await assert.rejects(manager.importProgress(progressFile(data)), /format|academy|version|date/i);
        assert.equal(values.get(key), raw);
        assert.equal(JSON.stringify(manager.getProgress()), pending);
    }
    assert.equal(faults.rejectedWrites, 1);
});

test('bare legacy versions accept valid and empty progress', async () => {
    for (const schemaVersion of [undefined, 1, 2]) {
        for (const completedModules of [[], ['azure-dns']]) {
            const manager = loadProgressManager();
            const result = await manager.importProgress(progressFile({ schemaVersion, completedModules, quizScores: {} }));
            assert.equal(result.schemaVersion, 2);
            assert.deepEqual(Array.from(result.completedModules), completedModules);
        }
    }
});

test('legacy imports validate module IDs across evidence and navigation fields', async () => {
    const manager = loadProgressManager();
    const empty = { completedModules: [], quizScores: {} };
    const foreign = 'phase4-memory-rag';
    const invalid = [
        { completedModules: [foreign] }, { completedLabs: [foreign] }, { lastVisited: foreign },
        { quizScores: { [foreign]: { score: 8, total: 10 } } },
        ...['notes', 'labSteps', 'visitedSections', 'moduleMastery', 'practiceChecks', 'artifactPractice']
            .map(field => ({ [field]: { [foreign]: {} } })),
        { diagnostic: { recommendedModuleId: foreign } },
        { completedModules: ['module-a'] }, { completedModules: ['__proto__'] }
    ];

    for (const fields of invalid) {
        await assert.rejects(manager.importProgress(progressFile({ ...empty, ...fields })), /module|academy|format/i);
    }
    const catalog = loadProgressManager({ globals: { MODULES: [{ id: 'catalog-only-module' }] } });
    await catalog.importProgress(progressFile({ ...empty, completedModules: ['catalog-only-module'] }));
    await assert.rejects(catalog.importProgress(progressFile({ ...empty, completedModules: ['azure-dns'] })), /module|academy/i);
    await catalog.importProgress(progressFile(empty));
});

test('file validation rejects malformed, incompatible, and oversized input', async () => {
    const manager = loadProgressManager();
    const empty = { completedModules: [], quizScores: {} };
    assert.equal(manager.MAX_IMPORT_BYTES, 1024 * 1024);
    for (const file of [
        null,
        progressFile(empty, { name: 'progress.html' }),
        progressFile(empty, { type: 'text/html' }),
        progressFile(empty, { size: manager.MAX_IMPORT_BYTES + 1 }),
        progressFile(empty, { size: -1 }),
        progressFile(empty, { size: NaN }),
        progressFile('{broken json'),
        progressFile({ ...empty, notes: { 'azure-dns': 'x'.repeat(manager.MAX_IMPORT_BYTES) } }, { size: 1 })
    ]) {
        await assert.rejects(manager.importProgress(file));
    }
    await manager.importProgress(progressFile(empty, { name: 'BACKUP.JSON', type: '' }));
    await manager.importProgress(progressFile(empty, { name: undefined, type: undefined }));
});

test('corrupt and unsupported stored records block automatic writes and remain recoverable', () => {
    const invalid = ['', '{broken json', 'null', '[]', '{}',
        ...[0, 3, '2', null].map(schemaVersion => JSON.stringify({ schemaVersion, completedModules: [], quizScores: {} }))];
    for (const raw of invalid) {
        const values = new Map();
        const manager = loadProgressManager({ values });
        const key = manager.storageKey();
        values.set(key, raw);
        assert.equal(manager.getStorageStatus().saved, false);
        assert.equal(manager.getStorageStatus().recoveryRequired, true);
        assert.match(manager.getStorageStatus().message, /export.*(?:import|reset)/i);

        manager.setLastVisited('azure-dns');
        manager.saveQuizScore('azure-dns', 8, 10);

        assert.equal(manager.retrySave(), false);
        assert.equal(values.get(key), raw);
        assert.equal(manager.createExport().quizScores['azure-dns'].score, 8);
        assert.equal(manager.getStorageStatus().saved, false);
    }
});

test('saveProgress checks unreadable storage even before the first read', () => {
    const values = new Map();
    const manager = loadProgressManager({ values });
    const key = manager.storageKey();
    values.set(key, '{broken json');

    assert.equal(manager.saveProgress(manager.defaultProgress()), false);
    assert.equal(values.get(key), '{broken json');
});

test('storage read errors cannot replace the previous record with default progress', () => {
    const values = new Map();
    const faults = {};
    const manager = loadProgressManager({ values, faults });
    manager.saveQuizScore('azure-dns', 8, 10);
    const key = manager.storageKey();
    const raw = values.get(key);
    faults.key = key;
    faults.failReads = true;

    manager.completeLab('azure-dns');

    assert.equal(manager.getStorageStatus().saved, false);
    assert.match(manager.getStorageStatus().message, /read|access/i);
    assert.equal(manager.retrySave(), false);
    assert.equal(values.get(key), raw);
});

test('recovery export contains exact raw data and separately identified pending progress', async () => {
    const values = new Map();
    let downloadedBlob;
    const anchor = { click() {} };
    const manager = loadProgressManager({ values, globals: {
        document: { cookie: 'ana_uid=test-user-123', createElement: () => anchor },
        URL: { createObjectURL(blob) { downloadedBlob = blob; return 'blob:test'; }, revokeObjectURL() {} }
    } });
    const raw = '{unreadable: "<script>do not execute</script>"';
    const key = manager.storageKey();
    values.set(key, raw);
    manager.saveQuizScore('azure-dns', 8, 10);

    manager.exportProgress();

    const recovery = JSON.parse(await downloadedBlob.text());
    assert.equal(recovery.rawProgress, raw);
    assert.equal(recovery.recoveryVersion, 1);
    assert.equal(recovery.academyId, 'azure-networking');
    assert.equal(recovery.pendingProgress.quizScores['azure-dns'].score, 8);
    assert.equal(recovery.pendingProgress.exportVersion, 1);
    assert.match(anchor.download, /recovery.*\.json$/);
    assert.equal(values.get(key), raw);
    await assert.rejects(manager.importProgress(progressFile(recovery)), /format|recovery/i);
});

test('only a successful explicit import clears a recovery block', async () => {
    const values = new Map();
    const faults = {};
    const manager = loadProgressManager({ values, faults });
    const key = manager.storageKey();
    const raw = '{broken json';
    values.set(key, raw);
    manager.saveQuizScore('azure-dns', 8, 10);
    const pending = JSON.stringify(manager.getProgress());
    faults.key = key;
    faults.failWrites = true;

    await assert.rejects(manager.importProgress(progressFile({ completedModules: [], quizScores: {} })), /save|storage/i);
    assert.equal(faults.rejectedWrites, 1);
    assert.equal(values.get(key), raw);
    assert.equal(JSON.stringify(manager.getProgress()), pending);
    assert.equal(manager.getStorageStatus().recoveryRequired, true);
    faults.failWrites = false;
    await manager.importProgress(progressFile({ completedModules: ['azure-dns'], quizScores: {} }));
    assert.equal(manager.getStorageStatus().saved, true);
    assert.equal(manager.getStorageStatus().recoveryRequired, false);
    assert.deepEqual(Array.from(manager.getProgress().completedModules), ['azure-dns']);
    assert.equal(manager.retrySave(), true);
});

test('reset clears pending work only after storage deletion is confirmed', () => {
    const values = new Map();
    const faults = {};
    const manager = loadProgressManager({ values, faults });
    manager.saveQuizScore('azure-dns', 8, 10);
    const key = manager.storageKey();
    const raw = values.get(key);
    faults.key = key;
    faults.failWrites = true;
    manager.completeLab('azure-dns');
    const pending = JSON.stringify(manager.getProgress());
    faults.failDeletes = true;

    assert.equal(manager.resetAll(), false);
    assert.equal(values.get(key), raw);
    assert.equal(JSON.stringify(manager.getProgress()), pending);
    assert.equal(manager.getStorageStatus().saved, false);
    faults.failDeletes = false;
    faults.ignoreDeletes = true;
    assert.equal(manager.resetAll(), false);
    assert.equal(JSON.stringify(manager.getProgress()), pending);
    faults.ignoreDeletes = false;
    assert.equal(manager.resetAll(), true);
    assert.equal(values.has(key), false);
    assert.equal(manager.getProgress().completedLabs.length, 0);
    assert.equal(Object.keys(manager.getProgress().quizScores).length, 0);
    assert.equal(manager.getStorageStatus().saved, true);
});

test('explicit reset releases corrupted storage without resurrecting pending work', () => {
    const values = new Map();
    const manager = loadProgressManager({ values });
    const key = manager.storageKey();
    values.set(key, '{broken json');
    manager.saveQuizScore('azure-dns', 8, 10);

    assert.equal(manager.resetAll(), true);
    assert.equal(manager.getStorageStatus().recoveryRequired, false);
    assert.equal(manager.retrySave(), true);
    assert.equal(Object.keys(manager.getProgress().quizScores).length, 0);
});

test('forgetting the networking identity requires a successful reset', () => {
    const values = new Map();
    const faults = {};
    const manager = loadProgressManager({ values, faults });
    manager.saveQuizScore('azure-dns', 8, 10);
    manager.setUserName('Learner');
    const userId = manager.getUserId();
    const key = manager.storageKey();
    faults.key = key;
    faults.failWrites = true;
    manager.completeLab('azure-dns');
    const pending = JSON.stringify(manager.getProgress());
    faults.failDeletes = true;

    assert.equal(manager.resetAllAndForgetUser(), false);
    assert.equal(manager.getUserId(), userId);
    assert.equal(manager.getUserName(), 'Learner');
    assert.equal(JSON.stringify(manager.getProgress()), pending);
    faults.failDeletes = false;
    assert.equal(manager.resetAllAndForgetUser(), true);
    assert.equal(values.has(key), false);
    assert.equal(manager.readCookie(manager.USER_COOKIE), null);
    assert.equal(manager.readCookie(manager.NAME_COOKIE), null);
    assert.equal(manager.getProgress().completedLabs.length, 0);
});

test('storage events never expose a rejected import or log success on failure', async () => {
    const events = [];
    const messages = [];
    const faults = {};
    let manager;
    manager = loadProgressManager({ faults, globals: {
        console: { log: (...args) => messages.push(args), info: (...args) => messages.push(args), error() {} },
        CustomEvent: class CustomEvent { constructor(type, options) { this.type = type; this.detail = options.detail; } },
        document: { cookie: 'ana_uid=test-user-123', dispatchEvent(event) { events.push({ ...event, progress: JSON.stringify(manager.getProgress()) }); } }
    } });
    manager.saveQuizScore('azure-dns', 8, 10);
    faults.key = manager.storageKey();
    faults.failWrites = true;
    const before = JSON.stringify(manager.getProgress());

    await assert.rejects(manager.importProgress(progressFile(manager.defaultProgress())), /save|storage/i);

    const failure = events.at(-1);
    assert.equal(failure.type, 'academy-storage-change');
    assert.equal(failure.detail.saved, false);
    assert.equal(failure.progress, before);
    assert.equal(messages.length, 0);
    faults.failWrites = false;
    assert.equal(manager.retrySave(), true);
    assert.equal(events.at(-1).detail.saved, true);
});

test('formative practice records attempts without awarding quiz or mastery evidence', async () => {
    const manager = loadProgressManager();
    assert.equal(manager.savePracticeResult('azure-dns', false), true);
    assert.equal(manager.savePracticeResult('azure-dns', true), true);
    const progress = manager.getProgress();
    const practice = progress.practiceChecks['azure-dns'];

    assert.equal(practice.passed, true);
    assert.equal(practice.attempts, 2);
    assert.ok(Number.isFinite(Date.parse(practice.completedAt)));
    assert.equal(Object.keys(progress.quizScores).length, 0);
    assert.equal(Object.keys(progress.moduleMastery).length, 0);
    assert.equal(progress.completedModules.length, 0);
    assert.equal(manager.getMasteryStatus('azure-dns', { quiz: true, lab: true, transfer: true }).state, 'not_started');
    const target = loadProgressManager();
    await target.importProgress(progressFile(manager.createExport()));
    assert.equal(JSON.stringify(target.getProgress().practiceChecks), JSON.stringify(progress.practiceChecks));
});

test('artifact practice is self-attested lab evidence and never completes an external lab', async () => {
    const manager = loadProgressManager();
    const requirements = { quiz: true, lab: true, transfer: true };
    const evidence = 'I predicted the DNS result, checked a local fixture, and explained the discrepancy.';
    assert.equal(manager.saveArtifactPractice('azure-dns', `  ${evidence}  `), true);
    assert.equal(manager.getMasteryStatus('azure-dns', requirements).state, 'not_started');
    manager.saveQuizScore('azure-dns', 8, 10);
    const status = manager.getMasteryStatus('azure-dns', requirements);

    assert.equal(status.state, 'practiced');
    assert.equal(status.labPassed, true);
    assert.equal(status.labProvenance, 'self-attested');
    assert.equal(status.entry.lab.completed, false);
    assert.equal(manager.getProgress().completedLabs.length, 0);
    assert.equal(manager.getStats().labsCompleted, 0);
    assert.equal(manager.getProgress().artifactPractice['azure-dns'].evidence, evidence);
    const target = loadProgressManager();
    await target.importProgress(progressFile(manager.createExport()));
    assert.equal(JSON.stringify(target.getProgress().artifactPractice), JSON.stringify(manager.getProgress().artifactPractice));
    assert.equal(target.getMasteryStatus('azure-dns', requirements).labProvenance, 'self-attested');
});

test('artifact validation rejects short evidence and reports quota failure honestly', () => {
    const values = new Map();
    const faults = {};
    const manager = loadProgressManager({ values, faults });
    manager.saveProgress(manager.defaultProgress());
    const key = manager.storageKey();
    const raw = values.get(key);
    for (const evidence of ['', ' '.repeat(50), 'x'.repeat(39), null, 42, { evidence: 'x'.repeat(40) }]) {
        assert.equal(manager.saveArtifactPractice('azure-dns', evidence), false);
        assert.equal(values.get(key), raw);
    }
    assert.equal(manager.saveArtifactPractice('azure-dns', 'x'.repeat(40)), true);
    const saved = values.get(key);
    faults.key = key;
    faults.failWrites = true;

    assert.equal(manager.saveArtifactPractice('azure-dns', '  ' + 'y'.repeat(5000) + '  '), false);
    assert.equal(faults.rejectedWrites, 1);
    assert.equal(values.get(key), saved);
    assert.equal(manager.getStorageStatus().saved, false);
    assert.equal(manager.getProgress().artifactPractice['azure-dns'].evidence.length, 4000);
    faults.failWrites = false;
    assert.equal(manager.retrySave(), true);
});

test('practice normalization requires usable artifacts and integer attempt counts', () => {
    const manager = loadProgressManager();
    const progress = manager.normalizeProgress({
        practiceChecks: { prediction: { passed: 'false', attempts: -3.5 }, repeated: { passed: true, attempts: 2.9 } },
        artifactPractice: {
            short: { evidence: 'x'.repeat(39) },
            blank: { evidence: ' '.repeat(50) },
            invalid: { evidence: 5000 },
            valid: { evidence: '  ' + 'x'.repeat(5000) + '  ', completedAt: '2026-09-14T10:00:00.000Z' }
        }
    });

    assert.equal(progress.practiceChecks.prediction.passed, false);
    assert.equal(progress.practiceChecks.prediction.attempts, 1);
    assert.equal(progress.practiceChecks.repeated.attempts, 2);
    assert.deepEqual(Object.keys(progress.artifactPractice), ['valid']);
    assert.equal(progress.artifactPractice.valid.evidence.length, 4000);
    manager.saveProgress({ ...manager.defaultProgress(), artifactPractice: { 'azure-dns': { evidence: 'short' } } });
    assert.equal(manager.getMasteryStatus('azure-dns', { lab: true }).labPassed, false);
});

test('transfer provenance defaults to self-assessed and legacy evidence stays identifiable', () => {
    const manager = loadProgressManager();
    const reflection = 'Named a reviewer in the reflection without supplying reviewer metadata.';
    manager.saveTransferResult('azure-dns', 3, 4, reflection, [3, 3, 3, 3]);
    const transfer = manager.getProgress().moduleMastery['azure-dns'].transfer;
    assert.equal(transfer.provenance, 'self-assessed');
    assert.equal(Object.hasOwn(transfer, 'reviewer'), false);
    const legacy = manager.normalizeMasteryEntry({ transfer: { score: 3, max: 4, reflection, scores: [3, 3, 3, 3] } });
    assert.equal(legacy.transfer.provenance, 'legacy-self-assessed');
    assert.equal(legacy.transfer.reflection, reflection);
});

test('separately supplied reviewer metadata survives export without certifying identity', async () => {
    const manager = loadProgressManager();
    const reflection = 'Compared an independent artifact to each rubric criterion.';
    manager.saveTransferResult('azure-dns', 3, 4, reflection, [3, 3, 3, 3], undefined,
        { provenance: 'reviewer-assessed', reviewer: '  Jo  ' });
    const transfer = manager.getProgress().moduleMastery['azure-dns'].transfer;
    assert.equal(transfer.provenance, 'reviewer-assessed');
    assert.equal(transfer.reviewer, 'Jo');
    assert.equal(Object.hasOwn(transfer, 'verified'), false);
    const target = loadProgressManager();
    await target.importProgress(progressFile(manager.createExport()));
    assert.equal(JSON.stringify(target.getProgress().moduleMastery['azure-dns'].transfer), JSON.stringify(transfer));
    manager.saveTransferResult('azure-dns', 4, 4, reflection, [], { provenance: 'reviewer-assessed', reviewer: 'A'.repeat(100) });
    assert.equal(manager.getProgress().moduleMastery['azure-dns'].transfer.reviewer.length, 100);
});

test('invalid reviewer metadata cannot replace evidence or claim automatic verification', () => {
    const values = new Map();
    const manager = loadProgressManager({ values });
    const reflection = 'An independent artifact with enough evidence to review.';
    manager.saveTransferResult('azure-dns', 3, 4, reflection);
    const key = manager.storageKey();
    const raw = values.get(key);
    const invalid = [
        { provenance: 'automatically-verified' }, { provenance: 'unknown' },
        ...[undefined, '', ' A ', 42, 'A'.repeat(101)].map(reviewer => ({ provenance: 'reviewer-assessed', reviewer }))
    ];
    for (const metadata of invalid) {
        assert.equal(manager.saveTransferResult('azure-dns', 4, 4, reflection, [], undefined, metadata), false);
        assert.equal(values.get(key), raw);
    }
    for (const metadata of invalid) {
        const entry = manager.normalizeMasteryEntry({ transfer: { score: 3, max: 4, reflection, ...metadata } });
        assert.equal(entry.transfer.provenance, 'legacy-self-assessed');
        assert.equal(entry.transfer.reflection, reflection);
        assert.equal(Object.hasOwn(entry.transfer, 'reviewer'), false);
    }
});

test('invalid quiz and transfer numbers never become passing evidence', () => {
    const values = new Map();
    const manager = loadProgressManager({ values });
    const reflection = 'An independent artifact with enough evidence to review.';
    manager.saveQuizScore('azure-dns', 8, 10);
    manager.saveTransferResult('azure-dns', 3, 4, reflection);
    const key = manager.storageKey();
    const raw = values.get(key);
    for (const [score, total] of [[-1, 10], [11, 10], [0, 0], [1, -1], [NaN, 10], [Infinity, 10], [1, Infinity]]) {
        assert.equal(manager.saveQuizScore('azure-dns', score, total), false);
        assert.equal(manager.saveTransferResult('azure-dns', score, total, reflection), false);
        assert.equal(values.get(key), raw);
        const normalized = manager.normalizeProgress({
            quizScores: { invalid: { score, total } },
            moduleMastery: { invalid: { quiz: { firstScore: score, latestScore: score, total }, transfer: { score, max: total, reflection } } }
        });
        assert.equal(Object.keys(normalized.quizScores).length, 0);
        assert.equal(normalized.moduleMastery.invalid.quiz, null);
        assert.equal(normalized.moduleMastery.invalid.transfer, null);
    }
});

test('quiz statistics require eighty percent and no critical misses', () => {
    const manager = loadProgressManager();
    manager.saveQuizScore('azure-dns', 8, 10);
    manager.saveQuizScore('azure-vnets', 7, 10);
    manager.saveQuizScore('frontdoor-basics', 10, 10, 1);

    assert.equal(manager.getStats().quizzesPassed, 1);
});

test('the first quiz schedules one day ahead and later quiz attempts keep that due window', () => {
    const clock = { now: '2026-07-26T10:00:00.000Z' };
    class ClockDate extends Date {
        constructor(...args) { super(...(args.length ? args : [clock.now])); }
        static now() { return Date.parse(clock.now); }
    }
    const manager = loadProgressManager({ globals: { Date: ClockDate } });
    manager.saveQuizScore('azure-dns', 9, 10);
    manager.saveTransferResult('azure-dns', 4, 4, 'Independent artifact with test evidence.');
    assert.equal(manager.getProgress().moduleMastery['azure-dns'].review.nextDue, '2026-07-27T10:00:00.000Z');
    clock.now = '2026-07-27T10:00:00.000Z';
    manager.saveQuizScore('azure-dns', 5, 10);
    assert.equal(manager.isReviewDue('azure-dns'), true);
    manager.recordReview('azure-dns', false);
    assert.equal(manager.getProgress().moduleMastery['azure-dns'].review.nextDue, '2026-07-28T10:00:00.000Z');
});

test('early reviews cannot create scheduled credit or mutate progress', () => {
    const values = new Map();
    const manager = loadProgressManager({ values });
    seedDueReview(manager);
    const key = manager.storageKey();
    const raw = values.get(key);

    assert.equal(manager.recordReview('azure-dns', true, '2026-07-27T09:59:59.999Z'), false);
    assert.equal(manager.recordReview('azure-dns', false, '2026-07-27T09:59:59.999Z'), false);
    assert.equal(values.get(key), raw);
});

test('failed due reviews reset the interval and keep all previous history and artifacts', async () => {
    const manager = loadProgressManager();
    seedDueReview(manager);
    manager.saveArtifactPractice('azure-dns', 'I checked a local fixture and explained the expected failure mode with evidence.');
    const progress = manager.getProgress();
    const review = progress.moduleMastery['azure-dns'].review;
    review.successfulReviews = 2;
    review.intervalIndex = 2;
    review.attempts = Array.from({ length: 25 }, (_, index) => ({ passed: index % 2 === 0, reviewedAt: `2026-06-${String(index + 1).padStart(2, '0')}T10:00:00.000Z`, evidence: `Historical note ${index}` }));
    const history = JSON.stringify(review.attempts);
    const transfer = JSON.stringify(progress.moduleMastery['azure-dns'].transfer);
    const artifact = JSON.stringify(progress.artifactPractice);
    manager.saveProgress(progress);

    manager.recordReview('azure-dns', false, '2026-07-27T10:00:00.000Z');

    const result = manager.getProgress();
    const recorded = result.moduleMastery['azure-dns'].review;
    assert.equal(recorded.attempts.length, 26);
    assert.equal(JSON.stringify(recorded.attempts.slice(0, 25)), history);
    assert.equal(recorded.attempts.at(-1).passed, false);
    assert.equal(recorded.attempts.at(-1).dueAt, '2026-07-27T10:00:00.000Z');
    assert.equal(recorded.successfulReviews, 2);
    assert.equal(recorded.intervalIndex, 0);
    assert.equal(recorded.nextDue, '2026-07-28T10:00:00.000Z');
    assert.equal(JSON.stringify(result.moduleMastery['azure-dns'].transfer), transfer);
    assert.equal(JSON.stringify(result.artifactPractice), artifact);
    const target = loadProgressManager();
    await target.importProgress(progressFile(manager.createExport()));
    assert.equal(JSON.stringify(target.getProgress().moduleMastery['azure-dns'].review), JSON.stringify(recorded));
});

test('duplicate results cannot change a consumed due window', () => {
    for (const passed of [true, false]) {
        const values = new Map();
        const manager = loadProgressManager({ values });
        seedDueReview(manager);
        manager.recordReview('azure-dns', passed, '2026-07-27T10:00:00.000Z');
        const key = manager.storageKey();
        const raw = values.get(key);

        assert.equal(manager.recordReview('azure-dns', true, '2026-07-27T10:00:00.000Z'), false);
        assert.equal(manager.recordReview('azure-dns', false, '2026-07-27T11:00:00.000Z'), false);
        assert.equal(values.get(key), raw);
        const review = manager.getProgress().moduleMastery['azure-dns'].review;
        assert.equal(review.attempts.length, 1);
        assert.equal(review.successfulReviews, passed ? 1 : 0);
        assert.equal(review.nextDue, passed ? '2026-07-30T10:00:00.000Z' : '2026-07-28T10:00:00.000Z');
    }
});

test('reviews require a valid transfer and an existing valid due schedule', () => {
    for (const variant of ['missing-entry', 'missing-transfer', 'low-score', 'short-evidence', 'missing-due', 'invalid-due']) {
        const values = new Map();
        const manager = loadProgressManager({ values });
        seedDueReview(manager);
        const progress = manager.getProgress();
        const entry = progress.moduleMastery['azure-dns'];
        if (variant === 'missing-entry') delete progress.moduleMastery['azure-dns'];
        if (variant === 'missing-transfer') entry.transfer = null;
        if (variant === 'low-score') entry.transfer.score = 2;
        if (variant === 'short-evidence') entry.transfer.reflection = ' '.repeat(30);
        if (variant === 'missing-due') entry.review.nextDue = null;
        if (variant === 'invalid-due') entry.review.nextDue = '2026-02-30T10:00:00.000Z';
        manager.saveProgress(progress);
        const key = manager.storageKey();
        const raw = values.get(key);

        assert.equal(manager.isReviewDue('azure-dns', '2026-07-27T10:00:00.000Z'), false, variant);
        assert.equal(manager.recordReview('azure-dns', true, '2026-07-27T10:00:00.000Z'), false, variant);
        assert.equal(values.get(key), raw);
    }
});

test('invalid review timestamps and nonboolean results are rejected without writes', () => {
    const values = new Map();
    const manager = loadProgressManager({ values });
    seedDueReview(manager);
    const key = manager.storageKey();
    const raw = values.get(key);
    for (const reviewedAt of ['', null, 0, {}, 'invalid', '2026-02-30T10:00:00.000Z', '2026-13-14T10:00:00.000Z']) {
        assert.equal(manager.recordReview('azure-dns', true, reviewedAt), false);
        assert.deepEqual(Array.from(manager.getDueReviews(reviewedAt)), []);
        assert.equal(values.get(key), raw);
    }
    for (const passed of ['true', 1, null]) {
        assert.equal(manager.recordReview('azure-dns', passed, '2026-07-27T10:00:00.000Z'), false);
        assert.equal(values.get(key), raw);
    }
});

test('an imported consumed due window cannot earn duplicate credit', () => {
    const manager = loadProgressManager();
    seedDueReview(manager);
    const progress = manager.getProgress();
    progress.moduleMastery['azure-dns'].review.attempts = [{ passed: true, reviewedAt: '2026-07-27T10:00:00.000Z', dueAt: '2026-07-27T10:00:00.000Z' }];
    manager.saveProgress(progress);

    assert.equal(manager.recordReview('azure-dns', true, '2026-07-28T10:00:00.000Z'), false);
    assert.equal(manager.getProgress().moduleMastery['azure-dns'].review.attempts.length, 1);
});

test('failed review saves stay pending and retry without adding another attempt', () => {
    const values = new Map();
    const faults = {};
    const manager = loadProgressManager({ values, faults });
    seedDueReview(manager);
    const key = manager.storageKey();
    const raw = values.get(key);
    faults.key = key;
    faults.failWrites = true;
    manager.recordReview('azure-dns', false, '2026-07-27T10:00:00.000Z');
    assert.equal(faults.rejectedWrites, 1);
    assert.equal(values.get(key), raw);
    assert.equal(manager.getStorageStatus().saved, false);
    assert.equal(manager.getProgress().moduleMastery['azure-dns'].review.attempts.length, 1);
    assert.equal(manager.recordReview('azure-dns', true, '2026-07-27T10:00:00.000Z'), false);
    faults.failWrites = false;
    assert.equal(manager.retrySave(), true);
    assert.equal(manager.getProgress().moduleMastery['azure-dns'].review.attempts.length, 1);
});

test('malformed nested records cannot replace existing progress', async () => {
    const invalid = [
        { quizScores: { 'azure-dns': [] } },
        { moduleMastery: { 'azure-dns': null } },
        { moduleMastery: { 'azure-dns': { transfer: [] } } },
        { moduleMastery: { 'azure-dns': { review: { attempts: {} } } } },
        { labSteps: { 'azure-dns': {} } },
        { visitedSections: { 'azure-dns': {} } },
        { practiceChecks: { 'azure-dns': null } },
        { artifactPractice: { 'azure-dns': [] } }
    ];
    for (const fields of invalid) {
        const values = new Map();
        const manager = loadProgressManager({ values });
        manager.saveQuizScore('azure-dns', 8, 10);
        const key = manager.storageKey();
        const previous = values.get(key);
        const data = { ...manager.defaultProgress(), ...fields };
        await assert.rejects(manager.importProgress(progressFile(data)), /format/i);
        assert.equal(values.get(key), previous);
        const corrupt = JSON.stringify(data);
        values.set(key, corrupt);
        manager.setLastVisited('azure-dns');
        assert.equal(manager.getStorageStatus().recoveryRequired, true);
        assert.equal(values.get(key), corrupt);
    }
});

test('versioned exports require an explicit supported progress schema', async () => {
    const manager = loadProgressManager();
    const exported = manager.createExport();
    delete exported.schemaVersion;

    await assert.rejects(manager.importProgress(progressFile(exported)), /schema|version/i);
});

test('malformed critical-miss counts cannot normalize into a passing quiz', () => {
    for (const criticalMisses of [-1, 0.5, Infinity, NaN, null, 'invalid']) {
        const manager = loadProgressManager();
        manager.saveQuizScore('azure-dns', 10, 10, criticalMisses);

        assert.equal(manager.getStats().quizzesPassed, 0);
        assert.equal(manager.getMasteryStatus('azure-dns', { quiz: true }).quizPassed, false);
    }
});

test('legacy six-argument transfer calls remain compatible', () => {
    const manager = loadProgressManager();
    for (const legacyArgument of [null, false, '2026-07-26T10:00:00.000Z']) {
        const result = manager.saveTransferResult('azure-dns', 3, 4, 'Independent artifact with test evidence.', [3, 3, 3, 3], legacyArgument);
        assert.ok(result);
        assert.equal(manager.getProgress().moduleMastery['azure-dns'].transfer.provenance, 'self-assessed');
    }
    manager.saveTransferResult('azure-dns', 3, 4, 'Independent artifact with test evidence.', [3, 3, 3, 3], false,
        { provenance: 'reviewer-assessed', reviewer: 'Jo' });
    assert.equal(manager.getProgress().moduleMastery['azure-dns'].transfer.reviewer, 'Jo');
});
