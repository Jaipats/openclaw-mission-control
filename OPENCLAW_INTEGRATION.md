# OpenClaw Integration Guide

This guide explains how Mission Control integrates with OpenClaw's configuration system and best practices for using them together.

## Overview

Mission Control acts as a **monitoring and visualization layer** on top of OpenClaw, NOT a separate configuration system. It follows these principles:

✅ **Single Source of Truth**: OpenClaw's `~/.openclaw/openclaw.json` is the authoritative agent configuration  
✅ **Read from OpenClaw**: Agent configurations are fetched from OpenClaw Gateway  
✅ **Write to OpenClaw**: New agents/changes are saved to OpenClaw configuration  
✅ **Runtime Status Only**: Mission Control only tracks transient status (active/idle/error)  
✅ **No Duplication**: Avoids conflicts by never maintaining separate agent definitions  

## Architecture

```
┌────────────────────────┐
│  OpenClaw Gateway      │
│  (Port 18789)          │
│  ~/.openclaw/          │
│    openclaw.json       │ ← Single Source of Truth
└────────┬───────────────┘
         │
         │ RPC API
         │ (config.get, config.set, etc.)
         │
┌────────▼───────────────┐
│  Mission Control       │
│  (Port 4000)           │
│  ├─ Reads Config       │
│  ├─ Writes Config      │
│  └─ Tracks Status      │ ← Runtime only
└────────────────────────┘
```

## OpenClaw Configuration Standards

### Configuration Location

OpenClaw stores all configuration in:
```
~/.openclaw/openclaw.json
```

### Configuration Structure (JSON5 Format)

```json5
{
  "agent": {
    "model": "anthropic/claude-opus-4-5",  // Default model
    // ... other global settings
  },
  "agents": [  // Multi-agent configuration
    {
      "id": "master-orchestrator",
      "name": "Master Orchestrator",
      "type": "master",
      "parentId": null,
      "children": ["data-supervisor", "analytics-supervisor"],
      "model": "anthropic/claude-opus-4-5",
      "capabilities": ["coordination", "planning"],
      "config": {
        "maxConcurrent": 10,
        // Agent-specific settings
      },
      "metadata": {}
    },
    {
      "id": "data-supervisor",
      "name": "Data Supervisor",
      "type": "supervisor",
      "parentId": "master-orchestrator",
      "children": ["ingestion-worker", "validation-worker"],
      "model": "anthropic/claude-sonnet-4",
      "capabilities": ["data-processing"],
      "config": {},
      "metadata": {}
    }
    // ... more agents
  ]
}
```

## OpenClaw RPC API

Mission Control uses OpenClaw's Gateway RPC protocol at `http://localhost:18789/rpc`:

### Get Configuration
```bash
curl -X POST http://localhost:18789/rpc \
  -H "Content-Type: application/json" \
  -d '{"method": "config.get", "params": {}}'
```

### Set Configuration
```bash
curl -X POST http://localhost:18789/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "method": "config.set",
    "params": {
      "path": "agents",
      "value": [...]
    }
  }'
```

### Get Configuration Schema
```bash
curl -X POST http://localhost:18789/rpc \
  -H "Content-Type: application/json" \
  -d '{"method": "config.schema", "params": {}}'
```

### Unset Configuration
```bash
curl -X POST http://localhost:18789/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "method": "config.unset",
    "params": {"path": "agents.0"}
  }'
```

## Integration Modes

### Mode 1: Connected to OpenClaw (Recommended)

**When**: OpenClaw Gateway is running and accessible  
**Behavior**:
- Mission Control reads agents from `~/.openclaw/openclaw.json`
- Creating/updating agents writes to OpenClaw configuration
- Configuration changes in OpenClaw are detected and synced
- Requests are sent through OpenClaw Gateway

**Setup**:
```env
OPENCLAW_GATEWAY_URL=http://localhost:18789
```

### Mode 2: Standalone (Fallback)

**When**: OpenClaw Gateway is not accessible  
**Behavior**:
- Mission Control shows warning about disconnection
- Agents can still be created (stored in memory only)
- Requests are simulated (not sent to real agents)
- Data is lost on restart (no persistent storage)

**Warning**: This mode is for development/testing only. Always connect to OpenClaw in production.

## Synchronization

### Initial Load

On startup, Mission Control:
1. Connects to OpenClaw Gateway
2. Fetches current configuration via `config.get`
3. Loads all agents from `config.agents` array
4. Initializes runtime status tracking

### Real-time Sync

Mission Control polls OpenClaw configuration every 10 seconds (configurable):
- Detects changes made via OpenClaw CLI or Control UI
- Updates Mission Control UI automatically
- Cleans up status for deleted agents

### Manual Sync

Force sync from UI or API:
```bash
curl -X POST http://localhost:4000/api/agents/sync
```

## Agent Lifecycle

### Creating an Agent

**Via Mission Control UI**:
1. Click "Create Agent" button
2. Fill in details (name, type, parent, model)
3. Mission Control calls OpenClaw RPC `config.set`
4. Agent is added to `~/.openclaw/openclaw.json`
5. All connected clients receive update via WebSocket

**Via OpenClaw CLI**:
```bash
openclaw config set agents '[
  {"id": "new-agent", "name": "New Agent", "type": "worker", ...}
]'
```
Mission Control will detect the change within 10 seconds.

### Updating an Agent

