document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            try {
                const response = await fetch('http://localhost:5000/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    // Save token and login state
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('isLoggedIn', 'true');
                    localStorage.setItem('userId', data.userId);
                    localStorage.setItem('username', data.username || 'User');
                    if (data.role) localStorage.setItem('role', data.role);
                    
                    // Redirect trainers to Admin page; others to intended/home
                    if ((data.role || '').toLowerCase() === 'trainer') {
                        window.location.href = 'admin.html';
                    } else {
                        const redirectTo = localStorage.getItem('redirectAfterLogin') || 'index.html';
                        localStorage.removeItem('redirectAfterLogin');
                        window.location.href = redirectTo;
                    }
                } else {
                    // Show error message
                    const errorMessage = document.getElementById('errorMessage');
                    if (errorMessage) {
                        errorMessage.textContent = data.message || 'Login failed. Please try again.';
                        errorMessage.style.display = 'block';
                    }
                }
            } catch (error) {
                console.error('Login error:', error);
                const errorMessage = document.getElementById('errorMessage');
                if (errorMessage) {
                    errorMessage.textContent = 'An error occurred. Please try again.';
                    errorMessage.style.display = 'block';
                }
            }
        });
    }
});
