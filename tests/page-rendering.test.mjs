import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile('assets/js/app.js', 'utf8');

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
