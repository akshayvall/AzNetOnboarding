const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = path.join(__dirname, '../js/guided-course.js');

test('the approved pilot provides a three-lesson guided course', () => {
    assert.ok(fs.existsSync(source), 'The guided pilot has not been implemented');
});

const course = () => require(source);
const empty = () => ({ notes: {}, practiceChecks: {}, lastVisited: 'frontdoor-advanced', completedModules: ['existing'] });

test('course position follows unfinished learning, not the last explored reference', () => {
    const c = course();
    const progress = empty();
    assert.equal(c.nextLesson(progress).id, 'request');
    const checked = c.record(progress, 'request', { passed: true });
    assert.equal(c.nextLesson(checked).id, 'address');
    const review = c.record(checked, 'request', { section: 'experiment', variant: true });
    assert.equal(c.nextLesson(review).id, 'address');
    assert.equal(review.lastVisited, 'frontdoor-advanced');
    assert.deepEqual(review.completedModules, ['existing']);
    assert.deepEqual(progress.notes, {});
});

test('each lesson keeps its answer, condition and reading position across reloads', () => {
    const c = course();
    const updated = c.record(empty(), 'address', { section: 'check', answer: 1, variant: true });
    assert.deepEqual(c.state(JSON.parse(JSON.stringify(updated)), 'address'), {
        section: 'check', answer: 1, variant: true, completed: false
    });
    assert.throws(() => c.record(updated, 'unknown', { passed: true }), /Unknown lesson/);
});

test('revisiting a completed lesson cannot remove completion or advance unrelated lessons', () => {
    const c = course();
    let p = empty();
    for (const lesson of c.lessons) p = c.record(p, lesson.id, { passed: true });
    assert.equal(c.nextLesson(p), null);
    p = c.record(p, 'request', { passed: false });
    assert.equal(c.state(p, 'request').completed, true);
    assert.equal(c.nextLesson(p), null);
});

test('every pilot diagram connects named endpoints and describes both directions', () => {
    const c = course();
    for (const lesson of c.lessons) {
        for (const variant of [false, true]) {
            const diagram = c.diagram(lesson.id, variant);
            assert.ok(diagram.nodes.length >= 2);
            assert.equal(diagram.links.length, diagram.nodes.length - 1);
            diagram.links.forEach(link => {
                assert.ok(link.outward);
                assert.ok(link.inward);
            });
            assert.ok(diagram.caption.length > 40);
        }
    }
    const cached = c.diagram('frontdoor', true);
    assert.equal(cached.links[1].unused, true);
    assert.equal(cached.nodes[2].unused, true);
    assert.equal(c.diagram('request', true).links[0].broken, true);
    assert.equal(c.diagram('address', true).links[0].broken, undefined);
});
