const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../instrument.js'),'utf8');
const context=vm.createContext({active:{name:'Amen'},dropStart:0,angleStyle:'original'});
vm.runInContext(source.slice(source.indexOf('const angleStudies='),source.indexOf('const faders=')),context);
vm.runInContext(source.slice(source.indexOf('function phrase('),source.indexOf('function scheduleStep(')),context);
let cases=0;
for(const style of ['original','early','late','broken']){
 const sequences=new Set();
 for(let value=0;value<=100;value++){
  const sequence=[];
  for(let cycle=0;cycle<8;cycle++)for(const response of [false,true]){
   const n=cycle*32+(response?16:0),pattern=context.anglePattern(value/100,response,style,n);
   sequence.push(pattern.name);
   const positions=[...pattern.snares,...pattern.kicks,pattern.shuffle];
   assert(positions.every(p=>Number.isInteger(p)&&p>=0&&p<16));
   assert(pattern.snares.every(snare=>!pattern.kicks.includes(snare)));
   assert(![...pattern.snares,...pattern.kicks].includes(pattern.shuffle));
   assert.equal(pattern.name,context.anglePattern(value/100,!response,style,n).name,'coherent call/response study');
   assert.equal(JSON.stringify(pattern),JSON.stringify(context.anglePattern(value/100,response,style,n+256)),'repeatable cycle');
  }
  sequences.add(sequence.join(','));
 }
 assert(sequences.size>25,'substantially more variation than four patterns');
 context.angleStyle=style;
 for(const bank of ['Amen','Think'])for(const a of [0,.12,.25,.5,.69,.85,1])for(const dropped of [false,true])for(const filling of [false,true])for(let n=0;n<256;n++){
  context.active.name=bank;
  const hits=context.phrase(n,.9,a,.9,.95,dropped,filling);
  for(const hit of hits){assert(hit.span>0);assert(Number.isFinite(hit.gain));assert.equal(hit.delay,hit.fill?hit.delay:0,'all non-fill hits stay on sixteenth grid');assert(Number.isInteger(hit.delay*2),'fills stay on 32nd grid');}
  const pattern=context.anglePattern(a,n%32>=16,style,n);
  for(const hit of hits.filter(h=>!h.fill&&['shuffle','longShuffle'].includes(h.name))){
   const pos=n%16,next=Math.min(...[...pattern.snares,...pattern.kicks,16].filter(p=>p>pos));
   assert(pos+hit.span<next,'shuffle clears next structural hit');
  }
  cases++;
 }
 console.log(`${style}: ${sequences.size} repeatable slider sequences`);
}
console.log(`${cases} event cases passed: grid, spacing, shuffle clearance, and repeatability.`);

assert.equal(vm.runInContext('angleRoutes.original.map(i=>angleStudies[i].name).join(",")',context),'Backbeat,Anticipated answer,Open answer,Turnaround,Early exchange,Offbeat kick');

// Hat density belongs to drive; Angle only changes the base positions.
const oldSource=fs.readFileSync(path.join(__dirname,'../desktop/angle-studies/before-hat-balance.js'),'utf8');
const before=vm.createContext({active:{name:'Amen'},dropStart:0,angleStyle:'original'});
vm.runInContext(oldSource.slice(oldSource.indexOf('const angleStudies='),oldSource.indexOf('const faders=')),before);
vm.runInContext(oldSource.slice(oldSource.indexOf('function phrase('),oldSource.indexOf('function scheduleStep(')),before);
// Compare the hat algorithm with the current approved structural placements.
for(const id of [3,5]){
 const study=vm.runInContext(`angleStudies[${id}]`,context);
 vm.runInContext(`Object.assign(angleStudies[${id}],${JSON.stringify(study)})`,before);
}
const isHat=h=>['hat','ride'].includes(h.name);
for(let id=0;id<9;id++){
 for(const c of [before,context]){vm.runInContext(`angleRoutes.original=[${id}]`,c);c.angleStyle='original';c.active.name='Amen';}
 let counts=[0,0];
 for(let n=0;n<32;n++){
  const args=[n,.42,0,.5,.5,false,false];
  const hits=context.phrase(...args),original=before.phrase(...args);
  assert.equal(JSON.stringify(hits.filter(h=>!isHat(h))),JSON.stringify(original.filter(h=>!isHat(h))),'preserve non-hat events');
  counts[Math.floor(n/16)]+=hits.filter(isHat).length;
  let prior=-1;
  for(const drive of [0,.25,.5,.75,1]){
   const hats=context.phrase(...args,drive).filter(isHat);
   assert(hats.length<=1,'never double a hat trigger');
   const gain=hats.reduce((sum,h)=>sum+h.gain,0);assert(gain>=prior,'drive never removes existing hats');prior=gain;
  }
  if(id===8)assert.equal(JSON.stringify(context.phrase(...args,.5).filter(isHat)),JSON.stringify(original.filter(isHat)),'restored Turnaround hats match original exactly');
 }
 assert.equal(counts.join(','),'5,6','equal base density for every study');
}
console.log('Hat balance passed: 11 hits per phrase, unchanged other voices, monotonic drive, exact Turnaround restoration.');

// Higher Angle must retain Turnaround's anticipated opening snare.
for(const id of [3,5]){
 const study=vm.runInContext(`angleStudies[${id}]`,context);
 const turnaround=vm.runInContext('angleStudies[8]',context);
 assert(study.call[0]<=turnaround.call[0]);
 assert(study.reply[0]<=turnaround.reply[0]);
}

assert.equal(vm.runInContext('angleStudies[3].call.join()+"/"+angleStudies[3].reply.join()',context),'2,11,9,6/3,9,14,11');
assert.equal(vm.runInContext('angleStudies[5].call.join()+"/"+angleStudies[5].reply.join()',context),'1,10,7,4/1,9,14,11');
