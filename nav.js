function handleLangChange(lang) {
    // 1. 无论在哪个页面，先保存用户的语言偏好
    localStorage.setItem('lab-lang-pref', lang);

    const currentFile = window.location.pathname.split("/").pop();

    // 2. 如果是在 Publication 页面，执行局部无刷新切换
    if (currentFile.includes("publications")) {
        updatePublicationView(lang);
    }
    // 3. 如果在其他页面，执行物理跳转
    else {
        // 假设您的命名规则是 xxx_en.html 和 xxx_zh.html
        let targetFile = "";
        if (lang === 'zh') {
            targetFile = currentFile.replace("_en.html", "_zh.html");
        } else {
            targetFile = currentFile.replace("_zh.html", "_en.html");
        }
        window.location.href = targetFile;
    }
}

// 专门针对 Publication 页面的局部切换函数
function updatePublicationView(lang) {
    // 切换 Body 类名改变颜色/字体
    document.body.className = `lang-${lang}`;

    // 更新按钮高亮
    document.querySelectorAll('.lang-item').forEach(el => {
        el.classList.toggle('active', el.getAttribute('data-lang') === lang);
    });
    // document.querySelectorAll('.lang-item').forEach(el => el.classList.remove('active'));
    // const activeBtn = document.querySelector(`.lang-item[onclick*="'${lang}'"]`);
    // if (activeBtn) activeBtn.classList.add('active');

// 3. 核心：动态更新导航栏的文字和【链接地址】
    const navMap = {
        'en': ['Research', 'Publications', 'Team', 'Join Us'],
        'zh': ['研究方向', '学术成果', '团队成员', '加入我们']
    };
    const navLinks = document.querySelectorAll('#main-nav a');
    const pagenames = ['research', 'publications', 'team', 'join'];

    navLinks.forEach((link, index) => {
        link.innerText = navMap[lang][index];
        if (pagenames[index] === 'publications') {
            link.href = "javascript:void(0)";
        }else{
            // 同时更新导航链接指向，确保在中文视图下点 Team 跳到 team_cn      
         link.href = `${pagenames[index]}_${lang}.html`;
        }
    });

    const mainTitle = document.querySelector('.title-center img'); // 如果是图片 Logo
    // 或者
    const textTitle = document.getElementById('page-title');
    if (textTitle) textTitle.innerText = (lang === 'zh' ? '学术成果' : 'Publications');

    localStorage.setItem('lab-lang-pref', lang);
}


