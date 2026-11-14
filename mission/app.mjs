import { copy } from './copy.mjs';
import { CLEAR, BLOCKED, UNKNOWN, evaluate, makeProfile, routeSetup, slope } from './analysis.mjs';
import { elevation, lerpP, routePoint } from './geometry.mjs';
import { createMap } from './map.mjs';

const root = new URL('../', import.meta.url);
const asset = path => new URL(path, root);
const request = async path => {
  const response = await fetch(asset(path));
  if (!response.ok) throw Error(path + ': HTTP ' + response.status);
  return response;
};
const view = document.querySelector('#mission');
const initialLanguage = new URLSearchParams(location.search).get('lang') === 'en' ? 'en' : 'ar';
let lang = initialLanguage, space = 'nobile', scene = 'before', routeKey = 'primary', comparisonLevel = 'common';
let showPlanet = false, inspected = 0, playing = false, playToken = 0, renderToken = 0, webgl, detailsOpen = false;
let protocol, report, setup;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const loadGrid = new Map();
const calculations = new Map();
const palette = { [CLEAR]:'#72e5b3', [BLOCKED]:'#ff9d87', [UNKNOWN]:'#a8acbf' };
const states = () => ({[CLEAR]:t().clear,[BLOCKED]:t().blocked,[UNKNOWN]:t().unknown});
const t = () => copy[lang];
const $ = name => document.querySelector('#' + name);
const num = (n, digits=0) => n === null ? '—' : new Intl.NumberFormat('en-US',{
  minimumFractionDigits:digits, maximumFractionDigits:digits,
}).format(n);
const iso = text => '<bdi dir="ltr">' + text + '</bdi>';
const meters = (n,digits=0) => iso(num(n,digits)) + ' ' + t().meters;
const pct = n => iso(num(n*100,1) + '%');
const normalize = ({west,north},p) => [west+p.x,north-p.y];
const caseResult = () => report.cases[space];
const earth = () => caseResult().primary.common.best;
const optimization = () => report.optimization[earth()];
const delta = d => iso(num(d.blocked*100,1))+' '+t().pp+' · '+meters(d.longest,1)+' · '+meters(d.clearance,1);
const badge = (key,cls) => '<span><i class="' + cls + '"></i>' + t()[key] + '</span>';
const choose = (value, key) => '<option value="' + key + '"' + (value===key?' selected':'') + '>' + t()[key] + '</option>';
const range = (lo,hi,format) => format(lo) + '–' + format(hi);

async function grid(id) {
  if (!loadGrid.has(id)) {
    loadGrid.set(id,(async () => {
      const spec = protocol.sites[id];
      const src = await request(spec.file);
      const blob = spec.encoding === 'gzip' ? await src.blob() : new Blob([Uint8Array.from(atob((await src.text()).trim()),c=>c.charCodeAt(0))]);
      const stream = blob.stream().pipeThrough(new DecompressionStream('gzip'));
      const bytes = new DataView(await new Response(stream).arrayBuffer());
      if (bytes.byteLength !== spec.n**2*2) throw Error('Invalid grid size: ' + id);
      return {...spec,R:spec.radius,values:Uint16Array.from({length:spec.n**2},(_,i)=>bytes.getUint16(i*2,true))};
    })().catch(error => {loadGrid.delete(id);throw error;}));
  }
  return loadGrid.get(id);
}

async function run(id) {
  if (!calculations.has(id)) {
    calculations.set(id,(async () => {
      const g=await grid(id), heights=protocol.heights.nominal;
      const choices=report.optimization[id], p=choices?.robust.point;
      const before=evaluate(g,setup,heights), after=p ? evaluate(g,setup,heights,p) : before;
      const recovered=before.states.findIndex((state,i)=>state===BLOCKED&&after.states[i]===CLEAR);
      const witness=recovered===-1?Math.max(0,before.worst):recovered;
      return {g,heights,before,after,p,witness};
    })().catch(error => {calculations.delete(id);throw error;}));
  }
  return calculations.get(id);
}

