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

    // Lazy-load Lit bundle if not already loaded
    if (!this.litLoaded) {
      await this.loadLitBundle();
    }

    // Load voice scripts if not already loaded
    if (!this.voiceScriptsLoaded) {
      await this.loadVoiceScripts();
    }

    // Render the chat UI
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

  // Load Lit bundle
  async loadLitBundle() {
    try {
      console.log('Loading Lit bundle...');

      // Check if openclaw-app is already defined
      if (customElements.get('openclaw-app')) {
        console.log('✅ openclaw-app already defined');
        this.litLoaded = true;
        return;
      }

      // Load the Lit bundle (relative to control-ui root, not components dir)
      await import('../assets/index-CXUONUC9.js');

      console.log('✅ Lit bundle loaded');
      this.litLoaded = true;

    } catch (err) {
      console.error('Failed to load Lit bundle:', err);
      this.container.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: var(--text-secondary);">
          <div style="text-align: center;">
            <p style="margin-bottom: 1rem; font-size: 1.5rem;">⚠️</p>
            <p>Failed to load chat interface</p>
            <p style="font-size: 0.875rem; margin-top: 0.5rem;">Please refresh the page</p>
          </div>
        </div>
      `;
    }
  }

  // Load voice scripts
  async loadVoiceScripts() {
    try {
      console.log('Loading voice scripts...');

      // Check if scripts are already loaded
      if (window.voiceUI) {
        console.log('✅ Voice UI already loaded');
        this.voiceScriptsLoaded = true;
        return;
      }

      // Load voice-output.js (relative to control-ui root)
      await this.loadScript('../voice-output.js', 'module');

      // Load voice-ui.js (relative to control-ui root)
      await this.loadScript('../voice-ui.js', 'module');

      console.log('✅ Voice scripts loaded');
      this.voiceScriptsLoaded = true;

    } catch (err) {
      console.error('Failed to load voice scripts:', err);
    }
  }

  // Helper to load script dynamically
  loadScript(src, type = null) {
    return new Promise((resolve, reject) => {
      const existingScript = document.querySelector(`script[src="${src}"]`);
      if (existingScript) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = src;
      if (type) {
        script.type = type;
      }
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }

  // Render the chat interface
  render() {
    // Clear existing content
    this.container.innerHTML = '';

    // Create openclaw-app element
    const app = document.createElement('openclaw-app');
    this.container.appendChild(app);

    // Update URL to reflect agent selection
    const newUrl = `${window.location.pathname}#chat?agent=${this.currentAgent}`;
    window.history.replaceState({}, '', newUrl);

    console.log('✅ Chat UI rendered');
  }

  // Switch to a different agent
  switchAgent(agentId) {
    console.log('Switching chat to agent:', agentId);
    this.currentAgent = agentId;
    window.stateManager.setCurrentAgent(agentId);

    // Update URL
    const newUrl = `${window.location.pathname}#chat?agent=${agentId}`;
    window.history.replaceState({}, '', newUrl);

    // Notify voice UI if available
    if (window.voiceUI) {
      window.voiceUI.switchAgent(agentId);
    }

    // Update agent selector display
    window.agentSelector?.updateCurrentAgent(agentId);

    // Reload chat with new agent (if needed by the Lit component)
    // The openclaw-app component should listen to URL changes or provide an API
    const app = this.container.querySelector('openclaw-app');
    if (app && app.switchAgent) {
      app.switchAgent(agentId);
    }
  }

  // Get current agent
  getCurrentAgent() {
    return this.currentAgent;
  }
}

// Export singleton instance
window.chatTab = new ChatTab();
