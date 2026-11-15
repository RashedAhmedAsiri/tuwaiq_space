import { cp, rm } from 'node:fs/promises';

const project = new URL('../', import.meta.url);
const output = new URL('dist/', project);
const assets = ['.nojekyll','LICENSE','index.html','404.html','vendor.js','logo.png','logo_full.png',
  'logo_loader.svg','logo_tab.svg','mission/','data/','deck/','submission/'];
await rm(output,{recursive:true,force:true});
for (const name of assets) {
  await cp(new URL(name,project),new URL(name,output),{recursive:true}).catch(e=>{ if(e.code!=='ENOENT') throw e; });
}
console.log('Static site preview built in dist/.');
