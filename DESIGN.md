---
name: Azure Networking Academy
description: A calm networking field guide that makes room for understanding.
colors:
  azure-blue: "#0067b8"
  azure-dark: "#004578"
  azure-light: "#deecf9"
  bg-primary: "#f6f8fa"
  bg-secondary: "#ffffff"
  bg-sidebar: "#122638"
  text-primary: "#172f42"
  text-secondary: "#4f6372"
  text-sidebar: "#d2d0ce"
  border-color: "#e1dfdd"
  success: "#107c10"
  error: "#d13438"
  trace-response: "#087f8c"
typography:
  display:
    fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "32px"
    lineHeight: 1.2
    letterSpacing: "-.025em"
  headline:
    fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "clamp(24px, 3vw, 34px)"
    fontWeight: 650
    lineHeight: 1.2
    letterSpacing: "-.025em"
  title:
    fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "20px"
    lineHeight: 1.35
  body:
    fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.8
  label:
    fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "13px"
  diagram-label:
    fontFamily: "Consolas, 'Courier New', monospace"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: ".5px"
rounded:
  field: "4px"
  diagram-control: "6px"
  radius: "8px"
  diagram-frame: "16px"
spacing:
  control-gap: "8px"
  action-gap: "10px"
  compact: "12px"
  group: "16px"
  section: "24px"
  reading: "32px"
  explanation: "40px"
components:
  button-primary:
    backgroundColor: "{colors.azure-blue}"
    textColor: "{colors.bg-secondary}"
    rounded: "{rounded.radius}"
    padding: "10px 20px"
  button-primary-hover:
    backgroundColor: "{colors.azure-dark}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.azure-blue}"
    rounded: "{rounded.radius}"
    padding: "8px 18px"
  button-secondary-hover:
    backgroundColor: "{colors.azure-light}"
  learning-action:
    backgroundColor: "{colors.bg-secondary}"
    textColor: "{colors.azure-blue}"
    rounded: "{rounded.field}"
    padding: "10px 14px"
  learning-action-hover:
    backgroundColor: "{colors.bg-primary}"
  workspace-navigation:
    backgroundColor: "{colors.bg-sidebar}"
    textColor: "{colors.text-sidebar}"
  workspace-navigation-current:
    backgroundColor: "{colors.bg-secondary}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.field}"
    padding: "10px 12px"
  lesson-step:
    backgroundColor: "transparent"
    textColor: "{colors.text-secondary}"
    padding: "12px 6px"
  lesson-step-current:
    backgroundColor: "transparent"
    textColor: "{colors.azure-dark}"
  explanation-field:
    rounded: "{rounded.field}"
    padding: "14px"
    width: "100%"
  diagram-node-chip:
    backgroundColor: "{colors.bg-primary}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.field}"
    padding: "5px 8px"
  diagram-frame:
    backgroundColor: "{colors.bg-secondary}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.diagram-frame}"
  answer-choice:
    backgroundColor: "{colors.bg-secondary}"
    rounded: "{rounded.field}"
    padding: "12px 14px"
  progress-counts:
    textColor: "{colors.text-primary}"
    padding: "20px 0"
---

# Design System: Azure Networking Academy

## Overview

**Creative North Star: "The Calm Networking Field Guide"**

The academy feels like a readable field guide, not a decorative dashboard. A light page, navy navigation and Azure-blue actions give the learner a steady place to read. Headings, generous line spacing and restrained rules establish hierarchy without turning every idea into a card.

The visual language makes complexity available without making it compulsory. Concrete examples and compact, model-owned relationships introduce an idea; full graphs, evidence and references remain separately disclosed. This is a reusable treatment for learning content, not a requirement that every utility screen use a lesson composition.

**Key Characteristics:**
- Light reading surfaces with navy structure and Azure-blue actions.
- System typography, comfortable measures and restrained section rules.
- Compact relationships before optional full visual detail.
- Explicit current states, native controls and visible keyboard focus.
- Progress described as learning activity, not proof of mastery.

This scan records the approved October 24, 2026 implementation. Its visual sources are `css\styles.css`, the field-guide overrides in `css\learning.css`, and `css\diagrams.css`, loaded in that order. Representative markup comes from `index.html`, `js\unit-engine.js`, `js\beginner.js` and `js\app.js`. The frontmatter is the canonical reusable primitive set; the extensions-only sidecar adds specimen styling and metadata. It is not an inventory of every historical selector.

