import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import Joi from 'joi';

import { AIGenerator } from './generators/ai-generator';
import { NPLValidator } from './validators/npl-validator';
import { 
  GenerationRequest, 
  ValidationRequest, 
  DeploymentRequest,
  ProtocolRequirements,
  GeneratedProtocol,
  ValidationResult,
  TemplateMetadata
} from './types';
import { getAllTemplates, getTemplateByName } from './templates/base-templates';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Initialize services
const aiGenerator = new AIGenerator(
  process.env.OPENAI_API_KEY || '',
  process.env.OPENAI_MODEL || 'gpt-4'
);
const validator = new NPLValidator();

// Validation schemas
const protocolRequirementsSchema = Joi.object({
  name: Joi.string().required().min(1).max(100),
  description: Joi.string().required().min(10).max(1000),
  parties: Joi.array().items(Joi.string()).min(1).max(10).required(),
  states: Joi.array().items(Joi.string()).min(1).max(20).required(),
  interactions: Joi.array().items(Joi.object({
    name: Joi.string().required(),
    description: Joi.string().required(),
    fromParty: Joi.string().required(),
    toParty: Joi.string().optional(),
    parameters: Joi.array().items(Joi.object({
      name: Joi.string().required(),
      type: Joi.string().required(),
      description: Joi.string().required(),
      required: Joi.boolean().required()
    })).optional(),
    returnType: Joi.string().optional(),
    stateConstraints: Joi.array().items(Joi.string()).optional()
  })).min(1).required(),
  businessRules: Joi.array().items(Joi.string()).min(1).required(),
  constraints: Joi.array().items(Joi.string()).optional()
});

const generationRequestSchema = Joi.object({
  requirements: protocolRequirementsSchema.required(),
  template: Joi.string().optional(),
  options: Joi.object({
    includeTests: Joi.boolean().optional(),
    includeDocumentation: Joi.boolean().optional(),
    includeUML: Joi.boolean().optional(),
    validationLevel: Joi.string().valid('strict', 'normal', 'lenient').optional(),
    aiEnhancement: Joi.boolean().optional()
  }).optional()
});

const validationRequestSchema = Joi.object({
  nplCode: Joi.string().required(),
  level: Joi.string().valid('syntax', 'semantic', 'full').optional()
});

const deploymentRequestSchema = Joi.object({
  nplCode: Joi.string().required(),
  packageName: Joi.string().required(),
  environment: Joi.string().valid('local', 'cloud').required(),
  credentials: Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required()
  }).optional()
});

