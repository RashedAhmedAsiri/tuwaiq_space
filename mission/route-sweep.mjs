import { compare, evaluate, routeSetup, slope, trace, CLEAR } from './analysis.mjs';
import { dist } from './geometry.mjs';

export function rotateRoute(route, degrees) {
  const [base] = route;
  const radians = degrees * Math.PI / 180;
  const c = Math.cos(radians), s = Math.sin(radians);
  return route.map(({ x,y }) => {
    const east = x - base.x, south = y - base.y;
    return { x:base.x+east*c-south*s, y:base.y+east*s+south*c };
  });
}

export function summarize(runs) {
  return {
    count:runs.length,
    worstGap:Math.max(...runs.map(r=>r.longest)),
    meanGap:runs.reduce((sum,r)=>sum+r.longest,0)/runs.length,
    worstCoverage:Math.min(...runs.map(r=>r.coverage)),
    maxUnknown:Math.max(...runs.map(r=>r.unknown)),
  };
}

const withoutStates = ({states, ...result}) => result;

export function compareRoutes(levels, routes, heights, sweep, tolerance) {
  const measurements = Object.fromEntries(Object.entries(routes).map(([angle,setup])=>[angle,
    Object.fromEntries(Object.entries(levels).map(([site,grids])=>[site,
      Object.fromEntries(Object.entries(grids).map(([level,grid])=>[level,withoutStates(evaluate(grid,setup,heights))])),
    ])),
  ]));
  const factors = sweep.comparison.thresholdSensitivityFactors;
  const angles = sweep.anglesDegrees;
  const sites = ['anahi','axis','labah'];
  const cases = Object.fromEntries(['nobile','jezero'].map(space=>[space, Object.fromEntries(sites.map(site=>{
    const comparisons=angles.map(angle=>{
      const data=measurements[angle];
      const scores=Object.fromEntries(['native','common'].map(level=>{
        const pair=compare(data[site][level],data[space][level],tolerance);
        return [level,pair?.score??null];
      }));
      return {angle,...scores};
    });
    const counts=factors.map(factor=>({factor,...Object.fromEntries(['native','common'].map(level=>
      [level,comparisons.filter(r=>r[level]!==null&&r[level]<=factor).length]))}));
    return [site,{counts,comparisons}];
  }))]));
  return {measurements,cases};
}

export function lockRelay(gridLevels, routes, plan, sweep) {
  const base=routes[0].base;
  const variants=sweep.relay.variants.map(id=>{
    const [level,key]=id.split('/');
    return {id,grid:gridLevels[level],heights:plan.heights[key]};
  });
  const runSets=angles=>angles.flatMap(angle=>variants.map(v=>{
    const setup=routes[angle];
    const direct=setup.points.map(p=>trace(v.grid,base,p,v.heights.base,v.heights.rover));
    return {...v,angle,setup,direct};
  }));
  const training=runSets(sweep.relay.trainingAnglesDegrees);
  const evaluateRuns=(runs,p)=>runs.map(({angle,id,grid,setup,heights,direct})=>{
    const {longest,coverage,unknown}=evaluate(grid,setup,heights,p,direct);
    return {angle,id,longest,coverage,unknown};
  });
  const primary=variants.find(x=>x.id==='native/nominal');
  const primaryRun=training.filter(r=>r.id===primary.id&&r.angle===0);
  const baseline=summarize(evaluateRuns(training,null));
  let locked=null, best=baseline, primaryPoint=null;
  let primaryCoverage=summarize(evaluateRuns(primaryRun,null)).worstCoverage;
  let eligible=0;
  const qualifies=(v,p,radius)=>slope(v.grid,p,radius)<=sweep.relay.maxSlopeDegrees&&
    trace(v.grid,base,p,v.heights.base,v.heights.relay).state===CLEAR;
  const better=(a,b,p,current)=>{
    if(a.worstGap!==b.worstGap)return a.worstGap<b.worstGap;
    if(a.meanGap!==b.meanGap)return a.meanGap<b.meanGap;
    if(a.worstCoverage!==b.worstCoverage)return a.worstCoverage>b.worstCoverage;
    return current!==null&&dist(p,base)<dist(current,base);
  };
  for(let row=1;row<28;row++) for(let col=1;col<28;col++){
    const p={x:primary.grid.size*col/28,y:primary.grid.size*row/28};
    if(dist(p,base)<plan.minDistance)continue;
    if(qualifies(primary,p,primary.grid.step)){
      const [{coverage}]=evaluateRuns(primaryRun,p);
      if(coverage>primaryCoverage||(coverage===primaryCoverage&&primaryPoint&&dist(p,base)<dist(primaryPoint,base))){
        primaryCoverage=coverage;
        primaryPoint=p;
      }
    }
    if(!variants.every(v=>qualifies(v,p,plan.slopeRadius)))continue;
    eligible++;
    const candidate=summarize(evaluateRuns(training,p));
    if(better(candidate,best,p,locked)){best=candidate;locked=p;}
  }
  // The locked point is selected entirely above, before any evaluation of held-out angles.
  const validation=runSets(sweep.relay.validationAnglesDegrees);
  const result=Object.fromEntries(Object.entries({without:null,primary:primaryPoint,locked}).map(([name,point])=>{
    const fit=evaluateRuns(training,point), holdout=evaluateRuns(validation,point);
    return [name,{point,training:summarize(fit),validation:summarize(holdout),holdout}];
  }));
  return {eligible,...result};
}

export function assessSweep(levels, plan, sweep) {
  const routes=Object.fromEntries(sweep.anglesDegrees.map(angle=>{
    const waypoints=rotateRoute(plan.routes.primary,angle);
    if(waypoints.some(p=>Math.min(p.x,p.y)<0||Math.max(p.x,p.y)>levels.anahi.native.size))throw Error('Route outside grid: '+angle);
    return [angle,routeSetup(waypoints,plan.routeSpacing)];
  }));
  return {
    protocol:sweep.version,
    ...compareRoutes(levels,routes,plan.heights.nominal,sweep,plan.tolerance),
    relays:Object.fromEntries(['anahi','axis','labah'].map(site=>[site,lockRelay(levels[site],routes,plan,sweep)])),
  };
}
