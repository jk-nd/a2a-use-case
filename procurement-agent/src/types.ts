/**
 * Minimal types for Procurement Agent
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

// Minimal RFP data structure
export interface RfpData {
  rfp_id: string;
  title: string;
  amount: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  created_by: string;
  created_at: string;
} 