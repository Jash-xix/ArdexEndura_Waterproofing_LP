// Compact discovery and knowledge. No WebGL is loaded by this landing page.
import '/waterproofing-service-deck.js';
import '/waterproofing-range.js';
const $=id=>document.getElementById(id);
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
const stageLabels={repair:'Choose the space you want to repair or renovate.',new:'Choose the space you’re planning for new construction.'};
let currentStage='';
const journeyAnimations=new Set();
// Warm both photographic sets as discovery approaches, including images in the
// hidden tab. This avoids a blank first switch without competing with the hero.
const journeySection=$('spaces');
function warmJourney(){journeySection?.querySelectorAll('img').forEach(img=>{if(img.closest('[hidden]'))img.fetchPriority='low';img.loading='eager';});}
if(journeySection){
  const warmer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){warmJourney();warmer.disconnect();}},{rootMargin:'500px'});
  warmer.observe(journeySection);
  document.querySelectorAll('.journey-switch label').forEach(label=>{label.addEventListener('pointerenter',warmJourney,{once:true,passive:true});label.addEventListener('focusin',warmJourney,{once:true});});
}
function showJourney(value,animate=false){
  const stage=value==='new'?'new':'repair';if(stage===currentStage)return;currentStage=stage;
  journeyAnimations.forEach(animation=>animation.cancel());journeyAnimations.clear();
  document.querySelectorAll('[data-journey-panel]').forEach(panel=>{panel.hidden=panel.dataset.journeyPanel!==stage;});
  if($('journey-context'))$('journey-context').textContent=stageLabels[stage];
  // The same spaces receive a new photographic treatment. A short shutter reveal
  // expresses that change; the links remain immediately usable throughout.
  if(animate&&!reduce.matches){
    $('journey-'+stage)?.querySelectorAll('.solution-card-image').forEach((image,index)=>{
      const animation=image.animate([{clipPath:'inset(0 100% 0 0)'},{clipPath:'inset(0 0 0 0)'}],{duration:460,delay:Math.min(index%5*28,112),easing:'cubic-bezier(.22,1,.36,1)',fill:'backwards'});
      journeyAnimations.add(animation);animation.finished.then(()=>journeyAnimations.delete(animation)).catch(()=>{});
    });
  }
}
document.querySelectorAll('.journey-switch input').forEach(input=>input.addEventListener('change',()=>showJourney(input.value,true)));
new MutationObserver(()=>showJourney(document.body.dataset.projectStage,true)).observe(document.body,{attributes:true,attributeFilter:['data-project-stage']});
showJourney(document.body.dataset.projectStage||document.querySelector('.journey-switch input:checked')?.value||'repair');

// A photograph is a window into the space. Only its crop follows the pointer:
// no tilting text, moving hit targets, perpetual render loop, or mobile effect.
const finePointer=matchMedia('(hover: hover) and (pointer: fine)');
const solutionCards=[...document.querySelectorAll('.solution-card')];
let pointerFrame=0,pointerCard=null,pointerPosition=null;
function resetCard(card){card?.style.removeProperty('--image-x');card?.style.removeProperty('--image-y');}
function stopPointer(){cancelAnimationFrame(pointerFrame);pointerFrame=0;resetCard(pointerCard);pointerCard=null;pointerPosition=null;}
solutionCards.forEach(card=>{
  card.addEventListener('pointermove',event=>{
    if(!finePointer.matches||reduce.matches||event.pointerType==='touch')return;
    if(pointerCard!==card){resetCard(pointerCard);pointerCard=card;}
    pointerPosition={x:event.clientX,y:event.clientY};
    if(pointerFrame)return;
    pointerFrame=requestAnimationFrame(()=>{
      pointerFrame=0;if(!pointerCard||!pointerPosition)return;
      const rect=pointerCard.getBoundingClientRect();
      const x=Math.max(-1,Math.min(1,(pointerPosition.x-rect.left)/rect.width*2-1));
      const y=Math.max(-1,Math.min(1,(pointerPosition.y-rect.top)/rect.height*2-1));
      pointerCard.style.setProperty('--image-x',`${-x*5}px`);pointerCard.style.setProperty('--image-y',`${-y*4}px`);
    });
  },{passive:true});
  card.addEventListener('pointerleave',stopPointer);
});
addEventListener('scroll',stopPointer,{passive:true});
finePointer.addEventListener('change',stopPointer);
reduce.addEventListener('change',()=>{if(reduce.matches){stopPointer();journeyAnimations.forEach(a=>a.cancel());journeyAnimations.clear();}});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopPointer();});

// Final values remain in HTML and accessible names. Count once as each value enters view.
const counters=[...document.querySelectorAll('[data-count-end]')];
const running=new Map();
function format(node,value){return new Intl.NumberFormat('en-IN',{minimumFractionDigits:Number(node.dataset.countDecimals||0),maximumFractionDigits:Number(node.dataset.countDecimals||0)}).format(value);}
function finishCounter(node){if(running.has(node))cancelAnimationFrame(running.get(node));running.delete(node);node.textContent=format(node,Number(node.dataset.countEnd));}
function count(node){
  if(reduce.matches||document.hidden){finishCounter(node);return;}
  const end=Number(node.dataset.countEnd),start=performance.now(),duration=1300;
  function frame(time){const t=Math.min(1,(time-start)/duration),p=1-Math.pow(1-t,3);node.textContent=format(node,end*p);if(t<1)running.set(node,requestAnimationFrame(frame));else running.delete(node);}
  node.textContent=format(node,0);running.set(node,requestAnimationFrame(frame));
}
const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
  if(entry.isIntersecting&&!entry.target.dataset.counted){entry.target.dataset.counted='true';count(entry.target);observer.unobserve(entry.target);}
  else if(!entry.isIntersecting&&running.has(entry.target))finishCounter(entry.target);
}),{threshold:.2});counters.forEach(node=>observer.observe(node));
reduce.addEventListener('change',()=>{if(reduce.matches)running.forEach((_,node)=>finishCounter(node));});
document.addEventListener('visibilitychange',()=>{if(document.hidden)running.forEach((_,node)=>finishCounter(node));});
