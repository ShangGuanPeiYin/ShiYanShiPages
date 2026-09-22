# SJTU Red MVAS Lab Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild every Chinese and English MVAS Lab page as a responsive SJTU-red academic robotics site while preserving the existing static data-driven architecture.

**Architecture:** Keep the current HTML entry points, JSON datasets, and ES module boot flow. Split reusable media behavior into a focused module, render every page from the existing localized data, and replace the visual system through shared tokens, base styles, and site-shell components.

**Tech Stack:** Semantic HTML5, CSS custom properties and responsive CSS Grid, native ES modules, Node.js 22 built-in test runner.

**Spec:** `docs/superpowers/specs/2026-09-22-sjtu-red-lab-redesign-design.md`

## Global Constraints

- Preserve the no-build static-site architecture; do not add React, Vue, a bundler, or runtime dependencies.
- Use `#9E1B32` as the primary SJTU red, with warm white, charcoal, and neutral gray supporting colors.
- Do not copy MIT trademarks, logos, photographs, text, or source code.
- Chinese and English pages must share rendering logic and load content from `data/zh` and `data/en`.
- Do not invent people, publications, news, or research outcomes.
- Do not require Tencent COS; deployed pages must not reference the COS hostname.
- Keep the existing large files under `videos/` untracked because two exceed the prior 25 MB deployment limit; use repository poster imagery until deployable local encodes are supplied.
- Respect `prefers-reduced-motion`, keyboard navigation, visible focus, semantic heading order, and useful image alternatives.

## Review Focus

- Missing project images must collapse to a branded fallback without hiding the title or link; Task 3 adds and tests `applyMediaFallbacks`.
- A missing project slug must render a useful localized 404 and research-page return link; Task 4 pins this in static render assertions.
- Mobile menu state must close on Escape and restore focus; Task 2 extends the shell tests.
- Reduced-motion or narrow viewports must not trigger autoplay; Task 3 tests `shouldAutoplayMedia` for both conditions.
- Localized project datasets must retain identical slugs and must not reference COS; Task 1 updates the dataset integrity test.

---

### Task 1: Local Media Policy and Dataset Integrity

**Files:**
- Modify: `.gitignore`
- Modify: `data/zh/projects.json`
- Modify: `data/en/projects.json`
- Modify: `tests/static-routes.test.mjs`

**Interfaces:**
- Consumes: existing project records with `slug`, `title`, `summary`, `cover`, `tags`, and `featured`.
- Produces: project records whose `cover` resolves to a tracked repository image and whose optional `video` never points to COS.

- [ ] **Step 1: Replace the obsolete COS assertions with local-media integrity tests**

In `tests/static-routes.test.mjs`, replace the two COS-specific tests with:

```js
test('home data exposes exactly three featured projects with tracked poster images', async () => {
  const projects = JSON.parse(await readFile('data/zh/projects.json', 'utf8'));
  const featured = projects.filter((project) => project.featured);
  assert.equal(featured.length, 3);
  for (const project of featured) {
    assert.match(project.cover, /^images\//);
    await assert.doesNotReject(() => readFile(project.cover));
  }
});

test('deployed code and datasets do not depend on Tencent COS', async () => {
  const filesToCheck = ['assets/js/app.js', 'data/zh/projects.json', 'data/en/projects.json', ...publicPages];
  for (const file of filesToCheck) {
    assert.doesNotMatch(await readFile(file, 'utf8'), /ieeemvasl-1484396763\.cos\.ap-shanghai\.myqcloud\.com/);
  }
});
```

- [ ] **Step 2: Run the route test and verify the COS assertion fails**

Run: `node --test tests/static-routes.test.mjs`

Expected: FAIL because both project datasets still contain the COS hostname.

- [ ] **Step 3: Remove remote video fields and keep deployable poster covers**

Remove each `video` property from both localized project datasets. Keep `videos/` ignored in `.gitignore`; add a comment directly above it:

```gitignore
# Source video masters are local-only; publish optimized encodes before referencing them.
videos/
```

- [ ] **Step 4: Run the complete data and route tests**

Run: `node --test tests/data-client.test.mjs tests/static-routes.test.mjs`

Expected: all tests PASS.

- [ ] **Step 5: Commit the local-media policy**

```bash
git add .gitignore data/zh/projects.json data/en/projects.json tests/static-routes.test.mjs
git commit -m "refactor: remove COS dependency from project data"
```

