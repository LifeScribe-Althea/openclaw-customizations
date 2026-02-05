/**
 * Audio Player Module for OpenClaw Voice Interface
 * Handles audio playback, queue management, and UI indicators
 */

export class AudioPlayer {
  constructor() {
    this.audio = null;
    this.isPlaying = false;
    this.queue = [];
    this.currentSpeed = 1.0;
  }

  /**
   * Play audio from URL
   * @param {string} audioUrl - URL to audio file
   * @param {Object} options - Playback options
   * @param {number} options.speed - Playback speed (0.5 - 2.0)
   * @returns {Promise<void>}
   */
  async play(audioUrl, options = {}) {
    // Stop current playback if any
    if (this.audio) {
      this.stop();
    }

    console.log('🔊 AudioPlayer: Playing audio:', audioUrl);

    // Create new Audio element
    this.audio = new Audio(audioUrl);

    // Apply speed setting
    const speed = options.speed || this.currentSpeed;
    this.audio.playbackRate = speed;

    // Set up event listeners
    this.audio.addEventListener('play', () => {
      console.log('▶️ AudioPlayer: Playback started');
      this.isPlaying = true;
      this.showSpeakingIndicator();
      this.dispatchEvent('play');
    });

    this.audio.addEventListener('ended', () => {
      console.log('⏹️ AudioPlayer: Playback ended');
      this.isPlaying = false;
      this.hideSpeakingIndicator();
      this.dispatchEvent('ended');
      this.playNextInQueue();
    });

    this.audio.addEventListener('error', (e) => {
      console.error('❌ AudioPlayer: Playback error:', e);
      this.isPlaying = false;
      this.hideSpeakingIndicator();
      this.dispatchEvent('error', { error: e });
    });

    this.audio.addEventListener('pause', () => {
      console.log('⏸️ AudioPlayer: Playback paused');
      this.isPlaying = false;
      this.hideSpeakingIndicator();
      this.dispatchEvent('pause');
    });

    // Start playback
    try {
      await this.audio.play();
    } catch (error) {
      console.error('❌ AudioPlayer: Failed to play audio:', error);
      this.isPlaying = false;
      this.hideSpeakingIndicator();
      throw error;
    }
  }

  /**
   * Pause current playback
   */
  pause() {
    if (this.audio && this.isPlaying) {
      this.audio.pause();
    }
  }

  /**
   * Resume playback
   */
  resume() {
    if (this.audio && !this.isPlaying) {
      this.audio.play().catch(err => {
        console.error('❌ AudioPlayer: Failed to resume:', err);
      });
    }
  }

  /**
   * Stop playback and reset
   */
  stop() {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.audio = null;
      this.isPlaying = false;
      this.hideSpeakingIndicator();
    }
  }

  /**
   * Set playback speed
   * @param {number} speed - Speed multiplier (0.5 - 2.0)
   */
  setSpeed(speed) {
    this.currentSpeed = speed;
    if (this.audio) {
      this.audio.playbackRate = speed;
    }
  }

  /**
   * Add audio to queue
   * @param {string} audioUrl - URL to audio file
   */
  addToQueue(audioUrl) {
    console.log('📝 AudioPlayer: Added to queue:', audioUrl);
    this.queue.push(audioUrl);
  }

  /**
   * Play next audio in queue
   */
  async playNextInQueue() {
    if (this.queue.length > 0) {
      const nextUrl = this.queue.shift();
      console.log('⏭️ AudioPlayer: Playing next in queue');
      await this.play(nextUrl);
    }
  }

  /**
   * Clear the playback queue
   */
  clearQueue() {
    console.log('🗑️ AudioPlayer: Clearing queue');
    this.queue = [];
  }

  /**
   * Show speaking indicator in UI
   */
  showSpeakingIndicator() {
    const indicator = document.getElementById('speaking-indicator');
    if (indicator) {
      indicator.classList.add('speaking');
      indicator.style.display = 'inline-block';
    }
  }

  /**
   * Hide speaking indicator in UI
   */
  hideSpeakingIndicator() {
    const indicator = document.getElementById('speaking-indicator');
    if (indicator) {
      indicator.classList.remove('speaking');
      indicator.style.display = 'none';
    }
  }

  /**
   * Dispatch custom event
   * @param {string} eventName - Name of event
   * @param {Object} detail - Event detail data
   */
  dispatchEvent(eventName, detail = {}) {
    const event = new CustomEvent(`audioplayer:${eventName}`, {
      detail: detail,
      bubbles: true
    });
    document.dispatchEvent(event);
  }

  /**
   * Get current playback state
   * @returns {Object} Current state
   */
  getState() {
    return {
      isPlaying: this.isPlaying,
      queueLength: this.queue.length,
      currentSpeed: this.currentSpeed,
      currentTime: this.audio?.currentTime || 0,
      duration: this.audio?.duration || 0
    };
  }
}

// Create singleton instance
export const audioPlayer = new AudioPlayer();

// Export for global access
window.audioPlayer = audioPlayer;

console.log('✅ AudioPlayer module loaded');
