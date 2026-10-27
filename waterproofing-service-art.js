// A shared set of official packs connects the service story to the range banner.
const service=document.querySelector('.service-story');
const range=document.querySelector('#waterproofing-range');
if(service&&range){
 const reduce=matchMedia('(prefers-reduced-motion:reduce)');
 const sources=[...service.querySelectorAll('[data-service-product]')];
 let frame=0,ready=false,flight=null,previousState='',sceneAnimations=[],settleAnimations=[],drawProgress=0,lastFrame=0;
 const clamp=n=>Math.max(0,Math.min(1,n));
 const landing=range.closest('.wp-products-why-slide')||range;
 const landingTop=()=>scrollY+landing.getBoundingClientRect().top;
 const exitStart=()=>landingTop()-innerHeight;
 const state=()=>service.dataset.serviceState;
 function stopScene(){sceneAnimations.forEach(a=>a.cancel());sceneAnimations=[];}
 function stopSettle(){settleAnimations.forEach(a=>a.cancel());settleAnimations=[];}
 function arrive(){
  const current=state();if(current===previousState)return;previousState=current;stopScene();
  if(current!=='7'){ready=false;release(false);}
  if(reduce.matches||document.hidden)return;
  const selected=service.querySelector('.service-tile.is-focused');if(!selected)return;
  const parts=[...selected.querySelectorAll('[data-art-enter],.service-pack')];
  parts.forEach((part,index)=>{
   const animation=part.animate([{translate:'0 22px',opacity:.25},{translate:'0 0',opacity:1}],{duration:720,delay:120+index*45,easing:'cubic-bezier(.16,1,.3,1)'});
   sceneAnimations.push(animation);
  });
  selected.querySelectorAll('.scene-wave i').forEach((bar,index)=>{
   sceneAnimations.push(bar.animate([{scale:'1 .4'},{scale:'1 1',offset:.35},{scale:'1 .55',offset:.65},{scale:'1 1'}],{duration:1200,delay:350+index*25,easing:'ease-in-out'}));
  });
 }
 function measure(){
  if(reduce.matches||!service.classList.contains('is-deck')||state()!=='7'||Math.abs(scrollY-exitStart())>4)return;
  const pairs=sources.map(source=>{
   const target=range.querySelector(`[data-range-product="${source.dataset.serviceProduct}"]`);
   const art=source.querySelector('.service-pack-art'),destination=target?.querySelector('.range-featured-art');
   if(!destination||!art.querySelector('img').complete)return null;
   const from=art.getBoundingClientRect();
   return from.width>0&&from.height>0?{source,target,art,from:{x:from.x,y:from.y,width:from.width,height:from.height}}:null;
  }).filter(Boolean);
  if(pairs.length!==sources.length)return;
  ready=pairs;drawProgress=0;lastFrame=0;
 }
 function prepareReturn(){
  if(reduce.matches||!service.classList.contains('is-deck')||state()!=='7')return;
  const pairs=sources.map(source=>{
   const target=range.querySelector(`[data-range-product="${source.dataset.serviceProduct}"]`),art=source.querySelector('.service-pack-art');
   if(!target||!art.querySelector('img').complete)return null;
   const rect=art.getBoundingClientRect();return rect.width>0?{source,target,art,from:{x:rect.x,y:rect.y+scrollY-exitStart(),width:rect.width,height:rect.height}}:null;
  }).filter(Boolean);
  if(pairs.length!==sources.length)return;release(false);ready=pairs;drawProgress=1;lastFrame=0;
 }
 addEventListener('wp-product-return',prepareReturn);
 function release(settle){
  if(!flight)return;
  const finished=flight;flight=null;
  finished.forEach(pair=>{
   pair.clone.remove();pair.source.classList.remove('is-handoff-source');pair.target.classList.remove('is-handoff-destination');
   if(settle&&!reduce.matches&&!document.hidden){const a=pair.target.querySelector('.range-featured-art').animate([{translate:'0 -7px'},{translate:'0 0'}],{duration:420,easing:'cubic-bezier(.16,1,.3,1)'});settleAnimations.push(a);a.finished.then(()=>settleAnimations=settleAnimations.filter(item=>item!==a)).catch(()=>{});}
  });
  range.classList.remove('has-product-handoff');service.removeAttribute('data-product-flight');
 }
 function begin(){
  if(!ready||flight)return;
  stopSettle();
  range.classList.add('has-product-handoff');
  flight=ready.map(pair=>{
   const rect=pair.target.querySelector('.range-featured-art').getBoundingClientRect();
   const to={x:rect.x,y:rect.y+scrollY-landingTop(),width:rect.width,height:rect.height};
   const clone=pair.art.cloneNode(true);clone.className='service-flying-pack';clone.setAttribute('aria-hidden','true');clone.inert=true;
   clone.style.width=pair.from.width+'px';clone.style.height=pair.from.height+'px';document.body.append(clone);
   pair.source.classList.add('is-handoff-source');pair.target.classList.add('is-handoff-destination');
   return {...pair,to,clone};
  });
 }
 function update(){
  frame=0;if(reduce.matches||document.hidden){release(false);return;}
  const progress=(scrollY-exitStart())/innerHeight;
  if(state()==='7'&&Math.abs(progress)<.004&&!flight)measure();
  if(!ready)return;
  if(progress<-.01||progress>1.3){release(false);drawProgress=clamp(progress);lastFrame=0;return;}
  if(progress<=0&&!flight){drawProgress=0;return;}
  if(progress>=1&&!flight){drawProgress=1;return;}
  begin();if(!flight)return;
  const now=performance.now(),dt=lastFrame?Math.min(48,now-lastFrame):16;lastFrame=now;
  const target=clamp(progress);drawProgress+=(target-drawProgress)*(1-Math.exp(-dt/65));
  if(Math.abs(target-drawProgress)<.0005)drawProgress=target;
  if(drawProgress===1&&target===1){release(true);return;}
  if(drawProgress===0&&target===0){release(false);return;}
  const p=clamp(drawProgress),smooth=p*p*(3-2*p);
  service.dataset.productFlight=p.toFixed(3);
  flight.forEach((pair,index)=>{
   // Keep the same pack visible as the page moves beneath it. Each pack lands
   // at the real, responsive banner rectangle, rather than an invented slot.
   const t=clamp((smooth-index*.012)/(1-index*.012));
   const from=pair.from,to=pair.to;
   const x=from.x+(to.x-from.x)*t;
   const y=from.y+(to.y-from.y)*t-Math.sin(Math.PI*t)*Math.min(65,innerHeight*.07);
   const scaleX=1+(to.width/from.width-1)*t,scaleY=1+(to.height/from.height-1)*t;
   pair.clone.style.transform=`translate3d(${x}px,${y}px,0) scale(${scaleX},${scaleY})`;
  });
  if(Math.abs(target-drawProgress)>.0005)schedule();
 }
 function schedule(){if(!frame)frame=requestAnimationFrame(update);}
 const observer=new MutationObserver(()=>{arrive();schedule();});observer.observe(service,{attributes:true,attributeFilter:['data-service-state']});
 // Read the closing overview before the deck's scroll handler starts moving it.
 addEventListener('wheel',measure,{capture:true,passive:true});document.addEventListener('keydown',measure,{capture:true});document.addEventListener('touchstart',measure,{capture:true,passive:true});
 addEventListener('scroll',schedule,{passive:true});
 addEventListener('resize',()=>{ready=false;release(false);schedule();},{passive:true});
 reduce.addEventListener('change',()=>{ready=false;release(false);stopScene();stopSettle();schedule();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){release(false);stopScene();stopSettle();}else schedule();});
 addEventListener('pagehide',()=>{release(false);stopScene();stopSettle();cancelAnimationFrame(frame);frame=0;ready=false;});
 addEventListener('pageshow',schedule);
 const warm=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){service.querySelectorAll('.service-tile-art img').forEach(img=>img.loading='eager');range.querySelectorAll('img').forEach(img=>img.loading='eager');warm.disconnect();}},{rootMargin:'500px'});warm.observe(service);
 arrive();schedule();
}
