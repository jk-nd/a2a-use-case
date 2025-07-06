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

export async function generateNPLProtocol(
  request: ProtocolGenerationRequest, 
  openai: OpenAI
): Promise<string> {
  
  const prompt = `
You are an expert NPL (NOUMENA Protocol Language) developer. Generate a complete NPL protocol based on the following business requirements.

Business Requirements:
- Business Name: ${request.businessName}
- Workflow Description: ${request.workflowDescription}
- Parties: ${request.parties.join(', ')}
- States: ${request.states.join(', ')}
- Actions: ${JSON.stringify(request.actions, null, 2)}
- Business Rules: ${request.businessRules?.join('\n') || 'None specified'}
- Custom Requirements: ${request.customRequirements || 'None specified'}

NPL Requirements:
1. Use proper NPL syntax with semicolons at the end of all statements
2. Define the package name as ${request.businessName.toLowerCase().replace(/\s+/g, '_')}
3. Create a protocol named ${request.businessName.replace(/\s+/g, '')}
4. Include all specified parties as protocol parameters
5. Define all states: initial, intermediate, and final
6. Create permissions for all actions with proper state constraints
7. Add appropriate business logic and validation
8. Include query methods for getting protocol status
9. Add proper Javadoc comments for all functions and permissions
10. Use proper NPL types (Text, Number, DateTime, Boolean, etc.)
11. Include proper error handling with require() statements
12. Make the protocol @api enabled

Generate only the NPL code, no explanations or markdown formatting.
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert NPL developer. Generate clean, valid NPL code that follows all NPL syntax rules and best practices."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    });

    const nplCode = completion.choices[0]?.message?.content;
    
    if (!nplCode) {
      throw new Error('Failed to generate NPL code');
    }

    // Clean up the response (remove markdown if present)
    return nplCode.replace(/```npl\n?/g, '').replace(/```\n?/g, '').trim();
    
  } catch (error) {
    console.error('Error generating NPL protocol:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to generate NPL protocol: ${errorMessage}`);
  }
} 