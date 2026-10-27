// Reflect the currently read chapter without changing native anchor navigation.
const navigation=[...document.querySelectorAll('body[data-page=landing] .desktop-nav a[href^="#"],body[data-page=landing] .mobile-nav a[href^="#"]')];
const chapters=[...new Set(navigation.map(link=>document.getElementById(link.hash.slice(1))).filter(Boolean))].sort((a,b)=>a.compareDocumentPosition(b)&Node.DOCUMENT_POSITION_FOLLOWING?-1:1);
if(chapters.length){
 let frame=0,current='';
 function update(){frame=0;let next='';const line=(document.querySelector('.site-head')?.offsetHeight||80)+90;for(const section of chapters){if(section.getBoundingClientRect().top<=line)next='#'+section.id;}if(next===current)return;current=next;for(const link of navigation){if(link.hash===current)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');}}
 function schedule(){if(!frame)frame=requestAnimationFrame(update);}
 addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule,{passive:true});addEventListener('pageshow',schedule);
 addEventListener('pagehide',()=>cancelAnimationFrame(frame),{once:true});schedule();
}
