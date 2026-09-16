const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const jsDirectory = path.join(__dirname, '..', 'js');
const expectedModuleIds = [
    'net-fundamentals', 'azure-environment', 'azure-vnets', 'azure-ip-addressing',
    'nsgs', 'azure-dns', 'load-balancing-overview', 'frontdoor-basics',
    'vpn-connectivity', 'peering-endpoints', 'azure-bastion', 'nat-gateway',
    'route-tables-udr', 'frontdoor-advanced', 'frontdoor-caching', 'frontdoor-waf',
    'network-architecture', 'az104-practice', 'azure-firewall', 'network-watcher',
    'capstone-hub-spoke'
];

function loadCatalog() {
    const context = vm.createContext({});
    const files = ['modules-100.js', 'modules-200.js', 'modules-300.js', 'modules-extras.js', 'mastery-content.js'];
    files.forEach(file => vm.runInContext(fs.readFileSync(path.join(jsDirectory, file), 'utf8'), context));
    const catalog = vm.runInContext('({ modules: [...MODULES_100, ...MODULES_200, ...MODULES_300, ...MODULES_EXTRAS], mastery: ACADEMY_MASTERY })', context);
    return { context, ...catalog };
}

function loadContent(context = vm.createContext({})) {
    const file = path.join(jsDirectory, 'learning-content.js');
    assert.ok(fs.existsSync(file), 'The standalone learning-content.js registry must exist');
    const source = fs.readFileSync(file, 'utf8');
    assert.match(source, /const LEARNING_CONTENT = Object\.freeze\(\{/);
    vm.runInContext(source, context, { filename: file, timeout: 1000 });
    return vm.runInContext('LEARNING_CONTENT', context);
}

function assertText(value, label, minimumLength = 20) {
    assert.equal(typeof value, 'string', `${label} must be text`);
    assert.ok(value.trim().length >= minimumLength, `${label} needs useful content`);
}

function assertTextList(values, label, minimumCount) {
    assert.ok(Array.isArray(values), `${label} must be an array`);
    assert.ok(values.length >= minimumCount, `${label} needs at least ${minimumCount} entries`);
    values.forEach((value, index) => assertText(value, `${label}[${index}]`));
    assert.equal(new Set(values).size, values.length, `${label} repeats an entry`);
}

test('standalone frozen browser contract covers exactly the 21 original modules without mutation', () => {
    const standalone = loadContent();
    assert.deepEqual(Object.keys(standalone).sort(), ['modules', 'paths', 'version']);
    assert.equal(standalone.version, '2026-09-14');
    assert.ok(Object.isFrozen(standalone));
    assert.deepEqual(Object.keys(standalone.modules).sort(), [...expectedModuleIds].sort());

    const { context, modules, mastery } = loadCatalog();
    assert.equal(modules.length, 21);
    assert.deepEqual(Array.from(modules, module => module.id).sort(), [...expectedModuleIds].sort());
    const before = JSON.stringify({ modules, mastery });
    loadContent(context);
    assert.equal(JSON.stringify({ modules, mastery }), before, 'Learning content must not replace quizzes, labs, or transfer metadata');
    modules.forEach(module => assert.ok(mastery.modules[module.id].transfer, `${module.id} already has transfer metadata`));
});

test('recommended AFD and broad networking paths include prerequisites before their dependants', () => {
    const { paths } = loadContent();
    const { mastery } = loadCatalog();
    assert.equal(paths.length, 2);
    assert.deepEqual(Array.from(paths, route => route.id).sort(), ['afd-diagnosis', 'azure-networking']);
    paths.forEach(route => {
        assert.deepEqual(Object.keys(route).sort(), ['description', 'id', 'moduleIds', 'title']);
        assertText(route.title, `${route.id} title`, 8);
        assertText(route.description, `${route.id} description`);
        assert.match(route.description, /recommended|recommendation/i);
        assert.match(route.description, /browse|reference|optional/i, 'Paths must be recommendations, not locks');
        assert.ok(Array.isArray(route.moduleIds));
        assert.equal(route.moduleIds[0], 'net-fundamentals');
        assert.equal(new Set(route.moduleIds).size, route.moduleIds.length);
        route.moduleIds.forEach((moduleId, index) => {
            assert.ok(expectedModuleIds.includes(moduleId), `${route.id} contains unknown module ${moduleId}`);
            mastery.modules[moduleId].prerequisites.forEach(prerequisite => {
                const prerequisiteIndex = route.moduleIds.indexOf(prerequisite);
                assert.ok(prerequisiteIndex >= 0 && prerequisiteIndex < index, `${route.id}: ${prerequisite} must precede ${moduleId}`);
            });
        });
    });
    const afd = paths.find(route => route.id === 'afd-diagnosis');
    ['azure-dns', 'nsgs', 'frontdoor-basics', 'frontdoor-advanced', 'frontdoor-waf', 'frontdoor-caching', 'network-watcher'].forEach(moduleId => {
        assert.ok(afd.moduleIds.includes(moduleId), `AFD diagnosis needs ${moduleId}`);
    });
    assert.deepEqual(Array.from(paths.find(route => route.id === 'azure-networking').moduleIds).sort(), [...expectedModuleIds].sort());
});

test('critical question policy indexes original quiz types and valid original answer keys', () => {
    const content = loadContent();
    const { modules } = loadCatalog();
    const selectedTypes = new Set();
    modules.forEach(module => {
        const critical = content.modules[module.id].criticalQuestions;
        assert.ok(Array.isArray(critical) && critical.length >= 1, `${module.id} needs explicit critical questions`);
        assert.equal(new Set(critical).size, critical.length, `${module.id} repeats a critical question`);
        critical.forEach(index => {
            assert.ok(Number.isInteger(index) && index >= 0 && index < module.quiz.length, `${module.id}: invalid original quiz index ${index}`);
            const question = module.quiz[index];
            const type = question.type || 'mcq';
            selectedTypes.add(type);
            assert.ok(['mcq', 'scenario', 'multi-select'].includes(type), `${module.id}: unknown quiz type ${type}`);
            assertText(question.question, `${module.id} critical prompt`);
            assert.ok(Array.isArray(question.options) && question.options.length >= 2);
            if (type === 'multi-select') {
                assert.ok(Array.isArray(question.correct) && question.correct.length >= 1);
                assert.equal(new Set(question.correct).size, question.correct.length);
                question.correct.forEach(answer => assert.ok(Number.isInteger(answer) && answer >= 0 && answer < question.options.length));
            } else {
                assert.ok(Number.isInteger(question.correct) && question.correct >= 0 && question.correct < question.options.length);
            }
        });
    });
    assert.deepEqual([...selectedTypes].sort(), ['mcq', 'multi-select', 'scenario']);
    const outcomeQuestions = {
        nsgs: [0, 3],
        'azure-dns': [4, 5],
        'frontdoor-advanced': [5],
        'frontdoor-caching': [1, 5],
        'nat-gateway': [3, 4],
        'route-tables-udr': [0, 1],
        'peering-endpoints': [0, 4],
        'network-watcher': [1, 2],
        'capstone-hub-spoke': [0, 2]
    };
    Object.entries(outcomeQuestions).forEach(([moduleId, indexes]) => {
        indexes.forEach(index => assert.ok(content.modules[moduleId].criticalQuestions.includes(index), `${moduleId}: preserve outcome-relevant question ${index}`));
    });
});

test('every module has substantial distinct worked reasoning along the fictional request path', () => {
    const content = loadContent();
    const scenarios = new Set();
    const results = new Set();
    Object.entries(content.modules).forEach(([moduleId, module]) => {
        assert.deepEqual(Object.keys(module).sort(), ['criticalQuestions', 'exemplar', 'lab', 'prediction', 'transfer', 'workedExample']);
        const example = module.workedExample;
        assert.deepEqual(Object.keys(example).sort(), ['result', 'scenario', 'steps', 'title']);
        assertText(example.title, `${moduleId} example title`, 10);
        assertText(example.scenario, `${moduleId} scenario`, 80);
        assertTextList(example.steps, `${moduleId} reasoning`, 3);
        assertText(example.result, `${moduleId} result`, 60);
        const reasoning = [example.scenario, ...example.steps, example.result].join(' ');
        assert.ok(reasoning.trim().split(/\s+/).length >= 120, `${moduleId} needs at least 120 useful worked-example words`);
        assert.match(reasoning, /shop\.example\.test/, `${moduleId} must connect to the shared fictional request`);
        assert.match(reasoning, /synthetic|fictional/i);
        assert.match(reasoning, /fail|deny|denied|reject|timeout|block|unhealthy|mismatch|overlap/i, `${moduleId} needs a contrasting failure`);
        assert.match(reasoning, /because|therefore|rules out|instead|distinguish|does not|not prove|cannot|\bso\b|rather than/i, `${moduleId} needs an explanation, not a checklist`);
        scenarios.add(example.scenario);
        results.add(example.result);
    });
    assert.equal(scenarios.size, 21);
    assert.equal(results.size, 21);
});

test('prediction answers are valid practical outcomes with explanations and varied answer positions', () => {
    const { modules } = loadContent();
    const answerPositions = new Set();
    Object.entries(modules).forEach(([moduleId, module]) => {
        const prediction = module.prediction;
        assert.deepEqual(Object.keys(prediction).sort(), ['correct', 'explanation', 'options', 'prompt']);
        assertText(prediction.prompt, `${moduleId} prediction`, 70);
        assert.ok(Array.isArray(prediction.options) && [3, 4].includes(prediction.options.length));
        assert.equal(new Set(prediction.options).size, prediction.options.length);
        prediction.options.forEach(option => assertText(option, `${moduleId} option`, 12));
        assert.ok(Number.isInteger(prediction.correct) && prediction.correct >= 0 && prediction.correct < prediction.options.length);
        assertText(prediction.explanation, `${moduleId} prediction explanation`, 80);
        assert.match(prediction.prompt, /what|which|predict|happens|outcome/i);
        answerPositions.add(prediction.correct);
    });
    assert.ok(answerPositions.size >= 3, 'New predictions must not all advertise the same answer position');
    const answerPatterns = {
        'net-fundamentals': /TLS.*before HTTP/i,
        'azure-environment': /update is denied.*existing route/i,
        'azure-vnets': /access fails.*explicit outbound/i,
        'azure-ip-addressing': /27.*27/,
        nsgs: /denied.*subnet/i,
        'azure-dns': /NXDOMAIN.*public DNS/i,
        'load-balancing-overview': /TCP.*will not be proxied.*TCP-capable/i,
        'frontdoor-basics': /Australia.*priority 1.*before latency/i,
        'vpn-connectivity': /stale.*24.*blackholes/i,
        'peering-endpoints': /public.*separate/i,
        'azure-bastion': /SSH connection is blocked.*VM NSG/i,
        'nat-gateway': /firewall/i,
        'route-tables-udr': /10\.10\.0\.4/,
        'frontdoor-advanced': /certificate|TLS/i,
        'frontdoor-caching': /share.*cache|same.*cache/i,
        'frontdoor-waf': /403.*WAF|WAF.*403/i,
        'network-architecture': /No automatic spoke-to-spoke transit/i,
        'az104-practice': /Origin application authorization rejected/i,
        'azure-firewall': /firewall implicit deny.*NSG/i,
        'network-watcher': /next hop/i,
        'capstone-hub-spoke': /503.*healthy edge/i
    };
    assert.deepEqual(Object.keys(answerPatterns).sort(), [...expectedModuleIds].sort());
    Object.entries(answerPatterns).forEach(([moduleId, expected]) => {
        const prediction = modules[moduleId].prediction;
        assert.match(prediction.options[prediction.correct], expected, `${moduleId} selected answer contradicts the reviewed outcome`);
    });
});

test('changed-problem transfer tasks require evidence beyond reading and retain existing assessment', () => {
    const { modules } = loadContent();
    const { mastery } = loadCatalog();
    Object.entries(modules).forEach(([moduleId, module]) => {
        assert.deepEqual(Object.keys(module.transfer).sort(), ['checks', 'prompt']);
        assertText(module.transfer.prompt, `${moduleId} transfer`, 80);
        assert.notEqual(module.transfer.prompt, mastery.modules[moduleId].transfer.prompt);
        assert.notEqual(module.transfer.prompt, module.workedExample.scenario);
        assertTextList(module.transfer.checks, `${moduleId} transfer evidence`, 3);
        assert.match(module.transfer.checks.join(' '), /record|table|trace|calculate|compare|evidence|diagram|matrix|prove|show|explain/i);
        assert.doesNotMatch(module.transfer.checks.join(' '), /mark.*complete|open.*portal.*proof|read.*page.*proof/i);
    });
});

test('fictional exemplars calibrate all four existing rubric criteria and state limitations', () => {
    const { modules } = loadContent();
    const { mastery } = loadCatalog();
    Object.entries(modules).forEach(([moduleId, module]) => {
        const exemplar = module.exemplar;
        assert.deepEqual(Object.keys(exemplar).sort(), ['artifact', 'rationale', 'sample', 'scores']);
        assertText(exemplar.artifact, `${moduleId} artifact`, 10);
        assertText(exemplar.sample, `${moduleId} sample`, 140);
        assert.match(exemplar.sample, /fictional/i);
        assert.match(exemplar.sample, /limitation/i);
        assert.equal(exemplar.scores.length, mastery.modules[moduleId].transfer.rubric.length);
        assert.equal(exemplar.scores.length, 4);
        exemplar.scores.forEach(score => assert.ok(Number.isInteger(score) && score >= 0 && score <= 4));
        assert.ok(exemplar.scores.some(score => score < 4), `${moduleId} needs honest, imperfect calibration`);
        assertText(exemplar.rationale, `${moduleId} rubric rationale`, 140);
        ['correctness', 'evidence', 'judgment', 'communication'].forEach(criterion => {
            assert.match(exemplar.rationale, new RegExp(criterion, 'i'), `${moduleId} must explain ${criterion}`);
        });
    });
});

test('all labs offer subscription-free evidence, bounded optional execution, and verified cleanup order', () => {
    const { modules } = loadContent();
    Object.entries(modules).forEach(([moduleId, module]) => {
        const lab = module.lab;
        assert.deepEqual(Object.keys(lab).sort(), ['cleanup', 'cost', 'environment', 'expected', 'failure', 'mode', 'safety', 'status', 'verify']);
        assert.ok(['local', 'cloud-optional', 'artifact'].includes(lab.mode));
        assert.equal(lab.status, 'source-reviewed');
        assert.match(lab.environment, /subscription-free/i);
        assert.match(lab.environment, /PowerShell 7|Bash|Node\.js/i);
        assert.match(lab.environment, /dependencies/i);
        assertText(lab.expected, `${moduleId} expected evidence`, 60);
        assertText(lab.failure, `${moduleId} failure evidence`, 60);
        assertTextList(lab.verify, `${moduleId} verification`, 3);
        assertTextList(lab.cleanup, `${moduleId} cleanup`, 3);
        assert.match(lab.cleanup[0], /local/i);
        assert.match(lab.cleanup.join(' '), /before|then|after/i);
        assert.match(lab.cleanup[lab.cleanup.length - 1], /verify|confirm/i);
        assert.match(lab.cleanup[lab.cleanup.length - 1], /inventory|remaining|absent|deleted|scratch/i);
        assert.match(lab.cost, /\$0|zero/i);
        assert.match(lab.cost, /optional Azure execution/i);
        assert.match(lab.cost, /approval/i);
        assert.match(lab.cost, /minute|hour/i);
        assert.match(lab.cost, /region/i);
        assert.match(lab.cost, /SKU|tier/i);
        assert.match(lab.cost, /retained|storage|logs|disk/i);
        assert.match(lab.safety, /synthetic/i);
        assert.match(lab.safety, /credentials/i);
        assert.match(lab.safety, /customer|workplace/i);
        assert.match(lab.safety, /not executed|unexecuted/i);
        assert.match(lab.safety, /https:\/\/learn\.microsoft\.com\//);
        assert.doesNotMatch(JSON.stringify(lab), /\baz (?:network|group|deployment|vm|login)\b/i, 'This slice adds no executable Azure CLI examples');
    });
});

test('existing architecture quiz explicitly assumes configured inspected transit', () => {
    const { modules } = loadCatalog();
    const question = modules.find(module => module.id === 'network-architecture').quiz[0];
    assert.match(question.question, /explicitly configured/i, 'Hub-spoke peerings do not enable transit by default');
    assert.equal(question.correct, 1, 'Keep the original answer index stable');
    assert.match(question.options[question.correct], /Firewall or NVA with UDRs/);
    assert.match(question.explanation, /non-transitive/i);
    assert.match(question.explanation, /both directions/i);
    assert.match(question.explanation, /Direct spoke peering/i);
});

test('source-reviewed content preserves scoped egress, origin security, preview, and flow-log guidance', () => {
    const content = loadContent();
    const egress = JSON.stringify([content.modules['azure-vnets'], content.modules['nat-gateway']]);
    assert.match(egress, /API versions? (?:released )?after March 31, 2026/);
    assert.match(egress, /existing VNets (?:are not|are unchanged|remain)/);
    const origins = JSON.stringify(content.modules['frontdoor-advanced']);
    assert.match(origins, /AzureFrontDoor\.Backend/);
    assert.match(origins, /X-Azure-FDID/);
    assert.match(origins, /Premium.*Private Link/);
    assert.match(origins, /managed.identity origin authentication.*preview/i);
    assert.match(origins, /supported non-Private.Link origins/);
    const monitoring = JSON.stringify(content.modules['network-watcher']);
    assert.match(monitoring, /VNet flow logs/);
    assert.match(monitoring, /new NSG flow logs.*(?:unavailable|not supported)/i);
    assert.match(monitoring, /September 30, 2027/);
    assert.match(monitoring, /2026-09-14/);
    const links = JSON.stringify(content).match(/https:\/\/[^\s"\\]+/g) || [];
    links.forEach(link => {
        const hostname = new URL(link).hostname;
        assert.ok(hostname === 'learn.microsoft.com' || hostname.endsWith('.example.test'), `Nonofficial reference or nonsynthetic endpoint: ${link}`);
    });
});