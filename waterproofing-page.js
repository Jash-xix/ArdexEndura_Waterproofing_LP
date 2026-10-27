import './samvaad-integration.js';
/* Progressive enhancement for the source-rendered waterproofing pages. */
const $ = id => document.getElementById(id);
const all = selector => [...document.querySelectorAll(selector)];
const readJSON = id => { try { return JSON.parse($(id)?.textContent || '{}'); } catch { return {}; } };
const DATA = readJSON('waterproofing-data');
const context = readJSON('waterproofing-context');
const areas = Array.isArray(DATA.areas) ? DATA.areas : [];
const stages = { new: 'New construction', repair: 'Repair or renovation', unsure: 'Help me decide' };
const defaultArea = areas.find(a => a.id === context.area) || areas.find(a => a.id === 'terrace') || areas[0];
let area = defaultArea, stage = 'new', scene = null, sceneLoading = false;
let selectedLayer = 'finish', view = 'finished', progress = 0;
const text = (id, value) => { if ($(id)) $(id).textContent = value; };
const element = (tag, className, content) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (content != null) node.textContent = content;
  return node;
};
function icon(id) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('viewBox', '0 0 24 24');
  const use = document.createElementNS(svg.namespaceURI, 'use'); use.setAttribute('href', '#i-' + id); svg.append(use); return svg;
}
function safeURL(value, sameOrigin = false) {
  try { const url = new URL(value, location.href); return ['http:', 'https:'].includes(url.protocol) && (!sameOrigin || url.origin === location.origin) ? url.href : ''; } catch { return ''; }
}
function link(label, href, className = '', glyph = '') {
  const a = element('a', className, label), url = safeURL(href);
  if (!url) return element('span', className, label);
  a.href = url;
  if (new URL(url).origin !== location.origin) { a.target = '_blank'; a.rel = 'noopener'; }
  if (glyph) a.append(' ', icon(glyph));
  return a;
}
function renderProducts(current) {
  const holder = $('selected-products'); if (!holder) return;
  const fragment = document.createDocumentFragment();
  for (const product of current.products || []) {
    const card = element('article', 'product-card'), pack = element('div', 'pack-shot'), img = element('img');
    const imageURL = safeURL(product.image); if (imageURL) img.src = imageURL;
    img.alt = product.name + ' published packaging'; img.width = 210; img.height = 210; img.loading = 'lazy'; pack.append(img);
    const copy = element('div', 'product-copy'); copy.append(element('p', 'eyebrow', product.role), element('h3', '', product.name), element('p', '', product.description), link('Product information', product.url, 'text-link', 'diagonal'));
    const docs = element('div', 'document-links');
    if (product.tds) docs.append(link('Technical data', product.tds, '', 'file'));
    const safety = Array.isArray(product.safetyDocuments) ? product.safetyDocuments : (product.sds ? [product.sds] : []);
    safety.forEach((url, i) => docs.append(link('Safety data' + (safety.length > 1 ? ' · Part ' + String.fromCharCode(65 + i) : ''), url, '', 'file')));
    copy.append(docs); card.append(pack, copy); fragment.append(card);
  }
  holder.replaceChildren(fragment);
}
function updateContext({ push = false, announce = false } = {}) {
  if (!area) return;
  all('[data-area]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.area === area.id)));
  all('input[name="project-stage"]').forEach(input => { input.checked = input.value === stage; });
  text('selected-area-title', area.label); text('selected-area-intro', area.intro);
  text('system-area', area.label); text('system-intro', area.intro);
  text('scene-area', area.label + ' · illustrative junction principles');
  text('enquiry-context', (($('enquiry-area')?.value === 'unsure') ? 'Area to be discussed' : area.label) + ' · ' + stages[stage]);
  const list = $('condition-list');
  if (list) list.replaceChildren(...(area.conditions || []).map(condition => { const li = element('li'); li.append(icon('check'), condition); return li; }));
  renderProducts(area); scene?.setArea(area.id);
  document.body.dataset.selectedArea = area.id; document.body.dataset.projectStage = stage;
  const summary = $('selected-stage-summary');
  if (summary) summary.textContent = stage === 'repair' ? area.repair : stage === 'new' ? area.newBuild : 'Discuss the existing condition and planned work with the project team before selecting the complete system.';
  if (announce) text('selection-status', area.label + ' selected. ' + stages[stage] + '. Published product examples and your enquiry context have been updated.');
  if (push) {
    const url = new URL(location.href); if ($('enquiry-area')?.value === 'unsure') url.searchParams.delete('area'); else url.searchParams.set('area', area.id); url.searchParams.set('stage', stage);
    history.pushState({ area: area.id, stage }, '', url);
  }
}
function readLocation() {
  const query = new URL(location.href).searchParams;
  area = areas.find(item => item.id === query.get('area')) || defaultArea;
  stage = context.fixedStage && Object.hasOwn(stages, context.stage) ? context.stage : (Object.hasOwn(stages, query.get('stage')) ? query.get('stage') : (Object.hasOwn(stages, context.stage) ? context.stage : 'new'));
  if ($('enquiry-area')) $('enquiry-area').value = query.has('area') ? area.id : 'unsure';
  updateContext();
}
// The preparation text follows stage as well as area, while the full source remains on application pages.
const selection = document.querySelector('.selection-summary > div');
if (selection && !$('selected-stage-summary')) { const summary = element('p', 'stage-guidance'); summary.id = 'selected-stage-summary'; selection.append(summary); }
all('[data-area]').forEach(button => button.addEventListener('click', () => {
  const next = areas.find(item => item.id === button.dataset.area); if (!next || next === area) return;
  area = next; updateContext({ push: true, announce: true });
}));
all('input[name="project-stage"]').forEach(input => input.addEventListener('change', () => {
  if (!Object.hasOwn(stages, input.value)) return; stage = input.value; updateContext({ push: true, announce: true });
}));
window.addEventListener('popstate', readLocation); readLocation();
$('enquiry-area')?.addEventListener('change', event => { const next = areas.find(item => item.id === event.target.value); if (next) area=next; updateContext({ push: true }); });

// Native form controls are bound before any renderer or optional utility data is requested.
const enquiry = $('project-enquiry');
let pendingEnquiry = false, requestId = '';
const fieldIDs = { name: 'enquiry-name', phone: 'enquiry-phone', email: 'enquiry-email' };
function clearErrors() {
  Object.entries(fieldIDs).forEach(([key, id]) => { $(id)?.removeAttribute('aria-invalid'); text('error-' + key, ''); });
  if ($('enquiry-errors')) { $('enquiry-errors').replaceChildren(); $('enquiry-errors').hidden = true; }
}
function showErrors(errors, message = 'Please check the details below.') {
  clearErrors(); const summary = $('enquiry-errors'); if (!summary) return;
  summary.hidden = false; summary.append(element('p', '', message)); const list = element('ul');
  Object.entries(errors).forEach(([key, error]) => {
    if (typeof error !== 'string') return;
    if (key === 'request' && error === message) return;
    const field = $(fieldIDs[key]);
    if (field) {
      field.setAttribute('aria-invalid', 'true');
      let messageNode = $('error-' + key);
      if (!messageNode) { messageNode = element('span', 'field-error'); messageNode.id = 'error-' + key; field.insertAdjacentElement('afterend', messageNode); }
      messageNode.textContent = error;
      const described = new Set((field.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean)); described.add(messageNode.id); field.setAttribute('aria-describedby', [...described].join(' '));
    }
    const li = element('li');
    if (field) { const a = element('a', '', error); a.href = '#' + field.id; a.addEventListener('click', event => { event.preventDefault(); field.focus(); }); li.append(a); }
    else li.textContent = error;
    list.append(li);
  });
  if (list.childNodes.length) summary.append(list);
  if (errors.requestId) { const retry = element('button', '', 'Start a new save attempt'); retry.type = 'button'; retry.addEventListener('click', () => { requestId = ''; clearErrors(); text('enquiry-status', 'Ready to save the current details as a new enquiry. A previous attempt may already be saved locally.'); $('enquiry-submit')?.focus(); }); summary.append(retry); }
  summary.focus();
}
function validateEnquiry(payload) {
  const errors = {};
  if ([...payload.name].length < 2 || [...payload.name].length > 80 || /[\u0000-\u001f\u007f]/u.test(payload.name)) errors.name = 'Enter your name using 2 to 80 characters.';
  if (!/^[6-9]\d{9}$/.test(payload.phone)) errors.phone = 'Enter a valid 10-digit Indian mobile number, with or without +91.';
  if (!payload.email || payload.email.length > 254 || !/^[^@\s]+@(?:[^@\s.]+\.)+[^@\s.]{2,63}$/u.test(payload.email)) errors.email = 'Enter a complete email address.';
  if (!payload.consent) errors.consent = 'Agree to save your details for this local preview.';
  return errors;
}
enquiry?.addEventListener('submit',event=>{
      event.preventDefault();
      const value=key=>String(enquiry.elements.namedItem(key)?.value||'').trim();
      const payload={name:value('name'),phone:value('phone').replace(/[\s()-]/g,'').replace(/^\+91/,''),email:value('email'),consent:true};
      const errors=validateEnquiry(payload);if(Object.keys(errors).length){showErrors(errors);return;}
      clearErrors();
      try{sessionStorage.setItem('ardex-waterproofing-enquiry',JSON.stringify(payload));text('enquiry-status','Saved in this browser session. No request has been sent. Open the WhatsApp assistant to explore the conversation.');}
      catch{text('enquiry-status','Browser storage is unavailable. No request has been sent. You can still open the WhatsApp assistant.');}
    });
async function fetchJSON(url, options = {}, timeout = 10000) {
  const controller = new AbortController(), timer = setTimeout(() => controller.abort(), timeout);
  try { const response = await fetch(url, { ...options, signal: controller.signal }); let data; try { data = await response.json(); } catch { throw new Error('Invalid response'); } return { status: response.status, ok: response.ok, data }; }
  finally { clearTimeout(timer); }
}

// A named menu keeps the document beneath it out of the keyboard sequence.
// Direction-aware header: deliberate down-scroll clears the view; a small
// upward gesture brings navigation back. Native page scrolling is untouched.
const scrollHeader=document.querySelector('.site-head');
if(scrollHeader){
  let previousY=Math.max(0,window.scrollY),travel=0,direction=0,headerFrame=0,navigationUntil=0;
  const showHeader=()=>{scrollHeader.classList.remove('is-scroll-hidden');travel=0;};
  function updateHeader(){
    headerFrame=0;
    const y=Math.max(0,window.scrollY),delta=y-previousY;previousY=y;
    const menuOpen=document.querySelector('.mobile-menu-button[aria-expanded="true"]');
    const keyboardFocus=scrollHeader.querySelector(':focus-visible');
    if(y<=scrollHeader.offsetHeight+2||menuOpen||keyboardFocus||performance.now()<navigationUntil){showHeader();return;}
    if(Math.abs(delta)<.5)return;
    const nextDirection=Math.sign(delta);
    if(nextDirection!==direction){travel=0;direction=nextDirection;}
    travel+=delta;
    if(travel>18){scrollHeader.classList.add('is-scroll-hidden');travel=0;}
    else if(travel<-8)showHeader();
  }
  addEventListener('scroll',()=>{if(!headerFrame)headerFrame=requestAnimationFrame(updateHeader);},{passive:true});
  scrollHeader.addEventListener('focusin',showHeader);
  scrollHeader.addEventListener('click',()=>{navigationUntil=performance.now()+900;showHeader();});
  addEventListener('hashchange',()=>{navigationUntil=performance.now()+900;showHeader();});
  addEventListener('pagehide',()=>cancelAnimationFrame(headerFrame),{once:true});
}
const menuButton = document.querySelector('.mobile-menu-button'), menu = $('mobile-navigation');
const inertBefore = new Map();
function closeMenu(returnFocus = false) {
  if (!menu || menu.hidden) return;
  menu.hidden = true; menuButton.setAttribute('aria-expanded', 'false'); menuButton.setAttribute('aria-label', 'Open navigation'); document.body.classList.remove('navigation-open');
  inertBefore.forEach((value, node) => { node.inert = value; }); inertBefore.clear(); if (returnFocus) menuButton.focus();
}
function openMenu() {
  if (!menu) return;
  closeMobileTools(); menu.hidden = false; menuButton.setAttribute('aria-expanded', 'true'); menuButton.setAttribute('aria-label', 'Close navigation'); document.body.classList.add('navigation-open');
  [document.querySelector('main'), document.querySelector('footer'), document.querySelector('.utility-dock'), $('mobile-help')].filter(Boolean).forEach(node => { inertBefore.set(node, node.inert); node.inert = true; });
  menu.querySelector('a')?.focus();
}
menuButton?.addEventListener('click', () => menu?.hidden ? openMenu() : closeMenu(true));
menu?.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
const helpButton = $('mobile-help'), mobileTools = $('mobile-tools');
function closeMobileTools(returnFocus = false) { if (!mobileTools) return; mobileTools.hidden = true; helpButton?.setAttribute('aria-expanded', 'false'); if (returnFocus) helpButton?.focus(); }
helpButton?.addEventListener('click', () => { if (!mobileTools) return; const open = mobileTools.hidden; mobileTools.hidden = !open; helpButton.setAttribute('aria-expanded', String(open)); if (open) mobileTools.querySelector('button')?.focus(); });
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') { if (!menu?.hidden) { event.preventDefault(); closeMenu(true); } else if (mobileTools && !mobileTools.hidden) { event.preventDefault(); closeMobileTools(true); } }
  if (event.key === 'Tab' && menu && !menu.hidden) {
    const stops = [menuButton, ...menu.querySelectorAll('a')];
    if (event.shiftKey && document.activeElement === stops[0]) { event.preventDefault(); stops.at(-1).focus(); }
    else if (!event.shiftKey && document.activeElement === stops.at(-1)) { event.preventDefault(); stops[0].focus(); }
  }
});
mobileTools?.querySelector('.mobile-whatsapp')?.addEventListener('click',()=>closeMobileTools());
const wideScreen = matchMedia('(min-width: 901px)'); wideScreen.addEventListener('change', event => { if (event.matches) { closeMenu(); closeMobileTools(); } });

