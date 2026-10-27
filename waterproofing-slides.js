// Seven chapter landings with interruptible eased motion. The service deck
// keeps ownership of its six steps and its slower, shared-product transfer.
const slideMotion=matchMedia('(prefers-reduced-motion:reduce)');
const slideViewport=matchMedia('(min-width:1001px) and (min-height:650px)');
const slideRoot=document.documentElement;
const serviceSlide=document.querySelector('.service-story'),approachSlide=document.querySelector('.wp-craft-story');
const slideGroups=new Map();
let glideFrame=0,ambientFrame=0,travelDirection=0,lastWheel=0,wheelTotal=0,wheelConsumed=false,inputDirection=0,touchGesture=null,serviceLandingLatch=false;
const absoluteTop=node=>scrollY+node.getBoundingClientRect().top;
const active=()=>slideRoot.classList.contains('wp-slide-mode');
function serviceOwns(){
 if(slideRoot.classList.contains('is-product-travel'))return true;
 if(!serviceSlide?.classList.contains('is-deck'))return false;
 const start=absoluteTop(serviceSlide),end=start+serviceSlide.getBoundingClientRect().height-innerHeight;
 return scrollY>=start-4&&scrollY<=end+4;
}
function blocked(event){return event.ctrlKey||event.metaKey||document.hidden||document.querySelector('dialog[open]')||document.body.classList.contains('navigation-open')||event.target.closest('input,textarea,select,[contenteditable=true]');}
function markers(node,count,distance){
 if(!node)return;let points=slideGroups.get(node);
 if(!points){points=Array.from({length:count},()=>{const marker=document.createElement('span');marker.className='wp-slide-anchor';marker.setAttribute('aria-hidden','true');marker.inert=true;node.append(marker);return marker;});slideGroups.set(node,points);}
 points.forEach((marker,index)=>marker.style.top=(index*distance/Math.max(1,count-1))+'px');
}
function cancelGlide(){cancelAnimationFrame(glideFrame);glideFrame=0;travelDirection=0;slideRoot.classList.remove('is-slide-gliding');}
function stopPoints(){
 const points=[];
 const add=(node,y=absoluteTop(node),kind='chapter')=>{if(node)points.push({node,y,kind});};
 const hero=document.querySelector('#overview'),spaces=document.querySelector('#spaces'),products=document.querySelector('.wp-products-why-slide'),form=document.querySelector('#enquiry'),gallery=document.querySelector('.wp-gallery-screen'),faq=document.querySelector('#faqs');
 if(hero)add(hero,0);
 if(spaces)add(spaces);
 if(serviceSlide){add(serviceSlide);add(serviceSlide,absoluteTop(serviceSlide)+serviceSlide.getBoundingClientRect().height-innerHeight,'service-end');}
 if(products)add(products);
 if(approachSlide){const stage=approachSlide.querySelector('.wp-craft-stage'),count=approachSlide.querySelectorAll('[data-wp-craft-frame]').length,distance=approachSlide.getBoundingClientRect().height-stage.getBoundingClientRect().height;for(let i=0;i<count;i++)add(approachSlide,absoluteTop(approachSlide)+i*distance/Math.max(1,count-1),'approach');}
 if(form)add(form);if(gallery)add(gallery);if(faq)add(faq,absoluteTop(faq),'exit');
 return points.sort((a,b)=>a.y-b.y).filter((point,index,array)=>!index||Math.abs(point.y-array[index-1].y)>3);
}
function nextPoint(direction){
 const points=stopPoints(),end=points.at(-1)?.y||Infinity;
 // FAQs and the footer keep ordinary reading scroll after the seven slides.
 if(scrollY>end+48||(direction>0&&scrollY>=end-4))return null;
 const form=document.querySelector('#enquiry');
 if(form&&form.getBoundingClientRect().height>innerHeight+4){const first=absoluteTop(form),last=first+form.getBoundingClientRect().height-innerHeight;if(scrollY>=first-4&&scrollY<=last+4&&((direction>0&&scrollY<last-4)||(direction<0&&scrollY>first+4)))return null;}
 const nearest=points.reduce((best,point)=>Math.abs(point.y-scrollY)<Math.abs(best.y-scrollY)?point:best,points[0]);
 const origin=!glideFrame&&Math.abs(nearest.y-scrollY)<innerHeight*.4?nearest.y:scrollY;
 return direction>0?points.find(point=>point.y>origin+5):points.findLast(point=>point.y<origin-5);
}
function moveSlide(direction,keyboard=false){
 const target=nextPoint(direction);if(!target)return false;
 if(glideFrame&&travelDirection===direction)return true;
 cancelGlide();travelDirection=direction;
 const from=scrollY,to=target.y,start=performance.now(),reverseProducts=target.kind==='service-end',duration=reverseProducts?1350:900;
 if(reverseProducts)dispatchEvent(new CustomEvent('wp-product-return'));
 slideRoot.classList.add('is-slide-gliding');
 function draw(now){
  const t=Math.min(1,(now-start)/duration),ease=t*t*t*(t*(t*6-15)+10);
  scrollTo({top:from+(to-from)*ease,behavior:'instant'});
  if(t<1)glideFrame=requestAnimationFrame(draw);
  else{glideFrame=0;travelDirection=0;serviceLandingLatch=target.node===serviceSlide;slideRoot.classList.remove('is-slide-gliding');if(keyboard){const heading=target.node.querySelector('h2,h1')||target.node;if(!heading.hasAttribute('tabindex'))heading.setAttribute('tabindex','-1');heading.focus({preventScroll:true});}}
 }
 glideFrame=requestAnimationFrame(draw);return true;
}
addEventListener('wheel',event=>{
 if(!active()||blocked(event)||Math.abs(event.deltaX)>Math.abs(event.deltaY))return;
 const delta=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?innerHeight:1);if(Math.abs(delta)<1)return;
 const now=performance.now(),direction=Math.sign(delta),fresh=now-lastWheel>200,reversed=inputDirection&&inputDirection!==direction;
 if(serviceOwns()&&!glideFrame){
  if(serviceLandingLatch&&!fresh&&!reversed){event.preventDefault();event.stopImmediatePropagation();lastWheel=now;return;}
  serviceLandingLatch=false;lastWheel=now;wheelConsumed=true;inputDirection=direction;return;
 }
 if(!nextPoint(direction))return;
 event.preventDefault();event.stopImmediatePropagation();
 if(fresh||reversed){wheelTotal=0;wheelConsumed=false;}
 lastWheel=now;inputDirection=direction;
 if(wheelConsumed)return;wheelTotal+=delta;
 if(Math.abs(wheelTotal)>=30){wheelConsumed=moveSlide(Math.sign(wheelTotal));wheelTotal=0;}
},{capture:true,passive:false});
document.addEventListener('keydown',event=>{
 if(!active()||blocked(event))return;
 if(event.key==='Escape'){cancelGlide();return;}
 let direction=0;if(['PageDown','ArrowDown'].includes(event.key))direction=1;if(['PageUp','ArrowUp'].includes(event.key))direction=-1;
 if(event.key===' '&&!event.target.closest('button,a'))direction=event.shiftKey?-1:1;
 if(!direction||serviceOwns()&&!glideFrame)return;
 if(!nextPoint(direction))return;event.preventDefault();event.stopImmediatePropagation();if(!event.repeat)moveSlide(direction,true);
},true);
document.addEventListener('touchstart',event=>{
 if(!active()||blocked(event)||event.touches.length!==1||serviceOwns()){touchGesture=null;return;}
 cancelGlide();touchGesture={x:event.touches[0].clientX,y:event.touches[0].clientY,consumed:false};event.stopImmediatePropagation();
},{capture:true,passive:true});
document.addEventListener('touchmove',event=>{
 if(!touchGesture||event.touches.length!==1)return;
 const dx=event.touches[0].clientX-touchGesture.x,dy=touchGesture.y-event.touches[0].clientY;
 if(Math.abs(dx)>Math.abs(dy))return;
 if(touchGesture.consumed){event.preventDefault();event.stopImmediatePropagation();return;}
 if(Math.abs(dy)>40&&nextPoint(Math.sign(dy))){event.preventDefault();event.stopImmediatePropagation();touchGesture.consumed=moveSlide(Math.sign(dy));}
},{capture:true,passive:false});
document.addEventListener('touchend',()=>touchGesture=null,{capture:true,passive:true});document.addEventListener('touchcancel',()=>{touchGesture=null;cancelGlide();},{capture:true,passive:true});
document.addEventListener('pointerdown',cancelGlide,{capture:true,passive:true});
document.addEventListener('click',cancelGlide,true);addEventListener('hashchange',cancelGlide);
function paintAmbient(){
 ambientFrame=0;if(!active())return;
 document.querySelectorAll('.journey-section,.wp-products-why-slide,.enquiry-campaign,.wp-gallery-screen').forEach(node=>{const rect=node.getBoundingClientRect();if(rect.bottom< -40||rect.top>innerHeight+40)return;const drift=Math.max(-24,Math.min(24,rect.top/innerHeight*24));node.style.setProperty('--slide-drift',drift.toFixed(2)+'px');});
}
addEventListener('scroll',()=>{if(!ambientFrame)ambientFrame=requestAnimationFrame(paintAmbient);},{passive:true});
function layoutSlides(){
 cancelGlide();const enabled=slideViewport.matches&&!slideMotion.matches;slideRoot.classList.toggle('wp-slide-mode',enabled);if(!enabled)return;
 if(serviceSlide?.classList.contains('is-deck'))markers(serviceSlide,serviceSlide.querySelectorAll('[data-service-step]').length+2,Math.max(0,serviceSlide.getBoundingClientRect().height-innerHeight));
 if(approachSlide)markers(approachSlide,approachSlide.querySelectorAll('[data-wp-craft-frame]').length,Math.max(0,approachSlide.getBoundingClientRect().height-approachSlide.querySelector('.wp-craft-stage').getBoundingClientRect().height));
 paintAmbient();
}
const slideResize=new ResizeObserver(layoutSlides);[serviceSlide,approachSlide,approachSlide?.querySelector('.wp-craft-stage')].filter(Boolean).forEach(node=>slideResize.observe(node));
slideViewport.addEventListener('change',layoutSlides);slideMotion.addEventListener('change',layoutSlides);addEventListener('resize',layoutSlides,{passive:true});addEventListener('pageshow',layoutSlides);
document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelGlide();});addEventListener('pagehide',()=>{cancelGlide();cancelAnimationFrame(ambientFrame);ambientFrame=0;touchGesture=null;slideRoot.classList.remove('is-product-travel');});
document.fonts.ready.then(layoutSlides);layoutSlides();
