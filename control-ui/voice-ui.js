/**
 * Voice UI Controller for OpenClaw Control Interface
 * Manages voice synthesis, playback, and UI integration
 */

import { audioPlayer } from './voice-output.js';

class VoiceUIController {
  constructor() {
    this.voiceConfig = null;
    this.currentAgent = null;
    this.autoPlayEnabled = true;
    this.initialized = false;
    this.gatewayUrl = 'http://localhost:18789';
    this.wsConnection = null;
  }

  /**
   * Initialize the voice UI system
   */
  async init() {
    if (this.initialized) {
      console.log('⚠️ VoiceUI: Already initialized');
      return;
    }

    console.log('🎤 VoiceUI: Initializing...');

    try {
      // Load voice configuration
      await this.loadVoiceConfig();

      // Detect current agent
      this.currentAgent = this.getCurrentAgent();
      console.log('📍 VoiceUI: Current agent:', this.currentAgent);

      // Set up message listener for auto-play
      this.setupMessageListener();

      // Load saved preferences
      this.loadPreferences();

      this.initialized = true;
      console.log('✅ VoiceUI: Initialization complete');

    } catch (error) {
      console.error('❌ VoiceUI: Initialization failed:', error);
    }
  }

  /**
   * Load voice configuration from JSON file
   */
  async loadVoiceConfig() {
    try {
      // Load from customizations directory
      const response = await fetch('/voice-config.json');
      if (!response.ok) {
        throw new Error(`Failed to load voice config: ${response.status}`);
      }

      this.voiceConfig = await response.json();
      console.log('✅ VoiceUI: Voice config loaded:', this.voiceConfig);

    } catch (error) {
      console.error('❌ VoiceUI: Failed to load voice config:', error);
      // Use fallback config
      this.voiceConfig = {
        agents: {
          althea: {
            voiceId: 'c99f388c',
            voiceName: 'Anya',
            settings: { speed: 1.0, precision: 'high' }
          }
        }
      };
    }
  }

  /**
   * Get current agent from URL
   */
  getCurrentAgent() {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionParam = urlParams.get('session');

    if (sessionParam && sessionParam.startsWith('agent:')) {
      const agentId = sessionParam.split(':')[1];
      return agentId;
    }

    return 'althea'; // Default
  }

  /**
   * Get voice configuration for specific agent
   */
  getVoiceConfig(agentId) {
    if (!this.voiceConfig) {
      return null;
    }

    return this.voiceConfig.agents[agentId] || this.voiceConfig.agents['althea'];
  }

  /**
   * Request TTS synthesis from gateway
   */
  async requestTTS(text, agentId) {
    const voiceConfig = this.getVoiceConfig(agentId);
    if (!voiceConfig) {
      console.error('❌ VoiceUI: No voice config for agent:', agentId);
      return null;
    }

    console.log('🎤 VoiceUI: Requesting TTS for agent:', agentId);

    // Add voice directive to text
    const textWithDirective = `[[tts:provider=resemble]][[tts:resemble_voice=${voiceConfig.voiceId}]]${text}`;

    try {
      // Call TTS RPC method via HTTP
      const response = await fetch(`${this.gatewayUrl}/rpc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer 2eaee38fe0dd571bb47767aa6d2717082b4c742e21897a27'
        },
        body: JSON.stringify({
          method: 'tts.convert',
          params: {
            text: textWithDirective,
            channel: 'web'
          },
          id: Date.now()
        })
      });

      if (!response.ok) {
        throw new Error(`TTS request failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.result && data.result.audioPath) {
        // Convert file path to URL
        const audioUrl = `${this.gatewayUrl}/audio${data.result.audioPath}`;
        console.log('✅ VoiceUI: TTS successful, audio URL:', audioUrl);
        return audioUrl;
      } else {
        throw new Error('No audioPath in TTS response');
      }

    } catch (error) {
      console.error('❌ VoiceUI: TTS request failed:', error);
      return null;
    }
  }

  /**
   * Play audio for given text
   */
  async speak(text, agentId = null) {
    const agent = agentId || this.currentAgent;

    try {
      const audioUrl = await this.requestTTS(text, agent);
      if (audioUrl) {
        const voiceConfig = this.getVoiceConfig(agent);
        await audioPlayer.play(audioUrl, {
          speed: voiceConfig?.settings?.speed || 1.0
        });
      }
    } catch (error) {
      console.error('❌ VoiceUI: Speak failed:', error);
    }
  }

