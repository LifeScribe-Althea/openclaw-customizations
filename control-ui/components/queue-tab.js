// Queue Tab Component
// Refactored from queue.js with lifecycle methods

class QueueTab {
  constructor() {
    this.currentUser = null;
    this.currentFilter = 'all';
    this.currentDrafts = [];
    this.selectedDraftId = null;
    this.searchTimeout = null;
    this.isActive = false;

    // Get DOM elements
    this.elements = {
      filterButtons: document.querySelectorAll('.filter-btn'),
      searchInput: document.getElementById('search-input'),
      listTitle: document.getElementById('list-title'),
      draftsContainer: document.getElementById('drafts-container'),
      listLoading: document.getElementById('list-loading'),
      listEmpty: document.getElementById('list-empty'),
      previewPane: document.getElementById('preview-pane'),

      // Modals
      modalOverlay: document.getElementById('modal-overlay'),
      modalTitle: document.getElementById('modal-title'),
      modalBody: document.getElementById('modal-body'),
      modalClose: document.getElementById('modal-close'),
      modalCancel: document.getElementById('modal-cancel'),
      modalConfirm: document.getElementById('modal-confirm'),

      editModalOverlay: document.getElementById('edit-modal-overlay'),
      editModalClose: document.getElementById('edit-modal-close'),
      editModalCancel: document.getElementById('edit-modal-cancel'),
      editModalSave: document.getElementById('edit-modal-save'),
      editTextarea: document.getElementById('edit-textarea')
    };

    this.setupEventListeners();
    this.setupWebSocketListeners();
  }

