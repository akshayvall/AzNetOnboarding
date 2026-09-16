import argparse
from contextlib import contextmanager
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
import re
import subprocess
import sys
import tempfile
from threading import Thread
import unittest
from urllib.parse import unquote, urlsplit

from playwright.sync_api import expect, sync_playwright


ROOT = Path(__file__).resolve().parents[1]
RELEASE = "2026-09-learning-1"
MOUNT = "/academy/"
VIEWPORTS = ((320, 900), (390, 844), (768, 1024), (1440, 1000))
TIMEOUT = 10000
SYNTHETIC_EVIDENCE = "Synthetic browser case: compare the expected result with a local observation and explain the remaining uncertainty."
STORAGE_ERROR = "browser-smoke: expected quota rejection"
CACHE_PREFIXES = {"ai-mastery": "ai-mastery-academy-", "azure-networking": "azure-networking-academy-"}


@contextmanager
def local_server():
    class Handler(SimpleHTTPRequestHandler):
        def log_message(self, format, *args):
            pass

        def handle(self):
            try:
                super().handle()
            except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError):
                pass

        def do_GET(self):
            requested = urlsplit(self.path)
            self.server.requests.append(self.path)
            if requested.path == "/peer-academy/probe.txt":
                self.send_content(b"peer network response", "text/plain")
                return
            if not requested.path.startswith(MOUNT):
                self.send_error(404)
                return
            relative = unquote(requested.path[len(MOUNT):]) or "index.html"
            if relative == "cache-probe.txt":
                self.send_content(b"academy network response", "text/plain")
                return
            target = (ROOT / relative).resolve()
            if not target.is_relative_to(ROOT) or not target.is_file():
                self.send_error(404)
                return
            if relative == self.server.failed_asset:
                self.server.failed_requests.append(self.path)
                self.send_error(503, "Controlled missing release asset")
                return
            content = target.read_bytes()
            release = self.server.worker_release if relative == "sw.js" else self.server.release
            if target.suffix in {".html", ".js", ".css"}:
                content = content.replace(RELEASE.encode(), release.encode())
            if relative == "js/app.js":
                content += f"\nglobalThis.__smokeAssetRelease = {json.dumps(self.server.release)};\n".encode()
            self.send_content(content, self.guess_type(str(target)))

        def do_HEAD(self):
            self.do_GET()

        def send_content(self, content, content_type):
            self.send_response(200)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(len(content)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            if self.command != "HEAD":
                self.wfile.write(content)

    server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
    server.release = RELEASE
    server.worker_release = RELEASE
    server.failed_asset = None
    server.failed_requests = []
    server.requests = []
    server.base_url = f"http://127.0.0.1:{server.server_port}{MOUNT}"
    thread = Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        yield server
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=5)


