// Function to load navigation bar
document.addEventListener('DOMContentLoaded', function() {
    // Ensure Font Awesome is loaded once for icons
    if (!document.querySelector('link[href*="font-awesome"], link[href*="fontawesome"], link[href*="cdnjs.cloudflare.com/ajax/libs/font-awesome"]')) {
        const fa = document.createElement('link');
        fa.rel = 'stylesheet';
        fa.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css';
        fa.crossOrigin = 'anonymous';
        fa.referrerPolicy = 'no-referrer';
        document.head.appendChild(fa);
    }
    const navContainer = document.createElement('div');
    navContainer.id = 'navbar-container';
    navContainer.innerHTML = `
        <nav class="navbar navbar-expand-lg navbar-dark bg-dark fixed-top">
            <div class="container-fluid">
                <a class="navbar-brand" href="index.html">
                    <i class="fas fa-dumbbell me-2"></i>Fitness Tracker
                </a>
                <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" 
                        aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                    <span class="navbar-toggler-icon"></span>
                </button>
                <div class="collapse navbar-collapse" id="navbarNav">
                    <ul class="navbar-nav me-auto">
                        <li class="nav-item">
                            <a class="nav-link" href="index.html">
                                <i class="fas fa-home me-1"></i> Home
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="addWorkout.html">
                                <i class="fas fa-dumbbell me-1"></i> Workouts
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="progress.html">
                                <i class="fas fa-chart-line me-1"></i> Progress
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="challenges.html" id="challengesLink">
                                <i class="fas fa-trophy me-1"></i> Challenges
                            </a>
                        </li>
                    </ul>
                    <div class="d-flex align-items-center" id="auth-buttons">
                        <!-- Will be populated by JavaScript -->
                    </div>
                    <div class="d-flex align-items-center" id="notification-bell" style="display: none;">
                        <!-- Notification bell will be populated by JavaScript -->
                    </div>
                </div>
            </div>
        </nav>
    `;

    // Insert navbar at the beginning of the body
    document.body.insertBefore(navContainer, document.body.firstChild);

    // Add click handler for challenges link
    const challengesLink = document.getElementById('challengesLink');
    if (challengesLink) {
        challengesLink.addEventListener('click', handleChallengesClick);
    }

    // Update auth buttons based on login status
    updateAuthButtons();
});

// Handle challenges link click
function handleChallengesClick(e) {
    e.preventDefault();
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const token = localStorage.getItem('token');
    
    if (isLoggedIn && token) {
        window.location.href = 'challenges.html';
    } else {
        // window.location.href = 'login.html';
    }
}

// Add event delegation for dynamically added elements
document.addEventListener('click', (e) => {
    if (e.target && e.target.id === 'challengesLink') {
        handleChallengesClick(e);
    }
});

// Update auth buttons when the page loads
updateAuthButtons();

