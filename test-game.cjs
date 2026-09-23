const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const source=readFileSync(__dirname+'/game.js','utf8');
function boot(saved,withEvents=false,rulesVersion=9){
 const elements=new Map(),storage=new Map(saved?[['hanpan-life-v5',JSON.stringify(saved)]]:[]);
 function el(){return{children:[],dataset:{},classList:{toggle(){},add(){},remove(){}},replaceChildren(){this.children=[]},appendChild(x){this.children.push(x)},querySelector(){return el()},textContent:'',innerHTML:''}}
 const document={getElementById(id){if(!elements.has(id))elements.set(id,el());return elements.get(id)},querySelectorAll(){return[]},createElement:el};
 const math=Object.create(Math);math.random=()=>.1;
 const context=vm.createContext({document,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},navigator:{},window:{},Math:math,mathRandom:v=>math.random=()=>v});
 vm.runInContext(source.replace(/\}\)\(\);\s*$/,`const versionedBegin=(...args)=>{const existed=!!s.night;beginNight(...args);if(!existed&&s.night)s.night.rules=${rulesVersion}};globalThis.test={state:()=>s,set:x=>s=x,fresh,STOCKS,MARKET_NEWS,tickMarket,stockValue,stockQuote,executeStock,newMarket,worldBusinessMultiplier,specializeBusiness,businessStyle,quietDay,forecastCosts,startProject,advanceProject,completeReward,chooseRoute,selectRoute,mayRisk,bookLoanInterest,restoreCheckpoint,backupCode,validBackup,checksum,finishSettlement,mortgageRisk,handScore,scored,chooseGoal,updateGoal,luxLevel,upgradeLuxury,luxuryAction,finishLuxury,reserveOffer,rerollCost,refreshPrice,resale,LUXURY,beginBaccarat,baccaratBet,dealBaccarat,nextBaccarat,baccaratHand,baccaratShoe,baccaratTotal,bankerDraw,baccaratPayout,rawStart:versionedBegin,lobby:startNight,startNight:()=>{versionedBegin();if(s.night?.phase==='starter'){selectDevice('roseLuck');s.night.devices=[];if(s.night.preShop)nextTable()}},selectDevice,beginNight:versionedBegin,changeStake,room,tableBase,active,expireItems,useItem,itemSale,repairPrice,repairItem,rerollLimit,takeLoan,payLoan,settleLoans,foreclose,liquidateLoan,loanOffers,totalDebt,pledged,lockedAssets,businessLevel,businessStats,businessCapital,upgradeBusiness,retire,retirementOptions,deal,evaluate,resolveChoice,advanceHand,endNight,borrow,pay,buy,sell,confirmHome,checkBankruptcy,reset,baseBet,bet,assets,credit,wealth,GOODS,HOMES,save,handValue,handLimit,handIndex,target,symbolWeights,bossFor,toggleLock,buyDevice,sellDevice,refreshStock,nextTable,openNightShop,devicePrice,renderNightShop,checkLifeGoals,DEVICES,BOSSES,eventCatalog,queueLifeEvent,resolveLifeEvent,finishLifeEvent,showLifeEvent,upkeep,businessMultiplier,expireEffects,openDay,random:v=>mathRandom(v)};})();`),context);
 if(!withEvents)context.test.state().nextEventDay=999999;
 return{...context.test,storage,click(label){const b=elements.get('modalActions').children.find(b=>b.textContent===label);assert.ok(b,'missing button '+label);b.onclick()},elements};
}
let tests=0;function test(name,fn){fn();console.log('PASS '+name);tests++}
test('75 products, 6 homes; first capital only once',()=>{const t=boot();assert.equal(t.GOODS.length,75);assert.equal(t.HOMES.length,6);t.startNight();t.endNight();assert.equal(t.state().money,1200);assert.equal(t.state().day,1)});
test('real stakes, one payout only, result survives refresh',()=>{const t=boot();t.startNight();t.deal();assert.equal(t.state().money,1100);t.evaluate();assert.equal(t.state().night.pot,300);t.evaluate();assert.equal(t.state().night.pot,300);const resumed=boot(JSON.parse(t.storage.get('hanpan-life-v5')));assert.equal(resumed.state().night.phase,'choice');resumed.resolveChoice(false);assert.equal(resumed.state().money,1400);resumed.resolveChoice(false);assert.equal(resumed.state().money,1400)});
test('checkpoint and device selection remain visible',()=>{const t=boot();t.startNight();for(let i=0;i<3;i++){t.deal();t.evaluate();t.resolveChoice(false)}assert.equal(t.state().night.phase,'checkpoint');t.click('밤 상점으로');assert.equal(t.state().night.phase,'shop');assert.equal(t.state().night.offers.length,6);t.nextTable();assert.equal(t.state().night.table,2);assert.equal(t.bet(),140)});
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
test('stale HTML recovers before reading or mutating saved money',()=>{let redirected='';vm.runInNewContext(source,{document:{getElementById:()=>null},URL,location:{href:'https://example.com/han-pan-man/',replace:url=>redirected=url},localStorage:{getItem(){throw Error('save must remain untouched')}}});assert.equal(redirected,'https://example.com/han-pan-man/index.html?v=10')});
test('insufficient stake has actionable message and does not charge',()=>{const t=boot();t.startNight();t.state().money=50;t.deal();assert.equal(t.state().money,50);assert.equal(t.state().night.phase,'ready');assert.equal(t.elements.get('modalTitle').textContent,'판돈이 부족해요');t.click('귀가하기');assert.equal(t.elements.get('modalTitle').textContent,'오늘 밤을 마칠까요?')});
test('first device selection is saved and cannot be repeated or cashed out',()=>{const t=boot();t.rawStart();assert.equal(t.state().night.phase,'starter');t.selectDevice('pairEngine');t.selectDevice('skullLuck');assert.equal(t.state().night.devices.length,1);assert.equal(t.state().night.paid.pairEngine,0);t.endNight();assert.equal(t.state().money,1200);assert.equal(t.state().day,1)});
test('targets rise relative to payouts and late tables have fewer hands',()=>{const t=boot();t.startNight();const ratios=[];for(let table=1;table<=6;table++){t.state().night.table=table;ratios.push(t.target())}assert.ok(ratios[5]>ratios[0]*5);assert.equal(t.handLimit(),3);t.state().night.table=1;assert.equal(t.handLimit(),4)});
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
 const seed=boot();seed.state().money=1000000;seed.state().home=3;seed.state().owned=seed.GOODS.filter(g=>g.sellable).map(g=>g.id);seed.checkLifeGoals();seed.state().memories=0;
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
 t.rawStart();t.selectDevice('pairEngine');t.nextTable();t.deal();t.endNight();const s=t.state();
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
 t.rawStart();assert.equal(t.state().night.rules,9);assert.equal(t.state().night.phase,'starter');
});
test('recent events and the previous category rotate when alternatives are available',()=>{
 const t=boot(undefined,true),s=t.state();s.day=2;s.owned=['stall','radio'];t.queueLifeEvent();const first=s.lifeEvent;
 t.resolveLifeEvent(2);t.finishLifeEvent();s.day=s.nextEventDay;t.queueLifeEvent();assert.notEqual(s.lifeEvent.id,first.id);assert.notEqual(s.lifeEvent.group,first.group);
});
test('45 distinct night items, six offers, two bag slots and a preparation shop',()=>{
 const t=boot();assert.equal(t.DEVICES.length,45);assert.equal(new Set(t.DEVICES.map(d=>d.id)).size,45);assert.equal(t.DEVICES.filter(d=>d.kind==='consumable').length,8);
 t.rawStart();t.selectDevice('pairEngine');const n=t.state().night;assert.equal(n.phase,'shop');assert.equal(n.preShop,true);assert.equal(n.offers.length,6);assert.ok(n.offers.some(id=>t.DEVICES.find(d=>d.id===id).kind==='timed'));assert.ok(n.offers.some(id=>t.DEVICES.find(d=>d.id===id).kind==='durable'));
 n.offers=['rosePaint','skullPaint','coinPaint'];t.buyDevice('rosePaint');t.buyDevice('skullPaint');const money=t.state().money;t.buyDevice('coinPaint');assert.equal(n.bag.length,2);assert.equal(t.state().money,money);assert.equal(n.devices.length,1);
 t.nextTable();assert.equal(n.table,1);assert.equal(n.phase,'ready');
});
test('stake is fixed after deal; targets do not shrink when changing stake',()=>{
 const t=boot();t.state().money=100000;t.startNight();const target=t.target();t.changeStake(5);assert.equal(t.bet(),500);assert.equal(t.target(),target);
 t.deal();assert.equal(t.state().money,99500);t.changeStake(1);assert.equal(t.bet(),500);t.deal(true);assert.equal(t.state().money,99375);
 const loaded=boot(JSON.parse(t.storage.get('hanpan-life-v5')));assert.equal(loaded.bet(),500);loaded.state().night.cards=['skull','skull','skull'];loaded.evaluate();assert.equal(loaded.state().night.pot,5000);
});
test('VIP and secret rooms scale stakes, goals and triple payouts with identical odds',()=>{
 const t=boot();t.state().money=100000;t.beginNight('vip');t.selectDevice('pairEngine');t.state().night.devices=[];t.nextTable();assert.equal(t.bet(),500);assert.equal(t.target(),600);assert.equal(t.handValue(t.state().night,['coin','coin','coin'],500).win,2250);
 const weights=JSON.stringify(t.symbolWeights());t.endNight();t.beginNight('secret');t.selectDevice('pairEngine');t.state().night.devices=[];t.nextTable();assert.equal(t.bet(),2000);assert.equal(t.target(),750);assert.equal(JSON.stringify(t.symbolWeights()),weights);
 assert.equal(t.handValue(t.state().night,['skull','skull','skull'],2000).win,40000);t.changeStake(20);assert.equal(t.bet(),40000);
});
test('timed items decay only once per resolved hand and vanish at zero',()=>{
 const t=boot();t.startNight();const n=t.state().night;n.devices=['roseIncense','fever'];n.itemLife={roseIncense:1,fever:2};n.paid={roseIncense:80,fever:100};
 assert.equal(t.symbolWeights().rose,74);t.deal();t.deal(true);assert.equal(n.itemLife.roseIncense,1);n.cards=['rose','rose','coin'];
 const a=t.handValue(n,n.cards,t.bet()),b=t.handValue(n,n.cards,t.bet());assert.equal(a.win,b.win);assert.equal(n.itemLife.fever,2);t.evaluate();assert.ok(!n.devices.includes('roseIncense'));assert.equal(n.itemLife.fever,1);t.evaluate();assert.equal(n.itemLife.fever,1);assert.equal(t.symbolWeights().rose,34);
});
test('durable items consume only on their triggers, break, and repair at rising prices',()=>{
 const t=boot();t.state().money=10000;t.startNight();const n=t.state().night;n.devices=['crackedMirror','tripleGlass'];n.itemLife={crackedMirror:1,tripleGlass:3};n.paid={crackedMirror:240,tripleGlass:250};
 t.deal();n.cards=['coin','coin','rose'];assert.equal(t.handValue(n,n.cards,100).win,300);t.evaluate();assert.equal(n.itemLife.crackedMirror,0);assert.equal(n.itemLife.tripleGlass,3);assert.equal(t.active('crackedMirror'),false);
 assert.equal(t.handValue(n,['coin','coin','rose'],100).win,60);n.phase='shop';const first=t.repairPrice('crackedMirror');t.repairItem('crackedMirror');assert.equal(n.itemLife.crackedMirror,2);n.itemLife.crackedMirror=0;assert.ok(t.repairPrice('crackedMirror')>first);assert.ok(t.itemSale('crackedMirror')<120);
});
test('new core and conditional items affect only their advertised hands',()=>{
 const t=boot();t.startNight();const n=t.state().night;
 n.devices=['coinMint','coinScales'];assert.equal(t.handValue(n,['coin','coin','rose'],100).win,180);assert.equal(t.handValue(n,['rose','rose','coin'],100).win,63);
 n.devices=['rosePair','skullPair'];assert.equal(t.handValue(n,['rose','rose','coin'],100).win,170);assert.equal(t.handValue(n,['skull','skull','coin'],100).win,260);
 n.devices=['lastBank','finalMatch'];n.roundHands=3;assert.equal(t.handValue(n,['coin','coin','rose'],100).win,270);
 n.devices=['oddStack'];n.growth={oddMiss:4};assert.equal(t.handValue(n,['coin','coin','rose'],100).win,160);const loss=t.handValue(n,['coin','rose','skull'],100);assert.equal(loss.growth.oddMiss,5);assert.equal(n.growth.oddMiss,4);
 n.devices=['goldenHour','skullBell'];assert.equal(t.handValue(n,['coin','coin','rose'],100).win,120);assert.equal(t.handValue(n,['skull','skull','rose'],100).win,280);
 n.devices=['loanAmulet'];assert.equal(t.handValue(n,['rose','rose','coin'],100).win,90);t.state().debt=500;assert.equal(t.handValue(n,['rose','rose','coin'],100).win,162);
});
test('insurance, crown breakage, paints, doubled payouts and boss bypass are deterministic',()=>{
 const t=boot();t.startNight();const n=t.state().night;n.devices=['emergencyPolicy','rentedCrown'];n.itemLife={emergencyPolicy:1,rentedCrown:3};t.deal();n.cards=['coin','rose','skull'];t.evaluate();assert.equal(n.pot,100);assert.equal(n.itemLife.emergencyPolicy,0);assert.ok(!n.devices.includes('rentedCrown'));
 n.phase='dealt';n.cards=['coin','rose','skull'];n.devices=['safetyNet'];n.itemLife.safetyNet=3;assert.equal(t.handValue(n,n.cards,100).win,50);
 n.devices=[];n.bag=['rosePaint','doubleTicket'];assert.equal(t.useItem('rosePaint',0),true);assert.deepEqual(Array.from(n.cards),['rose','rose','skull']);assert.equal(t.useItem('rosePaint',1),false);
 assert.equal(t.useItem('doubleTicket'),true);assert.equal(t.handValue(n,n.cards,100).win,180);
 n.table=3;n.bosses={3:'tax'};n.bag=['dealerGlove'];assert.equal(t.handValue(n,n.cards,100).win,140);t.useItem('dealerGlove');assert.equal(t.handValue(n,n.cards,100).win,180);
});
test('repair and extension consumables persist, cap duration and preserve unused invalid items',()=>{
 const t=boot();t.startNight();const n=t.state().night;n.devices=['tripleGlass','fever'];n.itemLife={tripleGlass:0,fever:2};n.bag=['repairKit','extension'];
 assert.equal(t.useItem('repairKit','fever'),false);assert.equal(n.bag.length,2);assert.equal(t.useItem('repairKit','tripleGlass'),true);assert.equal(n.itemLife.tripleGlass,3);
 t.useItem('extension','fever');assert.equal(n.itemLife.fever,4);n.bag=['extension'];t.useItem('extension','fever');assert.equal(n.itemLife.fever,5);
 const restored=boot(JSON.parse(t.storage.get('hanpan-life-v5')));assert.equal(restored.state().night.itemLife.fever,5);assert.equal(restored.state().night.itemLife.tripleGlass,3);
 n.bag=['redrawTicket'];t.deal();t.useItem('redrawTicket');assert.equal(t.rerollLimit(),2);
});
test('loan amulet premium cannot be avoided by selling it before settlement',()=>{
 const t=boot();t.state().money=10000;t.state().debt=500;t.state().due=6;t.startNight();const n=t.state().night;n.phase='shop';n.offers=['loanAmulet'];t.buyDevice('loanAmulet');t.sellDevice('loanAmulet');t.click('판매한다');t.nextTable();t.deal();t.endNight();assert.equal(t.state().debt,565);
});
test('high risk loans have real debt, original maturity and no duplicate borrowing',()=>{
 const t=boot(),s=t.state(),wealth=t.wealth();t.takeLoan('risk');t.click('계약하고 빌린다');const l=s.loans[0];assert.equal(l.balance,5200);assert.equal(s.money,6400);assert.equal(t.wealth(),wealth);assert.equal(l.due,5);
 t.takeLoan('risk');assert.equal(s.loans.length,1);t.startNight();t.endNight();assert.equal(l.balance,5200);t.startNight();t.deal();t.endNight();assert.equal(l.balance,5980);assert.equal(l.due,5);
 s.money=10000;t.payLoan(l.id);assert.equal(s.loans.length,0);assert.equal(s.money,4020);
});
test('mortgages reserve collateral, block sale and expansion, and exclude double counted credit',()=>{
 const t=boot(),s=t.state();s.money=10000;s.home=2;s.owned=['stall'];const wealth=t.wealth();t.takeLoan('home');t.click('계약하고 빌린다');assert.equal(t.wealth(),wealth);assert.equal(t.pledged('home'),true);assert.ok(t.lockedAssets()>0);
 t.confirmHome(0);assert.equal(s.home,2);t.takeLoan('stall');t.click('계약하고 빌린다');assert.equal(t.pledged('stall'),true);const money=s.money;t.sell('stall');t.upgradeBusiness('stall');assert.equal(s.money,money);assert.ok(s.owned.includes('stall'));
 assert.ok(t.eventCatalog().every(e=>e.id!=='buyout'));assert.equal(t.loanOffers().filter(o=>o.target).length,0);
});
test('unpaid mortgage forecloses once, returns surplus or records the shortfall',()=>{
 const t=boot(),s=t.state();s.money=10000;s.home=2;t.takeLoan('home');t.click('계약하고 빌린다');const l=s.loans[0];s.money=0;s.day=l.due;
 const rows=t.settleLoans();assert.equal(s.home,0);assert.equal(s.loans.length,0);assert.equal(s.money,5200-Math.ceil(3900*1.06));assert.ok(rows[0].includes('강제 처분'));const money=s.money;t.settleLoans();assert.equal(s.money,money);
 const b=boot();b.state().owned=['stall'];b.takeLoan('stall');b.click('계약하고 빌린다');const debt=b.state().loans[0];b.state().money=0;b.state().day=debt.due;b.settleLoans();assert.equal(b.state().owned.length,0);assert.equal(b.state().bills,142);
});
test('installment loans amortize and collateral is seized if an installment cannot be paid',()=>{
 const t=boot(),s=t.state();t.takeLoan('risk','installment');t.click('계약하고 빌린다');const l=s.loans[0],before=s.money;t.settleLoans();assert.equal(l.balance,3900);assert.equal(s.money,before-2080);
 const b=boot();b.state().home=1;b.takeLoan('home','installment');b.click('계약하고 빌린다');b.state().money=0;b.settleLoans();assert.equal(b.state().home,0);assert.equal(b.state().loans.length,0);
});
test('unsecured maturity transfers the full shortfall to bills and can cause bankruptcy',()=>{
 const t=boot(),s=t.state();t.takeLoan('risk');t.click('계약하고 빌린다');s.money=0;s.day=s.loans[0].due;t.settleLoans();assert.equal(s.loans.length,0);assert.equal(s.bills,5980);assert.equal(t.checkBankruptcy(),true);
});
test('business expansion increases revenue, operating costs, resale and collateral together',()=>{
 const t=boot(),s=t.state();s.money=10000;t.buy('stall');t.upgradeBusiness('stall');t.click('확장한다');assert.equal(t.businessLevel('stall'),2);assert.equal(t.businessCapital('stall'),2400);assert.equal(t.businessStats(t.GOODS.find(g=>g.id==='stall')).expense,120);
 t.upgradeBusiness('stall');t.click('확장한다');assert.equal(t.businessLevel('stall'),3);assert.equal(t.businessCapital('stall'),4800);assert.equal(t.loanOffers().find(o=>o.key==='stall').cap,2800);
 const before=s.money;t.sell('stall');t.click('판매한다');assert.equal(s.money,before+2400);t.buy('stall');assert.equal(t.businessLevel('stall'),1);
});
test('retirement requires debt freedom, preserves its ending, and blocks economic actions',()=>{
 const t=boot(),s=t.state();s.money=12000;s.debt=1;t.retire('peace');assert.equal(s.status,'alive');s.debt=0;t.retire('peace');t.click('은퇴한다');assert.equal(s.status,'retired');const before=s.money;t.buy('radio');t.rawStart();t.takeLoan('risk');assert.equal(s.money,before);assert.equal(s.night,null);
 const reload=boot(JSON.parse(t.storage.get('hanpan-life-v5')));assert.equal(reload.state().status,'retired');reload.reset('hard');assert.equal(reload.state().history[0].reason,'빚 없는 작은 은퇴');
});
test('v7 active nights keep their rules while new v8 fields initialize safely',()=>{
 const t=boot();t.startNight();const s=t.state();s.night.rules=6;s.night.phase='dealt';s.night.cards=['coin','coin','rose'];s.night.devices=['pairEngine'];s.money=777;s.debt=300;
 for(const key of ['loans','nextLoanId','businessLevels','ending'])delete s[key];for(const key of ['itemLife','bag','repairs','room','stakeMult','handStake'])delete s.night[key];
 const reload=boot(s);assert.equal(reload.state().money,777);assert.equal(reload.state().debt,300);assert.equal(reload.state().night.rules,6);assert.equal(reload.bet(),100);reload.changeStake(5);assert.equal(reload.bet(),100);reload.evaluate();assert.equal(reload.state().night.pot,150);
});