// Technology tabs support both click and the conventional arrow/Home/End keys.
const tabs = all('.technology-tabs [role="tab"]');
function selectTab(tab) { tabs.forEach(item => { const active = item === tab; item.setAttribute('aria-selected', String(active)); item.tabIndex = active ? 0 : -1; const panel = $(item.getAttribute('aria-controls')); if (panel) panel.hidden = !active; }); }
tabs.forEach((tab, index) => { tab.addEventListener('click', () => selectTab(tab)); tab.addEventListener('keydown', event => {
  let target; if (event.key === 'ArrowRight') target = tabs[(index + 1) % tabs.length]; if (event.key === 'ArrowLeft') target = tabs[(index + tabs.length - 1) % tabs.length]; if (event.key === 'Home') target = tabs[0]; if (event.key === 'End') target = tabs.at(-1);
  if (target) { event.preventDefault(); selectTab(target); target.focus(); }
}); });

// One native modal hosts optional utilities and provides browser-managed focus containment.
const dialog = $('utility-dialog'); let opener = null, activeTool = '', voiceTimer = 0, utilityVersion = 0;
let configPromise, calculatorPromise, calculatorRows = [], conversation = [], chatBusy = false, chatVersion = 0;
async function getConfig() {
  if (!configPromise) configPromise = fetchJSON('/assistant-config.json').then(result => { if (!result.ok) throw new Error('Configuration unavailable'); return result.data; }).catch(error => { configPromise = null; throw error; });
  return configPromise;
}
function stopVoice() { clearTimeout(voiceTimer); $('voice-session')?.replaceChildren(); if ($('voice-session')) $('voice-session').hidden = true; if ($('voice-start')) $('voice-start').disabled = false; }
function closeUtility() { if (dialog?.open) dialog.close(); }
dialog?.addEventListener('close', () => { utilityVersion++; stopVoice(); activeTool = ''; const previous = opener; opener = null; if (previous?.isConnected) previous.focus(); });
$('utility-close')?.addEventListener('click', closeUtility);
dialog?.addEventListener('click', event => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeUtility(); } });
all('[data-tool]').forEach(button => button.addEventListener('click', () => openUtility(button.dataset.tool, button)));
async function openUtility(tool, source) {
  if (['voice', 'chat'].includes(tool) && window.ardexSamvaad) {
    closeMenu(); closeMobileTools();
    return window.ardexSamvaad.open(tool, source?.closest('#mobile-tools') ? helpButton : source);
  }
  if (!dialog || !['voice', 'chat', 'calculator'].includes(tool)) return;
  closeMenu(); closeMobileTools(); stopVoice(); opener = source?.closest('#mobile-tools') ? helpButton : source; activeTool = tool; const version = ++utilityVersion;
  if (tool === 'voice') text('voice-status', '');
  all('[data-panel]').forEach(panel => { panel.hidden = panel.dataset.panel !== tool; });
  dialog.dataset.activeTool = tool;
  text('utility-heading', tool === 'calculator' ? 'Material calculator' : 'ARDEX ENDURA AI Assistant');
  text('utility-powered', tool === 'calculator' ? 'ARDEX ENDURA · Waterproofing' : 'powered by sakha');
  dialog.querySelector('.utility-brand-mark')?.replaceChildren(icon(tool === 'calculator' ? 'calculator' : tool === 'voice' ? 'call' : 'chat'));
  $('utility-close')?.setAttribute('aria-label', tool === 'calculator' ? 'Close calculator' : 'Close assistant');
  if (!dialog.open) dialog.showModal();
  const initial = { voice: 'voice-language', chat: 'chat-input', calculator: 'calc-product' }[tool]; $(initial)?.focus();
  if (tool === 'calculator') { await loadCalculator(); if (version === utilityVersion) $('calc-product')?.focus(); return; }
  try {
    const config = await getConfig(); if (version !== utilityVersion) return;
    if (tool === 'voice') text('voice-availability', voiceURL(config) ? 'Start voice chat to connect. Your browser will ask for microphone permission.' : 'Live voice is not connected in this preview. You can call the team directly below.');
    if (tool === 'chat') {
      const live = chatURL(config); text('chat-availability', live ? 'Live chat. Messages are sent when you choose Send.' : 'Guide preview · published information. Live AI is not connected.');
      text('chat-status', live ? 'Ready to send.' : 'Messages stay in this preview.');
    }
  } catch { text(tool === 'voice' ? 'voice-availability' : 'chat-availability', tool === 'voice' ? 'Voice configuration could not be loaded. Retry Start talking, or use the published brand contact details.' : 'Live chat configuration could not be loaded. The local guide preview remains available; no message is sent outside this preview.'); }
}
function voiceURL(config) { try { const url = new URL(config.voiceEmbedUrl); return url.protocol === 'https:' ? url : null; } catch { return null; } }
function chatURL(config) { return config.chatEndpoint ? safeURL(config.chatEndpoint, true) : ''; }
$('voice-start')?.addEventListener('click', async () => {
  const button = $('voice-start'); if (button.disabled) return; button.disabled = true; text('voice-status', 'Checking live voice availability…'); const version = utilityVersion;
  try {
    const config = await getConfig(); if (version !== utilityVersion || activeTool !== 'voice') return;
    const url = voiceURL(config);
    if (!url) { text('voice-status', 'Live voice is unavailable in this preview. No call or callback has been started. Call +91 80 6674 6500 or close this panel to save your project enquiry.'); return; }
    url.searchParams.set('language', $('voice-language').value); url.searchParams.set('area', area?.id || 'terrace');
    const frame = element('iframe'); frame.title = 'Configured live voice conversation'; frame.allow = 'microphone'; frame.referrerPolicy = 'no-referrer';
    frame.addEventListener('load', () => { clearTimeout(voiceTimer); if (version === utilityVersion) text('voice-status', 'Voice panel loaded. If the provider cannot connect, use the published phone number below. No call is confirmed until the provider connects.'); });
    const session = $('voice-session'); session.hidden = false; session.replaceChildren(frame); frame.src = url.href;
    text('voice-status', 'Opening the configured voice panel. Allow microphone access only if you wish to speak.');
    voiceTimer = setTimeout(() => { if (version === utilityVersion) { stopVoice(); text('voice-status', 'The voice service did not load in time. Retry Start talking or call the published brand number.'); } }, 15000);
  } catch { text('voice-status', 'Voice availability could not be checked. Retry or call +91 80 6674 6500. No call has been started.'); }
  finally { if (version === utilityVersion) button.disabled = false; }
});

