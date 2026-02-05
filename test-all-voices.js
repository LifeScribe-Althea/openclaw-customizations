#!/usr/bin/env node

/**
 * Comprehensive Voice Testing Script
 * Tests all agent voices with Resemble.ai API
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

// Load configuration
const API_KEY_PATH = join(homedir(), '.config/resemble/api_key');
const VOICE_CONFIG_PATH = join(homedir(), 'openclaw_customizations/voice-config.json');

let API_KEY;
let VOICE_CONFIG;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Test messages for each agent
const TEST_MESSAGES = {
  althea: "Hello, I'm Althea, the team lead. I'm here to coordinate our efforts and ensure we deliver excellent results together.",
  sage: "Hi there! I'm Sage from customer support. I understand your concern and I'm here to help you find the best solution. Let's work through this together.",
  tally: "Good morning. This is Tally from finance. I've analyzed the quarterly report and identified three key trends that require immediate attention. The data shows a fifteen percent increase in revenue.",
  echo: "Hey everyone! This is Echo from marketing! Our new campaign is absolutely crushing it! We've got five thousand shares in the first hour and the engagement is incredible!"
};

// Load API key
try {
  API_KEY = readFileSync(API_KEY_PATH, 'utf8').trim();
  log('✅ API key loaded', 'green');
} catch (error) {
  log(`❌ Failed to load API key: ${error.message}`, 'red');
  process.exit(1);
}

// Load voice config
try {
  VOICE_CONFIG = JSON.parse(readFileSync(VOICE_CONFIG_PATH, 'utf8'));
  log('✅ Voice configuration loaded', 'green');
} catch (error) {
  log(`❌ Failed to load voice config: ${error.message}`, 'red');
  process.exit(1);
}

const BASE_URL = 'https://p2.cluster.resemble.ai';

/**
 * Test a single voice
 */
async function testVoice(agentId, agentConfig, testText) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`Testing ${agentId.toUpperCase()} (${agentConfig.voiceName})`, 'cyan');
  log('='.repeat(60), 'cyan');

  const voiceId = agentConfig.voiceId;
  const speed = agentConfig.settings.speed;

  // Check if voice ID is a placeholder
  if (voiceId.includes('_ID') || voiceId === 'PLACEHOLDER') {
    log(`⚠️  Voice ID not set (placeholder: ${voiceId})`, 'yellow');
    log(`   Please create voice in Resemble.ai and update voice-config.json`, 'yellow');
    return { success: false, reason: 'placeholder' };
  }

  log(`Voice ID: ${voiceId}`, 'blue');
  log(`Gender: ${agentConfig.gender || 'not specified'}`, 'blue');
  log(`Accent: ${agentConfig.accent || 'not specified'}`, 'blue');
  log(`Speed: ${speed}x`, 'blue');
  log(`Description: ${agentConfig.description}`, 'blue');

  try {
    log('\n📤 Sending synthesis request...', 'yellow');

    const response = await fetch(`${BASE_URL}/synthesize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: testText,
        voice_uuid: voiceId,
        speed: speed
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(`Synthesis failed: ${JSON.stringify(data)}`);
    }

    log('✅ Synthesis successful', 'green');

    // Process audio
    if (data.audio_content) {
      const audioBuffer = Buffer.from(data.audio_content, 'base64');
      const outputPath = `/tmp/test-voice-${agentId}.wav`;
      writeFileSync(outputPath, audioBuffer);

      const sizeKB = (audioBuffer.length / 1024).toFixed(2);
      const duration = data.duration || 'unknown';
      const sampleRate = data.sample_rate || 'unknown';

      log(`\n📊 Audio Details:`, 'magenta');
      log(`   File: ${outputPath}`, 'magenta');
      log(`   Size: ${sizeKB} KB`, 'magenta');
      log(`   Duration: ${duration} seconds`, 'magenta');
      log(`   Sample Rate: ${sampleRate} Hz`, 'magenta');

      log(`\n🔊 To play: afplay ${outputPath}`, 'cyan');

      return {
        success: true,
        audioPath: outputPath,
        size: sizeKB,
        duration: duration,
        sampleRate: sampleRate
      };
    } else {
      throw new Error('No audio_content in response');
    }

  } catch (error) {
    log(`\n❌ Test failed: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  log('\n🎤 COMPREHENSIVE VOICE TESTING', 'cyan');
  log('='.repeat(60), 'cyan');

  const results = {};
  const agents = Object.keys(VOICE_CONFIG.agents);

  for (const agentId of agents) {
    const agentConfig = VOICE_CONFIG.agents[agentId];
    const testText = TEST_MESSAGES[agentId];

    const result = await testVoice(agentId, agentConfig, testText);
    results[agentId] = result;

    // Wait between requests to avoid rate limiting
    if (agentId !== agents[agents.length - 1]) {
      log('\n⏳ Waiting 2 seconds before next test...', 'yellow');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Summary
  log('\n' + '='.repeat(60), 'cyan');
  log('TEST SUMMARY', 'cyan');
  log('='.repeat(60), 'cyan');

  let successCount = 0;
  let placeholderCount = 0;
  let failCount = 0;

  for (const [agentId, result] of Object.entries(results)) {
    const agentConfig = VOICE_CONFIG.agents[agentId];
    const icon = result.success ? '✅' : (result.reason === 'placeholder' ? '⚠️ ' : '❌');
    const status = result.success ? 'SUCCESS' : (result.reason === 'placeholder' ? 'NEEDS SETUP' : 'FAILED');

    log(`\n${icon} ${agentId.toUpperCase()} (${agentConfig.voiceName}): ${status}`, result.success ? 'green' : (result.reason === 'placeholder' ? 'yellow' : 'red'));

    if (result.success) {
      successCount++;
      log(`   Voice ID: ${agentConfig.voiceId}`, 'blue');
      log(`   Gender: ${agentConfig.gender} | Accent: ${agentConfig.accent}`, 'blue');
      log(`   Audio: ${result.audioPath}`, 'blue');
      log(`   Size: ${result.size} KB | Duration: ${result.duration}s`, 'blue');
    } else if (result.reason === 'placeholder') {
      placeholderCount++;
      log(`   Action needed: Create voice in Resemble.ai`, 'yellow');
      log(`   Required: ${agentConfig.gender} ${agentConfig.accent} voice`, 'yellow');
    } else {
      failCount++;
      log(`   Error: ${result.error}`, 'red');
    }
  }

  // Final status
  log('\n' + '='.repeat(60), 'cyan');
  log(`Results: ${successCount} working | ${placeholderCount} need setup | ${failCount} failed`, 'cyan');
  log('='.repeat(60), 'cyan');

  if (successCount > 0) {
    log('\n🔊 Play all successful voices:', 'green');
    for (const [agentId, result] of Object.entries(results)) {
      if (result.success) {
        log(`   afplay ${result.audioPath}  # ${agentId}`, 'green');
      }
    }
  }

  if (placeholderCount > 0) {
    log('\n⚠️  Next steps:', 'yellow');
    log('   1. Go to https://app.resemble.ai', 'yellow');
    log('   2. Create voices for agents marked "NEEDS SETUP"', 'yellow');
    log('   3. Update voice-config.json with the 8-character voice IDs', 'yellow');
    log('   4. Run this test again', 'yellow');
  }

  if (successCount === agents.length) {
    log('\n🎉 ALL VOICES WORKING! Your agent team is ready to speak!', 'green');
  }
}

// Run tests
(async () => {
  try {
    await runAllTests();
  } catch (error) {
    log(`\n❌ Fatal error: ${error.message}`, 'red');
    process.exit(1);
  }
})();
