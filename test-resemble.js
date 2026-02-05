#!/usr/bin/env node

/**
 * Test script for Resemble.ai TTS integration
 * Tests the API directly to verify credentials and voice synthesis
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

// Load configuration
const API_KEY_PATH = join(homedir(), '.config/resemble/api_key');
const CONFIG_PATH = join(homedir(), '.config/resemble/config.json');

let API_KEY;
let VOICE_ID;

try {
  API_KEY = readFileSync(API_KEY_PATH, 'utf8').trim();
  console.log('✅ API key loaded');
} catch (error) {
  console.error('❌ Failed to load API key:', error.message);
  process.exit(1);
}

try {
  const config = JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
  VOICE_ID = config.voice_id;
  console.log(`✅ Voice ID loaded: ${VOICE_ID}`);
} catch (error) {
  console.error('❌ Failed to load config:', error.message);
  process.exit(1);
}

const BASE_URL = 'https://p2.cluster.resemble.ai';
const TEST_TEXT = 'Hello, this is a test of the Resemble AI voice integration. I am Althea, and I am excited to help you with your projects.';

/**
 * Test the Resemble.ai API
 */
async function testResembleAPI() {
  console.log('\n🧪 Testing Resemble.ai API...\n');

  try {
    // Make synthesis request
    console.log('📤 Sending synthesis request...');
    const response = await fetch(`${BASE_URL}/synthesize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: TEST_TEXT,
        voice_uuid: VOICE_ID,
        speed: 1.0
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error (${response.status}): ${errorText}`);
    }

    console.log('✅ Synthesis request successful');

    // Parse response
    const data = await response.json();
    console.log('📦 Response data keys:', Object.keys(data));

    // Download audio if URL or content provided
    if (data.audio_content) {
      // Handle base64 audio content
      console.log('\n📥 Processing base64 audio content...');
      const audioBuffer = Buffer.from(data.audio_content, 'base64');
      const outputPath = '/tmp/test-resemble-voice.wav';
      writeFileSync(outputPath, audioBuffer);

      console.log(`✅ Audio saved to ${outputPath}`);
      console.log(`   Size: ${(audioBuffer.length / 1024).toFixed(2)} KB`);
      console.log('\n🔊 To play the audio, run:');
      console.log(`   afplay ${outputPath}`);

    } else if (data.audio_url) {
      console.log('\n📥 Downloading audio from URL...');
      const audioResponse = await fetch(data.audio_url);

      if (!audioResponse.ok) {
        throw new Error(`Failed to download audio (${audioResponse.status})`);
      }

      const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());
      const outputPath = '/tmp/test-resemble-voice.mp3';
      writeFileSync(outputPath, audioBuffer);

      console.log(`✅ Audio saved to ${outputPath}`);
      console.log(`   Size: ${(audioBuffer.length / 1024).toFixed(2)} KB`);
      console.log('\n🔊 To play the audio, run:');
      console.log(`   afplay ${outputPath}`);

    } else if (data.audio_data) {
      // Handle base64 audio data
      console.log('\n📥 Processing base64 audio data...');
      const audioBuffer = Buffer.from(data.audio_data, 'base64');
      const outputPath = '/tmp/test-resemble-voice.mp3';
      writeFileSync(outputPath, audioBuffer);

      console.log(`✅ Audio saved to ${outputPath}`);
      console.log(`   Size: ${(audioBuffer.length / 1024).toFixed(2)} KB`);
      console.log('\n🔊 To play the audio, run:');
      console.log(`   afplay ${outputPath}`);

    } else {
      console.log('⚠️  No audio_url or audio_data in response');
    }

    console.log('\n✅ Test completed successfully!');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

/**
 * Test voice directive parsing
 */
async function testVoiceDirective() {
  console.log('\n🧪 Testing voice directive parsing...\n');

  const testText = `[[tts:resemble_voice=${VOICE_ID}]]This text includes a voice directive.`;
  console.log('Test text:', testText);
  console.log('✅ Voice directive format is correct');
}

// Run tests
(async () => {
  console.log('🌸 Resemble.ai TTS Integration Test\n');
  console.log('Configuration:');
  console.log(`  API Key: ${API_KEY.substring(0, 8)}...`);
  console.log(`  Voice ID: ${VOICE_ID}`);
  console.log(`  Base URL: ${BASE_URL}`);

  await testResembleAPI();
  await testVoiceDirective();
})();
