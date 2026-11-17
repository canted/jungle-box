// Source positions in seconds in the two-bar stereo Amen. Endpoints retain the room tail.
const cuts = {
 kick:[0,.215], kick2:[1.747,1.963], kickShort:[1.093,1.209],
 accent:[.439,.665], accent2:[1.304,1.534], lateAccent:[3.258,3.486],
 ghost:[.780,.885], ghost2:[2.736,2.822], hat:[.886,.986], ride:[2.623,2.735],
 shuffle:[.668,.886], longShuffle:[2.406,2.823]
};
const banks=[{name:'Amen',wav:amenWav,steps:32,cuts},...extraBreaks];
const menu=document.querySelector('#bank');
banks.forEach((bank,i)=>menu.add(new Option(bank.name,i)));
let active=banks[0];
menu.onchange=()=>{
 const selected=banks[Number(menu.value)];
 for(const [role,button] of auditionButtons)button.textContent=selected.labels?.[role]??role;
 if(!running)active=selected;
 status(running && active!==selected ? selected.name+' queued for next bar' : selected.name);
};
const tick=60/168/4;
// Audition alternatives without replacing the original phrasing.
let angleStyle='original';
const angleMenu=document.querySelector('#angle-style');
angleMenu.onchange=()=>status(running?'Angle phrasing queued for next bar':'Angle phrasing selected');
// Authored two-bar studies; positions are zero-based sixteenth notes.
// Each tuple is [first snare, second snare, second kick, shuffle].
const angleStudies=[
 {name:'Backbeat',call:[4,12,8,6],reply:[4,12,10,14]},
 {name:'Anticipated answer',call:[4,12,8,6],reply:[4,11,10,14]},
 {name:'Open answer',call:[4,12,8,6],reply:[4,11,7,14]},
 {name:'Early exchange',call:[2,11,9,6],reply:[3,9,14,11]},
 {name:'Anticipated call',call:[4,11,8,6],reply:[3,11,7,14]},
 {name:'Offbeat kick',call:[1,10,7,4],reply:[1,9,14,11]},
 {name:'Early call',call:[3,11,9,6],reply:[3,11,7,14]},
 {name:'Wide answer',call:[3,11,9,6],reply:[3,10,7,13]},
 {name:'Turnaround',call:[3,12,9,6],reply:[3,10,7,13]}
];
// Listening feedback: surprise, not density. Turnaround is midrange;
// Early exchange anticipates snares; Offbeat kick is the strongest endpoint.
const angleRoutes={
 original:[0,1,2,8,3,5],
 early:[0,1,2,3,5],
 late:[0,1,2,8,5],
 broken:[0,1,8,2,3,5]
};
function anglePattern(a,respond,style,n=0){
 const route=angleRoutes[style]||angleRoutes.original;
 const position=Math.max(0,Math.min(1,a))*(route.length-1);
 const lower=Math.floor(position),fraction=position-lower;
 // Stable pockets around each study, then progressively introduce its neighbor.
 // The same choice covers the call and response. Eight phrase cycles repeat;
 // no random notes, doubled crossfades, or interpolated onset times.
 const blend=Math.max(0,Math.min(1,(fraction-.2)/.6));
 const order=[0,4,2,6,1,5,3,7];
 const cycle=Math.floor(n/32)%order.length;
 const advance=blend>(order[cycle]+.5)/order.length?1:0;
 const study=angleStudies[route[Math.min(lower+advance,route.length-1)]];
 const [first,second,kick,shuffle]=study[respond?'reply':'call'];
 const hats=respond
  ? study.name==='Backbeat'?[0,2,6,8,10,15]
   : ['Open answer','Early exchange'].includes(study.name)?[0,2,6,8,12,13]
   : ['Wide answer','Turnaround'].includes(study.name)?[0,2,6,8,12,14]
   : [0,2,6,8,10,12]
  : study.name==='Offbeat kick'?[0,2,6,8,14]:[0,2,8,10,14];
 return {snares:[first,second],kicks:[0,kick],shuffle,hats,name:study.name};
}
let barAngle=0;

