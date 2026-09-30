(() => {
  "use strict";

  const STORAGE_KEY = "lifeos.state.v1";
  const TIMER_KEY = "lifeos.timer.v1";
  const VERSION = 1;
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const uid = () => crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)+Date.now().toString(36);
  const isoDate = (d=new Date()) => {
    const z = new Date(d.getTime()-d.getTimezoneOffset()*60000);
    return z.toISOString().slice(0,10);
  };
  const money = n => new Intl.NumberFormat("ko-KR").format(Number(n)||0);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const clamp = (n,a,b)=>Math.max(a,Math.min(b,n));
  const today = () => isoDate(new Date());
  const monthKey = d => d.slice(0,7);

  const initialState = () => ({
    version: VERSION,
    tasks: [],
    habits: [],
    habitChecks: {},
    notes: [],
    expenses: [],
    focusSessions: [],
    settings: { theme: matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light" }
  });

  let state = load();
  let activeView = "today";
  let taskFilter = "open";
  let noteQuery = "";
  let timerTick = null;

  function load(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      if(!raw) return initialState();
      const parsed = JSON.parse(raw);
      return migrate(parsed);
    }catch{
      return initialState();
    }
  }
  function migrate(s){
    const base = initialState();
    if(!s || typeof s !== "object") return base;
    return {
      ...base, ...s,
      version: VERSION,
      tasks: Array.isArray(s.tasks)?s.tasks:[],
      habits: Array.isArray(s.habits)?s.habits:[],
      habitChecks: s.habitChecks && typeof s.habitChecks==="object"?s.habitChecks:{},
      notes: Array.isArray(s.notes)?s.notes:[],
      expenses: Array.isArray(s.expenses)?s.expenses:[],
      focusSessions: Array.isArray(s.focusSessions)?s.focusSessions:[],
      settings: {...base.settings,...(s.settings||{})}
    };
  }
  function save(){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
  function mutate(fn, message){
    const snapshot = structuredClone ? structuredClone(state) : JSON.parse(JSON.stringify(state));
    try{
      fn(state);
      save();
      render();
      if(message) toast(message);
    }catch(err){
      state = snapshot;
      console.error(err);
      toast("변경을 저장하지 못했어요.");
    }
  }

  function taskScore(t){
    if(t.done) return -9999;
    let s = ({high:35,medium:18,low:7}[t.priority]||0);
    if(t.due){
      const days = Math.ceil((new Date(t.due+"T23:59:59")-new Date())/86400000);
      if(days<0) s += 60 + Math.abs(days)*3;
      else if(days===0) s += 48;
      else if(days===1) s += 32;
      else if(days<=3) s += 18;
      else if(days<=7) s += 8;
    }
    const age = Math.max(0,(Date.now()-(t.createdAt||Date.now()))/86400000);
    s += Math.min(12,age*.7);
    return Math.round(s);
  }

  function currentStreak(habitId){
    let streak=0;
    const d=new Date();
    for(let i=0;i<3660;i++){
      const key=isoDate(d);
      if(state.habitChecks[habitId]?.[key]) streak++;
      else {
        if(i===0){ d.setDate(d.getDate()-1); continue; }
        break;
      }
      d.setDate(d.getDate()-1);
    }
    return streak;
  }

  function lastDays(n=7){
    return Array.from({length:n},(_,i)=>{
      const d=new Date(); d.setDate(d.getDate()-(n-1-i)); return isoDate(d);
    });
  }

  function completionForDate(date){
    if(!state.habits.length) return 0;
    const done=state.habits.filter(h=>state.habitChecks[h.id]?.[date]).length;
    return Math.round(done/state.habits.length*100);
  }

  function render(){
    document.documentElement.classList.toggle("dark", state.settings.theme==="dark");
    $("#themeBtn").textContent=state.settings.theme==="dark"?"☾":"☼";
    $("#dateLabel").textContent=new Intl.DateTimeFormat("ko-KR",{year:"numeric",month:"long",day:"numeric",weekday:"long"}).format(new Date());
    $$(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.view===activeView));
    const titles={today:"오늘",tasks:"할 일",habits:"습관",notes:"메모",money:"지출",focus:"집중"};
    $("#viewTitle").textContent=titles[activeView];
    const fn={today:renderToday,tasks:renderTasks,habits:renderHabits,notes:renderNotes,money:renderMoney,focus:renderFocus}[activeView];
    $("#view").innerHTML=fn();
    bindViewEvents();
  }

  function renderToday(){
    const open=state.tasks.filter(t=>!t.done);
    const doneToday=state.tasks.filter(t=>t.done && t.doneAt?.slice(0,10)===today()).length;
    const habitsDone=state.habits.filter(h=>state.habitChecks[h.id]?.[today()]).length;
    const habitPct=state.habits.length?Math.round(habitsDone/state.habits.length*100):0;
    const month=monthKey(today());
    const spent=state.expenses.filter(e=>monthKey(e.date)===month).reduce((a,e)=>a+Number(e.amount),0);
    const focusMin=Math.round(state.focusSessions.filter(s=>s.date===today()).reduce((a,s)=>a+s.minutes,0));
    const topTasks=[...open].sort((a,b)=>taskScore(b)-taskScore(a)).slice(0,5);
    const days=lastDays(7);
    const points=days.map((d,i)=>[i*50,70-completionForDate(d)*.62]);
    return `
      <div class="grid">
        <div class="card stat span-3"><div class="stat-label">남은 할 일</div><div class="stat-value">${open.length}</div><div class="stat-sub">오늘 완료 ${doneToday}개</div></div>
        <div class="card stat span-3"><div class="stat-label">습관 달성률</div><div class="stat-value">${habitPct}%</div><div class="progress"><i style="width:${habitPct}%"></i></div></div>
        <div class="card stat span-3"><div class="stat-label">이번 달 지출</div><div class="stat-value">₩${money(spent)}</div><div class="stat-sub">${month}</div></div>
        <div class="card stat span-3"><div class="stat-label">오늘 집중</div><div class="stat-value">${focusMin}<small style="font-size:14px">분</small></div><div class="stat-sub">완료 세션 ${state.focusSessions.filter(s=>s.date===today()).length}회</div></div>

        <div class="card span-7">
          <div class="card-header"><div><h2>지금 먼저 할 것</h2><div class="muted tiny">마감 · 중요도 · 오래된 정도를 계산해서 자동 정렬</div></div><button class="btn secondary" data-go="tasks">전체 보기</button></div>
          <div class="list">${topTasks.length?topTasks.map(taskItem).join(""):empty("할 일이 비어있음","오늘 할 일을 하나 추가해봐.")}</div>
        </div>
        <div class="card span-5">
          <div class="card-header"><div><h2>7일 루틴 흐름</h2><div class="muted tiny">습관 완료율</div></div></div>
          <svg class="spark" viewBox="0 0 300 80" preserveAspectRatio="none"><polyline points="${points.map(p=>p.join(",")).join(" ")}"/></svg>
          <div class="row" style="justify-content:space-between">${days.map(d=>`<span class="tiny muted">${d.slice(5)}</span>`).join("")}</div>
        </div>
        <div class="card span-12">
          <div class="card-header"><div><h2>빠른 추가</h2><div class="muted tiny">생각난 순간 바로 저장</div></div><span class="kbd">Ctrl / ⌘ + K</span></div>
          <form id="quickTaskForm" class="quick-form">
            <input class="input" name="title" required maxlength="120" placeholder="예: 수학 숙제 끝내기" />
            <select class="select" name="priority"><option value="medium">보통</option><option value="high">중요</option><option value="low">낮음</option></select>
            <button class="btn">추가</button>
          </form>
        </div>
      </div>`;
  }

  function taskItem(t){
    return `<div class="item">
      <button class="check ${t.done?"done":""}" data-task-toggle="${t.id}" aria-label="완료">${t.done?"✓":""}</button>
      <div class="grow" style="min-width:0">
        <div class="item-title ${t.done?"done":""}">${esc(t.title)}</div>
        <div class="row wrap tiny muted" style="margin-top:5px">
          <span class="pill ${t.priority}">${({high:"중요",medium:"보통",low:"낮음"}[t.priority]||"보통")}</span>
          ${t.due?`<span>마감 ${esc(t.due)}</span>`:""}
          ${!t.done?`<span class="score">우선순위 ${taskScore(t)}</span>`:""}
        </div>
      </div>
      <button class="icon-action" data-task-delete="${t.id}">✕</button>
    </div>`;
  }

  function renderTasks(){
    const list=[...state.tasks]
      .filter(t=>taskFilter==="all" || (taskFilter==="done"?t.done:!t.done))
      .sort((a,b)=>taskScore(b)-taskScore(a) || (b.createdAt||0)-(a.createdAt||0));
    return `
      <div class="grid">
        <div class="card span-12">
          <form id="taskForm" class="quick-form">
            <input class="input" name="title" required maxlength="120" placeholder="새 할 일" />
            <select class="select" name="priority"><option value="medium">보통</option><option value="high">중요</option><option value="low">낮음</option></select>
            <button class="btn">추가</button>
            <input class="input" name="due" type="date" style="grid-column:1/-1" />
          </form>
        </div>
        <div class="card span-12">
          <div class="card-header"><div><h2>목록</h2><div class="muted tiny">자동 우선순위 정렬</div></div>
            <div class="row">${["open","done","all"].map(f=>`<button class="btn ${taskFilter===f?"":"secondary"}" data-task-filter="${f}">${({open:"진행",done:"완료",all:"전체"}[f])}</button>`).join("")}</div>
          </div>
          <div class="list">${list.length?list.map(taskItem).join(""):empty("표시할 할 일이 없음","새 항목을 추가해봐.")}</div>
        </div>
      </div>`;
  }

  function renderHabits(){
    const days=lastDays(7);
    return `
      <div class="grid">
        <div class="card span-12">
          <form id="habitForm" class="quick-form">
            <input class="input" name="name" required maxlength="60" placeholder="예: 물 2L 마시기" />
            <select class="select" name="emoji"><option>✓</option><option>💧</option><option>📚</option><option>🏃</option><option>🧘</option><option>💻</option></select>
            <button class="btn">습관 추가</button>
          </form>
        </div>
        <div class="card span-12">
          <div class="card-header"><div><h2>최근 7일</h2><div class="muted tiny">칸을 눌러 완료 체크</div></div></div>
          ${state.habits.length?`
          <div class="habit-grid">
            <div></div>${days.map(d=>`<div class="day">${["일","월","화","수","목","금","토"][new Date(d+"T00:00:00").getDay()]}<br>${d.slice(8)}</div>`).join("")}
            ${state.habits.map(h=>`
              <div class="row"><span>${esc(h.emoji||"✓")}</span><div style="min-width:0"><div class="habit-name">${esc(h.name)}</div><div class="tiny muted">${currentStreak(h.id)}일 연속</div></div><button class="icon-action" data-habit-delete="${h.id}">✕</button></div>
              ${days.map(d=>`<button class="habit-cell ${state.habitChecks[h.id]?.[d]?"on":""} ${d===today()?"today":""}" data-habit="${h.id}" data-date="${d}">✓</button>`).join("")}
            `).join("")}
          </div>`:empty("습관이 없음","매일 반복하고 싶은 걸 추가해봐.")}
        </div>
      </div>`;
  }

  function renderNotes(){
    const notes=[...state.notes].filter(n=>n.text.toLowerCase().includes(noteQuery.toLowerCase())).sort((a,b)=>(b.pinned-a.pinned)||(b.updatedAt-a.updatedAt));
    return `
      <div class="grid">
        <div class="card span-5">
          <div class="card-header"><div><h2>새 메모</h2><div class="muted tiny">서버로 전송되지 않음</div></div></div>
          <form id="noteForm">
            <textarea class="textarea" name="text" maxlength="4000" required placeholder="생각난 거 아무거나 적기..."></textarea>
            <div class="row" style="justify-content:flex-end;margin-top:8px"><button class="btn">저장</button></div>
          </form>
        </div>
        <div class="card span-7">
          <div class="search-row"><input id="noteSearch" class="input" value="${esc(noteQuery)}" placeholder="메모 검색..." /></div>
          <div class="note-grid">${notes.length?notes.map(n=>`
            <article class="note">
              <p>${esc(n.text)}</p>
              <footer><span>${new Date(n.updatedAt).toLocaleString("ko-KR")}</span><span>
                <button class="icon-action" data-note-pin="${n.id}">${n.pinned?"★":"☆"}</button>
                <button class="icon-action" data-note-delete="${n.id}">✕</button>
              </span></footer>
            </article>`).join(""):empty("검색 결과 없음","메모를 추가하거나 다른 검색어를 써봐.")}</div>
        </div>
      </div>`;
  }

  function renderMoney(){
    const month=monthKey(today());
    const items=[...state.expenses].filter(e=>monthKey(e.date)===month).sort((a,b)=>b.date.localeCompare(a.date)||b.createdAt-a.createdAt);
    const total=items.reduce((a,e)=>a+Number(e.amount),0);
    const byCat={};
    items.forEach(e=>byCat[e.category]=(byCat[e.category]||0)+Number(e.amount));
    const max=Math.max(1,...Object.values(byCat));
    return `
      <div class="grid">
        <div class="card span-5">
          <div class="card-header"><div><h2>지출 추가</h2><div class="muted tiny">복잡한 가계부 말고 기록만 빠르게</div></div></div>
          <form id="expenseForm" style="display:grid;gap:9px">
            <input class="input" name="title" required maxlength="80" placeholder="예: 점심" />
            <div class="row"><input class="input" name="amount" type="number" min="0" step="1" required placeholder="금액" /><select class="select" name="category"><option>식비</option><option>교통</option><option>쇼핑</option><option>구독</option><option>취미</option><option>기타</option></select></div>
            <input class="input" name="date" type="date" value="${today()}" required />
            <button class="btn">기록</button>
          </form>
        </div>
        <div class="card span-7">
          <div class="muted tiny">${month} 총지출</div><div class="money-total">₩${money(total)} <small>/ ${items.length}건</small></div>
          <div class="bar-chart">${Object.entries(byCat).length?Object.entries(byCat).map(([k,v])=>`<div class="bar" style="height:${Math.max(8,v/max*100)}%" title="${esc(k)} ₩${money(v)}"><span>${esc(k)}</span></div>`).join(""):'<div class="muted small">아직 지출 기록이 없음</div>'}</div>
        </div>
        <div class="card span-12">
          <div class="card-header"><h2>이번 달 내역</h2></div>
          <div class="list">${items.length?items.map(e=>`<div class="item"><div class="grow"><div class="item-title">${esc(e.title)}</div><div class="tiny muted">${esc(e.date)} · ${esc(e.category)}</div></div><strong>₩${money(e.amount)}</strong><button class="icon-action" data-expense-delete="${e.id}">✕</button></div>`).join(""):empty("이번 달 기록 없음","첫 지출을 기록해봐.")}</div>
        </div>
      </div>`;
  }

  function timerState(){
    try{return JSON.parse(localStorage.getItem(TIMER_KEY))||{mode:"focus",minutes:25,running:false,endsAt:0,remaining:1500};}
    catch{return {mode:"focus",minutes:25,running:false,endsAt:0,remaining:1500};}
  }
  function saveTimer(t){localStorage.setItem(TIMER_KEY,JSON.stringify(t))}
  function timerRemaining(t){
    return t.running?Math.max(0,Math.ceil((t.endsAt-Date.now())/1000)):Math.max(0,t.remaining);
  }
  function renderFocus(){
    const t=timerState(),sec=timerRemaining(t),mm=String(Math.floor(sec/60)).padStart(2,"0"),ss=String(sec%60).padStart(2,"0");
    return `
      <div class="grid">
        <div class="card span-12 timer">
          <div class="timer-mode"><span class="ring"></span>${t.mode==="focus"?"Focus":"Break"}</div>
          <div id="timerDisplay" class="timer-display">${mm}:${ss}</div>
          <div class="timer-actions">
            <button class="btn" data-timer="${t.running?"pause":"start"}">${t.running?"일시정지":"시작"}</button>
            <button class="btn secondary" data-timer="reset">초기화</button>
            <button class="btn secondary" data-timer="switch">${t.mode==="focus"?"5분 휴식":"25분 집중"}</button>
          </div>
          <div class="muted tiny" style="margin-top:18px">탭을 닫아도 종료 시각을 기준으로 이어서 계산함.</div>
        </div>
        <div class="card span-12">
          <div class="card-header"><div><h2>오늘 집중 기록</h2><div class="muted tiny">완료된 집중 세션</div></div></div>
          <div class="list">${state.focusSessions.filter(s=>s.date===today()).length?state.focusSessions.filter(s=>s.date===today()).map(s=>`<div class="item"><div class="grow"><div class="item-title">${s.minutes}분 집중</div><div class="tiny muted">${new Date(s.at).toLocaleTimeString("ko-KR",{hour:"2-digit",minute:"2-digit"})}</div></div><span>✓</span></div>`).join(""):empty("아직 집중 기록 없음","타이머를 한 번 끝까지 돌려봐.")}</div>
        </div>
      </div>`;
  }

  function empty(title,sub){
    return `<div class="empty"><div class="empty-icon">◇</div><strong>${esc(title)}</strong><span>${esc(sub)}</span></div>`;
  }

  function bindViewEvents(){
    $("[data-go]")?.addEventListener("click",e=>go(e.currentTarget.dataset.go));
    $("#quickTaskForm")?.addEventListener("submit",handleTaskForm);
    $("#taskForm")?.addEventListener("submit",handleTaskForm);
    $("#habitForm")?.addEventListener("submit",e=>{
      e.preventDefault(); const fd=new FormData(e.currentTarget);
      mutate(s=>s.habits.push({id:uid(),name:String(fd.get("name")).trim(),emoji:String(fd.get("emoji")),createdAt:Date.now()}),"습관 추가 완료");
    });
    $("#noteForm")?.addEventListener("submit",e=>{
      e.preventDefault(); const text=String(new FormData(e.currentTarget).get("text")).trim(); if(!text)return;
      mutate(s=>s.notes.push({id:uid(),text,pinned:false,updatedAt:Date.now()}),"메모 저장");
    });
    $("#noteSearch")?.addEventListener("input",e=>{noteQuery=e.target.value;render();requestAnimationFrame(()=>{$("#noteSearch")?.focus();$("#noteSearch")?.setSelectionRange(noteQuery.length,noteQuery.length)})});
    $("#expenseForm")?.addEventListener("submit",e=>{
      e.preventDefault(); const fd=new FormData(e.currentTarget), amount=Number(fd.get("amount"));
      if(!Number.isFinite(amount)||amount<0)return;
      mutate(s=>s.expenses.push({id:uid(),title:String(fd.get("title")).trim(),amount,category:String(fd.get("category")),date:String(fd.get("date")),createdAt:Date.now()}),"지출 기록 완료");
    });

    $$("[data-task-toggle]").forEach(b=>b.onclick=()=>mutate(s=>{const t=s.tasks.find(x=>x.id===b.dataset.taskToggle);if(t){t.done=!t.done;t.doneAt=t.done?today():null}}));
    $$("[data-task-delete]").forEach(b=>b.onclick=()=>mutate(s=>s.tasks=s.tasks.filter(x=>x.id!==b.dataset.taskDelete),"삭제됨"));
    $$("[data-task-filter]").forEach(b=>b.onclick=()=>{taskFilter=b.dataset.taskFilter;render()});
    $$("[data-habit]").forEach(b=>b.onclick=()=>mutate(s=>{s.habitChecks[b.dataset.habit] ||= {}; s.habitChecks[b.dataset.habit][b.dataset.date]=!s.habitChecks[b.dataset.habit][b.dataset.date]}));
    $$("[data-habit-delete]").forEach(b=>b.onclick=()=>mutate(s=>{s.habits=s.habits.filter(x=>x.id!==b.dataset.habitDelete);delete s.habitChecks[b.dataset.habitDelete]},"습관 삭제"));
    $$("[data-note-pin]").forEach(b=>b.onclick=()=>mutate(s=>{const n=s.notes.find(x=>x.id===b.dataset.notePin);if(n){n.pinned=!n.pinned;n.updatedAt=Date.now()}}));
    $$("[data-note-delete]").forEach(b=>b.onclick=()=>mutate(s=>s.notes=s.notes.filter(x=>x.id!==b.dataset.noteDelete),"메모 삭제"));
    $$("[data-expense-delete]").forEach(b=>b.onclick=()=>mutate(s=>s.expenses=s.expenses.filter(x=>x.id!==b.dataset.expenseDelete),"지출 기록 삭제"));
    $$("[data-timer]").forEach(b=>b.onclick=()=>timerAction(b.dataset.timer));
    startTimerTicker();
  }

  function handleTaskForm(e){
    e.preventDefault(); const fd=new FormData(e.currentTarget), title=String(fd.get("title")).trim(); if(!title)return;
    mutate(s=>s.tasks.push({id:uid(),title,priority:String(fd.get("priority")||"medium"),due:String(fd.get("due")||""),done:false,createdAt:Date.now(),doneAt:null}),"할 일 추가 완료");
  }

  function timerAction(action){
    let t=timerState(), rem=timerRemaining(t);
    if(action==="start"){
      if(rem<=0) rem=t.minutes*60;
      t.running=true;t.endsAt=Date.now()+rem*1000;t.remaining=rem;
    }else if(action==="pause"){
      t.remaining=rem;t.running=false;t.endsAt=0;
    }else if(action==="reset"){
      t.running=false;t.remaining=t.minutes*60;t.endsAt=0;
    }else if(action==="switch"){
      t.mode=t.mode==="focus"?"break":"focus";t.minutes=t.mode==="focus"?25:5;t.running=false;t.remaining=t.minutes*60;t.endsAt=0;
    }
    saveTimer(t);render();
  }

  function startTimerTicker(){
    clearInterval(timerTick);
    if(activeView!=="focus") return;
    timerTick=setInterval(()=>{
      const t=timerState(), rem=timerRemaining(t);
      const el=$("#timerDisplay");
      if(el) el.textContent=String(Math.floor(rem/60)).padStart(2,"0")+":"+String(rem%60).padStart(2,"0");
      if(t.running && rem<=0){
        t.running=false;t.remaining=t.minutes*60;t.endsAt=0;saveTimer(t);
        if(t.mode==="focus"){
          mutate(s=>s.focusSessions.push({id:uid(),date:today(),minutes:t.minutes,at:Date.now()}),"집중 세션 완료");
        }else{toast("휴식 끝. 다시 가자.");render()}
      }
    },500);
  }

  function go(view){
    activeView=view;render();window.scrollTo({top:0,behavior:"smooth"});
  }

  function toast(msg){
    const el=$("#toast");el.textContent=msg;el.classList.add("show");clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove("show"),1600);
  }

  const commands=[
    {name:"오늘 화면",hint:"G T",run:()=>go("today")},
    {name:"할 일 열기",hint:"G A",run:()=>go("tasks")},
    {name:"습관 열기",hint:"G H",run:()=>go("habits")},
    {name:"메모 열기",hint:"G N",run:()=>go("notes")},
    {name:"지출 열기",hint:"G M",run:()=>go("money")},
    {name:"집중 타이머",hint:"G F",run:()=>go("focus")},
    {name:"테마 전환",hint:"",run:toggleTheme},
    {name:"데이터 내보내기",hint:"JSON",run:exportData}
  ];
  function fuzzy(q,s){
    q=q.toLowerCase().replace(/\s/g,"");s=s.toLowerCase();
    let score=0,pos=0,streak=0;
    for(const c of q){
      const i=s.indexOf(c,pos);if(i<0)return -1;
      streak=i===pos?streak+1:0;score+=10+streak*3-Math.min(i-pos,8);pos=i+1;
    }return score;
  }
  function openCommand(){
    const d=$("#commandDialog");d.showModal();$("#commandInput").value="";renderCommands("");setTimeout(()=>$("#commandInput").focus(),0);
  }
  function renderCommands(q){
    const rows=commands.map((c,_index)=>({...c,_index,score:q?fuzzy(q,c.name):0})).filter(x=>x.score>=0).sort((a,b)=>b.score-a.score);
    $("#commandResults").innerHTML=rows.map((c,i)=>`<button type="button" class="command-result ${i===0?"active":""}" data-command="${c._index}"><span>${esc(c.name)}</span><span>${esc(c.hint)}</span></button>`).join("");
    $$("[data-command]").forEach(b=>b.onclick=()=>{const c=commands[Number(b.dataset.command)];$("#commandDialog").close();c.run()});
  }

  function toggleTheme(){mutate(s=>s.settings.theme=s.settings.theme==="dark"?"light":"dark")}
  function exportData(){
    const payload={app:"LifeOS",version:VERSION,exportedAt:new Date().toISOString(),data:state};
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
    const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`lifeos-backup-${today()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
    toast("백업 파일 생성");
  }
  async function importData(file){
    try{
      const obj=JSON.parse(await file.text());
      const incoming=obj?.app==="LifeOS"?obj.data:obj;
      if(!incoming || typeof incoming!=="object") throw new Error("invalid");
      state=migrate(incoming);save();render();toast("가져오기 완료");
    }catch{toast("올바른 LifeOS 백업이 아님")}
  }

  $("#nav").addEventListener("click",e=>{const b=e.target.closest("[data-view]");if(b)go(b.dataset.view)});
  $("#themeBtn").addEventListener("click",toggleTheme);
  $("#commandBtn").addEventListener("click",openCommand);
  $("#commandInput").addEventListener("input",e=>renderCommands(e.target.value));
  $("#commandInput").addEventListener("keydown",e=>{
    if(e.key==="Enter"){
      e.preventDefault();
      $(".command-result.active")?.click();
    }
  });
  $("#exportBtn").addEventListener("click",exportData);
  $("#importInput").addEventListener("change",e=>{if(e.target.files?.[0])importData(e.target.files[0]);e.target.value=""});
  window.addEventListener("keydown",e=>{
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();openCommand()}
    if(e.key==="Escape" && $("#commandDialog").open) $("#commandDialog").close();
  });

  if("serviceWorker" in navigator) window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(console.warn));
  render();
})();