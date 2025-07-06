# NPL Protocol Generator

A reliable service for generating NPL (Noumena Protocol Language) protocols from business requirements using template-based generation with AI enhancement.

## Features

- **Template-Based Generation**: Uses proven, tested NPL templates for reliable code generation
- **AI Enhancement**: Optional AI-powered enhancement of comments, documentation, and business logic
- **Multi-Level Validation**: Comprehensive NPL syntax, semantic, and best practice validation
- **Business Analysis**: Automatic generation of business analysis, API documentation, and UML diagrams
- **Deployment Integration**: Direct deployment to NPL engines with validation checks

## Architecture

### Core Components

- **Template Engine**: Handles conditional logic and placeholder replacement
- **AI Generator**: Enhances generated code with better documentation and business logic
- **Validation Engine**: Multi-level validation (syntax, semantic, best practices)
- **Business Analysis**: Generates comprehensive business documentation

### Templates

The service includes three base templates:

1. **Simple Agreement** (simple): Basic two-party agreement with states and permissions
2. **Payment Workflow** (medium): Multi-state payment workflow with validation and tracking
3. **Multi-Party Collaboration** (complex): Complex multi-party workflow with obligations

## API Endpoints

### Health Check
```
GET /health
```

### List Templates
```
GET /templates
```

### Generate Protocol
```
POST /generate
```

**Request Body:**
```json
{
  "requirements": {
    "name": "Protocol Name",
    "description": "Protocol description (min 10 chars)",
    "parties": ["party1", "party2"],
    "states": ["initial", "pending", "completed"],
    "interactions": [
      {
        "name": "actionName",
        "description": "Action description",
        "fromParty": "party1",
        "parameters": [
          {
            "name": "paramName",
            "type": "Number",
            "description": "Parameter description",
            "required": true
          }
        ]
      }
    ],
    "businessRules": ["Rule 1", "Rule 2"]
  },
  "options": {
    "validationLevel": "normal|strict",
    "aiEnhancement": true|false
  }
}
```

### Validate NPL Code
```
POST /validate
```

### Deploy Protocol
```
POST /deploy
```

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create `.env` file with OpenAI API key:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```
4. Build the project:
   ```bash
   npm run build
   ```
5. Start the service:
   ```bash
   npm start
   ```

## Usage

### Basic Protocol Generation

```bash
curl -X POST http://localhost:3003/generate \
  -H "Content-Type: application/json" \
  -d '{
    "requirements": {
      "name": "Simple Payment",
      "description": "A simple payment agreement between buyer and seller",
      "parties": ["buyer", "seller"],
      "states": ["pending", "completed"],
      "interactions": [
        {
          "name": "makePayment",
          "description": "Buyer makes a payment",
          "fromParty": "buyer"
        }
      ],
      "businessRules": ["Payment amount must be positive"]
    }
  }'
```

### With AI Enhancement Disabled

```bash
curl -X POST http://localhost:3003/generate \
  -H "Content-Type: application/json" \
  -d '{
    "requirements": {
      "name": "Test Protocol",
      "description": "A test protocol for validation",
      "parties": ["a", "b"],
      "states": ["pending", "completed"],
      "interactions": [
        {
          "name": "test",
          "description": "test interaction",
          "fromParty": "a"
        }
      ],
      "businessRules": ["Rule 1", "Rule 2"]
    },
    "options": {
      "aiEnhancement": false
    }
  }'
```

## Test Results

Current test suite results:
- ✅ Health Check
- ✅ Templates Endpoint
- ✅ Protocol Generation
- ✅ Validation
- ⚠️ Deployment (requires template fixes for NPL syntax)

**Note**: The deployment test currently fails due to two NPL validation issues:
1. Variable initialization requirements
2. Permission syntax (returns Type placement)

These are being addressed in the template system.

## Development

### Project Structure

```
src/
├── generators/
│   ├── ai-generator.ts      # AI enhancement and business analysis
│   └── validation-engine.ts # NPL validation logic
├── templates/
│   └── base-templates.ts    # NPL protocol templates
├── types/
│   └── index.ts            # TypeScript type definitions
├── validation/
│   └── npl-rules.ts        # NPL validation rules
└── server.ts               # Express server and endpoints
```

### Building

```bash
npm run build
```

### Testing

```bash
node test-protocol-generator.js
```

## Docker Support

The service includes Docker support for containerized deployment:

```bash
docker build -t npl-protocol-generator .
docker run -p 3003:3003 --env-file .env npl-protocol-generator
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License. 