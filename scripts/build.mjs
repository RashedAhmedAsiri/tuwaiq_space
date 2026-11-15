import { cp, mkdir, writeFile } from 'node:fs/promises';

const project = new URL('../', import.meta.url);
const output = new URL('dist/', project);
const assets = ['.nojekyll','LICENSE','THIRD-PARTY-THREE-LICENSE.txt','vendor.js','logo_full.png','mission/','data/atlas.json','data/axis.txt',
  'data/jezero.txt','data/mission/'];
await mkdir(new URL('data/',output),{recursive:true});
for (const name of assets) {
  await cp(new URL(name,project),new URL(name,output),{recursive:true});
}
await writeFile(new URL('index.html',output),`<!doctype html>
<html lang="ar" dir="rtl"><meta charset="utf-8"><title>Rahat Relay</title>
<meta http-equiv="refresh" content="0; url=./mission/">
<a href="./mission/">افتح مهمة Rahat Relay / Open the mission</a></html>`);
console.log('Static judging preview built in dist/.');