function addChat(kind, message, links = []) {
  const holder = $('chat-messages'); if (!holder) return;
  const bubble = element('div', 'chat-bubble ' + kind);
  if (kind === 'assistant') bubble.append(element('strong', '', 'ARDEX ENDURA AI Assistant'));
  bubble.append(element('p', '', message));
  if (links.length) { const list = element('div', 'chat-links'); links.forEach(item => list.append(link(item.label, item.href))); bubble.append(list); }
  holder.append(bubble); holder.scrollTop = holder.scrollHeight;
}
function guideReply(question) {
  const q = question.toLocaleLowerCase();
  const explicitArea = areas.find(item => [item.id.replaceAll('-', ' '), item.label.toLowerCase().split(' / ')[0]].some(name => q.includes(name))) || (q.includes('pool') ? areas.find(item => item.id === 'swimming-pool') : null);
  const matched = explicitArea || (/my space|this space|selected|current/.test(q) ? area : null);
  if (/document|technical|tds|sds|safety/.test(q)) {
    const documentArea = matched || area;
    const products = documentArea?.products || [], links = [];
    products.forEach(product => { if (product.tds) links.push({ label: product.name + ' technical data', href: product.tds }); (product.safetyDocuments || []).forEach((href, i, docs) => links.push({ label: product.name + ' safety data' + (docs.length > 1 ? ' · Part ' + String.fromCharCode(65 + i) : ''), href })); });
    return { message: 'For ' + documentArea.label.toLowerCase() + ', these are the published example documents. Read the current technical and safety information and confirm the complete specification with the project team.', links };
  }
  if (/price|cost|warrant|guarantee|diagnos|best|recommend|coverage/.test(q)) return { message: 'This guide preview cannot provide a diagnosis, price, warranty or site-specific recommendation. The project conditions and service availability need assessment by the brand or project team.', links: [{ label: 'Discuss your project', href: '#enquiry' }, { label: 'Published contact information', href: 'https://www.ardexendura.com/contact-us/' }] };
  if (matched) return { message: matched.label + ': ' + matched.intro + ' ' + (/leak|repair|damp|renovat/.test(q) ? matched.repair : matched.newBuild) + ' These are preparation prompts, not a diagnosis or final specification.', links: [{ label: 'Explore ' + matched.label.toLowerCase(), href: '#spaces' }, { label: 'Products & technical documents', href: '#waterproofing-range' }] };
  return { message: 'Choose your project area to explore its preparation questions and published product examples. This local guide does not diagnose a leak or select a final specification.', links: [{ label: 'Find your space', href: '#spaces' }] };
}
async function sendChat(question) {
  question = String(question || '').trim().slice(0, 1000); if (!question || chatBusy) return;
  const version = chatVersion; chatBusy = true; $('chat-form')?.setAttribute('aria-busy', 'true'); const submit = $('chat-form')?.querySelector('button'); if (submit) submit.disabled = true;
  addChat('user', question); conversation.push({ role: 'user', content: question }); text('chat-status', 'Preparing a response…');
  try {
    let config; try { config = await getConfig(); } catch { config = {}; }
    if (version !== chatVersion) return;
    const endpoint = chatURL(config);
    if (endpoint) {
      const result = await fetchJSON(endpoint, { method: 'POST', mode: 'same-origin', redirect: 'error', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: question, area: area?.id, stage, messages: conversation.slice(-12) }) }, 20000);
      if (version !== chatVersion) return;
      if (!result.ok || typeof result.data.reply !== 'string' || !result.data.reply.trim()) throw new Error('No reply');
      const reply = result.data.reply.slice(0, 10000); addChat('assistant', reply); conversation.push({ role: 'assistant', content: reply }); text('chat-status', 'Response from the configured website service.');
    } else {
      const reply = guideReply(question); addChat('assistant', reply.message, reply.links); conversation.push({ role: 'assistant', content: reply.message }); text('chat-status', 'Guide preview · no conversation sent outside this preview.');
    }
  } catch { if (version === chatVersion) { addChat('assistant', 'The configured chat service could not respond. Your message remains above. Try sending it again, use the published technical documents or contact the brand directly.'); text('chat-status', 'Live chat unavailable. No reply has been fabricated.'); } }
  finally { if (version === chatVersion) { chatBusy = false; $('chat-form')?.removeAttribute('aria-busy'); if (submit) submit.disabled = false; } }
}
$('chat-form')?.addEventListener('submit', event => { event.preventDefault(); const input = $('chat-input'), value = input.value.trim(); if (value && !chatBusy) { input.value = ''; sendChat(value); } });
all('[data-question]').forEach(button => button.addEventListener('click', () => sendChat(button.dataset.question)));
$('chat-reset')?.addEventListener('click', () => { chatVersion++; chatBusy = false; conversation = []; $('chat-messages').replaceChildren(); $('chat-input').value = ''; $('chat-form').removeAttribute('aria-busy'); $('chat-form').querySelector('button').disabled = false; addChat('assistant', 'Tell me which space you are working on. I can help you find published information and questions to discuss.'); text('chat-status', 'New conversation. Guide messages remain only in this browser session unless you send to a configured live service.'); $('chat-input').focus(); });

