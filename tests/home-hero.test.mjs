import test from 'node:test';
import assert from 'node:assert/strict';
import { heroMarkup, selectHeroProjects, setupHomeHero } from '../assets/js/home-hero.js';

const projects = [
  { slug: 'robot', title: 'Robot', summary: 'Walking research', cover: 'images/robot.jpg', video: 'videos/robot.mp4', featured: true },
  { slug: 'marine', title: 'Marine', summary: 'Navigation research', cover: 'images/marine.jpg', featured: true },
];

function element() {
  return {
    textContent: '', hidden: false, disabled: false, attributes: new Map(), listeners: new Map(),
    setAttribute(name, value) { this.attributes.set(name, value); },
    addEventListener(name, listener) { this.listeners.set(name, [...(this.listeners.get(name) || []), listener]); },
    async fire(name) { for (const listener of this.listeners.get(name) || []) await listener(); },
  };
}

function fixture() {
  const ids = ['hero-title', 'hero-summary', 'hero-number', 'hero-link', 'hero-play', 'hero-status', 'hero-previous', 'hero-next'];
  const elements = Object.fromEntries(ids.map((id) => [id, element()]));
  const media = { ...element(), innerHTML: '' };
  let video;
  Object.defineProperty(media, 'innerHTML', {
    get() { return this.markup || ''; },
    set(value) {
      this.markup = value;
      video = value.startsWith('<video') ? {
        ...element(), paused: true, controls: false,
        async play() { this.paused = false; await this.fire('play'); },
        pause() { this.paused = true; this.fire('pause'); },
        getAttribute() { return 'Robot'; },
        ownerDocument: { createElement: () => ({ ...element(), append() {} }) },
        replaceWith(replacement) { if (video === this) { video = null; media.markup = replacement.className; } },
      } : null;
    },
  });
  const root = {
    querySelector(selector) {
      if (selector === '.home-hero__media') return media;
      if (selector === 'video') return video;
      return elements[selector.slice(1)];
    },
    querySelectorAll(selector) {
      assert.equal(selector, '[data-media]');
      return video ? [video] : [];
    },
  };
  return { root, elements, media, get video() { return video; } };
}

test('hero uses all projects when none are featured, and accepts empty projects', () => {
  assert.deepEqual(selectHeroProjects([{ ...projects[0], featured: false }, projects[1]]), [projects[1]]);
  const unfeatured = projects.map((project) => ({ ...project, featured: false }));
  assert.deepEqual(selectHeroProjects(unfeatured), unfeatured);
  assert.deepEqual(selectHeroProjects([]), []);
  assert.doesNotMatch(heroMarkup([], { lang: 'en' }), /01\s*<\/span>\s*\/\s*00|undefined|project=undefined/);
  assert.match(heroMarkup([], { lang: 'en' }), /No projects available/);
});

test('hero switches media, title, link, number and playback state, and wraps in both directions', async () => {
  const view = fixture();
  setupHomeHero(view.root, projects, { lang: 'en', basePath: '../', autoplay: false });
  const firstVideo = view.video;
  assert.equal(view.elements['hero-title'].textContent, 'Robot');
  assert.match(view.media.innerHTML, /src="\.\.\/videos\/robot.mp4"/);
  assert.equal(view.elements['hero-number'].textContent, '01 / 02');
  assert.equal(view.elements['hero-play'].hidden, false);
  await view.elements['hero-play'].fire('click');
  assert.equal(firstVideo.paused, false);
  assert.equal(view.elements['hero-play'].attributes.get('aria-pressed'), 'true');

  await view.elements['hero-next'].fire('click');
  assert.equal(firstVideo.paused, true);
  assert.equal(view.elements['hero-title'].textContent, 'Marine');
  assert.equal(view.elements['hero-summary'].textContent, 'Navigation research');
  assert.equal(view.elements['hero-link'].href, '../htmls/project_en.html?project=marine');
  assert.equal(view.elements['hero-number'].textContent, '02 / 02');
  assert.match(view.media.innerHTML, /src="\.\.\/images\/marine.jpg"/);
  assert.equal(view.elements['hero-play'].hidden, true);
  await view.elements['hero-next'].fire('click');
  assert.equal(view.elements['hero-title'].textContent, 'Robot');
  assert.equal(view.elements['hero-play'].attributes.get('aria-pressed'), 'false');
  assert.ok(view.video.listeners.has('error'), 'new media receives fallback handling');
  await view.elements['hero-previous'].fire('click');
  assert.equal(view.elements['hero-title'].textContent, 'Marine');
});

test('rejected video playback stays handled and reports localized feedback', async () => {
  for (const lang of ['zh', 'en']) {
    const view = fixture();
    setupHomeHero(view.root, projects, { lang, autoplay: false });
    view.video.play = async () => { throw new Error('Blocked playback'); };
    await assert.doesNotReject(() => view.elements['hero-play'].fire('click'));
    assert.match(view.elements['hero-status'].textContent, lang === 'zh' ? /无法播放/ : /Unable to play/);
    assert.equal(view.elements['hero-play'].disabled, false);
    assert.equal(view.elements['hero-play'].attributes.get('aria-pressed'), 'false');
  }
});

test('late playback rejection cannot overwrite the newly selected project state', async () => {
  const view = fixture();
  setupHomeHero(view.root, projects, { lang: 'en', autoplay: false });
  let reject;
  view.video.play = () => new Promise((resolve, rejectPlayback) => { reject = rejectPlayback; });
  const pending = view.elements['hero-play'].fire('click');
  await view.elements['hero-next'].fire('click');
  reject(new Error('Previous video failed'));
  await pending;
  assert.doesNotMatch(view.elements['hero-status'].textContent, /Unable/);
  assert.equal(view.elements['hero-play'].hidden, true);
  assert.equal(view.elements['hero-play'].disabled, false);
});

test('a detached video error cannot replace the newly selected project announcement', async () => {
  const view = fixture();
  setupHomeHero(view.root, projects, { lang: 'en' });
  const oldVideo = view.video;
  await view.elements['hero-next'].fire('click');
  await oldVideo.fire('error');
  assert.equal(view.elements['hero-status'].textContent, '02 / 02: Marine');
});

test('failed current video uses the media fallback and hides playback controls', async () => {
  const view = fixture();
  setupHomeHero(view.root, projects, { lang: 'en' });
  await view.video.fire('error');
  assert.equal(view.media.innerHTML, 'media-fallback');
  assert.equal(view.elements['hero-play'].hidden, true);
  assert.equal(view.elements['hero-play'].attributes.get('aria-pressed'), 'false');
  assert.match(view.elements['hero-status'].textContent, /Unable to play/);
});
