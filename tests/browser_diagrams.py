import re

from playwright.sync_api import expect


class DiagramBrowserTests:
    def test_diagram_controls_predictions_and_keyboard(self):
        self.open_page("#net-fundamentals?tab=diagrams")
        diagram = self.page.locator("#tab-diagrams .visual-diagram").first
        expect(diagram.locator('[data-diagram-action="previous"]')).to_be_disabled()
        next_button = diagram.locator('[data-diagram-action="next"]')
        next_button.focus()
        self.page.keyboard.press("Enter")
        expect(diagram).to_have_attribute("data-step", "1")
        expect(diagram.locator('[data-diagram-action="next"]')).to_be_focused()
        diagram.locator('[data-diagram-action="overview"]').click()
        expect(diagram).to_have_attribute("data-overview", "true")
        diagram.locator('[data-diagram-action="next"]').click()
        expect(diagram).to_have_attribute("data-step", "1")
        self.assertEqual(diagram.locator('.trace-node.is-current').count(), 1)
        diagram.locator('[data-diagram-action="previous"]').click()
        expect(diagram).to_have_attribute("data-step", "0")
        expect(diagram.locator('[data-diagram-action="next"]')).to_be_focused()
        diagram.locator('[data-diagram-setting="level"]').select_option("detailed")
        expect(diagram.locator('[data-diagram-setting="level"]')).to_be_focused()
        diagram.locator('[data-diagram-action="reset"]').click()
        expect(diagram).to_have_attribute("data-step", "0")

        dns = self.page.locator('#tab-diagrams [data-diagram-type="dns-resolution"]')
        dns.locator('[data-diagram-setting="level"]').select_option("detailed")
        for _ in range(4):
            dns.locator('[data-diagram-action="next"]').click()
        expect(dns.locator(".diagram-prediction")).to_be_visible()
        expect(dns).to_have_attribute("data-step", "3")
        dns.locator('[data-diagram-answer="0"]').click()
        expect(dns.locator(".diagram-prediction-feedback")).to_contain_text("Not quite")
        expect(dns).to_have_attribute("data-step", "3")
        dns.locator('[data-diagram-answer="1"]').click()
        expect(dns.locator(".diagram-prediction-feedback")).to_contain_text("Correct")
        dns.locator('[data-diagram-action="next"]').click()
        expect(dns).to_have_attribute("data-step", "4")
        dns.locator('[data-diagram-setting="scenario"]').select_option("cached")
        expect(dns).to_have_attribute("data-step", "0")
        expect(dns.locator(".diagram-prediction")).to_have_count(0)
        self.assertEqual(dns.locator('[data-item="root"]').count(), 0)

    def test_diagram_every_model_responsive_named_and_motionless(self):
        self.open_page("#visual-lab")
        types = self.page.evaluate("Object.keys(DiagramCatalog.models)")
        self.assertEqual(len(types), 26)
        for width, height in ((320, 900), (390, 844), (768, 1024), (1440, 1000)):
            self.page.set_viewport_size({"width": width, "height": height})
            for motion in ("reduce", "no-preference"):
                self.page.emulate_media(reduced_motion=motion)
                for diagram_type in types:
                    with self.subTest(width=width, motion=motion, diagram=diagram_type):
                        result = self.page.evaluate("""type => {
                            const host = document.getElementById('requestLabDiagram');
                            DiagramEngine.mount(host, type, { level: 'detailed' });
                            const initialLayout = host.dataset.layout;
                            const listFont = parseFloat(getComputedStyle(host.querySelector('.diagram-path-list strong')).fontSize);
                            host.querySelector('[data-diagram-action="map"]').click();
                            const svg = host.querySelector('svg');
                            const visibleText = [...host.querySelectorAll('svg text')].filter(el => el.checkVisibility());
                            const duplicates = [...document.querySelectorAll('[id]')].map(el => el.id)
                                .filter((id, index, ids) => ids.indexOf(id) !== index);
                            const local = new Set([...svg.querySelectorAll('[id]')].map(el => el.id));
                            const missing = [...svg.outerHTML.matchAll(/url\\(#([^)]+)\\)/g)].map(match => match[1]).filter(id => !local.has(id));
                            const overflow = [...svg.querySelectorAll('.trace-node')].flatMap(group => {
                                const rect = group.querySelector('rect').getBBox();
                                return [...group.querySelectorAll('text')].filter(label => {
                                    const box = label.getBBox();
                                    return box.x < rect.x - 1 || box.x + box.width > rect.x + rect.width + 1 ||
                                        box.y < rect.y - 1 || box.y + box.height > rect.y + rect.height + 1;
                                }).map(label => label.textContent);
                            });
                            return { duplicates, missing, overflow, role: svg.getAttribute('role'),
                                fontSizes: visibleText.map(el => parseFloat(getComputedStyle(el).fontSize) * svg.getScreenCTM().a),
                                motion: host.querySelectorAll('animate, animateMotion').length,
                                running: host.getAnimations({subtree:true}).filter(a => a.playState === 'running').length,
                                listFont, layout: initialLayout };
                        }""", diagram_type)
                        self.assertEqual(result["duplicates"], [])
                        self.assertEqual(result["missing"], [])
                        self.assertEqual(result["overflow"], [])
                        self.assertEqual(result["role"], "img")
                        self.assertEqual(result["motion"], 0)
                        self.assertEqual(result["running"], 0)
                        self.assertTrue(all(size >= 12 for size in result["fontSizes"]))
                        self.assertGreaterEqual(result["listFont"], 12)
                        self.assertEqual(result["layout"], "steps" if width <= 768 else "map")
                        self.assert_no_overflow()
        self.page.set_viewport_size({"width": 320, "height": 900})
        self.page.evaluate("DiagramEngine.mount(document.getElementById('requestLabDiagram'), 'afd-request', {level:'detailed'})")
        host = self.page.locator("#requestLabDiagram")
        host.locator('[data-diagram-action="map"]').click()
        expect(host.locator(".diagram-map")).to_be_visible()
        host.locator(".diagram-map").focus()
        self.page.keyboard.press("ArrowRight")
        self.assert_no_overflow()

    def test_diagram_all_scenarios_and_tiers_reset_cleanly(self):
        self.open_page("#visual-lab")
        result = self.page.evaluate("""() => {
            const host = document.getElementById('requestLabDiagram');
            const failures = [];
            let count = 0;
            for (const [type, definition] of Object.entries(DiagramCatalog.models)) {
                for (const scenario of definition.scenarios) {
                    for (const level of ['basic', 'detailed']) {
                        DiagramEngine.mount(host, type, { scenario: scenario.id, level });
                        if (!host.querySelector('svg') || host.dataset.step !== '0' || !host.textContent.includes(scenario.label)) failures.push(type + '/' + scenario.id);
                        count++;
                    }
                }
            }
            return { count, failures };
        }""")
        self.assertGreater(result["count"], 100)
        self.assertEqual(result["failures"], [])
        self.page.evaluate("DiagramEngine.mount(document.getElementById('requestLabDiagram'), 'afd-request', {level:'detailed'})")
        host = self.page.locator("#requestLabDiagram")
        host.locator('[data-diagram-setting="connection"]').select_option("private")
        expect(host.locator('[data-item="pls"]')).to_have_count(1)
        host.locator('[data-diagram-setting="tier"]').select_option("standard")
        expect(host.locator('[data-diagram-setting="connection"]')).to_have_value("public")
        expect(host.locator(".diagram-setting-notice")).to_contain_text("Premium")
        expect(host.locator('[data-item="pls"]')).to_have_count(0)
        self.assertTrue(host.locator('[data-diagram-setting="connection"] option[value="private"]').evaluate("option => option.disabled"))
        host.locator('[data-diagram-setting="scenario"]').select_option("hit")
        expect(host.locator('[data-item="public-origin"]')).to_have_count(0)
        host.locator('[data-diagram-setting="scenario"]').select_option("all-unhealthy")
        expect(host.locator(".diagram-transcript")).to_contain_text(re.compile(r"round.robin"))

    def test_diagram_inline_lessons_share_models_without_duplicate_ids(self):
        self.open_page()
        result = self.page.evaluate("""() => {
            const failures = [];
            let inlineCount = 0;
            for (const module of MODULES) {
                app.loadModule(module.id);
                const ids = [...document.querySelectorAll('[id]')].map(el => el.id);
                if (new Set(ids).size !== ids.length) failures.push(module.id + ': duplicate IDs');
                for (const host of document.querySelectorAll('#tab-learn [data-diagram-model]')) {
                    inlineCount++;
                    if (!host.querySelector('svg[role="img"]') || !host.querySelector('.diagram-transcript')) failures.push(module.id + ': missing shared visual');
                }
                if (document.querySelector('#tab-learn .diagram-container > svg')) failures.push(module.id + ': legacy SVG');
                if (document.querySelectorAll('#inlineCoreVisual').length > 1) failures.push(module.id + ': duplicate core preview');
            }
            return { failures, inlineCount };
        }""")
        self.assertEqual(result["failures"], [])
        self.assertEqual(result["inlineCount"], 11)

    def test_diagram_paths_do_not_cross_unrelated_nodes_or_captions(self):
        self.open_page("#visual-lab")
        issues = self.page.evaluate("""() => {
            const host = document.getElementById('requestLabDiagram');
            const issues = [];
            for (const [type, definition] of Object.entries(DiagramCatalog.models)) {
                const configurations = [{}, ...(definition.controls || []).flatMap(control => control.options.map(option => ({[control.id]: option.id})))];
                for (const settings of configurations) for (const scenario of definition.scenarios) for (const level of ['basic', 'detailed']) {
                    const options = {...settings, scenario: scenario.id, level};
                    const model = DiagramCatalog.resolve(type, options);
                    DiagramEngine.mount(host, type, options);
                    const nodes = DiagramEngine.geometry(model).nodes;
                    const captions = [...host.querySelectorAll('.trace-boundary text')].map(element => element.getBBox());
                    for (const edge of host.querySelectorAll('.trace-edge')) {
                        const path = edge.querySelector('path');
                        const length = path.getTotalLength();
                        const candidates = nodes.filter(node => ![edge.dataset.from, edge.dataset.to].includes(node.id));
                        const from = nodes.find(node => node.id === edge.dataset.from);
                        const to = nodes.find(node => node.id === edge.dataset.to);
                        const members = from.group && from.group === to.group ? nodes.filter(node => node.group === from.group) : [];
                        const boundary = members.length ? {
                            left:Math.min(...members.map(node => node.x)) - 18,
                            right:Math.max(...members.map(node => node.x + node.width)) + 18,
                            top:Math.min(...members.map(node => node.y)) - 56,
                            bottom:Math.max(...members.map(node => node.y + node.height)) + 18
                        } : null;
                        for (let distance = 1; distance < length; distance += 6) {
                            const point = path.getPointAtLength(distance);
                            const crosses = candidates.find(node => point.x > node.x + 2 && point.x < node.x + node.width - 2 &&
                                point.y > node.y + 2 && point.y < node.y + node.height - 2);
                            const caption = captions.some(box => point.x > box.x && point.x < box.x + box.width &&
                                point.y > box.y && point.y < box.y + box.height);
                            const outside = boundary && (point.x < boundary.left || point.x > boundary.right || point.y < boundary.top || point.y > boundary.bottom);
                            if (crosses || caption || outside) {
                                issues.push({type, options, edge:edge.dataset.item, crosses:crosses?.id || (caption ? 'boundary caption' : 'outside its shared boundary')});
                                break;
                            }
                        }
                    }
                }
            }
            return issues;
        }""")
        self.assertEqual(issues, [])

    def test_diagram_navigation_stays_close_to_the_map(self):
        self.open_page("#visual-lab")
        self.page.locator('[data-diagram-setting="level"]').select_option("detailed")
        position = self.page.evaluate("""() => {
            const host = document.getElementById('requestLabDiagram');
            const controls = host.querySelector('.diagram-navigation').getBoundingClientRect();
            const map = host.querySelector('.diagram-map').getBoundingClientRect();
            return {controlsBottom:controls.bottom, mapTop:map.top, mapHeight:map.height};
        }""")
        self.assertLessEqual(position["controlsBottom"], position["mapTop"])
        self.assertLessEqual(position["mapHeight"], 540)
        self.page.evaluate("DiagramEngine.mount(document.getElementById('requestLabDiagram'), 'osi-model', {level:'detailed'})")
        for _ in range(7):
            self.page.locator('#requestLabDiagram [data-diagram-action="next"]').click()
        visible = self.page.evaluate("""() => {
            const map = document.querySelector('#requestLabDiagram .diagram-map');
            const frame = map.getBoundingClientRect();
            const node = map.querySelector('.trace-node.is-current').getBoundingClientRect();
            return node.top >= frame.top && node.bottom <= frame.bottom;
        }""")
        self.assertTrue(visible, "The current step must scroll within the map, not disappear below its viewport")

    def test_diagram_mobile_entry_starts_at_the_controls(self):
        self.page.set_viewport_size({"width": 390, "height": 844})
        self.open_page("#visual-lab")
        start = self.page.get_by_role("button", name="Start tracing")
        expect(start).to_be_in_viewport()
        start.click()
        host = self.page.locator("#requestLabDiagram")
        expect(host).to_have_attribute("data-step", "1")
        expect(host.locator('[data-diagram-action="next"]')).to_be_focused()
        expect(host.locator(".diagram-coach")).to_be_in_viewport()

    def test_diagram_lab_failed_save_never_claims_persistence(self):
        self.open_page("#visual-lab")
        result = self.page.evaluate("""() => {
            const key = ProgressManager.storageKey();
            const before = localStorage.getItem(key);
            DiagramLab.questions.forEach((question, index) => {
                document.querySelector(`input[name="request-check-${index}"][value="${question.answer}"]`).checked = true;
            });
            const original = Storage.prototype.setItem;
            try {
                Storage.prototype.setItem = function(storageKey, value) {
                    if (this === localStorage && storageKey === key) throw new DOMException('Controlled quota rejection', 'QuotaExceededError');
                    return original.call(this, storageKey, value);
                };
                document.querySelector('[data-lab-action="check"]').click();
                const feedback = document.getElementById('requestLabFeedback').textContent;
                app.navigateDestination('visual-lab');
                return {before, after:localStorage.getItem(key), feedback, saved:document.getElementById('requestLabSaved').textContent,
                    status:ProgressManager.getStorageStatus()};
            } finally {
                Storage.prototype.setItem = original;
            }
        }""")
        self.assertEqual(result["before"], result["after"])
        self.assertFalse(result["status"]["saved"])
        self.assertIn("not saved", result["feedback"])
        self.assertIn("not saved", result["saved"])
        self.assertNotIn("Last saved attempt: threshold met", result["saved"])
        self.page.locator('#storageNotice [data-learning-action="retry-save"]').click()
        expect(self.page.locator("#requestLabSaved")).to_contain_text("threshold met")
        self.page.reload(wait_until="domcontentloaded")
        expect(self.page.locator("#requestLabSaved")).to_contain_text("Attempts: 1")

    def test_diagram_prints_complete_scenario_without_dead_controls(self):
        self.open_page("#frontdoor-basics")
        host = self.page.locator("#tab-learn .visual-diagram").first
        host.locator('[data-diagram-setting="level"]').select_option("detailed")
        host.locator('[data-diagram-setting="scenario"]').select_option("hit")
        titles = host.locator(".diagram-transcript h4").all_text_contents()
        with self.page.expect_popup() as pending:
            self.page.evaluate("""() => {
                const original = window.open;
                window.open = (...args) => {
                    const popup = original.apply(window, args);
                    popup.print = () => {};
                    return popup;
                };
                try { app.printCheatSheet(); } finally { window.open = original; }
            }""")
        sheet = pending.value
        try:
            expect(sheet.locator("[data-diagram-action], [data-diagram-setting], .diagram-map")).to_have_count(0)
            expect(sheet.locator(".diagram-transcript")).to_have_attribute("open", "")
            for title in titles:
                expect(sheet.get_by_role("heading", name=title, exact=True)).to_be_visible()
        finally:
            sheet.close()
        try:
            self.page.evaluate("window.dispatchEvent(new Event('beforeprint'))")
            self.page.emulate_media(media="print")
            expect(host.locator(".diagram-transcript")).to_have_attribute("open", "")
            expect(host.locator(".diagram-navigation")).to_be_hidden()
            for title in titles:
                expect(host.get_by_role("heading", name=title, exact=True)).to_be_visible()
        finally:
            self.page.emulate_media(media="screen")
            self.page.evaluate("window.dispatchEvent(new Event('afterprint'))")
        self.assertFalse(host.locator(".diagram-transcript").evaluate("details => details.open"))

    def test_diagram_lab_check_persists_without_awarding_mastery(self):
        self.open_page("#visual-lab")
        expect(self.page.locator("#destinationTitle")).to_contain_text("request")
        self.assertEqual(self.page.evaluate("LearningEngine.parseRoute(location.hash).destination"), "visual-lab")
        self.page.locator('[data-lab-action="check"]').click()
        expect(self.page.locator("#requestLabFeedback")).to_contain_text("every")
        answers = self.page.evaluate("DiagramLab.questions.map(q => q.answer)")
        for index, answer in enumerate(answers):
            self.page.locator(f'input[name="request-check-{index}"][value="{answer}"]').check()
        self.page.locator('[data-lab-action="check"]').click()
        expect(self.page.locator("#requestLabFeedback")).to_contain_text("5 of 5")
        self.assertTrue(self.page.evaluate("ProgressManager.getProgress().practiceChecks['afd-request-lab'].passed"))
        self.assertIsNone(self.page.evaluate("ProgressManager.getProgress().moduleMastery['afd-request-lab'] || null"))
        self.page.reload(wait_until="domcontentloaded")
        expect(self.page.locator("#requestLabSaved")).to_contain_text("threshold met")
        self.navigate("more")
        expect(self.page.locator("#destinationView")).to_contain_text("AFD request lab")
