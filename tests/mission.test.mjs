import test from 'node:test';
import assert from 'node:assert/strict';
import { BLOCKED, CLEAR, UNKNOWN, evaluate, metrics, resample, trace } from '../mission/analysis.mjs';

function terrain(columns, step=10, R=6371000) {
  const n=columns.length;
  return {n,step,size:step*(n-1),R,origin:0,values:Uint16Array.from(Array(n).fill(columns).flat(),
    z=>z===null?65535:z*10)};
}
const p=(x,y=5)=>({x,y});
const heights={base:2,rover:2,relay:4};
const few=(base,...points)=>({base,points,length:20});

test('flat ground clears with the expected curvature correction',()=>{
  const a=p(5),b=p(55),g=terrain(Array(7).fill(0));
  const ray=trace(g,a,b,2,2);
  assert.equal(ray.state,CLEAR);
  assert.ok(Math.abs(ray.clearance-(2-50**2/(8*g.R)))<1e-9);
  assert.ok(trace({...g,R:1737400},a,b,2,2).clearance<ray.clearance);
});

test('terrain ridge locates the known obstruction',()=>{
  const ray=trace(terrain([0,0,12,0,0]),p(5),p(35),2,2);
  assert.equal(ray.state,BLOCKED);
  assert.equal(ray.at,.5);
  assert.ok(ray.clearance < -10 && ray.clearance > -10.001);
});

test('uncertain elevations do not count as blockage or merge blocked spans',()=>{
  assert.equal(trace(terrain([0,0,null,0,0]),p(5),p(35),2,2).state,UNKNOWN);
  const m=metrics([BLOCKED,UNKNOWN,BLOCKED,CLEAR],[-1,NaN,-2,1],40);
  assert.equal(m.longest,10);
  assert.equal(m.unknownLength,10);
  assert.equal(m.blockedLength,20);
  assert.equal(m.clearance,-2);
  assert.ok(resample(terrain([0,0,null,0,0]),20).values.includes(65535));
});

test('relay fails when either of its two links is blocked',()=>{
  const g=terrain([0,0,12,0,0,0,0]);
  const base=p(5),rover=p(45),r=few(base,rover);
  for(const relay of [p(15),p(35)]) {
    const a=trace(g,base,relay,heights.base,heights.relay);
    const b=trace(g,relay,rover,heights.relay,heights.rover);
    assert.deepEqual([a.state,b.state].sort(),[BLOCKED,CLEAR]);
    assert.equal(evaluate(g,r,heights,relay).states[0],BLOCKED);
  }
  assert.equal(evaluate(g,r,heights,p(20)).states[0],CLEAR);
});

test('a working relay rescues known direct blockage, while missing backhaul remains unknown',()=>{
  const g=terrain([0,0,12,0,0]);
  const route=few(p(5),p(35));
  assert.equal(evaluate(g,route,heights,p(20)).states[0],CLEAR);
  assert.equal(evaluate(g,route,heights,p(200)).states[0],UNKNOWN);
});
