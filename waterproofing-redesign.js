// Landing enhancement: native scrolling, pointer comparison, responsive architectural study.
const $ = id => document.getElementById(id);
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const comparison = $('hero-comparison'), comparisonRange = $('hero-comparison-range');
let split = 50, splitTarget = 50, splitFrame = 0, touchStart = null;
let handleIdleTimer = 0;
function hideComparisonHandle() {
  clearTimeout(handleIdleTimer);
  comparison?.classList.remove('is-pointer-moving');
}
function showComparisonHandle() {
  clearTimeout(handleIdleTimer);
  comparison?.classList.add('is-pointer-moving');
  handleIdleTimer = setTimeout(hideComparisonHandle, 450);
}
function drawSplit() {
  splitFrame = 0;
  split = motion.matches ? splitTarget : split + (splitTarget - split) * .2;
  if (Math.abs(splitTarget-split)<.05) split=splitTarget;
  comparison?.style.setProperty('--split', split.toFixed(2)+'%');
  if (Math.abs(splitTarget-split)>.05) splitFrame=requestAnimationFrame(drawSplit);
}
function setSplit(value) {
  splitTarget=Math.max(5,Math.min(95,value));
  if(comparisonRange){comparisonRange.value=String(Math.round(splitTarget));comparisonRange.setAttribute('aria-valuetext',Math.round(splitTarget)+' percent damaged view');}
  if(!splitFrame) splitFrame=requestAnimationFrame(drawSplit);
}
comparisonRange?.addEventListener('input',event=>setSplit(Number(event.target.value)));
comparison?.addEventListener('pointerdown', event=>{
  if(event.pointerType==='mouse'||event.target.closest('a,input,button')) return;
  touchStart={x:event.clientX,y:event.clientY};
  showComparisonHandle();
});
comparison?.addEventListener('pointermove', event=>{
  if(event.pointerType==='mouse') showComparisonHandle();
  if(event.target.closest('a,input,button')) return;
  if(event.pointerType!=='mouse') {
    if(!touchStart || Math.abs(event.clientX-touchStart.x)<Math.abs(event.clientY-touchStart.y)) return;
  }
  if(event.pointerType!=='mouse') showComparisonHandle();
  const box=comparison.getBoundingClientRect();setSplit((event.clientX-box.left)/box.width*100);
}, {passive:true});
comparison?.addEventListener('pointerup',()=>touchStart=null);
comparison?.addEventListener('pointercancel',()=>{touchStart=null;hideComparisonHandle();});
comparison?.addEventListener('pointerleave',()=>{touchStart=null;hideComparisonHandle();});
document.addEventListener('visibilitychange',()=>{if(document.hidden)hideComparisonHandle();});
addEventListener('pagehide',hideComparisonHandle);

// Scroll paint is bounded to visible photographs; no wheel/touch interception.
const parallax=[...document.querySelectorAll('[data-parallax]')];
let scrollFrame=0;
function paintScroll(){
  scrollFrame=0;const vh=innerHeight;
  if(motion.matches) return;
  parallax.forEach(node=>{
    const box=node.getBoundingClientRect();if(box.bottom<0||box.top>vh) return;
    const progress=(vh/2-(box.top+box.height/2));
    const offset=Math.max(-35,Math.min(35,progress*Number(node.dataset.parallax)));
    const img=node.querySelector('img');if(img) img.style.transform='translateY('+offset.toFixed(1)+'px) scale(1.025)';
  });
  // The comparison pair shares one fixed camera; leave both photographs at native scale.
}
function scheduleScroll(){if(!scrollFrame) scrollFrame=requestAnimationFrame(paintScroll);}
addEventListener('scroll',scheduleScroll,{passive:true});addEventListener('resize',scheduleScroll,{passive:true});
motion.addEventListener('change',()=>{if(motion.matches){parallax.forEach(node=>node.querySelector('img')?.style.removeProperty('transform'));comparison?.querySelectorAll('img').forEach(img=>img.style.removeProperty('transform'));}else scheduleScroll();});
scheduleScroll();
if(!motion.matches) document.querySelector('.waterproofing-hero-intro')?.animate([{opacity:.7,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}],{duration:650,easing:'cubic-bezier(.16,1,.3,1)'});

import '/waterproofing-flow.js';
import '/waterproofing-approach.js';
import '/waterproofing-testimonials.js';
import '/waterproofing-shell.js';
