import React from 'react';
import { TrendingUp, Activity, CheckCircle, AlertCircle } from 'lucide-react';
import './StatsPanel.css';

export function StatsPanel({ agents, traces, selectedAgent }) {
  const getStats = () => {
    const relevantAgents = selectedAgent ? [selectedAgent] : agents;
    const relevantTraces = selectedAgent 
      ? traces.filter(t => t.agentId === selectedAgent.id)
      : traces;

    return {
      totalAgents: agents.length,
      activeAgents: agents.filter(a => a.status === 'active').length,
      idleAgents: agents.filter(a => a.status === 'idle').length,
      errorAgents: agents.filter(a => a.status === 'error').length,
      totalTraces: relevantTraces.length,
      completedTraces: relevantTraces.filter(t => t.status === 'completed').length,
      pendingTraces: relevantTraces.filter(t => t.status === 'pending').length,
      failedTraces: relevantTraces.filter(t => t.status === 'failed').length,
      avgDuration: calculateAvgDuration(relevantTraces),
    };
  };

  const calculateAvgDuration = (traceList) => {
    const completedTraces = traceList.filter(t => t.duration);
    if (completedTraces.length === 0) return 0;
    
    const total = completedTraces.reduce((sum, t) => sum + t.duration, 0);
    return Math.round(total / completedTraces.length);
  };

  const formatDuration = (ms) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const stats = getStats();

  return (
    <div className="stats-panel card">
      <div className="panel-header">
        <h2>
          <TrendingUp size={20} />
          System Statistics
        </h2>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Total Agents</span>
            <Activity size={16} className="stat-icon" />
          </div>
          <div className="stat-value">{stats.totalAgents}</div>
          <div className="stat-breakdown">
            <span className="stat-item active">{stats.activeAgents} active</span>
            <span className="stat-item idle">{stats.idleAgents} idle</span>
            {stats.errorAgents > 0 && (
              <span className="stat-item error">{stats.errorAgents} error</span>
            )}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Traces</span>
            <CheckCircle size={16} className="stat-icon" />
          </div>
          <div className="stat-value">{stats.totalTraces}</div>
          <div className="stat-breakdown">
            <span className="stat-item success">{stats.completedTraces} completed</span>
            <span className="stat-item pending">{stats.pendingTraces} pending</span>
            {stats.failedTraces > 0 && (
              <span className="stat-item error">{stats.failedTraces} failed</span>
            )}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Avg Duration</span>
            <AlertCircle size={16} className="stat-icon" />
          </div>
          <div className="stat-value">
            {stats.avgDuration > 0 ? formatDuration(stats.avgDuration) : '-'}
          </div>
          <div className="stat-breakdown">
            <span className="stat-item">Per request</span>
          </div>
        </div>
      </div>
    </div>
  );
}
