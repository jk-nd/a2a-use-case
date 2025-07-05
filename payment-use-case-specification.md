# Payment Use Case Specification

## Overview

This specification describes a hybrid Agent-to-Agent (A2A) + NPL workflow for a simple order and payment scenario between two agents: an Order Agent and a Supplier Agent.

## Architecture

### Hybrid Approach
- **Direct A2A Communication**: Agents communicate directly using Google A2A types for negotiation
- **NPL-Mediated Commitment**: Financial commitments and delivery promises are managed through NPL protocols

## Agents

### Order Agent
- **Purpose**: Represents a buyer/customer
- **Capabilities**: 
  - Request product quotes
  - Accept quotes
  - Place orders
  - Commit to payment obligations

### Supplier Agent  
- **Purpose**: Represents a seller/supplier
- **Capabilities**:
  - Provide product quotes
  - Accept orders
  - Commit to delivery obligations
  - Invoice for delivered products

## Workflow

### Phase 1: Direct A2A Negotiation (No Financial Commitment)

1. **Price Request**
   - Order Agent sends direct A2A request to Supplier Agent
   - Request includes: product specification, quantity, delivery requirements
   - No financial implications at this stage

2. **Quote Response**
   - Supplier Agent responds with quote via direct A2A
   - Quote includes: price, delivery timeline, terms
   - Quote is non-binding

3. **Quote Acceptance**
   - Order Agent accepts quote via direct A2A
   - Still no financial commitment

### Phase 2: NPL-Mediated Commitment (Atomic Transaction)

4. **Order Placement & Commitment**
   - Order Agent triggers NPL protocol instance
   - **Atomic Transaction**: Two commitments happen simultaneously:
     - Order Agent commits to pay the quoted amount
     - Supplier Agent commits to deliver the specified product
   - Both commitments are binding and enforceable through NPL

5. **Payment Workflow**
   - Supplier Agent can invoice Order Agent for the committed amount
   - Payment processing managed through NPL protocol states
   - Full audit trail of all financial transactions

## NPL Protocol Design

### Protocol: OrderCommitment
- **Parties**: `orderAgent`, `supplierAgent`
- **Parameters**: 
  - `productSpec`: Product specification
  - `quantity`: Number of units
  - `price`: Agreed price
  - `deliveryDate`: Expected delivery date

### States
- `initial state pending`
- `state committed` (both parties have committed)
- `state delivered` (supplier has delivered)
- `state paid` (order agent has paid)
- `final state completed`
- `final state cancelled`

### Key Permissions
- `permission[orderAgent] commitToPay()` | pending
- `permission[supplierAgent] commitToDeliver()` | pending  
- `permission[supplierAgent] markDelivered()` | committed
- `permission[orderAgent] pay()` | delivered
- `permission[orderAgent | supplierAgent] cancel()` | pending, committed

## Benefits

### Direct A2A Benefits
- **Efficiency**: Fast, direct communication for negotiation
- **Flexibility**: Non-binding exploration of options
- **Simplicity**: Standard Google A2A patterns

### NPL Benefits
- **Atomicity**: Both commitments happen together or not at all
- **Enforceability**: Binding commitments with clear consequences
- **Auditability**: Complete transaction history
- **State Management**: Clear workflow progression
- **Security**: Authorization and access control built-in

## Implementation Notes

- Agents register with A2A system and expose skills cards
- Direct A2A communication uses standard Google A2A message types
- NPL protocol triggered only when order is actually placed
- Protocol instance created with both parties and agreed terms
- Payment workflow follows NPL state machine
- All financial transactions logged and auditable

## Success Criteria

1. Agents can negotiate freely without triggering financial commitments
2. Order placement creates binding commitments for both parties
3. Payment workflow is fully auditable and enforceable
4. System supports both direct communication and protocol-mediated workflows
5. Clear separation between negotiation (A2A) and commitment (NPL) phases 