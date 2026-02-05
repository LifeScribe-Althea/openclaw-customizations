// OpenClaw Dashboard - Main Orchestrator
// Handles routing, authentication, and tab management

class DashboardApp {
  constructor() {
    this.currentUser = null;
    this.currentTab = 'queue';
    this.initialized = false;

    this.tabs = {
      queue: {
        button: document.getElementById('tab-queue'),
        content: document.getElementById('tab-content-queue'),
        component: window.queueTab
      },
      chat: {
        button: document.getElementById('tab-chat'),
        content: document.getElementById('tab-content-chat'),
        component: window.chatTab
      }
    };

    this.elements = {
      userNameEl: document.getElementById('user-name'),
      userMenuBtn: document.getElementById('user-menu-btn'),
      userDropdown: document.getElementById('user-dropdown'),
      logoutButton: document.getElementById('logout-button'),
      viewProfileButton: document.getElementById('view-profile'),
      viewUsersButton: document.getElementById('view-users'),
      toastContainer: document.getElementById('toast-container')
    };
  }

  async initialize() {
    console.log('🚀 Initializing OpenClaw Dashboard...');

    // Check authentication
    const token = this.getToken();
    if (!token) {
      console.log('No token found, redirecting to login');
      window.location.href = '/login.html';
      return;
    }

    try {
      // Get current user
      const response = await this.fetchAPI('/api/v1/auth/me');
      if (!response.ok) {
        throw new Error('Authentication failed');
      }

      this.currentUser = response.user;
      this.elements.userNameEl.textContent = this.currentUser.fullName;

      // Hide manage users if not admin
      if (this.currentUser.role !== 'admin') {
        this.elements.viewUsersButton.style.display = 'none';
      }

      // Initialize state manager
      window.stateManager.init();

      // Connect WebSockets
      window.websocketManager.connectQueue(token);
      // Chat WebSocket will be connected when chat tab is activated

      // Setup event listeners
      this.setupEventListeners();

      // Setup routing
      this.setupRouting();

      // Initialize components
      window.agentSelector.init();
      window.voiceControls.init();

      // Handle initial route
      this.handleRouteChange();

      this.initialized = true;
      console.log('✅ Dashboard initialized successfully');

    } catch (err) {
      console.error('Initialization error:', err);
      this.showToast('Authentication failed', 'error');
      setTimeout(() => {
        window.location.href = '/login.html';
      }, 1500);
    }
  }

  setupEventListeners() {
    // Tab buttons
    Object.entries(this.tabs).forEach(([tabName, tab]) => {
      tab.button.addEventListener('click', () => {
        this.switchTab(tabName);
      });
    });

    // User menu toggle
    this.elements.userMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const dropdown = this.elements.userDropdown;
      dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    });

    document.addEventListener('click', () => {
      this.elements.userDropdown.style.display = 'none';
    });

    // Logout
    this.elements.logoutButton.addEventListener('click', () => this.logout());

    // View profile
    this.elements.viewProfileButton.addEventListener('click', () => {
      this.showToast('Profile page coming soon', 'info');
    });

    // View users
    this.elements.viewUsersButton.addEventListener('click', () => {
      this.showToast('User management coming soon', 'info');
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Cmd/Ctrl + 1: Queue tab
      if ((e.metaKey || e.ctrlKey) && e.key === '1') {
        e.preventDefault();
        this.switchTab('queue');
      }
      // Cmd/Ctrl + 2: Chat tab
      else if ((e.metaKey || e.ctrlKey) && e.key === '2') {
        e.preventDefault();
        this.switchTab('chat');
      }
      // Cmd/Ctrl + K: Command palette (future)
      else if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        this.showToast('Command palette coming soon', 'info');
      }
    });
  }

  setupRouting() {
    // Listen for hash changes
    window.addEventListener('hashchange', () => {
      this.handleRouteChange();
    });
  }

  handleRouteChange() {
    const hash = window.location.hash.slice(1) || 'queue';
    const [route, queryString] = hash.split('?');

    console.log('Route changed:', route, queryString);

    switch (route) {
      case 'queue':
        this.switchTab('queue');
        break;

      case 'chat': {
        const params = new URLSearchParams(queryString);
        const agent = params.get('agent') || window.stateManager.getCurrentAgent() || 'althea';
        this.switchTab('chat', { agent });
        break;
      }

      default:
        console.warn('Unknown route:', route);
        this.switchTab('queue');
    }
  }

  switchTab(tabName, options = {}) {
    if (!this.tabs[tabName]) {
      console.error('Unknown tab:', tabName);
      return;
    }

    console.log('Switching to tab:', tabName, options);

    // Deactivate current tab
    if (this.currentTab && this.tabs[this.currentTab]) {
      const prevTab = this.tabs[this.currentTab];
      prevTab.button.classList.remove('active');
      prevTab.content.classList.remove('active');

      // Call component lifecycle
      if (prevTab.component?.onDeactivate) {
        prevTab.component.onDeactivate();
      }
    }

    // Activate new tab
    const newTab = this.tabs[tabName];
    newTab.button.classList.add('active');
    newTab.content.classList.add('active');

    this.currentTab = tabName;
    window.stateManager.setCurrentTab(tabName);

    // Update URL if needed
    if (tabName === 'queue') {
      window.history.replaceState({}, '', '#queue');
    } else if (tabName === 'chat') {
      const agent = options.agent || window.stateManager.getCurrentAgent() || 'althea';
      window.history.replaceState({}, '', `#chat?agent=${agent}`);
    }

    // Call component lifecycle
    if (newTab.component?.onActivate) {
      if (tabName === 'queue') {
        newTab.component.onActivate(this.currentUser);
      } else if (tabName === 'chat') {
        const agent = options.agent || window.stateManager.getCurrentAgent() || 'althea';
        newTab.component.onActivate(agent);
      }
    }
  }

  getCurrentTab() {
    return this.currentTab;
  }

  async logout() {
    try {
      await this.fetchAPI('/api/v1/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    }

    // Clear tokens and state
    localStorage.removeItem('openclaw_token');
    sessionStorage.removeItem('openclaw_token');
    localStorage.removeItem('openclaw_user');
    window.stateManager.clear();

    // Disconnect WebSockets
    window.websocketManager.disconnectAll();

    // Redirect to login
    window.location.href = '/login.html';
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    this.elements.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // Utility functions
  getToken() {
    return localStorage.getItem('openclaw_token') || sessionStorage.getItem('openclaw_token');
  }

  async fetchAPI(path, options = {}) {
    const token = this.getToken();
    const API_BASE = window.location.origin;

    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
      },
      credentials: 'include'
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'Request failed');
    }

    return await response.json();
  }
}

// Add slideOut animation to CSS (inline style)
const style = document.createElement('style');
style.textContent = `
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// Initialize dashboard when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.dashboardApp = new DashboardApp();
    window.dashboardApp.initialize();
  });
} else {
  window.dashboardApp = new DashboardApp();
  window.dashboardApp.initialize();
}
