# Quick Voice Setup - Action Checklist

## Current Status

✅ **Althea (Anya)** - WORKING (c99f388c) - American woman
⏳ **Sage** - NEEDS SETUP - American woman (warm, patient)
⏳ **Tally** - NEEDS SETUP - American man (professional)
⏳ **Echo** - NEEDS SETUP - American man (energetic, different from Tally)

---

## Your Action Plan (15-20 minutes)

### Step 1: Go to Resemble.ai
Open: https://app.resemble.ai
Click: **"Voices"** in left sidebar

---

### Step 2: Create Sage's Voice (Female American)

1. Click **"Create New Voice"** or **"Add Voice"**

2. Choose one of these options:
   - **Voice Library** (Fastest): Browse and select a warm, female American voice
   - **Voice Cloning**: Upload 10-30 seconds of a caring female voice
   - **Text-to-Speech**: Generate from sample text

3. **Test with this text:**
   > "Hi there! I'm Sage from customer support. I understand your concern and I'm here to help you find the best solution."

4. **Name it:** `Sage` or `Customer Support Voice`

5. **Save and COPY THE 8-CHARACTER VOICE ID**
   - Example: `a1b2c3d4`
   - WRITE IT DOWN: ________________

---

### Step 3: Create Tally's Voice (Male American)

1. Click **"Create New Voice"** again

2. Choose a professional, authoritative male American voice
   - Look for: Business/Professional category
   - Voice should sound formal and precise

3. **Test with this text:**
   > "Good morning. This is Tally from finance. I've analyzed the quarterly report and the data shows a fifteen percent increase in revenue."

4. **Name it:** `Tally` or `Finance Voice`

5. **Save and COPY THE 8-CHARACTER VOICE ID**
   - Example: `e5f6g7h8`
   - WRITE IT DOWN: ________________

---

### Step 4: Create Echo's Voice (Male American - Different!)

1. Click **"Create New Voice"** again

2. Choose an energetic, younger-sounding male American voice
   - Look for: Casual/Energetic category
   - Voice should sound upbeat and dynamic
   - **MUST BE DIFFERENT FROM TALLY!**

3. **Test with this text:**
   > "Hey everyone! This is Echo from marketing! Our new campaign is absolutely crushing it! The engagement is incredible!"

4. **Compare with Tally** - they should sound distinctly different

5. **Name it:** `Echo` or `Marketing Voice`

6. **Save and COPY THE 8-CHARACTER VOICE ID**
   - Example: `i9j0k1l2`
   - WRITE IT DOWN: ________________

---

### Step 5: Send Me the Voice IDs

Once you have all three 8-character voice IDs, **tell me:**

```
Sage voice ID: ________________
Tally voice ID: ________________
Echo voice ID: ________________
```

**I will then:**
1. Update voice-config.json
2. Copy it to the control UI
3. Test all voices to verify they work
4. Confirm everything is ready!

---

## Voice Requirements Reminder

| Agent  | Gender | Accent   | Personality              |
|--------|--------|----------|--------------------------|
| Sage   | Female | American | Warm, patient, caring    |
| Tally  | Male   | American | Professional, precise    |
| Echo   | Male   | American | Energetic, creative      |

**Important:** Tally and Echo are both male but should sound different:
- Tally: Older, formal, authoritative
- Echo: Younger, upbeat, dynamic

---

## Quick Links

- **Resemble.ai Dashboard:** https://app.resemble.ai
- **Voices Page:** https://app.resemble.ai/voices
- **Help Guide:** /Users/althea/openclaw_customizations/RESEMBLE_VOICE_SETUP_GUIDE.md

---

## After You Send the IDs

I'll run these commands:
```bash
# Update configuration
# Test each voice
node test-all-voices.js

# You'll be able to hear all 4 voices!
afplay /tmp/test-voice-sage.wav
afplay /tmp/test-voice-tally.wav
afplay /tmp/test-voice-echo.wav
```

---

## Ready?

🎤 Go create those 3 voices now!
⏱️ Should take 15-20 minutes total
📋 Come back with the 3 voice IDs and we're done!
