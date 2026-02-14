import { useState, useCallback } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:4000/api';

export function useAgents() {
  const [agents, setAgents] = useState([]);

  const createAgent = useCallback(async (agentData) => {
    try {
      const response = await axios.post(`${API_BASE}/agents`, agentData);
      return response.data;
    } catch (error) {
      console.error('Failed to create agent:', error);
      throw error;
    }
  }, []);

  const updateAgentStatus = useCallback(async (agentId, status) => {
    try {
      const response = await axios.patch(`${API_BASE}/agents/${agentId}/status`, { status });
      return response.data;
    } catch (error) {
      console.error('Failed to update agent status:', error);
      throw error;
    }
  }, []);

  const deleteAgent = useCallback(async (agentId) => {
    try {
      await axios.delete(`${API_BASE}/agents/${agentId}`);
      return true;
    } catch (error) {
      console.error('Failed to delete agent:', error);
      throw error;
    }
  }, []);

  const fetchAgents = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE}/agents`);
      setAgents(response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch agents:', error);
      throw error;
    }
  }, []);

  return {
    agents,
    setAgents,
    createAgent,
    updateAgentStatus,
    deleteAgent,
    fetchAgents,
  };
}
