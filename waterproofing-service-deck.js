// Overview -> six focused tiles -> overview -> normal page flow.
const story=document.querySelector('.service-story');
if(story){
 const root=document.documentElement,board=story.querySelector('.service-deck-board');
 const cards=[...story.querySelectorAll('[data-service-step]')];
 const back=story.querySelector('.service-deck-back'),hint=story.querySelector('.service-deck-hint'),status=story.querySelector('.service-deck-status');
 const reduce=matchMedia('(prefers-reduced-motion:reduce)'),phone=matchMedia('(max-width:650px)');
 let state=-1,segment=0,frame=0,resizeFrame=0,exitFrame=0,targetState=null,navigatingUntil=0,transitionUntil=0;
 let lastWheel=0,wheelTotal=0,wheelConsumed=false,touch=null,boundaryGuardUntil=0,touchEntry=null;
 const animations=new Set();
 const start=()=>scrollY+story.getBoundingClientRect().top;
 const last=()=>start()+7*segment;
 const enabled=()=>story.classList.contains('is-deck');
 const point=index=>start()+index*segment;
 function stopExit(){cancelAnimationFrame(exitFrame);exitFrame=0;root.classList.remove('is-product-travel');}
 function exitToProducts(){
  stopExit();const from=scrollY,to=scrollY+story.nextElementSibling.getBoundingClientRect().top,began=performance.now(),duration=1350;
  transitionUntil=began+duration;boundaryGuardUntil=began+duration+300;root.classList.add('is-product-travel');
  function travel(now){const t=Math.min(1,(now-began)/duration),ease=t*t*(3-2*t);scrollTo({top:from+(to-from)*ease,behavior:'instant'});if(t<1)exitFrame=requestAnimationFrame(travel);else{exitFrame=0;root.classList.remove('is-product-travel');}}
  exitFrame=requestAnimationFrame(travel);
 }
 function stopAnimations(){animations.forEach(animation=>animation.cancel());animations.clear();}
 function animate(node,frames,options){const a=node.animate(frames,options);animations.add(a);a.finished.then(()=>animations.delete(a)).catch(()=>{});}
 function render(next,withMotion=true){
  next=Math.max(0,Math.min(7,next));if(next===state)return;
  const oldState=state,oldFocus=oldState>=1&&oldState<=6?oldState-1:-1,active=document.activeElement;
  const rects=cards.map(card=>card.getBoundingClientRect());stopAnimations();state=next;
  const focused=next>=1&&next<=6?next-1:-1;
  story.classList.toggle('has-focus',focused>=0);story.dataset.serviceState=String(next);
  back.hidden=focused<0;
  hint.firstChild.textContent=next===7?'Scroll to continue ':'Scroll to explore the steps ';
  cards.forEach((card,index)=>{
   const visible=focused<0||index===focused;
   card.classList.toggle('is-focused',index===focused);
   card.setAttribute('aria-hidden',String(!visible));card.inert=!visible;
   if(index===focused)card.setAttribute('aria-current','step');else card.removeAttribute('aria-current');
  });
  if((active===back&&focused<0)||cards.some(card=>card.contains(active)&&card.inert)){
   (focused<0?cards[0].querySelector('.service-tile-open'):back).focus({preventScroll:true});
  }
  status.textContent=focused>=0?'Step '+next+' of 6. '+cards[focused].querySelector('h3').textContent:next===7?'All six steps. Scroll once more to continue.':'All six steps. Scroll to explore, or choose a tile.';
  if(!withMotion||reduce.matches||oldState<0)return;
  const timing={duration:560,easing:'cubic-bezier(.16,1,.3,1)'};
  cards.forEach((card,index)=>{
   if(focused>=0&&index!==focused&&index!==oldFocus)return;
   const to=card.getBoundingClientRect(),from=rects[index];
   if(!to.width||!to.height)return;
   const visible=focused<0||index===focused;
   animate(card,[{transform:`translate(${from.left-to.left}px,${from.top-to.top}px) scale(${from.width/to.width},${from.height/to.height})`,opacity:index===focused||index===oldFocus||oldFocus<0?1:0},{transform:'translate(0,0) scale(1,1)',opacity:visible?1:0}],timing);
   if(visible)animate(card.querySelector('.service-tile-copy'),[{opacity:0},{opacity:0,offset:.35},{opacity:1}],{...timing,delay:focused<0?Math.min(index*25,125):0});
  });
 }
 function layout(){
  stopExit();
  const retain=enabled()&&state>=0&&scrollY>=start()-3&&scrollY<=last()+3;
  stopAnimations();
  if(reduce.matches){story.classList.remove('is-deck','has-focus');story.style.height='';cards.forEach(card=>{card.removeAttribute('style');card.removeAttribute('aria-hidden');card.inert=false;card.classList.remove('is-focused');card.removeAttribute('aria-current');});back.hidden=true;state=-1;return;}
  story.classList.add('is-deck');segment=Math.max(360,innerHeight*.8);story.style.height=(innerHeight+7*segment)+'px';
  const cols=phone.matches?2:3,rows=6/cols,gap=phone.matches?12:16;
  const width=(board.clientWidth-(cols-1)*gap)/cols,height=(board.clientHeight-(rows-1)*gap)/rows;
  cards.forEach((card,index)=>{card.style.left=(index%cols*(width+gap))+'px';card.style.top=(Math.floor(index/cols)*(height+gap))+'px';card.style.width=width+'px';card.style.height=height+'px';});
  if(state<0)render(0,false);
  if(retain){targetState=null;scrollTo({top:point(state),behavior:'instant'});}
  schedule();
 }
 function update(){
  frame=0;root.classList.toggle('past-docked-chapters',story.getBoundingClientRect().top<=(document.querySelector('.site-head')?.offsetHeight||0)+2);
  if(!enabled())return;
  if(touchEntry&&performance.now()<touchEntry.until&&targetState===null){
   if(touchEntry.side==='before'&&scrollY>=start()){touchEntry=null;go(0,'instant');return;}
   if(touchEntry.side==='after'&&scrollY<=last()){touchEntry=null;go(7,'instant');return;}
  }
  if(targetState!==null){if(Math.abs(scrollY-point(targetState))<3||performance.now()>navigatingUntil)targetState=null;else return;}
  render(Math.round((scrollY-start())/segment),story.getBoundingClientRect().bottom>0&&story.getBoundingClientRect().top<innerHeight);
 }
 function schedule(){if(!frame)frame=requestAnimationFrame(update);}
 function go(index,behavior='smooth'){
  if(!enabled())return;
  stopExit();
  index=Math.max(0,Math.min(7,index));root.classList.add('past-docked-chapters');render(index);
  targetState=index;navigatingUntil=performance.now()+900;transitionUntil=performance.now()+580;
  scrollTo({top:point(index),behavior});
 }
 function advance(direction){
  if(direction>0&&state>=7){targetState=null;exitToProducts();return;}
  if(direction<0&&state<=0){targetState=null;transitionUntil=performance.now()+650;boundaryGuardUntil=performance.now()+1400;scrollTo({top:Math.max(0,start()-innerHeight),behavior:'smooth'});return;}
  go(state+direction);
 }
 function docked(){return enabled()&&scrollY>=start()-3&&scrollY<=last()+3&&!document.querySelector('dialog[open]')&&!document.body.classList.contains('navigation-open');}
 addEventListener('wheel',event=>{
  if(!enabled()||event.ctrlKey||Math.abs(event.deltaX)>Math.abs(event.deltaY)||event.target.closest('input,textarea,select,[contenteditable=true]')||document.querySelector('dialog[open]')||document.body.classList.contains('navigation-open'))return;
  const now=performance.now(),fresh=now-lastWheel>190,delta=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?innerHeight:1);
  if(exitFrame&&delta<0){stopExit();transitionUntil=0;boundaryGuardUntil=0;}
  if(now<boundaryGuardUntil&&(now<transitionUntil||!fresh)){event.preventDefault();lastWheel=now;return;}
  if(!docked()){
   const entering=delta>0&&scrollY<start()&&start()-scrollY<=Math.max(delta,64);
   const returning=delta<0&&scrollY>last()&&scrollY-last()<=Math.max(-delta,64);
   if(entering||returning){event.preventDefault();lastWheel=now;wheelConsumed=true;go(entering?0:7);}
   return;
  }
  event.preventDefault();lastWheel=now;
  if(fresh){wheelTotal=0;wheelConsumed=false;}
  if(wheelConsumed||now<transitionUntil)return;
  wheelTotal+=delta;
  if(Math.abs(wheelTotal)>=35){wheelConsumed=true;advance(Math.sign(wheelTotal));}
 },{passive:false});
 document.addEventListener('keydown',event=>{
  if(exitFrame&&['PageUp','ArrowUp','Escape'].includes(event.key)){stopExit();transitionUntil=0;boundaryGuardUntil=0;}
  if(!docked()||event.target.closest('input,textarea,select,[contenteditable=true]'))return;
  if(event.key==='Escape'&&state>=1&&state<=6){event.preventDefault();go(0);return;}
  let direction=0;if(['PageDown','ArrowDown'].includes(event.key))direction=1;if(['PageUp','ArrowUp'].includes(event.key))direction=-1;
  if(event.key===' '&&!event.target.closest('button,a'))direction=event.shiftKey?-1:1;
  if(direction){event.preventDefault();if(!event.repeat&&performance.now()>=transitionUntil)advance(direction);}
 });
 document.addEventListener('touchstart',event=>{if(!enabled()||event.touches.length!==1||event.target.closest('input,textarea,select,[contenteditable=true],dialog')||document.body.classList.contains('navigation-open'))return;if(exitFrame){stopExit();transitionUntil=0;boundaryGuardUntil=0;}touch={x:event.touches[0].clientX,y:event.touches[0].clientY,consumed:false};touchEntry=scrollY<start()?{side:'before',until:Infinity}:scrollY>last()?{side:'after',until:Infinity}:null;},{passive:true});
 document.addEventListener('touchmove',event=>{
  if(!touch||event.touches.length!==1)return;
  if(touch.consumed){event.preventDefault();return;}
  const dx=event.touches[0].clientX-touch.x,dy=touch.y-event.touches[0].clientY;
  if(Math.abs(dx)>Math.abs(dy))return;
  if(!docked()){
   const entering=dy>0&&scrollY<start()&&start()-scrollY<=Math.max(dy,64);
   const returning=dy<0&&scrollY>last()&&scrollY-last()<=Math.max(-dy,64);
   if(entering||returning){event.preventDefault();touch.consumed=true;touchEntry=null;go(entering?0:7);}
   return;
  }
  touchEntry=null;
  event.preventDefault();if(!touch.consumed&&Math.abs(dy)>45&&performance.now()>=transitionUntil){touch.consumed=true;advance(Math.sign(dy));}
 },{passive:false});
 document.addEventListener('touchend',()=>{touch=null;if(touchEntry)touchEntry.until=performance.now()+1000;},{passive:true});document.addEventListener('touchcancel',()=>{touch=null;touchEntry=null;},{passive:true});
 cards.forEach((card,index)=>card.querySelector('.service-tile-open').addEventListener('click',()=>{go(index+1);back.focus({preventScroll:true});}));
 back.addEventListener('click',()=>go(0));
 function restore(){
  if(['#knowledge','#water-story','#investment','#waterproofing','#performance','#systems','#protection'].includes(location.hash))history.replaceState(history.state,'',location.pathname+location.search+'#waterproofing-range');
  const hash=location.hash,target=document.getElementById(hash.slice(1));if(!target)return;
  if(target===story){if(enabled())go(0,'instant');else story.scrollIntoView({block:'start',behavior:'instant'});}
  else if(target.matches('[data-service-step]')&&enabled())go(Number(target.dataset.serviceStep),'instant');
  else if(story.compareDocumentPosition(target)&Node.DOCUMENT_POSITION_FOLLOWING){touchEntry=null;root.classList.add('past-docked-chapters');target.scrollIntoView({block:'start',behavior:'instant'});}
 }
 document.addEventListener('click',event=>{const link=event.target.closest('a[href^="#"]');if(!link)return;stopExit();const hash=link.getAttribute('href');if(hash==='#how-it-works'||/^#service-step-[1-6]$/.test(hash)){event.preventDefault();history.pushState(history.state,'',hash);restore();}else{targetState=null;const target=document.getElementById(hash.slice(1));if(target&&(story.compareDocumentPosition(target)&Node.DOCUMENT_POSITION_FOLLOWING))root.classList.add('past-docked-chapters');}},{capture:true});
 addEventListener('scroll',schedule,{passive:true});addEventListener('resize',()=>{cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(layout);},{passive:true});
 reduce.addEventListener('change',()=>{layout();restore();});
 if(document.readyState==='complete')requestAnimationFrame(()=>{layout();restore();});else addEventListener('load',()=>{layout();restore();},{once:true});
 document.fonts.ready.then(()=>{layout();schedule();});
 addEventListener('pagehide',()=>{stopExit();stopAnimations();cancelAnimationFrame(frame);cancelAnimationFrame(resizeFrame);frame=0;resizeFrame=0;touch=null;touchEntry=null;});
 addEventListener('pageshow',event=>{if(event.persisted){targetState=null;layout();schedule();}});
 layout();
}
