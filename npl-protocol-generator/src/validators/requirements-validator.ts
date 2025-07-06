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

interface ValidationResult {
  valid: boolean;
  errors: string[];
  suggestions: string[];
}

export function validateRequirements(request: ProtocolGenerationRequest): ValidationResult {
  const errors: string[] = [];
  const suggestions: string[] = [];

  // Validate business name
  if (!request.businessName || request.businessName.trim().length === 0) {
    errors.push('Business name is required');
  } else if (request.businessName.length > 50) {
    errors.push('Business name should be less than 50 characters');
  }

  // Validate workflow description
  if (!request.workflowDescription || request.workflowDescription.trim().length === 0) {
    errors.push('Workflow description is required');
  } else if (request.workflowDescription.length < 10) {
    errors.push('Workflow description should be at least 10 characters');
  }

  // Validate parties
  if (!request.parties || request.parties.length === 0) {
    errors.push('At least one party is required');
  } else if (request.parties.length > 10) {
    errors.push('Maximum 10 parties allowed');
  } else {
    request.parties.forEach((party, index) => {
      if (!party || party.trim().length === 0) {
        errors.push(`Party ${index + 1} cannot be empty`);
      } else if (party.length > 30) {
        errors.push(`Party name "${party}" should be less than 30 characters`);
      }
    });
  }

  // Validate states
  if (!request.states || request.states.length === 0) {
    errors.push('At least one state is required');
  } else if (request.states.length > 20) {
    errors.push('Maximum 20 states allowed');
  } else {
    request.states.forEach((state, index) => {
      if (!state || state.trim().length === 0) {
        errors.push(`State ${index + 1} cannot be empty`);
      } else if (state.length > 30) {
        errors.push(`State name "${state}" should be less than 30 characters`);
      }
    });
  }

  // Validate actions
  if (!request.actions || request.actions.length === 0) {
    errors.push('At least one action is required');
  } else if (request.actions.length > 50) {
    errors.push('Maximum 50 actions allowed');
  } else {
    request.actions.forEach((action, index) => {
      // Validate action name
      if (!action.name || action.name.trim().length === 0) {
        errors.push(`Action ${index + 1} name cannot be empty`);
      } else if (action.name.length > 50) {
        errors.push(`Action name "${action.name}" should be less than 50 characters`);
      }

      // Validate action description
      if (!action.description || action.description.trim().length === 0) {
        errors.push(`Action "${action.name}" description cannot be empty`);
      }

      // Validate party
      if (!action.party || action.party.trim().length === 0) {
        errors.push(`Action "${action.name}" party cannot be empty`);
      } else if (!request.parties.includes(action.party)) {
        errors.push(`Action "${action.name}" party "${action.party}" not found in parties list`);
      }

      // Validate from state
      if (!action.fromState || action.fromState.trim().length === 0) {
        errors.push(`Action "${action.name}" from state cannot be empty`);
      } else if (!request.states.includes(action.fromState)) {
        errors.push(`Action "${action.name}" from state "${action.fromState}" not found in states list`);
      }

      // Validate to state
      if (!action.toState || action.toState.trim().length === 0) {
        errors.push(`Action "${action.name}" to state cannot be empty`);
      } else if (!request.states.includes(action.toState)) {
        errors.push(`Action "${action.name}" to state "${action.toState}" not found in states list`);
      }

      // Validate parameters
      if (action.parameters) {
        action.parameters.forEach((param, paramIndex) => {
          if (!param.name || param.name.trim().length === 0) {
            errors.push(`Action "${action.name}" parameter ${paramIndex + 1} name cannot be empty`);
          }
          if (!param.type || param.type.trim().length === 0) {
            errors.push(`Action "${action.name}" parameter "${param.name}" type cannot be empty`);
          }
        });
      }
    });
  }

  // Validate business rules
  if (request.businessRules) {
    request.businessRules.forEach((rule, index) => {
      if (!rule || rule.trim().length === 0) {
        errors.push(`Business rule ${index + 1} cannot be empty`);
      }
    });
  }

  // Generate suggestions
  if (request.states && request.states.length > 0) {
    const hasInitial = request.states.some(state => 
      state.toLowerCase().includes('initial') || 
      state.toLowerCase().includes('pending') || 
      state.toLowerCase().includes('created')
    );
    if (!hasInitial) {
      suggestions.push('Consider adding an initial state like "pending" or "created"');
    }

    const hasFinal = request.states.some(state => 
      state.toLowerCase().includes('final') || 
      state.toLowerCase().includes('completed') || 
      state.toLowerCase().includes('finished')
    );
    if (!hasFinal) {
      suggestions.push('Consider adding a final state like "completed" or "finished"');
    }
  }

  if (request.actions && request.actions.length > 0) {
    const hasCreateAction = request.actions.some(action => 
      action.name.toLowerCase().includes('create') || 
      action.name.toLowerCase().includes('initiate')
    );
    if (!hasCreateAction) {
      suggestions.push('Consider adding a create/initiate action to start the workflow');
    }
  }

  if (request.parties && request.parties.length === 1) {
    suggestions.push('Consider adding more parties for a multi-party workflow');
  }

  return {
    valid: errors.length === 0,
    errors,
    suggestions
  };
} 