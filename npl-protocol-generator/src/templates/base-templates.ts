/**
 * Base NPL protocol templates for reliable code generation
 * These templates provide proven, tested structures that AI can enhance
 */

export const BASE_TEMPLATES = {
  // Simple two-party agreement template
  simpleAgreement: {
    name: 'Simple Agreement',
    description: 'Basic two-party agreement with states and permissions',
    complexity: 'simple' as const,
    template: `package {{packageName}}

/**
 * {{protocolDescription}}
 * @param {{paramName}} {{paramDescription}}
 */
@api
protocol[{{party1}}, {{party2}}] {{protocolName}}(var {{paramName}}: {{paramType}}) {
    require({{paramName}} > 0, "{{paramName}} must be strictly positive");

    initial state {{initialState}};
    {{#if hasIntermediateState}}state {{intermediateState}};{{/if}}
    final state {{finalState}};

    /**
     * {{permission1Description}}
     * @param {{permission1Param}} {{permission1ParamDescription}}
     */
    @api
    permission[{{permission1Party}}] {{permission1Name}}({{permission1Param}}: {{permission1ParamType}}) | {{permission1State}} {
        require({{permission1Param}} > 0, "{{permission1Param}} must be strictly positive");
        {{#if hasIntermediateState}}become {{intermediateState}};{{else}}become {{finalState}};{{/if}}
    };

    {{#if hasSecondPermission}}
    /**
     * {{permission2Description}}
     */
    @api
    permission[{{permission2Party}}] {{permission2Name}}() | {{permission2State}} {
        become {{finalState}};
    };
    {{/if}}
}`,
    placeholders: {
      packageName: 'string',
      protocolDescription: 'string',
      paramName: 'string',
      paramDescription: 'string',
      paramType: 'string',
      party1: 'string',
      party2: 'string',
      protocolName: 'string',
      initialState: 'string',
      intermediateState: 'string',
      finalState: 'string',
      hasIntermediateState: 'boolean',
      hasSecondPermission: 'boolean',
      permission1Description: 'string',
      permission1Param: 'string',
      permission1ParamDescription: 'string',
      permission1Party: 'string',
      permission1Name: 'string',
      permission1ParamType: 'string',
      permission1State: 'string',
      permission2Description: 'string',
      permission2Party: 'string',
      permission2Name: 'string',
      permission2State: 'string'
    }
  },

  // Payment workflow template
  paymentWorkflow: {
    name: 'Payment Workflow',
    description: 'Multi-state payment workflow with validation and tracking',
    complexity: 'medium' as const,
    template: `package {{packageName}}

/**
 * Struct to represent a payment record
 * @param amount The payment amount
 * @param timestamp The payment timestamp
 * @param status The payment status
 */
struct PaymentRecord {
    amount: Number,
    timestamp: DateTime,
    status: Text
};

/**
 * {{protocolDescription}}
 * @param {{paramName}} {{paramDescription}}
 */
@api
protocol[{{party1}}, {{party2}}] {{protocolName}}(var {{paramName}}: {{paramType}}) {
    require({{paramName}} > 0, "{{paramName}} must be strictly positive");

    initial state {{initialState}};
    state {{pendingState}};
    final state {{completedState}};
    final state {{failedState}};

    private var payments = listOf<PaymentRecord>();
    private var totalPaid: Number = 0;

    /**
     * Function to calculate remaining amount
     * @return The remaining amount to be paid
     */
    function remainingAmount() returns Number -> {{paramName}} - totalPaid;

    /**
     * {{permission1Description}}
     * @param {{permission1Param}} {{permission1ParamDescription}}
     */
    @api
    permission[{{permission1Party}}] {{permission1Name}}({{permission1Param}}: {{permission1ParamType}}) | {{permission1State}} {
        require({{permission1Param}} > 0, "{{permission1Param}} must be strictly positive");
        require({{permission1Param}} <= remainingAmount(), "{{permission1Param}} may not exceed remaining amount");

        var payment = PaymentRecord(
            amount = {{permission1Param}},
            timestamp = now(),
            status = "pending"
        );

        payments = payments.with(payment);
        totalPaid = totalPaid + {{permission1Param}};
        become {{pendingState}};
    };

    /**
     * {{permission2Description}}
     */
    @api
    permission[{{permission2Party}}] {{permission2Name}}() | {{permission2State}} {
        if (remainingAmount() == 0) {
            become {{completedState}};
        } else {
            become {{failedState}};
        };
    };
}`,
    placeholders: {
      packageName: 'string',
      protocolDescription: 'string',
      paramName: 'string',
      paramDescription: 'string',
      paramType: 'string',
      party1: 'string',
      party2: 'string',
      protocolName: 'string',
      initialState: 'string',
      pendingState: 'string',
      completedState: 'string',
      failedState: 'string',
      permission1Description: 'string',
      permission1Param: 'string',
      permission1ParamDescription: 'string',
      permission1Party: 'string',
      permission1Name: 'string',
      permission1ParamType: 'string',
      permission1State: 'string',
      permission2Description: 'string',
      permission2Party: 'string',
      permission2Name: 'string',
      permission2State: 'string'
    }
  },

  // Multi-party collaboration template
  multiPartyCollaboration: {
    name: 'Multi-Party Collaboration',
    description: 'Complex multi-party workflow with obligations and notifications',
    complexity: 'complex' as const,
    template: `package {{packageName}}

/**
 * Enum for collaboration status
 */
enum CollaborationStatus {
    Pending,
    Active,
    Completed,
    Cancelled
};

/**
 * Struct for collaboration milestone
 * @param id The milestone identifier
 * @param description The milestone description
 * @param deadline The milestone deadline
 * @param completed Whether the milestone is completed
 */
struct Milestone {
    id: Text,
    description: Text,
    deadline: DateTime,
    completed: Boolean
};

/**
 * {{protocolDescription}}
 * @param {{paramName}} {{paramDescription}}
 */
@api
protocol[{{party1}}, {{party2}}, {{party3}}] {{protocolName}}(var {{paramName}}: {{paramType}}) {
    require({{paramName}} > 0, "{{paramName}} must be strictly positive");

    initial state {{initialState}};
    state {{activeState}};
    final state {{completedState}};
    final state {{cancelledState}};

    private var status: CollaborationStatus = CollaborationStatus.Pending;
    private var milestones = listOf<Milestone>();
    private var startTime: DateTime = now();
    private var endTime: Optional<DateTime> = optionalOf<DateTime>();

    /**
     * {{permission1Description}}
     */
    @api
    permission[{{permission1Party}}] {{permission1Name}}() | {{permission1State}} {
        status = CollaborationStatus.Active;
        become {{activeState}};
    };

    /**
     * {{permission2Description}}
     * @param {{permission2Param}} {{permission2ParamDescription}}
     */
    @api
    permission[{{permission2Party}}] {{permission2Name}}({{permission2Param}}: {{permission2ParamType}}) | {{permission2State}} {
        var milestone = Milestone(
            id = {{permission2Param}}.id,
            description = {{permission2Param}}.description,
            deadline = {{permission2Param}}.deadline,
            completed = false
        );

        milestones = milestones.with(milestone);
    };

    /**
     * {{permission3Description}}
     * @param {{permission3Param}} {{permission3ParamDescription}}
     */
    @api
    permission[{{permission3Party}}] {{permission3Name}}({{permission3Param}}: {{permission3ParamType}}) | {{permission3State}} {
        // Find and update milestone
        for (milestone in milestones) {
            if (milestone.id == {{permission3Param}}) {
                var updatedMilestone = Milestone(
                    id = milestone.id,
                    description = milestone.description,
                    deadline = milestone.deadline,
                    completed = true
                );
                
                milestones = milestones.without(milestone).with(updatedMilestone);
                break;
            };
        };

        // Check if all milestones are completed
        var allCompleted = milestones.allMatch(function(m: Milestone) -> m.completed);
        if (allCompleted) {
            status = CollaborationStatus.Completed;
            endTime = optionalOf(now());
            become {{completedState}};
        };
    };

    /**
     * Obligation to complete collaboration within deadline
     */
    obligation[{{party1}} | {{party2}} | {{party3}}] completeCollaboration() before {{deadline}} | {{activeState}} {
        // Collaboration must be completed by deadline
    } otherwise become {{cancelledState}};
}`,
    placeholders: {
      packageName: 'string',
      protocolDescription: 'string',
      paramName: 'string',
      paramDescription: 'string',
      paramType: 'string',
      party1: 'string',
      party2: 'string',
      party3: 'string',
      protocolName: 'string',
      initialState: 'string',
      activeState: 'string',
      completedState: 'string',
      cancelledState: 'string',
      permission1Description: 'string',
      permission1Party: 'string',
      permission1Name: 'string',
      permission1State: 'string',
      permission2Description: 'string',
      permission2Param: 'string',
      permission2ParamDescription: 'string',
      permission2Party: 'string',
      permission2Name: 'string',
      permission2ParamType: 'string',
      permission2State: 'string',
      permission3Description: 'string',
      permission3Param: 'string',
      permission3ParamDescription: 'string',
      permission3Party: 'string',
      permission3Name: 'string',
      permission3ParamType: 'string',
      permission3State: 'string',
      deadline: 'string'
    }
  }
};

export const TEMPLATE_CATEGORIES = {
  simple: ['simpleAgreement'],
  medium: ['paymentWorkflow'],
  complex: ['multiPartyCollaboration']
};

export function getTemplateByName(name: string) {
  return BASE_TEMPLATES[name as keyof typeof BASE_TEMPLATES];
}

export function getTemplatesByComplexity(complexity: 'simple' | 'medium' | 'complex') {
  return TEMPLATE_CATEGORIES[complexity].map(name => BASE_TEMPLATES[name as keyof typeof BASE_TEMPLATES]);
}

export function getAllTemplates() {
  return Object.values(BASE_TEMPLATES);
} 