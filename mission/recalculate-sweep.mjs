import { readFile, writeFile } from 'node:fs/promises';
import { loadTerrain } from './terrain-node.mjs';
import { assessSweep } from './route-sweep.mjs';

const read = path => readFile(new URL('../'+path,import.meta.url));
const json = async path => JSON.parse(await read(path));
const [atlas,plan,sweep]=await Promise.all(['data/atlas.json','data/mission/protocol.json','data/mission/route-sweep.json'].map(json));
const result=assessSweep(await loadTerrain(atlas,plan,read),plan,sweep);
const output=JSON.stringify(result,null,2)+'\n';
const path='data/mission/route-sweep-results.json';
if(process.argv.includes('--check')){
  if((await read(path)).toString().replaceAll('\r\n','\n')!==output)throw Error('Route sweep differed from stored results');
  console.log('Route sweep reproduces exactly.');
}else{
  await writeFile(new URL('../'+path,import.meta.url),output);
  for(const [space,sites] of Object.entries(result.cases))console.log(space,Object.fromEntries(
    Object.entries(sites).map(([site,r])=>[site,r.counts])));
  for(const [site,relay] of Object.entries(result.relays))console.log(site,Object.fromEntries(
    ['without','primary','locked'].map(k=>[k,{point:relay[k].point,
      training:relay[k].training.worstGap,holdout:relay[k].validation.worstGap,
      meanHoldout:relay[k].validation.meanGap,coverage:relay[k].validation.worstCoverage}])));
}
