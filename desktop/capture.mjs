import fs from 'node:fs';
import vm from 'node:vm';
import {OfflineAudioContext} from 'node-web-audio-api';
process.chdir(import.meta.dirname);
const rate=48000, frames=Math.round(128*rate*60/168/4);
const offline=new OfflineAudioContext(2,frames+1024,rate);
const element=()=>({append(){},add(){},appendChild:element,querySelector:element,setAttribute(){},classList:{toggle(){}}});
const dir=process.argv[2]||'renders';
const actions=fs.readFileSync(process.argv[2]?dir+'/take.tsv':'take.tsv','utf8').trim().split('\n').map(line=>line.split(' '));
const events=[];
let holdCallback;
const sandbox=vm.createContext({offline,actions,events,atob,Uint8Array,document:{querySelector:element,createElement:element},Option:class{},setTimeout:fn=>{holdCallback=fn;return 1},clearTimeout(){holdCallback=null},completeHold(){holdCallback()}});
const run=code=>vm.runInContext(code,sandbox);
for(const file of ['amen.js','breaks.js','instrument.js'])run(fs.readFileSync('../'+file,'utf8'));
await run(`(async()=>{
 ctx=offline;
 master=ctx.createDynamicsCompressor();master.threshold.value=-9;master.ratio.value=3;master.connect(ctx.destination);
 for(const bank of banks)bank.buffer=await ctx.decodeAudioData(Uint8Array.from(atob(bank.wav),c=>c.charCodeAt(0)).buffer);
 runBus=ctx.createGain();runBus.connect(master);running=true;menu.value=0;
 const renderVoice=sound;
 sound=(role,time,gain,span,bus)=>{
 events.push([Math.round(time*48000),banks.indexOf(active),role,gain,span]);renderVoice(role,time,gain,span,bus)
 };
 const originalPercussion=playPercussion;
 playPercussion=(role,time,gain,reach)=>{
 events.push([Math.round(time*48000),banks.indexOf(active),'perc-'+role,gain,.03+.16*reach]);
 originalPercussion(role,time,gain,reach);
 };
 for(let n=0;n<128;n++){
 for(const [,op,...args] of actions.filter(a=>Number(a[0])===n)){
 switch(op){
 case 'faders': values.forEach((v,j)=>v.value=args[j]);break;
 case 'record':startGesture(next);break;
 case 'move':values[+args[0]].value=args[1];recordMotion(+args[0],next);break;
 case 'commit':finishGesture();break;
 case 'cancel':finishGesture(true);break;
 case 'store':press(3);completeHold();release(3);break;
 case 'home':press(3);release(3);break;
 case 'bank':menu.value=args[0];break;
 case 'fill':press(0);release(0);break;
 case 'catch':press(1);break;case 'uncaught':release(1);break;
 case 'drop':press(2);break;case 'lift':release(2);break;
 default:throw Error(op);
 }}
 scheduleStep();
 }
 })()`);
const index=[];
for(const [i,bank] of run('banks').entries()){
 const audio=bank.buffer, channels=Array.from({length:audio.numberOfChannels},(_,c)=>audio.getChannelData(c));
 const pcm=Buffer.alloc(audio.length*channels.length*2);
 for(let n=0;n<audio.length;n++)for(const [c,samples] of channels.entries())
 pcm.writeInt16LE(Math.max(-32768,Math.min(32767,Math.round(samples[n]*32768))),(n*channels.length+c)*2);
 fs.writeFileSync('bank/'+i+'.pcm',pcm);
 for(const [role,[start,end]] of Object.entries(bank.cuts))
 index.push([i,bank.name.replaceAll(' ','_'),bank.steps,audio.length,channels.length,role,Math.round(start*rate),Math.round(end*rate)].join(' '));
}
fs.writeFileSync('bank/index.txt',index.join('\n')+'\n');
fs.writeFileSync(dir+'/reference.tsv',events.map(e=>e.join(' ')).join('\n')+'\n');
const rendered=await offline.startRendering();
const stereo=new Float32Array(rendered.length*2);
for(let c=0;c<2;c++){const samples=rendered.getChannelData(c);for(let n=0;n<rendered.length;n++)stereo[n*2+c]=samples[n]}
fs.writeFileSync(dir+'/reference.f32',Buffer.from(stereo.buffer));
