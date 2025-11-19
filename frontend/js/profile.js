const API_BASE = 'https://fitness-challenge-tracker.onrender.com/api';

function authHeader() {
  return { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` };
}

function showMsg(text, type = 'success') {
  const el = document.getElementById('message');
  if (!el) return;
  el.innerHTML = `<div class="alert alert-${type}">${text}</div>`;
  setTimeout(() => { el.innerHTML = ''; }, 4000);
}

async function loadProfile() {
  try {
    const res = await fetch(`${API_BASE}/users/me`, { headers: { ...authHeader() } });
    if (res.status === 401) {
      showMsg('Session expired. Redirecting to login...', 'warning');
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('userId');
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      localStorage.removeItem('avatarUrl');
      setTimeout(() => window.location.href = 'login.html', 800);
      return;
    }
    const data = await res.json();
    const user = data.data || {};
    document.getElementById('name').value = user.name || '';
    document.getElementById('email').value = user.email || '';
    document.getElementById('age').value = user.age || '';
    document.getElementById('weight').value = user.weight || '';
    document.getElementById('gender').value = user.gender || '';
    const img = document.getElementById('profileAvatar');
    if (img) img.src = user.avatarUrl ? (user.avatarUrl.startsWith('http') ? user.avatarUrl : `https://fitness-challenge-tracker.onrender.com${user.avatarUrl}`) : 'https://via.placeholder.com/96?text=%20';
    if (user.avatarUrl) localStorage.setItem('avatarUrl', user.avatarUrl);
    if (window.updateAuthButtons) window.updateAuthButtons();
  } catch (e) {
    showMsg('Failed to load profile', 'danger');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Protect page
  if (!(localStorage.getItem('isLoggedIn') === 'true' && localStorage.getItem('token'))) {
    window.location.href = 'login.html';
    return;
  }

  loadProfile();

  document.getElementById('profileForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = {
      name: document.getElementById('name').value.trim(),
      email: document.getElementById('email').value.trim() || null,
      age: document.getElementById('age').value ? Number(document.getElementById('age').value) : null,
      weight: document.getElementById('weight').value ? Number(document.getElementById('weight').value) : null,
      gender: document.getElementById('gender').value || null
    };
    try {
      const res = await fetch(`${API_BASE}/users/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify(body)
      });
      if (res.status === 401) {
        showMsg('Session expired. Redirecting to login...', 'warning');
        setTimeout(() => window.location.href = 'login.html', 800);
        return;
      }
      if (!res.ok) throw new Error('Update failed');
      showMsg('Profile saved');
      loadProfile();
    } catch (e) {
      showMsg('Failed to save profile', 'danger');
    }
  });

  document.getElementById('avatarForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const file = document.getElementById('avatarInput').files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('avatar', file);
    try {
      const res = await fetch(`${API_BASE}/users/me/avatar`, { method: 'POST', headers: { ...authHeader() }, body: fd });
      const data = await res.json();
      if (res.status === 401) {
        showMsg('Session expired. Redirecting to login...', 'warning');
        setTimeout(() => window.location.href = 'login.html', 800);
        return;
      }
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      localStorage.setItem('avatarUrl', data.data.avatarUrl);
      document.getElementById('profileAvatar').src = data.data.avatarUrl.startsWith('http') ? data.data.avatarUrl : `https://fitness-challenge-tracker.onrender.com${data.data.avatarUrl}`;
      showMsg('Avatar updated');
      if (window.updateAuthButtons) window.updateAuthButtons();
    } catch (e) {
      showMsg('Failed to upload avatar', 'danger');
    }
  });
});