test('v9 points exclude stake, risk and room cash multipliers; insurance scores zero',()=>{
 const t=boot();t.state().money=100000;t.startNight();const n=t.state().night;
 assert.equal(t.handScore(n,['coin','coin','rose']),30);
 const triple=t.handScore(n,['skull','skull','skull']);n.room='secret';n.risk=4;t.changeStake(20);
 assert.equal(t.handScore(n,['skull','skull','skull']),triple);assert.equal(t.handScore(n,['coin','coin','rose']),30);
 n.devices=['insurance','fever'];assert.equal(t.handScore(n,['coin','rose','skull']),0);
 n.devices=['pairEngine'];assert.equal(t.handScore(n,['rose','rose','coin']),90);
 t.deal();n.cards=['rose','rose','coin'];t.evaluate();assert.equal(n.tableScore,90);assert.ok(n.pot>90);t.evaluate();assert.equal(n.tableScore,90);
});
test('unbuilt pairs cannot clear first table while an invested pair build remains viable',()=>{
 const t=boot();t.state().money=100000;t.startNight();const n=t.state().night;
 for(let i=0;i<4;i++){t.deal();n.cards=['skull','skull','coin'];t.evaluate();t.resolveChoice(false)}
 assert.equal(n.tableScore,280);assert.equal(n.phase,'checkpoint');assert.ok(n.tableScore<t.target());
 n.table=6;n.phase='ready';n.bosses={};n.devices=['skullPair','pairLadder','finalMatch'];n.itemLife={finalMatch:1};n.pairChain=5;n.roundHands=2;
 assert.equal(t.handScore(n,['skull','skull','coin']),1170);
});
test('last timed charge contributes points before expiration and previews never consume it',()=>{
 const t=boot();t.startNight();const n=t.state().night;n.devices=['fever'];n.itemLife.fever=1;
 assert.equal(t.handScore(n,['coin','coin','coin']),450);assert.equal(n.itemLife.fever,1);
 t.deal();t.evaluate();assert.equal(n.tableScore,450);assert.ok(!n.devices.includes('fever'));
});
test('v8 current hand keeps monetary scoring after migration',()=>{
 const t=boot();t.startNight();const s=t.state();s.night.rules=8;s.night.phase='dealt';s.night.cards=['coin','coin','rose'];s.night.handStake=500;s.night.devices=['pairEngine'];s.money=555;
 delete s.lifeGoal;delete s.luxuryLevels;delete s.roomUsed;
 const r=boot(s);assert.equal(r.state().money,555);assert.equal(r.target(),300);r.evaluate();assert.equal(r.state().night.tableScore,750);
});
test('life goals retain stage progress, grant rewards once and require a new final clear',()=>{
 const t=boot(),s=t.state();s.lifeGoal='business';s.money=50000;s.owned=['stall','shop','hotel'];s.businessLevels.stall=2;
 t.save();assert.equal(s.goalStage,4);assert.equal(s.shopCoupons,3);assert.equal(s.goalFinalClear,false);assert.equal(s.memories,4);
 t.save();assert.equal(s.memories,4);s.owned=[];t.save();assert.equal(s.goalStage,4);
 t.startNight();const n=s.night;assert.equal(n.rules,9);n.table=6;n.tableScore=t.target();n.phase='resolved';t.advanceHand();
 assert.equal(s.goalStage,5);assert.equal(s.goalFinalClear,true);assert.ok(t.retirementOptions().find(e=>e.id==='purpose').ok);
 const r=boot(JSON.parse(t.storage.get('hanpan-life-v5')));assert.equal(r.state().goalStage,5);
});
test('all life paths have reachable intermediate stages and reset clears purpose',()=>{
 for(const path of ['home','patron']){const t=boot(),s=t.state();s.lifeGoal=path;s.owned=['radio','stall'];s.luxuryLevels.radio=3;s.money=30000;s.home=3;s.good=20;t.save();assert.equal(s.goalStage,4);t.reset('hard');assert.equal(t.state().lifeGoal,null);assert.equal(t.state().goalStage,0);assert.equal(t.state().shopCoupons,0)}
});
test('ten functional possessions upgrade with real costs and lose levels after resale',()=>{
 const t=boot(),s=t.state();assert.equal(Object.keys(t.LUXURY).length,38);s.money=10000;t.buy('radio');t.upgradeLuxury('radio');t.click('업그레이드');t.upgradeLuxury('radio');t.click('업그레이드');
 assert.equal(t.luxLevel('radio'),3);assert.equal(s.money,9550);assert.equal(t.resale(t.GOODS.find(g=>g.id==='radio')),270);assert.equal(t.upkeep(),70);
 t.sell('radio');t.click('판매한다');t.buy('radio');assert.equal(t.luxLevel('radio'),1);
});
test('passive luxury effects change only their disclosed economic costs',()=>{
 const t=boot(),s=t.state();s.owned=['lamp','headphone','watch','suit'];s.luxuryLevels={lamp:3,headphone:3,watch:3,suit:3};t.startNight();
 assert.equal(t.refreshPrice(),18);assert.equal(t.rerollCost(),22);assert.equal(t.devicePrice('roseBloom'),198);assert.equal(t.businessMultiplier('stall'),1.09);
 s.shopCoupons=1;s.night.phase='shop';s.night.offers=['roseBloom'];assert.equal(t.devicePrice('roseBloom'),179);t.buyDevice('roseBloom');assert.equal(s.shopCoupons,0);assert.equal(s.night.paid.roseBloom,179);
});
test('watch reserves one item through paid stock refresh and saves the reservation',()=>{
 const t=boot();t.state().owned=['watch'];t.startNight();const n=t.state().night;n.phase='shop';n.offers=['roseBloom'];t.reserveOffer('roseBloom');t.refreshStock();assert.ok(n.offers.includes('roseBloom'));assert.equal(n.offers.length,6);
 const r=boot(JSON.parse(t.storage.get('hanpan-life-v5')));assert.equal(r.state().night.reserved,'roseBloom');
});
test('room actions cannot farm by repeat, reload or selling and rebuying',()=>{
 const t=boot(),s=t.state();s.money=10000;s.owned=['camera'];t.luxuryAction('camera');t.click('시작한다');assert.equal(s.money,10060);const money=s.money;
 t.luxuryAction('camera');assert.equal(s.money,money);const r=boot(JSON.parse(t.storage.get('hanpan-life-v5')));r.luxuryAction('camera');assert.equal(r.state().money,money);
 t.sell('camera');t.click('판매한다');t.buy('camera');const afterBuy=s.money;t.luxuryAction('camera');assert.equal(s.money,afterBuy);
 t.startNight();t.endNight();assert.equal(s.day,1);t.luxuryAction('camera');assert.equal(s.money,afterBuy);
 s.day++;t.luxuryAction('camera');t.click('시작한다');assert.equal(s.money,afterBuy+60);
});
test('room activity failures accrue bills, practice grants only one reward',()=>{
 const t=boot(),s=t.state();s.owned=['car'];s.money=300;t.random(.99);t.luxuryAction('car');t.click('시작한다');assert.equal(s.money,0);assert.equal(s.bills,150);
 const p=boot();p.state().owned=['console'];p.luxuryAction('console');p.click('75점');assert.equal(p.state().memories,1);assert.equal(p.state().shopCoupons,1);p.luxuryAction('console');assert.equal(p.state().shopCoupons,1);
});
test('banker third-card tableau covers every total and player third card',()=>{
 const t=boot(),expected=[[0,1,2,3,4,5,6,7,8,9],[0,1,2,3,4,5,6,7,8,9],[0,1,2,3,4,5,6,7,8,9],[0,1,2,3,4,5,6,7,9],[2,3,4,5,6,7],[4,5,6,7],[6,7],[],[],[]];
 for(let total=0;total<10;total++){assert.equal(t.bankerDraw(total,null),total<=5);for(let third=0;third<10;third++)assert.equal(t.bankerDraw(total,third),expected[total].includes(third))}
});
test('baccarat eight-deck shoe, natural stops and drawing order follow rules',()=>{
 const t=boot(),shoe=t.baccaratShoe();assert.equal(shoe.length,416);const counts={};shoe.forEach(c=>counts[c.rank+'-'+c.suit]=(counts[c.rank+'-'+c.suit]||0)+1);assert.equal(Object.keys(counts).length,52);assert.ok(Object.values(counts).every(n=>n===8));
 const hand=ranks=>t.baccaratHand(ranks.map(rank=>({rank,suit:0})).reverse());
 const natural=hand([4,2,5,3,1,1]);assert.equal(natural.pt,9);assert.equal(natural.player.length,2);assert.equal(natural.banker.length,2);
 const draw=hand([2,1,3,2,8,6]);assert.equal(draw.player.length,3);assert.equal(draw.banker.length,2);assert.equal(draw.pt,3);assert.equal(draw.bt,3);
 const stand=hand([3,2,3,3,4]);assert.equal(stand.player.length,2);assert.equal(stand.banker.length,3);assert.equal(stand.bt,9);
});
test('baccarat commission, tie pushes and tie payout are exact',()=>{
 const t=boot();assert.equal(t.baccaratPayout('player','player',100),200);assert.equal(t.baccaratPayout('banker','banker',100),195);assert.equal(t.baccaratPayout('banker','banker',110),214);
 for(const side of ['player','banker'])assert.equal(t.baccaratPayout(side,'tie',100),100);
 assert.equal(t.baccaratPayout('tie','tie',100),900);assert.equal(t.baccaratPayout('tie','player',100),0);assert.equal(t.baccaratPayout('banker','player',100),0);
});
test('baccarat charges and pays once, freezes result and resumes without redraw',()=>{
 const t=boot();t.beginBaccarat();const n=t.state().night;n.shoe=[1,1,3,5,2,4].map(rank=>({rank,suit:0}));t.dealBaccarat();
 assert.equal(t.state().money,1300);assert.equal(n.hands,1);assert.equal(n.shoe.length,2);t.dealBaccarat();assert.equal(t.state().money,1300);t.baccaratBet('tie',20);assert.equal(n.side,'player');
 const r=boot(JSON.parse(t.storage.get('hanpan-life-v5')));assert.equal(r.state().night.last.pt,9);assert.equal(r.state().money,1300);r.dealBaccarat();assert.equal(r.state().money,1300);
 r.nextBaccarat();assert.equal(r.state().night.phase,'ready');
});
test('baccarat shares loans and settlement, empty entry costs nothing and no double return',()=>{
 const t=boot(),s=t.state();t.beginBaccarat();t.endNight();assert.equal(s.day,1);assert.equal(s.money,1200);
 s.debt=500;s.due=6;t.beginBaccarat();t.dealBaccarat();const afterDeal=s.money;t.endNight();assert.equal(s.day,2);assert.equal(s.money,afterDeal-85);assert.equal(s.debt,540);t.endNight();assert.equal(s.money,afterDeal-85);
});
test('baccarat insufficient funds, overdue debt and 12 hand limit are enforced',()=>{
 const t=boot(),s=t.state();s.bills=1;t.beginBaccarat();assert.equal(s.night,null);s.bills=0;t.beginBaccarat();t.baccaratBet('tie',20);t.dealBaccarat();assert.equal(s.money,1200);assert.equal(s.night.hands,0);
 s.money=100000;t.baccaratBet('player',1);for(let i=0;i<12;i++){t.dealBaccarat();assert.equal(s.night.hands,i+1);if(i<11)t.nextBaccarat()}const after=s.money;t.dealBaccarat();assert.equal(s.money,after);t.nextBaccarat();assert.equal(s.night,null);assert.equal(s.day,2);
});

