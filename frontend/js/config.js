// API Configuration
const API_CONFIG = {
    // Backend server URL
    BASE_URL: 'http://localhost:5000',  // Changed from 3000 to 5000 to match your backend
    ENDPOINTS: {
        WORKOUTS: '/api/workouts',
        PROGRESS: '/api/progress',
        AUTH: '/api/auth',
        USERS: '/api/users'
    }
};

// Helper function to get full API URL
function getApiUrl(endpoint) {
    return API_CONFIG.BASE_URL + endpoint;
}

// Function to get auth headers with token
function getAuthHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
    };
}
