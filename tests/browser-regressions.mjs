import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
// Run separately: CHROME_BIN=/path/to/chrome node tests/browser-regressions.mjs
assert.ok(process.env.CHROME_BIN, 'Set CHROME_BIN to a local Chromium executable.');
const cwd = fileURLToPath(new URL('../', import.meta.url));
let dataMode = '';
const server = createServer(async (req, res) => {
  try {
    const path = new URL(req.url, 'http://localhost').pathname;
    let body = await readFile(cwd + (path === '/' ? '/index_zh.html' : path));
    if (path.endsWith('/projects.json') && dataMode) {
      const projects = JSON.parse(body);
      body = JSON.stringify(dataMode === 'empty' ? [] : projects.map(p => ({ ...p, featured: false })));
    }
    res.setHeader('Content-Type', ({ html: 'text/html', js: 'text/javascript', css: 'text/css', json: 'application/json' })[path.split('.').pop()] || 'application/octet-stream');
    res.end(body);
  } catch { res.writeHead(404); res.end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;
const profile = await mkdtemp(join(tmpdir(), 'mvas-browser-'));
const chrome = spawn(process.env.CHROME_BIN, ['--headless', '--no-sandbox', '--disable-gpu', '--disable-background-networking', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank']);
const chromeExited = new Promise(resolve => chrome.on('exit', resolve));
const endpoint = await new Promise((resolve, reject) => {
  let output = '';
  chrome.stderr.on('data', chunk => { output += chunk; const match = output.match(/DevTools listening on (ws:\/\/[^\s]+)/); if (match) resolve(match[1]); });
  chrome.on('error', reject);
  chrome.on('exit', code => reject(new Error(`Chromium exited ${code}: ${output}`)));
});
const socket = new WebSocket(endpoint);
await new Promise(resolve => socket.addEventListener('open', resolve, { once: true }));
let id = 0;
const pending = new Map();
socket.addEventListener('message', event => { const message = JSON.parse(event.data); if (message.id) { const { resolve, reject } = pending.get(message.id); pending.delete(message.id); message.error ? reject(message.error) : resolve(message.result); } });
function send(method, params = {}, sessionId) { return new Promise((resolve, reject) => { pending.set(++id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params, sessionId })); }); }
const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
const call = (method, params) => send(method, params, sessionId);
const evaluate = async expression => { const result = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (result.exceptionDetails) throw new Error(result.exceptionDetails.text + ': ' + result.exceptionDetails.exception?.description); return result.result.value; };
await call('Page.enable');
async function page(path, width = 1440) {
  await call('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: false });
  await call('Page.navigate', { url: `http://127.0.0.1:${port}/${path}` });
  await evaluate(`new Promise((resolve,reject)=>{const start=Date.now();const tick=()=>{if(document.querySelector('#page-main h1')) resolve(true); else if(Date.now()-start>5000) reject(new Error('Page render timed out')); else setTimeout(tick,30);};tick();})`);
}
let failures = 0;
async function check(name, action) { try { await action(); console.log('PASS', name); } catch (error) { failures++; console.log('FAIL', name, error.message); } }
try {
  for (const route of ['team_zh', 'publications_en']) await check(`${route} 390px search label has no vertical flex gap`, async () => {
    await page(`htmls/${route}.html`, 390);
    const box = await evaluate(`(()=>{const x=document.querySelector('.filters label');return {height:x.getBoundingClientRect().height,basis:getComputedStyle(x).flexBasis};})()`);
    console.log('  label', box);
    assert.ok(box.height < 150, `label height ${box.height}px (flex-basis ${box.basis})`);
  });
  for (const width of [800, 1024]) await check(`research ${width}px card media remains legible without overflow`, async () => {
    await page('htmls/research_en.html', width);
    const sizes = await evaluate(`({width:innerWidth,scroll:document.documentElement.scrollWidth,media:[...document.querySelectorAll('.project-card__media')].map(x=>x.getBoundingClientRect().width)})`);
    console.log('  geometry', sizes);
    assert.ok(sizes.scroll <= sizes.width, 'horizontal overflow');
    assert.ok(sizes.media.every(value => value >= 220), `media widths ${sizes.media}`);
  });
  await check('project index keeps accent and intended line height', async () => {
    const style = await evaluate(`(()=>{const s=getComputedStyle(document.querySelector('.project-index'));return {color:s.color,accent:s.getPropertyValue('--color-accent'),line:parseFloat(s.lineHeight),font:parseFloat(s.fontSize),margin:parseFloat(s.marginBottom)};})()`);
    assert.equal(style.color, 'rgb(158, 27, 50)'); assert.ok(style.margin > 0); assert.ok(style.line <= style.font * 1.1);
  });
  for (const lang of ['zh', 'en']) await check(`${lang} hero keyboard navigation keeps title, media, link, counter and focus synchronized`, async () => {
    await page(`index_${lang}.html`);
    const before = await evaluate(`({title:document.querySelector('#hero h1').textContent,source:document.querySelector('#hero img').src})`);
    assert.equal(await evaluate(`Boolean(document.querySelector('#hero-next'))`), true, 'missing next button');
    await evaluate(`document.querySelector('#hero-next').focus()`);
    await call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r', unmodifiedText: '\r' });
    await call('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
    const after = await evaluate(`({title:document.querySelector('#hero h1').textContent,source:document.querySelector('#hero img').src,link:document.querySelector('#hero-link').href,number:document.querySelector('#hero-number').textContent,focus:document.activeElement.id})`);
    assert.notEqual(after.title, before.title); assert.notEqual(after.source, before.source); assert.match(after.number, /02.*03/); assert.equal(after.focus, 'hero-next'); assert.match(after.link, new RegExp('project_' + lang));
  });
  await check('hero overlay allows video controls and text remains selectable', async () => {
    await page('index_zh.html');
    assert.equal(await evaluate(`getComputedStyle(document.querySelector('#hero'),'::after').pointerEvents`), 'none');
    assert.equal(await evaluate(`getComputedStyle(document.querySelector('#hero h1')).pointerEvents`), 'auto');
    const hit = await evaluate(`(()=>{const stage=document.querySelector('.home-hero__media');stage.innerHTML='<video controls></video>';const hero=document.querySelector('#hero'),r=hero.getBoundingClientRect();return document.elementFromPoint(r.right-30,r.bottom-20)?.tagName;})()`);
    assert.equal(hit, 'VIDEO');
  });
  for (const filtered of [false, true]) await check(`people portrait errors use accessible fallback (${filtered ? 'after search' : 'initial'})`, async () => {
    await page('htmls/team_en.html');
    if (filtered) await evaluate(`(()=>{const field=document.querySelector('#people-filter');field.value=document.querySelector('.person-card h3').textContent;field.dispatchEvent(new Event('input',{bubbles:true}));})()`);
    const result = await evaluate(`(()=>{const image=document.querySelector('#people-list img');const label=image.alt;const parent=image.parentElement;image.dispatchEvent(new Event('error'));const replacement=parent.querySelector('.media-fallback');return {label,role:replacement?.getAttribute('role'),alt:replacement?.getAttribute('aria-label')};})()`);
    assert.equal(result.role, 'img'); assert.equal(result.alt, result.label);
  });
  await check('lead and member portrait fallbacks share the centered placeholder layout', async () => {
    await page('htmls/team_en.html');
    const displays = await evaluate(`['.people-lead__portrait','.person-card'].map(selector=>{const container=document.querySelector(selector);container.querySelector('img')?.dispatchEvent(new Event('error'));return getComputedStyle(container.querySelector('.media-fallback')).display;})`);
    assert.deepEqual(displays, ['grid', 'grid']);
  });
  for (const lang of ['zh', 'en']) await check(`${lang} playback rejection is handled, and newly switched images have fallback handling`, async () => {
    await page(`index_${lang}.html`);
    const result = await evaluate(`(async()=>{
      const { heroMarkup, setupHomeHero } = await import('./assets/js/home-hero.js');
      const projects = [{slug:'demo',title:'Demo',cover:'images/team_photo.jpg',video:'videos/demo.mp4'},{slug:'image',title:'Image',cover:'images/map3D.jpeg'}];
      const options = {lang:${JSON.stringify(lang)},autoplay:false};
      document.querySelector('#hero').outerHTML=heroMarkup(projects,options);
      const root=document.querySelector('#hero');setupHomeHero(root,projects,options);
      let unhandled=0;window.addEventListener('unhandledrejection',()=>unhandled++);
      root.querySelector('video').play=()=>Promise.reject(new Error('Playback denied'));
      root.querySelector('#hero-play').click();
      await Promise.resolve();await Promise.resolve();
      const message=root.querySelector('#hero-status').textContent;
      const disabled=root.querySelector('#hero-play').disabled;
      root.querySelector('#hero-next').click();root.querySelector('img').dispatchEvent(new Event('error'));
      return {message,disabled,unhandled,fallback:root.querySelector('.home-hero__media .media-fallback')?.getAttribute('aria-label'),playHidden:root.querySelector('#hero-play').hidden};
    })()`);
    assert.match(result.message, lang === 'zh' ? /无法播放/ : /Unable to play/);
    assert.equal(result.disabled, false); assert.equal(result.unhandled, 0);
    assert.equal(result.fallback, 'Image'); assert.equal(result.playHidden, true);
  });
  for (const mode of ['empty', 'unfeatured']) await check(`${mode} project collection renders a valid homepage`, async () => {
    dataMode = mode; await page('index_en.html'); dataMode = '';
    assert.equal(await evaluate(`Boolean(document.querySelector('#hero'))`), true);
    assert.equal(await evaluate(`document.querySelector('#hero').textContent.includes('01 / 00')`), false);
    if (mode === 'empty') assert.equal(await evaluate(`Boolean(document.querySelector('#hero a[href*="project="]'))`), false);
  });
  for (const width of [320, 390, 768, 1024, 1440]) await check(`homepage and people/publication filters fit ${width}px`, async () => {
    for (const route of ['index_en.html', 'htmls/team_en.html', 'htmls/publications_zh.html']) {
      await page(route, width);
      const size=await evaluate(`({width:innerWidth,scroll:document.documentElement.scrollWidth})`);
      assert.ok(size.scroll <= size.width, `${route}: ${size.scroll}px exceeds ${size.width}px`);
    }
  });
} finally {
  await send('Browser.close');
  socket.close(); server.close();
  await chromeExited;
  await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
}
console.log(`Browser regressions: ${failures} failed`);
process.exitCode = failures ? 1 : 0;