function template() {
  const l=t();
  document.documentElement.lang=lang;
  document.documentElement.dir=lang==='ar'?'rtl':'ltr';
  view.innerHTML=`
    <header><a class="home" href="../" aria-label="${l.home}"><img src="../logo_full.png" alt="Tuwaiq Space"></a><strong>Rahat Relay</strong>
    <button id="switch-lang" type="button" lang="${lang==='ar'?'en':'ar'}">${l.language}</button></header>
    <main><h1>${l.title}</h1><p class="lead">${l.intro}</p>
    <div class="controls"><button class="primary" id="start" type="button">${l.run}</button>
      <label>${l.case}<select id="mission-case">${choose(space,'nobile')}${choose(space,'jezero')}</select></label>
      <button id="swap-map" type="button">${l.planet}</button></div>
    <nav class="steps" aria-label="${l.geom}">${['before','after','comparison'].map(key=>`<button type="button" data-scene="${key}">${l[key]}</button>`).join('')}</nav>
    <p class="status" id="step" role="status"></p>
    <div class="experience">
      <div><div id="terrain-map" class="map"></div><div id="fallback"></div>
      <p id="map-caption" class="muted"></p>
      <div class="legend">${badge('clear','clear')}${badge('blocked','blocked')}${badge('unknown','unknown')}${badge('station','station')}</div>
      <label class="rover-label" for="rover">${l.rover} <output id="position"></output></label>
      <input id="rover" type="range" min="0" max="${setup.points.length-1}" value="${inspected}" dir="ltr">
      <svg id="strip" class="route-strip" viewBox="0 0 ${setup.points.length} 1" preserveAspectRatio="none" aria-hidden="true"></svg></div>
      <div class="right"><h2>${l.geom} <small>${l.representative}</small></h2>
      <div id="stats" class="stats"></div><p id="gain"></p>
      <p id="verdict"></p><p id="location"></p>
      <button id="explain" type="button" aria-controls="explanation">${l.why}</button>
      <p class="muted">${l.radio}</p></div>
    </div>
    <section id="explanation" class="section" hidden><h2>${l.profile}</h2>
      <div class="legend">${badge('ground','ground')}${badge('ray','clear')}${badge('critical','blocked')}</div>
      <div id="profile"></div></section>
    <details class="section" id="comparison"><summary>${l.more}</summary>
      <h2>${l.table}</h2>
      <div class="controls"><label><select id="route-select" aria-label="${l.representative}">${choose(routeKey,'primary')}${choose(routeKey,'check')}</select></label>
      <label><select id="level-select" aria-label="${l.res}">${choose(comparisonLevel,'common')}${choose(comparisonLevel,'native')}</select></label></div>
      <div id="site-table" class="scroll"></div><p id="finding"></p><p class="muted">${l.limits} ${l.smoothing}</p></details>
    <details class="section" id="sensitivity"><summary>${l.relayTable}</summary><p class="muted">${l.mappedDate} ${l.search}</p>
      <div id="relay-table" class="scroll"></div><p id="objectives"></p></details>
    <details class="section"><summary>${l.story}</summary><p>${l.storyText}</p>
      <a href="https://www.jpl.nasa.gov/news/nasas-ingenuity-mars-helicopter-phones-home/">${l.jpl}</a></details>
    <section class="section sources"><h2>${l.assets}</h2><p><a href="https://github.com/RashedAhmedAsiri/tuwaiq_space/blob/main/mission/README.md">${l.method}</a> · <a href="https://github.com/RashedAhmedAsiri/tuwaiq_space/blob/main/mission/ROUTE-ROBUSTNESS.md">${l.sweep}</a> · <a href="../#sources">${l.licenses}</a> ·
      <a href="../data/mission/results.json">${l.raw}</a></p></section></main>`;
  if(webgl)webgl.dispose();
  try { webgl=createMap($('terrain-map')); } catch { webgl=null; $('terrain-map').hidden=true; }
  $('explanation').hidden=!detailsOpen;
  $('explain').setAttribute('aria-expanded',String(detailsOpen));
  $('switch-lang').onclick=()=>{lang=lang==='ar'?'en':'ar';template();refresh();};
  $('start').onclick=play;
  $('mission-case').onchange=async ({target})=>{
    cancel();space=target.value;scene='before';showPlanet=false;
    inspected=(await run(earth())).witness; await refresh();
  };
  $('swap-map').onclick=()=>{cancel(); showPlanet=!showPlanet; refresh();};
  for (const button of document.querySelectorAll('[data-scene]'))button.onclick=()=>{cancel();changeScene(button.dataset.scene);};
  $('rover').oninput=({target})=>{cancel();inspected=Number(target.value);refresh();};
  $('explain').onclick=()=>{detailsOpen=!detailsOpen; $('explanation').hidden=!detailsOpen;
    $('explain').setAttribute('aria-expanded',String(detailsOpen));
    if(detailsOpen){refresh(); $('explanation').scrollIntoView({block:'nearest'});}
  };
  $('route-select').onchange=({target})=>{routeKey=target.value;table();};
  $('level-select').onchange=({target})=>{comparisonLevel=target.value;table();};
}

