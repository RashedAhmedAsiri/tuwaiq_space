import { elevation, lineOfSight, sampleRoute, lerpP, dist } from './geometry.mjs';

export const CLEAR = 1, BLOCKED = 0, UNKNOWN = -1;

export function resample(grid, step) {
  if (step === grid.step) return grid;
  if (step < grid.step || grid.size % step) throw Error('Invalid coarsening step');
  const n = grid.size / step + 1;
  // Area-weight neighbouring source nodes over each centred target footprint.
  const weights = Array.from({length:n}, (_, i) => {
    const lo = Math.max(0, i * step - step / 2), hi = Math.min(grid.size, i * step + step / 2);
    const terms = [];
    for (let j = Math.max(0, Math.floor(lo / grid.step)); j <= Math.min(grid.n - 1, Math.ceil(hi / grid.step)); j++) {
      const left = Math.max(lo, j * grid.step - grid.step / 2), right = Math.min(hi, j * grid.step + grid.step / 2);
      if (right > left) terms.push([j, (right - left) / (hi - lo)]);
    }
    return terms;
  });
  const values = new Uint16Array(n * n);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    let sum = 0, valid = true;
    for (const [row, wy] of weights[y]) for (const [col, wx] of weights[x]) {
      const v = grid.values[row * grid.n + col];
      valid &&= v !== 65535;
      sum += v * wx * wy;
    }
    values[y * n + x] = valid ? Math.round(sum) : 65535;
  }
  return { ...grid, n, step, values };
}

export function trace(grid, a, b, hA, hB) {
  const ray = lineOfSight(grid, a, b, hA, hB);
  return { ...ray, state: !Number.isFinite(ray.clearance) ? UNKNOWN : ray.clear ? CLEAR : BLOCKED };
}

export function routeSetup(route, spacing) {
  return { ...sampleRoute(route, spacing), route, base:route[0] };
}

export function metrics(states, clearances, length) {
  const samples = states.length;
  const step = length / samples;
  let blocked = 0, unknown = 0, run = 0, longest = 0, clearance = Infinity, worst = -1;
  states.forEach((state, i) => {
    if (state === BLOCKED) {
      blocked++;
      longest = Math.max(longest, ++run);
    } else run = 0;
    if (state === UNKNOWN) unknown++;
    else if (clearances[i] < clearance) {
      clearance = clearances[i];
      worst = i;
    }
  });
  return { blocked:blocked / samples, longest:longest * step, unknown:unknown / samples,
    coverage:(samples - blocked - unknown) / samples, clearance:worst < 0 ? null : clearance, worst,
    blockedLength:blocked * step, unknownLength:unknown * step };
}

export function evaluate(grid, setup, heights, relay = null, direct) {
  const rays = direct ?? setup.points.map(p => trace(grid, setup.base, p, heights.base, heights.rover));
  const back = relay && trace(grid, setup.base, relay, heights.base, heights.relay);
  const states = [], margins = [];
  for (const [i, p] of setup.points.entries()) {
    const a = rays[i];
    if (!back || back.state === BLOCKED) {
      states.push(a.state); margins.push(a.clearance); continue;
    }
    // When the direct ray already has its endpoint-limited maximum, another
    // path cannot improve its bottleneck beyond that value.
    if (a.state === CLEAR && a.clearance >= Math.min(heights.rover,heights.base,heights.relay)) {
      states.push(a.state); margins.push(a.clearance); continue;
    }
    const access = trace(grid, relay, p, heights.relay, heights.rover);
    const state = back.state === CLEAR && access.state === CLEAR ? CLEAR :
      back.state === BLOCKED || access.state === BLOCKED ? BLOCKED : UNKNOWN;
    const chosen = a.state === CLEAR || state === CLEAR ? CLEAR :
      a.state === UNKNOWN || state === UNKNOWN ? UNKNOWN : BLOCKED;
    const viaClearance = state === UNKNOWN ? NaN : Math.min(back.clearance,access.clearance);
    states.push(chosen);
    margins.push(chosen === UNKNOWN ? NaN :
      Math.max(Number.isFinite(a.clearance) ? a.clearance : -Infinity, Number.isFinite(viaClearance) ? viaClearance : -Infinity));
  }
  return { ...metrics(states,margins,setup.length), states };
}