// Decimal multiplication and pack rounding stay exact at configuration boundaries.
function decimal(value) {
  const match = String(value).trim().match(/^(\d+)(?:\.(\d+))?$/); if (!match) throw new Error('Enter an ordinary positive decimal number.');
  const digits = match[2] || ''; return { n: BigInt(match[1] + digits), scale: 10n ** BigInt(digits.length), places: digits.length };
}
function exactText(n, places) { const raw = n.toString().padStart(places + 1, '0'); return places ? (raw.slice(0, -places) + '.' + raw.slice(-places)).replace(/\.?0+$/, '') : raw; }
async function loadCalculator() {
  const select = $('calc-product'); if (!select) return;
  if (calculatorRows.length) return;
  select.disabled = true; text('calc-error', '');
  try {
    if (!calculatorPromise) calculatorPromise = fetchJSON('/calculator-data.json').then(result => { if (!result.ok || !Array.isArray(result.data.configurations)) throw new Error('Calculator unavailable'); return result.data; }).catch(error => { calculatorPromise = null; throw error; });
    const data = await calculatorPromise;
    calculatorRows = data.configurations.filter(row => String(row.solution_id) === '1935' && Number(row.observed_pack_size) > 0 && Number(row.inferred_consumption_per_m2) > 0);
    if (!calculatorRows.length) throw new Error('No waterproofing configurations');
    select.replaceChildren(...calculatorRows.map((row, index) => { const option = element('option', '', row.title + ' · ' + row.observed_pack_size + ' ' + row.observed_pack_unit + ' pack'); option.value = String(index); return option; }));
  } catch { select.replaceChildren(element('option', '', 'Configurations unavailable — reopen to retry')); text('calc-error', 'The published configurations could not load. Close and reopen the calculator to retry, or consult the current product information.'); }
  finally { select.disabled = !calculatorRows.length; }
}
$('consumption-form')?.addEventListener('submit', event => {
  event.preventDefault(); text('calc-error', ''); const input = $('calc-area'), row = calculatorRows[Number($('calc-product').value)];
  input.removeAttribute('aria-invalid');
  try {
    if (!row) throw new Error('Choose an available waterproofing configuration. Reopen the calculator to retry loading.');
    const raw = input.value.trim(); if (!/^(?:\d+)(?:\.\d+)?$/.test(raw) || !Number.isFinite(Number(raw)) || Number(raw) < .01 || Number(raw) > 1000000 || raw.length > 30) { input.setAttribute('aria-invalid', 'true'); input.setAttribute('aria-describedby', 'calc-error'); input.focus(); throw new Error('Enter an area from 0.01 to 1,000,000 m² using a positive decimal number.'); }
    const a = decimal(raw), rate = decimal(row.inferred_consumption_per_m2), pack = decimal(row.observed_pack_size);
    const quantity = a.n * rate.n, scale = a.scale * rate.scale;
    const numerator = quantity * pack.scale, denominator = scale * pack.n, packs = (numerator + denominator - 1n) / denominator;
    const unit = row.observed_pack_unit, quantityText = exactText(quantity, a.places + rate.places), output = $('calc-result');
    output.hidden = false; output.replaceChildren(element('p', 'calc-product-name', row.title), element('h3', '', packs.toString() + (packs === 1n ? ' pack' : ' packs')), element('p', '', quantityText + ' ' + unit + ' estimated · ' + row.observed_pack_size + ' ' + unit + ' per pack'));
    const assumptions = element('details', 'calc-assumptions');
    assumptions.append(element('summary', '', 'How this is calculated'), element('p', '', raw + ' m² × ' + row.inferred_consumption_per_m2 + ' ' + row.rate_unit + ' = ' + quantityText + ' ' + unit + '. Divide by ' + row.observed_pack_size + ' ' + unit + ' per pack and round up. Based on captured brand calculator data; confirm current consumption and application requirements.'));
    output.append(assumptions);
    const official = row.product_href ? new URL(row.product_href, 'https://www.ardexendura.com').href : 'https://www.ardexendura.com/products/waterproofing-systems/';
    output.append(link(row.product_href ? 'Current official product information' : 'Official waterproofing family · exact product page unavailable', official, 'text-link', 'diagonal'));
    output.dataset.packs = packs.toString(); output.dataset.quantity = quantityText; output.dataset.product = row.calculator_product_id;
  } catch (error) { if ($('calc-result')) $('calc-result').hidden = true; text('calc-error', error.message || 'The estimate could not be calculated. Check the area and product.'); }
});

