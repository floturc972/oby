// MB-WP Pay local print relay — ESC/POS network printer (RAW TCP, port 9100).
const http=require('http'),https=require('https'),net=require('net');
const api=(process.env.MBWP_API_URL||'').replace(/\/$/,'');
const token=process.env.PRINT_AGENT_TOKEN||'';
const host=process.env.PRINTER_HOST||'';
const port=Number(process.env.PRINTER_PORT||9100);
if(!api||!token||!host){console.error('Variables requises : MBWP_API_URL, PRINT_AGENT_TOKEN, PRINTER_HOST');process.exit(1)}
function request(method,url,body){return new Promise((resolve,reject)=>{
  const lib=url.startsWith('https')?https:http;
  const r=lib.request(url,{method,headers:{'x-print-agent-token':token,'content-type':'application/json'}},res=>{
    let out='';res.on('data',c=>out+=c);
    res.on('end',()=>res.statusCode>=200&&res.statusCode<300?resolve(out?JSON.parse(out):{}):reject(Error(`API ${res.statusCode}: ${out}`)));
  });
  r.on('error',reject);if(body)r.write(JSON.stringify(body));r.end();
})}
function ticket(venue,o){const line='--------------------------------\n';return Buffer.from('\x1b\x40\x1b\x61\x01'+venue.name+'\n\x1b\x21\x10COMMANDE #'+o.number+'\x1b\x21\x00\nPiste '+o.lane+'\n'+line+'\x1b\x61\x00'+o.items.map(i=>`${i.qty} x ${i.name}\n`).join('')+line+'TOTAL TTC : '+o.total.ttc.toFixed(2)+' EUR\n'+(o.note?'NOTE : '+o.note+'\n':'')+'\n'+new Date(o.createdAt).toLocaleString('fr-FR')+'\n\n\n\x1d\x56\x00','utf8')}
function print(buf){return new Promise((resolve,reject)=>{const s=net.createConnection({host,port},()=>s.end(buf,resolve));s.setTimeout(8000,()=>s.destroy(new Error('Délai imprimante')));s.on('error',reject)})}
async function poll(){try{const q=await request('GET',api+'/api/print/jobs');for(const o of q.jobs){await print(ticket(q.venue,o));await request('POST',api+'/api/print/jobs/'+o.id+'/ack',{});console.log('Imprimé : #'+o.number)}}catch(e){console.error(new Date().toISOString(),e.message)}}
poll();setInterval(poll,3000);
