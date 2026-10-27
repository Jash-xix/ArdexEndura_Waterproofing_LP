// One welcoming entrance. The form and portrait are fully visible without JS.
const enquiryCampaign=document.querySelector('.enquiry-campaign');
if(enquiryCampaign){
 const reduce=matchMedia('(prefers-reduced-motion:reduce)');let animations=[];
 function stop(){animations.forEach(a=>a.cancel());animations=[];}
 const observer=new IntersectionObserver(entries=>{
  if(!entries.some(entry=>entry.isIntersecting))return;
  observer.disconnect();if(reduce.matches||document.hidden)return;
  const intro=enquiryCampaign.querySelector('.enquiry-intro'),card=enquiryCampaign.querySelector('.enquiry-contact-card'),person=enquiryCampaign.querySelector('.enquiry-applicator');
  const timing={duration:760,easing:'cubic-bezier(.16,1,.3,1)'};
  animations.push(intro.animate([{opacity:.35,translate:'0 18px'},{opacity:1,translate:'0 0'}],timing));
  animations.push(card.animate([{opacity:.25,translate:'24px 0',scale:'.985'},{opacity:1,translate:'0 0',scale:'1'}],{...timing,delay:80}));
  animations.push(person.animate([{opacity:0,translate:'0 22px'},{opacity:1,translate:'0 0'}],{...timing,duration:860,delay:180}));
 },{threshold:.12});observer.observe(enquiryCampaign);
 reduce.addEventListener('change',stop);document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});addEventListener('pagehide',()=>{stop();observer.disconnect();});
}
