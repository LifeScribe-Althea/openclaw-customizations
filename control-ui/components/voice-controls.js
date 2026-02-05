// Voice Controls Popover Component
// Provides voice settings in a popover from top nav

class VoiceControls {
  constructor() {
    this.popoverOpen = false;
    this.autoPlayEnabled = true;
    this.speed = 1.0;

    this.elements = {
      button: document.getElementById('voice-btn'),
      popover: document.getElementById('voice-popover')
    };

    this.setupEventListeners();
    this.loadPreferences();
    this.render();
  }

  setupEventListeners() {
    // Toggle popover on button click
    this.elements.button.addEventListener('click', (e) => {
      e.stopPropagation();
      this.togglePopover();
    });

    // Close popover when clicking outside
    document.addEventListener('click', (e) => {
      if (this.popoverOpen && !this.elements.popover.contains(e.target)) {
        this.closePopover();
      }
    });

    // Keyboard shortcut: Esc to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.popoverOpen) {
        this.closePopover();
      }
    });
  }

  render() {
    this.elements.popover.innerHTML = `
      <div class="voice-header">Voice Settings</div>

      <div class="voice-current">
        <span class="voice-name" id="current-voice-display">Loading...</span>
        <span class="voice-indicator" id="speaking-indicator">🔊</span>
      </div>

      <div class="voice-toggles">
        <div class="voice-toggle-row">
          <label>Auto-play responses</label>
          <div class="toggle-switch ${this.autoPlayEnabled ? 'active' : ''}" id="auto-play-toggle"></div>
        </div>

        <div class="voice-toggle-row">
          <label>Speed</label>
          <select class="voice-select" id="voice-speed-select">
            <option value="0.75" ${this.speed === 0.75 ? 'selected' : ''}>0.75x</option>
            <option value="1.0" ${this.speed === 1.0 ? 'selected' : ''}>1.0x</option>
            <option value="1.25" ${this.speed === 1.25 ? 'selected' : ''}>1.25x</option>
            <option value="1.5" ${this.speed === 1.5 ? 'selected' : ''}>1.5x</option>
          </select>
        </div>
      </div>

      <div class="voice-actions">
        <button id="test-voice-btn">Test Voice</button>
      </div>
    `;

    // Setup event listeners for rendered elements
    setTimeout(() => {
      this.setupPopoverListeners();
    }, 0);

    // Update voice display from voiceUI if available
    this.updateVoiceDisplay();
  }

  setupPopoverListeners() {
    // Auto-play toggle
    const autoPlayToggle = document.getElementById('auto-play-toggle');
    if (autoPlayToggle) {
      autoPlayToggle.addEventListener('click', () => {
        this.autoPlayEnabled = !this.autoPlayEnabled;
        autoPlayToggle.classList.toggle('active', this.autoPlayEnabled);

        if (window.voiceUI) {
          window.voiceUI.toggleAutoPlay(this.autoPlayEnabled);
        }

        this.savePreferences();
      });
    }

    // Speed select
    const speedSelect = document.getElementById('voice-speed-select');
    if (speedSelect) {
      speedSelect.addEventListener('change', (e) => {
        this.speed = parseFloat(e.target.value);

        if (window.voiceUI) {
          window.voiceUI.setSpeed(this.speed);
        }

        this.savePreferences();
      });
    }

    // Test voice button
    const testBtn = document.getElementById('test-voice-btn');
    if (testBtn) {
      testBtn.addEventListener('click', () => {
        if (window.voiceUI) {
          window.voiceUI.testVoice();
        } else {
          window.dashboardApp?.showToast('Voice UI not loaded yet', 'info');
        }
      });
    }
  }

  togglePopover() {
    if (this.popoverOpen) {
      this.closePopover();
    } else {
      this.openPopover();
    }
  }

  openPopover() {
    this.elements.popover.style.display = 'block';
    this.popoverOpen = true;
    this.updateVoiceDisplay();
  }

  closePopover() {
    this.elements.popover.style.display = 'none';
    this.popoverOpen = false;
  }

  updateVoiceDisplay() {
    const voiceDisplay = document.getElementById('current-voice-display');
    if (!voiceDisplay) return;

    if (window.voiceUI && window.voiceUI.initialized) {
      const currentVoice = window.voiceUI.getCurrentVoice?.() || 'Unknown';
      voiceDisplay.textContent = currentVoice;
    } else {
      voiceDisplay.textContent = 'Loading...';

      // Keep checking until voiceUI is initialized
      const checkInterval = setInterval(() => {
        if (window.voiceUI && window.voiceUI.initialized) {
          clearInterval(checkInterval);
          const currentVoice = window.voiceUI.getCurrentVoice?.() || 'Anya';
          voiceDisplay.textContent = currentVoice;
        }
      }, 500);

      // Stop checking after 10 seconds
      setTimeout(() => clearInterval(checkInterval), 10000);
    }
  }

  setSpeakingIndicator(speaking) {
    const indicator = document.getElementById('speaking-indicator');
    if (indicator) {
      if (speaking) {
        indicator.classList.add('speaking');
      } else {
        indicator.classList.remove('speaking');
      }
    }
  }

  loadPreferences() {
    try {
      const saved = localStorage.getItem('voiceui-preferences');
      if (saved) {
        const prefs = JSON.parse(saved);
        this.autoPlayEnabled = prefs.autoPlayEnabled ?? true;
        this.speed = prefs.speed ?? 1.0;
      }
    } catch (err) {
      console.error('Failed to load voice preferences:', err);
    }
  }

  savePreferences() {
    try {
      const prefs = {
        autoPlayEnabled: this.autoPlayEnabled,
        speed: this.speed
      };
      localStorage.setItem('voiceui-preferences', JSON.stringify(prefs));
      console.log('Voice preferences saved');
    } catch (err) {
      console.error('Failed to save voice preferences:', err);
    }
  }

  // Initialize voice UI integration
  init() {
    // Listen for voiceUI initialization
    const checkVoiceUI = setInterval(() => {
      if (window.voiceUI && window.voiceUI.initialized) {
        clearInterval(checkVoiceUI);

        // Apply saved preferences
        if (window.voiceUI.toggleAutoPlay) {
          window.voiceUI.toggleAutoPlay(this.autoPlayEnabled);
        }
        if (window.voiceUI.setSpeed) {
          window.voiceUI.setSpeed(this.speed);
        }

        this.updateVoiceDisplay();

        // Listen for speaking state changes
        if (window.voiceUI.onSpeakingStateChange) {
          window.voiceUI.onSpeakingStateChange((speaking) => {
            this.setSpeakingIndicator(speaking);
          });
        }
      }
    }, 500);

    // Stop checking after 10 seconds
    setTimeout(() => clearInterval(checkVoiceUI), 10000);
  }
}

// Export singleton instance
window.voiceControls = new VoiceControls();
