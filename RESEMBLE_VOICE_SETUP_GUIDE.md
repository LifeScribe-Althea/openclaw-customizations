# Resemble.ai Voice Setup Guide for Agent Team

## Voice Requirements Summary

**Your Agent Team Voices:**
- **Althea** (Team Lead) - ✅ DONE - Anya (c99f388c) - American woman
- **Sage** (Customer Support) - ⏳ TO CREATE - American woman's voice (warm, patient, caring)
- **Tally** (Finance) - ⏳ TO CREATE - American man's voice (professional, precise)
- **Echo** (Marketing) - ⏳ TO CREATE - American man's voice (energetic, creative, different from Tally)

---

## Step-by-Step: Create Voices in Resemble.ai

### Access Resemble.ai Dashboard

1. Go to: https://app.resemble.ai
2. Log in with your credentials
3. Navigate to **"Voices"** section in the left sidebar

---

## Voice 1: Sage (Customer Support Agent)

### Characteristics:
- **Gender:** Female
- **Accent:** American English
- **Tone:** Warm, patient, clear, genuinely caring
- **Pace:** Slightly slower than normal (0.95x)
- **Use Case:** Customer support, empathy, problem-solving

### Creation Steps:

1. **Click "Create New Voice"**

2. **Choose Voice Creation Method:**
   - **Option A: Voice Cloning** (Recommended)
     - Record or upload 10-30 seconds of speech
     - Use a warm, friendly female voice
     - Read script: "Hello, I'm here to help you today. Let me understand your concern and find the best solution together."

   - **Option B: Use Resemble.ai Voice Library**
     - Browse pre-made voices
     - Filter: Female, American, Warm/Friendly
     - Preview voices and select one that sounds caring and patient

3. **Name the Voice:**
   - Name: `Sage` or `Sarah`
   - Description: "Customer support agent - warm, patient, caring"

4. **Configure Settings:**
   - Language: English (US)
   - Style: Conversational, empathetic
   - Sample Rate: 32kHz (default)

5. **Test the Voice:**
   - Test text: "Thank you for reaching out. I understand this is frustrating, and I'm here to help resolve this for you."
   - Listen and verify it sounds warm and caring

6. **Save and Get Voice ID:**
   - Click "Create Voice"
   - **COPY THE 8-CHARACTER VOICE ID** (e.g., `a1b2c3d4`)
   - Save it immediately!

---

## Voice 2: Tally (Finance Agent)

### Characteristics:
- **Gender:** Male
- **Accent:** American English
- **Tone:** Professional, precise, analytical, authoritative
- **Pace:** Slightly faster than normal (1.05x)
- **Use Case:** Financial reporting, data analysis, formal communication

### Creation Steps:

1. **Click "Create New Voice"**

2. **Choose Voice Creation Method:**
   - **Option A: Voice Cloning** (Recommended)
     - Record or upload 10-30 seconds of speech
     - Use a professional, clear male voice
     - Read script: "The quarterly report shows a fifteen percent increase in revenue. I've analyzed the data and identified three key trends that require immediate attention."

   - **Option B: Use Resemble.ai Voice Library**
     - Browse pre-made voices
     - Filter: Male, American, Professional/Formal
     - Preview voices and select one that sounds authoritative and precise

3. **Name the Voice:**
   - Name: `Tally` or `Taylor`
   - Description: "Finance agent - professional, precise, analytical"

4. **Configure Settings:**
   - Language: English (US)
   - Style: Formal, clear, professional
   - Sample Rate: 32kHz (default)

5. **Test the Voice:**
   - Test text: "Based on the financial analysis, I recommend allocating thirty-five thousand dollars to infrastructure improvements in Q2."
   - Listen and verify it sounds professional and authoritative

6. **Save and Get Voice ID:**
   - Click "Create Voice"
   - **COPY THE 8-CHARACTER VOICE ID** (e.g., `e5f6g7h8`)
   - Save it immediately!

---

## Voice 3: Echo (Marketing Agent)

### Characteristics:
- **Gender:** Male
- **Accent:** American English
- **Tone:** Energetic, creative, engaging, upbeat
- **Pace:** Faster than normal (1.1x)
- **Use Case:** Marketing content, social media, creative pitches
- **NOTE:** Must be distinctly different from Tally's voice!

### Creation Steps:

1. **Click "Create New Voice"**

