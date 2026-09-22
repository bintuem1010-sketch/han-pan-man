(() => {
  "use strict";

  const WON = new Intl.NumberFormat("ko-KR");
  const LINES = [
    [0,1,2,3], [4,5,6,7], [8,9,10,11], [12,13,14,15],
    [0,4,8,12], [1,5,9,13], [2,6,10,14], [3,7,11,15],
    [0,5,10,15], [3,6,9,12]
  ];

  const ITEMS = [
    { id:"seven", name:"불길한 7", text:"7이 든 조합 배율 ×3", price:160, rarity:"희귀" },
    { id:"mirror", name:"깨진 거울", text:"같은 숫자 조합 배율 ×2", price:130, rarity:"보통" },
    { id:"counterfeit", name:"위조 주사위", text:"9를 6으로도 취급", price:180, rarity:"희귀" },
    { id:"calculator", name:"깨진 계산기", text:"조합 합이 홀수면 배율 ×2", price:120, rarity:"보통" },
    { id:"debtRing", name:"사채업자의 반지", text:"부족한 목표액 500원마다 배율 +1", price:210, rarity:"저주" },
    { id:"corner", name:"녹슨 나침반", text:"모서리가 든 조합 배율 ×2", price:115, rarity:"보통" },
    { id:"blackCoin", name:"검은 동전", text:"재도전 중 얻는 점수 ×1.5", price:145, rarity:"희귀" },
    { id:"abacus", name:"붉은 주판", text:"연속수 조합 배율 ×2", price:170, rarity:"희귀" },
    { id:"odd", name:"외눈박이 딜러", text:"홀수 3개 이상이면 배율 ×2", price:155, rarity:"희귀" },
    { id:"insurance", name:"보험 증서", text:"런 중 한 번 실패를 막고 현금화", price:230, rarity:"특급" },
    { id:"doubleDown", name:"양면 칩", text:"현금화 금액 ×2, 다음 목표도 ×1.25", price:195, rarity:"저주" },
    { id:"wildOne", name:"조커의 못", text:"1을 원하는 숫자로 취급", price:240, rarity:"특급" },
    { id:"echo", name:"메아리 종", text:"대각선 조합 배율 ×2", price:140, rarity:"보통" },
    { id:"greed", name:"탐욕의 틀니", text:"연승 3회부터 위험 배율 +2", price:175, rarity:"저주" },
    { id:"pocket", name:"밑장 주머니", text:"판마다 숫자 하나를 다시 뽑기", price:125, rarity:"보통", active:true }
  ];

  const BOSSES = [
    { id:"noSeven", name:"칠흑의 딜러", text:"7이 놓이면 즉시 0으로 변한다.", every:3 },
    { id:"twins", name:"쌍둥이 사기꾼", text:"같은 숫자가 붙으면 기본점수 -30%.", every:3 },
    { id:"short", name:"성급한 지배인", text:"이번 판은 8턴뿐이다.", every:3 },
    { id:"tax", name:"세금 징수원", text:"현금화할 때 20%를 가져간다.", every:3 }
  ];

  const state = {
    board:Array(16).fill(null), next:1, turn:0, maxTurns:10, stage:1, room:1,
    target:500, bank:0, pot:0, roundGain:0, risk:1, streak:0, items:[], boss:null,
    endless:false, insuranceUsed:false, rerollUsed:false, sound:false, locked:false,
    seenLines:new Set(), scoredCells:new Set()
  };

  const $ = (id) => document.getElementById(id);
  const money = (n) => `₩${WON.format(Math.max(0, Math.floor(n)))}`;
  const has = (id) => state.items.some(i => i.id === id);
  const record = JSON.parse(localStorage.getItem("hanpan-records") || '{"runs":0,"wins":0,"best":0,"stage":1,"combo":1}');

  function saveRecord() { localStorage.setItem("hanpan-records", JSON.stringify(record)); }
  function updateTitleRecords() {
    $("titleRecords").innerHTML = `<span>도전 ${record.runs}회</span><span>승리 ${record.wins}회</span><span>최고 ${money(record.best)}</span><span>최고층 ${record.stage}</span><span>최고배율 ×${record.combo}</span>`;
  }

  function beep(freq=440, duration=.07, type="square") {
    if (!state.sound) return;
    const ctx = beep.ctx || (beep.ctx = new (window.AudioContext || window.webkitAudioContext)());
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.type=type; osc.frequency.value=freq; gain.gain.setValueAtTime(.045, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime+duration);
    osc.connect(gain).connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime+duration);
  }

  function randTile() {
    const pool = [1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9];
    return pool[Math.floor(Math.random()*pool.length)];
  }

  function resetBoard(preservePot=false) {
    state.board = Array(16).fill(null); state.turn=0; state.roundGain=0; if(!preservePot) state.pot=0; state.seenLines=new Set();
    state.scoredCells=new Set(); state.maxTurns = state.boss?.id === "short" ? 8 : 10;
    state.next=randTile(); state.rerollUsed=false; state.locked=false; render();
  }

  function startGame() {
    Object.assign(state, {stage:1,room:1,target:500,bank:0,pot:0,risk:1,streak:0,items:[],boss:null,endless:false,insuranceUsed:false});
    record.runs++; saveRecord(); $("titleScreen").classList.add("hidden"); $("gameScreen").classList.remove("hidden");
    closeModal(); resetBoard();
  }

  function lineVariants(values) {
    const variants=[values];
    if (has("counterfeit")) variants.push(values.map(v=>v===9?6:v));
    if (has("wildOne") && values.includes(1)) {
      for(let n=2;n<=9;n++) variants.push(values.map(v=>v===1?n:v));
    }
    return variants;
  }

  function classify(values, indexes) {
    let best=null;
    for (const vals of lineVariants(values)) {
      const sorted=[...vals].sort((a,b)=>a-b); const sum=vals.reduce((a,b)=>a+b,0);
      const counts=Object.values(vals.reduce((o,n)=>(o[n]=(o[n]||0)+1,o),{}));
      const allSame=counts.includes(4); const triple=counts.includes(3); const pairs=counts.filter(c=>c===2).length;
      const straight=sorted.every((v,i)=>i===0||v===sorted[i-1]+1);
      const candidates=[];
      if (allSame) candidates.push({name:"네 쌍", base:90, mult:7, tags:["same"]});
      if (triple) candidates.push({name:"세 쌍", base:55, mult:4, tags:["same"]});
      if (pairs===2) candidates.push({name:"두 쌍", base:45, mult:3, tags:["same"]});
      if (straight) candidates.push({name:"연속수", base:60, mult:4, tags:["straight"]});
      if (sum===21) candidates.push({name:"블랙 21", base:75, mult:5, tags:["sum"]});
      if (sum%10===0) candidates.push({name:"둥근 합", base:35, mult:2, tags:["sum"]});
      if (vals.filter(v=>v%2===1).length>=3) candidates.push({name:"홀수 행진", base:30, mult:2, tags:["odd"]});
      if (vals.includes(7)) candidates.forEach(c=>c.tags.push("seven"));
      if (indexes.some(i=>[0,3,12,15].includes(i))) candidates.forEach(c=>c.tags.push("corner"));
      if ((indexes.join() === "0,5,10,15") || (indexes.join() === "3,6,9,12")) candidates.forEach(c=>c.tags.push("diagonal"));
      const candidate=candidates.sort((a,b)=>(b.base*b.mult)-(a.base*a.mult))[0];
      if(candidate && (!best || candidate.base*candidate.mult>best.base*best.mult)) best={...candidate,sum};
    }
    return best;
  }

  function itemMultiplier(combo) {
    let m=1;
    if(has("seven")&&combo.tags.includes("seven")) m*=3;
    if(has("mirror")&&combo.tags.includes("same")) m*=2;
    if(has("calculator")&&combo.sum%2===1) m*=2;
    if(has("corner")&&combo.tags.includes("corner")) m*=2;
    if(has("abacus")&&combo.tags.includes("straight")) m*=2;
    if(has("odd")&&combo.tags.includes("odd")) m*=2;
    if(has("echo")&&combo.tags.includes("diagonal")) m*=2;
    if(has("debtRing")) m+=Math.floor(Math.max(0,state.target-state.bank)/500);
    return m;
  }

  function place(index) {
    if(state.locked || state.board[index]!==null) return;
    let value=state.next;
    if(state.boss?.id==="noSeven" && value===7) value=0;
    state.board[index]=value; state.turn++; beep(210+value*35,.06);
    const hits=[];
    LINES.forEach((line,lineIndex)=>{
      if(state.seenLines.has(lineIndex) || !line.every(i=>state.board[i]!==null)) return;
      const combo=classify(line.map(i=>state.board[i]),line);
      state.seenLines.add(lineIndex);
      if(combo) { hits.push({...combo,line}); line.forEach(i=>state.scoredCells.add(i)); }
    });
    if(hits.length) {
      let gained=0, peak=1;
      hits.forEach(c=>{ let m=c.mult*itemMultiplier(c); peak=Math.max(peak,m); gained+=c.base*m; });
      if(state.boss?.id==="twins") gained*=.7;
      if(has("blackCoin")&&state.risk>1) gained*=1.5;
      gained=Math.floor(gained*state.risk); state.pot+=gained; state.roundGain+=gained;
      record.combo=Math.max(record.combo,Math.floor(peak*state.risk));
      showMessage(`+${money(gained)} · ${hits.map(h=>h.name).join(" + ")}`); beep(660,.13,"sawtooth");
    }
    state.next=randTile(); render(hits);
    if(state.turn>=state.maxTurns || state.board.every(v=>v!==null)) endRound();
  }

  function endRound() {
    state.locked=true; const success=state.roundGain>0;
    if(!success) {
      if(has("insurance")&&!state.insuranceUsed&&state.risk>1){ state.insuranceUsed=true; cashOut(true); return; }
      openModal("판이 비었습니다", `<p>이번 판에서는 돈이 되는 조합을 만들지 못했습니다.</p><p class="danger">이어 걸었던 금액과 연승이 모두 사라집니다.</p>`, [
        ["다시 시작",()=>gameOver(),"primary"]
      ], "BUST"); return;
    }
    const projected=calculateCash();
    openModal("여기서 멈출까?", `<p>이번 판 수익 <b>${money(state.roundGain)}</b> · 연승 누적 <b>${money(state.pot)}</b></p><p>지금 챙기면 <b>${money(projected)}</b>을 보유금에 넣습니다.</p><p class="danger">한 판 더 가면 위험 배율이 오르지만, 실패 시 이번 연승 수익을 잃습니다.</p>`, [
      ["돈을 챙긴다",()=>cashOut(false),""], ["전부 다시 건다",()=>pushLuck(),"primary"]
    ], `연승 ${state.streak+1}`);
  }

  function calculateCash(){
    let amount=state.pot;
    if(has("doubleDown")) amount*=2;
    if(state.boss?.id==="tax") amount*=.8;
    return Math.floor(amount);
  }

  function pushLuck(){
    state.streak++; state.risk=Math.min(64, state.risk*2 + (has("greed")&&state.streak>=3?2:0));
    closeModal(); resetBoard(true);
  }

  function cashOut(insured=false){
    const earned=insured ? Math.floor(state.pot*.5) : calculateCash(); state.bank+=earned;
    record.best=Math.max(record.best,state.bank); state.risk=1; state.streak=0; state.pot=0; closeModal();
    if(state.bank>=state.target) winRoom(); else shop();
  }

  function winRoom(){
    if(state.stage===8 && !state.endless){
      record.wins++; saveRecord();
      openModal("빚을 모두 갚았습니다", `<p>문은 열렸습니다. 이제 정말 나갈 수 있습니다.</p><p>최종 보유금 <b>${money(state.bank)}</b></p>`, [
        ["나간다",()=>gameOver(true),""], ["한 판만 더",()=>{state.endless=true; advance();},"primary"]
      ], "정식 승리"); return;
    }
    shop(true);
  }

  function shop(won=false){
    const choices=[...ITEMS].filter(i=>!has(i.id)).sort(()=>Math.random()-.5).slice(0,3);
    if(!choices.length){ advance(); return; }
    const cards=choices.map(i=>`<button class="choice-card" data-item="${i.id}"><b>${i.name}</b><p>${i.text}</p><strong>${i.rarity} · ${money(i.price)}</strong></button>`).join("");
    openModal(won?"목표 달성!":"수상한 상점", `<p>${won?"다음 도박장으로 가기 전 장치를 고르세요.":"돈을 쓰지 않고 지나가도 됩니다."}</p><div class="choice-grid">${cards}</div>`, [["그냥 간다",()=>advance(),""]], won?"보상 선택":"막간");
    document.querySelectorAll("[data-item]").forEach(el=>el.addEventListener("click",()=>buyItem(el.dataset.item)));
  }

  function buyItem(id){
    const item=ITEMS.find(i=>i.id===id); if(!item) return;
    const free=state.bank>=state.target;
    if(!free && state.bank<item.price){ beep(90,.2); elFlash("돈이 부족합니다"); return; }
    if(state.items.length>=5){ elFlash("장치는 5개까지만 가질 수 있습니다"); return; }
    if(!free) state.bank-=item.price; state.items.push(item); beep(880,.12); advance();
  }

  function advance(){
    closeModal(); state.room++;
    if(state.room>3){ state.room=1; state.stage++; state.target=Math.floor(state.target*1.78/50)*50; }
    else state.target=Math.floor(state.target*1.22/50)*50;
    if(has("doubleDown")) state.target=Math.floor(state.target*1.25/50)*50;
    state.boss = state.room===3 ? BOSSES[(state.stage-1)%BOSSES.length] : null;
    record.stage=Math.max(record.stage,state.stage); saveRecord(); resetBoard();
  }

  function gameOver(won=false){
    saveRecord(); closeModal(); $("gameScreen").classList.add("hidden"); $("titleScreen").classList.remove("hidden"); updateTitleRecords();
    if(!won) setTimeout(()=>openModal("런 종료", `<p>도박장 ${state.stage}-${state.room}에서 멈췄습니다.</p><p>최고 보유금 <b>${money(record.best)}</b></p>`, [["한 판만 더",()=>startGame(),"primary"],["메인으로",()=>closeModal(),""]], "GAME OVER"),100);
  }

  function reroll(){
    if(!has("pocket")||state.rerollUsed||state.locked) return;
    const old=state.next; do{state.next=randTile();}while(state.next===old); state.rerollUsed=true; beep(520,.08); render();
  }

  function render(hits=[]){
    $("stageLabel").textContent=`${state.stage}-${state.room}${state.endless?" ∞":""}`; $("targetLabel").textContent=money(state.target);
    $("bankLabel").textContent=money(state.bank); $("potLabel").textContent=money(state.pot); $("riskLabel").textContent=`×${state.risk}`;
    $("nextTile").textContent=state.next; $("turnLabel").textContent=`${state.turn} / ${state.maxTurns}`;
    $("bossBanner").classList.toggle("hidden",!state.boss); $("bossBanner").textContent=state.boss?`보스 규칙 · ${state.boss.name}: ${state.boss.text}`:"";
    $("hint").textContent=has("pocket")&&!state.rerollUsed?"숫자 타일을 누르면 한 번 다시 뽑을 수 있습니다":"빈칸을 눌러 숫자를 놓으세요";
    $("nextTile").onclick=reroll; $("nextTile").style.cursor=has("pocket")&&!state.rerollUsed?"pointer":"default";
    $("board").innerHTML=state.board.map((v,i)=>`<button class="cell ${v!==null?"filled":""} ${state.scoredCells.has(i)?"scored":""}" data-cell="${i}" role="gridcell" aria-label="${v===null?`빈칸 ${i+1}`:`숫자 ${v}`}">${v===null?"":v}</button>`).join("");
    document.querySelectorAll("[data-cell]").forEach(el=>el.addEventListener("click",()=>place(Number(el.dataset.cell))));
    const allCombos=[]; LINES.forEach((line,li)=>{ if(state.seenLines.has(li)&&line.every(i=>state.board[i]!==null)){const c=classify(line.map(i=>state.board[i]),line);if(c)allCombos.push(c);} });
    $("comboLog").innerHTML=allCombos.length?allCombos.map(c=>`<span class="combo-pill">${c.name} ×${c.mult*itemMultiplier(c)}</span>`).join(""):'<span class="muted">아직 조합이 없습니다</span>';
    $("comboTotal").textContent=`위험 ×${state.risk}`; $("itemCount").textContent=`${state.items.length} / 5`;
    $("itemRack").innerHTML=state.items.length?state.items.map(i=>`<div class="item-card"><b>${i.name}</b><small>${i.text}</small></div>`).join(""):'<div class="empty-rack">빈 장치 슬롯</div>';
  }

  function showMessage(text){ $("message").textContent=text; clearTimeout(showMessage.t); showMessage.t=setTimeout(()=>$("message").textContent="",2600); }
  function elFlash(text){ const old=$("modalKicker").textContent; $("modalKicker").textContent=text; setTimeout(()=>$("modalKicker").textContent=old,1200); }
  function openModal(title,body,actions,kicker=""){
    $("modalTitle").textContent=title; $("modalBody").innerHTML=body; $("modalKicker").textContent=kicker;
    $("modalActions").innerHTML=""; actions.forEach(([label,fn,cls])=>{const b=document.createElement("button");b.textContent=label;b.className=cls;b.onclick=fn;$("modalActions").appendChild(b);});
    $("modal").classList.remove("hidden");
  }
  function closeModal(){ $("modal").classList.add("hidden"); }
  function showHow(){ openModal("30초 게임 방법", `<ol class="rules-list"><li>나오는 숫자를 4×4 판의 빈칸에 놓습니다.</li><li>가로·세로·대각선 네 칸으로 <b>같은 수, 연속수, 합계 21</b> 등의 조합을 만듭니다.</li><li>한 판이 끝나면 돈을 챙기거나 전부 걸고 위험 배율을 올립니다.</li><li>목표 금액을 넘겨 도박장을 통과하고, 장치들의 효과를 엮어 규칙을 망가뜨리세요.</li><li>8번째 도박장을 깨면 나갈 수도, 무한히 계속할 수도 있습니다.</li></ol>`, [["알겠어",()=>closeModal(),"primary"]], "HOW TO PLAY"); }

  $("startBtn").addEventListener("click",startGame); $("howBtn").addEventListener("click",showHow);
  $("menuBtn").addEventListener("click",()=>openModal("정말 포기할까요?","<p>현재 런의 진행 상황은 사라집니다.</p>",[["계속한다",closeModal,""],["포기한다",()=>gameOver(),"primary"]],"주의"));
  $("soundBtn").addEventListener("click",()=>{state.sound=!state.sound;$("soundBtn").classList.toggle("on",state.sound);$("soundBtn").setAttribute("aria-label",state.sound?"효과음 끄기":"효과음 켜기");beep(660,.1);});
  updateTitleRecords();
  if("serviceWorker" in navigator) window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
})();
