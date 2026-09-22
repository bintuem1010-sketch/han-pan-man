const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const source=readFileSync(__dirname+'/game.js','utf8');
function boot(saved,withEvents=false){
 const elements=new Map(),storage=new Map(saved?[['hanpan-life-v5',JSON.stringify(saved)]]:[]);
 function el(){return{children:[],dataset:{},classList:{toggle(){},add(){},remove(){}},replaceChildren(){this.children=[]},appendChild(x){this.children.push(x)},querySelector(){return el()},textContent:'',innerHTML:''}}
 const document={getElementById(id){if(!elements.has(id))elements.set(id,el());return elements.get(id)},querySelectorAll(){return[]},createElement:el};
 const math=Object.create(Math);math.random=()=>.1;
 const context=vm.createContext({document,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},navigator:{},window:{},Math:math,mathRandom:v=>math.random=()=>v});
 vm.runInContext(source.replace(/\}\)\(\);\s*$/,`globalThis.test={state:()=>s,set:x=>s=x,fresh,rawStart:startNight,startNight:()=>{startNight();if(s.night?.phase==='starter'){selectDevice('roseLuck');s.night.devices=[]}},selectDevice,deal,evaluate,resolveChoice,advanceHand,endNight,borrow,pay,buy,sell,confirmHome,checkBankruptcy,reset,baseBet,bet,assets,credit,wealth,GOODS,HOMES,save,handValue,handLimit,handIndex,target,symbolWeights,bossFor,toggleLock,buyDevice,sellDevice,refreshStock,nextTable,openNightShop,devicePrice,renderNightShop,checkLifeGoals,DEVICES,BOSSES,eventCatalog,queueLifeEvent,resolveLifeEvent,finishLifeEvent,showLifeEvent,upkeep,businessMultiplier,expireEffects,openDay,random:v=>mathRandom(v)};})();`),context);
 if(!withEvents)context.test.state().nextEventDay=999999;
 return{...context.test,storage,click(label){const b=elements.get('modalActions').children.find(b=>b.textContent===label);assert.ok(b,'missing button '+label);b.onclick()},elements};
}
let tests=0;function test(name,fn){fn();console.log('PASS '+name);tests++}
test('75 products, 6 homes; first capital only once',()=>{const t=boot();assert.equal(t.GOODS.length,75);assert.equal(t.HOMES.length,6);t.startNight();t.endNight();assert.equal(t.state().money,1200);assert.equal(t.state().day,1)});
test('real stakes, one payout only, result survives refresh',()=>{const t=boot();t.startNight();t.deal();assert.equal(t.state().money,1100);t.evaluate();assert.equal(t.state().night.pot,300);t.evaluate();assert.equal(t.state().night.pot,300);const resumed=boot(JSON.parse(t.storage.get('hanpan-life-v5')));assert.equal(resumed.state().night.phase,'choice');resumed.resolveChoice(false);assert.equal(resumed.state().money,1400);resumed.resolveChoice(false);assert.equal(resumed.state().money,1400)});
test('checkpoint and device selection remain visible',()=>{const t=boot();t.startNight();for(let i=0;i<3;i++){t.deal();t.evaluate();t.resolveChoice(false)}assert.equal(t.state().night.phase,'checkpoint');t.click('밤 상점으로');assert.equal(t.state().night.phase,'shop');assert.equal(t.state().night.offers.length,3);t.nextTable();assert.equal(t.state().night.table,2);assert.equal(t.bet(),140)});
test('reroll limits and locked cards',()=>{const t=boot();t.startNight();t.deal();t.deal(true);const m=t.state().money;t.deal(true);assert.equal(t.state().money,m);t.state().night.cards=['coin','rose','skull'];t.evaluate();assert.equal(t.state().night.phase,'result');t.advanceHand();assert.equal(t.state().night.phase,'ready')});
test('compound interest, original maturity, partial repayment',()=>{const t=boot();t.borrow(500);t.click('빌린다');assert.equal(t.state().money,1700);assert.equal(t.state().due,6);t.startNight();t.deal();t.endNight();assert.equal(t.state().debt,540);assert.equal(t.state().day,2);t.borrow(200);t.click('빌린다');assert.equal(t.state().due,6);assert.equal(t.state().debt,740);t.pay('200');assert.equal(t.state().debt,540);t.pay('all');assert.equal(t.state().debt,0);assert.equal(t.state().due,0)});
test('buy and resale never create money',()=>{const t=boot();t.buy('radio');assert.equal(t.state().money,1020);t.sell('radio');t.click('판매한다');assert.equal(t.state().money,1128);assert.equal(t.state().owned.length,0);t.sell('radio');assert.equal(t.state().money,1128)});
test('house upgrade/downgrade charges spread and changes costs',()=>{const t=boot();t.state().money=10000;t.confirmHome(2);t.click('이사한다');assert.equal(t.state().money,3500);assert.equal(t.state().home,2);t.confirmHome(0);t.click('이사한다');assert.equal(t.state().money,8700);assert.equal(t.state().home,0)});
test('business loss and no empty-night farming, settlement idempotent',()=>{const t=boot();t.state().owned=['stall'];t.startNight();t.endNight();assert.equal(t.state().money,1200);t.startNight();t.deal();t.endNight();assert.equal(t.state().money,955);t.endNight();assert.equal(t.state().money,955)});
test('overdue debt blocks entry; assets allow rescue',()=>{const t=boot();Object.assign(t.state(),{money:0,debt:500,due:1,owned:['watch']});assert.equal(t.checkBankruptcy(),false);t.startNight();assert.equal(t.state().night,null);t.sell('watch');t.click('판매한다');t.pay('all');assert.equal(t.state().money,580);t.startNight();assert.ok(t.state().night)});
test('bankruptcy and new life preserve historical record',()=>{const t=boot();Object.assign(t.state(),{money:0,debt:900,due:1});assert.equal(t.checkBankruptcy(),true);t.reset('hell');assert.equal(t.state().money,900);assert.equal(t.state().debt,0);assert.equal(t.state().history[0].reason,'파산');assert.equal(t.state().status,'alive')});
test('unpaid living expenses carried as bills and prohibit shopping',()=>{const t=boot();t.state().money=100;t.startNight();t.deal();t.endNight();assert.equal(t.state().bills,85);const before=t.state().owned.length;t.buy('radio');assert.equal(t.state().owned.length,before)});
test('abandoning unresolved risk cannot keep previous winnings',()=>{const t=boot();t.startNight();t.deal();t.state().night.cards=['coin','coin','rose'];t.evaluate();t.resolveChoice(true);assert.equal(t.state().night.pot,60);t.deal();t.endNight();assert.equal(t.state().money,915)});
test('last credit remainder is borrowable',()=>{const t=boot();Object.assign(t.state(),{money:0,debt:700,due:6});assert.equal(t.credit(),100);assert.equal(t.checkBankruptcy(),false);t.borrow(100);t.click('빌린다');assert.equal(t.state().money,100);assert.equal(t.state().debt,800)});
test('stale HTML recovers before reading or mutating saved money',()=>{let redirected='';vm.runInNewContext(source,{document:{getElementById:()=>null},URL,location:{href:'https://example.com/han-pan-man/',replace:url=>redirected=url},localStorage:{getItem(){throw Error('save must remain untouched')}}});assert.equal(redirected,'https://example.com/han-pan-man/index.html?v=7')});
test('insufficient stake has actionable message and does not charge',()=>{const t=boot();t.startNight();t.state().money=50;t.deal();assert.equal(t.state().money,50);assert.equal(t.state().night.phase,'ready');assert.equal(t.elements.get('modalTitle').textContent,'판돈이 부족해요');t.click('귀가하기');assert.equal(t.elements.get('modalTitle').textContent,'오늘 밤을 마칠까요?')});
test('first device selection is saved and cannot be repeated or cashed out',()=>{const t=boot();t.rawStart();assert.equal(t.state().night.phase,'starter');t.selectDevice('pairEngine');t.selectDevice('skullLuck');assert.equal(t.state().night.devices.length,1);assert.equal(t.state().night.paid.pairEngine,0);t.endNight();assert.equal(t.state().money,1200);assert.equal(t.state().day,1)});
test('targets rise relative to payouts and late tables have fewer hands',()=>{const t=boot();t.startNight();const ratios=[];for(let table=1;table<=6;table++){t.state().night.table=table;ratios.push(t.target()/t.bet())}assert.ok(ratios[5]>ratios[0]*5);assert.equal(t.handLimit(),3);t.state().night.table=1;assert.equal(t.handLimit(),4)});
test('rose growth stacks and preview does not grant growth',()=>{const t=boot();t.startNight();const n=t.state().night;n.devices=['roseLuck','roseBloom','roseVow'];const cards=['rose','rose','coin'];const one=t.handValue(n,cards,100),again=t.handValue(n,cards,100);assert.equal(one.win,218);assert.equal(again.win,218);assert.equal(n.growth.roseWins,undefined);n.growth=one.growth;const two=t.handValue(n,cards,100);assert.equal(two.win,275);assert.ok(two.win>one.win);assert.equal(t.symbolWeights(n).rose,58)});
test('pair and skull builds reward their intended hands',()=>{const t=boot();t.startNight();const n=t.state().night;n.devices=['pairEngine','pairLadder','lastShot'];n.roundHands=2;n.table=6;n.pairChain=2;n.bosses={};assert.equal(t.handValue(n,['coin','coin','rose'],100).win,660);n.devices=['skullLuck','skullCharm','tripleLens'];assert.equal(t.handValue(n,['skull','skull','skull'],100).win,2700);assert.equal(t.symbolWeights(n).skull,38)});
test('each boss changes only the advertised rule',()=>{const t=boot();t.startNight();const n=t.state().night;n.table=3;n.bosses={3:'obsession'};n.lastSymbol='coin';assert.equal(t.handValue(n,['coin','coin','rose'],100).win,30);assert.equal(t.handValue(n,['rose','rose','coin'],100).win,90);n.bosses[3]='tax';assert.equal(t.handValue(n,['coin','coin','rose'],100).win,20);assert.equal(t.handValue(n,['coin','coin','coin'],100).win,300);n.bosses[3]='seal';n.phase='dealt';n.cards=['coin','coin','rose'];t.toggleLock(0);t.toggleLock(1);assert.equal(n.locked.filter(Boolean).length,1);t.toggleLock(0);t.toggleLock(1);assert.equal(n.locked[1],true)});
test('night shop enforces slots, fixed purchase price and resale loss',()=>{const t=boot();t.startNight();const n=t.state().night;n.phase='shop';n.offers=['roseBloom','roseVow','skullCharm','coinBank'];t.buyDevice('roseBloom');t.buyDevice('roseVow');t.buyDevice('skullCharm');const balance=t.state().money;t.buyDevice('coinBank');assert.equal(n.devices.length,3);assert.equal(t.state().money,balance);t.sellDevice('roseBloom');t.click('판매한다');assert.equal(t.state().money,balance+110);t.buyDevice('coinBank');assert.equal(n.devices.length,3);assert.equal(t.state().money,balance+110-180)});
test('shop refresh costs rise and reload preserves stock and purchases',()=>{const t=boot();t.startNight();const n=t.state().night;n.phase='shop';n.offers=['roseBloom'];t.buyDevice('roseBloom');t.refreshStock();t.refreshStock();assert.equal(t.state().money,1200-220-25-50);const restored=boot(JSON.parse(t.storage.get('hanpan-life-v5')));assert.deepEqual(Array.from(restored.state().night.offers),Array.from(n.offers));assert.equal(restored.state().night.shopRolls,2);assert.equal(restored.state().night.paid.roseBloom,220)});
test('old active night retains original target, hands and money',()=>{const old=boot();const state=old.state();state.money=432;state.night={table:2,hands:3,tableScore:0,start:500,pot:20,risk:1,streak:0,cards:[null,null,null],locked:[false,false,false],rerolls:0,devices:['roseLuck'],insured:false,phase:'ready',offers:[],result:''};const t=boot(state);assert.equal(t.state().money,432);assert.equal(t.state().night.pot,20);assert.equal(t.state().night.rules,5);assert.equal(t.handLimit(),3);assert.equal(t.target(),t.bet()*4);assert.equal(t.symbolWeights().rose,48);t.deal();assert.equal(t.state().money,262)});
test('life scenes and goals are recorded once',()=>{const t=boot();t.state().money=10000;t.buy('stall');assert.ok(t.state().milestones.includes('first-employee'));t.buy('radio');t.buy('plant');t.buy('lamp');assert.ok(t.state().milestones.includes('goal-collector'));const events=t.state().events.length;t.checkLifeGoals();assert.equal(t.state().events.length,events);t.confirmHome(1);t.click('이사한다');t.confirmHome(0);t.click('이사한다');assert.ok(t.state().milestones.includes('smaller-home'))});
test('six-table run completes through shops and both bosses without duplicate settlement',()=>{const t=boot();t.state().money=50000;t.startNight();const n=t.state().night;n.devices=['skullCharm','tripleLens'];for(let table=1;table<=6;table++){while(n.phase==='ready'){t.deal();n.cards=['skull','skull','skull'];t.evaluate();t.resolveChoice(false)}assert.equal(n.phase,'checkpoint');assert.ok(n.tableScore>=t.target());if(table<6){t.openNightShop();t.nextTable()}}assert.ok(t.state().milestones.includes('clear-six'));assert.equal(n.cleared.length,6);t.click('정산하고 귀가');assert.equal(t.state().night,null);const balance=t.state().money;t.endNight();assert.equal(t.state().money,balance)});
test('catalog has 75 unique goods and 18 context-aware events',()=>{
 const t=boot();assert.equal(new Set(t.GOODS.map(g=>g.id)).size,75);
 assert.equal(t.GOODS.filter(g=>g.tab==='business').length,16);
 assert.equal(t.GOODS.filter(g=>g.tab==='luxury').length,38);
 const early=t.eventCatalog();assert.equal(early.length,8);assert.ok(early.every(e=>!['사업','소장품'].includes(e.group)));
 t.state().owned=t.GOODS.filter(g=>g.sellable).map(g=>g.id);t.state().home=3;
 const catalog=t.eventCatalog();assert.equal(catalog.length,18);
 for(const e of catalog){assert.equal(e.choices.length,3);assert.ok(e.choices.some(c=>c.cost===0));for(const c of e.choices){assert.equal(c.outcomes.reduce((v,o)=>v+o.chance,0),100);assert.ok(c.cost>=0);for(const o of c.outcomes)assert.ok(Number.isInteger(o.cash))}}
});
test('every event outcome applies exactly the shown net cash and asset effects',()=>{
 const seed=boot();seed.state().money=1000000;seed.state().home=3;seed.state().owned=seed.GOODS.filter(g=>g.sellable).map(g=>g.id);
 for(const e of seed.eventCatalog())for(let index=0;index<e.choices.length;index++){
  const c=e.choices[index];let low=0;
  for(const outcome of c.outcomes){
   const t=boot(JSON.parse(JSON.stringify(seed.state()))),s=t.state(),before=s.money;
   s.lifeEvent=JSON.parse(JSON.stringify({...e,phase:'choice',day:1,roll:(low+outcome.chance/2)/100}));
   t.resolveLifeEvent(index);assert.equal(s.money,before-c.cost+outcome.cash,e.id+' cash');assert.equal(s.bills,0);
   assert.equal(s.eventHistory.length,1);assert.equal(s.lifeEvent.phase,'result');assert.equal(s.good,outcome.good||0);assert.equal(s.memories,outcome.memories||0);
   if(outcome.remove)assert.ok(!s.owned.includes(outcome.remove),e.id+' removal');
   assert.equal(s.effects.length,(outcome.effects||[]).length);
   t.resolveLifeEvent(index);assert.equal(s.money,before-c.cost+outcome.cash,'duplicate blocked');assert.equal(s.eventHistory.length,1);
   low+=outcome.chance;
  }
 }
});
test('first played morning queues an event; empty nights and pending choices cannot farm',()=>{
 const t=boot(undefined,true);t.rawStart();t.selectDevice('pairEngine');t.endNight();assert.equal(t.state().lifeEvent,null);
 t.rawStart();t.selectDevice('pairEngine');t.deal();t.endNight();const s=t.state();
 assert.equal(s.day,2);assert.equal(s.lifeEvent.phase,'choice');assert.ok(s.nextEventDay>=4&&s.nextEventDay<=5);
 const money=s.money,event=s.lifeEvent;t.buy('radio');t.borrow(200);t.confirmHome(1);t.rawStart();
 assert.equal(s.money,money);assert.equal(s.night,null);assert.equal(s.lifeEvent,event);assert.equal(t.queueLifeEvent(),false);
 t.resolveLifeEvent(2);t.finishLifeEvent();assert.equal(s.lifeEvent,null);assert.equal(t.queueLifeEvent(),false);
});
test('pending offer, result and random roll survive refresh without rerolling or repaying',()=>{
 const t=boot(undefined,true);t.state().money=10000;t.state().day=2;t.queueLifeEvent();const original=JSON.stringify(t.state().lifeEvent);
 const restored=boot(JSON.parse(t.storage.get('hanpan-life-v5')),true);restored.random(.99);assert.equal(JSON.stringify(restored.state().lifeEvent),original);
 restored.resolveLifeEvent(1);const money=restored.state().money,bills=restored.state().bills;
 const result=boot(JSON.parse(restored.storage.get('hanpan-life-v5')),true);assert.equal(result.state().lifeEvent.phase,'result');
 result.resolveLifeEvent(1);assert.equal(result.state().money,money);assert.equal(result.state().bills,bills);assert.equal(result.state().eventHistory.length,1);
 result.finishLifeEvent();result.finishLifeEvent();assert.equal(result.state().lifeEvent,null);
});
test('large failed investment leaves bills and can end the life after result acknowledgement',()=>{
 const t=boot(),s=t.state();s.money=900;const e=t.eventCatalog().find(e=>e.id==='startup');s.lifeEvent={...e,day:1,phase:'choice',roll:.99};
 t.resolveLifeEvent(1);assert.equal(s.money,0);assert.equal(s.bills,900);assert.equal(s.status,'alive');
 assert.equal(t.checkBankruptcy(),false);t.finishLifeEvent();assert.equal(s.status,'bankrupt');
 t.reset('hard');t.buy('radio');assert.ok(t.state().owned.includes('radio'));assert.deepEqual(Array.from(t.state().effects),[]);assert.equal(t.state().eventHistory.length,0);
});
test('unaffordable or restricted choices do not charge and a free choice remains possible',()=>{
 const t=boot(),s=t.state();const e=t.eventCatalog().find(e=>e.id==='startup');s.lifeEvent={...e,day:1,phase:'choice',roll:.1};s.money=20;
 t.resolveLifeEvent(1);assert.equal(s.money,20);assert.equal(s.lifeEvent.phase,'choice');
 s.money=10000;s.bills=1;t.resolveLifeEvent(0);assert.equal(s.money,10000);assert.equal(s.lifeEvent.phase,'choice');
 t.resolveLifeEvent(2);assert.equal(s.lifeEvent.phase,'result');assert.equal(s.money,10000);
});
test('effects change real settlements, expire on played nights, and retain operating costs',()=>{
 const t=boot(),s=t.state();s.money=10000;s.owned=['stall'];t.random(.5);
 s.effects=[{title:'boom',kind:'revenue',target:'stall',amount:2,remaining:2},{title:'repair',kind:'upkeep',target:0,amount:40,remaining:1}];
 assert.equal(t.upkeep(),125);t.startNight();t.deal();t.endNight();assert.equal(s.money,9935);assert.equal(s.effects.length,1);assert.equal(s.effects[0].remaining,1);assert.equal(t.upkeep(),85);
 t.startNight();t.endNight();assert.equal(s.effects[0].remaining,1);
 s.effects[0].amount=0;const before=s.money,stake=t.baseBet();t.startNight();t.deal();t.endNight();assert.equal(s.money,before-stake-60-85);assert.equal(s.effects.length,0);
});
test('asset effects end on sale or moving and cannot be revived by rebuying',()=>{
 const t=boot(),s=t.state();s.money=30000;s.owned=['stall'];s.home=1;s.effects=[{kind:'revenue',target:'stall',amount:2,remaining:3},{kind:'upkeep',target:1,amount:50,remaining:3}];
 t.sell('stall');t.click('판매한다');assert.equal(s.effects.length,1);t.buy('stall');assert.equal(t.businessMultiplier('stall'),1);
 t.confirmHome(0);t.click('이사한다');assert.equal(s.effects.length,0);t.confirmHome(1);t.click('이사한다');assert.equal(t.upkeep(),130);
});
test('v6 savings and an active night migrate without losing wealth',()=>{
 const state=boot().state();Object.assign(state,{money:9876,home:2,owned:['watch','cafe'],debt:500,due:6});for(const key of ['lifeEvent','eventHistory','eventRecent','effects','nextEventDay'])delete state[key];
 const t=boot(state,true);assert.equal(t.state().money,9876);assert.equal(t.state().debt,500);assert.equal(t.state().home,2);assert.equal(t.state().nextEventDay,2);assert.equal(t.state().effects.length,0);
 t.rawStart();assert.equal(t.state().night.rules,6);assert.equal(t.state().night.phase,'starter');
});
test('recent events and the previous category rotate when alternatives are available',()=>{
 const t=boot(undefined,true),s=t.state();s.day=2;s.owned=['stall','radio'];t.queueLifeEvent();const first=s.lifeEvent;
 t.resolveLifeEvent(2);t.finishLifeEvent();s.day=s.nextEventDay;t.queueLifeEvent();assert.notEqual(s.lifeEvent.id,first.id);assert.notEqual(s.lifeEvent.group,first.group);
});
console.log(`${tests} economic and state regression tests passed`);