2. **Choose Voice Creation Method:**
   - **Option A: Voice Cloning** (Recommended)
     - Record or upload 10-30 seconds of speech
     - Use an energetic, dynamic male voice (younger sounding than Tally)
     - Read script: "This campaign is going to be amazing! Our creative strategy targets exactly what our audience loves, and the engagement metrics are going to be incredible!"

   - **Option B: Use Resemble.ai Voice Library**
     - Browse pre-made voices
     - Filter: Male, American, Energetic/Dynamic
     - Preview voices and select one that sounds youthful and enthusiastic
     - **IMPORTANT:** Make sure it sounds different from Tally!

3. **Name the Voice:**
   - Name: `Echo` or `Emma` (note: male voice despite "Emma" name)
   - Description: "Marketing agent - energetic, creative, engaging"

4. **Configure Settings:**
   - Language: English (US)
   - Style: Energetic, conversational, dynamic
   - Sample Rate: 32kHz (default)

5. **Test the Voice:**
   - Test text: "Our new social media campaign just hit five thousand shares in the first hour! The community is absolutely loving this content!"
   - Listen and verify it sounds energetic and upbeat
   - **Compare with Tally's test** - they should sound distinctly different

6. **Save and Get Voice ID:**
   - Click "Create Voice"
   - **COPY THE 8-CHARACTER VOICE ID** (e.g., `i9j0k1l2`)
   - Save it immediately!

---

## After Creating All Voices

### Record Your Voice IDs

Fill in these IDs from Resemble.ai:

```
✅ Althea (Anya): c99f388c
⏳ Sage voice ID: ________________
⏳ Tally voice ID: ________________
⏳ Echo voice ID: ________________
```

---

## Update Voice Configuration

Once you have all three voice IDs, I'll help you update the configuration file!

**Tell me the three voice IDs and I'll:**
1. Update voice-config.json
2. Copy it to the control UI directory
3. Test each voice
4. Verify they all work correctly

---

## Voice Testing Script

After setup, test each voice with:

```bash
# Test Sage
curl -X POST http://localhost:18789/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tts.convert",
    "params": {
      "text": "[[tts:resemble_voice=SAGE_VOICE_ID]]Hello, I am here to help you with your concern today.",
      "channel": "web"
    }
  }'

# Test Tally
curl -X POST http://localhost:18789/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tts.convert",
    "params": {
      "text": "[[tts:resemble_voice=TALLY_VOICE_ID]]The quarterly financial report shows strong performance.",
      "channel": "web"
    }
  }'

# Test Echo
curl -X POST http://localhost:18789/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tts.convert",
    "params": {
      "text": "[[tts:resemble_voice=ECHO_VOICE_ID]]This marketing campaign is going to be incredible!",
      "channel": "web"
    }
  }'
```

---

## Troubleshooting Voice Creation

### Voice Doesn't Sound Right
- Try different voices from the library
- Adjust voice settings (if available)
- Re-record with different tone/pacing

### Can't Find Good Male Voices
- Check "Professional" category for Tally
- Check "Energetic" or "Casual" category for Echo
- Use voice cloning with sample audio

### Voices Sound Too Similar
- Echo should sound younger/more energetic than Tally
- Test them side-by-side
- Try different voice samples

### Voice ID Not Working
- Verify it's exactly 8 characters
- Check for typos
- Ensure voice was successfully created in dashboard

---

## Cost Considerations

**Resemble.ai Pricing:**
- Voice cloning: Typically included in plans
- Synthesis: Per-request or monthly quota
- Check your plan limits at: https://app.resemble.ai/billing

**Estimated Usage:**
- 10-50 TTS requests per day per agent
- ~200-500 KB per audio file
- Monitor your usage in the dashboard

---

## Next Steps

1. **Create the 3 voices now** (15-30 minutes)
2. **Get the voice IDs**
3. **Tell me the IDs** and I'll update the configuration
4. **Test all voices** to ensure they work
5. **Start using your voice-enabled agent team!**

---

## Quick Reference

**Resemble.ai Dashboard:** https://app.resemble.ai
**Voice Library:** https://app.resemble.ai/voices
**API Docs:** https://docs.resemble.ai

**Support:**
- Resemble.ai Support: support@resemble.ai
- Voice Configuration: See voice-config.json
- Testing: Use test-resemble.js script

---

**Ready?** Go create those voices and send me the IDs! 🎤
