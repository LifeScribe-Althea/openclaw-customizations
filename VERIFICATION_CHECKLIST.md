# Voice Interface Verification Checklist

Use this checklist to verify the voice interface is working correctly.

---

## Pre-Flight Checks

### ✅ Installation Verification

```bash
# Check server files exist
[ ] ls /opt/homebrew/lib/node_modules/openclaw/dist/tts/providers/resemble.js
[ ] ls /opt/homebrew/lib/node_modules/openclaw/dist/control-ui/voice-ui.js
[ ] ls /opt/homebrew/lib/node_modules/openclaw/dist/control-ui/voice-output.js
[ ] ls /opt/homebrew/lib/node_modules/openclaw/dist/control-ui/voice-config.json

# Check configuration files
[ ] cat /Users/althea/.config/resemble/api_key
[ ] cat /Users/althea/.config/resemble/config.json
[ ] cat /Users/althea/openclaw_customizations/voice-config.json
```

### ✅ API Test

```bash
[ ] cd /Users/althea/openclaw_customizations
[ ] node test-resemble.js
    Expected: "✅ Synthesis request successful"
[ ] afplay /tmp/test-resemble-voice.wav
    Expected: Hear Althea's voice speaking test message
```

---

## Gateway Tests

### ✅ Start Gateway

```bash
[ ] openclaw gateway
    Expected output:
    - "Gateway server running on http://localhost:18789"
    - "TTS provider: resemble (configured)"
    - No errors in startup
```

### ✅ Verify Gateway Running

```bash
[ ] curl http://localhost:18789/health
    Expected: HTTP 200 response

[ ] curl http://localhost:18789/voice-config.json
    Expected: JSON with agent voice mappings
```

---

## Browser Tests

### ✅ Initial Load

```bash
[ ] Open http://localhost:18789/chat?session=agent:althea:main
[ ] Page loads without errors
[ ] Agent selector visible on left side
[ ] Voice Settings section visible at bottom of sidebar
[ ] No JavaScript errors in console (F12)
```

### ✅ Console Messages

Open browser console (F12) and verify these messages appear:

```
[ ] ✅ Agent selector styles injected
[ ] ✅ Agent selector injected into body
[ ] ✅ AudioPlayer module loaded
[ ] ✅ VoiceUI module loaded
[ ] 🎤 VoiceUI: Initializing...
[ ] ✅ VoiceUI: Voice config loaded
[ ] 📍 VoiceUI: Current agent: althea
[ ] ✅ VoiceUI: Initialization complete
```

---

## UI Component Tests

### ✅ Voice Settings Section

Verify the Voice Settings section contains:

```
[ ] Header: "VOICE SETTINGS" (blue, uppercase)
[ ] Current voice name display (should show "Anya" for Althea)
[ ] Speaking indicator (🔊) - hidden by default
[ ] Checkbox: "Auto-play responses" - checked by default
[ ] Dropdown: "Speed" with options: 0.75x, 1.0x, 1.25x, 1.5x
[ ] Button: "Test Voice" - blue background
```

### ✅ Visual Styling

```
[ ] Voice section has dark background (#1a1a1a)
[ ] Voice section has border-top (#333)
[ ] Voice name is in white text
[ ] Button has blue background (#2d7ff9)
[ ] Button hover changes to lighter blue (#4a9eff)
```

---

## Functional Tests

### ✅ Test Voice Button

```
[ ] Click "Test Voice" button
[ ] Speaking indicator (🔊) appears and animates
[ ] Hear audio: "Hello! I'm Anya, the voice of althea..."
[ ] Speaking indicator disappears when audio ends
[ ] No errors in console
```

### ✅ Auto-Play Test

```
[ ] Send message to Althea: "Tell me about yourself"
[ ] Wait for response to appear
[ ] Voice automatically starts playing
[ ] Speaking indicator appears during playback
[ ] Speaking indicator disappears when done
[ ] Check console logs:
    - "🎤 VoiceUI: Requesting TTS for agent: althea"
    - "✅ VoiceUI: TTS successful, audio URL: ..."
    - "🔊 AudioPlayer: Playing audio: ..."
```

### ✅ Auto-Play Toggle

```
[ ] Uncheck "Auto-play responses"
[ ] Send another message to Althea
[ ] Verify voice does NOT play automatically
[ ] Check "Auto-play responses" again
[ ] Send another message
[ ] Verify voice DOES play automatically
```

### ✅ Speed Control