## Colors

Cool, quiet neutrals carry the reading; blue identifies action and relationship, while navy anchors orientation.

### Primary

- **Azure blue** (`azure-blue`): primary actions, selected controls, current-step rules and request traces.
- **Deep Azure** (`azure-dark`): primary hover, selected-step text, links and explanatory feedback.
- **Pale Azure** (`azure-light`): secondary hover and selected diagram controls; not a blanket fill behind current lesson steps.

### Secondary

- **Response teal** (`trace-response`): return-path semantics in diagrams. This is a diagram-specific meaning, not an additional decorative brand accent.
- **Success green** (`success`) and **error red** (`error`): recorded feedback and blocked/error states. Pair these with words or trace patterns.

### Neutral

- **Cool paper** (`bg-primary`) and **white page** (`bg-secondary`): application ground and reading/control surfaces.
- **Navigation navy** (`bg-sidebar`): the persistent desktop navigation and mobile drawer.
- **Reading ink** (`text-primary`): headings and body text.
- **Supporting slate** (`text-secondary`): metadata, secondary descriptions and configuration traces.
- **Navigation text** (`text-sidebar`): the unselected sidebar text.
- **Quiet rule** (`border-color`): dividers and restrained surface boundaries.

The CSS alias `--learning-accent` resolves to `--azure-blue`; it is not a second primitive. Diagram request, configuration and blocked aliases reuse blue, supporting slate and error red.

The sidecar's tonal strips are synthesized OKLCH preview aids, not additional application colors or approved contrast pairings. The frontmatter retains the source CSS colors.

## Typography

**Display and body:** Segoe UI with the system fallbacks in the frontmatter. **Diagram metadata:** Consolas with monospace fallbacks. Diagram containers retain their observed Segoe UI / Aptos / Calibri fallback stack.

The character is familiar and instructional rather than branded through a display font. The roles are observed sizes, not a manufactured mathematical scale.

- **Display:** the academy identity; reduces to 28px on mobile.
- **Headline:** fluid unit titles, limited to a 32ch measure.
- **Title:** section headings on learning destinations. Module titles and example headings use 18px; the unit outcome uses 19px with a 1.6 line height.
- **Body:** the field-guide base is 16px. Unit prose uses the frontmatter's spacious line height; learning-destination prose uses 1.65, activity and explanation text use 1.7. Mobile unit paragraphs use 1.75.
- **Label:** supporting metadata, not primary instruction. Buttons use 14px semibold text; lesson-step controls retain readable labels.
- **Diagram label:** compact technical context. Uppercase remains local to diagram eyebrows, not a global label convention.

The default unit reading measure is 70ch; learning-destination prose can reach 75ch. Use ordinary sentence case and explain terminology through the content rather than relying on visual shorthand.

## Layout

The shell separates navigation from one main reading area. At widths of at least 900px, the field-guide sidebar is 248px wide. At 768px and below, it becomes an off-canvas drawer; three bottom destinations preserve access to Your path, AFD request lab and Progress.

Unit content occupies a centered container up to 960px wide, with desktop padding of 32px 40px 64px and an inner 70ch reading measure. Mobile unit content uses 24px 18px 96px padding. The opening path uses a 52rem measure. Do not stretch prose to fill spare desktop space.

Reading sections use whitespace and fine horizontal rules. The recurring gaps in the frontmatter describe actual use, not a rigid spacing scale imposed on all existing content. Concrete examples have rules above and below; full references and saved records use native disclosures.

Progress counts change from four columns to two at the mobile breakpoint. Learning rows stack their action area beneath the text there. Filters reduce to two columns at 1000px and one at 420px. Compact starter nodes change from four columns to two; longer diagram evidence becomes labeled rows on mobile. Full maps remain independently scrollable rather than shrinking technical text.

Print presentation removes navigation/disclosure controls where specified and preserves readable content and dedicated diagram evidence. Breakpoint metadata in the sidecar records component-local thresholds, not universal device categories.

## Elevation & Depth

Reading content is flat. White surfaces, pale supporting areas and thin rules provide separation; the path, learning groups, progress counts and diagram frames do not need raised-card shadows. The mobile drawer and bottom navigation retain structural shadows to distinguish an overlay or fixed control from content.

The older global shadow variables still exist for retained secondary surfaces. Their presence is not a direction to reintroduce a dashboard of elevated cards. The sidecar records those tokens separately from the observed mobile-shell shadows.

