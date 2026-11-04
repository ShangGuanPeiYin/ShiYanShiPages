import ast,json,tempfile,unittest
from pathlib import Path
source=Path(__file__).with_name('academic-migrate.py').read_text(); tree=ast.parse(source)
fn=next(n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name=='pairs')
class MigrationTests(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory(); self.root=Path(self.tmp.name); self.d=self.root/'src/content/projects';self.d.mkdir(parents=True)
  self.ns={'R':self.root,'json':json};exec(compile(ast.Module(body=[fn],type_ignores=[]),'migration','exec'),self.ns)
 def tearDown(self): self.tmp.cleanup()
 def put(self,lang,data,body=''):(self.d/f'one.{lang}.md').write_text('---\n'+json.dumps(data)+'\n---\n'+body)
 def test_fields_fallback_independently(self):
  self.put('zh',{'title':'中文','description':'介绍'});self.put('en',{'title':'English','description':'','tagLabels':['Robotics']});d=self.ns['pairs']('projects','en')[0];self.assertEqual(d['title'],'English');self.assertEqual(d['description'],'介绍');self.assertEqual(d['tagLabels'],['Robotics'])
 def test_body_fallback_independent(self):
  self.put('zh',{'title':'中文'},'中文正文');self.put('en',{'title':'English'});d=self.ns['pairs']('projects','en')[0];self.assertIn('中文正文',d['_body']);self.assertIn('translation unavailable',d['_body'])
 def test_existing_body_preserved(self):
  self.put('zh',{'title':'中文'},'中文正文');self.put('en',{'title':'English'},'Existing English');self.assertEqual(self.ns['pairs']('projects','en')[0]['_body'],'Existing English')
unittest.main()
