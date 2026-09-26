import { loadJson, normalizeLinks, showPageError, validateCollection } from './data-client.js';
import { applyMediaFallbacks, mediaMarkup, shouldAutoplayMedia } from './media.js';
import { heroMarkup, selectHeroProjects, setupHomeHero } from './home-hero.js';
import { filterPublications } from './publication-filter.js';
import { renderSiteShell } from './site-shell.js';

const main = () => document.querySelector('#page-main');
const language = () => document.body.dataset.lang === 'en' ? 'en' : 'zh';
const copy = (zh, en) => language() === 'zh' ? zh : en;
const escape = (value = '') => String(value).replace(/[&<>'"]/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
}[character]));

export function setupRevealMotion({
  root = document,
  reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
  Observer = window.IntersectionObserver,
} = {}) {
  const revealElements = [...root.querySelectorAll('[data-reveal]')];
  if (!revealElements.length) return null;

  if (reducedMotion || typeof Observer !== 'function') {
    revealElements.forEach((element) => element.classList.add('is-visible'));
    return null;
  }

  root.documentElement.classList.add('motion-ready');
  const observer = new Observer((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
  revealElements.forEach((element) => observer.observe(element));
  return observer;
}

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

function projectCard(project, index) {
  return `<article class="project-card">
    <div class="project-card__media">${mediaMarkup(project, { basePath: rootPath() })}</div>
    <div class="project-card__body">
      <p class="project-index">${String(index + 1).padStart(2, '0')}</p>
      <div class="tag-list">${(project.tags || []).map((tag) => `<span>${escape(tag)}</span>`).join('')}</div>
      <h3>${escape(project.title)}</h3>
      <p class="project-card__summary">${escape(project.summary)}</p>
      <a class="text-link" href="${projectHref(project.slug)}">${copy('查看项目详情 →', 'Read the project →')}</a>
    </div>
  </article>`;
}

function pageIntro(label, title, description) {
  return `<section class="page-wrap"><div class="section-heading"><div><p class="eyebrow">${escape(label)}</p><h1>${escape(title)}</h1></div><p>${escape(description)}</p></div>`;
}

async function renderHome() {
  const [site, projects, news, join] = await Promise.all([dataset('site'), dataset('projects'), dataset('news'), dataset('join')]);
  validateCollection('projects', projects);
  validateCollection('news', news);
  const featured = selectHeroProjects(projects);
  const shouldAutoplay = shouldAutoplayMedia({ reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches, narrowViewport: window.matchMedia('(max-width: 47.99rem)').matches });
  const heroOptions = { basePath: rootPath(), lang: language(), autoplay: shouldAutoplay, site };
  const latestNews = [...news].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
  const projectRows = featured.slice(0, 3).map((project, index) => `<article class="editorial-project"><div class="editorial-project__media">${mediaMarkup(project, { basePath: rootPath() })}</div><div class="editorial-project__body"><p class="editorial-index"><span>${String(index + 1).padStart(2, '0')}</span> / ${String(featured.length).padStart(2, '0')}</p><p class="eyebrow">${escape(project.tags?.[0] || site.shortName)}</p><h3>${escape(project.title)}</h3><p class="editorial-project__summary">${escape(project.summary)}</p><p class="editorial-project__challenge"><strong>${copy('研究挑战', 'Research challenge')}</strong>${escape(project.challenge)}</p><a class="text-link" href="${projectHref(project.slug)}">${copy('查看项目详情', 'Read the project')}</a></div></article>`).join('');
  main().innerHTML = `${heroMarkup(featured, heroOptions)}
  <section class="home-mission" aria-labelledby="mission-title"><div class="page-wrap home-mission__grid"><p class="home-section-label"><span>01</span>${copy('实验室使命', 'Laboratory mission')}</p><div><h2 id="mission-title">${escape(site.tagline)}</h2><p>${escape(site.department)}</p></div></div></section>
  <section class="content-section home-projects" id="featured-projects"><div class="page-wrap"><div class="home-section-heading"><p class="home-section-label"><span>02</span>${copy('重点研究', 'Selected work')}</p><div><h2>${copy('在真实环境中验证自主系统', 'Autonomous systems, validated in the physical world')}</h2><p>${copy('从机器视觉、运动规划到自主控制，三个项目呈现实验室如何将感知与行动连接为闭环系统。', 'Across machine vision, motion planning, and autonomous control, three projects show how the laboratory closes the loop between perception and action.')}</p></div></div><div class="editorial-projects">${projectRows}</div></div></section>
  <section class="content-section content-section--panel home-news" id="latest-news"><div class="page-wrap home-news__grid"><div><p class="home-section-label"><span>03</span>${copy('实验室动态', 'News')}</p><h2>${copy('近期动态', 'Latest updates')}</h2><p>${copy('记录团队的论文、成员与学术里程碑。', 'Notes on publications, people, and academic milestones from the laboratory.')}</p></div><div class="news-list">${latestNews.map((item) => `<article class="news-item"><time datetime="${escape(item.date)}">${escape(item.date)}</time><div><p class="news-item__category">${escape(item.category)}</p><h3>${escape(item.title)}</h3><p>${escape(item.summary)}</p></div></article>`).join('')}</div></div></section>
  <section class="home-join" id="join-cta"><div class="page-wrap home-join__grid"><p class="home-section-label"><span>04</span>${copy('加入我们', 'Join us')}</p><div><h2>${escape(join.title)}</h2><p>${escape(join.intro)}</p><div class="home-join__roles">${join.roles.map((role) => `<span>${escape(role)}</span>`).join('')}</div><a class="button" href="${rootPath()}htmls/join_${language()}.html">${copy('了解招募信息', 'Learn about opportunities')}</a></div></div></section>
  <section class="home-contact" aria-labelledby="contact-title"><div class="page-wrap home-contact__grid"><p class="home-section-label"><span>05</span>${copy('联系', 'Contact')}</p><div><p class="eyebrow">${escape(site.shortName)} · ${escape(site.university.name)}</p><h2 id="contact-title">${copy('让下一项研究从一次交流开始。', 'Begin the next research question with a conversation.')}</h2><p>${escape(site.address)}</p><a class="home-contact__email" href="mailto:${escape(site.email)}">${escape(site.email)}</a></div></div></section>`;
  setupHomeHero(document.querySelector('#hero'), featured, heroOptions);
}

async function renderResearch() {
  const projects = validateCollection('projects', await dataset('projects'));
  const tags = [...new Set(projects.flatMap((project) => project.tags || []))];
  const projectCount = (filtered) => copy(`显示 ${filtered.length} 个项目`, `Showing ${filtered.length} projects`);
  const projectCards = (filtered) => filtered.map((project, index) => projectCard(project, index)).join('');
  main().innerHTML = `${pageIntro(copy('研究', 'Research'), copy('从感知到行动的闭环系统', 'Closed-loop systems from perception to action'), copy('我们围绕机器视觉、机器人与自主系统构建能够进入真实场景的研究平台。', 'We develop research platforms in machine vision, robotics, and autonomous systems for real-world settings.'))}<div class="research-filters" role="group" aria-label="${copy('研究方向筛选', 'Research tag filter')}"><button class="button button--solid" type="button" data-tag="" aria-pressed="true">${copy('全部', 'All')}</button>${tags.map((tag) => `<button class="button" type="button" data-tag="${escape(tag)}" aria-pressed="false">${escape(tag)}</button>`).join('')}</div><div id="research-list"><p id="research-count" aria-live="polite">${projectCount(projects)}</p><div class="project-grid" id="research-projects">${projectCards(projects)}</div></div></section>`;
  const researchCount = document.querySelector('#research-count');
  const projectGrid = document.querySelector('#research-projects');
  document.querySelectorAll('[data-tag]').forEach((button) => button.addEventListener('click', () => {
    const tag = button.dataset.tag;
    const filtered = tag ? projects.filter((project) => project.tags.includes(tag)) : projects;
    researchCount.textContent = projectCount(filtered);
    projectGrid.innerHTML = projectCards(filtered);
    applyMediaFallbacks(projectGrid);
    document.querySelectorAll('[data-tag]').forEach((item) => {
      item.classList.toggle('button--solid', item === button);
      item.setAttribute('aria-pressed', String(item === button));
    });
  }));
}

async function renderProject() {
  const projects = validateCollection('projects', await dataset('projects'));
  const slug = new URLSearchParams(window.location.search).get('project') || new URLSearchParams(window.location.search).get('slug');
  const projectIndex = projects.findIndex((item) => item.slug === slug);
  const project = projects[projectIndex];
  const researchHref = `${rootPath()}htmls/research_${language()}.html`;
  if (!project) {
    main().innerHTML = `<section class="page-wrap project-missing"><a class="project-backlink" href="${researchHref}">← ${copy('返回研究', 'Back to research')}</a><p class="project-number">404</p><h1>${copy('未找到该项目', 'Project not found')}</h1><p class="project-copy">${copy('该项目不存在，或链接已经失效。请返回研究页浏览现有项目。', 'This project does not exist, or its link is no longer valid. Return to research to browse the current projects.')}</p></section>`;
    return;
  }
  const links = normalizeLinks(project);
  const number = String(projectIndex + 1).padStart(2, '0');
  const total = String(projects.length).padStart(2, '0');
  main().innerHTML = `<article class="page-wrap project-page"><a class="project-backlink" href="${researchHref}">← ${copy('返回研究', 'Back to research')}</a><header class="project-hero"><div><p class="project-number">${number} / ${total}</p><p class="eyebrow">${copy('研究项目', 'Research project')}</p></div><div><h1>${escape(project.title)}</h1><p class="project-copy">${escape(project.summary)}</p><div class="tag-list">${(project.tags || []).map((tag) => `<span>${escape(tag)}</span>`).join('')}</div></div></header><div class="project-detail__media">${mediaMarkup(project, { basePath: rootPath(), controls: true })}</div><div class="project-facts"><section><p class="project-fact__number">01</p><div><h2>${copy('挑战', 'Challenge')}</h2><p>${escape(project.challenge)}</p></div></section><section><p class="project-fact__number">02</p><div><h2>${copy('方法', 'Approach')}</h2><p>${escape(project.approach)}</p></div></section>${project.outcomes?.length ? `<section><p class="project-fact__number">03</p><div><h2>${copy('成果', 'Outcomes')}</h2><ul>${project.outcomes.map((outcome) => `<li>${escape(outcome)}</li>`).join('')}</ul></div></section>` : ''}</div>${links.length ? `<nav class="project-links" aria-label="${copy('项目外部链接', 'Project links')}">${links.map((link) => `<a href="${escape(link.href)}" target="_blank" rel="noreferrer">${escape(link.label)} ↗</a>`).join('')}</nav>` : ''}</article>`;
}

function personLinks(person) {
  return [
    person.email ? { label: 'Email', href: `mailto:${person.email}` } : null,
    person.homepage ? { label: 'Home', href: person.homepage } : null,
    person.scholar ? { label: 'Scholar', href: person.scholar } : null,
    person.github ? { label: 'GitHub', href: person.github } : null,
  ].filter(Boolean);
}

function personLinksMarkup(person) {
  const links = personLinks(person);
  return links.length ? `<div class="person-links">${links.map((link) => `<a href="${escape(link.href)}"${link.href.startsWith('http') ? ' target="_blank" rel="noreferrer"' : ''}>${escape(link.label)}</a>`).join('')}</div>` : '';
}

function personCard(person) {
  return `<article class="person-card"><img data-media src="${escape(rootPath() + (person.photo || ''))}" alt="${escape(person.name)}" loading="lazy" decoding="async"><div class="person-card__body"><h3>${escape(person.name)}</h3><p>${escape(person.role)}</p>${personLinksMarkup(person)}</div></article>`;
}

function leadPerson(person) {
  return `<article class="people-lead"><div class="people-lead__portrait"><img data-media src="${escape(rootPath() + (person.photo || ''))}" alt="${escape(person.name)}" decoding="async"></div><div class="people-lead__body"><p class="eyebrow">${escape(person.group)}</p><h2>${escape(person.name)}</h2><p class="people-lead__role">${escape(person.role)}</p>${personLinksMarkup(person)}</div></article>`;
}

async function renderPeople() {
  const people = await dataset('people');
  const leadGroup = copy('负责人', 'Principal Investigator');
  const lead = people.find((person) => person.group === leadGroup);
  const groups = [...new Set(people.filter((person) => person !== lead).map((person) => person.group))];
  const renderGroups = (records) => groups.map((group) => {
    const members = records.filter((person) => person.group === group);
    return members.length ? `<section class="people-section"><h2>${escape(group)}</h2><div class="people-grid">${members.map(personCard).join('')}</div></section>` : '';
  }).join('');
  const renderPeopleResults = (records) => {
    if (!records.length) return `<p class="empty-state" role="status">${copy('未找到匹配的成员，请尝试其他关键词。', 'No matching people found. Try another search.')}</p>`;
    const featured = lead && records.includes(lead) ? leadPerson(lead) : '';
    const grouped = renderGroups(records.filter((person) => person !== lead));
    return featured + grouped;
  };
  main().innerHTML = `${pageIntro(copy('成员', 'People'), copy('让研究进入现实的人', 'The people who bring research into the world'), copy('MVAS Lab 由来自机器人、控制与视觉交叉领域的研究人员和学生组成。', 'MVAS Lab brings together researchers and students across robotics, control, and vision.'))}<div class="filters people-filters"><label><span class="eyebrow">${copy('筛选', 'Filter')}</span><input id="people-filter" type="search" aria-controls="people-list" placeholder="${copy('按姓名、角色或分组检索', 'Search name, role, or group')}"></label></div><div id="people-list">${renderPeopleResults(people)}</div></section>`;
  document.querySelector('#people-filter').addEventListener('input', (event) => {
    const query = event.target.value.trim().toLocaleLowerCase();
    const matches = people.filter((person) => `${person.name} ${person.role} ${person.group}`.toLocaleLowerCase().includes(query));
    const peopleList = document.querySelector('#people-list');
    peopleList.innerHTML = renderPeopleResults(matches);
    applyMediaFallbacks(peopleList);
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
  const year = publication.year || '—';
  return `<article class="publication-card"><div class="publication-index">${escape(year)}</div><div class="publication-card__body"><h3>${escape(publication.title)}</h3><p>${escape(publication.summary)}</p>${publication.venue ? `<p class="publication-venue">${escape(publication.venue)}</p>` : ''}${links.length ? `<div class="project-links">${links.map((link) => `<a href="${escape(link.href)}" target="_blank" rel="noreferrer">${escape(link.label)}</a>`).join('')}</div>` : ''}</div></article>`;
}

async function renderPublications() {
  const [curated, legacy] = await Promise.all([dataset('publications'), loadJson(`${rootPath()}htmls/publications.json`)]);
  const publications = [...curated, ...legacy.map(legacyPublication)].filter((publication, index, records) => !publication.doi || records.findIndex((item) => item.doi === publication.doi) === index).sort((a, b) => Number(b.year) - Number(a.year));
  const years = [...new Set(publications.map((publication) => publication.year).filter(Boolean))];
  const types = [...new Set(publications.map((publication) => publication.type).filter(Boolean))];
  const publicationCount = (records) => copy(`显示 ${records.length} 篇成果`, `Showing ${records.length} publications`);
  const renderPublications = (records) => records.length
    ? records.map(publicationCard).join('')
    : `<p class="empty-state" role="status">${copy('未找到符合条件的成果，请调整关键词或筛选条件。', 'No publications match these filters. Try another keyword or selection.')}</p>`;
  main().innerHTML = `${pageIntro(copy('学术成果', 'Publications'), copy('将方法沉淀为可检验的知识', 'Methods made into testable knowledge'), copy('论文条目沿用已有英文原文，外部链接仅在真实链接可用时展示。', 'Publication titles retain their original English form; external links appear only when a valid destination is available.'))}<div class="filters publication-filters"><label><span class="eyebrow">${copy('筛选', 'Filter')}</span><input id="publication-filter" type="search" aria-controls="publication-list" placeholder="${copy('按标题、作者或期刊检索', 'Search title, author, or venue')}"></label><label><span class="eyebrow">${copy('年份', 'Year')}</span><select id="publication-year" aria-controls="publication-list"><option value="">${copy('全部年份', 'All years')}</option>${years.map((year) => `<option value="${escape(year)}">${escape(year)}</option>`).join('')}</select></label><label><span class="eyebrow">${copy('类型', 'Type')}</span><select id="publication-type" aria-controls="publication-list"><option value="">${copy('全部类型', 'All types')}</option>${types.map((type) => `<option value="${escape(type)}">${escape(type)}</option>`).join('')}</select></label></div><p id="publication-count" aria-live="polite">${publicationCount(publications)}</p><div class="publication-list" id="publication-list">${renderPublications(publications)}</div></section>`;
  const count = document.querySelector('#publication-count');
  const list = document.querySelector('#publication-list');
  const update = () => {
    const filtered = filterPublications(publications, document.querySelector('#publication-filter').value, document.querySelector('#publication-year').value, document.querySelector('#publication-type').value);
    count.textContent = publicationCount(filtered);
    list.innerHTML = renderPublications(filtered);
  };
  ['publication-filter', 'publication-year', 'publication-type'].forEach((id) => document.querySelector(`#${id}`).addEventListener(id === 'publication-filter' ? 'input' : 'change', update));
}

async function renderJoin() {
  const join = await dataset('join');
  main().innerHTML = `${pageIntro(copy('加入我们', 'Join us'), join.title, join.intro)}<div class="join-grid">
    <section class="join-opportunities"><p class="join-section__number">01</p><h2>${copy('开放方向', 'Opportunities')}</h2><ul>${join.roles.map((role) => `<li>${escape(role)}</li>`).join('')}</ul></section>
    <section class="join-preparation"><p class="join-section__number">02</p><h2>${copy('联系前可准备', 'Helpful materials')}</h2><ul>${join.materials.map((material) => `<li>${escape(material)}</li>`).join('')}</ul></section>
    <section class="join-contact"><p class="join-section__number">03</p><h2>${copy('联系', 'Contact')}</h2><a href="mailto:${escape(join.contact)}"><span>${copy('邮件联系', 'Email')}</span><strong>${escape(join.contact)}</strong></a></section>
  </div></section>`;
}

const pageRenderers = { home: renderHome, research: renderResearch, people: renderPeople, publications: renderPublications, join: renderJoin, project: renderProject };

export async function bootPage() {
  const root = new URL('../../', import.meta.url).pathname;
  const nested = new URL('.', window.location.href).pathname !== root;
  renderSiteShell({ nested, ...(await dataset('site')) }, language());
  await pageRenderers[document.body.dataset.page]?.();
  const pageMain = main();
  pageMain.querySelectorAll('section, article').forEach((element) => element.setAttribute('data-reveal', ''));
  applyMediaFallbacks(pageMain);
  setupRevealMotion();
}

if (typeof document !== 'undefined') {
  bootPage().catch((error) => {
    console.error(error);
    showPageError(copy('内容加载失败，请刷新页面后重试。', 'Content failed to load. Please refresh and try again.'));
  });
}
