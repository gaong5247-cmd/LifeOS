import{esc,money,today,monthKey}from"../utils.js";

export function moneyView(state){
  const month=monthKey(today());
  const items=[...state.expenses]
    .filter(e=>monthKey(e.date)===month)
    .sort((a,b)=>b.date.localeCompare(a.date)||b.createdAt-a.createdAt);
  const total=items.reduce((sum,e)=>sum+Number(e.amount),0);
  const groups={};
  for(const e of items)groups[e.category]=(groups[e.category]||0)+Number(e.amount);

  return `<div class="grid">
    <div class="card span-5">
      <div class="card-header"><div><h2>지출 추가</h2><div class="tiny">복잡한 가계부 말고, 빠른 기록용</div></div></div>
      <form id="expenseForm" style="display:grid;gap:9px">
        <input class="input" name="title" required maxlength="80" placeholder="예: 점심">
        <input class="input" name="amount" type="number" min="0" step="1" required placeholder="금액">
        <select class="select" name="category"><option>식비</option><option>교통</option><option>쇼핑</option><option>구독</option><option>취미</option><option>기타</option></select>
        <input class="input" name="date" type="date" value="${today()}" required>
        <button class="btn">기록</button>
      </form>
    </div>

    <div class="card span-7">
      <div class="stat-label">${month} 총지출</div>
      <div class="money-total">₩${money(total)}</div>
      <div class="list" style="margin-top:18px">
        ${Object.entries(groups).length?Object.entries(groups).sort((a,b)=>b[1]-a[1]).map(([name,value])=>{
          const p=total?Math.round(value/total*100):0;
          return `<div><div class="row"><span class="grow">${esc(name)}</span><strong>₩${money(value)}</strong><span class="tiny">${p}%</span></div><div class="progress"><i style="width:${p}%"></i></div></div>`;
        }).join(""):'<div class="empty"><strong>이번 달 지출 없음</strong><div>첫 기록을 추가해봐.</div></div>'}
      </div>
    </div>

    <div class="card span-12">
      <div class="card-header"><div><h2>이번 달 내역</h2><div class="tiny">${items.length}건</div></div></div>
      <div class="list">${items.length?items.map(e=>`
        <div class="item">
          <div class="grow"><div class="item-title">${esc(e.title)}</div><div class="tiny">${esc(e.date)} · ${esc(e.category)}</div></div>
          <strong>₩${money(e.amount)}</strong>
          <button class="icon-action" data-expense-delete="${e.id}">✕</button>
        </div>`).join(""):'<div class="empty"><strong>기록 없음</strong></div>'}
      </div>
    </div>
  </div>`;
}