class AcademyBrowserTests(unittest.TestCase):
    def setUp(self):
        self.errors = []
        self.external_requests = []
        self.allowed_storage_errors = False
        self.expected_storage_errors = 0
        self.server.release = RELEASE
        self.server.worker_release = RELEASE
        self.server.failed_asset = None
        self.server.failed_requests = []
        worker_test = self._testMethodName.startswith(("test_offline", "test_worker", "test_peer"))
        self.context = self.browser.new_context(
            viewport={"width": 1440, "height": 1000},
            reduced_motion="reduce",
            service_workers="allow" if worker_test else "block",
        )
        self.addCleanup(self.context.close)
        self.context.set_default_timeout(TIMEOUT)
        self.context.set_default_navigation_timeout(TIMEOUT)
        self.context.on("request", self.track_request)
        self.context.route("**/*", self.local_requests_only)
        self.page = self.context.new_page()
        self.page.on("pageerror", lambda error: self.errors.append(str(error)))
        self.page.on("console", self.track_console)

    def tearDown(self):
        self.assertEqual(self.external_requests, [], "The browser gate must request only localhost assets")
        self.assertEqual(self.errors, [], "Unexpected browser errors")

    def track_request(self, request):
        if urlsplit(request.url).scheme in {"http", "https"} and urlsplit(request.url).hostname not in {"127.0.0.1", "localhost", "::1"}:
            self.external_requests.append(request.url)

    def local_requests_only(self, route):
        parsed = urlsplit(route.request.url)
        if parsed.scheme in {"http", "https"} and parsed.hostname not in {"127.0.0.1", "localhost", "::1"}:
            route.abort("blockedbyclient")
        else:
            route.continue_()

    def track_console(self, message):
        if message.type == "error":
            if self.allowed_storage_errors and message.text == STORAGE_ERROR:
                self.expected_storage_errors += 1
                return
            self.errors.append(message.text)

    def open_page(self, route="", base_url=None):
        response = self.page.goto((base_url or self.base_url) + route, wait_until="domcontentloaded")
        self.assertTrue(response and response.ok, "The local academy document must load")
        self.assertTrue(self.page.evaluate("() => typeof app !== 'undefined' && typeof LearningEngine !== 'undefined' && LearningEngine.modules.length > 0"))
        expect(self.page.locator("main .view.active")).to_have_count(1)

    def modules(self):
        return self.page.evaluate("""() => MasteryEngine.getRealModules(MODULES, ACADEMY_MASTERY).map(module => ({
            id: module.id, title: module.title, level: module.level,
            labTitle: module.lab?.title || '', hasLab: Boolean(module.lab),
            isPM: typeof MODULES_PM !== 'undefined' && MODULES_PM.some(item => item.id === module.id)
        }))""")

    def load_module(self, module_id, tab="learn"):
        self.page.evaluate("route => app.loadModule(route.moduleId, { tab: route.tab, mode: 'guided' })", {"moduleId": module_id, "tab": tab})
        expect(self.page.locator("#moduleView")).to_have_class(re.compile(r"\bactive\b"))
        self.assertEqual(self.page.evaluate("() => app.currentModule?.id"), module_id)

    def navigate(self, destination):
        navigation = ".bottom-nav" if self.page.viewport_size["width"] <= 768 else ".workspace-nav"
        self.page.locator(f'{navigation} [data-destination="{destination}"]').click()
        expected_view = "#dashboard" if destination == "today" else "#destinationView"
        expect(self.page.locator(expected_view)).to_have_class(re.compile(r"\bactive\b"))
        expect(self.page.locator(f'{navigation} [data-destination="{destination}"]')).to_have_attribute("aria-current", "page")

    def screenshot(self, name):
        if self.screenshots_dir:
            self.page.screenshot(path=str(self.screenshots_dir / f"{ROOT.name}-{name}.png"))

    def assert_no_overflow(self):
        problems = self.page.evaluate("""() => {
            const viewport = document.documentElement.clientWidth;
            const problems = [];
            for (const element of document.querySelectorAll('html, body, main, .view.active, .view.active section, .view.active article, .view.active form, .view.active fieldset, .view.active .learning-row, .module-header, .module-mode-bar, .module-navigation, .bottom-nav, .workspace-nav')) {
                const bounds = element.getBoundingClientRect();
                const style = getComputedStyle(element);
                if (!element.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) || !bounds.width || bounds.right <= 0) continue;
                if (element.closest('#sidebar')?.getAttribute('aria-hidden') === 'true') continue;
                if (bounds.left < -1 || bounds.right > viewport + 1 || element.scrollWidth > element.clientWidth + 1) {
                    problems.push({ element: element.id || element.className || element.tagName, left: bounds.left, right: bounds.right, width: element.clientWidth, scroll: element.scrollWidth, overflow: style.overflowX });
                }
            }
            return problems;
        }""")
        self.assertEqual(problems, [], f"Overflow at {self.page.viewport_size}")

    def assert_drawer_closed(self):
        if self.page.viewport_size["width"] > 768:
            return
        expect(self.page.locator("#mobileNavToggle")).to_have_attribute("aria-expanded", "false")
        expect(self.page.locator("#sidebar")).to_have_attribute("aria-hidden", "true")
        expect(self.page.locator("#sidebar")).not_to_be_in_viewport()
        self.assertLessEqual(self.page.locator("#sidebar").evaluate("sidebar => sidebar.getBoundingClientRect().right"), 1)
        self.assertTrue(self.page.locator("#sidebar").evaluate("sidebar => sidebar.inert"))

    def check_viewport(self, width, height):
        self.page.set_viewport_size({"width": width, "height": height})
        self.open_page()
        expect(self.page.locator(".today-primary .btn-primary")).to_be_visible()
        expect(self.page.locator(".today-primary .btn-primary")).to_be_in_viewport(ratio=1)
        with self.subTest(surface="Today"):
            self.assert_no_overflow()
        self.assert_drawer_closed()
        self.screenshot(f"today-{width}")
        if width <= 768:
            toggle = self.page.locator("#mobileNavToggle")
            toggle.focus()
            toggle.press("Enter")
            expect(toggle).to_have_attribute("aria-expanded", "true")
            self.assertTrue(self.page.evaluate("document.getElementById('sidebar').contains(document.activeElement)"))
            controls = self.page.locator('#sidebar button:visible:not([disabled]), #sidebar a[href]:visible, #sidebar input:visible:not([disabled])')
            controls.first.focus()
            self.page.keyboard.press("Shift+Tab")
            expect(controls.last).to_be_focused()
            self.page.keyboard.press("Tab")
            expect(controls.first).to_be_focused()
            self.page.keyboard.press("Escape")
            expect(toggle).to_be_focused()
            self.assert_drawer_closed()
            toggle.press("Space")
            self.page.locator("#mobileNavClose").press("Enter")
            expect(toggle).to_be_focused()
            self.assert_drawer_closed()
        titles = []
        for destination in ("learn", "practice", "build", "more"):
            self.navigate(destination)
            expect(self.page.locator("#destinationTitle")).to_have_text(destination.title())
            expect(self.page.locator("#destinationTitle")).to_be_focused()
            titles.append(self.page.locator("main .view.active h1").inner_text())
            self.assert_drawer_closed()
            with self.subTest(surface=destination):
                self.assert_no_overflow()
        self.assertEqual(len(set(titles)), 4)
        self.navigate("today")
        expect(self.page.locator(".today-primary .btn-primary")).to_be_in_viewport(ratio=1)
        first = self.modules()[0]
        self.load_module(first["id"])
        expect(self.page.locator("#moduleModeBar")).to_be_visible()
        with self.subTest(surface="Guided module"):
            self.assert_no_overflow()
        self.page.locator('.guided-stepper [data-tab="lab"]').click()
        expect(self.page.locator("#localPractice")).to_be_visible()
        with self.subTest(surface="Local practice"):
            self.assert_no_overflow()

    def test_catalog_filters(self):
        self.open_page()
        modules = self.modules()
        selected = modules[0]
        self.navigate("learn")
        self.page.locator("#catalogQuery").fill(selected["id"])
        self.page.locator("#catalogLevel").select_option(str(selected["level"]))
        self.page.locator("#catalogState").select_option("not_started")
        self.page.locator('#catalogFilters button[type="submit"]').click()
        rows = self.page.locator("#destinationView .learning-group").first.locator(".learning-row")
        expect(rows).to_have_count(1)
        expect(rows.locator("h3")).to_have_text(selected["title"])
        self.assertIn("query=", self.page.url)
        self.page.reload(wait_until="domcontentloaded")
        expect(self.page.locator("#catalogQuery")).to_have_value(selected["id"])
        expect(self.page.locator("#catalogLevel")).to_have_value(str(selected["level"]))
        expect(rows).to_have_count(1)
        self.page.locator("#catalogQuery").fill("synthetic-no-matching-module")
        self.page.locator("#catalogQuery").press("Enter")
        expect(rows).to_have_count(0)
        expect(self.page.get_by_text("No modules match these filters.", exact=True)).to_be_visible()
        self.page.locator('[data-learning-action="clear-filters"]').click()
        expect(self.page.locator("#catalogQuery")).to_be_focused()
        expect(rows).to_have_count(len(modules))
        path_ids = self.page.evaluate("""() => {
            const preferences = UIStateManager.get(MODULES.map(module => module.id));
            return (LEARNING_CONTENT.paths.find(path => path.id === preferences.activePath) || LEARNING_CONTENT.paths[0]).moduleIds;
        }""")
        self.page.locator("#catalogPathOnly").check()
        self.page.locator('#catalogFilters button[type="submit"]').click()
        expect(rows.locator("h3")).to_have_text([module["title"] for module in modules if module["id"] in path_ids])
        self.assertIn("path=selected", self.page.url)

    def test_coaching_labels_and_activity_transitions(self):
        self.open_page()
        first = self.modules()[0]
        self.load_module(first['id'])
        broken = self.page.evaluate("""() => Array.from(document.querySelectorAll('#moduleView [aria-labelledby], #moduleView [aria-describedby]')).flatMap(element => ['aria-labelledby', 'aria-describedby'].flatMap(attribute => (element.getAttribute(attribute) || '').split(' ').filter(Boolean).filter(id => !document.getElementById(id))))""")
        self.assertEqual(broken, [])
        self.assertEqual(self.page.locator('#learningWorkedTitle').count(), 1)
        result = self.page.evaluate("""() => {
            const withoutDiagram = MODULES.find(module => !module.diagrams?.length && LEARNING_CONTENT.modules[module.id]);
            const activity = MODULES.find(module => MasteryEngine.isActivity(module.id));
            if (!withoutDiagram || !activity) return true;
            app.loadModule(withoutDiagram.id);
            app.loadModule(activity.id);
            return !document.querySelector('.module-tabs [data-tab="diagrams"]').hidden;
        }""")
        self.assertTrue(result)

    def test_every_real_module_has_guided_coaching(self):
        self.open_page()
        inventory = self.page.evaluate("""() => {
            const modules = MasteryEngine.getRealModules(MODULES, ACADEMY_MASTERY);
            return { contentIds: Object.keys(LEARNING_CONTENT.modules), modules: modules.map(module => {
                app.loadModule(module.id, { mode: 'guided' });
                return {
                    id: module.id, title: module.title, renderedTitle: document.getElementById('moduleTitle').textContent,
                    coachingId: document.getElementById('moduleCoaching')?.dataset.moduleId,
                    localPracticeId: document.getElementById('localPractice')?.dataset.moduleId,
                    predictionCount: document.querySelectorAll('#predictionOptions input').length,
                    guided: app.currentMode === 'guided' && !document.getElementById('moduleModeBar').hidden,
                    disabledSteps: document.querySelectorAll('.guided-stepper button:not([hidden]):disabled').length,
                    diagramCount: module.diagrams?.length || 0,
                    svgCount: document.querySelectorAll('#inlineCoreVisual svg').length,
                    quizCount: QuizEngine.questions?.length || 0
                };
            }) };
        }""")
        self.assertGreater(len(inventory["modules"]), 0)
        self.assertEqual(sorted(inventory["contentIds"]), sorted(module["id"] for module in inventory["modules"]))
        for module in inventory["modules"]:
            with self.subTest(module=module["id"]):
                self.assertEqual(module["renderedTitle"], module["title"])
                self.assertEqual(module["coachingId"], module["id"])
                self.assertEqual(module["localPracticeId"], module["id"])
                self.assertGreaterEqual(module["predictionCount"], 2)
                self.assertTrue(module["guided"])
                self.assertEqual(module["disabledSteps"], 0)
                self.assertGreater(module["quizCount"], 0)
                if module["diagramCount"]:
                    self.assertGreater(module["svgCount"], 0)
        print(f"\nInventory: {len(inventory['modules'])} real modules; {sum(module['svgCount'] for module in inventory['modules'])} inline SVGs", flush=True)

    def test_first_module_and_local_only_case(self):
        self.open_page()
        modules = self.modules()
        first = modules[0]
        self.navigate("learn")
        self.page.get_by_role("link", name=f"Learn: {first['title']}", exact=True).click()
        expect(self.page.locator("#moduleTitle")).to_have_text(first["title"])
        expect(self.page.locator('[data-module-mode="guided"]')).to_have_attribute("aria-pressed", "true")
        self.screenshot("module")
        self.page.locator('.guided-stepper [data-tab="lab"]').click()
        expect(self.page.locator("#localPractice")).to_have_attribute("data-module-id", first["id"])
        expect(self.page.locator("#artifactEvidence")).to_be_visible()
        self.screenshot("practice")
        pm_modules = [module for module in modules if module["isPM"]]
        if self.storage_snapshot()["academy"] == "ai-mastery":
            self.assertGreater(len(pm_modules), 0, "The AI gate must include the real PM track")
        if pm_modules:
            local_only = next((module for module in pm_modules if not module["hasLab"]), None)
            self.assertIsNotNone(local_only, "AI academy needs a real PM module without a legacy lab for this regression")
            self.load_module(local_only["id"], "lab")
            expect(self.page.locator("#localPractice")).to_have_attribute("data-module-id", local_only["id"])
            expect(self.page.locator("#localPractice")).to_contain_text("No external execution.")
            expect(self.page.locator("#artifactEvidence")).to_be_visible()
            if first["labTitle"]:
                self.assertNotIn(first["labTitle"], self.page.locator("#tab-lab").inner_text())


    def storage_snapshot(self):
        return self.page.evaluate("""() => {
            const key = typeof ProgressManager.storageKey === 'function' ? ProgressManager.storageKey() : ProgressManager.STORAGE_KEY;
            return { key, raw: localStorage.getItem(key), progress: ProgressManager.getProgress(), academy: ProgressManager.ACADEMY_ID, schema: ProgressManager.CURRENT_SCHEMA_VERSION };
        }""")

    def test_quiz_metadata_for_every_real_module(self):
        self.open_page()
        inventory = self.page.evaluate("""() => MasteryEngine.getRealModules(MODULES, ACADEMY_MASTERY).map(module => {
            QuizEngine.init(module.id, module.quiz);
            const questions = QuizEngine.questions;
            const originals = new Map(module.quiz.map((question, index) => [question.id || `${module.id}:q${index}`, question]));
            const mappings = questions.map(question => {
                const original = originals.get(question.id);
                const sourceCorrect = Array.isArray(original.correct) ? original.correct : [original.correct];
                const displayedCorrect = Array.isArray(question.correct) ? question.correct : [question.correct];
                return {
                    id: question.id, optionIds: question.optionIds, options: question.options,
                    correct: displayedCorrect,
                    expectedIds: sourceCorrect.map(index => original.optionIds?.[index] || `${question.id}:o${index}`).sort(),
                    actualIds: displayedCorrect.map(index => question.optionIds[index]).sort()
                };
            });
            const fixed = Array.from({ length: Math.max(...questions.map(question => question.options.length)) }, (unused, position) => {
                QuizEngine.answers = questions.map(question => Array.isArray(question.correct) ? [Math.min(position, question.options.length - 1)] : Math.min(position, question.options.length - 1));
                return QuizEngine.calculateResult().pct;
            });
            const correctAnswers = questions.map(question => Array.isArray(question.correct) ? [...question.correct] : question.correct);
            QuizEngine.answers = correctAnswers;
            const perfect = QuizEngine.calculateResult();
            const criticalResults = questions.flatMap((question, index) => {
                if (!question.critical) return [];
                QuizEngine.answers = [...correctAnswers];
                QuizEngine.answers[index] = null;
                return [QuizEngine.calculateResult()];
            });
            const nextAttempt = QuizEngine.prepareQuestions(module.id, module.quiz, 1);
            return { id: module.id, mappings, fixed, perfect, criticalResults,
                ids: questions.map(question => question.id).sort(), nextIds: nextAttempt.map(question => question.id).sort(),
                criticalIds: questions.filter(question => question.critical).map(question => question.id).sort(),
                nextCriticalIds: nextAttempt.filter(question => question.critical).map(question => question.id).sort() };
        })""")
        self.assertEqual(len(inventory), len(self.modules()))
        for module in inventory:
            with self.subTest(module=module["id"]):
                self.assertGreaterEqual(len(module["criticalResults"]), 1)
                self.assertEqual(module["ids"], module["nextIds"])
                self.assertEqual(len(set(module["ids"])), len(module["ids"]))
                self.assertEqual(module["criticalIds"], module["nextCriticalIds"])
                self.assertLess(max(module["fixed"]), 80, "A fixed answer position must not reach 80 percent")
                self.assertEqual(module["perfect"]["pct"], 100)
                self.assertTrue(module["perfect"]["passed"])
                self.assertTrue(all(not result["passed"] and result["criticalMisses"] == 1 for result in module["criticalResults"]))
                for mapping in module["mappings"]:
                    self.assertGreater(len(mapping["correct"]), 0, mapping["id"])
                    self.assertEqual(mapping["expectedIds"], mapping["actualIds"], mapping["id"])
                    self.assertEqual(mapping["correct"], sorted(mapping["correct"]), mapping["id"])
                    self.assertEqual(len(set(mapping["optionIds"])), len(mapping["options"]), mapping["id"])

    def test_quiz_keyboard_choices_and_feedback(self):
        self.open_page()
        first = self.modules()[0]
        self.load_module(first["id"], "quiz")
        single_index = self.page.evaluate("() => QuizEngine.questions.findIndex((question, index) => !Array.isArray(question.correct) && index < QuizEngine.questions.length - 1)")
        self.assertGreaterEqual(single_index, 0)
        self.page.locator(f'[data-question-index="{single_index}"]').click()
        first_radio = self.page.locator('#tab-quiz input[type="radio"]').nth(0)
        first_radio.focus()
        first_radio.press("Space")
        expect(first_radio).to_be_checked()
        expect(first_radio).to_be_focused()
        second_radio = self.page.locator('#tab-quiz input[type="radio"]').nth(1)
        second_radio.focus()
        second_radio.press("Enter")
        expect(second_radio).to_be_checked()
        expect(second_radio).to_be_focused()
        second_radio.press("ArrowLeft")
        expect(first_radio).to_be_checked()
        expect(first_radio).to_be_focused()
        expect(self.page.locator('#tab-quiz input[type="radio"]:checked')).to_have_count(1)
        self.page.locator("#submitBtn").focus()
        self.page.locator("#submitBtn").press("Enter")
        expect(self.page.locator("#quizExplanation")).to_be_focused()
        expect(self.page.locator("#quizExplanation")).to_be_visible()
        self.page.locator('[data-quiz-action="next-question"]').focus()
        self.page.locator('[data-quiz-action="next-question"]').press("Space")
        expect(self.page.locator("#quizQuestionHeading")).to_be_focused()
        self.assertEqual(self.page.evaluate("() => QuizEngine.currentQuestion"), single_index + 1)
        expect(self.page.locator("#submitBtn")).to_be_disabled()
        multi_module = self.page.evaluate("() => MasteryEngine.getRealModules(MODULES, ACADEMY_MASTERY).find(module => module.quiz.some(question => Array.isArray(question.correct)))?.id || null")
        if self.storage_snapshot()["academy"] == "azure-networking":
            self.assertIsNotNone(multi_module, "Networking must exercise a real multi-select question")
        if multi_module:
            self.load_module(multi_module, "quiz")
            multi = self.page.evaluate("""() => {
                const index = QuizEngine.questions.findIndex(question => Array.isArray(question.correct));
                return { index, correct: QuizEngine.questions[index].correct };
            }""")
            self.page.locator(f'[data-question-index="{multi["index"]}"]').click()
            self.assertGreater(len(multi["correct"]), 0)
            for option_index in reversed(multi["correct"]):
                checkbox = self.page.locator(f'#tab-quiz input[data-option-index="{option_index}"]')
                checkbox.focus()
                checkbox.press("Space")
                expect(checkbox).to_be_checked()
                expect(checkbox).to_be_focused()
            checkbox.press("Enter")
            expect(checkbox).not_to_be_checked()
            expect(checkbox).to_be_focused()
            checkbox.press("Enter")
            expect(checkbox).to_be_checked()
            self.assertEqual(self.page.evaluate("() => QuizEngine.answers[QuizEngine.currentQuestion]"), sorted(multi["correct"]))
            self.page.locator("#submitBtn").focus()
            self.page.locator("#submitBtn").press("Enter")
            expect(self.page.locator("#quizExplanation")).to_be_focused()
            expect(self.page.locator("#quizExplanation")).to_contain_text("Correct!")

    def test_quiz_due_failure_is_recorded_only_once(self):
        self.open_page()
        module = self.modules()[0]
        seeded = self.page.evaluate("""input => {
            const progress = ProgressManager.getProgress();
            const entry = ProgressManager.ensureMasteryEntry(progress, input.moduleId);
            const completedAt = new Date(Date.now() - 172800000).toISOString();
            const dueAt = new Date(Date.now() - 3600000).toISOString();
            entry.transfer = { score: 4, max: 4, scores: [4, 4, 4, 4], reflection: input.reflection, provenance: 'self-assessed', completedAt };
            entry.review = { successfulReviews: 0, intervalIndex: 0, nextDue: dueAt, attempts: [] };
            return { saved: ProgressManager.saveProgress(progress), dueAt, due: ProgressManager.isReviewDue(input.moduleId) };
        }""", {"moduleId": module["id"], "reflection": SYNTHETIC_EVIDENCE})
        self.assertTrue(seeded["saved"])
        self.assertTrue(seeded["due"])
        self.navigate("practice")
        self.page.get_by_role("link", name=f"Review now: {module['title']}", exact=True).click()
        self.assertTrue(self.page.evaluate("() => QuizEngine.isReviewAttempt"))
        self.page.locator(".quiz-question-jump").last.click()
        self.page.locator('[data-quiz-action="show-results"]').click()
        expect(self.page.locator("#quizResultsHeading")).to_be_focused()
        expect(self.page.locator("#quizSaveStatus")).to_contain_text("Review attempt recorded")
        guarded = self.page.evaluate("""() => {
            const key = typeof ProgressManager.storageKey === 'function' ? ProgressManager.storageKey() : ProgressManager.STORAGE_KEY;
            const before = localStorage.getItem(key);
            QuizEngine.showResults();
            QuizEngine.showResults();
            return { before, after: localStorage.getItem(key), submitted: QuizEngine.resultSubmitted, saved: QuizEngine.resultSaved,
                review: ProgressManager.getProgress().moduleMastery[QuizEngine.currentQuiz].review,
                due: ProgressManager.isReviewDue(QuizEngine.currentQuiz) };
        }""")
        self.assertTrue(guarded["submitted"])
        self.assertTrue(guarded["saved"])
        self.assertEqual(guarded["before"], guarded["after"])
        self.assertEqual(len(guarded["review"]["attempts"]), 1)
        self.assertFalse(guarded["review"]["attempts"][0]["passed"])
        self.assertEqual(guarded["review"]["attempts"][0]["dueAt"], seeded["dueAt"])
        self.assertEqual(guarded["review"]["successfulReviews"], 0)
        self.assertEqual(guarded["review"]["intervalIndex"], 0)
        self.assertFalse(guarded["due"])

    def test_transfer_blank_score_and_honest_provenance(self):
        self.open_page()
        module = self.modules()[0]
        self.load_module(module["id"])
        self.page.locator('.guided-stepper [data-evidence-target="transfer"]').click()
        for criterion in range(1, 4):
            self.page.locator(f"#transfer-score-{criterion}").select_option("4")
        reflection = "Synthetic proof 1234"
        self.assertEqual(len(reflection), 20)
        self.page.locator("#transfer-reflection").fill(reflection)
        self.page.locator("#transfer-submit").click()
        expect(self.page.locator("#transfer-score-0")).to_be_focused()
        expect(self.page.locator("#transfer-score-0")).to_have_attribute("aria-invalid", "true")
        expect(self.page.locator("#transfer-feedback")).to_contain_text("Blank scores are not zero")
        self.assertIsNone(self.storage_snapshot()["progress"]["moduleMastery"].get(module["id"], {}).get("transfer"))
        self.page.locator("#transfer-score-0").select_option("0")
        self.page.locator("#transfer-submit").click()
        expect(self.page.locator("#transfer-feedback")).to_contain_text("Self-assessment saved")
        expect(self.page.locator("#transfer-feedback")).to_be_focused()
        transfer = self.storage_snapshot()["progress"]["moduleMastery"][module["id"]]["transfer"]
        self.assertEqual(transfer["scores"], [0, 4, 4, 4])
        self.assertEqual(transfer["score"], 3)
        self.assertEqual(transfer["reflection"], reflection)
        self.assertEqual(transfer["provenance"], "self-assessed")
        self.assertNotIn(self.page.evaluate("() => MasteryEngine.getStatus(app.currentModule).state"), ["demonstrated", "durable"])
        self.page.locator("#transfer-provenance").select_option("reviewer-assessed")
        self.page.locator("#transfer-submit").click()
        expect(self.page.locator("#transfer-reviewer")).to_be_focused()
        self.assertEqual(self.storage_snapshot()["progress"]["moduleMastery"][module["id"]]["transfer"], transfer)
        self.page.locator("#transfer-reviewer").fill("Synthetic browser reviewer")
        self.page.locator("#transfer-submit").click()
        expect(self.page.locator("#transfer-feedback")).to_contain_text("Reviewer assessment saved")
        expect(self.page.locator("#masteryPanel")).to_contain_text("identity is self-reported")
        self.assertNotIn(self.page.evaluate("() => MasteryEngine.getStatus(app.currentModule).state"), ["demonstrated", "durable"])

    def test_storage_quota_rejection_and_retry(self):
        self.open_page()
        module = self.modules()[0]
        self.load_module(module["id"], "lab")
        self.page.locator("#artifactEvidence").fill(SYNTHETIC_EVIDENCE)
        self.allowed_storage_errors = True
        rejected = self.page.evaluate("""message => {
            const key = typeof ProgressManager.storageKey === 'function' ? ProgressManager.storageKey() : ProgressManager.STORAGE_KEY;
            const before = localStorage.getItem(key);
            const originalSetItem = Storage.prototype.setItem;
            let rejections = 0;
            try {
                Storage.prototype.setItem = function(storageKey, value) {
                    if (this === localStorage && storageKey === key) {
                        rejections += 1;
                        console.error(message);
                        throw new DOMException('Controlled quota rejection', 'QuotaExceededError');
                    }
                    return originalSetItem.call(this, storageKey, value);
                };
                document.querySelector('[data-learning-action="save-artifact-practice"]').click();
            } finally {
                Storage.prototype.setItem = originalSetItem;
            }
            return { key, before, after: localStorage.getItem(key), rejections, restored: Storage.prototype.setItem === originalSetItem, status: ProgressManager.getStorageStatus() };
        }""", STORAGE_ERROR)
        expect(self.page.locator("#storageNotice")).to_be_visible()
        self.allowed_storage_errors = False
        self.assertGreater(rejected["rejections"], 0, f"The actual key {rejected['key']} must hit the injected rejection")
        self.assertEqual(self.expected_storage_errors, rejected["rejections"])
        self.assertTrue(rejected["restored"])
        self.assertIsNotNone(rejected["before"])
        self.assertEqual(rejected["before"], rejected["after"])
        self.assertFalse(rejected["status"]["saved"])
        expect(self.page.locator("#artifactFeedback")).to_contain_text("not saved")
        self.navigate("more")
        expect(self.page.locator("#storageNotice")).to_be_visible()
        self.page.locator('#storageNotice [data-learning-action="retry-save"]').click()
        expect(self.page.locator("#storageNotice")).to_be_hidden()
        saved = self.storage_snapshot()
        self.assertEqual(saved["key"], rejected["key"])
        self.assertEqual(json.loads(saved["raw"])["artifactPractice"][module["id"]]["evidence"], SYNTHETIC_EVIDENCE)
        self.assertTrue(self.page.evaluate("() => ProgressManager.getStorageStatus().saved"))

    def import_backup(self, backup, name):
        prompts = []
        expected_message = "Replace progress with this backup? Export your current progress first if you need to keep it."

        def confirm(dialog):
            prompts.append((dialog.type, dialog.message))
            if dialog.type == "confirm" and dialog.message == expected_message:
                dialog.accept()
            else:
                dialog.dismiss()

        self.page.once("dialog", confirm)
        self.page.locator("#importFile").set_input_files({"name": name, "mimeType": "application/json", "buffer": json.dumps(backup).encode()})
        self.assertEqual(prompts, [("confirm", expected_message)])

    def test_backup_rejections_and_current_schema_roundtrip(self):
        self.open_page()
        module = self.modules()[0]
        self.assertTrue(self.page.evaluate("input => ProgressManager.saveArtifactPractice(input.moduleId, input.evidence)", {"moduleId": module["id"], "evidence": SYNTHETIC_EVIDENCE}))
        self.navigate("more")
        with self.page.expect_download() as download_event:
            self.page.locator('[data-learning-action="export-progress"]').click()
        download = download_event.value
        self.assertIsNone(download.failure())
        backup = json.loads(Path(download.path()).read_text(encoding="utf-8"))
        snapshot = self.storage_snapshot()
        self.assertEqual(backup["schemaVersion"], snapshot["schema"])
        self.assertEqual(backup["academyId"], snapshot["academy"])
        for field, value, error in (
            ("academyId", "azure-networking" if snapshot["academy"] == "ai-mastery" else "ai-mastery", "different academy"),
            ("schemaVersion", snapshot["schema"] + 1, "Unsupported progress schema version"),
        ):
            with self.subTest(rejection=field):
                invalid = {**backup, field: value}
                before = self.storage_snapshot()["raw"]
                self.import_backup(invalid, f"synthetic-invalid-{field}.json")
                expect(self.page.locator("#toast")).to_contain_text(error)
                self.assertEqual(self.storage_snapshot()["raw"], before)
        self.assertTrue(self.page.evaluate("moduleId => ProgressManager.savePracticeResult(moduleId, false)", module["id"]))
        self.import_backup(backup, "synthetic-roundtrip.json")
        expect(self.page.locator("#toast")).to_have_text("Progress imported!")
        expected = {key: value for key, value in backup.items() if key not in {"academyId", "exportVersion", "exportedAt"}}
        self.assertEqual(self.storage_snapshot()["progress"], expected)

    def test_drafts_survive_blur_navigation_and_reload(self):
        self.open_page()
        module = self.modules()[0]
        self.load_module(module["id"], "lab")
        first_draft = SYNTHETIC_EVIDENCE + " First draft."
        revised_draft = SYNTHETIC_EVIDENCE + " Revised observation."
        self.page.locator("#artifactEvidence").fill(first_draft)
        self.page.locator("#artifactEvidence").press("Tab")
        self.navigate("learn")
        self.load_module(module["id"], "lab")
        expect(self.page.locator("#artifactEvidence")).to_have_value(first_draft)
        self.page.locator("#artifactEvidence").fill(revised_draft)
        self.navigate("practice")
        self.load_module(module["id"], "lab")
        expect(self.page.locator("#artifactEvidence")).to_have_value(revised_draft)
        self.page.reload(wait_until="domcontentloaded")
        expect(self.page.locator("#artifactEvidence")).to_have_value(revised_draft)
        self.page.locator('.guided-stepper [data-evidence-target="transfer"]').click()
        self.page.locator("#transfer-reflection").fill(first_draft)
        self.page.locator("#transfer-reflection").press("Tab")
        self.navigate("more")
        self.load_module(module["id"])
        self.page.locator('.guided-stepper [data-evidence-target="transfer"]').click()
        expect(self.page.locator("#transfer-reflection")).to_have_value(first_draft)
        self.page.locator("#transfer-reflection").fill(revised_draft)
        self.navigate("learn")
        self.load_module(module["id"])
        self.page.locator('.guided-stepper [data-evidence-target="transfer"]').click()
        expect(self.page.locator("#transfer-reflection")).to_have_value(revised_draft)
        self.page.reload(wait_until="domcontentloaded")
        expect(self.page.locator("#transfer-reflection")).to_have_value(revised_draft)
        progress = self.storage_snapshot()["progress"]
        self.assertNotIn(module["id"], progress["artifactPractice"])
        self.assertIsNone(progress["moduleMastery"].get(module["id"], {}).get("transfer"))

    def test_shared_route_tab_mode_section_and_history(self):
        self.open_page()
        module = self.modules()[0]
        self.page.goto("about:blank")
        self.open_page(f"#{module['id']}?tab=quiz&mode=browse")
        expect(self.page.locator("#tab-quiz")).to_be_visible()
        expect(self.page.locator('[data-module-mode="browse"]')).to_have_attribute("aria-pressed", "true")
        self.page.reload(wait_until="domcontentloaded")
        expect(self.page.locator("#tab-quiz")).to_be_visible()
        expect(self.page.locator('[data-module-mode="browse"]')).to_have_attribute("aria-pressed", "true")
        self.page.locator('.module-tabs [data-tab="lab"]').click()
        expect(self.page.locator("#tab-lab")).to_be_visible()
        self.page.go_back()
        expect(self.page.locator("#tab-quiz")).to_be_visible()
        self.page.go_forward()
        expect(self.page.locator("#tab-lab")).to_be_visible()
        self.page.locator('.module-tabs [data-tab="learn"]').click()
        section = self.page.locator("#sectionOutlineList [data-section-id]").nth(1).get_attribute("data-section-id")
        self.page.goto("about:blank")
        self.open_page(f"#{module['id']}?mode=browse&section={section}")
        heading = self.page.locator(f"#section-{section}")
        expect(heading).to_be_in_viewport()
        self.page.reload(wait_until="domcontentloaded")
        expect(heading).to_be_in_viewport()
        self.assertEqual(self.page.evaluate("() => app.currentSection"), section)
        self.assertEqual(self.page.evaluate("() => app.currentMode"), "browse")
        self.navigate("learn")
        self.page.go_back()
        expect(heading).to_be_in_viewport()
        self.page.go_forward()
        expect(self.page.locator("#destinationTitle")).to_have_text("Learn")


    def ready_worker(self, page=None):
        page = page or self.page
        page.evaluate("""() => {
            document.documentElement.dataset.smokeWorker = 'pending';
            let ready = false;
            const controlled = () => {
                if (ready && navigator.serviceWorker.controller) document.documentElement.dataset.smokeWorker = 'controlled';
            };
            navigator.serviceWorker.addEventListener('controllerchange', controlled);
            navigator.serviceWorker.ready.then(() => { ready = true; controlled(); });
        }""")
        expect(page.locator("html")).to_have_attribute("data-smoke-worker", "controlled", timeout=20000)
        return page.evaluate("""async () => ({
            scope: (await navigator.serviceWorker.getRegistration()).scope,
            controller: navigator.serviceWorker.controller.scriptURL,
            state: navigator.serviceWorker.controller.state
        })""")

    def cache_snapshot(self, cache_name):
        return self.page.evaluate("""async name => {
            const names = await caches.keys();
            if (!names.includes(name)) return { names, urls: [], index: null };
            const cache = await caches.open(name);
            const registration = await navigator.serviceWorker.getRegistration();
            const index = await cache.match(new URL('index.html', registration.scope).href);
            return { names, urls: (await cache.keys()).map(request => request.url), index: index ? await index.text() : null };
        }""", cache_name)

    def assert_complete_cache(self, cache_name, release):
        snapshot = self.cache_snapshot(cache_name)
        self.assertIn(cache_name, snapshot["names"])
        self.assertIsNotNone(snapshot["index"])
        expected = self.page.evaluate("""release => [...document.querySelectorAll('script[src], link[rel="stylesheet"]')].map(element => {
            const url = new URL(element.src || element.href);
            url.searchParams.set('v', release);
            return url.href;
        })""", release)
        self.assertTrue(set(expected).issubset(snapshot["urls"]), sorted(set(expected) - set(snapshot["urls"])))
        self.assertTrue(all(url.startswith(self.server.base_url) for url in snapshot["urls"]), snapshot["urls"])
        asset_versions = re.findall(r'(?:css|js)/[^"?]+\?v=([^"\s]+)', snapshot["index"])
        self.assertTrue(asset_versions)
        self.assertEqual(set(asset_versions), {release})
        return snapshot

    def update_worker(self, state):
        self.page.evaluate("""() => {
            document.documentElement.dataset.smokeUpdate = 'pending';
            navigator.serviceWorker.getRegistration().then(registration => {
                registration.addEventListener('updatefound', () => {
                    const worker = registration.installing;
                    const changed = () => { document.documentElement.dataset.smokeUpdate = worker.state; };
                    worker.addEventListener('statechange', changed);
                    changed();
                }, { once: true });
                registration.update().catch(error => { document.documentElement.dataset.smokeUpdate = `error: ${error.message}`; });
            });
        }""")
        expect(self.page.locator("html")).to_have_attribute("data-smoke-update", state, timeout=20000)

    def test_offline_reload_keeps_coaching_and_local_lab(self):
        self.open_page(base_url=self.server.base_url)
        worker = self.ready_worker()
        self.assertEqual(worker["scope"], self.server.base_url)
        self.assertEqual(worker["state"], "activated")
        prefix = CACHE_PREFIXES[self.storage_snapshot()["academy"]]
        self.assert_complete_cache(prefix + RELEASE, RELEASE)
        module = self.modules()[0]
        self.context.set_offline(True)
        try:
            response = self.page.reload(wait_until="domcontentloaded")
            self.assertTrue(response and response.ok and response.from_service_worker)
            self.ready_worker()
            expect(self.page.locator(".today-primary .btn-primary")).to_be_visible()
            self.load_module(module["id"])
            expect(self.page.locator("#moduleCoaching")).to_have_attribute("data-module-id", module["id"])
            expect(self.page.locator("#predictionOptions")).to_be_visible()
            self.page.locator('.guided-stepper [data-tab="lab"]').click()
            expect(self.page.locator("#localPractice")).to_be_visible()
            self.page.locator("#artifactEvidence").fill(SYNTHETIC_EVIDENCE)
            self.page.locator('[data-learning-action="save-artifact-practice"]').click()
            expect(self.page.locator("#artifactFeedback")).to_contain_text("Self-attested case practice saved")
        finally:
            self.context.set_offline(False)

    def test_worker_cache_isolation_and_path_boundary(self):
        self.open_page(base_url=self.server.base_url)
        self.ready_worker()
        academy = self.storage_snapshot()["academy"]
        prefix = CACHE_PREFIXES[academy]
        peer_prefix = next(value for key, value in CACHE_PREFIXES.items() if key != academy)
        peer_cache = peer_prefix + "smoke-sentinel"
        probe_url = self.server.base_url + "cache-probe.txt"
        outside_url = f"http://127.0.0.1:{self.server.server_port}/peer-academy/probe.txt"
        self.page.evaluate("""async input => {
            const peer = await caches.open(input.name);
            await peer.put(input.probe, new Response('foreign academy poison'));
            await peer.put(input.outside, new Response('peer cached response'));
        }""", {"name": peer_cache, "probe": probe_url, "outside": outside_url})
        with self.page.expect_response(lambda response: response.url == probe_url) as own_response:
            own_body = self.page.evaluate("url => fetch(url).then(response => response.text())", probe_url)
        self.assertEqual(own_body, "academy network response")
        self.assertTrue(own_response.value.from_service_worker)
        with self.page.expect_response(lambda response: response.url == outside_url) as outside_response:
            outside_body = self.page.evaluate("url => fetch(url).then(response => response.text())", outside_url)
        self.assertEqual(outside_body, "peer network response")
        self.assertFalse(outside_response.value.from_service_worker, "Out-of-scope same-origin requests must bypass this worker")
        snapshot = self.cache_snapshot(prefix + RELEASE)
        self.assertIn(peer_cache, snapshot["names"])
        self.assertNotIn(outside_url, snapshot["urls"])
        self.assertTrue(all(url.startswith(self.server.base_url) for url in snapshot["urls"]))
        peer_body = self.page.evaluate("async input => (await (await caches.open(input.name)).match(input.url)).text()", {"name": peer_cache, "url": outside_url})
        self.assertEqual(peer_body, "peer cached response")

    def test_worker_upgrade_is_atomic_and_preserves_open_draft(self):
        self.open_page(base_url=self.server.base_url)
        self.ready_worker()
        academy = self.storage_snapshot()["academy"]
        prefix = CACHE_PREFIXES[academy]
        peer_prefix = next(value for key, value in CACHE_PREFIXES.items() if key != academy)
        peer_cache = peer_prefix + "smoke-sentinel"
        obsolete_cache = prefix + "smoke-obsolete"
        self.page.evaluate("""async input => {
            const peer = await caches.open(input.peer);
            await peer.put(new URL('/peer-academy/probe.txt', location.href), new Response('preserved peer cache'));
            const obsolete = await caches.open(input.obsolete);
            await obsolete.put(new URL('index.html', location.href), new Response('obsolete shell'));
        }""", {"peer": peer_cache, "obsolete": obsolete_cache})
        broken_release = RELEASE + "-smoke-broken"
        next_release = RELEASE + "-smoke-next"
        self.server.release = broken_release
        network_index = self.context.request.get(self.server.base_url, timeout=TIMEOUT)
        self.assertTrue(network_index.ok)
        self.assertIn(f"?v={broken_release}", network_index.text())
        response = self.page.reload(wait_until="domcontentloaded")
        self.assertTrue(response and response.from_service_worker)
        self.ready_worker()
        self.assertEqual(self.page.evaluate("() => globalThis.__smokeAssetRelease"), RELEASE)
        self.assert_complete_cache(prefix + RELEASE, RELEASE)
        module = self.modules()[0]
        self.load_module(module["id"], "lab")
        draft = SYNTHETIC_EVIDENCE + " Unsaved during worker update."
        self.page.locator("#artifactEvidence").fill(draft)
        document_id = self.page.evaluate("""() => {
            globalThis.__smokeDocument = crypto.randomUUID();
            globalThis.__smokeUnloadAttempts = 0;
            addEventListener('beforeunload', () => { globalThis.__smokeUnloadAttempts += 1; });
            return globalThis.__smokeDocument;
        }""")
        self.server.failed_asset = "js/learning-engine.js"
        self.server.worker_release = broken_release
        self.update_worker("redundant")
        self.assertTrue(any("js/learning-engine.js" in request for request in self.server.failed_requests), "The controlled installation failure must actually occur")
        failed = self.cache_snapshot(prefix + RELEASE)
        self.assertIn(prefix + RELEASE, failed["names"])
        self.assertIn(peer_cache, failed["names"])
        self.assertIn(obsolete_cache, failed["names"])
        self.assertEqual(self.page.evaluate("() => navigator.serviceWorker.controller.state"), "activated")
        self.server.failed_asset = None
        self.server.release = next_release
        self.server.worker_release = next_release
        self.update_worker("activated")
        installed = self.assert_complete_cache(prefix + next_release, next_release)
        self.assertNotIn(prefix + RELEASE, installed["names"])
        self.assertNotIn(obsolete_cache, installed["names"])
        self.assertNotIn(prefix + broken_release, installed["names"])
        self.assertIn(peer_cache, installed["names"])
        self.assertEqual(self.page.evaluate("() => globalThis.__smokeDocument"), document_id, "A worker update must not reload an open document")
        self.assertEqual(self.page.evaluate("() => globalThis.__smokeUnloadAttempts"), 0)
        self.assertEqual(self.page.evaluate("() => globalThis.__smokeAssetRelease"), RELEASE)
        expect(self.page.locator("#artifactEvidence")).to_have_value(draft)
        self.page.locator("#artifactEvidence").press("Tab")
        self.context.set_offline(True)
        try:
            response = self.page.reload(wait_until="domcontentloaded")
            self.assertTrue(response and response.ok and response.from_service_worker)
            self.ready_worker()
            self.assertEqual(self.page.evaluate("() => globalThis.__smokeAssetRelease"), next_release)
            expect(self.page.locator("#localPractice")).to_be_visible()
            expect(self.page.locator("#artifactEvidence")).to_have_value(draft)
            expect(self.page.locator("#moduleCoaching")).to_have_attribute("data-module-id", module["id"])
            peer_body = self.page.evaluate("async name => (await (await caches.open(name)).match(new URL('/peer-academy/probe.txt', location.href))).text()", peer_cache)
            self.assertEqual(peer_body, "preserved peer cache")
        finally:
            self.context.set_offline(False)

    def check_peer_academy(self):
        self.open_page()
        own_worker = self.ready_worker()
        own = self.storage_snapshot()
        peer = self.context.new_page()
        peer.on("pageerror", lambda error: self.errors.append(str(error)))
        peer.on("console", self.track_console)
        response = peer.goto(self.peer_base_url, wait_until="domcontentloaded")
        self.assertTrue(response and response.ok)
        peer_worker = self.ready_worker(peer)
        peer_before = peer.evaluate("""() => {
            const key = typeof ProgressManager.storageKey === 'function' ? ProgressManager.storageKey() : ProgressManager.STORAGE_KEY;
            return { academy: ProgressManager.ACADEMY_ID, key, raw: localStorage.getItem(key), moduleId: MasteryEngine.getRealModules(MODULES, ACADEMY_MASTERY)[0].id };
        }""")
        self.assertNotEqual(own["academy"], peer_before["academy"])
        self.assertNotEqual(own["key"], peer_before["key"])
        self.assertEqual(own_worker["scope"], self.base_url)
        self.assertEqual(peer_worker["scope"], self.peer_base_url)
        module = self.modules()[0]
        self.assertTrue(self.page.evaluate("input => ProgressManager.saveArtifactPractice(input.moduleId, input.evidence)", {"moduleId": module["id"], "evidence": SYNTHETIC_EVIDENCE}))
        self.assertEqual(peer.evaluate("key => localStorage.getItem(key)", peer_before["key"]), peer_before["raw"])
        self.context.set_offline(True)
        try:
            for page, module_id in ((self.page, module["id"]), (peer, peer_before["moduleId"])):
                response = page.reload(wait_until="domcontentloaded")
                self.assertTrue(response and response.ok and response.from_service_worker)
                page.evaluate("moduleId => app.loadModule(moduleId, { tab: 'lab', mode: 'guided' })", module_id)
                expect(page.locator("#localPractice")).to_have_attribute("data-module-id", module_id)
                expect(page.locator("#localPractice")).to_be_visible()
        finally:
            self.context.set_offline(False)


