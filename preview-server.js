const http = require('http');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, 'dist');
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png'};
http.createServer((req,res)=>{
  const requested = decodeURIComponent(req.url.split('?')[0]);
  const file = path.join(root, requested === '/' ? 'index.html' : requested);
  if (!file.startsWith(root)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(file,(err,data)=>{
    if(err){res.writeHead(404);return res.end('Not found')}
    res.writeHead(200,{
      'Content-Type':types[path.extname(file)]||'application/octet-stream',
      'Cache-Control':'no-store, no-cache, must-revalidate',
      'Pragma':'no-cache',
      'Expires':'0'
    });res.end(data);
  });
}).listen(4173,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:4173'));
