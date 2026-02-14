import { OpenClawClient } from './openClawClient.js';

/**
 * AgentManager - Manages agent runtime state (status, activity)
 * Configuration is stored in OpenClaw, not here
 */
export class AgentManager {
  constructor(openClawClient) {
    this.openClawClient = openClawClient;
    this.agentStatus = new Map(); // Only track runtime status, not config
  }

  /**
   * Create agent in OpenClaw configuration
   */
  async createAgent(name, type = 'worker', parentId = null, config = {}) {
    const agent = await this.openClawClient.createAgent({
      name,
      type,
      parentId,
      config,
    });

    // Initialize runtime status
    this.agentStatus.set(agent.id, {
      status: 'idle',
      lastActive: null,
    });

    return {
      ...agent,
      status: 'idle',
      lastActive: null,
    };
  }

  /**
   * Get agent from OpenClaw with current status
   */
  async getAgent(id) {
    const agents = await this.openClawClient.getAgents();
    const agent = agents.find(a => a.id === id);
    
    if (!agent) return null;

    const status = this.agentStatus.get(id) || { status: 'idle', lastActive: null };
    return { ...agent, ...status };
  }

  /**
   * Get all agents from OpenClaw with current status
   */
  async getAllAgents() {
    const agents = await this.openClawClient.getAgents();
    
    return agents.map(agent => {
      const status = this.agentStatus.get(agent.id) || { status: 'idle', lastActive: null };
      return { ...agent, ...status };
    });
  }

  /**
   * Update agent runtime status (not stored in OpenClaw config)
   */
  updateAgentStatus(id, status) {
    const currentStatus = this.agentStatus.get(id) || {};
    
    this.agentStatus.set(id, {
      status,
      lastActive: new Date().toISOString(),
    });

    return {
      id,
      ...currentStatus,
      status,
      lastActive: new Date().toISOString(),
    };
  }

  /**
   * Update agent configuration in OpenClaw
   */
  async updateAgent(id, updates) {
    const agent = await this.openClawClient.updateAgent(id, updates);
    const status = this.agentStatus.get(id) || { status: 'idle', lastActive: null };
    
    return { ...agent, ...status };
  }

  /**
   * Delete agent from OpenClaw configuration
   */
  async deleteAgent(id) {
    await this.openClawClient.deleteAgent(id);
    this.agentStatus.delete(id);
    return true;
  }

  /**
   * Get agent tree with status
   */
  async getAgentTree(rootId = null) {
    const agents = await this.getAllAgents();
    
    const buildTree = (agentId) => {
      const agent = agents.find(a => a.id === agentId);
      if (!agent) return null;

      return {
        ...agent,
        children: (agent.children || []).map(childId => buildTree(childId)).filter(Boolean),
      };
    };

    if (rootId) {
      return buildTree(rootId);
    }

    // Return all root agents (those without parents)
    return agents
      .filter(agent => !agent.parentId)
      .map(agent => buildTree(agent.id));
  }

  /**
   * Get agents by status
   */
  async getAgentsByStatus(status) {
    const agents = await this.getAllAgents();
    return agents.filter(agent => agent.status === status);
  }

  /**
   * Get agents by type
   */
  async getAgentsByType(type) {
    const agents = await this.getAllAgents();
    return agents.filter(agent => agent.type === type);
  }

  /**
   * Get child agents
   */
  async getChildAgents(parentId) {
    const agents = await this.getAllAgents();
    return agents.filter(agent => agent.parentId === parentId);
  }

  /**
   * Sync agents from OpenClaw - refresh local status map
   */
  async syncFromOpenClaw() {
    const agents = await this.openClawClient.getAgents();
    
    // Clean up status for deleted agents
    const agentIds = new Set(agents.map(a => a.id));
    for (const [id] of this.agentStatus) {
      if (!agentIds.has(id)) {
        this.agentStatus.delete(id);
      }
    }

    return agents;
  }

  /**
   * Clear all runtime status (does not affect OpenClaw config)
   */
  clearAllStatus() {
    this.agentStatus.clear();
  }
}
