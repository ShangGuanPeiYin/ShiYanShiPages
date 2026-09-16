import { loadJson, normalizeLinks, showPageError, validateCollection } from './data-client.js';
import { filterPublications } from './publication-filter.js';
import { renderSiteShell } from './site-shell.js';

const main = () => document.querySelector('#page-main');
const language = () => document.body.dataset.lang === 'en' ? 'en' : 'zh';
const copy = (zh, en) => language() === 'zh' ? zh : en;
const escape = (value = '') => String(value).replace(/[&<>'"]/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
}[character]));

function rootPath() {
  const root = new URL('../../', import.meta.url).pathname;
  return new URL('.', window.location.href).pathname === root ? '' : '../';
}

async function dataset(name) {
  return loadJson(`${rootPath()}data/${language()}/${name}.json`);
}

function projectHref(slug) {
  return `${rootPath()}htmls/project_${language()}.html?project=${encodeURIComponent(slug)}`;
}

function projectCard(project) {
  const media = project.video
    ? `<video muted loop playsinline preload="metadata" poster="${escape(rootPath() + project.cover)}"><source src="${escape(project.video)}" type="video/mp4"></video>`
    : `<img src="${escape(rootPath() + project.cover)}" alt="">`;
  return `<article class="project-card">
    ${media}
    <div class="project-card__body">
      <p class="eyebrow">${escape(project.tags?.[0] || 'MVAS')}</p>
      <h3>${escape(project.title)}</h3>
      <p>${escape(project.summary)}</p>
      <div class="tag-list">${(project.tags || []).map((tag) => `<span>${escape(tag)}</span>`).join('')}</div>
      <a class="button" href="${projectHref(project.slug)}">${copy('查看项目', 'View project')}</a>
    </div>
  </article>`;
}

function pageIntro(label, title, description) {
  return `<section class="page-wrap"><div class="section-heading"><div><p class="eyebrow">${escape(label)}</p><h1>${escape(title)}</h1></div><p>${escape(description)}</p></div>`;
}

async function renderHome() {
  const [site, projects, news] = await Promise.all([dataset('site'), dataset('projects'), dataset('news')]);
  validateCollection('projects', projects);
  validateCollection('news', news);
  const featured = projects.filter((project) => project.featured);
  const shouldAutoplay = !window.matchMedia('(prefers-reduced-motion: reduce), (max-width: 47.99rem)').matches;
  const latestNews = [...news].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
  main().innerHTML = `<section class="hero" id="hero">
    <video${shouldAutoplay ? ' autoplay' : ''} muted loop playsinline preload="metadata" poster="${escape(rootPath() + projects[0].cover)}"><source src="${escape(projects[0].video)}" type="video/mp4"></video>
    <div class="hero__content">
      <p class="eyebrow">${escape(site.shortName)}</p>
      <h1>${escape(site.tagline)}</h1>
      <p>${escape(site.department)}</p>
      <div class="button-row"><a class="button button--solid" href="${rootPath()}htmls/research_${language()}.html">${copy('探索研究项目', 'Explore our work')}</a><a class="button" href="${rootPath()}htmls/join_${language()}.html">${copy('加入实验室', 'Join the lab')}</a>${shouldAutoplay ? '' : `<button class="button" type="button" id="hero-play">${copy('播放项目演示', 'Play project demo')}</button>`}</div>
    </div>
  </section>
  <section class="content-section" id="featured-projects"><div class="page-wrap"><div class="section-heading"><div><p class="eyebrow">${copy('成果优先', 'Work first')}</p><h2>${copy('在真实环境中验证自主系统', 'Autonomous systems, validated in the physical world')}</h2></div></div><div class="project-grid">${featured.map(projectCard).join('')}</div></div></section>
  <section class="content-section content-section--panel" id="latest-news"><div class="page-wrap"><div class="section-heading"><div><p class="eyebrow">${copy('实验室动态', 'News')}</p><h2>${copy('近期动态', 'Latest updates')}</h2></div></div><div class="news-list">${latestNews.map((item) => `<article class="news-item"><time datetime="${escape(item.date)}">${escape(item.date)}</time><div><h3>${escape(item.title)}</h3><p>${escape(item.summary)}</p></div></article>`).join('')}</div></div></section>
  <section class="content-section" id="join-cta"><div class="page-wrap"><div class="join-grid"><section><p class="eyebrow">${copy('加入我们', 'Join us')}</p><h2>${copy('把研究变成真实系统', 'Turn research into real systems')}</h2><p>${copy('欢迎对机器视觉、机器人和自主系统感兴趣的同学联系实验室。', 'Students interested in machine vision, robotics, and autonomous systems are welcome to get in touch.')}</p><a class="button button--solid" href="${rootPath()}htmls/join_${language()}.html">${copy('了解招募信息', 'Learn about opportunities')}</a></section></div></div></section>`;
  document.querySelector('#hero-play')?.addEventListener('click', async () => {
    const video = document.querySelector('#hero video');
    video.controls = true;
    await video.play();
  });
}

