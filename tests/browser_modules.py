import re

from playwright.sync_api import expect


class FullModuleBrowserTests:
    def open_full_academy(self, route=""):
        self.page.goto(self.base_url + "index.html" + route)
        expect(self.page.locator("body")).to_have_class(re.compile(r"\bmodule-academy\b"))
        self.page.wait_for_function("() => typeof app !== 'undefined' && app.fullModules")

    def test_full_modules_retain_the_complete_teaching_and_tools(self):
        self.open_full_academy()
        modules = self.modules()
        self.assertEqual(len(modules), 21)
        for module in modules:
            with self.subTest(module=module["id"]):
                self.page.evaluate("id => app.loadModule(id)", module["id"])
                expect(self.page.locator("#tab-learn")).to_be_visible()
                self.assertIsNone(self.page.evaluate("() => UnitEngine.current"))
                coverage = self.page.evaluate("""() => {
                    const source = document.createElement('template');
                    source.innerHTML = app.currentModule.learn;
                    const normalize = text => text.replace(/\\s+/g, ' ').trim();
                    const actual = normalize(document.getElementById('tab-learn').textContent);
                    const expected = [...source.content.querySelectorAll('h2,h3,p,td')]
                        .map(el => normalize(el.textContent)).filter(Boolean);
                    return {count: expected.length, missing: expected.filter(text => !actual.includes(text))};
                }""")
                self.assertGreater(coverage["count"], 0)
                self.assertEqual(coverage["missing"], [])
                expect(self.page.locator(".module-tabs")).to_be_visible()
                for tab in ("diagrams", "interactive", "quiz", "lab"):
                    if tab == "interactive" and not self.page.evaluate("() => app.currentModule.interactive?.length"):
                        expect(self.page.locator('.module-tabs [data-tab="interactive"]')).to_be_hidden()
                        continue
                    self.page.locator(f'.module-tabs [data-tab="{tab}"]').click()
                    expect(self.page.locator(f"#tab-{tab}")).to_be_visible()
                    self.assertGreater(len(self.page.locator(f"#tab-{tab}").inner_text()), 80)
                self.page.locator('.module-tabs [data-tab="learn"]').click()
                order = self.page.evaluate("""() => {
                    const teaching = document.querySelector('#tab-learn .learn-section');
                    const worked = document.querySelector('#moduleCoaching');
                    return Boolean(teaching && worked &&
                        (teaching.compareDocumentPosition(worked) & Node.DOCUMENT_POSITION_FOLLOWING));
                }""")
                self.assertTrue(order, "The complete teaching must precede the worked case")

    def test_full_modules_start_resume_and_honest_progress(self):
        self.open_full_academy()
        expect(self.page.locator("#masteryDashboard")).to_contain_text("L100")
        expect(self.page.locator("#masteryDashboard")).to_contain_text("L200")
        expect(self.page.locator("#masteryDashboard")).to_contain_text("L300")
        expect(self.page.locator(".module-resume")).to_contain_text("Networking Fundamentals")
        self.page.locator(".module-resume").click()
        expect(self.page.locator("#moduleTitle")).to_have_text("Networking Fundamentals")
        self.page.locator("#completeModule").click()
        expect(self.page.locator("#tab-diagrams")).to_be_visible()
        progress = self.page.evaluate("() => ProgressManager.getProgress()")
        self.assertTrue(progress["moduleMastery"]["net-fundamentals"]["contentReviewed"])
        self.assertEqual(progress["quizScores"], {})
        self.assertEqual(progress["completedLabs"], [])
        self.page.reload()
        expect(self.page.locator("#moduleTitle")).to_have_text("Networking Fundamentals")
        expect(self.page.locator("#tab-diagrams")).to_be_visible()
        self.page.evaluate("app.showDashboard()")
        expect(self.page.locator(".module-resume")).to_contain_text("Networking Fundamentals")

    def test_full_modules_mobile_navigation_and_preserved_short_course(self):
        self.page.set_viewport_size({"width": 390, "height": 900})
        self.open_full_academy("#frontdoor-basics")
        expect(self.page.locator("#mobileNavToggle")).to_be_visible()
        self.page.locator("#mobileNavToggle").click()
        expect(self.page.locator("#sidebar")).to_be_visible()
        self.page.locator('[data-module-id="nsgs"]').click()
        expect(self.page.locator("#moduleTitle")).to_have_text("Network Security Groups (NSGs)")
        self.assertTrue(self.page.evaluate("() => document.getElementById('sidebar').inert"))
        self.assertFalse(self.page.evaluate("() => document.documentElement.scrollWidth > innerWidth + 1"))
        self.page.goto(self.base_url + "index.html#lesson=request")
        self.page.wait_for_url("**/guided.html#lesson=request")
        expect(self.page.locator("#lesson-title")).to_have_text("What happens when you open a website?")

    def test_full_modules_navigation_spacing_and_mobile_heading(self):
        self.page.set_viewport_size({"width": 1440, "height": 1000})
        self.open_full_academy("#frontdoor-basics")
        for row in self.page.locator("#nav-level-100 .nav-module").all():
            self.assertLessEqual(row.bounding_box()["height"], 64)
        self.page.set_viewport_size({"width": 390, "height": 900})
        title = self.page.locator("#moduleTitle").bounding_box()
        self.assertLess(title["x"], 40)
        self.assertGreaterEqual(title["width"], 320)
        self.assertLess(title["y"], 170)
        self.assertFalse(self.page.evaluate("() => document.documentElement.scrollWidth > innerWidth + 1"))

    def test_offline_full_modules_keep_chapters_diagrams_and_reading(self):
        self.open_full_academy("#frontdoor-basics")
        self.ready_worker()
        self.page.locator("#completeModule").click()
        progress = self.page.evaluate("() => ProgressManager.getProgress()")
        self.context.set_offline(True)
        try:
            response = self.page.reload(wait_until="domcontentloaded")
            self.assertTrue(response and response.ok and response.from_service_worker)
            expect(self.page.locator("#tab-diagrams svg").first).to_be_visible()
            self.page.locator('.module-tabs [data-tab="learn"]').click()
            expect(self.page.locator("#tab-learn")).to_contain_text("What is Azure Front Door?")
            self.assertEqual(self.page.evaluate("() => ProgressManager.getProgress()"), progress)
        finally:
            self.context.set_offline(False)
