/**
 * NPL-specific rules and constraints for protocol generation and validation
 * Based on Noumena Digital VSCode extension and official NPL documentation
 */

export const NPL_RESERVED_KEYWORDS = [
  'after', 'and', 'become', 'before', 'between', 'const', 'enum', 'else', 'final',
  'for', 'function', 'guard', 'in', 'init', 'initial', 'if', 'is', 'match', 'native',
  'notification', 'notify', 'identifier', 'obligation', 'optional', 'otherwise',
  'package', 'permission', 'private', 'protocol', 'require', 'resume', 'return',
  'returns', 'state', 'struct', 'symbol', 'this', 'union', 'use', 'var', 'vararg',
  'with', 'copy'
];

export const NPL_BASIC_TYPES = [
  'Boolean', 'Number', 'Text', 'DateTime', 'LocalDate', 'Duration', 'Period',
  'Blob', 'Unit', 'Party'
];

export const NPL_COLLECTION_TYPES = [
  'List<T>', 'Set<T>', 'Map<K, V>', 'Optional<T>', 'Pair<A, B>'
];

export const NPL_SYNTAX_RULES = {
  // Package declaration must be first line
  packageFirst: true,
  
  // All statements must end with semicolon
  requireSemicolons: true,
  
  // No null values - use Optional<T> instead
  noNullValues: true,
  
  // Use Text, not String
  useTextNotString: true,
  
  // Party limitations - never store Party values in protocol variables
  noPartyStorage: true,
  
  // No ternary operators - use if-else statements
  noTernaryOperators: true,
  
  // Otherwise clauses must only contain state transitions
  otherwiseStateTransitionOnly: true,
  
  // Type definitions must be at top level, not inside protocols
  typesAtTopLevel: true,
  
  // Struct fields use commas, not semicolons
  structFieldsUseCommas: true,
  
  // All variables must be initialized when declared
  requireVariableInitialization: true,
  
  // No comments before package declaration
  noCommentsBeforePackage: true,
  
  // Boolean operators: use && and ||, not 'and' and 'or'
  useLogicalOperators: true,
  
  // Permission syntax order: permission[party] name(params) returns Type | state
  permissionSyntaxOrder: true,
  
  // Use toText(), not toString()
  useToText: true,
  
  // Only use for-in loops
  onlyForInLoops: true,
  
  // Multiple parties in single permission: permission[buyer | seller]
  multiplePartiesInPermission: true,
  
  // Use length() for Text, not size()
  useLengthForText: true,
  
  // List.without() removes elements, not indices
  listWithoutRemovesElements: true,
  
  // Invoke permissions with this. and party
  invokePermissionsWithThis: true,
  
  // DateTime methods require inclusive parameter
  dateTimeMethodsRequireInclusive: true
};

export const NPL_BEST_PRACTICES = {
  // Document everything with Javadoc-style comments
  documentEverything: true,
  
  // Keep implementations simple (less than 200 lines)
  keepImplementationsSimple: true,
  
  // No redundant getters for public protocol fields
  noRedundantGetters: true,
  
  // Unwrap activeState() before comparing
  unwrapActiveState: true,
  
  // Don't hallucinate methods - only use documented ones
  noMethodHallucination: true,
  
  // Immutable collections - use with() and without()
  useImmutableCollections: true,
  
  // No advanced functional operations unless documented
  noAdvancedFunctionalOps: true
};

