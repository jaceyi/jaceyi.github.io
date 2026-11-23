// Both panes use the same world coordinates. Pointer movement stays in CSS pixels.
export class ComparisonBoard {
  constructor({panes,onTap,onInspect,onView,canPlay}) {
    Object.assign(this,{panes,onTap,onInspect,onView,canPlay});
    this.pointers=new Map();
    this.view={z:1,cx:0,cy:.5};
    this.aspect=2.4;this.span=1;this.width=0;this.height=0;
    for(const el of panes){
      el.addEventListener('pointerdown',e=>this.down(el,e));
      el.addEventListener('pointermove',e=>this.move(el,e));
      el.addEventListener('pointerup',e=>this.up(el,e,true));
      el.addEventListener('pointercancel',e=>this.up(el,e,false));
      el.addEventListener('lostpointercapture',e=>this.up(el,e,false));
      el.addEventListener('wheel',e=>{
        if(!this.canPlay())return;
        e.preventDefault();this.onInspect();
        const p=this.local(el,e);
        if(e.ctrlKey||e.metaKey||(!e.shiftKey&&Math.abs(e.deltaY)>Math.abs(e.deltaX))){
          this.zoom(this.view.z*Math.exp(-e.deltaY*.0025),p);
        }else{this.translate(-(e.deltaX||e.deltaY),0)}
      },{passive:false});
    }
    new ResizeObserver(()=>this.layout(true)).observe(panes[0]);
  }
  setScene(aspect,span,view,scanAspect=aspect,minWidth=0) {
    this.cancelTouches();this.aspect=aspect;this.span=span;this.scanAspect=scanAspect;this.minWidth=minWidth;
    this.view={z:view?.z||1,cx:view?.cx??0,cy:view?.cy??.5};
    this.layout(true);
  }
  cancelTouches(){this.pointers.clear();this.gesture=null;this.panes.forEach(p=>p.classList.remove('dragging'))}
  layout(measure=false) {
    if(measure||!this.width||!this.height){
      const el=this.panes[0];this.width=el.clientWidth;this.height=el.clientHeight;
    }
    if(!this.width||!this.height)return;
    this.view.z=Math.min(2,Math.max(1,this.view.z));
    this.baseWidth=Math.max(this.width*this.span,this.height*Math.max(this.aspect,this.scanAspect||0),this.minWidth||0);
    const worldW=this.baseWidth*this.view.z,worldH=worldW/this.aspect;
    const resized=worldW!==this.worldW||worldH!==this.worldH;
    this.worldW=worldW;this.worldH=worldH;
    const bound=(v,n,w)=>w<=n?.5:Math.max(n/(2*w),Math.min(1-n/(2*w),v));
    this.view.cx=bound(this.view.cx,this.width,this.worldW);this.view.cy=bound(this.view.cy,this.height,this.worldH);
    this.x=this.width/2-this.worldW*this.view.cx;this.y=this.height/2-this.worldH*this.view.cy;
    const transform='translate3d('+this.x+'px,'+this.y+'px,0)';
    for(const p of this.panes){
      const w=p.firstElementChild;
      if(resized){w.style.width=worldW+'px';w.style.height=worldH+'px'}
      w.style.transform=transform;
    }
    this.onView({...this.view});
  }
  local(el,e){const r=el.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}}
  world(p){return{x:(p.x-this.x)/this.worldW,y:(p.y-this.y)/this.worldH}}
  translate(dx,dy){this.view.cx-=dx/this.worldW;this.view.cy-=dy/this.worldH;this.layout()}
  zoom(z,point={x:this.width/2,y:this.height/2},anchor=this.world(point)){
    this.view.z=Math.max(1,Math.min(2,z));const w=this.baseWidth*this.view.z,h=w/this.aspect;
    this.view.cx=anchor.x+(this.width/2-point.x)/w;this.view.cy=anchor.y+(this.height/2-point.y)/h;this.layout();
  }
  focus(n){this.view.z=Math.max(1.45,this.view.z);this.view.cx=n.x;this.view.cy=n.y;this.layout()}
  down(el,e){
    if(!this.canPlay()||e.button!==0)return;
    if(this.pointers.size&&this.el!==el)return;
    e.preventDefault();this.onInspect();this.el=el;const p=this.local(el,e);
    this.pointers.set(e.pointerId,{...p,start:p,moved:false,at:performance.now()});el.setPointerCapture(e.pointerId);
    if(this.pointers.size>=2){for(const pt of this.pointers.values())pt.moved=true;this.startPinch()}
  }
  pair(){const [a,b]=this.pointers.values();return{mid:{x:(a.x+b.x)/2,y:(a.y+b.y)/2},dist:Math.max(1,Math.hypot(a.x-b.x,a.y-b.y))}}
  startPinch(){const q=this.pair();this.gesture={dist:q.dist,anchor:this.world(q.mid),z:this.view.z}}
  move(el,e){
    const pt=this.pointers.get(e.pointerId);if(!pt||el!==this.el)return;
    const p=this.local(el,e), dx=p.x-pt.x,dy=p.y-pt.y;Object.assign(pt,p);
    if(this.pointers.size>=2){const q=this.pair();this.zoom(this.gesture.z*q.dist/this.gesture.dist,q.mid,this.gesture.anchor);return}
    if(!pt.moved&&Math.hypot(p.x-pt.start.x,p.y-pt.start.y)>6){pt.moved=true;this.translate(p.x-pt.start.x,p.y-pt.start.y)}
    else if(pt.moved)this.translate(dx,dy);
    if(pt.moved)el.classList.add('dragging');
  }
  up(el,e,allowTap){
    const pt=this.pointers.get(e.pointerId);if(!pt)return;
    const p=this.local(el,e);this.pointers.delete(e.pointerId);
    if(allowTap&&this.canPlay()&&!pt.moved&&Math.hypot(p.x-pt.start.x,p.y-pt.start.y)<=6&&performance.now()-pt.at<650){
      const q=this.world(p);if(q.x>=0&&q.x<=1&&q.y>=0&&q.y<=1)this.onTap(q,el);
    }
    if(this.pointers.size>=2)this.startPinch();
    else this.gesture=null;
    if(!this.pointers.size)el.classList.remove('dragging');
  }
  hit(q,nodes) {
    const candidates=[];
    nodes.forEach((n,i)=>{
      const rx=Math.max(n.rx*this.worldW+3,15),ry=Math.max(n.ry*this.worldH+3,15);
      const d=(((q.x-n.x)*this.worldW)/rx)**2+(((q.y-n.y)*this.worldH)/ry)**2;
      if(d<=1)candidates.push({i,d});
    });
    if(!candidates.length)return -1;
    if(candidates.length===1)return candidates[0].i;
    // Closely spaced irregular objects can share the forgiving outer edge of a tap zone.
    // Resolve that edge using the locations of the actual visible changes in the illustration.
    for(const candidate of candidates){
      const n=nodes[candidate.i];
      let nearest=Math.hypot((q.x-n.x)*this.worldW,(q.y-n.y)*this.worldH);
      for(const cell of n.touch||[]){
        const x=n.x+((cell%16-7.5)/7.5)*n.rx,y=n.y+((Math.floor(cell/16)-7.5)/7.5)*n.ry;
        nearest=Math.min(nearest,Math.hypot((q.x-x)*this.worldW,(q.y-y)*this.worldH));
      }
      candidate.distance=nearest+Math.sqrt(candidate.d)*1.5;
    }
    return candidates.reduce((a,b)=>a.distance<=b.distance?a:b).i;
  }
  marks(nodes,found,hint){
    for(const p of this.panes){
      const layer=p.querySelector('.marks');layer.replaceChildren();
      for(const i of [...found,...(hint==null||found.includes(hint)?[]:[hint])]){
        const n=nodes[i],m=document.createElement('span');
        m.className=found.includes(i)?'found-mark':'hint-mark';
        m.style.left=n.x*100+'%';m.style.top=n.y*100+'%';
        m.style.width='max(22px,'+n.rx*200+'%)';m.style.height='max(22px,'+n.ry*200+'%)';
        layer.append(m);
      }
    }
  }
  miss(q,el){const m=document.createElement('span');m.className='miss-mark';m.textContent='×';m.style.left=q.x*100+'%';m.style.top=q.y*100+'%';el.querySelector('.marks').append(m);setTimeout(()=>m.remove(),750)}
}
