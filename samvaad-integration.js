// Public widget identifiers supplied for this LP. No provider secrets belong here.
const agents = {
  voice: { id: 'ag-mvqnlvqcrm7hqgtl', mode: 'call', title: 'Call us' },
  chat: { id: 'ag-mvqo0ghp9ylo413d', mode: 'chat', title: 'Chat with us' }
};
const dialog = document.getElementById('utility-dialog');
const instances = new Map();
let activeMode = '', opener = null, revision = 0;

function stop(instance) {
  try { instance?.api?.endCall(); } catch { /* A session may already be closed. */ }
  try { instance?.api?.close(); } catch { /* A failed network load has no session. */ }
}

function load(mode) {
  const cached = instances.get(mode);
  if (cached) return cached.promise;
  const panel = dialog.querySelector(`[data-panel="${mode}"]`);
  const mount = document.createElement('div');
  mount.id = `samvaad-${mode}-mount`;
  mount.className = 'samvaad-lp-mount';
  const status = document.createElement('p');
  status.className = 'samvaad-lp-status';
  status.setAttribute('role', 'status');
  status.textContent = 'Connecting to the assistant…';
  mount.append(status);
  panel.replaceChildren(mount);
  const instance = { api: null, promise: null };
  instances.set(mode, instance);
  instance.promise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.id = `samvaad-widget-${mode}`;
    script.src = 'https://samvaad.sakhaa.ai/samvaad-widget.js';
    script.async = false;
    Object.assign(script.dataset, {
      publicAgentId: agents[mode].id,
      apiBase: 'https://api.samvaad.sakhaa.ai',
      color: '#2563eb', mode: agents[mode].mode, title: agents[mode].title,
      botName: 'powered by sakha', embedded: 'true', mountId: mount.id,
      // Opening the call panel must not immediately activate the microphone.
      requireExplicitStart: mode === 'voice' ? 'true' : 'false'
    });
    script.onload = () => {
      // The SDK exports one global. Capture each instance immediately so the
      // distinct call/chat agents can coexist without overwriting their handles.
      instance.api = window.SamvaadChatWidget;
      if (!instance.api || !mount.querySelector('.samvaad-widget-root')) {
        reject(new Error('The assistant did not finish loading.')); return;
      }
      status.remove();
      const launchTitle = mount.querySelector('.samvaad-widget-launch-copy strong');
      const launchText = mount.querySelector('.samvaad-widget-launch-copy span');
      if (launchTitle) launchTitle.textContent = 'Talk to the assistant';
      if (launchText) launchText.textContent = 'Start when you are ready. Your browser will ask for microphone access.';
      resolve(instance);
    };
    script.onerror = () => {
      script.remove(); reject(new Error('The assistant could not be loaded. Check your connection and try again.'));
    };
    document.body.append(script);
  }).catch(error => { instances.delete(mode); throw error; });
  return instance.promise;
}

async function open(mode, source) {
  if (!dialog || !agents[mode]) return;
  const version = ++revision;
  if (activeMode && activeMode !== mode) stop(instances.get(activeMode));
  activeMode = mode; opener = source;
  document.querySelector('.mobile-nav')?.setAttribute('hidden', '');
  document.querySelector('.mobile-menu-button')?.setAttribute('aria-expanded', 'false');
  document.getElementById('mobile-tools')?.setAttribute('hidden', '');
  document.getElementById('mobile-help')?.setAttribute('aria-expanded', 'false');
  dialog.dataset.activeTool = mode; dialog.dataset.samvaadActive = mode;
  document.getElementById('utility-heading').textContent = 'ARDEX ENDURA AI Assistant';
  document.getElementById('utility-powered').textContent = 'powered by sakha';
  document.getElementById('utility-close').setAttribute('aria-label', 'Close assistant');
  dialog.querySelector('.utility-brand-mark use')?.setAttribute('href', mode === 'voice' ? '#i-call' : '#i-chat');
  dialog.querySelectorAll('[data-panel]').forEach(panel => { panel.hidden = panel.dataset.panel !== mode; });
  if (!dialog.open) dialog.showModal();
  try {
    const instance = await load(mode);
    if (dialog.open && activeMode === mode && version === revision) instance.api.open();
  } catch(error) {
    if (version !== revision || !dialog.open) return;
    const panel = dialog.querySelector(`[data-panel="${mode}"]`);
    const message = document.createElement('p');
    message.className = 'samvaad-lp-status'; message.setAttribute('role', 'alert');
    message.textContent = error.message;
    const retry = document.createElement('button');
    retry.type = 'button'; retry.className = 'button button-ink'; retry.textContent = 'Try again';
    retry.addEventListener('click', () => open(mode, source));
    panel.replaceChildren(message, retry);
  }
}

dialog?.addEventListener('close', () => {
  revision++; stop(instances.get(activeMode)); activeMode = '';
  delete dialog.dataset.samvaadActive;
  const previous = opener; opener = null;
  if (previous?.isConnected && previous.getBoundingClientRect().width) previous.focus();
  else document.getElementById('mobile-help')?.focus();
});

window.ardexSamvaad = { open };
