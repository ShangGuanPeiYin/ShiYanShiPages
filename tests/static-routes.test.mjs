import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const publicPages = [
  'index.html', 'index_zh.html', 'index_en.html',
  'htmls/research_zh.html', 'htmls/research_en.html',
  'htmls/project_zh.html', 'htmls/project_en.html',
  'htmls/team_zh.html', 'htmls/team_en.html',
  'htmls/publications_zh.html', 'htmls/publications_en.html',
  'htmls/join_zh.html', 'htmls/join_en.html',
];

test('every public page shell has a main landmark and shared module entry', async () => {
  for (const file of publicPages) {
    const html = await readFile(file, 'utf8');
    assert.match(html, /<main id="page-main"/);
    assert.match(html, /type="module" src="(?:\.\.\/)?assets\/js\/app\.js"/);
  }
});

test('home data exposes exactly three featured projects with COS video URLs', async () => {
  const projects = JSON.parse(await readFile('data/zh/projects.json', 'utf8'));
  const featured = projects.filter((project) => project.featured);
  assert.equal(featured.length, 3);
  for (const project of featured) assert.match(project.video, /^https:\/\/ieeemvasl-1484396763\.cos\.ap-shanghai\.myqcloud\.com\//);
});

test('featured project slugs are unique and resolve to known project data', async () => {
  const projects = JSON.parse(await readFile('data/en/projects.json', 'utf8'));
  const slugs = projects.map((project) => project.slug);
  assert.equal(new Set(slugs).size, slugs.length);
  assert.ok(slugs.includes('auto-sweeper'));
  assert.ok(slugs.includes('bipedal-robot'));
  assert.ok(slugs.includes('marine-navigation'));
});

test('rebuilt page code and datasets never reference a local videos directory', async () => {
  const filesToCheck = [
    'assets/js/app.js',
    'data/zh/projects.json', 'data/en/projects.json',
    ...publicPages,
  ];
  for (const file of filesToCheck) {
    const content = await readFile(file, 'utf8');
    assert.doesNotMatch(content, /(?:src|video)\s*[:=]["']?videos\//);
  }
});
