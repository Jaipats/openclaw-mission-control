# OpenClaw Mission Control

A modern, real-time monitoring and management dashboard for OpenClaw multi-agent systems. Mission Control provides a comprehensive view of your agent hierarchy, request traces, and system performance metrics.

![OpenClaw Mission Control](https://img.shields.io/badge/status-active-success)
![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)

## 📸 Preview

![OpenClaw Mission Control Dashboard](./assets/mission-control-ui.png)

*Real-time multi-agent monitoring with status indicators, hierarchical visualization, and comprehensive trace tracking*

## 🎯 Features

### 1. **Agent Hierarchy Visualization**
- **Tree Structure**: Visualize your multi-agent system as an interactive tree
- **Parent-Child Relationships**: Create sub-agents under parent agents
- **Agent Types**: Support for Master, Supervisor, Worker, Coordinator, and Analyzer agents
- **Real-time Updates**: Agent tree updates automatically via WebSocket

### 2. **Real-time Status Indicators**
- **Green Dot**: Agent is actively processing requests
- **Orange Dot**: Agent is idle and ready for work
- **Red Dot**: Agent encountered an error
- **Gray Dot**: Agent is offline

### 3. **Request Trace Tracking**
- **Complete Request Flow**: Track every request through your agent system
- **Input/Output Logging**: View full request and response payloads
- **Performance Metrics**: Monitor request duration and success rates
- **Agent-specific Traces**: Filter traces by individual agents

### 4. **System Statistics Dashboard**
- **Agent Metrics**: Total agents, active/idle/error counts
- **Trace Analytics**: Completed, pending, and failed request counts
- **Performance Stats**: Average request duration
- **Real-time Updates**: All stats update live as events occur

### 5. **WebSocket Integration**
- **Real-time Communication**: Instant updates for all system changes
- **Auto-reconnect**: Automatic reconnection with exponential backoff
- **Broadcast Events**: All connected clients receive updates simultaneously

## 🚀 Quick Start

### Prerequisites

- Node.js >= 16.0.0
- npm or yarn
- OpenClaw Gateway (running instance)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ClawMissionControl
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` to configure your OpenClaw Gateway URL:
   ```env
   OPENCLAW_GATEWAY_URL=http://localhost:8080
   SERVER_PORT=4000
   WS_UPDATE_INTERVAL=100
   ```

4. **Start the application**
   ```bash
   npm run dev
   ```

   This will start:
   - Backend server on `http://localhost:4000`
   - Frontend dev server on `http://localhost:3000`
   - WebSocket server on `ws://localhost:4000`

5. **Open your browser**
   ```
   http://localhost:3000
   ```

## 📖 Usage Guide

### Creating Agents

1. Click the **"Create Agent"** button in the header
2. Fill in the agent details:
   - **Name**: A descriptive name for your agent
   - **Type**: Select from Master, Supervisor, Worker, Coordinator, or Analyzer
   - **Parent Agent**: (Optional) Select a parent to create a sub-agent
3. Click **"Create Agent"**

### Managing Agents

- **Select Agent**: Click on any agent in the tree to view its traces
- **Simulate Request**: Click the play icon (▶) to simulate a request to that agent
- **Delete Agent**: Click the trash icon to remove an agent (and all its sub-agents)
- **Expand/Collapse**: Use the chevron icons to expand/collapse agent children

### Viewing Traces

- **All Traces**: View all system traces in the right panel
- **Agent-specific Traces**: Select an agent to filter traces for that agent only
- **Trace Details**: Each trace shows:
  - Action type
  - Agent name
  - Timestamp
  - Duration
  - Status (pending/completed/failed)
  - Input and output payloads
  - Metadata

### Clearing Traces

Click the **"Clear Traces"** button in the header to remove all historical traces (this doesn't affect agents).

## 🏗️ Architecture

### Backend (Node.js + Express + WebSocket)

```
server/
├── index.js          # Main server, REST API, WebSocket server
├── agentManager.js   # Agent state management and CRUD operations
└── traceManager.js   # Trace state management and analytics
```

**Key Components:**
- **Express Server**: REST API for agent and trace management
- **WebSocket Server**: Real-time bidirectional communication
- **Agent Manager**: In-memory agent state with tree operations
- **Trace Manager**: Request tracking with performance analytics

### Frontend (React + Vite)

```
src/
├── components/
│   ├── Header.jsx           # Top navigation and actions
│   ├── AgentTree.jsx        # Hierarchical agent visualization
│   ├── TracePanel.jsx       # Request trace viewer
│   ├── StatsPanel.jsx       # System statistics
│   └── CreateAgentModal.jsx # Agent creation form
├── hooks/
│   ├── useWebSocket.js      # WebSocket connection management
│   ├── useAgents.js         # Agent state and API calls
│   └── useTraces.js         # Trace state and API calls
├── App.jsx                  # Main application component
└── main.jsx                 # Application entry point
```

## 🔌 API Reference

### REST API Endpoints

#### Agents

**GET /api/agents**
- Get all agents
- Response: `Agent[]`

**POST /api/agents**
- Create a new agent
- Body: `{ name, type, parentId?, config? }`
- Response: `Agent`

**PATCH /api/agents/:id/status**
- Update agent status
- Body: `{ status: 'idle' | 'active' | 'error' | 'offline' }`
- Response: `Agent`

**DELETE /api/agents/:id**
- Delete an agent (and all children)
- Response: `204 No Content`

#### Traces

**GET /api/traces**
- Get traces (optionally filtered by agent)
- Query: `?agentId=<id>&limit=<number>`
- Response: `Trace[]`

**POST /api/traces**
- Create a new trace
- Body: `{ agentId, action, input?, output?, metadata? }`
- Response: `Trace`

**DELETE /api/traces**
- Clear all traces
- Response: `204 No Content`

#### Gateway Integration

**POST /api/gateway/request**
- Send request to OpenClaw Gateway through an agent
- Body: `{ agentId, payload }`
- Response: Gateway response

**GET /api/health**
- Health check endpoint
- Response: `{ status: 'ok', timestamp }`

### WebSocket Events

#### Server → Client

- `INIT`: Initial state on connection
- `AGENT_CREATED`: New agent created
- `AGENT_STATUS_UPDATED`: Agent status changed
- `AGENT_DELETED`: Agent removed
- `TRACE_CREATED`: New trace recorded
- `TRACE_UPDATED`: Trace updated
- `TRACES_CLEARED`: All traces cleared

## 🎨 UI Theme

Mission Control features a modern dark theme inspired by mission control centers:

- **Primary Background**: Deep space blue (`#0a0e27`)
- **Secondary Background**: Dark navy (`#141933`)
- **Accent Colors**:
  - Blue (`#00d4ff`) - Primary actions
  - Green (`#00ff88`) - Active/success states
  - Orange (`#ff9500`) - Idle/warning states
  - Red (`#ff3366`) - Error states

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# OpenClaw Gateway URL
OPENCLAW_GATEWAY_URL=http://localhost:8080

# Mission Control Server Port
SERVER_PORT=4000

# WebSocket Update Interval (milliseconds)
WS_UPDATE_INTERVAL=100
```

### OpenClaw Gateway Integration

To integrate with your OpenClaw Gateway:

1. Update `OPENCLAW_GATEWAY_URL` in `.env`
2. Modify `server/index.js` > `simulateGatewayRequest()` function to call your actual gateway:

```javascript
async function simulateGatewayRequest(agentId, payload) {
  const response = await fetch(`${process.env.OPENCLAW_GATEWAY_URL}/api/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agentId, ...payload }),
  });
  return response.json();
}
```

## 🛠️ Development

### Project Scripts

```bash
# Start both backend and frontend in development mode
npm run dev

# Start backend only
npm run server

# Start frontend only
npm run client

# Build for production
npm run build

# Preview production build
npm run preview
```

### Tech Stack

**Backend:**
- Node.js
- Express.js
- WebSocket (ws)
- uuid

**Frontend:**
- React 18
- Vite
- Lucide React (icons)
- Axios

### Adding New Features

1. **New Agent Type**: Add to the type enum in `CreateAgentModal.jsx`
2. **New Trace Field**: Update `TraceManager.js` and `TracePanel.jsx`
3. **New Status**: Update status colors in CSS and status handlers
4. **Custom Metrics**: Extend `StatsPanel.jsx` with new calculations

## 🚢 Production Deployment

### Building for Production

```bash
npm run build
```

This creates an optimized build in the `dist/` directory.

### Deployment Options

**Option 1: Single Server**
```bash
# Serve the built frontend and run the backend
node server/index.js
# Serve dist/ with a static file server (nginx, Apache, etc.)
```

**Option 2: Separate Services**
- Deploy backend to a Node.js hosting service (Heroku, Railway, Render)
- Deploy frontend to a static hosting service (Vercel, Netlify, Cloudflare Pages)
- Update API URLs in frontend to point to backend service

**Option 3: Docker**
Create a `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 4000 3000
CMD ["npm", "run", "dev"]
```

## 📊 Use Cases

1. **Development & Debugging**: Monitor agent behavior during development
2. **System Monitoring**: Real-time observability of production multi-agent systems
3. **Performance Analysis**: Track request patterns and identify bottlenecks
4. **Agent Management**: Dynamically create and configure agents
5. **Demonstration**: Visualize your multi-agent architecture to stakeholders

## 🤝 Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🐛 Troubleshooting

### WebSocket Connection Failed

- Ensure the backend server is running on port 4000
- Check for firewall/proxy blocking WebSocket connections
- Verify CORS settings in `server/index.js`

### Agents Not Appearing

- Check browser console for API errors
- Verify backend server is running
- Check that WebSocket connection is established (look for "WebSocket connected" in console)

### Traces Not Updating

- Ensure WebSocket connection is active
- Check that agent has status set to 'active' when processing
- Verify trace creation API calls are successful

## 📞 Support

For issues, questions, or contributions:
- Open an issue on GitHub
- Contact the development team
- Check the documentation

---

Built with ❤️ for the OpenClaw ecosystem
