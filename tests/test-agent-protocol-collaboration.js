const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { getTechnicalUserToken } = require('./token-utils');

const A2A_SERVER_URL = 'http://localhost:8000';
const NPL_API_URL = 'http://localhost:12000';

/**
 * Real-world test: Agent Collaboration with Protocol Instantiation
 * 
 * This test demonstrates a complete business workflow where:
 * 1. Buyer Agent discovers Seller Agent
 * 2. Buyer Agent sends purchase order request to Seller Agent
 * 3. Seller Agent responds with quote and availability
 * 4. Both agents collaborate to instantiate a payment protocol
 * 5. Agents execute the protocol workflow together
 * 6. Agents communicate throughout the process
 */
async function testAgentProtocolCollaboration() {
    console.log('🚀 Testing Agent-Protocol Collaboration Workflow...\n');
    
    try {
        // Get technical user token for protocol operations
        const token = await getTechnicalUserToken();
        
        // Step 1: Agent Discovery and Setup
        console.log('📋 Step 1: Agent Discovery and Setup');
        const { buyerAgent, sellerAgent } = await setupAgents();
        console.log(`✅ Buyer Agent: ${buyerAgent.agentId}`);
        console.log(`✅ Seller Agent: ${sellerAgent.agentId}\n`);
        
        // Step 2: Deploy Payment Protocol
        console.log('📋 Step 2: Deploy Payment Protocol');
        await deployPaymentProtocol(token);
        console.log('✅ Payment protocol deployed and ready\n');
        
        // Step 3: Buyer Agent Initiates Purchase Process
        console.log('📋 Step 3: Buyer Agent Initiates Purchase Process');
        const purchaseRequest = await buyerInitiatesPurchase(buyerAgent, sellerAgent);
        console.log(`✅ Purchase request sent: ${purchaseRequest.messageId}\n`);
        
        // Step 4: Seller Agent Responds with Quote
        console.log('📋 Step 4: Seller Agent Responds with Quote');
        const quoteResponse = await sellerRespondsWithQuote(sellerAgent, buyerAgent, purchaseRequest);
        console.log(`✅ Quote response sent: ${quoteResponse.messageId}\n`);
        
        // Step 5: Agents Collaborate to Create Protocol Instance
        console.log('📋 Step 5: Agents Collaborate to Create Protocol Instance');
        const protocolInstance = await createProtocolInstance(buyerAgent, sellerAgent, purchaseRequest, quoteResponse, token);
        console.log(`✅ Protocol instance created: ${protocolInstance.protocolId}\n`);
        
        // Step 6: Execute Protocol Workflow
        console.log('📋 Step 6: Execute Protocol Workflow');
        const workflowResult = await executeProtocolWorkflow(buyerAgent, sellerAgent, protocolInstance, token);
        console.log(`✅ Protocol workflow completed: ${workflowResult.finalState}\n`);
        
        // Step 7: Agents Communicate Final Results
        console.log('📋 Step 7: Agents Communicate Final Results');
        await communicateFinalResults(buyerAgent, sellerAgent, workflowResult);
        console.log('✅ Final results communicated\n');
        
        // Step 8: Generate Collaboration Report
        console.log('📋 Step 8: Generate Collaboration Report');
        const report = await generateCollaborationReport(buyerAgent, sellerAgent);
        console.log('✅ Collaboration report generated\n');
        
        console.log('🎉 Agent-Protocol Collaboration Workflow Completed Successfully!\n');
        
        // Display comprehensive summary
        console.log('📊 Workflow Summary:');
        console.log('✅ Agent discovery and health verification');
        console.log('✅ Protocol deployment and method generation');
        console.log('✅ Purchase request and quote exchange');
        console.log('✅ Protocol instance creation with multi-party consent');
        console.log('✅ Complete protocol workflow execution');
        console.log('✅ Real-time agent communication throughout process');
        console.log('✅ Final status reporting and collaboration metrics');
        
        return {
            success: true,
            agents: { buyerAgent, sellerAgent },
            protocolInstance,
            workflowResult,
            report
        };
        
    } catch (error) {
        console.error('❌ Agent-Protocol collaboration test failed:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Setup and discover agents
 */
async function setupAgents() {
    // Discover agents
    const discoveryResponse = await axios.get(`${A2A_SERVER_URL}/agents/discover`);
    const agents = discoveryResponse.data.agents;
    
    // Find Docker-based agents
    const dockerAgents = agents.filter(agent => 
        agent.url.includes('buyer-agent') || agent.url.includes('seller-agent')
    );
    
    if (dockerAgents.length < 2) {
        throw new Error('Need at least 2 Docker-based agents for testing');
    }
    
    const buyerAgent = dockerAgents.find(agent => agent.url.includes('buyer-agent'));
    const sellerAgent = dockerAgents.find(agent => agent.url.includes('seller-agent'));
    
    if (!buyerAgent || !sellerAgent) {
        throw new Error('Could not find both buyer and seller agents');
    }
    
    // Verify agent health
    const buyerHealth = await axios.get(`${A2A_SERVER_URL}/agents/agents/${buyerAgent.agentId}/health`);
    const sellerHealth = await axios.get(`${A2A_SERVER_URL}/agents/agents/${sellerAgent.agentId}/health`);
    
    if (buyerHealth.data.status !== 'healthy' || sellerHealth.data.status !== 'healthy') {
        throw new Error('Agents are not healthy');
    }
    
    return { buyerAgent, sellerAgent };
}

/**
 * Deploy payment protocol
 */
async function deployPaymentProtocol(token) {
    try {
        // Read the payment workflow protocol file
        const paymentProtocolPath = path.join(__dirname, '../src/main/npl-1.0.0/payment_workflow/order_commitment.npl');
        const nplCode = fs.readFileSync(paymentProtocolPath, 'utf8');
        
        // Deploy the protocol
        const deployResponse = await axios.post(`${A2A_SERVER_URL}/a2a/deploy`, {
            package: 'payment_workflow',
            protocol: 'OrderCommitment',
            nplCode: nplCode,
            token: token
        });
        
        // Refresh A2A methods
        await axios.post(`${A2A_SERVER_URL}/a2a/refresh`, { token: token });
        
        return deployResponse.data;
    } catch (error) {
        if (error.response?.status === 409) {
            console.log('ℹ️  Payment protocol already deployed, continuing...');
            return { status: 'already_deployed' };
        }
        throw error;
    }
}

/**
 * Buyer agent initiates purchase process
 */
async function buyerInitiatesPurchase(buyerAgent, sellerAgent) {
    // Send purchase request message
    const purchaseRequest = await axios.post(`${A2A_SERVER_URL}/agents/message`, {
        fromAgentId: buyerAgent.agentId,
        toAgentId: sellerAgent.agentId,
        type: 'request',
        content: {
            type: 'purchase_order_request',
            orderDetails: {
                orderId: `PO-${Date.now()}`,
                items: [
                    { name: 'Enterprise Software License', quantity: 10, unitPrice: 500 },
                    { name: 'Technical Support Package', quantity: 1, unitPrice: 2000 }
                ],
                totalAmount: 7000,
                deliveryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
                paymentTerms: 'Net 30',
                specialRequirements: 'Priority delivery required'
            },
            buyerInfo: {
                company: 'TechCorp Solutions',
                contact: 'John Buyer',
                email: 'john.buyer@techcorp.com'
            }
        }
    });
    
    return purchaseRequest.data;
}

/**
 * Seller agent responds with quote
 */
async function sellerRespondsWithQuote(sellerAgent, buyerAgent, purchaseRequest) {
    // Simulate seller processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Send quote response
    const quoteResponse = await axios.post(`${A2A_SERVER_URL}/agents/message`, {
        fromAgentId: sellerAgent.agentId,
        toAgentId: buyerAgent.agentId,
        type: 'request',
        content: {
            type: 'purchase_order_response',
            originalRequestId: purchaseRequest.messageId,
            quoteDetails: {
                quoteId: `QT-${Date.now()}`,
                orderId: purchaseRequest.content.orderDetails.orderId,
                items: purchaseRequest.content.orderDetails.items,
                totalAmount: 7000,
                discount: 500,
                finalAmount: 6500,
                availability: 'In stock',
                estimatedDelivery: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days
                terms: 'Net 30, Priority delivery included'
            },
            sellerInfo: {
                company: 'Software Solutions Inc.',
                contact: 'Sarah Seller',
                email: 'sarah.seller@softwaresolutions.com'
            }
        }
    });
    
    return quoteResponse.data;
}

/**
 * Create protocol instance with multi-party consent
 */
async function createProtocolInstance(buyerAgent, sellerAgent, purchaseRequest, quoteResponse, token) {
    // Buyer agent creates the protocol instance
    const createOrderResponse = await axios.post(`${A2A_SERVER_URL}/a2a/method`, {
        package: 'payment_workflow',
        protocol: 'OrderCommitment',
        method: 'createOrder',
        params: {
            orderDetails: {
                orderId: purchaseRequest.content.orderDetails.orderId,
                totalAmount: quoteResponse.content.quoteDetails.finalAmount,
                deliveryDate: quoteResponse.content.quoteDetails.estimatedDelivery,
                buyer: purchaseRequest.content.buyerInfo.company,
                seller: quoteResponse.content.sellerInfo.company
            }
        },
        token: token
    });
    
    const protocolId = createOrderResponse.data.result.protocolId;
    
    // Send protocol creation notification to both agents
    await axios.post(`${A2A_SERVER_URL}/agents/message`, {
        fromAgentId: buyerAgent.agentId,
        toAgentId: sellerAgent.agentId,
        type: 'notification',
        content: {
            type: 'protocol_instance_created',
            protocolId: protocolId,
            protocolType: 'payment_workflow.OrderCommitment',
            orderId: purchaseRequest.content.orderDetails.orderId,
            status: 'pending_commitment'
        }
    });
    
    return {
        protocolId,
        orderId: purchaseRequest.content.orderDetails.orderId,
        buyerAgent: buyerAgent.agentId,
        sellerAgent: sellerAgent.agentId
    };
}

/**
 * Execute protocol workflow
 */
async function executeProtocolWorkflow(buyerAgent, sellerAgent, protocolInstance, token) {
    const { protocolId } = protocolInstance;
    
    // Step 1: Buyer commits to payment
    console.log('   🔄 Step 1: Buyer commits to payment');
    await axios.post(`${A2A_SERVER_URL}/a2a/method`, {
        package: 'payment_workflow',
        protocol: 'OrderCommitment',
        method: 'commitToPay',
        params: { protocolId },
        token: token
    });
    
    // Notify seller of buyer commitment
    await axios.post(`${A2A_SERVER_URL}/agents/message`, {
        fromAgentId: buyerAgent.agentId,
        toAgentId: sellerAgent.agentId,
        type: 'notification',
        content: {
            type: 'buyer_committed_to_payment',
            protocolId: protocolId,
            orderId: protocolInstance.orderId
        }
    });
    
    // Step 2: Seller commits to delivery
    console.log('   🔄 Step 2: Seller commits to delivery');
    await axios.post(`${A2A_SERVER_URL}/a2a/method`, {
        package: 'payment_workflow',
        protocol: 'OrderCommitment',
        method: 'commitToDeliver',
        params: { protocolId },
        token: token
    });
    
    // Notify buyer of seller commitment
    await axios.post(`${A2A_SERVER_URL}/agents/message`, {
        fromAgentId: sellerAgent.agentId,
        toAgentId: buyerAgent.agentId,
        type: 'notification',
        content: {
            type: 'seller_committed_to_delivery',
            protocolId: protocolId,
            orderId: protocolInstance.orderId
        }
    });
    
    // Step 3: Seller marks as delivered
    console.log('   🔄 Step 3: Seller marks as delivered');
    await axios.post(`${A2A_SERVER_URL}/a2a/method`, {
        package: 'payment_workflow',
        protocol: 'OrderCommitment',
        method: 'markDelivered',
        params: { 
            protocolId,
            deliveryDate: new Date().toISOString()
        },
        token: token
    });
    
    // Notify buyer of delivery
    await axios.post(`${A2A_SERVER_URL}/agents/message`, {
        fromAgentId: sellerAgent.agentId,
        toAgentId: buyerAgent.agentId,
        type: 'notification',
        content: {
            type: 'order_delivered',
            protocolId: protocolId,
            orderId: protocolInstance.orderId,
            deliveryDate: new Date().toISOString()
        }
    });
    
    // Step 4: Buyer processes payment
    console.log('   🔄 Step 4: Buyer processes payment');
    await axios.post(`${A2A_SERVER_URL}/a2a/method`, {
        package: 'payment_workflow',
        protocol: 'OrderCommitment',
        method: 'pay',
        params: { 
            protocolId,
            paymentAmount: 6500
        },
        token: token
    });
    
    // Notify seller of payment
    await axios.post(`${A2A_SERVER_URL}/agents/message`, {
        fromAgentId: buyerAgent.agentId,
        toAgentId: sellerAgent.agentId,
        type: 'notification',
        content: {
            type: 'payment_processed',
            protocolId: protocolId,
            orderId: protocolInstance.orderId,
            paymentAmount: 6500
        }
    });
    
    // Step 5: Complete the order
    console.log('   🔄 Step 5: Complete the order');
    await axios.post(`${A2A_SERVER_URL}/a2a/method`, {
        package: 'payment_workflow',
        protocol: 'OrderCommitment',
        method: 'complete',
        params: { protocolId },
        token: token
    });
    
    // Get final state
    const finalStateResponse = await axios.post(`${A2A_SERVER_URL}/a2a/method`, {
        package: 'payment_workflow',
        protocol: 'OrderCommitment',
        method: 'getStatus',
        params: { protocolId },
        token: token
    });
    
    return {
        protocolId,
        finalState: finalStateResponse.data.result,
        orderId: protocolInstance.orderId
    };
}

/**
 * Communicate final results
 */
async function communicateFinalResults(buyerAgent, sellerAgent, workflowResult) {
    // Send completion notification to both agents
    await axios.post(`${A2A_SERVER_URL}/agents/message`, {
        fromAgentId: buyerAgent.agentId,
        toAgentId: 'all',
        type: 'broadcast',
        content: {
            type: 'workflow_completed',
            protocolId: workflowResult.protocolId,
            orderId: workflowResult.orderId,
            finalState: workflowResult.finalState,
            completionDate: new Date().toISOString(),
            message: 'Purchase order workflow completed successfully!'
        }
    });
}

/**
 * Generate collaboration report
 */
async function generateCollaborationReport(buyerAgent, sellerAgent) {
    // Get message history for both agents
    const buyerMessages = await axios.get(`${A2A_SERVER_URL}/agents/messages/${buyerAgent.agentId}`);
    const sellerMessages = await axios.get(`${A2A_SERVER_URL}/agents/messages/${sellerAgent.agentId}`);
    
    // Get conversation between agents
    const conversation = await axios.get(`${A2A_SERVER_URL}/agents/conversation/${buyerAgent.agentId}/${sellerAgent.agentId}`);
    
    // Get communication statistics
    const communicationStats = await axios.get(`${A2A_SERVER_URL}/agents/stats/communication`);
    
    return {
        totalMessages: buyerMessages.data.total + sellerMessages.data.total,
        conversationMessages: conversation.data.total,
        communicationStats: communicationStats.data,
        collaborationDuration: 'Completed successfully',
        agents: [buyerAgent.agentId, sellerAgent.agentId]
    };
}

// Run the test if this file is executed directly
if (require.main === module) {
    testAgentProtocolCollaboration()
        .then(result => {
            if (result.success) {
                console.log('🎉 Agent-Protocol Collaboration Test Completed Successfully!');
                process.exit(0);
            } else {
                console.error('❌ Test failed:', result.error);
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('❌ Test execution failed:', error);
            process.exit(1);
        });
}

module.exports = { testAgentProtocolCollaboration }; 