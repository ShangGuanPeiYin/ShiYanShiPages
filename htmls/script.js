let allPublications = [];
    let currentLang = localStorage.getItem('lab-lang-pref') || 'en';

    // 初始化
    document.addEventListener('DOMContentLoaded', () => {
        loadPublications();
    });

    // 语言切换处理
    function handleLangChange(lang) {
        currentLang = lang;
        localStorage.setItem('lab-lang-pref', lang);
        
        // 更新UI按钮状态
        document.querySelectorAll('.lang-item').forEach(el => el.classList.remove('active'));
        document.getElementById(`btn-${lang}`).classList.add('active');
        
        // 重新渲染列表
        renderPublications();
        
        // 调用 nav.js 可能存在的导航条翻译逻辑
        if (typeof updateNavLanguage === 'function') updateNavLanguage(lang);
    }

    async function loadPublications() {
        try {
            const response = await fetch('publications.json');
            allPublications = await response.json();
            renderPublications();
        } catch (error) {
            console.error('Error loading JSON:', error);
            document.getElementById('pub-container').innerHTML = '<p style="color:red">Failed to load publications.</p>';
        }
    }

    function renderPublications(filterYear = 'all') {
        const container = document.getElementById('pub-container');
        const filterContainer = document.getElementById('year-filter');
        container.innerHTML = ''; // 清空内容

        // 按年份降序排序
        const allyears = [...new Set(allPublications.map(p => p.year))].sort((a, b) => b - a);

       // 生成/更新分类按钮
        filterContainer.innerHTML = `<button class="filter-btn ${filterYear === 'all' ? 'active' : ''}" onclick="renderPublications('all')">All</button>`;
        allyears.forEach(year => {
            filterContainer.innerHTML += `<button class="filter-btn ${filterYear === year ? 'active' : ''}" onclick="renderPublications(${year})">${year}</button>`;
        });       

        // 2. 根据选中的年份过滤数据
        const filteredData = filterYear === 'all' 
            ? allPublications 
            : allPublications.filter(p => p.year === filterYear);

        // 3. 按年份分组渲染内容
        const displayYears = [...new Set(filteredData.map(p => p.year))].sort((a, b) => b - a);

        displayYears.forEach(year => {
            // 创建年份标题
            const sectionTitle = document.createElement('h2');
            sectionTitle.className = 'section-title';
            sectionTitle.textContent = year;
            container.appendChild(sectionTitle);

            // 创建列表
            const ul = document.createElement('ul');
            
            const yearItems = allPublications.filter(p => p.year === year);
            
            yearItems.forEach(pub => {
                const li = document.createElement('li');
                li.className = 'pub-item-row'; // 可以在style.css中定义间距

                // 获取对应语言标题
                const title = currentLang === 'zh' ? (pub.title_zh || pub.title_en) : pub.title_en;

                // 组装图标链接
                let linksHtml = '';
                if (pub.pdf) linksHtml += `<a href="${pub.pdf}" class="pub-link" title="PDF"><i class="far fa-file-pdf"></i></a> `;
                if (pub.video) linksHtml += `<a href="${pub.video}" class="pub-link" title="Video"><i class="fab fa-youtube"></i></a> `;
                if (pub.code) linksHtml += `<a href="${pub.code}" class="pub-link" title="Code"><i class="fas fa-code"></i></a> `;
                if (pub.link) linksHtml += `<a href="${pub.link}" class="pub-link" title="Link"><i class="fas fa-link"></i></a> `;
                if (pub.doi) linksHtml += `<a href="https://doi.org/${pub.doi}" class="pub-link" title="DOI"><i class="fas fa-external-link-alt"></i></a> `;
                if (pub.patent) linksHtml += `<a href="${pub.patent}" class="pub-link" title="Patent"><i class="fas fa-gavel"></i></a> `;

                li.innerHTML = `
                    ${linksHtml}
                    <strong>“${title}”</strong>, 
                    ${pub.authors}, 
                    <i style="color: var(--text-gray);">${pub.venue}, ${pub.year}.</i>
                `;
                ul.appendChild(li);
            });
            
            container.appendChild(ul);
        });
    }

