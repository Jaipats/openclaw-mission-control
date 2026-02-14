import { v4 as uuidv4 } from 'uuid';

export class AgentManager {
  constructor() {
    this.agents = new Map();
  }

  createAgent(name, type = 'worker', parentId = null, config = {}) {
    const agent = {
      id: uuidv4(),
      name,
      type, // 'master', 'worker', 'supervisor', etc.
      parentId,
      children: [],
      status: 'idle', // 'idle', 'active', 'error', 'offline'
      config,
      createdAt: new Date().toISOString(),
      lastActive: null,
      metadata: {},
    };

    this.agents.set(agent.id, agent);

    // Add to parent's children if applicable
    if (parentId && this.agents.has(parentId)) {
      const parent = this.agents.get(parentId);
      parent.children.push(agent.id);
    }

    return agent;
  }

  getAgent(id) {
    return this.agents.get(id);
  }

  getAllAgents() {
    return Array.from(this.agents.values());
  }

  updateAgentStatus(id, status) {
    const agent = this.agents.get(id);
    if (!agent) return null;

    agent.status = status;
    agent.lastActive = new Date().toISOString();
    
    return agent;
  }

  updateAgent(id, updates) {
    const agent = this.agents.get(id);
    if (!agent) return null;

    Object.assign(agent, updates);
    return agent;
  }

  deleteAgent(id) {
    const agent = this.agents.get(id);
    if (!agent) return false;

    // Remove from parent's children
    if (agent.parentId && this.agents.has(agent.parentId)) {
      const parent = this.agents.get(agent.parentId);
      parent.children = parent.children.filter(childId => childId !== id);
    }

    // Delete all children recursively
    agent.children.forEach(childId => {
      this.deleteAgent(childId);
    });

    this.agents.delete(id);
    return true;
  }

  getAgentTree(rootId = null) {
    const buildTree = (agentId) => {
      const agent = this.agents.get(agentId);
      if (!agent) return null;

      return {
        ...agent,
        children: agent.children.map(childId => buildTree(childId)).filter(Boolean),
      };
    };

    if (rootId) {
      return buildTree(rootId);
    }

    // Return all root agents (those without parents)
    return this.getAllAgents()
      .filter(agent => !agent.parentId)
      .map(agent => buildTree(agent.id));
  }

  getAgentsByStatus(status) {
    return this.getAllAgents().filter(agent => agent.status === status);
  }

  getAgentsByType(type) {
    return this.getAllAgents().filter(agent => agent.type === type);
  }

  getChildAgents(parentId) {
    const parent = this.agents.get(parentId);
    if (!parent) return [];

    return parent.children.map(childId => this.agents.get(childId)).filter(Boolean);
  }

  clearAllAgents() {
    this.agents.clear();
  }
}