async function renderResearch() {
  const projects = validateCollection('projects', await dataset('projects'));
  const tags = [...new Set(projects.flatMap((project) => project.tags || []))];
  const renderProjects = (filtered) => `<p id="research-count" aria-live="polite">${copy(`显示 ${filtered.length} 个项目`, `Showing ${filtered.length} projects`)}</p><div class="project-grid">${filtered.map(projectCard).join('')}</div>`;
  main().innerHTML = `${pageIntro(copy('研究', 'Research'), copy('从感知到行动的闭环系统', 'Closed-loop systems from perception to action'), copy('我们围绕机器视觉、机器人与自主系统构建能够进入真实场景的研究平台。', 'We develop research platforms in machine vision, robotics, and autonomous systems for real-world settings.'))}<div class="button-row" aria-label="${copy('研究方向筛选', 'Research tag filter')}"><button class="button button--solid" type="button" data-tag="">${copy('全部', 'All')}</button>${tags.map((tag) => `<button class="button" type="button" data-tag="${escape(tag)}">${escape(tag)}</button>`).join('')}</div><div id="research-list">${renderProjects(projects)}</div></section>`;
  document.querySelectorAll('[data-tag]').forEach((button) => button.addEventListener('click', () => {
    const tag = button.dataset.tag;
    document.querySelector('#research-list').innerHTML = renderProjects(tag ? projects.filter((project) => project.tags.includes(tag)) : projects);
    document.querySelectorAll('[data-tag]').forEach((item) => item.classList.toggle('button--solid', item === button));
  }));
}

async function renderProject() {
  const projects = validateCollection('projects', await dataset('projects'));
  const slug = new URLSearchParams(window.location.search).get('project') || new URLSearchParams(window.location.search).get('slug');
  const project = projects.find((item) => item.slug === slug);
  if (!project) {
    main().innerHTML = `<section class="page-wrap"><p class="eyebrow">404</p><h1>${copy('未找到该项目', 'Project not found')}</h1><p class="project-copy">${copy('该项目链接可能已失效。', 'This project link may be out of date.')}</p><a class="button" href="${rootPath()}htmls/research_${language()}.html">${copy('返回研究页', 'Back to research')}</a></section>`;
    return;
  }
  const links = normalizeLinks(project);
  main().innerHTML = `<section class="page-wrap"><div class="project-hero"><p class="eyebrow">${escape((project.tags || []).join(' / '))}</p><h1>${escape(project.title)}</h1><p class="project-copy">${escape(project.summary)}</p></div><div class="project-detail"><div>${project.video ? `<video controls playsinline preload="metadata" poster="${escape(rootPath() + project.cover)}"><source src="${escape(project.video)}" type="video/mp4"></video>` : `<img src="${escape(rootPath() + project.cover)}" alt="">`}</div><aside class="project-facts"><section><h2>${copy('挑战', 'Challenge')}</h2><p>${escape(project.challenge)}</p></section><section><h2>${copy('方法', 'Approach')}</h2><p>${escape(project.approach)}</p></section>${project.outcomes?.length ? `<section><h2>${copy('成果', 'Outcomes')}</h2><ul>${project.outcomes.map((outcome) => `<li>${escape(outcome)}</li>`).join('')}</ul></section>` : ''}${links.length ? `<div class="project-links">${links.map((link) => `<a href="${escape(link.href)}" target="_blank" rel="noreferrer">${escape(link.label)}</a>`).join('')}</div>` : ''}</aside></div></section>`;
}

function personCard(person) {
  const links = [
    person.email ? { label: 'Email', href: `mailto:${person.email}` } : null,
    person.homepage ? { label: 'Home', href: person.homepage } : null,
    person.scholar ? { label: 'Scholar', href: person.scholar } : null,
    person.github ? { label: 'GitHub', href: person.github } : null,
  ].filter(Boolean);
  return `<article class="person-card"><img src="${escape(rootPath() + person.photo)}" alt="${escape(person.name)}"><div class="person-card__body"><h3>${escape(person.name)}</h3><p>${escape(person.role)}</p>${links.length ? `<div class="person-links">${links.map((link) => `<a href="${escape(link.href)}"${link.href.startsWith('http') ? ' target="_blank" rel="noreferrer"' : ''}>${link.label}</a>`).join('')}</div>` : ''}</div></article>`;
}

async function renderPeople() {
  const people = await dataset('people');
  const groups = [...new Set(people.map((person) => person.group))];
  const renderGroups = (records) => groups.map((group) => `<section class="people-section"><h2>${escape(group)}</h2><div class="people-grid">${records.filter((person) => person.group === group).map(personCard).join('')}</div></section>`).join('');
  main().innerHTML = `${pageIntro(copy('成员', 'People'), copy('让研究进入现实的人', 'The people who bring research into the world'), copy('MVAS Lab 由来自机器人、控制与视觉交叉领域的研究人员和学生组成。', 'MVAS Lab brings together researchers and students across robotics, control, and vision.'))}<div class="filters"><label><span class="eyebrow">${copy('筛选', 'Filter')}</span><input id="people-filter" type="search" placeholder="${copy('按姓名或角色检索', 'Search name or role')}"></label></div><div id="people-list">${renderGroups(people)}</div></section>`;
  document.querySelector('#people-filter').addEventListener('input', (event) => {
    const query = event.target.value.trim().toLocaleLowerCase();
    document.querySelector('#people-list').innerHTML = renderGroups(people.filter((person) => `${person.name} ${person.role} ${person.group}`.toLocaleLowerCase().includes(query)));
  });
}

