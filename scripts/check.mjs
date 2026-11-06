import { readdir, readFile, stat } from 'node:fs/promises';
import { resolve, dirname, extname } from 'node:path';
import assert from 'node:assert/strict';
const root=resolve('.');
async function walk(path){const out=[];for(const item of await readdir(path,{withFileTypes:true})){if(['.git','.agents','tmp','node_modules'].includes(item.name))continue;const file=resolve(path,item.name);if(item.isDirectory())out.push(...await walk(file));else out.push(file)}return out}
const files=await walk(root);let checked=0;
for(const file of files.filter(p=>['.html','.css'].includes(extname(p)))){
 const content=await readFile(file,'utf8');
 const refs=extname(file)==='.html'?[...content.matchAll(/(?:src|href|data-include)="([^"]+)"/g)].map(m=>m[1]):[...content.matchAll(/url\(['"]?([^)'"\s]+)['"]?\)/g)].map(m=>m[1]);
 for(const ref of refs){if(/^(https?:|mailto:|tel:|#|\?)/.test(ref))continue;let path=ref.split(/[?#]/)[0];if(!path)continue;const target=path.startsWith('{{root}}')?resolve(root,path.replace('{{root}}','')):path.startsWith('/')?resolve(root,'.'+path):resolve(dirname(file),path);assert.ok((await stat(target).catch(()=>null)),`Отсутствует файл: ${file} → ${ref}`);checked++}
}
const home=await readFile('index.html','utf8');
const sections=[...home.matchAll(/data-include="sections\/([^/]+)/g)].map(m=>m[1]);
assert.deepEqual(sections,['header','hero','tasks','outcomes','services','experts','process','cases','reviews','faq','request','footer']);
for(const name of sections)assert.ok(files.includes(resolve(`sections/${name}/${name}.css`)),`Нет стилей секции ${name}`);
console.log(`OK: ${checked} локальных ссылок и ресурсов; порядок секций по карте сайта; CSS каждой секции.`);
