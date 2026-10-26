"""Isolated module-diagram integration checks; no server or shared smoke edits."""
import pathlib
import unittest

from playwright.sync_api import sync_playwright


ROOT = pathlib.Path(__file__).resolve().parents[1]


class IllustratedDiagramTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.playwright = sync_playwright().start()
        cls.browser = cls.playwright.chromium.launch(headless=True)

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.playwright.stop()

    def setUp(self):
        self.page = self.browser.new_page(viewport={"width": 1280, "height": 1000})
        self.errors = []
        self.page.on("pageerror", lambda error: self.errors.append(str(error)))
        self.page.set_content('<body class="module-academy"><main style="max-width:1100px;margin:auto"><div id="tab-diagrams"></div><div id="inline"></div><div id="preview"></div></main></body>')
        for name in ["styles.css", "illustrated-diagrams.css"]:
            self.page.add_style_tag(content=(ROOT / "css" / name).read_text(encoding="utf-8"))
        for name in ["diagram-models.js", "diagram-afd.js", "diagrams.js", "illustrated-diagrams.js"]:
            self.page.add_script_tag(content=(ROOT / "js" / name).read_text(encoding="utf-8"))

    def tearDown(self):
        self.page.close()
        self.assertEqual(self.errors, [])

    def test_controls_cleanup_and_multiple_instances(self):
        self.page.evaluate("""() => IllustratedDiagrams.render([
            {type:'frontdoor-caching', scenario:'hit', id:'duplicate'},
            {type:'frontdoor-caching', scenario:'miss', id:'duplicate'}])""")
        first = self.page.locator(".illustrated-diagram").first
        initial_count = first.locator("svg [data-item]").count()
        first.get_by_role("button", name="Step", exact=True).focus()
        self.page.keyboard.press("Enter")
        self.assertIn("Step 1 of", first.locator('[role="status"]').inner_text())
        self.assertGreater(first.locator("svg .is-focused").count(), 0)
        self.assertEqual(first.locator("svg [data-item]").count(), initial_count)
        first.get_by_role("button", name="Previous").click()
        self.assertIn("Complete architecture", first.locator('[role="status"]').inner_text())
        first.get_by_role("button", name="Step", exact=True).click()
        first.get_by_role("button", name="Reset").click()
        self.assertEqual(first.locator("svg .is-focused").count(), 0)
        self.assertEqual(self.page.locator('[role="status"]').nth(1).inner_text(), first.locator('[role="status"]').inner_text())
        self.assertEqual(self.page.evaluate("IllustratedDiagrams.instances.size"), 2)
        self.page.evaluate("IllustratedDiagrams.render([{type:'natgw'}])")
        self.assertEqual(self.page.evaluate("IllustratedDiagrams.instances.size"), 1)
        self.page.evaluate("IllustratedDiagrams.cleanup()")
        self.assertEqual(self.page.evaluate("IllustratedDiagrams.instances.size"), 0)
        self.page.locator('button[data-illustrated-action="step"]').click()
        self.assertIn("Complete architecture", self.page.locator('[role="status"]').inner_text())

    def test_inline_origin_kind_preview_and_reduced_motion(self):
        self.page.emulate_media(reduced_motion="reduce")
        self.page.evaluate("""() => {
            const root = document.getElementById('inline');
            root.innerHTML = '<div data-diagram-model="frontdoor-private-link" data-diagram-origin-kind="appservice"></div>';
            IllustratedDiagrams.renderInline(root);
            IllustratedDiagrams.renderPreview({type:'frontdoor-caching', scenario:'hit'}, document.getElementById('preview'));
        }""")
        self.assertEqual(self.page.locator("#inline [data-item=pls]").count(), 0)
        self.assertEqual(self.page.locator("#preview button").count(), 0)
        self.assertIn("Not contacted", self.page.locator("#preview svg").text_content())
        self.assertEqual(self.page.evaluate("""() => [...document.querySelectorAll('.illustrated-diagram *')].filter(el =>
            getComputedStyle(el).animationName !== 'none').length"""), 0)
        self.assertEqual(self.page.evaluate("IllustratedDiagrams.instances.size"), 1)

    def test_catalog_shapes_references_and_mobile_overflow(self):
        self.page.evaluate("""() => IllustratedDiagrams.render(Object.keys(DiagramCatalog.models).map(type => ({type})))""")
        result = self.page.evaluate("""() => {
            const ids = [...document.querySelectorAll('[id]')].map(el => el.id);
            const missing = [...document.querySelectorAll('svg [marker-end]')].filter(el =>
                !document.getElementById(el.getAttribute('marker-end').slice(5, -1)));
            const outside = [...document.querySelectorAll('.illustrated-svg')].flatMap(svg =>
                [...svg.querySelectorAll('.illustrated-node, .illustrated-boundary-label')].filter(el => {
                    const box = el.getBoundingClientRect(), outer = svg.getBoundingClientRect();
                    return box.left < outer.left - 1 || box.right > outer.right + 1 ||
                        box.top < outer.top - 1 || box.bottom > outer.bottom + 1;
                }).map(el => el.textContent));
            return {duplicate:ids.length !== new Set(ids).size, missing:missing.length, outside};
        }""")
        self.assertFalse(result["duplicate"])
        self.assertEqual(result["missing"], 0)
        self.assertEqual(result["outside"], [])
        self.page.set_viewport_size({"width": 390, "height": 844})
        self.assertTrue(self.page.evaluate("document.documentElement.scrollWidth <= window.innerWidth"))
        self.assertTrue(self.page.evaluate("""() => [...document.querySelectorAll('.illustrated-map')].every(el =>
            el.scrollWidth >= el.clientWidth && getComputedStyle(el).overflowX === 'auto')"""))

    def test_readable_narrow_diagram_pan_hint_and_controls_above_map(self):
        self.page.set_viewport_size({"width": 390, "height": 844})
        self.page.evaluate("IllustratedDiagrams.render([{type:'frontdoor-routing'}])")
        geometry = self.page.evaluate("""() => {
            const svg = document.querySelector('.illustrated-svg');
            const detail = svg.querySelector('.illustrated-node-detail');
            return {
                scale: svg.getBoundingClientRect().width / svg.viewBox.baseVal.width,
                renderedFont: parseFloat(getComputedStyle(detail).fontSize) * svg.getScreenCTM().a,
                controlsBottom: document.querySelector('.illustrated-controls').getBoundingClientRect().bottom,
                mapTop: document.querySelector('.illustrated-map').getBoundingClientRect().top
            };
        }""")
        self.assertGreaterEqual(geometry["scale"], 1)
        self.assertGreaterEqual(geometry["renderedFont"], 12)
        self.assertLessEqual(geometry["controlsBottom"], geometry["mapTop"])
        hint = self.page.locator(".illustrated-pan-hint")
        hint.wait_for(state="visible")
        self.assertIn("left", hint.inner_text().lower())
        region = self.page.locator(".illustrated-map")
        self.assertIn("pan horizontally", region.get_attribute("aria-label").lower())
        self.assertEqual(region.get_attribute("aria-describedby"), hint.get_attribute("id"))
        region.focus()
        self.page.keyboard.press("ArrowRight")
        self.page.wait_for_function("document.querySelector('.illustrated-map').scrollLeft > 0")
        self.assertTrue(self.page.evaluate("document.documentElement.scrollWidth <= window.innerWidth"))
        self.page.set_viewport_size({"width": 1600, "height": 1000})
        self.page.evaluate("document.querySelector('main').style.maxWidth = 'none'")
        hint.wait_for(state="hidden")
        self.assertLess(self.page.locator(".illustrated-controls").bounding_box()["y"], 500)
        self.page.evaluate("IllustratedDiagrams.cleanup()")
        self.assertEqual(self.page.evaluate("IllustratedDiagrams.panObservers.size"), 0)


if __name__ == "__main__":
    unittest.main()
