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
  const labels = language === 'zh'
    ? { name: site.labName || '机器视觉与自主系统实验室', language: 'EN', menu: '菜单', copyright: site.labName || '机器视觉与自主系统实验室' }
    : { name: site.labName || 'Machine Vision and Autonomous Systems Laboratory', language: '中文', menu: 'Menu', copyright: site.shortName || 'MVAS Laboratory' };

  document.querySelector('#site-header').innerHTML = `
    <header class="site-header">
      <div class="site-header__row">
        <a class="site-identity" href="${home}"><img class="site-identity__mark" src="${root}images/lab_logo_img.png" alt=""><span>${labels.name}</span></a>
        <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="mobile-menu">${labels.menu}</button>
        <nav class="site-nav" id="mobile-menu" data-open="false" aria-label="${language === 'zh' ? '主导航' : 'Primary navigation'}">
          ${navigation[language].map(([name, label]) => `<a href="${pageHref(name)}"${activePage === name ? ' aria-current="page"' : ''}>${label}</a>`).join('')}
        </nav>
        <nav class="site-language" aria-label="${language === 'zh' ? '语言选择' : 'Language selection'}">
          <a class="site-school" href="${site.university?.url || 'https://www.sjtu.edu.cn/'}" target="_blank" rel="noopener noreferrer"><img src="${root}images/sjtu_logo.png" alt="${site.university?.name || 'Shanghai Jiao Tong University'}"></a>
          <a href="${alternateHref}" lang="${alternate}">${labels.language}</a>
        </nav>
      </div>
    </header>`;
  document.querySelector('#site-footer').innerHTML = `<footer class="site-footer"><address><strong>${labels.copyright}</strong><span>${site.address || ''}</span><a href="mailto:${site.email || ''}">${site.email || ''}</a><a href="${site.university?.url || 'https://www.sjtu.edu.cn/'}" target="_blank" rel="noopener noreferrer">${site.university?.name || ''}</a></address><small>&copy; ${new Date().getFullYear()} ${labels.copyright}</small></footer>`;

  const menu = document.querySelector('#mobile-menu');
  const button = document.querySelector('.menu-toggle');
  button.addEventListener('click', () => toggleMobileMenu(menu, button));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && button.getAttribute('aria-expanded') === 'true') {
      toggleMobileMenu(menu, button, false);
      button.focus();
    }
  });
}
