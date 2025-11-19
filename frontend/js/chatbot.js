// Minimal floating chatbot widget with typing indicator and history
(function() {
  const API = 'https://fitness-challenge-tracker.onrender.com/api/chatbot';
  const token = localStorage.getItem('token');

  function authHeaders() {
    return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
  }

  function createWidget() {
    const container = document.createElement('div');
    container.id = 'chatbot-widget';
    container.style.position = 'fixed';
    container.style.right = '20px';
    container.style.bottom = '20px';
    container.style.zIndex = '9999';

    container.innerHTML = `
      <style>
        .cbt-button { width: 56px; height: 56px; border-radius: 50%; background:#0d6efd; color:#fff; display:flex; align-items:center; justify-content:center; border:none; box-shadow:0 6px 16px rgba(13,110,253,.3); }
        .cbt-panel { width: 320px; height: 420px; background:#fff; border-radius: 16px; box-shadow:0 10px 30px rgba(0,0,0,.15); display:none; flex-direction:column; overflow:hidden; }
        .cbt-header { background:#0d6efd; color:#fff; padding:10px 12px; display:flex; align-items:center; }
        .cbt-header i { margin-right:8px; }
        .cbt-messages { flex:1; padding:12px; overflow-y:auto; background:#f8f9fa; }
        .cbt-msg { margin-bottom:10px; max-width:80%; padding:8px 12px; border-radius:12px; }
        .cbt-msg.user { margin-left:auto; background:#d1e7dd; }
        .cbt-msg.assistant { margin-right:auto; background:#e9ecef; }
        .cbt-typing { font-style: italic; color:#6c757d; margin-bottom:10px; display:none; }
        .cbt-input { display:flex; gap:6px; padding:10px; border-top:1px solid #eee; }
        .cbt-input input { flex:1; }
      </style>
      <div class="cbt-panel" id="cbtPanel">
        <div class="cbt-header"><i class="fas fa-robot"></i> Fitness Chatbot</div>
        <div class="cbt-messages" id="cbtMessages"></div>
        <div class="cbt-typing" id="cbtTyping">Assistant is typing…</div>
        <div class="cbt-input">
          <input type="text" id="cbtInput" class="form-control" placeholder="Ask about workouts, diet…" />
          <button id="cbtSend" class="btn btn-primary">Send</button>
        </div>
      </div>
      <button class="cbt-button" id="cbtToggle" aria-label="Open chatbot"><i class="fas fa-robot"></i></button>
    `;

    document.body.appendChild(container);

    const panel = container.querySelector('#cbtPanel');
    const toggle = container.querySelector('#cbtToggle');
    const messagesBox = container.querySelector('#cbtMessages');
    const typing = container.querySelector('#cbtTyping');
    const input = container.querySelector('#cbtInput');
    const sendBtn = container.querySelector('#cbtSend');

    toggle.addEventListener('click', async () => {
      const isOpen = panel.style.display === 'flex';
      panel.style.display = isOpen ? 'none' : 'flex';
      if (!isOpen) {
        await loadHistory();
        input.focus();
      }
    });

    sendBtn.addEventListener('click', () => submit());
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });

    function renderMessage(msg) {
      const div = document.createElement('div');
      div.className = `cbt-msg ${msg.role}`;
      div.textContent = msg.text;
      messagesBox.appendChild(div);
      messagesBox.scrollTop = messagesBox.scrollHeight;
    }

    async function loadHistory() {
      messagesBox.innerHTML = '';
      if (!token) {
        renderMessage({ role: 'assistant', text: 'Please log in to use the chatbot.' });
        return;
      }
      try {
        const res = await fetch(`${API}/history`, { headers: authHeaders() });
        if (res.ok) {
          const data = await res.json();
          (data.data || []).forEach(m => renderMessage({ role: m.role, text: m.text }));
        }
      } catch {}
    }

    async function submit() {
      const text = input.value.trim();
      if (!text || !token) return;
      input.value = '';
      renderMessage({ role: 'user', text });
      typing.style.display = 'block';
      try {
        const res = await fetch(`${API}/message`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ text }) });
        const json = await res.json();
        const assistant = json?.data?.assistant;
        // Simulate typing delay for UX
        setTimeout(() => {
          typing.style.display = 'none';
          if (assistant) renderMessage({ role: 'assistant', text: assistant.text });
        }, 600);
      } catch (e) {
        typing.style.display = 'none';
      }
    }
  }

  document.addEventListener('DOMContentLoaded', createWidget);
})();


