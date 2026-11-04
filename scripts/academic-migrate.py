"""Generate content only; upstream layout/classes remain the presentation contract."""
from pathlib import Path
import json, yaml, html, shutil, hashlib
R=Path(__file__).resolve().parents[1]; S=R/'academic-site'
manifest=S/'migration-generated.json'
if manifest.exists():
 for name,digest in json.loads(manifest.read_text()).items():
  f=S/name
  if not f.exists() or hashlib.sha256(f.read_bytes()).hexdigest()!=digest: raise SystemExit('Refusing to overwrite edited generated file: '+name)
def esc(s): return html.escape(str(s or ''))
def read(p): return json.loads(p.read_text())
def pairs(kind,lang):
 out=[]
 for p in sorted((R/'src/content'/kind).glob('*.zh.md')):
  z=json.loads(p.read_text().split('---',2)[1]); e=p.with_name(p.name.replace('.zh.','.en.')); en=json.loads(e.read_text().split('---',2)[1]) if e.exists() else {}
  d={k:(en.get(k) if lang=='en' and en.get(k) not in (None,'',[]) else v) for k,v in {**en,**z}.items()}; d['_body']=p.read_text().split('---',2)[2].strip()
  if lang=='en' and e.exists(): d['_body']=e.read_text().split('---',2)[2].strip() or ('*English translation unavailable; original Chinese content follows.*\n\n'+d['_body'] if d['_body'] else '')
  if lang=='en' and not e.exists() and d['_body']: d['_body']='*English translation unavailable; original Chinese content follows.*\n\n'+d['_body']
  out.append(d)
 return out
def url(p): return "{{ '"+p+"' | relative_url }}"
def image(p,cls): return f'<img src="{url(p)}" class="{cls}" alt="" loading="lazy">' if p else ''
tag_names=read(R/'src/data/tags.json')
site=read(R/'src/data/site.json'); join=read(R/'src/data/join.json'); team=read(R/'src/data/team.json')
for folder in ['_pages','_posts','_data','papers']:
 (S/folder).mkdir(exist_ok=True)
