const privacy=document.getElementById('privacy-information');
document.querySelectorAll('a[href="#privacy-information"]').forEach(link=>link.addEventListener('click',event=>{event.preventDefault();privacy.showModal();}));
privacy.querySelector('button').addEventListener('click',()=>privacy.close());
privacy.addEventListener('click',event=>{if(event.target===privacy){const box=privacy.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)privacy.close();}});
document.getElementById('utility-dialog')?.addEventListener('click',event=>{if(event.target.closest('a[href^="#"]'))document.getElementById('utility-dialog').close();});
