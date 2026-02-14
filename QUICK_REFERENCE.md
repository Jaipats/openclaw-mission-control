# OpenClaw Mission Control - Quick Reference

## 🚀 Quick Start Commands

```bash
# First time setup
./setup.sh                  # Run setup script
npm install                 # Or install manually

# Development
npm run dev                 # Start both servers
npm run server              # Backend only
npm run client              # Frontend only

# Demo data
npm run seed                # Create sample agents & traces

# Production
npm run build               # Build for production
npm run preview             # Preview production build
```

## 🌐 URLs

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | Mission Control Dashboard |
| Backend API | http://localhost:4000 | REST API Server |
| WebSocket | ws://localhost:4000 | Real-time Updates |
| Health Check | http://localhost:4000/api/health | Server Status |

## 📋 UI Features

### Header Actions
- **Create Agent** - Open agent creation modal
- **Clear Traces** - Remove all trace history

### Agent Tree
- **Click Agent** - Select agent and filter traces
- **▶ Play Icon** - Simulate request to agent
- **🗑 Trash Icon** - Delete agent and children
- **Chevron ⌄** - Expand/collapse child agents

### Status Indicators
- 🟢 **Green** - Agent actively processing (pulsing)
- 🟠 **Orange** - Agent idle and ready
- 🔴 **Red** - Agent has error
- ⚫ **Gray** - Agent offline

### Stats Panel
- **Total Agents** - Count of all agents with status breakdown
- **Traces** - Total traces with completion status
- **Avg Duration** - Average request processing time

### Trace Panel
- **Auto-scroll** - Newest traces appear at top
- **Status Icons** - ✅ Completed, ⏰ Pending, ❌ Failed
- **Details** - View input/output payloads and metadata

## 🔌 API Quick Reference

### Agent Operations

```bash
# List all agents
curl http://localhost:4000/api/agents

# Create agent
curl -X POST http://localhost:4000/api/agents \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Agent","type":"worker","parentId":null}'

# Update agent status
curl -X PATCH http://localhost:4000/api/agents/{id}/status \
  -H "Content-Type: application/json" \
  -d '{"status":"active"}'

# Delete agent
curl -X DELETE http://localhost:4000/api/agents/{id}
```

### Trace Operations

```bash
# List all traces
curl http://localhost:4000/api/traces

# List traces for specific agent
curl "http://localhost:4000/api/traces?agentId={id}&limit=100"

# Create trace
curl -X POST http://localhost:4000/api/traces \
  -H "Content-Type: application/json" \
  -d '{"agentId":"...","action":"test","input":{}}'

# Clear all traces
curl -X DELETE http://localhost:4000/api/traces
```

### Gateway Request

```bash
# Send request through agent
curl -X POST http://localhost:4000/api/gateway/request \
  -H "Content-Type: application/json" \
  -d '{"agentId":"...","payload":{"action":"process"}}'
```

## 🎨 Agent Types

| Type | Purpose | Example Use |
|------|---------|-------------|
| `master` | Top-level orchestrator | Main coordinator |
| `supervisor` | Manages worker groups | Data pipeline supervisor |
| `worker` | Executes tasks | Data processor |
| `coordinator` | Routes requests | Load balancer |
| `analyzer` | Analyzes data | Pattern detector |

## 📊 Common Patterns

### Create Agent Hierarchy

1. Create **Master** agent (no parent)
2. Create **Supervisor** agents (parent: Master)
3. Create **Worker** agents (parent: Supervisor)
4. Create **Sub-workers** (parent: Worker)

### Monitor Agent Performance

1. Select agent in tree
2. View filtered traces in right panel
3. Check stats for completion rate
4. Review average duration

### Debug Failed Requests

1. Look for traces with ❌ icon
2. Click to expand details
3. Review output error message
4. Check agent status (🔴 red = error)

### Simulate Workflow

1. Create agent hierarchy
2. Click play icon (▶) on leaf agents
3. Watch status change: idle → active → idle
4. Trace appears showing full request flow

