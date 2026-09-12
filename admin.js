const API=localStorage.getItem('chat_api')||'http://127.0.0.1:5000';let token='';const $=id=>document.getElementById(id);
async function login(){const r=await fetch(API+'/api/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:$('u').value,password:$('p').value})});const d=await r.json();if(!r.ok)return alert(d.error);token=d.token;$('auth').classList.add('hidden');$('panel').classList.remove('hidden');refresh();}
async function api(path,body){return fetch(API+path,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify(body)});}
async function ban(){const r=await api('/api/admin/ban',{ip:$('ip').value,reason:$('reason').value});if(r.ok){$('ip').value='';$('reason').value='';refresh();}else alert('خطا');}
async function verify(v){const r=await api('/api/admin/verify',{username:$('ver').value,verified:v});alert(r.ok?(v?'تیک آبی فعال شد':'تیک آبی برداشته شد'):'خطا');}
async function unban(ip){await api('/api/admin/unban',{ip});refresh();}
async function refresh(){const r=await fetch(API+'/api/admin/bans',{headers:{Authorization:'Bearer '+token}});const d=await r.json();$('bans').innerHTML=d.bans.map(x=>`<div class="row">${x.ip} — ${x.reason||''} <button onclick="unban('${x.ip}')">Unban</button></div>`).join('')||'موردی نیست';}
