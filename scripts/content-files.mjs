import {existsSync,readdirSync,readFileSync,statSync} from 'node:fs';import {parse} from 'yaml';
export function walk(directory){return existsSync(directory)?readdirSync(directory).flatMap(name=>{const p=directory+'/'+name;return statSync(p).isDirectory()?walk(p):[p];}):[];}
export function sourceRecords(collection){return walk('src/content/'+collection).filter(file=>/\.(md|mdx)$/.test(file)).map(file=>{const raw=readFileSync(file,'utf8');const match=raw.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);if(!match)throw Error('Missing frontmatter: '+file);return {file,data:parse(match[1])};});}
export const publicMainRecords=collection=>sourceRecords(collection).filter(({data})=>data.locale==='zh'&&!data.draft);
