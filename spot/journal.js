const PREFIX = 'xunyi-atlas-v2:';
export function newRun(level) {
  return {found:[], hp:5, remaining:level.seconds*1000, hints:0, hinted:null, started:false,
    status:'playing', view:{z:1,cx:level.startX??0,cy:.5}};
}
export class Journal {
  constructor(chapters, storage) {
    this.chapters=chapters;
    this.storage=storage;
    this.cache=new Map();
    this.persistent=true;
    this.migrate();
  }
  read(key,fallback=null) {
    try {
      const raw=this.storage?.getItem(PREFIX+key);
      if(raw!=null)return JSON.parse(raw);
    } catch {this.persistent=false}
    return this.cache.get(key)??fallback;
  }
  write(key,value) {
    this.cache.set(key,value);
    try {if(!this.storage)throw Error();this.storage.setItem(PREFIX+key,JSON.stringify(value))}
    catch {this.persistent=false}
  }
  migrate() {
    if(this.read('migrated'))return;
    let old;
    try {old=JSON.parse(this.storage?.getItem('xunyi-field-notes-v1')||'null')}catch{}
    if(old?.version===1) {
      for(const chapter of this.chapters){
        const level=chapter.levels[0],prev=old.levels?.[chapter.id];
        const complete=Array.isArray(old.cleared)&&old.cleared.includes(chapter.id);
        if(!prev&&!complete)continue;
        const convert=index=>level.spots.findIndex(n=>Number.isInteger(n.legacyIndex)&&n.legacyIndex===index);
        const found=Array.isArray(prev?.found)?prev.found.map(convert).filter(i=>i>=0):[];
        const hint=convert(prev?.hinted);
        const run={...newRun(level),...prev,found,hinted:hint>=0?hint:null};
        if(complete||prev?.status==='won'){
          run.found=level.spots.map((_,i)=>i);run.status='won';this.write('cleared:'+level.id,true);
        }
        if(run.found.length===level.count)this.write('cleared:'+level.id,true);
        this.write('run:'+level.id,run);this.write('last:'+chapter.id,level.id);
        if(chapter.id===old.current)this.write('last',level.id);
      }
      this.write('sound',old.sound!==false);
    }
    this.write('migrated',true);
  }
  cleared(l){return this.read('cleared:'+l.id,false)===true}
  unlocked(level){
    const chapter=this.chapters.find(c=>c.id===level.chapter);
    return !!chapter&&chapter.levels.slice(0,level.number-1).every(l=>this.cleared(l));
  }
  current(chapter) {
    const last=this.read('last:'+chapter.id);
    const prior=chapter.levels.find(l=>l.id===last);
    if(prior&&this.unlocked(prior)&&!this.cleared(prior))return prior;
    return chapter.levels.find(l=>this.unlocked(l)&&!this.cleared(l))||chapter.levels[0];
  }
  restore(l) {
    const v=this.read('run:'+l.id,{})||{},r=newRun(l);
    r.found=Array.isArray(v.found)?[...new Set(v.found.filter(i=>Number.isInteger(i)&&i>=0&&i<l.count))]:[];
    r.hp=Number.isInteger(v.hp)?Math.max(0,Math.min(5,v.hp)):5;
    r.started=!!v.started;r.hints=Number.isInteger(v.hints)?Math.max(0,Math.min(3,v.hints)):0;
    if(Number.isFinite(v.remaining)&&(r.started||r.found.length||r.hp<5||r.hints||v.status==='lost'||v.status==='won')){
      r.remaining=Math.min(r.remaining,Math.max(0,v.remaining));
    }
    if(r.hints&&Number.isInteger(v.hinted)&&v.hinted>=0&&v.hinted<l.count&&!r.found.includes(v.hinted))r.hinted=v.hinted;
    if(v.view&&['z','cx','cy'].every(k=>Number.isFinite(v.view[k]))){
      r.view={z:Math.max(1,Math.min(2,v.view.z)),cx:v.view.cx,cy:v.view.cy};
    }
    r.status=r.found.length===l.count?'won':(r.hp===0||r.remaining===0?'lost':'playing');
    return r;
  }
  remember(l){this.write('last',l.id);this.write('last:'+l.chapter,l.id)}
  save(l,r){this.write('run:'+l.id,r);if(r.status==='won')this.write('cleared:'+l.id,true)}
}
