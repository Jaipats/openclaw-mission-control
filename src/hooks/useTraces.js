import { useState, useCallback } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:4000/api';

export function useTraces() {
  const [traces, setTraces] = useState([]);

  const addTrace = useCallback((trace) => {
    setTraces(prev => [...prev, trace]);
  }, []);

  const updateTrace = useCallback((traceId, updates) => {
    setTraces(prev => prev.map(t => t.id === traceId ? { ...t, ...updates } : t));
  }, []);

  const createTrace = useCallback(async (traceData) => {
    try {
      const response = await axios.post(`${API_BASE}/traces`, traceData);
      return response.data;
    } catch (error) {
      console.error('Failed to create trace:', error);
      throw error;
    }
  }, []);

  const fetchTraces = useCallback(async (agentId = null, limit = 1000) => {
    try {
      const params = {};
      if (agentId) params.agentId = agentId;
      if (limit) params.limit = limit;
      
      const response = await axios.get(`${API_BASE}/traces`, { params });
      setTraces(response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch traces:', error);
      throw error;
    }
  }, []);

  const clearTraces = useCallback(async () => {
    try {
      await axios.delete(`${API_BASE}/traces`);
      setTraces([]);
    } catch (error) {
      console.error('Failed to clear traces:', error);
      throw error;
    }
  }, []);

  return {
    traces,
    setTraces,
    addTrace,
    updateTrace,
    createTrace,
    fetchTraces,
    clearTraces,
  };
}
