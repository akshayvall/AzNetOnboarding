---
name: Azure Networking Academy
description: A calm, continuous networking course from first principles to applied depth.
colors:
  ink: "#172f42"
  muted: "#4f6372"
  paper: "#ffffff"
  ground: "#f6f8fa"
  blue: "#0067b8"
  deep-blue: "#004578"
  light-blue: "#deecf9"
  line: "#c7d3dc"
  reply: "#087f8c"
  error: "#b42328"
typography:
  headline:
    fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "clamp(28px, 3.2vw, 38px)"
    fontWeight: 650
    lineHeight: 1.2
    letterSpacing: "-.025em"
  title:
    fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "23px"
    fontWeight: 650
    lineHeight: 1.35
  body:
    fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.65
  intro:
    fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "19px"
    lineHeight: 1.65
  metadata:
    fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "15px"
    lineHeight: 1.65
  diagram-detail:
    fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "14px"
    lineHeight: 1.5
rounded:
  field: "4px"
  control: "6px"
  figure: "8px"
spacing:
  compact: "12px"
  group: "16px"
  control: "20px"
  section: "24px"
  reading: "32px"
  lesson: "36px"
components:
  button-primary:
    backgroundColor: "{colors.blue}"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
    padding: "10px 20px"
  button-primary-hover:
    backgroundColor: "{colors.deep-blue}"
    textColor: "{colors.paper}"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "10px 20px"
  button-secondary-hover:
    backgroundColor: "{colors.ground}"
  course-navigation:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.blue}"
    padding: "8px 0"
  syllabus-current:
    backgroundColor: "{colors.light-blue}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "9px 10px"
  explanation-field:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "12px"
    width: "100%"
  answer-choice:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "14px 16px"
  answer-choice-selected:
    backgroundColor: "{colors.light-blue}"
  diagram-frame:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink}"
    rounded: "{rounded.figure}"
    padding: "22px"
  case-evidence:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "20px 24px"
---

# Design System: Azure Networking Academy

## Overview

**Creative North Star: "The Calm Networking Field Guide"**

The academy retains its calm instructional identity: white reading pages, navy text and Azure-blue actions. Familiar system typography, generous line spacing and restrained rules make room for explanation instead of turning the course into a dashboard.

The built main is a continuous course, not a collection of learning tools. Essential visuals sit with the explanation; disclosures hold supplementary sources, references and self-review examples. The visual system supports beginner-to-depth reading without requiring a separate simulator or lab.

**Key Characteristics:**
- White reading surfaces, navy ink and Azure-blue actions.
- Readable system typography and restrained section rules.
- Complete, relevant visuals beside the teaching they support.
- Native disclosures, explicit states and visible keyboard focus.
- Honest learning records and visible save failures.

This October 26, 2026 source scan updates the earlier field-guide record. `index.html` is canonical and loads `css\guided-course.css` followed by `css\course.css`; the latter wins where selectors overlap. Representative behavior comes from `js\course-app.js` and `js\course-visuals.js`. The main's direction contract and `.impeccable\surfaces\index-html.md` identify the Read surface; the detailed course strategy remains in that surface brief and `PRODUCT.md`.

`reference.html` retains the old application for optional quizzes, labs, tools and earlier records. Its navy sidebar, bottom navigation, Learn/Try/Check tabs and legacy token names are not the main course's design authority. This document preserves the incumbent palette character and reading principles, not that superseded shell. No new image composition or quality card is introduced.

The integrated scope is 21 modules and 79 lessons across the starter material and L100/L200/L300. This handoff documents built source, not a new review. The reported finish-review closures cover the early complete stage map, explanations of repeated diagram entities and relationship labels, and concrete Front Door resource associations. Neither those closures nor source inspection supplies learning-retention evidence. Beginner acceptance, independent skill, physical-touch, full screen-reader and delayed-recall evaluation remain separate gates.

## Colors

White and cool supporting surfaces carry the reading; navy carries text, blue carries action, and diagram colors carry explicit meanings.

### Primary

- **Azure blue** (`blue`): primary actions, links, focus outlines, selected borders and request connections.
- **Deep Azure** (`deep-blue`): primary-action and ordinary-link hover; supporting checked-status text.
- **Pale Azure** (`light-blue`): selected answers, the current syllabus lesson and highlighted evidence rows.

### Secondary

- **Response teal** (`reply`): return traffic, not a decorative second accent.
- **Error red** (`error`): blocked connections and save-failure boundaries, paired with readable explanations.

### Neutral

- **Reading ink** (`ink`): navy headings, body text and neutral controls.
- **Supporting slate** (`muted`): metadata, endpoint details and configuration relationships.
- **White page** (`paper`): the main background, controls and relationship endpoints.
- **Cool ground** (`ground`): diagram frames, evidence blocks and neutral hover/disabled fills.
- **Quiet rule** (`line`): fine borders and section dividers.

