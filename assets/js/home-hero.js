import { applyMediaFallbacks, mediaMarkup } from './media.js';

const escape = (value = '') => String(value).replace(/[&<>'"]/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
}[character]));
const copy = (lang, zh, en) => lang === 'en' ? en : zh;
const projectHref = (project, basePath, lang) => `${basePath}htmls/project_${lang}.html?project=${encodeURIComponent(project.slug)}`;

export function selectHeroProjects(projects) {
  const featured = projects.filter((project) => project.featured);
  return featured.length ? featured : projects;
}

export function heroMarkup(projects, { lang = 'zh', basePath = '', site = {} } = {}) {
  const project = projects[0];
  return `<section class="hero home-hero" id="hero" aria-labelledby="hero-title">
    <div class="home-hero__media"><div class="media-fallback" role="img" aria-label="${escape(site.shortName || 'MVAS')}"><span>MVAS</span></div></div>
    <div class="hero__content">
      <p class="home-hero__number" id="hero-number">${project ? `01 / ${String(projects.length).padStart(2, '0')}` : copy(lang, '暂无项目', 'No projects available')}</p>
      <p class="eyebrow">${copy(lang, '重点项目', 'Featured project')} · ${escape(site.shortName || 'MVAS Lab')}</p>
      <h1 id="hero-title">${escape(project?.title || site.tagline || copy(lang, '探索我们的研究', 'Explore our research'))}</h1>
      <p id="hero-summary">${escape(project?.summary || copy(lang, '研究项目正在整理中，请稍后再来浏览。', 'Research projects are being prepared. Please check back soon.'))}</p>
      <div class="button-row">${project ? `<a class="button button--solid" id="hero-link" href="${projectHref(project, basePath, lang)}">${copy(lang, '查看重点项目', 'View featured project')}</a>` : ''}<a class="button" href="${basePath}htmls/research_${lang}.html">${copy(lang, '浏览全部研究', 'Explore all research')}</a><button class="button" type="button" id="hero-play" aria-pressed="false" hidden>${copy(lang, '播放项目演示', 'Play project demo')}</button></div>
      <div class="home-hero__navigation" role="group" aria-label="${copy(lang, '切换重点项目', 'Choose featured project')}"${projects.length < 2 ? ' hidden' : ''}><button class="button" type="button" id="hero-previous" aria-controls="hero-title hero-summary">← ${copy(lang, '上一项目', 'Previous project')}</button><button class="button" type="button" id="hero-next" aria-controls="hero-title hero-summary">${copy(lang, '下一项目', 'Next project')} →</button></div>
      <p class="home-hero__status" id="hero-status" role="status" aria-live="polite"></p>
    </div>
  </section>`;
}

export function setupHomeHero(root, projects, { lang = 'zh', basePath = '', autoplay = false } = {}) {
  if (!projects.length) return;
  const media = root.querySelector('.home-hero__media');
  const play = root.querySelector('#hero-play');
  const status = root.querySelector('#hero-status');
  let index = 0;
  let currentVideo = null;

  const syncPlayback = (video) => {
    if (root.querySelector('video') !== video) return;
    play.hidden = !video;
    play.setAttribute('aria-pressed', String(Boolean(video && !video.paused)));
    play.textContent = video && !video.paused
      ? copy(lang, '暂停项目演示', 'Pause project demo')
      : copy(lang, '播放项目演示', 'Play project demo');
  };

  const render = (nextIndex, announce = true) => {
    root.querySelector('video')?.pause();
    index = (nextIndex + projects.length) % projects.length;
    const project = projects[index];
    const number = `${String(index + 1).padStart(2, '0')} / ${String(projects.length).padStart(2, '0')}`;
    media.innerHTML = mediaMarkup(project, { basePath, autoplay, controls: true });
    root.querySelector('#hero-title').textContent = project.title;
    root.querySelector('#hero-summary').textContent = project.summary || '';
    root.querySelector('#hero-number').textContent = number;
    root.querySelector('#hero-link').href = projectHref(project, basePath, lang);
    status.textContent = announce ? `${number}: ${project.title}` : '';
    play.disabled = false;
    applyMediaFallbacks(root);
    const video = root.querySelector('video');
    currentVideo = video;
    syncPlayback(video);
    if (video) {
      for (const event of ['play', 'pause', 'ended']) video.addEventListener(event, () => syncPlayback(video));
      video.addEventListener('error', () => {
        if (currentVideo !== video) return;
        play.hidden = true;
        play.setAttribute('aria-pressed', 'false');
        status.textContent = copy(lang, '无法播放项目演示，请查看项目详情。', 'Unable to play this demo. Please view the project details.');
      }, { once: true });
    }
  };

  root.querySelector('#hero-previous').addEventListener('click', () => render(index - 1));
  root.querySelector('#hero-next').addEventListener('click', () => render(index + 1));
  play.addEventListener('click', async () => {
    const video = root.querySelector('video');
    if (!video) return;
    if (!video.paused) { video.pause(); return; }
    play.disabled = true;
    status.textContent = '';
    try {
      video.controls = true;
      await video.play();
    } catch {
      if (root.querySelector('video') === video) {
        status.textContent = copy(lang, '无法播放项目演示，请重试或查看项目详情。', 'Unable to play this demo. Try again or view the project details.');
      }
    } finally {
      if (root.querySelector('video') === video) {
        play.disabled = false;
        syncPlayback(video);
      }
    }
  });
  render(0, false);
}
