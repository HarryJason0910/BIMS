/**
 * TechStack - Dynamic technology stack management
 * 
 * Manages available technology stacks that can be used in bids.
 * Stacks can be dynamically added by users.
 */

export class TechStack {
  private static stacks: Set<string> = new Set([
    // Default stacks
    'TypeScript',
    'JavaScript',
    'React',
    'Node.js',
    'Python',
    'Java',
    'C#',
    'Go',
    'Rust',
    'Angular',
    'Vue.js',
    'Express',
    'NestJS',
    'Django',
    'Flask',
    'Spring Boot',
    '.NET',
    'PostgreSQL',
    'MongoDB',
    'MySQL',
    'Redis',
    'Docker',
    'Kubernetes',
    'AWS',
    'Azure',
    'GCP',
    'GraphQL',
    'REST API',
    'Microservices'
  ]);

  /**
   * Get all available stacks
   */
  static getAllStacks(): string[] {
    return Array.from(this.stacks).sort();
  }

  /**
   * Add a new stack
   */
  static addStack(stack: string): void {
    if (!stack || stack.trim() === '') {
      throw new Error('Stack name cannot be empty');
    }
    this.stacks.add(stack.trim());
  }

  /**
   * Add multiple stacks
   */
  static addStacks(stacks: string[]): void {
    stacks.forEach(stack => this.addStack(stack));
  }

  /**
   * Check if a stack exists
   */
  static hasStack(stack: string): boolean {
    return this.stacks.has(stack);
  }

  /**
   * Remove a stack (admin only - not exposed via API)
   */
  static removeStack(stack: string): void {
    this.stacks.delete(stack);
  }
}