## 🛠️ Troubleshooting

| Problem | Quick Fix |
|---------|-----------|
| Port 4000 in use | `lsof -i :4000` then `kill -9 <PID>` |
| WebSocket won't connect | Ensure backend is running |
| Agents not showing | Refresh page, check console |
| Traces not updating | Check WebSocket connection status |
| npm install fails | Clear cache: `npm cache clean --force` |

## 📁 Key Files

| File | Purpose |
|------|---------|
| `server/index.js` | Main backend server |
| `server/agentManager.js` | Agent state management |
| `server/traceManager.js` | Trace tracking |
| `src/App.jsx` | Main React component |
| `src/components/AgentTree.jsx` | Agent visualization |
| `src/components/TracePanel.jsx` | Trace display |
| `.env` | Configuration |

## 🔧 Configuration

### Environment Variables (.env)

```env
# OpenClaw Gateway URL (modify for your setup)
OPENCLAW_GATEWAY_URL=http://localhost:8080

# Server port
SERVER_PORT=4000

# WebSocket update interval (ms)
WS_UPDATE_INTERVAL=100
```

### Vite Config (vite.config.js)

```javascript
{
  server: {
    port: 3000,              // Frontend port
    proxy: {
      '/api': 'http://localhost:4000',  // API proxy
      '/ws': 'ws://localhost:4000'      // WebSocket proxy
    }
  }
}
```

## 🎯 Pro Tips

1. **Use Demo Seed**: Run `npm run seed` to quickly test features
2. **Agent Naming**: Use descriptive names like "Data-Ingestion-Worker"
3. **Hierarchy Depth**: Keep hierarchies 3-4 levels max for clarity
4. **Trace Filtering**: Select agents to focus on specific workflows
5. **Status Monitoring**: Watch for 🔴 red dots indicating errors
6. **Clean Traces**: Periodically clear old traces for better performance
7. **Parent Selection**: Create top-down (master → supervisors → workers)
8. **Test Incrementally**: Create a few agents, test, then expand

## 🔗 Keyboard Shortcuts (Browser)

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + R` | Refresh dashboard |
| `Cmd/Ctrl + Shift + R` | Hard refresh (clear cache) |
| `Cmd/Ctrl + K` | Open browser console |
| `Esc` | Close modal dialogs |

## 📈 Monitoring Best Practices

1. **Start Small**: Create 2-3 agents first
2. **Test Each Agent**: Use simulate before building complex hierarchies
3. **Monitor Stats**: Keep eye on completion rates
4. **Check Duration**: Watch for slow requests
5. **Review Errors**: Investigate failed traces immediately
6. **Clean Up**: Delete unused agents
7. **Organize**: Use consistent naming conventions

## 🚦 Status Reference

### Agent Status Lifecycle

```
Created → idle (🟠)
  ↓
Request → active (🟢)
  ↓
Success → idle (🟠)
  ↓
Error → error (🔴)
  ↓
Manual Reset → idle (🟠)
```

### Trace Status Flow

```
Created → pending (⏰)
  ↓
Processing...
  ↓
Success → completed (✅)
OR
Failure → failed (❌)
```

## 💡 Example Workflows

### Data Processing Pipeline

```
Master Orchestrator
  └─ Data Supervisor
      ├─ Ingestion Worker (receives data)
      ├─ Validation Worker (checks data)
      └─ Transform Worker (processes data)
```

### Analytics System

```
Master Orchestrator
  └─ Analytics Supervisor
      ├─ Pattern Analyzer (finds patterns)
      ├─ Trend Analyzer (identifies trends)
      └─ Report Generator (creates reports)
```

### Multi-Service Coordinator

```
Service Coordinator
  ├─ Auth Service Worker
  ├─ Database Service Worker
  └─ Cache Service Worker
```

---

**Need More Help?**
- 📖 Full docs: `README.md`
- 🏗️ Architecture: `ARCHITECTURE.md`
- 🚀 Setup guide: `GETTING_STARTED.md`
