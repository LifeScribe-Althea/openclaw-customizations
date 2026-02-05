# Voice Interface Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Browser (Control UI)                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────┐      ┌──────────────────┐                    │
│  │  Agent Selector  │      │   Voice UI       │                    │
│  │                  │      │   Controller     │                    │
│  │  • Agent List    │◄────►│   (voice-ui.js)  │                    │
│  │  • Voice Controls│      │                  │                    │
│  │  • Test Button   │      │  • Load Config   │                    │
│  │  • Speed Select  │      │  • TTS Requests  │                    │
│  │  • Auto-play     │      │  • Agent Switch  │                    │
│  └──────────────────┘      └────────┬─────────┘                    │
│                                     │                                │
│                              ┌──────▼─────────┐                     │
│                              │  Audio Player  │                     │
│                              │  (voice-output)│                     │
│                              │                │                     │
│                              │  • Play/Pause  │                     │
│                              │  • Queue Mgmt  │                     │
│                              │  • Speed Ctrl  │                     │
│                              │  • Indicators  │                     │
│                              └────────┬───────┘                     │
│                                       │                              │
│                                       │ HTML5 Audio                  │
│                                       ▼                              │
│                              ┌─────────────────┐                    │
│                              │  Browser Audio  │                    │
│                              │  (<audio> tag)  │                    │
│                              └─────────────────┘                    │
│                                                                       │
└───────────────────────────────────┬───────────────────────────────┘
                                     │
                                     │ HTTP/WebSocket
                                     │
┌────────────────────────────────────▼──────────────────────────────┐
│                     OpenClaw Gateway (Node.js)                     │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                    TTS System (tts.js)                       │ │
│  │                                                              │ │
│  │  • Provider Selection  (openai, elevenlabs, edge, resemble) │ │
│  │  • Directive Parsing   [[tts:provider=...]]                 │ │
│  │  • Voice Override      [[tts:resemble_voice=...]]           │ │
│  │  • Audio File Mgmt     (/tmp/openclaw-tts-*.mp3)            │ │
│  │  • Fallback Logic                                           │ │
│  └────────────────┬─────────────────────────────────────────────┘ │
│                   │                                                 │
│                   ▼                                                 │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │              Resemble.ai Provider                            │ │
│  │              (providers/resemble.js)                         │ │
│  │                                                              │ │
│  │  • API Authentication                                        │ │
│  │  • Request Formatting                                        │ │
│  │  • Audio Decoding (base64)                                   │ │
│  │  • Error Handling                                            │ │
│  │  • Timeout Management                                        │ │
│  └────────────────┬─────────────────────────────────────────────┘ │
│                   │                                                 │
└───────────────────┼─────────────────────────────────────────────────┘
                    │
                    │ HTTPS POST
                    │
