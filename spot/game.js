import {ComparisonBoard} from './board.js?v=atlas100';
import {Journal,newRun} from './journal.js?v=e89c8675583a';
import {VoiceHint,PHRASES} from './voice.js';
const $=id=>document.getElementById(id);
const pad=n=>String(n).padStart(2,'0');
const fmt=n=>pad(Math.floor(n/60))+':'+pad(n%60);
const modal=$('modal'),panes=[$('paneA'),$('paneB')];
let storage;
try{storage=window.localStorage}catch{}
const journal=new Journal(CHAPTERS,storage);
let sound=journal.read('sound',true), screen='', level=null, nodes=[],run=null,ready=false,
    activeDialog='',voice,loadTicket=0,intervalStart=null,lastDisplay=-1,lastWrite=0,audio,toastTimeout,saveTimeout;
function save(){
 clearTimeout(saveTimeout);
 if(run&&level)journal.save(level,run);
}
function scheduleSave(){clearTimeout(saveTimeout);saveTimeout=setTimeout(save,180)}
function toast(msg){clearTimeout(toastTimeout);$('toast').textContent=msg;$('toast').classList.add('show');toastTimeout=setTimeout(()=>$('toast').classList.remove('show'),2600)}
function primeAudio(){if(!sound)return;try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;audio ||= new A();if(audio.state==='suspended')audio.resume().catch(()=>{})}catch{}}
function chime(type){
 if(!sound||!audio)return;
 const tones={found:[587,784],miss:[180,110],hint:[523,659,880],won:[523,659,784,1046],tick:[440],button:[523]}[type]||[];
 tones.forEach((f,i)=>{try{const o=audio.createOscillator(),g=audio.createGain(),t=audio.currentTime+i*.09;o.type=type==='miss'?'triangle':'sine';o.frequency.value=f;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.10,t+.012);g.gain.exponentialRampToValueAtTime(.001,t+.18);o.connect(g);g.connect(audio.destination);o.start(t);o.stop(t+.20)}catch{}});
}
function canPlay(){return screen==='game'&&ready&&run?.status==='playing'&&!modal.open&&!document.hidden}
function resumeClock(){
 if(intervalStart!=null||!canPlay())return;
 intervalStart=performance.now();
 if(!run.started){run.started=true;save()}
}
function debit(){if(intervalStart==null)return;const now=performance.now();run.remaining=Math.max(0,run.remaining-(now-intervalStart));intervalStart=now}
function stopClock(){debit();intervalStart=null}
function updateTime(){const seconds=Math.ceil(run.remaining/1000);
 if(lastDisplay!==seconds){$('time').textContent=fmt(seconds);$('time').classList.toggle('urgent',seconds<=30);if(intervalStart!=null&&seconds>0&&seconds<=10)chime('tick');lastDisplay=seconds}
}
function tick(){if(intervalStart==null)return;debit();updateTime();if(run.remaining<=0&&run.status==='playing'){finish('lost');return}if(performance.now()-lastWrite>1000){save();lastWrite=performance.now()}}
setInterval(tick,200);
const board=new ComparisonBoard({panes,canPlay,onInspect:primeAudio,onTap:tap,onView:v=>{if(!run||!ready)return;run.view=v;scheduleSave()}});
function tap(q,el){
 if(!canPlay())return;debit();if(run.remaining<=0){finish('lost');return}
 const n=board.hit(q,nodes);
 if(n>=0){
   if(run.found.includes(n)){toast('这处已经记下了');return}
   run.found.push(n);if(n===run.hinted)run.hinted=null;
   if(run.found.length===nodes.length){finish('won');return}
   chime('found');toast('找到一处！'+nodes[n].label);
 }else{
   run.hp--;chime('miss');if(navigator.vibrate)navigator.vibrate(35);
   if(!run.hp){finish('lost');return}
   paint();board.miss(q,el);toast('这里相同，扣除 1 点生命');save();return;
 }
 paint();save();
}
function paint(){
 $('found').textContent=pad(run.found.length);$('total').textContent=nodes.length||level.count;
 $('hearts').innerHTML=Array.from({length:5},(_,i)=>'<span class="'+(i>=run.hp?'empty':'')+'">'+icon('heart')+'</span>').join('');
 $('hearts').setAttribute('aria-label','剩余 '+run.hp+' 点生命');
 $('slots').innerHTML=Array.from({length:level.count},(_,i)=>'<span class="slot '+(i<run.found.length?'done':'')+'">'+''+'</span>').join('');
 $('hintLeft').textContent=3-run.hints;
 document.querySelector('[data-action=hint]').disabled=!ready||run.hints>=3||run.status!=='playing';
 board.marks(nodes,run.found.filter(i=>nodes[i]),run.hinted!=null&&nodes[run.hinted]?run.hinted:null);updateTime();
}
function finish(status){
 stopClock();run.status=status;
 paint();save();if(status==='won')chime('won');resultDialog();
}
function artSources(file){
 return ['art/'+file,ASSET_ORIGIN+'/'+file];
}
function getPicture(src){
 return new Promise((resolve,reject)=>{
   const img=new Image();
   const timeout=setTimeout(()=>done(false),src.startsWith(ASSET_ORIGIN)?12000:25000);
   function done(ok){
     clearTimeout(timeout);img.onload=img.onerror=null;
     if(ok)resolve(img);else reject(new Error('画卷加载失败'));
   }
   img.decoding='async';
   img.onload=()=>{if(img.decode)img.decode().then(()=>done(true),()=>done(false));else done(true)};
   img.onerror=()=>done(false);img.src=src;
 });
}
async function loadArt(file){
 const sources=artSources(file);
 for(const src of new Set(sources)){try{return await getPicture(src)}catch{}}
 throw new Error('画卷加载失败');
}
function picture(img,file){
  img.alt='';img.decoding='async';
  const sources=artSources(file);
  let pos=0;
  img.onerror=()=>{if(++pos<sources.length)img.src=sources[pos];else img.onerror=null};img.src=sources[0];
}
function routeUrl(route){return location.pathname+location.search+(route?'#'+route:'')}
function pushRoute(route){
  const previousRoute=location.hash.slice(1);
  const steps=previousRoute?history.state?.stepsFromAtlas:0;
  history.pushState({previousRoute,stepsFromAtlas:Number.isInteger(steps)?steps+1:null},'',routeUrl(route));
}
function gotoPage(route){
  if(location.hash==='#'+route)return;
  pushRoute(route);
  routePage();
}
function replacePage(route){
  history.replaceState(history.state,'',routeUrl(route));
  routePage();
}
function goBack(){
  if(history.length>1&&!history.state?.firstAtlasEntry){history.back();return}
  replacePage(screen==='game'?'scene/'+level.chapter:'');
}
function goHome(){
  if(screen==='home')return;
  const steps=history.state?.stepsFromAtlas;
  if(Number.isInteger(steps)&&steps>0){history.go(-steps);return}
  replacePage('');
}
function leaveGame(){
  stopClock();save();ready=false;loadTicket++;board.cancelTouches();closeModal(false);
  clearTimeout(toastTimeout);$('toast').classList.remove('show');$('toast').textContent='';
  if(run){run=null;nodes=[];level=null}
  pauseOnReturn=false;
}
function home(chapter=null){
  leaveGame();screen=chapter?'chapter':'home';$('game').hidden=true;$('mast').hidden=!!chapter;$('sectionHead').hidden=!chapter;$('home').hidden=false;
  document.body.classList.remove('playing');document.title=(chapter?chapter.name:'场景图鉴')+' · 找不同';
  const box=$('home');
  const complete=c=>c.levels.filter(l=>journal.cleared(l)).length;
  if(chapter){
    const current=journal.current(chapter);
    const entries=chapter.levels.map(l=>{
      const locked=!journal.unlocked(l),won=journal.cleared(l);
      const entry=journal.read('run:'+l.id);
      const label=locked?'通关第 '+(l.number-1)+' 关后解锁':won?'已通关':entry?.started?'继续游戏':'可游玩';
      return '<button class="level-entry" data-level="'+l.id+'" '+(locked?'disabled':'')+'><span class="no">'+pad(l.number)+'</span><span><span class="entry-name">'+l.name+'</span><small>'+label+' · '+l.count+' 处不同 · '+fmt(l.seconds)+'</small></span><i>'+icon(locked?'lock':won?'check':'focus')+'</i></button>';
    }).join('');
    $('chapterTitle').textContent=chapter.name;
    $('chapterComplete').textContent=complete(chapter);
    $('chapterLength').textContent=chapter.levels.length;
    box.innerHTML='<section class="chapter-hero"><img alt=""><div class="chapter-info"><div><small>场景 '+chapter.id+'</small><h1>'+chapter.name+'</h1><p>'+chapter.intro+'</p></div><button class="chapter-cta" data-level="'+current.id+'">'+(journal.cleared(current)?'重访':'进入')+'第 '+current.number+' 关</button></div></section><div class="level-list">'+entries+'</div>';
    picture(box.querySelector('.chapter-hero img'),chapter.cover);
  }else{
    const last=LEVELS.find(l=>l.id===journal.read('last'));
    const activeChapter=last?CHAPTERS.find(c=>c.id===last.chapter):CHAPTERS[0], current=journal.current(activeChapter);
    const featureNote=current.number===1?activeChapter.intro:'在画卷中找出 '+current.count+' 处不同，限时 '+fmt(current.seconds)+'。';
    const cards=CHAPTERS.map(c=>'<button class="scene-card" data-chapter="'+c.id+'"><img loading="lazy" alt=""><div class="scene-card-info"><h2>'+c.name+'</h2><div class="scene-card-line"><span>'+complete(c)+' / '+c.levels.length+' 关</span><small>VOL. '+c.id+'</small></div><div class="meter"><span style="width:'+100*complete(c)/c.levels.length+'%"></span></div></div></button>').join('');
    box.innerHTML='<div class="home-title"><h1>场景图鉴</h1><span class="total-count">已通关 <strong>'+CHAPTERS.reduce((n,c)=>n+complete(c),0)+'</strong> / '+LEVELS.length+'</span></div><section class="feature"><img alt=""><div class="feature-copy"><small>'+activeChapter.name+' · 第 '+pad(current.number)+' 关</small><h2>'+current.name+'</h2><p>'+featureNote+'</p><button data-level="'+current.id+'">'+(last?'继续找不同':'开始找不同')+'</button></div></section><div class="scene-grid">'+cards+'</div>';
    picture(box.querySelector('.feature img'),current.number===1?activeChapter.cover:current.a);
    box.querySelectorAll('.scene-card').forEach((el,i)=>picture(el.querySelector('img'),CHAPTERS[i].thumb));
  }
  box.insertAdjacentHTML('beforeend','<div class="home-foot">'+icon('save')+(journal.persistent?'各场景进度保存在本机':'当前浏览器未允许保存进度')+'</div>');
  window.scrollTo(0,0);
}
async function openLevel(l,{restart=false}={}){
  if(!journal.unlocked(l)){gotoPage('scene/'+l.chapter);return}
  leaveGame();screen='game';const ticket=++loadTicket;
  level=l;run=restart?newRun(l):journal.restore(l);nodes=[];lastDisplay=-1;journal.remember(l);save();
  $('mast').hidden=true;$('sectionHead').hidden=false;$('home').hidden=true;$('game').hidden=false;document.body.classList.add('playing');window.scrollTo(0,0);
  $('title').textContent=l.name;document.title=l.name;
  $('loading').hidden=false;$('loading').textContent='正在展开画卷…';paint();
  try{
    const [a,b]=await Promise.all([loadArt(l.a),loadArt(l.b)]);
    if(ticket!==loadTicket)return;
    if(!a.naturalWidth||a.naturalWidth!==b.naturalWidth||a.naturalHeight!==b.naturalHeight||l.spots.length!==l.count)throw Error();
    const base=l.delta?a.cloneNode():null;
    if(base){base.alt='';if(base.decode)await base.decode()}
    if(ticket!==loadTicket)return;
    nodes=l.spots;
    for(const [i,img] of [a,b].entries()){
      img.alt=l.name+(i?'，图 B 对照':'，图 A 原景');img.draggable=false;
      let content=img;
      if(i===1&&l.delta){
        content=document.createElement('div');content.className='picture';
        content.append(base,img);
      }
      panes[i].querySelector('.world').firstElementChild.replaceWith(content);
    }
    ready=true;board.setScene(a.naturalWidth/a.naturalHeight,l.span||1,run.view,l.scanAspect,l.minWidth);$('loading').hidden=true;paint();
    if(run.status!=='playing')resultDialog();else resumeClock();
  }catch{if(ticket!==loadTicket)return;ready=false;$('loading').innerHTML='画卷暂时未能加载<button class="secondary" data-action="retryload">重新加载</button>';paint()}
}
function routePage(){
  const [section,id]=location.hash.slice(1).split('/');
  if(section==='play'){
    const l=LEVELS.find(l=>l.id===id);
    if(l&&journal.unlocked(l)){openLevel(l);return}
    if(l){replacePage('scene/'+l.chapter);return}
  }
  const chapter=section==='scene'&&CHAPTERS.find(c=>c.id===id);
  home(chapter||null);
}
function soundUI(){$('sound').innerHTML=icon(sound?'sound':'mute');$('sound').setAttribute('aria-label',sound?'关闭音效':'开启音效');$('sound').setAttribute('aria-pressed',String(sound))}
function closeModal(resume=true){
 voice?.dispose();voice=null;if(modal.open)modal.close();activeDialog='';if(resume)resumeClock()
}
function dialog(kind,title,body,closable=true){
 stopClock();save();voice?.dispose();voice=null;board.cancelTouches();activeDialog=kind;
 modal.className=kind==='gallery'?'gallery-dialog':'';
 $('dialogBody').innerHTML='<div class="dialog-top"><h2 id="dialogTitle">'+title+'</h2>'+(closable?'<button class="circle" aria-label="关闭" data-action="close">'+icon('close')+'</button>':'')+'</div><div class="dialog-content">'+body+'</div>';
 modal.setAttribute('aria-labelledby','dialogTitle');if(!modal.open)modal.showModal();
}
function resultDialog(){
 const win=run.status==='won';
 const chapter=CHAPTERS.find(c=>c.id===level.chapter),next=chapter.levels[level.number];
 if(win&&next&&history.state?.previousRoute!=='scene/'+chapter.id){
   // A shortcut or a deep link has no scene list to return to after advancing.
   history.replaceState(history.state,'',routeUrl('scene/'+chapter.id));
   pushRoute('play/'+level.id);
 }
 const primary=win&&next?'<button class="primary" data-level="'+next.id+'">下一关</button>':'<button class="primary" data-action="restart">再玩一次</button>';
 dialog('result',win?(next?'本页手记已集齐':'场景已通关'):run.hp<=0?'本关生命已用尽':'本关时间已到','<p>'+level.name+' · 已找到 '+run.found.length+' / '+level.count+' 处不同。</p><div class="dialog-actions"><button class="secondary" data-action="home">返回首页</button>'+primary+'</div>'+(win&&next?'<button class="replay-link" data-action="restart">重玩本关</button>':''),false);
}
function hintDialog(){
 if(!canPlay()||run.hints>=3)return;
 const index=run.hints;
 dialog('hint','语音提示','<p>第 '+(index+1)+' 次提示。允许麦克风后，请说一遍下面的口令。</p><div class="phrase">'+PHRASES[index]+'</div><p id="voiceStatus" class="speech-state" role="status">口令通过后，两幅图都会标出同一处线索。浏览器可能使用在线语音服务。</p><div class="dialog-actions"><button class="secondary" data-action="close">返回游戏</button><button id="listen" class="primary" data-action="listen">'+icon('mic')+'开始说话</button></div>');
 voice=new VoiceHint(index,{report:(msg,busy)=>{if(activeDialog!=='hint')return;$('voiceStatus').textContent=msg;$('listen').disabled=busy;$('listen').innerHTML=icon('mic')+(busy?'聆听中':'再次说话')},success:()=>{
   if(activeDialog!=='hint'||run.status!=='playing')return;
   const choices=nodes.map((n,i)=>i).filter(i=>!run.found.includes(i)&&i!==run.hinted);
   const i=choices[0]??nodes.findIndex((n,i)=>!run.found.includes(i));if(i<0)return;
   run.hints++;run.hinted=i;closeModal();board.focus(nodes[i]);paint();save();chime('hint');toast('线索：'+nodes[i].label+'，请点击金色虚线圈。');
 }});
}
function help(){dialog('help','游戏玩法','<ul><li>十个场景可以自由切换，场景内逐关解锁。点击任意一幅图中的不同之处，两幅图都会画圈。每关有 5 点生命，点错扣 1 点。</li><li>在任一幅画上单指拖动，或用双指缩放至 200%，另一幅画会同步移动。</li><li>每关最多 3 次语音提示。通过口令后，金色虚线圈会一直保留到找到该处或使用下次提示。</li><li>两幅图加载完成后自动开始计时。切到后台、查看图鉴或说口令时暂停，返回后继续。</li></ul><div class="dialog-actions"><button class="primary" data-action="close">知道了</button></div>')}
function pause(){
 if(!ready||run?.status!=='playing')return;
 dialog('pause','观察暂停','<p>剩余 '+fmt(Math.ceil(run.remaining/1000))+'，本关进度已保留。</p><div class="dialog-actions"><button class="secondary" data-action="askRestart">重新开始</button><button class="primary" data-action="close">继续观察</button></div><button class="replay-link" data-action="home">返回首页</button>');
}
function askRestart(){
 if(activeDialog!=='pause')return;
 dialog('confirm-restart','重新开始？','<p>本轮已找到的差异会清零。你将以 5 点生命、3 次提示和 '+fmt(level.seconds)+' 的完整时间重新开始。</p><div class="dialog-actions"><button class="secondary" data-action="close">取消</button><button class="primary" data-action="restart">确认重开</button></div>');
}
const actions={
 home:goHome,back:goBack,help,hint:hintDialog,pause,askRestart,
 close:()=>{if(activeDialog==='confirm-restart'){pause();return}closeModal();if(ready&&run?.status!=='playing')resultDialog()},
 sound:()=>{sound=!sound;journal.write('sound',sound);soundUI();if(sound){primeAudio();chime('button')}toast(sound?'音效已开启':'音效已关闭')},
 listen:()=>voice?.listen(),restart:()=>openLevel(level,{restart:true}),retryload:()=>openLevel(level)
};
document.addEventListener('click',e=>{
 const btn=e.target.closest('button');if(!btn||btn.disabled)return;primeAudio();
 if(btn.dataset.chapter){gotoPage('scene/'+btn.dataset.chapter);return}
 if(btn.dataset.level){
   const next=LEVELS.find(l=>l.id===btn.dataset.level);
   if(next&&journal.unlocked(next)){
     const route='play/'+next.id;
     if(activeDialog==='result')replacePage(route);
     else gotoPage(route);
   }
   return;
 }
 actions[btn.dataset.action]?.();
});
modal.addEventListener('cancel',e=>{e.preventDefault();if(activeDialog!=='result')actions.close()});
modal.addEventListener('click',e=>{if(e.target===modal&&activeDialog!=='result'){const r=modal.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)actions.close()}});
document.addEventListener('contextmenu',e=>e.preventDefault());
document.addEventListener('selectstart',e=>e.preventDefault());
for(const ev of ['gesturestart','gesturechange','gestureend'])document.addEventListener(ev,e=>e.preventDefault(),{passive:false});
document.addEventListener('touchmove',e=>{if(e.touches.length>1)e.preventDefault()},{passive:false});
function onHide(){stopClock();board.cancelTouches();if(activeDialog==='hint')closeModal(false);if(ready&&run.status==='playing'&&run.started&&!modal.open)pauseOnReturn=true;save()}
let pauseOnReturn=false;
function onShow(){if(document.hidden)return;if(pauseOnReturn&&ready&&!modal.open&&run.status==='playing'){pauseOnReturn=false;pause()}else resumeClock()}
document.addEventListener('visibilitychange',()=>document.hidden?onHide():onShow());
window.addEventListener('pagehide',onHide);window.addEventListener('pageshow',onShow);
window.addEventListener('popstate',routePage);
// A freshly opened deep link has no preceding page, even after visiting a child and coming back.
if(history.length===1)history.replaceState({...history.state,firstAtlasEntry:true},'');
soundUI();routePage();
