# Troubleshooting OpenClaw Configuration Loading

This guide helps diagnose and fix issues with Mission Control not loading OpenClaw configuration.

## Quick Diagnostic

Run the diagnostic tool to check your OpenClaw connection:

```bash
npm run diagnose
```

This will:
- Check if OpenClaw Gateway is running
- Verify configuration file exists
- Test RPC API connectivity
- Display configuration structure
- Provide specific troubleshooting steps

## Common Issues and Solutions

### Issue 1: "Could not connect to OpenClaw Gateway"

**Symptoms:**
- Server logs show: `⚠️ Could not connect to OpenClaw Gateway at http://localhost:18789`
- Mission Control works in standalone mode
- No agents loaded on startup

**Solution:**

1. **Check if OpenClaw is installed:**
   ```bash
   openclaw --version
   ```
   
   If not installed, visit https://openclaw.ai

2. **Check if OpenClaw Gateway is running:**
   ```bash
   openclaw status
   ```
   
   If not running:
   ```bash
   openclaw start
   ```

3. **Verify the Gateway is accessible:**
   ```bash
   curl http://localhost:18789/health
   ```
   
   Should return a 200 status

4. **Check the correct port:**
   OpenClaw Gateway typically runs on port **18789** (not 8080)
   
   Verify in your `.env`:
   ```env
   OPENCLAW_GATEWAY_URL=http://localhost:18789
   ```

### Issue 2: "Failed to load OpenClaw configuration"

**Symptoms:**
- Server connects to OpenClaw but can't load config
- Error: `Failed to fetch OpenClaw config`

**Solution:**

1. **Check if configuration file exists:**
   ```bash
   ls -la ~/.openclaw/openclaw.json
   ```

2. **If file doesn't exist, initialize OpenClaw:**
   ```bash
   openclaw onboard
   ```
   
   Or create minimal config:
   ```bash
   openclaw configure
   ```

3. **Verify configuration is valid JSON:**
   ```bash
   cat ~/.openclaw/openclaw.json | json_pp
   ```
   
   Or:
   ```bash
   openclaw config validate
   ```

4. **Check configuration structure:**
   ```bash
   openclaw config get
   ```

### Issue 3: "No agents array found"

**Symptoms:**
- OpenClaw connects successfully
- But server logs: `⚠️ No agents array found in OpenClaw config`
- Starting with empty agent list

**This is NORMAL if:**
- You haven't created any agents yet
- This is a fresh OpenClaw installation

**Solution:**

Create the agents array in OpenClaw config:

```bash
# Method 1: Via OpenClaw CLI
openclaw config set agents '[]'

# Method 2: Edit config directly
# Add to ~/.openclaw/openclaw.json:
{
  "agent": {
    "model": "anthropic/claude-opus-4-5"
  },
  "agents": []  // <- Add this
}
```

Then create agents via:
1. Mission Control UI ("Create Agent" button)
2. OpenClaw CLI:
   ```bash
   openclaw config set agents '[
     {
       "id": "my-agent",
       "name": "My First Agent",
       "type": "worker"
     }
   ]'
   ```

### Issue 4: Configuration not syncing

**Symptoms:**
- Create agent in Mission Control but it doesn't persist
- Changes made via OpenClaw CLI don't appear in Mission Control

**Solution:**

1. **Force manual sync:**
   ```bash
   curl -X POST http://localhost:4000/api/agents/sync
   ```

2. **Check config watcher is running:**
   Look for this in server logs:
   ```
   👀 Watching OpenClaw configuration for changes
   ```

3. **Verify write permissions:**
   ```bash
   ls -la ~/.openclaw/openclaw.json
   ```
   
   File should be writable by your user

4. **Check for JSON syntax errors:**
   After making changes, validate:
   ```bash
   openclaw config validate
   ```

5. **Restart Mission Control:**
   Sometimes a restart is needed after manual config edits:
   ```bash
   # Stop the server (Ctrl+C)
   npm run dev
   ```

### Issue 5: RPC API errors

**Symptoms:**
- Error: `Invalid response structure from OpenClaw`
- HTTP 404 or 500 errors

**Solution:**

1. **Check OpenClaw version:**
   ```bash
   openclaw --version
   ```
   
   Mission Control expects OpenClaw with RPC API support

2. **Test RPC endpoint manually:**
   ```bash
   curl -X POST http://localhost:18789/rpc \
     -H "Content-Type: application/json" \
     -d '{"method": "config.get", "params": {}}'
   ```

3. **Check OpenClaw logs:**
   ```bash
   openclaw logs
   ```
   
   Look for API errors or warnings

