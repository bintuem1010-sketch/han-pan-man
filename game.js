/* 한 판만 v10 — virtual currency only. Economic actions are synchronous and saved atomically. */
(()=>{'use strict';
const $=id=>document.getElementById(id), fmt=n=>`${n<0?'-':''}₩${Math.abs(Math.round(n)).toLocaleString('ko-KR')}`;
// Old installed pages may receive new JS before their HTML refreshes.
// Recover before touching state or charging a stake; never delete saves.
if(!['betAmount','economyBar','homeNote','saveWarning','bossBanner','runTrack','handPreview','lifeStatus','stakeControls','bagRack','goalBar','baccaratContent','cashForecast','buildSummary'].every(id=>$(id))){
 const recovery=new URL('index.html',location.href);recovery.searchParams.set('v','10');
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
BOSSES.push({id:'hush',name:'침묵의 첫 패',icon:'🤫',text:'이 테이블의 첫 승부에는 다시 뽑기를 할 수 없습니다.',hint:'물감이나 첫 패 강화 장치를 준비하세요.'},{id:'cold',name:'차가운 악수',icon:'🧊',text:'이 테이블 첫 승부의 짝 당첨과 점수를 절반으로.',hint:'첫 판에 기간제 효과를 모두 쓰기보다 다음 승부를 준비하세요.'});
const GOALS=[3,4.5,6.5,9,12,16];
const ROOMS={normal:{name:'일반 홀',stake:1,goal:1,triple:1,max:5},vip:{name:'VIP 룸',stake:5,goal:1.2,triple:1.5,max:10},secret:{name:'심야 비밀방',stake:20,goal:1.5,triple:2,max:20}};
const EXTRA_ITEMS=[
 ['coinMint','작은 조폐기','금화 당첨 기본 배당 +0.4','금화',1.4,'core',0],
 ['coinScales','황금 저울','금화 당첨 ×1.8, 다른 당첨 ×0.7','금화',1.8,'core',0],
 ['rosePair','두 송이 꽃병','장미 한 쌍 기본 배당 +0.8','장미',1.4,'core',0],
 ['skullPair','쌍둥이 해골','해골 한 쌍 기본 배당 +1.2','해골',1.6,'core',0],
 ['lastBank','마지막 금고','테이블 마지막 승부의 당첨금 ×1.5','도구',1.5,'core',0],
 ['oddStack','실패 수첩','전부 다른 패마다 이후 짝 배당 +0.25, 최대 +2','한 쌍',1.4,'core',0],
 ['roseIncense','붉은 향','장미 가중치 +40 · 3판','장미',.8,'timed',3],
 ['skullIncense','검은 향','해골 가중치 +40 · 3판','해골',1,'timed',3],
 ['goldenHour','황금 시간','금화 당첨 ×2 · 3판','금화',1.2,'timed',3],
 ['fever','열병','모든 당첨 ×1.5 · 2판','위험',1,'timed',2],
 ['loanAmulet','빚쟁이의 부적','빚이 있으면 짝 당첨 ×1.8 · 3판. 구매하면 이번 밤 신용대출 이자 +5%p','위험',1,'timed',3],
 ['rentedCrown','빌린 왕관','짝 당첨 ×2 · 3판. 전부 다른 패면 즉시 소멸','위험',1.5,'timed',3],
 ['crackedMirror','금 간 거울','한 쌍의 기본 배당을 트리플 배당으로 · 2회','한 쌍',2.4,'durable',2],
 ['tripleGlass','불안한 렌즈','트리플 당첨 ×2 · 3회','트리플',2.5,'durable',3],
 ['emergencyPolicy','응급 보험','전부 다른 패에 판돈 반환 · 1회','도구',1,'durable',1],
 ['finalMatch','마지막 불씨','마지막 승부의 짝 당첨 ×3 · 1회','위험',1.8,'durable',1],
 ['safetyNet','작은 안전망','꽝에 판돈의 50% 반환 · 3회','도구',1.3,'durable',3],
 ['skullBell','해골 종','해골 당첨 ×2 · 3회','해골',2,'durable',3],
 ['rosePaint','붉은 물감','패 한 장을 장미로 변경','소모품',.9,'consumable',1],
 ['skullPaint','검은 물감','패 한 장을 해골로 변경','소모품',1.4,'consumable',1],
 ['coinPaint','금빛 물감','패 한 장을 금화로 변경','소모품',.6,'consumable',1],
 ['dealerGlove','딜러의 장갑','이번 판의 보스 규칙 무시','소모품',.9,'consumable',1],
 ['repairKit','수리 키트','내구도 장치 하나를 완전히 수리','소모품',1.2,'consumable',1],
 ['extension','연장선','기간제 장치 하나 +2판, 최대 5판','소모품',.8,'consumable',1],
 ['doubleTicket','두 배 표','이번 판의 지급액 ×2','소모품',1.5,'consumable',1],
 ['redrawTicket','추가 뽑기권','이번 판 유료 다시 뽑기 한도 +1회','소모품',.5,'consumable',1]
].map(([id,name,text,tag,price,kind,life])=>({id,name,text,tag,price,kind,life}));
DEVICES.forEach(d=>{d.kind='core';d.life=0});DEVICES.push(...EXTRA_ITEMS);
function expanded(n=s.night){return n?.rules>=8}
function active(id,n=s.night){return !!n?.devices.includes(id)&&(device(id)?.kind!=='durable'||(n.itemLife?.[id]??device(id).life)>0)}
function room(n=s.night){return ROOMS[n?.room]||ROOMS.normal}
function tableBase(n=s.night){return Math.ceil(baseBet()*Math.pow(modern(n)?1.35:1.65,(n?.table||1)-1)*(expanded(n)?room(n).stake:1)/10)*10}
function lifeLabel(id,n=s.night){const d=device(id);return d.kind==='timed'?`앞으로 ${(n.itemLife?.[id]??d.life)}판`:d.kind==='durable'?((n.itemLife?.[id]??d.life)>0?`발동 ${n.itemLife?.[id]??d.life}회 남음`:'고장 · 수리 필요'):d.kind==='consumable'?'원할 때 1회 사용':'이번 밤 유지'}
function totalDebt(){return s.debt+s.loans.reduce((sum,l)=>sum+l.balance,0)}
function businessLevel(id){return s.businessLevels[id]||1}
function businessCapital(id){const g=good(id),level=businessLevel(id);return g.price*(level===3?4:level===2?2:1)}
function businessStats(g){const level=businessLevel(g.id);return {revenue:Math.floor(g.revenue*[0,1,2.2,4.8][level]*businessStyle(g.id).revenue),expense:Math.floor(g.expense*[0,1,2,4.2][level]*businessStyle(g.id).expense)}}
function pledged(target){return s.loans.some(l=>l.target===target)}
function collateralValue(target){return target==='home'?Math.floor(HOMES[s.home][2]*.8):owns(target)?resale(good(target)):0}
function lockedAssets(){return s.loans.filter(l=>l.target).reduce((v,l)=>v+Math.min(l.balance,collateralValue(l.target)),0)}
const device=id=>DEVICES.find(d=>d.id===id);
function modern(n=s.night){return n?.rules>=6}
function bossFor(n=s.night,table=n?.table){return modern(n)&&!(expanded(n)&&n.ignoreBoss&&table===n.table)?BOSSES.find(b=>b.id===n.bosses?.[table]):null}
function handLimit(n=s.night){return modern(n)?(n.table<=2?4:3):3}
function handIndex(n=s.night){return modern(n)?n.roundHands:n.hands%3}
function symbolWeights(n=s.night){return Object.fromEntries(Object.entries(SYMBOLS).map(([id,v])=>[id,v.weight+(id==='rose'&&active('roseLuck',n)?(modern(n)?24:14):0)+(id==='skull'&&active('skullLuck',n)?20:0)+(id==='rose'&&active('roseIncense',n)?40:0)+(id==='skull'&&active('skullIncense',n)?40:0)]))}
function handValue(n,cards,stake){
 const equipped=id=>active(id,n),counts={};cards.forEach(c=>counts[c]=(counts[c]||0)+1);
 const [symbol,count]=Object.entries(counts).sort((a,b)=>b[1]-a[1])[0];
 let mult=count===3?SYMBOLS[symbol].triple:count===2?SYMBOLS[symbol].pair:0;
 const notes=[`기본 배당 ×${mult}`],growth={...n.growth},nextPair=count===2?(n.pairChain||0)+1:0,usedCharges=[];let usedInsurance=false;
 function factor(value,name){mult*=value;notes.push(`${name} ×${Number(value.toFixed(2))}`)}
 function add(value,name){mult+=value;notes.push(`${name} +${value}`)}
 if(expanded(n)){
  if(count===2&&equipped('crackedMirror')){add(SYMBOLS[symbol].triple-SYMBOLS[symbol].pair,'금 간 거울');usedCharges.push('crackedMirror')}
  if(count>=2&&symbol==='coin'&&equipped('coinMint'))add(.4,'작은 조폐기');
  if(count===2&&symbol==='rose'&&equipped('rosePair'))add(.8,'두 송이 꽃병');
  if(count===2&&symbol==='skull'&&equipped('skullPair'))add(1.2,'쌍둥이 해골');
  if(equipped('oddStack')){if(count>=2)add(Math.min(2,(growth.oddMiss||0)*.25),'실패 수첩');else growth.oddMiss=Math.min(8,(growth.oddMiss||0)+1)}
 }
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
 if(expanded(n)&&count>=2){
  if(equipped('coinScales'))factor(symbol==='coin'?1.8:.7,'황금 저울');
  if(symbol==='coin'&&equipped('goldenHour'))factor(2,'황금 시간');
  if(equipped('loanAmulet')&&totalDebt()>0)factor(1.8,'빚쟁이의 부적');
  if(equipped('rentedCrown'))factor(2,'빌린 왕관');
  if(count===3){factor(roomCashBonus(n),room(n).name);if(equipped('tripleGlass')){factor(2,'불안한 렌즈');usedCharges.push('tripleGlass')}}
  if(symbol==='skull'&&equipped('skullBell')){factor(2,'해골 종');usedCharges.push('skullBell')}
  if(handIndex(n)===handLimit(n)-1){if(equipped('lastBank'))factor(1.5,'마지막 금고');if(equipped('finalMatch')){factor(3,'마지막 불씨');usedCharges.push('finalMatch')}}
 }
 if(!mult&&equipped('emergencyPolicy')){mult=1;usedCharges.push('emergencyPolicy');notes.push('응급 보험 ×1')}
 if(!mult&&equipped('safetyNet')){mult=.5;usedCharges.push('safetyNet');notes.push('작은 안전망 ×0.5')}
 if(!mult&&equipped('oddWin')){mult=.2;notes.push('표지판 반환 ×0.2')}
 if(!mult&&equipped('insurance')&&!n.insured){usedInsurance=true;mult=1;notes.push('보험 반환 ×1')}
 if(modern(n)&&mult>0){if(equipped('steadyHands')&&!n.rerolls)factor(1.3,'흔들리지 않는 손');if(equipped('lastShot')&&handIndex(n)===handLimit(n)-1)factor(2,'최후의 성냥')}
 if(expanded(n)&&mult>0){if(equipped('fever'))factor(1.5,'열병');if(n.doubleTicket)factor(2,'두 배 표')}
 if(frontier(n)&&count>=2){factor(.75,'현금 지급 계수');factor(ROUTES[n.route]?.cash||1,'선택한 길')}
 let win=Math.floor((stake*mult*n.risk)+1e-8);if(n.risk!==1)notes.push(`다시 걸기 ×${n.risk}`);
 const boss=bossFor(n);if(win>0&&boss?.id==='cold'&&handIndex(n)===0&&count>=2){win=Math.floor(win*.5);notes.push('차가운 악수 ×0.5')}
 if(win>0&&boss?.id==='obsession'&&count>=2&&n.lastSymbol===symbol){win=Math.floor(win/2);notes.push('집착하는 딜러 ×0.5')}
 if(win>0&&boss?.id==='tax'&&count<3){const tax=Math.ceil(stake*.4);win=Math.max(0,win-tax);notes.push(`세금 -${tax}`)}
 return{win,symbol,count,growth,nextPair,usedInsurance,usedCharges,notes,label:count===3?`${SYMBOLS[symbol].name} 트리플!`:count===2?`${SYMBOLS[symbol].name} 한 쌍`:win?'장치가 손실을 줄였습니다':'꽝'};
}
// id, category, icon, name, purchase price, description; businesses also carry revenue/expenses.
const GOODS=[
 ['teapot','luxury','🫖','도자기 찻잔 세트',320,'비 오는 날 차를 우립니다.'],['rug','luxury','🧶','손으로 짠 러그',580,'차가운 바닥에 작은 섬이 생겼습니다.'],['sneakers','luxury','👟','한정판 운동화',1300,'신을지 전시할지부터 고민입니다.'],['espresso','luxury','🫗','에스프레소 머신',1600,'아침의 의식이 조금 비싸졌습니다.'],['guitar','luxury','🎸','빈티지 기타',2600,'오래된 나무에 누군가의 노래가 남았습니다.'],['aquarium','luxury','🐠','열대어 수조',3400,'거실 안의 작은 바다.'],['projector','luxury','📽️','홈 시네마',5200,'영화가 끝나도 집에 갈 필요가 없습니다.'],['librarywall','luxury','📚','벽 가득한 서재',7200,'다 읽지 못해도 괜찮은 사치.'],['arcade','luxury','🕹️','추억의 오락기',9800,'동전 소리까지 추억입니다.'],['wine','luxury','🍷','빈티지 와인 셀러',14500,'좋은 날을 기다리는 병들.'],['sculpture','luxury','🗿','작은 조각 컬렉션',21000,'설명은 못 해도 마음에 듭니다.'],['garden','luxury','🌳','개인 온실',28000,'계절을 조금 미뤄두었습니다.'],['classiccar','luxury','🚘','수집용 클래식카',42000,'속도보다 이야기를 샀습니다.'],['hometheater','luxury','🎬','개인 상영관',58000,'오늘의 관객은 한 명.'],['grandpiano','luxury','🎼','콘서트 그랜드 피아노',76000,'연주 실력은 별도입니다.'],['supercar','luxury','🏁','희귀 슈퍼카',110000,'차고의 풍경이 달라졌습니다.'],['artvault','luxury','🏛️','작은 개인 미술관',165000,'문을 열어 두면 동네 아이들이 들어옵니다.'],['island','luxury','🏝️','작은 개인 섬',350000,'수평선까지 내 취향입니다.'],
 ['flowers','business','💐','동네 꽃집',2100,'기념일을 기억하는 사람들이 찾아옵니다.',175,105],['bakery','business','🥐','새벽 빵집',3600,'남들보다 먼저 하루를 시작합니다.',300,185],['bookshop','business','📖','독립 서점',6000,'베스트셀러보다 주인 취향이 강합니다.',490,310],['foodtruck','business','🚚','푸드트럭',9500,'손님이 있는 곳으로 움직입니다.',780,490],['workshop','business','🪚','작은 가구 공방',18000,'나무 먼지와 주문서가 쌓입니다.',1450,920],['gamecompany','business','🎮','인디 게임 회사',26000,'출시일은 정했지만 버그는 남았습니다.',2100,1380],['farm','business','🌱','스마트 농장',42000,'날씨보다 전기료를 걱정합니다.',3300,2200],['logistics','business','📦','물류 센터',90000,'도시가 잠들어도 물건은 움직입니다.',7000,4700],
 ['school','donation','🎒','아이들의 새 가방',900,'첫 등교 날이 가벼워집니다.'],['forest','donation','🌲','작은 숲 만들기',4500,'그늘은 나중에 다른 사람이 누립니다.'],['hospital','donation','🏥','동네 병원 후원',35000,'불이 꺼지지 않아 다행인 곳.'],
 ['coffee','small','🥤','산책길 커피',80,'먼 길로 돌아왔습니다.'],['cinema','small','🍿','심야 영화',160,'엔딩 크레딧까지 앉아 있었습니다.'],['pottery','small','🏺','도예 수업',320,'조금 삐뚤어진 컵을 가져왔습니다.'],['camping','small','⛺','별 보는 캠핑',580,'휴대폰 대신 하늘을 봤습니다.'],['dining','small','🍱','예약한 코스 요리',1200,'천천히 먹는 법을 배웠습니다.'],['cruise','small','⛴️','주말 크루즈',2800,'시간이 느리게 흐르는 갑판.'],['worldtrip','small','🌏','한 달 세계 여행',18000,'돌아오니 방이 조금 낯섭니다.'],
 ['radio','luxury','📻','중고 라디오',180,'잡음 사이로 좋아하는 노래가 흐릅니다.'],['plant','luxury','🪴','창가의 화분',240,'작은 방에도 자라는 것이 생겼습니다.'],['lamp','luxury','💡','빈티지 스탠드',380,'잠들기 전 켜두는 따뜻한 빛.'],['headphone','luxury','🎧','좋은 헤드폰',650,'세상의 소음을 잠깐 끕니다.'],['console','luxury','🎮','게임기',950,'오늘은 잃을 돈 없는 게임을 합니다.'],['bike','luxury','🚲','도시 자전거',1100,'골목을 달리는 소소한 자유.'],['watch','luxury','⌚','금빛 손목시계',1800,'손목 위에 남은 그날의 승리.'],['sofa','luxury','🛋️','벨벳 소파',2200,'당신보다 먼저 집에 자리 잡은 사치.'],['suit','luxury','🤵','맞춤 정장',3200,'멋은 나지만 확률은 바뀌지 않습니다.'],['camera','luxury','📷','필름 카메라',3800,'잃고 싶지 않은 풍경을 남깁니다.'],['vinyl','luxury','🎵','희귀 음반 컬렉션',4800,'누군가에겐 플라스틱, 당신에겐 보물.'],['piano','luxury','🎹','작은 피아노',6500,'빈방에 소리가 생겼습니다.'],['motor','luxury','🏍️','클래식 모터사이클',8500,'밤바람을 사는 값.'],['car','luxury','🏎️','붉은 스포츠카',12000,'목적지 없이 한 바퀴를 더 돕니다.'],['painting','luxury','🖼️','신진 작가 원화',16000,'아직 유명하지 않은 이름을 믿었습니다.'],['diamond','luxury','💎','다이아 반지',24000,'작은 돌에 큰 돈이 묶였습니다.'],['toilet','luxury','🚽','황금 변기',30000,'돈으로 산 가장 우스운 물건.'],['yacht','luxury','🛥️','작은 요트',65000,'바다는 넓고 통장은 작아집니다.'],['observatory','luxury','🔭','개인 천체망원경',85000,'오늘은 숫자 대신 별을 셉니다.'],['jet','luxury','✈️','전용기',200000,'구름 위에서도 빚은 따라옵니다.'],
 ['shelter','donation','🐈','동물보호소 후원',300,'누군가 따뜻하게 잠듭니다.'],['meal','donation','🍲','따뜻한 식사 나눔',600,'가격을 걱정하지 않아도 되는 한 끼.'],['scholar','donation','🎓','익명 장학금',2500,'이름을 남기지 않는 쪽을 골랐습니다.'],['library','donation','📚','작은 도서관 후원',7000,'새로운 이야기가 동네에 도착합니다.'],['town','donation','🏘️','낡은 동네 복구',18000,'꺼져 있던 창문들에 불이 들어옵니다.'],
 ['stall','business','🥪','밤거리 노점',1200,'작지만 당신 이름이 걸린 첫 사업.',110,60],['laundry','business','🧺','셀프 빨래방',2800,'기계가 돌아가는 동안 장부를 봅니다.',230,130],['shop','business','🏪','작은 상점',4500,'단골과 외상 장부가 생깁니다.',360,220],['cafe','business','☕','골목 카페',8000,'손님보다 원두 값이 먼저 오릅니다.',650,420],['studio','business','🎙️','녹음 스튜디오',11000,'다른 사람의 꿈에 공간을 빌려줍니다.',850,550],['trade','business','🚢','무역회사',15000,'좋은 소식도 나쁜 소식도 바다를 건넙니다.',1200,780],['hotel','business','🏨','작은 호텔',32000,'빈 객실도 관리비는 듭니다.',2300,1550],['corp','business','🏢','거대 기업',50000,'규모가 커지면 적자도 커집니다.',3800,2600],
 ['snack','small','🍢','길거리 어묵',40,'국물까지 천천히 마셨습니다.'],['catfood','small','🐾','골목 고양이 밥',60,'내일도 같은 자리에서 기다릴 겁니다.'],['ticket','small','🎫','작은 공연의 표',120,'처음 듣는 노래가 오래 남았습니다.'],['dinner','small','🍽️','친구의 저녁값',220,'계산서를 먼저 집었습니다.'],['trip','small','🚆','당일치기 여행',420,'잠시 다른 동네 사람이 되었습니다.'],['spa','small','🛁','하루의 휴식',750,'오늘만큼은 아무 숫자도 세지 않았습니다.']
].map(([id,tab,icon,name,price,text,revenue=0,expense=0])=>({id,tab,icon,name,price,text,revenue,expense,repeat:tab==='small'||tab==='donation',sellable:tab==='luxury'||tab==='business'}));
const good=id=>GOODS.find(g=>g.id===id), mode=()=>MODES[s.mode], owns=id=>s.owned.includes(id), has=id=>active(id);

const SCORE_GOALS=[500,750,1100,1600,2300,3200];
function scored(n=s.night){return n?.rules>=9&&n.type!=='baccarat'}
function handScore(n,cards){
 if(!scored(n))return handValue(n,cards,bet()).win;
 // A fixed stake, neutral cash-risk and room bonus keep money separate from progress.
 const r=handValue({...n,rules:9,risk:1,room:'normal'},cards,100);
 return r.count<2?0:Math.floor(r.win*(r.count===2?.5:1));
}
function scoreText(value,n=s.night){return scored(n)?value.toLocaleString('ko-KR')+'점':fmt(value)}
const LIFE_PATHS={
 business:{name:'내 이름의 사업',steps:['첫 사업 창업','사업 하나 2단계','순자산 1만 · 빚 없이','호텔 소유 또는 사업 세 곳','대형 납품 프로젝트 완료']},
 home:{name:'돌아갈 집',steps:['기능 있는 소장품 구입','원룸으로 이사','소장품 하나 3단계','아파트 · 순자산 2만 · 빚 없이','안정된 우리 집에서 3일']},
 patron:{name:'동네에 남길 이름',steps:['첫 기부','선행 5회','사업 소유 · 선행 10회','선행 20회 · 순자산 1만 · 빚 없이','동네 쉼터 완공']},
 investor:{name:'기업과 함께 사는 삶',steps:['첫 주식 거래','세 종목에 분산 투자','매도 실현이익 1천','순자산 2만5천 · 빚 없이','분산 포트폴리오 3일 유지']}
};
function goalConditions(){
 const businesses=s.owned.filter(id=>good(id)?.tab==='business'),clean=!totalDebt()&&!s.bills;
 return s.lifeGoal==='investor'?[s.market.tradeCount>0,Object.keys(s.market.holdings).length>=3,s.market.realized>=1000,wealth()>=25000&&clean,s.goalFinalClear]:s.lifeGoal==='business'?[businesses.length>0,businesses.some(id=>businessLevel(id)>=2),wealth()>=10000&&clean,owns('hotel')||businesses.length>=3,s.goalFinalClear]:
 s.lifeGoal==='home'?[s.owned.some(id=>LUXURY[id]),s.home>=1,s.owned.some(id=>luxLevel(id)>=3),s.home>=3&&wealth()>=20000&&clean,s.goalFinalClear]:
 [s.good>=1,s.good>=5,businesses.length>0&&s.good>=10,s.good>=20&&wealth()>=10000&&clean,s.goalFinalClear];
}
function updateGoal(){
 if(!LIFE_PATHS[s.lifeGoal])return;
 const checks=goalConditions();
 while(s.goalStage<5&&checks[s.goalStage]){
  s.goalStage++;s.memories++;s.shopCoupons=Math.min(3,s.shopCoupons+1);
  milestone('path-'+s.goalStage,LIFE_PATHS[s.lifeGoal].steps[s.goalStage-1]+' 달성 · 상점 10% 할인권 +1');
 }
}
function chooseGoal(){
 if(s.night||s.lifeEvent)return;
 modal(s.lifeGoal?'이번 인생의 목적':'어떤 인생을 살까?',Object.entries(LIFE_PATHS).map(([id,p])=>'<article class="shop-card"><h3>'+p.name+'</h3><ol>'+p.steps.map((step,i)=>'<li>'+((id===s.lifeGoal&&i<s.goalStage)?'✓ ':'')+step+'</li>').join('')+'</ol>'+(!s.lifeGoal?btn('data-goal="'+id+'"','이 인생으로 시작'):'')+'</article>').join('')+'<p>각 단계는 달성 기록으로 남습니다. 단계마다 추억 +1, 밤 상점 10% 할인권 +1. 2단계부터 무료 시작 장치에 금화·트리플 선택지가 열립니다. 마지막 단계는 앞선 네 단계를 달성한 뒤 ‘하루 보내기’에서 목표별 프로젝트를 시작합니다.</p>',s.lifeGoal?[['계속 살아가기',closeModal,'primary']]:[],'한 인생에 한 가지 목표');
 bind('goal',id=>{if(s.lifeGoal||!LIFE_PATHS[id])return;s.lifeGoal=id;updateGoal();save();closeModal();header()});
}
const LUXURY={
 radio:{text:l=>'매일 생활비 '+(5*l)+' 절약',action:'음악 듣기'},
 lamp:{text:l=>'밤 상점 진열 새로고침 '+(10*l)+'% 할인'},
 headphone:{text:l=>'다시 뽑기 비용 '+(5*l)+'% 할인'},
 console:{text:l=>'연습 문제 보상: 추억 +'+l+' · 정답이면 상점 할인권 +1',action:'무료 조합 연습'},
 watch:{text:l=>'상점 물건 1개 예약 · 구입 '+((l-1)*5)+'% 할인'},
 camera:{text:l=>'사진 의뢰: 비용 '+fmt(40*l)+' · 65%로 '+fmt(100*l)+' 수령',action:'사진 의뢰'},
 bike:{text:l=>'매일 생활비 '+(10*l)+' 절약 · 배달 비용 '+fmt(20*l)+' / 80%로 '+fmt(55*l)+' 수령',action:'동네 배달'},
 suit:{text:l=>'모든 사업 매출 +'+(3*l)+'%'},
 car:{text:l=>'배송 의뢰: 비용 '+fmt(300*l)+' · 60%로 '+fmt(850*l)+' 수령, 실패 시 추가 '+fmt(150*l)+' 손실',action:'장거리 배송'},
 painting:{text:l=>'전시회: 비용 '+fmt(200*l)+' · 50%로 '+fmt(600*l)+' 수령, 실패 시 추가 '+fmt(100*l)+' 손실',action:'작은 전시회'}
};
function luxLevel(id){return owns(id)&&LUXURY[id]?(s.luxuryLevels[id]||1):0}
function luxuryCapital(id){return good(id).price*[0,1,1.5,2.5][luxLevel(id)||1]}
function luxuryText(id){return LUXURY[id]?'<br><b>Lv.'+(luxLevel(id)||1)+' · '+LUXURY[id].text(luxLevel(id)||1)+'</b>':''}
function luxuryButtons(id){
 const l=luxLevel(id);if(!l)return '';
 const disabled=s.status!=='alive'||!!s.night||restricted();
 return btn('data-luxup="'+id+'"',l>=3?'최대 업그레이드':'Lv.'+(l+1)+' 업그레이드 '+fmt(good(id).price*l*.5),disabled||l>=3||s.money<good(id).price*l*.5)+
 (LUXURY[id].action?btn('data-luxact="'+id+'"',s.roomUsed[id]===s.day?'오늘 사용 완료':LUXURY[id].action,disabled||s.roomUsed[id]===s.day):'');
}
function bindLuxury(){bind('luxup',upgradeLuxury);bind('luxact',luxuryAction)}
function upgradeLuxury(id){
 const l=luxLevel(id),cost=good(id)?.price*l*.5;if(!l||l>=3||s.night||blockedByEvent()||restricted()||s.status!=='alive'||s.money<cost)return;
 modal('소장품 업그레이드','<p>'+good(id).name+' Lv.'+l+' → Lv.'+(l+1)+'<br>'+LUXURY[id].text(l+1)+'<br>비용 '+fmt(cost)+' · 판매 시 누적 투자금의 60% 회수</p>',[['업그레이드',()=>{if(luxLevel(id)!==l||s.money<cost||s.night||restricted()||s.status!=='alive')return;s.money-=cost;s.luxuryLevels[id]=l+1;closeModal();afterAction()},'primary'],['취소',closeModal]]);
}
function luxuryAction(id){
 const l=luxLevel(id);if(!l||!LUXURY[id].action||s.night||blockedByEvent()||restricted()||s.status!=='alive'||s.roomUsed[id]===s.day)return;
 if(id==='console')return practiceGame();
 if(LUXURY[id].action==='감상하기')return finishLuxury(id,0,'이 물건과 보내는 평범한 하루를 남겼습니다.',l+Math.floor(s.home/2),false);

 const settings={radio:[0,1,0,0],camera:[40*l,.65,100*l,0],bike:[20*l,.8,55*l,0],car:[300*l,.6,850*l,150*l],painting:[200*l,.5,600*l,100*l]},[cost,chance,award,loss]=settings[id];
 if(s.money<cost)return notice('활동 비용 부족',fmt(cost)+'이 필요합니다.');
 modal(LUXURY[id].action,'<p>'+LUXURY[id].text(l)+'</p><p>하루 한 번. 밤 정산 또는 하루 보내기 후 다시 사용할 수 있습니다.</p>',[['시작한다',()=>{if(s.roomUsed[id]===s.day||!luxLevel(id)||s.money<cost||s.night||restricted()||s.status!=='alive')return;const ok=Math.random()<chance;finishLuxury(id,-cost+(ok?award:-loss),id==='radio'?'좋아하는 곡을 들으며 쉬었습니다.':ok?'의뢰가 잘 마무리됐습니다.':'기대만큼 풀리지 않았습니다.',id==='radio'?l:1,false)},'primary'],['취소',closeModal]]);
}
function finishLuxury(id,net,text,memories,coupon){
 if(!luxLevel(id)||s.roomUsed[id]===s.day||s.night||s.lifeEvent||s.status!=='alive'||restricted())return;
 s.roomUsed[id]=s.day;const balance=s.money+net;s.money=Math.max(0,balance);s.bills+=Math.max(0,-balance);s.memories+=memories;
 if(coupon)s.shopCoupons=Math.min(3,s.shopCoupons+1);
 s.eventHistory.unshift({day:s.day,group:'나의 방',title:good(id).name,choice:LUXURY[id].action,text,details:'현금 '+fmt(net)+' · 추억 +'+memories});s.eventHistory=s.eventHistory.slice(0,30);
 log(good(id).name+' 활동 · '+fmt(net));closeModal();afterAction();if(s.status==='alive')notice(good(id).name,text+'<br>현금 '+fmt(net)+' · 추억 +'+memories);
}
function reserveOffer(id){const n=s.night;if(n?.phase!=='shop'||!luxLevel('watch')||!n.offers.includes(id))return;n.reserved=n.reserved===id?null:id;save();renderNightShop()}
function baccaratShoe(){return shuffled(Array.from({length:416},(_,i)=>({rank:i%13+1,suit:Math.floor(i/13)%4})))}
function baccaratPoint(card){return card.rank>=10?0:card.rank}
function baccaratTotal(cards){return cards.reduce((v,c)=>v+baccaratPoint(c),0)%10}
function bankerDraw(total,third){
 if(third===null)return total<=5;
 return total<=2||total===3&&third!==8||total===4&&third>=2&&third<=7||total===5&&third>=4&&third<=7||total===6&&(third===6||third===7);
}
function baccaratHand(shoe){
 const player=[shoe.pop()],banker=[shoe.pop()];player.push(shoe.pop());banker.push(shoe.pop());
 const p=baccaratTotal(player),b=baccaratTotal(banker);
 if(p<8&&b<8){if(p<=5)player.push(shoe.pop());if(bankerDraw(b,player.length===3?baccaratPoint(player[2]):null))banker.push(shoe.pop())}
 const pt=baccaratTotal(player),bt=baccaratTotal(banker);
 return{player,banker,pt,bt,winner:pt===bt?'tie':pt>bt?'player':'banker'};
}
function baccaratPayout(side,winner,stake){return winner==='tie'?side==='tie'?stake*9:stake:side!==winner?0:side==='banker'?stake+Math.floor(stake*.95):stake*2}
function beginBaccarat(){
 if(s.pendingSettlement)return showSettlementRescue();
 if(blockedByEvent()||s.status!=='alive'||restricted())return;
 if(s.night)return startNight();
 if(s.money<baseBet())return notice('판돈이 부족해요','낮의 세계에서 재산과 빚을 정리하세요.');
 s.night={type:'baccarat',rules:10,room:'normal',start:s.money,pot:0,played:false,hands:0,phase:'ready',side:'player',stakeMult:1,shoe:baccaratShoe(),road:[],cards:[],devices:[],bag:[],itemLife:{},repairs:{},growth:{},paid:{},cleared:[]};
 save();closeModal();renderNight();header();
}
function baccaratBet(side,mult){
 const n=s.night;if(n?.type!=='baccarat'||n.phase!=='ready')return;
 if(['player','banker','tie'].includes(side))n.side=side;
 if([1,2,5,10,20].includes(mult))n.stakeMult=mult;
 save();renderBaccarat();
}
function dealBaccarat(){
 const n=s.night;if(n?.type!=='baccarat'||n.phase!=='ready'||n.hands>=12||s.status!=='alive')return;
 const stake=baseBet()*n.stakeMult;if(s.money<stake)return;
 if(n.shoe.length<6)n.shoe=baccaratShoe();
 const result=baccaratHand(n.shoe),payout=baccaratPayout(n.side,result.winner,stake);
 s.money+=payout-stake;n.hands++;n.played=true;n.phase='result';n.last={...result,side:n.side,stake,payout};
 n.road.push(result.winner);save();header();renderBaccarat();
}
function nextBaccarat(){const n=s.night;if(n?.type!=='baccarat'||n.phase!=='result')return;if(n.hands>=12)return endNight();n.phase='ready';save();renderBaccarat()}
function renderBaccarat(){
 const n=s.night;if(n?.type!=='baccarat')return;show('baccaratScreen');
 const names={player:'플레이어',banker:'뱅커',tie:'무승부'},last=n.last;
 const cards=list=>list.map(c=>'<span class="playing-card '+([1,2].includes(c.suit)?'red':'')+'">'+['','A','2','3','4','5','6','7','8','9','10','J','Q','K'][c.rank]+'<small>'+['♠','♥','♦','♣'][c.suit]+'</small></span>').join('');
 $('baccaratContent').innerHTML='<div class="baccarat-heading"><span>게임머니 전용 · '+n.hands+' / 12판</span><h2>바카라 살롱</h2><p>9에 가까운 쪽이 승리. 추가 카드는 자동으로 받습니다.</p></div><div class="baccarat-felt">'+['player','banker'].map(id=>'<div class="baccarat-hand"><h3>'+names[id]+' <b>'+(last?last[id==='player'?'pt':'bt']+'점':'')+'</b></h3><div class="playing-cards '+(s.quickEffects?'':'reveal-cards')+'">'+(last?cards(last[id]):'<span class="playing-card back">?</span><span class="playing-card back">?</span>')+'</div></div>').join('')+'</div>'+
 '<div class="baccarat-result '+(s.quickEffects?'':'reveal-result')+'" aria-live="polite">'+(last?'<b>'+names[last.winner]+(last.winner==='tie'?'':' 승리')+'</b><br>'+names[last.side]+'에 '+fmt(last.stake)+' · 지급 '+fmt(last.payout)+' · 순손익 '+fmt(last.payout-last.stake):'어느 쪽이 이길지 고르세요.')+'</div>'+
 '<p class="baccarat-explanation">'+baccaratExplanation(last)+'</p><div class="baccarat-road" aria-label="지난 결과">'+n.road.map(w=>'<span class="'+w+'">'+names[w].slice(0,1)+'</span>').join('')+'</div><p>현금 '+fmt(s.money)+' · 오늘 순손익 '+fmt(s.money-n.start)+'</p>'+
 '<div class="baccarat-choices">'+Object.entries(names).map(([id,name])=>btn('data-bacside="'+id+'" class="'+(n.side===id?'selected':'')+'"',name+' · '+({player:'순이익 1배',banker:'순이익 0.95배',tie:'순이익 8배'}[id]),n.phase!=='ready')).join('')+'</div>'+
 '<div class="stake-controls">'+[1,2,5,10,20].map(mult=>btn('data-bacstake="'+mult+'" class="'+(n.stakeMult===mult?'selected':'')+'"',fmt(baseBet()*mult),n.phase!=='ready')).join('')+'</div>'+
 '<div class="baccarat-actions">'+(n.phase==='ready'?btn('id="baccaratDeal" class="primary-btn"',names[n.side]+'에 '+fmt(baseBet()*n.stakeMult)+' 걸고 공개',s.money<baseBet()*n.stakeMult):btn('id="baccaratNext" class="primary-btn"',n.hands>=12?'12판 종료 · 정산':'다음 판 준비'))+btn('id="baccaratLeave"','정산하고 귀가')+btn('id="quickEffects"',s.quickEffects?'카드 연출 켜기':'카드 연출 생략')+'</div>'+
 '<details class="baccarat-rules"><summary>배당과 규칙 보기</summary><p>A는 1, 2~9는 숫자 그대로, 10·J·Q·K는 0. 합의 일의 자리로 비교합니다. 첫 두 장이 8·9면 즉시 비교. 나머지는 표준 세 번째 카드 규칙으로 자동 진행합니다.</p><p>뱅커 승리는 이익의 5% 수수료(지급액 소수점 버림). 무승부면 플레이어·뱅커 베팅은 원금 반환. 무승부 베팅은 적중 시 원금 포함 9배. 8덱에서 중복 없이 뽑고 이번 밤의 카드 더미를 저장합니다.</p><p>장치·소장품은 바카라 확률과 배당에 영향을 주지 않습니다. 기록은 지난 결과이며 다음 승리를 보장하지 않습니다. 한 밤 최대 12판. 1판이라도 플레이하고 귀가하면 하루가 지나고 생활비·사업·대출을 정산합니다.</p></details>';
 bind('bacside',side=>baccaratBet(side));bind('bacstake',v=>baccaratBet(null,Number(v)));
 if(n.phase==='ready')$('baccaratDeal').onclick=dealBaccarat;else $('baccaratNext').onclick=nextBaccarat;
 $('baccaratLeave').onclick=endNight;$('quickEffects').onclick=()=>{s.quickEffects=!s.quickEffects;save();renderBaccarat()};
}


const STOCKS=[
 {id:'harvest',name:'한결식품',icon:'🌾',sector:'food',price:100,vol:.05,div:.01,desc:'필수 소비 · 변동성 낮음'},
 {id:'bluebay',name:'푸른만리조트',icon:'🏖️',sector:'tourism',price:200,vol:.09,div:.006,desc:'관광 경기 · 변동성 중간'},
 {id:'pixel',name:'픽셀드림',icon:'🎮',sector:'tech',price:60,vol:.18,div:0,desc:'신작 개발 · 변동성 매우 높음'},
 {id:'bridge',name:'연결물류',icon:'📦',sector:'logistics',price:150,vol:.07,div:.008,desc:'운송업 · 변동성 중간'},
 {id:'canvas',name:'캔버스옥션',icon:'🖼️',sector:'art',price:200,vol:.13,div:0,desc:'미술 경매 · 변동성 높음'},
 {id:'sol',name:'솔라에너지',icon:'☀️',sector:'energy',price:300,vol:.11,div:.004,desc:'에너지 산업 · 변동성 높음'}
];
const SECTORS={food:'생활소비',tourism:'관광',tech:'기술',logistics:'물류',art:'문화',energy:'에너지'};
const MARKET_NEWS=[
 {title:'평온한 거래 주간',text:'뚜렷한 업종 호재 없이 기업별 실적에 시선이 모입니다.',bias:{}},
 {title:'섬의 관광 성수기',text:'관광·외식 수요 증가. 호텔과 카페에도 손님이 늘어납니다.',bias:{tourism:.06,food:.025}},
 {title:'신작 게임 축제',text:'기술·문화 업종 기대감. 개별 기업의 결과는 엇갈릴 수 있습니다.',bias:{tech:.07,art:.025}},
 {title:'운송비 급등',text:'물류·식품 업종 비용 부담, 에너지 업종 관심 증가.',bias:{logistics:-.055,food:-.025,energy:.045}},
 {title:'미술시장 냉각',text:'고가 소비가 줄면서 문화·관광 업종에 부담이 생깁니다.',bias:{art:-.06,tourism:-.02}},
 {title:'지역 소비 회복',text:'생활소비·물류 주문 증가. 동네 가게에도 활기가 돕니다.',bias:{food:.04,logistics:.035}},
 {title:'기술주 실적 경계',text:'높아진 기대에 실적이 미치지 못할 우려. 기술·에너지 업종 주의.',bias:{tech:-.07,energy:-.025}},
 {title:'친환경 설비 투자',text:'에너지·기술 업종에 신규 발주가 예상됩니다.',bias:{energy:.06,tech:.02}}
];
function marketRandom(m=s.market){m.seed=(Math.imul(m.seed,1664525)+1013904223)>>>0;return m.seed/4294967296}
function newMarket(day=1){return{day,seed:(Math.floor(Math.random()*4294967295)||1739)>>>0,news:0,newsUntil:day+3,prices:Object.fromEntries(STOCKS.map(x=>[x.id,x.price])),history:Object.fromEntries(STOCKS.map(x=>[x.id,[{day,price:x.price}]])),holdings:{},trades:[],realized:0,dividends:0,tradeCount:0,bulletin:['거래소 개장 · 모든 기업과 뉴스는 게임 속 설정입니다.']}}
function stockValue(net=true){return STOCKS.reduce((sum,x)=>{const amount=(s.market?.holdings[x.id]?.qty||0)*(s.market?.prices[x.id]||x.price);return sum+amount-(net&&amount?Math.ceil(amount*.01):0)},0)}
function marketNews(){return MARKET_NEWS[s.market.news]||MARKET_NEWS[0]}
function businessSector(id){return ['hotel','cafe','foodtruck'].includes(id)?'tourism':['gamecompany','corp'].includes(id)?'tech':['logistics','trade','laundry'].includes(id)?'logistics':['studio','bookshop','workshop'].includes(id)?'art':['farm'].includes(id)?'energy':'food'}
function worldBusinessMultiplier(id){return 1+(marketNews().bias[businessSector(id)]||0)*4}
function tickMarket(){
 const m=s.market;if(m.day>=s.day)return {dividends:0,lines:[]};
 let dividends=0;const lines=[];
 for(const x of STOCKS){
  const old=m.prices[x.id],noise=(marketRandom()-.5)*2*x.vol,bias=marketNews().bias[x.sector]||0;
  const surprise=marketRandom()<.08?(marketRandom()<.5?-.3:.3):0;
  let price=Math.max(1,Math.min(10000000,Math.round(old*(1+Math.max(-.55,Math.min(.6,noise+bias+surprise))))));
  const dividend=s.day%3===0?Math.min(price-1,Math.floor(old*x.div)):0;
  if(dividend>0){price-=dividend;const payout=dividend*(m.holdings[x.id]?.qty||0);dividends+=payout;if(payout)lines.push(x.name+' 배당 '+fmt(payout));}
  m.prices[x.id]=price;m.history[x.id].push({day:s.day,price});m.history[x.id]=m.history[x.id].slice(-24);
  if(surprise)lines.push(x.name+(surprise>0?' · 예상 밖 대형 수주':' · 실적 충격')+' · 종가 '+fmt(price));
 }
 s.money+=dividends;m.dividends+=dividends;m.day=s.day;
 if(s.day>=m.newsUntil){m.news=1+Math.floor(marketRandom()*(MARKET_NEWS.length-1));m.newsUntil=s.day+3;lines.unshift('다음 장세 · '+marketNews().title)}
 m.bulletin=lines.length?lines:['오늘의 거래를 마쳤습니다. 다음 시세는 하루를 보낸 뒤 확정됩니다.'];
 return {dividends,lines};
}
function stockQuote(id,side,qty){const price=s.market.prices[id],gross=price*qty,fee=Math.ceil(gross*.01);return {price,gross,fee,total:side==='buy'?gross+fee:gross-fee}}
function stockOrder(id,side){
 const x=STOCKS.find(x=>x.id===id);if(!x||s.night||blockedByEvent()||s.status!=='alive'||!['buy','sell'].includes(side)||side==='buy'&&restricted())return;
 const held=s.market.holdings[id]?.qty||0,limit=side==='sell'?held:Math.min(10000,Math.floor(s.money/(s.market.prices[id]*1.01)));
 const options=[...new Set([1,5,10,Math.min(10000,limit)])].filter(n=>n>0&&n<=limit);
 modal(x.name+' · '+(side==='buy'?'매수':'매도'),'<p>현재가 '+fmt(s.market.prices[id])+' · 보유 '+held+'주<br>양쪽 거래 수수료 1%. 시세는 하루를 보낼 때만 변합니다.</p><div class="stock-order">'+options.map(q=>{const quote=stockQuote(id,side,q);return btn('data-stockqty="'+q+'"',q+'주 · '+(side==='buy'?'지출 ':'수령 ')+fmt(quote.total)+' (수수료 '+fmt(quote.fee)+')')}).join('')+'</div>',[['취소',()=>{closeModal();renderDay()}]],'가상 주식 · 게임머니');
 bind('stockqty',q=>executeStock(id,side,Number(q)));
}
function executeStock(id,side,qty){
 const m=s.market,x=STOCKS.find(x=>x.id===id);if(!x||s.night||s.lifeEvent||s.status!=='alive'||!['buy','sell'].includes(side)||!Number.isInteger(qty)||qty<1||qty>10000)return false;
 const quote=stockQuote(id,side,qty),position=m.holdings[id]||{qty:0,cost:0};let profit=0;
 if(side==='buy'){if(restricted()||s.money<quote.total||position.qty+qty>1000000)return false;s.money-=quote.total;position.qty+=qty;position.cost+=quote.total;m.holdings[id]=position;}
 else{if(position.qty<qty)return false;const cost=qty===position.qty?position.cost:Math.round(position.cost*qty/position.qty);profit=quote.total-cost;m.realized+=profit;s.money+=quote.total;position.qty-=qty;position.cost-=cost;if(!position.qty)delete m.holdings[id];}
 m.tradeCount++;m.trades.unshift({day:s.day,id,side,qty,price:quote.price,fee:quote.fee,profit});m.trades=m.trades.slice(0,40);
 if(m.tradeCount===1)milestone('first-stock','처음으로 회사의 작은 지분을 샀다.');
 log(x.name+' '+(side==='buy'?'매수 ':'매도 ')+qty+'주 · '+fmt(quote.total));closeModal();afterAction();return true;
}
function stockChart(x){
 const values=s.market.history[x.id],low=Math.min(...values.map(v=>v.price)),high=Math.max(...values.map(v=>v.price)),range=Math.max(1,high-low);
 const points=values.map((v,i)=>(10+i*260/Math.max(1,values.length-1)).toFixed(1)+','+(68-(v.price-low)*52/range).toFixed(1)).join(' ');
 return '<svg class="stock-chart" viewBox="0 0 280 82" role="img" aria-label="'+x.name+' 최근 '+values.length+'일 가격, 최저 '+low+' 최고 '+high+'"><line x1="10" y1="70" x2="270" y2="70" stroke="currentColor" opacity=".2"/><polyline points="'+points+'" fill="none" stroke="currentColor" stroke-width="2.5"/>'+values.map((v,i)=>'<circle cx="'+(10+i*260/Math.max(1,values.length-1))+'" cy="'+(68-(v.price-low)*52/range)+'" r="2"><title>'+v.day+'일 '+fmt(v.price)+'</title></circle>').join('')+'</svg>';
}
function renderMarket(){
 const m=s.market,news=marketNews(),cost=Object.values(m.holdings).reduce((v,p)=>v+p.cost,0);
 $('dayIntro').textContent='가상 기업 6종 · 실제 돈/시세 없음 · 하루를 보낼 때 시세 갱신 · 매수/매도 수수료 각 1% · 빌린 돈도 같은 현금이며 손실과 이자는 그대로 남습니다.';
 $('shopGrid').className='shop-grid market-grid';
 $('shopGrid').innerHTML='<article class="market-overview"><p class="kicker">THE MORNING EXCHANGE · '+s.day+'일</p><h2>'+news.title+'</h2><p>'+news.text+' '+Math.max(0,m.newsUntil-s.day)+'회 결산 동안 적용. 방향에 영향을 주지만 상승·하락을 보장하지 않습니다.</p><div class="market-totals"><span>매도 후 평가액<b>'+fmt(stockValue())+'</b></span><span>평가손익<b>'+fmt(stockValue()-cost)+'</b></span><span>실현손익<b>'+fmt(m.realized)+'</b></span><span>받은 배당<b>'+fmt(m.dividends)+'</b></span></div><p>'+m.bulletin.join('<br>')+'</p></article>'+
 STOCKS.map(x=>{const p=m.prices[x.id],h=m.history[x.id],prev=h.length>1?h[h.length-2].price:p,change=(p/prev-1)*100,pos=m.holdings[x.id]||{qty:0,cost:0};return '<article class="shop-card stock-card"><div class="stock-heading"><span>'+x.icon+' '+SECTORS[x.sector]+'</span><strong class="'+(change>=0?'positive':'negative')+'">'+(change>=0?'+':'')+change.toFixed(1)+'%</strong></div><h3>'+x.name+'</h3><div class="stock-price">'+fmt(p)+'</div>'+stockChart(x)+'<p>'+x.desc+'<br>보유 '+pos.qty+'주 · 평균 원가 '+fmt(pos.qty?pos.cost/pos.qty:0)+'<br>배당: '+(x.div?'3일 간격, 전일 가격의 '+(x.div*100).toFixed(1)+'% 내림. 배당만큼 주가 차감.':'없음')+'</p>'+btn('data-stockbuy="'+x.id+'"','매수',s.status!=='alive'||restricted()||s.money<stockQuote(x.id,'buy',1).total)+btn('data-stocksell="'+x.id+'"','매도',s.status!=='alive'||!pos.qty)+'</article>'}).join('')+
 card('📒','거래 기록',m.trades.slice(0,12).map(t=>t.day+'일 · '+STOCKS.find(x=>x.id===t.id).name+' '+(t.side==='buy'?'매수':'매도')+' '+t.qty+'주 · '+fmt(t.price)+' · 수수료 '+fmt(t.fee)+(t.side==='sell'?' · 실현 '+fmt(t.profit):'')).join('<br>')||'아직 거래가 없습니다.');
 bind('stockbuy',id=>stockOrder(id,'buy'));bind('stocksell',id=>stockOrder(id,'sell'));
}
const BUSINESS_STYLES={
 steady:{name:'단골 중심',text:'매출 ×1.1 · 비용 ×0.9 · 휴업 15%, 평일 55%, 성황 30%',revenue:1.1,expense:.9,closed:.15,busy:.7},
 premium:{name:'프리미엄',text:'매출 ×1.6 · 비용 ×1.5 · 휴업 30%, 평일 35%, 성황 35%',revenue:1.6,expense:1.5,closed:.3,busy:.65},
 volume:{name:'대량 판매',text:'매출 ×1.9 · 비용 ×2 · 휴업 20%, 평일 45%, 성황 35%',revenue:1.9,expense:2,closed:.2,busy:.65}
};
function businessStyle(id){return BUSINESS_STYLES[s.businessStyles[id]]||{name:'기본 운영',text:'휴업 25%, 평일 40%, 성황 35%',revenue:1,expense:1,closed:.25,busy:.65}}
function specializeBusiness(id){
 if(!owns(id)||good(id)?.tab!=='business'||businessLevel(id)<2||s.businessStyles[id]||s.night||s.lifeEvent||s.status!=='alive'||pledged(id))return;
 modal(good(id).name+' · 운영 방향','<p>확장한 사업의 운영 방식을 선택하세요. 사업을 소유하는 동안 유지됩니다. 같은 업종의 주식과 시장 뉴스 영향을 함께 받습니다.</p>'+Object.entries(BUSINESS_STYLES).map(([key,b])=>card('↗',b.name,b.text,btn('data-bizstyle="'+key+'"','이 방향으로 운영'))).join(''),[['나중에 결정',closeModal]]);
 bind('bizstyle',key=>{if(!BUSINESS_STYLES[key]||s.businessStyles[id]||!owns(id)||s.night||s.lifeEvent||pledged(id)||s.status!=='alive')return;s.businessStyles[id]=key;log(good(id).name+' · '+BUSINESS_STYLES[key].name);closeModal();afterAction()});
}
function businessDayFactor(id){
 const style=businessStyle(id),r=Math.random();
 if(r<style.closed)return 0;
 // 업종마다 달력상의 성수기가 있다. 날짜를 넘기기 전에 확인 가능.
 const seasonal=s.day%5===0&&['flowers','bakery','cafe','hotel'].includes(id)?1.2:1;
 return(r<style.busy?1:1.6)*seasonal;
}
function homeBenefit(level=s.home){return ['작은 휴식 공간','작업대 · 낮 일거리 +15','취미방 · 낮 일거리 +30, 감상 추억 +1','서재 · 낮 일거리 +45, 감상 추억 +1','전시실 · 낮 일거리 +60, 감상 추억 +2','큰 작업실 · 낮 일거리 +75, 감상 추억 +2'][level]}
function forecastCosts(){
 const next=s.day+1,loans=s.loans.reduce((v,l)=>{const interest=Math.ceil(l.balance*l.rate);return v+(l.plan==='installment'?Math.min(l.balance+interest,l.installment+interest):next>=l.due?l.balance+interest:0)},0);
 return upkeep()+loans+s.bills+(s.debt&&next>=s.due?Math.ceil(s.debt*(1+mode().interest)):0);
}
function quietDay(kind){
 if(s.pendingSettlement)return showSettlementRescue();
 if(s.night||blockedByEvent()||s.status!=='alive'||!['work','rest','manage'].includes(kind))return;
 const income=kind==='work'?60+s.home*15:0;
 modal('오늘 하루 보내기','<p>'+(kind==='work'?'동네 일거리 · '+fmt(income)+' 수입':kind==='rest'?'집에서 쉬며 추억 +2':'사업 관리 · 이번 결산 매출 20% 증가')+'</p><p>하루가 지나고 주가·사업·생활비·대출을 정산합니다.<br>현재 예상 고정 지출 '+fmt(forecastCosts())+' · 사업 손익과 주가 변동은 별도입니다.</p>',[['하루를 보낸다',()=>{if(s.night||s.lifeEvent||s.pendingSettlement||s.status!=='alive')return;s.night={type:'day',rules:10,start:s.money,pot:0,played:true,hands:1,phase:'ready',dayIncome:income,manage:kind==='manage',rest:kind==='rest'};s.money+=income;if(kind==='rest')s.memories+=2;endNight()},'primary'],['취소',closeModal]]);
}
function renderLifeDesk(){
 $('dayIntro').textContent='시세와 사업은 게임 속 하루에 맞춰 움직입니다. 접속하지 않은 동안에는 비용이나 이자가 붙지 않습니다.';
 $('shopGrid').innerHTML=card('📅','내일의 지출', '현재 현금 '+fmt(s.money)+'<br>예상 생활·상환·미납 '+fmt(forecastCosts())+'<br>사업 손익·주가·새 사건은 별도.<br>'+marketNews().title)+
 card('🧰','동네 일거리','확정 수입 '+fmt(60+s.home*15)+' · 하루 경과',btn('data-quiet="work"','일하고 하루 보내기',s.status!=='alive'))+
 card('📋','사업 관리','이번 결산의 사업 매출 20% 증가. 휴업 비용은 그대로.',btn('data-quiet="manage"','가게를 돌보며 하루 보내기',s.status!=='alive'))+
 card('🛋️','쉬어가는 하루','추억 +2 · 같은 생활비와 이자 발생. 주거 목표의 안정된 생활도 진행.',btn('data-quiet="rest"','쉬고 하루 보내기',s.status!=='alive'))+projectCard();
 bind('quiet',quietDay);bind('project',startProject);
}


const ROUTES={steady:{name:'신중한 길',goal:.9,cash:.9,text:'목표 10% 감소 · 현금 지급 10% 감소'},rush:{name:'승부사의 길',goal:1.25,cash:1.15,text:'목표 25% 증가 · 현금 지급 15% 증가'},repair:{name:'정비의 길',goal:1,cash:1,text:'목표·지급 동일 · 다음 상점 유료 수리 25% 할인'}};
function frontier(n=s.night){return n?.rules>=10&&n.type!=='baccarat'&&n.type!=='day'}
function roomCashBonus(n=s.night){return frontier(n)?({normal:1,vip:1.1,secret:1.2}[n.room]||1):room(n).triple}
function mayRisk(n=s.night){return n&&n.tableScore<target()&&handIndex(n)+1<handLimit(n)}
function dailyRoom(id){
 if(!s.dailyRooms||s.dailyRooms.day!==s.day)s.dailyRooms={day:s.day,rooms:{}};
 if(!s.dailyRooms.rooms[id]){const bosses=shuffled(BOSSES.map(b=>b.id));s.dailyRooms.rooms[id]={bosses:{3:bosses[0],6:bosses[1]},offers:null};}
 return s.dailyRooms.rooms[id];
}
function chooseRoute(){
 const n=s.night;if(n?.phase!=='route')return;
 modal('다음 테이블의 길','<p>목표와 대가를 보고 경로를 선택하세요. 이미 받은 보상과 날짜는 바뀌지 않습니다.</p>'+Object.entries(ROUTES).map(([id,r])=>card('↗',r.name,r.text,btn('data-route="'+id+'"','이 길로 간다'))).join(''),[['지금 귀가',endNight]]);
 bind('route',selectRoute);
}
function selectRoute(id){const n=s.night;if(!ROUTES[id]||n?.phase!=='route')return;n.route=id;n.table++;n.roundHands=0;n.tableScore=0;n.lastSymbol=null;n.phase='ready';n.offers=[];save();closeModal();renderNight()}
function buildSummary(n=s.night){
 const tags={};for(const id of n.devices){const tag=device(id)?.tag;if(tag)tags[tag]=(tags[tag]||0)+1}
 const tag=Object.keys(tags).sort((a,b)=>tags[b]-tags[a])[0]||'미정',hints={'장미':'향수로 장미를 모으고 성장 장치를 키워 보세요.','해골':'희귀한 해골을 모아 강한 트리플을 노려 보세요.','한 쌍':'연속 한 쌍과 배당 장치를 함께 써야 후반 점수가 나옵니다.','금화':'자주 나오는 금화의 기본 배당을 키워 보세요.','트리플':'고정·재뽑기·물감으로 세 장을 모아 보세요.'};
 return '<b>현재 전략 · '+tag+'</b><small>'+(hints[tag]||'확률·성장·보호 장치 중 어떤 역할이 부족한지 살펴보세요.')+'</small>';
}
function previewDevice(id,replaceId=null){
 const n=s.night,d=device(id);if(n?.phase!=='shop'||!d||d.kind==='consumable')return;
 if(n.devices.length>=3&&!replaceId)return modal('어떤 장치와 비교할까?','<p>구입하지 않고 예상 점수만 확인합니다.</p>',[...n.devices.map(x=>[device(x).name+' 대신',()=>previewDevice(id,x)]),['상점으로',renderNightShop]]);
 const after={...n,devices:[...n.devices.filter(x=>x!==replaceId),id],itemLife:{...n.itemLife,[id]:d.life}};
 const rows=['coin','rose','skull'].map(symbol=>{const other=symbol==='coin'?'rose':'coin',pair=[symbol,symbol,other],triple=[symbol,symbol,symbol];return '<tr><td>'+SYMBOLS[symbol].name+'</td><td>'+handScore(n,pair)+' → '+handScore(after,pair)+'</td><td>'+handScore(n,triple)+' → '+handScore(after,triple)+'</td></tr>'}).join('');
 modal(d.name+' 효과 비교','<p>현재 테이블·장치 상태 기준 통과 점수. 구입·수명 소모 없음. 그림 확률과 장래 성장 효과는 별도로 판단하세요.</p><table><thead><tr><th>그림</th><th>한 쌍</th><th>트리플</th></tr></thead><tbody>'+rows+'</tbody></table>',[['상점으로',renderNightShop,'primary']]);
}
function completeReward(n){
 if(!frontier(n)||n.table!==6||n.completionPaid)return 0;
 n.completionPaid=true;const reward=baseBet()*room(n).stake*10;s.money+=reward;s.archive.clears++;
 if(!s.archive.rooms.includes(n.room))s.archive.rooms.push(n.room);
 s.shopCoupons=Math.min(3,s.shopCoupons+1);milestone('room-clear-'+n.room,room(n).name+' 완주 · 보너스 '+fmt(reward));
 return reward;
}
function failureReview(n){
 return '<div class="run-review"><b>'+(n.tableScore>=target()?'통과':'목표까지 '+scoreText(Math.max(0,target()-n.tableScore),n)+' 부족')+'</b><p>승부 '+(n.roundHands||0)+'회 · 이번 밤 재뽑기 '+fmt(n.rerollSpent||0)+'<br>남은 장치: '+n.devices.map(id=>device(id).name+' ('+lifeLabel(id,n)+')').join(', ')+'</p><small>점수는 그림·장치로, 현금은 판돈·지급액으로 계산됩니다. 완주하면 기본 판돈 ×방 배율 ×10의 보너스를 받습니다.</small></div>';
}
function projectCard(){
 if(s.goalStage<4||s.goalStage>=5||!s.lifeGoal)return card('🗺️','목표별 마지막 이야기','인생 목표 4단계를 달성하면 이곳에서 고유한 마지막 도전을 시작합니다.');
 const p=s.project,labels={business:'대형 납품 프로젝트',home:'안정된 우리 집',patron:'동네 쉼터 완공',investor:'흔들림 속의 분산 투자'};
 const desc={business:'3단계 사업을 보유하고 착수금 5,000. 사업을 유지한 채 3일을 보내면 계약 완료. 보유하지 않은 날은 진행되지 않습니다.',home:'아파트 이상에 살며 빚·미납 없이 3일을 보내세요. 착수금 없음. 조건을 벗어나면 연속 일수 초기화.',patron:'선행 20회와 착수금 4,000. 이후 3일을 보내면 쉼터 완공.',investor:'3개 이상 종목, 주식 평가액 5,000 이상, 빚·미납 없이 3일 유지. 조건을 벗어나면 연속 일수 초기화.'};
 return card('🏁',labels[s.lifeGoal],desc[s.lifeGoal]+'<br>'+(p?'진행 '+p.progress+'/3일':'아직 시작하지 않았습니다.'),p?'':btn('data-project="'+s.lifeGoal+'"','마지막 도전 시작',s.status!=='alive'||restricted()));
}
function startProject(id){
 if(s.night||blockedByEvent()||s.status!=='alive'||s.goalStage!==4||id!==s.lifeGoal||s.project||restricted())return;
 const cost=id==='business'?5000:id==='patron'?4000:0;
 if(s.money<cost)return notice('착수금 부족',fmt(cost)+'이 필요합니다.');
 if(id==='business'&&!s.owned.some(x=>good(x)?.tab==='business'&&businessLevel(x)===3))return notice('확장 사업이 필요해요','3단계 사업 한 곳이 필요합니다.');
 modal('마지막 도전 시작','<p>착수금 '+fmt(cost)+' · 실제 게임 속 3일 동안 조건을 유지해야 합니다. 시작 후 착수금은 반환되지 않습니다.</p>',[['시작한다',()=>{if(s.night||s.lifeEvent||s.status!=='alive'||s.project||s.goalStage!==4||s.money<cost||restricted())return;s.money-=cost;s.project={kind:id,progress:0,started:s.day};closeModal();afterAction()},'primary'],['취소',closeModal]]);
}
function advanceProject(){
 const p=s.project;if(!p||s.goalStage!==4||s.goalFinalClear)return;
 const clean=!totalDebt()&&!s.bills;
 const ok=p.kind==='business'?s.owned.some(id=>good(id)?.tab==='business'&&businessLevel(id)===3):p.kind==='home'?s.home>=3&&clean:p.kind==='investor'?Object.keys(s.market.holdings).length>=3&&stockValue()>=5000&&clean:true;
 if(ok)p.progress++;else if(['home','investor'].includes(p.kind))p.progress=0;
 if(p.progress>=3){s.goalFinalClear=true;if(p.kind==='business')s.money+=8000;if(p.kind==='patron')s.good+=5;milestone('project-finished','삶의 마지막 프로젝트를 완성했다.');}
}
function collectionBonus(){
 const sets=[['음악이 있는 방',['radio','headphone','vinyl']],['취미의 시작',['console','camera','guitar']],['움직이는 인생',['bike','motor','car']],['작은 미술관',['painting','sculpture','artvault']]];
 return sets.map(([name,ids])=>({name,ids,count:ids.filter(owns).length}));
}
function checkCollections(){for(const c of collectionBonus())if(c.count===c.ids.length&&!s.milestones.includes('collection-'+c.name)){s.memories+=5;milestone('collection-'+c.name,c.name+' 완성 · 추억 +5')}}
function roomScene(){
 const objects=s.owned.filter(id=>good(id)?.tab==='luxury');
 return '<article class="room-scene home-'+s.home+'"><div class="room-window">☀</div><div class="room-caption"><small>MY LITTLE LIFE</small><h2>'+HOMES[s.home][1]+'</h2><p>'+homeBenefit()+'</p></div><div class="room-objects">'+objects.map(id=>'<button data-roomobject="'+id+'" aria-label="'+good(id).name+' 살펴보기"><i>'+good(id).icon+'</i><span>'+good(id).name+'</span></button>').join('')+'</div><div class="room-floor"></div></article>';
}
function inspectObject(id){if(!owns(id))return;modal(good(id).name,'<p>'+good(id).text+luxuryText(id)+'<br>'+(s.provenance[id]||'지난 시간부터 함께한 물건입니다.')+'</p>',[['활동·업그레이드 보기',()=>{closeModal();openDay('room')},'primary'],['닫기',closeModal]])}
function practiceGame(){
 const l=luxLevel('console');if(!l)return;
 const problems=[
 {cards:['coin','coin','rose'],devices:['pairEngine'],hint:'작은 승리: 한 쌍 기본 배당 +0.9'},
 {cards:['rose','rose','rose'],devices:['tripleLens'],hint:'세 번째 눈: 트리플 ×1.8'},
 {cards:['skull','skull','coin'],devices:['skullPair'],hint:'쌍둥이 해골: 해골 한 쌍 기본 배당 +1.2'},
 {cards:['coin','rose','skull'],devices:['insurance'],hint:'보험은 돈을 돌려주지만 꽝의 통과 점수는 0'},
 {cards:['coin','coin','coin'],devices:['pairEngine'],hint:'작은 승리: 트리플 ×0.7'},
 {cards:['rose','rose','coin'],devices:['rosePair','steadyHands'],hint:'두 송이 꽃병 +0.8, 재뽑기 없는 손 ×1.3'}
 ];
 const p=problems[(s.day-1)%problems.length],n={rules:9,room:'normal',devices:p.devices,growth:{},pairChain:0,table:1,roundHands:0,risk:1,rerolls:0,bosses:{}};
 const answer=handScore(n,p.cards),options=[answer,answer+75,Math.max(0,answer-30)].filter((v,i,a)=>a.indexOf(v)===i).sort((a,b)=>a-b);
 modal('오늘의 조합 연습','<p>'+p.cards.map(c=>SYMBOLS[c].icon).join(' ')+'<br>'+p.hint+'<br>이 패의 통과 점수는 몇 점일까요?</p>',options.map(v=>[v+'점',()=>finishLuxury('console',0,v===answer?'정답! 조합을 익혔습니다.':'정답은 '+answer+'점입니다. 내일은 다른 패가 나옵니다.',v===answer?l:0,v===answer)]));
}
function sequelEvents(){
 const c=(label,cost,outcomes)=>({label,cost,outcomes}),o=(chance,text,cash,extra={})=>({chance,text,cash,...extra}),skip=c('다음 기회를 기다린다',0,[o(100,'이번 제안은 넘깁니다. 나중에 다시 기회가 올 수 있습니다.',0)]),events=[];
 const business=s.owned.find(id=>good(id)?.tab==='business');
 if(business&&s.story.contract===1)events.push({id:'contract-part2',group:'연속 이야기',icon:'📨',title:'다시 찾아온 납품처',text:'첫 납품을 기억한 고객이 장기 계약을 제안했습니다.',choices:[c('작은 정기 계약',300,[o(100,'매주 찾는 거래처가 생겼습니다.',500,{story:'contract',step:2})]),c('전국 납품 도전',1200,[o(55,'큰 계약의 문이 열렸습니다.',3600,{story:'contract',step:2}),o(45,'일정을 맞추지 못했습니다.',-600)]),skip]});
 if(business&&s.story.contract===2)events.push({id:'contract-part3',group:'연속 이야기',icon:'🤝',title:'이름을 건 마지막 계약',text:'작은 납품에서 시작된 인연. 이제 장기 파트너를 고를 차례입니다.',choices:[c('안정적인 파트너십',600,[o(100,'꾸준히 거래하는 파트너가 됐습니다.',1000,{story:'contract',step:3,memories:3,effects:[{title:'오래된 거래처',kind:'revenue',target:business,amount:1.2,remaining:4}]})]),c('독점 계약에 투자',2500,[o(45,'당신의 상호가 전국에 알려졌습니다.',8000,{story:'contract',step:3,memories:5}),o(55,'독점 계약이 부담이 됐습니다.',-1800,{story:'contract',step:3})]),skip]});
 if(s.market.tradeCount>0&&!s.story.investor)events.push({id:'investor-letter',group:'연속 이야기',icon:'📰',title:'첫 주주에게 온 편지',text:'가상 거래소의 기업 설명회가 열립니다. 미래 가격은 누구도 확정하지 못합니다.',choices:[c('공개 설명회 참석',0,[o(100,'뉴스가 기업과 생활에 연결된다는 것을 배웠습니다.',0,{story:'investor',step:1,memories:2})]),c('지역 기업 전시 후원',200,[o(100,'기업보다 그곳에서 일하는 사람들을 만났습니다.',0,{story:'investor',step:1,good:1,memories:2})]),skip]});
 if(s.baccaratVisits>=2&&!s.story.salon)events.push({id:'salon-letter',group:'연속 이야기',icon:'♠',title:'살롱의 오래된 사진',text:'딜러가 테이블 대신 오래된 사진첩을 펼칩니다. 떠난 사람들의 이야기가 남아 있습니다.',choices:[c('이야기를 듣는다',0,[o(100,'한때 이 도시를 떠들썩하게 했던 사람들의 이야기를 들었습니다.',0,{story:'salon',step:1,memories:3})]),c('사진 복원을 돕는다',250,[o(100,'사진 아래에 작은 감사 인사가 남았습니다.',0,{story:'salon',step:1,good:1,memories:4})]),skip]});
 return events;
}
function baccaratExplanation(last){
 if(!last)return '';
 const p=baccaratTotal(last.player.slice(0,2)),b=baccaratTotal(last.banker.slice(0,2));
 return p>=8||b>=8?'첫 두 장에서 8·9점: 추가 카드 없이 비교했습니다.':(last.player.length===3?'플레이어는 첫 두 장이 0~5점이라 한 장 추가. ':'플레이어는 6~7점으로 멈춤. ')+(last.banker.length===3?'뱅커도 자동 규칙에 따라 한 장 추가했습니다.':'뱅커는 자동 규칙에 따라 멈췄습니다.');
}
function archiveCard(){return card('📚','다음 인생에도 남는 발견','발견한 장치 '+s.archive.items.length+'/'+DEVICES.length+'<br>완주 '+s.archive.clears+'회 · 방 '+s.archive.rooms.map(id=>ROOMS[id].name).join(', ')+'<br>모은 결말 '+s.archive.endings.length+'개<br>누적 완주를 달성하면 다음 인생에서도 시작 장치 선택지가 열립니다. 자금·빚·물건은 초기화됩니다.')}


const BACKUP_KEY=KEY+'-checkpoint';
function escapeText(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function checksum(text){let n=2166136261;for(let i=0;i<text.length;i++){n^=text.charCodeAt(i);n=Math.imul(n,16777619)}return(n>>>0).toString(16)}
function backupCode(){const state=JSON.parse(JSON.stringify(s)),data=JSON.stringify(state);return JSON.stringify({app:'han-pan-man',format:10,checksum:checksum(data),state})}
function validBackup(raw){
 if(typeof raw!=='string'||raw.length>2000000)throw Error('백업 코드 크기를 확인하세요.');
 const envelope=JSON.parse(raw),x=envelope.state,integer=(v,max=1000000000000)=>Number.isSafeInteger(v)&&v>=0&&v<=max;
 if(envelope.app!=='han-pan-man'||envelope.format!==10||!x||checksum(JSON.stringify(x))!==envelope.checksum)throw Error('올바른 한 판만 백업 코드가 아닙니다.');
 if(x.version!==5||!MODES[x.mode]||!['alive','bankrupt','retired'].includes(x.status)||x.night||x.lifeEvent||x.pendingSettlement)throw Error('낮의 활동을 마친 뒤 만든 백업만 가져올 수 있습니다.');
 for(const key of ['money','debt','due','bills','day','good','memories','peak','goalStage','shopCoupons'])if(!integer(x[key]))throw Error('금액 또는 진행 값이 손상되었습니다.');
 if(!x.day||x.goalStage>5||x.shopCoupons>3||!integer(x.home,5)||x.lifeGoal&&!LIFE_PATHS[x.lifeGoal])throw Error('목표 또는 주거 정보가 잘못되었습니다.');
 for(const key of ['owned','loans','history','effects','events','eventHistory','eventRecent','log','milestones'])if(!Array.isArray(x[key])||x[key].length>200)throw Error('기록 형식이 잘못되었습니다.');
 if(new Set(x.owned).size!==x.owned.length||x.owned.some(id=>!good(id)||!good(id).sellable))throw Error('소유권 정보가 잘못되었습니다.');
 for(const key of ['counts','businessLevels','luxuryLevels','businessStyles','roomUsed','provenance','story'])if(!x[key]||typeof x[key]!=='object'||Array.isArray(x[key]))throw Error('보유 정보가 잘못되었습니다.');
 for(const key of ['nextLoanId','bestStreak','baccaratVisits','nextEventDay','revision'])if(!integer(x[key]))throw Error('진행 기록이 손상되었습니다.');
 for(const [id,style]of Object.entries(x.businessStyles))if(good(id)?.tab!=='business'||!BUSINESS_STYLES[style])throw Error('사업 운영 방식이 잘못되었습니다.');
 for(const e of x.effects)if(!['upkeep','revenue'].includes(e.kind)||!Number.isFinite(e.amount)||Math.abs(e.amount)>1000000||!integer(e.remaining,1000)||!(e.kind==='upkeep'?integer(e.target,5):good(e.target)?.tab==='business'))throw Error('지속 효과가 잘못되었습니다.');
 if(x.dailyRooms){if(!integer(x.dailyRooms.day)||!x.dailyRooms.rooms||typeof x.dailyRooms.rooms!=='object')throw Error('상점 기록이 잘못되었습니다.');for(const [id,r]of Object.entries(x.dailyRooms.rooms))if(!ROOMS[id]||!r.bosses||![3,6].every(t=>BOSSES.some(b=>b.id===r.bosses[t]))||r.offers&&(!Array.isArray(r.offers)||r.offers.some(id=>!device(id))))throw Error('상점 기록이 잘못되었습니다.');}
 for(const [id,l]of Object.entries(x.businessLevels))if(good(id)?.tab!=='business'||!integer(l,3)||l<1)throw Error('사업 단계가 잘못되었습니다.');
 for(const [id,l]of Object.entries(x.luxuryLevels))if(!LUXURY[id]||!integer(l,3)||l<1)throw Error('소장품 단계가 잘못되었습니다.');
 for(const l of x.loans)if(!l||!integer(l.id)||!integer(l.balance)||!integer(l.principal)||!integer(l.due)||!integer(l.installment)||!Number.isFinite(l.rate)||l.rate<0||l.rate>1||!['bullet','installment'].includes(l.plan)||l.target&&!(l.target==='home'?x.home>0:x.owned.includes(l.target)&&good(l.target)?.tab==='business'))throw Error('대출 정보가 잘못되었습니다.');
 if(new Set(x.loans.map(l=>l.id)).size!==x.loans.length)throw Error('대출 기록이 중복되었습니다.');
 const m=x.market;if(!m||m.day!==x.day||!integer(m.seed,4294967295)||!integer(m.news,MARKET_NEWS.length-1)||!integer(m.newsUntil)||!Number.isSafeInteger(m.realized)||!integer(m.dividends)||!integer(m.tradeCount)||!Array.isArray(m.trades)||!Array.isArray(m.bulletin))throw Error('시장 정보가 잘못되었습니다.');
 for(const a of STOCKS){if(!integer(m.prices?.[a.id],10000000)||m.prices[a.id]<1||!Array.isArray(m.history?.[a.id])||!m.history[a.id].length||m.history[a.id].length>24||m.history[a.id].some(p=>!integer(p.day)||!integer(p.price,10000000)||p.price<1))throw Error('가격 정보가 잘못되었습니다.');}
 if(!m.holdings||typeof m.holdings!=='object'||Array.isArray(m.holdings)||m.trades.length>40||m.bulletin.some(v=>typeof v!=='string'))throw Error('시장 기록이 잘못되었습니다.');
 for(const t of m.trades)if(!STOCKS.some(a=>a.id===t.id)||!['buy','sell'].includes(t.side)||!integer(t.day)||!integer(t.qty,10000)||!integer(t.price,10000000)||!integer(t.fee)||!Number.isSafeInteger(t.profit))throw Error('매매 기록이 잘못되었습니다.');
 for(const [id,p]of Object.entries(m.holdings))if(!STOCKS.some(a=>a.id===id)||!integer(p.qty,1000000)||p.qty<1||!integer(p.cost))throw Error('주식 잔고가 잘못되었습니다.');
 if(!x.archive||!Array.isArray(x.archive.items)||x.archive.items.some(id=>!device(id))||!Array.isArray(x.archive.rooms)||x.archive.rooms.some(id=>!ROOMS[id])||!Array.isArray(x.archive.endings)||!integer(x.archive.clears))throw Error('도감이 잘못되었습니다.');
 if(x.project&&(!LIFE_PATHS[x.project.kind]||!integer(x.project.progress,3)||!integer(x.project.started)))throw Error('프로젝트 정보가 잘못되었습니다.');
 let nodes=0;function sanitize(v,depth=0){if(++nodes>20000||depth>15)throw Error('백업 구조가 너무 큽니다.');if(typeof v==='string')return escapeText(v);if(typeof v==='number'&&!Number.isFinite(v))throw Error('유효하지 않은 숫자입니다.');if(Array.isArray(v))return v.map(a=>sanitize(a,depth+1));if(v&&typeof v==='object'){const out={};for(const [k,a]of Object.entries(v)){if(['__proto__','constructor','prototype'].includes(k))throw Error('허용되지 않는 속성입니다.');out[k]=sanitize(a,depth+1)}return out}return v}
 return sanitize(x);
}
function saveTools(){
 if(s.night||s.lifeEvent||s.pendingSettlement)return notice('먼저 진행을 마쳐 주세요','귀가·사건·정산을 마친 뒤 낮에서 백업할 수 있습니다.');
 modal('내 인생 백업','<p>코드를 복사해 보관하면 다른 브라우저에서도 이어갈 수 있습니다. 가져오기는 현재 인생을 교체합니다.</p><label for="backupText">백업 코드</label><textarea id="backupText" rows="6" spellcheck="false"></textarea><p id="backupError" aria-live="polite"></p>',[['현재 코드 표시',()=>{$('backupText').value=backupCode()}],['코드 가져오기',()=>{let next;try{next=validBackup($('backupText').value)}catch(e){$('backupError').textContent=e.message;return}modal('이 백업으로 이어갈까요?','<p>'+next.day+'일 · 현금 '+fmt(next.money)+'<br>현재 인생은 복구용 체크포인트에 보관합니다.</p>',[['백업으로 교체',()=>{try{localStorage.setItem(BACKUP_KEY,JSON.stringify(s))}catch{}s=next;s.revision=read(KEY)?.revision||0;save();closeModal();show('homeScreen')}],['취소',saveTools]])}],['이전 체크포인트 복구',restoreCheckpoint],['닫기',closeModal]]);
}
function restoreCheckpoint(){
 const previous=read(BACKUP_KEY);if(!previous||previous.version!==5)return notice('체크포인트가 없습니다','하루를 정산하거나 백업을 가져오면 이전 인생 상태를 보관합니다.');
 modal('직전 체크포인트로 돌아갈까요?','<p>'+previous.day+'일 · 현금 '+fmt(previous.money)+'<br>현재 진행 대신 이 시점으로 돌아갑니다.</p>',[['복구한다',()=>{s=previous;s.revision=read(KEY)?.revision||0;save();closeModal();show('homeScreen');if(s.pendingSettlement)showSettlementRescue();else if(s.night)startNight();else if(s.lifeEvent)showLifeEvent()}],['취소',saveTools]]);
}
function bookLoanInterest(){for(const l of s.loans)if(l.interestDay!==s.day){l.currentInterest=Math.ceil(l.balance*l.rate);l.balance+=l.currentInterest;l.interestDay=s.day}}
function mortgageRisk(){
 let money=s.money;
 for(const l of s.loans){const interest=l.interestDay===s.day?l.currentInterest:Math.ceil(l.balance*l.rate),balance=l.balance+(l.interestDay===s.day?0:interest),due=l.plan==='installment'?Math.min(balance,l.installment+interest):s.day>=l.due?balance:0;if(l.target&&due>money)return true;money=Math.max(0,money-due)}
 return false;
}
function showSettlementRescue(){
 if(!s.pendingSettlement)return;
 modal('담보를 지킬 마지막 정리','<p>이번 결산의 현금으로는 담보대출 상환액이 부족합니다. 생활비와 사업 손익, 오늘 주가는 이미 확정됐습니다.</p><p>주식이나 담보가 아닌 물건을 팔거나 대출을 중도 상환할 수 있습니다. 정산을 계속하면 부족한 담보를 강제 처분합니다. 하루가 다시 지나지는 않습니다.</p>',[['주식 매도',()=>{closeModal();openDay('market')}],['물건 판매',()=>{closeModal();openDay('resale')}],['대출 확인',()=>{closeModal();openDay('bank')}],['정산 계속',finishSettlement,'primary']]);
}
function finishSettlement(){
 const pending=s.pendingSettlement;if(!pending)return;
 s.pendingSettlement=null;const rows=settleLoans();let body=pending.body;
 if(rows.length)body+='<div class="loan-settlement">'+rows.join('<br>')+'</div>';
 advanceProject();checkCollections();save();show('homeScreen');if(checkBankruptcy())return bankruptcy();queueLifeEvent();header();
 modal('아침의 계산서',body+'<div class="tutorial-box">현금 '+fmt(s.money)+' · 빚 '+fmt(totalDebt())+'<br>미납 '+fmt(s.bills)+'</div>',s.lifeEvent?[['오늘 도착한 사건',showLifeEvent,'primary']]:[['낮의 세계로',()=>{closeModal();openDay(restricted()?'bank':'market')},'primary'],['현관으로',closeModal]],s.day+'일째');
}

for(const g of GOODS.filter(x=>x.tab==='luxury'))if(!LUXURY[g.id])LUXURY[g.id]={text:l=>'감상 활동 · 추억 +'+(l+Math.floor(s.home/2))+' · 수집 세트와 방 꾸미기',action:'감상하기'};
function fresh(difficulty='hard',history=[]){return{market:newMarket(),businessStyles:{},dailyRooms:null,project:null,story:{},provenance:{},archive:{items:[],clears:0,rooms:[],endings:[]},baccaratVisits:0,pendingSettlement:null,revision:0,quickEffects:false,lifeGoal:null,goalStage:0,goalFinalClear:false,shopCoupons:0,luxuryLevels:{},roomUsed:{},version:5,mode:difficulty,money:MODES[difficulty].start,debt:0,due:0,bills:0,home:0,owned:[],counts:{},day:1,good:0,memories:0,bestStreak:0,peak:MODES[difficulty].start,lastNight:0,night:null,history,status:'alive',sound:false,loans:[],nextLoanId:1,businessLevels:{},ending:null,milestones:[],events:[],lifeEvent:null,eventHistory:[],eventRecent:[],effects:[],nextEventDay:2,log:['새 인생. 시작금은 이번 한 번뿐입니다.']}}
function read(key){try{return JSON.parse(localStorage.getItem(key))}catch{return null}}
const stored=read(KEY);let s=stored&&stored.version===5&&MODES[stored.mode]&&Array.isArray(stored.owned)&&Number.isFinite(stored.money)?stored:fresh();
let currentTab='luxury', saveFailed=false;
s.milestones=Array.isArray(s.milestones)?s.milestones:[];
s.events=Array.isArray(s.events)?s.events:[];
s.loans=Array.isArray(s.loans)?s.loans:[];s.nextLoanId=Math.max(s.nextLoanId||1,...s.loans.map(l=>l.id+1));s.businessLevels=s.businessLevels||{};s.ending=s.ending||null;
s.lifeEvent=s.lifeEvent||null;
s.lifeGoal=LIFE_PATHS[s.lifeGoal]?s.lifeGoal:null;s.goalStage=s.goalStage||0;s.goalFinalClear=!!s.goalFinalClear;s.shopCoupons=s.shopCoupons||0;s.luxuryLevels=s.luxuryLevels||{};s.roomUsed=s.roomUsed||{};
s.eventHistory=Array.isArray(s.eventHistory)?s.eventHistory:[];
s.eventRecent=Array.isArray(s.eventRecent)?s.eventRecent:[];
s.effects=Array.isArray(s.effects)?s.effects:[];
s.market=s.market||newMarket(s.day);s.businessStyles=s.businessStyles||{};s.project=s.project||null;s.story=s.story||{};s.provenance=s.provenance||{};s.archive=s.archive||{items:[],clears:0,rooms:[],endings:[]};s.baccaratVisits=s.baccaratVisits||0;s.pendingSettlement=s.pendingSettlement||null;s.revision=s.revision||0;
s.nextEventDay=Number.isFinite(s.nextEventDay)?s.nextEventDay:s.day+1;
if(s.night){const n=s.night;n.rules=n.rules||5;n.bag=n.bag||[];n.itemLife=n.itemLife||{};n.repairs=n.repairs||{};n.stakeMult=n.stakeMult||1;n.room=n.room||'normal';n.growth=n.growth||{};n.pairChain=n.pairChain||0;n.lastSymbol=n.lastSymbol||null;n.paid=n.paid||{};n.shopRolls=n.shopRolls||0;n.cleared=n.cleared||[];n.played=n.played??(n.hands>0||['dealt','choice','result','checkpoint'].includes(n.phase));}
function milestone(id,text){if(s.milestones.includes(id))return;s.milestones.push(id);s.events.unshift({day:s.day,text});s.events=s.events.slice(0,60);log(`✦ ${text}`)}
function lifeGoals(){return[
 ['collector','작은 취향 세 가지',s.owned.filter(id=>good(id)?.tab==='luxury').length,3],
 ['employer','세 곳에 내 이름을',s.owned.filter(id=>good(id)?.tab==='business').length,3],
 ['neighbor','누군가의 하루를 다섯 번',s.good,5],
 ['memories','평범해서 좋은 열 번',s.memories,10],
 ['homeowner','아파트 열쇠',s.home,3]
]}
function checkLifeGoals(){updateGoal();checkCollections();for(const[id,title,value,total]of lifeGoals())if(value>=total)milestone(`goal-${id}`,`삶의 목표 달성 · ${title}`)}
// Event offers are complete, serializable snapshots. A saved roll prevents refreshing for a new outcome.
function eventCatalog(){
 const round=n=>Math.ceil(n/10)*10,pick=list=>list[Math.floor(Math.random()*list.length)];
 const businesses=s.owned.map(good).filter(g=>g?.tab==='business'),luxuries=s.owned.map(good).filter(g=>g?.tab==='luxury');
 const b=pick(businesses),item=pick(luxuries),vehicle=pick(luxuries.filter(g=>['bike','motor','car','classiccar','supercar','yacht','jet'].includes(g.id)));
 const unit=round(Math.min(12000,Math.max(baseBet()*3,Math.max(0,wealth())*.06)));
 const bu=b?round(Math.max(250,businessCapital(b.id)*.2)):0,hu=round(Math.max(180,HOMES[s.home][2]*.08)),iu=item?round(Math.max(120,item.price*.4)):0;
 const effect=(title,kind,amount,remaining,target=null)=>({title,kind,amount,remaining,target});
 const rev=(title,amount,days=3)=>effect(title,'revenue',amount,days,b.id);
 const home=(title,amount,days=3)=>effect(title,'upkeep',amount,days,s.home);
 const outcome=(chance,text,cash=0,extra={})=>({chance,text,cash,...extra});
 const choice=(label,cost,outcomes)=>({label,cost,outcomes});
 const skip=(label='이번에는 거절한다')=>choice(label,0,[outcome(100,'평소의 하루로 돌아갔습니다.')]);
 const list=[],add=(id,group,icon,title,text,choices)=>list.push({id,group,icon,title,text,choices});
 if(b){
  add('contract','사업','📋','감당할 수 있을까, 대형 납품',`${b.name}에 평소보다 훨씬 큰 주문이 들어왔습니다. 선금 없이 재료부터 준비해야 합니다.`,[
   choice('작은 물량만 계약',bu,[outcome(100,'무리 없는 납품. 다음에도 연락하겠다는 말을 들었습니다.',round(bu*1.35))]),
   choice('전량 수주에 승부',bu*2,[outcome(55,'납품 대성공. 대금과 추가 주문이 밀려왔습니다.',bu*8,{effects:[rev('납품 소문',1.4,2)]}),outcome(45,'발주처가 계약을 취소했습니다. 재고 처리 비용까지 떠안았습니다.',-bu*2)]),skip()]);
  add('equipment','사업','🔧','멈춰 버린 핵심 설비',`${b.name}의 설비가 멈췄습니다. 수리 방식에 따라 다음 며칠의 매출이 달라집니다.`,[
   choice('정식 수리 기사 부르기',bu,[outcome(100,'수리를 마쳤습니다. 다음 결산부터 정상 영업합니다.')]),
   choice('저렴한 부품으로 직접 수리',round(bu*.25),[outcome(50,'운 좋게 맞는 부품을 찾았습니다.'),outcome(50,'고장이 더 커졌습니다. 긴급 수리비와 이틀 휴업을 감수합니다.',-bu*2,{effects:[rev('설비 고장 · 운영비는 발생',0,2)]})]),
   choice('수리를 미루고 축소 영업',0,[outcome(100,'손으로 할 수 있는 일만 받습니다.',0,{effects:[rev('축소 영업',.4,3)]})])]);
  add('spotlight','사업','📣','유명 채널의 방문 제안',`${b.name}을 소개해 주겠다는 연락입니다. 관심은 매출이 될 수도, 큰 지출만 될 수도 있습니다.`,[
   choice('소규모 홍보만 진행',round(bu*.4),[outcome(100,'동네 손님이 조금 늘었습니다.',0,{effects:[rev('동네 홍보',1.3,3)]})]),
   choice('대형 캠페인을 연다',bu*2,[outcome(45,'영상이 폭발적으로 퍼졌습니다.',bu*4,{effects:[rev('입소문 대박',2,3)]}),outcome(55,'광고비만 쓰고 손님은 오지 않았습니다.',0,{effects:[rev('과장 광고의 후폭풍',.6,2)]})]),skip()]);
  add('staff','사업','🤝','직원에게 온 다른 제안',`${b.name}을 함께 지켜 온 직원이 더 나은 조건을 제안받았습니다. 어떤 결정을 내릴까요?`,[
   choice('보너스와 교육에 투자',bu,[outcome(100,'함께 더 잘해 보기로 했습니다.',0,{effects:[rev('숙련된 팀',1.5,4)]})]),
   choice('새 직원을 급하게 채용',round(bu*.3),[outcome(40,'뜻밖의 인재를 만났습니다.',0,{effects:[rev('새로운 에이스',1.8,3)]}),outcome(60,'인수인계가 꼬였습니다.',-bu,{effects:[rev('채용 공백',.5,2)]})]),
   choice('직접 빈자리를 메운다',0,[outcome(100,'모든 일을 혼자 하니 몸이 두 개였으면 좋겠습니다.',0,{effects:[rev('혼자 하는 영업',.7,3)]})])]);
  if(!pledged(b.id))add('buyout','사업','💼','사업을 사고 싶다는 사람',`${b.name}을 눈여겨본 매수자가 찾아왔습니다. 성사되면 사업과 향후 수입·운영비를 넘깁니다.`,[
   choice('확정 제안을 받는다',0,[outcome(100,'계약서에 서명하고 열쇠를 넘겼습니다.',round(businessCapital(b.id)*.8),{remove:b.id})]),
   choice('더 큰 인수 금액을 요구',bu,[outcome(35,'협상이 통했습니다. 기대 이상의 매각입니다.',round(businessCapital(b.id)*2.2),{remove:b.id}),outcome(65,'협상이 결렬됐습니다. 자문료만 지출했고 사업은 남았습니다.')]),skip('계속 직접 운영한다')]);
  add('shipment','사업','📦','싸게 나온 대량 재고',`${b.name}에 원가 이하의 대량 재고가 제안됐습니다. 품질을 확인하기 전에는 장담할 수 없습니다.`,[
   choice('검수한 물량만 받기',bu,[outcome(100,'작지만 확실한 이익을 남겼습니다.',round(bu*1.25))]),
   choice('창고째 인수하기',bu*3,[outcome(40,'전부 멀쩡한 인기 상품이었습니다.',bu*11),outcome(60,'대부분 불량이었습니다. 폐기 비용까지 나왔습니다.',-bu*2)]),skip()]);
 }
 add('leak','주거','💧','천장에서 떨어지는 물',`${HOMES[s.home][1]}에 물이 샙니다. 당장 고칠지 버틸지 정해야 합니다.`,[
  choice('확실하게 수리한다',hu,[outcome(100,'물소리가 멎었습니다. 평소의 방으로 돌아왔습니다.')]),
  choice('임시 보수에 맡긴다',round(hu*.25),[outcome(65,'임시 보수가 잘 버텨 주었습니다.'),outcome(35,'물이 아래층까지 번졌습니다. 추가 수리비가 청구됐습니다.',-hu*4)]),
  choice('양동이를 놓고 버틴다',0,[outcome(100,'숙박·세탁 등 불편을 감수합니다.',0,{effects:[home('누수로 생긴 추가 생활비',round(hu*.3),3)]})])]);
 add('renovate','주거','🪚','방을 바꿀 기회',`이웃 공사팀이 ${HOMES[s.home][1]}도 함께 손봐 주겠다고 합니다. 집 매매가는 변하지 않습니다.`,[
  choice('필요한 단열만 보강',hu,[outcome(100,'밤이 조금 따뜻해졌습니다.',0,{effects:[home('단열 공사 · 주거비 절약',-Math.max(10,Math.floor(HOMES[s.home][3]*.4)),5)]})]),
  choice('공사에 공동 투자',hu*2,[outcome(40,'공동 공사가 크게 성공해 정산금을 받았습니다.',hu*7),outcome(60,'공사가 중단돼 추가 비용을 떠안았습니다.',-hu*3)]),skip('지금 집에 만족한다')]);
 add('location','주거','🎥','우리 집을 촬영 장소로',`촬영팀이 ${HOMES[s.home][1]}을 빌리고 싶어 합니다. 긴 촬영은 대가도, 손상 위험도 큽니다.`,[
  choice('짧은 촬영만 허락',0,[outcome(100,'해가 지기 전에 촬영팀이 철수했습니다.',round(hu*.4))]),
  choice('대규모 촬영을 맡긴다',hu,[outcome(50,'멋진 장면을 찍고 큰 대관료를 받았습니다.',hu*6),outcome(50,'가구와 벽이 손상됐습니다. 보증금을 빼도 수리비가 남았습니다.',-hu*3)]),skip('내 공간을 지킨다')]);
 add('district','주거','🏗️','동네 공동 개발 제안',`${HOMES[s.home][1]} 주변에 공사가 예정됐습니다. 공동 사업에 참여하면 생활에도 여파가 남습니다.`,[
  choice('생활 불편 지원금만 받기',0,[outcome(100,'작은 지원금을 받고 평소처럼 지냅니다.',round(hu*.25))]),
  choice('상가 개발에 공동 출자',hu*3,[outcome(35,'새 거리가 사람들로 가득 찼습니다.',hu*12),outcome(65,'개발이 무산됐고 정리 비용까지 청구됐습니다.',-hu*3,{effects:[home('미완공 공사의 불편',round(hu*.2),3)]})]),skip('관여하지 않는다')]);
 if(item){
  add('collector','소장품','🧐','뜻밖의 수집가',`누군가 당신의 ${item.name}을 찾고 있습니다. 팔면 소장품에서 사라집니다.`,[
   choice('확정 매입가에 넘긴다',0,[outcome(100,'다음 주인에게 물건을 넘겼습니다.',round(item.price*.9),{remove:item.id})]),
   choice('고가 경매에 출품',round(iu*.5),[outcome(35,'경쟁이 붙어 낙찰가가 치솟았습니다.',item.price*3,{remove:item.id}),outcome(65,'낙찰되지 않았습니다. 출품료만 내고 물건을 돌려받았습니다.')]),skip('계속 간직한다')]);
  add('auction','소장품','🔍','비슷한 물건의 진품 경매',`${item.name}을 아는 당신에게 비공개 거래가 제안됐습니다. 거래용 물건이며 현재 소장품은 그대로 남습니다.`,[
   choice('감정이 끝난 거래만 중개',round(iu*.5),[outcome(100,'확인된 거래를 중개하고 수수료를 받았습니다.',round(iu*.7))]),
   choice('진품을 믿고 직접 매입',iu*2,[outcome(40,'진품을 알아본 매수자가 큰돈을 냈습니다.',iu*8),outcome(60,'위조품이었습니다. 매입금은 돌려받지 못했습니다.')]),skip()]);
  add('exhibition','소장품','🖼️','내 취향을 보여 주는 날',`${item.name}을 중심으로 작은 전시를 열자는 제안입니다. 소장품은 판매하지 않습니다.`,[
   choice('친구들만 초대',round(iu*.15),[outcome(100,'좋아하는 이야기를 오래 나눴습니다.',0,{memories:2})]),
   choice('유료 전시회를 연다',iu,[outcome(45,'입장권이 매진됐습니다.',iu*4,{memories:2}),outcome(55,'빈 전시장을 지켰습니다. 철거 비용이 더 들었습니다.',-iu)]),skip('혼자 즐긴다')]);
 }
 if(vehicle){const vu=round(Math.max(150,vehicle.price*.12));add('vehicle','소장품','🛠️','애장품의 정비 경고',`${vehicle.name}의 정비 시기가 왔습니다. 방치하면 물건 자체를 잃을 수도 있습니다.`,[
  choice('정식 정비를 맡긴다',vu,[outcome(100,'다시 마음 놓고 사용할 수 있습니다.')]),
  choice('급한 곳만 고친다',round(vu*.3),[outcome(65,'간단한 정비로 해결됐습니다.'),outcome(35,'추가 고장이 생겨 큰 수리비를 냈습니다.',-vu*4)]),
  choice('이번 정비를 건너뛴다',0,[outcome(60,'이번에는 아무 일 없이 지나갔습니다.'),outcome(40,'수리가 불가능할 만큼 망가졌습니다.',0,{remove:vehicle.id})])]);}
 add('festival','생활','🎪','동네 축제의 빈 부스','올해 축제에 빈자리가 생겼습니다. 잠깐의 장사가 큰 기회가 될까요?',[
  choice('준비된 작은 부스만 맡기',round(unit*.4),[outcome(100,'작은 매대를 잘 정리하고 돌아왔습니다.',round(unit*.55),{memories:1})]),
  choice('메인 부스를 직접 연다',unit*2,[outcome(45,'축제 내내 줄이 끊이지 않았습니다.',unit*7,{memories:2}),outcome(55,'폭우로 축제가 취소됐습니다. 철수 비용까지 들었습니다.',-unit)]),skip('손님으로 구경한다')]);
 add('startup','생활','💡','친구의 첫 창업','오랜 친구가 사업 계획서를 들고 왔습니다. 성공하면 크게 나누지만 실패하면 투자금과 정리 비용을 잃습니다.',[
  choice('작은 후원만 한다',round(unit*.25),[outcome(100,'수익을 바라지 않는 응원을 건넸습니다.',0,{good:1})]),
  choice('공동 창업자로 참여',unit*3,[outcome(30,'회사가 인수돼 큰 정산금을 받았습니다.',unit*13),outcome(70,'문을 닫았습니다. 약속한 정리 비용도 부담했습니다.',-unit*3)]),skip('마음으로 응원한다')]);
 add('neighbors','생활','🫂','동네의 긴급 모금','오래된 쉼터의 운영이 어려워졌습니다. 방법을 골라 도울 수 있습니다.',[
  choice('가능한 만큼 후원',round(unit*.3),[outcome(100,'며칠의 따뜻한 식사를 마련했습니다.',0,{good:2})]),
  choice('자선 장터를 주최',unit,[outcome(50,'후원자가 몰렸습니다. 운영 대가를 받고 기부도 마쳤습니다.',unit*3,{good:3}),outcome(50,'모금보다 장소 대여비가 더 컸습니다.',-unit,{good:2})]),
  choice('시간으로 봉사한다',0,[outcome(100,'잠시 숫자를 잊고 사람들을 만났습니다.',0,{memories:1})])]);
 add('trip','생활','🧳','낯선 도시의 주말','뜻밖에 빈자리가 난 여행입니다. 거래 제안이 섞인 여행도 있습니다.',[
  choice('가까운 곳으로 소풍',round(unit*.2),[outcome(100,'도시락을 비우고 돌아왔습니다.',0,{memories:2})]),
  choice('해외 한정품 구매 여행',unit*2,[outcome(40,'찾던 한정품을 구해 바로 판매했습니다.',unit*7,{memories:2}),outcome(60,'재고는 없었고 항공편까지 취소됐습니다.',-unit)]),skip('집에서 쉰다')]);
 return [...list,...sequelEvents()];
}
function queueLifeEvent(){
 if(s.lifeEvent||s.status!=='alive'||s.night||s.day<s.nextEventDay)return false;
 const all=eventCatalog(),fresh=all.filter(e=>!s.eventRecent.includes(e.id)),pool=fresh.length?fresh:all;
 let groups=[...new Set(pool.map(e=>e.group))];const last=s.eventHistory[0]?.group;if(groups.length>1)groups=groups.filter(g=>g!==last);
 const group=groups[Math.floor(Math.random()*groups.length)],choices=pool.filter(e=>e.group===group),event=choices[Math.floor(Math.random()*choices.length)];
 s.lifeEvent={...event,day:s.day,phase:'choice',roll:Math.random()};s.eventRecent=[event.id,...s.eventRecent].slice(0,6);s.nextEventDay=s.day+2+(Math.random()<.35?1:0);save();return true;
}
function effectText(e){const target=e.kind==='revenue'?good(e.target)?.name:HOMES[e.target]?.[1];return`${target||'생활'} · ${e.title}: ${e.kind==='revenue'?`매출 ×${e.amount} (운영비 유지)`:`하루 생활비 ${e.amount>=0?'+':''}${fmt(e.amount)}`} · 앞으로 ${e.remaining}회 결산`}
function outcomeText(o,cost){const net=o.cash-cost,parts=[`현금 ${net>=0?'+':''}${fmt(net)}`];if(o.remove)parts.push(`${good(o.remove).name} 처분`);if(o.good)parts.push(`선행 +${o.good}`);if(o.memories)parts.push(`추억 +${o.memories}`);(o.effects||[]).forEach(e=>parts.push(effectText(e)));return`${o.chance}% · ${parts.join(' / ')}`}
function blockedByEvent(){if(!s.lifeEvent)return false;showLifeEvent();return true}
function showLifeEvent(){
 const e=s.lifeEvent;if(!e)return;
 if(e.phase==='result')return modal(e.result.title,`<p>${e.result.text}</p><div class="event-result">${e.result.details}</div><p>현금 ${fmt(s.money)} · 미납금 ${fmt(s.bills)}<br>감당하지 못한 손실은 미납금으로 남습니다.</p>`,[['결과 확인',finishLifeEvent,'primary']],`${e.group} 사건 · ${e.title}`);
 modal(`${e.icon} ${e.title}`,`<p>${e.text}</p><div class="event-wallet">현금 <b>${fmt(s.money)}</b> · ${e.day}일째<br><small>결과의 현금 변화는 참가비를 뺀 순손익입니다. 손실이 현금을 넘으면 미납금으로 남습니다.</small></div><div class="event-choices">${e.choices.map((c,i)=>`<button class="event-choice" data-lifechoice="${i}" ${s.money<c.cost||c.cost>0&&restricted()?'disabled':''}><span class="event-choice-title">${c.label}</span><span class="event-cost">${c.cost?`필요 현금 ${fmt(c.cost)}`:'선불 비용 없음'}${s.money<c.cost?' · 현금 부족':c.cost>0&&restricted()?' · 미납·만기 빚 먼저 해결':''}</span>${c.outcomes.map(o=>`<span class="event-outcome">${outcomeText(o,c.cost)}</span>`).join('')}</button>`).join('')}</div><p class="event-footnote">하나를 선택하면 바로 적용됩니다. 선택과 결과는 자동 저장됩니다.</p>`,[],`${e.day}일째 · ${e.group} 사건`);bind('lifechoice',i=>resolveLifeEvent(Number(i)));
}
function resolveLifeEvent(index){
 const e=s.lifeEvent,c=e?.choices[index];if(!e||e.phase!=='choice'||!c||s.money<c.cost||c.cost>0&&restricted())return;
 let threshold=0;const o=c.outcomes.find(o=>(threshold+=o.chance)>e.roll*100)||c.outcomes[c.outcomes.length-1];
 e.phase='result';const balance=s.money-c.cost+o.cash;s.money=Math.max(0,balance);s.bills+=Math.max(0,-balance);
 if(o.remove)removeBusiness(o.remove);
 if(o.story)s.story[o.story]=o.step;
 if(e.id==='contract'&&o.cash>c.cost)s.story.contract=Math.max(1,s.story.contract||0);
 s.effects.push(...(o.effects||[]).map(f=>({...f})));s.good+=o.good||0;s.memories+=o.memories||0;
 const net=o.cash-c.cost,details=[`현금 변화 ${net>=0?'+':''}${fmt(net)}`,o.remove?`${good(o.remove).name} 소유권 상실`:'',...(o.effects||[]).map(effectText),o.good?`선행 +${o.good}`:'',o.memories?`추억 +${o.memories}`:''].filter(Boolean).join('<br>');
 e.result={title:net>0?'뜻밖의 수익':net<0?'선택의 대가':'오늘의 선택',text:o.text,details};
 s.eventHistory.unshift({day:s.day,id:e.id,group:e.group,title:e.title,choice:c.label,text:o.text,details});s.eventHistory=s.eventHistory.slice(0,30);
 log(`${e.title} · ${c.label} · 현금 ${fmt(net)}`);checkLifeGoals();save();header();showLifeEvent();
}
function finishLifeEvent(){if(s.lifeEvent?.phase!=='result')return;s.lifeEvent=null;save();closeModal();openDay('events');if(checkBankruptcy())bankruptcy()}
function businessMultiplier(id){return worldBusinessMultiplier(id)*(1+luxLevel('suit')*.03)*s.effects.filter(e=>e.kind==='revenue'&&e.target===id&&e.remaining>0).reduce((v,e)=>v*e.amount,1)}
function expireEffects(){s.effects=s.effects.map(e=>({...e,remaining:e.remaining-1})).filter(e=>e.remaining>0)}
function clearAssetEffects(kind,target){s.effects=s.effects.filter(e=>!(e.kind===kind&&e.target===target))}
function loanOffers(){
 const offers=[];
 if(!s.loans.some(l=>l.kind==='risk'))offers.push({key:'risk',kind:'risk',name:'고금리 승부 대출',target:null,cap:Math.min(100000,Math.floor((5000+s.peak*.2)/100)*100),rate:.15,term:4});
 if(s.home>0&&!pledged('home'))offers.push({key:'home',kind:'secured',name:HOMES[s.home][1]+' 담보',target:'home',cap:Math.floor(HOMES[s.home][2]*.6/100)*100,rate:.06,term:6});
 for(const id of s.owned){const g=good(id);if(g?.tab==='business'&&!pledged(id))offers.push({key:id,kind:'secured',name:g.name+' 담보',target:id,cap:Math.floor(businessCapital(id)*.6/100)*100,rate:.06,term:6})}
 return offers.filter(o=>o.cap>0);
}
function takeLoan(key,plan='bullet'){
 if(blockedByEvent()||s.night||s.status!=='alive'||restricted())return;const offer=loanOffers().find(o=>o.key===key);if(!offer||!['bullet','installment'].includes(plan))return;
 const amount=offer.cap,due=s.day+offer.term,installment=Math.ceil(amount/offer.term);
 modal(offer.name,`<div class="tutorial-box">받는 돈 ${fmt(amount)} · 하루 이자 ${offer.rate*100}%</div><p>${plan==='bullet'?`${due}일째 원리금 일시 상환. 중도 상환하지 않으면 약 ${fmt(Math.ceil(amount*Math.pow(1+offer.rate,offer.term)))} 상환.`:`앞으로 ${offer.term}번 결산마다 원금 최대 ${fmt(installment)} + 잔액에 대한 이자를 자동 상환.`}</p><p>${offer.target?'분할 상환액 또는 만기 원리금을 현금으로 못 내면 담보를 즉시 강제 매각합니다. 남는 돈은 반환하고 모자란 돈은 미납금이 됩니다. 담보 해지 전 임의 판매·이사는 제한됩니다.':'갚지 못한 원리금은 미납금으로 남습니다. 추가 고금리 대출로 만기를 연장할 수 없습니다.'}</p>`,[['계약하고 빌린다',()=>{
  if(s.night||s.status!=='alive'||restricted()||!loanOffers().some(o=>o.key===key))return;
  s.loans.push({...offer,id:s.nextLoanId++,principal:amount,balance:amount,due,plan,installment});s.money+=amount;log(`${offer.name} ${fmt(amount)} · ${due}일 만기`);closeModal();afterAction();
 },'primary'],['취소',closeModal]],'게임머니 대출 계약');
}
function payLoan(id){if(blockedByEvent()||s.night||s.status!=='alive')return;const l=s.loans.find(l=>l.id===Number(id));if(!l)return;const amount=Math.min(s.money,l.balance);if(!amount)return;s.money-=amount;l.balance-=amount;if(l.balance===0)s.loans=s.loans.filter(x=>x!==l);log(`${l.name} ${fmt(amount)} 상환`);afterAction()}
function removeBusiness(id){s.owned=s.owned.filter(x=>x!==id);delete s.businessLevels[id];delete s.businessStyles[id];delete s.luxuryLevels[id];clearAssetEffects('revenue',id)}
function foreclose(l){
 const value=collateralValue(l.target);if(l.target==='home'){clearAssetEffects('upkeep',s.home);s.home=0}else removeBusiness(l.target);
 const balance=s.money+value-l.balance;s.money=Math.max(0,balance);s.bills+=Math.max(0,-balance);s.loans=s.loans.filter(x=>x!==l);
 const text=`${l.name} 강제 처분 ${fmt(value)} · 채무 ${fmt(l.balance)} 정산`;log(text);s.events.unshift({day:s.day,text});s.events=s.events.slice(0,60);return text;
}
function liquidateLoan(id){if(blockedByEvent()||s.night||s.status!=='alive')return;const l=s.loans.find(l=>l.id===Number(id));if(!l?.target)return;modal('담보를 처분할까요?',`<p>${l.name} 처분가 ${fmt(collateralValue(l.target))}<br>갚을 잔액 ${fmt(l.balance)}<br>차액은 현금으로 받으며, 부족분은 보유 현금에서 내고 남으면 미납금이 됩니다.</p>`,[['담보 처분',()=>{if(!s.loans.includes(l)||s.night)return;foreclose(l);closeModal();afterAction()},'primary'],['취소',closeModal]])}
function settleLoans(){
 const rows=[];
 for(const l of [...s.loans]){
  if(l.paymentDay===s.day)continue;l.paymentDay=s.day;
  const interest=l.interestDay===s.day?l.currentInterest:Math.ceil(l.balance*l.rate);if(l.interestDay!==s.day){l.balance+=interest;l.currentInterest=interest;l.interestDay=s.day;}
  if(l.plan==='installment'&&l.target&&s.money<Math.min(l.balance,l.installment+interest)){rows.push(foreclose(l));continue}
  if(l.plan==='installment'){
   const amount=Math.min(l.balance,l.installment+interest),paid=Math.min(s.money,amount);s.money-=paid;s.bills+=amount-paid;l.balance-=amount;rows.push(`${l.name}: 상환 ${fmt(amount)} (이자 ${fmt(interest)} 포함)`);
   if(!l.balance)s.loans=s.loans.filter(x=>x!==l);
  }else if(s.day>=l.due){
   if(l.target&&s.money<l.balance)rows.push(foreclose(l));
   else{const paid=Math.min(s.money,l.balance);s.money-=paid;s.bills+=l.balance-paid;s.loans=s.loans.filter(x=>x!==l);rows.push(`${l.name}: 만기 ${fmt(l.balance)} 정산${paid<l.balance?' · 부족분 미납':''}`)}
  }else rows.push(`${l.name}: 이자 +${fmt(interest)} · ${l.due-s.day}일 후 만기`);
 }
 return rows;
}
function upgradeBusiness(id){
 if(blockedByEvent()||s.night||s.status!=='alive'||restricted()||!owns(id)||good(id)?.tab!=='business'||pledged(id))return;
 const level=businessLevel(id),cost=good(id).price*level;if(level>=3||s.money<cost)return;
 const g=good(id),next=level+1;
 modal(`${g.name} 확장`, `<p>${['','동네 가게','인기 매장','체인 사업'][level]} → ${['','동네 가게','인기 매장','체인 사업'][next]}<br>투자 ${fmt(cost)}<br>매출과 운영비가 함께 증가합니다. 휴업이면 커진 운영비를 모두 부담합니다.</p>`,[['확장한다',()=>{if(businessLevel(id)!==level||!owns(id)||pledged(id)||s.money<cost||s.night)return;s.money-=cost;s.businessLevels[id]=next;log(`${g.name} ${next}단계 확장`);closeModal();afterAction();specializeBusiness(id)},'primary'],['취소',closeModal]]);
}
function retirementOptions(){return[
 {id:'purpose',name:(LIFE_PATHS[s.lifeGoal]?.name||'꿈')+' · 약속을 지킨 인생',ok:s.goalStage===5,text:'선택한 인생 목표 다섯 단계 달성'},
 {id:'peace',name:'빚 없는 작은 은퇴',ok:wealth()>=10000,text:'순자산 1만 이상'},
 {id:'business',name:'내 이름을 남긴 사업가',ok:s.owned.filter(id=>good(id)?.tab==='business'&&businessLevel(id)===3).length>=3,text:'3단계 사업 세 곳'},
 {id:'patron',name:'이름 없는 후원자',ok:s.good>=20,text:'선행 20회'},
 {id:'collector',name:'취향으로 채운 인생',ok:s.owned.filter(id=>good(id)?.tab==='luxury').length>=15,text:'소장품 15개'},
 {id:'home',name:'마지막 집의 열쇠',ok:s.home>=4,text:'펜트하우스 이상'}
 ]}
function retire(id){
 if(blockedByEvent()||s.night||s.status!=='alive'||totalDebt()||s.bills)return;const ending=retirementOptions().find(e=>e.id===id);if(!ending?.ok)return;
 modal('이 인생을 마칠까요?',`<p>${ending.name}<br>${s.day}일의 삶 · 순자산 ${fmt(wealth())}<br>은퇴하면 이번 인생은 읽기 전용으로 남습니다. 새 출발할 때 결말을 지난 인생 기록에 보관합니다.</p>`,[['은퇴한다',()=>{if(s.status!=='alive'||s.night||totalDebt()||s.bills)return;s.status='retired';s.ending=ending.name;if(!s.archive.endings.includes(ending.name))s.archive.endings.push(ending.name);log(ending.name+'으로 은퇴');save();closeModal();openDay('retire')},'primary'],['조금 더 살아본다',closeModal]]);
}
function resale(g){return Math.floor(g.tab==='business'?businessCapital(g.id)*.5:(LUXURY[g.id]?luxuryCapital(g.id):g.price)*.6)}
function assets(){return stockValue()+s.owned.reduce((a,id)=>a+(good(id)?.sellable?resale(good(id)):0),0)+Math.floor(HOMES[s.home][2]*.8)}
function wealth(){return s.money+assets()+(s.night?.pot||0)-totalDebt()-s.bills}
function log(t){s.log.unshift(t);s.log=s.log.slice(0,12)}
function save(){updateGoal();if(s.night?.devices)for(const id of s.night.devices)if(!s.archive.items.includes(id))s.archive.items.push(id);s.revision=(s.revision||0)+1;s.peak=Math.max(s.peak,wealth());try{localStorage.setItem(KEY,JSON.stringify(s))}catch{if(!saveFailed){saveFailed=true;$('saveWarning').classList.remove('hidden')}}}
function baseBet(){return Math.ceil(mode().base*(1+(s.day-1)*.14)/10)*10}
function bet(){const n=s.night;return expanded(n)?n.handStake||tableBase(n)*(n.stakeMult||1):tableBase(n)}
function loanLimit(){return Math.min(25000,Math.floor((800+Math.max(0,assets()-stockValue()-lockedAssets())*.35)/100)*100)}
function credit(){return s.bills||s.debt&&s.day>=s.due?0:Math.max(0,loanLimit()-s.debt)}
function upkeep(){return Math.max(Math.ceil(mode().living*.5),mode().living+HOMES[s.home][3]-luxLevel('radio')*5-luxLevel('bike')*10+s.effects.filter(e=>e.kind==='upkeep'&&e.target===s.home&&e.remaining>0).reduce((v,e)=>v+e.amount,0))}
function restricted(){return !!s.pendingSettlement||s.bills>0||s.debt>0&&s.day>=s.due}
function required(){return s.bills+(s.debt&&s.day>=s.due?s.debt:0)+baseBet()}
function checkBankruptcy(){if(s.status!=='alive'||s.night||s.lifeEvent||s.pendingSettlement)return false;if(s.money+Math.max(0,assets()-lockedAssets())+credit()<required()){s.status='bankrupt';log('더 이상 버틸 자산이 없어 파산했습니다.');save();return true}return false}
function header(){
 $('cashForecast').innerHTML=s.pendingSettlement?'<b>담보 처분 전 정산 대기</b>'+btn('id="resumeSettlement"','재산 정리 / 정산 계속'):'<span>다음 생활·상환 예상 <b>'+fmt(forecastCosts())+'</b></span><small>사업 손익·주가·새 사건 별도 · '+marketNews().title+'</small>';if(s.pendingSettlement)$('resumeSettlement').onclick=showSettlementRescue;
 const path=LIFE_PATHS[s.lifeGoal];$('goalBar').innerHTML=path?'<b>🎯 '+path.name+' · '+s.goalStage+'/5</b><span>'+(s.goalStage===5?'달성! 은퇴·결말에서 인생을 마무리할 수 있어요.':'다음 목표: '+path.steps[s.goalStage])+'</span><small>상점 할인권 '+s.shopCoupons+'장 · 눌러 전체 경로 보기</small>':'<b>🎯 이번 인생의 목표를 정하세요</b><span>사업가 · 내 집 · 후원자 · 투자자</span>';
 $('lifeMoney').textContent=fmt(s.money);$('lastNight').textContent=fmt(s.lastNight);$('bestStreak').textContent=s.bestStreak;$('ownedCount').textContent=s.owned.length;$('lifePath').textContent=s.status==='retired'?'은퇴':s.status==='bankrupt'?'파산':s.good>=10?'이름 없는 후원자':s.home>=4?'높은 곳의 삶':s.debt?'빚 위의 인생':'다시 한 판';
 $('economyBar').innerHTML=`<span>${mode().name} · ${s.day}일째</span><span>${HOMES[s.home][0]} ${HOMES[s.home][1]}</span><span>빚 <b>${fmt(totalDebt())}</b>${s.debt?` · ${s.due-s.day>0?s.due-s.day+'일 후 만기':'오늘 만기'}`:''}</span><span>미납 ${fmt(s.bills)}</span>`;
 $('nightBtn').textContent=s.status==='retired'?'은퇴 기록 보기':s.status==='bankrupt'?'새 인생 시작':s.night?'진행 중인 밤 계속':'밤으로 간다';
 $('lifeStatus').innerHTML=s.lifeEvent?'<b>✉ 오늘 도착한 사건</b><span>결정이 당신의 생활을 바꿉니다.</span>':s.effects.length?`<b>⏳ 이어지고 있는 영향 ${s.effects.length}개</b><span>${s.effects.map(effectText).join('<br>')}</span>`:'<b>✉ 숫자 밖의 인생</b><span>귀가 후 2~3일 간격으로 사업·주거·생활 사건이 찾아옵니다.</span>';
 $('homeNote').textContent=`순자산 ${fmt(wealth())} · 다음 판돈 ${fmt(baseBet())} · 하루 생활·주거비 ${fmt(upkeep())}. 실제 돈이 아닌 게임머니입니다.`;
}
function show(screen){['homeScreen','nightScreen','dayScreen','baccaratScreen'].forEach(id=>$(id).classList.toggle('hidden',id!==screen));header()}
function modal(title,body,actions,kicker=''){ $('modalTitle').textContent=title;$('modalBody').innerHTML=body;$('modalKicker').textContent=kicker;$('modalActions').replaceChildren();for(const[label,fn,cls='']of actions){const b=document.createElement('button');b.textContent=label;b.className=cls;b.onclick=fn;$('modalActions').appendChild(b)}$('modal').classList.remove('hidden')}
function closeModal(){$('modal').classList.add('hidden')}
function notice(t,b){modal(t,`<p>${b}</p>`,[['알겠어',closeModal,'primary']])}
function beep(f=440){if(!s.sound)return;try{const c=beep.c||(beep.c=new(window.AudioContext||window.webkitAudioContext)()),o=c.createOscillator(),g=c.createGain();o.frequency.value=f;g.gain.setValueAtTime(.035,c.currentTime);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+.1);o.connect(g).connect(c.destination);o.start();o.stop(c.currentTime+.1)}catch{}}
function bankruptcy(){modal('이번 인생은 여기까지',`<p>현금·처분 가능한 재산·남은 대출 한도로는 미납금, 만기 빚과 최소 판돈을 마련할 수 없습니다.</p><div class="tutorial-box">${s.day}일 생존 · 최고 순자산 ${fmt(s.peak)}<br>남은 빚 ${fmt(totalDebt()+s.bills)}</div><p>새 인생에서는 재산과 빚이 초기화됩니다. 이번 인생의 기록은 남습니다.</p>`,[['새 인생 시작',newLife,'primary'],['기록 살펴보기',()=>{closeModal();openDay('records')}]],'파산')}
function newLife(){modal('다시 시작할 난이도',`<p>현재 인생을 마치고 현금·물건·집·빚을 초기화합니다. 지난 인생 기록은 유지됩니다.</p><p>하드: 시작 ${fmt(1200)}, 하루 이자 8%<br>지옥: 시작 ${fmt(900)}, 하루 이자 14%</p>`,[['하드로 새 출발',()=>reset('hard'),'primary'],['지옥으로 새 출발',()=>reset('hell')],['취소',closeModal]])}
function reset(m){const archive=JSON.parse(JSON.stringify(s.archive));const history=[{day:s.day,peak:s.peak,mode:mode().name,reason:s.status==='retired'?s.ending:s.status==='bankrupt'?'파산':'새 출발',good:s.good},...s.history].slice(0,20),sound=s.sound;s=fresh(m,history);s.archive=archive;s.sound=sound;save();closeModal();show('homeScreen');chooseGoal()}
function beginNight(roomId='normal'){if(s.pendingSettlement)return showSettlementRescue();if(blockedByEvent())return;if(s.status==='retired')return openDay('retire');if(s.status==='bankrupt')return bankruptcy();if(s.night){show('nightScreen');renderNight();return resumePhase()}if(checkBankruptcy())return bankruptcy();if(!ROOMS[roomId])return;if(restricted()||s.money<baseBet()*ROOMS[roomId].stake)return modal('먼저 생활을 정리해야 해',`<p>판돈 ${fmt(baseBet()*ROOMS[roomId].stake)}가 필요합니다. 미납금이나 만기 대출이 있으면 입장할 수 없습니다.</p><p>은행에서 빚을 갚거나, 중고 판매·주거 다운그레이드로 현금을 마련하세요.</p>`,[['낮의 세계로',()=>{closeModal();openDay('bank')},'primary'],['닫기',closeModal]]);
 const daily=dailyRoom(roomId),bosses=[daily.bosses[3],daily.bosses[6]];
 s.night={rules:10,room:roomId,stakeMult:1,handStake:null,bag:[],itemLife:{},repairs:{},preShop:false,loanPremium:0,table:1,hands:0,roundHands:0,tableScore:0,start:s.money,pot:0,risk:1,streak:0,cards:[null,null,null],locked:[false,false,false],rerolls:0,devices:[],insured:false,phase:'starter',offers:s.goalStage>=2||s.archive.clears>0?['roseLuck','skullLuck','pairEngine','coinBank','tripleLens']:['roseLuck','skullLuck','pairEngine'],result:'',growth:{},pairChain:0,lastSymbol:null,bosses:{3:bosses[0],6:bosses[1]},paid:{},shopRolls:0,cleared:[],played:false};save();show('nightScreen');renderNight();chooseDevice();
}
function shuffled(items){const list=[...items];for(let i=list.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[list[i],list[j]]=[list[j],list[i]]}return list}
function draw(){const weights=Object.entries(symbolWeights());let r=Math.random()*weights.reduce((a,[,w])=>a+w,0);for(const[id,w]of weights){r-=w;if(r<0)return id}return'coin'}
function rerollCost(){return Math.ceil(bet()*(has('cheapDraw')?.1:.25)*(1-luxLevel('headphone')*.05))}
function deal(reroll=false){const n=s.night;if(!n)return startNight();if(s.status!=='alive')return bankruptcy();if(!reroll&&n.phase!=='ready'){renderNight();return resumePhase()}if(reroll&&(n.phase!=='dealt'||n.rerolls>=rerollLimit()||n.locked.every(Boolean)))return;const cost=reroll?rerollCost():bet();if(s.money<cost)return modal('판돈이 부족해요',`<p>필요한 돈 <b>${fmt(cost)}</b> / 현재 현금 <b>${fmt(s.money)}</b></p><p>귀가한 뒤 대출·중고 판매·집 줄이기로 현금을 마련할 수 있습니다.${n.phase==='dealt'?' 현재 패로 승부할 수도 있습니다.':''}</p>`,[['계속 보기',closeModal],['귀가하기',leave,'primary']]);s.money-=cost;n.played=true;if(!reroll){n.handSpent=cost;n.locked=[false,false,false];if(expanded(n))n.handStake=cost;}n.cards=n.cards.map((c,i)=>reroll&&n.locked[i]?c:draw());n.phase='dealt';if(reroll){n.rerolls++;n.handSpent=(n.handSpent||bet())+cost;n.rerollSpent=(n.rerollSpent||0)+cost;}save();renderNight();header();beep(330)}
function toggleLock(i){const n=s.night;if(n?.phase!=='dealt')return;if(!n.locked[i]&&bossFor()?.id==='seal'&&n.locked.some(Boolean))return notice('한 장만 고정할 수 있어요','봉인하는 딜러의 규칙입니다. 고정된 패를 먼저 해제해 주세요.');n.locked[i]=!n.locked[i];save();renderNight()}
function evaluate(){const n=s.night;if(!n||n.phase!=='dealt')return;n.phase='result';const points=handScore(n,n.cards),result=handValue(n,n.cards,bet()),{win}=result;n.growth=result.growth;n.pairChain=result.nextPair;if(result.usedInsurance)n.insured=true;n.lastSymbol=win&&result.count>=2?result.symbol:null;n.breakdown=result.notes;expireItems(result);n.tableScore+=scored(n)?points:win;n.lastScore=scored(n)?points:null;n.result=result.label;n.lastNet=win-(n.handSpent||bet());
 if(win){n.pot+=win;n.streak++;s.bestStreak=Math.max(s.bestStreak,n.streak);n.phase='choice'}else{n.result+=` · 누적 ${fmt(n.pot)} 소멸`;n.pot=0;n.risk=1;n.streak=0}
 save();renderNight();header();beep(win?760:100);resumePhase();
}
function resumePhase(){const n=s.night;if(!n)return;if(n.type==='baccarat')return renderBaccarat();const details=n.breakdown?.length?`<p class="score-notes">${n.breakdown.join(' → ')}</p>`:'';switch(n.phase){case'choice':return modal(n.result,`<div class="tutorial-box">현재 누적 ${fmt(n.pot)}${scored(n)?'<br>이번 통과 점수 +'+scoreText(n.lastScore)+' · 순손익 '+fmt(n.lastNet):''}</div>${details}<p>당첨금에는 원금이 포함됩니다. 한 쌍만으로는 손해일 수도 있습니다.</p><p>챙기면 현금으로 확정. 다시 걸면 다음 배율이 오르지만 꽝에 누적금이 전부 사라집니다. 다음 판돈도 별도로 필요합니다.</p>`,[['돈을 챙긴다',()=>resolveChoice(false),'primary'],...(mayRisk(n)?[['전부 다시 건다',()=>resolveChoice(true)]]:[])]);case'result':return modal(n.result,details+'<p>이미 낸 판돈과 다시 뽑기 비용은 돌려받지 못합니다.</p>',[['다음 판',advanceHand,'primary']]);case'starter':case'device':return chooseDevice();case'shop':return renderNightShop();case'checkpoint':return checkpoint();case'route':return chooseRoute();}}
function resolveChoice(risk){const n=s.night;if(n?.phase!=='choice')return;risk=!!risk&&mayRisk(n);n.phase='resolved';if(risk)n.risk=Math.min(4,Math.round((n.risk+.5+(has('greed')?.25:0))*100)/100);else{s.money+=n.pot;n.pot=0;n.risk=1;n.streak=0}advanceHand()}
function target(){if(scored())return Math.ceil(SCORE_GOALS[s.night.table-1]*room().goal*(frontier()?ROUTES[s.night.route]?.goal||1:1)*(s.mode==='hell'?1.2:1));return Math.ceil((expanded()?tableBase():bet())*(modern()?GOALS[s.night.table-1]*(s.mode==='hell'?1.2:1):4)*(expanded()?room().goal:1))}
function advanceHand(){const n=s.night;if(!n||!['resolved','result'].includes(n.phase))return;closeModal();n.hands++;if(modern(n))n.roundHands++;n.cards=[null,null,null];n.locked=[false,false,false];n.rerolls=0;n.handStake=null;n.doubleTicket=false;n.ignoreBoss=false;n.extraReroll=0;n.phase='ready';if(modern(n)?n.roundHands>=handLimit(n)||n.tableScore>=target():n.hands%3===0)n.phase='checkpoint';save();renderNight();header();resumePhase()}
function checkpoint(){const n=s.night;if(n?.phase!=='checkpoint')return;const passed=n.tableScore>=target();if(passed&&modern(n)&&!n.cleared.includes(n.table)){n.cleared.push(n.table);if(bossFor())milestone(`boss-${bossFor().id}`,`${bossFor().name}를 처음 이긴 밤`);if(n.table===6){milestone('clear-six','마지막 테이블까지 살아 돌아온 밤');if(scored(n)&&!frontier(n)&&s.goalStage>=4)s.goalFinalClear=true;completeReward(n);}save()}
 modal(passed?'테이블 통과':'목표 미달 · 퇴장',`${frontier(n)?failureReview(n):''}<p>${scored(n)?'통과 점수':'당첨 합계'} <b>${scoreText(n.tableScore)}</b> / 목표 ${scoreText(target())}</p><p>${passed?'다음 테이블의 목표는 더 가파르게 오릅니다. 장치 조합을 준비하세요.':'이번 밤의 도전이 끝났습니다. 현금과 남은 누적금은 정산합니다.'}</p>${modern(n)&&passed?upcomingBossText(n):''}`,passed&&n.table<6?[['밤 상점으로',openNightShop,'primary'],['지금 귀가',endNight]]:[['정산하고 귀가',endNight,'primary']],n.table===6&&passed?'여섯 테이블 완주':`테이블 ${n.table}`)
}
function chooseDevice(){const n=s.night;if(!n||!['starter','device'].includes(n.phase))return;modal(n.phase==='starter'?'오늘 밤의 승부수':'이번 밤의 장치',`<p>세 장의 짝을 맞추는 룰은 같습니다. 첫 장치 하나를 무료로 선택하세요. ${modern(n)?'장치 슬롯 3개와 소모품 가방 2칸. 준비 상점에서 물건을 사고 시작합니다.':'진행 중이던 밤은 기존 목표로 마무리합니다.'}</p>${upcomingBossText(n)}<div class="choice-grid">${n.offers.filter(id=>device(id)).map(id=>{const d=device(id);return`<button class="choice" data-device="${id}"><small>${d.tag}</small><b>${d.name}</b><small>${d.text}</small></button>`}).join('')}</div>`,[]);bind('device',selectDevice)}
function selectDevice(id){const n=s.night;if(!n||!['starter','device'].includes(n.phase)||!n.offers.includes(id)||has(id))return;n.devices.push(id);n.paid[id]=0;n.offers=[];n.phase='ready';if(expanded(n)){n.preShop=true;n.phase='shop';n.offers=frontier(n)?[...(dailyRoom(n.room).offers||stock())].filter(x=>!n.devices.includes(x)):stock();if(frontier(n)&&!dailyRoom(n.room).offers)dailyRoom(n.room).offers=[...n.offers]}save();closeModal();renderNight();if(n.phase==='shop')renderNightShop()}
function upcomingBossText(n=s.night){if(!modern(n))return'';const table=n.table<3?3:n.table<6?6:6,boss=bossFor(n,table);return boss?`<p class="boss-preview">${table}번 보스 · ${boss.icon} <b>${boss.name}</b><br>${boss.text}<br><small>${boss.hint}</small></p>`:''}
function stock(){
 const n=s.night,available=shuffled(DEVICES.filter(d=>!n.devices.includes(d.id)&&!n.bag.includes(d.id)&&(expanded(n)||DEVICES.indexOf(d)<19)).map(d=>d.id)),tags=n.devices.map(id=>device(id)?.tag),gear=available.filter(id=>device(id).kind!=='consumable'),mate=gear.find(id=>tags.includes(device(id).tag));
 if(!expanded(n))return(mate?[mate,...gear.filter(id=>id!==mate)]:gear).slice(0,3);
 const selected=[],take=id=>{if(id&&!selected.includes(id)&&selected.length<4)selected.push(id)};
 take(mate||gear[0]);for(const kind of ['timed','durable'])if(!selected.some(id=>device(id).kind===kind))take(gear.find(id=>device(id).kind===kind));
 gear.forEach(take);return[...selected,...available.filter(id=>device(id).kind==='consumable').slice(0,2)];
}
function merchant(n=s.night){return ['잡화상','수리공','암시장'][((n?.table||1)-1)%3]}
function devicePrice(id,purchase=true){const d=device(id),discount=expanded()?(merchant()==='수리공'&&d.kind==='durable'?.8:merchant()==='암시장'&&d.kind==='timed'?.8:1):1;return Math.ceil(baseBet()*d.price*(expanded()?room().stake:1)*discount*(scored()?1-Math.max(0,luxLevel('watch')-1)*.05:1)*(purchase&&scored()&&s.shopCoupons>0?.9:1)-1e-9)}
function refreshPrice(){return Math.ceil(baseBet()*.25*(s.night.shopRolls+1)*(expanded()?room().stake:1)*(1-luxLevel('lamp')*.1))}
function openNightShop(){const n=s.night;if(n?.phase!=='checkpoint'||n.table>=6||n.tableScore<target())return;if(!modern(n)){n.table++;n.tableScore=0;n.phase='device';n.offers=shuffled(DEVICES.slice(9).map(d=>d.id).filter(id=>!has(id))).slice(0,3);save();renderNight();return chooseDevice()}s.money+=n.pot;n.pot=0;n.risk=1;n.streak=0;n.phase='shop';n.shopRolls=0;n.reserved=null;n.offers=stock();save();header();renderNightShop()}
function renderNightShop(){
 const n=s.night;if(n?.phase!=='shop')return;
 modal(merchant()+' · 밤 상점',`<p>현금 <b>${fmt(s.money)}</b> · 장치 ${n.devices.length}/3 · 가방 ${n.bag.length}/2<br>${n.preShop?'첫 승부 준비':'누적금을 현금으로 확정했습니다.'} · 다음 최소 판돈 ${fmt(tableBase({...n,table:n.preShop?n.table:n.table+1}))}</p><p>핵심 장치는 밤새 유지 · 기간제는 승부 확정마다 감소 · 내구도는 효과 발동 때만 감소<br>${scored()?`할인권 ${s.shopCoupons}장 · 다음 구입 10% 할인<br>`:''}${merchant()==='수리공'?'내구도 장치 20% 할인':merchant()==='암시장'?'기간제 장치 20% 할인':'장치와 소모품을 함께 판매'}${owns('workshop')&&!n.repairDiscountUsed?' · 공방 소유: 첫 유료 수리 20% 할인':''}</p>${upcomingBossText(n)}<div class="night-shop-grid">${n.offers.map(id=>{const d=device(id),full=d.kind==='consumable'?n.bag.length>=2:n.devices.length>=3;return `<article class="shop-card"><small>${d.tag} · ${lifeLabel(id,n)}</small><h3>${d.name}</h3><p>${d.text}</p>${d.kind!=='consumable'?btn('data-compare="'+id+'"','효과 미리보기'):''}<button data-nightbuy="${id}" ${full||s.money<devicePrice(id)?'disabled':''}>${full?'칸이 가득 참':fmt(devicePrice(id))+' 구입'}</button>${luxLevel('watch')?btn('data-reserve="'+id+'"',n.reserved===id?'예약 해제':'새로고침 때 보존'):''}</article>`}).join('')||'<p>진열이 비었습니다.</p>'}</div><h3>내 장치 · 수리 / 판매</h3><div class="owned-devices">${n.devices.map(id=>`<div><b>${device(id).name}</b><small>${lifeLabel(id,n)}</small>${btn('data-nightsell="'+id+'"',fmt(itemSale(id))+' 판매')}${device(id).kind==='durable'?btn('data-repair="'+id+'"','수리 '+fmt(repairPrice(id)),(n.itemLife[id]??device(id).life)>=device(id).life||s.money<repairPrice(id)):''}</div>`).join('')||'장치 없음'}</div><p>사용한 장치는 남은 수명에 따라 판매가가 줄어듭니다. 무료 장치 판매가 0원. 유료 수리는 같은 장치마다 비싸집니다.</p><div class="bag-list">${n.bag.map(id=>btn('data-useitem="'+id+'"',device(id).name+' 사용')).join('')}</div>`,[[n.preShop?'첫 테이블 시작':'다음 테이블',nextTable,'primary'],['진열 새로고침 '+fmt(refreshPrice()),refreshStock],['오늘은 귀가',endNight]],`${room().name} · 테이블 ${n.table}`);
 bind('compare',previewDevice);bind('reserve',reserveOffer);bind('nightbuy',buyDevice);bind('nightsell',sellDevice);bind('repair',repairItem);bind('useitem',itemAction);
}
function buyDevice(id){const n=s.night,d=device(id);if(n?.phase!=='shop'||!n.offers.includes(id)||!d)return;const bag=d.kind==='consumable';if(bag?n.bag.length>=2:n.devices.includes(id)||n.devices.length>=3)return;const price=devicePrice(id);if(s.money<price)return;s.money-=price;if(scored()&&s.shopCoupons>0)s.shopCoupons--;if(n.reserved===id)n.reserved=null;if(bag)n.bag.push(id);else{n.devices.push(id);n.paid[id]=price;n.itemLife[id]=d.life}if(id==='loanAmulet')n.loanPremium=.05;n.offers=n.offers.filter(x=>x!==id);save();header();renderNightShop()}
function sellDevice(id){const n=s.night;if(n?.phase!=='shop'||!n.devices.includes(id))return;const price=itemSale(id);modal(`${device(id).name} 판매`, `<p>${fmt(price)}을 받고 장치를 제거합니다. 이번 밤 동안 쌓은 성장치는 유지되지만 장치를 갖고 있어야 효과가 적용됩니다.</p>`,[['판매한다',()=>{if(n!==s.night||n.phase!=='shop'||!n.devices.includes(id))return;s.money+=price;n.devices=n.devices.filter(x=>x!==id);delete n.paid[id];delete n.itemLife[id];save();header();renderNightShop()},'primary'],['취소',renderNightShop]])}
function refreshStock(){const n=s.night;if(n?.phase!=='shop')return;const price=refreshPrice();if(s.money<price)return modal('새로고침 비용 부족',`<p>${fmt(price)}이 필요합니다.</p>`,[['상점으로',renderNightShop,'primary']]);s.money-=price;n.shopRolls++;const reserved=n.offers.includes(n.reserved)?n.reserved:null;n.offers=stock();if(reserved&&!n.offers.includes(reserved)){const kind=device(reserved).kind==='consumable',i=n.offers.findIndex(id=>(device(id).kind==='consumable')===kind);if(i>=0)n.offers[i]=reserved;}save();header();renderNightShop()}
function nextTable(){const n=s.night;if(n?.phase!=='shop')return;if(frontier(n)&&!n.preShop){n.phase='route';save();return chooseRoute()}if(n.preShop)n.preShop=false;else n.table++;n.roundHands=0;n.tableScore=0;n.lastSymbol=null;n.phase='ready';n.offers=[];save();closeModal();renderNight()}
function startNight(){
 if(s.pendingSettlement)return showSettlementRescue();if(blockedByEvent())return;if(s.status==='retired')return openDay('retire');if(s.status==='bankrupt')return bankruptcy();if(s.night)return beginNight();
 if(checkBankruptcy())return bankruptcy();if(!s.lifeGoal)return chooseGoal();
 modal('오늘은 어느 판으로?',`<p>판돈은 테이블을 오를수록 증가합니다. 입장 후 매 판 배율을 고를 수 있으며, 패를 뽑은 뒤에는 바꿀 수 없습니다.</p><div class="lobby-grid">${Object.entries(ROOMS).map(([id,r])=>`<article class="shop-card"><small>${r.name}</small><h3>시작 판돈 ${fmt(baseBet()*r.stake)}</h3><p>판돈 선택 ×1 ~ ×${r.max}<br>트리플 지급 ×${({normal:1,vip:1.1,secret:1.2}[id])}<br>목표 난도 ×${r.goal}<br>확률은 동일. 높은 판돈은 현금만 키우며 통과 점수는 그대로입니다.</p>${btn(`data-room="${id}"`,'입장하기',restricted()||s.money<baseBet()*r.stake)}</article>`).join('')}${card('♠','바카라 살롱','플레이어 · 뱅커 · 무승부 중 선택.<br>한 밤 최대 12판 · 생활과 같은 지갑',btn('id="enterBaccarat"','바카라 입장',restricted()||s.money<baseBet()))}</div>`,[['현관으로',closeModal],['대출·재산 관리',()=>{closeModal();openDay('bank')}]],'일반 · VIP · 심야');bind('room',beginNight);$('enterBaccarat').onclick=beginBaccarat;
}
function changeStake(mult){const n=s.night;if(!expanded(n)||n.phase!=='ready'||n.pot>0||![1,2,5,10,20].includes(mult)||mult>room(n).max)return;n.stakeMult=mult;save();renderNight()}
function expireItems(result){
 const n=s.night;if(!expanded(n))return;const expired=[];
 for(const id of [...n.devices]){const d=device(id);
  if(d.kind==='timed'){n.itemLife[id]=(n.itemLife[id]??d.life)-1;if(id==='rentedCrown'&&result.count===1)n.itemLife[id]=0;if(n.itemLife[id]<=0){n.devices=n.devices.filter(x=>x!==id);delete n.itemLife[id];delete n.paid[id];expired.push(d.name+' 소멸')}}
  if(d.kind==='durable'&&result.usedCharges.includes(id)){n.itemLife[id]=Math.max(0,(n.itemLife[id]??d.life)-1);if(!n.itemLife[id])expired.push(d.name+' 고장')}
 }
 if(expired.length)n.breakdown.push(...expired);
}
function itemSale(id){const n=s.night,d=device(id);return Math.floor((n.paid[id]||0)*.5*(d.kind==='timed'||d.kind==='durable'?Math.max(.2,(n.itemLife[id]??d.life)/d.life):1))}
function repairPrice(id){const n=s.night;return Math.ceil(devicePrice(id,false)*.45*(frontier()&&s.night.route==='repair'?.75:1)*(1+(n.repairs[id]||0))*(owns('workshop')&&!n.repairDiscountUsed? .8:1))}
function repairItem(id){const n=s.night,d=device(id);if(!expanded(n)||n.phase!=='shop'||!n.devices.includes(id)||d?.kind!=='durable'||(n.itemLife[id]??d.life)>=d.life)return;const cost=repairPrice(id);if(s.money<cost)return;s.money-=cost;if(owns('workshop'))n.repairDiscountUsed=true;n.itemLife[id]=d.life;n.repairs[id]=(n.repairs[id]||0)+1;save();header();renderNightShop()}
function itemAction(id){
 const n=s.night;if(!expanded(n)||!n.bag.includes(id)||!['ready','dealt','shop'].includes(n.phase))return;
 const d=device(id),paint={rosePaint:'rose',skullPaint:'skull',coinPaint:'coin'};
 const back=()=>{closeModal();renderNight();if(n.phase==='shop')renderNightShop()};
 if(paint[id]){if(n.phase!=='dealt')return notice('패를 뽑은 뒤 사용하세요','그림을 바꿀 패 한 장을 직접 선택할 수 있습니다.');return modal(d.name,'<p>바꿀 패를 고르세요. 보스 규칙과 최종 지급액은 변경한 패에 다시 적용됩니다.</p>',[...n.cards.map((c,i)=>[`${i+1}번 ${SYMBOLS[c].name}`,()=>useItem(id,i),'primary']),['취소',back]])}
 if(id==='repairKit'||id==='extension'){
  const targets=n.devices.filter(x=>id==='repairKit'?device(x).kind==='durable'&&(n.itemLife[x]??device(x).life)<device(x).life:device(x).kind==='timed'&&(n.itemLife[x]??device(x).life)<5);
  return modal(d.name,`<p>${targets.length?'대상을 고르세요.':'사용할 수 있는 대상이 없습니다. 물건은 그대로 보관합니다.'}</p>`,[...targets.map(x=>[device(x).name,()=>useItem(id,x),'primary']),['취소',back]]);
 }
 if(n.phase!=='dealt')return notice('패를 뽑은 뒤 사용하세요',d.text);
 modal(d.name,`<p>${d.text}. 사용하면 사라집니다.</p>`,[['사용한다',()=>useItem(id),'primary'],['취소',back]]);
}
function useItem(id,target){
 const n=s.night;if(!expanded(n)||!n.bag.includes(id)||!['ready','dealt','shop'].includes(n.phase))return false;
 const paint={rosePaint:'rose',skullPaint:'skull',coinPaint:'coin'};
 if(paint[id]){if(n.phase!=='dealt'||!Number.isInteger(target)||target<0||target>2)return false;n.cards[target]=paint[id]}
 else if(id==='repairKit'){if(!n.devices.includes(target)||device(target).kind!=='durable'||(n.itemLife[target]??device(target).life)>=device(target).life)return false;n.itemLife[target]=device(target).life;n.repairs[target]=(n.repairs[target]||0)+1}
 else if(id==='extension'){if(!n.devices.includes(target)||device(target).kind!=='timed'||(n.itemLife[target]??device(target).life)>=5)return false;n.itemLife[target]=Math.min(5,(n.itemLife[target]??device(target).life)+2)}
 else{if(n.phase!=='dealt')return false;if(id==='dealerGlove'){if(n.ignoreBoss||!bossFor(n))return false;n.ignoreBoss=true}else if(id==='doubleTicket'){if(n.doubleTicket)return false;n.doubleTicket=true}else if(id==='redrawTicket'){if(n.extraReroll)return false;n.extraReroll=1}else return false}
 n.bag.splice(n.bag.indexOf(id),1);save();closeModal();header();renderNight();if(n.phase==='shop')renderNightShop();return true;
}
function rerollLimit(){if(bossFor()?.id==='hush'&&handIndex()===0)return 0;return(has('extraDraw')?2:1)+(s.night?.extraReroll||0)}
function leave(){if(!s.night)return;if(s.night.type==='baccarat')return modal('바카라를 마칠까요?','<p>공개된 결과는 이미 현금에 반영되었습니다. 플레이했다면 하루 생활비·이자·사업을 정산합니다.</p>',[['계속 플레이',closeModal],['정산하고 귀가',endNight,'primary']]);if(!['ready','dealt'].includes(s.night.phase))return resumePhase();modal('오늘 밤을 마칠까요?',`<p>${s.night.phase==='dealt'?'아직 승부하지 않은 패를 포기하면 현재 누적금도 모두 잃습니다. 승부 후 귀가할 수도 있습니다.':'남은 누적금은 현금으로 챙깁니다.'} 이미 낸 판돈은 반환되지 않습니다.</p><p>한 번이라도 패를 뽑았으면 하루가 지나고 생활비·주거비 ${fmt(upkeep())}, 대출 이자 및 사업 결산이 적용됩니다.</p>`,[['밤에 남는다',closeModal],['정산하고 귀가',endNight,'primary']])}
function endNight(){
 const n=s.night;if(!n){if(s.pendingSettlement)showSettlementRescue();return}
 try{localStorage.setItem(BACKUP_KEY,n.type==='day'?localStorage.getItem(KEY):JSON.stringify(s))}catch{}
 const played=n.played||n.hands>0;if(n.phase==='dealt')n.pot=0;s.money+=n.pot||0;const gambling=s.money-n.start;s.lastNight=n.type==='day'?0:gambling;
 s.night=null;let body='<p>'+(n.type==='day'?'낮의 일거리':'밤의 순손익')+' <b>'+fmt(gambling)+'</b></p>';
 if(!played){save();closeModal();show('homeScreen');return modal('아침의 계산서',body+'<p>플레이하지 않아 날짜·생활비·시세가 그대로입니다. 같은 날 재입장해도 준비 상점과 보스는 유지됩니다.</p>',[['현관으로',closeModal]])}
 s.day++;if(n.type==='baccarat'&&n.hands>=3)s.baccaratVisits++;
 let business=0;const rows=[];
 for(const id of s.owned){const g=good(id);if(g?.tab!=='business')continue;const factor=businessDayFactor(id),mult=businessMultiplier(id)*(n.manage?1.2:1),net=Math.floor(businessStats(g).revenue*factor*mult)-businessStats(g).expense;business+=net;rows.push(g.name+' · '+businessStyle(id).name+' '+fmt(net));}
 const market=tickMarket();const interest=Math.ceil(s.debt*(mode().interest+(n.loanPremium||0)));s.debt+=interest;
 const costs=upkeep();expireEffects();const balance=s.money+business-costs;s.money=Math.max(0,balance);s.bills+=Math.max(0,-balance);
 body+='<p>사업 순손익 '+fmt(business)+'<br>생활·주거비 -'+fmt(costs)+'<br>소액 신용대출 이자 +'+fmt(interest)+'<br>주식 배당 +'+fmt(market.dividends)+'</p><details><summary>사업과 시장 결산</summary><p>'+[...rows,...market.lines].join('<br>')+'</p></details>';
 log(s.day+'일 · '+(n.type==='day'?'일거리 ':'밤 ')+fmt(gambling)+', 사업 '+fmt(business)+', 생활비 '+fmt(costs));
 bookLoanInterest();s.pendingSettlement={body};save();closeModal();show('homeScreen');if(mortgageRisk())return showSettlementRescue();finishSettlement();
}
function renderNight(){const n=s.night;if(!n)return;if(n.type==='baccarat')return renderBaccarat();show('nightScreen');$('buildSummary').innerHTML=buildSummary(n);$('oddsStrip').innerHTML=Object.entries(SYMBOLS).map(([id,v])=>'<span>'+v.icon+' 기본 현금 짝 ×'+Number((v.pair*(frontier(n)?.75:1)).toFixed(3))+' / 셋 ×'+Number((v.triple*(frontier(n)?.75:1)*roomCashBonus(n)).toFixed(3))+'</span>').join('');$('tableLabel').textContent=`${n.table} / 6`;$('chipLabel').textContent=fmt(s.money);$('potLabel').textContent=fmt(n.pot);$('riskLabel').textContent=`×${n.risk}`;$('betAmount').textContent=fmt(bet());$('deviceCount').textContent=`${n.devices.length} / ${modern(n)?3:5}`;
 $('deviceRack').innerHTML=n.devices.length?n.devices.map(id=>{const d=DEVICES.find(x=>x.id===id);return`<div class="device"><b>${d.name}</b><small>${d.text}</small><strong class="item-life">${lifeLabel(id,n)}</strong></div>`}).join(''):'<span class="empty">목표를 채우면 밤 상점에서 장치를 구입할 수 있습니다</span>';
 $('stakeControls').innerHTML=expanded(n)?`<span>${room(n).name} · 판돈 배율</span>${[1,2,5,10,20].filter(x=>x<=room(n).max).map(x=>btn('data-stake="'+x+'"',`×${x} · ${fmt(tableBase(n)*x)}`,n.phase!=='ready'||n.pot>0||x===n.stakeMult)).join('')}<small>${scored(n)?'판돈 배율은 현금에만 적용. 통과 점수는 그림·장치 조합으로 얻습니다.':'진행 중인 밤은 기존 금액 점수를 유지합니다.'}</small>`:'<small>진행 중이던 밤은 기존 판돈으로 마무리합니다.</small>';
 $('bagRack').innerHTML=`<span>소모품 가방 ${n.bag.length}/2</span>${n.bag.map(id=>btn('data-useitem="'+id+'"',device(id).name+' 사용',!['ready','dealt'].includes(n.phase))).join('')||'<small>밤 상점에서 구입 · 귀가 시 사라짐</small>'}`;bind('stake',v=>changeStake(Number(v)));bind('useitem',itemAction);
 $('dealerLine').textContent=`남은 승부 ${Math.max(0,handLimit(n)-handIndex(n))}회 · ${scored(n)?'통과 점수':'당첨 합계'} ${scoreText(n.tableScore)} / 목표 ${scoreText(target())}`;
 $('runTrack').innerHTML=Array.from({length:6},(_,i)=>`<span class="${n.table===i+1?'current':''}">${i+1}${bossFor(n,i+1)?' ♠':''}${n.cleared?.includes(i+1)?' ✓':''}</span>`).join('');
 const boss=bossFor(n);$('bossBanner').innerHTML=boss?`<b>${boss.icon} ${boss.name}</b><br>${boss.text}<small>${boss.hint}</small>`:modern(n)?upcomingBossText(n):'기존 밤 이어하기 · 다음 밤부터 조합 모드 적용';
 const weights=symbolWeights(n),total=Object.values(weights).reduce((a,b)=>a+b,0);$('drawOdds').textContent='현재 뽑기 확률 · '+Object.entries(weights).map(([id,w])=>`${SYMBOLS[id].name} ${(w/total*100).toFixed(1)}%`).join(' / ');
 if(n.phase==='dealt'){const result=handValue(n,n.cards,bet());$('handPreview').innerHTML=`<b>지급 ${fmt(result.win)} · 이번 판 순손익 ${fmt(result.win-(n.handSpent||bet()))}${scored(n)?' · 통과 +'+scoreText(handScore(n,n.cards)):''}</b><br><small>${result.notes.join(' → ')}</small>`}else $('handPreview').textContent=n.phase==='ready'?'원하는 그림을 고정하고 나머지를 다시 뽑으세요.':'선택을 마치면 다음 승부가 시작됩니다.';
 document.querySelectorAll('.slot').forEach((el,i)=>{const c=n.cards[i];el.classList.toggle('locked',n.locked[i]);el.disabled=n.phase!=='dealt';el.querySelector('i').textContent=c?SYMBOLS[c].icon:'?';el.querySelector('b').textContent=c?SYMBOLS[c].name:'?';el.querySelector('.lock-label').textContent=n.locked[i]?'고정됨':'누르면 고정'});
 $('dealBtn').classList.toggle('hidden',n.phase!=='ready');$('rerollBtn').classList.toggle('hidden',n.phase!=='dealt'||n.rerolls>=rerollLimit());$('rerollBtn').disabled=n.locked.every(Boolean)||s.money<rerollCost();$('settleBtn').classList.toggle('hidden',n.phase!=='dealt');$('rerollCost').textContent=fmt(rerollCost());
}
function openDay(tab='luxury'){if(blockedByEvent())return;if(s.night)return startNight();currentTab=tab;show('dayScreen');renderDay()}
function card(icon,title,text,buttons=''){return`<article class="shop-card"><span class="icon">${icon}</span><h3>${title}</h3><p>${text}</p>${buttons}</article>`}
function btn(attr,label,disabled=false){return`<button ${attr} ${disabled?'disabled':''}>${label}</button>`}
function bind(attr,fn){document.querySelectorAll(`[data-${attr}]`).forEach(b=>b.onclick=()=>fn(b.dataset[attr]))}
function renderDay(){header();document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===currentTab));const intro={retire:'큰돈을 번 뒤 멈추는 것도 선택입니다. 빚 없는 은퇴와 여러 인생 결말을 모아 보세요.',events:'귀가한 아침에 2~3일 간격으로 찾아오는 선택. 보유한 사업·집·물건에 맞는 사건이 나타납니다. 확률과 참가비를 뺀 순손익을 확인하세요.',luxury:'멋은 영원하지 않아도, 중고값은 남습니다. 소장품은 구입가의 60%에 판매.',donation:'돌려받을 수 없는 돈. 대신 누군가의 하루에 남습니다.',business:'하루에 한 번 결산. 휴업 25%·평일 40%·성황 35%. 휴업에도 운영비 발생. 매각가는 50%.',small:'한 번의 기억으로 남는 소비. 소비한 경험은 되팔 수 없습니다.',room:'현재 집과 소장품. 어려울 때는 중고 시장에서 정리할 수 있습니다.',bank:'소액 신용대출 · 고금리 승부 대출 · 집과 사업 담보. 매일 분할 또는 만기 일시상환을 선택하세요. 모든 이자는 밤 정산 또는 하루 보내기에만 발생합니다.',housing:'담보가 잡힌 집은 은행에서 먼저 정산해야 합니다. 현재 집을 80%에 처분하고 새 집 값을 냅니다. 집을 줄이면 차액을 받습니다. 이사 왕복에는 손실이 생깁니다.',resale:'물건은 60%, 사업은 50%에 매각. 기부와 소비한 경험은 판매 불가.',records:'파산해도 지난 인생의 기록은 남습니다. 저장은 현재 브라우저에만 보관됩니다.'};$('dayIntro').textContent=intro[currentTab];$('shopGrid').className='shop-grid';const dead=s.status!=='alive';
 if(currentTab==='market')return renderMarket();if(currentTab==='desk')return renderLifeDesk();
 if(currentTab==='events'){
 $('shopGrid').innerHTML=card('⏳','계속되는 영향',s.effects.map(effectText).join('<br><br>')||'아직 남아 있는 영향이 없습니다. 사건의 여파는 밤 정산 또는 하루 보내기를 할 때만 줄어듭니다.')+card('✉','다음 편지',`다음 사건까지 플레이 후 귀가 ${Math.max(1,s.nextEventDay-s.day)}회<br>사업 6종 · 주거 4종 · 소장품 4종 · 생활 4종<br>사건을 해결해야 다음 활동을 시작합니다. 선불 비용 없는 선택도 있습니다.`)+s.eventHistory.map(e=>card('📜',`${e.day}일 · ${e.title}`,`<b>${e.choice}</b><br>${e.text}<br><br>${e.details}`)).join('');return;
 }
 if(currentTab==='bank'){
 $('shopGrid').innerHTML=card('🏦','소액 신용대출',`현재 빚 ${fmt(s.debt)}<br>하루 복리 ${mode().interest*100}% · 만기 ${s.debt?s.due+'일째':'5일 후'}<br>추가 가능 ${fmt(credit())}`,[...new Set([200,500,1000,credit()])].filter(v=>v>0).map(v=>btn('data-borrow="'+v+'"',fmt(v)+' 빌리기',dead||credit()<v)).join(''))+
 card('🧾','빚과 미납금',`전체 대출 ${fmt(totalDebt())}<br>미납금 ${fmt(s.bills)}<br>고금리·담보대출은 아래 계약별로 상환합니다.`,btn('data-pay="bills"','미납금 납부',dead||!s.bills||!s.money)+btn('data-pay="all"','소액 신용대출 상환',dead||!s.debt||!s.money))+
 s.loans.map(l=>card(l.target?'🔑':'⚠️',l.name,`남은 원리금 ${fmt(l.balance)}<br>하루 이자 ${l.rate*100}% · ${l.due}일 만기<br>${l.plan==='bullet'?'만기 일시 상환':'결산마다 원금 '+fmt(l.installment)+' + 이자'}${l.target?'<br>담보 처분가 '+fmt(collateralValue(l.target)):''}`,btn('data-payloan="'+l.id+'"','가능한 만큼 중도 상환',dead||!s.money)+(l.target?btn('data-liquidate="'+l.id+'"','담보 처분으로 정산',dead):''))).join('')+
 loanOffers().map(o=>card(o.target?'🏠':'🎲',o.name,`대출금 ${fmt(o.cap)}<br>하루 이자 ${o.rate*100}% · ${o.term}일 계약<br>${o.target?'분할 상환액·만기 원리금 부족 시 담보 강제 매각. 부족액은 미납.':'만기 상환 실패 시 원리금이 미납금으로 전환.'}`,btn('data-newloan="'+o.key+'|bullet"','만기 일시상환 계약',dead||restricted())+btn('data-newloan="'+o.key+'|installment"','매일 분할상환 계약',dead||restricted()))).join('');
 bind('borrow',v=>borrow(Number(v)));bind('pay',pay);bind('payloan',payLoan);bind('liquidate',liquidateLoan);bind('newloan',v=>takeLoan(...v.split('|')));return;
 }
 if(currentTab==='business'){
 $('shopGrid').innerHTML=GOODS.filter(g=>g.tab==='business').sort((a,b)=>a.price-b.price).map(g=>{const stats=businessStats(g),level=businessLevel(g.id),owned=owns(g.id);return card(g.icon,g.name,`${g.text}<br>${SECTORS[businessSector(g.id)]} · 시장 매출 ×${worldBusinessMultiplier(g.id).toFixed(2)}<br>${businessStyle(g.id).name} · ${businessStyle(g.id).text}<br>${['flowers','bakery','cafe','hotel'].includes(g.id)?'5의 배수 날짜: 성수기 매출 ×1.2<br>':''}${owned?['','1단계 · 동네 가게','2단계 · 인기 매장','3단계 · 체인 사업'][level]:'창업 '+fmt(g.price)}<br>기본 평일 순익 ${fmt(stats.revenue-stats.expense)}<br>기본 성황 순익 ${fmt(Math.floor(stats.revenue*1.6)-stats.expense)} · 휴업 손실 ${fmt(stats.expense)}<br>실제 매출에는 시장·사건·성수기 효과가 추가됩니다.${owned?'<br>매각가 '+fmt(resale(g)):''}${pledged(g.id)?'<br><b>담보 설정 중</b>':''}`,owned?btn('data-upgrade="'+g.id+'"',level>=3?'최대 확장':`확장 ${fmt(g.price*level)}`,dead||level>=3||pledged(g.id)||restricted()||s.money<g.price*level)+btn('data-specialize="'+g.id+'"','운영 방향 선택',dead||level<2||!!s.businessStyles[g.id]||pledged(g.id)):btn('data-buy="'+g.id+'"','구입하기',dead||restricted()||s.money<g.price))}).join('');bind('buy',buy);bind('upgrade',upgradeBusiness);bind('specialize',specializeBusiness);return;
 }
 if(currentTab==='retire'){
 $('shopGrid').innerHTML=card('🌅',s.status==='retired'?s.ending:'언제 멈출 것인가',`${s.day}일째 · 순자산 ${fmt(wealth())}<br>대출과 미납금이 모두 없어야 은퇴할 수 있습니다. 은퇴 후 재산과 기록은 열람할 수 있고 새 인생을 시작할 수 있습니다.`,s.status==='retired'?btn('id="endingRestart"','새 인생 시작'):'')+retirementOptions().map(e=>card('📖',e.name,e.text+'<br>'+(e.ok?'조건 달성':'아직 진행 중'),btn('data-retire="'+e.id+'"','이 결말로 은퇴',dead||!e.ok||totalDebt()>0||s.bills>0))).join('');bind('retire',retire);if(s.status==='retired')$('endingRestart').onclick=newLife;return;
 }
 if(currentTab==='housing'){$('shopGrid').innerHTML=HOMES.map(([icon,name,price,fee],i)=>{const delta=price-Math.floor(HOMES[s.home][2]*.8);return card(icon,name,`${homeBenefit(i)}<br>매입가 ${fmt(price)}<br>하루 주거비 ${fmt(fee)}${i===s.home?'<br><b>현재 거주 중</b>':`<br>${delta>=0?'이사에 필요한 돈':'이사 후 받는 돈'} ${fmt(Math.abs(delta))}`}`,btn(`data-home="${i}"`,i===s.home?'현재 집':i<s.home?'집 줄이기':'이사하기',dead||pledged('home')||i===s.home||delta>s.money||i>s.home&&restricted()))}).join('');bind('home',v=>confirmHome(Number(v)));return}
 if(currentTab==='records'){$('shopGrid').innerHTML=card('📓','이번 인생',`${mode().name} · ${s.day}일 · 최고 ${fmt(s.peak)}<br>선행 ${s.good} · 추억 ${s.memories}<br>${s.log.join('<br>')}`,btn('id="newLifeBtn"','새 인생 시작'))+card('✦','이번 인생에 남은 장면',s.events.map(e=>`${e.day}일 · ${e.text}`).join('<br>')||'첫 집, 첫 사업, 빚을 갚은 날… 앞으로 남길 장면들입니다.')+card('🎯','삶의 수집 목표',lifeGoals().map(([id,title,value,total])=>`${s.milestones.includes('goal-'+id)?'✓':'○'} ${title} · ${Math.min(value,total)}/${total}`).join('<br>'))+s.history.map((h,i)=>card('🕯️',`${s.history.length-i}번째 지난 인생`,`${h.mode} · ${h.day}일 생존<br>최고 순자산 ${fmt(h.peak)}<br>${h.reason} · 선행 ${h.good}`)).join('');$('shopGrid').innerHTML+=archiveCard()+projectCard()+card('💾','백업과 복구','다른 브라우저로 옮길 백업 코드와 직전 체크포인트를 관리합니다.',btn('id="saveTools"','백업·복구'));$('saveTools').onclick=saveTools;bind('project',startProject);$('newLifeBtn').onclick=newLife;return}
 if(currentTab==='room'){$('shopGrid').innerHTML=roomScene()+card(HOMES[s.home][0],HOMES[s.home][1],`하루 주거비 ${fmt(HOMES[s.home][3])}<br>추억 ${s.memories} · 선행 ${s.good}`)+s.owned.map(id=>{const g=good(id);return card(g.icon,g.name,g.text+luxuryText(id)+'<br>'+(s.provenance[id]||'오래전부터 함께한 물건'),luxuryButtons(id))}).join('')+collectionBonus().map(c=>card('✦',c.name,c.count+'/'+c.ids.length+' · '+c.ids.map(id=>good(id).name).join(', ')+'<br>완성 시 추억 +5')).join('');bind('roomobject',inspectObject);bindLuxury();return}
 const list=currentTab==='resale'?GOODS.filter(g=>g.sellable&&owns(g.id)):GOODS.filter(g=>g.tab===currentTab).sort((a,b)=>a.price-b.price);
 $('shopGrid').innerHTML=list.length?list.map(g=>{const owned=owns(g.id),sale=currentTab==='resale',effect=g.tab==='business'?`<br>평일 순익 ${fmt(businessStats(g).revenue-businessStats(g).expense)} · 휴업 손실 ${fmt(businessStats(g).expense)}<br>성황 순익 ${fmt(Math.floor(businessStats(g).revenue*1.6)-businessStats(g).expense)}${businessMultiplier(g.id)!==1?`<br><b>현재 시장·사건 매출 ×${Number(businessMultiplier(g.id).toFixed(2))}</b>`:''}`:'';return card(g.icon,g.name,`${g.text}${effect}${luxuryText(g.id)}<br><b>${sale?'판매가':'가격'} ${fmt(sale?resale(g):g.price)}</b>${s.counts[g.id]?`<br>기록 ${s.counts[g.id]}회`:''}`,sale?btn(`data-sell="${g.id}"`,pledged(g.id)?'담보 설정 중':'판매하기',dead||pledged(g.id)):btn(`data-buy="${g.id}"`,owned?'보유 중':restricted()?'미납·만기 빚 먼저 해결':'구입하기',dead||owned||s.money<g.price||restricted())+(!sale?luxuryButtons(g.id):''))}).join(''):'<p>지금 판매할 물건이 없습니다. 주거 탭에서 집을 줄일 수도 있습니다.</p>';bind('buy',buy);bind('sell',sell);bindLuxury();
}
function afterAction(){checkLifeGoals();save();renderDay();if(checkBankruptcy())bankruptcy()}
function buy(id){if(blockedByEvent())return;const g=good(id);if(!g||s.status!=='alive'||s.night||restricted()||s.money<g.price||owns(id))return;s.money-=g.price;if(g.repeat)s.counts[id]=(s.counts[id]||0)+1;else{s.owned.push(id);s.provenance[id]=s.day+'일에 구입 · '+(s.lastNight>0?'지난 밤의 수익으로 마련한 물건':'나의 생활에 새로 들어온 물건');}if(g.tab==='business')milestone('first-employee','첫 사업을 열었다. 이제 내 승부 말고도 책임질 일이 생겼다.');if(g.tab==='donation')s.good++;if(g.tab==='small')s.memories++;log(`${g.name} ${fmt(g.price)} ${g.repeat?'소비':'구입'}`);afterAction();if(s.status==='alive')notice(g.name,g.text)}
function sell(id){if(blockedByEvent())return;const g=good(id);if(pledged(id))return notice('담보로 잡힌 사업입니다','은행에서 상환하거나 담보 처분으로 정산하세요.');if(!g?.sellable||!owns(id)||s.status!=='alive'||s.night)return;modal(`${g.name} 판매`, `<p>구입가 ${fmt(g.price)} → 중고 판매가 <b>${fmt(resale(g))}</b></p><p>${g.tab==='business'?'매각하면 이 사업의 수입과 운영비도 사라집니다.':'나중에 다시 살 때는 원래 가격을 내야 합니다.'}</p>`,[['판매한다',()=>{if(!owns(id)||pledged(id)||s.night||s.status!=='alive')return;const proceeds=resale(g);removeBusiness(id);s.money+=proceeds;if(id==='car')milestone('sold-car','스포츠카 열쇠를 건넸다. 화려했던 밤은 기억에 남았다.');log(`${g.name}을 ${fmt(proceeds)}에 판매`);closeModal();afterAction()},'primary'],['취소',closeModal]])}
function confirmHome(i){if(blockedByEvent())return;if(pledged('home'))return notice('담보로 잡힌 집입니다','은행에서 상환하거나 담보를 처분한 뒤 이사할 수 있습니다.');if(!HOMES[i]||i===s.home||s.status!=='alive'||s.night)return;const delta=HOMES[i][2]-Math.floor(HOMES[s.home][2]*.8);if(delta>s.money||i>s.home&&restricted())return;modal(`${HOMES[i][1]} 이사`, `<p>${delta>=0?'지출':'회수'} ${fmt(Math.abs(delta))}<br>하루 주거비 ${fmt(HOMES[s.home][3])} → ${fmt(HOMES[i][3])}<br>현재 집에 붙은 사건 영향은 이사하면 끝납니다.</p>`,[['이사한다',()=>{if(pledged('home')||s.night||s.status!=='alive'||delta>s.money||i===s.home)return;s.money-=delta;if(i<s.home)milestone('smaller-home','집을 줄여 다시 버틸 돈을 마련했다.');clearAssetEffects('upkeep',s.home);if(i>0)milestone('first-home','내 이름으로 된 첫 집의 문을 열었다.');s.home=i;log(`${HOMES[i][1]} 이사`);closeModal();afterAction()},'primary'],['취소',closeModal]])}
function borrow(amount){if(blockedByEvent())return;if(s.status!=='alive'||s.night||!Number.isFinite(amount)||amount<=0||!Number.isInteger(amount)||credit()<amount)return;modal('대출 계약 확인',`<p>${fmt(amount)}를 빌립니다. 하루 복리 ${mode().interest*100}%.</p><p>상환일: <b>${s.debt?s.due:s.day+5}일째</b>. 만기에는 남은 원금과 이자를 모두 갚아야 합니다. 재대출로 만기는 늘어나지 않습니다.</p>`,[['빌린다',()=>{if(credit()<amount)return;if(!s.debt)s.due=s.day+5;s.debt+=amount;s.money+=amount;log(`${fmt(amount)} 대출 · ${s.due}일 만기`);closeModal();afterAction()},'primary'],['취소',closeModal]])}
function pay(kind){if(blockedByEvent())return;if(s.status!=='alive'||s.night)return;const field=kind==='bills'?'bills':'debt',amount=Math.min(s.money,s[field],kind==='200'?200:Infinity);s.money-=amount;s[field]-=amount;if(!s.debt){s.due=0;if(field==='debt'&&amount>0)milestone('debt-free','마지막 빚을 갚고 영수증을 접었다.')}log(`${field==='bills'?'미납금':'대출'} ${fmt(amount)} 상환`);afterAction()}
function rules(){modal('세 장으로 만드는 나만의 승부',`<div class="tutorial-box">같은 그림 2개 = 한 쌍 · 3개 = 트리플<br>장치 3개를 조합해 여섯 테이블 돌파</div><p>① 일반·VIP·심야 중 입장할 방 선택.<br>② 무료 장치 선택 후 준비 상점에서 구입.<br>③ 판돈 배율 선택 → 패 뽑기 → 승부 확정.</p><p>초반 두 테이블은 4회, 이후는 3회 승부. 목표를 일찍 채우면 바로 통과합니다. 새로운 밤은 통과 점수 500 → 750 → 1,100 → 1,600 → 2,300 → 3,200점을 요구합니다. 기본 한 쌍은 30/45/70점, 트리플은 300/500/1,000점이며 장치가 점수를 키웁니다. 판돈·다시 걸기·방의 현금 배당 보너스는 점수를 키우지 않습니다. 꽝 반환은 0점입니다. 지옥에서는 목표가 추가로 20% 높습니다.</p><p>3·6번 보스의 규칙은 미리 표시됩니다. 장미 성장, 해골 트리플, 연속 한 쌍 등 장치 조합을 준비하세요. 기본 현금 배당은 ×0.75로 조정되며, 점수는 유지됩니다. 같은 날 준비 상점과 보스는 고정됩니다. 누적금을 다시 걸 때는 판돈을 바꿀 수 없습니다. 여섯 테이블 완주 보너스와 다음 인생에 남는 도감을 제공합니다. 총 45종 아이템. 기간제는 승부 확정마다 수명이 감소하며, 내구도 장치는 효과 발동 때만 닳습니다. 고장 난 장치는 수리하거나 팔 수 있습니다. 소모품은 원하는 패에 사용할 수 있습니다. 귀가 시 밤 아이템은 사라집니다.</p><p>당첨금은 원금 포함. 꽝에 다시 건 누적금이 사라집니다. 보스를 포함한 최종 계산은 패 아래에 표시됩니다. 뽑기 확률도 공개되며 몰래 바뀌지 않습니다.</p><p>플레이 후 귀가하면 생활비·집 유지비·사업 결산·대출 이자가 적용됩니다. 75종의 물품과 사업을 사고팔 수 있습니다. 귀가 후 2~3일 간격으로 선택형 사건이 나타납니다. 확률·순손익·지속 효과를 보고 결정하세요. 선불 비용 없는 선택도 있고, 현금을 넘는 손실은 미납금으로 남습니다. 고금리·담보대출은 결산마다 이자가 붙고, 분할 상환액이나 만기 원리금이 부족하면 담보를 잃습니다. 회사는 3단계까지 확장할 수 있고, 빚을 갚은 뒤 은퇴 결말을 선택할 수 있습니다. 인생 목표는 다섯 단계를 따라 진행됩니다. 소장품 38종은 3단계 업그레이드와 나의 방 활동을 제공합니다. 바카라는 밤 입구에서 따로 선택하며 장치 보너스가 적용되지 않습니다. 가상 주식 6종에 투자할 수 있으며 하루마다 시세와 뉴스가 변합니다. 하루 보내기에서 일을 하거나 사업을 관리할 수도 있습니다. 매 행동 자동 저장, 실제 결제·대출 없음.</p>`,[['알겠어',closeModal,'primary']],'도시의 돈과 삶 · v10')}
 $('deskBtn').onclick=()=>openDay('desk');$('marketBtn').onclick=()=>openDay('market');
 if(window.addEventListener){window.addEventListener('storage',e=>{if(e.key===KEY&&e.newValue)modal('다른 창에서 진행이 바뀌었어요','<p>가장 최근 저장으로 새로고침한 뒤 이어가세요.</p>',[['최근 저장 불러오기',()=>location.reload(),'primary']])});document.addEventListener?.('click',e=>{const latest=read(KEY);if(latest&&latest.revision!==s.revision){e.preventDefault();e.stopImmediatePropagation();location.reload()}},true)}
 $('goalBar').onclick=()=>s.night?modal('이번 인생의 목표','<p>'+(LIFE_PATHS[s.lifeGoal]?.steps.join('<br>')||'귀가 후 목표를 정하세요.')+'</p>',[['승부로 돌아가기',()=>{closeModal();resumePhase()},'primary']]):s.lifeEvent?showLifeEvent():chooseGoal();
 $('lifeStatus').onclick=()=>s.night?startNight():s.lifeEvent?showLifeEvent():openDay('events');
 $('nightBtn').onclick=startNight;$('dayBtn').onclick=()=>openDay();$('homeBtn').onclick=()=>s.night?leave():(closeModal(),show('homeScreen'));$('backHomeBtn').onclick=()=>show('homeScreen');$('rulesBtn').onclick=rules;$('dealBtn').onclick=()=>deal();$('rerollBtn').onclick=()=>deal(true);$('settleBtn').onclick=evaluate;$('leaveNightBtn').onclick=leave;
 document.querySelectorAll('[data-slot]').forEach(b=>b.onclick=()=>toggleLock(Number(b.dataset.slot)));bind('tab',v=>{currentTab=v;renderDay()});$('soundBtn').onclick=()=>{s.sound=!s.sound;save();beep(650)};
 save();show('homeScreen');if(s.night)startNight();else if(s.pendingSettlement)showSettlementRescue();else if(s.lifeEvent)showLifeEvent();else if(s.status==='bankrupt')bankruptcy();else if(!stored){modal('한 판에서 시작되는 인생',`<p>시작금 ${fmt(s.money)}. 세 장의 짝과 장치 조합으로 돈을 벌고, 낮에는 집·사업·좋아하는 물건을 사세요.</p><p>때때로 찾아오는 사건에서는 작은 확신과 큰 모험 사이에서 선택합니다. 빚과 미납금을 감당할 수 없으면 이번 인생이 끝납니다. 실제 돈은 사용하지 않습니다.</p>`,[['하드로 시작',()=>{closeModal();chooseGoal()},'primary'],['지옥으로 시작',()=>{s=fresh('hell');save();header();chooseGoal()}]],'도시의 돈과 삶 · v10')}
 if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
})();
