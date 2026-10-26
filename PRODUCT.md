# Azure Networking Academy

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users and purpose

Akshay is a technical TPM learning networking from first principles so he can reason confidently about Azure networking and Azure Front Door. The academy must begin without assumed networking knowledge and retain a path to applied depth.

## Confirmed direction

The latest October 26 feedback supersedes the short-course redesign. Akshay reviewed the exact pre-session site at commit `09b3f09` and explicitly chose it as the rebuilding foundation. Restore its substantial L100/L200/L300 modules, service-specific diagrams, exercises, full quizzes, and labs as the main course. Simplify navigation and sequencing, not the learning material.

## Capabilities and constraints

- Full chapters are the primary Learn view. Never replace them with a few paragraphs or hide the complete teaching as optional reference.
- Keep the complete level/module sidebar visible on desktop and an explicit Contents control on mobile. A module has Learn, Diagrams, Exercises, Quiz, and Lab destinations when those activities exist.
- Start each chapter with a brief orientation, then the full explanations, architecture, tables, configuration examples, and tradeoffs. Put worked cases after teaching.
- Keep the original detailed visual identity and service-specific architecture diagrams, with corrected technical semantics, accessible arrows, and learner-controlled walkthroughs.
- Beginner introductions are an optional on-ramp; they are not the full curriculum. Retain added operations explanations where they extend the full chapters.
- Preserve saved short-course work and its exact old links in `guided.html`; do not silently grant full-module completion for short checks.
- Preserve stored learner evidence. Reading and local checks do not prove mastery or execution in Azure.
- Static HTML, CSS and JavaScript; self-hosted assets, offline support, no external trackers or required accounts.
- Changes remain local until the user explicitly approves publication. No Azure resources are deployed by this work.

## Product principles

- Teach a concrete request story before abstract classifications or configuration trivia.
- Preserve depth while introducing concepts in a useful order. Functional passing tests cannot compensate for cutting the material the learner came to study.
- Allow stopping and resuming the last full module and activity, with existing reading, quiz, lab, and draft records preserved.
- Match the visual to the concept: actual arrows for traffic, stacks for layers, containers for hierarchy, and tables for rules and configuration. Do not hide the essential diagram behind a viewer.
- Make module activities visible and understandable rather than treating diagrams, full quizzes, and labs as hidden extras.
- Treat suggested study times and learning-outcome targets as hypotheses to test with learners.

## Evidence and open gates

The October 26 feedback invalidated the earlier beginner-usability assumption despite passing functional tests. Automated browser and model tests support functionality, not retention claims. Human start/continue acceptance, physical-touch, full screen-reader and delayed-recall evaluation remain separate gates.
