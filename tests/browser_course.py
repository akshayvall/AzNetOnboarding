from playwright.sync_api import expect


class GuidedCourseBrowserTests:
    def test_guided_course_sidebar_on_every_destination(self):
        for width in (900, 1440):
            self.page.set_viewport_size({"width": width, "height": 1000})
            for route in ("", "#progress", "#lesson=request", "#reference=net-fundamentals", "#sandbox"):
                self.open_course(route)
                expect(self.page.locator("#course-navigation")).to_be_visible()
                self.assertTrue(self.page.locator(".course-drawer").evaluate("(el) => el.open"))
                self.assertTrue(self.page.evaluate("""() =>
                    document.getElementById('course-navigation').getBoundingClientRect().right <=
                    document.getElementById('course').getBoundingClientRect().left
                """))

    def test_guided_course_clear_recommendation_labels(self):
        self.open_course()
        expect(self.page.locator(".syllabus")).not_to_contain_text("Upcoming")
        expect(self.page.locator(".syllabus")).not_to_contain_text("Up next")
        expect(self.page.locator(".syllabus .lesson-state")).to_have_text(["Start here"])
        self.open_course("#lesson=request")
        self.page.locator("#explanation").fill("My saved explanation")
        self.page.locator(".course-back").click()
        expect(self.page.locator(".syllabus .lesson-state")).to_have_text(["Continue here"])
        expect(self.page.locator(".course-start")).to_contain_text("Continue:")
        self.page.locator(".course-start").click()
        self.answer_course_lesson()
        self.page.locator(".course-back").click()
        expect(self.page.locator(".syllabus .lesson-complete .sr-only")).to_have_text(["Checks passed"])
        expect(self.page.locator(".syllabus .lesson-state:not(.lesson-complete)")).to_have_text(["Continue here"])
        expect(self.page.locator(".course-start")).to_contain_text("How does your browser find")

    def test_guided_course_contents_toggle_and_resize(self):
        self.page.set_viewport_size({"width": 390, "height": 900})
        self.open_course()
        drawer = self.page.locator(".course-drawer")
        control = drawer.locator(":scope > summary")
        expect(control).to_be_visible()
        expect(control).to_have_text("Contents")
        self.assertFalse(drawer.evaluate("(el) => el.open"))
        control.focus()
        self.page.keyboard.press("Enter")
        expect(drawer.locator("nav")).to_be_visible()
        drawer.get_by_role("link", name="What happens when you open a website?").click()
        self.page.wait_for_function("() => CourseApp.current?.id === 'request'")
        self.assertFalse(drawer.evaluate("(el) => el.open"))
        self.page.set_viewport_size({"width": 1000, "height": 900})
        self.page.wait_for_function("() => document.querySelector('.course-drawer').open")
        self.page.set_viewport_size({"width": 390, "height": 900})
        self.page.wait_for_function("() => !document.querySelector('.course-drawer').open")
        expect(control).to_be_visible()

    def open_course(self, suffix=""):
        response = self.page.goto(self.base_url + "index.html" + suffix)
        if response is not None:
            self.assertTrue(response.ok)
        self.assertEqual(self.page.url.split("#")[0], self.base_url + "index.html")
        expect(self.page.locator("#course")).to_be_visible()
        self.page.wait_for_function("() => typeof CourseApp !== 'undefined' && CourseApp.lessons.length > 66")
        if suffix.startswith("#lesson="):
            self.page.wait_for_function("id => CourseApp.current?.id === id", arg=suffix.removeprefix("#lesson="))

    def answer_course_lesson(self):
        answers = self.page.evaluate("() => CourseApp.current.checks.map(q => q.correct)")
        for i, answer in enumerate(answers):
            self.page.locator(f'input[name="answer-{i}"][value="{answer}"]').check()
        self.page.locator("#answer-check").click()
        expect(self.page.locator("#answer-feedback")).to_contain_text(f"{len(answers)} of {len(answers)} correct")
        expect(self.page.locator("#lesson-next")).to_be_visible()

    def test_guided_course_all_levels_finish_without_leaving_main(self):
        self.open_course()
        self.page.evaluate("""() => {
            const p = ProgressManager.getProgress();
            p.lastVisited = 'frontdoor-advanced';
            p.notes['legacy-draft'] = 'Keep my old work';
            p.completedModules = ['net-fundamentals'];
            ProgressManager.saveProgress(p);
        }""")
        self.page.locator(".course-start").click()
        lessons = self.page.evaluate("() => CourseApp.lessons.map(l => ({id:l.id,level:l.level}))")
        for lesson in lessons:
            with self.subTest(lesson=lesson["id"]):
                self.page.wait_for_function("id => CourseApp.current?.id === id", arg=lesson["id"])
                expect(self.page.locator("#lesson-title")).to_be_visible()
                self.answer_course_lesson()
                self.page.locator("#lesson-next").click()
        expect(self.page.get_by_role("heading", name="You have checked the complete course")).to_be_visible()
        self.page.reload()
        expect(self.page.get_by_role("heading", name="You have checked the complete course")).to_be_visible()
        p = self.page.evaluate("() => ProgressManager.getProgress()")
        self.assertEqual(p["notes"]["legacy-draft"], "Keep my old work")
        self.assertEqual(p["completedModules"], ["net-fundamentals"])
        self.assertEqual(p["lastVisited"], "frontdoor-advanced")
        self.assertEqual(p["quizScores"], {})
        self.assertIn("index.html", self.page.url)

    def test_guided_course_resume_preview_reference_and_draft(self):
        self.open_course("#lesson=request")
        self.answer_course_lesson()
        self.page.locator(".course-back").click()
        expect(self.page.locator(".course-start")).to_contain_text("How does your browser find")
        self.page.goto(self.base_url + "index.html#lesson=frontdoor-caching--cache-keys-define-sharing")
        self.page.locator("#condition").check()
        self.page.locator("#explanation").fill("<script>my explanation is plain text</script>")
        self.page.locator('input[name="answer-0"][value="0"]').check()
        self.page.reload()
        expect(self.page.locator("#condition")).to_be_checked()
        expect(self.page.locator("#explanation")).to_have_value("<script>my explanation is plain text</script>")
        expect(self.page.locator('input[name="answer-0"][value="0"]')).to_be_checked()
        self.assertEqual(self.page.evaluate("() => CourseProgress.status(CourseApp.progress, CourseApp.current).section"), "check")
        self.page.locator(".lesson-reference > summary").click()
        self.page.get_by_role("link", name="Read the full module reference here").click()
        expect(self.page.locator(".course-reference-body")).to_be_visible()
        self.page.locator(".course-back").click()
        expect(self.page.locator("#lesson-title")).to_contain_text("wrong copy")
        self.page.locator(".course-back").click()
        expect(self.page.locator(".course-start")).to_contain_text("How does your browser find")

    def test_guided_course_teaching_order(self):
        self.open_course("#lesson=azure-ip-addressing--read-an-address-range")
        self.assertTrue(self.page.evaluate("""() => {
            const prose = document.querySelector('#story > p:last-child');
            const diagram = document.querySelector('.course-figure');
            const example = document.querySelector('.worked-example');
            const activity = document.querySelector('input[name="prediction"]').closest('fieldset');
            const before = (a, b) => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
            return before(prose, diagram) && before(diagram, example) && before(example, activity);
        }"""))

    def test_guided_course_navigation_does_not_steal_keyboard_focus(self):
        self.open_course("#lesson=request")
        self.page.wait_for_function("() => !CourseApp.routing")
        for target in ("condition", "skip"):
            focused = self.page.evaluate("""target => {
                const original = window.requestAnimationFrame;
                const pending = [];
                window.requestAnimationFrame = callback => { pending.push(callback); return pending.length; };
                try {
                    CourseApp.lesson('request', 'story');
                    const expected = target === 'condition' ? document.getElementById('condition') : document.getElementById('course');
                    if (target === 'condition') expected.focus();
                    else document.querySelector('.course-skip').click();
                    pending.forEach(callback => callback(performance.now()));
                    return document.activeElement === expected;
                } finally { window.requestAnimationFrame = original; }
            }""", target)
            self.assertTrue(focused, f"Navigation stole focus from {target}")

    def test_guided_course_reviewer_corrections(self):
        for width in (390, 1440):
            self.page.set_viewport_size({"width": width, "height": 1000})
            self.open_course()
            stages = self.page.locator(".course-stage-map a")
            self.assertEqual(stages.count(), 4)
            self.assertTrue(stages.last.evaluate("(el) => el.getBoundingClientRect().bottom <= innerHeight"))
        self.open_course("#lesson=frontdoor-caching--cache-keys-define-sharing")
        expect(self.page.locator(".connection-diagram")).to_contain_text("Repeated names identify the same component")
        self.open_course("#lesson=frontdoor-basics--profiles-endpoints-and-routes")
        expect(self.page.locator(".course-figure")).to_contain_text("Route image-assets")
        expect(self.page.locator(".course-figure")).to_contain_text("Origin group static-assets")
        expect(self.page.locator(".course-figure")).to_contain_text("Configuration associations, not packet hops")

    def test_guided_course_mobile_visuals_and_keyboard(self):
        self.open_course()
        ids = self.page.evaluate("""() => {
            const seen = new Set();
            return CourseApp.lessons.filter(l => {
                const type = l.starter ? l.id : l.visualTable ? l.id :
                    ['private-dns-needs-a-resolution-path', 'prove-private-service-access', 'service-endpoint-or-private-address', 'count-usable-subnet-space'].includes(l.unitId) ? l.unitId : l.diagram?.type;
                if (!type || seen.has(type)) return false;
                seen.add(type); return true;
            }).map(l => l.id);
        }""")
        for width in (320, 390, 768, 1440):
            self.page.set_viewport_size({"width": width, "height": 900})
            for lesson_id in ids:
                with self.subTest(width=width, lesson=lesson_id):
                    self.page.evaluate("id => { location.hash = 'lesson=' + id; }", lesson_id)
                    self.page.wait_for_function("id => CourseApp.current?.id === id", arg=lesson_id)
                    self.assertEqual(self.page.evaluate("""() => [...document.querySelectorAll('main, .course-figure, .connection-row, .course-check')].filter(el => {
                        const r = el.getBoundingClientRect();
                        return r.width && (r.left < -1 || r.right > innerWidth + 1 || el.scrollWidth > el.clientWidth + 1);
                    }).map(el => el.className)"""), [])
                    if self.page.locator("#condition").count():
                        self.page.locator("#condition").focus()
                        before = self.page.locator("figure").inner_text()
                        self.page.keyboard.press("Space")
                        self.assertNotEqual(self.page.locator("figure").inner_text(), before)
                    self.page.locator(".course-skip").focus()
                    self.page.keyboard.press("Enter")
                    expect(self.page.locator("#course")).to_be_focused()
                    self.assertEqual(self.page.evaluate("() => CourseApp.current.id"), lesson_id)

    def test_guided_course_failed_save_and_retry(self):
        self.open_course("#lesson=request")
        self.allowed_storage_errors = True
        self.page.evaluate("""() => {
            window.savedSetItem = Storage.prototype.setItem;
            Storage.prototype.setItem = function() { throw new Error('browser-smoke: expected quota rejection'); };
        }""")
        self.page.locator('input[name="answer-0"][value="1"]').check()
        self.page.locator("#answer-check").click()
        expect(self.page.locator("#save-notice")).to_be_visible()
        expect(self.page.locator("#lesson-next")).to_be_hidden()
        self.page.evaluate("() => { Storage.prototype.setItem = window.savedSetItem; }")
        self.page.get_by_role("button", name="Retry saving", exact=True).click()
        expect(self.page.locator("#save-notice")).to_be_hidden()
        expect(self.page.locator("#lesson-next")).to_be_visible()
        self.page.reload()
        expect(self.page.locator("#lesson-next")).to_be_visible()

    def test_guided_course_old_bookmarks_and_pilot_link(self):
        self.open_course("#frontdoor-basics?unit=edge-is-not-the-origin&tab=try")
        expect(self.page.locator("#lesson-title")).to_have_text("Where does Front Door meet the shopper?")
        self.page.goto(self.base_url + "index.html#net-fundamentals?section=dns-domain-name-system")
        expect(self.page.locator(".course-reference-body")).to_be_visible()
        self.page.goto(self.base_url + "course.html#lesson=address")
        self.page.wait_for_url("**/index.html#lesson=address")
        expect(self.page.locator("#lesson-title")).to_have_text("How does your browser find the website?")
        self.page.goto(self.base_url + "index.html#lesson=unknown")
        expect(self.page.get_by_role("alert")).to_contain_text("Your progress is unchanged")

    def test_guided_course_backup_and_safe_import(self):
        self.open_course("#lesson=request")
        self.page.locator("#explanation").fill("A request and its reply both need a working path.")
        self.page.goto(self.base_url + "index.html#progress")
        with self.page.expect_download() as downloaded:
            self.page.get_by_role("button", name="Download backup", exact=True).last.click()
        self.assertTrue(downloaded.value.suggested_filename.endswith(".json"))
        self.page.once("dialog", lambda dialog: dialog.accept())
        self.page.locator("#course-import").set_input_files({"name": "bad.json", "mimeType": "application/json", "buffer": b'{"completedModules":[]}'})
        expect(self.page.locator("#import-status")).to_contain_text("Import failed")
        self.page.goto(self.base_url + "index.html#lesson=request")
        expect(self.page.locator("#explanation")).to_have_value("A request and its reply both need a working path.")

    def test_offline_guided_course_main_and_reference_are_separate(self):
        self.open_course("#lesson=request")
        self.page.wait_for_function("() => navigator.serviceWorker.controller !== null")
        self.answer_course_lesson()
        self.context.set_offline(True)
        self.page.reload()
        expect(self.page.locator("#lesson-next")).to_be_visible()
        self.page.locator("#lesson-next").click()
        expect(self.page.locator("#lesson-title")).to_have_text("How does your browser find the website?")
        self.page.goto(self.base_url + "reference.html#frontdoor-basics?tab=quiz")
        expect(self.page.locator("#moduleView")).to_be_visible()
        self.assertTrue(self.page.evaluate("() => typeof app !== 'undefined'"))
        self.page.goto(self.base_url + "index.html#continue")
        expect(self.page.locator("#lesson-title")).to_have_text("How does your browser find the website?")
