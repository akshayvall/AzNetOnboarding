/* The syllabus owns order; stable module/unit IDs own identity, never array indexes. */
const CourseCurriculum = {
    stages: [
        { level: 0, title: 'Start here', outcome: 'Follow a request, find its address, and meet Front Door.', modules: [] },
        { level: 100, title: 'L100 · Understand the building blocks', outcome: 'Explain where an application lives and how traffic reaches it.',
            modules: ['net-fundamentals', 'azure-environment', 'azure-ip-addressing', 'azure-vnets'] },
        { level: 200, title: 'L200 · Connect, protect, and deliver', outcome: 'Choose a service and explain its job in a two-way traffic path.',
            modules: ['nsgs', 'azure-dns', 'load-balancing-overview', 'frontdoor-basics', 'peering-endpoints', 'route-tables-udr', 'nat-gateway', 'vpn-connectivity', 'azure-bastion'] },
        { level: 300, title: 'L300 · Design and troubleshoot', outcome: 'Use evidence to reason about security, failures, performance, and design.',
            modules: ['frontdoor-advanced', 'frontdoor-caching', 'frontdoor-waf', 'azure-firewall', 'network-architecture', 'network-watcher', 'az104-practice', 'capstone-hub-spoke'] }
    ],
    extraLessons: {
        'net-fundamentals': {
            id: 'layers-after-the-request', title: 'Use layers to locate a failure', minutes: 10,
            outcome: 'Use the OSI model as a set of questions, not seven appliances.',
            example: { title: 'The connection works; the shop returns an error', text: 'A browser resolves the name, establishes TCP and TLS, and receives HTTP 500. Those successful steps narrow the investigation: start with the application and proxy evidence, not by replacing DNS.' },
            paragraphs: [
                'You have already followed a request. Now give its jobs names. The OSI model has seven conceptual layers: physical signals, local frames, routed packets, transport, sessions, representation, and application messages. A Layer 7 service can make HTTP-aware decisions; a Layer 4 load balancer deals with transport flows. NSGs inspect IP addresses, transport protocol, and ports.',
                'Real protocols do not fit perfectly into seven boxes. TLS is not a separate Azure appliance, and HTTP/3 uses QUIC over UDP rather than the TCP handshake shown earlier. Use the stack to ask what the evidence proves. An HTTP error proves more progress than a timeout, but does not by itself identify which component generated it.'
            ],
            diagram: { type: 'osi-model', scenario: 'layers', level: 'detailed' },
            activity: { prompt: 'The browser receives an HTTP 500. What has progressed beyond a simple DNS lookup?', options: ['An application-level response was received', 'Only name resolution is known to have worked'], correct: 0, explanation: 'HTTP 500 is an application-protocol response. Identify its sender and inspect the corresponding request evidence.' },
            checks: [
                { question: 'What are the seven OSI layers in this lesson?', options: ['Seven required Azure services', 'Conceptual responsibilities used to reason about communication', 'Seven identical stages in every Internet protocol'], correct: 1, explanation: 'The model separates responsibilities. It is neither an Azure bill of materials nor an exact implementation of every protocol.' },
                { question: 'Which evidence best narrows a reported page failure?', options: ['The application resource group name', 'The last confirmed step and the observed response or error', 'The total number of network appliances'], correct: 1, explanation: 'Evidence from the failed request tells you which steps succeeded and what remains uncertain.' }
            ],
            teachBack: { prompt: 'Explain why HTTP 500 and a DNS lookup failure lead to different first checks.', example: 'An HTTP response means an application-protocol exchange happened. A lookup failure can prevent that exchange from starting. I still need to identify the sender of the 500.' },
            takeaway: 'Use layers to organize evidence, not to memorize a drawing.'
        },
        'azure-ip-addressing': {
            id: 'read-an-address-range', title: 'Read an address range before dividing it', minutes: 12,
            outcome: 'Read an IPv4 prefix and calculate the size of a small subnet.',
            example: { title: 'A /24 split into four /26 ranges', text: '10.20.1.0/24 has 256 addresses. Four /26 ranges start at .0, .64, .128, and .192. Each contains 64 addresses; Azure reserves five in each ordinary IPv4 subnet, leaving 59 assignable addresses.' },
            paragraphs: [
                'An IPv4 address has 32 bits. CIDR notation adds a slash and the number of bits fixed by the network prefix. In /26, 26 bits describe the network and 6 remain for addresses: 2 to the power of 6 is 64. A larger prefix number therefore describes a smaller range.',
                'A subnet must begin on the right boundary and fit entirely inside its VNet address space. 10.20.1.64/26 covers .64 through .127; 10.20.1.80/26 is not the canonical network boundary. Avoid overlaps with networks you plan to connect. The five reserved addresses are not a sizing buffer: also allow room for service requirements, growth, and future instances.'
            ],
            diagram: { type: 'address-space', scenario: 'split' },
            activity: { prompt: 'Change /26 to /27. Does the number of addresses increase or decrease?', options: ['Decrease: one fewer host bit', 'Increase: a larger prefix number means a larger subnet'], correct: 0, explanation: '/27 leaves five host bits, so it has 32 addresses before reservations, compared with 64 for /26.' },
            checks: [
                { question: 'How many total addresses are in an IPv4 /26?', options: ['26', '64', '256'], correct: 1, explanation: '32 minus 26 leaves six host bits; 2^6 is 64 addresses.' },
                { question: 'How many addresses are normally assignable in an ordinary Azure IPv4 /26 subnet?', options: ['59', '62', '64'], correct: 0, explanation: 'Azure reserves the first four and last address in each ordinary IPv4 subnet: 64 minus 5 is 59. Service-specific requirements still matter.' }
            ],
            teachBack: { prompt: 'Explain why /27 is smaller than /26 without memorizing a table.', example: 'One more bit is fixed in the prefix, so one fewer bit can vary. That halves the total number of addresses.' },
            takeaway: 'Count the range, subtract reservations, then plan capacity.'
        }
    },
    checkpoints: {
        100: {
            title: 'L100 checkpoint: the shop is not reachable',
            outcome: 'Separate addressing, connectivity, and application evidence.',
            evidence: ['DNS for shop.example.com returns the expected public frontend address.', 'The application is running on a VM with private address 10.20.1.10.', 'The browser times out. The team says both resources are in the same resource group.'],
            paragraphs: ['These are fictional observations, not a live Azure diagnosis. Identify what is known, what is not known, and the smallest useful next investigation. A management container is not a network path.'],
            checks: [
                { question: 'What does the successful DNS result prove?', options: ['The frontend can reach the application', 'The name resolved to an address', 'The response path is permitted'], correct: 1, explanation: 'The lookup answered the address question. It says nothing conclusive about the frontend, backend connection, or response path.' },
                { question: 'Why is the resource-group claim insufficient?', options: ['Resource groups organize management, not network connectivity', 'Resources in one group must have public IPs', 'Resource groups prevent communication across subnets'], correct: 0, explanation: 'Grouping resources does not establish routing, traffic permissions, backend health, or an application listener.' },
                { question: 'Which next investigation is most useful?', options: ['Move everything into another resource group', 'Make the private VM public immediately', 'Trace the frontend-to-backend request and response, checking addresses, routes, rules, and listener'], correct: 2, explanation: 'Follow the intended path before changing exposure. Evidence about reachability and the application narrows the cause safely.' }
            ],
            rubric: ['State what DNS did prove.', 'Draw both traffic directions and distinguish public frontend from private backend.', 'Name the first evidence you would collect without claiming a cause from a timeout.']
        },
        200: {
            title: 'L200 checkpoint: one allow rule is not enough',
            outcome: 'Combine routing, traffic policy, and service boundaries.',
            evidence: ['A new TCP connection to a VM is permitted by its subnet NSG.', 'An NSG on the VM network interface denies that same connection.', 'A NAT Gateway is attached to the subnet. The caller wants to initiate a connection from the Internet.'],
            paragraphs: ['The shop team proposes using the NAT Gateway public address for inbound access and deleting the interface rule. Evaluate each claim separately. NSGs, routing, and NAT solve different problems.'],
            checks: [
                { question: 'What happens to the new connection at the NSG boundaries?', options: ['The subnet allow overrides the interface deny', 'Both applicable NSGs must permit it; the deny blocks it', 'NAT Gateway bypasses both NSGs'], correct: 1, explanation: 'An allow at one applicable NSG does not override a deny at another. Evaluate both boundaries for the new flow.' },
                { question: 'Can the NAT Gateway publish the VM for unsolicited inbound connections?', options: ['Yes, because its IP is public', 'Yes, if the interface NSG allows the port', 'No; its outbound mappings permit replies, not general inbound publishing'], correct: 2, explanation: 'NAT Gateway provides outbound SNAT and corresponding return mappings. A public outbound address is not an inbound service frontend.' },
                { question: 'Which design discussion should happen before opening ports?', options: ['Who needs access, by which protocol, through which intended frontend or private path', 'Whether every VM can share an administrator password', 'Whether to remove all subnet boundaries'], correct: 0, explanation: 'Start with intended callers and traffic. Choose an application or management access path, then narrowly scope the required rules.' }
            ],
            rubric: ['Explain why the two NSGs are not a single priority list.', 'Separate an outbound reply from a new inbound connection.', 'Propose one intended access path and the evidence needed to verify it.']
        },
        300: {
            title: 'L300 checkpoint: defend the diagnosis',
            outcome: 'Use correlated evidence and safe changes to investigate an AFD incident.',
            evidence: ['Synthetic request A: WAF logs a custom Block action in Prevention mode; the origin has no matching request.', 'Synthetic request B: a fresh public-logo cache hit returns successfully; no origin fetch is expected.', 'Synthetic request C: the application returns an error for checkout while health probes succeed.'],
            paragraphs: ['Three observations from different requests cannot be collapsed into one diagnosis. Use matching timestamps, hosts, paths, and request identifiers. Propose the smallest justified change and a way to disprove your hypothesis.'],
            checks: [
                { question: 'Which interpretation fits request A?', options: ['The lack of an origin log proves origin failure', 'The edge policy can stop the request before the origin', 'The request must have been a cache hit'], correct: 1, explanation: 'A correlated Prevention-mode Block action explains why this request did not reach the origin. Investigate the matching rule and legitimate intent before tuning it.' },
                { question: 'What does request B tell you about checkout health?', options: ['Nothing conclusive: the cached logo can succeed without origin work', 'Checkout must be healthy because Front Door returned 200', 'The origin must have handled the logo'], correct: 0, explanation: 'A fresh cached object can mask origin problems for that object. It is not proof that a separate dynamic checkout path works.' },
                { question: 'Which next step best fits request C?', options: ['Disable WAF globally', 'Purge all objects and declare recovery', 'Correlate the failing checkout with application dependencies and compare what probes actually test'], correct: 2, explanation: 'A successful health probe tests its configured path, not every business operation. Use application evidence for the failing checkout and verify recovery on that operation.' }
            ],
            rubric: ['Keep the three requests and their evidence separate.', 'State a hypothesis, a safe scoped intervention, and a rollback condition.', 'Verify the affected operation and explain what remains unproven.']
        }
    },
    build(modules, units, starters) {
        const result = starters.lessons.map(l => ({
            ...l, starter: true, level: 0, moduleId: 'start', moduleTitle: 'Start here',
            paragraphs: [l.setup, l.explanation], checks: [{ question: l.question, options: l.options, correct: l.correct, explanation: l.feedback }],
            teachBack: { prompt: 'Explain the idea in your own words.', example: l.takeaway }
        }));
        for (const stage of this.stages.filter(s => s.level)) {
            for (const id of stage.modules) {
                const module = modules.find(m => m.id === id);
                if (!module || !units[id]?.length) throw new Error(`Missing course module: ${id}`);
                const authored = [...units[id]];
                if (id === 'azure-ip-addressing') authored.unshift(this.extraLessons[id]);
                if (id === 'net-fundamentals') authored.push(this.extraLessons[id]);
                if (CourseDepth[id]) authored.push(CourseDepth[id]);
                for (const unit of authored) result.push({
                    ...unit, id: `${id}--${unit.id}`, unitId: unit.id, moduleId: id, moduleTitle: module.title, level: stage.level,
                    lastInModule: unit === authored.at(-1),
                    caseStudy: unit === authored.at(-1) ? CourseCases[id] : null,
                    checks: unit === authored.at(-1) ? [...unit.checks, CourseCases[id]] : unit.checks
                });
            }
            const checkpoint = this.checkpoints[stage.level];
            result.push({ ...checkpoint, id: `checkpoint-${stage.level}`, level: stage.level, checkpoint: true,
                moduleId: `checkpoint-${stage.level}`, moduleTitle: 'Put it together',
                takeaway: checkpoint.outcome, teachBack: { prompt: 'Write your diagnosis and the next evidence you need.', example: checkpoint.rubric.join(' ') } });
        }
        if (new Set(result.map(l => l.id)).size !== result.length) throw new Error('Duplicate course lesson IDs');
        return result;
    }
};

