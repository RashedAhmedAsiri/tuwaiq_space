import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { resample } from './analysis.mjs';

export async function loadTerrain(atlas, plan, read) {
  const grids = {};
  for (const [id, spec] of Object.entries(plan.sites)) {
    const a = atlas.sites[id];
    for (const key of ['west','north','size']) {
      if(!a||a[key]!==spec[key]) throw Error('Georeferencing mismatch: '+id+' '+key);
    }
    const data = await read(spec.file);
    const compressed = spec.encoding === 'gzip' ? data : Buffer.from(data.toString().trim(),'base64');
    if(createHash('sha256').update(compressed).digest('hex')!==spec.sha256) throw Error('SHA mismatch: '+id);
    const bytes=gunzipSync(compressed);
    if(bytes.length!==spec.n**2*2) throw Error('Unexpected grid size: '+id);
    grids[id]={ ...spec, R:spec.radius, values:Uint16Array.from({length:spec.n**2},(_,i)=>bytes.readUInt16LE(i*2)) };
  }

  return Object.fromEntries(Object.entries(grids).map(([id,g])=>[id,{
    native:g, common:resample(g,plan.comparisonStep),
  }]));
}
