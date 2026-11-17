const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
function load(file){const s=fs.readFileSync(path.join(__dirname,'..',file),'utf8'),c=vm.createContext({active:{name:'Amen'},angleStyle:'original',dropStart:0});vm.runInContext(s.slice(s.indexOf('const angleStudies='),s.indexOf('const faders=')),c);vm.runInContext(s.slice(s.indexOf('function phrase('),s.indexOf('function scheduleStep(')),c);return c;}
const now=load('instrument.js'),before=load('desktop/interactions/before.js');
for(const bank of ['Amen','Think'])for(const style of ['original','early','late','broken'])for(let a=0;a<=100;a++)for(let n=0;n<256;n++){
 for(const c of [now,before]){c.active.name=bank;c.angleStyle=style;}
 assert.equal(JSON.stringify(now.phrase(n,.42,a/100,.5,.5,false,false)),JSON.stringify(before.phrase(n,.42,a/100,.5,.5,false,false)),'approved reference unchanged');
}
now.angleStyle='original';
let previous=-1;
for(let r=0;r<=100;r++){
 let count=0;for(let n=16;n<256;n+=32)count+=now.hasReply(n,r/100);
 assert(count>=previous);previous=count;
 if(r===0)assert.equal(count,0);if(r>=40)assert.equal(count,8);
}
for(const role of ['kick','accent','hat','shuffle']){
 let prev=0;for(let r=0;r<=100;r++){const gate=now.reachGate(r/100,role);assert(gate>=prev&&Number.isFinite(gate));if(r)assert(gate-prev<.19);prev=gate;}
}
let count=0;
for(const bank of ['Amen','Think'])for(const a of [0,.2,.4,.6,.8,1])for(const w of [0,.15,.42,.7,.85,1])for(const reach of [.05,.2,.5,.6,.7,1])for(const r of [0,.15,.28,.4,.5,1])for(let n=0;n<32;n++){
 now.active.name=bank;
 const events=now.phrase(n,w,a,r,reach,false,false);
 const pattern=now.anglePattern(a,now.hasReply(n,r),'original',n),s=n%16;
 for(const e of events){assert.equal(e.delay,0);assert(e.gain>=0&&e.gain<=1.2&&Number.isFinite(e.gain));assert(e.span>0);assert(now.reachGate(reach,e.name)>0);}
 for(const kick of pattern.kicks)if(kick===s)assert(events.some(e=>['kick','kick2'].includes(e.name)),'Weight never erases the anchor kick');
 for(const snare of pattern.snares)if(snare===s)assert(events.some(e=>['accent','accent2','lateAccent'].includes(e.name)),'preserve structural snares');
 const shuffles=events.filter(e=>['shuffle','longShuffle'].includes(e.name));
 if(shuffles.length){assert.equal(s,pattern.shuffle);assert(Math.abs(shuffles.reduce((sum,e)=>sum+e.gain,0)-(.52+Math.min(1,w/.7)*.45))<1e-10,'shuffle morph keeps combined gain');const next=Math.min(...[...pattern.snares,...pattern.kicks,16].filter(p=>p>s));assert(shuffles.every(e=>s+e.span<next));}
 count++;
}
console.log(`Interactions: reference unchanged across 101 Angle positions and all routes; ${count} combination cases passed; Reply and Reach monotonic.`);
