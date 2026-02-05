// API base URL
const API_BASE = window.location.origin;

// Get form elements
const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const rememberCheckbox = document.getElementById('remember');
const loginButton = document.getElementById('login-button');
const buttonText = loginButton.querySelector('.button-text');
const buttonLoader = loginButton.querySelector('.button-loader');
const errorMessage = document.getElementById('error-message');

// Check if already logged in
checkExistingSession();

// Form submission
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  await handleLogin();
});

/**
 * Check if user is already logged in
 */
async function checkExistingSession() {
  const token = localStorage.getItem('openclaw_token');
  if (!token) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/api/v1/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      // Already logged in, redirect to dashboard
      window.location.href = '/dashboard.html#queue';
    } else {
      // Invalid token, clear it
      localStorage.removeItem('openclaw_token');
    }
  } catch (err) {
    console.error('Session check failed:', err);
  }
}

/**
 * Handle login form submission
 */
async function handleLogin() {
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  // Validate
  if (!email || !password) {
    showError('Please enter both email and password');
    return;
  }

  // Show loading state
  setLoading(true);
  hideError();

  try {
    const response = await fetch(`${API_BASE}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password }),
      credentials: 'include'
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }

    // Store token
    if (rememberCheckbox.checked) {
      localStorage.setItem('openclaw_token', data.token);
    } else {
      sessionStorage.setItem('openclaw_token', data.token);
    }

    // Store user info
    localStorage.setItem('openclaw_user', JSON.stringify(data.user));

    // Redirect to dashboard
    window.location.href = '/dashboard.html#queue';

  } catch (err) {
    console.error('Login error:', err);
    showError(err.message || 'Login failed. Please check your credentials.');
    setLoading(false);
  }
}

/**
 * Set loading state
 */
function setLoading(loading) {
  loginButton.disabled = loading;

  if (loading) {
    buttonText.style.display = 'none';
    buttonLoader.style.display = 'flex';
  } else {
    buttonText.style.display = 'flex';
    buttonLoader.style.display = 'none';
  }
}

/**
 * Show error message
 */
function showError(message) {
  errorMessage.textContent = message;
  errorMessage.style.display = 'block';
  errorMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Hide error message
 */
function hideError() {
  errorMessage.style.display = 'none';
}

// Handle Enter key on inputs
emailInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    passwordInput.focus();
  }
});

passwordInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    loginForm.dispatchEvent(new Event('submit'));
  }
});