  setupEventListeners() {
    // Filter buttons
    this.elements.filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.elements.filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentFilter = btn.dataset.status;
        window.stateManager.setQueueFilter(this.currentFilter);
        this.loadDrafts();
      });
    });

    // Search input
    this.elements.searchInput.addEventListener('input', (e) => {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = setTimeout(() => {
        window.stateManager.setSearchQuery(e.target.value);
        this.loadDrafts(e.target.value);
      }, 300);
    });

    // Modal close handlers
    this.elements.modalClose.addEventListener('click', () => this.closeModal());
    this.elements.modalCancel.addEventListener('click', () => this.closeModal());
    this.elements.modalOverlay.addEventListener('click', (e) => {
      if (e.target === this.elements.modalOverlay) {
        this.closeModal();
      }
    });

    // Edit modal close handlers
    this.elements.editModalClose.addEventListener('click', () => this.closeEditModal());
    this.elements.editModalCancel.addEventListener('click', () => this.closeEditModal());
    this.elements.editModalOverlay.addEventListener('click', (e) => {
      if (e.target === this.elements.editModalOverlay) {
        this.closeEditModal();
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (!this.isActive) return;

      if (e.key === 'Escape') {
        this.closeModal();
        this.closeEditModal();
      } else if (e.key === 'r' && !e.ctrlKey && !e.metaKey) {
        const activeElement = document.activeElement;
        if (activeElement.tagName !== 'INPUT' && activeElement.tagName !== 'TEXTAREA') {
          this.refresh();
        }
      }
    });
  }

  setupWebSocketListeners() {
    if (!window.websocketManager) return;

    window.websocketManager.on('draft:new', (draft) => {
      console.log('New draft received in queue tab');
      this.loadDrafts();
      this.loadStats();

      // Show badge if tab is inactive
      if (!this.isActive) {
        this.updateBadge(true);
      }

      // Show toast notification
      window.dashboardApp?.showToast('New draft received', 'info');
    });

    window.websocketManager.on('draft:updated', (draft) => {
      console.log('Draft updated in queue tab');
      this.loadDrafts();
      this.loadStats();
    });

    window.websocketManager.on('queue:stats', (stats) => {
      this.updateStats(stats);
    });
  }

  // Lifecycle: Tab activated
  async onActivate(user) {
    console.log('Queue tab activated');
    this.isActive = true;
    this.currentUser = user;

    // Restore state
    this.restoreState();

    // Load data
    await this.loadDrafts();
    await this.loadStats();

    // Clear badge
    this.updateBadge(false);
  }

  // Lifecycle: Tab deactivated
  onDeactivate() {
    console.log('Queue tab deactivated');
    this.isActive = false;

    // Save state
    this.saveState();
  }

  restoreState() {
    const state = window.stateManager.getState();

    // Restore filter
    this.currentFilter = state.queue.filter || 'all';
    this.elements.filterButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.status === this.currentFilter);
    });

    // Restore search query
    if (state.queue.searchQuery) {
      this.elements.searchInput.value = state.queue.searchQuery;
    }

    // Restore selected draft
    this.selectedDraftId = state.queue.selectedDraftId;
  }

  saveState() {
    // Save scroll position
    const scrollPosition = this.elements.draftsContainer.scrollTop || 0;
    window.stateManager.setQueueScrollPosition(scrollPosition);
  }

  async loadDrafts(search = '') {
    this.elements.listLoading.style.display = 'flex';
    this.elements.listEmpty.style.display = 'none';
    this.elements.draftsContainer.innerHTML = '';

    try {
      const params = new URLSearchParams();
      if (this.currentFilter !== 'all') {
        params.append('status', this.currentFilter);
      }
      if (search) {
        params.append('search', search);
      }
      params.append('limit', '100');

      const response = await this.fetchAPI(`/api/v1/queue/drafts?${params}`);
      this.currentDrafts = response.drafts;

      this.elements.listLoading.style.display = 'none';

      if (this.currentDrafts.length === 0) {
        this.elements.listEmpty.style.display = 'flex';
        return;
      }

      this.renderDrafts();

      // Restore scroll position
      const scrollPosition = window.stateManager.getQueueScrollPosition();
      if (scrollPosition) {
        this.elements.draftsContainer.scrollTop = scrollPosition;
      }

      // Restore selected draft
      if (this.selectedDraftId) {
        const draft = this.currentDrafts.find(d => d.id === this.selectedDraftId);
        if (draft) {
          this.renderPreview(draft);
        }
      }

    } catch (err) {
      console.error('Load drafts error:', err);
      this.elements.listLoading.style.display = 'none';
      window.dashboardApp?.showToast('Failed to load drafts', 'error');
    }
  }

  renderDrafts() {
    this.elements.draftsContainer.innerHTML = '';

    this.currentDrafts.forEach(draft => {
      const item = document.createElement('div');
      item.className = 'draft-item';
      if (this.selectedDraftId === draft.id) {
        item.classList.add('selected');
      }

      item.innerHTML = `
        <div class="draft-header">
          <div class="draft-from">${this.escapeHtml(this.extractEmailName(draft.fromAddress))}</div>
          <div class="draft-time">${this.formatTimeAgo(draft.receivedAt)}</div>
        </div>
        <div class="draft-subject">${this.escapeHtml(draft.subject)}</div>
        <div class="draft-preview-text">${this.escapeHtml(draft.originalBody.substring(0, 100))}...</div>
        <div class="draft-status status-${draft.status}">${draft.status}</div>
      `;

      item.addEventListener('click', () => {
        this.selectDraft(draft.id);
      });

      this.elements.draftsContainer.appendChild(item);
    });
  }

  selectDraft(draftId) {
    this.selectedDraftId = draftId;
    window.stateManager.setSelectedDraft(draftId);

    const draft = this.currentDrafts.find(d => d.id === draftId);
    if (!draft) return;

    // Update selected state
    document.querySelectorAll('.draft-item').forEach(item => {
      item.classList.remove('selected');
    });
    event.currentTarget?.classList.add('selected');

    // Render preview
    this.renderPreview(draft);
  }

  renderPreview(draft) {
    const canReview = this.currentUser.role === 'admin' || this.currentUser.role === 'reviewer';
    const canTakeAction = canReview && draft.status === 'pending';

    this.elements.previewPane.innerHTML = `
      <div class="preview-header">
        <div class="preview-title">${this.escapeHtml(draft.subject)}</div>
        <div class="preview-meta">
          <span>From: ${this.escapeHtml(draft.fromAddress)}</span>
          <span>•</span>
          <span>${this.formatDateTime(draft.receivedAt)}</span>
        </div>
      </div>

      <div class="preview-section">
        <div class="section-title">Original Email</div>
        <div class="email-content">${this.escapeHtml(draft.originalBody)}</div>
      </div>

      <div class="preview-section">
        <div class="section-title">Sage's Draft Response</div>
        <div class="email-content">${this.escapeHtml(draft.draftResponse)}</div>
      </div>

      ${draft.finalResponse ? `
        <div class="preview-section">
          <div class="section-title">Edited Response (Sent)</div>
          <div class="email-content">${this.escapeHtml(draft.finalResponse)}</div>
        </div>
      ` : ''}

      ${draft.metadata ? `
        <div class="preview-section">
          <div class="section-title">Metadata</div>
          <div style="font-size: 0.875rem; color: var(--text-secondary);">
            ${this.renderMetadata(draft.metadata)}
          </div>
        </div>
      ` : ''}

      ${canTakeAction ? `
        <div class="preview-actions">
          <button class="btn-primary" onclick="queueTab.approveDraft(${draft.id})">
            ✓ Approve & Send
          </button>
          <button class="btn-secondary" onclick="queueTab.editDraft(${draft.id})">
            ✎ Edit Response
          </button>
          <button class="btn-danger" onclick="queueTab.deleteDraft(${draft.id})">
            ✗ Delete
          </button>
        </div>
      ` : ''}
    `;
  }

  approveDraft(draftId) {
    const draft = this.currentDrafts.find(d => d.id === draftId);
    if (!draft) return;

    this.elements.modalTitle.textContent = 'Approve & Send Email';
    this.elements.modalBody.textContent = `Are you sure you want to send this email to ${draft.fromAddress}? This action cannot be undone.`;
    this.elements.modalConfirm.textContent = 'Send Email';
    this.elements.modalConfirm.className = 'btn-primary';

    this.elements.modalConfirm.onclick = async () => {
      this.closeModal();
      await this.performApprove(draftId);
    };

    this.elements.modalOverlay.style.display = 'flex';
  }

  async performApprove(draftId) {
    try {
      await this.fetchAPI(`/api/v1/queue/drafts/${draftId}/approve`, { method: 'POST' });
      window.dashboardApp?.showToast('Email sent successfully!', 'success');
      await this.loadDrafts();
      await this.loadStats();
    } catch (err) {
      console.error('Approve error:', err);
      window.dashboardApp?.showToast(err.message || 'Failed to send email', 'error');
    }
  }

  editDraft(draftId) {
    const draft = this.currentDrafts.find(d => d.id === draftId);
    if (!draft) return;

    this.elements.editTextarea.value = draft.draftResponse;
    this.elements.editModalSave.onclick = async () => {
      this.closeEditModal();
      await this.performEdit(draftId, this.elements.editTextarea.value);
    };

    this.elements.editModalOverlay.style.display = 'flex';
  }

  async performEdit(draftId, newResponse) {
    try {
      await this.fetchAPI(`/api/v1/queue/drafts/${draftId}/edit`, {
        method: 'POST',
        body: JSON.stringify({ response: newResponse })
      });
      window.dashboardApp?.showToast('Email sent with edited response!', 'success');
      await this.loadDrafts();
      await this.loadStats();
    } catch (err) {
      console.error('Edit error:', err);
      window.dashboardApp?.showToast(err.message || 'Failed to send email', 'error');
    }
  }

  deleteDraft(draftId) {
    const draft = this.currentDrafts.find(d => d.id === draftId);
    if (!draft) return;

    this.elements.modalTitle.textContent = 'Delete Draft';
    this.elements.modalBody.textContent = `Are you sure you want to delete this draft? The email to ${draft.fromAddress} will NOT be sent. You can send a manual reply instead.`;
    this.elements.modalConfirm.textContent = 'Delete';
    this.elements.modalConfirm.className = 'btn-danger';

    this.elements.modalConfirm.onclick = async () => {
      this.closeModal();
      await this.performDelete(draftId);
    };

    this.elements.modalOverlay.style.display = 'flex';
  }

  async performDelete(draftId) {
    try {
      await this.fetchAPI(`/api/v1/queue/drafts/${draftId}/delete`, { method: 'POST' });
      window.dashboardApp?.showToast('Draft deleted', 'info');
      await this.loadDrafts();
      await this.loadStats();
    } catch (err) {
      console.error('Delete error:', err);
      window.dashboardApp?.showToast(err.message || 'Failed to delete draft', 'error');
    }
  }

  async loadStats() {
    try {
      const response = await this.fetchAPI('/api/v1/queue/stats');
      this.updateStats(response.stats);
    } catch (err) {
      console.error('Load stats error:', err);
    }
  }

  updateStats(stats) {
    document.getElementById('count-all').textContent = stats.total;
    document.getElementById('count-pending').textContent = stats.pending;
    document.getElementById('count-sent').textContent = stats.sent;
    document.getElementById('count-deleted').textContent = stats.deleted;
    document.getElementById('count-failed').textContent = stats.failed;

    // Update queue badge
    const badge = document.getElementById('queue-badge');
    if (stats.pending > 0) {
      badge.textContent = stats.pending;
      badge.style.display = 'inline-flex';
    } else {
      badge.style.display = 'none';
    }
  }

  updateBadge(show) {
    const badge = document.getElementById('queue-badge');
    if (show && !this.isActive) {
      badge.style.display = 'inline-flex';
    } else if (!show) {
      badge.style.display = 'none';
    }
  }

  async refresh() {
    await this.loadDrafts();
    await this.loadStats();
    window.dashboardApp?.showToast('Refreshed', 'success');
  }

  closeModal() {
    this.elements.modalOverlay.style.display = 'none';
  }

  closeEditModal() {
    this.elements.editModalOverlay.style.display = 'none';
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

  formatTimeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  formatDateTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString();
  }

  extractEmailName(email) {
    const match = email.match(/^([^<]+)</);
    if (match) {
      return match[1].trim();
    }
    return email.split('@')[0];
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  renderMetadata(metadata) {
    try {
      const meta = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
      return Object.entries(meta).map(([key, value]) => {
        return `<div><strong>${key}:</strong> ${JSON.stringify(value)}</div>`;
      }).join('');
    } catch (err) {
      return 'Invalid metadata';
    }
  }
}

// Export singleton instance
window.queueTab = new QueueTab();
