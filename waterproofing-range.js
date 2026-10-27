// A brief, one-time settling motion; the pack composition is visible without JS.
const rangeBanner=document.querySelector('.range-product-composition');
if(rangeBanner&&!matchMedia('(prefers-reduced-motion:reduce)').matches){
 const arrival=new IntersectionObserver(entries=>{
  if(!entries[0].isIntersecting)return;
  rangeBanner.querySelectorAll('.range-featured-pack').forEach((pack,index)=>{
   if(pack.classList.contains('is-handoff-destination'))return;
   pack.animate([{translate:'0 18px'},{translate:'0 0'}],{duration:850,delay:index*28,easing:'cubic-bezier(.16,1,.3,1)'});
  });
  arrival.disconnect();
 },{threshold:.25});
 arrival.observe(rangeBanner);
 addEventListener('pagehide',()=>arrival.disconnect(),{once:true});
}
