import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { normalizeLinks, validateCollection } from '../assets/js/data-client.js';
import { filterPublications } from '../assets/js/publication-filter.js';

test('project records require a unique slug, title, summary, and cover', () => {
  assert.throws(
    () => validateCollection('projects', [{ slug: 'sweeper', title: 'Sweeper' }]),
    /projects\[0\] is missing summary/
  );
});

test('project records reject duplicate slugs', () => {
  assert.throws(
    () => validateCollection('projects', [
      { slug: 'sweeper', title: 'Sweeper', summary: 'Autonomous road cleaner', cover: 'sweeper.jpg' },
      { slug: 'sweeper', title: 'Sweeper II', summary: 'Second road cleaner', cover: 'sweeper-ii.jpg' },
    ]),
    /projects\[1\] has duplicate slug "sweeper"/
  );
});

test('empty external-link fields are removed before rendering', () => {
  const links = normalizeLinks({ pdf: '', doi: '10.1109/TMECH.2025.3528060', code: '#' });
  assert.deepEqual(links, [{ label: 'DOI', href: 'https://doi.org/10.1109/TMECH.2025.3528060' }]);
});

test('localized project datasets retain matching slugs and valid records', async () => {
  const read = async (locale) => JSON.parse(await readFile(new URL(`../data/${locale}/projects.json`, import.meta.url)));
  const [zh, en] = await Promise.all([read('zh'), read('en')]);
  assert.deepEqual(zh.map((project) => project.slug), en.map((project) => project.slug));
  assert.doesNotThrow(() => validateCollection('zh projects', zh));
  assert.doesNotThrow(() => validateCollection('en projects', en));
});

test('featured projects use their matching repository posters in both locales', async () => {
  const read = async (locale) => JSON.parse(await readFile(new URL(`../data/${locale}/projects.json`, import.meta.url)));
  const expectedCovers = {
    'auto-sweeper': 'posters/auto_sweeper.png',
    'bipedal-robot': 'posters/bipedal_robot.png',
    'marine-navigation': 'posters/marine_navigation.png',
  };
  const [zh, en] = await Promise.all([read('zh'), read('en')]);

  for (const records of [zh, en]) {
    for (const project of records.filter((record) => record.featured)) {
      assert.equal(project.cover, expectedCovers[project.slug]);
    }
  }
});

test('publication filtering combines year, type, and case-insensitive search', () => {
  const records = [
    { title: 'Autonomous Sweeper', summary: '', venue: '', year: 2025, type: 'journal' },
    { title: 'Marine SLAM', summary: '', venue: '', year: 2024, type: 'conference' },
  ];
  assert.deepEqual(filterPublications(records, 'sweeper', '2025', 'journal'), [records[0]]);
});
