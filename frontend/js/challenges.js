// DOM Elements
const activeChallengesContainer = document.getElementById('activeChallenges');
const upcomingChallengesContainer = document.getElementById('upcomingChallenges');
const completedChallengesContainer = document.getElementById('completedChallenges');
const createChallengeBtn = document.getElementById('createChallengeBtn');
const joinChallengeBtn = document.getElementById('joinChallengeBtn');
const saveProgressBtn = document.getElementById('saveProgressBtn');

// API Base URL from config
const API_BASE_URL = window.API_BASE_URL || 'https://fitness-challenge-tracker.onrender.com/api';
const CHALLENGES_ENDPOINT = `${API_BASE_URL}/challenges`;

// State
let currentUser = null;

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  setupEventListeners();
});

// Check if user is authenticated
function checkAuth() {
  const token = localStorage.getItem('token');
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const userId = localStorage.getItem('userId');
  const username = localStorage.getItem('username');
  
  if (!token || !isLoggedIn || !userId) {
    console.log('Not authenticated, redirecting to login');
    window.location.href = 'login.html';
    return;
  }
  
  // Set current user data
  currentUser = {
    _id: userId,
    username: username,
    role: localStorage.getItem('role') || 'user'
  };
  
  console.log('User authenticated:', currentUser);
  loadChallenges();
}

// Setup event listeners
function setupEventListeners() {
  // Create challenge form submission
  const createChallengeForm = document.getElementById('createChallengeForm');
  if (createChallengeForm) {
    // Hide create form for non-trainers
    if ((currentUser.role || 'user') !== 'trainer') {
      const createModal = document.getElementById('createChallengeModal');
      if (createModal) createModal.remove();
      if (createChallengeBtn) createChallengeBtn.style.display = 'none';
    } else {
      // On this page, hide in favor of dedicated challenge.html
      if (createChallengeBtn) {
        createChallengeBtn.textContent = 'Create Challenge';
        createChallengeBtn.onclick = () => (window.location.href = 'challenge.html');
      }
      // Remove modal/form submission if exists
      createChallengeForm.remove();
    }
  }
  
  // Join challenge button
  if (joinChallengeBtn) {
    joinChallengeBtn.addEventListener('click', joinChallenge);
  }
  
  // Save progress button
  if (saveProgressBtn) {
    saveProgressBtn.addEventListener('click', saveProgress);
  }
  
  // Load users for dropdown
  loadUsers();
}

// Load all users for the dropdown
async function loadUsers() {
  try {
    const response = await fetch(`${API_BASE_URL}/users`, {
      headers: getAuthHeaders()
    });
    
    if (response.ok) {
      const result = await response.json();
      const users = result.data || result;
      populateUserDropdown(users);
    }
  } catch (error) {
    console.error('Error loading users:', error);
  }
}

// Populate user checkboxes
function populateUserDropdown(users) {
  const userCheckboxes = document.getElementById('userCheckboxes');
  const assignToAllCheckbox = document.getElementById('assignToAll');
  
  if (!userCheckboxes || !assignToAllCheckbox) return;
  
  // Clear existing checkboxes
  userCheckboxes.innerHTML = '';
  
  // Add individual user checkboxes
  users.forEach(user => {
    const checkboxDiv = document.createElement('div');
    checkboxDiv.className = 'form-check';
    
    const checkbox = document.createElement('input');
    checkbox.className = 'form-check-input user-checkbox';
    checkbox.type = 'checkbox';
    checkbox.value = user._id;
    checkbox.id = `user-${user._id}`;
    checkbox.disabled = true; // Disabled by default when "All Users" is checked
    
    const label = document.createElement('label');
    label.className = 'form-check-label';
    label.htmlFor = `user-${user._id}`;
    label.textContent = user.username || user.name || 'Unknown User';
    
    checkboxDiv.appendChild(checkbox);
    checkboxDiv.appendChild(label);
    userCheckboxes.appendChild(checkboxDiv);
  });
  
  // Handle "All Users" checkbox change
  assignToAllCheckbox.addEventListener('change', function() {
    const userCheckboxes = document.querySelectorAll('.user-checkbox');
    userCheckboxes.forEach(checkbox => {
      checkbox.disabled = this.checked;
      if (this.checked) {
        checkbox.checked = false;
      }
    });
  });
}

