const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const runtimeFiles = [
    'index.html', 'js/app.js', 'js/quiz-engine.js', 'js/interactive.js',
    'js/lab-engine.js', 'js/diagrams.js', 'js/modules-300.js'
];

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

test('mobile shell provides an accessible zero-width drawer and five destinations', () => {
    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    const css = fs.readFileSync(path.join(root, 'css/styles.css'), 'utf8');
    const app = fs.readFileSync(path.join(root, 'js/app.js'), 'utf8');

    assert.match(html, /id="navBackdrop"/);
    assert.match(html, /class="bottom-nav"/);
    ['today', 'learn', 'practice', 'build', 'more'].forEach(destination => {
        assert.match(html, new RegExp(`data-destination="${destination}"`));
    });
    assert.match(css, /#sidebar\s*\{[^}]*transform:\s*translateX\(-100%\)/s);
    assert.doesNotMatch(css, /#sidebar\s*\{[^}]*left:\s*-\d+px/s);
    assert.match(app, /closeMobileNav/);
    assert.match(app, /navBackdrop/);
    assert.match(app, /mobileNavToggle[^\n]*focus|toggle\.focus/s);
});

test('workflow prototype exposes guided mode, section resume, compact evidence, and an inline core visual', () => {
    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    const app = fs.readFileSync(path.join(root, 'js/app.js'), 'utf8');
    const mastery = fs.readFileSync(path.join(root, 'js/mastery-engine.js'), 'utf8');
    const diagrams = fs.readFileSync(path.join(root, 'js/diagrams.js'), 'utf8');

    assert.match(html, /id="moduleModeBar"/);
    assert.match(html, /id="sectionOutline"/);
    assert.match(html, /data-module-mode="guided"/);
    assert.match(html, /data-module-mode="browse"/);
    assert.match(app, /frontdoor-advanced/);
    assert.match(app, /lastSectionByModule/);
    assert.match(app, /renderSectionOutline/);
    assert.match(mastery, /class="evidence-disclosure"/);
    assert.match(diagrams, /renderPreview\(/);
});

test('runtime assets and offline cache share the redesign release', () => {
    const release = '2026-07-ui-redesign';
    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    const serviceWorker = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
    const assets = Array.from(html.matchAll(/(?:src|href)="((?:css|js)\/[^"?]+)(?:\?v=[^"]+)?"/g), match => match[1]);

    assert.match(serviceWorker, new RegExp(`CACHE_NAME = .*${release}`));
    assert.ok(assets.length > 10);
    assets.forEach(asset => {
        const versionedAsset = `${asset}?v=${release}`;
        assert.ok(html.includes(versionedAsset), `${versionedAsset} missing from index.html`);
        assert.ok(serviceWorker.includes(versionedAsset), `${versionedAsset} missing from sw.js`);
    });
});
