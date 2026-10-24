const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const runtimeFiles = [
    'index.html', 'js/app.js', 'js/quiz-engine.js', 'js/interactive.js',
    'js/lab-engine.js', 'js/diagrams.js', 'js/modules-300.js'
];

test('learner workspace loads coaching and exposes real destinations', () => {
    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    const app = fs.readFileSync(path.join(root, 'js/app.js'), 'utf8');
    ['destinationView', 'quickCheckHost', 'storageNotice'].forEach(id => assert.ok(html.includes(`id="${id}"`), id));
    assert.ok(html.includes('css/learning.css'));
    assert.ok(html.indexOf('js/learning-content.js') < html.indexOf('js/quiz-engine.js'));
    assert.ok(html.includes('js/learning-engine.js'));
    assert.match(app, /LearningEngine\.renderDestination/);
    assert.match(app, /LearningEngine\.renderCoaching/);
    assert.match(app, /LearningEngine\.renderLabPractice/);
    assert.match(app, /LearningEngine\.parseRoute/);
    assert.match(app, /LEARNING_CONTENT\.modules\[moduleId\]/);
});

test('platform uses a strict script policy and installable offline assets', () => {
    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.webmanifest'), 'utf8'));

    assert.match(html, /script-src 'self';/);
    assert.doesNotMatch(html, /script-src[^;]*'unsafe-inline'/);
    assert.match(html, /rel="manifest" href="manifest\.webmanifest"/);
    assert.equal(manifest.display, 'standalone');
    assert.ok(manifest.icons.length >= 1);
    assert.ok(fs.existsSync(path.join(root, 'sw.js')));
    assert.ok(fs.existsSync(path.join(root, manifest.icons[0].src)));
});

test('runtime files contain no executable inline event attributes', () => {
    runtimeFiles.forEach(file => {
        const source = fs.readFileSync(path.join(root, file), 'utf8');
        const executableLines = source.split(/\r?\n/).filter(line => !line.includes('&lt;'));
        assert.doesNotMatch(executableLines.join('\n'), /\bon(?:click|change|input|keydown|keyup)\s*=/i, file);
    });
});

