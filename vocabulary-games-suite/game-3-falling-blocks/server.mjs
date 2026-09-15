import express from'express';
import{fileURLToPath}from'node:url';import{dirname,join}from'node:path';
import{secure,resultRoutes}from'../shared/server-utils.mjs';
const here=dirname(fileURLToPath(import.meta.url)),app=express();secure(app);app.use(express.json({limit:'16kb'}));resultRoutes(app,'semantic-grid-drop');app.use(express.static(join(here,'public')));app.use('/shared',express.static(join(here,'../shared')));app.get('/api/vocabulary',(_q,r)=>r.sendFile(join(here,'../shared/vocabulary-db.json')));app.get('/health',(_q,r)=>r.json({ok:true,game:'semantic-grid-drop'}));app.listen(process.env.PORT||4103,(process.env.HOST||'127.0.0.1'),()=>console.log('Semantic Grid Drop on http://localhost:'+(process.env.PORT||4103)));