function table() {
  const l=t(), c=caseResult()[routeKey], pair=c[comparisonLevel], winner=pair.best;
  const rows=[space,'anahi','axis','labah'].map(id=>{
    const m=report.measurements[routeKey][id][comparisonLevel];
    const step=comparisonLevel==='common'?protocol.comparisonStep:protocol.sites[id].step;
    return `<tr class="${id===winner?'active':''}" data-site="${id}"><th scope="row">${l[id]}</th><td>${meters(step)}</td>
      <td>${pct(m.blocked)}</td><td>${meters(m.longest,1)}</td><td>${meters(m.clearance,1)}</td><td>${pct(m.unknown)}</td></tr>`;
  }).join('');
  $('site-table').innerHTML=`<table><thead><tr>${[l.site,l.res,l.fraction,l.gap,l.clearance,l.unknown].map(x=>'<th scope="col">'+x+'</th>').join('')}</tr></thead>
    <tbody>${rows}</tbody></table>`;
  const same=c.native.best===c.common.best&&c.native.within.join()===c.common.within.join();
  const d=pair.candidates[winner].delta;
  $('finding').innerHTML=`<strong>${l.closest} · ${l[winner]} · ${pair.within.includes(winner)?l.yes:l.no}</strong><br>
    ${l.difference} · ${delta(d)}. ${same?l.unchanged:l.changed}`;
}

function relayTable(o) {
  const l=t();
  $('relay-table').innerHTML=`<table><thead><tr>${[l.objective,l.candidate,l.nominalGap,l.coverage,l.rangeGap,l.rangeCoverage].map(x=>'<th scope="col">'+x+'</th>').join('')}</tr></thead><tbody>
    ${[[l.before,o.baseline],[l.maxCoverage,o.coverage],[l.robust,o.robust]].map(([name,c])=>`<tr>
      <th scope="row">${name}</th><td>${c.point?iso(normalize(protocol.sites[earth()],c.point).map(x=>num(x,2)).join(' / ')):'—'}</td>
      <td>${meters(c.nominal.longest,1)}</td><td>${pct(c.nominal.coverage)}</td>
      <td>${range(c.bestGap,c.worstGap,x=>meters(x,1))}</td><td>${range(c.worstCoverage,c.bestCoverage,pct)}</td></tr>`).join('')}
    </tbody></table>`;
  const a=o.coverage.point,b=o.robust.point;
  const sentence=!b?l.noGain:a&&a.x===b.x&&a.y===b.y?l.tie:l.distinct;
  $('objectives').textContent=sentence+' '+(lang==='ar'
    ? 'فُحص '+o.tested+' موضعًا، وحقق '+o.robustEligible+' منها شروط الانحدار ووصلة القاعدة في الافتراضات الستة.'
    : o.tested+' sites tested. '+o.robustEligible+' passed the slope and base-link tests in all six scenarios.');
}

