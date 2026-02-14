import React, { useState } from 'react';
import { X } from 'lucide-react';
import './CreateAgentModal.css';

export function CreateAgentModal({ agents, onClose, onCreate }) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'worker',
    parentId: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const agentData = {
      name: formData.name,
      type: formData.type,
      parentId: formData.parentId || null,
    };

    await onCreate(agentData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New Agent</h2>
          <button className="close-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="name">Agent Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Data Processor Agent"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="type">Agent Type</label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
            >
              <option value="master">Master</option>
              <option value="supervisor">Supervisor</option>
              <option value="worker">Worker</option>
              <option value="coordinator">Coordinator</option>
              <option value="analyzer">Analyzer</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="parentId">Parent Agent (Optional)</label>
            <select
              id="parentId"
              name="parentId"
              value={formData.parentId}
              onChange={handleChange}
            >
              <option value="">None (Root Agent)</option>
              {agents.map(agent => (
                <option key={agent.id} value={agent.id}>
                  {agent.name} ({agent.type})
                </option>
              ))}
            </select>
            <small className="form-hint">
              Select a parent to create this agent as a sub-agent
            </small>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary">
              Create Agent
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
