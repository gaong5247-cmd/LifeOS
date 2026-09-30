import{today}from"../utils.js";

export function timerState(){
  try{
    return JSON.parse(localStorage.getItem("lifeos.timer.v1"))||{mode:"focus",minutes:25,running:false,endsAt:0,remaining:1500};
  }catch{
    return {mode:"focus",minutes:25,running:false,endsAt:0,remaining:1500};
  }
}
export function saveTimer(value){localStorage.setItem("lifeos.timer.v1",JSON.stringify(value))}
export function timerRemaining(t){return t.running?Math.max(0,Math.ceil((t.endsAt-Date.now())/1000)):Math.max(0,t.remaining)}

export function focusView(state){
  const t=timerState();
  const sec=timerRemaining(t);
  const mm=String(Math.floor(sec/60)).padStart(2,"0");
  const ss=String(sec%60).padStart(2,"0");
  const sessions=state.focusSessions.filter(s=>s.date===today());

  return `<div class="grid">
    <div class="card span-12 timer">
      <div class="tiny">${t.mode==="focus"?"FOCUS":"BREAK"}</div>
      <div id="timerDisplay" class="timer-display">${mm}:${ss}</div>
      <div class="timer-actions">
        <button class="btn" data-timer="${t.running?"pause":"start"}">${t.running?"일시정지":"시작"}</button>
        <button class="btn secondary" data-timer="reset">초기화</button>
        <button class="btn secondary" data-timer="switch">${t.mode==="focus"?"5분 휴식":"25분 집중"}</button>
      </div>
      <div class="tiny" style="margin-top:16px">종료 시각을 저장해서 탭을 닫아도 시간이 어긋나지 않음.</div>
    </div>

    <div class="card span-12">
      <div class="card-header"><div><h2>오늘 집중 기록</h2><div class="tiny">${sessions.reduce((a,s)=>a+s.minutes,0)}분</div></div></div>
      <div class="list">${sessions.length?sessions.map(s=>`
        <div class="item"><div class="grow"><div class="item-title">${s.minutes}분 집중</div><div class="tiny">${new Date(s.at).toLocaleTimeString("ko-KR",{hour:"2-digit",minute:"2-digit"})}</div></div><strong>✓</strong></div>
      `).join(""):'<div class="empty"><strong>아직 기록 없음</strong><div>타이머를 끝까지 돌리면 여기에 기록됨.</div></div>'}</div>
    </div>
  </div>`;
}