// Function to update authentication buttons
function updateAuthButtons() {
    const authButtons = document.getElementById('auth-buttons');
    if (!authButtons) return;

    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const username = localStorage.getItem('username');
    let avatarUrl = localStorage.getItem('avatarUrl');
    const toAbsolute = (url) => {
        if (!url) return url;
        return url.startsWith('http') ? url : `http://localhost:5000${url}`;
    };

    if (isLoggedIn && username) {
        const avatarImg = avatarUrl ? `<img src="${toAbsolute(avatarUrl)}" alt="avatar" style="width:24px;height:24px;border-radius:50%;object-fit:cover;margin-right:6px;">` : `<i class="fas fa-user-circle me-1"></i>`;
        authButtons.innerHTML = `
            <div class="dropdown">
                <button class="btn btn-outline-light dropdown-toggle" type="button" 
                        id="userDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                    ${avatarImg} ${username}
                </button>
                <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
                    <li><a class="dropdown-item" href="profile.html"><i class="fas fa-user me-2"></i>Profile</a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item text-danger" href="#" id="logoutBtn">
                        <i class="fas fa-sign-out-alt me-2"></i>Logout
                    </a></li>
                </ul>
            </div>
        `;
        // If avatar not cached, attempt to load it once
        if (!avatarUrl) {
            (async () => {
                try {
                    const res = await fetch('http://localhost:5000/api/users/me', {
                        headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` }
                    });
                    if (res.status === 401) {
                        localStorage.clear();
                        window.location.href = 'login.html';
                        return;
                    }
                    const data = await res.json();
                    if (data && data.data && data.data.avatarUrl) {
                        localStorage.setItem('avatarUrl', data.data.avatarUrl);
                        // Re-render buttons to show avatar
                        updateAuthButtons();
                    }
                } catch (e) {
                    // ignore
                }
            })();
        }
        
        // Show notification bell
        const notificationBell = document.getElementById('notification-bell');
        if (notificationBell) {
            notificationBell.style.display = 'block';
            notificationBell.innerHTML = `
                <div class="dropdown me-3">
                    <button class="btn btn-outline-light position-relative" type="button" 
                            id="notificationDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                        <i class="fas fa-bell"></i>
                        <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" 
                              id="notificationBadge" style="display: none;">
                            0
                        </span>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="notificationDropdown" 
                        style="min-width: 300px; max-height: 400px; overflow-y: auto;">
                        <li class="dropdown-header">Notifications</li>
                        <li><hr class="dropdown-divider"></li>
                        <div id="notificationList">
                            <li class="dropdown-item text-center text-muted">Loading notifications...</li>
                        </div>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item text-center" href="#" id="markAllReadBtn">
                            <i class="fas fa-check-double me-2"></i>Mark all as read
                        </a></li>
                    </ul>
                </div>
            `;
            // Add Admin link for trainers
            const role = localStorage.getItem('role');
            const leftNav = document.querySelector('#navbarNav .navbar-nav');
            if (leftNav && role === 'trainer' && !document.getElementById('adminLink')) {
                const li = document.createElement('li');
                li.className = 'nav-item';
                li.innerHTML = `<a class="nav-link" id="adminLink" href="admin.html"><i class="fas fa-shield-alt me-1"></i> Admin</a>`;
                leftNav.appendChild(li);
            }
            // Add Create Challenge link for trainers
            if (leftNav && role === 'trainer' && !document.getElementById('createChallengeLink')) {
                const li = document.createElement('li');
                li.className = 'nav-item';
                li.innerHTML = `<a class="nav-link" id="createChallengeLink" href="challenge.html"><i class="fas fa-plus me-1"></i> Create Challenge</a>`;
                leftNav.appendChild(li);
            }
            // Add community link beside notifications
            if (leftNav && !document.getElementById('communityLink')) {
                const li = document.createElement('li');
                li.className = 'nav-item';
                li.innerHTML = `<a class="nav-link" id="communityLink" href="community.html"><i class="fas fa-comments me-1"></i> Community</a>`;
                leftNav.appendChild(li);
            }
            // Hide specific links on admin page per request
            const currentPage = (window.location.pathname.split('/').pop() || '').toLowerCase();
            if (currentPage === 'admin.html') {
                document.getElementById('challengesLink')?.closest('li')?.classList.add('d-none');
                document.getElementById('adminLink')?.closest('li')?.classList.add('d-none');
            }
            
            // Load notifications
            loadNotifications();
        }

        // Add logout functionality
        document.getElementById('logoutBtn')?.addEventListener('click', function(e) {
            e.preventDefault();
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('userId');
            localStorage.removeItem('token');
            localStorage.removeItem('username');
            localStorage.removeItem('avatarUrl');
            window.location.href = 'login.html';
        });
    } else {
        authButtons.innerHTML = `
            <a href="login.html" class="btn btn-outline-light me-2">
                <i class="fas fa-sign-in-alt me-1"></i> Login
            </a>
            <a href="register.html" class="btn btn-light">
                <i class="fas fa-user-plus me-1"></i> Register
            </a>
        `;
    }
}

// Load notifications
async function loadNotifications() {
  try {
    const response = await fetch('http://localhost:5000/api/notifications', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        'Content-Type': 'application/json'
      }
    });
    if (response.status === 401) {
      // Token expired or invalid: force re-login
      console.warn('Unauthorized notifications request. Token expired. Redirecting to login.');
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('userId');
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      localStorage.removeItem('avatarUrl');
      window.location.href = 'login.html';
      return;
    }
    
    if (response.ok) {
      const result = await response.json();
      const notifications = result.data || [];
      
      // Update notification badge
      const unreadCount = notifications.filter(n => !n.isRead).length;
      const badge = document.getElementById('notificationBadge');
      if (badge) {
        if (unreadCount > 0) {
          badge.textContent = unreadCount;
          badge.style.display = 'block';
        } else {
          badge.style.display = 'none';
        }
      }
      
      // Update notification list
      const notificationList = document.getElementById('notificationList');
      if (notificationList) {
        if (notifications.length === 0) {
          notificationList.innerHTML = '<li class="dropdown-item text-center text-muted">No notifications</li>';
        } else {
          notificationList.innerHTML = notifications.map(notification => `
            <li class="dropdown-item ${!notification.isRead ? 'bg-light' : ''}" 
                data-id="${notification._id}" style="cursor: pointer;">
              <div class="d-flex align-items-start">
                <div class="flex-grow-1">
                  <div class="fw-semibold">${notification.title}</div>
                  <div class="text-muted small">${notification.message}</div>
                  <div class="text-muted small">${new Date(notification.createdAt).toLocaleString()}</div>
                </div>
                ${!notification.isRead ? '<div class="badge bg-primary rounded-pill ms-2">New</div>' : ''}
              </div>
            </li>
          `).join('');

          // Winner pop-up alert for the current page load
          const winner = notifications.find(n => n.type === 'challenge_winner' && !n.isRead);
          if (winner) {
            alert(`${winner.title}\n\n${winner.message}`);
          }
          
          // Add click handlers for notifications
          notificationList.querySelectorAll('.dropdown-item[data-id]').forEach(item => {
            item.addEventListener('click', () => markNotificationAsRead(item.dataset.id));
          });
        }
      }
      
      // Add mark all as read functionality
      const markAllReadBtn = document.getElementById('markAllReadBtn');
      if (markAllReadBtn) {
        markAllReadBtn.addEventListener('click', async (e) => {
          e.preventDefault();
          await markAllNotificationsAsRead();
        });
      }
    }
  } catch (error) {
    console.error('Error loading notifications:', error);
  }
}

// Mark notification as read
async function markNotificationAsRead(notificationId) {
  try {
    const response = await fetch(`http://localhost:5000/api/notifications/${notificationId}/read`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      // Reload notifications
      loadNotifications();
    }
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
}

// Mark all notifications as read
async function markAllNotificationsAsRead() {
  try {
    const response = await fetch('http://localhost:5000/api/notifications/read-all', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      // Reload notifications
      loadNotifications();
    }
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
  }
}

// Export for use in other scripts
window.updateAuthButtons = updateAuthButtons;
window.loadNotifications = loadNotifications;
