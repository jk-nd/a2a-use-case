import { OpenAI } from 'openai';

interface ProtocolGenerationRequest {
  businessName: string;
  workflowDescription: string;
  parties: string[];
  states: string[];
  actions: Array<{
    name: string;
    description: string;
    party: string;
    fromState: string;
    toState: string;
    parameters?: Array<{
      name: string;
      type: string;
      description: string;
    }>;
  }>;
  businessRules?: string[];
  customRequirements?: string;
}

export async function generateBusinessAnalysis(
  request: ProtocolGenerationRequest,
  nplCode: string,
  openai: OpenAI
) {
  
  const prompt = `
Generate a comprehensive business analysis for the following NPL protocol:

Business Context:
- Business Name: ${request.businessName}
- Original Description: ${request.workflowDescription}
- Parties: ${request.parties.join(', ')}
- States: ${request.states.join(', ')}
- Actions: ${JSON.stringify(request.actions, null, 2)}

NPL Code:
${nplCode}

Please provide:

1. WORKFLOW DESCRIPTION: A detailed business workflow description in plain English
2. UML DIAGRAM: A PlantUML state diagram showing the workflow states and transitions
3. STATE TRANSITIONS: A structured list of all state transitions with actions and parties

Format the response as JSON with these fields:
- workflowDescription: string
- umlDiagram: string (PlantUML format)
- stateTransitions: array of objects with from, to, action, party fields
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a business analyst expert. Generate clear, professional business analysis documents and UML diagrams."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.2,
      max_tokens: 1500
    });

    const response = completion.choices[0]?.message?.content;
    
    if (!response) {
      throw new Error('Failed to generate business analysis');
    }

    // Try to parse JSON response
    try {
      const analysis = JSON.parse(response);
      return {
        workflowDescription: analysis.workflowDescription || 'Analysis not available',
        umlDiagram: analysis.umlDiagram || 'Diagram not available',
        stateTransitions: analysis.stateTransitions || []
      };
    } catch (parseError) {
      // Fallback: generate basic analysis from request data
      return {
        workflowDescription: generateBasicWorkflowDescription(request),
        umlDiagram: generateBasicUMLDiagram(request),
        stateTransitions: generateStateTransitions(request)
      };
    }
    
  } catch (error) {
    console.error('Error generating business analysis:', error);
    // Return basic analysis as fallback
    return {
      workflowDescription: generateBasicWorkflowDescription(request),
      umlDiagram: generateBasicUMLDiagram(request),
      stateTransitions: generateStateTransitions(request)
    };
  }
}

function generateBasicWorkflowDescription(request: ProtocolGenerationRequest): string {
  return `
${request.businessName} Workflow

This workflow involves ${request.parties.join(' and ')} in a ${request.workflowDescription.toLowerCase()}.

Process Flow:
${request.actions.map((action, index) => 
  `${index + 1}. ${action.party} performs "${action.name}" to move from ${action.fromState} to ${action.toState}`
).join('\n')}

Business Rules:
${request.businessRules?.map(rule => `- ${rule}`).join('\n') || 'No specific business rules defined'}

The workflow ensures proper coordination between parties and maintains audit trails for all interactions.
`.trim();
}

function generateBasicUMLDiagram(request: ProtocolGenerationRequest): string {
  const states = request.states.map(state => `    [*] --> ${state}`).join('\n');
  const transitions = request.actions.map(action => 
    `    ${action.fromState} --> ${action.toState} : ${action.party}.${action.name}`
  ).join('\n');

  return `
@startuml
title ${request.businessName} Workflow

${states}
${transitions}

@enduml
`.trim();
}

function generateStateTransitions(request: ProtocolGenerationRequest) {
  return request.actions.map(action => ({
    from: action.fromState,
    to: action.toState,
    action: action.name,
    party: action.party
  }));
} 