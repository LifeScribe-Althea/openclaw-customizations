// Agent Selector for OpenClaw Control UI
// Injects agent selection buttons into the sidebar

(function() {
  'use strict';

  console.log('🌸 Agent Selector loading...');

  // Agent configuration
  const agents = [
    { id: 'althea', name: 'Althea', emoji: '🌸', description: 'Team Lead', email: 'althea@trylifescribe.com' },
    { id: 'sage', name: 'Sage', emoji: '🌿', description: 'Customer Support', email: 'sage@trylifescribe.com' },
    { id: 'tally', name: 'Tally', emoji: '📊', description: 'Finance', email: 'tally@trylifescribe.com' },
    { id: 'echo', name: 'Echo', emoji: '🔊', description: 'Marketing', email: 'echo@trylifescribe.com' },
    { id: 'team', name: 'Team', emoji: '👥', description: 'All Agents', email: null }
  ];

  // Get current agent from URL
  function getCurrentAgent() {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionParam = urlParams.get('session');
    if (sessionParam && sessionParam.startsWith('agent:')) {
      const agentId = sessionParam.split(':')[1];
      return agentId;
    }
    return 'althea';
  }

  // Switch to a different agent
  function switchAgent(agentId) {
    const newUrl = `${window.location.origin}/chat?session=agent:${agentId}:main`;
    window.location.href = newUrl;
  }

  // Fetch Gmail statistics for an agent
  async function fetchGmailStats(agentId, agentEmail) {
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

      return { unread: unreadCount, sent: sentCount };
    } catch (error) {
      console.error(`Failed to fetch Gmail stats for ${agentId}:`, error);
      return null;
    }
  }

  // Inject CSS styles
  function injectStyles() {
    const style = document.createElement('style');
    style.id = 'agent-selector-styles';
    style.textContent = `
      .agent-selector-wrapper {
        position: fixed !important;
        left: 0 !important;
        top: 60px !important;
        width: 200px !important;
        background: #2a2a2a !important;
        border-right: 2px solid #4a9eff !important;
        padding: 16px 8px !important;
        z-index: 99999 !important;
        max-height: calc(100vh - 60px) !important;
        overflow-y: auto !important;
        box-shadow: 2px 0 10px rgba(0,0,0,0.5) !important;
      }

      .agent-selector-label {
        font-size: 10px !important;
        font-weight: 700 !important;
        text-transform: uppercase !important;
        letter-spacing: 1px !important;
        color: #4a9eff !important;
        margin-bottom: 12px !important;
        padding: 0 8px !important;
        display: block !important;
      }

      .agent-button {
        display: flex !important;
        align-items: center !important;
        gap: 12px !important;
        padding: 12px 10px !important;
        margin-bottom: 6px !important;
        background: #1a1a1a !important;
        border: 1px solid #3a3a3a !important;
        border-radius: 8px !important;
        cursor: pointer !important;
        width: 100% !important;
        text-align: left !important;
        color: #e0e0e0 !important;
        font-size: 14px !important;
        transition: all 0.2s ease !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
      }

      .agent-button:hover {
        background: var(--bg-hover, rgba(255, 255, 255, 0.08));
        transform: translateX(2px);
      }

      .agent-button.active {
        background: #2d7ff9 !important;
        color: white !important;
        font-weight: 600 !important;
        box-shadow: 0 2px 8px rgba(45, 127, 249, 0.5) !important;
        border-color: #4a9eff !important;
      }

      .agent-emoji {
        font-size: 20px;
        line-height: 1;
        min-width: 24px;
        text-align: center;
      }

      .agent-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 3px;
        min-width: 0;
      }

      .agent-name {
        font-weight: 500;
        font-size: 14px;
        line-height: 1.2;
      }

      .agent-description {
        font-size: 11px;
        opacity: 0.7;
        line-height: 1.2;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .agent-button.active .agent-description {
        opacity: 0.95;
      }

      .agent-stats {
        font-size: 10px !important;
        line-height: 1.3 !important;
        margin-top: 4px !important;
        padding-top: 4px !important;
        border-top: 1px solid rgba(255,255,255,0.1) !important;
        color: #888 !important;
      }

      .agent-stats.loading {
        color: #666 !important;
        font-style: italic !important;
      }

      .agent-stats-item {
        display: inline-block !important;
        margin-right: 8px !important;
      }

      .agent-stats-count {
        color: #4a9eff !important;
        font-weight: 600 !important;
      }

      /* Adjust main content to not overlap */
      openclaw-app {
        margin-left: 200px;
      }
    `;
    document.head.appendChild(style);
    console.log('✅ Agent selector styles injected');
  }

  // Create agent selector UI
  function createAgentSelector() {
    console.log('🔨 Creating agent selector UI...');

    const wrapper = document.createElement('div');
    wrapper.className = 'agent-selector-wrapper';
    wrapper.id = 'agent-selector';

    const label = document.createElement('div');
    label.className = 'agent-selector-label';
    label.textContent = 'Select Agent';
    wrapper.appendChild(label);

    const currentAgent = getCurrentAgent();
    console.log('📍 Current agent:', currentAgent);

    agents.forEach(agent => {
      const button = document.createElement('button');
      button.className = 'agent-button';
      if (agent.id === currentAgent) {
        button.classList.add('active');
        console.log('✨ Active agent:', agent.name);
      }

      button.innerHTML = `
        <span class="agent-emoji">${agent.emoji}</span>
        <div class="agent-info">
          <span class="agent-name">${agent.name}</span>
          <span class="agent-description">${agent.description}</span>
          <span class="agent-stats loading" id="stats-${agent.id}">
            ${agent.email ? 'Loading stats...' : ''}
          </span>
        </div>
      `;

      button.addEventListener('click', () => {
        if (agent.id !== currentAgent) {
          console.log('🔄 Switching to agent:', agent.name);
          switchAgent(agent.id);
        }
      });

      wrapper.appendChild(button);

      // Fetch and update Gmail stats if agent has email
      if (agent.email) {
        fetchGmailStats(agent.id, agent.email).then(stats => {
          const statsElem = document.getElementById(`stats-${agent.id}`);
          if (stats && statsElem) {
            statsElem.classList.remove('loading');
            statsElem.innerHTML = `
              <span class="agent-stats-item">
                📧 <span class="agent-stats-count">${stats.unread}</span> unread
              </span>
              <span class="agent-stats-item">
                📤 <span class="agent-stats-count">${stats.sent}</span> sent today
              </span>
            `;
          } else if (statsElem) {
            statsElem.classList.remove('loading');
            statsElem.innerHTML = '<span style="color: #f90">⚙️ Setup Gmail</span>';
          }
        });
      }
    });

    console.log('✅ Agent selector UI created');
    return wrapper;
  }

  // Inject the agent selector
  function injectAgentSelector() {
    console.log('💉 Injecting agent selector...');

    // Remove any existing selector
    const existing = document.getElementById('agent-selector');
    if (existing) {
      existing.remove();
      console.log('🗑️  Removed existing selector');
    }

    // Create and inject new selector
    const selector = createAgentSelector();
    document.body.appendChild(selector);
    console.log('✅ Agent selector injected into body');
  }

  // Initialize
  function init() {
    console.log('🚀 Initializing agent selector...');

    injectStyles();

    // Wait for page to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(injectAgentSelector, 500);
      });
    } else {
      setTimeout(injectAgentSelector, 500);
    }

    console.log('✅ Agent selector initialized');
  }

  // Run initialization
  init();

  // Refresh Gmail stats every 2 minutes
  setInterval(() => {
    agents.forEach(agent => {
      if (agent.email) {
        fetchGmailStats(agent.id, agent.email).then(stats => {
          const statsElem = document.getElementById(`stats-${agent.id}`);
          if (stats && statsElem) {
            statsElem.classList.remove('loading');
            statsElem.innerHTML = `
              <span class="agent-stats-item">
                📧 <span class="agent-stats-count">${stats.unread}</span> unread
              </span>
              <span class="agent-stats-item">
                📤 <span class="agent-stats-count">${stats.sent}</span> sent today
              </span>
            `;
          }
        });
      }
    });
  }, 120000); // 2 minutes
})();