┌───────────────────▼─────────────────────────────────────────────────┐
│                    Resemble.ai API                                   │
│                    (https://p2.cluster.resemble.ai)                  │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  POST /synthesize                                                    │
│  {                                                                   │
│    "data": "text to synthesize",                                    │
│    "voice_uuid": "c99f388c",                                        │
│    "speed": 1.0                                                     │
│  }                                                                   │
│                                                                       │
│  Response:                                                           │
│  {                                                                   │
│    "audio_content": "base64_wav_data...",                          │
│    "duration": 5.2,                                                 │
│    "sample_rate": 32000,                                            │
│    "success": true                                                  │
│  }                                                                   │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### 1. User Sends Message

```
User types message → OpenClaw processes → Agent responds
                                              │
                                              ▼
                                    Response appears in UI
                                              │
                                              ▼
                                    Voice UI detects new message
```

### 2. TTS Request Flow

```
Voice UI Controller
    │
    ├─► Load voice config for current agent
    │   (voice-config.json)
    │
    ├─► Add voice directives to text:
    │   [[tts:provider=resemble]][[tts:resemble_voice=c99f388c]]Hello!
    │
    ├─► Send HTTP RPC request to gateway:
    │   POST /rpc
    │   { method: "tts.convert", params: { text: "...", channel: "web" } }
    │
    └─► Gateway routes to TTS system
            │
            ├─► Parse directives (extract voice ID, provider)
            │
            ├─► Call Resemble.ai provider
            │       │
            │       ├─► Format API request
            │       ├─► POST to Resemble.ai /synthesize
            │       ├─► Receive base64 audio
            │       └─► Decode to Buffer
            │
            ├─► Save audio to temp file
            │   /tmp/openclaw-tts-abc123.mp3
            │
            └─► Return audio path in response
                { audioPath: "/tmp/...", provider: "resemble" }
```

### 3. Audio Playback Flow

```
Voice UI receives audio path
    │
    ├─► Convert to URL: http://localhost:18789/audio/tmp/...
    │
    └─► Pass to Audio Player
            │
            ├─► Create <audio> element
            ├─► Set source to URL
            ├─► Apply speed setting (from config)
            ├─► Show speaking indicator
            │
            └─► Play audio
                    │
                    ├─► Browser fetches audio file
                    ├─► Decodes and plays through speakers
                    │
                    └─► On ended:
                        ├─► Hide speaking indicator
                        └─► Play next in queue (if any)
```

---

## Component Responsibilities

### Browser Side

#### Voice UI Controller (`voice-ui.js`)
- **Purpose:** Orchestrate voice functionality
- **Responsibilities:**
  - Load and manage voice configuration
  - Detect agent changes
  - Listen for new messages
  - Request TTS from gateway
  - Coordinate with audio player
  - Persist user preferences

#### Audio Player (`voice-output.js`)
- **Purpose:** Handle audio playback
- **Responsibilities:**
  - Play/pause/stop audio
  - Manage playback queue
  - Control playback speed
  - Show/hide speaking indicator
  - Emit playback events

#### Agent Selector (`agent-selector.js`)
- **Purpose:** UI for agent and voice controls
- **Responsibilities:**
  - Display agent list
  - Show voice settings section
  - Handle user interactions (toggles, buttons)
  - Update voice name display
  - Style and layout

### Server Side

#### TTS System (`tts.js`)
- **Purpose:** Coordinate text-to-speech
- **Responsibilities:**
  - Provider selection and fallback
  - Parse TTS directives from text
  - Route to appropriate provider
  - Manage temp audio files
  - Handle errors and timeouts

#### Resemble.ai Provider (`providers/resemble.js`)
- **Purpose:** Interface with Resemble.ai API
- **Responsibilities:**
  - Format API requests
  - Authenticate with bearer token
  - Send synthesis requests
  - Decode base64 audio
  - Handle API errors
  - Validate voice IDs

---

## Configuration Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                    Configuration Sources                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  1. System Config (OpenClaw)                                     │
│     ~/.openclaw/openclaw.json                                    │
│     • TTS provider preference                                    │
│     • Default voice settings                                     │
│     • API configuration                                          │
│                                                                   │
│  2. API Credentials                                              │
│     ~/.config/resemble/api_key                                   │
│     ~/.config/resemble/config.json                               │
│     • Authentication token                                       │
│     • Default voice ID                                           │
│                                                                   │
│  3. Voice Mappings                                               │
│     .../control-ui/voice-config.json                             │
│     • Agent → Voice mappings                                     │
│     • Voice names and descriptions                               │
│     • Per-agent speed settings                                   │
│                                                                   │
│  4. User Preferences (Browser)                                   │
│     localStorage['voiceui-preferences']                          │
│     • Auto-play enabled/disabled                                 │
│     • Playback speed preference                                  │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
                                │
                                ▼
        ┌───────────────────────────────────┐
        │  Runtime Configuration Merged     │
        │                                   │
        │  Agent: althea                    │
        │  Voice: Anya (c99f388c)          │
        │  Speed: 1.0x                      │
        │  Auto-play: true                  │
        └───────────────────────────────────┘
```

---

## State Management

### Voice UI State
```javascript
{
  voiceConfig: {
    agents: {
      althea: { voiceId, voiceName, settings },
      sage: { ... },
      // ...
    }
  },
  currentAgent: "althea",
  autoPlayEnabled: true,
  initialized: true
}
```

### Audio Player State
```javascript
{
  audio: HTMLAudioElement,
  isPlaying: false,
  queue: ["url1", "url2"],
  currentSpeed: 1.0
}
```

### User Preferences (LocalStorage)
```javascript
{
  autoPlayEnabled: true,
  speed: 1.0
}
```

---

## Error Handling

### Client-Side Errors

```
Message Detection Fails
    ↓
Retry with fallback selector
    ↓
Log warning, continue without auto-play


TTS Request Fails
    ↓
Show error in console
    ↓
Don't crash, allow manual retry


Audio Playback Fails
    ↓
Log error
    ↓
Hide speaking indicator
    ↓
Trigger 'error' event
```

### Server-Side Errors

```
Resemble.ai API Error
    ↓
Catch and format error message
    ↓
Return error to client
    ↓
Try fallback provider (if configured)
    ↓
Return final error if all fail


API Key Invalid
    ↓
Return "No API key" error
    ↓
Skip resemble provider
    ↓
Try next provider in list


Timeout
    ↓
Abort request
    ↓
Return timeout error
    ↓
Allow client to retry
```

---

## Performance Considerations

### Caching Strategy
- **Audio Files:** Temp files cleaned up after 5 minutes
- **Voice Config:** Loaded once at startup, cached in memory
- **User Preferences:** Persisted in localStorage, loaded on init

### Network Optimization
- **HTTP/2:** Multiple concurrent requests supported
- **Connection Reuse:** Same gateway connection for all requests
- **Compression:** Audio uses efficient WAV encoding

### Browser Performance
- **Lazy Loading:** Voice modules loaded after page ready
- **Event Delegation:** Minimal event listeners
- **Shadow DOM:** Efficient DOM updates

### API Rate Limiting
- **Resemble.ai:** Check plan limits (typically 100-500/min)
- **Fallback:** Use other providers if rate limited
- **Client-Side:** No built-in throttling (rely on natural message flow)

---

## Security

### API Key Protection
- ✅ API key stored server-side only
- ✅ Never sent to client browser
- ✅ File permissions: 600 (owner read/write only)
- ✅ Not logged in console or files

### Audio File Security
- ✅ Temp files auto-deleted after 5 minutes
- ✅ Unique filenames prevent collisions
- ✅ Served through authenticated gateway

### Request Validation
- ✅ Voice ID format validated
- ✅ Speed parameter range checked
- ✅ Text length limits enforced
- ✅ Request timeouts prevent hangs

---

## Monitoring & Debugging

### Browser Console Logs

```
✅ AudioPlayer module loaded
✅ VoiceUI module loaded
🎤 VoiceUI: Initializing...
✅ VoiceUI: Voice config loaded
📍 VoiceUI: Current agent: althea
👂 VoiceUI: Setting up message listener
✅ VoiceUI: Initialization complete
```

### Server Logs

```
TTS: converting text with provider: resemble
TTS: voice directive detected: c99f388c
TTS: audio saved to /tmp/openclaw-tts-abc123.mp3
TTS: conversion successful (latency: 2.3s)
```

### Network Debugging

```bash
# Monitor TTS requests
curl -X POST http://localhost:18789/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tts.convert",
    "params": {
      "text": "[[tts:provider=resemble]]Test",
      "channel": "web"
    }
  }'