export function slope(grid, p, d) {
  const a=elevation(grid,{x:p.x-d,y:p.y}), b=elevation(grid,{x:p.x+d,y:p.y});
  const c=elevation(grid,{x:p.x,y:p.y-d}), e=elevation(grid,{x:p.x,y:p.y+d});
  return Math.atan(Math.hypot(b-a,e-c)/(2*d))*180/Math.PI;
}

const near = (p, base) => p ? dist(p,base) : 0;
export function searchRelays(variants, setup, protocol) {
  const direct = variants.map(({grid,heights})=>setup.points.map(p=>trace(grid,setup.base,p,heights.base,heights.rover)));
  const evaluations = p => variants.map(({ grid,heights,id },i)=>({id,...evaluate(grid,setup,heights,p,direct[i])}));
  const zero = evaluations(null);
  const nominal = variants.findIndex(v=>v.id==='native/nominal');
  const wrap = (point, results) => ({ point, results, nominal:results[nominal],
    worstGap:Math.max(...results.map(x=>x.longest)), bestGap:Math.min(...results.map(x=>x.longest)),
    worstCoverage:Math.min(...results.map(x=>x.coverage)), bestCoverage:Math.max(...results.map(x=>x.coverage)) });
  const baseline=wrap(null,zero);
  let coverage=baseline, robust=baseline, eligible=0, robustEligible=0, tested=0;
  const {grid:primary}=variants[nominal];
  const feasible = (v,p,radius) => slope(v.grid,p,radius)<=protocol.maxSlope &&
    trace(v.grid,setup.base,p,v.heights.base,v.heights.relay).state===CLEAR;
  for (let row=1; row<28; row++) for (let col=1; col<28; col++) {
    tested++;
    const p={x:primary.size*col/28,y:primary.size*row/28};
    if(dist(p,setup.base)<protocol.minDistance || !feasible(variants[nominal],p,primary.step)) continue;
    eligible++;
    const n=evaluate(primary,setup,variants[nominal].heights,p,direct[nominal]);
    // Original objective: greatest nominal coverage, then closest to the base.
    if(n.coverage>coverage.nominal.coverage ||
       (n.coverage===coverage.nominal.coverage && near(p,setup.base)<near(coverage.point,setup.base))) {
      coverage=wrap(p,evaluations(p));
    }
    if(!variants.every(v=>feasible(v,p,protocol.slopeRadius))) continue;
    robustEligible++;
    const results=evaluations(p), option=wrap(p,results);
    if(option.worstGap<robust.worstGap ||
       (option.worstGap===robust.worstGap && option.nominal.longest<robust.nominal.longest) ||
       (option.worstGap===robust.worstGap && option.nominal.longest===robust.nominal.longest &&
        option.worstCoverage>robust.worstCoverage)) robust=option;
  }
  return { baseline,coverage,robust,tested,eligible,robustEligible };
}

export function compare(a,b,tolerance) {
  if(!a||!b||a.unknown||b.unknown||a.clearance===null||b.clearance===null) return null;
  const delta={blocked:Math.abs(a.blocked-b.blocked),longest:Math.abs(a.longest-b.longest),
    clearance:Math.abs(a.clearance-b.clearance)};
  return {delta, score:Math.max(delta.blocked/tolerance.blockedFraction,delta.longest/tolerance.longest,delta.clearance/tolerance.clearance)};
}

export function makeProfile(grid,a,b,hA,hB) {
  const ray={...trace(grid,a,b,hA,hB),a,b,hA,hB}, length=dist(a,b);
  const start=elevation(grid,a)+hA, end=elevation(grid,b)+hB;
  const cuts=new Set([0,1,ray.at]);
  for (const k of ['x','y']) {
    const diff=b[k]-a[k];
    if(!diff) continue;
    for(let c=Math.ceil(Math.min(a[k],b[k])/grid.step); c<Math.max(a[k],b[k])/grid.step; c++) {
      const t=(c*grid.step-a[k])/diff;
      if(t>0&&t<1)cuts.add(t);
    }
  }
  const ts=[...cuts].sort((u,v)=>u-v);
  const dense=ts.flatMap((t,i)=>i ? [(ts[i-1]+t)/2,t] : [t]);
  return {ray,length,points:dense.map(t=>({t,z:elevation(grid,lerpP(a,b,t)),
    sight:start+(end-start)*t-length**2/(2*grid.R)*t*(1-t)}))};
}
