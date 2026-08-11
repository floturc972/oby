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
function ticket(venue,o){const line='--------------------------------\n',location=o.locationLabel||('Piste '+o.lane),firstName=o.customerFirstName||'Non renseigné',large='\x1b\x21\x10',xl='\x1b\x21\x30',normal='\x1b\x21\x00';return Buffer.from('\x1b\x40\x1b\x61\x01'+large+venue.name+'\n'+xl+'COMMANDE\n#'+o.number+'\n'+large+'PRENOM : '+firstName+'\nEMPLACEMENT : '+location+'\nREGLEMENT '+(o.payment?.provider||'CB').toUpperCase()+'\nVALIDE\n'+normal+line+'\x1b\x61\x00'+large+'DETAIL COMMANDE\n'+o.items.map(i=>`${i.qty} x ${i.name}\n`+(i.components?.length?i.components.map(c=>' + '+c.name+'\n').join(''):'' )).join('')+normal+line+xl+'TOTAL\n'+o.total.ttc.toFixed(2)+' EUR\n'+large+(o.note?'NOTE : '+o.note+'\n':'')+normal+'\n'+new Date(o.createdAt).toLocaleString('fr-FR')+'\n\n\n\x1d\x56\x00','utf8')}
function print(buf){return new Promise((resolve,reject)=>{const payload=Buffer.concat([Buffer.from('\x1b\x42\x03\x02','binary'),buf]),s=net.createConnection({host,port},()=>s.end(payload,resolve));s.setTimeout(8000,()=>s.destroy(new Error('Délai imprimante')));s.on('error',reject)})}
let polling=false;
async function poll(){if(polling)return;polling=true;try{const q=await request('GET',api+'/api/print/jobs');for(const o of q.jobs){await print(ticket(q.venue,o));await request('POST',api+'/api/print/jobs/'+o.id+'/ack',{});console.log('Imprimé : #'+o.number)}}catch(e){console.error(new Date().toISOString(),e.message)}finally{polling=false}}
poll();setInterval(poll,3000);