const CourseProgress = {
    prefix: 'course-v2:',
    status(progress, lesson) {
        const key = this.prefix + lesson.id;
        const notes = progress.notes || {};
        let answers = [];
        let answerIssue = false;
        // Backups may contain arbitrary note values. Malformed answer data is not a passed check.
        const raw = notes[key + ':answers'];
        if (typeof raw === 'string') {
            try { const parsed = JSON.parse(raw); if (Array.isArray(parsed)) answers = parsed.slice(0, lesson.checks.length); }
            catch { answerIssue = true; }
        }
        const pilotKey = `guided-v1:${lesson.id}`;
        if (raw === undefined && lesson.starter && ['0', '1'].includes(notes[pilotKey + ':answer'])) answers = [Number(notes[pilotKey + ':answer'])];
        const savedSection = notes[key + ':section'] ?? (lesson.starter ? notes[pilotKey + ':section'] : undefined);
        const section = savedSection === 'experiment' ? 'practice' : savedSection;
        const legacy = lesson.starter ? progress.practiceChecks?.[`guided-v1:${lesson.id}`]?.passed === true : false;
        return {
            completed: progress.practiceChecks?.[key]?.passed === true || legacy,
            answers: answers.map((a, i) => Number.isInteger(a) && a >= 0 && a < lesson.checks[i].options.length ? a : null),
            draft: typeof notes[key + ':draft'] === 'string' ? notes[key + ':draft'] : '',
            section: ['story', 'practice', 'check'].includes(section) ? section : 'story',
            variant: (notes[key + ':variant'] ?? (lesson.starter ? notes[pilotKey + ':variant'] : undefined)) === '1' ? 1 : 0,
            answerIssue,
            practiced: progress.practiceChecks?.[key + ':practice']?.passed === true,
            read: notes[key + ':read'] === '1'
        };
    },
    next(lessons, progress) { return lessons.find(l => !this.status(progress, l).completed) || null; },
    record(progress, lesson, changes) {
        const key = this.prefix + lesson.id;
        const updated = { ...progress, notes: { ...progress.notes }, practiceChecks: { ...progress.practiceChecks } };
        for (const field of ['section', 'draft', 'variant', 'read']) {
            if (changes[field] !== undefined) updated.notes[key + ':' + field] = String(changes[field]).slice(0, 4000);
        }
        if (changes.answers) updated.notes[key + ':answers'] = JSON.stringify(changes.answers.slice(0, lesson.checks.length));
        if (changes.checked) {
            const passed = lesson.checks.every((q, i) => changes.answers?.[i] === q.correct);
            updated.practiceChecks[key] = { passed: passed || this.status(progress, lesson).completed,
                attempts: (progress.practiceChecks?.[key]?.attempts || 0) + 1, completedAt: new Date().toISOString() };
        }
        if (typeof changes.practiced === 'boolean') updated.practiceChecks[key + ':practice'] = {
            passed: changes.practiced || this.status(progress, lesson).practiced,
            attempts: (progress.practiceChecks?.[key + ':practice']?.attempts || 0) + 1, completedAt: new Date().toISOString()
        };
        return updated;
    }
};
