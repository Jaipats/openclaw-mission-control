#!/usr/bin/env node

/**
 * OpenClaw Connection Diagnostic Tool
 * Tests connectivity to OpenClaw Gateway and displays configuration
 */

import axios from 'axios';
import { readFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const OPENCLAW_URL = process.env.OPENCLAW_GATEWAY_URL || 'http://localhost:18789';
const CONFIG_PATH = join(homedir(), '.openclaw', 'openclaw.json');

console.log('🔍 OpenClaw Connection Diagnostic\n');
console.log('=' .repeat(50));

// Test 1: Check environment
console.log('\n📋 Environment Check:');
console.log(`   Gateway URL: ${OPENCLAW_URL}`);
console.log(`   Config Path: ${CONFIG_PATH}`);

// Test 2: Check if config file exists
console.log('\n📄 Configuration File Check:');
try {
  const configContent = readFileSync(CONFIG_PATH, 'utf-8');
  console.log(`   ✅ Config file exists`);
  console.log(`   Size: ${configContent.length} bytes`);
  
  try {
    const config = JSON.parse(configContent);
    console.log(`   ✅ Valid JSON`);
    console.log(`   Has agents: ${config.agents ? 'Yes (' + config.agents.length + ')' : 'No'}`);
    console.log(`   Has agent.model: ${config.agent?.model ? 'Yes' : 'No'}`);
  } catch (error) {
    console.log(`   ⚠️  Invalid JSON: ${error.message}`);
  }
} catch (error) {
  console.log(`   ❌ Config file not found or not readable`);
  console.log(`   Error: ${error.message}`);
}

// Test 3: Test HTTP connectivity
console.log('\n🌐 HTTP Connectivity Check:');
try {
  const startTime = Date.now();
  const response = await axios.get(`${OPENCLAW_URL}/health`, {
    timeout: 5000,
  });
  const duration = Date.now() - startTime;
  
  console.log(`   ✅ Health endpoint accessible`);
  console.log(`   Status: ${response.status}`);
  console.log(`   Response time: ${duration}ms`);
} catch (error) {
  if (error.code === 'ECONNREFUSED') {
    console.log(`   ❌ Connection refused - OpenClaw Gateway not running`);
    console.log(`   \nTo start OpenClaw Gateway, run: openclaw start`);
  } else if (error.code === 'ETIMEDOUT') {
    console.log(`   ❌ Connection timeout`);
  } else {
    console.log(`   ⚠️  Error: ${error.message}`);
  }
}

// Test 4: Test RPC API
console.log('\n🔌 RPC API Check:');
try {
  const startTime = Date.now();
  const response = await axios.post(`${OPENCLAW_URL}/rpc`, {
    method: 'config.get',
    params: {},
  }, {
    timeout: 5000,
  });
  const duration = Date.now() - startTime;
  
  console.log(`   ✅ RPC endpoint accessible`);
  console.log(`   Status: ${response.status}`);
  console.log(`   Response time: ${duration}ms`);
  
  if (response.data) {
    console.log(`\n📦 Configuration Response:`);
    const config = response.data.result || response.data;
    
    if (config.agent) {
      console.log(`   ✅ Has agent config`);
      console.log(`      Model: ${config.agent.model || 'not set'}`);
    }
    
    if (config.agents) {
      console.log(`   ✅ Has agents array`);
      console.log(`      Count: ${config.agents.length}`);
      
      if (config.agents.length > 0) {
        console.log(`\n   First agent:`);
        const first = config.agents[0];
        console.log(`      ID: ${first.id || 'not set'}`);
        console.log(`      Name: ${first.name || 'not set'}`);
        console.log(`      Type: ${first.type || 'not set'}`);
      }
    } else {
      console.log(`   ⚠️  No agents array found`);
      console.log(`   \nTo create agents, you can:`);
      console.log(`   1. Use Mission Control UI`);
      console.log(`   2. Use OpenClaw CLI: openclaw config set agents '[]'`);
    }
    
    // Show full config structure (truncated)
    console.log(`\n📋 Config Structure (first 500 chars):`);
    console.log('   ' + JSON.stringify(config, null, 2).substring(0, 500) + '...');
  }
} catch (error) {
  if (error.code === 'ECONNREFUSED') {
    console.log(`   ❌ Connection refused - OpenClaw Gateway not running`);
  } else if (error.code === 'ETIMEDOUT') {
    console.log(`   ❌ Connection timeout`);
  } else if (error.response) {
    console.log(`   ❌ HTTP ${error.response.status}: ${error.response.statusText}`);
    console.log(`   Response: ${JSON.stringify(error.response.data).substring(0, 200)}`);
  } else {
    console.log(`   ❌ Error: ${error.message}`);
  }
}

// Test 5: Test config.schema endpoint
console.log('\n📝 Schema Endpoint Check:');
try {
  const response = await axios.post(`${OPENCLAW_URL}/rpc`, {
    method: 'config.schema',
    params: {},
  }, {
    timeout: 5000,
  });
  
  if (response.data) {
    console.log(`   ✅ Schema endpoint accessible`);
    console.log(`   Response type: ${typeof response.data}`);
  }
} catch (error) {
  console.log(`   ⚠️  Schema endpoint not available: ${error.message}`);
}

// Summary and recommendations
console.log('\n' + '='.repeat(50));
console.log('📊 Summary:\n');

// Determine overall status
let issues = [];

try {
  readFileSync(CONFIG_PATH, 'utf-8');
} catch {
  issues.push('Config file not found');
}

try {
  await axios.post(`${OPENCLAW_URL}/rpc`, {
    method: 'config.get',
    params: {},
  }, {
    timeout: 3000,
  });
} catch {
  issues.push('Cannot connect to OpenClaw Gateway');
}

if (issues.length === 0) {
  console.log('✅ All checks passed! Mission Control should work correctly.');
} else {
  console.log('⚠️  Issues detected:');
  issues.forEach(issue => console.log(`   - ${issue}`));
  
  console.log('\n💡 Troubleshooting Steps:');
  
  if (issues.includes('Cannot connect to OpenClaw Gateway')) {
    console.log('\n1. Start OpenClaw Gateway:');
    console.log('   openclaw start');
    console.log('\n2. Check OpenClaw status:');
    console.log('   openclaw status');
    console.log('\n3. Verify port configuration:');
    console.log('   echo $OPENCLAW_GATEWAY_URL');
  }
  
  if (issues.includes('Config file not found')) {
    console.log('\n4. Initialize OpenClaw configuration:');
    console.log('   openclaw onboard');
    console.log('   OR');
    console.log('   openclaw configure');
  }
}

console.log('\n📚 For more help, see:');
console.log('   - OPENCLAW_INTEGRATION.md');
console.log('   - https://docs.openclaw.ai');
console.log('');
