import fs from 'node:fs';
import vm from 'node:vm';
import {OfflineAudioContext} from 'node-web-audio-api';
process.chdir(import.meta.dirname);
const element=()=>({value:'',append(){},add(){},appendChild:element,querySelector:element,setAttribute(){},classList:{toggle(){}}});
const source=['amen.js','breaks.js','instrument.js'].map(f=>fs.readFileSync('../'+f,'utf8'));
const catalog=vm.createContext({});
vm.runInContext(source[2].slice(source[2].indexOf('const angleStudies='),source[2].indexOf('function anglePattern(')),catalog);
const names=vm.runInContext('angleStudies.map(study=>study.name)',catalog);
const route=vm.runInContext('angleRoutes.original',catalog);
const alternatives=names.map((_,i)=>i).filter(i=>!route.includes(i));
const jobs=[...names.map((_,i)=>({i,file:String(i)})),{i:8,file:'turnaround-hat-drive',hatDrive:.5}];
for(const {i,file,hatDrive} of jobs){
 const rate=48000,frames=Math.ceil(32*60/168/4*rate),offline=new OfflineAudioContext(2,frames,rate);
 const sandbox=vm.createContext({offline,atob,Uint8Array,document:{querySelector:element,createElement:element},Option:class{},setTimeout(){},clearTimeout(){}});
 const run=code=>vm.runInContext(code,sandbox);
 source.forEach(run);
 // Render the named study directly, independent of slider ordering.
 run(`angleRoutes.original=[${i}]`);
 if(hatDrive!==undefined)run(`const basePhrase=phrase;phrase=(...args)=>basePhrase(...args,${hatDrive})`);
 await run(`(async()=>{ctx=offline;master=ctx.createDynamicsCompressor();master.threshold.value=-9;master.ratio.value=3;master.connect(ctx.destination);active.buffer=await ctx.decodeAudioData(Uint8Array.from(atob(active.wav),c=>c.charCodeAt(0)).buffer);runBus=ctx.createGain();runBus.connect(master);menu.value=0;angleMenu.value='original';values.forEach((v,j)=>v.value=[42,0,50,50][j]);for(let n=0;n<32;n++)scheduleStep()})()`);
 const rendered=await offline.startRendering();
 const pcm=Buffer.alloc(frames*4+44);pcm.write('RIFF');pcm.writeUInt32LE(pcm.length-8,4);pcm.write('WAVEfmt ',8);pcm.writeUInt32LE(16,16);pcm.writeUInt16LE(1,20);pcm.writeUInt16LE(2,22);pcm.writeUInt32LE(rate,24);pcm.writeUInt32LE(rate*4,28);pcm.writeUInt16LE(4,32);pcm.writeUInt16LE(16,34);pcm.write('data',36);pcm.writeUInt32LE(frames*4,40);
 let peak=0;for(let c=0;c<2;c++){const data=rendered.getChannelData(c);for(let n=0;n<frames;n++){peak=Math.max(peak,Math.abs(data[n]));pcm.writeInt16LE(Math.max(-32768,Math.min(32767,Math.round(data[n]*32767))),44+n*4+c*2);}}
 if(!Number.isFinite(peak)||peak===0||peak>=1)throw Error('Invalid render peak: '+peak);
 fs.writeFileSync(`angle-studies/${file}.wav`,pcm);console.log(names[i],peak.toFixed(3));
}
const row=(i,label)=>`<section><span><strong>${names[i]}</strong><br>${label}</span><audio controls loop preload="none" src="${i}.wav?v=opening-exchange"></audio></section>`;
fs.writeFileSync('angle-studies/Listen.html',`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Jungle Box — Angle studies</title><style>body{max-width:750px;margin:40px auto;padding:0 20px;font:16px/1.6 system-ui;background:#83f2d1;color:#30332f}section{border-top:1px solid #999;padding:12px 0;display:flex;align-items:center;justify-content:space-between;gap:20px}audio{max-width:55%}h1{line-height:1.2}h2{margin-top:40px}</style><link rel="stylesheet" href="../../typography.css?v=typeset"><body class="study-page angle-study-page"><h1>Jungle Box · Angle studies</h1><p>Reordered from listening feedback: surprise rather than busyness. Same Amen bank, 168 BPM, Weight 42, Reach 50, Reply 50. Early exchange now brings its opening snare forward, anticipates the second response snare, and delays the answering kick. Offbeat kick pushes the opening snare further forward. Base hats now have equal counts; Angle changes their placement and Weight’s drive adds activity.</p><h2>Upper Angle revision</h2><p>Compare Turnaround at 60, Early exchange at 80, and Offbeat kick at 100. Same hat counts and sound levels; stronger changes to the kick/snare conversation.</p>${[
 ['Turnaround · 60','8'],['Early exchange · previous','exchange-before-intensity'],['Early exchange · revised 80','3'],['Offbeat kick · previous','offbeat-before-intensity'],['Offbeat kick · revised 100','5']
].map(([label,file])=>`<section><span>${label}</span><audio controls loop preload="none" src="${file}.wav?v=opening-exchange"></audio></section>`).join('')}<h2>Angle progression</h2>${route.map((id,i)=>row(id,`Angle ${Math.round(i/(route.length-1)*100)}`)).join('')}<h2>Outside the progression</h2><p>Retained for comparison. Anticipated call added little; Early call and Wide answer were usable but did not earn high-Angle positions.</p>${alternatives.map(i=>row(i,'Comparison only')).join('')}<script>document.querySelectorAll('audio').forEach(a=>a.addEventListener('play',()=>document.querySelectorAll('audio').forEach(b=>{if(a!==b)b.pause()})))</script></html>`);
