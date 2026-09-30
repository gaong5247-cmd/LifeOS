export const $=(s,r=document)=>r.querySelector(s);
export const $$=(s,r=document)=>[...r.querySelectorAll(s)];
export const uid=()=>crypto.randomUUID?crypto.randomUUID():Math.random().toString(36).slice(2)+Date.now().toString(36);
export const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
export const money=n=>new Intl.NumberFormat("ko-KR").format(Number(n)||0);

export function isoDate(d=new Date()){
  const z=new Date(d.getTime()-d.getTimezoneOffset()*60000);
  return z.toISOString().slice(0,10);
}
export const today=()=>isoDate(new Date());
export const monthKey=d=>String(d).slice(0,7);

export function lastDays(n=7){
  return Array.from({length:n},(_,i)=>{
    const d=new Date();
    d.setDate(d.getDate()-(n-1-i));
    return isoDate(d);
  });
}

export function taskScore(task){
  if(task.done)return -9999;
  let score=({high:35,medium:18,low:7}[task.priority]||0);
  if(task.due){
    const days=Math.ceil((new Date(task.due+"T23:59:59")-new Date())/86400000);
    if(days<0)score+=60+Math.abs(days)*3;
    else if(days===0)score+=48;
    else if(days===1)score+=32;
    else if(days<=3)score+=18;
    else if(days<=7)score+=8;
  }
  const age=Math.max(0,(Date.now()-(task.createdAt||Date.now()))/86400000);
  score+=Math.min(12,age*.7);
  return Math.round(score);
}

export function currentStreak(state,habitId){
  let streak=0;
  const d=new Date();
  for(let i=0;i<3660;i++){
    const key=isoDate(d);
    if(state.habitChecks[habitId]?.[key])streak++;
    else{
      if(i===0){d.setDate(d.getDate()-1);continue}
      break;
    }
    d.setDate(d.getDate()-1);
  }
  return streak;
}

export function fuzzy(query,text){
  const q=query.toLowerCase().replace(/\s/g,"");
  const s=text.toLowerCase();
  let score=0,pos=0,streak=0;
  for(const c of q){
    const i=s.indexOf(c,pos);
    if(i<0)return -1;
    streak=i===pos?streak+1:0;
    score+=10+streak*3-Math.min(i-pos,8);
    pos=i+1;
  }
  return score;
}