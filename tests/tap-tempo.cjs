const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(require('node:path').join(__dirname,'../instrument.js'),'utf8');
const context=vm.createContext({});
vm.runInContext(source.slice(source.indexOf('function createTapTempo'),source.indexOf('const homeTaps='))+';this.create=createTapTempo',context);
for(const bpm of [60,90,120,168,200,240]){
 const taps=context.create();
 for(let i=0;i<3;i++)assert.equal(taps.tap(i*60000/bpm,70),null);
 assert.equal(taps.tap(3*60000/bpm,70),bpm);
}
for(const times of [[0,350,1100,1450],[0,100,200,300],[0,1100,2200,3300]]){
 const taps=context.create();for(const t of times)assert.equal(taps.tap(t,60),null);
}
for(const interruption of ['reset','hold','pause']){
 const taps=context.create();[0,400,800].forEach(t=>assert.equal(taps.tap(t,60),null));
 if(interruption==='reset')taps.reset();
 if(interruption==='hold')assert.equal(taps.tap(1200,550),null);
 assert.equal(taps.tap(interruption==='pause'?2200:1600,60),null);
}
const taps=context.create();[0,355,716].forEach(t=>assert.equal(taps.tap(t,80),null));assert.equal(taps.tap(1071,80),168);
// Exercise actual Home press/release handlers with a deterministic clock.
let time=0,holdCallback,display='',recalls=0;
const c=vm.createContext({performance:{now:()=>time},setTimeout:fn=>(holdCallback=fn,1),clearTimeout:()=>{holdCallback=null},status:s=>display=s,flash:()=>{},paint:()=>{},held:new Set(),running:false,home:['42'],values:[{value:'15',oninput:()=>recalls++}],pads:Array.from({length:4},()=>({querySelector:()=>({})})),document:{querySelector:()=>({set textContent(v){display=v}})}});
vm.runInContext(source.slice(source.indexOf('let tempo='),source.indexOf('// The canonical instrument'))+source.slice(source.indexOf('function press(i)'),source.indexOf('pads.forEach((b,i)=>')),c);
function tap(at,duration=70){time=at;vm.runInContext('press(3)',c);time+=duration;vm.runInContext('release(3)',c)}
tap(0);assert.equal(display,'Home recalled');assert.equal(recalls,1);assert.equal(c.values[0].value,'42');
tap(400);tap(800);assert.equal(vm.runInContext('tempo',c),168);tap(1200);assert.equal(vm.runInContext('tempo',c),150);
time=2000;vm.runInContext('press(3)',c);c.values[0].value='71';time+=550;holdCallback();vm.runInContext('release(3)',c);assert.equal(display,'Home stored');assert.equal(vm.runInContext('home[0]',c),'71');
tap(2700);assert.equal(vm.runInContext('tempo',c),150);
time=3100;vm.runInContext('press(3);release(3,true)',c);assert.equal(vm.runInContext('tempo',c),150);
console.log('Tap tempo: range, four-tap gate, jitter, irregular taps, pauses, hold/reset, recall/store and cancellation passed.');
