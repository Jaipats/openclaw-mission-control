import express from 'express';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import { createServer } from 'http';
import { OpenClawClient } from './openClawClient.js';
import { AgentManager } from './agentManager.js';
import { TraceManager } from './traceManager.js';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.SERVER_PORT || 4000;
const OPENCLAW_URL = process.env.OPENCLAW_GATEWAY_URL || 'http://localhost:18789';

// Middleware
app.use(cors());
app.use(express.json());

// Initialize OpenClaw client and managers
const openClawClient = new OpenClawClient(OPENCLAW_URL);
const agentManager = new AgentManager(openClawClient);
const traceManager = new TraceManager();

// Check OpenClaw connection on startup
let openClawConnected = false;
openClawClient.healthCheck().then(connected => {
  openClawConnected = connected;
  if (connected) {
    console.log(`✅ Connected to OpenClaw Gateway at ${OPENCLAW_URL}`);
  } else {
    console.warn(`⚠️  Could not connect to OpenClaw Gateway at ${OPENCLAW_URL}`);
    console.warn('   Mission Control will work in standalone mode.');
    console.warn('   Update OPENCLAW_GATEWAY_URL in .env to connect.');
  }
});

// WebSocket connection handling
wss.on('connection', async (ws) => {
  console.log('Client connected');

  // Send initial state from OpenClaw
  try {
    const agents = await agentManager.getAllAgents();
    ws.send(JSON.stringify({
      type: 'INIT',
      data: {
        agents,
        traces: traceManager.getAllTraces(),
        openClawConnected,
      },
    }));
  } catch (error) {
    console.error('Failed to send initial state:', error.message);
    ws.send(JSON.stringify({
      type: 'ERROR',
      data: { message: 'Failed to load agents from OpenClaw' },
    }));
  }

  ws.on('close', () => {
    console.log('Client disconnected');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Watch for OpenClaw configuration changes
let configWatcher = null;
if (openClawConnected) {
  configWatcher = openClawClient.startConfigWatch(async (config) => {
    console.log('📡 OpenClaw configuration changed, syncing agents...');
    await agentManager.syncFromOpenClaw();
    const agents = await agentManager.getAllAgents();
    
    broadcast({
      type: 'AGENTS_SYNCED',
      data: { agents },
    });
  }, 10000); // Check every 10 seconds
}

// Broadcast to all connected clients
function broadcast(message) {
  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // OPEN
      client.send(JSON.stringify(message));
    }
  });
}

// REST API Endpoints

// Get OpenClaw connection status
app.get('/api/status', (req, res) => {
  res.json({ 
    openClawConnected,
    gatewayUrl: OPENCLAW_URL,
  });
});

// Get all agents from OpenClaw
app.get('/api/agents', async (req, res) => {
  try {
    const agents = await agentManager.getAllAgents();
    res.json(agents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Sync agents from OpenClaw
app.post('/api/agents/sync', async (req, res) => {
  try {
    const agents = await agentManager.syncFromOpenClaw();
    broadcast({
      type: 'AGENTS_SYNCED',
      data: { agents },
    });
    res.json(agents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new agent in OpenClaw
app.post('/api/agents', async (req, res) => {
  const { name, type, parentId, config, model, capabilities } = req.body;
  
  try {
    const agent = await agentManager.createAgent(name, type, parentId, {
      ...config,
      model,
      capabilities,
    });
    
    broadcast({
      type: 'AGENT_CREATED',
      data: agent,
    });
    
    res.status(201).json(agent);
  } catch (error) {
    console.error('Failed to create agent:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Update agent status (runtime only, not in OpenClaw config)
app.patch('/api/agents/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  try {
    const agent = agentManager.updateAgentStatus(id, status);
    const fullAgent = await agentManager.getAgent(id);
    
    broadcast({
      type: 'AGENT_STATUS_UPDATED',
      data: fullAgent,
    });
    
    res.json(fullAgent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update agent configuration in OpenClaw
app.patch('/api/agents/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  try {
    const agent = await agentManager.updateAgent(id, updates);
    
    broadcast({
      type: 'AGENT_UPDATED',
      data: agent,
    });
    
    res.json(agent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete an agent from OpenClaw
app.delete('/api/agents/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    await agentManager.deleteAgent(id);
    
    broadcast({
      type: 'AGENT_DELETED',
      data: { id },
    });
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all traces
app.get('/api/traces', (req, res) => {
  const { agentId, limit } = req.query;
  
  if (agentId) {
    res.json(traceManager.getTracesByAgent(agentId, limit ? parseInt(limit) : undefined));
  } else {
    res.json(traceManager.getAllTraces(limit ? parseInt(limit) : undefined));
  }
});

// Create a new trace
app.post('/api/traces', (req, res) => {
  const { agentId, action, input, output, metadata } = req.body;
  const trace = traceManager.createTrace(agentId, action, input, output, metadata);
  
  broadcast({
    type: 'TRACE_CREATED',
    data: trace,
  });
  
  res.status(201).json(trace);
});

// Clear all traces
app.delete('/api/traces', (req, res) => {
  traceManager.clearTraces();
  
  broadcast({
    type: 'TRACES_CLEARED',
  });
  
  res.status(204).send();
});

// OpenClaw Gateway Integration
app.post('/api/gateway/request', async (req, res) => {
  const { agentId, payload } = req.body;
  
  try {
    // Mark agent as active
    agentManager.updateAgentStatus(agentId, 'active');
    const agent = await agentManager.getAgent(agentId);
    broadcast({
      type: 'AGENT_STATUS_UPDATED',
      data: agent,
    });
    
    // Create trace for the request
    const trace = traceManager.createTrace(
      agentId,
      'gateway_request',
      payload,
      null,
      { status: 'pending' }
    );
    
    broadcast({
      type: 'TRACE_CREATED',
      data: trace,
    });
    
    let response;
    if (openClawConnected) {
      // Use actual OpenClaw Gateway
      response = await openClawClient.sendRequest(agentId, payload);
    } else {
      // Fallback to simulation if OpenClaw not connected
      response = await simulateGatewayRequest(agentId, payload);
    }
    
    // Update trace with response
    const updatedTrace = traceManager.updateTrace(trace.id, {
      output: response,
      metadata: { status: 'completed' },
    });
    
    broadcast({
      type: 'TRACE_UPDATED',
      data: updatedTrace,
    });
    
    // Mark agent as idle
    agentManager.updateAgentStatus(agentId, 'idle');
    const updatedAgent = await agentManager.getAgent(agentId);
    broadcast({
      type: 'AGENT_STATUS_UPDATED',
      data: updatedAgent,
    });
    
    res.json(response);
  } catch (error) {
    console.error('Gateway request error:', error);
    
    agentManager.updateAgentStatus(agentId, 'error');
    const errorAgent = await agentManager.getAgent(agentId);
    broadcast({
      type: 'AGENT_STATUS_UPDATED',
      data: errorAgent,
    });
    
    res.status(500).json({ error: error.message });
  }
});

// Simulate OpenClaw Gateway request (fallback when not connected)
async function simulateGatewayRequest(agentId, payload) {
  console.log('⚠️  Using simulated gateway (OpenClaw not connected)');
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  
  return {
    agentId,
    result: 'Processed successfully (simulated)',
    timestamp: new Date().toISOString(),
    simulated: true,
  };
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 OpenClaw Mission Control Server running on port ${PORT}`);
  console.log(`📊 WebSocket server ready`);
  console.log(`🔗 OpenClaw Gateway: ${OPENCLAW_URL}`);
  if (configWatcher) {
    console.log(`👀 Watching OpenClaw configuration for changes`);
  }
});

// Cleanup on shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  if (configWatcher) {
    configWatcher();
  }
  server.close(() => {
    console.log('Server closed');
  });
});

// Export for testing
export { app, broadcast, agentManager, traceManager, openClawClient };
