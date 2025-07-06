import OpenAI from 'openai';
import { 
  ProtocolRequirements, 
  GeneratedProtocol, 
  BusinessAnalysis, 
  APIDocumentation,
  GenerationOptions 
} from '../types';
import { BASE_TEMPLATES } from '../templates/base-templates';

/**
 * AI-powered NPL Protocol Generator
 * Enhances templates with business logic and documentation
 */
export class AIGenerator {
  private openai: OpenAI;
  private model: string;

  constructor(apiKey: string, model: string = 'gpt-4') {
    this.openai = new OpenAI({ apiKey });
    this.model = model;
  }

  /**
   * Generate NPL protocol from requirements
   */
  async generateProtocol(
    requirements: ProtocolRequirements,
    templateName?: string,
    options: GenerationOptions = {}
  ): Promise<GeneratedProtocol> {
    // Select template
    const template = templateName ? 
      BASE_TEMPLATES[templateName as keyof typeof BASE_TEMPLATES] : 
      this.selectBestTemplate(requirements);

    if (!template) {
      throw new Error('No suitable template found for requirements');
    }

    console.log('Selected template:', template.name);
    console.log('Template complexity:', template.complexity);

    // Generate base NPL code from template
    const baseCode = this.generateBaseCode(template, requirements);
    
    console.log('Base code generated:', baseCode.substring(0, 200) + '...');

    // Enhance with AI if enabled
    let enhancedCode = baseCode;
    if (options.aiEnhancement !== false) {
      enhancedCode = await this.enhanceWithAI(baseCode, requirements, template);
    }

    // Generate business analysis
    const businessAnalysis = await this.generateBusinessAnalysis(requirements);

    // Generate API documentation
    const apiDocumentation = await this.generateAPIDocumentation(enhancedCode, requirements);

    // Generate UML diagram
    const umlDiagram = await this.generateUMLDiagram(requirements);

    return {
      nplCode: enhancedCode,
      businessAnalysis,
      apiDocumentation,
      umlDiagram,
      validationResults: []
    };
  }

  /**
   * Select best template based on requirements
   */
  private selectBestTemplate(requirements: ProtocolRequirements) {
    const partyCount = requirements.parties.length;
    const stateCount = requirements.states.length;
    const interactionCount = requirements.interactions.length;

    if (partyCount <= 2 && stateCount <= 3 && interactionCount <= 2) {
      return BASE_TEMPLATES.simpleAgreement;
    } else if (partyCount <= 3 && stateCount <= 5 && interactionCount <= 5) {
      return BASE_TEMPLATES.paymentWorkflow;
    } else {
      return BASE_TEMPLATES.multiPartyCollaboration;
    }
  }

