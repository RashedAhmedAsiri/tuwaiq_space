import { readFile, writeFile } from 'node:fs/promises';
import { loadTerrain } from './terrain-node.mjs';
import { compare, evaluate, routeSetup, searchRelays } from './analysis.mjs';

const root = new URL('../', import.meta.url);
const target = new URL('data/mission/results.json', root);
const read = path => readFile(new URL(path, root));
const atlas = JSON.parse(await read('data/atlas.json'));
const plan = JSON.parse(await read('data/mission/protocol.json'));
const levels=await loadTerrain(atlas,plan,read);
const routes=Object.fromEntries(Object.entries(plan.routes).map(([k,path])=>[k,routeSetup(path,plan.routeSpacing)]));
const withoutStates=({states,...m})=>m;
const measurements=Object.fromEntries(Object.entries(routes).map(([route,setup])=>[route,
  Object.fromEntries(Object.entries(levels).map(([site,variants])=>[site,Object.fromEntries(
    Object.entries(variants).map(([level,g])=>[level,withoutStates(evaluate(g,setup,plan.heights.nominal))])
  )]))
]));
const link = (space,route,level) => {
  const m = measurements[route];
  const candidates=Object.fromEntries(['axis','labah','anahi'].map(id=>[id,compare(m[id]?.[level],m[space][level],plan.tolerance)]));
  const ranked=Object.entries(candidates).filter(([,v])=>v).sort((a,b)=>a[1].score-b[1].score);
  return { candidates,best:ranked[0]?.[0]??null,within:ranked.filter(([,v])=>v.score<=1).map(([id])=>id) };
};
const optimization={};
const cases={};
for (const space of ['nobile','jezero']) {
  cases[space]={
    primary:{ native:link(space,'primary','native'),common:link(space,'primary','common') },
    check:{ native:link(space,'check','native'),common:link(space,'check','common') },
  };
  const selected=cases[space].primary.common.best;
  if(!selected) continue;
  if(!optimization[selected]) {
    const variants=Object.entries(levels[selected]).flatMap(([level,grid])=>Object.entries(plan.heights)
      .map(([key,heights])=>({id:level+'/'+key,grid,heights})));
    const result=searchRelays(variants,routes.primary,plan);
    for (const choice of [result.baseline,result.coverage,result.robust]) {
      choice.nominal=withoutStates(choice.nominal);
      choice.results=choice.results.map(withoutStates);
    }
    optimization[selected]=result;
  }
}
const payload={
  protocol:plan.protocol, routes:Object.fromEntries(Object.entries(routes).map(([id,r])=>[id,{length:r.length,samples:r.points.length}])),
  measurements,cases,optimization,
};
const output=JSON.stringify(payload,null,2)+'\n';
if(process.argv.includes('--check')) {
  if((await read('data/mission/results.json')).toString().replaceAll('\r\n','\n')!==output) throw Error('Computed and committed results differ');
  console.log('Committed mission results reproduce exactly.');
} else {
  await writeFile(target,output);
  for(const [id,c] of Object.entries(cases)) {
    const selected=c.primary.common.best;
    const o=optimization[selected];
    console.log(id,{primaryNative:c.primary.native.best,primaryCommon:selected,checkNative:c.check.native.best,
      checkCommon:c.check.common.best,passing:[c.primary.native.within,c.primary.common.within,c.check.native.within,c.check.common.within],
      nominal:[o.baseline.nominal.longest,o.coverage.nominal.longest,o.robust.nominal.longest],
      robust:o.robust.point,coverage:o.coverage.point});
  }
}
