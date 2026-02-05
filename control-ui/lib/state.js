// State Management for OpenClaw Dashboard
// Handles state persistence and restoration across tab switches

class StateManager {
  constructor() {
    this.state = {
      currentTab: 'queue',
      queue: {
        filter: 'all',
        selectedDraftId: null,
        scrollPosition: 0,
        searchQuery: ''
      },
      chat: {
        currentAgent: 'althea',
        scrollPosition: 0
      }
    };

    this.debounceTimer = null;
    this.debounceDelay = 500; // ms
  }

  // Initialize from localStorage
  init() {
    try {
      const saved = localStorage.getItem('openclaw_dashboard_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.state = { ...this.state, ...parsed };
        console.log('✅ State restored from localStorage:', this.state);
      }
    } catch (err) {
      console.error('Failed to restore state:', err);
    }
    return this.state;
  }

  // Get current state
  getState() {
    return { ...this.state };
  }

  // Update state (with debounced save)
  setState(updates) {
    this.state = { ...this.state, ...updates };
    this.debouncedSave();
  }

  // Update queue state
  setQueueState(updates) {
    this.state.queue = { ...this.state.queue, ...updates };
    this.debouncedSave();
  }

  // Update chat state
  setChatState(updates) {
    this.state.chat = { ...this.state.chat, ...updates };
    this.debouncedSave();
  }

  // Set current tab
  setCurrentTab(tab) {
    this.state.currentTab = tab;
    this.debouncedSave();
  }

  // Set queue filter
  setQueueFilter(filter) {
    this.state.queue.filter = filter;
    this.debouncedSave();
  }

  // Set selected draft
  setSelectedDraft(draftId) {
    this.state.queue.selectedDraftId = draftId;
    this.debouncedSave();
  }

  // Set queue scroll position
  setQueueScrollPosition(position) {
    this.state.queue.scrollPosition = position;
    this.debouncedSave();
  }

  // Set search query
  setSearchQuery(query) {
    this.state.queue.searchQuery = query;
    this.debouncedSave();
  }

  // Set current agent
  setCurrentAgent(agentId) {
    this.state.chat.currentAgent = agentId;
    this.debouncedSave();
  }

  // Set chat scroll position
  setChatScrollPosition(position) {
    this.state.chat.scrollPosition = position;
    this.debouncedSave();
  }

  // Save to localStorage (debounced)
  debouncedSave() {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.save();
    }, this.debounceDelay);
  }

  // Save immediately
  save() {
    try {
      localStorage.setItem('openclaw_dashboard_state', JSON.stringify(this.state));
      console.log('💾 State saved to localStorage');
    } catch (err) {
      console.error('Failed to save state:', err);
    }
  }

  // Clear all state
  clear() {
    this.state = {
      currentTab: 'queue',
      queue: {
        filter: 'all',
        selectedDraftId: null,
        scrollPosition: 0,
        searchQuery: ''
      },
      chat: {
        currentAgent: 'althea',
        scrollPosition: 0
      }
    };
    localStorage.removeItem('openclaw_dashboard_state');
    console.log('🗑️ State cleared');
  }

  // Get specific state values
  getCurrentTab() {
    return this.state.currentTab;
  }

  getQueueFilter() {
    return this.state.queue.filter;
  }

  getSelectedDraft() {
    return this.state.queue.selectedDraftId;
  }

  getQueueScrollPosition() {
    return this.state.queue.scrollPosition;
  }

  getSearchQuery() {
    return this.state.queue.searchQuery;
  }

  getCurrentAgent() {
    return this.state.chat.currentAgent;
  }

  getChatScrollPosition() {
    return this.state.chat.scrollPosition;
  }
}

// Export singleton instance
window.stateManager = new StateManager();
