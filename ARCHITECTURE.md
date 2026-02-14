# OpenClaw Mission Control - Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    OpenClaw Mission Control                      │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────┐          ┌──────────────────────────┐
│       Frontend           │          │        Backend           │
│   (React + Vite)         │◄────────►│  (Node.js + Express)     │
│   Port 3000              │  HTTP/WS │   Port 4000              │
└──────────────────────────┘          └──────────────────────────┘
           │                                     │
           │                                     │
           ▼                                     ▼
┌──────────────────────────┐          ┌──────────────────────────┐
│   UI Components          │          │   API Endpoints          │
│   ├─ Header              │          │   ├─ /api/agents        │
│   ├─ AgentTree           │          │   ├─ /api/traces        │
│   ├─ TracePanel          │          │   ├─ /api/gateway       │
│   ├─ StatsPanel          │          │   └─ /api/health        │
│   └─ CreateAgentModal    │          │                          │
└──────────────────────────┘          └──────────────────────────┘
           │                                     │
           │                                     │
           ▼                                     ▼
┌──────────────────────────┐          ┌──────────────────────────┐
│   Custom Hooks           │          │   Managers               │
│   ├─ useWebSocket        │          │   ├─ AgentManager       │
│   ├─ useAgents           │          │   └─ TraceManager       │
│   └─ useTraces           │          │                          │
└──────────────────────────┘          └──────────────────────────┘
                                                 │
                                                 │
                                                 ▼
                                      ┌──────────────────────────┐
                                      │   OpenClaw Gateway       │
                                      │   (Your Integration)     │
                                      └──────────────────────────┘
```

## Data Flow

### 1. Agent Creation Flow

```
User Input → CreateAgentModal → POST /api/agents → AgentManager
                                         │
                                         ├─► Store in Memory
                                         ├─► Broadcast via WebSocket
                                         └─► Update UI (Real-time)
```

### 2. Request Processing Flow

```
User Click → Simulate Request → POST /api/gateway/request
                                         │
                                         ├─► Update Agent Status (active)
                                         ├─► Create Trace (pending)
                                         ├─► Call OpenClaw Gateway
                                         ├─► Update Trace (completed)
                                         └─► Update Agent Status (idle)
                                                  │
                                                  └─► Broadcast All Updates
```

### 3. Real-time Update Flow

```
Backend Event → WebSocket Broadcast → All Connected Clients
                                              │
                                              ├─► Update Agent State
                                              ├─► Update Trace List
                                              └─► Re-render UI
```

## Component Hierarchy

```
App
├── Header
│   ├── Logo & Title
│   ├── Create Agent Button
│   └── Clear Traces Button
│
├── Main Content
│   ├── Left Panel
│   │   ├── StatsPanel
│   │   │   └── Stat Cards (Agents, Traces, Duration)
│   │   │
│   │   └── AgentTree
│   │       └── AgentNode (Recursive)
│   │           ├── Status Indicator
│   │           ├── Agent Info
│   │           ├── Action Buttons
│   │           └── Child Nodes
│   │
│   └── Right Panel
│       └── TracePanel
│           └── TraceItem[]
│               ├── Status Icon
│               ├── Action & Agent
│               ├── Timestamp & Duration
│               ├── Input Data
│               ├── Output Data
│               └── Metadata
│
└── CreateAgentModal (Conditional)
    └── Form Fields
        ├── Name
        ├── Type
        └── Parent
```

## State Management

### Frontend State

```
┌─────────────────────────┐
│   App Component State   │
├─────────────────────────┤
│ - agents: Agent[]       │
│ - traces: Trace[]       │
│ - selectedAgent: Agent  │
│ - showCreateModal: bool │
└─────────────────────────┘
         │
         ├──► Updated by WebSocket events
         ├──► Updated by API calls
         └──► Passed to child components
```

### Backend State

```
┌─────────────────────────┐
│    AgentManager         │
├─────────────────────────┤
│ agents: Map<id, Agent>  │
├─────────────────────────┤
│ Methods:                │
│ - createAgent()         │
│ - updateAgentStatus()   │
│ - deleteAgent()         │
│ - getAgentTree()        │
└─────────────────────────┘

