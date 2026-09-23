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