**Configuration Updates** (model, capabilities, etc.):
- Writes to OpenClaw configuration
- Persisted to `~/.openclaw/openclaw.json`

**Status Updates** (active, idle, error):
- Tracked in Mission Control memory only
- Not persisted (intentionally ephemeral)
- Reset on Mission Control restart

### Deleting an Agent

Removes agent from OpenClaw configuration:
1. Removes from `config.agents` array
2. Removes from parent's `children` array
3. Recursively deletes child agents
4. Cleans up runtime status

## Best Practices

### ✅ DO

1. **Use OpenClaw CLI for bulk operations**:
   ```bash
   openclaw config set agents "$(cat agents.json)"
   ```

2. **Edit `~/.openclaw/openclaw.json` directly for complex changes**:
   - OpenClaw hot-reloads configuration changes
   - Mission Control will sync automatically

3. **Use Mission Control for**:
   - Real-time monitoring
   - Visual agent hierarchy
   - Trace tracking
   - Quick agent creation
   - Status visualization

4. **Version control your OpenClaw config**:
   ```bash
   cp ~/.openclaw/openclaw.json ~/my-project/openclaw.json
   git add openclaw.json
   ```

5. **Set appropriate models per agent**:
   ```json
   {
     "id": "heavy-analyzer",
     "model": "anthropic/claude-opus-4-5",  // More capable
     ...
   }
   ```

### ❌ DON'T

1. **Don't run multiple Mission Control instances** writing to same OpenClaw
   - Can cause race conditions
   - Use one Mission Control per OpenClaw Gateway

2. **Don't edit agents in both places simultaneously**
   - Changes can conflict
   - Let sync complete before next change

3. **Don't store secrets in agent config**
   - Use OpenClaw's security configuration
   - Use environment variables

4. **Don't rely on Mission Control status after restart**
   - Status is ephemeral by design
   - OpenClaw config is persistent

## Troubleshooting

### Mission Control can't connect to OpenClaw

**Check OpenClaw is running**:
```bash
# Check if OpenClaw Control UI is accessible
curl http://localhost:18789/health

# Check OpenClaw status
openclaw status
```

**Verify port configuration**:
```bash
# Default OpenClaw port is 18789
echo $OPENCLAW_GATEWAY_URL
```

**Check firewall/network**:
- OpenClaw and Mission Control must be on same network
- Check firewall rules allow port 18789

### Agents not syncing

**Force manual sync**:
```bash
curl -X POST http://localhost:4000/api/agents/sync
```

**Check OpenClaw configuration**:
```bash
openclaw config get agents
```

**Verify JSON5 format**:
```bash
# OpenClaw validates configuration schema
openclaw config validate
```

### Configuration conflicts

**Reset OpenClaw configuration**:
```bash
# Backup first
cp ~/.openclaw/openclaw.json ~/.openclaw/openclaw.json.backup

# Reset agents
openclaw config unset agents
```

**Reset Mission Control**:
```bash
# Restart Mission Control server
# Status will be cleared, config will reload from OpenClaw
```

## Advanced: Custom Agent Types

Define custom agent types in OpenClaw configuration:

```json5
{
  "agentTypes": {
    "data-processor": {
      "extends": "worker",
      "defaultModel": "anthropic/claude-sonnet-4",
      "capabilities": ["data-processing", "validation"],
      "config": {
        "maxBatchSize": 1000
      }
    }
  },
  "agents": [
    {
      "id": "processor-1",
      "name": "Data Processor 1",
      "type": "data-processor",  // Custom type
      ...
    }
  ]
}
```

Mission Control will respect these types and display them correctly.

## API Reference

### Mission Control → OpenClaw

| Mission Control Action | OpenClaw RPC Call | Effect |
|------------------------|-------------------|--------|
| Get Agents | `config.get` | Reads `agents` array |
| Create Agent | `config.set` | Appends to `agents` array |
| Update Agent | `config.set` | Updates agent in array |
| Delete Agent | `config.set` | Removes from array + parent's children |
| Send Request | `/api/request` | Routes to agent via gateway |

### OpenClaw → Mission Control

| OpenClaw Change | Mission Control Action | Sync Method |
|-----------------|------------------------|-------------|
| Config edited | Detect change | Polling (10s) |
| Agent added via CLI | Load new agent | Auto-sync |
| Agent deleted | Remove from UI | Auto-sync |
| Config reloaded | Full resync | Auto-sync |

## Migration from Standalone

If you created agents in Mission Control before connecting to OpenClaw:

1. **Export agents** (before connecting):
   ```bash
   curl http://localhost:4000/api/agents > agents.json
   ```

2. **Connect to OpenClaw**:
   ```env
   OPENCLAW_GATEWAY_URL=http://localhost:18789
   ```

3. **Import to OpenClaw**:
   ```bash
   # Convert format if needed, then:
   openclaw config set agents "$(cat agents.json)"
   ```

4. **Restart Mission Control** - will load from OpenClaw

## Support

For OpenClaw configuration issues:
- 📚 OpenClaw Docs: https://docs.openclaw.ai
- 🔧 OpenClaw CLI: `openclaw --help`
- 📋 Config Schema: `openclaw config schema`

For Mission Control integration issues:
- Check logs in terminal
- Verify connectivity with `/api/status` endpoint
- Review this integration guide

---

**Remember**: OpenClaw is the source of truth. Mission Control visualizes and monitors.