┌─────────────────────────┐
│    TraceManager         │
├─────────────────────────┤
│ traces: Map<id, Trace>  │
│ agentTraces: Map        │
├─────────────────────────┤
│ Methods:                │
│ - createTrace()         │
│ - updateTrace()         │
│ - getTracesByAgent()    │
│ - getTraceStats()       │
└─────────────────────────┘
```

## WebSocket Events

### Server → Client

| Event | Description | Payload |
|-------|-------------|---------|
| `INIT` | Initial state on connection | `{ agents: [], traces: [] }` |
| `AGENT_CREATED` | New agent created | `Agent` |
| `AGENT_STATUS_UPDATED` | Agent status changed | `Agent` |
| `AGENT_DELETED` | Agent removed | `{ id: string }` |
| `TRACE_CREATED` | New trace recorded | `Trace` |
| `TRACE_UPDATED` | Trace updated | `Trace` |
| `TRACES_CLEARED` | All traces cleared | `null` |

## Data Models

### Agent Model

```typescript
interface Agent {
  id: string;              // UUID
  name: string;            // Display name
  type: AgentType;         // master | supervisor | worker | etc.
  parentId: string | null; // Parent agent ID
  children: string[];      // Child agent IDs
  status: AgentStatus;     // idle | active | error | offline
  config: object;          // Custom configuration
  createdAt: string;       // ISO timestamp
  lastActive: string;      // ISO timestamp
  metadata: object;        // Additional data
}
```

### Trace Model

```typescript
interface Trace {
  id: string;          // UUID
  agentId: string;     // Associated agent
  action: string;      // Action name
  input: any;          // Request payload
  output: any;         // Response payload
  metadata: object;    // Additional data
  timestamp: string;   // ISO timestamp
  duration: number;    // Milliseconds
  status: TraceStatus; // pending | completed | failed
}
```

## API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/agents` | List all agents |
| POST | `/api/agents` | Create new agent |
| PATCH | `/api/agents/:id/status` | Update agent status |
| DELETE | `/api/agents/:id` | Delete agent |
| GET | `/api/traces` | List traces (optional filter) |
| POST | `/api/traces` | Create new trace |
| DELETE | `/api/traces` | Clear all traces |
| POST | `/api/gateway/request` | Send request via gateway |
| GET | `/api/health` | Health check |

## Status Indicators

### Agent Status

| Status | Color | Indicator | Meaning |
|--------|-------|-----------|---------|
| `active` | Green 🟢 | Pulsing | Processing requests |
| `idle` | Orange 🟠 | Solid | Ready, waiting |
| `error` | Red 🔴 | Solid | Error occurred |
| `offline` | Gray ⚫ | Solid | Not connected |

### Trace Status

| Status | Icon | Color | Meaning |
|--------|------|-------|---------|
| `pending` | ⏰ | Orange | In progress |
| `completed` | ✅ | Green | Successfully completed |
| `failed` | ❌ | Red | Failed with error |

## Security Considerations

1. **CORS**: Configured for localhost development
2. **Input Validation**: Add validation for production
3. **Authentication**: Not implemented (add for production)
4. **Rate Limiting**: Not implemented (add for production)
5. **WebSocket Security**: Consider WSS (WebSocket Secure) for production

## Performance Notes

1. **In-Memory Storage**: Current implementation uses Maps
   - Fast for development/demos
   - Consider Redis/Database for production
   - Data lost on server restart

2. **WebSocket Broadcasting**: Efficient for real-time updates
   - All clients receive all events
   - Consider room-based broadcasting for scale

3. **Trace Limit**: Default 1000 traces
   - Adjust via API query params
   - Consider pagination for large datasets

## Extensibility Points

1. **Custom Agent Types**: Edit CreateAgentModal.jsx
2. **Additional Trace Fields**: Extend TraceManager.js
3. **Custom Metrics**: Add to StatsPanel.jsx
4. **Gateway Integration**: Implement in server/index.js
5. **Persistence Layer**: Replace Maps with database
6. **Authentication**: Add middleware to Express routes
7. **Monitoring**: Add logging/metrics collection
8. **Clustering**: Add Redis for multi-instance sync

## Technology Stack

### Frontend
- **React 18**: UI framework
- **Vite**: Build tool & dev server
- **Axios**: HTTP client
- **Lucide React**: Icon library
- **WebSocket API**: Real-time communication

### Backend
- **Node.js**: Runtime
- **Express.js**: Web framework
- **ws**: WebSocket library
- **uuid**: ID generation
- **cors**: CORS middleware

### Development
- **Concurrently**: Run multiple npm scripts
- **Hot Module Replacement**: Fast development
