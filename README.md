# OpenClaw Customizations

This repository contains customizations and modifications to the OpenClaw gateway installation.

## Contents

### control-ui/agent-selector.js

**Purpose:** Displays real-time Gmail statistics in the agent selector sidebar.

**Features:**
- Shows unread email count for each agent
- Shows emails sent today count for each agent
- Auto-refreshes every 2 minutes
- Graceful fallback if Gmail OAuth not configured

**Display Format:**
- With OAuth: `📧 X unread  📤 Y sent today`
- Without OAuth: `⚙️ Setup Gmail`

## Installation Location

The customized files are installed at:
```
/opt/homebrew/lib/node_modules/openclaw/dist/control-ui/
```

## Restoration Instructions

If OpenClaw is updated via npm and overwrites your customizations:

```bash
# Restore the customized agent-selector.js
cp ~/openclaw_customizations/control-ui/agent-selector.js \
   /opt/homebrew/lib/node_modules/openclaw/dist/control-ui/agent-selector.js

# Restart OpenClaw
pkill openclaw
openclaw gateway start
```

## Files

- `control-ui/agent-selector.js.original` - Original unmodified version (backup)
- `control-ui/agent-selector.js` - Customized version with Gmail stats

## Modifications Made

1. **Added email addresses** to agent configuration
2. **Added fetchGmailStats()** function to call OpenClaw's `/tools/invoke` endpoint
3. **Added CSS styling** for stats display (.agent-stats classes)
4. **Modified button rendering** to include stats element with loading state
5. **Added auto-refresh** interval (every 2 minutes)

## Technical Details

**API Integration:**
- Endpoint: `http://localhost:18789/tools/invoke`
- Tool: `gmail_search`
- Authentication: Bearer token from `~/.openclaw/openclaw.json`
- Session keys: `agent:{agentId}:main`

**Queries:**
- Unread count: `is:unread in:inbox`
- Sent today: `from:{agentEmail} after:{today}`

## Agent Email Addresses

- Althea: althea@trylifescribe.com
- Sage: sage@trylifescribe.com
- Tally: tally@trylifescribe.com
- Echo: echo@trylifescribe.com
- Team: null (no email)

## Prerequisites

For Gmail stats to work, each agent needs:
1. Gmail MCP server configured in `~/Althea & Agents/{Agent}/mcp/index.js`
2. OAuth credentials at `~/.config/gmail/{agent}-credentials.json`
3. OAuth tokens at `~/.config/gmail/{agent}-token.json`

## Last Updated

2026-02-04
