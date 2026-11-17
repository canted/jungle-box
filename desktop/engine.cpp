// Desktop host for the Breakroom sequencer and bounded-voice PCM mixer.
// Run from desktop/. The host streams PCM from files; a board port supplies storage and I2S.
#include <algorithm>
#include <array>
#include <cmath>
#include <cstdint>
#include <fstream>
#include <iomanip>
#include <iostream>
#include <map>
#include <sstream>
#include <stdexcept>
#include <string>
#include <vector>
using std::string;
constexpr int rate=48000;
constexpr double tick=60./168/4;
struct Bank {int steps,frames,channels; std::map<string,std::pair<int,int>> cuts; std::ifstream pcm;};
struct Hit {string role; double gain,span,delay,percReach=-1;};
struct Controls {int weight=42,angle=12,reply=50,reach=50;};
#include "gesture.hpp"
struct Player {
 Gesture percussion;
 Controls live,home;
 int bank=0,queued=0,fillEnd=0,drop=-1,landing=-1,catchStep=-1,repeat=1;
 string last="accent",caught;
 void gesture(int n,std::istringstream &line){
  string op;line>>op;
  if(op=="faders")line>>live.weight>>live.angle>>live.reply>>live.reach;
  else if(op=="record")percussion.begin({double(live.weight),double(live.angle),double(live.reply),double(live.reach)},n);
  else if(op=="move"){int index;double value;line>>index>>value;percussion.move(index,value,n);}
  else if(op=="commit")percussion.finish();
  else if(op=="cancel")percussion.finish(true);
  else if(op=="store")home=live;
  else if(op=="home")live=home;
  else if(op=="bank")line>>queued;
  else if(op=="fill")fillEnd=n<fillEnd?0:(n/16+1)*16;
  else if(op=="drop"){drop=n;landing=-1;}
  else if(op=="lift"){drop=-1;landing=(n+3)/4*4;}
  else if(op=="uncaught")catchStep=-1;
  else if(op=="catch"){
   catchStep=n;repeat=live.reach>80?4:live.reach>58?2:1;
   caught=last;
   if(repeat==4)caught="longShuffle";
   if(repeat==2&&(last=="hat"||last=="ride"||last=="ghost"||last=="ghost2"))caught="shuffle";
  }else throw std::runtime_error("Unknown gesture "+op);
 }
 std::vector<Hit> advance(int n){
  if(n%16==0)bank=queued;
  double w=live.weight/100.,a=live.angle/100.,r=live.reply/100.,reach=live.reach/100.;
  const double drive=std::max(0.,(w-.7)/.3);w=std::min(1.,w/.7);
  int s=n%16;bool respond=n/16%2&&r>.28,dropped=drop>=0;
  const int offsets[]={0,-1,2,-3};int offset=offsets[std::min(3,int(a*4))];
  int first=respond&&r>.78?8:4+offset,second=respond?(r>.62?12-offset:12):12+offset;
  bool accent=s==first||s==second;
  std::vector<Hit> hits;
  auto add=[&](string role,double gain,double span=1,double delay=0){hits.push_back({role,gain,span,delay});};
  if(!dropped&&(s==0||s==(respond?10:8)||(w>.64&&s==(second+14)%16)))add(respond?"kick2":"kick",.88,1.8);
  if(accent){
   if(dropped)add(respond?"ghost2":"ghost",1.1);
   else {const char* firstAccent=bank==1?"accent2":"accent";
    add(s==first?firstAccent:respond?"lateAccent":"accent2",.84,1+reach);
    if(w>.55)add("kickShort",(w-.55)*.9,.8);}
  }
  if(s==(respond?(second+2)%16:6))add(reach>.62?"longShuffle":"shuffle",.52+w*.45,1+std::max(0.,reach-.5)*6);
  else if(s%(dropped&&n-drop>=4?4:2)==0&&!accent)add(respond?"ride":"hat",.5,.8);
  if(w>.28&&s==(second+15)%16)add("ghost",.4+w*.42,.9);
  if(respond&&s==15)add("ghost2",.8,.8);
  if(drive>.22&&!dropped&&s==(first+15)%16)add("kickShort",.44+.20*drive,.7);
  if(drive>.45&&s%4==3&&!accent)add(respond?"ride":"hat",.28+.15*drive,.6);
  if(drive>.76&&s%4==1&&!accent)add(s==(second+1)%16?"ghost2":"hat",.33,.55);
  if(n<fillEnd && s%(w>.58||s>=12?1:2)==0){
   const char* ghost=bank==1?"ghost2":"ghost";
   const char* late=bank==1?"accent2":"lateAccent";
   const char* dry[]={ghost,"accent2","shuffle",late};
   const char* thin[]={"ghost2","ride",ghost,"shuffle"};
   const bool chirp=bank==1 && s==14 && (n/16)%4==1;
   add(chirp?"accent":(dropped?thin:dry)[(s+2*respond+int(a*3))%4],.65+s*.018,chirp?4:.65+reach*.42);
   if(a+w>1&&s%4==3)add(dropped?ghost:"ghost2",.72,.46,.5);
  }
  if(n<landing)add("ghost2",.8,.78);
  if(n==landing&&std::none_of(hits.begin(),hits.end(),[](const Hit& h){return h.role.find("kick")==0;}))add("kick",.91,1.6);
  if(catchStep>=0&&dropped){if((n-drop)%2==0)add("ride",.62,.5);}
  else if(catchStep>=0&&(n-catchStep)%repeat==0)add(caught,.85,repeat);
  if(!hits.empty())last=hits.front().role;
  for(auto& h:hits){if(reach<.5)h.span=std::min(h.span,.14+1.86*reach*2);h.span*=tick;h.gain*=.66;}
  percussion.append(n,hits);
  // Bank order: Amen, Think, Hot Pants, Helicopter, Apache, Scorpio.
  static constexpr double percussionTrims[]={1.00714,.50,.32,1,1,1};
  for(auto& hit:hits)if(hit.percReach>=0)hit.gain*=percussionTrims[bank];
  return hits;
 }
};
struct Voice {
 Bank* bank=nullptr; int begin=0,end=0,age=0,length=0,cached=-1;
 double speed=1,gain=1;std::array<int16_t,1024> cache{};
 bool percussion=false;
 double b0=0,b1=0,b2=0,a1=0,a2=0,z1[2]{},z2[2]{};
 void filterSetup(double hz){
  double omega=2*std::acos(-1.)*hz/rate,cosine=std::cos(omega);
  double alpha=std::sin(omega)/(2*std::pow(10.,.65/20)),norm=1+alpha;
  b0=(1-cosine)/(2*norm);b1=2*b0;b2=b0;a1=-2*cosine/norm;a2=(1-alpha)/norm;
  z1[0]=z1[1]=z2[0]=z2[1]=0;
 }
 double filtered(double x,int c){
  double y=b0*x+z1[c];z1[c]=b1*x-a1*y+z2[c];z2[c]=b2*x-a2*y;return y;
 }
 double sample(int frame,int ch){
  if(frame<cached||cached<0||frame>=cached+512){
   cached=frame;int count=std::min(512,bank->frames-frame)*bank->channels;
   bank->pcm.seekg(size_t(frame)*bank->channels*2);
   if(!bank->pcm.read(reinterpret_cast<char*>(cache.data()),count*2))throw std::runtime_error("PCM read");
  }
  return cache[(frame-cached)*bank->channels+std::min(ch,bank->channels-1)]/32768.;
 }
};
int main(int argc,char** argv){
 string outputDir=argc>1?argv[1]:"renders";
 std::array<Bank,6> banks;std::ifstream index("bank/index.txt");int id,steps,frames,channels,start,end;string name,role;
 while(index>>id>>name>>steps>>frames>>channels>>role>>start>>end){
  auto& b=banks.at(id);b.steps=steps;b.frames=frames;b.channels=channels;b.cuts[role]={start,end};
  if(!b.pcm.is_open())b.pcm.open("bank/"+std::to_string(id)+".pcm",std::ios::binary);
 }
 std::map<int,std::vector<string>> gestures;std::ifstream take(argc>1?outputDir+"/take.tsv":"take.tsv");string line;
 while(std::getline(take,line)){std::istringstream row(line);int n;row>>n;std::getline(row,line);gestures[n].push_back(line);}
 std::ofstream trace(outputDir+"/native.tsv"),out(outputDir+"/native.f32",std::ios::binary);
 trace<<std::setprecision(16);Player player;std::array<Voice,16> voices;
 std::vector<Hit> hits;int step=0,peak=0;double envelope=0;
 const int total=std::lround(128*tick*rate);
 for(int block=0;block<total;block+=128){
  std::array<float,256> output{};int count=std::min(128,total-block);
  for(int i=0;i<count;i++){
   int now=block+i;
   if(now==std::lround(step*tick*rate)){
    for(auto& cmd:gestures[step]){std::istringstream row(cmd);player.gesture(step,row);}
    hits=player.advance(step++);
   }
   for(auto& h:hits)if(now==std::lround((step-1+h.delay)*tick*rate)){
    auto v=std::find_if(voices.begin(),voices.end(),[](auto& voice){return !voice.bank;});
    if(v==voices.end())throw std::runtime_error("Voice budget exceeded");
    auto& b=banks.at(player.bank);auto cut=b.cuts.at(h.role);
    v->bank=&b;v->begin=cut.first;v->end=cut.second;v->cached=-1;v->age=0;v->gain=h.gain;
    v->speed=b.frames/(b.steps*tick*rate);v->percussion=h.percReach>=0;
    if(v->percussion){v->speed*=.64+.30*h.percReach;v->filterSetup(1100+5300*h.percReach);}
    if(player.bank==1 && (h.role=="ghost" || h.role=="lateAccent" || h.role=="longShuffle" || h.role=="accent"))v->speed=1;
    v->length=std::lround(std::min(h.span*rate,(v->end-v->begin)/v->speed));
    trace<<now<<' '<<player.bank<<' '<<(v->percussion?"perc-":"")<<h.role<<' '<<h.gain<<' '<<h.span<<'\n';
   }
   double mix[2]={};int active=0;
   for(auto& v:voices)if(v.bank){
    active++;double pos=v.begin+v.age*v.speed;int f=std::min(v.end-1,int(pos));double frac=pos-f;
    double env=std::min({1.,v.age/48.,(v.length-v.age)/double(std::min(384,std::max(1,v.length-96)))});
    if(v.percussion){
     env=std::min(1.,v.age/48.);
     if(v.age>v.length*.45)env=.0001/v.gain+(1-.0001/v.gain)*std::exp(-(v.age-v.length*.45)/(.10*v.length));
    }
    for(int c=0;c<2;c++){
     auto x=v.sample(f,c),y=v.sample(std::min(v.end-1,f+1),c);
     double sample=x+(y-x)*frac;
     mix[c]+=(v.percussion?v.filtered(sample,c):sample)*env*v.gain;
    }
    if(++v.age>=v.length)v.bank=nullptr;
   }
   peak=std::max(peak,active);
   double level=std::max(std::abs(mix[0]),std::abs(mix[1]));
   envelope+=(level-envelope)*(level>envelope?.00692:.0000833);
   double gain=envelope>.3548?std::pow(.3548/envelope,2./3):1;
   for(int c=0;c<2;c++)output[2*i+c]=mix[c]*gain;
  }
  out.write(reinterpret_cast<char*>(output.data()),count*2*sizeof(float));
 }
 std::cout<<peak<<" peak voices; "<<sizeof(voices)<<" bytes for voice state and caches\n";
}
