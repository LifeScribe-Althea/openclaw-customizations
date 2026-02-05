// Unified WebSocket Manager for OpenClaw Dashboard
// Manages both Queue Socket.IO and Chat WebSocket connections

class WebSocketManager {
  constructor() {
    this.queueSocket = null;
    this.chatSocket = null;
    this.chatConnected = false;
    this.queueConnected = false;
    this.eventHandlers = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 1000;
  }

  // Event bus for cross-component communication
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(handler);
  }

  emit(event, data) {
    const handlers = this.eventHandlers.get(event) || [];
    handlers.forEach(handler => {
      try {
        handler(data);
      } catch (err) {
        console.error(`Error in event handler for ${event}:`, err);
      }
    });
  }

  // Connect to Queue Socket.IO
  connectQueue(token) {
    if (this.queueSocket?.connected) {
      console.log('Queue socket already connected');
      return;
    }

    const API_BASE = window.location.origin;
    const WS_PATH = '/api/v1/socket.io';

    console.log('Connecting to Queue WebSocket...');

    this.queueSocket = io(API_BASE, {
      path: WS_PATH,
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: this.reconnectDelay,
      reconnectionAttempts: this.maxReconnectAttempts
    });

    this.queueSocket.on('connect', () => {
      console.log('✅ Queue WebSocket connected');
      this.queueConnected = true;
      this.reconnectAttempts = 0;
      this.queueSocket.emit('subscribe:queue');
      this.emit('queue:connected');
    });

    this.queueSocket.on('disconnect', (reason) => {
      console.log('❌ Queue WebSocket disconnected:', reason);
      this.queueConnected = false;
      this.emit('queue:disconnected', reason);

      if (reason === 'io server disconnect') {
        // Server disconnected, attempt manual reconnect
        setTimeout(() => this.queueSocket.connect(), this.reconnectDelay);
      }
    });

    this.queueSocket.on('connect_error', (error) => {
      console.error('Queue WebSocket connection error:', error);
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached for queue socket');
        this.emit('queue:error', 'Connection failed');
      }
    });

    // Queue-specific events
    this.queueSocket.on('draft:new', (draft) => {
      console.log('📧 New draft received:', draft);
      this.emit('draft:new', draft);
    });

    this.queueSocket.on('draft:updated', (draft) => {
      console.log('📝 Draft updated:', draft);
      this.emit('draft:updated', draft);
    });

    this.queueSocket.on('queue:stats', (stats) => {
      this.emit('queue:stats', stats);
    });

    this.queueSocket.on('error', (err) => {
      console.error('Queue WebSocket error:', err);
      this.emit('queue:error', err);
    });
  }

  // Connect to Chat WebSocket
  connectChat() {
    if (this.chatSocket?.readyState === WebSocket.OPEN) {
      console.log('Chat WebSocket already connected');
      return;
    }

    const chatUrl = 'ws://localhost:18789/gateway';
    console.log('Connecting to Chat WebSocket...');

    try {
      this.chatSocket = new WebSocket(chatUrl);

      this.chatSocket.onopen = () => {
        console.log('✅ Chat WebSocket connected');
        this.chatConnected = true;
        this.reconnectAttempts = 0;
        this.emit('chat:connected');
      };

      this.chatSocket.onclose = (event) => {
        console.log('❌ Chat WebSocket closed:', event.code, event.reason);
        this.chatConnected = false;
        this.emit('chat:disconnected', event);

        // Attempt reconnect with exponential backoff
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
          console.log(`Reconnecting chat WebSocket in ${delay}ms...`);
          setTimeout(() => this.connectChat(), delay);
          this.reconnectAttempts++;
        }
      };

      this.chatSocket.onerror = (error) => {
        console.error('Chat WebSocket error:', error);
        this.emit('chat:error', error);
      };

      this.chatSocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.emit('chat:message', data);
        } catch (err) {
          console.error('Failed to parse chat message:', err);
        }
      };

    } catch (err) {
      console.error('Failed to create chat WebSocket:', err);
      this.emit('chat:error', err);
    }
  }

  // Send message to chat WebSocket
  sendChatMessage(message) {
    if (this.chatSocket?.readyState === WebSocket.OPEN) {
      this.chatSocket.send(JSON.stringify(message));
    } else {
      console.error('Chat WebSocket not connected');
      this.emit('chat:error', 'Not connected');
    }
  }

  // Disconnect queue socket
  disconnectQueue() {
    if (this.queueSocket) {
      this.queueSocket.disconnect();
      this.queueSocket = null;
      this.queueConnected = false;
      console.log('Queue WebSocket disconnected');
    }
  }

  // Disconnect chat socket
  disconnectChat() {
    if (this.chatSocket) {
      this.chatSocket.close();
      this.chatSocket = null;
      this.chatConnected = false;
      console.log('Chat WebSocket disconnected');
    }
  }

  // Disconnect all sockets
  disconnectAll() {
    this.disconnectQueue();
    this.disconnectChat();
  }

  // Get connection status
  getStatus() {
    return {
      queue: this.queueConnected,
      chat: this.chatConnected
    };
  }
}

// Export singleton instance
window.websocketManager = new WebSocketManager();
