const faq=document.querySelector('.wp-faq');
if(faq){
 const items=[...faq.querySelectorAll('.wp-faq-item')],hover=matchMedia('(hover:hover) and (pointer:fine)');
 function open(item,state){
  if(state)items.filter(other=>other!==item).forEach(other=>open(other,false));
  item.classList.toggle('is-open',state);item.querySelector('button').setAttribute('aria-expanded',String(state));item.querySelector('.wp-faq-answer').inert=!state;
 }
 items.forEach(item=>{
  const button=item.querySelector('button');
  item.addEventListener('pointerenter',event=>{if(hover.matches&&event.pointerType==='mouse')open(item,true);});
  item.addEventListener('pointerleave',()=>{if(!item.contains(document.activeElement))open(item,false);});
  button.addEventListener('click',event=>open(item,event.pointerType==='mouse'&&hover.matches?true:button.getAttribute('aria-expanded')!=='true'));
  button.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();open(item,false);}});
  item.addEventListener('focusout',event=>{if(!item.contains(event.relatedTarget))open(item,false);});
 });
}
