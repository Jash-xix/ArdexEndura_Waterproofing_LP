// Refresh starts at the hero; intentional deep links and Back remain unchanged.
(() => {
  if (performance.getEntriesByType('navigation')[0]?.type !== 'reload') return;
  const root = document.documentElement;
  history.scrollRestoration = 'manual';
  history.replaceState(history.state, '', location.pathname + location.search);
  root.dataset.resetStart = 'true';
  let userStarted = false;
  const reset = () => { if (!userStarted) scrollTo({top:0,left:0,behavior:'instant'}); };
  const settle = () => { reset(); requestAnimationFrame(() => requestAnimationFrame(reset)); };
  const release = event => {
    if (event.type === 'keydown' && !['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(event.key)) return;
    userStarted = true;
    delete root.dataset.resetStart;
    ['wheel','touchstart','keydown'].forEach(type => removeEventListener(type, release, true));
  };
  ['wheel','touchstart','keydown'].forEach(type => addEventListener(type, release, {capture:true,passive:true}));
  addEventListener('DOMContentLoaded', reset, {once:true});
  addEventListener('load', settle, {once:true});
  addEventListener('pageshow', settle, {once:true});
})();
