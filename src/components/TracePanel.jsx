import React, { useEffect, useRef } from 'react';
import { Activity, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import './TracePanel.css';

function TraceItem({ trace, agents }) {
  const agent = agents.find(a => a.id === trace.agentId);
  
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} className="status-icon success" />;
      case 'failed':
        return <AlertCircle size={16} className="status-icon error" />;
      default:
        return <Clock size={16} className="status-icon pending" />;
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    });
  };

  const formatDuration = (ms) => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <div className="trace-item slide-in">
      <div className="trace-header">
        <div className="trace-header-left">
          {getStatusIcon(trace.status)}
          <span className="trace-action">{trace.action}</span>
          {agent && <span className="trace-agent">{agent.name}</span>}
        </div>
        <div className="trace-header-right">
          <span className="trace-time">{formatTime(trace.timestamp)}</span>
          {trace.duration && (
            <span className="trace-duration">{formatDuration(trace.duration)}</span>
          )}
        </div>
      </div>
      
      {trace.input && (
        <div className="trace-content">
          <div className="trace-label">Input:</div>
          <pre className="trace-data">{JSON.stringify(trace.input, null, 2)}</pre>
        </div>
      )}
      
      {trace.output && (
        <div className="trace-content">
          <div className="trace-label">Output:</div>
          <pre className="trace-data">{JSON.stringify(trace.output, null, 2)}</pre>
        </div>
      )}
      
      {trace.metadata && Object.keys(trace.metadata).length > 0 && (
        <div className="trace-metadata">
          {Object.entries(trace.metadata).map(([key, value]) => (
            <span key={key} className="trace-meta-item">
              {key}: {String(value)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function TracePanel({ traces, selectedAgent, agents }) {
  const contentRef = useRef(null);
  const prevTracesLengthRef = useRef(traces.length);

  useEffect(() => {
    // Auto-scroll to bottom when new traces arrive
    if (contentRef.current && traces.length > prevTracesLengthRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
    prevTracesLengthRef.current = traces.length;
  }, [traces.length]);

  return (
    <div className="trace-panel card">
      <div className="panel-header">
        <h2>
          <Activity size={20} />
          Request Traces
        </h2>
        <div className="trace-count">
          {traces.length} trace{traces.length !== 1 ? 's' : ''}
          {selectedAgent && ` for ${selectedAgent.name}`}
        </div>
      </div>
      
      <div className="trace-content" ref={contentRef}>
        {traces.length === 0 ? (
          <div className="empty-state">
            <Activity size={48} strokeWidth={1} />
            <p>No traces yet</p>
            <span>Traces will appear as agents process requests</span>
          </div>
        ) : (
          <div className="trace-list">
            {traces.slice().reverse().map(trace => (
              <TraceItem key={trace.id} trace={trace} agents={agents} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
