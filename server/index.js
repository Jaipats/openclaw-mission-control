import express from 'express';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import { createServer } from 'http';
import { AgentManager } from './agentManager.js';
import { TraceManager } from './traceManager.js';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.SERVER_PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize managers
const agentManager = new AgentManager();
const traceManager = new TraceManager();

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('Client connected');

  // Send initial state
  ws.send(JSON.stringify({
    type: 'INIT',
    data: {
      agents: agentManager.getAllAgents(),
      traces: traceManager.getAllTraces(),
    },
  }));

  ws.on('close', () => {
    console.log('Client disconnected');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Broadcast to all connected clients
function broadcast(message) {
  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // OPEN
      client.send(JSON.stringify(message));
    }
  });
}

// REST API Endpoints

// Get all agents
app.get('/api/agents', (req, res) => {
  res.json(agentManager.getAllAgents());
});

// Create a new agent
app.post('/api/agents', (req, res) => {
  const { name, type, parentId, config } = req.body;
  const agent = agentManager.createAgent(name, type, parentId, config);
  
  broadcast({
    type: 'AGENT_CREATED',
    data: agent,
  });
  
  res.status(201).json(agent);
});

// Update agent status
app.patch('/api/agents/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  const agent = agentManager.updateAgentStatus(id, status);
  
  if (!agent) {
    return res.status(404).json({ error: 'Agent not found' });
  }
  
  broadcast({
    type: 'AGENT_STATUS_UPDATED',
    data: agent,
  });
  
  res.json(agent);
});

// Delete an agent
app.delete('/api/agents/:id', (req, res) => {
  const { id } = req.params;
  const success = agentManager.deleteAgent(id);
  
  if (!success) {
    return res.status(404).json({ error: 'Agent not found' });
  }
  
  broadcast({
    type: 'AGENT_DELETED',
    data: { id },
  });
  
  res.status(204).send();
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
    broadcast({
      type: 'AGENT_STATUS_UPDATED',
      data: agentManager.getAgent(agentId),
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
    
    // Here you would make the actual call to OpenClaw Gateway
    // For now, we'll simulate it
    const response = await simulateGatewayRequest(agentId, payload);
    
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
    broadcast({
      type: 'AGENT_STATUS_UPDATED',
      data: agentManager.getAgent(agentId),
    });
    
    res.json(response);
  } catch (error) {
    console.error('Gateway request error:', error);
    
    agentManager.updateAgentStatus(agentId, 'error');
    broadcast({
      type: 'AGENT_STATUS_UPDATED',
      data: agentManager.getAgent(agentId),
    });
    
    res.status(500).json({ error: error.message });
  }
});

// Simulate OpenClaw Gateway request (replace with actual implementation)
async function simulateGatewayRequest(agentId, payload) {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  
  return {
    agentId,
    result: 'Processed successfully',
    timestamp: new Date().toISOString(),
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
});

// Export for testing
export { app, broadcast, agentManager, traceManager };
