const API = 'https://fitness-challenge-tracker.onrender.com/api';
const token = localStorage.getItem('token');
const currentUserId = localStorage.getItem('userId');

if (!token) {
  window.location.href = 'login.html';
}

let socket;
let currentRoomId = null;

async function loadRooms() {
  const res = await fetch(`${API}/chat/rooms`, { headers: { 'Authorization': `Bearer ${token}` } });
  if (res.status === 401) { localStorage.clear(); return window.location.href='login.html'; }
  const data = await res.json();
  const rooms = data.data || [];
  const list = document.getElementById('roomList');
  list.innerHTML = rooms.map(r => {
    const isJoined = Array.isArray(r.participants) && r.participants.some(p => (p?._id || p) === currentUserId);
    const button = isJoined
      ? `<button class="btn btn-sm btn-success" disabled>Joined</button>`
      : `<button class="btn btn-sm btn-outline-primary join-room" data-id="${r._id}">Join</button>`;
    return `<li class="list-group-item d-flex justify-content-between align-items-center" data-id="${r._id}" style="cursor:pointer;">
      <span>${r.name}</span>
      ${button}
    </li>`;
  }).join('');
  // Click anywhere on the li to switch room
  list.querySelectorAll('li[data-id]').forEach(li => li.addEventListener('click', (e) => {
    const id = li.getAttribute('data-id');
    if ((e.target).classList?.contains('join-room')) return; // handled separately
    joinRoom(id);
  }));
  list.querySelectorAll('.join-room').forEach(btn => btn.addEventListener('click', (e) => { e.stopPropagation(); joinRoom(btn.dataset.id); }));
}

async function joinRoom(roomId) {
  await fetch(`${API}/chat/rooms/${roomId}/join`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
  currentRoomId = roomId;
  const li = document.querySelector(`li[data-id="${roomId}"]`);
  if (li) {
    const title = li.querySelector('span')?.textContent || 'Room';
    document.getElementById('roomTitle').textContent = title;
    const btn = li.querySelector('.join-room');
    if (btn) {
      btn.outerHTML = '<button class="btn btn-sm btn-success" disabled>Joined</button>';
    }
  } else {
    document.getElementById('roomTitle').textContent = 'Room';
  }
  if (!socket) initSocket();
  socket.emit('joinRoom', roomId);
  loadMessages(roomId);
  // Enable input/send now that joined
  const input = document.getElementById('messageInput');
  const sendBtn = document.getElementById('sendBtn');
  if (input) { input.disabled = false; input.placeholder = 'Type a message'; }
  if (sendBtn) sendBtn.disabled = false;
}

async function loadMessages(roomId) {
  const res = await fetch(`${API}/chat/rooms/${roomId}/messages`, { headers: { 'Authorization': `Bearer ${token}` } });
  const data = await res.json();
  const msgs = data.data || [];
  const box = document.getElementById('messages');
  box.innerHTML = msgs.map(renderMessage).join('');
  box.scrollTop = box.scrollHeight;
}

function renderMessage(m) {
  const isMe = m.sender && (m.sender._id === currentUserId);
  const avatar = (m.sender && m.sender.avatarUrl) ? (m.sender.avatarUrl.startsWith('http') ? m.sender.avatarUrl : `https://fitness-challenge-tracker.onrender.com${m.sender.avatarUrl}`) : 'https://via.placeholder.com/36?text=%20';
  return `<div class="chat-message ${isMe ? 'me' : 'other'}">
    <img class="chat-avatar me-2 ms-2" src="${avatar}" />
    <div class="chat-bubble"><div class="small text-muted">${m.sender?.username || 'User'}</div>${escapeHtml(m.text || '')}</div>
  </div>`;
}

function escapeHtml(s){return s.replace(/[&<>"]+/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c]||c));}

function initSocket() {
  socket = io('https://fitness-challenge-tracker.onrender.com', { auth: { token } });
  socket.on('newMessage', (m) => {
    if (m.room !== currentRoomId) return;
    const box = document.getElementById('messages');
    box.insertAdjacentHTML('beforeend', renderMessage(m));
    box.scrollTop = box.scrollHeight;
  });
  socket.on('connect_error', (err) => {
    console.warn('Socket error:', err.message);
  });
  socket.on('disconnect', () => {
    console.warn('Socket disconnected');
  });
}

document.getElementById('messageForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const input = document.getElementById('messageInput');
  const text = input.value.trim();
  if (!text || !currentRoomId) return;
  socket.emit('sendMessage', { roomId: currentRoomId, text });
  input.value = '';
});

document.addEventListener('DOMContentLoaded', loadRooms);


