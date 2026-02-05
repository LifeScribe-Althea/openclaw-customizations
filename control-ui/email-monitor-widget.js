// Email Monitor Widget for OpenClaw Control UI
// Adds email monitoring toggle and status display to the sidebar

(function() {
  'use strict';

  console.log('📧 Email Monitor Widget loading...');

  const API_BASE = window.location.origin;
  let currentStatus = null;
  let updateInterval = null;

  // Inject CSS styles for email monitor
  function injectStyles() {
    const style = document.createElement('style');
    style.id = 'email-monitor-styles';
    style.textContent = `
      .email-monitor-section {
        margin-top: 20px;
        padding-top: 20px;
        border-top: 1px solid #3a3a3a;
      }

      .email-monitor-header {
        font-size: 10px !important;
        font-weight: 700 !important;
        text-transform: uppercase !important;
        letter-spacing: 1px !important;
        color: #4a9eff !important;
        margin-bottom: 12px !important;
        padding: 0 8px !important;
        display: block !important;
      }

      .email-monitor-card {
        background: #1a1a1a !important;
        border: 1px solid #3a3a3a !important;
        border-radius: 8px !important;
        padding: 12px !important;
        margin-bottom: 8px !important;
      }

      .email-monitor-toggle {
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        margin-bottom: 12px !important;
      }

      .email-monitor-label {
        font-size: 13px !important;
        color: #e0e0e0 !important;
        font-weight: 500 !important;
      }

      .toggle-switch {
        position: relative !important;
        width: 44px !important;
        height: 24px !important;
        background: #3a3a3a !important;
        border-radius: 12px !important;
        cursor: pointer !important;
        transition: background 0.3s ease !important;
      }

      .toggle-switch.active {
        background: #10b981 !important;
      }

      .toggle-switch::after {
        content: '' !important;
        position: absolute !important;
        top: 2px !important;
        left: 2px !important;
        width: 20px !important;
        height: 20px !important;
        background: white !important;
        border-radius: 50% !important;
        transition: transform 0.3s ease !important;
      }

      .toggle-switch.active::after {
        transform: translateX(20px) !important;
      }

      .email-monitor-status {
        font-size: 11px !important;
        color: #9ca3af !important;
        line-height: 1.4 !important;
      }

      .email-monitor-status-item {
        display: flex !important;
        justify-content: space-between !important;
        margin-bottom: 6px !important;
      }

      .status-value {
        font-weight: 600 !important;
        color: #e0e0e0 !important;
      }

      .status-value.active {
        color: #10b981 !important;
      }

      .status-value.warning {
        color: #f59e0b !important;
      }

      .pending-badge-widget {
        display: inline-flex !important;
        align-items: center !important;
        gap: 4px !important;
        padding: 4px 8px !important;
        background: #f59e0b !important;
        color: white !important;
        border-radius: 12px !important;
        font-size: 11px !important;
        font-weight: 600 !important;
        animation: pulse 2s ease-in-out infinite !important;
      }

      .pending-dot {
        width: 6px !important;
        height: 6px !important;
        background: white !important;
        border-radius: 50% !important;
        animation: blink 1s ease-in-out infinite !important;
      }

      .email-monitor-actions {
        margin-top: 12px !important;
        display: flex !important;
        gap: 6px !important;
      }

      .monitor-btn {
        flex: 1 !important;
        padding: 6px 10px !important;
        background: #2d7ff9 !important;
        color: white !important;
        border: none !important;
        border-radius: 6px !important;
        font-size: 11px !important;
        font-weight: 600 !important;
        cursor: pointer !important;
        transition: all 0.2s ease !important;
      }

      .monitor-btn:hover {
        background: #1d4ed8 !important;
        transform: translateY(-1px) !important;
      }

      .monitor-btn:active {
        transform: translateY(0) !important;
      }

      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
      }

      @keyframes blink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.3; }
      }
    `;

    if (!document.getElementById('email-monitor-styles')) {
      document.head.appendChild(style);
    }
  }

  // Get authentication token
  function getToken() {
    return localStorage.getItem('openclaw_token') || sessionStorage.getItem('openclaw_token');
  }

  // Fetch API helper
  async function fetchAPI(path, options = {}) {
    const token = getToken();
    if (!token) {
      console.warn('No auth token found');
      return null;
    }

    try {
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
        throw new Error(`API request failed: ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      console.error('API fetch error:', err);
      return null;
    }
  }

  // Fetch monitor status
  async function fetchMonitorStatus() {
    const data = await fetchAPI('/api/v1/monitor/status');
    if (data && data.ok) {
      currentStatus = data.status;
      updateUI();
    }
  }

  // Fetch queue stats
  async function fetchQueueStats() {
    const data = await fetchAPI('/api/v1/queue/stats');
    if (data && data.ok) {
      updatePendingCount(data.stats.pending);
    }
  }

  // Toggle monitor
  async function toggleMonitor(enabled) {
    const data = await fetchAPI('/api/v1/monitor/toggle', {
      method: 'POST',
      body: JSON.stringify({ enabled })
    });

    if (data && data.ok) {
      currentStatus = data.status;
      updateUI();
      showNotification(enabled ? 'Email monitoring started' : 'Email monitoring stopped');
    } else {
      showNotification('Failed to toggle monitor', 'error');
    }
  }

  // Update UI with current status
  function updateUI() {
    if (!currentStatus) return;

    const toggle = document.getElementById('email-monitor-toggle');
    const statusEnabled = document.getElementById('status-enabled');
    const statusLastCheck = document.getElementById('status-last-check');
    const statusProcessed = document.getElementById('status-processed');

    if (toggle) {
      if (currentStatus.enabled) {
        toggle.classList.add('active');
      } else {
        toggle.classList.remove('active');
      }
    }

    if (statusEnabled) {
      statusEnabled.textContent = currentStatus.enabled ? 'Active' : 'Inactive';
      statusEnabled.className = 'status-value';
      if (currentStatus.enabled) {
        statusEnabled.classList.add('active');
      }
    }

    if (statusLastCheck && currentStatus.lastCheck) {
      const ago = formatTimeAgo(currentStatus.lastCheck);
      statusLastCheck.textContent = ago;
    }

    if (statusProcessed) {
      statusProcessed.textContent = currentStatus.processedCount || 0;
    }
  }

  // Update pending count
  function updatePendingCount(count) {
    const pendingCountEl = document.getElementById('pending-count-widget');
    if (pendingCountEl) {
      if (count > 0) {
        pendingCountEl.innerHTML = `
          <span class="pending-dot"></span>
          ${count} pending
        `;
        pendingCountEl.style.display = 'inline-flex';
      } else {
        pendingCountEl.style.display = 'none';
      }
    }
  }

  // Format time ago
  function formatTimeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }

  // Show notification
  function showNotification(message, type = 'success') {
    // Create toast notification
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 16px;
      background: ${type === 'error' ? '#ef4444' : '#10b981'};
      color: white;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      z-index: 999999;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      animation: slideIn 0.3s ease-out;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // Create email monitor widget
  function createEmailMonitorWidget() {
    const section = document.createElement('div');
    section.className = 'email-monitor-section';
    section.id = 'email-monitor-section';

    section.innerHTML = `
      <div class="email-monitor-header">Email Monitor</div>
      <div class="email-monitor-card">
        <div class="email-monitor-toggle">
          <span class="email-monitor-label">Monitor</span>
          <div class="toggle-switch" id="email-monitor-toggle"></div>
        </div>

        <div class="email-monitor-status">
          <div class="email-monitor-status-item">
            <span>Status:</span>
            <span class="status-value" id="status-enabled">Loading...</span>
          </div>
          <div class="email-monitor-status-item">
            <span>Last check:</span>
            <span class="status-value" id="status-last-check">N/A</span>
          </div>
          <div class="email-monitor-status-item">
            <span>Processed:</span>
            <span class="status-value" id="status-processed">0</span>
          </div>
        </div>

        <div class="email-monitor-actions">
          <span class="pending-badge-widget" id="pending-count-widget" style="display: none;">
            <span class="pending-dot"></span>
            0 pending
          </span>
          <button class="monitor-btn" id="view-queue-btn">View Queue →</button>
        </div>
      </div>
    `;

    // Set up event listeners
    const toggle = section.querySelector('#email-monitor-toggle');
    toggle.addEventListener('click', () => {
      const newState = !currentStatus?.enabled;
      toggleMonitor(newState);
    });

    const viewQueueBtn = section.querySelector('#view-queue-btn');
    viewQueueBtn.addEventListener('click', () => {
      window.location.href = '/queue.html';
    });

    return section;
  }

  // Initialize
  async function init() {
    // Check if user is authenticated
    const token = getToken();
    if (!token) {
      console.log('Not authenticated, skipping email monitor widget');
      return;
    }

    // Inject styles
    injectStyles();

    // Wait for agent selector to be ready
    const checkAgentSelector = setInterval(() => {
      const wrapper = document.querySelector('.agent-selector-wrapper');
      if (wrapper) {
        clearInterval(checkAgentSelector);

        // Create and insert widget before voice controls
        const widget = createEmailMonitorWidget();
        const voiceControls = wrapper.querySelector('.voice-controls');

        if (voiceControls) {
          wrapper.insertBefore(widget, voiceControls);
        } else {
          wrapper.appendChild(widget);
        }

        console.log('✅ Email monitor widget initialized');

        // Fetch initial status
        fetchMonitorStatus();
        fetchQueueStats();

        // Set up periodic updates
        updateInterval = setInterval(() => {
          fetchMonitorStatus();
          fetchQueueStats();
        }, 10000); // 10 seconds
      }
    }, 100);

    // Clean up on page unload
    window.addEventListener('beforeunload', () => {
      if (updateInterval) {
        clearInterval(updateInterval);
      }
    });
  }

  // Run initialization
  init();

})();
