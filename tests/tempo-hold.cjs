const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const s=fs.readFileSync(require('node:path').join(__dirname,'../instrument.js'),'utf8');
const c=vm.createContext({});vm.runInContext(s.slice(s.indexOf('function createTempoHold('),s.indexOf('const tempoHold='))+';this.create=createTempoHold',c);
let now=0,job=null,count=0,bpm=168,intervals=[];
const hold=c.create(delta=>{count++;bpm=Math.max(60,Math.min(240,bpm-delta))},()=>now,(fn,delay)=>{intervals.push(delay);job={fn,at:now+delay};return 1},()=>{job=null});
function advance(ms){const until=now+ms;while(job&&job.at<=until){now=job.at;const fn=job.fn;job=null;fn()}now=until}
hold.start('up',-1);assert.equal(bpm,169);advance(499);assert.equal(count,1);advance(1);assert.equal(count,2);assert.equal(intervals[1],280);
hold.start('up',-1);assert.equal(count,2,'OS repeat cannot restart or double-step');advance(5000);
assert(intervals.at(-1)<=61);assert(intervals.slice(2).every((n,i)=>n<=intervals[i+1]),'repeat accelerates smoothly');
hold.stop('down');assert(job,'unrelated release does not stop active direction');hold.stop('up');const stopped=count;advance(1000);assert.equal(count,stopped);
hold.start('down',1);assert.equal(intervals.at(-1),500,'direction changes reset fine adjustment delay');hold.stop();advance(1000);assert.equal(count,stopped+1);
hold.start('up',-1);advance(20000);assert.equal(bpm,240);hold.stop();assert.equal(job,null);
console.log('Tempo hold: immediate step, initial delay, smooth acceleration, duplicate suppression, release, reversal and limit passed.');

// Compare every repeat in the fine-control window against the previous curve.
let clock=0,pending,delays=[];
const fine=c.create(()=>{},()=>clock,(fn,delay)=>{delays.push({time:clock,delay});pending={fn,at:clock+delay};return 1},()=>{pending=null});
fine.start('up',-1);
while(pending&&pending.at<14000){clock=pending.at;pending.fn()}
for(const {time,delay} of delays.slice(1)){
 const p=Math.max(0,Math.min(1,(time-500)/4000));
 const previous=280-220*p*p*(3-2*p);
 if(time<=4500)assert(Math.abs(delay-previous)<1e-9,'first 4.5 seconds unchanged');
 else assert(delay<previous,'later hold accelerates further');
 const late=Math.max(0,Math.min(1,(time-4500)/4000));
 const previousTail=previous-15*late*late*(3-2*late);
 if(time<=8500)assert(Math.abs(delay-previousTail)<1e-9,'first 8.5 seconds unchanged');
 else assert(delay<previousTail,'acceleration continues after 8.5 seconds');
 assert(delay>=30,'extended acceleration stays capped');
 if(time>=12000)assert.equal(delay,30,'cap reached at 12 seconds');
}
assert.equal(delays.at(-1).delay,30);
fine.stop();
console.log('Extended ramp: initial 8.5 seconds unchanged; extra acceleration reaches 30ms cap at 12 seconds.');
