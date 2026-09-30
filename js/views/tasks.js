import{esc,taskScore}from"../utils.js";

const item=t=>`<div class="item">
  <button class="check ${t.done?"done":""}" data-task-toggle="${t.id}">${t.done?"✓":""}</button>
  <div class="grow">
    <div class="item-title ${t.done?"done":""}">${esc(t.title)}</div>
    <div class="tiny">
      <span class="pill ${t.priority}">${({high:"중요",medium:"보통",low:"낮음"}[t.priority]||"보통")}</span>
      ${t.due?" · 마감 "+esc(t.due):""}
      ${!t.done?" · 자동 점수 "+taskScore(t):""}
    </div>
  </div>
  <button class="icon-action" data-task-delete="${t.id}">✕</button>
</div>`;

export function tasksView(state,filter="open"){
  const list=[...state.tasks]
    .filter(t=>filter==="all"||(filter==="done"?t.done:!t.done))
    .sort((a,b)=>taskScore(b)-taskScore(a)||(b.createdAt||0)-(a.createdAt||0));

  return `<div class="grid">
    <div class="card span-12">
      <div class="card-header"><div><h2>새 할 일</h2><div class="tiny">서버 없음. 이 기기에만 저장됨.</div></div></div>
      <form id="taskForm" class="quick-form">
        <input class="input" name="title" required maxlength="120" placeholder="할 일 입력">
        <select class="select" name="priority"><option value="medium">보통</option><option value="high">중요</option><option value="low">낮음</option></select>
        <button class="btn">추가</button>
        <input class="input" name="due" type="date" style="grid-column:1/-1">
      </form>
    </div>

    <div class="card span-12">
      <div class="card-header">
        <div><h2>할 일 목록</h2><div class="tiny">마감일 + 중요도 + 오래된 정도를 점수화해 자동 정렬</div></div>
        <div class="row">
          ${["open","done","all"].map(x=>`<button class="btn ${filter===x?"":"secondary"}" data-task-filter="${x}">${({open:"진행",done:"완료",all:"전체"}[x])}</button>`).join("")}
        </div>
      </div>
      <div class="list">${list.length?list.map(item).join(""):'<div class="empty"><strong>표시할 할 일이 없음</strong><div>새 항목을 추가해봐.</div></div>'}</div>
    </div>
  </div>`;
}