export const NPL_METHOD_RESTRICTIONS = {
  // Collection methods (all collections)
  collectionMethods: [
    'allMatch', 'anyMatch', 'contains', 'flatMap', 'fold', 'forEach', 'isEmpty',
    'isNotEmpty', 'map', 'noneMatch', 'size', 'asList', 'sum'
  ],
  
  // List methods
  listMethods: [
    'filter', 'findFirstOrNone', 'firstOrNone', 'get', 'head', 'indexOfOrNone',
    'lastOrNone', 'plus', 'reverse', 'sort', 'sortBy', 'tail', 'toSet', 'with',
    'withAt', 'without', 'withoutAt', 'withIndex', 'zipOrFail', 'takeFirst',
    'takeLast', 'toMap'
  ],
  
  // Map methods
  mapMethods: [
    'filter', 'forEach', 'getOrNone', 'isEmpty', 'isNotEmpty', 'keys', 'plus',
    'size', 'mapValues', 'values', 'with', 'without', 'toList'
  ],
  
  // Set methods
  setMethods: [
    'filter', 'plus', 'toList', 'with', 'without', 'takeFirst', 'takeLast'
  ],
  
  // Text methods
  textMethods: [
    'plus', 'lessThan', 'greaterThan', 'lessThanOrEqual', 'greaterThanOrEqual', 'length'
  ],
  
  // Number methods
  numberMethods: [
    'isInteger', 'roundTo', 'negative', 'plus', 'minus', 'multiplyBy', 'divideBy',
    'remainder', 'lessThan', 'greaterThan', 'lessThanOrEqual', 'greaterThanOrEqual'
  ],
  
  // Boolean methods
  booleanMethods: ['not'],
  
  // DateTime methods
  dateTimeMethods: [
    'day', 'month', 'year', 'nano', 'second', 'minute', 'hour', 'zoneId',
    'firstDayOfYear', 'lastDayOfYear', 'firstDayOfMonth', 'lastDayOfMonth',
    'startOfDay', 'durationUntil', 'isAfter', 'isBefore', 'isBetween',
    'withZoneSameLocal', 'withZoneSameInstant', 'plus', 'minus', 'toLocalDate',
    'dayOfWeek'
  ],
  
  // Duration methods
  durationMethods: ['toSeconds', 'plus', 'minus', 'multiplyBy'],
  
  // LocalDate methods
  localDateMethods: [
    'day', 'month', 'year', 'firstDayOfYear', 'lastDayOfYear', 'firstDayOfMonth',
    'lastDayOfMonth', 'isAfter', 'isBefore', 'isBetween', 'plus', 'minus',
    'periodUntil', 'atStartOfDay', 'dayOfWeek'
  ],
  
  // Period methods
  periodMethods: ['plus', 'minus', 'multiplyBy'],
  
  // Optional methods
  optionalMethods: ['isPresent', 'getOrElse', 'getOrFail', 'computeIfAbsent'],
  
  // Party methods
  partyMethods: [
    'sameEntityAs', 'containsEntityValuesOf', 'isRepresentableBy', 'mayRepresent',
    'entity', 'access'
  ],
  
  // Protocol methods
  protocolMethods: ['parties', 'activeState', 'initialState', 'finalStates'],
  
  // Blob methods
  blobMethods: ['filename', 'mimeType'],
  
  // Symbol methods
  symbolMethods: [
    'toNumber', 'unit', 'plus', 'minus', 'multiplyBy', 'divideBy', 'remainder',
    'negative', 'lessThan', 'greaterThan', 'lessThanOrEqual', 'greaterThanOrEqual'
  ],
  
  // General methods
  generalMethods: ['toText']
};

export const NPL_TEMPLATE_STRUCTURE = {
  // Required sections in order
  sections: [
    'package',
    'imports',
    'typeDefinitions',
    'protocolDeclaration',
    'initBlock',
    'stateDeclarations',
    'variableDeclarations',
    'functionDefinitions',
    'permissionDefinitions',
    'obligationDefinitions'
  ],
  
  // Required elements
  requiredElements: [
    'packageDeclaration',
    'protocolDeclaration',
    'initialState',
    'atLeastOnePermission'
  ],
  
  // Optional elements
  optionalElements: [
    'imports',
    'structs',
    'enums',
    'unions',
    'symbols',
    'identifiers',
    'initBlock',
    'privateVariables',
    'functions',
    'obligations',
    'finalStates'
  ]
};

export const NPL_VALIDATION_LEVELS = {
  syntax: {
    name: 'Syntax Validation',
    checks: [
      'packageDeclaration',
      'semicolons',
      'brackets',
      'keywords',
      'basicSyntax'
    ]
  },
  semantic: {
    name: 'Semantic Validation',
    checks: [
      'typeCompatibility',
      'variableInitialization',
      'stateTransitions',
      'permissionSyntax',
      'methodUsage'
    ]
  },
  bestPractice: {
    name: 'Best Practice Validation',
    checks: [
      'documentation',
      'namingConventions',
      'complexity',
      'security',
      'performance'
    ]
  }
}; 