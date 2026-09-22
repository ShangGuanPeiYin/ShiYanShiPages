import test from 'node:test';
import assert from 'node:assert/strict';
import { toggleMobileMenu, closeMobileMenuOnEscape, renderSiteShell } from '../assets/js/site-shell.js';

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

function renderHeader(lang) {
  const originalDocument = globalThis.document;
  const originalWindow = globalThis.window;
  const header = { innerHTML: '' };
  const footer = { innerHTML: '' };
  const menu = element();
  const button = { ...element(), addEventListener() {} };
  const elements = new Map([
    ['#site-header', header],
    ['#site-footer', footer],
    ['#mobile-menu', menu],
    ['.menu-toggle', button],
  ]);

  globalThis.document = {
    body: { dataset: { lang, page: 'home' } },
    querySelector(selector) { return elements.get(selector); },
    addEventListener() {},
  };
  globalThis.window = { location: { search: '' } };

  try {
    renderSiteShell({
      labName: lang === 'zh' ? '测试实验室' : 'Test Laboratory',
      shortName: 'Test Lab',
      address: 'Test address',
      email: 'test@example.com',
      university: { name: 'Test University', url: 'https://example.com/' },
    }, lang);
    return header.innerHTML;
  } finally {
    if (originalDocument === undefined) delete globalThis.document;
    else globalThis.document = originalDocument;
    if (originalWindow === undefined) delete globalThis.window;
    else globalThis.window = originalWindow;
  }
}

test('language switch annotates only the target-language text', () => {
  const cases = [
    { lang: 'zh', target: 'en', label: 'English', aria: '切换至 English' },
    { lang: 'en', target: 'zh', label: '中文', aria: 'Switch to Chinese' },
  ];

  for (const item of cases) {
    const header = renderHeader(item.lang);
    const switchTag = header.match(/<a class="site-language__switch"[^>]*>/)?.[0] || '';
    assert.ok(switchTag.includes(`hreflang="${item.target}"`));
    assert.ok(switchTag.includes(`aria-label="${item.aria}"`));
    assert.doesNotMatch(switchTag, /\slang=/);
    assert.ok(header.includes(`<span class="site-language__value" lang="${item.target}">${item.label}</span>`));
  }
});
