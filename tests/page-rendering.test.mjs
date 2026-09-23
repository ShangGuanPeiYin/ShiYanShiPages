import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { setupRevealMotion } from '../assets/js/app.js';

const source = await readFile('assets/js/app.js', 'utf8');

const fakeClassList = () => {
  const values = new Set();
  return {
    add(...names) { names.forEach((name) => values.add(name)); },
    contains(name) { return values.has(name); },
  };
};

const revealFixture = (count = 2) => {
  const elements = Array.from({ length: count }, () => ({ classList: fakeClassList() }));
  return {
    elements,
    root: {
      documentElement: { classList: fakeClassList() },
      querySelectorAll(selector) {
        assert.equal(selector, '[data-reveal]');
        return elements;
      },
    },
  };
};

test('reveal motion keeps content visible without animation support or with reduced motion', () => {
  for (const options of [
    { reducedMotion: true, Observer: class {} },
    { reducedMotion: false, Observer: null },
  ]) {
    const { elements, root } = revealFixture();
    setupRevealMotion({ root, ...options });
    assert.equal(root.documentElement.classList.contains('motion-ready'), false);
    assert.ok(elements.every((item) => item.classList.contains('is-visible')));
  }
});

test('reveal motion observes content and reveals only intersecting elements', () => {
  const { elements, root } = revealFixture();
  const observed = [];
  const unobserved = [];
  let callback;
  class Observer {
    constructor(handler) { callback = handler; }
    observe(element) { observed.push(element); }
    unobserve(element) { unobserved.push(element); }
  }

  const observer = setupRevealMotion({ root, reducedMotion: false, Observer });
  assert.equal(root.documentElement.classList.contains('motion-ready'), true);
  assert.deepEqual(observed, elements);
  assert.ok(elements.every((item) => !item.classList.contains('is-visible')));

  callback([
    { isIntersecting: false, target: elements[0] },
    { isIntersecting: true, target: elements[1] },
  ], observer);
  assert.equal(elements[0].classList.contains('is-visible'), false);
  assert.equal(elements[1].classList.contains('is-visible'), true);
  assert.deepEqual(unobserved, [elements[1]]);
});

test('research and project renderers expose semantic navigation and status hooks', () => {
  assert.match(source, /class="project-index"/);
  assert.match(source, /id="research-count" aria-live="polite"/);
  assert.match(source, /class="project-backlink"/);
  assert.match(source, /404/);
});

test('research filtering preserves the live region and replaces only the card container', () => {
  assert.match(source, /id="research-projects"/);
  assert.match(source, /researchCount\.textContent = projectCount\(filtered\)/);
  assert.match(source, /projectGrid\.innerHTML = projectCards\(filtered\)/);
});

test('research filters expose group and pressed-state semantics', () => {
  assert.match(source, /class="research-filters" role="group"/);
  assert.match(source, /aria-pressed="true"/);
  assert.match(source, /setAttribute\('aria-pressed', String\(item === button\)\)/);
});

test('people renderer exposes a featured lead-person hook', () => {
  assert.match(source, /class="people-lead"/);
});

test('publication renderer exposes a strong chronological index hook', () => {
  assert.match(source, /class="publication-index"/);
});

test('join renderer exposes a prominent contact hook', () => {
  assert.match(source, /class="join-contact"/);
});
