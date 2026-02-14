import axios from 'axios';

/**
 * OpenClaw Gateway Client
 * Integrates with OpenClaw's configuration API to manage agents
 * Following OpenClaw standards from ~/.openclaw/openclaw.json
 */
export class OpenClawClient {
  constructor(gatewayUrl = process.env.OPENCLAW_GATEWAY_URL || 'http://localhost:18789') {
    this.gatewayUrl = gatewayUrl;
    this.configPath = '~/.openclaw/openclaw.json';
  }

  /**
   * Fetch current OpenClaw configuration
   */
  async getConfig() {
    try {
      const response = await axios.post(`${this.gatewayUrl}/rpc`, {
        method: 'config.get',
        params: {},
      }, {
        timeout: 5000,
      });
      
      // Handle different response structures
      if (response.data && response.data.result !== undefined) {
        return response.data.result;
      } else if (response.data) {
        return response.data;
      }
      
      throw new Error('Invalid response structure from OpenClaw');
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error('OpenClaw Gateway not running');
      } else if (error.code === 'ETIMEDOUT') {
        throw new Error('OpenClaw Gateway connection timeout');
      }
      console.error('Failed to fetch OpenClaw config:', error.message);
      throw new Error(`OpenClaw connection failed: ${error.message}`);
    }
  }

  /**
   * Get configuration schema
   */
  async getConfigSchema() {
    try {
      const response = await axios.post(`${this.gatewayUrl}/rpc`, {
        method: 'config.schema',
        params: {},
      });
      return response.data.result;
    } catch (error) {
      console.error('Failed to fetch config schema:', error.message);
      return null;
    }
  }

  /**
   * Update OpenClaw configuration
   */
  async updateConfig(path, value) {
    try {
      const response = await axios.post(`${this.gatewayUrl}/rpc`, {
        method: 'config.set',
        params: { path, value },
      });
      return response.data.result;
    } catch (error) {
      console.error('Failed to update OpenClaw config:', error.message);
      throw error;
    }
  }

  /**
   * Delete configuration value
   */
  async deleteConfig(path) {
    try {
      const response = await axios.post(`${this.gatewayUrl}/rpc`, {
        method: 'config.unset',
        params: { path },
      });
      return response.data.result;
    } catch (error) {
      console.error('Failed to delete config:', error.message);
      throw error;
    }
  }

  /**
   * Get all agents from OpenClaw configuration
   * Agents are stored under config.agents array
   */
  async getAgents() {
    try {
      const config = await this.getConfig();
      
      console.log('📋 OpenClaw config structure:', JSON.stringify(config, null, 2).substring(0, 500));
      
      // OpenClaw agents configuration structure
      // Try different possible locations for agents
      let agents = config?.agents || config?.agent?.agents || [];
      
      // If agents is not an array, return empty array
      if (!Array.isArray(agents)) {
        console.warn('⚠️  No agents array found in OpenClaw config, starting with empty list');
        return [];
      }
      
      console.log(`✅ Found ${agents.length} agents in OpenClaw configuration`);
      
      // Transform to Mission Control format with status tracking
      return agents.map(agent => ({
        id: agent.id || agent.name?.toLowerCase().replace(/\s+/g, '-') || `agent-${Date.now()}`,
        name: agent.name || 'Unnamed Agent',
        type: agent.type || 'worker',
        parentId: agent.parentId || null,
        children: agent.children || [],
        status: 'idle', // Status is tracked separately, not in config
        config: agent.config || {},
        model: agent.model,
        capabilities: agent.capabilities || [],
        createdAt: agent.createdAt || new Date().toISOString(),
        lastActive: null,
        metadata: agent.metadata || {},
      }));
    } catch (error) {
      console.warn('Could not fetch agents from OpenClaw:', error.message);
      console.warn('Starting with empty agent list. You can create agents in Mission Control.');
      return [];
    }
  }

  /**
   * Create a new agent in OpenClaw configuration
   */
  async createAgent(agentData) {
    try {
      const config = await this.getConfig();
      const agents = config?.agents || [];
      
      const newAgent = {
        id: agentData.id || agentData.name.toLowerCase().replace(/\s+/g, '-'),
        name: agentData.name,
        type: agentData.type || 'worker',
        parentId: agentData.parentId || null,
        children: [],
        config: agentData.config || {},
        model: agentData.model || config?.agent?.model,
        capabilities: agentData.capabilities || [],
        createdAt: new Date().toISOString(),
        metadata: agentData.metadata || {},
      };

      // Add to parent's children if applicable
      if (newAgent.parentId) {
        const parentIndex = agents.findIndex(a => a.id === newAgent.parentId);
        if (parentIndex !== -1) {
          if (!agents[parentIndex].children) {
            agents[parentIndex].children = [];
          }
          agents[parentIndex].children.push(newAgent.id);
        }
      }

      agents.push(newAgent);
      
      // Update OpenClaw configuration
      await this.updateConfig('agents', agents);
      
      return newAgent;
    } catch (error) {
      console.error('Failed to create agent in OpenClaw:', error.message);
      throw error;
    }
  }

  /**
   * Update an agent in OpenClaw configuration
   */
  async updateAgent(agentId, updates) {
    try {
      const config = await this.getConfig();
      const agents = config?.agents || [];
      
      const agentIndex = agents.findIndex(a => a.id === agentId);
      if (agentIndex === -1) {
        throw new Error(`Agent ${agentId} not found in OpenClaw config`);
      }

      // Merge updates (excluding status which is tracked separately)
      const { status, lastActive, ...configUpdates } = updates;
      agents[agentIndex] = {
        ...agents[agentIndex],
        ...configUpdates,
      };

      // Update OpenClaw configuration
      await this.updateConfig('agents', agents);
      
      return agents[agentIndex];
    } catch (error) {
      console.error('Failed to update agent in OpenClaw:', error.message);
      throw error;
    }
  }

  /**
   * Delete an agent from OpenClaw configuration
   */
  async deleteAgent(agentId) {
    try {
      const config = await this.getConfig();
      let agents = config?.agents || [];
      
      const agent = agents.find(a => a.id === agentId);
      if (!agent) {
        throw new Error(`Agent ${agentId} not found in OpenClaw config`);
      }

      // Remove from parent's children
      if (agent.parentId) {
        const parentIndex = agents.findIndex(a => a.id === agent.parentId);
        if (parentIndex !== -1 && agents[parentIndex].children) {
          agents[parentIndex].children = agents[parentIndex].children.filter(
            childId => childId !== agentId
          );
        }
      }

      // Recursively delete children
      const deleteRecursive = (id) => {
        const agentToDelete = agents.find(a => a.id === id);
        if (agentToDelete?.children) {
          agentToDelete.children.forEach(childId => deleteRecursive(childId));
        }
        agents = agents.filter(a => a.id !== id);
      };

      deleteRecursive(agentId);

      // Update OpenClaw configuration
      await this.updateConfig('agents', agents);
      
      return true;
    } catch (error) {
      console.error('Failed to delete agent from OpenClaw:', error.message);
      throw error;
    }
  }

  /**
   * Send request through OpenClaw Gateway
   */
  async sendRequest(agentId, payload) {
    try {
      const response = await axios.post(`${this.gatewayUrl}/api/request`, {
        agentId,
        ...payload,
      });
      return response.data;
    } catch (error) {
      console.error('OpenClaw request failed:', error.message);
      throw error;
    }
  }

  /**
   * Check if OpenClaw Gateway is reachable
   */
  async healthCheck() {
    try {
      // Try the RPC endpoint first
      const response = await axios.post(`${this.gatewayUrl}/rpc`, {
        method: 'config.get',
        params: {},
      }, {
        timeout: 3000,
      });
      
      if (response.status === 200) {
        return true;
      }
    } catch (error) {
      // Try alternative health check endpoints
      try {
        const healthResponse = await axios.get(`${this.gatewayUrl}/health`, {
          timeout: 3000,
        });
        return healthResponse.status === 200;
      } catch (healthError) {
        console.error('Health check failed:', error.message);
      }
    }
    
    return false;
  }

  /**
   * Watch for configuration changes (polling-based)
   */
  startConfigWatch(callback, interval = 5000) {
    let lastConfig = null;
    
    const poll = async () => {
      try {
        const config = await this.getConfig();
        const configStr = JSON.stringify(config);
        
        if (lastConfig !== null && configStr !== lastConfig) {
          callback(config);
        }
        
        lastConfig = configStr;
      } catch (error) {
        console.error('Config watch error:', error.message);
      }
    };

    // Initial poll
    poll();
    
    // Set up polling
    const intervalId = setInterval(poll, interval);
    
    return () => clearInterval(intervalId);
  }
}
