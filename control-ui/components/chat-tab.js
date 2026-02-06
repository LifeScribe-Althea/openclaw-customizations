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

    // Show a nice interface with option to open chat in new window
    // This approach avoids WebSocket configuration complexity while providing full functionality
    const sessionParam = `agent:${this.currentAgent}:main`;
    const chatUrl = `/?session=${sessionParam}`;

    this.container.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center;
                  height: 100%; background: var(--bg-primary);">
        <div style="text-align: center; max-width: 500px; padding: 2rem;">
          <div style="font-size: 4rem; margin-bottom: 1.5rem;">💬</div>
          <h2 style="font-size: 1.5rem; margin-bottom: 1rem; color: var(--text-primary);">
            Agent Chat
          </h2>
          <p style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 2rem; line-height: 1.6;">
            Chat with ${this.getAgentName(this.currentAgent)} in a dedicated window for the best experience.
            The chat interface includes full conversation history, voice controls, and all agent capabilities.
          </p>
          <button
            onclick="window.open('${chatUrl}', '_blank', 'width=1200,height=800')"
            style="padding: 12px 24px; background: var(--primary); color: white; border: none;
                   border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer;
                   transition: background var(--transition-fast); font-family: inherit;
                   box-shadow: var(--shadow-md);"
            onmouseover="this.style.background='var(--primary-hover)'"
            onmouseout="this.style.background='var(--primary)'">
            Open Chat Window
          </button>
          <p style="font-size: 0.75rem; color: var(--text-tertiary); margin-top: 1.5rem;">
            Or <a href="${chatUrl}" target="_blank" style="color: var(--primary); text-decoration: none;">
            open in new tab</a>
          </p>
        </div>
      </div>
    `;

    // Update URL to reflect agent selection
    const newUrl = `${window.location.pathname}#chat?agent=${this.currentAgent}`;
    window.history.replaceState({}, '', newUrl);

    console.log('✅ Chat UI rendered (new window approach)');
  }

  // Helper to get agent display name
  getAgentName(agentId) {
    const agents = {
      'althea': 'Althea',
      'sage': 'Sage',
      'tally': 'Tally',
      'echo': 'Echo'
    };
    return agents[agentId] || agentId.charAt(0).toUpperCase() + agentId.slice(1);
  }

  // Switch to a different agent
  switchAgent(agentId) {
    console.log('Switching chat to agent:', agentId);
    this.currentAgent = agentId;
    window.stateManager.setCurrentAgent(agentId);

    // Re-render with new agent
    if (this.isActive) {
      this.render();
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
