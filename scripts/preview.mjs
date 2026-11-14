import { createServer } from 'node:http';
import { networkInterfaces } from 'node:os';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile, stat } from 'node:fs/promises';

const root=fileURLToPath(new URL('../dist', import.meta.url));
const port=Number(process.env.PORT||4173);
const types={'.html':'text/html; charset=utf-8','.mjs':'text/javascript; charset=utf-8',
  '.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png',
  '.json':'application/json','.txt':'text/plain; charset=utf-8','.md':'text/plain; charset=utf-8'};
try {await stat(join(root,'index.html'));}
catch {console.error('Build the judging preview first with npm run build.');process.exit(1);}
const server=createServer(async (req,res)=>{
  try {
    if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{Allow:'GET, HEAD'}).end();return;}
    const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    let file=resolve(root,'.'+path);
    if(file!==root&&!file.startsWith(root+sep)){res.writeHead(403).end();return;}
    if((await stat(file)).isDirectory()){
      if(!path.endsWith('/')){res.writeHead(302,{Location:path+'/'}).end();return;}
      file=join(file,'index.html');
    }
    const body=await readFile(file);
    res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','Content-Length':body.length});
    res.end(req.method==='HEAD'?undefined:body);
  } catch { res.writeHead(404).end('File unavailable'); }
});
server.on('error',error=>{console.error(error.message);process.exitCode=1;});
server.listen(port,'0.0.0.0',()=>{
  console.log('Local  http://localhost:'+port+'/mission/');
  const lan=Object.values(networkInterfaces()).flat().filter(info=>info.family==='IPv4'&&!info.internal);
  for(const address of lan)console.log('LAN    http://'+address.address+':'+port+'/mission/');
});
