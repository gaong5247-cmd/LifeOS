import{esc}from"../utils.js";

export function notesView(state,query=""){
  const q=query.trim().toLowerCase();
  const notes=[...state.notes]
    .filter(n=>!q||n.text.toLowerCase().includes(q))
    .sort((a,b)=>(Number(b.pinned)-Number(a.pinned))||(b.updatedAt-a.updatedAt));

  return `<div class="grid">
    <div class="card span-5">
      <div class="card-header"><div><h2>새 메모</h2><div class="tiny">기기 안에만 저장됨</div></div></div>
      <form id="noteForm">
        <textarea class="textarea" name="text" maxlength="4000" required placeholder="생각난 거 아무거나 적기..."></textarea>
        <div class="row" style="justify-content:flex-end;margin-top:8px"><button class="btn">저장</button></div>
      </form>
    </div>

    <div class="card span-7">
      <div class="card-header"><div><h2>메모함</h2><div class="tiny">별표 메모가 위로 올라감</div></div></div>
      <input id="noteSearch" class="input" value="${esc(query)}" placeholder="메모 검색..." style="margin-bottom:12px">
      <div class="note-grid">
        ${notes.length?notes.map(n=>`
          <article class="note">
            <p>${esc(n.text)}</p>
            <footer>
              <span>${new Date(n.updatedAt).toLocaleString("ko-KR")}</span>
              <span>
                <button class="icon-action" data-note-pin="${n.id}">${n.pinned?"★":"☆"}</button>
                <button class="icon-action" data-note-delete="${n.id}">✕</button>
              </span>
            </footer>
          </article>`).join(""):'<div class="empty"><strong>메모가 없음</strong><div>첫 메모를 적어봐.</div></div>'}
      </div>
    </div>
  </div>`;
}