#!/usr/bin/env node
import { readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const API_KEY = readFileSync(join(homedir(), '.config/resemble/api_key'), 'utf8').trim();
const BASE_URL = 'https://app.resemble.ai/api/v2';

async function listVoices() {
  try {
    // Fetch all pages
    let allVoices = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await fetch(`${BASE_URL}/voices?page=${page}&page_size=100`, {
        headers: {
          'Authorization': `Token ${API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      allVoices = allVoices.concat(data.items || []);

      hasMore = data.items && data.items.length === 100;
      page++;
    }

    console.log(`\nTotal voices available: ${allVoices.length}\n`);

    // Filter for Lucy, Alex, Grant
    const targetVoices = allVoices.filter(v =>
      ['lucy', 'alex', 'grant'].includes(v.name.toLowerCase())
    );

    if (targetVoices.length > 0) {
      console.log('Found target voices:');
      targetVoices.forEach(v => {
        console.log(`  ${v.name}: ${v.uuid}`);
      });
    } else {
      console.log('Target voices (Lucy, Alex, Grant) not found.');
      console.log('\nAll available voices:');
      allVoices.forEach(v => {
        console.log(`  ${v.name} (${v.uuid}): ${v.description || 'No description'}`);
      });
    }

    return targetVoices;
  } catch (error) {
    console.error('Error fetching voices:', error.message);
    process.exit(1);
  }
}

listVoices();
