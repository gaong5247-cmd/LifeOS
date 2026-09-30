import{esc,lastDays,today,currentStreak}from"../utils.js";

export function habitsView(state){
  const days=lastDays(7);
  return `<div class="grid">
    <div class="card span-12">
      <div class="card-header"><div><h2>새 습관</h2><div class="tiny">하루 한 번 체크하는 단순한 루틴 트래커</div></div></div>
      <form id="habitForm" class="quick-form">
        <input class="input" name="name" required maxlength="60" placeholder="예: 물 2L 마시기">
        <select class="select" name="emoji"><option>✓</option><option>💧</option><option>📚</option><option>🏃</option><option>🧘</option><option>💻</option></select>
        <button class="btn">추가</button>
      </form>
    </div>

    <div class="card span-12">
      <div class="card-header"><div><h2>최근 7일</h2><div class="tiny">칸을 눌러 완료/취소</div></div></div>
      ${state.habits.length?`
      <div class="habit-grid">
        <div></div>
        ${days.map(d=>`<div class="day">${["일","월","화","수","목","금","토"][new Date(d+"T00:00:00").getDay()]}<br>${d.slice(8)}</div>`).join("")}
        ${state.habits.map(h=>`
          <div class="row">
            <span>${esc(h.emoji||"✓")}</span>
            <div class="grow"><div class="habit-name">${esc(h.name)}</div><div class="tiny">${currentStreak(state,h.id)}일 연속</div></div>
            <button class="icon-action" data-habit-delete="${h.id}">✕</button>
          </div>
          ${days.map(d=>`<button class="habit-cell ${state.habitChecks[h.id]?.[d]?"on":""}" data-habit="${h.id}" data-date="${d}" title="${d}${d===today()?" · 오늘":""}">✓</button>`).join("")}
        `).join("")}
      </div>`:'<div class="empty"><strong>습관이 아직 없음</strong><div>매일 반복하고 싶은 걸 하나 추가해봐.</div></div>'}
    </div>
  </div>`;
}