function legacyPublication(record, index) {
  return {
    slug: `legacy-${index}`,
    title: record.title_en,
    summary: [record.authors, record.venue].filter(Boolean).join(' · '),
    cover: 'images/pdf_icon.png',
    year: String(record.year || ''),
    venue: record.venue || '',
    doi: record.doi || '',
    pdf: record.pdf || '',
    video: record.video || '',
    code: record.code || '',
  };
}

function publicationCard(publication) {
  const links = normalizeLinks(publication);
  return `<article class="publication-card"><div class="publication-year">${escape(publication.year)}</div><div><h3>${escape(publication.title)}</h3><p>${escape(publication.summary)}</p>${publication.venue ? `<p>${escape(publication.venue)}</p>` : ''}${links.length ? `<div class="project-links">${links.map((link) => `<a href="${escape(link.href)}" target="_blank" rel="noreferrer">${escape(link.label)}</a>`).join('')}</div>` : ''}</div></article>`;
}

async function renderPublications() {
  const [curated, legacy] = await Promise.all([dataset('publications'), loadJson(`${rootPath()}htmls/publications.json`)]);
  const publications = [...curated, ...legacy.map(legacyPublication)].filter((publication, index, records) => !publication.doi || records.findIndex((item) => item.doi === publication.doi) === index).sort((a, b) => Number(b.year) - Number(a.year));
  const years = [...new Set(publications.map((publication) => publication.year).filter(Boolean))];
  const types = [...new Set(publications.map((publication) => publication.type).filter(Boolean))];
  const renderPublications = (records) => `<p id="publication-count" aria-live="polite">${copy(`显示 ${records.length} 篇成果`, `Showing ${records.length} publications`)}</p>${records.map(publicationCard).join('')}`;
  main().innerHTML = `${pageIntro(copy('学术成果', 'Publications'), copy('将方法沉淀为可检验的知识', 'Methods made into testable knowledge'), copy('论文条目沿用已有英文原文，外部链接仅在真实链接可用时展示。', 'Publication titles retain their original English form; external links appear only when a valid destination is available.'))}<div class="filters"><label><span class="eyebrow">${copy('筛选', 'Filter')}</span><input id="publication-filter" type="search" placeholder="${copy('按标题、作者或期刊检索', 'Search title, author, or venue')}"></label><label><span class="eyebrow">${copy('年份', 'Year')}</span><select id="publication-year"><option value="">${copy('全部年份', 'All years')}</option>${years.map((year) => `<option value="${escape(year)}">${escape(year)}</option>`).join('')}</select></label><label><span class="eyebrow">${copy('类型', 'Type')}</span><select id="publication-type"><option value="">${copy('全部类型', 'All types')}</option>${types.map((type) => `<option value="${escape(type)}">${escape(type)}</option>`).join('')}</select></label></div><div class="publication-list" id="publication-list">${renderPublications(publications)}</div></section>`;
  const update = () => {
    document.querySelector('#publication-list').innerHTML = renderPublications(filterPublications(publications, document.querySelector('#publication-filter').value, document.querySelector('#publication-year').value, document.querySelector('#publication-type').value));
  };
  ['publication-filter', 'publication-year', 'publication-type'].forEach((id) => document.querySelector(`#${id}`).addEventListener(id === 'publication-filter' ? 'input' : 'change', update));
}

async function renderJoin() {
  const join = await dataset('join');
  main().innerHTML = `${pageIntro(copy('加入我们', 'Join us'), join.title, join.intro)}<div class="join-grid"><section><h2>${copy('开放方向', 'Opportunities')}</h2><ul>${join.roles.map((role) => `<li>${escape(role)}</li>`).join('')}</ul></section><section><h2>${copy('联系前可准备', 'Helpful materials')}</h2><ul>${join.materials.map((material) => `<li>${escape(material)}</li>`).join('')}</ul></section><section><h2>${copy('联系', 'Contact')}</h2><p><a href="mailto:${escape(join.contact)}">${escape(join.contact)}</a></p></section></div></section>`;
}

const pageRenderers = { home: renderHome, research: renderResearch, people: renderPeople, publications: renderPublications, join: renderJoin, project: renderProject };

export async function bootPage() {
  const root = new URL('../../', import.meta.url).pathname;
  const nested = new URL('.', window.location.href).pathname !== root;
  renderSiteShell({ nested, ...(await dataset('site')) }, language());
  await pageRenderers[document.body.dataset.page]?.();
}

bootPage().catch((error) => {
  console.error(error);
  showPageError(copy('内容加载失败，请刷新页面后重试。', 'Content failed to load. Please refresh and try again.'));
});
