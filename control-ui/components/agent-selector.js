// Agent Selector Dropdown Component
// Converts the fixed sidebar into a dropdown for top nav

class AgentSelector {
  constructor() {
    this.agents = [
      { id: 'althea', name: 'Althea', emoji: '🌸', description: 'Team Lead', email: 'althea@trylifescribe.com' },
      { id: 'sage', name: 'Sage', emoji: '🌿', description: 'Customer Support', email: 'sage@trylifescribe.com' },
      { id: 'tally', name: 'Tally', emoji: '📊', description: 'Finance', email: 'tally@trylifescribe.com' },
      { id: 'echo', name: 'Echo', emoji: '🔊', description: 'Marketing', email: 'echo@trylifescribe.com' },
      { id: 'team', name: 'Team', emoji: '👥', description: 'All Agents', email: null }
    ];

    this.currentAgent = 'althea';
    this.dropdownOpen = false;

    this.elements = {
      button: document.getElementById('agent-selector-btn'),
      dropdown: document.getElementById('agent-dropdown'),
      currentEmoji: document.getElementById('current-agent-emoji'),
      currentName: document.getElementById('current-agent-name')
    };

    this.setupEventListeners();
    this.render();
  }

  setupEventListeners() {
    // Toggle dropdown on button click
    this.elements.button.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleDropdown();
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (this.dropdownOpen && !this.elements.dropdown.contains(e.target)) {
        this.closeDropdown();
      }
    });

    // Keyboard shortcut: Cmd/Ctrl + A
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'a' && !e.shiftKey) {
        const activeElement = document.activeElement;
        if (activeElement.tagName !== 'INPUT' && activeElement.tagName !== 'TEXTAREA') {
          e.preventDefault();
          this.toggleDropdown();
        }
      }
    });
  }

  render() {
    this.elements.dropdown.innerHTML = '';

    this.agents.forEach(agent => {
      const item = document.createElement('div');
      item.className = 'agent-list-item';
      if (agent.id === this.currentAgent) {
        item.classList.add('active');
      }

      item.innerHTML = `
        <span class="agent-emoji">${agent.emoji}</span>
        <div class="agent-info">
          <div class="name">${agent.name}</div>
          <div class="description">${agent.description}</div>
          ${agent.email ? `<div class="agent-stats" id="agent-stats-${agent.id}">Loading stats...</div>` : ''}
        </div>
      `;

      item.addEventListener('click', () => {
        this.selectAgent(agent.id);
      });

      this.elements.dropdown.appendChild(item);

      // Fetch Gmail stats for agents with email
      if (agent.email) {
        this.fetchGmailStats(agent.id, agent.email);
      }
    });
  }

  toggleDropdown() {
    if (this.dropdownOpen) {
      this.closeDropdown();
    } else {
      this.openDropdown();
    }
  }

  openDropdown() {
    this.elements.dropdown.style.display = 'block';
    this.dropdownOpen = true;

    // Refresh stats when opening
    this.agents.forEach(agent => {
      if (agent.email) {
        this.fetchGmailStats(agent.id, agent.email);
      }
    });
  }

  closeDropdown() {
    this.elements.dropdown.style.display = 'none';
    this.dropdownOpen = false;
  }

  selectAgent(agentId) {
    console.log('Agent selected:', agentId);
    this.currentAgent = agentId;
    this.updateCurrentAgent(agentId);
    this.closeDropdown();

    // Update chat tab if it's active
    const currentTab = window.dashboardApp?.getCurrentTab();
    if (currentTab === 'chat') {
      window.chatTab?.switchAgent(agentId);
    } else {
      // Just save the preference for when chat tab is activated
      window.stateManager.setCurrentAgent(agentId);
    }

    // Re-render to update active state
    this.render();
  }

  updateCurrentAgent(agentId) {
    const agent = this.agents.find(a => a.id === agentId);
    if (agent) {
      this.currentAgent = agentId;
      this.elements.currentEmoji.textContent = agent.emoji;
      this.elements.currentName.textContent = agent.name;
    }
  }

  getCurrentAgent() {
    return this.currentAgent;
  }

  async fetchGmailStats(agentId, agentEmail) {
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '/');

    try {
      // Fetch unread count
      const unreadResponse = await fetch('http://localhost:18789/tools/invoke', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer 2eaee38fe0dd571bb47767aa6d2717082b4c742e21897a27',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tool: 'gmail_search',
          args: {
            query: 'is:unread in:inbox',
            maxResults: 100
          },
          sessionKey: `agent:${agentId}:main`
        })
      });

      const unreadData = await unreadResponse.json();
      let unreadCount = 0;
      if (unreadData.ok && unreadData.result?.content?.[0]?.text) {
        const match = unreadData.result.content[0].text.match(/(\d+)\s+message/);
        unreadCount = match ? parseInt(match[1]) : 0;
      }

      // Fetch sent today count
      const sentResponse = await fetch('http://localhost:18789/tools/invoke', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer 2eaee38fe0dd571bb47767aa6d2717082b4c742e21897a27',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tool: 'gmail_search',
          args: {
            query: `from:${agentEmail} after:${today}`,
            maxResults: 100
          },
          sessionKey: `agent:${agentId}:main`
        })
      });

      const sentData = await sentResponse.json();
      let sentCount = 0;
      if (sentData.ok && sentData.result?.content?.[0]?.text) {
        const match = sentData.result.content[0].text.match(/(\d+)\s+message/);
        sentCount = match ? parseInt(match[1]) : 0;
      }

      // Update stats display
      const statsElem = document.getElementById(`agent-stats-${agentId}`);
      if (statsElem) {
        statsElem.innerHTML = `
          📧 ${unreadCount} unread • 📤 ${sentCount} sent today
        `;
      }

    } catch (error) {
      console.error(`Failed to fetch Gmail stats for ${agentId}:`, error);
      const statsElem = document.getElementById(`agent-stats-${agentId}`);
      if (statsElem) {
        statsElem.innerHTML = '⚙️ Setup Gmail';
      }
    }
  }

  // Initialize from saved state
  init() {
    const savedAgent = window.stateManager.getCurrentAgent();
    if (savedAgent) {
      this.updateCurrentAgent(savedAgent);
      this.render();
    }
  }
}

// Export singleton instance
window.agentSelector = new AgentSelector();
