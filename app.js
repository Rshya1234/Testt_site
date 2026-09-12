const API=localStorage.getItem('chat_api')||'http://127.0.0.1:5000';let username=localStorage.getItem('chat_name')||'';const $=id=>document.getElementById(id);
function enter(){username=$('name').value.trim();if(!username)return;$('login').classList.add('hidden');$('chat').classList.remove('hidden');localStorage.setItem('chat_name',username);load();}
async function load(){try{const r=await fetch(API+'/api/messages');const d=await r.json();$('messages').innerHTML=d.messages.map(m=>`<div class="msg"><b>${esc(m.username)}${m.verified?' <span class="verified">✓</span>':''}</b><p>${esc(m.text)}</p></div>`).join('');$('messages').scrollTop=$('messages').scrollHeight}catch(e){}}
async function send(e){e.preventDefault();const text=$('text').value.trim();if(!text)return;const r=await fetch(API+'/api/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username,text})});if(r.status===403){alert('دسترسی شما مسدود شده است.');return;}$('text').value='';load();}
function esc(s){return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}setInterval(load,3000);
if(username){$('name').value=username;}
