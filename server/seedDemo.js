import axios from 'axios';

const API_BASE = 'http://localhost:4000/api';

// Demo agent hierarchy
const demoAgents = [
  // Root level - Master Agent
  { name: 'Master Orchestrator', type: 'master', parentId: null },
  
  // Level 1 - Supervisors
  { name: 'Data Supervisor', type: 'supervisor', parentName: 'Master Orchestrator' },
  { name: 'Analytics Supervisor', type: 'supervisor', parentName: 'Master Orchestrator' },
  
  // Level 2 - Workers under Data Supervisor
  { name: 'Data Ingestion Worker', type: 'worker', parentName: 'Data Supervisor' },
  { name: 'Data Validation Worker', type: 'worker', parentName: 'Data Supervisor' },
  { name: 'Data Transform Worker', type: 'worker', parentName: 'Data Supervisor' },
  
  // Level 2 - Analyzers under Analytics Supervisor
  { name: 'Pattern Analyzer', type: 'analyzer', parentName: 'Analytics Supervisor' },
  { name: 'Trend Analyzer', type: 'analyzer', parentName: 'Analytics Supervisor' },
  
  // Level 3 - Sub-workers under Data Ingestion Worker
  { name: 'CSV Parser', type: 'worker', parentName: 'Data Ingestion Worker' },
  { name: 'JSON Parser', type: 'worker', parentName: 'Data Ingestion Worker' },
];

async function seedData() {
  console.log('🌱 Seeding demo data...\n');
  
  const createdAgents = new Map();
  
  try {
    // Check if server is running
    try {
      await axios.get(`${API_BASE}/health`);
      console.log('✅ Server is running\n');
    } catch (error) {
      console.error('❌ Server is not running. Please start the server first with: npm run server');
      process.exit(1);
    }
    
    // Create agents in order
    for (const agentConfig of demoAgents) {
      const { name, type, parentName } = agentConfig;
      const parentId = parentName ? createdAgents.get(parentName)?.id : null;
      
      try {
        const response = await axios.post(`${API_BASE}/agents`, {
          name,
          type,
          parentId,
        });
        
        createdAgents.set(name, response.data);
        console.log(`✅ Created: ${name} (${type})`);
        
        // Small delay to allow WebSocket to propagate
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`❌ Failed to create ${name}:`, error.message);
      }
    }
    
    console.log(`\n✨ Successfully created ${createdAgents.size} agents!`);
    console.log('\n📊 Agent Hierarchy:');
    console.log('├─ Master Orchestrator');
    console.log('   ├─ Data Supervisor');
    console.log('   │  ├─ Data Ingestion Worker');
    console.log('   │  │  ├─ CSV Parser');
    console.log('   │  │  └─ JSON Parser');
    console.log('   │  ├─ Data Validation Worker');
    console.log('   │  └─ Data Transform Worker');
    console.log('   └─ Analytics Supervisor');
    console.log('      ├─ Pattern Analyzer');
    console.log('      └─ Trend Analyzer');
    console.log('\n🎉 Demo data seeded successfully!');
    console.log('🌐 Open http://localhost:3000 to view the Mission Control dashboard\n');
    
    // Simulate some requests
    console.log('\n🔄 Simulating sample requests...\n');
    
    const agentsArray = Array.from(createdAgents.values());
    const workerAgents = agentsArray.filter(a => a.type === 'worker' || a.type === 'analyzer');
    
    for (let i = 0; i < 5; i++) {
      const randomAgent = workerAgents[Math.floor(Math.random() * workerAgents.length)];
      
      console.log(`📤 Sending request to ${randomAgent.name}...`);
      
      try {
        await axios.post(`${API_BASE}/gateway/request`, {
          agentId: randomAgent.id,
          payload: {
            action: 'process_data',
            data: {
              requestId: `demo-${i + 1}`,
              timestamp: new Date().toISOString(),
              message: `Demo request ${i + 1}`,
            },
          },
        });
        
        console.log(`✅ Request ${i + 1} completed\n`);
      } catch (error) {
        console.error(`❌ Request ${i + 1} failed:`, error.message);
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('✨ Sample requests completed!');
    console.log('📈 Check the Mission Control dashboard to see the traces\n');
    
  } catch (error) {
    console.error('\n❌ Error seeding data:', error.message);
    process.exit(1);
  }
}

// Run the seeding
seedData();