// Get auth headers with token
function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

// Format date to readable string
function formatDate(dateString) {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
}

// Calculate progress percentage
function calculateProgress(current, target) {
  return Math.min(Math.round((current / target) * 100), 100);
}

// Show alert message
function showAlert(message, type = 'success') {
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
  alertDiv.role = 'alert';
  alertDiv.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;
  
  const container = document.getElementById('alertsContainer');
  if (container) {
    container.appendChild(alertDiv);
    setTimeout(() => alertDiv.remove(), 5000);
  }
}

// Load all challenges
async function loadChallenges() {
  try {
    console.log('Loading challenges...');
    const response = await fetch(`${CHALLENGES_ENDPOINT}`, {
      headers: getAuthHeaders()
    });
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('API Error:', errorData);
      throw new Error(errorData.msg || 'Failed to load challenges');
    }
    
    const result = await response.json();
    console.log('Challenges response:', result);
    
    // Handle different response structures
    const challenges = result.data || result;
    displayChallenges(challenges);
  } catch (error) {
    console.error('Error loading challenges:', error);
    showAlert(`Failed to load challenges: ${error.message}`, 'danger');
  }
}

// Display challenges in the UI
function displayChallenges(challenges) {
  if (!challenges || !Array.isArray(challenges)) return;
  
  const now = new Date();
  const activeChallenges = [];
  const upcomingChallenges = [];
  const completedChallenges = [];
  
  // Categorize challenges
  challenges.forEach(challenge => {
    const startDate = new Date(challenge.startDate);
    const endDate = new Date(challenge.endDate);
    
    if (now > endDate) {
      completedChallenges.push(challenge);
    } else if (now >= startDate) {
      activeChallenges.push(challenge);
    } else {
      upcomingChallenges.push(challenge);
    }
  });
  
  // Render each category
  renderChallengeList(activeChallenges, activeChallengesContainer, 'active');
  renderChallengeList(upcomingChallenges, upcomingChallengesContainer, 'upcoming');
  renderChallengeList(completedChallenges, completedChallengesContainer, 'completed');
}

// Render a list of challenges
function renderChallengeList(challenges, container, status) {
  if (!container) return;
  
  if (!challenges || challenges.length === 0) {
    const message = status === 'active' 
      ? '<div class="col-12"><div class="alert alert-info">No active challenges. Join or create one to get started!</div></div>'
      : status === 'upcoming'
        ? '<div class="col-12"><div class="alert alert-info">No upcoming challenges at the moment.</div></div>'
        : '<div class="col-12"><div class="alert alert-light">No completed challenges yet.</div></div>';
    
    container.innerHTML = message;
    return;
  }
  
  container.innerHTML = challenges.map(challenge => createChallengeCard(challenge, status)).join('');
  
  // Add event listeners to all buttons using event delegation
  container.addEventListener('click', (e) => {
    if (e.target.classList.contains('view-challenge')) {
      viewChallengeDetails(e.target.dataset.id);
    } else if (e.target.classList.contains('update-progress')) {
      prepareUpdateProgress(e.target.dataset.id);
    } else if (e.target.classList.contains('join-challenge')) {
      joinChallenge(e.target.dataset.id);
    } else if (e.target.classList.contains('delete-challenge')) {
      deleteChallenge(e.target.dataset.id);
    }
  });
}

