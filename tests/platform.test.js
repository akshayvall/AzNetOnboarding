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
