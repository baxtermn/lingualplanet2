import{mkdir,readFile,rename,writeFile}from'node:fs/promises';
import{randomUUID}from'node:crypto';
import{dirname,join}from'node:path';
import{fileURLToPath}from'node:url';
const here=dirname(fileURLToPath(import.meta.url)),dataDir=join(here,'data'),resultsFile=join(dataDir,'results.json');
export function secure(app){app.disable('x-powered-by');app.use((_req,res,next)=>{res.set({'X-Content-Type-Options':'nosniff','X-Frame-Options':'SAMEORIGIN','Referrer-Policy':'no-referrer','Permissions-Policy':'camera=(), microphone=(), geolocation=()'});next()})}
export function cleanText(value,max=80){return String(value??'').trim().replace(/[<>\u0000-\u001f]/g,'').slice(0,max)}
export function roomCode(value,fallback='ORBIT'){return cleanText(value,8).toUpperCase().replace(/[^A-Z0-9]/g,'')||fallback}
export function socketThrottle(socket,limit=45){let count=0,start=Date.now();return()=>{if(Date.now()-start>1000){count=0;start=Date.now()}if(++count>limit){socket.emit('app:error','Slow down for a moment.');return false}return true}}
export async function saveResult(result){await mkdir(dataDir,{recursive:true});let rows=[];try{rows=JSON.parse(await readFile(resultsFile,'utf8'))}catch{}rows.push({...result,id:randomUUID(),createdAt:new Date().toISOString()});rows=rows.slice(-5000);const temp=resultsFile+'.tmp';await writeFile(temp,JSON.stringify(rows,null,2));await rename(temp,resultsFile);return rows.at(-1)}
export async function leaderboard(gameId,limit=10){try{const rows=JSON.parse(await readFile(resultsFile,'utf8'));return rows.filter(x=>x.gameId===gameId).sort((a,b)=>b.score-a.score).slice(0,limit)}catch{return[]}}
export function resultRoutes(app,gameId){app.post('/api/results',async(req,res)=>{const score=Number(req.body?.score);if(!Number.isFinite(score)||score<0||score>1000000)return res.status(400).json({error:'Invalid score'});const saved=await saveResult({gameId,player:cleanText(req.body?.player||'Explorer',24),score:Math.round(score),vocabularyId:cleanText(req.body?.vocabularyId,40),durationMs:Math.max(0,Math.min(86400000,Number(req.body?.durationMs)||0)),attempts:Math.max(0,Math.min(10000,Number(req.body?.attempts)||0))});res.status(201).json(saved)});app.get('/api/leaderboard',async(_q,res)=>res.json({entries:await leaderboard(gameId)}))}