Motion supports control state, not storytelling. Existing button transitions and the mobile drawer use a short ease transition. Reduced-motion styles suppress animation and transitions in diagrams and substantially reduce them globally. Preserve those accommodations; no new motion vocabulary is established here.

## Shapes

Fine rules and simple rectangles define the page. Compact fields and choice rows use modest corners; general primary and secondary buttons retain the existing medium radius. Diagram controls have their own smaller corner, while the diagram frame uses a more generous radius to contain the visual, disclosure and evidence as one object.

These are component-specific shapes, not a global ban on rounding. Reading groups remain square and flat. Diagram traces distinguish request, response, configuration and blocked paths through labels and solid, dashed or mixed line patterns; meaning must not depend on hue alone.

## Components

### Buttons

Clear actions, without ornamental effects. The primary is filled blue with white text; hover deepens it. The secondary is transparent with a two-pixel blue border and a pale hover fill. Both retain the medium radius and padding recorded in frontmatter.

The learning-action variant is a compact white, one-pixel blue-bordered control. It wraps labels, has a 44px minimum target, and underlines on hover. Do not infer that every legacy button already shares that minimum. Preserve descriptive verbs such as “Compare my prediction” and “Save my explanation.”

Keyboard focus uses a visible three-pixel blue outline; the global treatment also has a white separation ring. Learning-surface and diagram controls have their own focus rules. Keep the appropriate treatment for the host, rather than removing it for visual consistency.

### Inputs / Fields

Native labeled controls remain recognizable. The explanation field is full-width, vertically resizable, padded, and bounded by a slate stroke. It uses a 1.7 line height for sentences rather than code-editor density. Search, selects and general learning textareas use the quieter field border and their own minimum heights.

Keep labels, example explanations and save status separate. A saved draft is not an independent assessment. Invalid learning controls retain their error outline; feedback states include readable text.

### Navigation

Desktop destinations sit on the navy rail. A current destination becomes a white row with dark text and a blue leading rule; unselected rows remain quiet. Hover underlines the label; keyboard focus on the navy rail uses a light outline.

The local lesson stepper is distinct from global navigation: three balanced controls, a blue bottom rule and deep-blue text for the current step. The approved field-guide override removes the current-step background fill. At narrow widths, controls share the available width instead of forcing horizontal reading.

### Chips / Tags

Diagram node chips are small labels with a pale surface, thin border and compact corners. They identify nodes inside an explanation; they are not inherently filters or buttons. Do not add hover or pressed behavior to a noninteractive label.

### Cards / Containers

The diagram frame is a white, bordered, unshadowed container. Its compact relationship remains visible while native “full visual” disclosure holds the graph and supporting evidence. Keep the compact relationship tied to the same model as the larger visual; a decorative miniature or hand-maintained alternative would misstate the lesson.

Ordinary examples, route rows and progress sections use rules and spacing rather than this frame. A container is warranted by a distinct interactive visual, not merely by the presence of a heading.

### Answer choices

Each radio option is a comfortably spaced bordered row. Selecting an option adds a pale-blue fill and blue border while retaining the native radio indicator. The question is a fieldset with a legend; explanatory feedback sits next to that question and uses a live status region.

### Progress counts

A ruled definition list pairs each count with a plain label: Read, Prediction correct, Checks passed and Self-explained. Counts are prominent without implying a universal score. Keep the activity disclaimer adjacent and reveal unit-by-unit records separately.

The sidecar contains ten source-derived, shadow-DOM specimens. They demonstrate appearance and native states, not the application's routing, persistence or diagram engine. Preserve those application behaviors when reusing a specimen.

## Do's and Don'ts

### Do:
- **Do** keep reading surfaces light, navigation navy and actions Azure blue.
- **Do** use readable measures, whitespace and section rules before adding containers.
- **Do** preserve native controls, explicit current states and visible keyboard focus.
- **Do** pair diagram color with labels and line patterns.
- **Do** keep compact relationships model-owned and full detail separately accessible.
- **Do** distinguish reading, practice, checks and self-explanation from mastery.

### Don't:
- **Don't** turn the field guide back into a decorative dashboard of raised cards.
- **Don't** make full graphs, references or optional assessments compete with the core reading.
- **Don't** use small technical metadata as the main teaching text.
- **Don't** treat legacy CSS, incidental browser defaults or one-off values as new brand rules.
- **Don't** present these documentation specimens as proof of accessibility or learning effectiveness.