test('v10 base cash returns are below stakes in every room; points stay independent',()=>{
 const t=boot(undefined,false,10);t.startNight();const n=t.state().night,weights={coin:.48,rose:.34,skull:.18},evs=[];
 for(const room of ['normal','vip','secret']){n.room=room;let ev=0;for(const a of Object.keys(weights))for(const b of Object.keys(weights))for(const c of Object.keys(weights))ev+=weights[a]*weights[b]*weights[c]*t.handValue(n,[a,b,c],10000).win/10000;assert.ok(ev>.8&&ev<1);evs.push(ev)}
 n.risk=4;n.stakeMult=20;assert.equal(t.handScore(n,['coin','coin','rose']),30);assert.equal(t.handScore(n,['skull','skull','skull']),1000);
 console.log('BASE CASH EV',evs.map(x=>x.toFixed(6)).join(' / '));
});
test('v10 same-day preparation shop and bosses survive reentry and reload',()=>{
 const t=boot(undefined,false,10);t.beginNight();t.selectDevice('pairEngine');const n=t.state().night,offers=JSON.stringify(n.offers),bosses=JSON.stringify(n.bosses);
 t.endNight();t.random(.99);t.beginNight();t.selectDevice('pairEngine');assert.equal(JSON.stringify(t.state().night.offers),offers);assert.equal(JSON.stringify(t.state().night.bosses),bosses);
 const r=boot(JSON.parse(t.storage.get('hanpan-life-v5')),false,10);assert.equal(JSON.stringify(r.state().night.offers),offers);
});
test('v10 last hand and cleared target cannot use risk; risk pot locks stake',()=>{
 const t=boot(undefined,false,10);t.startNight();const n=t.state().night;n.roundHands=t.handLimit()-1;assert.equal(t.mayRisk(),false);n.roundHands=0;n.tableScore=t.target();assert.equal(t.mayRisk(),false);
 n.tableScore=0;n.pot=50;t.changeStake(2);assert.equal(n.stakeMult,1);n.pot=0;t.changeStake(2);assert.equal(n.stakeMult,2);
});
test('v10 route selection advances once with disclosed target and payout costs',()=>{
 const t=boot(undefined,false,10);t.startNight();const n=t.state().night;n.phase='shop';t.nextTable();assert.equal(n.phase,'route');assert.equal(n.table,1);
 t.selectRoute('steady');assert.equal(n.table,2);assert.equal(t.target(),675);assert.equal(t.handValue(n,['coin','coin','coin'],100).win,202);
 t.selectRoute('rush');assert.equal(n.table,2);n.phase='route';t.selectRoute('rush');assert.equal(n.table,3);assert.equal(t.target(),1375);
});
test('v10 new bosses apply only their first-hand restrictions',()=>{
 const t=boot(undefined,false,10);t.startNight();const n=t.state().night;n.table=3;n.bosses={3:'hush'};assert.equal(t.rerollLimit(),0);n.roundHands=1;assert.equal(t.rerollLimit(),1);
 n.roundHands=0;n.bosses[3]='cold';assert.equal(t.handScore(n,['coin','coin','coin']),150);n.roundHands=1;assert.equal(t.handScore(n,['coin','coin','coin']),300);
});
test('v10 completion reward pays once and discoveries survive a new life',()=>{
 const t=boot(undefined,false,10);t.startNight();const s=t.state(),n=s.night;n.table=6;const money=s.money;
 assert.equal(t.completeReward(n),1000);assert.equal(s.money,money+1000);assert.equal(t.completeReward(n),0);assert.equal(s.archive.clears,1);t.save();t.reset('hard');assert.equal(t.state().archive.clears,1);assert.equal(t.state().money,1200);
});
test('stock buy/sell fees, average cost and partial realized profit reconcile',()=>{
 const t=boot(undefined,false,10),s=t.state();s.money=10000;assert.equal(t.executeStock('harvest','buy',10),true);assert.equal(s.money,8990);assert.equal(s.market.holdings.harvest.cost,1010);
 s.market.prices.harvest=120;t.executeStock('harvest','buy',5);assert.equal(s.money,8384);assert.equal(s.market.holdings.harvest.cost,1616);
 t.executeStock('harvest','sell',5);assert.equal(s.money,8978);assert.equal(s.market.realized,55);assert.equal(s.market.holdings.harvest.cost,1077);
 t.executeStock('harvest','sell',10);assert.equal(s.money,10166);assert.equal(s.market.realized,166);assert.equal(s.market.holdings.harvest,undefined);assert.equal(s.market.tradeCount,4);
});
test('stock invalid orders, insufficient funds and oversells never mutate balances',()=>{
 const t=boot(undefined,false,10),s=t.state(),before=JSON.stringify(s);
 for(const [id,side,qty]of [['bad','buy',1],['pixel','bad',1],['pixel','buy',NaN],['pixel','buy',-1],['pixel','buy',.5],['pixel','buy',10001],['sol','buy',100],['pixel','sell',1]])assert.equal(t.executeStock(id,side,qty),false);
 assert.equal(JSON.stringify(s),before);
});
test('stocks count as saleable assets but do not inflate borrowing limits',()=>{
 const t=boot(undefined,false,10),s=t.state();s.money=10000;const credit=t.credit();t.executeStock('harvest','buy',10);
 assert.equal(t.stockValue(),990);assert.equal(t.assets(),990);assert.equal(t.credit(),credit);assert.equal(t.wealth(),9980);
 s.bills=1;assert.equal(t.executeStock('harvest','buy',1),false);assert.equal(t.executeStock('harvest','sell',10),true);assert.equal(t.stockValue(),0);
});
test('market evolves once per day and save reload cannot redraw prices',()=>{
 const t=boot(undefined,false,10),s=t.state(),saved=JSON.parse(JSON.stringify(s));s.day++;t.tickMarket();const next=JSON.stringify(s.market),money=s.money;t.tickMarket();assert.equal(JSON.stringify(s.market),next);assert.equal(s.money,money);
 const r=boot(saved,false,10);r.random(.99);r.state().day++;r.tickMarket();assert.equal(JSON.stringify(r.state().market),next);
});
test('dividend is ex-price, once only; prices and history remain bounded over 200 days',()=>{
 const t=boot(undefined,false,10),s=t.state();s.market.holdings.harvest={qty:10,cost:1010};s.day=3;const before=s.money;t.tickMarket();assert.equal(s.money,before+10);assert.equal(s.market.dividends,10);t.tickMarket();assert.equal(s.money,before+10);
 for(let day=4;day<=203;day++){s.day=day;t.tickMarket();for(const x of t.STOCKS){assert.ok(s.market.prices[x.id]>=1&&s.market.prices[x.id]<=1e7);assert.ok(s.market.history[x.id].length<=24)}}
});
test('news influences relevant businesses and rotates only after its announced duration',()=>{
 const t=boot(undefined,false,10),s=t.state();s.market.news=1;s.market.newsUntil=4;assert.equal(t.worldBusinessMultiplier('hotel'),1.24);assert.equal(t.worldBusinessMultiplier('gamecompany'),1);
 s.day=2;t.tickMarket();assert.equal(s.market.news,1);s.day=3;t.tickMarket();assert.equal(s.market.news,1);s.day=4;t.tickMarket();assert.equal(s.market.newsUntil,7);
});
test('quiet work pays once and advances costs, prices and saved checkpoint together',()=>{
 const t=boot(undefined,false,10),s=t.state();t.save();t.quietDay('work');t.click('하루를 보낸다');assert.equal(s.day,2);assert.equal(s.money,1175);assert.equal(s.market.day,2);assert.equal(s.night,null);
 const checkpoint=JSON.parse(t.storage.get('hanpan-life-v5-checkpoint'));assert.equal(checkpoint.day,1);assert.equal(checkpoint.night,null);assert.equal(checkpoint.money,1200);
 t.finishSettlement();assert.equal(s.money,1175);assert.equal(s.day,2);
});
test('secured settlement allows stock rescue without advancing date or charging twice',()=>{
 const t=boot(undefined,false,10),s=t.state();s.money=100;s.home=1;s.market.holdings.harvest={qty:20,cost:2020};
 s.loans=[{id:1,name:'test',balance:500,principal:500,rate:.06,due:2,installment:0,plan:'bullet',target:'home'}];
 t.quietDay('work');t.click('하루를 보낸다');assert.ok(s.pendingSettlement);assert.equal(s.day,2);assert.equal(s.loans[0].balance,530);
 t.quietDay('work');assert.equal(s.day,2);assert.equal(t.executeStock('harvest','buy',1),false);assert.equal(t.executeStock('harvest','sell',20),true);
 const before=s.money;t.finishSettlement();assert.equal(s.money,before-530);assert.equal(s.home,1);assert.equal(s.pendingSettlement,null);const money=s.money;t.finishSettlement();assert.equal(s.money,money);assert.equal(s.day,2);
});
test('rescue interest is booked before manual repayment and installments are idempotent',()=>{
 const t=boot(undefined,false,10),s=t.state();s.money=10000;s.loans=[{id:1,name:'test',balance:1000,principal:1000,rate:.1,due:8,installment:100,plan:'installment',target:null}];s.day=2;
 t.bookLoanInterest();assert.equal(s.loans[0].balance,1100);t.bookLoanInterest();assert.equal(s.loans[0].balance,1100);t.settleLoans();assert.equal(s.money,9800);assert.equal(s.loans[0].balance,900);t.settleLoans();assert.equal(s.money,9800);
 t.payLoan(1);assert.equal(s.money,8900);assert.equal(s.loans.length,0);
});
test('home and investor projects reset on broken conditions; business completion pays once',()=>{
 const t=boot(undefined,false,10),s=t.state();s.lifeGoal='home';s.goalStage=4;s.home=3;s.project={kind:'home',progress:0,started:1};t.advanceProject();assert.equal(s.project.progress,1);s.debt=1;t.advanceProject();assert.equal(s.project.progress,0);
 s.debt=0;s.project={kind:'investor',progress:1,started:1};t.advanceProject();assert.equal(s.project.progress,0);
 s.lifeGoal='business';s.owned=['stall'];s.businessLevels.stall=3;s.project={kind:'business',progress:0,started:1};const before=s.money;for(let i=0;i<3;i++)t.advanceProject();assert.equal(s.goalFinalClear,true);assert.equal(s.money,before+8000);t.advanceProject();assert.equal(s.money,before+8000);
});
test('v10 backups round-trip populated portfolios and reject malformed money and markets',()=>{
 const t=boot(undefined,false,10);t.executeStock('harvest','buy',5);const code=t.backupCode(),next=t.validBackup(code);assert.equal(next.market.holdings.harvest.qty,5);
 const mutate=fn=>{const x=JSON.parse(code);fn(x.state);x.checksum=t.checksum(JSON.stringify(x.state));return JSON.stringify(x)};
 assert.throws(()=>t.validBackup(code.replace('"checksum":"','"checksum":"x')));
 for(const edit of [x=>x.money=-1,x=>x.market.holdings.fake={qty:1,cost:1},x=>x.market.prices.harvest=0,x=>x.market.day++,x=>x.businessStyles.stall='fake',x=>x.dailyRooms={day:1,rooms:{normal:{bosses:{3:'fake',6:'cold'}}}}])assert.throws(()=>t.validBackup(mutate(edit)));
 const safe=t.validBackup(mutate(x=>x.log=['<img src=x onerror=alert(1)>']));assert.ok(!safe.log[0].includes('<img'));
});
test('settlement checkpoint stores a pot before payment, so restored payment is not doubled',()=>{
 const t=boot(undefined,false,10);t.startNight();const s=t.state();s.night.pot=200;s.night.played=true;const before=s.money;t.endNight();const checkpoint=JSON.parse(t.storage.get('hanpan-life-v5-checkpoint'));
 assert.equal(checkpoint.money,before);assert.equal(checkpoint.night.pot,200);const r=boot(checkpoint,false,10);r.endNight();assert.equal(r.state().money,s.money);assert.equal(r.state().day,s.day);
});
test('all 38 luxury objects have upgrade effects; sequels depend on history',()=>{
 const t=boot(undefined,false,10),s=t.state();assert.equal(Object.keys(t.LUXURY).length,38);for(const g of t.GOODS.filter(x=>x.tab==='luxury'))assert.ok(t.LUXURY[g.id].text(1));
 s.owned=['stall'];s.story.contract=1;assert.ok(t.eventCatalog().some(e=>e.id==='contract-part2'));s.story.contract=2;assert.ok(t.eventCatalog().some(e=>e.id==='contract-part3'));
 s.baccaratVisits=2;s.market.tradeCount=1;assert.ok(t.eventCatalog().some(e=>e.id==='salon-letter'));assert.ok(t.eventCatalog().some(e=>e.id==='investor-letter'));
});

console.log(`${tests} economic and state regression tests passed`);
