// Native vertical scroll selects five complete, snapping horizontal photographs.
const story=document.querySelector('.wp-craft-story');
if(story){
 const stage=story.querySelector('.wp-craft-stage');
 const strip=story.querySelector('.wp-craft-media');
 const frames=[...story.querySelectorAll('[data-wp-craft-frame]')];
 const panels=[...story.querySelectorAll('.wp-craft-copy')];
 const progress=story.querySelector('.wp-craft-progress span');
 const motion=matchMedia('(prefers-reduced-motion:reduce)');
 const keys=['prepare','detail','prime','waterproof','protect'];
 let near=false,frame=0,active=-1,copyAnimation=null;
 function update(){
  frame=0;
  const rect=story.getBoundingClientRect();
  const distance=Math.max(1,story.offsetHeight-stage.offsetHeight);
  const fraction=Math.max(0,Math.min(1,-rect.top/distance));
  const position=fraction*(frames.length-1);
  const index=Math.round(position);
  story.classList.toggle('is-reduced',motion.matches);
  strip.style.transform=motion.matches?'none':'translate3d('+(-index*100)+'%,0,0)';
  progress.style.transform='scaleX('+fraction.toFixed(5)+')';
  if(index!==active){
   const previous=active;copyAnimation?.cancel();
   active=index;story.dataset.stage=keys[index];
   panels.forEach((panel,i)=>panel.hidden=i!==index);
   frames.forEach((image,i)=>image.classList.toggle('is-active',i===index));
   if(previous>=0&&!motion.matches&&rect.top<innerHeight&&rect.bottom>0)copyAnimation=panels[index].animate([{opacity:0,translate:'0 12px'},{opacity:1,translate:'0 0'}],{duration:380,delay:160,easing:'cubic-bezier(.16,1,.3,1)',fill:'backwards'});
  }
 }
 function schedule(){if(!frame)frame=requestAnimationFrame(update);}
 const observer=new IntersectionObserver(entries=>{
  near=entries[0].isIntersecting;
  if(near)frames.forEach(image=>image.loading='eager');
  schedule();
 },{rootMargin:'300px'});
 observer.observe(story);
 addEventListener('scroll',()=>{if(near)schedule();},{passive:true});
 addEventListener('resize',schedule,{passive:true});
 addEventListener('pageshow',schedule);
 motion.addEventListener('change',()=>{copyAnimation?.cancel();schedule();});
 addEventListener('pagehide',()=>{copyAnimation?.cancel();cancelAnimationFrame(frame);frame=0;});
 schedule();
}
