// Chat Tab Component
// Wraps the Lit <openclaw-app> element with lazy loading

class ChatTab {
  constructor() {
    this.container = document.querySelector('#tab-content-chat .chat-content');
    this.litLoaded = false;
    this.voiceScriptsLoaded = false;
    this.isActive = false;
    this.currentAgent = 'althea';
  }

  // Lifecycle: Tab activated
  async onActivate(agentId = 'althea') {
    console.log('Chat tab activated with agent:', agentId);
    this.isActive = true;
    this.currentAgent = agentId;

    // Save agent to state
    window.stateManager.setCurrentAgent(agentId);

    // Render the chat UI (using iframe approach)
    this.render();

    // Update agent selector
    window.agentSelector?.updateCurrentAgent(agentId);
  }

  // Lifecycle: Tab deactivated
  onDeactivate() {
    console.log('Chat tab deactivated');
    this.isActive = false;

    // Save scroll position if needed
    const scrollPosition = this.container.scrollTop || 0;
    window.stateManager.setChatScrollPosition(scrollPosition);
  }

  // Show error message when chat fails to load
  showError() {
    this.container.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center;
                  height: 100%; color: var(--text-secondary);">
        <div style="text-align: center; max-width: 400px;">
          <p style="font-size: 2rem; margin-bottom: 1rem;">💬</p>
          <h3 style="margin-bottom: 0.5rem; color: var(--text-primary);">Chat Unavailable</h3>
          <p style="font-size: 0.875rem; margin-bottom: 1rem;">
            Unable to connect to the chat service.
          </p>
          <a href="/" target="_blank"
             style="color: var(--primary); text-decoration: none; font-weight: 500;">
            Open chat in new window →
          </a>
        </div>
      </div>
    `;
  }

  // Render the chat interface
  render() {
    // Clear existing content
    this.container.innerHTML = '';

    // Use iframe approach to embed the standalone chat
    const sessionParam = `agent:${this.currentAgent}:main`;
    const iframe = document.createElement('iframe');
    iframe.src = `/?session=${sessionParam}`;
    iframe.style.cssText = 'width: 100%; height: 100%; border: none;';
    iframe.title = 'Agent Chat';

    // Add error handling
    iframe.onerror = () => {
      console.error('Failed to load chat iframe');
      this.showError();
    };

    this.container.appendChild(iframe);

    // Update URL to reflect agent selection
    const newUrl = `${window.location.pathname}#chat?agent=${this.currentAgent}`;
    window.history.replaceState({}, '', newUrl);

    console.log('✅ Chat UI rendered (iframe approach)');
  }

  // Switch to a different agent
  switchAgent(agentId) {
    console.log('Switching chat to agent:', agentId);
    this.currentAgent = agentId;
    window.stateManager.setCurrentAgent(agentId);

    // Update URL
    const newUrl = `${window.location.pathname}#chat?agent=${agentId}`;
    window.history.replaceState({}, '', newUrl);

    // Update iframe src with new agent
    const iframe = this.container.querySelector('iframe');
    if (iframe) {
      const sessionParam = `agent:${agentId}:main`;
      iframe.src = `/?session=${sessionParam}`;
    }

    // Update agent selector display
    window.agentSelector?.updateCurrentAgent(agentId);
  }

  // Get current agent
  getCurrentAgent() {
    return this.currentAgent;
  }
}

// Export singleton instance
window.chatTab = new ChatTab();