shutil.copytree(R/'public/assets/legacy',S/'assets/legacy',dirs_exist_ok=True)
cfg=yaml.safe_load((S/'_config.yml').read_text()); cfg.update(name='MVAS Lab',title=site['zh']['labName'],institution=site['zh']['department'],email=site['zh']['email'],photo='../assets/legacy/images/team_photo.jpg',description=site['zh']['tagline'],links={},lang='zh-CN',url='http://127.0.0.1:4000')
cfg['scholar']['last_name']=''; cfg['scholar']['first_name']=[]
cfg['exclude']=list(dict.fromkeys(cfg['exclude']+['UPSTREAM.md','README-MVAS.md','migration-generated.json'])); (S/'_config.yml').write_text(yaml.safe_dump(cfg,allow_unicode=True,sort_keys=False))
nav=['about','publications','talks','research','software','team','teaching','blog']; zh=['关于我们','论文成果','学术报告','研究项目','开源软件','团队成员','教学','博客']
i18n={}
for lang in ['zh','en']:
 prefix='' if lang=='zh' else '/en'; t=lambda a,b: a if lang=='zh' else b
 i18n[lang]={'prefix':prefix,'name':'MVAS Lab','title':site[lang]['labName'],'institution':site[lang]['department'],'home':t('首页','Home'),'news':t('动态','News'),'allnews':t('全部动态','All news'),'about':t('关于我们','About'),'contact':t('联系','Contact'),'links':t('链接','Links'),'search':t('搜索页面…','Search pages…'),'nav':[{'name':n,'label':zh[i] if lang=='zh' else n.capitalize()} for i,n in enumerate(nav)]}
 def page(slug,title,body,layout='page'):
  body=body.replace('<div ', '<div markdown="0" ').replace('<table ', '<table markdown="0" ').replace('><','>\n<')
  route=prefix+('/'+slug.strip('/')+'/' if slug else '/')
  data={'title':title,'layout':layout,'permalink':route,'locale':lang,'alternate':('/en'+route if lang=='zh' else route[3:]),'local_path':('/'+slug.strip('/')+'/' if slug else '/')}
  (S/'_pages'/((lang+'-'+slug.replace('/','-')) or lang)).with_suffix('.md').write_text('---\n'+yaml.safe_dump(data,allow_unicode=True)+'---\n\n'+body+'\n')
 projects=pairs('projects',lang); pubs=pairs('publications',lang); news=sorted(pairs('news',lang),key=lambda n:n.get('sourceDate',''),reverse=True)
 def link(slug,label): return f'<a href="{url(prefix+"/"+slug+"/")}">{esc(label)}</a>'
 research='<div class="research-grid">'
 for p in projects:
  research+=f'<div class="research-card">{image(p.get("image"),"research-thumb")}<div class="research-body"><h2 class="research-title">{link("projects/"+p["contentId"],p["title"])}</h2><p class="research-desc">{esc(p.get("description"))}</p></div></div>'
  body=f'# {p["title"]}\n\n{image(p.get("image"),"research-thumb")}\n\n{p.get("description","")}\n'
  for key,label in [('challenge',t('研究挑战','Challenge')),('approach',t('研究方法','Approach'))]:
   if p.get(key): body+='\n## '+label+'\n\n'+p[key]+'\n'
  body+='\n'+p['_body']
  labels=[(p.get('tagLabels',{}).get(key) if lang=='en' else None) or tag_names.get(key,{}).get(lang) or tag_names.get(key,{}).get('zh','') for key in p.get('tags',[])]
  if any(labels): body+='\n\n'+ ' · '.join(esc(x) for x in labels if x)
  page('projects/'+p['contentId'],p['title'],body)
 page('research',t('研究项目','Research'),'# '+t('研究项目','Research')+'\n\n'+research+'</div>')
 tb='# '+t('团队成员','Team')+'\n\n'+link('join',join[lang]['title'])+'\n\n'
 for group in dict.fromkeys(m['group'] for m in team):
  members=[m for m in team if m['group']==group]; tb+='\n## '+members[0]['groupLabel'].get(lang,group)+'\n\n'+ ('<div class="section-card"><table class="alumni-table"><thead><tr><th>'+t('姓名','Name')+'</th><th>'+t('信息','Information')+'</th></tr></thead><tbody>' if group=='校友' else '<div class="section-card">' if group=='负责人' else '<div class="team-grid">')
  for m in members:
   val=lambda k:m.get(k,{}).get(lang) or m.get(k,{}).get('zh','')
   if group=='校友':
    tb+=f'<tr><td>{esc(val("name"))}</td><td>{esc(val("role"))}</td></tr>'; continue
   tb+=f'<div class="team-card">{image(m.get("photo"),"team-photo")}<h3 class="team-name">{esc(val("name"))}</h3><p class="team-info">{esc(val("role"))}</p>'
   if m.get('email'): tb+=f'<a href="mailto:{esc(m["email"])}">{esc(m["email"])}</a>'
   tb+='</div>'
  tb+=('</tbody></table></div>\n' if group=='校友' else '</div>\n')
  if group=='负责人':
   tb=tb.replace('class="team-card"','class="pi-card"').replace('class="team-photo"','class="pi-photo"').replace('class="team-name"','class="pi-name"')
 page('team',t('团队成员','Team'),tb)
 j=join[lang]; page('join',j['title'],'# '+j['title']+'\n\n'+j['intro']+'\n\n'+ '\n'.join('- '+x for x in j['roles'])+'\n\n## '+t('联系材料','Materials')+'\n\n'+'\n'.join('- '+x for x in j['materials'])+f'\n\n[{j["contact"]}](mailto:{j["contact"]})')
 nb='# '+t('动态','News')+'\n\n<div class="news-timeline">'
 for n in news:
  date=n.get('sourceDate',''); nb+=f'<div class="news-item"><div class="news-date">{t("来源日期：","Source date: ")}{esc(date)}</div><div class="news-headline">{link("news/"+n["contentId"],n["title"])}</div></div>'
  page('news/'+n['contentId'],n['title'],'# '+n['title']+'\n\n'+t('来源日期：','Source date: ')+date+'\n\n'+esc(n.get('category',''))+'\n\n'+n.get('description','')+'\n\n'+n['_body'])
 page('news',t('动态','News'),nb+'</div>')
 page('about',t('关于我们','About'),'# '+site[lang]['labName']+'\n\n'+site[lang]['tagline']+'\n\n'+site[lang]['department']+'\n\n'+site[lang]['address']+'\n\n'+link('join',j['title']))
 for slug,label in [('talks',t('学术报告','Talks')),('software',t('开源软件','Software')),('teaching',t('教学','Teaching')),('blog',t('博客','Blog'))]: page(slug,label,'# '+label+'\n\n'+t('暂无公开条目。','No entries yet.'))
 page('publications',t('论文成果','Publications'),'# '+t('论文成果','Publications')+'\n\n<input class="pub-search" id="pubSearch" placeholder="'+t('按题名、作者或年份筛选…','Filter by title, author, or year…')+'">\n<div class="section-card" id="pubList">{% bibliography --file ref-'+lang+' %}</div>')
 home=f'<h1 class="home-hero">{esc(site[lang]["labName"])}</h1><p class="home-hero-sub">{esc(site[lang]["department"])}</p><div class="chip-container">'+''.join(link('projects/'+p['contentId'],p['title']).replace('<a ','<a class="chip" ') for p in projects)+'</div>\n\n'+site[lang]['tagline']+f'\n\n<div class="callout callout-success"><div class="callout-title">{link("join",j["title"])}</div><p>{esc(j["intro"])}</p></div><div class="banner-frame">{image("/assets/legacy/images/team_photo.jpg","")}</div>\n\n## '+t('代表论文','Selected publications')+'\n\n<div class="section-card selected-pubs">{% bibliography --file ref-'+lang+' --query @*[selected=true] %}</div>\n\n## '+t('关于实验室','About the laboratory')+'\n\n'+site[lang]['tagline']
 page('',t('首页','Home'),home,'homelay')
 i18n[lang]['newsitems']=[{'date':n.get('sourceDate',''),'headline':n['title'],'path':prefix+'/news/'+n['contentId']+'/'} for n in news]