4. **Restart OpenClaw Gateway:**
   ```bash
   openclaw restart
   ```

### Issue 6: Port conflicts

**Symptoms:**
- Error: `EADDRINUSE: address already in use`
- OpenClaw Gateway won't start

**Solution:**

1. **Check what's using the port:**
   ```bash
   lsof -i :18789
   ```

2. **Kill the process:**
   ```bash
   kill -9 <PID>
   ```

3. **Or use a different port:**
   
   In `.env`:
   ```env
   OPENCLAW_GATEWAY_URL=http://localhost:18790
   ```
   
   Then configure OpenClaw to use that port (see OpenClaw docs)

## Debugging Steps

### 1. Enable Verbose Logging

Edit `server/index.js` and add more console.log statements:

```javascript
// At the top
const DEBUG = true;

// In the OpenClaw client methods
if (DEBUG) console.log('Request:', method, params);
if (DEBUG) console.log('Response:', response.data);
```

### 2. Check Network Traffic

Use a network monitor to see requests:

```bash
# Terminal 1: Run Mission Control
npm run dev

# Terminal 2: Monitor network
tcpdump -i lo0 -A port 18789
```

### 3. Test with curl

Test each endpoint individually:

```bash
# Health check
curl http://localhost:18789/health

# Get config
curl -X POST http://localhost:18789/rpc \
  -H "Content-Type: application/json" \
  -d '{"method": "config.get", "params": {}}'

# Get schema
curl -X POST http://localhost:18789/rpc \
  -H "Content-Type: application/json" \
  -d '{"method": "config.schema", "params": {}}'
```

### 4. Check File Permissions

```bash
# Check OpenClaw directory
ls -la ~/.openclaw/

# Should show:
# - openclaw.json (readable and writable)
# - No permission errors

# Fix permissions if needed
chmod 600 ~/.openclaw/openclaw.json
```

### 5. Validate Configuration Format

Your `~/.openclaw/openclaw.json` should look like:

```json
{
  "agent": {
    "model": "anthropic/claude-opus-4-5"
  },
  "agents": [
    {
      "id": "agent-1",
      "name": "Agent 1",
      "type": "worker",
      "parentId": null,
      "children": [],
      "model": "anthropic/claude-sonnet-4",
      "capabilities": [],
      "config": {},
      "metadata": {}
    }
  ]
}
```

## Still Having Issues?

### Fallback: Use Standalone Mode

Mission Control can work without OpenClaw for development:

1. **Just start Mission Control:**
   ```bash
   npm run dev
   ```

2. **Ignore the OpenClaw warning:**
   The app will work but agents won't persist

3. **Create agents in the UI:**
   They'll be stored in memory only

### Get Help

1. **Check the logs:**
   ```bash
   # Mission Control logs
   npm run server
   
   # OpenClaw logs
   openclaw logs
   ```

2. **Run the diagnostic:**
   ```bash
   npm run diagnose
   ```

3. **Check configuration:**
   ```bash
   openclaw config get | json_pp
   ```

4. **Review documentation:**
   - [OPENCLAW_INTEGRATION.md](./OPENCLAW_INTEGRATION.md)
   - https://docs.openclaw.ai

5. **Check OpenClaw status:**
   ```bash
   openclaw status
   openclaw doctor  # if available
   ```

## Expected Startup Output

When everything is working correctly, you should see:

```
🚀 OpenClaw Mission Control Server running on port 4000
📊 WebSocket server ready
🔗 OpenClaw Gateway: http://localhost:18789
🔍 Checking OpenClaw Gateway at http://localhost:18789...
✅ Connected to OpenClaw Gateway at http://localhost:18789
📦 Loaded 5 agents from OpenClaw configuration
👀 Watching OpenClaw configuration for changes
```

If you see warnings or errors, refer to the specific issue above.

## Configuration Checklist

- [ ] OpenClaw is installed (`openclaw --version` works)
- [ ] OpenClaw Gateway is running (`openclaw status` shows running)
- [ ] Configuration file exists (`~/.openclaw/openclaw.json` exists)
- [ ] Configuration is valid JSON (`openclaw config validate` passes)
- [ ] Port 18789 is accessible (`curl http://localhost:18789/health` succeeds)
- [ ] `.env` file has correct URL (`OPENCLAW_GATEWAY_URL=http://localhost:18789`)
- [ ] Mission Control can connect (server logs show `✅ Connected`)
- [ ] Agents array exists in config (can be empty: `"agents": []`)

Run through this checklist to identify any missing pieces.
