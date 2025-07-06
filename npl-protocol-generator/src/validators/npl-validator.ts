import { ValidationResult } from '../types';
import { 
  NPL_RESERVED_KEYWORDS, 
  NPL_SYNTAX_RULES, 
  NPL_BEST_PRACTICES,
  NPL_METHOD_RESTRICTIONS 
} from '../rules/npl-rules';

/**
 * NPL Validation Engine
 * Performs syntax, semantic, and best practice validation
 */
export class NPLValidator {
  private results: ValidationResult[] = [];

  /**
   * Validate NPL code at specified level
   */
  validate(nplCode: string, level: 'syntax' | 'semantic' | 'full' = 'full'): ValidationResult[] {
    this.results = [];
    
    if (level === 'syntax' || level === 'full') {
      this.validateSyntax(nplCode);
    }
    
    if (level === 'semantic' || level === 'full') {
      this.validateSemantics(nplCode);
    }
    
    if (level === 'full') {
      this.validateBestPractices(nplCode);
    }
    
    return this.results;
  }

  /**
   * Syntax validation
   */
  private validateSyntax(nplCode: string): void {
    const lines = nplCode.split('\n');
    
    // Check package declaration is first
    if (lines.length > 0 && lines[0] && !lines[0].trim().startsWith('package ')) {
      this.addResult('syntax', 'error', 'Package declaration must be the first line', 1);
    }
    
    // Check for comments before package declaration
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]?.trim();
      if (!line) continue;
      