### Task 2: SJTU Red Design Tokens and Accessible Site Shell

**Files:**
- Modify: `assets/css/tokens.css`
- Modify: `assets/css/base.css`
- Modify: `assets/css/site-shell.css`
- Modify: `assets/js/site-shell.js`
- Create: `tests/site-shell.test.mjs`

**Interfaces:**
- Consumes: `renderSiteShell(site, lang)` and localized site metadata.
- Produces: `toggleMobileMenu(menu, button, open)`, `closeMobileMenuOnEscape(event, menu, button)`, and a shared header/footer DOM structure used by every page.

- [ ] **Step 1: Write shell behavior tests**

Create `tests/site-shell.test.mjs` with minimal element stubs and these assertions:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { toggleMobileMenu, closeMobileMenuOnEscape } from '../assets/js/site-shell.js';

const element = (expanded = 'false') => ({
  dataset: {}, focused: false,
  attributes: new Map([['aria-expanded', expanded]]),
  getAttribute(name) { return this.attributes.get(name); },
  setAttribute(name, value) { this.attributes.set(name, value); },
  focus() { this.focused = true; },
});

test('mobile menu state stays synchronized with aria-expanded', () => {
  const menu = element();
  const button = element();
  toggleMobileMenu(menu, button, true);
  assert.equal(button.getAttribute('aria-expanded'), 'true');
  assert.equal(menu.dataset.open, 'true');
});

test('Escape closes an open mobile menu and restores trigger focus', () => {
  const menu = element();
  const button = element('true');
  assert.equal(closeMobileMenuOnEscape({ key: 'Escape' }, menu, button), true);
  assert.equal(button.getAttribute('aria-expanded'), 'false');
  assert.equal(button.focused, true);
});
```

- [ ] **Step 2: Run the focused shell test and verify the missing export**

Run: `node --test tests/site-shell.test.mjs`

Expected: FAIL because `closeMobileMenuOnEscape` is not exported.

- [ ] **Step 3: Extract Escape handling and rebuild shell markup**

Export `closeMobileMenuOnEscape(event, menu, button)` from `assets/js/site-shell.js`; it returns `true` only when Escape closes an open menu. Update `renderSiteShell` to produce a two-part identity, numbered desktop navigation, a clear language switch, and a footer with contact heading, address, email, university link, and current year. Keep all paths compatible with root and nested pages.

- [ ] **Step 4: Replace the shared visual foundation**

Update the CSS files with the approved palette, local bilingual font stacks, fluid type scale, warm-white page background, charcoal text, square controls, strong focus rings, sticky white/red header, editorial spacing, mobile menu, and responsive footer. Define all shared colors and spacing in `tokens.css`; keep resets and element defaults in `base.css`; keep components and page layouts in `site-shell.css`.

- [ ] **Step 5: Run shell and route tests**

Run: `node --test tests/site-shell.test.mjs tests/static-routes.test.mjs`

Expected: all tests PASS.

- [ ] **Step 6: Commit the shared shell**

```bash
git add assets/css/tokens.css assets/css/base.css assets/css/site-shell.css assets/js/site-shell.js tests/site-shell.test.mjs
git commit -m "feat: add SJTU red site shell"
```

### Task 3: Resilient Media and Editorial Home Page

**Files:**
- Create: `assets/js/media.js`
- Modify: `assets/js/app.js`
- Create: `tests/media.test.mjs`

**Interfaces:**
- Consumes: project records with `cover` and optional `video`; `window.matchMedia`-compatible predicates.
- Produces: `shouldAutoplayMedia({ reducedMotion, narrowViewport }) -> boolean`, `mediaMarkup(project, options) -> string`, and `applyMediaFallbacks(root) -> void`.

- [ ] **Step 1: Write media policy tests**

Create `tests/media.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldAutoplayMedia, mediaMarkup } from '../assets/js/media.js';

test('autoplay is disabled for reduced motion and narrow screens', () => {
  assert.equal(shouldAutoplayMedia({ reducedMotion: true, narrowViewport: false }), false);
  assert.equal(shouldAutoplayMedia({ reducedMotion: false, narrowViewport: true }), false);
  assert.equal(shouldAutoplayMedia({ reducedMotion: false, narrowViewport: false }), true);
});

