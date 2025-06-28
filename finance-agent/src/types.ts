/**
 * Types for Finance Agent
 */

export interface AgentSkill {
  id: string;
  name: string;
  description: string;
  examples: string[];
  tags: string[];
}

export interface AgentCard {
  name: string;
  description: string;
  version: string;
  url: string;
  skills: AgentSkill[];
  defaultInputModes: string[];
  defaultOutputModes: string[];
}

export interface JSONRPCRequest {
  jsonrpc: "2.0";
  id: string | number | null;
  method: string;
  params?: any;
}

export interface JSONRPCSuccessResponse {
  jsonrpc: "2.0";
  id: string | number | null;
  result: any;
}

export interface JSONRPCErrorResponse {
  jsonrpc: "2.0";
  id: string | number | null;
  error: {
    code: number;
    message: string;
  };
}

// Finance-specific data structures
export interface BudgetApproval {
  rfp_id: string;
  amount: number;
  budget_code: string;
  approved: boolean;
  approved_by: string;
  approved_at: string;
  comments?: string;
}

export interface BudgetData {
  budget_code: string;
  total_budget: number;
  allocated_budget: number;
  remaining_budget: number;
  fiscal_year: string;
} 