// =============================================================
// site.js — Mobile nav, dark mode, publication filter, toggles,
//           scroll effects, copy bibtex, back-to-top
// =============================================================

(function () {
  'use strict';

  // Icons come from the inline sprite in _includes/icons.svg
  function iconHTML(name) {
    return '<svg class="icon" aria-hidden="true" focusable="false"><use href="#icon-' + name + '"></use></svg>';
  }
  function setIcon(svg, name) {
    var use = svg && svg.querySelector('use');
    if (use) use.setAttribute('href', '#icon-' + name);
  }

  // ----- Mobile Navigation -----

  var navToggler = document.querySelector('.navbar-toggler');
  var navMenu = document.getElementById('navbarNav');

  if (navToggler && navMenu) {
    navToggler.addEventListener('click', function () {
      var open = navMenu.classList.toggle('show');
      navToggler.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    // Close the menu after a link is chosen
    navMenu.addEventListener('click', function (e) {
      if (e.target.closest('a.nav-link')) {
        navMenu.classList.remove('show');
        navToggler.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // ----- Dark Mode Toggle -----

  var toggle = document.getElementById('darkModeToggle');
  var icon = document.getElementById('themeIcon');

  function updateIcon() {
    if (!icon) return;
    var theme = document.documentElement.getAttribute('data-bs-theme');
    setIcon(icon, theme === 'dark' ? 'moon' : 'sun');
  }

  if (toggle) {
    updateIcon();

    toggle.addEventListener('click', function () {
      var current = document.documentElement.getAttribute('data-bs-theme');
      var next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-bs-theme', next);
      try {localStorage.setItem('theme', next);} catch(e) {}
      updateIcon();
    });
  }

  // ----- Publication Expand/Collapse -----

  document.addEventListener('click', function (e) {
    var button = e.target.closest('[data-toggle-target]');
    if (!button) return;

    var targetId = button.getAttribute('data-toggle-target');
    var target = document.getElementById(targetId);
    if (!target) return;

    target.classList.toggle('show');
  });

  // ----- Publication Search/Filter -----

  var searchInput = document.getElementById('pubSearch');
  if (searchInput) {
    searchInput.addEventListener('input', function () {
      var query = this.value.toLowerCase().trim();
      var entries = document.querySelectorAll('[data-pub-searchable]');

      entries.forEach(function (entry) {
        if (!query) {
          entry.style.display = '';
          return;
        }
        var text = entry.textContent.toLowerCase();
        entry.style.display = text.includes(query) ? '' : 'none';
      });
    });
  }

  // ----- Copy BibTeX Button -----

  document.querySelectorAll('.pub-collapse').forEach(function (collapse) {
    // Only add copy to bibtex blocks (id starts with "bib-")
    if (!collapse.id || !collapse.id.startsWith('bib-')) return;

    var pre = collapse.querySelector('pre');
    if (!pre) return;

    var wrapper = document.createElement('div');
    wrapper.className = 'copy-wrapper';
    wrapper.style.position = 'relative';

    var btn = document.createElement('button');
    btn.className = 'copy-btn';
    btn.innerHTML = iconHTML('copy');
    btn.title = (document.documentElement.lang === 'zh' ? '复制到剪贴板' : 'Copy to clipboard');
    btn.setAttribute('aria-label', (document.documentElement.lang === 'zh' ? '复制 BibTeX' : 'Copy BibTeX to clipboard'));

    btn.addEventListener('click', function () {
      navigator.clipboard.writeText(pre.textContent.trim()).then(function () {
        btn.innerHTML = iconHTML('check');
        btn.classList.add('copied');
        setTimeout(function () {
          btn.innerHTML = iconHTML('copy');
          btn.classList.remove('copied');
        }, 2000);
      });
    });

    pre.parentNode.insertBefore(wrapper, pre);
    wrapper.appendChild(pre);
    wrapper.appendChild(btn);
  });

  // ----- Back to Top Button -----

  var topBtn = document.createElement('button');
  topBtn.className = 'back-to-top';
  topBtn.innerHTML = iconHTML('arrow-up');
  topBtn.setAttribute('aria-label', 'Back to top');
  document.body.appendChild(topBtn);

  topBtn.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  window.addEventListener('scroll', function () {
    if (window.scrollY > 400) {
      topBtn.classList.add('visible');
    } else {
      topBtn.classList.remove('visible');
    }
  }, { passive: true });

  // ----- Navbar Scroll Shadow -----

  var navbar = document.querySelector('.navbar');
  if (navbar) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 10) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    }, { passive: true });
  }

  // ----- Fade-in on Scroll -----

  var fadeElements = document.querySelectorAll('.fade-in-section');
  if (fadeElements.length > 0 && 'IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      // Long publication lists cannot reach a 10% intersection ratio.
      // Reveal as soon as any part enters the existing viewport margin.
      threshold: 0,
      rootMargin: '0px 0px -40px 0px'
    });

    fadeElements.forEach(function (el) {
      el.classList.add('fade-pending');
      observer.observe(el);
    });
  } else {
    fadeElements.forEach(function (el) {
      el.classList.add('visible');
    });
  }

  // ----- Site Search -----

  var searchToggleBtn = document.getElementById('searchToggle');
  var searchOverlay = document.getElementById('searchOverlay');
  var searchInputEl = document.getElementById('searchInput');
  var searchResultsEl = document.getElementById('searchResults');
  var searchData = null;
  var searchGeneration = 0;
  function searchMessage(message) {
    var node = document.createElement('div');
    node.className = 'search-no-results'; node.textContent = message;
    searchResultsEl.replaceChildren(node);
  }

  function openSearch() {
    if (!searchOverlay) return;
    searchOverlay.classList.add('open');
    setTimeout(function () { searchInputEl.focus(); }, 100);
  }

  function closeSearch() {
    if (!searchOverlay) return;
    searchGeneration++;
    clearTimeout(debounceTimer);
    searchOverlay.classList.remove('open');
    searchInputEl.value = '';
    searchResultsEl.innerHTML = '';
  }

  if (searchToggleBtn) {
    searchToggleBtn.addEventListener('click', openSearch);
  }

  if (searchOverlay) {
    searchOverlay.addEventListener('click', function (e) {
      if (e.target === searchOverlay) closeSearch();
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && searchOverlay && searchOverlay.classList.contains('open')) {
      closeSearch();
    }
    // Cmd/Ctrl + K to open search
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      if (searchOverlay && searchOverlay.classList.contains('open')) {
        closeSearch();
      } else {
        openSearch();
      }
    }
  });

  // Site may be served from a sub-path (e.g. user.github.io/repo); the layout
  // stores site.baseurl on <body> so the index can be fetched from the right place.
  var baseurl = (document.body && document.body.getAttribute('data-baseurl')) || '';

  function loadSearchData(callback, generation) {
    if (searchData) { callback(searchData); return; }
    fetch(baseurl + '/assets/search.json')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        searchData = data;
        callback(data);
      })
      .catch(function () {
        if (generation === searchGeneration && searchOverlay.classList.contains('open')) searchMessage(document.documentElement.lang === 'zh' ? '无法加载搜索索引。' : 'Could not load search index.');
      });
  }

  function renderResults(query, data) {
    if (!query) {
      searchResultsEl.innerHTML = '';
      return;
    }
    var q = query.toLowerCase();
    var matches = data.filter(function (item) {
      return item.title.toLowerCase().includes(q) ||
             item.content.toLowerCase().includes(q);
    });

    if (matches.length === 0) {
      searchMessage((document.documentElement.lang === 'zh' ? '无匹配结果：' : 'No results for: ') + query);
      return;
    }

    searchResultsEl.replaceChildren();
    matches.forEach(function(item) {
      var destination = new URL(item.url, location.href);
      if (destination.origin !== location.origin || !/^https?:$/.test(destination.protocol)) return;
      var link = document.createElement('a'); link.href = destination.href; link.className = 'search-result-item';
      var title = document.createElement('div'); title.className = 'search-result-title'; title.textContent = item.title;
      var snippet = document.createElement('div'); snippet.className = 'search-result-snippet'; snippet.textContent = item.content.substring(0, 150).trim() + '...';
      link.append(title, snippet); searchResultsEl.append(link);
    });
  }

  if (searchInputEl) {
    var debounceTimer;
    searchInputEl.addEventListener('input', function () {
      var query = this.value.trim();
      var generation = ++searchGeneration;
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function () {
        loadSearchData(function (data) {
          if (generation === searchGeneration && searchOverlay.classList.contains('open')) renderResults(query, data);
        }, generation);
      }, 150);
    });
  }

})();