function profileHtml(name, profile) {
  const {ray,length,points}=profile,l=t();
  const valid=points.flatMap(({z,sight})=>[z,sight]).filter(Number.isFinite);
  const min=Math.min(...valid),max=Math.max(...valid), sy=y=>96-(y-min)/Math.max(1,max-min)*77, sx=x=>51+x*457;
  const line=key=>points.reduce(([d,valid],p)=>Number.isFinite(p[key])
    ? [d+(valid?'L':'M')+sx(p.t).toFixed(2)+','+sy(p[key]).toFixed(2),true]:[d,false],['',false])[0];
  const worst=points.find(p=>p.t===ray.at);
  const point=worst&&Number.isFinite(worst.z+worst.sight)
    ? `<line x1="${sx(ray.at)}" x2="${sx(ray.at)}" y1="${sy(worst.z)}" y2="${sy(worst.sight)}" stroke="#ffddab" stroke-width="3"/><circle cx="${sx(ray.at)}" cy="${sy(worst.z)}" r="4" fill="#ffddab"/>`:'';
  return `<div class="profile-row"><p><strong>${name}</strong> · ${states()[ray.state]}${ray.state===UNKNOWN?'':' · '+l.clearance+' '+meters(ray.clearance,1)}</p>
    <svg dir="ltr" viewBox="0 0 550 122" role="img" aria-label="${name} · ${l.elevation} · ${l.along}">
      <path d="M50 10V96H510" stroke="#777896" fill="none"/>
      ${valid.length ? `<text x="46" y="23" text-anchor="end">${num(max)}</text><text x="46" y="96" text-anchor="end">${num(min)}</text>` : ''}
      <text x="50" y="112">0</text><text x="510" y="112" text-anchor="end">${num(length)} m</text>
      <path d="${line('z')}" fill="none" stroke="#d1b694" stroke-width="2.5"/>
      <path d="${line('sight')}" fill="none" stroke="${palette[ray.state]}" stroke-width="2"/>${point}</svg></div>`;
}

function fallbackMap(g,m,p,witness) {
  const point=q=>(q.x/g.size*320)+','+(q.y/g.size*310);
  const segment=i=>[i/setup.points.length,(i+1)/setup.points.length].map(x=>point(routePoint(setup.route,x))).join(' ');
  const pin=(q,color)=>q?`<circle cx="${q.x/g.size*320}" cy="${q.y/g.size*310}" r="4" fill="${color}"/>`:'';
  return `<svg class="fallback-map" viewBox="0 0 320 310" role="img" aria-label="${t().noMap}">
    ${m.states.map((s,i)=>`<polyline points="${segment(i)}" stroke="${palette[s]}" stroke-width="3" fill="none"/>`).join('')}
    ${pin(setup.base,'#f5efff')}${pin(p,'#cdb6fe')}${pin(witness,'#ffd7a0')}</svg>`;
}

