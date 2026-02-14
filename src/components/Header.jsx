import React from 'react';
import { Activity, Plus, Trash2 } from 'lucide-react';
import './Header.css';

export function Header({ onCreateAgent, onClearTraces }) {
  return (
    <header className="header">
      <div className="header-left">
        <div className="logo">
          <Activity size={32} strokeWidth={2.5} />
          <h1>OpenClaw Mission Control</h1>
        </div>
        <div className="subtitle">Multi-Agent System Monitor</div>
      </div>
      
      <div className="header-right">
        <button className="primary" onClick={onCreateAgent}>
          <Plus size={18} />
          Create Agent
        </button>
        <button className="danger" onClick={onClearTraces}>
          <Trash2 size={18} />
          Clear Traces
        </button>
      </div>
    </header>
  );
}
