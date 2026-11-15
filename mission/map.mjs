import { elevation, lerpP, routePoint } from './geometry.mjs';

export function createMap(host) {
  const { THREE, OrbitControls } = window.__T;
  const renderer = new THREE.WebGLRenderer({antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));
  renderer.setClearColor(0x121A2D);
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  host.replaceChildren(renderer.domElement);
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(43,1,4,40000);
  const controls = new OrbitControls(camera,renderer.domElement);
  controls.enableDamping = false;
  controls.target.set(0,140,0);
  controls.maxPolarAngle=Math.PI*.49;
  controls.minDistance=550; controls.maxDistance=22500;
  const sun=new THREE.DirectionalLight(0xffe0cb,2.5);
  sun.position.set(-4,5,-8);
  scene.add(sun,new THREE.HemisphereLight(0xc8c9fa,0x655161,1.5));
  const overlays=new THREE.Group();
  scene.add(overlays);
  let mesh, active;
  const draw=()=>renderer.render(scene,camera);
  controls.addEventListener('change',draw);
  const observer=new ResizeObserver(()=>{
    const w=host.clientWidth,h=host.clientHeight;
    if(!w||!h)return;
    renderer.setSize(w,h,false); camera.aspect=w/h; camera.updateProjectionMatrix(); draw();
  });
  observer.observe(host);
  function clear(group) {
    for(const o of [...group.children]){
      group.remove(o); o.geometry?.dispose(); o.material?.dispose();
    }
  }
  function point(g,p,height=0) {
    const z=elevation(g,p);
    return new THREE.Vector3(p.x-g.size/2,(z-g.origin)*1.25+height*1.25,p.y-g.size/2);
  }
  function terrain(g, site) {
    if(mesh){scene.remove(mesh);mesh.geometry.dispose();mesh.material.dispose();}
    const n=Math.min(g.n-1,160), geom=new THREE.PlaneGeometry(g.size,g.size,n,n).rotateX(-Math.PI/2);
    const p=geom.attributes.position, color = new THREE.Color(), low=new THREE.Color(site==='nobile'?0x545970:site==='jezero'?0x64443b:0x544951),
      high=new THREE.Color(site==='nobile'?0xb4b8c6:site==='jezero'?0xc68c6e:0xb39673);
    const rgb=new Float32Array(p.count*3), zs=[];
    for(let i=0;i<p.count;i++){
      const x=Math.min(g.size,Math.max(0,p.getX(i)+g.size/2)),y=Math.min(g.size,Math.max(0,p.getZ(i)+g.size/2));
      const z=elevation(g,{x,y})-g.origin;
      zs.push(z); p.setY(i,Number.isFinite(z)?z*1.25:0);
    }
    const valid=zs.filter(Number.isFinite);
    const lo=Math.min(...valid), hi=Math.max(...valid);
    for(let i=0;i<p.count;i++){
      if(!Number.isFinite(zs[i]))color.setHex(0x343744);
      else color.copy(low).lerp(high,Math.pow((zs[i]-lo)/Math.max(1,hi-lo),.58));
      rgb.set([color.r,color.g,color.b],i*3);
    }
    const index=geom.index.array, kept=[];
    for(let i=0;i<index.length;i+=3)if([index[i],index[i+1],index[i+2]].every(j=>Number.isFinite(zs[j])))kept.push(index[i],index[i+1],index[i+2]);
    geom.setIndex(kept);
    geom.setAttribute('color',new THREE.BufferAttribute(rgb,3));
    geom.computeVertexNormals();
    mesh=new THREE.Mesh(geom,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1}));
    scene.add(mesh);
    controls.target.set(0,Math.min(1400,(hi+lo)*.625),0);
    camera.position.set(5100,6600,7900);
    controls.update();
    active=g;
  }
  function line(points, color) {
    const obj=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color,depthTest:false}));
    obj.renderOrder=5; overlays.add(obj);
  }
  function pin(g,p,hex,meters) {
    if(!p || !Number.isFinite(elevation(g,p)))return;
    const marker=new THREE.Mesh(new THREE.SphereGeometry(meters,12,8),new THREE.MeshBasicMaterial({color:hex,depthTest:false}));
    marker.position.copy(point(g,p,meters)); marker.renderOrder=7; overlays.add(marker);
  }
  function show(g, site, setup, result, relay, witness, rays, label) {
    if(active!==g) terrain(g,site);
    clear(overlays);
    const palette={1:0xF5F7FC,0:0x8966E8,'-1':0x5B6780};
    const grouped=new Map();
    for(let i=0;i<setup.points.length;i++) {
      const state=result.states[i], a=setup.points[i];
      const b=routePoint(setup.route,i/setup.points.length);
      const c=routePoint(setup.route,(i+1)/setup.points.length);
      if(!grouped.has(state))grouped.set(state,[]);
      for(const pair of [[b,a],[a,c]]) {
        const p=[point(g,pair[0],24),point(g,pair[1],24)];
        if(p.every(x=>Number.isFinite(x.y)))grouped.get(state).push(...p);
      }
    }
    for(const [state,points] of grouped){
      const obj=new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:palette[state],depthTest:false}));
      obj.renderOrder=4; overlays.add(obj);
    }
    pin(g,setup.base,0xF5F7FC,72); pin(g,relay,0xC9B8F5,82); pin(g,witness,0xB5C1D4,64);
    for(const ray of rays) {
      const a=point(g,ray.a,ray.hA),b=point(g,ray.b,ray.hB);
      if([a.y,b.y].every(Number.isFinite))line([a,b],palette[ray.state]);
      if(ray.state===0)pin(g,lerpP(ray.a,ray.b,ray.at),palette[0],48);
    }
    renderer.domElement.setAttribute('aria-label',label);
    draw();
  }
  return {show,dispose(){
    observer.disconnect(); controls.dispose(); clear(overlays);
    if(mesh){mesh.geometry.dispose();mesh.material.dispose();}
    renderer.dispose(); renderer.forceContextLoss();
  }};
}
