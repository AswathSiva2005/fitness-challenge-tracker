// Initialize common components
document.addEventListener('DOMContentLoaded', function() {
    // Add active class to current page in navigation
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-link').forEach(link => {
        const linkHref = link.getAttribute('href');
        if (linkHref === currentPage || 
            (currentPage === '' && linkHref === 'index.html')) {
            link.classList.add('active');
            // Also highlight parent dropdown if this is a dropdown item
            const dropdown = link.closest('.dropdown-menu');
            if (dropdown && dropdown.previousElementSibling) {
                dropdown.previousElementSibling.classList.add('active');
            }
        }
    });

    // Close mobile menu when clicking on a nav link
    const navLinks = document.querySelectorAll('.nav-link');
    const menuToggle = document.getElementById('navbarNav');
    const bsCollapse = bootstrap.Collapse.getInstance(menuToggle);
    
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (bsCollapse && window.innerWidth < 992) { // 992px is the Bootstrap lg breakpoint
                bsCollapse.hide();
            }
        });
    });
});

// Function to load common components
function loadCommonComponents() {
    // Check if user is logged in and update UI accordingly
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    
    // Protect routes that require authentication
    const protectedRoutes = ['addWorkout.html', 'addProgress.html', 'profile.html'];
    const currentPage = window.location.pathname.split('/').pop();
    
    if (protectedRoutes.includes(currentPage) && !isLoggedIn) {
        window.location.href = 'login.html';
        return false;
    }
    
    // Redirect away from auth pages if already logged in
    const authPages = ['login.html', 'register.html'];
    if (authPages.includes(currentPage) && isLoggedIn) {
        window.location.href = 'index.html';
        return false;
    }
    
    return true;
}

// Initialize the app
if (loadCommonComponents()) {
    // Add any additional initialization code here
    console.log('App initialized successfully');
}
