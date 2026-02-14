import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Play, Trash2, Circle } from 'lucide-react';
import './AgentTree.css';

function AgentNode({ agent, agents, selectedAgent, onSelectAgent, onDeleteAgent, onSimulateRequest, level = 0 }) {
  const [expanded, setExpanded] = useState(true);
  const children = agents.filter(a => a.parentId === agent.id);
  const hasChildren = children.length > 0;

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'active';
      case 'idle': return 'idle';
      case 'error': return 'error';
      default: return 'offline';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'active': return 'Working';
      case 'idle': return 'Idle';
      case 'error': return 'Error';
      default: return 'Offline';
    }
  };

  return (
    <div className="agent-node">
      <div 
        className={`agent-item ${selectedAgent?.id === agent.id ? 'selected' : ''}`}
        style={{ paddingLeft: `${level * 24 + 12}px` }}
        onClick={() => onSelectAgent(agent)}
      >
        <div className="agent-item-left">
          {hasChildren && (
            <button 
              className="expand-button"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
            >
              {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
          )}
          {!hasChildren && <div className="expand-spacer" />}
          
          <div className={`status-dot ${getStatusColor(agent.status)} ${agent.status === 'active' ? 'pulse' : ''}`} />
          
          <div className="agent-info">
            <div className="agent-name">{agent.name}</div>
            <div className="agent-meta">
              <span className="agent-type">{agent.type}</span>
              <span className="agent-status">{getStatusLabel(agent.status)}</span>
            </div>
          </div>
        </div>

        <div className="agent-item-right">
          <button
            className="icon-button"
            onClick={(e) => {
              e.stopPropagation();
              onSimulateRequest(agent.id);
            }}
            title="Simulate request"
          >
            <Play size={14} />
          </button>
          <button
            className="icon-button danger"
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`Delete agent "${agent.name}"?`)) {
                onDeleteAgent(agent.id);
              }
            }}
            title="Delete agent"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {expanded && hasChildren && (
        <div className="agent-children">
          {children.map(child => (
            <AgentNode
              key={child.id}
              agent={child}
              agents={agents}
              selectedAgent={selectedAgent}
              onSelectAgent={onSelectAgent}
              onDeleteAgent={onDeleteAgent}
              onSimulateRequest={onSimulateRequest}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function AgentTree({ agents, selectedAgent, onSelectAgent, onDeleteAgent, onSimulateRequest }) {
  const rootAgents = agents.filter(a => !a.parentId);

  return (
    <div className="agent-tree card">
      <div className="panel-header">
        <h2>Agent Hierarchy</h2>
        <div className="agent-count">{agents.length} agents</div>
      </div>
      
      <div className="agent-tree-content">
        {rootAgents.length === 0 ? (
          <div className="empty-state">
            <Circle size={48} strokeWidth={1} />
            <p>No agents created yet</p>
            <span>Click "Create Agent" to get started</span>
          </div>
        ) : (
          rootAgents.map(agent => (
            <AgentNode
              key={agent.id}
              agent={agent}
              agents={agents}
              selectedAgent={selectedAgent}
              onSelectAgent={onSelectAgent}
              onDeleteAgent={onDeleteAgent}
              onSimulateRequest={onSimulateRequest}
            />
          ))
        )}
      </div>
    </div>
  );
}
