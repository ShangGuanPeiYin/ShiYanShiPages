import {defineConfig} from 'astro/config';
import mdx from '@astrojs/mdx';
import {withBase} from './src/lib/core.mjs';
function markdownBase(){return tree=>{const visit=node=>{if((node.type==='image'||node.type==='link')&&node.url?.startsWith('/')&&!node.url.startsWith('//'))node.url=withBase(node.url,process.env.PUBLIC_BASE_PATH||'/');for(const child of node.children||[])visit(child);};visit(tree);};}
const base='/'+(process.env.PUBLIC_BASE_PATH||'/').split('/').filter(Boolean).join('/');
export default defineConfig({integrations:[mdx()],markdown:{remarkPlugins:[markdownBase]},site:process.env.PUBLIC_SITE_URL||'http://127.0.0.1:4321',base:base==='/'?'/':base+'/',output:'static',trailingSlash:'always'});
