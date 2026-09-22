const navigation = {
  zh: [
    ['research', '研究方向'],
    ['publications', '学术成果'],
    ['people', '团队成员'],
    ['join', '加入我们'],
  ],
  en: [
    ['research', 'Research'],
    ['publications', 'Publications'],
    ['people', 'Team'],
    ['join', 'Join Us'],
  ],
};

const pageFiles = {
  research: 'research',
  publications: 'publications',
  people: 'team',
  join: 'join',
  project: 'project',
};

export function toggleMobileMenu(menu, button, open = button.getAttribute('aria-expanded') !== 'true') {
  button.setAttribute('aria-expanded', String(open));
  menu.dataset.open = String(open);
}

export function closeMobileMenuOnEscape(event, menu, button) {
  if (event.key !== 'Escape' || button.getAttribute('aria-expanded') !== 'true') {
    return false;
  }

  toggleMobileMenu(menu, button, false);
  button.focus();
  return true;
}

export function renderSiteShell(site = {}, lang = document.body.dataset.lang) {
  const language = lang === 'en' ? 'en' : 'zh';
  const page = document.body.dataset.page;
  const activePage = page === 'project' ? 'research' : page;
  const nested = site.nested === true;
  const root = nested ? '../' : './';
  const home = `${root}index_${language}.html`;
  const pageHref = (name) => nested
    ? `${pageFiles[name]}_${language}.html`
    : `htmls/${pageFiles[name]}_${language}.html`;
  const alternate = language === 'zh' ? 'en' : 'zh';
  const query = window.location.search;
  const alternateHref = page === 'home'
    ? `${root}index_${alternate}.html`
    : pageFiles[page] ? `${nested ? '' : 'htmls/'}${pageFiles[page]}_${alternate}.html${query}` : home;
  const universityName = site.university?.name || (language === 'zh' ? '上海交通大学' : 'Shanghai Jiao Tong University');
  const universityUrl = site.university?.url || 'https://www.sjtu.edu.cn/';
  const labels = language === 'zh'
    ? {
      name: site.labName || '机器视觉与自主系统实验室',
      shortName: site.shortName || 'MVAS Lab',
      menu: '菜单',
      navigation: '主导航',
      languageLabel: '语言',
      language: 'English',
      languageAria: '切换至 English',
      contact: '联系我们',
      address: '地址',
      email: '邮箱',
      university: '学校主页',
    }
    : {
      name: site.labName || 'Machine Vision and Autonomous Systems Laboratory',
      shortName: site.shortName || 'MVAS Lab',
      menu: 'Menu',
      navigation: 'Primary navigation',
      languageLabel: 'Language',
      language: '中文',
      languageAria: 'Switch to Chinese',
      contact: 'Contact',
      address: 'Address',
      email: 'Email',
      university: 'University',
    };

  document.querySelector('#site-header').innerHTML = `
    <header class="site-header">
      <div class="site-header__row">
        <a class="site-identity" href="${home}" aria-label="${labels.name}">
          <img class="site-identity__mark" src="${root}images/lab_logo_img.png" alt="">
          <span class="site-identity__wordmark"><span class="site-identity__short">${labels.shortName}</span><span class="site-identity__name">${labels.name}</span></span>
        </a>
        <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="mobile-menu"><span class="menu-toggle__icon" aria-hidden="true"></span><span class="menu-toggle__text">${labels.menu}</span></button>
        <nav class="site-nav" id="mobile-menu" data-open="false" aria-label="${labels.navigation}">
          ${navigation[language].map(([name, fallbackLabel], index) => `<a href="${pageHref(name)}"${activePage === name ? ' aria-current="page"' : ''}><span class="site-nav__number" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span><span>${site.nav?.[name] || fallbackLabel}</span></a>`).join('')}
        </nav>
        <div class="site-header__actions">
          <a class="site-school" href="${universityUrl}" target="_blank" rel="noopener noreferrer"><img src="${root}images/sjtu_logo.png" alt="${universityName}"></a>
          <a class="site-language__switch" href="${alternateHref}" lang="${alternate}" aria-label="${labels.languageAria}"><span class="site-language__label">${labels.languageLabel}</span><span class="site-language__value">${labels.language}</span></a>
        </div>
      </div>
    </header>`;
  document.querySelector('#site-footer').innerHTML = `
    <footer class="site-footer">
      <div class="site-footer__grid">
        <div><p class="site-footer__kicker">${labels.shortName} · SJTU</p><p class="site-footer__name">${labels.name}</p></div>
        <section aria-labelledby="footer-contact-heading">
          <h2 id="footer-contact-heading">${labels.contact}</h2>
          <address>
            <span class="site-footer__detail"><span class="site-footer__label">${labels.address}</span><span>${site.address || ''}</span></span>
            <span class="site-footer__detail"><span class="site-footer__label">${labels.email}</span><a href="mailto:${site.email || ''}">${site.email || ''}</a></span>
            <span class="site-footer__detail"><span class="site-footer__label">${labels.university}</span><a href="${universityUrl}" target="_blank" rel="noopener noreferrer">${universityName}</a></span>
          </address>
        </section>
      </div>
      <div class="site-footer__base"><small>&copy; ${new Date().getFullYear()} ${labels.name}</small><span>${universityName}</span></div>
    </footer>`;

  const menu = document.querySelector('#mobile-menu');
  const button = document.querySelector('.menu-toggle');
  button.addEventListener('click', () => toggleMobileMenu(menu, button));
  document.addEventListener('keydown', (event) => closeMobileMenuOnEscape(event, menu, button));
}