test('mobile shell provides an accessible zero-width drawer and three destinations', () => {
    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    const css = fs.readFileSync(path.join(root, 'css/styles.css'), 'utf8');
    const app = fs.readFileSync(path.join(root, 'js/app.js'), 'utf8');

    assert.match(html, /id="navBackdrop"/);
    assert.match(html, /id="mobileNavClose"/);
    assert.match(html, /class="bottom-nav"/);
    ['today', 'visual-lab', 'more'].forEach(destination => {
        assert.match(html, new RegExp(`data-destination="${destination}"`));
    });
    assert.match(css, /#sidebar\s*\{[^}]*transform:\s*translateX\(-100%\)/s);
    assert.doesNotMatch(css, /#sidebar\s*\{[^}]*left:\s*-\d+px/s);
    assert.match(app, /closeMobileNav/);
    assert.match(app, /navBackdrop/);
    assert.match(app, /'nav-module'/);
    assert.match(app, /class="nav-time"/);
    assert.match(app, /mobileNavToggle[^\n]*focus|toggle\.focus/s);
    assert.match(css, /#sidebar \.module-link\s*\{[^}]*min-height:\s*48px/s);
    assert.match(css, /#sidebar \.nav-time\s*\{\s*display:\s*none/s);
});

test('lesson shell exposes three steps, optional evidence, and an inline core visual', () => {
    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    const app = fs.readFileSync(path.join(root, 'js/app.js'), 'utf8');
    const mastery = fs.readFileSync(path.join(root, 'js/mastery-engine.js'), 'utf8');
    const diagrams = fs.readFileSync(path.join(root, 'js/diagrams.js'), 'utf8');

    assert.match(html, /class="lesson-steps"/);
    assert.match(html, /id="sectionOutline"/);
    assert.match(html, /id="furtherStudy"/);
    assert.doesNotMatch(html, /class="guided-stepper"|class="module-tabs"|id="experienceToggle"/);
    assert.match(app, /renderSectionOutline/);
    assert.match(app, /hashchange/);
    assert.match(app, /syncHashRoute/);
    assert.match(mastery, /class="evidence-disclosure"/);
    assert.match(diagrams, /renderPreview\(/);
});

test('runtime assets and offline cache share the learning release', () => {
    const release = '2026-10-fieldguide-3';
    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    const serviceWorker = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
    const browser = fs.readFileSync(path.join(root, 'tests/browser_smoke.py'), 'utf8');
    const assets = Array.from(html.matchAll(/(?:src|href)="((?:css|js)\/[^"?]+)(?:\?v=[^"]+)?"/g), match => match[1]);

    assert.ok(browser.includes(`RELEASE = "${release}"`), 'Browser upgrade fixtures must use the runtime release');
    assert.match(serviceWorker, new RegExp(`CACHE_NAME = .*${release}`));
    assert.ok(assets.length > 10);
    assets.forEach(asset => {
        const versionedAsset = `${asset}?v=${release}`;
        assert.ok(html.includes(versionedAsset), `${versionedAsset} missing from index.html`);
        assert.ok(serviceWorker.includes(versionedAsset), `${versionedAsset} missing from sw.js`);
        assert.ok(fs.existsSync(path.join(root, asset)), `${asset} must exist in this checkout`);
    });
});

const createWorkerHarness = (options = {}) => {
    const scope = 'https://academy.test/academy/';
    const listeners = new Map();
    const stores = new Map();
    const networkRequests = [];
    const installedUrls = [];
    const lifecycle = [];
    const requestKey = request => typeof request === 'string' ? request : request.url;
    const cacheStorage = {
        async open(name) {
            if (!stores.has(name)) stores.set(name, new Map());
            const entries = stores.get(name);
            return {
                async match(request) { return entries.get(requestKey(request))?.clone(); },
                async put(request, response) { entries.set(requestKey(request), response.clone()); },
                async addAll(urls) {
                    installedUrls.push(...urls);
                    await options.installBarrier;
                    if (options.installFailure) throw new Error('Missing app-shell asset');
                    urls.forEach(url => entries.set(url, new Response(`installed:${url}`)));
                    lifecycle.push('complete-shell');
                }
            };
        },
        async match(request) {
            for (const entries of stores.values()) {
                if (entries.has(requestKey(request))) return entries.get(requestKey(request)).clone();
            }
        },
        async keys() { return [...stores.keys()]; },
        async delete(name) { return stores.delete(name); }
    };
    const context = vm.createContext({
        URL,
        caches: cacheStorage,
        self: {
            registration: { scope },
            location: new URL('sw.js', scope),
            addEventListener: (type, listener) => listeners.set(type, listener),
            skipWaiting: async () => { lifecycle.push('skipWaiting'); },
            clients: { claim: async () => { lifecycle.push('claim'); } }
        },
        fetch: async request => {
            const url = requestKey(request);
            networkRequests.push(url);
            if (options.offline) throw new TypeError('Offline');
            return new Response(`network:${url}`);
        }
    });
    vm.runInContext(fs.readFileSync(path.join(root, 'sw.js'), 'utf8'), context);
    const { cacheName, cachePrefix } = vm.runInContext('({ cacheName: CACHE_NAME, cachePrefix: CACHE_PREFIX })', context);
    return {
        scope, cacheName, cachePrefix, stores, networkRequests, installedUrls, lifecycle,
        async seed(name, pathname, body) {
            const cache = await cacheStorage.open(name);
            await cache.put(new URL(pathname, scope).href, new Response(body));
        },
        async dispatch(type) {
            let completion;
            listeners.get(type)({ waitUntil: promise => { completion = promise; } });
            assert.ok(completion, `${type} must extend the worker lifetime`);
            await completion;
        },
        async request(pathname, overrides = {}) {
            let responsePromise;
            const background = [];
            const request = { url: new URL(pathname, scope).href, method: 'GET', mode: 'cors', ...overrides };
            listeners.get('fetch')({
                request,
                respondWith: promise => { responsePromise = promise; },
                waitUntil: promise => background.push(promise)
            });
            const response = await responsePromise;
            await Promise.all(background);
            return { intercepted: responsePromise !== undefined, response };
        }
    };
};

test('worker cache reads use only the current academy cache', async () => {
    const worker = createWorkerHarness();
    await worker.seed('other-academy-release', 'js/app.js', 'other academy');
    await worker.seed(worker.cacheName, 'js/app.js', 'own academy');
    const result = await worker.request('js/app.js');
    assert.equal(await result.response.text(), 'own academy');
    assert.deepEqual(worker.networkRequests, []);
});

test('worker cache misses never borrow another academy response', async () => {
    const worker = createWorkerHarness();
    await worker.seed('other-academy-release', 'local-data.json', 'other academy');
    const result = await worker.request('local-data.json');
    assert.equal(await result.response.text(), `network:${worker.scope}local-data.json`);
});

test('worker navigation keeps the installed shell while a newer release is online', async () => {
    const worker = createWorkerHarness();
    await worker.seed('other-academy-release', 'index.html', 'wrong index');
    await worker.seed(worker.cacheName, 'index.html', 'installed release');
    const result = await worker.request('./?mode=guided', { mode: 'navigate' });
    assert.equal(await result.response.text(), 'installed release');
    assert.deepEqual(worker.networkRequests, []);
});

test('worker offline navigation uses its own installed index', async () => {
    const worker = createWorkerHarness({ offline: true });
    await worker.seed('other-academy-release', 'index.html', 'wrong offline index');
    await worker.seed(worker.cacheName, 'index.html', 'own offline index');
    const result = await worker.request('./', { mode: 'navigate' });
    assert.equal(await result.response.text(), 'own offline index');
});

test('worker leaves requests outside its path scope unintercepted', async () => {
    const worker = createWorkerHarness();
    for (const pathname of ['/peer-academy/index.html', '/academy-other/file.js', '/', 'https://external.test/app.js']) {
        assert.equal((await worker.request(pathname)).intercepted, false, pathname);
        assert.equal((await worker.request(pathname, { mode: 'navigate' })).intercepted, false, pathname);
    }
    assert.equal((await worker.request('index.html', { method: 'POST' })).intercepted, false);
    assert.deepEqual(worker.networkRequests, []);
});

test('worker activation deletes only old caches with its own prefix', async () => {
    const worker = createWorkerHarness();
    const oldName = `${worker.cachePrefix}old-release`;
    await worker.seed(oldName, 'index.html', 'old');
    await worker.seed(worker.cacheName, 'index.html', 'current');
    await worker.seed('other-academy-release', 'index.html', 'peer');
    await worker.dispatch('activate');
    assert.equal(worker.stores.has(oldName), false);
    assert.equal(worker.stores.has(worker.cacheName), true);
    assert.equal(worker.stores.has('other-academy-release'), true);
    assert.deepEqual(worker.lifecycle, ['claim']);
});

test('worker installs the complete local shell before requesting activation', async () => {
    let finishInstall;
    const installBarrier = new Promise(resolve => { finishInstall = resolve; });
    const worker = createWorkerHarness({ installBarrier });
    const installing = worker.dispatch('install');
    await Promise.resolve();
    assert.deepEqual(worker.lifecycle, []);
    finishInstall();
    await installing;
    assert.deepEqual(worker.lifecycle, ['complete-shell', 'skipWaiting']);
    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    const assets = [...html.matchAll(/(?:src|href)="((?:css|js)\/[^"]+)"/g)].map(match => match[1]);
    for (const asset of ['index.html', ...assets]) {
        assert.ok(worker.installedUrls.includes(new URL(asset, worker.scope).href), asset);
    }
});

test('worker failed shell installation cannot request activation', async () => {
    const worker = createWorkerHarness({ installFailure: true });
    await assert.rejects(worker.dispatch('install'), /Missing app-shell asset/);
    assert.deepEqual(worker.lifecycle, []);
});

test('standalone browser gate is pinned and required before Pages deployment', () => {
    const workflow = fs.readFileSync(path.join(root, '.github/workflows/pages.yml'), 'utf8');
    const requirements = fs.readFileSync(path.join(root, 'tests/requirements.txt'), 'utf8');
    const browser = fs.readFileSync(path.join(root, 'tests/browser_smoke.py'), 'utf8');
    const validation = workflow.match(/^  validate:\r?\n([\s\S]*?)^  deploy:/m)?.[1];
    assert.ok(validation, 'A separate validate job must precede deploy');
    assert.match(requirements.trim(), /^playwright==\d+\.\d+\.\d+$/);
    assert.match(validation, /uses: actions\/setup-python@v\d+/);
    assert.match(validation, /python-version: ['"]3\.12['"]/);
    const commands = [
        'python -m pip install -r tests/requirements.txt',
        'python -m playwright install --with-deps chromium',
        'python tests/browser_smoke.py'
    ];
    let previousPosition = -1;
    for (const command of commands) {
        const position = validation.indexOf(`run: ${command}`);
        assert.ok(position > previousPosition, `${command} must run in dependency order`);
        previousPosition = position;
    }
    assert.match(validation, /run: python tests\/browser_smoke\.py\s*$/m);
    assert.doesNotMatch(validation, /continue-on-error:\s*true|\|\|\s*true/);
    assert.match(workflow, /^  deploy:\r?\n    needs: validate\s*$/m);
    assert.match(browser, /ROOT = Path\(__file__\)\.resolve\(\)\.parents\[1\]/);
    assert.match(browser, /ThreadingHTTPServer\(\("127\.0\.0\.1", 0\), Handler\)/);
    assert.match(browser, /Thread\(target=server\.serve_forever, daemon=True\)/);
    assert.match(browser, /finally:\s+server\.shutdown\(\)/);
    assert.match(browser, /finally:\s+browser\.close\(\)/);
    assert.doesNotMatch(browser, /time\.sleep|wait_for_timeout|8891|_shared\//);
});