test('projects without video render an accessible image', () => {
  const html = mediaMarkup({ title: 'Marine navigation', cover: 'images/map-2D.jpeg' });
  assert.match(html, /<img/);
  assert.match(html, /alt="Marine navigation"/);
  assert.doesNotMatch(html, /<video/);
});
```

- [ ] **Step 2: Run the media test and verify the module is missing**

Run: `node --test tests/media.test.mjs`

Expected: FAIL with module-not-found for `assets/js/media.js`.

- [ ] **Step 3: Implement the focused media module**

Implement HTML escaping within `media.js`, render `<video>` only when a non-empty local `video` value exists, otherwise render `<img>`, and attach one `error` listener per `[data-media]` element in `applyMediaFallbacks`. The fallback replaces failed media with `<div class="media-fallback" role="img" aria-label="…"><span>MVAS</span></div>`.

- [ ] **Step 4: Rebuild the homepage renderer**

Refactor `renderHome` in `assets/js/app.js` to render: numbered hero project, laboratory mission statement, three editorial featured-project rows, latest news, join callout, and contact lead-in. Use the media helpers for all project imagery, call `applyMediaFallbacks(main())` after each render, and retain real localized text from existing site/project/news data.

- [ ] **Step 5: Run media and data tests**

Run: `node --test tests/media.test.mjs tests/data-client.test.mjs`

Expected: all tests PASS.

- [ ] **Step 6: Commit the homepage and media behavior**

```bash
git add assets/js/media.js assets/js/app.js tests/media.test.mjs
git commit -m "feat: build editorial MVAS homepage"
```

### Task 4: Research Grid and Project Detail Experience

**Files:**
- Modify: `assets/js/app.js`
- Modify: `assets/css/site-shell.css`
- Create: `tests/page-rendering.test.mjs`

**Interfaces:**
- Consumes: `projectCard(project, index)`, `projectHref(slug)`, localized project data, and media helpers from Task 3.
- Produces: numbered research cards, tag-filter results, and localized project detail/404 markup.

- [ ] **Step 1: Add static renderer regression tests**

Create `tests/page-rendering.test.mjs` to read `assets/js/app.js` and assert the source contains stable semantic hooks:

```js
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
```

- [ ] **Step 2: Run the renderer test and verify new hooks are absent**

Run: `node --test tests/page-rendering.test.mjs`

Expected: FAIL for `project-index` and `project-backlink`.

- [ ] **Step 3: Implement editorial research cards and filtering**

Change `projectCard` to accept an index and render a zero-padded project number, large media area, tags, title, summary, and text-arrow link. Ensure re-rendered filtered cards receive consecutive visible indices and keep `research-count` live status accurate.

- [ ] **Step 4: Implement immersive project details and localized 404**

Add a research backlink, numbered metadata, wide media stage, challenge/method/outcome sections, and external links only when valid. Keep the missing-slug state localized and include the `project-backlink` return control.

- [ ] **Step 5: Add responsive research/detail CSS and run tests**

Style alternating project rows, compact tag controls, wide detail media, and stacked mobile facts. Run: `node --test tests/page-rendering.test.mjs tests/data-client.test.mjs tests/static-routes.test.mjs`

Expected: all tests PASS.

- [ ] **Step 6: Commit research and project pages**

```bash
git add assets/js/app.js assets/css/site-shell.css tests/page-rendering.test.mjs
git commit -m "feat: redesign research and project pages"
```

### Task 5: People, Publications, and Join Pages

**Files:**
- Modify: `assets/js/app.js`
- Modify: `assets/css/site-shell.css`
- Modify: `tests/page-rendering.test.mjs`
- Modify: `tests/data-client.test.mjs`

**Interfaces:**
- Consumes: localized people/publication/join datasets and `filterPublications(records, query, year, type)`.
- Produces: lead-person feature, responsive people groups, chronological publication rows, and a three-section recruitment layout.

- [ ] **Step 1: Extend renderer and filtering tests**

Add source assertions for `people-lead`, `publication-index`, and `join-contact`, plus a no-match publication-filter test:

```js
test('publication filtering returns an empty list for unmatched text', () => {
  const records = [{ title: 'Marine SLAM', summary: '', venue: '', year: 2024, type: 'conference' }];
  assert.deepEqual(filterPublications(records, 'quadruped', '', ''), []);
});
```

- [ ] **Step 2: Run targeted tests and verify new semantic hooks fail**

Run: `node --test tests/page-rendering.test.mjs tests/data-client.test.mjs`

Expected: renderer assertions FAIL while the new filter edge case PASSes.

- [ ] **Step 3: Rebuild the people renderer**

Feature the first `负责人` record as `people-lead`, render remaining groups with restrained portrait tiles, keep search across name/role/group, and display a localized empty state when no people match.

- [ ] **Step 4: Rebuild publications and join renderers**

Render publication years as a strong index column, preserve keyword/year/type filters and live count, and add a localized no-results message. Render join content as introduction, opportunities, preparation checklist, and prominent mail contact with `join-contact`.

- [ ] **Step 5: Add responsive page CSS and run the complete suite**

Style the lead portrait, member grids, publication timeline, filter toolbar, no-results state, and three-part join layout. Run: `node --test tests/*.test.mjs`

Expected: all tests PASS.

- [ ] **Step 6: Commit the remaining page families**

```bash
git add assets/js/app.js assets/css/site-shell.css tests/page-rendering.test.mjs tests/data-client.test.mjs
git commit -m "feat: redesign people publications and join pages"
```

### Task 6: Entry Metadata, Motion, and Final Cross-Site Verification

**Files:**
- Modify: `index.html`
- Modify: `index_zh.html`
- Modify: `index_en.html`
- Modify: `htmls/research_zh.html`
- Modify: `htmls/research_en.html`
- Modify: `htmls/project_zh.html`
- Modify: `htmls/project_en.html`
- Modify: `htmls/team_zh.html`
- Modify: `htmls/team_en.html`
- Modify: `htmls/publications_zh.html`
- Modify: `htmls/publications_en.html`
- Modify: `htmls/join_zh.html`
- Modify: `htmls/join_en.html`
- Modify: `assets/js/app.js`
- Modify: `assets/css/site-shell.css`
- Modify: `tests/static-routes.test.mjs`

**Interfaces:**
- Consumes: all shared CSS/JS and localized page entry points.
- Produces: complete metadata, progressive reveal behavior, and a fully verified static deployment.

- [ ] **Step 1: Add metadata and asset-path assertions**

Extend the public-page loop in `tests/static-routes.test.mjs`:

```js
assert.match(html, /<meta name="description" content="[^"]+">/);
assert.match(html, /<meta name="theme-color" content="#9E1B32">/);
assert.doesNotMatch(html, /https:\/\/fonts\.(?:googleapis|gstatic)\.com/);
```

- [ ] **Step 2: Run route tests and verify metadata is missing**

Run: `node --test tests/static-routes.test.mjs`

Expected: FAIL because entry pages do not yet include descriptions or theme color.

- [ ] **Step 3: Update every entry document head**

Add a concise localized meta description and `<meta name="theme-color" content="#9E1B32">` to all public entries. Keep all existing relative stylesheet and module paths unchanged.

- [ ] **Step 4: Add progressive enhancement for reveal motion**

After successful page rendering, add an IntersectionObserver only when reduced motion is not requested; it toggles `is-visible` on `[data-reveal]`. If IntersectionObserver is unavailable, mark every reveal element visible immediately. CSS must default content to visible and only animate when a `motion-ready` class is present on the document.

- [ ] **Step 5: Run automated verification**

Run: `node --test tests/*.test.mjs`

Expected: all tests PASS with zero skipped or failed tests.

Run: `git diff --check`

Expected: no whitespace errors.

- [ ] **Step 6: Perform local route smoke checks**

Start `python3 -m http.server 4173` from the repository root. Request every entry with `curl -I`, then request one valid project and one missing project query URL. Expected: each static resource returns HTTP 200; browser-rendered valid and missing project states remain navigable.

- [ ] **Step 7: Review responsive and accessible behavior**

Open the Chinese and English home, research, project, people, publications, and join pages at desktop and mobile widths. Verify visible keyboard focus, Escape-to-close menu behavior, no horizontal overflow, readable image fallbacks, localized empty/404 states, and no automatic motion under reduced-motion emulation.

- [ ] **Step 8: Commit final integration**

```bash
git add index.html index_zh.html index_en.html htmls assets/js/app.js assets/css/site-shell.css tests/static-routes.test.mjs
git commit -m "feat: complete bilingual MVAS site redesign"
```

- [ ] **Step 9: Record final repository state**

Run: `git status --short --branch && git log --oneline -8`

Expected: working tree clean; redesign commits appear above the approved design and plan commits.