(S/'_data/i18n.yml').write_text(yaml.safe_dump(i18n,allow_unicode=True,sort_keys=False))
for biblang in ['zh','en']:
 pubs=pairs('publications',biblang); bib=[]
 for i,p in enumerate(pubs):
  fields={'title':p['title'],'author':'{'+p.get('authorsText','')+'}','year':str(p['year']),'journal':p.get('venue',''),'doi':p.get('doi',''),'selected':'true' if p['contentId']=='tmech-2025' else 'false'}
  for l in p.get('links',[]):
   if l.get('href','').startswith('https://') and 'doi.org' not in l['href']: fields.setdefault('url',l['href'])
  typ={'journal':'article','conference':'inproceedings'}.get(p.get('type'),'misc')
  bib.append('@'+typ+'{mvas'+str(i)+',\n'+',\n'.join(k+' = {'+v+'}' for k,v in fields.items() if v)+'\n}')
 (S/('assets/ref-'+biblang+'.bib')).write_text('\n\n'.join(bib))
(S/'UPSTREAM.md').write_text('Template: https://github.com/sbryngelson/academic-website-template\nCommit: 027c418d56dbdeb57f919ccd2bb7b549a8da2b90\nContent generation: python scripts/academic-migrate.py (from workspace root).\n')
print('Generated',len(pubs),'publications;',len(team),'members')

manifest.write_text(json.dumps({str(p.relative_to(S)):hashlib.sha256(p.read_bytes()).hexdigest() for p in [* (S/"_pages").glob("*.md"),S/"_data/i18n.yml",S/"assets/ref-zh.bib",S/"assets/ref-en.bib"]},indent=2))
