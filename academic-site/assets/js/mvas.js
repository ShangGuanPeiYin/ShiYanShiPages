(() => {
 const lang=document.documentElement.lang;
 const base=document.body.dataset.baseurl || '';
 const switcher=document.querySelector('[data-language]');
 if(switcher) switcher.addEventListener('click',()=>{try{localStorage.setItem('mvas-language',lang==='en'?'zh':'en')}catch(e){}});
 // Remember language on the entry page; direct links retain their explicit locale.
 if(location.pathname===base+'/'){try{if(localStorage.getItem('mvas-language')==='en')location.replace(base+'/en/')}catch(e){}}
 if(lang==='zh') {
  const labels={'Toggle navigation':'展开导航','Search site':'搜索网站','Toggle dark mode':'切换深浅主题','Back to top':'返回顶部','Email':'邮箱'};
  document.querySelectorAll('[aria-label]').forEach(e=>{if(labels[e.ariaLabel])e.ariaLabel=labels[e.ariaLabel]});
 }
})();
