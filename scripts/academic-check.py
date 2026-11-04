from pathlib import Path
import json, hashlib, re
from urllib.parse import unquote,urlsplit
from bs4 import BeautifulSoup
R=Path(__file__).resolve().parents[1]; S=R/'academic-site'; out=S/'_site'
count=0
for p in out.rglob('*.html'):
 soup=BeautifulSoup(p.read_text(),'html.parser');count+=1
 assert not any(x in soup.get_text() for x in ['Richard Feynman','Quantum Electrodynamics','Nobel Prize','Example staff']),p
 for tag,attr in [('a','href'),('img','src'),('script','src'),('link','href')]:
  for e in soup.find_all(tag):
   value=e.get(attr,'');u=urlsplit(value)
   if u.scheme or u.netloc or not u.path:continue
   dest=out/unquote(u.path.lstrip('/')) if u.path.startswith('/') else p.parent/unquote(u.path)
   assert dest.is_file() or (dest/'index.html').is_file(),(p,value)
for lang,prefix in [('zh',''),('en','en/')]:
 soup=BeautifulSoup((out/(prefix+'publications/index.html')).read_text(),'html.parser');assert len(soup.select('.pub-entry'))==242
 assert len(BeautifulSoup((out/(prefix+'index.html')).read_text(),'html.parser').select('.news-item'))==3
 bib=(S/f'assets/ref-{lang}.bib').read_text()
 for source in (R/'src/content/publications').glob(f'*.{lang}.md'):
  d=json.loads(source.read_text().split('---',2)[1]); assert d['title'] in bib,(source,'title');assert not d.get('year') or str(d['year']) in bib
for p in (S/'_sass').rglob('*'):
 if p.is_file():assert p.read_bytes()==(Path('/tmp/mvas-academic-upstream/_sass')/p.relative_to(S/'_sass')).read_bytes()
for n,h in json.loads((S/'migration-generated.json').read_text()).items():assert hashlib.sha256((S/n).read_bytes()).hexdigest()==h
assert (S/'Gemfile.lock').read_bytes()==Path('/tmp/mvas-academic-upstream/Gemfile.lock').read_bytes()
print(f'PASS {count} HTML: internal assets/links, no demo prose, 242 papers per locale, existing titles, sidebars, unchanged upstream SASS/lock, generated hashes')

index=json.loads((out/'assets/search.json').read_text())
assert any('Backstepping control of discrete-time chaotic systems with application to the Henon system' in d['content'] for d in index)
for lang,prefix in [('zh',''),('en','en/')]:
 text=(out/(prefix+'projects/auto-sweeper/index.html')).read_text()
 assert 'tag-87302efabd' not in text
 assert ('机器视觉' if lang=='zh' else 'Machine Vision') in text
 news=BeautifulSoup((out/(prefix+'news/index.html')).read_text(),'html.parser')
 dates=[n.get_text().split(': ')[-1].split('：')[-1] for n in news.select('.news-date')]
 assert dates==sorted(dates,reverse=True)
print('PASS: old paper searchable, readable localized project tags, news source dates descending')