```
[ ] Set speed to 1.5x
[ ] Click "Test Voice"
[ ] Verify audio plays faster than normal
[ ] Set speed to 0.75x
[ ] Click "Test Voice"
[ ] Verify audio plays slower than normal
[ ] Set speed back to 1.0x
```

### ✅ Preference Persistence

```
[ ] Change auto-play setting (check/uncheck)
[ ] Change speed to 1.25x
[ ] Refresh browser page (F5)
[ ] Verify auto-play setting is preserved
[ ] Verify speed setting is preserved (shows 1.25x)
```

---

## Agent Switching Tests

### ✅ Switch to Different Agent

```
[ ] Click on "Sage" in agent selector
[ ] Page reloads with new URL: ?session=agent:sage:main
[ ] Voice name updates to "Sarah" (or placeholder)
[ ] Console shows: "🔄 VoiceUI: Switching to agent: sage"
[ ] Click "Test Voice"
[ ] Voice plays (will use Sage's voice if configured)
```

### ✅ Test All Agents

For each agent (Althea, Sage, Tally, Echo):

```
[ ] Switch to agent
[ ] Voice name updates correctly
[ ] Click "Test Voice"
[ ] Appropriate voice plays
[ ] Send message to agent
[ ] Response auto-plays with correct voice
```

---

## Edge Case Tests

### ✅ Long Message

```
[ ] Send very long message (>500 words) to agent
[ ] Wait for response
[ ] Verify only first ~500 characters are spoken
[ ] Check console for truncation log
[ ] Audio playback completes without error
```

### ✅ Multiple Messages Quickly

```
[ ] Send 3 messages in rapid succession
[ ] Verify all responses are queued
[ ] Verify voices play in order (not overlapping)
[ ] Check console for queue management logs
[ ] All messages eventually play
```

### ✅ Playback Interruption

```
[ ] Click "Test Voice"
[ ] While playing, click "Test Voice" again
[ ] Verify first audio stops
[ ] Second audio starts immediately
[ ] Speaking indicator stays visible throughout
```

### ✅ Agent Switch During Playback

```
[ ] Click "Test Voice" for Althea
[ ] While playing, click "Sage" to switch agents
[ ] Verify playback stops
[ ] Page reloads
[ ] New agent's voice loads correctly
```

### ✅ Network Error Simulation

```
[ ] Stop OpenClaw gateway (Ctrl+C)
[ ] Try clicking "Test Voice"
[ ] Verify graceful error handling (no crash)
[ ] Check console for error message
[ ] Start gateway again
[ ] Verify voice works again
```

---

## Performance Tests

### ✅ Latency Measurement

```
[ ] Click "Test Voice"
[ ] Time from button click to audio start
    Expected: 2-5 seconds
    - If >10 seconds: Check network, API limits
    - If <1 second: Excellent!

[ ] Send message to agent
[ ] Time from response appearing to audio start
    Expected: 2-5 seconds (auto-play)
```

### ✅ Memory Usage

```
[ ] Open browser Task Manager (Shift+Esc in Chrome)
[ ] Note memory usage before test
[ ] Play voice 10 times
[ ] Note memory usage after
    Expected: Minimal increase (<50 MB)
    - If >100 MB increase: Potential memory leak
```

### ✅ Audio Quality

```
[ ] Play test voice
[ ] Listen for:
    [ ] Clear speech (no distortion)
    [ ] Appropriate volume
    [ ] Natural pacing
    [ ] No clipping or artifacts
    [ ] Proper pronunciation
```

---

## Configuration Tests

### ✅ Voice Config Update

```
[ ] Edit voice-config.json
[ ] Change Althea's speed to 1.2
[ ] Copy to control-ui directory
[ ] Restart OpenClaw gateway
[ ] Refresh browser
[ ] Click "Test Voice"
[ ] Verify audio plays at 1.2x speed
[ ] Restore original speed (1.0)
```

### ✅ Voice ID Change

```
[ ] Edit voice-config.json
[ ] Change Althea's voiceId (to test different voice)
[ ] Copy to control-ui directory
[ ] Restart gateway
[ ] Refresh browser
[ ] Click "Test Voice"
[ ] Verify different voice plays
[ ] Restore original voice ID (c99f388c)
```

---

## Browser Compatibility Tests

### ✅ Chrome/Chromium

```
[ ] All tests pass in Chrome
[ ] No console errors
[ ] Audio plays correctly
```

### ✅ Firefox

