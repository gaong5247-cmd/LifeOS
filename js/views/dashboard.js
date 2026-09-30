import{esc,money,today,monthKey,taskScore,lastDays}from"../utils.js";

const empty=(title,sub)=>`<div class="empty"><strong>${esc(title)}</strong><div>${esc(sub)}</div></div>`;

const taskItem=t=>`<div class="item">
  <button class="check ${t.done?"done":""}" data-task-toggle="${t.id}">${t.done?"✓":""}</button>
  <div class="grow">
    <div class="item-title ${t.done?"done":""}">${esc(t.title)}</div>
    <div class="tiny"><span class="pill ${t.priority}">${({high:"중요",medium:"보통",low:"낮음"}[t.priority]||"보통")}</span> ${t.due?"마감 "+esc(t.due):""} ${!t.done?"· 우선순위 "+taskScore(t):""}</div>
  </div>
  <button class="icon-action" data-task-delete="${t.id}">✕</button>
</div>`;

export function dashboardView(state){
  const open=state.tasks.filter(t=>!t.done);
  const doneToday=state.tasks.filter(t=>t.done&&String(t.doneAt||"").slice(0,10)===today()).length;
  const habitDone=state.habits.filter(h=>state.habitChecks[h.id]?.[today()]).length;
  const habitPct=state.habits.length?Math.round(habitDone/state.habits.length*100):0;
  const month=monthKey(today());
  const spent=state.expenses.filter(e=>monthKey(e.date)===month).reduce((a,e)=>a+Number(e.amount),0);
  const focus=state.focusSessions.filter(s=>s.date===today()).reduce((a,s)=>a+s.minutes,0);
  const top=[...open].sort((a,b)=>taskScore(b)-taskScore(a)).slice(0,5);
  const days=lastDays(7);

  return `<div class="grid">
    <div class="card span-3"><div class="stat-label">남은 할 일</div><div class="stat-value">${open.length}</div><div class="stat-sub">오늘 완료 ${doneToday}개</div></div>
    <div class="card span-3"><div class="stat-label">습관 달성률</div><div class="stat-value">${habitPct}%</div><div class="progress"><i style="width:${habitPct}%"></i></div></div>
    <div class="card span-3"><div class="stat-label">이번 달 지출</div><div class="stat-value">₩${money(spent)}</div><div class="stat-sub">${month}</div></div>
    <div class="card span-3"><div class="stat-label">오늘 집중</div><div class="stat-value">${focus}<small>분</small></div><div class="stat-sub">완료 세션 ${state.focusSessions.filter(s=>s.date===today()).length}회</div></div>

    <div class="card span-7">
      <div class="card-header"><div><h2>지금 먼저 할 것</h2><div class="tiny">마감 · 중요도 · 생성 시점으로 자동 계산</div></div><button class="btn secondary" data-go="tasks">전체 보기</button></div>
      <div class="list">${top.length?top.map(taskItem).join(""):empty("할 일이 비어있음","오늘 할 일을 하나 추가해봐.")}</div>
    </div>

    <div class="card span-5">
      <div class="card-header"><div><h2>최근 7일 루틴</h2><div class="tiny">습관 완료율</div></div></div>
      <div class="list">${days.map(d=>{
        const n=state.habits.filter(h=>state.habitChecks[h.id]?.[d]).length;
        const p=state.habits.length?Math.round(n/state.habits.length*100):0;
        return `<div><div class="row"><span class="tiny grow">${d.slice(5)}</span><strong class="tiny">${p}%</strong></div><div class="progress"><i style="width:${p}%"></i></div></div>`;
      }).join("")}</div>
    </div>

    <div class="card span-12">
      <div class="card-header"><div><h2>빠른 추가</h2><div class="tiny">생각난 순간 바로 저장</div></div></div>
      <form id="quickTaskForm" class="quick-form">
        <input class="input" name="title" required maxlength="120" placeholder="예: 수학 숙제 끝내기">
        <select class="select" name="priority"><option value="medium">보통</option><option value="high">중요</option><option value="low">낮음</option></select>
        <button class="btn">추가</button>
      </form>
    </div>
  </div>`;
}