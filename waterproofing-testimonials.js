// Flat opposing photo bands. Hover/focus, dragging and Space pause motion.
for(const name of ['wp-voices','wp-projects']){
 const section=document.querySelector('.'+name);if(section)createOrbit(section,name);
}
function createOrbit(section,name){
 const reel=section.querySelector('.'+name+'-reel'),cards=[...reel.querySelectorAll('.'+name+'-card')];
 const previous=section.querySelector('.'+name+'-previous'),next=section.querySelector('.'+name+'-next'),toggle=section.querySelector('.'+name+'-toggle'),position=section.querySelector('.'+name+'-position'),status=section.querySelector('.'+name+'-status');
 const motion=matchMedia('(prefers-reduced-motion:reduce)'),finePointer=matchMedia('(hover:hover) and (pointer:fine)');
 const right=section.dataset.reelDirection==='right',projects=name==='wp-projects',speed=24;
 let track=null,clock=null,cycle=0,pitch=0,cardWidth=0,reelWidth=0,duration=0,visible=false,hovered=false,keyboard=false,userPaused=false;
 let drag=null,coastFrame=0,coastTime=0,velocity=0,counterTimer=0,resizeFrame=0,visibilityFrame=0,curveFrame=0,suppressClick=false;
 const wrap=(value,total)=>((value%total)+total)%total;
 const elapsed=()=>clock?wrap(Number(clock.currentTime)||0,duration):0;
 const offset=()=>clock?(right?1-elapsed()/duration:elapsed()/duration)*cycle:reel.scrollLeft;
 function measure(){cardWidth=cards[0].offsetWidth||cards[0].getBoundingClientRect().width;pitch=cardWidth+(parseFloat(getComputedStyle(reel).columnGap)||0);reelWidth=reel.clientWidth;}
 function paint(){}
 function update(announce=false){
  const first=Math.min(cards.length,Math.floor((wrap(offset(),cycle||reel.scrollWidth)+1)/pitch)+1);
  const count=Math.max(1,Math.floor((reel.clientWidth+pitch-cardWidth+2)/pitch)),last=Math.min(cards.length,first+count-1);
  if(position)position.textContent=String(first).padStart(2,'0')+(last>first?'–'+String(last).padStart(2,'0'):'')+' / '+cards.length;
  if(previous)previous.disabled=!clock&&reel.scrollLeft<3;if(next)next.disabled=!clock&&reel.scrollLeft+reel.clientWidth>=reel.scrollWidth-3;
  if(announce)status.textContent=(projects?'Project ':'Customer story ')+first+' of '+cards.length+'.';
 }
 function stopCoast(){cancelAnimationFrame(coastFrame);coastFrame=0;velocity=0;}
 function sync(){
  clearInterval(counterTimer);counterTimer=0;cancelAnimationFrame(curveFrame);curveFrame=0;if(!clock)return;
  const paused=userPaused||hovered||keyboard||drag||coastFrame||!visible||document.hidden;
  reel.dataset.playback=userPaused?'paused':hovered?'hover':keyboard?'keyboard':drag?'dragging':coastFrame?'coasting':!visible?'offscreen':document.hidden?'hidden':'playing';
  if(paused){clock.pause();paint();}else{clock.play();}
  toggle?.setAttribute('aria-pressed',String(userPaused));toggle?.setAttribute('aria-label',userPaused?'Resume automatic scrolling':'Pause automatic scrolling');toggle?.querySelector('use')?.setAttribute('href',userPaused?'#i-play':'#i-pause');
 }
 function seek(pixels,announce=false){
  if(clock){const fraction=wrap(pixels,cycle)/cycle;clock.currentTime=right?(fraction===0?duration-.001:(1-fraction)*duration):fraction*duration;paint();}else reel.scrollLeft=pixels;update(announce);
 }
 function build(){
  if(!track)return;const progress=clock&&cycle?wrap(offset(),cycle)/cycle:null;clock?.cancel();measure();
  cycle=track.children[cards.length].offsetLeft-track.children[0].offsetLeft;if(!cycle)return;duration=cycle/speed*1000;
  const frames=[{transform:'translate3d(0,0,0)'},{transform:`translate3d(${-cycle}px,0,0)`}];
  clock=track.animate(right?frames.reverse():frames,{duration,iterations:Infinity,easing:'linear'});clock.pause();seek(progress===null?(reelWidth>650?pitch*.38:0):progress*cycle);sync();
 }
 function enable(){
  if(track||motion.matches||!reel.animate)return;track=document.createElement('div');track.className=name+'-track orbit-track';cards.forEach(card=>track.append(card));
  cards.forEach(card=>{const copy=card.cloneNode(true);copy.setAttribute('aria-hidden','true');copy.dataset.reelCopy='true';if(projects)copy.querySelectorAll('a').forEach(link=>link.tabIndex=-1);else copy.inert=true;track.append(copy);});
  reel.scrollLeft=0;reel.append(track);reel.classList.add('is-auto-reel');if(toggle)toggle.hidden=false;build();
 }
 function disable(){
  const first=Math.floor(wrap(offset(),cycle||reel.scrollWidth)/Math.max(1,pitch));cancelDrag();clearInterval(counterTimer);cancelAnimationFrame(curveFrame);counterTimer=0;clock?.cancel();clock=null;
  if(track){cards.forEach(card=>{card.style.transform='';reel.append(card);});track.remove();track=null;}
  reel.classList.remove('is-auto-reel','is-dragging');if(toggle)toggle.hidden=true;measure();reel.scrollLeft=first*pitch;update();
 }
 function move(direction){stopCoast();if(clock){userPaused=true;const index=direction>0?Math.floor((offset()+1)/pitch)+1:Math.ceil((offset()-1)/pitch)-1;seek(index*pitch,true);sync();}else reel.scrollBy({left:direction*pitch,behavior:'instant'});}
 previous?.addEventListener('click',()=>move(-1));next?.addEventListener('click',()=>move(1));
 toggle?.addEventListener('click',()=>{userPaused=!userPaused;stopCoast();if(userPaused)seek(Math.round(offset()/pitch)*pitch);sync();});
 reel.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse'&&finePointer.matches){hovered=true;sync();}});
 reel.addEventListener('pointerleave',()=>{hovered=false;if(drag&&!drag.moved)drag=null;sync();});
 reel.addEventListener('focusin',event=>{
  keyboard=true;const card=event.target.closest('.orbit-card');
  if(card&&clock){const index=Number(card.dataset.reelIndex);if(card.dataset.reelCopy)cards[index].querySelector('a')?.focus({preventScroll:true});seek(index*pitch);reel.scrollLeft=0;}else if(clock)seek(Math.round(offset()/pitch)*pitch);sync();
 });
 reel.addEventListener('focusout',event=>{if(!reel.contains(event.relatedTarget)){keyboard=false;sync();}});
 reel.addEventListener('keydown',event=>{if(['ArrowRight','ArrowLeft'].includes(event.key)){event.preventDefault();move(event.key==='ArrowRight'?1:-1);}else if(event.key===' '&&clock&&event.target===reel){event.preventDefault();userPaused=!userPaused;sync();}});
 reel.addEventListener('scroll',()=>{if(!clock)update();},{passive:true});reel.addEventListener('scrollend',()=>{if(!clock)update(true);});
 reel.addEventListener('dragstart',event=>event.preventDefault());
 reel.addEventListener('click',event=>{if(suppressClick){event.preventDefault();event.stopPropagation();suppressClick=false;}},true);
 reel.addEventListener('pointerdown',event=>{
  if(!clock||(event.pointerType==='mouse'&&event.button!==0))return;if(event.target.closest('[data-reel-copy] a'))event.preventDefault();
  stopCoast();suppressClick=false;drag={id:event.pointerId,x:event.clientX,y:event.clientY,lastX:event.clientX,time:performance.now(),start:offset(),moved:false};sync();
 });
 reel.addEventListener('pointermove',event=>{
  if(!drag||event.pointerId!==drag.id)return;const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
  if(!drag.moved){if(Math.abs(dx)<6)return;if(Math.abs(dy)>Math.abs(dx)){drag=null;sync();return;}drag.moved=true;suppressClick=true;reel.setPointerCapture(event.pointerId);reel.classList.add('is-dragging');}
  const now=performance.now(),delta=now-drag.time;if(delta>0)velocity=Math.max(-1.2,Math.min(1.2,(drag.lastX-event.clientX)/delta));drag.time=now;drag.lastX=event.clientX;seek(drag.start-dx);event.preventDefault();
 },{passive:false});
 function release(event){
  if(!drag||event.pointerId!==drag.id)return;const moved=drag.moved,stale=performance.now()-drag.time>100;drag=null;reel.classList.remove('is-dragging');if(reel.hasPointerCapture(event.pointerId))reel.releasePointerCapture(event.pointerId);
  if(event.type==='pointercancel'||!moved||stale||userPaused||motion.matches){stopCoast();sync();return;}coastTime=performance.now();
  function coast(now){const dt=Math.min(48,now-coastTime);coastTime=now;seek(offset()+velocity*dt);velocity*=Math.exp(-dt/240);if(Math.abs(velocity)>.01)coastFrame=requestAnimationFrame(coast);else{coastFrame=0;update(true);sync();}}
  coastFrame=requestAnimationFrame(coast);sync();
 }
 reel.addEventListener('pointerup',release);reel.addEventListener('pointercancel',release);
 function cancelDrag(){const pointer=drag?.id;drag=null;reel.classList.remove('is-dragging');if(pointer!=null&&reel.hasPointerCapture(pointer))reel.releasePointerCapture(pointer);stopCoast();}
 reel.addEventListener('lostpointercapture',event=>{if(drag?.id===event.pointerId){cancelDrag();sync();}});
 function checkVisibility(){visibilityFrame=0;const rect=reel.getBoundingClientRect();const nextVisible=rect.bottom>0&&rect.top<innerHeight;if(nextVisible===visible)return;visible=nextVisible;if(!visible)cancelDrag();sync();}
 function scheduleVisibility(){if(!visibilityFrame)visibilityFrame=requestAnimationFrame(checkVisibility);}
 const observer=new IntersectionObserver(checkVisibility);observer.observe(reel);addEventListener('scroll',scheduleVisibility,{passive:true});
 const resize=new ResizeObserver(()=>{cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(()=>{if(track)build();else{measure();update();}checkVisibility();});});resize.observe(reel);
 motion.addEventListener('change',()=>{if(motion.matches)disable();else enable();});document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelDrag();sync();});
 addEventListener('pagehide',()=>{cancelDrag();clock?.pause();clearInterval(counterTimer);cancelAnimationFrame(curveFrame);cancelAnimationFrame(resizeFrame);cancelAnimationFrame(visibilityFrame);visibilityFrame=0;resizeFrame=0;curveFrame=0;});addEventListener('pageshow',()=>{checkVisibility();sync();});
 measure();enable();update();
}
