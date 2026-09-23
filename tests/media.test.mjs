import test from 'node:test';
import assert from 'node:assert/strict';
import { applyMediaFallbacks, mediaMarkup, shouldAutoplayMedia } from '../assets/js/media.js';

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

test('remote video URLs fall back to the project cover', () => {
  for (const video of ['https://cdn.example/video.mp4', '//cdn.example/video.mp4', 'data:video/mp4;base64,AAAA']) {
    const html = mediaMarkup({ title: 'Remote demo', cover: 'images/cover.jpg', video });
    assert.match(html, /<img/);
    assert.doesNotMatch(html, /<video/);
    assert.doesNotMatch(html, /cdn\.example|data:video/);
  }
});

test('local video markup puts the escaped MP4 source on the video element', () => {
  const html = mediaMarkup(
    { title: 'Vision < Control', cover: 'images/a&b.jpg', video: 'videos/demo.mp4' },
    { basePath: '../' },
  );
  const openingTag = html.match(/^<video[^>]*>/)?.[0] || '';

  assert.match(openingTag, / data-media/);
  assert.match(openingTag, /aria-label="Vision &lt; Control"/);
  assert.match(openingTag, /poster="\.\.\/images\/a&amp;b\.jpg"/);
  assert.match(openingTag, /src="\.\.\/videos\/demo\.mp4"/);
  assert.doesNotMatch(html, /<source/);
});

test('local video markup can expose playback controls without autoplay', () => {
  const html = mediaMarkup(
    { title: 'Robot demo', cover: '/images/robot.jpg', video: '/videos/robot.mp4' },
    { controls: true },
  );

  assert.match(html, / controls(?:\s|>)/);
  assert.doesNotMatch(html, / autoplay(?:\s|>)/);
});

test('autoplay video exposes native controls so playback can be paused', () => {
  const html = mediaMarkup(
    { title: 'Robot demo', cover: '/images/robot.jpg', video: '/videos/robot.mp4' },
    { autoplay: true },
  );
  const openingTag = html.match(/^<video[^>]*>/)?.[0] || '';

  assert.match(openingTag, / autoplay(?:\s|>)/);
  assert.match(openingTag, / controls(?:\s|>)/);
});

test('media fallbacks bind once and replace failed media accessibly', () => {
  const listeners = [];
  let replacement;
  const media = {
    ownerDocument: {
      createElement(tagName) {
        return {
          tagName,
          children: [],
          attributes: new Map(),
          setAttribute(name, value) { this.attributes.set(name, value); },
          append(child) { this.children.push(child); },
        };
      },
    },
    getAttribute(name) {
      return name === 'alt' ? 'Marine navigation' : null;
    },
    addEventListener(type, listener, options) {
      listeners.push({ type, listener, options });
    },
    replaceWith(node) { replacement = node; },
  };
  const root = { querySelectorAll: () => [media] };

  applyMediaFallbacks(root);
  applyMediaFallbacks(root);

  assert.equal(listeners.length, 1);
  assert.equal(listeners[0].type, 'error');
  assert.deepEqual(listeners[0].options, { once: true });

  listeners[0].listener();
  assert.equal(replacement.tagName, 'div');
  assert.equal(replacement.className, 'media-fallback');
  assert.equal(replacement.attributes.get('role'), 'img');
  assert.equal(replacement.attributes.get('aria-label'), 'Marine navigation');
  assert.equal(replacement.children[0].tagName, 'span');
  assert.equal(replacement.children[0].textContent, 'MVAS');
});
