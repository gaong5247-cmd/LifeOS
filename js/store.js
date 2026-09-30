const KEY="lifeos.state.v1";
const VERSION=1;

function fresh(){
  return {
    version:VERSION,
    tasks:[],
    habits:[],
    habitChecks:{},
    notes:[],
    expenses:[],
    focusSessions:[],
    settings:{theme:matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}
  };
}

function normalize(value){
  const base=fresh();
  if(!value||typeof value!=="object")return base;
  return {
    ...base,
    ...value,
    version:VERSION,
    tasks:Array.isArray(value.tasks)?value.tasks:[],
    habits:Array.isArray(value.habits)?value.habits:[],
    habitChecks:value.habitChecks&&typeof value.habitChecks==="object"?value.habitChecks:{},
    notes:Array.isArray(value.notes)?value.notes:[],
    expenses:Array.isArray(value.expenses)?value.expenses:[],
    focusSessions:Array.isArray(value.focusSessions)?value.focusSessions:[],
    settings:{...base.settings,...(value.settings||{})}
  };
}

function read(){
  try{
    const raw=localStorage.getItem(KEY);
    return raw?normalize(JSON.parse(raw)):fresh();
  }catch{
    return fresh();
  }
}

let state=read();
const listeners=new Set();

function commit(){
  localStorage.setItem(KEY,JSON.stringify(state));
  for(const fn of listeners)fn(state);
}

export const store={
  get(){return state},
  subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn)},
  mutate(fn){
    const before=JSON.stringify(state);
    try{
      fn(state);
      commit();
      return true;
    }catch(error){
      console.error(error);
      state=normalize(JSON.parse(before));
      return false;
    }
  },
  replace(next){
    state=normalize(next);
    commit();
  },
  reset(){
    state=fresh();
    commit();
  },
  exportPayload(){
    return {app:"LifeOS",version:VERSION,exportedAt:new Date().toISOString(),data:state};
  },
  importPayload(payload){
    const incoming=payload?.app==="LifeOS"?payload.data:payload;
    if(!incoming||typeof incoming!=="object")throw new Error("invalid backup");
    state=normalize(incoming);
    commit();
  }
};