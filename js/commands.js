import{$,$$,esc,fuzzy}from"./utils.js";

export function mountCommands(actions){
  const dialog=$("#commandDialog");
  const input=$("#commandInput");
  const results=$("#commandResults");

  const commands=[
    {name:"오늘 화면",hint:"dashboard",run:()=>actions.go("today")},
    {name:"할 일 열기",hint:"tasks",run:()=>actions.go("tasks")},
    {name:"습관 열기",hint:"habits",run:()=>actions.go("habits")},
    {name:"메모 열기",hint:"notes",run:()=>actions.go("notes")},
    {name:"지출 열기",hint:"money",run:()=>actions.go("money")},
    {name:"집중 타이머",hint:"focus",run:()=>actions.go("focus")},
    {name:"테마 전환",hint:"dark / light",run:actions.toggleTheme},
    {name:"데이터 내보내기",hint:"JSON",run:actions.exportData}
  ];

  function draw(query=""){
    const rows=commands
      .map((command,index)=>({...command,index,score:query?fuzzy(query,command.name+" "+command.hint):0}))
      .filter(x=>x.score>=0)
      .sort((a,b)=>b.score-a.score);

    results.innerHTML=rows.map((c,i)=>`
      <button type="button" class="command-result ${i===0?"active":""}" data-command="${c.index}">
        <span>${esc(c.name)}</span><span class="tiny">${esc(c.hint)}</span>
      </button>`).join("");

    $$("[data-command]",results).forEach(button=>{
      button.onclick=()=>{
        dialog.close();
        commands[Number(button.dataset.command)].run();
      };
    });
  }

  function open(){
    if(dialog.open)return;
    dialog.showModal();
    input.value="";
    draw("");
    setTimeout(()=>input.focus(),0);
  }

  $("#commandBtn").addEventListener("click",open);
  input.addEventListener("input",()=>draw(input.value));
  input.addEventListener("keydown",event=>{
    if(event.key==="Enter"){
      event.preventDefault();
      $(".command-result.active",results)?.click();
    }
  });

  window.addEventListener("keydown",event=>{
    if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==="k"){
      event.preventDefault();
      open();
    }
  });

  return{open};
}