  /**
   * Set up message listener for auto-play
   */
  setupMessageListener() {
    console.log('👂 VoiceUI: Setting up message listener');

    // Observe chat message container for new messages
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            this.handleNewNode(node);
          }
        });
      });
    });

    // Wait for openclaw-app to be available
    const checkForApp = setInterval(() => {
      const app = document.querySelector('openclaw-app');
      if (app) {
        clearInterval(checkForApp);

        // Observe the shadow DOM
        const shadowRoot = app.shadowRoot;
        if (shadowRoot) {
          // Find message container in shadow DOM
          const messageContainer = shadowRoot.querySelector('[data-messages]') ||
                                   shadowRoot.querySelector('.messages') ||
                                   shadowRoot.querySelector('.message-list');

          if (messageContainer) {
            console.log('✅ VoiceUI: Found message container, observing for new messages');
            observer.observe(messageContainer, {
              childList: true,
              subtree: true
            });
          } else {
            // Observe entire shadow root
            console.log('⚠️ VoiceUI: Message container not found, observing shadow root');
            observer.observe(shadowRoot, {
              childList: true,
              subtree: true
            });
          }
        }
      }
    }, 500);

    // Stop checking after 10 seconds
    setTimeout(() => clearInterval(checkForApp), 10000);
  }

  /**
   * Handle new DOM node
   */
  handleNewNode(node) {
    // Check if this is a message node
    if (this.isAssistantMessage(node)) {
      this.handleNewMessage(node);
    }

    // Also check children
    if (node.querySelectorAll) {
      const messages = node.querySelectorAll('[data-role="assistant"], .message--assistant');
      messages.forEach(msg => this.handleNewMessage(msg));
    }
  }

  /**
   * Check if node is an assistant message
   */
  isAssistantMessage(node) {
    if (!node.classList) return false;

    return node.dataset?.role === 'assistant' ||
           node.classList.contains('message--assistant') ||
           node.classList.contains('assistant-message');
  }

  /**
   * Handle new assistant message
   */
  async handleNewMessage(messageNode) {
    if (!this.autoPlayEnabled) {
      console.log('🔇 VoiceUI: Auto-play disabled, skipping message');
      return;
    }

    console.log('📨 VoiceUI: New assistant message detected');

    // Extract message text
    const text = this.extractMessageText(messageNode);
    if (!text || text.trim().length === 0) {
      console.log('⚠️ VoiceUI: Empty message, skipping');
      return;
    }

    // Limit text length for TTS (max ~500 chars for reasonable audio length)
    const maxLength = 500;
    const truncatedText = text.length > maxLength
      ? text.substring(0, maxLength) + '...'
      : text;

    console.log('🎤 VoiceUI: Auto-playing message:', truncatedText.substring(0, 50) + '...');

    // Play audio
    await this.speak(truncatedText);
  }

  /**
   * Extract text from message node
   */
  extractMessageText(node) {
    // Try different methods to extract text
    if (node.textContent) {
      return node.textContent.trim();
    }

    // Look for text in common message structures
    const textElements = node.querySelectorAll('.message-text, .message-content, p');
    if (textElements.length > 0) {
      return Array.from(textElements)
        .map(el => el.textContent)
        .join(' ')
        .trim();
    }

    return '';
  }

  /**
   * Switch to different agent
   */
  switchAgent(agentId) {
    console.log('🔄 VoiceUI: Switching to agent:', agentId);
    this.currentAgent = agentId;

    // Update voice name display
    this.updateVoiceDisplay();
  }

  /**
   * Update voice name display in UI
   */
  updateVoiceDisplay() {
    const voiceConfig = this.getVoiceConfig(this.currentAgent);
    const voiceNameEl = document.getElementById('current-voice-name');

    if (voiceNameEl && voiceConfig) {
      voiceNameEl.textContent = voiceConfig.voiceName;
    }
  }

  /**
   * Toggle auto-play
   */
  toggleAutoPlay(enabled) {
    this.autoPlayEnabled = enabled;
    this.savePreferences();
    console.log('🔊 VoiceUI: Auto-play', enabled ? 'enabled' : 'disabled');
  }

  /**
   * Set playback speed
   */
  setSpeed(speed) {
    audioPlayer.setSpeed(speed);
    this.savePreferences();
    console.log('⚡ VoiceUI: Speed set to', speed);
  }

  /**
   * Test current voice
   */
  async testVoice() {
    const voiceConfig = this.getVoiceConfig(this.currentAgent);
    if (!voiceConfig) {
      console.error('❌ VoiceUI: No voice config');
      return;
    }

    const testText = `Hello! I'm ${voiceConfig.voiceName}, the voice of ${this.currentAgent}. This is a test of the text-to-speech system.`;

    console.log('🧪 VoiceUI: Testing voice');
    await this.speak(testText);
  }

  /**
   * Save preferences to localStorage
   */
  savePreferences() {
    const prefs = {
      autoPlayEnabled: this.autoPlayEnabled,
      speed: audioPlayer.currentSpeed
    };

    localStorage.setItem('voiceui-preferences', JSON.stringify(prefs));
  }

  /**
   * Load preferences from localStorage
   */
  loadPreferences() {
    try {
      const saved = localStorage.getItem('voiceui-preferences');
      if (saved) {
        const prefs = JSON.parse(saved);
        this.autoPlayEnabled = prefs.autoPlayEnabled ?? true;
        audioPlayer.setSpeed(prefs.speed ?? 1.0);

        console.log('✅ VoiceUI: Preferences loaded:', prefs);
      }
    } catch (error) {
      console.error('❌ VoiceUI: Failed to load preferences:', error);
    }
  }
}

// Create singleton instance
export const voiceUI = new VoiceUIController();

// Export for global access
window.voiceUI = voiceUI;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => voiceUI.init(), 1000);
  });
} else {
  setTimeout(() => voiceUI.init(), 1000);
}

console.log('✅ VoiceUI module loaded');
