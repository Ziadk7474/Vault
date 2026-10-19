// DueVault reminder job: runs hourly, sends each workspace's reminders at its chosen hour/timezone.
const {onSchedule}=require('firebase-functions/v2/scheduler');
const admin=require('firebase-admin');admin.initializeApp();
const DEF={tz:'Asia/Dubai',hour:9,overdue:true};
const CAT={vehicle:'vehicle',property:'property',personal:'personal loan',card:'credit card',equipment:'equipment',loan:'loan',bill:'recurring bill'};
const money=(n,c)=>`${c||'AED'} ${Number(n).toLocaleString('en-US',{minimumFractionDigits:0,maximumFractionDigits:2})}`;
function due(p,i){const[y,m,d]=p.start.split('-').map(Number);const dim=new Date(Date.UTC(y,m+i,0)).getUTCDate();return new Date(Date.UTC(y,m-1+i,Math.min(d,dim)))}
function msg(p,i,left,owed){const nm=p.ref&&!p.name.includes(p.ref)?`${p.name} (${p.ref})`:p.name,a=money(owed,p.cur),k=CAT[p.cat]||'';
 if(left<0)return{title:'Installment overdue',body:`Your installment for ${nm} remains unpaid. Amount outstanding: ${a}. Please review its status.`};
 if(left===0)return{title:'Installment due today',body:`Your ${a} ${k?k+' ':''}installment for ${nm} is due today. Please check your bank balance or deposit the required amount.`};
 return{title:left===1?"Tomorrow's installment reminder":`Installment due in ${left} days`,body:`Your ${k?k+' ':''}installment for ${nm} is due ${left===1?'tomorrow':'in '+left+' days'}. Amount: ${a}. Please check your bank balance and ensure sufficient funds are available.`}}
exports.dailyReminders=onSchedule({schedule:'0 * * * *',timeZone:'UTC'},async()=>{
 const spaces=(await admin.database().ref('spaces').once('value')).val()||{};const now=new Date();
 for(const [code,sp] of Object.entries(spaces)){
  const cfg={...DEF,...(sp.settings||{})};
  const hr=Number(new Intl.DateTimeFormat('en-GB',{hour:'numeric',hour12:false,timeZone:cfg.tz}).format(now))%24;if(hr!==Number(cfg.hour))continue;
  const[ty,tm,td]=now.toLocaleDateString('en-CA',{timeZone:cfg.tz}).split('-').map(Number);const today=Date.UTC(ty,tm-1,td);
  const toks=Object.entries(sp.tokens||{});const out=[];
  for(const p of Object.values(sp.items||{})){
   if(['archived','paused'].includes(p.status))continue;const rec=p.rec||{};
   for(let i=0;i<p.months;i++){const r=rec[i]||{};if(r.s==='skipped')continue;const a=Number(r.amt??p.amt),owed=a-(Number(r.paid)||0);if(owed<=0)continue;
    const left=Math.round((due(p,i)-today)/864e5);const rm=Number(p.remind??1);
    if(left===rm&&left>0||left===0||(left<0&&left>=-14&&cfg.overdue!==false))out.push({...msg(p,i,left,owed),tag:`${p.id}-${i}`,plan:p.name});}}
  let n=0;for(const m of out){n++;
   await admin.database().ref(`spaces/${code}/notifs/${Date.now()}${n}`).set({t:Date.now(),title:m.title,body:m.body,plan:m.plan});
   if(!toks.length)continue;
   const res=await admin.messaging().sendEachForMulticast({tokens:toks.map(([,v])=>v.t),data:{title:m.title,body:m.body,tag:m.tag,url:'./'},webpush:{headers:{Urgency:'high'}}});
   const dead=[];res.responses.forEach((r,ix)=>{if(!r.success&&/not-registered|invalid-argument/.test(r.error?.code||''))dead.push(toks[ix][0])});
   await Promise.all(dead.map(k=>admin.database().ref(`spaces/${code}/tokens/${k}`).remove()));}}});
