import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { AgentTree } from './components/AgentTree';
import { TracePanel } from './components/TracePanel';
import { CreateAgentModal } from './components/CreateAgentModal';
import { StatsPanel } from './components/StatsPanel';
import { useWebSocket } from './hooks/useWebSocket';
import { useAgents } from './hooks/useAgents';
import { useTraces } from './hooks/useTraces';
import './App.css';

function App() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  
  const { agents, setAgents, createAgent, deleteAgent, updateAgentStatus } = useAgents();
  const { traces, setTraces, addTrace, clearTraces } = useTraces();
  
  useWebSocket({
    onAgentCreated: (agent) => setAgents(prev => [...prev, agent]),
    onAgentStatusUpdated: (agent) => {
      setAgents(prev => prev.map(a => a.id === agent.id ? agent : a));
    },
    onAgentDeleted: ({ id }) => {
      setAgents(prev => prev.filter(a => a.id !== id));
      if (selectedAgent?.id === id) {
        setSelectedAgent(null);
      }
    },
    onTraceCreated: (trace) => addTrace(trace),
    onTracesCleared: () => setTraces([]),
    onInit: (data) => {
      setAgents(data.agents || []);
      setTraces(data.traces || []);
    },
  });

  const handleCreateAgent = async (agentData) => {
    const newAgent = await createAgent(agentData);
    setShowCreateModal(false);
    return newAgent;
  };

  const handleDeleteAgent = async (agentId) => {
    await deleteAgent(agentId);
    if (selectedAgent?.id === agentId) {
      setSelectedAgent(null);
    }
  };

  const handleSimulateRequest = async (agentId) => {
    if (!agentId) return;
    
    try {
      const response = await fetch('http://localhost:4000/api/gateway/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId,
          payload: {
            action: 'process_data',
            data: { message: 'Test request from Mission Control' },
          },
        }),
      });
      
      if (!response.ok) throw new Error('Request failed');
    } catch (error) {
      console.error('Failed to simulate request:', error);
    }
  };

  const filteredTraces = selectedAgent
    ? traces.filter(t => t.agentId === selectedAgent.id)
    : traces;

  return (
    <div className="app">
      <Header 
        onCreateAgent={() => setShowCreateModal(true)}
        onClearTraces={clearTraces}
      />
      
      <div className="main-content">
        <div className="left-panel">
          <StatsPanel 
            agents={agents}
            traces={traces}
            selectedAgent={selectedAgent}
          />
          
          <AgentTree
            agents={agents}
            selectedAgent={selectedAgent}
            onSelectAgent={setSelectedAgent}
            onDeleteAgent={handleDeleteAgent}
            onSimulateRequest={handleSimulateRequest}
          />
        </div>
        
        <div className="right-panel">
          <TracePanel
            traces={filteredTraces}
            selectedAgent={selectedAgent}
            agents={agents}
          />
        </div>
      </div>

      {showCreateModal && (
        <CreateAgentModal
          agents={agents}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateAgent}
        />
      )}
    </div>
  );
}

export default App;