Frontmatter keys match the main CSS custom properties without their leading `--`. Do not substitute legacy aliases such as `--azure-blue`, `--bg-primary` or `--border-color`: their roles and values are not interchangeable with the current cascade. There is no main-shell success-green token or navy-background navigation token.

The sidecar's synthesized OKLCH tonal strips are preview aids only, not application tokens or approved contrast combinations. The source hex primitives remain normative.

**The Semantic Color Rule.** Pair diagram color with endpoint names, relationship labels and the applicable line pattern; color alone does not explain a connection.

## Typography

**Headline and body:** Segoe UI with the system fallbacks recorded above. The main does not introduce a separate display face or a custom monospace diagram-label family.

The hierarchy uses observed roles, not an invented scale. The body is comfortable reading text; smaller labels support it rather than replace it.

- **Headline:** the fluid page or lesson title, with a 26ch maximum measure.
- **Title:** ordinary section headings. Worked-example headings use 21px; syllabus stage summaries use 20px, reducing to 18px at the narrow breakpoint.
- **Body:** the main reading baseline. Paragraphs stop at 70ch and have an 18px bottom margin.
- **Intro:** the larger lesson outcome or opening explanation.
- **Metadata:** course position, supporting guidance and answer detail. Figure captions also use 15px, with a 1.6 line height.
- **Diagram detail:** endpoint descriptions. Relationship labels use 14px with a 1.4 line height; endpoint headings use 16px, weight 700 through native `strong`, and a 1.4 line height.

Header identity uses 16px at weight 650; Course/Progress links use 16px at weight 500, reducing to 14px on narrow screens. Native buttons inherit the reading font; primary actions use weight 600. Lesson-state labels use 13px, not the main instructional size. Evidence `pre` blocks use 15px and a 1.7 line height; do not infer a new font family from the browser's monospace default.

**The Reading First Rule.** Keep explanation at the body scale and supporting detail subordinate; do not compress the lesson into diagram metadata.

## Layout

The header and outer course layout have a 1220px maximum width. Main reading, footer and save-notice containers retain a 900px maximum width and desktop padding of 36px 32px. Paragraph and heading measures remain bounded within that space.

The overview presents one Start/Continue action, then the complete four-stage map: Start here, L100, L200 and L300. Its four equal columns use a 14px gap, ruled top and bottom edges, and 12px block padding. Below it, native syllabus disclosures expose modules and lessons. The early map provides orientation without expanding the entire syllabus.

Lessons use one continuous reading sequence: explanation, complete relevant visual, worked example, activity, checks and teach-back, then next. Checkpoints use evidence and interpretation rather than forcing every lesson through a traffic diagram. This describes the implemented course surface, not a global composition rule for every optional utility.

At a minimum width of 1100px, a lesson layout has a 270px syllabus column beside `minmax(0, 1fr)` reading content; main horizontal padding becomes 42px. The syllabus disclosure initially opens at that threshold but remains collapsible. Its rail is light, inherits the white page, and has a fine right border; the source does not assign it a separate tinted background.

At a maximum width of 650px, the header and main use 20px horizontal padding; main block padding becomes 24px. The stage map becomes two columns. The syllabus stays a native in-flow disclosure, not an off-canvas drawer or fixed bottom bar. Connection endpoints stack vertically, arrows switch orientation, address partitions become one column, and evidence-table cells expose their `data-label` as row labels.

Section rhythm combines 36px lesson spacing, 28px section-heading top margins, and ruled next-step groups with 24px top padding and 28px top margin. These are source-observed intervals, not a requirement to normalize every gap.

Print removes the header, footer, syllabus navigation, navigation controls, buttons, next-step group and optional-reference disclosure. It removes the main width constraint, avoids breaks inside figures, connection rows and checks, and uses 11pt for reference tables.

## Elevation & Depth

The main is flat: white pages, cool diagram/evidence fills and one-pixel rules create separation. Neither main stylesheet defines a box shadow. Legacy overlay and bottom-navigation shadows are not part of this system.

Keyboard focus is a three-pixel blue outline with a four-pixel offset. Programmatic focus on `tabindex="-1"` headings or the main anchor deliberately omits an outline; that is not permission to remove keyboard focus on interactive controls.

The only declared transition in these stylesheets is `background-color 160ms ease-out, border-color 160ms ease-out` on starter journey nodes and answer rows, gated by `prefers-reduced-motion: no-preference`. The main does not establish drawer animation or a global animated-button vocabulary.

**The Flat Reading Rule.** Use spacing, fine borders and pale supporting surfaces for hierarchy; do not import raised legacy-shell treatments into the main.

## Shapes