```

---

## Extension Points

### Adding New Voices
1. Create voice in Resemble.ai dashboard
2. Copy voice UUID (8 characters)
3. Add to voice-config.json
4. Restart gateway

### Adding New Providers
1. Create provider file in `tts/providers/`
2. Implement provider interface
3. Add to TTS_PROVIDERS array
4. Add directive parsing support

### Customizing UI
1. Modify agent-selector.js CSS
2. Add new controls to voice section
3. Wire up event handlers
4. Update voice-ui.js logic

### Adding Features
- Voice emotion control
- Wake words
- Voice history
- Multi-language
- Custom personas

---

## File Organization

```
OpenClaw Installation
├── dist/
│   ├── tts/
│   │   ├── tts.js                 [Main TTS system]
│   │   └── providers/
│   │       └── resemble.js        [Resemble.ai provider]
│   └── control-ui/
│       ├── index.html             [Main HTML with script tags]
│       ├── voice-ui.js            [Voice UI controller]
│       ├── voice-output.js        [Audio player]
│       └── voice-config.json      [Voice mappings]

User Configuration
├── ~/.openclaw/
│   └── openclaw.json              [OpenClaw config]
└── ~/.config/resemble/
    ├── api_key                    [API authentication]
    └── config.json                [Default voice]

Customizations
└── ~/openclaw_customizations/
    ├── voice-config.json          [Source config]
    ├── test-resemble.js           [API test script]
    ├── QUICK_START.md             [Quick guide]
    ├── ARCHITECTURE.md            [This file]
    └── VOICE_IMPLEMENTATION_SUMMARY.md  [Full docs]
```

---

## API Reference

### Voice UI Methods

```javascript
// Initialize system
await voiceUI.init()

// Speak text
await voiceUI.speak("Hello!", "althea")

// Switch agent
voiceUI.switchAgent("sage")

// Toggle auto-play
voiceUI.toggleAutoPlay(true/false)

// Set speed
voiceUI.setSpeed(1.25)

// Test voice
await voiceUI.testVoice()
```

### Audio Player Methods

```javascript
// Play audio
await audioPlayer.play(audioUrl, { speed: 1.0 })

// Pause
audioPlayer.pause()

// Resume
audioPlayer.resume()

// Stop
audioPlayer.stop()

// Set speed
audioPlayer.setSpeed(1.5)

// Add to queue
audioPlayer.addToQueue(audioUrl)

// Get state
const state = audioPlayer.getState()
```

### RPC Methods

```javascript
// TTS conversion
{
  method: "tts.convert",
  params: {
    text: "[[tts:provider=resemble]]Hello!",
    channel: "web"
  }
}

// Response
{
  audioPath: "/tmp/openclaw-tts-abc123.mp3",
  provider: "resemble",
  outputFormat: "mp3",
  voiceCompatible: false
}
```

---

This architecture supports scalability, maintainability, and extensibility for future voice features!