['calc-product', 'calc-area'].forEach(id => $(id)?.addEventListener('input', () => { if ($('calc-result')) $('calc-result').hidden = true; text('calc-error', ''); }));

window.addEventListener('pagehide', event => { if (!event.persisted) scene?.destroy(); stopVoice(); });

/* Lead integration proposal: append this source to waterproofing-page.js.
   Enabled only by ?diagnostics=1. Local observation only; no requests or storage.
   Read using locator('#waterproofing-diagnostics').textContent(), not browser eval.
   These are declared-browser lab observations, never field CWV or GPU/FPS metrics. */
if (new URL(location.href).searchParams.get('diagnostics') === '1') {
  const diagnosticOutput = document.createElement('output');
  diagnosticOutput.id = 'waterproofing-diagnostics';
  diagnosticOutput.hidden = true;
  document.body.append(diagnosticOutput);
  const observations = { paint: [], lcpCandidates: [], unexpectedLayoutShifts: [], longTasks: [] };
  const observers = [];
  const supported = PerformanceObserver.supportedEntryTypes || [];
  const observe = (type, receive) => {
    if (!supported.includes(type)) return;
    try {
      const observer = new PerformanceObserver(list => list.getEntries().forEach(receive));
      observer.observe({ type, buffered: true }); observers.push(observer);
    } catch { /* Capability explicitly appears in supportedEntryTypes below. */ }
  };
  observe('paint', entry => observations.paint.push({ name: entry.name, startMs: +entry.startTime.toFixed(2) }));
  observe('largest-contentful-paint', entry => observations.lcpCandidates.push({ startMs: +entry.startTime.toFixed(2), size: entry.size, element: entry.element?.tagName || null }));
  observe('layout-shift', entry => { if (!entry.hadRecentInput) observations.unexpectedLayoutShifts.push({ startMs: +entry.startTime.toFixed(2), value: entry.value }); });
  observe('longtask', entry => observations.longTasks.push({ startMs: +entry.startTime.toFixed(2), durationMs: +entry.duration.toFixed(2) }));
  function publishDiagnostics() {
    const navigation = performance.getEntriesByType('navigation')[0];
    const resources = performance.getEntriesByType('resource');
    const host = document.getElementById('protection-scene');
    const resourceSummary = resources.reduce((sum, entry) => ({ count: sum.count + 1, transferBytes: sum.transferBytes + entry.transferSize, decodedBytes: sum.decodedBytes + entry.decodedBodySize }), { count: 0, transferBytes: 0, decodedBytes: 0 });
    diagnosticOutput.textContent = JSON.stringify({
      scope: 'Local preview / declared browser lab observation only. Not field CWV, physical-device certification, GPU time or FPS.',
      observedAtMs: +performance.now().toFixed(2),
      environment: { userAgent: navigator.userAgent, viewport: innerWidth + 'x' + innerHeight, dpr: devicePixelRatio, reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches, hardwareConcurrency: navigator.hardwareConcurrency || null, deviceMemoryGB: navigator.deviceMemory || null, hidden: document.hidden },
      navigation: navigation ? { type: navigation.type, responseEndMs: +navigation.responseEnd.toFixed(2), domContentLoadedMs: +navigation.domContentLoadedEventEnd.toFixed(2), loadMs: +navigation.loadEventEnd.toFixed(2), transferBytes: navigation.transferSize } : null,
      supportedEntryTypes: supported,
      observations,
      unexpectedShiftValueSum: observations.unexpectedLayoutShifts.reduce((sum, entry) => sum + entry.value, 0),
      warning: 'The shift sum is an observed sum, not the CLS session-window metric. LCP candidates are provisional lab observations. No INP or field pass is inferred. Resource byte totals include cache effects.',
      resources: resourceSummary,
      scene: host ? Object.fromEntries(Object.entries(host.dataset).filter(([key]) => key.startsWith('scene'))) : null
    });
  }
  publishDiagnostics();
  const diagnosticTimer = setInterval(publishDiagnostics, 500);
  addEventListener('pagehide', () => { publishDiagnostics(); clearInterval(diagnosticTimer); observers.forEach(observer => observer.disconnect()); }, { once: true });
}

// The concise water/investment sequence is independently enhanced.