const faders=[['Weight','Air → reinforced → driving',42],['Reach','Clipped → single cut → phrase',50],['Reply','Repeat → answer',50],['Angle','Steady → unexpected',12]];
const [weightSlider,reachSlider,replySlider,angleSlider]=faders.map(([name,ends,value])=>{
 const label=document.createElement('label');
 label.innerHTML='<div class="row"><strong>'+name+'</strong><output>'+value+'</output></div><input type="range" aria-label="'+name+'" value="'+value+'"><small>'+ends+'</small>';
 document.querySelector('.grid').append(label);
 const input=label.querySelector('input');if(name==='Reach')input.min='5';input.oninput=()=>label.querySelector('output').value=input.value;return input;
});
// Gesture recordings and desktop captures use this parameter order.
const values=[weightSlider,angleSlider,replySlider,reachSlider];
const lamps=Array.from({length:4},()=>document.querySelector('#meter').appendChild(document.createElement('i')));
const keys=['f','c','d','h'];
const [homePad,dropPad,catchPad,fillPad]=['Home','Drop','Catch','Fill'].map(name=>{
 const b=document.createElement('button');b.innerHTML='<span class="led" aria-hidden="true"></span><kbd>'+name[0]+'</kbd>'+name;
 b.className=name.toLowerCase();document.querySelector('.pads').append(b);return b;
});
const pads=[fillPad,catchPad,dropPad,homePad];
let outputGain,volume=.8;
let ctx,audioReady,master,runBus,timer,step=0,next=0,running=false,starting=false;
let fillEnd=0,dropStart=null,landing=-1,catchStep=null,caught='accent',catchSpan=1,lastCut='accent';
let home=values.map(v=>v.value),homeTimer,stored=false;
const held=new Set();
function status(s){document.querySelector('#state').textContent=s}
async function audio(){
 ctx??=new AudioContext();await ctx.resume();
 if(!audioReady){
 master=ctx.createDynamicsCompressor();master.threshold.value=-9;master.ratio.value=3;outputGain=ctx.createGain();outputGain.gain.value=volume;master.connect(outputGain).connect(ctx.destination);
 audioReady=Promise.all(banks.map(async bank=>{bank.buffer=await ctx.decodeAudioData(Uint8Array.from(atob(bank.wav),c=>c.charCodeAt(0)).buffer)})).catch(e=>{audioReady=null;throw e});
 }await audioReady;

}
function thinkVocal(bank,role){
 return bank.name==='Think' && ['ghost','lateAccent','longShuffle','accent'].includes(role);
}
function sound(name,time,gain,span,bus,bank=active){
 const buffer=bank.buffer;
 const [start,end]=bank.cuts[name],src=ctx.createBufferSource(),env=ctx.createGain();
 const rate=thinkVocal(bank,name)?1:buffer.duration/(bank.steps*tick),length=Math.min(span,(end-start)/rate);
 src.buffer=buffer;src.playbackRate.value=rate;src.connect(env).connect(bus);
 env.gain.setValueAtTime(0,time);env.gain.linearRampToValueAtTime(gain,time+.001);
 env.gain.setValueAtTime(gain,time+Math.max(.002,length-.008));env.gain.linearRampToValueAtTime(0,time+length);
 src.start(time,start);src.stop(time+length);src.onended=()=>{src.disconnect();env.disconnect()};
}
// Compose independent parts so a gesture can change orchestration without erasing phrase timing.
function phrase(n,w,a,r,reach,dropped,filling,hatDrive){
 // The first 70% covers the original reinforcement range.
 const drive=Math.max(0,(w-.70)/.30);
 hatDrive??=drive;
 w=Math.min(1,w/.70);
 const s=n%16,answer=Math.floor(n/16)%2===1,respond=answer&&r>.28;
 const pattern=anglePattern(a,respond,angleStyle,n);
 const [first,second]=pattern.snares;
 const at=position=>Math.floor(position)===s;
 const accent=pattern.snares.some(at),events=[];
 const add=(name,gain,span=1,delay=0)=>events.push({name,gain,span,delay});
 const placed=(position,name,gain,span=1)=>{
  if(at(position))add(name,gain,span,position-s);
 };
 if(!dropped)for(const kick of pattern.kicks)placed(kick,respond?'kick2':'kick',.88,1.8);
 for(const [i,position] of pattern.snares.entries()){
  const name=dropped?(respond?'ghost2':'ghost'):
   i===0?(active.name==='Think'?'accent2':'accent'):(respond?'lateAccent':'accent2');
  placed(position,name,dropped?1.1:.84,dropped?1:1+reach);
 }
 const shuffleStep=pattern.shuffle;
 const nextHit=Math.min(...[...pattern.snares,...pattern.kicks,16].filter(hit=>hit>shuffleStep));
 const shuffleSpan=Math.min(1+Math.max(0,reach-.5)*6,nextHit-shuffleStep-.15);
 placed(shuffleStep,reach>.62?'longShuffle':'shuffle',.52+w*.45,shuffleSpan);
 // Angle changes hat placement, not the base count (five call / six reply).
 const thinned=dropped&&n-dropStart>=4;
 const hatVoice=respond?'ride':'hat';
 if(pattern.hats.includes(s)&&(!thinned||s%4===0))add(hatVoice,.5,.8);
 // First restore the omitted offbeat-snare counterpulse, then add lighter
 // sixteenths. Drive changes density without replacing the core hat phrase.
 const counterpulse=4;
 if(!thinned&&!accent&&s!==shuffleStep&&!pattern.hats.includes(s)){
  if(s===counterpulse&&hatDrive>0)add(hatVoice,.5*Math.min(1,hatDrive*2),.8);
  else if(hatDrive>.5&&[5,7,9,15].includes(s))add(hatVoice,(hatDrive-.5)*.6,.6);
 }
 const clearOfKicks=position=>pattern.kicks.every(kick=>Math.abs(kick-position)>.6);
 const ghostStep=second-1;
 if(w>.28&&clearOfKicks(ghostStep))placed(ghostStep,'ghost',.4+w*.42,.9);
 if(respond&&s===15)add('ghost2',.8,.8);
 // Weight still adds drive, with pickups kept clear of the structural kicks.
 const pickup=first-1;
 if(drive>.22&&!dropped&&clearOfKicks(pickup))placed(pickup,'kickShort',.44+.20*drive,.7);

 const fillOffset=events.length;
 if(filling){
  const stride=w>.58||s>=12?1:2;
  if(s%stride===0){
   const ghost=active.name==='Think'?'ghost2':'ghost';
   const late=active.name==='Think'?'accent2':'lateAccent';
   const voices=dropped?['ghost2','ride',ghost,'shuffle']:[ghost,'accent2','shuffle',late];
   const chirp=active.name==='Think' && s===14 && Math.floor(n/16)%4===1;
   add(chirp?'accent':voices[(s+(respond?2:0)+Math.floor(a*3))%4],.65+s*.018,chirp?4:.65+reach*.42);
   if((a+w)>1&&s%4===3)add(dropped?ghost:'ghost2',.72,.46,.5);
  }
 }
 for(const hit of events.slice(fillOffset))hit.fill=true;
 return events;
}
function scheduleStep(){
 if(step%16===0){
  barAngle=Number((gestureBase||values.map(v=>v.value))[1])/100;
  const selectedStyle=angleMenu.value||'original';
  if(angleStyle!==selectedStyle){angleStyle=selectedStyle;status('Playing · '+active.name)}
 }
 if(step%16===0 && active!==banks[Number(menu.value)]){
  active=banks[Number(menu.value)];status('Playing · '+active.name);
 }
 const [w,a,r,reach]=(gestureBase||values.map(v=>v.value)).map(v=>v/100);
 const events=phrase(step,w,barAngle,r,reach,dropStart!==null,step<fillEnd);
 if(step<landing)events.push({name:'ghost2',gain:.8,span:.78,delay:0});
 if(step===landing&&!events.some(e=>e.name.startsWith('kick')))events.push({name:'kick',gain:.91,span:1.6,delay:0});
 if(catchStep!==null&&dropStart!==null){
  if((step-dropStart)%2===0)events.push({name:'ride',gain:.62,span:.5,delay:0});
 }else if(catchStep!==null&&(step-catchStep)%catchSpan===0)events.push({name:caught,gain:.85,span:catchSpan,delay:0});
 // Below center, shorten every sounding voice, including caught and fill strokes.
 const gate=reach<.5 ? .14+1.86*reach*2 : Infinity;
 for(const e of events)sound(e.name,next+tick*e.delay,e.gain*.66,Math.min(e.span,gate)*tick,e.fill&&fillBus?fillBus:runBus);
 percussionStep();
 if(events.length)lastCut=events[0].name;
 step++;next+=tick;
}
function schedule(){
 while(next<ctx.currentTime+.042){
  const n=step, time=next, bus=runBus;
  const retrigger=catchStep!==null&&(dropStart===null?(n-catchStep)%catchSpan===0:(n-dropStart)%2===0);
  const returning=n===landing;
  scheduleStep();
  setTimeout(()=>{
   if(!running||bus!==runBus)return;
   if(n%4===0)lamps.forEach((lamp,i)=>lamp.classList.toggle('on',i===(n/4)%4));
   if(retrigger)flash(pads[1].querySelector('.led'),65);
   if(returning)flash(pads[2].querySelector('.led'),150);
   pads[0].classList.toggle('lit',n<fillEnd);
  },Math.max(0,(time-ctx.currentTime)*1000));
 }
 paint();
}
function flash(element,duration){
 element.animate?.([{opacity:1},{opacity:.9,offset:.55},{opacity:.2}],{duration});
}
function paint(){[step<fillEnd,catchStep!==null,dropStart!==null,held.has(3)].forEach((v,i)=>pads[i].setAttribute('aria-pressed',v))}
async function transport(){
 if(starting)return;
 const play=document.querySelector('#play');
 if(running){finishGesture(true);fillBus=null;fillUntil=0;running=false;clearInterval(timer);pads[0].classList.remove('lit');runBus.disconnect();clearTimeout(homeTimer);held.clear();fillEnd=0;dropStart=catchStep=null;landing=-1;paint();lamps.forEach(l=>l.classList.remove('on'));active=banks[Number(menu.value)];play.textContent='Play';status('Stopped');return}
 starting=true;
 try{await audio();runBus=ctx.createGain();runBus.connect(master);step=0;next=ctx.currentTime+.025;lastCut='accent';running=true;schedule();timer=setInterval(schedule,18);play.textContent='Stop';status('Playing')}catch(e){status(e.message)}finally{starting=false}
}
document.querySelector('#play').onclick=transport;
function press(i){
 if(held.has(i)||(!running&&i!==3))return;held.add(i);
 if(i===0){
  if(fillBus&&step<=fillEnd&&ctx.currentTime<fillUntil){fillBus.disconnect();fillEnd=0;fillUntil=0;pads[0].classList.remove('lit')}
  else{fillBus=ctx.createGain();fillBus.connect(runBus);fillEnd=(Math.floor(step/16)+1)*16;fillUntil=next+(fillEnd-step)*tick}
 }
 if(i===1){catchStep=step;catchSpan=values[3].value>80?4:values[3].value>58?2:1;caught=catchSpan===4?'longShuffle':catchSpan===2&&['hat','ride','ghost','ghost2'].includes(lastCut)?'shuffle':lastCut}
 if(i===2){dropStart=step;landing=-1}
 if(i===3){stored=false;homeTimer=setTimeout(()=>{home=values.map(v=>v.value);stored=true;flash(pads[3].querySelector('.led'),360);status('Home stored')},550)}
 paint();
}
function release(i,cancel=false){
 if(!held.delete(i))return;
 if(i===1)catchStep=null;
 if(i===2){dropStart=null;landing=Math.ceil(step/4)*4}
 if(i===3){clearTimeout(homeTimer);if(!cancel&&!stored){values.forEach((v,j)=>{v.value=home[j];v.oninput()});flash(pads[3].querySelector('.led'),110);status('Home recalled')}}
 paint();
}
pads.forEach((b,i)=>{
 b.onpointerdown=e=>{b.setPointerCapture(e.pointerId);press(i)};b.onpointerup=()=>release(i);b.onlostpointercapture=()=>release(i,true);
 b.onkeydown=e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();e.stopPropagation();if(!e.repeat)press(i)}};
 b.onkeyup=e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();e.stopPropagation();release(i)}};
});
onkeydown=e=>{
 if(e.repeat||e.metaKey||e.ctrlKey||e.altKey)return;
 if(e.target.isContentEditable||e.target.matches('textarea,select,input:not([type=range])'))return;
 if(['ArrowUp','ArrowDown'].includes(e.key)&&!e.target.matches('input[type=range]')){
  e.preventDefault();changeBreak(e.key==='ArrowUp'?-1:1);return;
 }
 if(['+','=','-'].includes(e.key)||['NumpadAdd','NumpadSubtract'].includes(e.code)){
  e.preventDefault();changeVolume(e.key==='-'||e.code==='NumpadSubtract'?-.1:.1);return;
 }
if(e.code==='KeyG'){e.preventDefault();startGesture();return}const i=keys.indexOf(e.key.toLowerCase());if(i>=0){e.preventDefault();press(i)}else if(e.code==='Space'&&e.target.tagName!=='BUTTON'){e.preventDefault();transport()}};
onkeyup=e=>{if(e.code==='KeyG')finishGesture();else release(keys.indexOf(e.key.toLowerCase()))};onblur=()=>{finishGesture(true);Array.from(held).forEach(i=>release(i,true))};
const auditionButtons=new Map();
for(const name of Object.keys(cuts)){
 const b=document.createElement('button');b.textContent=name;b.onclick=async()=>{try{await audio();sound(name,ctx.currentTime,.75,1,master,banks[Number(menu.value)])}catch(e){status(e.message)}};
 auditionButtons.set(name,b);document.querySelector('#auditions').append(b,' ');
}