Simple rectangles and fine rules dominate. Fields, current syllabus entries and evidence blocks use the small radius; buttons and answer rows use the control radius; figures use the larger figure radius. Relationship endpoints retain their local 5px radius rather than redefining the reusable scale.

Connection strokes are two pixels and retain non-scaling stroke behavior. Request lines are solid; response lines use `7 3` dashes; configuration lines use `3 3` dashes. Blocked and unused paths carry explicit labels and source-defined markers or dashed boundaries. A repeated endpoint is the same component shown in another relationship, not another appliance.

## Components

### Buttons

Primary actions are filled Azure blue with white text; hover deepens the fill. Neutral actions are white with navy text; hover uses cool ground and a blue border. Both use a one-pixel border, the frontmatter padding/radius and a 46px minimum height. The primary can be an anchor or a button; its anchor form is inline-block without an underline.

Disabled buttons use supporting text, cool ground and a not-allowed cursor. Preserve visible keyboard focus. There is no separate authored pressed-state animation. Narrow primary actions wrap and balance their text.

### Navigation and disclosures

Course and Progress are top-level text links on white, with a 24px desktop gap and a 14px narrow-screen gap. They are not filled destination tabs. The source does not apply a special current-page style to those top links.

The course-stage map uses semibold links and smaller supporting stage descriptions. Links and summaries generally retain 44px minimum targets. Syllabus stage summaries show plus/minus markers; the optional lesson syllabus uses native nested disclosures. Its current lesson has a pale-blue fill, navy semibold text and small corners. Do not replace this with the legacy stepper.

### Inputs / Fields

The teach-back field is labeled, full-width, vertically resizable and uses the body font. It starts at three rows, accepts up to 4000 characters, and has the frontmatter padding, white fill and fine border. Draft status sits below it; the example explanation or rubric is a separate native disclosure.

The condition comparison uses a native 22px checkbox with blue accent. Sandbox selects retain native behavior, a 46px minimum height, an 8px padding and white fill. File import stays a labeled native file input. None of these controls implies an Azure operation.

### Answer choices

Radio answers are bordered rows with 12px between the control and text, and a 10px bottom margin. Hover and selected states share a pale-blue fill and blue border while retaining the native 20px radio indicator. Fieldsets and legends group each question; adjacent status regions explain feedback.

### Figures and evidence

The figure is a cool-ground, bordered, unshadowed container; final cascade padding is 22px on desktop and 16px 12px on narrow screens. The relevant visual is complete and visible, not hidden behind an inner viewer. Only further explanation and sources are disclosed.

Choose the representation the concept needs: endpoint connections for traffic, stacks for layers, nested containers for resource hierarchy, address partitions for ranges, and tables for rules and configuration. Front Door resource associations belong in concrete configuration evidence, not a generic decorative flow.

Multi-relationship diagrams explain that repeated names identify the same component. Their headings say “Relationship,” not “Step”: paired request/reply arrows describe conversations, not the timing of the whole request. Preserve true sequence labels where the underlying model actually defines a sequence. Unreached components remain explicitly named.

Worked examples use ordinary headings and prose, not compulsory cards. Fictional evidence is labeled and wrapped for reading; it must not appear to be live telemetry or instructions already executed.

### Progress and save failures

Progress uses plain counts, level lists and disclosed lesson records. Earlier academy evidence remains separately labeled and is not converted into new successful checks. Browsing is distinct from the first-unfinished Continue destination.

Save failure is a visible alert above the main content, with error border, local pale-red fill (`#fff4f4`), explanatory text, Retry saving and Download backup actions. This single-purpose fill is not promoted to a reusable palette token. Next remains hidden while saving has failed or recovery is required, even when checks have been completed.

Saved answers, comparisons, drafts and reading position support continuity; self-explanation is not automatically graded. Keep the distinction between practice records, mastery and Azure execution visible.

The sidecar contains eight source-derived specimens, including native controls and their authored states. They demonstrate appearance, not application routing, persistence, automatic grading or semantic-model execution. Main course source remains authoritative.

## Do's and Don'ts

### Do:
- **Do** keep white reading surfaces, navy text and Azure-blue actions.
- **Do** preserve the readable body scale, bounded measures and visible keyboard focus.
- **Do** show the complete relevant visual with its explanation, labels and evidence.
- **Do** use native disclosures for optional syllabus detail, references and self-review.
- **Do** distinguish practice records from mastery and expose save failures with recovery actions.

### Don't:
- **Don't** import the legacy navy sidebar, bottom navigation or Learn/Try/Check tabs into the main.
- **Don't** hide the essential lesson visual behind a viewer or require a standalone Front Door lab.
- **Don't** imply that repeated endpoints are extra appliances or relationship rows are global timing steps.
- **Don't** invent tokens, shadows or controls to make the documentation look more systematic.
- **Don't** claim that source inspection or finish review establishes learning retention.
