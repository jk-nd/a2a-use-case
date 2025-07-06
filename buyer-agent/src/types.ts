/**
 * Procurement Agent Types using Google A2A Protocol
 */

// Google A2A Core Types
export interface AgentProvider {
  organization: string;
  url: string;
}

export interface AgentExtension {
  uri: string;
  description?: string;
  required?: boolean;
  params?: { [key: string]: any };
}

export interface AgentCapabilities {
  streaming?: boolean;
  pushNotifications?: boolean;
  stateTransitionHistory?: boolean;
  extensions?: AgentExtension[];
}

export interface AgentSkill {
  id: string;
  name: string;
  description: string;
  tags: string[];
  examples?: string[];
  inputModes?: string[];
  outputModes?: string[];
}

export interface AgentInterface {
  url: string;
  transport: string;
}

export interface AgentCard {
  name: string;
  description: string;
  url: string;
  preferredTransport?: string;
  additionalInterfaces?: AgentInterface[];
  iconUrl?: string;
  provider?: AgentProvider;
  version: string;
  documentationUrl?: string;
  capabilities: AgentCapabilities;
  securitySchemes?: { [scheme: string]: SecurityScheme };
  security?: { [scheme: string]: string[] }[];
  defaultInputModes: string[];
  defaultOutputModes: string[];
  skills: AgentSkill[];
  supportsAuthenticatedExtendedCard?: boolean;
}

// Security Scheme Types
export interface SecuritySchemeBase {
  description?: string;
}

export interface HTTPAuthSecurityScheme extends SecuritySchemeBase {
  type: "http";
  scheme: string;
  bearerFormat?: string;
}

export interface APIKeySecurityScheme extends SecuritySchemeBase {
  type: "apiKey";
  in: "query" | "header" | "cookie";
  name: string;
}

export interface OAuth2SecurityScheme extends SecuritySchemeBase {
  type: "oauth2";
  flows: OAuthFlows;
}

export interface OpenIdConnectSecurityScheme extends SecuritySchemeBase {
  type: "openIdConnect";
  openIdConnectUrl: string;
}

export type SecurityScheme =
  | APIKeySecurityScheme
  | HTTPAuthSecurityScheme
  | OAuth2SecurityScheme
  | OpenIdConnectSecurityScheme;

// OAuth Flow Types
export interface OAuthFlows {
  authorizationCode?: AuthorizationCodeOAuthFlow;
  clientCredentials?: ClientCredentialsOAuthFlow;
  implicit?: ImplicitOAuthFlow;
  password?: PasswordOAuthFlow;
}

export interface AuthorizationCodeOAuthFlow {
  authorizationUrl: string;
  tokenUrl: string;
  refreshUrl?: string;
  scopes: { [name: string]: string };
}

export interface ClientCredentialsOAuthFlow {
  tokenUrl: string;
  refreshUrl?: string;
  scopes: { [name: string]: string };
}

export interface ImplicitOAuthFlow {
  authorizationUrl: string;
  refreshUrl?: string;
  scopes: { [name: string]: string };
}

export interface PasswordOAuthFlow {
  tokenUrl: string;
  refreshUrl?: string;
  scopes: { [name: string]: string };
}

// JSON-RPC Types
export interface JSONRPCMessage {
  readonly jsonrpc: "2.0";
  id?: number | string | null;
}

export interface JSONRPCRequest extends JSONRPCMessage {
  method: string;
  params?: { [key: string]: any };
}

export interface JSONRPCError {
  code: number;
  message: string;
  data?: any;
}

export interface JSONRPCSuccessResponse extends JSONRPCMessage {
  id: number | string | null;
  result: any;
  error?: never;
}

export interface JSONRPCErrorResponse extends JSONRPCMessage {
  id: number | string | null;
  result?: never;
  error: JSONRPCError;
}

// Google A2A Error Types
export interface JSONParseError extends JSONRPCError {
  code: -32700;
  message: string;
}

export interface InvalidRequestError extends JSONRPCError {
  code: -32600;
  message: string;
}

export interface MethodNotFoundError extends JSONRPCError {
  code: -32601;
  message: string;
}

export interface InvalidParamsError extends JSONRPCError {
  code: -32602;
  message: string;
}

export interface InternalError extends JSONRPCError {
  code: -32603;
  message: string;
}

export interface TaskNotFoundError extends JSONRPCError {
  code: -32001;
  message: string;
}

export interface TaskNotCancelableError extends JSONRPCError {
  code: -32002;
  message: string;
}

export interface PushNotificationNotSupportedError extends JSONRPCError {
  code: -32003;
  message: string;
}

export interface UnsupportedOperationError extends JSONRPCError {
  code: -32004;
  message: string;
}

export interface ContentTypeNotSupportedError extends JSONRPCError {
  code: -32005;
  message: string;
}

export interface InvalidAgentResponseError extends JSONRPCError {
  code: -32006;
  message: string;
}

export type A2AError =
  | JSONParseError
  | InvalidRequestError
  | MethodNotFoundError
  | InvalidParamsError
  | InternalError
  | TaskNotFoundError
  | TaskNotCancelableError
  | PushNotificationNotSupportedError
  | UnsupportedOperationError
  | ContentTypeNotSupportedError
  | InvalidAgentResponseError;

// Procurement-specific data structures
export interface RfpData {
  rfp_id: string;
  title: string;
  amount: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  created_by: string;
  created_at: string;
  description?: string;
  category?: string;
  due_date?: string;
}

// Procurement-specific request/response types
export interface CreateRfpParams {
  title: string;
  amount: number;
  description?: string;
  category?: string;
  due_date?: string;
  agent_id: string;
}

export interface SubmitRfpParams {
  rfp_id: string;
  agent_id: string;
}

export interface TrackRfpParams {
  rfp_id: string;
  agent_id: string;
}

export interface RfpResponse {
  rfp_id: string;
  status: string;
  message: string;
  timestamp: string;
} 