def viewport_test(width, height):
    def run_case(self):
        self.check_viewport(width, height)
    return run_case


for viewport_width, viewport_height in VIEWPORTS:
    setattr(AcademyBrowserTests, f"test_viewport_{viewport_width:04d}", viewport_test(viewport_width, viewport_height))


def localhost_url(value):
    parsed = urlsplit(value)
    if parsed.scheme != "http" or parsed.hostname not in {"127.0.0.1", "localhost", "::1"} or parsed.query or parsed.fragment or parsed.username or parsed.password:
        raise argparse.ArgumentTypeError("Use an HTTP localhost base URL without credentials, query, or fragment")
    return value.rstrip("/") + "/"


def main():
    parser = argparse.ArgumentParser(description="Standalone local-only Chromium release gate")
    parser.add_argument("--base-url", type=localhost_url, help="Use an existing localhost preview for application checks")
    parser.add_argument("--peer-base-url", type=localhost_url, help="Also check a sibling academy on the preview's origin")
    parser.add_argument("--screenshots-dir", type=Path, help="Optional screenshot output under the system temp directory or a git-ignored path")
    options, test_arguments = parser.parse_known_args()
    if options.peer_base_url and (not options.base_url or urlsplit(options.peer_base_url).netloc != urlsplit(options.base_url).netloc):
        parser.error("--peer-base-url requires --base-url on the same origin")
    if options.screenshots_dir:
        options.screenshots_dir = options.screenshots_dir.resolve()
        temporary = options.screenshots_dir.is_relative_to(Path(tempfile.gettempdir()).resolve())
        ignored = False
        if not temporary and options.screenshots_dir.is_relative_to(ROOT):
            ignored = subprocess.run(["git", "-C", str(ROOT), "check-ignore", "--quiet", "--", str(options.screenshots_dir)], check=False).returncode == 0
        if not temporary and not ignored:
            parser.error("Screenshots must be outside tracked source: use the system temp directory or a git-ignored path")
        options.screenshots_dir.mkdir(parents=True, exist_ok=True)
    expect.set_options(timeout=TIMEOUT)
    with local_server() as server, sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, args=["--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1, EXCLUDE localhost"])
        try:
            AcademyBrowserTests.browser = browser
            AcademyBrowserTests.server = server
            AcademyBrowserTests.base_url = options.base_url or server.base_url
            AcademyBrowserTests.peer_base_url = options.peer_base_url
            AcademyBrowserTests.screenshots_dir = options.screenshots_dir
            if options.peer_base_url:
                setattr(AcademyBrowserTests, "test_peer_academy_same_origin", AcademyBrowserTests.check_peer_academy)
            result = unittest.main(argv=[sys.argv[0], *test_arguments], verbosity=2, exit=False).result
            return 0 if result.wasSuccessful() else 1
        finally:
            browser.close()


if __name__ == "__main__":
    sys.exit(main())