  /**
   * Generate base code from template
   */
  private generateBaseCode(template: any, requirements: ProtocolRequirements): string {
    let code = template.template;

    // Determine if we have intermediate states
    const hasIntermediateState = requirements.states.length > 2;
    const hasSecondPermission = requirements.interactions.length > 1;
    
    // Get states in order
    const initialState = requirements.states[0] || 'initial';
    const intermediateState = hasIntermediateState ? requirements.states[1] || '' : '';
    const finalState = requirements.states[requirements.states.length - 1] || 'completed';

    // Handle conditional template logic FIRST, including {{else}}
    code = code.replace(/\{\{#if (\w+)\}\}([\s\S]*?)(?:\{\{else\}\}([\s\S]*?))?\{\{\/if\}\}/gs, (match: string, condition: string, ifContent: string, elseContent: string) => {
      const cond = (condition === 'hasIntermediateState') ? hasIntermediateState : (condition === 'hasSecondPermission' ? hasSecondPermission : false);
      if (cond) {
        return ifContent;
      } else {
        return elseContent || '';
      }
    });

    // Replace placeholders with actual values
    const replacements: Record<string, string> = {
      '{{packageName}}': this.generatePackageName(requirements.name),
      '{{protocolDescription}}': requirements.description,
      '{{protocolName}}': this.toPascalCase(requirements.name),
      '{{paramName}}': 'amount',
      '{{paramDescription}}': 'The amount for this protocol',
      '{{paramType}}': 'Number',
      '{{party1}}': requirements.parties[0] || 'party1',
      '{{party2}}': requirements.parties[1] || 'party2',
      '{{party3}}': requirements.parties[2] || 'party3',
      '{{initialState}}': initialState,
      '{{intermediateState}}': intermediateState,
      '{{finalState}}': finalState,
      '{{hasIntermediateState}}': hasIntermediateState.toString(),
      '{{hasSecondPermission}}': hasSecondPermission.toString(),
      '{{permission1Description}}': requirements.interactions[0]?.description || 'Primary interaction',
      '{{permission1Party}}': requirements.interactions[0]?.fromParty || requirements.parties[0] || 'party1',
      '{{permission1Name}}': requirements.interactions[0]?.name || 'execute',
      '{{permission1Param}}': 'amount',
      '{{permission1ParamDescription}}': 'Amount to process',
      '{{permission1ParamType}}': 'Number',
      '{{permission1State}}': initialState,
      '{{permission2Description}}': requirements.interactions[1]?.description || 'Secondary interaction',
      '{{permission2Party}}': requirements.interactions[1]?.fromParty || requirements.parties[1] || 'party2',
      '{{permission2Name}}': requirements.interactions[1]?.name || 'confirm',
      '{{permission2State}}': hasIntermediateState ? intermediateState : initialState,
      '{{pendingState}}': requirements.states[1] || 'pending',
      '{{completedState}}': requirements.states[requirements.states.length - 1] || 'completed',
      '{{failedState}}': 'failed',
      '{{cancelledState}}': 'cancelled',
      '{{activeState}}': 'active',
      '{{permission3Description}}': requirements.interactions[2]?.description || 'Completion interaction',
      '{{permission3Party}}': requirements.interactions[2]?.fromParty || requirements.parties[0] || 'party1',
      '{{permission3Name}}': requirements.interactions[2]?.name || 'complete',
      '{{permission3Param}}': 'milestoneId',
      '{{permission3ParamDescription}}': 'Milestone identifier',
      '{{permission3ParamType}}': 'Text',
      '{{permission3State}}': requirements.states[1] || 'pending',
      '{{deadline}}': 'now().plus(days(30))'
    };

    // Replace remaining placeholders
    for (const [placeholder, value] of Object.entries(replacements)) {
      code = code.replace(new RegExp(placeholder, 'g'), value);
    }

    return code;
  }

  /**
   * Enhance base code with AI
   */
  private async enhanceWithAI(
    baseCode: string, 
    requirements: ProtocolRequirements, 
    template: any
  ): Promise<string> {
    const prompt = this.buildEnhancementPrompt(baseCode, requirements, template);
    
    try {
      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: `You are an expert NPL (Noumena Protocol Language) developer. 
            Your task is to enhance NPL code with better business logic, documentation, and comments.
            Follow these strict rules:
            - Only modify comments, documentation, and business logic
            - Do NOT change the core structure or syntax
            - Use proper NPL syntax and conventions
            - Add meaningful Javadoc comments
            - Enhance business rules and validation
            - Keep the code compilable and valid`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      });

      return completion.choices[0]?.message?.content || baseCode;
    } catch (error) {
      console.warn('AI enhancement failed, using base code:', error);
      return baseCode;
    }
  }

  /**
   * Generate business analysis
   */
  private async generateBusinessAnalysis(requirements: ProtocolRequirements): Promise<BusinessAnalysis> {
    const prompt = `Analyze the following business requirements and provide a comprehensive business analysis:

Protocol Name: ${requirements.name}
Description: ${requirements.description}
Parties: ${requirements.parties.join(', ')}
States: ${requirements.states.join(', ')}
Business Rules: ${requirements.businessRules.join(', ')}

Please provide:
1. Executive Summary
2. Key Stakeholders
3. Business Process Flow
4. Risk Assessment
5. Compliance Considerations

Format as JSON with keys: summary, stakeholders, businessProcess, riskAssessment, complianceNotes`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a business analyst expert. Provide clear, structured business analysis.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.4,
        max_tokens: 1000
      });

      const response = completion.choices[0]?.message?.content || '{}';
      return JSON.parse(response);
    } catch (error) {
      console.warn('Business analysis generation failed:', error);
      return {
        summary: `Business analysis for ${requirements.name}`,
        stakeholders: requirements.parties,
        businessProcess: 'Standard workflow process',
        riskAssessment: 'Standard risk assessment required',
        complianceNotes: 'Compliance review recommended'
      };
    }
  }

  /**
   * Generate API documentation
   */
  private async generateAPIDocumentation(
    nplCode: string, 
    requirements: ProtocolRequirements
  ): Promise<APIDocumentation> {
    const prompt = `Based on this NPL protocol code, generate comprehensive API documentation:

${nplCode}

Requirements:
- Protocol: ${requirements.name}
- Parties: ${requirements.parties.join(', ')}
- Interactions: ${requirements.interactions.map(i => i.name).join(', ')}

Generate JSON with:
- endpoints: Array of API endpoints with method, path, description, parameters, responses
- examples: Array of request/response examples
- errorCodes: Array of error codes and resolutions`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an API documentation expert. Generate clear, comprehensive API docs.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1500
      });

      const response = completion.choices[0]?.message?.content || '{}';
      return JSON.parse(response);
    } catch (error) {
      console.warn('API documentation generation failed:', error);
      return {
        endpoints: [],
        examples: [],
        errorCodes: []
      };
    }
  }

  /**
   * Generate UML diagram
   */
  private async generateUMLDiagram(requirements: ProtocolRequirements): Promise<string> {
    const prompt = `Create a Mermaid UML sequence diagram for this protocol:

Protocol: ${requirements.name}
Parties: ${requirements.parties.join(', ')}
States: ${requirements.states.join(', ')}
Interactions: ${requirements.interactions.map(i => `${i.fromParty} -> ${i.toParty || 'Protocol'}: ${i.name}`).join(', ')}

Generate only the Mermaid diagram code, no explanations.`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a UML diagram expert. Generate Mermaid sequence diagrams.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 500
      });

      return completion.choices[0]?.message?.content || 'graph TD\n    A[Start] --> B[End]';
    } catch (error) {
      console.warn('UML diagram generation failed:', error);
      return 'graph TD\n    A[Start] --> B[End]';
    }
  }

  /**
   * Build enhancement prompt
   */
  private buildEnhancementPrompt(
    baseCode: string, 
    requirements: ProtocolRequirements, 
    template: any
  ): string {
    return `Enhance this NPL protocol code with better business logic and documentation:

Original Requirements:
- Name: ${requirements.name}
- Description: ${requirements.description}
- Parties: ${requirements.parties.join(', ')}
- States: ${requirements.states.join(', ')}
- Business Rules: ${requirements.businessRules.join(', ')}

Base Code:
${baseCode}

Enhancement Instructions:
1. Add comprehensive Javadoc comments to all functions and permissions
2. Enhance business logic with proper validation and error handling
3. Add meaningful variable names and descriptions
4. Improve the overall code quality while maintaining NPL syntax
5. Add any missing business rules from the requirements

Return only the enhanced NPL code, no explanations.`;
  }

  /**
   * Generate package name from protocol name
   */
  private generatePackageName(protocolName: string): string {
    return protocolName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  }

  /**
   * Convert to PascalCase
   */
  private toPascalCase(str: string): string {
    return str.replace(/\w+/g, word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    );
  }
} 