# Voice Interface Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Verify Installation ✅
All files are already installed! Check that these exist:

```bash
# Check server files
ls /opt/homebrew/lib/node_modules/openclaw/dist/tts/providers/resemble.js
ls /opt/homebrew/lib/node_modules/openclaw/dist/control-ui/voice-ui.js

# Check config
cat /Users/althea/.config/resemble/api_key
cat /Users/althea/openclaw_customizations/voice-config.json
```

### Step 2: Test the API
```bash
cd /Users/althea/openclaw_customizations
node test-resemble.js
```

You should see:
```
✅ Synthesis request successful
✅ Audio saved to /tmp/test-resemble-voice.wav
```

Play it:
```bash
afplay /tmp/test-resemble-voice.wav
```

### Step 3: Start OpenClaw
```bash
openclaw gateway
```

### Step 4: Open Control UI
Open your browser to:
```
http://localhost:18789/chat?session=agent:althea:main
```

### Step 5: Test Voice Controls

1. **Look for Voice Settings** in the left sidebar (below agent list)
2. **Click "Test Voice"** - You should hear Althea speak!
3. **Send a message** to Althea - Her response should auto-play
4. **Try the controls:**
   - Toggle auto-play on/off
   - Change speed (0.75x to 1.5x)
   - Watch the speaking indicator 🔊

---

## 🎯 What Works Right Now

### ✅ Working Features
- Althea's voice (Anya - voice ID c99f388c)
- Voice synthesis via Resemble.ai API
- Auto-play agent responses
- Manual "Test Voice" button
- Speed control (0.75x - 1.5x)
- Speaking indicator animation
- Preference persistence

### ⏳ Needs Setup
- Sage's voice (create in Resemble.ai)
- Tally's voice (create in Resemble.ai)
- Echo's voice (create in Resemble.ai)

---

## 📝 To Complete Setup

### Create New Voices

1. Go to https://app.resemble.ai
2. Click "Create Voice"
3. Follow wizard to clone/create 3 voices:
   - **Sage/Sarah**: Warm, patient, caring
   - **Tally/Taylor**: Professional, precise
   - **Echo/Emma**: Energetic, creative

4. Copy each 8-character voice ID

5. Update the config:
```bash
nano /Users/althea/openclaw_customizations/voice-config.json
```

Replace:
- `SAGE_VOICE_ID` → actual Sage voice ID (e.g., `a1b2c3d4`)
- `TALLY_VOICE_ID` → actual Tally voice ID (e.g., `e5f6g7h8`)
- `ECHO_VOICE_ID` → actual Echo voice ID (e.g., `i9j0k1l2`)

6. Copy to control UI:
```bash
cp /Users/althea/openclaw_customizations/voice-config.json \
   /opt/homebrew/lib/node_modules/openclaw/dist/control-ui/voice-config.json
```

7. Restart OpenClaw gateway:
```bash
# Ctrl+C to stop, then:
openclaw gateway
```

8. Test each agent's voice!

---

## 🔧 Common Issues

### "Voice not playing"
- Check browser console (F12)
- Verify OpenClaw gateway is running
- Test API with: `node test-resemble.js`

### "Voice controls not visible"
- Hard refresh browser (Cmd+Shift+R)
- Check files copied to control-ui directory

### "Wrong voice playing"
- Check URL has correct agent ID
- Verify voice-config.json has correct voice IDs

---

## 📚 More Help

See full documentation:
```bash
cat /Users/althea/openclaw_customizations/VOICE_IMPLEMENTATION_SUMMARY.md
```

---

## 🎉 Quick Test Checklist

- [ ] Test script runs successfully
- [ ] Audio file plays
- [ ] OpenClaw gateway starts
- [ ] Voice controls appear in sidebar
- [ ] Test Voice button works
- [ ] Auto-play works for responses
- [ ] Speed control works
- [ ] Settings persist after refresh

Once all checked, you're ready to go! 🚀
