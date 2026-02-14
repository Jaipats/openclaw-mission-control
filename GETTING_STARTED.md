# 🚀 Getting Started with OpenClaw Mission Control

This guide will help you get up and running with OpenClaw Mission Control in just a few minutes.

## Step 1: Installation

### Option A: Quick Setup (Recommended)

Run the setup script:

```bash
./setup.sh
```

This will:
- Check for Node.js installation
- Install all dependencies
- Create a `.env` configuration file

### Option B: Manual Setup

```bash
# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env
```

## Step 2: Start the Application

### Development Mode (Recommended for Testing)

Start both the backend and frontend together:

```bash
npm run dev
```

This starts:
- **Backend Server**: http://localhost:4000
- **Frontend App**: http://localhost:3000
- **WebSocket Server**: ws://localhost:4000

### Separate Services (Advanced)

Run backend and frontend separately in different terminals:

```bash
# Terminal 1: Start backend
npm run server

# Terminal 2: Start frontend
npm run client
```

## Step 3: Access the Dashboard

Open your browser and navigate to:

```
http://localhost:3000
```

You should see the OpenClaw Mission Control dashboard with an empty agent tree.

## Step 4: Create Your First Agents

### Option A: Use Demo Data (Quick Start)

Run the demo seed script to create a sample agent hierarchy:

```bash
# Make sure the server is running first
npm run seed
```

This creates:
- 1 Master Orchestrator
- 2 Supervisors (Data & Analytics)
- 5 Workers/Analyzers
- 2 Sub-workers
- 5 sample request traces

### Option B: Create Agents Manually

1. Click **"Create Agent"** button in the header
2. Fill in the form:
   - **Name**: "Master Agent"
   - **Type**: Master
   - **Parent**: None (Root Agent)
3. Click **"Create Agent"**
4. Repeat to create sub-agents, selecting parents as needed

## Step 5: Test the System

### Simulate Requests

1. Select an agent in the tree
2. Click the **play icon (▶)** next to the agent
3. Watch the agent status change:
   - **Green dot**: Agent is processing
   - **Orange dot**: Agent is idle
4. View the trace in the **Request Traces** panel

### View Statistics

The top panel shows real-time statistics:
- Total agents and their status distribution
- Total traces and completion rates
- Average request duration

## Step 6: Monitor Your Agents

### Agent Tree Features

- **Expand/Collapse**: Click chevron icons to show/hide sub-agents
- **Select Agent**: Click an agent to filter traces
- **Delete Agent**: Click trash icon (removes agent and all children)
- **Status Indicators**:
  - 🟢 Green = Active (working)
  - 🟠 Orange = Idle (ready)
  - 🔴 Red = Error
  - ⚫ Gray = Offline

### Trace Panel Features

- **Real-time Updates**: New traces appear automatically
- **Auto-scroll**: Panel scrolls to show latest traces
- **Detailed View**: See input/output payloads and metadata
- **Status Icons**:
  - ✅ Completed successfully
  - ⏰ Pending/in progress
  - ❌ Failed with error

## Common Tasks

### Create a Sub-Agent

1. Click **"Create Agent"**
2. Fill in the details
3. Select a **Parent Agent** from the dropdown
4. Click **"Create Agent"**

The new agent appears as a child in the tree.

### Clear All Traces

Click **"Clear Traces"** in the header to remove all trace history. This doesn't affect agents.

### View Agent-Specific Traces

Click on an agent in the tree. The trace panel will filter to show only traces for that agent.

### Simulate Complex Workflows

1. Create a hierarchy: Master → Supervisor → Workers
2. Send requests to different agents
3. Watch traces flow through the system
4. Monitor performance in the stats panel

## Troubleshooting

### "WebSocket connection failed"

**Problem**: Frontend can't connect to backend WebSocket

**Solutions**:
- Ensure backend is running (`npm run server`)
- Check that nothing is using port 4000
- Look for firewall/antivirus blocking connections

### "No agents appearing"

**Problem**: Agents created but not visible

**Solutions**:
- Check browser console for errors
- Verify WebSocket is connected (console shows "WebSocket connected")
- Try refreshing the page

### "Traces not updating"

**Problem**: New traces don't appear in real-time

**Solutions**:
- Check WebSocket connection status
- Verify agent status changes when simulating requests
- Check Network tab for failed API calls

### Port Already in Use

**Problem**: `Error: listen EADDRINUSE: address already in use :::4000`

**Solutions**:
```bash
# Find process using port 4000
lsof -i :4000

# Kill the process
kill -9 <PID>

# Or use a different port in .env
SERVER_PORT=4001
```

## Next Steps

### Integrate with OpenClaw Gateway

1. Update `.env` file:
   ```env
   OPENCLAW_GATEWAY_URL=http://your-gateway-url:port
   ```

2. Modify `server/index.js` - replace `simulateGatewayRequest()`:
   ```javascript
   async function simulateGatewayRequest(agentId, payload) {
     const response = await fetch(
       `${process.env.OPENCLAW_GATEWAY_URL}/api/request`,
       {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ agentId, ...payload }),
       }
     );
     return response.json();
   }
   ```

3. Restart the server

### Customize Agent Types

Edit `src/components/CreateAgentModal.jsx` to add custom agent types:

```jsx
<select id="type" name="type" value={formData.type} onChange={handleChange}>
  <option value="master">Master</option>
  <option value="supervisor">Supervisor</option>
  <option value="worker">Worker</option>
  <option value="coordinator">Coordinator</option>
  <option value="analyzer">Analyzer</option>
  <option value="custom">Custom Type</option> {/* Add here */}
</select>
```

### Add Custom Trace Fields

1. Update `server/traceManager.js` - add fields to trace object
2. Update `src/components/TracePanel.jsx` - display new fields

### Deploy to Production

See the **Production Deployment** section in the main README.md

## Learning Resources

- **Architecture**: See README.md → Architecture section
- **API Reference**: See README.md → API Reference
- **Configuration**: See README.md → Configuration

## Support

Need help?
- Check the main README.md for detailed documentation
- Open an issue on GitHub
- Review the troubleshooting section above

---

Happy monitoring! 🎯