async function refresh() {
  const token=++renderToken,l=t(),id=showPlanet?space:earth(),o=optimization();
  $('start').textContent=playing?l.replay:l.run;
  $('swap-map').textContent=showPlanet?l.return:l.planet;
  $('step').textContent=l[scene==='comparison'?'three':scene==='after'?'two':'one'];
  for (const el of document.querySelectorAll('[data-scene]'))el.setAttribute('aria-current',String(el.dataset.scene===scene));
  table(); relayTable(o);
  try {
    const data=await run(id);
    if (token!==renderToken)return;
    const {g,heights,before,after,p}=data;
    const position=setup.points[inspected], active=scene==='before'||showPlanet?before:after;
    const selected=!showPlanet&&scene!=='before'?p:null;
    const profiles=[makeProfile(g,setup.base,position,heights.base,heights.rover)];
    if(p)profiles.push(makeProfile(g,setup.base,p,heights.base,heights.relay),makeProfile(g,p,position,heights.relay,heights.rover));
    if(webgl)webgl.show(g,id,setup,active,selected,position,(selected?profiles:profiles.slice(0,1)).map(x=>x.ray),l[id]+' · '+l.noMap);
    else $('fallback').innerHTML='<p class="map-note">'+l.flat+'</p>'+fallbackMap(g,active,selected,position);
    $('terrain-map').dataset.site=id;
    $('terrain-map').dataset.state=scene;
    $('map-caption').innerHTML=l.shown+' · '+l[id]+' · '+l.sourceGrid+' '+meters(g.step);
    $('stats').innerHTML=[
      [meters(active.longest,1),l.gap],[pct(active.coverage),l.coverage],[meters(active.unknownLength,1),l.unknownDistance],
    ].map(([v,k])=>'<div><strong>'+v+'</strong><small>'+k+'</small></div>').join('');
    $('stats').dataset.longest=String(active.longest);
    $('stats').dataset.coverage=String(active.coverage);
    $('position').innerHTML=meters(setup.length*(inspected+.5)/setup.points.length,0)+' · '+states()[active.states[inspected]];
    $('rover').value=inspected;
    $('strip').innerHTML=active.states.map((s,i)=>`<rect x="${i}" width="1.05" height="1" fill="${palette[s]}"/>`).join('');
    $('gain').innerHTML=showPlanet||scene==='before'?'':l.improved+' <strong>'+meters(before.longest-after.longest,1)+(before.longest?' ('+pct(1-after.longest/before.longest)+')':'')+'</strong><br>'+l.change+' <strong>'+
      iso(num((after.coverage-before.coverage)*100,1))+' '+l.pp+'</strong><br>'+l.regained+' '+meters(before.blockedLength-after.blockedLength,1);
    const c=caseResult().primary.common;
    $('verdict').innerHTML='<span class="pill">'+(c.within.includes(c.best)?l.yes:l.no)+'</span> '+l[earth()]+' · '+l[space];
    if(scene==='comparison'){
      const finding=c.candidates[c.best].delta;
      $('verdict').innerHTML+='<small>'+l.common+' · '+l.primary+'</small><small>'+l.fraction+' '+iso(num(finding.blocked*100,1))+
        ' '+l.pp+' · '+l.gap+' '+meters(finding.longest,1)+' · '+l.clearance+' '+meters(finding.clearance,1)+'</small>';
    }
    $('location').innerHTML=!selected?'':l.candidate+' · '+iso('UTM 37N '+normalize(g,selected).map(x=>num(x,2)).join(' / '))+'<br>'+l.grade+' '+iso(num(slope(g,selected,protocol.slopeRadius),1)+'°');
    if(detailsOpen)$('profile').innerHTML=profiles.map((pr,i)=>profileHtml([l.direct,l.back,l.access][i],pr)).join('');
  } catch (error) {
    console.error(error);
    $('map-caption').textContent=l.error;
  }
}

function cancel() {playToken++; playing=false;}
async function changeScene(next) {
  scene=next;showPlanet=false;
  if(next==='comparison')$('comparison').open=true;
  await refresh();
}
async function play() {
  const token=++playToken;
  playing=true; showPlanet=false; routeKey='primary'; comparisonLevel='common';
  $('route-select').value=routeKey; $('level-select').value=comparisonLevel;
  $('comparison').open=false;
  const {witness,before}=await run(earth());
  let approach=witness;
  while (approach>0&&before.states[approach]===BLOCKED) approach--;
  inspected=reducedMotion.matches?witness:Math.max(0,approach-2);
  if(token!==playToken)return;
  await changeScene('before');
  const start=inspected;
  const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  if (!reducedMotion.matches) {
    for (let frame=1;frame<=12;frame++) {
      await pause(65);
      if(token!==playToken)return;
      inspected=Math.round(start+(witness-start)*frame/12);
      await refresh();
    }
  }
  await pause(1250);
  if(token!==playToken)return;
  await changeScene('after');
  await pause(1900);
  if(token!==playToken)return;
  await changeScene('comparison');
  playing=false;
  $('start').textContent=t().run;
}

try {
  [protocol,report]=await Promise.all(['protocol','results'].map(async name=>(await request('data/mission/'+name+'.json')).json()));
  setup=routeSetup(protocol.routes.primary,protocol.routeSpacing);
  inspected=(await run(earth())).witness;
  template(); await refresh();
} catch (error) {
  console.error(error);
  view.className='loading';
  view.textContent=copy[initialLanguage].error;
}