      if (line.startsWith('package ')) {
        break;
      }
      if (line.startsWith('/**') || line.startsWith('//') || line.startsWith('/*')) {
        this.addResult('syntax', 'error', 'No comments allowed before package declaration', i + 1);
        break;
      }
    }
    
    // Check semicolons
    this.validateSemicolons(nplCode, lines);
    
    // Check reserved keywords
    this.validateReservedKeywords(nplCode, lines);
    
    // Check basic syntax patterns
    this.validateBasicSyntax(nplCode, lines);
  }

  /**
   * Semantic validation
   */
  private validateSemantics(nplCode: string): void {
    const lines = nplCode.split('\n');
    
    // Check type compatibility
    this.validateTypeCompatibility(nplCode, lines);
    
    // Check variable initialization
    this.validateVariableInitialization(nplCode, lines);
    
    // Check state transitions
    this.validateStateTransitions(nplCode, lines);
    
    // Check permission syntax
    this.validatePermissionSyntax(nplCode, lines);
    
    // Check method usage
    this.validateMethodUsage(nplCode, lines);
  }

  /**
   * Best practice validation
   */
  private validateBestPractices(nplCode: string): void {
    const lines = nplCode.split('\n');
    
    // Check documentation
    this.validateDocumentation(nplCode, lines);
    
    // Check naming conventions
    this.validateNamingConventions(nplCode, lines);
    
    // Check complexity
    this.validateComplexity(nplCode, lines);
    
    // Check security practices
    this.validateSecurityPractices(nplCode, lines);
  }

  /**
   * Validate semicolon usage
   */
  private validateSemicolons(nplCode: string, lines: string[]): void {
    const statements = [
      'return',
      'become',
      'require',
      'var ',
      'if (',
      'for (',
      'function ',
      'permission[',
      'obligation['
    ];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]?.trim();
      if (!line) continue;
      
      // Skip empty lines, comments, and closing braces
      if (line.startsWith('//') || line.startsWith('/**') || line === '}' || line === '};') {
        continue;
      }
      
      // Check if line contains a statement that should end with semicolon
      const hasStatement = statements.some(stmt => line.includes(stmt));
      if (hasStatement && !line.endsWith(';') && !line.endsWith('{') && !line.endsWith('}')) {
        this.addResult('syntax', 'error', 'Statement must end with semicolon', i + 1);
      }
    }
  }

  /**
   * Validate reserved keywords
   */
  private validateReservedKeywords(nplCode: string, lines: string[]): void {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;
      
      const words = line.split(/\s+/);
      
      for (const word of words) {
        const cleanWord = word.replace(/[^a-zA-Z_]/g, '');
        if (NPL_RESERVED_KEYWORDS.includes(cleanWord)) {
          this.addResult('syntax', 'warning', `Avoid using reserved keyword '${cleanWord}' as identifier`, i + 1);
        }
      }
    }
  }

  /**
   * Validate basic syntax patterns
   */
  private validateBasicSyntax(nplCode: string, lines: string[]): void {
    // Check for String usage (should be Text)
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;
      
      if (line.includes(': String') || line.includes(': String[')) {
        this.addResult('syntax', 'error', 'Use Text instead of String type', i + 1);
      }
    }
    
    // Check for null usage
    if (nplCode.includes('null')) {
      this.addResult('syntax', 'error', 'Use Optional<T> instead of null values');
    }
    
    // Check for ternary operators
    if (nplCode.includes('?')) {
      this.addResult('syntax', 'error', 'Use if-else statements instead of ternary operators');
    }
  }

  /**
   * Validate type compatibility
   */
  private validateTypeCompatibility(nplCode: string, lines: string[]): void {
    // Check for Party storage in protocol variables
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;
      
      if (line.includes('var ') && line.includes(': Party')) {
        this.addResult('semantic', 'error', 'Never store Party values in protocol variables', i + 1);
      }
    }
  }

  /**
   * Validate variable initialization
   */
  private validateVariableInitialization(nplCode: string, lines: string[]): void {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;
      
      if (line.includes('var ') && line.includes(':') && !line.includes('=')) {
        this.addResult('semantic', 'error', 'All variables must be initialized when declared', i + 1);
      }
    }
  }

  /**
   * Validate state transitions
   */
  private validateStateTransitions(nplCode: string, lines: string[]): void {
    // Check that become statements reference valid states
    const stateDeclarations = new Set<string>();
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;
      
      if (line.includes('state ') || line.includes('initial state ') || line.includes('final state ')) {
        const stateName = line.split('state ')[1]?.split(';')[0]?.trim();
        if (stateName) {
          stateDeclarations.add(stateName);
        }
      }
    }
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;
      
      if (line.includes('become ')) {
        const stateName = line.split('become ')[1]?.split(';')[0]?.trim();
        if (stateName && !stateDeclarations.has(stateName)) {
          this.addResult('semantic', 'error', `Undefined state '${stateName}' in become statement`, i + 1);
        }
      }
    }
  }

  /**
   * Validate permission syntax
   */
  private validatePermissionSyntax(nplCode: string, lines: string[]): void {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;
      
      if (line.includes('permission[')) {
        // Check permission syntax order: permission[party] name(params) returns Type | state
        if (!line.includes('returns') && line.includes('|')) {
          this.addResult('semantic', 'error', 'Permission syntax: returns Type must come before state constraint', i + 1);
        }
      }
    }
  }

  /**
   * Validate method usage
   */
  private validateMethodUsage(nplCode: string, lines: string[]): void {
    // Check for toString() usage (should be toText())
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;
      
      if (line.includes('.toString()')) {
        this.addResult('semantic', 'error', 'Use toText() instead of toString()', i + 1);
      }
    }
    
    // Check for size() on Text (should be length())
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;
      
      if (line.includes('.size()') && line.includes(': Text')) {
        this.addResult('semantic', 'error', 'Use length() instead of size() for Text', i + 1);
      }
    }
  }

  /**
   * Validate documentation
   */
  private validateDocumentation(nplCode: string, lines: string[]): void {
    let hasProtocolDoc = false;
    let hasPermissionDoc = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;
      
      if (line.includes('protocol[') && !hasProtocolDoc) {
        // Check if protocol has documentation
        for (let j = i - 1; j >= 0; j--) {
          const checkLine = lines[j];
          if (!checkLine) continue;
          
          if (checkLine.trim().startsWith('/**')) {
            hasProtocolDoc = true;
            break;
          }
          if (checkLine.trim() && !checkLine.trim().startsWith('*')) {
            break;
          }
        }
        if (!hasProtocolDoc) {
          this.addResult('best_practice', 'warning', 'Protocol should have Javadoc documentation', i + 1);
        }
      }
      
      if (line.includes('permission[') && !hasPermissionDoc) {
        // Check if permission has documentation
        for (let j = i - 1; j >= 0; j--) {
          const checkLine = lines[j];
          if (!checkLine) continue;
          
          if (checkLine.trim().startsWith('/**')) {
            hasPermissionDoc = true;
            break;
          }
          if (checkLine.trim() && !checkLine.trim().startsWith('*')) {
            break;
          }
        }
        if (!hasPermissionDoc) {
          this.addResult('best_practice', 'warning', 'Permission should have Javadoc documentation', i + 1);
        }
      }
    }
  }

  /**
   * Validate naming conventions
   */
  private validateNamingConventions(nplCode: string, lines: string[]): void {
    // Check for camelCase in protocol names
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;
      
      if (line.includes('protocol[')) {
        const protocolName = line.split('protocol[')[1]?.split(']')[1]?.split('(')[0]?.trim();
        if (protocolName && !/^[A-Z][a-zA-Z0-9]*$/.test(protocolName)) {
          this.addResult('best_practice', 'warning', 'Protocol names should use PascalCase', i + 1);
        }
      }
    }
  }

  /**
   * Validate complexity
   */
  private validateComplexity(nplCode: string, lines: string[]): void {
    const lineCount = lines.filter(line => line?.trim() && !line.trim().startsWith('//')).length;
    if (lineCount > 200) {
      this.addResult('best_practice', 'warning', 'Protocol implementation should be less than 200 lines for maintainability');
    }
  }

  /**
   * Validate security practices
   */
  private validateSecurityPractices(nplCode: string, lines: string[]): void {
    // Check for proper require statements
    let hasRequire = false;
    for (const line of lines) {
      if (line?.includes('require(')) {
        hasRequire = true;
        break;
      }
    }
    
    if (!hasRequire) {
      this.addResult('best_practice', 'info', 'Consider adding require() statements for input validation');
    }
  }

  /**
   * Add validation result
   */
  private addResult(
    type: 'syntax' | 'semantic' | 'best_practice',
    severity: 'error' | 'warning' | 'info',
    message: string,
    line?: number
  ): void {
    const result: ValidationResult = {
      type,
      severity,
      message
    };
    
    if (line !== undefined) {
      result.line = line;
    }
    
    this.results.push(result);
  }
} 