// Create a challenge card HTML
function createChallengeCard(challenge, status) {
  const progress = challenge.participants?.find(p => p.user?._id === currentUser?._id)?.progress || 0;
  const progressPercent = calculateProgress(progress, challenge.targetValue);
  const participantsCount = challenge.participants?.length || 0;
  const creatorName = challenge.createdBy?.username || challenge.createdBy?.name || 'Unknown User';
  const isParticipant = challenge.participants?.some(p => p.user?._id === currentUser?._id);
  const isCreator = challenge.createdBy?._id === currentUser?._id;
  
  return `
    <div class="col-md-6 col-lg-4 mb-4">
      <div class="card h-100 challenge-card">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h5 class="mb-0">${challenge.title}</h5>
          <span class="badge ${getStatusBadgeClass(status)}">${status.charAt(0).toUpperCase() + status.slice(1)}</span>
        </div>
        <div class="card-body">
          <div class="d-flex align-items-center mb-2">
            <div class="avatar-circle me-2">
              <i class="fas fa-user"></i>
            </div>
            <div>
              <small class="text-muted">Created by</small>
              <div class="fw-semibold">${creatorName}</div>
            </div>
          </div>
          
          <p class="card-text">${challenge.description || 'No description provided.'}</p>
          
          <div class="challenge-stats">
            <span><i class="fas fa-bullseye me-1"></i> Target: ${challenge.targetValue} ${getUnitDisplay(challenge.challengeType)}</span>
            <span><i class="fas fa-users me-1"></i> ${participantsCount} participants</span>
          </div>
          
          ${status === 'active' && isParticipant ? `
            <div class="progress mb-3">
              <div class="progress-bar" role="progressbar" style="width: ${progressPercent}%" 
                   aria-valuenow="${progressPercent}" aria-valuemin="0" aria-valuemax="100"></div>
            </div>
            <div class="text-muted small mb-3">
              Your progress: ${progress} / ${challenge.targetValue} ${getUnitDisplay(challenge.challengeType)} (${progressPercent}%)
            </div>
          ` : ''}
          
          <div class="d-flex justify-content-between align-items-center">
            <small class="text-muted">
              <i class="far fa-calendar-alt me-1"></i>
              ${formatDate(challenge.startDate)} - ${formatDate(challenge.endDate)}
            </small>
            <button class="btn btn-sm btn-outline-primary view-challenge" data-id="${challenge._id}">
              View Details
            </button>
          </div>
          
          <div class="d-grid gap-2 mt-3">
            ${!isParticipant && !isCreator ? `
              <button class="btn btn-success btn-sm join-challenge" data-id="${challenge._id}">
                <i class="fas fa-plus me-1"></i>Join Challenge
              </button>
            ` : ''}
            
            ${status === 'active' && isParticipant ? `
              <button class="btn btn-primary btn-sm update-progress" data-id="${challenge._id}">
                <i class="fas fa-chart-line me-1"></i>Update Progress
              </button>
            ` : ''}
            
            ${isCreator ? `
              <button class="btn btn-outline-danger btn-sm delete-challenge" data-id="${challenge._id}">
                <i class="fas fa-trash me-1"></i>Delete
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    </div>
  `;
}

// Get the appropriate badge class based on status
function getStatusBadgeClass(status) {
  switch (status) {
    case 'active': return 'bg-success';
    case 'upcoming': return 'bg-warning text-dark';
    case 'completed': return 'bg-secondary';
    default: return 'bg-primary';
  }
}

// Get display text for challenge unit
function getUnitDisplay(challengeType) {
  const units = {
    'steps': 'steps',
    'workouts': 'workouts',
    'distance': 'km',
    'calories': 'cal',
    'active_minutes': 'min'
  };
  return units[challengeType] || '';
}

// View challenge details
function viewChallengeDetails(challengeId) {
  // Fetch challenge details and show in modal
  fetch(`${CHALLENGES_ENDPOINT}/${challengeId}`, {
    headers: getAuthHeaders()
  })
  .then(response => response.json())
  .then(challenge => {
    // Populate modal with challenge details
    const modalElement = document.getElementById('challengeDetailsModal');
    if (!modalElement) {
      console.error('Challenge details modal not found');
      return;
    }
    
    const modal = new bootstrap.Modal(modalElement);
    const modalTitle = document.getElementById('challengeDetailsTitle');
    const modalBody = document.getElementById('challengeDetailsBody');
    
    modalTitle.textContent = challenge.title;
    
    // Create challenge details HTML
    const challengeType = (challenge && challenge.challengeType) ? String(challenge.challengeType) : '';
    const challengeTypeLabel = challengeType ? challengeType.replace('_', ' ').toUpperCase() : 'N/A';
    modalBody.innerHTML = `
      <p>${challenge.description || 'No description provided.'}</p>
      <div class="mb-3">
        <strong>Challenge Type:</strong> ${challengeTypeLabel}
      </div>
      <div class="mb-3">
        <strong>Target:</strong> ${challenge.targetValue} ${getUnitDisplay(challengeType)}
      </div>
      <div class="mb-3">
        <strong>Duration:</strong> ${formatDate(challenge.startDate)} to ${formatDate(challenge.endDate)}
      </div>
      <div class="mb-3">
        <strong>Participants:</strong> ${challenge.participants?.length || 0}
      </div>
    `;
    
    // Show join button if user is not a participant
    const isParticipant = challenge.participants?.some(p => p.user?._id === currentUser?._id);
    const joinBtn = document.getElementById('joinChallengeBtn');
    joinBtn.style.display = isParticipant ? 'none' : 'block';
    joinBtn.onclick = () => joinChallenge(challenge._id);
    
    modal.show();
  })
  .catch(error => {
    console.error('Error loading challenge details:', error);
    showAlert('Failed to load challenge details. Please try again.', 'danger');
  });
}

// Prepare to update progress
function prepareUpdateProgress(challengeId) {
  document.getElementById('currentChallengeId').value = challengeId;
  
  // Fetch current progress if any
  fetch(`${CHALLENGES_ENDPOINT}/${challengeId}`, {
    headers: getAuthHeaders()
  })
  .then(response => response.json())
  .then(challenge => {
    const participant = challenge.participants?.find(p => p.user?._id === currentUser?._id);
    const progressInput = document.getElementById('progressValue');
    
    if (participant) {
      progressInput.value = participant.progress || 0;
    } else {
      progressInput.value = 0;
    }
    
    // Show the update progress modal
    const modal = new bootstrap.Modal(document.getElementById('updateProgressModal'));
    modal.show();
  })
  .catch(error => {
    console.error('Error preparing to update progress:', error);
    showAlert('Failed to load challenge data. Please try again.', 'danger');
  });
}

// Create a new challenge
async function createChallenge() {
  const title = document.getElementById('challengeTitle').value.trim();
  const description = document.getElementById('challengeDescription').value.trim();
  const challengeType = document.getElementById('challengeType').value;
  const targetValue = parseInt(document.getElementById('targetValue').value);
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;
  const isPrivate = document.getElementById('isPrivate').checked;
  const assignToAll = document.getElementById('assignToAll').checked;
  const selectedUsers = Array.from(document.querySelectorAll('.user-checkbox:checked')).map(cb => cb.value);

  // Basic validation
  if (!title || !description || !challengeType || !targetValue || !startDate || !endDate) {
    showAlert('Please fill in all required fields.', 'warning');
    return;
  }

  if (new Date(startDate) >= new Date(endDate)) {
    showAlert('End date must be after start date.', 'warning');
    return;
  }

  try {
    console.log('Sending challenge creation request...');
    const challengeData = {
      title,
      description,
      challengeType,
      targetValue,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      isPublic: !isPrivate,  // Convert isPrivate to isPublic
      assignedUsers: assignToAll ? [] : selectedUsers // Empty array means all users
    };
    
    console.log('Challenge data to send:', JSON.stringify(challengeData, null, 2));
    
    const response = await fetch(CHALLENGES_ENDPOINT, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(challengeData)
    });

    console.log('Response status:', response.status);
    const responseData = await response.json();
    console.log('Response from server:', responseData);
    
    if (!response.ok) {
      throw new Error(responseData.message || responseData.error || 'Failed to create challenge');
    }

    // Close the modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('createChallengeModal'));
    if (modal) modal.hide();
    
    // Reset the form
    document.getElementById('createChallengeForm').reset();
    
    // Reload challenges
    loadChallenges();
    
    showAlert('Challenge created successfully!', 'success');
  } catch (error) {
    console.error('Error creating challenge:', error);
    
    // More detailed error message
    let errorMessage = error.message || 'Failed to create challenge';
    
    // Handle network errors
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      errorMessage = 'Unable to connect to the server. Please check your internet connection.';
    }
    
    // Show detailed error in console
    if (error.response) {
      console.error('Error response:', error.response);
    }
    
    // Display user-friendly error message
    showAlert(`Failed to create challenge: ${errorMessage}`, 'danger');
    
    // If there are validation errors, log them
    if (error.errors) {
      console.error('Validation errors:', error.errors);
    }
  } finally {
    // Re-enable the create button
    if (createChallengeBtn) {
      createChallengeBtn.disabled = false;
      createChallengeBtn.innerHTML = 'Create Challenge';
    }
  }
}

// Join a challenge
async function joinChallenge(challengeId) {
  try {
    const response = await fetch(`${CHALLENGES_ENDPOINT}/${challengeId}/join`, {
      method: 'POST',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to join challenge');
    }

    // Close the details modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('challengeDetailsModal'));
    if (modal) modal.hide();
    
    // Reload challenges
    loadChallenges();
    
    showAlert('Successfully joined the challenge!', 'success');
  } catch (error) {
    console.error('Error joining challenge:', error);
    showAlert(`Failed to join challenge: ${error.message}`, 'danger');
  }
}

// Save progress for a challenge
async function saveProgress() {
  const challengeId = document.getElementById('currentChallengeId').value;
  const progressValue = parseInt(document.getElementById('progressValue').value);
  const markAsComplete = document.getElementById('markAsComplete').checked;

  if (isNaN(progressValue) || progressValue < 0) {
    showAlert('Please enter a valid progress value.', 'warning');
    return;
  }

  try {
    const response = await fetch(`${CHALLENGES_ENDPOINT}/${challengeId}/progress`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        progress: progressValue,
        completed: markAsComplete
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update progress');
    }

    // Close the modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('updateProgressModal'));
    if (modal) modal.hide();
    
    // Reset the form
    document.getElementById('updateProgressForm').reset();
    
    // Reload challenges
    loadChallenges();
    
    showAlert('Progress updated successfully!', 'success');
  } catch (error) {
    console.error('Error updating progress:', error);
    showAlert(`Failed to update progress: ${error.message}`, 'danger');
  }
}

// Delete a challenge
async function deleteChallenge(challengeId) {
  if (!confirm('Are you sure you want to delete this challenge? This action cannot be undone.')) {
    return;
  }

  try {
    const response = await fetch(`${CHALLENGES_ENDPOINT}/${challengeId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete challenge');
    }

    // Reload challenges
    loadChallenges();
    
    showAlert('Challenge deleted successfully!', 'success');
  } catch (error) {
    console.error('Error deleting challenge:', error);
    showAlert(`Failed to delete challenge: ${error.message}`, 'danger');
  }
}

// Initialize date pickers and other UI elements when the page loads
document.addEventListener('DOMContentLoaded', () => {
  // Set minimum dates for date inputs
  const today = new Date().toISOString().split('T')[0];
  const startDateInput = document.getElementById('startDate');
  const endDateInput = document.getElementById('endDate');
  
  if (startDateInput && endDateInput) {
    startDateInput.min = today;
    endDateInput.min = today;
    
    // Update end date min when start date changes
    startDateInput.addEventListener('change', () => {
      endDateInput.min = startDateInput.value;
      if (endDateInput.value < startDateInput.value) {
        endDateInput.value = startDateInput.value;
      }
    });
  }
  
  // Initialize tooltips
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });
});