let fillBus,fillUntil=0,gestureBase=null,motif=new Map(),draft;
const side=document.querySelector('#side');
function startGesture(now=ctx?.currentTime){
 if(!running||gestureBase)return;
 gestureBase=values.map(v=>v.value);draft=new Map();
 motion=gestureBase.map(v=>({value:Number(v),turn:Number(v),direction:0,carry:0,triggered:false,time:now}));
 side.setAttribute('aria-pressed',true);status('Recording percussion · sweep a fader');
}
function finishGesture(cancel=false){
 if(!gestureBase)return;
 if(!cancel){
  if(draft.size)motif=draft;else motif.clear();
  status(motif.size?'Percussion looping':'Percussion cleared');
 }
 values.forEach((v,i)=>{v.value=gestureBase[i];v.oninput()});
 gestureBase=null;side.setAttribute('aria-pressed',false);
}
// Capture on the same sixteenth grid used by the percussion voice.
let motion=[];
function recordMotion(index,now=ctx?.currentTime){
 if(!gestureBase)return;
 const levels=values.map(v=>Number(v.value)/100);
 const value=Number(values[index].value);
 const state=motion[index],delta=value-state.value;
 if(!delta)return;
 const direction=Math.sign(delta);
 const reversal=state.direction!==direction;
 if(reversal){state.turn=state.value;state.triggered=false;state.carry=0}
 const distance=Math.abs(delta);
 const travel=state.carry+distance;
 const emit=(fraction)=>{
  // A fresh gesture after a rest starts at the input, without filling the rest.
  const time=now-(1-fraction)*Math.min(now-state.time,.065);
  const phase=step+(time-next)/tick;
  const slot=((Math.round(phase)%16)+16)%16;
  const at=levels.slice();at[index]=(state.value+delta*fraction)/100;
  draft.set(slot,at);
 };
 let emitted=false;
 for(let crossing=10-state.carry;crossing<=distance;crossing+=10){
  emit(crossing/distance);emitted=true;
 }
 // A deliberate two-point excursion can articulate once per direction.
 if(!emitted&&!state.triggered&&Math.abs(value-state.turn)>=2){emit(1);emitted=true}
 state.triggered ||= emitted;
 Object.assign(state,{carry:travel%10,value,time:now,direction});
}
values.forEach((slider,i)=>slider.addEventListener?.('input',()=>recordMotion(i)));
// Build each half-bar answer from its first stroke and the player's recorded accents.
function percussionNotes(pattern,answer){
 const strokes=Array.from(pattern,([slot,levels])=>({
  phase:(slot+Math.round((levels[1]-.5)*4)+16)%16,levels,primary:true
 })).sort((a,b)=>a.phase-b.phase);
 if(!answer)return strokes;
 const notes=[];
 for(const start of [0,8]){
  const group=strokes.filter(hit=>hit.phase>=start&&hit.phase<start+8);
  if(!group.length)continue;
  const reply=Math.max(...group.map(hit=>hit.levels[2]));
  if(reply<.35){notes.push(...group);continue}
  const offsets=reply<.70?[0,3,6]:[0,4/3,8/3];
  offsets.forEach((offset,i)=>{
   const phase=group[0].phase+offset;
   if(phase<=start+7)notes.push({phase,levels:group[Math.min(i,group.length-1)].levels,primary:i===0});
  });
 }
 return notes;
}
const percussionTrims={Amen:1.00714, Think:.50, 'Hot Pants':.32};
function percussionStep(){
 const pattern=gestureBase&&draft.size?draft:motif;
 const notes=percussionNotes(pattern,Math.floor(step/16)%2===1);
 const selected=notes.find(note=>Math.floor(note.phase)===step%16);
 if(!selected)return;
 const {primary,levels:[weight,,reply,reach]}=selected;
 const time=next+(selected.phase%1)*tick;
  const role=weight>.65?'accent2':primary?'ghost':'ghost2';
  const trim=percussionTrims[active.name]??1;
  playPercussion(role,time,trim*(.13+.27*weight+.09*(1-weight)**2)*(primary?1:.65*reply),reach);
}
function playPercussion(role,time,gain,reach){
  const [start,end]=active.cuts[role];
  const src=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),env=ctx.createGain();
  src.buffer=active.buffer;
  const speed=thinkVocal(active,role)?1:active.buffer.duration/(active.steps*tick)*(.64+.30*reach);
  src.playbackRate.value=speed;
  filter.type='lowpass';filter.frequency.value=1100+5300*reach;filter.Q.value=.65;
  const length=Math.min((end-start)/speed,.03+.16*reach);

  src.connect(filter).connect(env).connect(runBus);
  env.gain.setValueAtTime(0,time);env.gain.linearRampToValueAtTime(gain,time+.001);
  env.gain.setValueAtTime(gain,time+length*.45);
  env.gain.setTargetAtTime(.0001,time+length*.45,length*.10);
  src.start(time,start);src.stop(time+length);
  src.onended=()=>{src.disconnect();filter.disconnect();env.disconnect()};
}
side.onpointerdown=e=>{side.setPointerCapture(e.pointerId);startGesture()};
side.onpointerup=()=>finishGesture();side.onlostpointercapture=()=>finishGesture(true);
side.onkeydown=e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();if(!e.repeat)startGesture()}};
side.onkeyup=e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();finishGesture()}};

// The unfolded SP-1 edge controls share the existing bank and audio paths.
function changeBreak(delta){
 menu.value=(Number(menu.value)+delta+banks.length)%banks.length;
 menu.onchange();
}
document.querySelector('#previous-break').onclick=()=>changeBreak(-1);
document.querySelector('#next-break').onclick=()=>changeBreak(1);
function changeVolume(delta){
 volume=Math.max(0,Math.min(1,Math.round((volume+delta)*10)/10));
 if(outputGain)outputGain.gain.setTargetAtTime(volume,ctx.currentTime,.02);
 document.querySelector('#volume-value').value=Math.round(volume*100)+'%';
}
document.querySelector('#volume-down').onclick=()=>changeVolume(-.1);
document.querySelector('#volume-up').onclick=()=>changeVolume(.1);
