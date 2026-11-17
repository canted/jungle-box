// Fractional sixteenth positions preserve input timing until a stroke is quantized.
using Levels = std::array<double,4>;
struct Stroke {double phase; Levels levels;};
struct Motion {double value,turn,carry,time;int direction;bool triggered;};
struct Gesture {
 bool recording=false;
 Levels levels{};
 std::array<Motion,4> motion{};
 std::vector<Stroke> motif,draft;
 void begin(Levels initial,double position){
  if(recording)return;
  recording=true;levels=initial;draft.clear();
  for(int i=0;i<4;i++)motion[i]={levels[i],levels[i],0,position,0,false};
 }
 void finish(bool cancel=false){
  if(recording&&!cancel)motif=draft;
  recording=false;
 }
 void move(int index,double value,double position){
  if(!recording)return;
  auto& m=motion.at(index);double delta=value-m.value;
  if(!delta)return;
  levels[index]=value;
  int direction=delta>0?1:-1;
  if(direction!=m.direction){m.turn=m.value;m.carry=0;m.triggered=false;}
  double distance=std::abs(delta);
  auto emit=[&](double fraction){
   double phase=position-(1-fraction)*std::min(position-m.time,.065/tick);
   int slot=(int(std::floor(phase+.5))%16+16)%16;
   auto at=levels;at[index]=m.value+fraction*delta;
   auto existing=std::find_if(draft.begin(),draft.end(),[&](auto& h){return h.phase==slot;});
   if(existing==draft.end())draft.push_back({double(slot),at});else existing->levels=at;
  };
  bool emitted=false;
  for(double d=10-m.carry;d<=distance;d+=10){emit(d/distance);emitted=true;}
  if(!emitted&&!m.triggered&&std::abs(value-m.turn)>=2){emit(1);emitted=true;}
  m={value,m.turn,std::fmod(m.carry+distance,10.),position,direction,m.triggered||emitted};
 }
 void append(int n,std::vector<Hit>& hits)const{
  auto strokes=recording&&!draft.empty()?draft:motif;
  for(auto& s:strokes)s.phase=std::fmod(16+s.phase+std::floor((s.levels[1]/100-.5)*4+.5),16.);
  std::stable_sort(strokes.begin(),strokes.end(),[](auto& a,auto& b){return a.phase<b.phase;});
  auto add=[&](const Stroke& s,double phase,bool primary){
   if(int(phase)!=n%16)return false;
   double w=s.levels[0]/100,r=s.levels[2]/100,reach=s.levels[3]/100;
   hits.push_back({w>.65?"accent2":primary?"ghost":"ghost2",(.13+.27*w+.09*(1-w)*(1-w))*(primary?1:.65*r),.03+.16*reach,phase-int(phase),reach});
   return true;
  };
  int half=n%16/8*8;
  std::vector<Stroke> group;
  double reply=0;
  for(auto& s:strokes)if(s.phase>=half&&s.phase<half+8){group.push_back(s);reply=std::max(reply,s.levels[2]);}
  if(group.empty())return;
  if(n/16%2==0||reply<35){for(auto& s:group)if(add(s,s.phase,true))return;}
  else for(size_t i=0;i<3;i++){
   double phase=group.front().phase+i*(reply<70?3.:4./3);
   if(phase<=half+7&&add(group[std::min(i,group.size()-1)],phase,i==0))return;
  }
 }
};
