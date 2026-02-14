import { v4 as uuidv4 } from 'uuid';

export class TraceManager {
  constructor() {
    this.traces = new Map();
    this.agentTraces = new Map(); // agentId -> [traceIds]
  }

  createTrace(agentId, action, input = null, output = null, metadata = {}) {
    const trace = {
      id: uuidv4(),
      agentId,
      action,
      input,
      output,
      metadata,
      timestamp: new Date().toISOString(),
      duration: null,
      status: 'pending', // 'pending', 'completed', 'failed'
    };

    this.traces.set(trace.id, trace);

    // Add to agent's trace list
    if (!this.agentTraces.has(agentId)) {
      this.agentTraces.set(agentId, []);
    }
    this.agentTraces.get(agentId).push(trace.id);

    return trace;
  }

  getTrace(id) {
    return this.traces.get(id);
  }

  getAllTraces(limit = 1000) {
    const allTraces = Array.from(this.traces.values());
    
    // Sort by timestamp descending (most recent first)
    allTraces.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    return limit ? allTraces.slice(0, limit) : allTraces;
  }

  getTracesByAgent(agentId, limit = 100) {
    const traceIds = this.agentTraces.get(agentId) || [];
    const traces = traceIds
      .map(id => this.traces.get(id))
      .filter(Boolean)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    return limit ? traces.slice(0, limit) : traces;
  }

  updateTrace(id, updates) {
    const trace = this.traces.get(id);
    if (!trace) return null;

    // Calculate duration if output is being set
    if (updates.output && !trace.output) {
      const startTime = new Date(trace.timestamp);
      const endTime = new Date();
      updates.duration = endTime - startTime;
      updates.status = 'completed';
    }

    Object.assign(trace, updates);
    return trace;
  }

  completeTrace(id, output, metadata = {}) {
    return this.updateTrace(id, {
      output,
      metadata: { ...this.traces.get(id)?.metadata, ...metadata },
      status: 'completed',
    });
  }

  failTrace(id, error, metadata = {}) {
    return this.updateTrace(id, {
      output: { error: error.message || error },
      metadata: { ...this.traces.get(id)?.metadata, ...metadata },
      status: 'failed',
    });
  }

  deleteTrace(id) {
    const trace = this.traces.get(id);
    if (!trace) return false;

    // Remove from agent's trace list
    if (this.agentTraces.has(trace.agentId)) {
      const agentTraceList = this.agentTraces.get(trace.agentId);
      const index = agentTraceList.indexOf(id);
      if (index > -1) {
        agentTraceList.splice(index, 1);
      }
    }

    this.traces.delete(id);
    return true;
  }

  clearTraces() {
    this.traces.clear();
    this.agentTraces.clear();
  }

  getTraceStats(agentId = null) {
    const traces = agentId 
      ? this.getTracesByAgent(agentId)
      : this.getAllTraces();

    const stats = {
      total: traces.length,
      pending: 0,
      completed: 0,
      failed: 0,
      avgDuration: 0,
    };

    let totalDuration = 0;
    let durationCount = 0;

    traces.forEach(trace => {
      stats[trace.status]++;
      if (trace.duration) {
        totalDuration += trace.duration;
        durationCount++;
      }
    });

    stats.avgDuration = durationCount > 0 ? totalDuration / durationCount : 0;

    return stats;
  }

  getRecentTraces(minutes = 5, agentId = null) {
    const cutoffTime = new Date(Date.now() - minutes * 60 * 1000);
    const traces = agentId 
      ? this.getTracesByAgent(agentId)
      : this.getAllTraces();

    return traces.filter(trace => new Date(trace.timestamp) > cutoffTime);
  }
}
