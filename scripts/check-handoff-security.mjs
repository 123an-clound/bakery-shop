// Read-only checks. Never prints credentials, customer rows, or response bodies.
import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
process.loadEnvFile('.env.local');
const envNames = ['NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_ANON_KEY','SUPABASE_SERVICE_ROLE_KEY','ADMIN_PASSWORD','ADMIN_SESSION_SECRET','RESEND_API_KEY','EMAIL_FROM','NEXT_PUBLIC_SITE_URL','SITE_NOINDEX'];
const result = { environment: Object.fromEntries(envNames.map(name=>[name,Boolean(process.env[name])])), database: {}, secretScan: {} };
const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (base) {
  const publicHeaders = {apikey:process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,Authorization:`Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`};
  for (const type of ['order','custom_cake','customer']) {
    const response = await fetch(`${base}/rest/v1/bakery?select=id&type=eq.${type}&limit=1`,{headers:publicHeaders,signal:AbortSignal.timeout(15000)});
    const data=await response.json();
    result.database[`anonymous_${type}`]={status:response.status,visibleRows:Array.isArray(data)?data.length:null};
  }
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  const response=await fetch(`${base}/rest/v1/`,{headers:{apikey:key,Authorization:`Bearer ${key}`,Accept:'application/openapi+json'},signal:AbortSignal.timeout(15000)});
  const spec=await response.json();
  result.database.rpcDiscoveryStatus=response.status;
  for(const name of ['bakery_commit_order','bakery_update_order','bakery_quote_custom_cake','bakery_convert_custom_cake'])
    result.database[name]=Boolean(spec.paths?.[`/rpc/${name}`]);
}
const tracked=execFileSync('git',['ls-files','-z'],{encoding:'utf8'}).split('\0').filter(Boolean);
const secretNames=['SUPABASE_SERVICE_ROLE_KEY','ADMIN_PASSWORD','ADMIN_SESSION_SECRET','RESEND_API_KEY'];
const secrets=secretNames.map(name=>process.env[name]).filter(value=>value&&value.length>=8);
const scanFiles=async(files)=>{
  const matches=[];
  for(const file of files){try{const content=await readFile(file);if(secrets.some(secret=>content.includes(Buffer.from(secret))))matches.push(file);}catch{/* a deleted tracked file is absent */}}
  return matches;
};
result.secretScan.trackedFiles=await scanFiles(tracked);
const walk=async(dir)=>{const all=[];for(const e of await readdir(dir,{withFileTypes:true})){const path=`${dir}/${e.name}`;if(e.isDirectory())all.push(...await walk(path));else all.push(path);}return all;};
result.secretScan.browserBundle=await scanFiles(await walk('.next/static'));
// Scan reachable Git blob history for exact currently configured secret values.
// Only report counts/object IDs, never matching lines or secret values.
const objects=execFileSync('git',['rev-list','--objects','--all'],{encoding:'utf8'}).trim().split('\n').map(x=>x.split(' ')[0]);
let historyMatches=0;
for(const object of objects){
  const kind=execFileSync('git',['cat-file','-t',object],{encoding:'utf8'}).trim();
  if(kind!=='blob')continue;
  const size=Number(execFileSync('git',['cat-file','-s',object],{encoding:'utf8'}));
  if(size>2_000_000)continue;
  const blob=execFileSync('git',['cat-file','blob',object],{maxBuffer:2_100_000});
  if(secrets.some(secret=>blob.includes(Buffer.from(secret))))historyMatches++;
}
result.secretScan.reachableHistoryMatches=historyMatches;
result.secretScan.scope='Exact current secret values >=8 chars; reachable blobs <=2MB. Not a complete historical secret scanner.';
await mkdir('.playwright-mcp/handoff',{recursive:true});
await writeFile('.playwright-mcp/handoff/security-current.json',JSON.stringify(result,null,2));
console.log(JSON.stringify(result,null,2));
