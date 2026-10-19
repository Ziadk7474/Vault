const C='duevault-v1',A=['./','index.html','manifest.webmanifest','icons/icon-192.png','icons/icon-512.png','icons/favicon.svg'];
self.addEventListener('install',e=>e.waitUntil(caches.open(C).then(c=>c.addAll(A)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET'||new URL(r.url).origin!==location.origin)return;
e.respondWith(fetch(r).then(res=>{const cp=res.clone();caches.open(C).then(c=>c.put(r,cp));return res}).catch(()=>caches.match(r).then(m=>m||caches.match('index.html'))))});
self.addEventListener('push',e=>{let p={title:'DueVault',body:'You have an installment update.'};try{const d=e.data.json();p=d.data||d.notification||d}catch(_){}
e.waitUntil(self.registration.showNotification(p.title,{body:p.body,tag:p.tag||'duevault',icon:'icons/icon-192.png',badge:'icons/favicon-32.png',data:{url:p.url||'./'}}))});
self.addEventListener('notificationclick',e=>{e.notification.close();e.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(l=>l.length?l[0].focus():clients.openWindow(e.notification.data?.url||'./')))});