// Health check endpoint
app.get('/health', (req: express.Request, res: express.Response) => {
  res.json({
    status: 'healthy',
    service: 'NPL Protocol Generator',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Generate protocol endpoint
app.post('/generate', async (req: express.Request, res: express.Response) => {
  try {
    // Validate request
    const { error, value } = generationRequestSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => d.message)
      });
    }

    const request: GenerationRequest = value;
    const requestId = uuidv4();

    console.log(`[${requestId}] Generating protocol: ${request.requirements.name}`);

    // Generate protocol
    const generatedProtocol = await aiGenerator.generateProtocol(
      request.requirements,
      request.template,
      request.options
    );

    // Validate generated code
    const validationResults = validator.validate(
      generatedProtocol.nplCode,
      request.options?.validationLevel === 'strict' ? 'full' : 'semantic'
    );

    generatedProtocol.validationResults = validationResults;

    console.log(`[${requestId}] Protocol generation completed`);

    return res.json({
      requestId,
      success: true,
      protocol: generatedProtocol,
      metadata: {
        generatedAt: new Date().toISOString(),
        template: request.template || 'auto-selected',
        validationLevel: request.options?.validationLevel || 'normal',
        aiEnhancement: request.options?.aiEnhancement !== false
      }
    });

  } catch (error) {
    console.error('Protocol generation failed:', error);
    return res.status(500).json({
      error: 'Protocol generation failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Validate NPL code endpoint
app.post('/validate', async (req: express.Request, res: express.Response) => {
  try {
    // Validate request
    const { error, value } = validationRequestSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => d.message)
      });
    }

    const request: ValidationRequest = value;
    const requestId = uuidv4();

    console.log(`[${requestId}] Validating NPL code`);

    // Perform validation
    const validationResults = validator.validate(request.nplCode, request.level || 'full');

    // Calculate summary
    const errorCount = validationResults.filter(r => r.severity === 'error').length;
    const warningCount = validationResults.filter(r => r.severity === 'warning').length;
    const infoCount = validationResults.filter(r => r.severity === 'info').length;

    console.log(`[${requestId}] Validation completed: ${errorCount} errors, ${warningCount} warnings, ${infoCount} info`);

    return res.json({
      requestId,
      success: true,
      validation: {
        results: validationResults,
        summary: {
          total: validationResults.length,
          errors: errorCount,
          warnings: warningCount,
          info: infoCount,
          isValid: errorCount === 0
        }
      }
    });

  } catch (error) {
    console.error('Validation failed:', error);
    return res.status(500).json({
      error: 'Validation failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Deploy protocol endpoint
app.post('/deploy', async (req: express.Request, res: express.Response) => {
  try {
    // Validate request
    const { error, value } = deploymentRequestSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => d.message)
      });
    }

    const request: DeploymentRequest = value;
    const requestId = uuidv4();

    console.log(`[${requestId}] Deploying protocol to ${request.environment}`);

    // Validate NPL code before deployment
    const validationResults = validator.validate(request.nplCode, 'full');
    const errors = validationResults.filter(r => r.severity === 'error');
    
    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Deployment failed - NPL code has validation errors',
        validationErrors: errors
      });
    }

    // TODO: Implement actual deployment logic
    // For now, return mock deployment response
    const deploymentResult = {
      success: true,
      deploymentId: uuidv4(),
      environment: request.environment,
      packageName: request.packageName,
      deployedAt: new Date().toISOString(),
      endpoints: [
        `POST /npl/${request.packageName}/${request.packageName}`,
        `GET /npl/${request.packageName}/${request.packageName}/{id}`,
        `PUT /npl/${request.packageName}/${request.packageName}/{id}`
      ]
    };

    console.log(`[${requestId}] Deployment completed`);

    return res.json({
      requestId,
      success: true,
      deployment: deploymentResult
    });

  } catch (error) {
    console.error('Deployment failed:', error);
    return res.status(500).json({
      error: 'Deployment failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// List templates endpoint
app.get('/templates', (req: express.Request, res: express.Response) => {
  try {
    const templates = getAllTemplates();
    const templateList: TemplateMetadata[] = templates.map(template => ({
      name: template.name,
      description: template.description,
      category: template.complexity,
      complexity: template.complexity,
      tags: [template.complexity, 'template'],
      parties: template.complexity === 'simple' ? 2 : template.complexity === 'medium' ? 2 : 3,
      states: template.complexity === 'simple' ? 2 : template.complexity === 'medium' ? 4 : 5
    }));

    return res.json({
      success: true,
      templates: templateList,
      total: templateList.length
    });

  } catch (error) {
    console.error('Failed to list templates:', error);
    return res.status(500).json({
      error: 'Failed to list templates',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get template details endpoint
app.get('/templates/:name', (req: express.Request, res: express.Response) => {
  try {
    const templateName = req.params.name;
    if (!templateName) {
      return res.status(400).json({
        error: 'Template name is required',
        message: 'Template name parameter is missing'
      });
    }
    
    const template = getTemplateByName(templateName);

    if (!template) {
      return res.status(404).json({
        error: 'Template not found',
        message: `Template '${templateName}' does not exist`
      });
    }

    return res.json({
      success: true,
      template: {
        name: template.name,
        description: template.description,
        complexity: template.complexity,
        placeholders: template.placeholders,
        example: template.template
      }
    });

  } catch (error) {
    console.error('Failed to get template:', error);
    return res.status(500).json({
      error: 'Failed to get template',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: 'An unexpected error occurred'
  });
});

// 404 handler
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({
    error: 'Not found',
    message: `Endpoint ${req.method} ${req.path} not found`
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`NPL Protocol Generator service running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`API documentation: http://localhost:${PORT}/templates`);
});

export default app; 