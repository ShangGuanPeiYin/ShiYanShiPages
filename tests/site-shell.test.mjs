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
