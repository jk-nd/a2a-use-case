"""
A2A Protocol Server for NPL Integration

This server implements the Google Agent2Agent (A2A) protocol and integrates
with the NPL engine for policy enforcement and workflow management.
"""

import os
import logging
from typing import Dict, Any, Optional, List
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import structlog

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()

# Configuration
NPL_ENGINE_URL = os.getenv("NPL_ENGINE_URL", "http://engine:12000")
KEYCLOAK_URL = os.getenv("KEYCLOAK_URL", "http://keycloak:11000")
KEYCLOAK_REALM = os.getenv("KEYCLOAK_REALM", "noumena")
KEYCLOAK_CLIENT_ID = os.getenv("KEYCLOAK_CLIENT_ID", "noumena")

# A2A Protocol Models
class AgentSkill(BaseModel):
    """A2A Agent Skill model"""
    id: str
    name: str
    description: str
    examples: List[str]
    tags: List[str]

class AgentCapabilities(BaseModel):
    """A2A Agent Capabilities model"""
    # Add capabilities as needed
    pass

class AgentCard(BaseModel):
    """A2A Agent Card model"""
    name: str
    description: str
    version: str
    url: str
    capabilities: AgentCapabilities
    skills: List[AgentSkill]
    defaultInputModes: List[str]
    defaultOutputModes: List[str]

class JSONRPCRequest(BaseModel):
    """JSON-RPC Request model"""
    jsonrpc: str = "2.0"
    id: str
    method: str
    params: Optional[Dict[str, Any]] = None

class JSONRPCResponse(BaseModel):
    """JSON-RPC Response model"""
    jsonrpc: str = "2.0"
    id: str
    result: Optional[Dict[str, Any]] = None
    error: Optional[Dict[str, Any]] = None

class NPLRequest(BaseModel):
    """Request model for NPL engine communication"""
    action: str
    agent_id: str
    context: Dict[str, Any]

class NPLResponse(BaseModel):
    """Response model from NPL engine"""
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    logger.info("Starting A2A Server", 
                npl_engine_url=NPL_ENGINE_URL,
                keycloak_url=KEYCLOAK_URL)
    yield
    logger.info("Shutting down A2A Server")

# Create FastAPI app
app = FastAPI(
    title="A2A-NPL Integration Server",
    description="Agent2Agent protocol server integrated with NPL policy engine",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def verify_token(authorization: str = Header(None)) -> str:
    """Verify JWT token from Keycloak"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    
    token = authorization.replace("Bearer ", "")
    # TODO: Implement proper JWT verification with Keycloak
    # For now, we'll just return the token
    return token

async def call_npl_engine(request: NPLRequest, token: str) -> NPLResponse:
    """Call the NPL engine with the given request"""
    try:
        async with httpx.AsyncClient() as client:
            headers = {"Authorization": f"Bearer {token}"} if token else {}
            response = await client.post(
                f"{NPL_ENGINE_URL}/npl/evaluate",
                json=request.dict(),
                headers=headers,
                timeout=30.0
            )
            
            if response.status_code == 200:
                return NPLResponse(**response.json())
            else:
                logger.error("NPL engine error", 
                           status_code=response.status_code,
                           response_text=response.text)
                return NPLResponse(
                    success=False,
                    error=f"NPL engine error: {response.status_code}"
                )
                
    except Exception as e:
        logger.error("Error calling NPL engine", error=str(e))
        return NPLResponse(
            success=False,
            error=f"Communication error: {str(e)}"
        )

# Create agent capabilities
agent_capabilities = AgentCapabilities()

# Create agent skills
agent_skills = [
    AgentSkill(
        id="policy_enforcement",
        name="Policy Enforcement",
        description="Enforce NPL-based policies for agent interactions",
        examples=["Check if agent can perform action", "Validate workflow state"],
        tags=["policy", "authorization", "security"]
    ),
    AgentSkill(
        id="workflow_management",
        name="Workflow Management", 
        description="Manage multi-agent workflow states and transitions",
        examples=["Submit RFP", "Approve workflow step", "Generate contract"],
        tags=["workflow", "state-management", "rfp"]
    )
]

# Create agent card
agent_card = AgentCard(
    name="NPL-Integrated-A2A-Server",
    description="A2A server with NPL policy enforcement for agent workflows",
    version="1.0.0",
    url="http://localhost:8000/a2a",
    capabilities=agent_capabilities,
    skills=agent_skills,
    defaultInputModes=["text", "json"],
    defaultOutputModes=["text", "json"]
)

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "a2a-npl-server"}

# A2A Agent Card endpoint
@app.get("/a2a/agent-card")
async def get_agent_card():
    """Return the agent card for this A2A server"""
    return agent_card

# A2A Request endpoint
@app.post("/a2a/request")
async def handle_a2a_request(request: JSONRPCRequest, token: str = Depends(verify_token)) -> JSONRPCResponse:
    """Handle incoming A2A requests and forward to NPL engine"""
    try:
        logger.info("Received A2A request", 
                   request_id=request.id,
                   method=request.method,
                   agent_id=request.params.get("agent_id") if request.params else None)
        
        # Convert A2A request to NPL request
        npl_request = NPLRequest(
            action=request.method,
            agent_id=request.params.get("agent_id", "unknown") if request.params else "unknown",
            context=request.params or {}
        )
        
        # Call NPL engine
        npl_response = await call_npl_engine(npl_request, token)
        
        if npl_response.success:
            return JSONRPCResponse(
                id=request.id,
                result=npl_response.data or {},
                error=None
            )
        else:
            return JSONRPCResponse(
                id=request.id,
                result=None,
                error={
                    "code": -32000,
                    "message": npl_response.error or "Unknown error"
                }
            )
            
    except Exception as e:
        logger.error("Error handling A2A request", error=str(e))
        return JSONRPCResponse(
            id=request.id,
            result=None,
            error={
                "code": -32603,
                "message": f"Internal error: {str(e)}"
            }
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    ) 