```
[ ] All tests pass in Firefox
[ ] No console errors
[ ] Audio plays correctly
```

### ✅ Safari

```
[ ] All tests pass in Safari
[ ] No console errors
[ ] Audio plays correctly (may need .wav support check)
```

---

## Mobile Tests (Optional)

### ✅ Mobile Browser

```
[ ] Open control UI on mobile browser
[ ] Voice controls visible and usable
[ ] Touch events work correctly
[ ] Audio plays on mobile device
[ ] Volume appropriate
```

---

## API Integration Tests

### ✅ Direct API Call

```bash
[ ] curl -X POST http://localhost:18789/rpc \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer 2eaee38fe0dd571bb47767aa6d2717082b4c742e21897a27" \
    -d '{
      "method": "tts.convert",
      "params": {
        "text": "[[tts:provider=resemble]]Test API",
        "channel": "web"
      }
    }'

Expected response:
{
  "result": {
    "audioPath": "/tmp/openclaw-tts-...",
    "provider": "resemble",
    "outputFormat": "mp3"
  }
}

[ ] Verify audio file exists at returned path
[ ] Play audio file with afplay
```

### ✅ Voice Directive Test

```bash
[ ] Test with voice directive:
    curl -X POST http://localhost:18789/rpc \
      -H "Content-Type: application/json" \
      -d '{
        "method": "tts.convert",
        "params": {
          "text": "[[tts:resemble_voice=c99f388c]]Voice directive test"
        }
      }'

[ ] Verify correct voice is used
[ ] Audio file generated
```

---

## Error Handling Tests

### ✅ Invalid Voice ID

```
[ ] Edit voice-config.json
[ ] Set invalid voice ID (e.g., "INVALID")
[ ] Copy to control-ui
[ ] Restart gateway
[ ] Refresh browser
[ ] Click "Test Voice"
[ ] Verify error is logged (not crash)
[ ] Error message is clear
[ ] Restore valid voice ID
```

### ✅ Missing API Key

```
[ ] Temporarily rename API key file
[ ] Restart gateway
[ ] Try to use voice
[ ] Verify error message: "No API key for resemble"
[ ] Restore API key file
[ ] Verify voice works again
```

### ✅ Network Timeout

```
[ ] Edit resemble.js
[ ] Set timeoutMs to 100 (very short)
[ ] Restart gateway
[ ] Try to use voice
[ ] Verify timeout error
[ ] Restore normal timeout
```

---

## Documentation Tests

### ✅ Documentation Completeness

```
[ ] README exists and is clear
[ ] Quick Start guide is accurate
[ ] Architecture diagram is helpful
[ ] Troubleshooting section covers common issues
[ ] API reference is complete
[ ] Examples are correct
```

---

## Final Acceptance Tests

### ✅ User Experience

```
[ ] Voice interface feels natural
[ ] Controls are intuitive
[ ] Feedback is clear (speaking indicator)
[ ] No confusing states
[ ] Errors are handled gracefully
[ ] Performance is acceptable
```

### ✅ Complete Workflow

```
1. [ ] Start OpenClaw
2. [ ] Open control UI
3. [ ] See voice controls
4. [ ] Test voice works
5. [ ] Send message to agent
6. [ ] Response auto-plays
7. [ ] Change speed
8. [ ] Test voice again at new speed
9. [ ] Toggle auto-play off
10. [ ] Verify no auto-play
11. [ ] Toggle auto-play on
12. [ ] Switch agents
13. [ ] Different voice plays
14. [ ] Refresh browser
15. [ ] Settings persist
16. [ ] All features still work
```

---

## Sign-Off

Once all items are checked:

```
Implementation Team Sign-Off:
[ ] All core features working
[ ] All tests passing
[ ] Documentation complete
[ ] Ready for production use

Date: _______________
Tester: _____________
Notes: ______________
```

---

## Known Limitations

Document any expected limitations:

```
[ ] Sage, Tally, Echo voices not created yet (placeholders)
[ ] Voice input (microphone) not implemented (Phase 2)
[ ] No voice emotion control (future feature)
[ ] No wake words (future feature)
[ ] No multi-language support yet (future feature)
```

---

## Troubleshooting Reference

If any test fails, see:
- VOICE_IMPLEMENTATION_SUMMARY.md → Troubleshooting section
- QUICK_START.md → Common Issues
- Browser console → Error messages
- Gateway logs → Server errors

---

**Last Updated:** 2026-02-05
**Version:** 1.0
**Status:** Ready for Verification
