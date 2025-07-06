export interface ProtocolRequirements {
  name: string;
  description: string;
  parties: string[];
  states: string[];
  interactions: Interaction[];
  businessRules: string[];
  constraints?: string[];
}

export interface Interaction {
  name: string;
  description: string;
  fromParty: string;
  toParty?: string;
  parameters?: Parameter[];
  returnType?: string;
  stateConstraints?: string[];
}

export interface Parameter {
  name: string;
  type: string;
  description: string;
  required: boolean;
}

export interface GeneratedProtocol {
  nplCode: string;
  businessAnalysis: BusinessAnalysis;
  apiDocumentation: APIDocumentation;
  umlDiagram: string;
  validationResults: ValidationResult[];
}

export interface BusinessAnalysis {
  summary: string;
  stakeholders: string[];
  businessProcess: string;
  riskAssessment: string;
  complianceNotes: string;
}

export interface APIDocumentation {
  endpoints: APIEndpoint[];
  examples: APIExample[];
  errorCodes: ErrorCode[];
}

export interface APIEndpoint {
  method: string;
  path: string;
  description: string;
  parameters: Parameter[];
  responses: APIResponse[];
}

export interface APIResponse {
  statusCode: number;
  description: string;
  schema: string;
}

export interface APIExample {
  title: string;
  request: string;
  response: string;
}

export interface ErrorCode {
  code: string;
  description: string;
  resolution: string;
}

export interface ValidationResult {
  type: 'syntax' | 'semantic' | 'best_practice';
  severity: 'error' | 'warning' | 'info';
  message: string;
  line?: number;
  column?: number;
  suggestion?: string;
}

export interface TemplateMetadata {
  name: string;
  description: string;
  category: string;
  complexity: 'simple' | 'medium' | 'complex';
  tags: string[];
  parties: number;
  states: number;
}

export interface GenerationRequest {
  requirements: ProtocolRequirements;
  template?: string;
  options?: GenerationOptions;
}

export interface GenerationOptions {
  includeTests?: boolean;
  includeDocumentation?: boolean;
  includeUML?: boolean;
  validationLevel?: 'strict' | 'normal' | 'lenient';
  aiEnhancement?: boolean;
}

export interface ValidationRequest {
  nplCode: string;
  level?: 'syntax' | 'semantic' | 'full';
}

export interface DeploymentRequest {
  nplCode: string;
  packageName: string;
  environment: 'local' | 'cloud';
  credentials?: {
    username: string;
    password: string;
  };
} 