this.ZoneComments=(function(){"use strict";const P="zc:auth:";function S(e){const t=localStorage.getItem(P+e);if(!t)return null;try{return JSON.parse(t)}catch{return null}}function R(e,t){localStorage.setItem(P+e,JSON.stringify(t))}function q(e){localStorage.removeItem(P+e)}class te{constructor(t,n){this.apiUrl=t,this.projectId=n}get auth(){return S(this.projectId)}get token(){return this.auth?.access??null}async request(t,n={},r=!0){const s=new Headers(n.headers);!s.has("Content-Type")&&n.body&&!(n.body instanceof FormData)&&s.set("Content-Type","application/json");const c=this.token;c&&s.set("Authorization",`Bearer ${c}`);const l=await fetch(this.apiUrl.replace(/\/$/,"")+t,{...n,headers:s});if(l.status===401&&r){if(await this.tryRefresh())return this.request(t,n,!1);throw q(this.projectId),new L(401,"Not authenticated")}if(!l.ok){const h=await l.text();throw new L(l.status,h||l.statusText)}if(l.status!==204)return l.json()}async tryRefresh(){const t=this.auth;if(!t?.refresh)return!1;try{const n=await fetch(this.apiUrl.replace(/\/$/,"")+"/api/auth/refresh",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({refresh:t.refresh})});if(!n.ok)return!1;const r=await n.json();return R(this.projectId,{...t,access:r.access}),!0}catch{return!1}}async login(t,n){const r=await fetch(this.apiUrl.replace(/\/$/,"")+"/api/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:t,password:n})});if(!r.ok)throw new L(r.status,"Login failed");const s=await r.json(),c=await this.fetchMe(s.access);R(this.projectId,{access:s.access,refresh:s.refresh,user:c})}async register(t,n,r){const s=await fetch(this.apiUrl.replace(/\/$/,"")+"/api/auth/register",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:t,password:n,display_name:r})});if(!s.ok){const l=await s.text();throw new L(s.status,l||"Register failed")}const c=await s.json();R(this.projectId,{access:c.access,refresh:c.refresh,user:c.user})}logout(){q(this.projectId)}async fetchMe(t){const n=await fetch(this.apiUrl.replace(/\/$/,"")+"/api/me",{headers:{Authorization:`Bearer ${t}`}});if(!n.ok)throw new L(n.status,"fetch me failed");return await n.json()}async listComments(t={}){const n=new URLSearchParams;t.snapshotId?n.set("snapshot",t.snapshotId):t.urlPath!==void 0&&n.set("url_path",t.urlPath),t.status&&t.status!=="all"&&n.set("status",t.status);const r=await this.request(`/api/projects/${this.projectId}/comments/?${n.toString()}`);return Array.isArray(r)?r:r.results}createComment(t){return this.request(`/api/projects/${this.projectId}/comments/`,{method:"POST",body:JSON.stringify(t)})}patchComment(t,n){return this.request(`/api/projects/${this.projectId}/comments/${t}/`,{method:"PATCH",body:JSON.stringify(n)})}deleteComment(t){return this.request(`/api/projects/${this.projectId}/comments/${t}/`,{method:"DELETE"})}markThreadRead(t){return this.request(`/api/projects/${this.projectId}/comments/${t}/read/`,{method:"POST"})}markThreadUnread(t){return this.request(`/api/projects/${this.projectId}/comments/${t}/unread/`,{method:"POST"})}}class L extends Error{constructor(t,n){super(n),this.status=t}}function K(e){return e.replace(/"/g,'\\"')}function ne(e){for(const n of["data-testid","data-test","data-id","data-cy"]){const r=e.getAttribute(n);if(r)return`[${n}="${K(r)}"]`}if(e.id&&/^[A-Za-z][\w-]*$/.test(e.id))return`#${e.id}`;const t=e.getAttribute("aria-label");return t&&t.length<60?`[aria-label="${K(t)}"]`:null}function oe(e){const t=e.tagName.toLowerCase(),n=e.parentElement;if(!n)return t;let r=0,s=0;for(const c of Array.from(n.children))c.tagName===e.tagName&&(r+=1,c===e&&(s=r));return r>1?`${t}:nth-of-type(${s})`:t}function re(e){const t=[];let n=e;for(;n&&n.nodeType===1&&n!==document.documentElement;){const r=ne(n);if(r){t.unshift(r);break}t.unshift(oe(n)),n=n.parentElement}return t.join(" > ")}function se(e){let t=e,n=0;for(;t.parentElement&&n<4;){const s=t.getBoundingClientRect();if(s.width>=24&&s.height>=24)break;t=t.parentElement,n+=1}const r=(t.textContent||"").trim().slice(0,80);return{selector:re(t),tag:t.tagName.toLowerCase(),textHint:r}}function X(e){if(e.selector)try{const t=document.querySelector(e.selector);if(t)return{el:t,exact:!0}}catch{}if(e.textHint){const t=document.querySelectorAll(e.tag||"*");for(const n of Array.from(t)){const r=(n.textContent||"").trim().slice(0,80);if(r&&r===e.textHint)return{el:n,exact:!1}}}return null}class ae{constructor(t,n,r,s){this.apiUrl=t,this.projectId=n,this.getToken=r,this.onEvent=s,this.ws=null,this.retry=0,this.closed=!1}start(){this.closed=!1,this.connect()}stop(){this.closed=!0,this.ws?.close(),this.ws=null}send(t){this.ws&&this.ws.readyState===WebSocket.OPEN&&this.ws.send(JSON.stringify(t))}connect(){const t=this.getToken();if(!t)return;const r=`${this.apiUrl.replace(/^http/,"ws").replace(/\/$/,"")}/ws/projects/${this.projectId}/?token=${encodeURIComponent(t)}`;try{this.ws=new WebSocket(r)}catch{this.scheduleReconnect();return}this.ws.onmessage=s=>{try{const c=JSON.parse(s.data);c?.event&&this.onEvent(c.event,c.payload)}catch{}},this.ws.onclose=s=>{if(this.ws=null,s&&(s.code===4401||s.code===4403)){this.closed=!0,this.onEvent("ws.rejected",{code:s.code,reason:s.reason||""});return}this.closed||this.scheduleReconnect()},this.ws.onopen=()=>{this.retry=0}}scheduleReconnect(){this.retry=Math.min(this.retry+1,6);const t=Math.min(1e3*2**this.retry,15e3);setTimeout(()=>{this.closed||this.connect()},t)}}const ie=`
:host { all: initial; }
* { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }

.zc-overlay {
  position: fixed; inset: 0; pointer-events: none;
  z-index: 2147483600;
}
.zc-overlay.active { pointer-events: auto; cursor: crosshair; }

.zc-toolbar {
  position: fixed; bottom: 16px; right: 16px;
  display: flex; gap: 6px; align-items: center;
  background: #111827; color: #fff;
  padding: 6px 8px; border-radius: 999px;
  box-shadow: 0 8px 24px rgba(0,0,0,.25);
  z-index: 2147483646;
  font-size: 13px;
}
.zc-toolbar.tl { top: 16px; left: 16px; bottom: auto; right: auto; }
.zc-toolbar.tr { top: 16px; right: 16px; bottom: auto; }
.zc-toolbar.bl { bottom: 16px; left: 16px; right: auto; }

.zc-btn {
  appearance: none; border: 0; background: transparent; color: inherit;
  padding: 6px 10px; border-radius: 999px; cursor: pointer; font: inherit;
}
.zc-btn:hover { background: rgba(255,255,255,.08); }
.zc-btn.primary { background: #2563eb; color: #fff; }
.zc-btn.primary:hover { background: #1d4ed8; }
.zc-btn.danger { color: #fca5a5; }
.zc-btn.ghost { color: #d1d5db; }

.zc-toolbar .zc-pill {
  background: #1f2937; padding: 2px 8px; border-radius: 999px; font-size: 12px;
}

.zc-presence {
  display: flex; align-items: center; gap: 0;
  padding-right: 4px;
}
.zc-avatar {
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 999px;
  color: #fff; font-weight: 700;
  border: 2px solid #111827; /* matches toolbar bg so they read as 'inside' */
  user-select: none;
}
.zc-presence-av {
  margin-left: -6px; /* overlap like Figma's stack */
  box-shadow: 0 1px 3px rgba(0,0,0,.25);
}
.zc-presence-av:first-child { margin-left: 0; }
.zc-presence-more { background: #4b5563; color: #fff; }

.zc-avatar-btn {
  appearance: none; border: 0; background: transparent; padding: 0;
  cursor: pointer; line-height: 0;
}
.zc-avatar-btn:hover .zc-avatar { filter: brightness(1.1); }

.zc-modal {
  position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%);
  background: #fff; color: #111; border-radius: 12px;
  padding: 18px; width: 320px; max-width: calc(100vw - 32px);
  box-shadow: 0 20px 60px rgba(0,0,0,.25);
  z-index: 2147483647;
}
.zc-modal h3 { margin: 0 0 12px; font-size: 16px; }
.zc-modal label { display: block; font-size: 12px; color: #6b7280; margin: 8px 0 4px; }
.zc-input {
  width: 100%; padding: 8px 10px; border: 1px solid #d1d5db; border-radius: 8px;
  font: inherit;
}
.zc-input:focus { outline: 2px solid #2563eb; outline-offset: -1px; border-color: transparent; }
.zc-row { display: flex; gap: 8px; margin-top: 12px; justify-content: flex-end; }
.zc-err { color: #b91c1c; font-size: 12px; margin-top: 6px; min-height: 1em; }
.zc-hint { color: #6b7280; font-size: 12px; margin-top: 10px; line-height: 1.4; }

.zc-hover-outline {
  position: fixed; pointer-events: none; border: 2px solid #2563eb;
  background: rgba(37,99,235,.06); border-radius: 4px;
  z-index: 2147483640; transition: all .04s linear;
}
.zc-zone-draft {
  position: fixed; pointer-events: none; border: 2px solid #f59e0b;
  background: rgba(245,158,11,.12); border-radius: 4px; z-index: 2147483641;
}

.zc-pin {
  position: absolute; width: 26px; height: 26px; border-radius: 999px;
  background: #fff; color: #dc2626; font-weight: 700; font-size: 12px;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 2px 8px rgba(15,23,42,.18);
  cursor: grab; pointer-events: auto;
  border: 2px solid #dc2626;
  transform: translate(-50%, -50%);
  z-index: 2147483630;
  transition: background .12s ease, color .12s ease, box-shadow .12s ease;
  user-select: none;
}
.zc-pin:active { cursor: grabbing; }
/* Unread: filled red with a soft halo, like Figma's "new comment" dot. */
.zc-pin.unread {
  background: #dc2626; color: #fff; border-color: #fff;
  box-shadow: 0 0 0 3px rgba(220,38,38,.25), 0 4px 14px rgba(220,38,38,.45);
}
.zc-pin.lost { background: #d97706; color: #fff; border-color: #fff; }

.zc-zone-outline {
  position: absolute; pointer-events: none;
  border: 1px dashed rgba(220,38,38,.35);
  border-radius: 4px;
  background: transparent;
  z-index: 2147483629;
}
.zc-zone-outline.unread { border-color: rgba(220,38,38,.85); border-width: 2px; }
.zc-zone-outline.lost { border-color: rgba(217,119,6,.6); }
.zc-zone-handle {
  position: absolute; right: -6px; bottom: -6px;
  width: 12px; height: 12px; border-radius: 3px;
  background: #dc2626; border: 2px solid #fff;
  box-shadow: 0 1px 3px rgba(0,0,0,.2);
  cursor: nwse-resize; pointer-events: auto;
}

.zc-thread {
  position: absolute; min-width: 280px; max-width: 320px;
  background: #fff; color: #111; border-radius: 10px;
  box-shadow: 0 16px 40px rgba(0,0,0,.18);
  padding: 12px; z-index: 2147483635;
  pointer-events: auto;
  display: flex; flex-direction: column;
  max-height: min(70vh, 520px);
}
.zc-thread * { pointer-events: auto; }
.zc-thread .zc-thread-list {
  overflow-y: auto;
  margin: 0 -4px; padding: 0 4px;
  scrollbar-width: thin;
}
.zc-thread .row { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; font-size: 12px; color: #6b7280; }
.zc-thread .author { font-weight: 600; color: #111; }
.zc-thread .body { white-space: pre-wrap; font-size: 14px; line-height: 1.4; }
.zc-thread .reply { margin-top: 10px; padding-top: 10px; border-top: 1px solid #e5e7eb; }
.zc-thread .actions { display: flex; gap: 4px; justify-content: flex-end; margin-top: 8px; }
.zc-thread .actions .zc-btn { color: #374151; padding: 4px 8px; font-size: 12px; }
.zc-thread textarea {
  width: 100%; min-height: 64px; resize: vertical;
  padding: 8px; border-radius: 8px; border: 1px solid #d1d5db; font: inherit;
}
.zc-thread textarea:focus { outline: 2px solid #2563eb; outline-offset: -1px; border-color: transparent; }
.zc-thread textarea[disabled] { background: #f3f4f6; color: #6b7280; cursor: wait; }
.zc-thread .zc-btn[disabled] { opacity: .55; cursor: wait; }
.zc-composer-error {
  margin-top: 8px; padding: 6px 8px; border-radius: 6px;
  background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c;
  font-size: 12px; line-height: 1.3;
}

.zc-cursor {
  position: absolute; pointer-events: none;
  display: flex; align-items: flex-start;
  font: 11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  transition: left .08s linear, top .08s linear, opacity .15s ease;
  will-change: left, top;
}
.zc-cursor-row {
  display: flex; flex-direction: column; align-items: flex-start;
  margin: 14px 0 0 -2px; gap: 4px;
}
.zc-cursor-stack {
  display: flex; flex-direction: column; gap: 4px;
  align-items: flex-start;
}
.zc-cursor-label {
  background: var(--zc-user-color, currentColor); color: #fff;
  padding: 2px 7px; border-radius: 999px;
  font-weight: 600; line-height: 1.4;
  white-space: nowrap;
  box-shadow: 0 1px 3px rgba(0,0,0,.2);
}
.zc-cursor-msg {
  background: var(--zc-user-color, currentColor); color: #fff;
  padding: 4px 9px; border-radius: 12px;
  max-width: 240px; line-height: 1.35;
  word-wrap: break-word; white-space: pre-wrap;
  box-shadow: 0 2px 6px rgba(0,0,0,.18);
  transition: opacity .7s ease, transform .7s ease;
  transform: translateY(0);
}
.zc-cursor-msg[data-leaving="1"] {
  transform: translateY(-6px);
}
.zc-cursor-chat {
  position: fixed; pointer-events: auto;
  background: #fff; color: #fff;
  padding: 6px 12px; border-radius: 999px;
  box-shadow: 0 4px 16px rgba(0,0,0,.22);
  border: 1px solid transparent;
  display: flex; align-items: center;
}
.zc-cursor-chat input {
  border: 0; outline: 0; background: transparent;
  font: 13px inherit; min-width: 200px;
  color: inherit;
  caret-color: #fff;
}
.zc-cursor-chat input::placeholder {
  color: rgba(255,255,255,.75);
}

.zc-banner {
  position: fixed; bottom: 64px; right: 16px;
  background: #fff; color: #111; padding: 10px 14px; border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0,0,0,.18); font-size: 13px; z-index: 2147483646;
}
`;function x(e,t={},...n){const r=document.createElement(e);for(const[s,c]of Object.entries(t))s==="class"?r.className=c:r.setAttribute(s,c);for(const s of n)r.append(typeof s=="string"?document.createTextNode(s):s);return r}function ce(e){const t=new Date(e).getTime(),n=Math.max(1,Math.round((Date.now()-t)/1e3));if(n<60)return`${n}s ago`;const r=Math.round(n/60);if(r<60)return`${r}m ago`;const s=Math.round(r/60);return s<24?`${s}h ago`:new Date(e).toLocaleDateString()}function le(e,t,n,r,s={}){const c=x("div",{class:"zc-thread"}),l=x("div",{class:"zc-thread-list"}),h=new Set,m=u=>{const C=x("div",{class:u.id===e.id?"main":"reply"});C.setAttribute("data-cid",u.id);const j=x("div",{class:"row"});j.append(x("span",{class:"author"},u.author?.display_name||u.author?.email||"anon"),x("span",{},"·"),x("span",{},ce(u.created_at))),u.id===e.id&&u.status==="resolved"&&j.append(x("span",{},"·"),x("span",{},"resolved"));const v=x("div",{class:"body"},u.body);return C.append(j,v),C},i=u=>{h.has(u.id)||(h.add(u.id),l.append(m(u)),l.scrollTop=l.scrollHeight)};i(e);for(const u of t)i(u);const a=x("textarea",{placeholder:"Reply…"}),d=x("button",{class:"zc-btn primary"},"Reply"),f=x("button",{class:"zc-btn ghost"},e.status==="resolved"?"Reopen":"Resolve"),p=x("button",{class:"zc-btn ghost"},"Close"),g=x("button",{class:"zc-btn danger"},"Delete"),w=x("button",{class:"zc-btn ghost"},"Mark unread"),b=x("div",{class:"actions"});r&&e.author?.id===r&&b.append(g),b.append(w,f,p);const y=x("div",{class:"reply"},a,x("div",{class:"actions"},d));return c.append(l,y,b),d.onclick=async()=>{const u=a.value.trim();if(u){d.setAttribute("disabled","1");try{const C=await n.createComment({body:u,parent:e.id,snapshot:e.snapshot,url_path:e.url_path,kind:"point",x:0,y:0});a.value="",i(C),s.onReplied?.(C)}finally{d.removeAttribute("disabled")}}},f.onclick=async()=>{const u=e.status==="resolved"?"open":"resolved";await n.patchComment(e.id,{status:u}),s.onResolved?.()},g.onclick=async()=>{confirm("Delete this comment thread?")&&(await n.deleteComment(e.id),s.onDeleted?.())},p.onclick=()=>s.onClose?.(),w.onclick=()=>s.onMarkUnread?.(),a.addEventListener("keydown",u=>{(u.metaKey||u.ctrlKey)&&u.key==="Enter"&&(u.preventDefault(),d.click())}),{el:c,appendReply:i,getDraft:()=>a.value,scrollToBottom:()=>{l.scrollTop=l.scrollHeight}}}function Y(e){let t=0;if(typeof e=="number")t=e;else if(typeof e=="string")for(let r=0;r<e.length;r++)t=t*31+e.charCodeAt(r)|0;return`hsl(${(Math.abs(t)*137.508%360).toFixed(0)}, 72%, 45%)`}function de(e){if(!e)return"?";const t=e.trim();if(!t)return"?";const r=(t.includes("@")?t.split("@")[0]:t).split(/[\s._-]+/).filter(Boolean);return r.length===0?t.slice(0,2).toUpperCase():r.length===1?r[0].slice(0,2).toUpperCase():(r[0][0]+r[1][0]).toUpperCase()}function O(e,t,n=26){const r=document.createElement("div");return r.className="zc-avatar",r.style.background=Y(e),r.style.width=n+"px",r.style.height=n+"px",r.style.fontSize=Math.round(n*.4)+"px",r.textContent=de(t),r}const pe=6e4,ue=8e3,J=8e3;class he{constructor(t){this.cursors=new Map,this.container=document.createElement("div"),this.container.style.cssText="position:absolute;top:0;left:0;width:0;height:0;pointer-events:none;z-index:2147483628;",t.appendChild(this.container),this.gcTimer=window.setInterval(()=>this.evictStale(),2e3)}update(t,n){if(t.url_path&&t.url_path!==n)return;let r=this.cursors.get(t.user_id);r||(r=this.createCursor(t),this.cursors.set(t.user_id,r)),r.el.style.left=t.x+"px",r.el.style.top=t.y+"px",r.lastSeen=Date.now(),t.active===!1?r.el.style.opacity="0":r.el.style.opacity="1",this.renderMessages(r,t)}renderMessages(t,n){const r=t.el.querySelector(".zc-cursor-stack");if(!r)return;const s=(n.message||"").trim(),c=(n.released||[]).filter(a=>a.text&&a.age_ms<J),l=[];c.forEach((a,d)=>{l.push({key:`r:${d}:${a.text}`,text:a.text,preFade:a.age_ms>J-700})}),s&&l.push({key:"live",text:s,preFade:!1});const h=new Set(l.map(a=>a.key)),m=Array.from(r.children);for(const a of m){const d=a.dataset.key||"";!h.has(d)&&!a.dataset.leaving&&(a.dataset.leaving="1",a.style.opacity="0",setTimeout(()=>a.remove(),750))}const i=new Map(m.map(a=>[a.dataset.key||"",a]));for(const a of l){let d=i.get(a.key);if(d)r.appendChild(d),d.style.opacity=a.preFade?"0":"1";else{d=document.createElement("div"),d.className="zc-cursor-msg",d.dataset.key=a.key,d.style.opacity="0",r.appendChild(d);const f=a.preFade?"0":"1";requestAnimationFrame(()=>{d&&(d.style.opacity=f)})}d.textContent=a.text}}remove(t){const n=this.cursors.get(t);n&&(n.el.remove(),this.cursors.delete(t))}destroy(){clearInterval(this.gcTimer),this.container.remove(),this.cursors.clear()}createCursor(t){const n=document.createElement("div");n.className="zc-cursor";const r=Y(t.user_id);return n.style.color=r,n.style.setProperty("--zc-user-color",r),n.innerHTML=`<svg width="18" height="18" viewBox="0 0 18 18" style="display:block;filter:drop-shadow(0 1px 2px rgba(0,0,0,.25));">
        <path d="M2 1 L2 14 L6 11 L8.5 16.5 L11 15.5 L8.5 10 L13.5 10 Z"
          fill="currentColor" stroke="#fff" stroke-width="1" stroke-linejoin="round"/>
      </svg><div class="zc-cursor-row"><div class="zc-cursor-label">${fe(t.user_name).slice(0,24)}</div><div class="zc-cursor-stack"></div></div>`,this.container.appendChild(n),{el:n,lastSeen:Date.now()}}evictStale(){const t=Date.now();for(const[n,r]of this.cursors){const s=t-r.lastSeen;s>pe?(r.el.remove(),this.cursors.delete(n)):s>ue&&(r.el.style.opacity="0.45")}}}function fe(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}const me=1e4,N=5;class ge{constructor(t,n){this.users=new Map,this.container=t,this.excludeUserId=n,this.gcTimer=window.setInterval(()=>this.evictStale(),2e3)}saw(t,n){if(this.excludeUserId!==null&&t===this.excludeUserId)return;const r=this.users.get(t);if(r){r.lastSeen=Date.now(),r.user_name=n;return}this.users.set(t,{user_id:t,user_name:n,lastSeen:Date.now()}),this.render()}destroy(){clearInterval(this.gcTimer),this.container.innerHTML="",this.users.clear()}evictStale(){const t=Date.now();let n=!1;for(const[r,s]of this.users)t-s.lastSeen>me&&(this.users.delete(r),n=!0);n&&this.render()}render(){this.container.innerHTML="";const t=Array.from(this.users.values()).sort((r,s)=>r.user_id-s.user_id),n=t.slice(0,N);for(const r of n){const s=O(r.user_id,r.user_name,22);s.title=r.user_name,s.classList.add("zc-presence-av"),this.container.appendChild(s)}if(t.length>N){const r=document.createElement("div");r.className="zc-avatar zc-presence-av zc-presence-more",r.textContent="+"+(t.length-N),r.title=t.slice(N).map(s=>s.user_name).join(", "),this.container.appendChild(r)}}}function xe(e){return new Promise(t=>{const n=document.createElement("div");n.className="zc-thread";const r=e.clientY+window.scrollY+8,s=e.clientX+window.scrollX+8;n.style.top=r+"px",n.style.left=s+"px",n.style.position="absolute";const c=x("textarea",{placeholder:"Write a comment…"}),l=x("button",{class:"zc-btn primary"},"Post"),h=x("button",{class:"zc-btn ghost"},"Cancel"),m=x("div",{class:"zc-composer-error"});m.style.display="none";const i=x("div",{class:"actions"},h,l);n.append(c,m,i),e.container.appendChild(n),setTimeout(()=>c.focus(),0);const a=g=>{n.remove(),t(g)},d=g=>{g?(l.setAttribute("disabled","1"),h.setAttribute("disabled","1"),c.setAttribute("disabled","1"),l.textContent="Posting…"):(l.removeAttribute("disabled"),h.removeAttribute("disabled"),c.removeAttribute("disabled"),l.textContent="Post")},f=g=>{m.textContent=g,m.style.display=""},p=async()=>{const g=c.value.trim();if(g){m.style.display="none",d(!0);try{await e.onSubmit(g),a(g)}catch(w){const b=w instanceof Error?w.message:String(w);f("Failed to post: "+b),d(!1),c.focus()}}};h.onclick=()=>a(null),l.onclick=()=>{p()},c.addEventListener("keydown",g=>{g.key==="Escape"&&a(null),g.key==="Enter"&&(g.metaKey||g.ctrlKey)&&(g.preventDefault(),p())})})}function D(e,t){return new Promise(n=>{const r=x("div",{class:"zc-modal-overlay"});r.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:2147483647;";const s=x("div",{class:"zc-modal"}),c=x("h3",{},"Sign in to comment"),l=x("label",{},"Email"),h=x("input",{class:"zc-input",type:"email",autocomplete:"email"}),m=x("label",{},"Password"),i=x("input",{class:"zc-input",type:"password",autocomplete:"current-password"}),a=x("div",{class:"zc-hint"},"Account creation is admin-only. Ask your project owner to add you."),d=x("div",{class:"zc-err"}),f=x("button",{class:"zc-btn primary"},"Sign in"),p=x("button",{class:"zc-btn ghost"},"Cancel"),g=x("div",{class:"zc-row"},p,f);s.append(c,l,h,m,i,a,d,g),r.append(s),e.append(r),setTimeout(()=>h.focus(),0);const w=b=>{r.remove(),n(b)};p.onclick=()=>w(!1),f.onclick=async()=>{d.textContent="",f.setAttribute("disabled","1");try{await t.login(h.value.trim(),i.value),w(!0)}catch(b){d.textContent=b?.message?.slice(0,200)||"Failed"}finally{f.removeAttribute("disabled")}},[h,i].forEach(b=>b.addEventListener("keydown",y=>{y.key==="Enter"&&f.click()}))})}let o=null;function U(){return location.pathname+location.search}function W(){return o?.options.snapshotId?`snapshot:${o.options.snapshotId}`:location.pathname}function k(e,t=0,n=100){return Math.max(t,Math.min(n,e))}function ye(e){const t=document.createElement("div");t.id="zonecomments-host",t.style.cssText="position:absolute;top:0;left:0;width:0;height:0;",document.body.appendChild(t);const n=t.attachShadow({mode:"open"}),r=document.createElement("style");r.textContent=ie,n.appendChild(r);const s=document.createElement("div");s.style.cssText="position:absolute;top:0;left:0;width:0;height:0;pointer-events:none;z-index:2147483630;",n.appendChild(s);const c=document.createElement("div");c.style.cssText="position:absolute;top:0;left:0;width:0;height:0;pointer-events:none;z-index:2147483635;",n.appendChild(c);const l=new he(n),h=document.createElement("div");h.className="zc-overlay",n.appendChild(h);const m=document.createElement("div");m.className="zc-hover-outline",m.style.display="none",n.appendChild(m);const i=document.createElement("div");i.className="zc-zone-draft",i.style.display="none",n.appendChild(i);const a=document.createElement("div");a.className="zc-toolbar";const d=e.position||"bottom-right";d==="bottom-left"?a.classList.add("bl"):d==="top-right"?a.classList.add("tr"):d==="top-left"&&a.classList.add("tl"),n.appendChild(a);const f=new te(e.apiUrl,e.projectId);e.user?.token&&localStorage.setItem("zc:auth:"+e.projectId,JSON.stringify({access:e.user.token,refresh:e.user.refresh}));const p=new ae(e.apiUrl,e.projectId,()=>f.token,(u,C)=>Me(u,C)),g=()=>{s.style.width=document.documentElement.scrollWidth+"px",s.style.height=document.documentElement.scrollHeight+"px"},w=document.createElement("div");w.className="zc-presence";const b=document.createElement("span");return b.className="zc-pill",b.textContent="0",o={api:f,ws:p,options:e,root:n,layer:s,threadLayer:c,cursors:l,overlay:h,toolbar:a,presenceRow:w,presence:null,countPill:b,hoverOutline:m,draftRect:i,comments:new Map,pinNodes:new Map,openThreadId:null,openThreadEl:null,openThreadController:null,mode:"idle",positionAttrs:g},A(),g(),new ResizeObserver(()=>B()).observe(document.documentElement),window.addEventListener("scroll",()=>B(),{passive:!0}),window.addEventListener("resize",()=>B()),o}function A(){if(!o)return;const e=o.toolbar;e.innerHTML="";const t=S(o.options.projectId);o.presence&&o.presence.destroy(),o.presenceRow.innerHTML="",o.presence=new ge(o.presenceRow,t?.user?.id??null);const n=document.createElement("button");t?.user?(n.className="zc-avatar-btn",n.title=`Signed in as ${t.user.display_name||t.user.email} — click to sign out`,n.appendChild(O(t.user.id,t.user.display_name||t.user.email,26))):t?(n.className="zc-avatar-btn",n.title="Signed in — click to sign out",n.appendChild(O("anon","?",26))):(n.className="zc-btn ghost",n.textContent="Sign in"),n.onclick=async()=>{if(t){if(!confirm("Sign out?"))return;o.api.logout(),A(),o.ws.stop()}else await D(o.root,o.api)&&(A(),await _(),o.ws.start())};const r=document.createElement("button");r.className="zc-btn primary",r.textContent=o.mode==="placing"?"Cancel":"Comment",r.onclick=async()=>{if(!S(o.options.projectId)){if(!await D(o.root,o.api))return;A(),await _(),o.ws.start()}$(o.mode==="placing"?"idle":"placing")},e.append(o.presenceRow,o.countPill,r,n)}function $(e){o&&(o.mode=e,o.overlay.classList.toggle("active",e==="placing"),o.hoverOutline.style.display="none",o.draftRect.style.display="none",A())}let E=null;function we(e){if(!o||o.mode!=="placing")return;if(E){o.draftRect.style.display="block";const r=Math.min(E.x,e.clientX),s=Math.min(E.y,e.clientY),c=Math.abs(e.clientX-E.x),l=Math.abs(e.clientY-E.y);o.draftRect.style.left=r+"px",o.draftRect.style.top=s+"px",o.draftRect.style.width=c+"px",o.draftRect.style.height=l+"px";return}const t=Z(e.clientX,e.clientY);if(!t){o.hoverOutline.style.display="none";return}const n=t.getBoundingClientRect();o.hoverOutline.style.display="block",o.hoverOutline.style.left=n.left+"px",o.hoverOutline.style.top=n.top+"px",o.hoverOutline.style.width=n.width+"px",o.hoverOutline.style.height=n.height+"px"}function be(e){if(!o||o.mode!=="placing")return;e.preventDefault();const t=Z(e.clientX,e.clientY);E={x:e.clientX,y:e.clientY,el:t}}async function ve(e){if(!o||o.mode!=="placing"||!E)return;const{x:t,y:n,el:r}=E;if(E=null,o.draftRect.style.display="none",o.hoverOutline.style.display="none",!r)return;const s=e.clientX-t,c=e.clientY-n,h=Math.hypot(s,c)>=6,m=se(r),a=(o.root&&document.querySelector(m.selector)||r).getBoundingClientRect();let d;if(h){const w=Math.min(t,e.clientX),b=Math.min(n,e.clientY),y=Math.max(t,e.clientX),u=Math.max(n,e.clientY);d={kind:"zone",x:k((w-a.left)/a.width*100),y:k((b-a.top)/a.height*100),width:k((y-w)/a.width*100),height:k((u-b)/a.height*100)}}else d={kind:"point",x:k((e.clientX-a.left)/a.width*100),y:k((e.clientY-a.top)/a.height*100)};$("idle");const f=o,p={created:null};await xe({container:f.layer,clientX:e.clientX,clientY:e.clientY,onSubmit:async w=>{p.created=await f.api.createComment({...d,body:w,snapshot:f.options.snapshotId??null,url_path:U(),viewport_width:window.innerWidth,viewport_height:window.innerHeight,anchor_selector:m.selector,anchor_tag:m.tag,anchor_text_hint:m.textHint})}})&&(p.created?(f.comments.set(p.created.id,p.created),z()):await _())}function Z(e,t){if(!o)return null;o.overlay.style.pointerEvents="none",o.hoverOutline.style.pointerEvents="none";const n=document.elementFromPoint(e,t);return o.overlay.style.pointerEvents="",!n||n.closest?.("#zonecomments-host")?null:n}function ze(e,t=4e3){if(!o)return;const n=x("div",{class:"zc-banner"},e);o.root.appendChild(n),setTimeout(()=>n.remove(),t)}async function _(){if(!(!o||!o.api.token))try{const e=o.options.snapshotId?await o.api.listComments({snapshotId:o.options.snapshotId,status:"open"}):await o.api.listComments({urlPath:U(),status:"open"});o.comments.clear();for(const t of e)o.comments.set(t.id,t);z()}catch(e){e?.status!==401&&console.error("[zonecomments] list failed",e)}}function ke(){return o?Array.from(o.comments.values()).filter(e=>!e.parent).sort((e,t)=>e.created_at.localeCompare(t.created_at)):[]}function z(){if(!o)return;o.layer.innerHTML="",o.pinNodes.clear();const e=ke();o.countPill.textContent=String(e.length),e.forEach((t,n)=>Ce(t,n+1)),o.positionAttrs()}function Ce(e,t){if(!o)return;const n=X({selector:e.anchor_selector,tag:e.anchor_tag,textHint:e.anchor_text_hint}),r=!n,s=n?n.el.getBoundingClientRect():{left:8,top:8,width:0,height:0},c=window.scrollX,l=window.scrollY,h=Array.from(o.comments.values()).filter(p=>p.parent===e.id),m=!!e.unread||h.some(p=>!!p.unread);let i,a,d=null;if(e.kind==="zone"){const p=document.createElement("div");if(p.className="zc-zone-outline"+(m?" unread":" read")+(r?" lost":""),n){i=s.left+c+e.x/100*s.width,a=s.top+l+e.y/100*s.height;const g=Math.max(20,e.width/100*s.width),w=Math.max(20,e.height/100*s.height);p.style.left=i+"px",p.style.top=a+"px",p.style.width=g+"px",p.style.height=w+"px"}else i=8+c,a=8+l+(t-1)*32,p.style.left=i+"px",p.style.top=a+"px",p.style.width="120px",p.style.height="26px";if(o.layer.appendChild(p),d=p,n){const g=document.createElement("div");g.className="zc-zone-handle",g.title="Drag to resize",p.appendChild(g),g.addEventListener("mousedown",w=>{w.preventDefault(),w.stopPropagation(),Te(p,e,w)})}}else i=n?s.left+c+e.x/100*s.width:24+c,a=n?s.top+l+e.y/100*s.height:24+l+(t-1)*32;const f=document.createElement("div");f.className="zc-pin"+(r?" lost":"")+(m?" unread":" read"),f.style.left=i+"px",f.style.top=a+"px",f.textContent=String(t),f.title=r?"anchor changed — best-effort placement":"Drag to move · click to open",f.addEventListener("mousedown",p=>{p.preventDefault(),p.stopPropagation(),Ee(f,e,d,p)}),o.layer.appendChild(f),o.pinNodes.set(e.id,f)}function Ee(e,t,n,r){if(!o)return;const s=X({selector:t.anchor_selector,tag:t.anchor_tag,textHint:t.anchor_text_hint});if(!s){F(t);return}const c=s.el.getBoundingClientRect(),l=r.clientX,h=r.clientY,m=n?parseFloat(n.style.left):0,i=n?parseFloat(n.style.top):0,a=parseFloat(e.style.left),d=parseFloat(e.style.top);let f=!1;const p=w=>{const b=w.clientX-l,y=w.clientY-h;!f&&Math.hypot(b,y)>4&&(f=!0),f&&(e.style.left=a+b+"px",e.style.top=d+y+"px",n&&(n.style.left=m+b+"px",n.style.top=i+y+"px"))},g=async w=>{if(window.removeEventListener("mousemove",p,!0),window.removeEventListener("mouseup",g,!0),!f){F(t);return}const b=k((w.clientX-c.left)/c.width*100),y=k((w.clientY-c.top)/c.height*100);try{const u=await o.api.patchComment(t.id,{x:b,y});o.comments.set(u.id,{...u,unread:!1})}catch(u){console.warn("[zonecomments] move failed",u)}z()};window.addEventListener("mousemove",p,!0),window.addEventListener("mouseup",g,!0)}function Te(e,t,n){if(!o)return;const r=X({selector:t.anchor_selector,tag:t.anchor_tag,textHint:t.anchor_text_hint});if(!r)return;const s=r.el.getBoundingClientRect();parseFloat(e.style.left),parseFloat(e.style.top);const c=n.clientX,l=n.clientY,h=e.offsetWidth,m=e.offsetHeight,i=d=>{const f=Math.max(20,h+(d.clientX-c)),p=Math.max(20,m+(d.clientY-l));e.style.width=f+"px",e.style.height=p+"px"},a=async d=>{window.removeEventListener("mousemove",i,!0),window.removeEventListener("mouseup",a,!0);const f=Math.max(20,h+(d.clientX-c)),p=Math.max(20,m+(d.clientY-l)),g=k(f/s.width*100),w=k(p/s.height*100);try{const b=await o.api.patchComment(t.id,{width:g,height:w});o.comments.set(b.id,{...b,unread:!1})}catch(b){console.warn("[zonecomments] resize failed",b)}z()};window.addEventListener("mousemove",i,!0),window.addEventListener("mouseup",a,!0)}function B(){if(z(),o?.openThreadId){const e=o.comments.get(o.openThreadId);e&&F(e)}}function F(e){if(!o)return;const t=o.openThreadController?.getDraft()??"";o.openThreadEl&&o.openThreadEl.remove();const n=Array.from(o.comments.values()).filter(i=>i.parent===e.id),r=S(o.options.projectId);if((!!e.unread||n.some(i=>!!i.unread))&&o.api.token){e.unread=!1,o.comments.set(e.id,e);for(const i of n)i.unread=!1,o.comments.set(i.id,i);z(),o.api.markThreadRead(e.id).catch(i=>{console.warn("[zonecomments] markThreadRead failed",i)})}const c=le(e,n,o.api,r?.user?.id??null,{onClose:()=>I(),onResolved:()=>{if(o){o.comments.delete(e.id);for(const i of Array.from(o.comments.values()))i.parent===e.id&&o.comments.delete(i.id);I(),z()}},onDeleted:()=>{if(o){o.comments.delete(e.id);for(const i of Array.from(o.comments.values()))i.parent===e.id&&o.comments.delete(i.id);I(),z()}},onReplied:i=>{o&&(i.unread=!1,o.comments.set(i.id,i),z())},onMarkUnread:async()=>{if(!o)return;try{await o.api.markThreadUnread(e.id)}catch(a){console.warn("[zonecomments] markThreadUnread failed",a);return}const i=o.comments.get(e.id);i&&(i.unread=!0,o.comments.set(i.id,i));for(const a of Array.from(o.comments.values()))a.parent===e.id&&(a.unread=!0,o.comments.set(a.id,a));I(),z()}}),l=o.pinNodes.get(e.id);let h=16+window.scrollX,m=64+window.scrollY;if(l){const i=l.getBoundingClientRect();h=i.right+window.scrollX+8,m=i.top+window.scrollY,h+320>window.scrollX+window.innerWidth&&(h=i.left+window.scrollX-320-8)}if(c.el.style.left=Math.max(8,h)+"px",c.el.style.top=Math.max(8,m)+"px",o.threadLayer.appendChild(c.el),o.openThreadId=e.id,o.openThreadEl=c.el,o.openThreadController=c,t){const i=c.el.querySelector("textarea");i&&(i.value=t)}c.scrollToBottom()}function I(){o&&(o.openThreadEl?.remove(),o.openThreadEl=null,o.openThreadId=null,o.openThreadController=null)}function G(e){const t=typeof e.composedPath=="function"?e.composedPath():[];for(const n of t){const r=n;if(!r||!r.tagName)continue;if(r.isContentEditable)return!0;const s=r.tagName;if(s==="INPUT"||s==="TEXTAREA"||s==="SELECT")return!0}return!1}async function Se(e){if(o&&!G(e)&&!(e.metaKey||e.ctrlKey||e.altKey))if(e.key==="c"||e.key==="C"){if(!S(o.options.projectId)){if(!await D(o.root,o.api))return;A(),await _(),o.ws.start()}$(o.mode==="placing"?"idle":"placing"),e.preventDefault()}else e.key==="Escape"&&o.mode==="placing"&&$("idle")}function Me(e,t){if(o){if(e==="ws.rejected"){const n=t?.code===4403?"Real-time disabled — your account isn't a member of this project. Ask the owner to add you in the dashboard.":t?.code===4401?"Real-time disabled — sign in again.":"Real-time disabled — connection rejected.";ze(n,12e3);return}if(e==="cursor"){o.cursors.update(t,W()),t?.active!==!1&&o.presence?.saw(t.user_id,t.user_name);return}if(e==="comment.created"||e==="comment.updated"){const n=t,r=o.options.snapshotId??null;if(r){if(n.snapshot!==r)return}else if(n.url_path&&n.url_path!==U())return;const s=S(o.options.projectId)?.user?.id??null;s&&n.author?.id===s&&(n.unread=!1),n.status==="resolved"&&!n.parent?o.comments.delete(n.id):o.comments.set(n.id,n),z(),e==="comment.created"&&n.parent&&o.openThreadId===n.parent&&o.openThreadController&&o.openThreadController.appendReply(n)}else e==="comment.deleted"&&(o.comments.delete(t.id),z())}}const V={init(e){if(o)return;const t=ye(e);t.overlay.addEventListener("mousemove",we),t.overlay.addEventListener("mousedown",be),t.overlay.addEventListener("mouseup",ve),document.addEventListener("click",y=>{if(!o?.openThreadEl)return;const u=y.target;o.openThreadEl.contains(u)||y.target?.closest?.("#zonecomments-host")||I()}),document.addEventListener("keydown",Se,{capture:!0});let n=0,r=0,s=0,c=0,l=0,h="",m=0,i=null;const a=[],d=8e3,f=100,p=()=>{if(!o)return;const y=performance.now();for(;a.length&&y-a[0].releasedAt>d;)a.shift();o.ws.send({type:"cursor",url_path:W(),x:c,y:l,active:!0,message:h,released:a.map(u=>({text:u.text,age_ms:Math.floor(y-u.releasedAt)}))})};document.addEventListener("mousemove",y=>{if(!o)return;r=y.clientX,s=y.clientY,c=y.clientX+window.scrollX,l=y.clientY+window.scrollY,i&&(i.style.left=r+18+"px",i.style.top=s+18+"px");const u=performance.now();u-n<50||(n=u,p())}),setInterval(()=>{o&&(h&&m&&performance.now()>m&&(a.push({text:h,releasedAt:performance.now()}),h="",m=0,i&&(i.remove(),i=null)),(h||a.length)&&p())},800);const g=()=>{h.trim()&&(a.push({text:h.trim(),releasedAt:performance.now()}),h="",m=0)},w=()=>b(r+18,s+18),b=(y,u)=>{if(!o||i)return;const C=S(o.options.projectId),j=Y(C?.user?.id??"anon"),v=document.createElement("div");v.className="zc-cursor-chat",v.style.background=j,v.style.color="#fff",v.style.borderColor="transparent";const T=document.createElement("input");T.placeholder="Say something…",T.maxLength=f,v.appendChild(T),v.style.position="fixed",v.style.zIndex="2147483628",v.style.left=y+"px",v.style.top=u+"px",o.root.appendChild(v),i=v,setTimeout(()=>T.focus(),0);const H=()=>{i===v&&(document.removeEventListener("mousedown",Q,!0),i.remove(),i=null)},Q=M=>{(typeof M.composedPath=="function"?M.composedPath():[]).includes(v)||H()};document.addEventListener("mousedown",Q,!0),T.addEventListener("input",()=>{h=T.value.slice(0,f),m=performance.now()+d,p()}),T.addEventListener("keydown",M=>{if(M.key==="Escape"||M.key==="Enter"){M.preventDefault(),H();return}if(M.key==="/"){M.preventDefault();const ee=parseFloat(v.style.top||"0");g(),p(),H(),b(parseFloat(v.style.left||"0"),ee+36)}}),T.addEventListener("blur",()=>{setTimeout(()=>{i===v&&T.focus()},0)})};if(document.addEventListener("keydown",y=>{o&&(G(y)||y.metaKey||y.ctrlKey||y.altKey||y.key==="/"&&!i&&(y.preventDefault(),w()))},{capture:!0}),t.api.token){_(),t.ws.start();const y=S(e.projectId);y&&!y.user&&fetch(e.apiUrl.replace(/\/$/,"")+"/api/me",{headers:{Authorization:`Bearer ${y.access}`}}).then(u=>u.ok?u.json():null).then(u=>{u&&(R(e.projectId,{...y,user:u}),A())}).catch(()=>{})}},show(){const e=document.getElementById("zonecomments-host");e&&(e.style.display="")},hide(){const e=document.getElementById("zonecomments-host");e&&(e.style.display="none")}};return window.ZoneComments=V,V})();
//# sourceMappingURL=zonecomments.iife.js.map
