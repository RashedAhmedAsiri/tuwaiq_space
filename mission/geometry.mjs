// Geometric engine reused from index.html at 15e476c. Missing cells return NaN.
function elevation(g,p){ if(Math.min(p.x,p.y)<0||Math.max(p.x,p.y)>g.size) return NaN;
  const u=p.x/g.step, v=p.y/g.step, c=Math.min(Math.floor(u),g.n-2), r=Math.min(Math.floor(v),g.n-2), V=g.values, n=g.n;
  const a=V[r*n+c], b=V[r*n+c+1], d=V[(r+1)*n+c], e=V[(r+1)*n+c+1]; if(Math.max(a,b,d,e)===65535) return NaN;
  const x=u-c, y=v-r; return g.origin+(a+(b-a)*x+(d-a)*y+(a-b-d+e)*x*y)/10; }
const lerpP=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t}), dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function lineOfSight(g,a,b,hA,hB,R=g.R){
  const zA=elevation(g,a)+hA, zB=elevation(g,b)+hB; if(!Number.isFinite(zA+zB)) return {clear:false,clearance:NaN,at:0};
  const dx=b.x-a.x, dy=b.y-a.y, curv=(dx*dx+dy*dy)/(2*R);
  const cross=(o,d)=>{ const i=o/g.step; if(!d) return Infinity; const nx=d>0?Math.floor(i+1e-9)+1:Math.ceil(i-1e-9)-1; return (nx*g.step-o)/d; };
  let nX=cross(a.x,dx), nY=cross(a.y,dy); const iX=g.step/Math.abs(dx), iY=g.step/Math.abs(dy);
  const gap=t=>zA+(zB-zA)*t-curv*t*(1-t)-elevation(g,lerpP(a,b,t));
  let s=0, left=hA, min=hA, at=0;
  while(s<1){ const e=Math.min(nX,nY,1), m=(s+e)/2, mid=gap(m), right=e===1?hB:gap(e);
    if(!Number.isFinite(mid+right)) return {clear:false,clearance:NaN,at:m};
    const q=2*(left+right-2*mid), lin=right-left-q;
    if(q>0){ const t=-lin/(2*q), vx=left+t*(lin+t*q); if(t>0&&t<1&&vx<min){ min=vx; at=s+(e-s)*t; } }
    if(right<min){ min=right; at=e; }
    if(e===nX) nX+=iX; if(e===nY) nY+=iY; s=e; left=right; }
  return {clear:min>0,clearance:min,at}; }
function routePoint(route,p){ const sp=route.slice(1).map((q,i)=>dist(q,route[i])); let t=Math.max(0,Math.min(1,p))*sp.reduce((a,b)=>a+b,0);
  for(let i=0;i<sp.length;i++){ if(t<=sp[i]&&sp[i]>0) return lerpP(route[i],route[i+1],t/sp[i]); t-=sp[i]; } return route[route.length-1]; }
function sampleRoute(route,spacing=30){ const length=route.slice(1).reduce((d,p,i)=>d+dist(route[i],p),0), n=Math.max(1,Math.ceil(length/spacing));
  return {length,points:Array.from({length:n},(_,i)=>routePoint(route,(i+.5)/n))}; }

export { elevation, lineOfSight, sampleRoute, routePoint, lerpP, dist };
