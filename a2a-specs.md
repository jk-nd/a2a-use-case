# Multi-Agent RFP Workflow with NPL-Based Fine-Grained Authorization

## Overview

This use case models a real-world, enterprise-grade Request for Proposal (RFP) workflow involving multiple autonomous agents collaborating across departments. The system supports complex, stateful interactions with fine-grained authorization rules enforced by Noumena Protocol Language (NPL) via Noumena Cloud.

---

## Actors (Agents)

1. **Agent A (Procurement Officer)** – Initiates and submits RFPs.
2. **Agent B (Finance Reviewer)** – Reviews and approves RFPs based on financial policies.
3. **Agent C (Legal Reviewer)** – Provides legal approval after finance.
4. **Agent D (Vendor Representative)** – Onboards only after full approval and contract generation.
5. **A2A Gateway** – Accepts agent requests and routes tasks after authentication and authorization.
6. **NPL Policy Engine (via Noumena Cloud)** – Provides business authorization decisions.
7. **Noumena Runtime (MCP Runtime)** – Executes internal tool orchestration via MCP.
8. **Tool Services** – Domain-specific services such as Contract Generator and Vendor Onboarding.

---

## Shared RFP State Structure

```json
{
  "rfp_id": "rfp-128",
  "status": "draft" | "submitted" | "under_review" | "approved" | "contract_generated" | "onboarded",
  "amount": 72000,
  "region": "EMEA",
  "approvals": {
    "procurement": true,
    "finance": false,
    "legal": false
  },
  "review_notes": ["missing budget code"],
  "history": [
    { "action": "submit", "actor": "agent-A", "timestamp": "..." },
    { "action": "review", "actor": "agent-B", "comment": "pending budget" }
  ]
}
```

---

## 🎯 Action-to-Policy Mapping

| **Action**             | **Permitted If**                                                                 |
|------------------------|----------------------------------------------------------------------------------|
| `submit_rfp`           | Agent A only, RFP status is `draft`                                             |
| `review_rfp`           | Agent B or C, RFP status is `submitted`, and `review_notes` is empty            |
| `approve_rfp_finance`  | Agent B only, RFP `status = under_review`, and `amount > 50,000`                |
| `approve_rfp_legal`    | Agent C only, RFP `status = under_review`, and `finance approval == true`       |
| `generate_contract`    | RFP is `approved`, and all approvals (`procurement`, `finance`, `legal`) are true |
| `onboard_vendor`       | Agent D only, RFP `status = contract_generated`                                 |

---

## 🧠 Example NPL Policies

### 🏦 Finance can only approve after submission

```npl
allow if agent.role == "finance"
    and rfp.status == "under_review"
    and rfp.amount > 50000
```

### ⚖️ Legal approval requires finance approval first

```npl
allow if agent.role == "legal"
    and rfp.status == "under_review"
    and rfp.approvals.finance == true
```

### 📄 Contract generation requires full approval

```npl
allow if rfp.approvals.procurement == true
    and rfp.approvals.finance == true
    and rfp.approvals.legal == true
    and rfp.status == "approved"
```

### 🤝 Vendor can onboard only after contract is generated

```npl
allow if agent.role == "vendor"
    and rfp.status == "contract_generated"
```

---

## Implementation Requirements

### A2A Gateway

- Accepts JSON-RPC requests.
- Validates bearer tokens (OAuth2).
- Passes `(agent_id, action, context)` to the NPL policy engine.
- On `permit`, routes task to the Noumena Runtime (MCP).

### NPL Client

- Authenticates to Noumena Cloud using bearer token.
- Issues `POST /npl/evaluate` with structured `agent`, `action`, and `rfp context`.
- Returns structured decision: `permit`, `deny`, `reason`, and `constraints`.

### Noumena Runtime (MCP Runtime)

- Executes tools using MCP flow.
- Enforces authorization context passed from the NPL client.
- Coordinates tool execution, retries, and response formatting.

### Tool Services

- Example: `Contract Generator`, `Vendor Onboarding`
- Implements task logic.
- Can re-check constraints locally if needed.

---

## Advanced Authorization Features

- State-aware and sequence-aware policy logic.
- Role chaining: Legal approval depends on Finance approval.
- Constraint-based permissions: Finance approvals limited by amount.
- History tracking for auditability and time-based access modeling.
- Enforceable obligations (e.g. reviewers must leave a comment to reject).

---

## Example Approval Sequence

1. **Agent A** submits RFP  
   → RFP status becomes `submitted`

2. **Agent B** (Finance) requests to approve:  
   - NPL evaluates:
     - `role = finance`
     - `status = under_review`
     - `amount > 50000`
   - Approval recorded on success

3. **Agent C** (Legal) requests to approve:  
   - NPL checks:
     - `finance approval == true`
     - `status = under_review`
   - Approval recorded on success

4. **Agent A** generates contract:  
   - NPL checks that all approvals are present
   - MCP invokes Contract Generator tool

5. **Agent D** (Vendor) requests onboarding:  
   - NPL confirms RFP `status = contract_generated`

---

## Summary

This specification demonstrates:

- A complete multi-agent orchestration pattern using A2A and MCP
- Externalized, stateful, and auditable business policy enforcement via NPL
- Reusable pattern for any many-to-many agent collaboration scenario
- A reference implementation base for building agent governance into distributed AI ecosystems