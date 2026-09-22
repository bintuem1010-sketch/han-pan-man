/* 한 판만 v6 — virtual currency only. Economic actions are synchronous and saved atomically. */
(()=>{'use strict';
const $=id=>document.getElementById(id), fmt=n=>`${n<0?'-':''}₩${Math.abs(Math.round(n)).toLocaleString('ko-KR')}`;
// Old installed pages may receive new JS before their HTML refreshes.
// Recover before touching state or charging a stake; never delete saves.
if(!['betAmount','economyBar','homeNote','saveWarning','bossBanner','runTrack','handPreview'].every(id=>$(id))){
 const recovery=new URL('index.html',location.href);recovery.searchParams.set('v','6');
 if(location.href!==recovery.href)location.replace(recovery.href);
 return;
}
const KEY='hanpan-life-v5', OLD='hanpan-life-v3';
const MODES={hard:{name:'하드',start:1200,interest:.08,base:100,living:65},hell:{name:'지옥',start:900,interest:.14,base:140,living:100}};
const HOMES=[['🛏️','고시원',0,20],['🚪','원룸',1800,65],['🏡','작은 주택',6500,180],['🏙️','아파트',18000,420],['🌃','펜트하우스',55000,1100],['🏰','저택',150000,2800]];
const SYMBOLS={coin:{icon:'🪙',name:'금화',pair:.6,triple:3,weight:48},rose:{icon:'🌹',name:'장미',pair:.9,triple:5,weight:34},skull:{icon:'💀',name:'해골',pair:1.4,triple:10,weight:18}};
const DEVICES=[
 ['roseLuck','장미 향수','장미 가중치 34 → 58','장미',1.5],['roseBloom','마르지 않는 꽃','장미 당첨마다 장미 배율 +0.35, 최대 ×4','장미',2.2],['roseVow','붉은 계약','장미 당첨 ×1.8, 다른 당첨 ×0.5','장미',1.8],
 ['skullLuck','뼈 주사위','해골 가중치 18 → 38','해골',1.5],['skullCharm','죽은 자의 동전','해골 트리플 기본 배당 +5','해골',2],['lastShot','최후의 성냥','테이블 마지막 판 당첨금 ×2','해골',2],
 ['pairEngine','작은 승리','한 쌍 기본 배당 +0.9, 트리플 ×0.7','한 쌍',1.5],['pairLadder','징검다리','연속 한 쌍마다 배율 +0.4, 최대 ×3','한 쌍',2.2],['steadyHands','흔들리지 않는 손','다시 뽑지 않은 패의 당첨금 ×1.3','한 쌍',1.4],
 ['extraDraw','사기꾼의 손','다시 뽑기 +1회','도구',1.6],['cheapDraw','구멍 난 주머니','다시 뽑기 25% → 10%','도구',1],['insurance','낡은 보험증','이번 밤 첫 꽝에 판돈 반환','도구',.8],['oddWin','뒤집힌 표지판','전부 다르면 판돈의 20% 반환','도구',.8],['coinRush','금빛 틀니','금화 트리플 배당 ×1.5','금화',1.2],['greed','탐욕의 반지','다시 걸기 배율 증가 +0.25','위험',1.4],['pairBoost','뼈 거울','해골 한 쌍 기본 배당 +0.3','해골',.8],['tripleBoost','붉은 염료','장미 트리플 기본 배당 +1','장미',1],['tripleLens','세 번째 눈','트리플 ×1.8, 한 쌍 ×0.6','트리플',2.3],['coinBank','주머니 속 금고','금화 한 쌍 배당 +0.7, 트리플 +2','금화',1.8]
].map(([id,name,text,tag,price])=>({id,name,text,tag,price}));
const BOSSES=[
 {id:'obsession',name:'집착하는 딜러',icon:'🎭',text:'직전 당첨과 같은 그림으로 또 당첨되면 지급액이 절반.',hint:'다른 그림으로 바꾸거나, 절반을 감수할 강한 조합을 준비하세요.'},
 {id:'seal',name:'봉인하는 딜러',icon:'🔒',text:'고정할 수 있는 패는 최대 한 장.',hint:'다시 뽑기 횟수·확률 장치나 첫 패 보너스가 도움이 됩니다.'},
 {id:'tax',name:'세금 징수원',icon:'🧾',text:'한 쌍·꽝 반환금에서 판돈의 40%를 공제. 트리플은 면제.',hint:'트리플을 노리거나 한 쌍 배당을 충분히 키우세요.'}
];
const GOALS=[3,4.5,6.5,9,12,16];
const device=id=>DEVICES.find(d=>d.id===id);
function modern(n=s.night){return n?.rules===6}
function bossFor(n=s.night,table=n?.table){return modern(n)?BOSSES.find(b=>b.id===n.bosses?.[table]):null}
function handLimit(n=s.night){return modern(n)?(n.table<=2?4:3):3}
function handIndex(n=s.night){return modern(n)?n.roundHands:n.hands%3}
function symbolWeights(n=s.night){return Object.fromEntries(Object.entries(SYMBOLS).map(([id,v])=>[id,v.weight+(id==='rose'&&n?.devices.includes('roseLuck')?(modern(n)?24:14):0)+(id==='skull'&&n?.devices.includes('skullLuck')?20:0)]))}
function handValue(n,cards,stake){
 const equipped=id=>n.devices.includes(id),counts={};cards.forEach(c=>counts[c]=(counts[c]||0)+1);
 const [symbol,count]=Object.entries(counts).sort((a,b)=>b[1]-a[1])[0];
 let mult=count===3?SYMBOLS[symbol].triple:count===2?SYMBOLS[symbol].pair:0;
 const notes=[`기본 배당 ×${mult}`],growth={...n.growth},nextPair=count===2?(n.pairChain||0)+1:0;let usedInsurance=false;
 function factor(value,name){mult*=value;notes.push(`${name} ×${Number(value.toFixed(2))}`)}
 function add(value,name){mult+=value;notes.push(`${name} +${value}`)}
 if(count===3&&symbol==='rose'&&equipped('tripleBoost'))add(1,'붉은 염료');
 if(count===3&&symbol==='skull'&&equipped('skullCharm'))add(modern(n)?5:2,'죽은 자의 동전');
 if(count===2&&symbol==='skull'&&equipped('pairBoost'))add(.3,'뼈 거울');
 if(modern(n)&&count>=2&&symbol==='coin'&&equipped('coinBank'))add(count===2?.7:2,'주머니 속 금고');
 if(modern(n)&&count===2&&equipped('pairEngine'))add(.9,'작은 승리');
 if(count===3&&symbol==='coin'&&equipped('coinRush'))factor(1.5,'금빛 틀니');
 if(modern(n)){
  if(count===3&&equipped('pairEngine'))factor(.7,'작은 승리');
  if(count>=2&&equipped('tripleLens'))factor(count===3?1.8:.6,'세 번째 눈');
  if(count>=2&&equipped('roseVow'))factor(symbol==='rose'?1.8:.5,'붉은 계약');
  if(count>=2&&symbol==='rose'&&equipped('roseBloom')){growth.roseWins=(growth.roseWins||0)+1;factor(Math.min(4,1+growth.roseWins*.35),'마르지 않는 꽃')}
  if(count===2&&equipped('pairLadder'))factor(Math.min(3,1+nextPair*.4),'징검다리');
 }
 if(!mult&&equipped('oddWin')){mult=.2;notes.push('표지판 반환 ×0.2')}
 if(!mult&&equipped('insurance')&&!n.insured){usedInsurance=true;mult=1;notes.push('보험 반환 ×1')}
 if(modern(n)&&mult>0){if(equipped('steadyHands')&&!n.rerolls)factor(1.3,'흔들리지 않는 손');if(equipped('lastShot')&&handIndex(n)===handLimit(n)-1)factor(2,'최후의 성냥')}
 let win=Math.floor((stake*mult*n.risk)+1e-8);if(n.risk!==1)notes.push(`다시 걸기 ×${n.risk}`);
 const boss=bossFor(n);if(win>0&&boss?.id==='obsession'&&count>=2&&n.lastSymbol===symbol){win=Math.floor(win/2);notes.push('집착하는 딜러 ×0.5')}
 if(win>0&&boss?.id==='tax'&&count<3){const tax=Math.ceil(stake*.4);win=Math.max(0,win-tax);notes.push(`세금 -${tax}`)}
 return{win,symbol,count,growth,nextPair,usedInsurance,notes,label:count===3?`${SYMBOLS[symbol].name} 트리플!`:count===2?`${SYMBOLS[symbol].name} 한 쌍`:win?'장치가 손실을 줄였습니다':'꽝'};
}
// id, category, icon, name, purchase price, description; businesses also carry revenue/expenses.
const GOODS=[
 ['radio','luxury','📻','중고 라디오',180,'잡음 사이로 좋아하는 노래가 흐릅니다.'],['plant','luxury','🪴','창가의 화분',240,'작은 방에도 자라는 것이 생겼습니다.'],['lamp','luxury','💡','빈티지 스탠드',380,'잠들기 전 켜두는 따뜻한 빛.'],['headphone','luxury','🎧','좋은 헤드폰',650,'세상의 소음을 잠깐 끕니다.'],['console','luxury','🎮','게임기',950,'오늘은 잃을 돈 없는 게임을 합니다.'],['bike','luxury','🚲','도시 자전거',1100,'골목을 달리는 소소한 자유.'],['watch','luxury','⌚','금빛 손목시계',1800,'손목 위에 남은 그날의 승리.'],['sofa','luxury','🛋️','벨벳 소파',2200,'당신보다 먼저 집에 자리 잡은 사치.'],['suit','luxury','🤵','맞춤 정장',3200,'멋은 나지만 확률은 바뀌지 않습니다.'],['camera','luxury','📷','필름 카메라',3800,'잃고 싶지 않은 풍경을 남깁니다.'],['vinyl','luxury','🎵','희귀 음반 컬렉션',4800,'누군가에겐 플라스틱, 당신에겐 보물.'],['piano','luxury','🎹','작은 피아노',6500,'빈방에 소리가 생겼습니다.'],['motor','luxury','🏍️','클래식 모터사이클',8500,'밤바람을 사는 값.'],['car','luxury','🏎️','붉은 스포츠카',12000,'목적지 없이 한 바퀴를 더 돕니다.'],['painting','luxury','🖼️','신진 작가 원화',16000,'아직 유명하지 않은 이름을 믿었습니다.'],['diamond','luxury','💎','다이아 반지',24000,'작은 돌에 큰 돈이 묶였습니다.'],['toilet','luxury','🚽','황금 변기',30000,'돈으로 산 가장 우스운 물건.'],['yacht','luxury','🛥️','작은 요트',65000,'바다는 넓고 통장은 작아집니다.'],['observatory','luxury','🔭','개인 천체망원경',85000,'오늘은 숫자 대신 별을 셉니다.'],['jet','luxury','✈️','전용기',200000,'구름 위에서도 빚은 따라옵니다.'],
 ['shelter','donation','🐈','동물보호소 후원',300,'누군가 따뜻하게 잠듭니다.'],['meal','donation','🍲','따뜻한 식사 나눔',600,'가격을 걱정하지 않아도 되는 한 끼.'],['scholar','donation','🎓','익명 장학금',2500,'이름을 남기지 않는 쪽을 골랐습니다.'],['library','donation','📚','작은 도서관 후원',7000,'새로운 이야기가 동네에 도착합니다.'],['town','donation','🏘️','낡은 동네 복구',18000,'꺼져 있던 창문들에 불이 들어옵니다.'],
 ['stall','business','🥪','밤거리 노점',1200,'작지만 당신 이름이 걸린 첫 사업.',110,60],['laundry','business','🧺','셀프 빨래방',2800,'기계가 돌아가는 동안 장부를 봅니다.',230,130],['shop','business','🏪','작은 상점',4500,'단골과 외상 장부가 생깁니다.',360,220],['cafe','business','☕','골목 카페',8000,'손님보다 원두 값이 먼저 오릅니다.',650,420],['studio','business','🎙️','녹음 스튜디오',11000,'다른 사람의 꿈에 공간을 빌려줍니다.',850,550],['trade','business','🚢','무역회사',15000,'좋은 소식도 나쁜 소식도 바다를 건넙니다.',1200,780],['hotel','business','🏨','작은 호텔',32000,'빈 객실도 관리비는 듭니다.',2300,1550],['corp','business','🏢','거대 기업',50000,'규모가 커지면 적자도 커집니다.',3800,2600],
 ['snack','small','🍢','길거리 어묵',40,'국물까지 천천히 마셨습니다.'],['catfood','small','🐾','골목 고양이 밥',60,'내일도 같은 자리에서 기다릴 겁니다.'],['ticket','small','🎫','작은 공연의 표',120,'처음 듣는 노래가 오래 남았습니다.'],['dinner','small','🍽️','친구의 저녁값',220,'계산서를 먼저 집었습니다.'],['trip','small','🚆','당일치기 여행',420,'잠시 다른 동네 사람이 되었습니다.'],['spa','small','🛁','하루의 휴식',750,'오늘만큼은 아무 숫자도 세지 않았습니다.']
].map(([id,tab,icon,name,price,text,revenue=0,expense=0])=>({id,tab,icon,name,price,text,revenue,expense,repeat:tab==='small'||tab==='donation',sellable:tab==='luxury'||tab==='business'}));
const good=id=>GOODS.find(g=>g.id===id), mode=()=>MODES[s.mode], owns=id=>s.owned.includes(id), has=id=>s.night?.devices.includes(id);
function fresh(difficulty='hard',history=[]){return{version:5,mode:difficulty,money:MODES[difficulty].start,debt:0,due:0,bills:0,home:0,owned:[],counts:{},day:1,good:0,memories:0,bestStreak:0,peak:MODES[difficulty].start,lastNight:0,night:null,history,status:'alive',sound:false,log:['새 인생. 시작금은 이번 한 번뿐입니다.']}}
function read(key){try{return JSON.parse(localStorage.getItem(key))}catch{return null}}
const stored=read(KEY);let s=stored&&stored.version===5&&MODES[stored.mode]&&Array.isArray(stored.owned)&&Number.isFinite(stored.money)?stored:fresh();
let currentTab='luxury', saveFailed=false;
s.milestones=Array.isArray(s.milestones)?s.milestones:[];
s.events=Array.isArray(s.events)?s.events:[];
if(s.night){const n=s.night;n.rules=n.rules||5;n.growth=n.growth||{};n.pairChain=n.pairChain||0;n.lastSymbol=n.lastSymbol||null;n.paid=n.paid||{};n.shopRolls=n.shopRolls||0;n.cleared=n.cleared||[];n.played=n.played??(n.hands>0||['dealt','choice','result','checkpoint'].includes(n.phase));}
function milestone(id,text){if(s.milestones.includes(id))return;s.milestones.push(id);s.events.unshift({day:s.day,text});s.events=s.events.slice(0,60);log(`✦ ${text}`)}
function lifeGoals(){return[
 ['collector','작은 취향 세 가지',s.owned.filter(id=>good(id)?.tab==='luxury').length,3],
 ['employer','세 곳에 내 이름을',s.owned.filter(id=>good(id)?.tab==='business').length,3],
 ['neighbor','누군가의 하루를 다섯 번',s.good,5],
 ['memories','평범해서 좋은 열 번',s.memories,10],
 ['homeowner','아파트 열쇠',s.home,3]
]}
function checkLifeGoals(){for(const[id,title,value,total]of lifeGoals())if(value>=total)milestone(`goal-${id}`,`삶의 목표 달성 · ${title}`)}
function resale(g){return Math.floor(g.price*(g.tab==='business'?.5:.6))}
function assets(){return s.owned.reduce((a,id)=>a+(good(id)?.sellable?resale(good(id)):0),0)+Math.floor(HOMES[s.home][2]*.8)}
function wealth(){return s.money+assets()+(s.night?.pot||0)-s.debt-s.bills}
function log(t){s.log.unshift(t);s.log=s.log.slice(0,12)}
function save(){s.peak=Math.max(s.peak,wealth());try{localStorage.setItem(KEY,JSON.stringify(s))}catch{if(!saveFailed){saveFailed=true;$('saveWarning').classList.remove('hidden')}}}
function baseBet(){return Math.ceil(mode().base*(1+(s.day-1)*.14)/10)*10}
function bet(){return Math.ceil(baseBet()*Math.pow(modern()?1.35:1.65,(s.night?.table||1)-1)/10)*10}
function loanLimit(){return Math.min(25000,Math.floor((800+assets()*.35)/100)*100)}
function credit(){return s.bills||s.debt&&s.day>=s.due?0:Math.max(0,loanLimit()-s.debt)}
function upkeep(){return mode().living+HOMES[s.home][3]}
function restricted(){return s.bills>0||s.debt>0&&s.day>=s.due}
function required(){return s.bills+(s.debt&&s.day>=s.due?s.debt:0)+baseBet()}
function checkBankruptcy(){if(s.status!=='alive'||s.night)return false;if(s.money+assets()+credit()<required()){s.status='bankrupt';log('더 이상 버틸 자산이 없어 파산했습니다.');save();return true}return false}
function header(){
 $('lifeMoney').textContent=fmt(s.money);$('lastNight').textContent=fmt(s.lastNight);$('bestStreak').textContent=s.bestStreak;$('ownedCount').textContent=s.owned.length;$('lifePath').textContent=s.status==='bankrupt'?'파산':s.good>=10?'이름 없는 후원자':s.home>=4?'높은 곳의 삶':s.debt?'빚 위의 인생':'다시 한 판';
 $('economyBar').innerHTML=`<span>${mode().name} · ${s.day}일째</span><span>${HOMES[s.home][0]} ${HOMES[s.home][1]}</span><span>빚 <b>${fmt(s.debt)}</b>${s.debt?` · ${s.due-s.day>0?s.due-s.day+'일 후 만기':'오늘 만기'}`:''}</span><span>미납 ${fmt(s.bills)}</span>`;
 $('nightBtn').textContent=s.status==='bankrupt'?'새 인생 시작':s.night?'진행 중인 밤 계속':'밤으로 간다';
 $('homeNote').textContent=`순자산 ${fmt(wealth())} · 다음 판돈 ${fmt(baseBet())} · 하루 생활·주거비 ${fmt(upkeep())}. 실제 돈이 아닌 게임머니입니다.`;
}
function show(screen){['homeScreen','nightScreen','dayScreen'].forEach(id=>$(id).classList.toggle('hidden',id!==screen));header()}
function modal(title,body,actions,kicker=''){ $('modalTitle').textContent=title;$('modalBody').innerHTML=body;$('modalKicker').textContent=kicker;$('modalActions').replaceChildren();for(const[label,fn,cls='']of actions){const b=document.createElement('button');b.textContent=label;b.className=cls;b.onclick=fn;$('modalActions').appendChild(b)}$('modal').classList.remove('hidden')}
function closeModal(){$('modal').classList.add('hidden')}
function notice(t,b){modal(t,`<p>${b}</p>`,[['알겠어',closeModal,'primary']])}
function beep(f=440){if(!s.sound)return;try{const c=beep.c||(beep.c=new(window.AudioContext||window.webkitAudioContext)()),o=c.createOscillator(),g=c.createGain();o.frequency.value=f;g.gain.setValueAtTime(.035,c.currentTime);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+.1);o.connect(g).connect(c.destination);o.start();o.stop(c.currentTime+.1)}catch{}}
function bankruptcy(){modal('이번 인생은 여기까지',`<p>현금·처분 가능한 재산·남은 대출 한도로는 미납금, 만기 빚과 최소 판돈을 마련할 수 없습니다.</p><div class="tutorial-box">${s.day}일 생존 · 최고 순자산 ${fmt(s.peak)}<br>남은 빚 ${fmt(s.debt+s.bills)}</div><p>새 인생에서는 재산과 빚이 초기화됩니다. 이번 인생의 기록은 남습니다.</p>`,[['새 인생 시작',newLife,'primary'],['기록 살펴보기',()=>{closeModal();openDay('records')}]],'파산')}
function newLife(){modal('다시 시작할 난이도',`<p>현재 인생을 마치고 현금·물건·집·빚을 초기화합니다. 지난 인생 기록은 유지됩니다.</p><p>하드: 시작 ${fmt(1200)}, 하루 이자 8%<br>지옥: 시작 ${fmt(900)}, 하루 이자 14%</p>`,[['하드로 새 출발',()=>reset('hard'),'primary'],['지옥으로 새 출발',()=>reset('hell')],['취소',closeModal]])}
function reset(m){const history=[{day:s.day,peak:s.peak,mode:mode().name,reason:s.status==='bankrupt'?'파산':'새 출발',good:s.good},...s.history].slice(0,20),sound=s.sound;s=fresh(m,history);s.sound=sound;save();closeModal();show('homeScreen');rules()}
function startNight(){if(s.status==='bankrupt')return bankruptcy();if(s.night){show('nightScreen');renderNight();return resumePhase()}if(checkBankruptcy())return bankruptcy();if(restricted()||s.money<baseBet())return modal('먼저 생활을 정리해야 해',`<p>판돈 ${fmt(baseBet())}가 필요합니다. 미납금이나 만기 대출이 있으면 입장할 수 없습니다.</p><p>은행에서 빚을 갚거나, 중고 판매·주거 다운그레이드로 현금을 마련하세요.</p>`,[['낮의 세계로',()=>{closeModal();openDay('bank')},'primary'],['닫기',closeModal]]);
 const bosses=shuffled(BOSSES.map(b=>b.id));
 s.night={rules:6,table:1,hands:0,roundHands:0,tableScore:0,start:s.money,pot:0,risk:1,streak:0,cards:[null,null,null],locked:[false,false,false],rerolls:0,devices:[],insured:false,phase:'starter',offers:['roseLuck','skullLuck','pairEngine'],result:'',growth:{},pairChain:0,lastSymbol:null,bosses:{3:bosses[0],6:bosses[1]},paid:{},shopRolls:0,cleared:[],played:false};save();show('nightScreen');renderNight();chooseDevice();
}
function shuffled(items){const list=[...items];for(let i=list.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[list[i],list[j]]=[list[j],list[i]]}return list}
function draw(){const weights=Object.entries(symbolWeights());let r=Math.random()*weights.reduce((a,[,w])=>a+w,0);for(const[id,w]of weights){r-=w;if(r<0)return id}return'coin'}
function rerollCost(){return Math.ceil(bet()*(has('cheapDraw')?.1:.25))}
function deal(reroll=false){const n=s.night;if(!n)return startNight();if(s.status!=='alive')return bankruptcy();if(!reroll&&n.phase!=='ready'){renderNight();return resumePhase()}if(reroll&&(n.phase!=='dealt'||n.rerolls>=(has('extraDraw')?2:1)||n.locked.every(Boolean)))return;const cost=reroll?rerollCost():bet();if(s.money<cost)return modal('판돈이 부족해요',`<p>필요한 돈 <b>${fmt(cost)}</b> / 현재 현금 <b>${fmt(s.money)}</b></p><p>귀가한 뒤 대출·중고 판매·집 줄이기로 현금을 마련할 수 있습니다.${n.phase==='dealt'?' 현재 패로 승부할 수도 있습니다.':''}</p>`,[['계속 보기',closeModal],['귀가하기',leave,'primary']]);s.money-=cost;n.played=true;if(!reroll)n.locked=[false,false,false];n.cards=n.cards.map((c,i)=>reroll&&n.locked[i]?c:draw());n.phase='dealt';if(reroll)n.rerolls++;save();renderNight();header();beep(330)}
function toggleLock(i){const n=s.night;if(n?.phase!=='dealt')return;if(!n.locked[i]&&bossFor()?.id==='seal'&&n.locked.some(Boolean))return notice('한 장만 고정할 수 있어요','봉인하는 딜러의 규칙입니다. 고정된 패를 먼저 해제해 주세요.');n.locked[i]=!n.locked[i];save();renderNight()}
function evaluate(){const n=s.night;if(!n||n.phase!=='dealt')return;n.phase='result';const result=handValue(n,n.cards,bet()),{win}=result;n.growth=result.growth;n.pairChain=result.nextPair;if(result.usedInsurance)n.insured=true;n.lastSymbol=win&&result.count>=2?result.symbol:null;n.breakdown=result.notes;n.tableScore+=win;n.result=result.label;
 if(win){n.pot+=win;n.streak++;s.bestStreak=Math.max(s.bestStreak,n.streak);n.phase='choice'}else{n.result+=` · 누적 ${fmt(n.pot)} 소멸`;n.pot=0;n.risk=1;n.streak=0}
 save();renderNight();header();beep(win?760:100);resumePhase();
}
function resumePhase(){const n=s.night;if(!n)return;const details=n.breakdown?.length?`<p class="score-notes">${n.breakdown.join(' → ')}</p>`:'';switch(n.phase){case'choice':return modal(n.result,`<div class="tutorial-box">현재 누적 ${fmt(n.pot)}</div>${details}<p>당첨금에는 원금이 포함됩니다. 한 쌍만으로는 손해일 수도 있습니다.</p><p>챙기면 현금으로 확정. 다시 걸면 다음 배율이 오르지만 꽝에 누적금이 전부 사라집니다. 다음 판돈도 별도로 필요합니다.</p>`,[['돈을 챙긴다',()=>resolveChoice(false),'primary'],['전부 다시 건다',()=>resolveChoice(true)]]);case'result':return modal(n.result,details+'<p>이미 낸 판돈과 다시 뽑기 비용은 돌려받지 못합니다.</p>',[['다음 판',advanceHand,'primary']]);case'starter':case'device':return chooseDevice();case'shop':return renderNightShop();case'checkpoint':return checkpoint();}}
function resolveChoice(risk){const n=s.night;if(n?.phase!=='choice')return;n.phase='resolved';if(risk)n.risk=Math.min(4,Math.round((n.risk+.5+(has('greed')?.25:0))*100)/100);else{s.money+=n.pot;n.pot=0;n.risk=1;n.streak=0}advanceHand()}
function target(){return Math.ceil(bet()*(modern()?GOALS[s.night.table-1]*(s.mode==='hell'?1.2:1):4))}
function advanceHand(){const n=s.night;if(!n||!['resolved','result'].includes(n.phase))return;closeModal();n.hands++;if(modern(n))n.roundHands++;n.cards=[null,null,null];n.locked=[false,false,false];n.rerolls=0;n.phase='ready';if(modern(n)?n.roundHands>=handLimit(n)||n.tableScore>=target():n.hands%3===0)n.phase='checkpoint';save();renderNight();header();resumePhase()}
function checkpoint(){const n=s.night;if(n?.phase!=='checkpoint')return;const passed=n.tableScore>=target();if(passed&&modern(n)&&!n.cleared.includes(n.table)){n.cleared.push(n.table);if(bossFor())milestone(`boss-${bossFor().id}`,`${bossFor().name}를 처음 이긴 밤`);if(n.table===6)milestone('clear-six','마지막 테이블까지 살아 돌아온 밤');save()}
 modal(passed?'테이블 통과':'목표 미달 · 퇴장',`<p>당첨 합계 <b>${fmt(n.tableScore)}</b> / 목표 ${fmt(target())}</p><p>${passed?'다음 테이블의 목표는 더 가파르게 오릅니다. 장치 조합을 준비하세요.':'이번 밤의 도전이 끝났습니다. 현금과 남은 누적금은 정산합니다.'}</p>${modern(n)&&passed?upcomingBossText(n):''}`,passed&&n.table<6?[['밤 상점으로',openNightShop,'primary'],['지금 귀가',endNight]]:[['정산하고 귀가',endNight,'primary']],n.table===6&&passed?'여섯 테이블 완주':`테이블 ${n.table}`)
}
function chooseDevice(){const n=s.night;if(!n||!['starter','device'].includes(n.phase))return;modal(n.phase==='starter'?'오늘 밤의 승부수':'이번 밤의 장치',`<p>세 장의 짝을 맞추는 룰은 같습니다. 첫 장치 하나를 무료로 선택하세요. ${modern(n)?'슬롯은 3개. 다음부터는 밤 상점에서 사고팝니다.':'진행 중이던 밤은 기존 목표로 마무리합니다.'}</p>${upcomingBossText(n)}<div class="choice-grid">${n.offers.filter(id=>device(id)).map(id=>{const d=device(id);return`<button class="choice" data-device="${id}"><small>${d.tag}</small><b>${d.name}</b><small>${d.text}</small></button>`}).join('')}</div>`,[]);bind('device',selectDevice)}
function selectDevice(id){const n=s.night;if(!n||!['starter','device'].includes(n.phase)||!n.offers.includes(id)||has(id))return;n.devices.push(id);n.paid[id]=0;n.offers=[];n.phase='ready';save();closeModal();renderNight()}
function upcomingBossText(n=s.night){if(!modern(n))return'';const table=n.table<3?3:n.table<6?6:6,boss=bossFor(n,table);return boss?`<p class="boss-preview">${table}번 보스 · ${boss.icon} <b>${boss.name}</b><br>${boss.text}<br><small>${boss.hint}</small></p>`:''}
function stock(){const n=s.night,available=shuffled(DEVICES.filter(d=>!has(d.id)).map(d=>d.id));const tags=n.devices.map(id=>device(id)?.tag);const mate=available.find(id=>tags.includes(device(id).tag));return mate?[mate,...available.filter(id=>id!==mate).slice(0,2)]:available.slice(0,3)}
function devicePrice(id){return Math.ceil(baseBet()*device(id).price-1e-9)}
function refreshPrice(){return Math.ceil(baseBet()*.25*(s.night.shopRolls+1))}
function openNightShop(){const n=s.night;if(n?.phase!=='checkpoint'||n.table>=6||n.tableScore<target())return;if(!modern(n)){n.table++;n.tableScore=0;n.phase='device';n.offers=shuffled(DEVICES.slice(9).map(d=>d.id).filter(id=>!has(id))).slice(0,3);save();renderNight();return chooseDevice()}s.money+=n.pot;n.pot=0;n.risk=1;n.streak=0;n.phase='shop';n.shopRolls=0;n.offers=stock();save();header();renderNightShop()}
function renderNightShop(){const n=s.night;if(n?.phase!=='shop')return;modal('새벽의 장치 상점',`<p>현금 <b>${fmt(s.money)}</b> · 장치 ${n.devices.length}/3 · 이번 밤 한정<br>누적금은 입장할 때 현금으로 확정했습니다. 다음 판돈 ${fmt(Math.ceil(baseBet()*Math.pow(1.35,n.table)/10)*10)}도 남겨두세요.</p>${upcomingBossText(n)}<div class="night-shop-grid">${n.offers.map(id=>{const d=device(id);return`<article class="shop-card"><small>${d.tag}</small><h3>${d.name}</h3><p>${d.text}</p><button data-nightbuy="${id}" ${n.devices.length>=3||s.money<devicePrice(id)?'disabled':''}>${n.devices.length>=3?'슬롯이 가득 참':`${fmt(devicePrice(id))} 구입`}</button></article>`}).join('')||'<p>진열된 장치를 모두 구입했습니다.</p>'}</div><h3>내 장치 · 판매하면 슬롯 확보</h3><div class="owned-devices">${n.devices.map(id=>`<button data-nightsell="${id}">${device(id).name} · ${fmt(Math.floor((n.paid[id]||0)*.5))} 판매</button>`).join('')||'아직 장치가 없습니다.'}</div><p>무료 장치 판매가는 0원. 구입한 장치는 지불한 가격의 50%에 판매합니다.</p>`,[['다음 테이블',nextTable,'primary'],[`진열 새로고침 ${fmt(refreshPrice())}`,refreshStock],['오늘은 귀가',endNight]],`테이블 ${n.table} 통과`);bind('nightbuy',buyDevice);bind('nightsell',sellDevice)}
function buyDevice(id){const n=s.night;if(n?.phase!=='shop'||!n.offers.includes(id)||has(id)||n.devices.length>=3)return;const price=devicePrice(id);if(s.money<price)return;s.money-=price;n.devices.push(id);n.paid[id]=price;n.offers=n.offers.filter(x=>x!==id);save();header();renderNightShop()}
function sellDevice(id){const n=s.night;if(n?.phase!=='shop'||!has(id))return;const price=Math.floor((n.paid[id]||0)*.5);modal(`${device(id).name} 판매`, `<p>${fmt(price)}을 받고 장치를 제거합니다. 이번 밤 동안 쌓은 성장치는 유지되지만 장치를 갖고 있어야 효과가 적용됩니다.</p>`,[['판매한다',()=>{if(n!==s.night||n.phase!=='shop'||!has(id))return;s.money+=price;n.devices=n.devices.filter(x=>x!==id);delete n.paid[id];save();header();renderNightShop()},'primary'],['취소',renderNightShop]])}
function refreshStock(){const n=s.night;if(n?.phase!=='shop')return;const price=refreshPrice();if(s.money<price)return modal('새로고침 비용 부족',`<p>${fmt(price)}이 필요합니다.</p>`,[['상점으로',renderNightShop,'primary']]);s.money-=price;n.shopRolls++;n.offers=stock();save();header();renderNightShop()}
function nextTable(){const n=s.night;if(n?.phase!=='shop')return;n.table++;n.roundHands=0;n.tableScore=0;n.lastSymbol=null;n.phase='ready';n.offers=[];save();closeModal();renderNight()}
function leave(){if(!s.night)return;if(!['ready','dealt'].includes(s.night.phase))return resumePhase();modal('오늘 밤을 마칠까요?',`<p>${s.night.phase==='dealt'?'아직 승부하지 않은 패를 포기하면 현재 누적금도 모두 잃습니다. 승부 후 귀가할 수도 있습니다.':'남은 누적금은 현금으로 챙깁니다.'} 이미 낸 판돈은 반환되지 않습니다.</p><p>한 번이라도 패를 뽑았으면 하루가 지나고 생활비·주거비 ${fmt(upkeep())}, 대출 이자 및 사업 결산이 적용됩니다.</p>`,[['밤에 남는다',closeModal],['정산하고 귀가',endNight,'primary']])}
function endNight(){const n=s.night;if(!n)return;const played=n.played||n.hands>0;if(n.phase==='dealt')n.pot=0;s.money+=n.pot;const gambling=s.money-n.start;s.lastNight=gambling;s.night=null;let body=`<p>도박 손익 <b>${fmt(gambling)}</b></p>`;
 if(played){s.day++;let business=0;const rows=[];for(const id of s.owned){const g=good(id);if(g?.tab!=='business')continue;const r=Math.random(),factor=r<.25?0:r<.65?1:1.6,net=Math.floor(g.revenue*factor)-g.expense;business+=net;rows.push(`${g.name}: ${factor===0?'휴업':factor===1?'평일':'성황'} ${fmt(net)}`)}
 const interest=Math.ceil(s.debt*mode().interest);s.debt+=interest;const costs=upkeep();const balance=s.money+business-costs;s.money=Math.max(0,balance);s.bills+=Math.max(0,-balance);body+=`<p>사업 순손익 ${fmt(business)}<br>생활·주거비 -${fmt(costs)}<br>대출에 붙은 이자 +${fmt(interest)}</p>${rows.length?`<details><summary>사업 결산 내역</summary><p>${rows.join('<br>')}</p></details>`:''}`;log(`${s.day}일 아침 · 도박 ${fmt(gambling)}, 사업 ${fmt(business)}, 생활비 ${fmt(costs)}`);
 }else body+='<p>플레이하지 않아 날짜·생활비·사업 결산은 그대로입니다.</p>';
 save();closeModal();show('homeScreen');if(checkBankruptcy())return bankruptcy();modal('아침의 계산서',body+`<div class="tutorial-box">현금 ${fmt(s.money)} · 빚 ${fmt(s.debt)}<br>미납금 ${fmt(s.bills)}</div>${restricted()?'<p class="danger">미납금·만기 대출을 해결해야 다음 밤에 입장할 수 있습니다.</p>':''}`,[['낮의 세계로',()=>{closeModal();openDay(restricted()?'bank':'luxury')},'primary'],['현관으로',closeModal]],`${s.day}일째`)
}
function renderNight(){const n=s.night;if(!n)return;$('tableLabel').textContent=`${n.table} / 6`;$('chipLabel').textContent=fmt(s.money);$('potLabel').textContent=fmt(n.pot);$('riskLabel').textContent=`×${n.risk}`;$('betAmount').textContent=fmt(bet());$('deviceCount').textContent=`${n.devices.length} / ${modern(n)?3:5}`;
 $('deviceRack').innerHTML=n.devices.length?n.devices.map(id=>{const d=DEVICES.find(x=>x.id===id);return`<div class="device"><b>${d.name}</b><small>${d.text}</small></div>`}).join(''):'<span class="empty">3판 안에 목표를 채우면 장치를 고릅니다</span>';
 $('dealerLine').textContent=`남은 승부 ${Math.max(0,handLimit(n)-handIndex(n))}회 · 당첨 합계 ${fmt(n.tableScore)} / 목표 ${fmt(target())}`;
 $('runTrack').innerHTML=Array.from({length:6},(_,i)=>`<span class="${n.table===i+1?'current':''}">${i+1}${bossFor(n,i+1)?' ♠':''}${n.cleared?.includes(i+1)?' ✓':''}</span>`).join('');
 const boss=bossFor(n);$('bossBanner').innerHTML=boss?`<b>${boss.icon} ${boss.name}</b><br>${boss.text}<small>${boss.hint}</small>`:modern(n)?upcomingBossText(n):'기존 밤 이어하기 · 다음 밤부터 조합 모드 적용';
 const weights=symbolWeights(n),total=Object.values(weights).reduce((a,b)=>a+b,0);$('drawOdds').textContent='현재 뽑기 확률 · '+Object.entries(weights).map(([id,w])=>`${SYMBOLS[id].name} ${(w/total*100).toFixed(1)}%`).join(' / ');
 if(n.phase==='dealt'){const result=handValue(n,n.cards,bet());$('handPreview').innerHTML=`<b>이 패로 승부하면 ${fmt(result.win)}</b><br><small>${result.notes.join(' → ')}</small>`}else $('handPreview').textContent=n.phase==='ready'?'원하는 그림을 고정하고 나머지를 다시 뽑으세요.':'선택을 마치면 다음 승부가 시작됩니다.';
 document.querySelectorAll('.slot').forEach((el,i)=>{const c=n.cards[i];el.classList.toggle('locked',n.locked[i]);el.disabled=n.phase!=='dealt';el.querySelector('i').textContent=c?SYMBOLS[c].icon:'?';el.querySelector('b').textContent=c?SYMBOLS[c].name:'?';el.querySelector('.lock-label').textContent=n.locked[i]?'고정됨':'누르면 고정'});
 $('dealBtn').classList.toggle('hidden',n.phase!=='ready');$('rerollBtn').classList.toggle('hidden',n.phase!=='dealt'||n.rerolls>=(has('extraDraw')?2:1));$('rerollBtn').disabled=n.locked.every(Boolean)||s.money<rerollCost();$('settleBtn').classList.toggle('hidden',n.phase!=='dealt');$('rerollCost').textContent=fmt(rerollCost());
}
function openDay(tab='luxury'){if(s.night)return startNight();currentTab=tab;show('dayScreen');renderDay()}
function card(icon,title,text,buttons=''){return`<article class="shop-card"><span class="icon">${icon}</span><h3>${title}</h3><p>${text}</p>${buttons}</article>`}
function btn(attr,label,disabled=false){return`<button ${attr} ${disabled?'disabled':''}>${label}</button>`}
function bind(attr,fn){document.querySelectorAll(`[data-${attr}]`).forEach(b=>b.onclick=()=>fn(b.dataset[attr]))}
function renderDay(){header();document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===currentTab));const intro={luxury:'멋은 영원하지 않아도, 중고값은 남습니다. 소장품은 구입가의 60%에 판매.',donation:'돌려받을 수 없는 돈. 대신 누군가의 하루에 남습니다.',business:'하루에 한 번 결산. 휴업 25%·평일 40%·성황 35%. 휴업에도 운영비 발생. 매각가는 50%.',small:'한 번의 기억으로 남는 소비. 소비한 경험은 되팔 수 없습니다.',room:'현재 집과 소장품. 어려울 때는 중고 시장에서 정리할 수 있습니다.',bank:'대출은 추가 소득이 아닙니다. 5번의 밤이 지나면 전액 상환. 추가 대출로 만기를 연장할 수 없습니다.',housing:'현재 집을 80%에 처분하고 새 집 값을 냅니다. 집을 줄이면 차액을 받습니다. 이사 왕복에는 손실이 생깁니다.',resale:'물건은 60%, 사업은 50%에 매각. 기부와 소비한 경험은 판매 불가.',records:'파산해도 지난 인생의 기록은 남습니다. 저장은 현재 브라우저에만 보관됩니다.'};$('dayIntro').textContent=intro[currentTab];$('shopGrid').className='shop-grid';const dead=s.status!=='alive';
 if(currentTab==='bank'){
 $('shopGrid').innerHTML=card('🏦','대출 창구',`현재 빚 ${fmt(s.debt)}<br>하루 복리 ${mode().interest*100}% · 만기 ${s.debt?s.due+'일째':'대출 후 5일'}<br>추가 가능 ${fmt(credit())}<br>이자는 밤을 플레이하고 귀가할 때 붙습니다.`,[...new Set([200,500,1000,credit()])].filter(v=>v>0).map(v=>btn(`data-borrow="${v}"`,`${fmt(v)} 빌리기`,dead||credit()<v)).join(''))+card('🧾','빚과 미납금',`대출 ${fmt(s.debt)} · 미납 ${fmt(s.bills)}<br>오늘 반드시 갚을 금액 ${fmt(s.bills+(s.debt&&s.day>=s.due?s.debt:0))}`,btn('data-pay="bills"','미납금부터 납부',dead||!s.bills||!s.money)+btn('data-pay="200"','대출 ₩200 상환',dead||!s.debt||!s.money)+btn('data-pay="all"','가능한 만큼 상환',dead||!s.debt||!s.money));bind('borrow',v=>borrow(Number(v)));bind('pay',pay);return;
 }
 if(currentTab==='housing'){$('shopGrid').innerHTML=HOMES.map(([icon,name,price,fee],i)=>{const delta=price-Math.floor(HOMES[s.home][2]*.8);return card(icon,name,`매입가 ${fmt(price)}<br>하루 주거비 ${fmt(fee)}${i===s.home?'<br><b>현재 거주 중</b>':`<br>${delta>=0?'이사에 필요한 돈':'이사 후 받는 돈'} ${fmt(Math.abs(delta))}`}`,btn(`data-home="${i}"`,i===s.home?'현재 집':i<s.home?'집 줄이기':'이사하기',dead||i===s.home||delta>s.money||i>s.home&&restricted()))}).join('');bind('home',v=>confirmHome(Number(v)));return}
 if(currentTab==='records'){$('shopGrid').innerHTML=card('📓','이번 인생',`${mode().name} · ${s.day}일 · 최고 ${fmt(s.peak)}<br>선행 ${s.good} · 추억 ${s.memories}<br>${s.log.join('<br>')}`,btn('id="newLifeBtn"','새 인생 시작'))+card('✦','이번 인생에 남은 장면',s.events.map(e=>`${e.day}일 · ${e.text}`).join('<br>')||'첫 집, 첫 사업, 빚을 갚은 날… 앞으로 남길 장면들입니다.')+card('🎯','삶의 수집 목표',lifeGoals().map(([id,title,value,total])=>`${s.milestones.includes('goal-'+id)?'✓':'○'} ${title} · ${Math.min(value,total)}/${total}`).join('<br>'))+s.history.map((h,i)=>card('🕯️',`${s.history.length-i}번째 지난 인생`,`${h.mode} · ${h.day}일 생존<br>최고 순자산 ${fmt(h.peak)}<br>${h.reason} · 선행 ${h.good}`)).join('');$('newLifeBtn').onclick=newLife;return}
 if(currentTab==='room'){$('shopGrid').innerHTML=card(HOMES[s.home][0],HOMES[s.home][1],`하루 주거비 ${fmt(HOMES[s.home][3])}<br>추억 ${s.memories} · 선행 ${s.good}`)+s.owned.map(id=>{const g=good(id);return card(g.icon,g.name,g.text)}).join('');return}
 const list=currentTab==='resale'?GOODS.filter(g=>g.sellable&&owns(g.id)):GOODS.filter(g=>g.tab===currentTab);
 $('shopGrid').innerHTML=list.length?list.map(g=>{const owned=owns(g.id),sale=currentTab==='resale',effect=g.tab==='business'?`<br>평일 순익 ${fmt(g.revenue-g.expense)} · 휴업 손실 ${fmt(g.expense)}<br>성황 순익 ${fmt(Math.floor(g.revenue*1.6)-g.expense)}`:'';return card(g.icon,g.name,`${g.text}${effect}<br><b>${sale?'판매가':'가격'} ${fmt(sale?resale(g):g.price)}</b>${s.counts[g.id]?`<br>기록 ${s.counts[g.id]}회`:''}`,sale?btn(`data-sell="${g.id}"`,'판매하기',dead):btn(`data-buy="${g.id}"`,owned?'보유 중':restricted()?'미납·만기 빚 먼저 해결':'구입하기',dead||owned||s.money<g.price||restricted()))}).join(''):'<p>지금 판매할 물건이 없습니다. 주거 탭에서 집을 줄일 수도 있습니다.</p>';bind('buy',buy);bind('sell',sell);
}
function afterAction(){checkLifeGoals();save();renderDay();if(checkBankruptcy())bankruptcy()}
function buy(id){const g=good(id);if(!g||s.status!=='alive'||s.night||restricted()||s.money<g.price||owns(id))return;s.money-=g.price;if(g.repeat)s.counts[id]=(s.counts[id]||0)+1;else s.owned.push(id);if(g.tab==='business')milestone('first-employee','첫 사업을 열었다. 이제 내 승부 말고도 책임질 일이 생겼다.');if(g.tab==='donation')s.good++;if(g.tab==='small')s.memories++;log(`${g.name} ${fmt(g.price)} ${g.repeat?'소비':'구입'}`);afterAction();if(s.status==='alive')notice(g.name,g.text)}
function sell(id){const g=good(id);if(!g?.sellable||!owns(id)||s.status!=='alive'||s.night)return;modal(`${g.name} 판매`, `<p>구입가 ${fmt(g.price)} → 중고 판매가 <b>${fmt(resale(g))}</b></p><p>${g.tab==='business'?'매각하면 이 사업의 수입과 운영비도 사라집니다.':'나중에 다시 살 때는 원래 가격을 내야 합니다.'}</p>`,[['판매한다',()=>{if(!owns(id))return;s.owned=s.owned.filter(x=>x!==id);s.money+=resale(g);if(id==='car')milestone('sold-car','스포츠카 열쇠를 건넸다. 화려했던 밤은 기억에 남았다.');log(`${g.name}을 ${fmt(resale(g))}에 판매`);closeModal();afterAction()},'primary'],['취소',closeModal]])}
function confirmHome(i){if(!HOMES[i]||i===s.home||s.status!=='alive'||s.night)return;const delta=HOMES[i][2]-Math.floor(HOMES[s.home][2]*.8);if(delta>s.money||i>s.home&&restricted())return;modal(`${HOMES[i][1]} 이사`, `<p>${delta>=0?'지출':'회수'} ${fmt(Math.abs(delta))}<br>하루 주거비 ${fmt(HOMES[s.home][3])} → ${fmt(HOMES[i][3])}</p>`,[['이사한다',()=>{s.money-=delta;if(i<s.home)milestone('smaller-home','집을 줄여 다시 버틸 돈을 마련했다.');if(i>0)milestone('first-home','내 이름으로 된 첫 집의 문을 열었다.');s.home=i;log(`${HOMES[i][1]} 이사`);closeModal();afterAction()},'primary'],['취소',closeModal]])}
function borrow(amount){if(s.status!=='alive'||s.night||credit()<amount)return;modal('대출 계약 확인',`<p>${fmt(amount)}를 빌립니다. 하루 복리 ${mode().interest*100}%.</p><p>상환일: <b>${s.debt?s.due:s.day+5}일째</b>. 만기에는 남은 원금과 이자를 모두 갚아야 합니다. 재대출로 만기는 늘어나지 않습니다.</p>`,[['빌린다',()=>{if(credit()<amount)return;if(!s.debt)s.due=s.day+5;s.debt+=amount;s.money+=amount;log(`${fmt(amount)} 대출 · ${s.due}일 만기`);closeModal();afterAction()},'primary'],['취소',closeModal]])}
function pay(kind){if(s.status!=='alive'||s.night)return;const field=kind==='bills'?'bills':'debt',amount=Math.min(s.money,s[field],kind==='200'?200:Infinity);s.money-=amount;s[field]-=amount;if(!s.debt){s.due=0;if(field==='debt'&&amount>0)milestone('debt-free','마지막 빚을 갚고 영수증을 접었다.')}log(`${field==='bills'?'미납금':'대출'} ${fmt(amount)} 상환`);afterAction()}
function rules(){modal('세 장으로 만드는 나만의 승부',`<div class="tutorial-box">같은 그림 2개 = 한 쌍 · 3개 = 트리플<br>장치 3개를 조합해 여섯 테이블 돌파</div><p>① 밤에 들어가 첫 장치 하나를 무료 선택.<br>② 패를 고정하고 유료 다시 뽑기. 승부 전 예상 지급액 확인.<br>③ 목표를 채우면 밤 상점에서 장치 구입·판매.</p><p>초반 두 테이블은 4회, 이후는 3회 승부. 목표를 일찍 채우면 바로 통과합니다. 판돈 대비 목표는 3 → 4.5 → 6.5 → 9 → 12 → 16배로 상승합니다. 지옥에서는 목표가 추가로 20% 높습니다.</p><p>3·6번 보스의 규칙은 미리 표시됩니다. 장미 성장, 해골 트리플, 연속 한 쌍 등 장치 조합을 준비하세요. 장치는 귀가할 때 사라지며, 무료 장치 판매가는 0원입니다.</p><p>당첨금은 원금 포함. 꽝에 다시 건 누적금이 사라집니다. 보스를 포함한 최종 계산은 패 아래에 표시됩니다. 뽑기 확률도 공개되며 몰래 바뀌지 않습니다.</p><p>플레이 후 귀가하면 생활비·집 유지비·사업 결산·대출 이자가 적용됩니다. 어려우면 물건을 팔거나 집을 줄여 버티세요. 매 행동 자동 저장, 실제 결제·대출 없음.</p>`,[['알겠어',closeModal,'primary']],'조합 모드 v6')}
 $('nightBtn').onclick=startNight;$('dayBtn').onclick=()=>openDay();$('homeBtn').onclick=()=>s.night?leave():(closeModal(),show('homeScreen'));$('backHomeBtn').onclick=()=>show('homeScreen');$('rulesBtn').onclick=rules;$('dealBtn').onclick=()=>deal();$('rerollBtn').onclick=()=>deal(true);$('settleBtn').onclick=evaluate;$('leaveNightBtn').onclick=leave;
 document.querySelectorAll('[data-slot]').forEach(b=>b.onclick=()=>toggleLock(Number(b.dataset.slot)));bind('tab',v=>{currentTab=v;renderDay()});$('soundBtn').onclick=()=>{s.sound=!s.sound;save();beep(650)};
 save();show('homeScreen');if(s.night)startNight();else if(s.status==='bankrupt')bankruptcy();else if(!stored){modal('이번에는 진짜 내 돈으로',`<p>무료 칩이 매번 생기던 시대는 끝났습니다. 시작금 ${fmt(s.money)}으로 버텨보세요.</p><p>대출·파산·중고 판매·주거 이사가 추가되었습니다. 이전 버전 저장은 삭제하지 않고 별도로 보존했습니다. 새 경제에는 이전 재산을 합산하지 않습니다.</p>`,[['하드로 시작',()=>{closeModal();rules()},'primary'],['지옥으로 시작',()=>{s=fresh('hell');save();header();rules()}]],'인생 모드 v5')}
 if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
})();
