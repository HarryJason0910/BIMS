/**
 * CanonicalSkillMapper
 * 
 * Maps skill variations to their canonical form for consistent matching.
 * This ensures that different representations of the same skill are treated identically.
 * 
 * Example: ".NET Core", "dotnet", "asp.net" all map to "dotnet"
 * 
 * Part of: resume-selection-from-history feature
 * Design principle: Canonical skill matching only (no AI, no embeddings)
 */

export class CanonicalSkillMapper {
  private static readonly SKILL_MAP: Map<string, string[]> = new Map([
    // Frontend - JavaScript Ecosystem
    ["javascript", ["javascript", "js", "ecmascript"]],
    ["typescript", ["typescript", "ts"]],
    ["html", ["html", "html5"]],
    ["css", ["css", "css3"]],
    ["react", ["react", "reactjs", "react.js"]],
    ["nextjs", ["nextjs", "next.js"]],
    ["vue", ["vue", "vuejs", "vue.js"]],
    ["angular", ["angular", "angularjs"]],
    ["svelte", ["svelte"]],
    
    // State Management
    ["redux", ["redux", "redux toolkit"]],
    ["zustand", ["zustand"]],
    ["mobx", ["mobx"]],
    
    // Build Tools
    ["webpack", ["webpack"]],
    ["vite", ["vite"]],
    ["babel", ["babel"]],
    
    // CSS Frameworks
    ["tailwindcss", ["tailwind", "tailwindcss"]],
    ["bootstrap", ["bootstrap"]],
    ["materialui", ["material ui", "mui"]],
    ["chakraui", ["chakra ui"]],
    
    // Testing - Frontend
    ["jest", ["jest"]],
    ["cypress", ["cypress"]],
    ["playwright", ["playwright"]],
    ["testinglibrary", ["react testing library", "testing library"]],
    
    // Rendering Strategies
    ["spa", ["spa", "single page application"]],
    ["ssr", ["ssr", "server side rendering"]],
    
    // Backend - Java
    ["java", ["java"]],
    ["spring", ["spring"]],
    ["springboot", ["spring boot"]],
    ["springsecurity", ["spring security"]],
    ["hibernate", ["hibernate"]],
    ["jpa", ["jpa"]],
    
    // Backend - Node.js
    ["nodejs", ["node", "nodejs", "node.js"]],
    ["express", ["express", "expressjs", "express.js"]],
    ["nestjs", ["nestjs", "nest.js"]],
    
    // Backend - .NET
    ["dotnet", [".net", ".net core", "dotnet", "asp.net", "asp.net core"]],
    ["csharp", ["c#", "c sharp"]],
    
    // Backend - Python
    ["python", ["python"]],
    ["django", ["django"]],
    ["flask", ["flask"]],
    ["fastapi", ["fastapi"]],
    
    // Backend - Ruby
    ["ruby", ["ruby"]],
    ["rubyonrails", ["rails", "ruby on rails"]],
    
    // Backend - PHP
    ["php", ["php"]],
    ["laravel", ["laravel"]],
    
    // Backend - Other Languages
    ["go", ["go", "golang"]],
    ["kotlin", ["kotlin"]],
    ["scala", ["scala"]],
    ["c", ["c"]],
    ["cplusplus", ["c++", "cpp"]],
    ["objectivec", ["objective-c"]],
    ["assembly", ["assembly", "asm"]],
    
    // Architecture Patterns
    ["microservices", ["microservices", "microservice architecture"]],
    ["monolith", ["monolith", "monolithic architecture"]],
    ["restapi", ["rest", "rest api", "restful api"]],
    ["graphql", ["graphql"]],
    ["grpc", ["grpc"]],
    ["websockets", ["websocket", "websockets"]],
    
    // Authentication & Authorization
    ["oauth2", ["oauth2", "oauth 2.0"]],
    ["jwt", ["jwt", "json web token"]],
    ["openidconnect", ["openid connect", "oidc"]],
    ["saml", ["saml"]],
    ["ldap", ["ldap"]],
    
    // Databases - SQL
    ["sql", ["sql"]],
    ["mysql", ["mysql"]],
    ["postgresql", ["postgres", "postgresql"]],
    ["oracle", ["oracle"]],
    ["sqlserver", ["sql server", "mssql"]],
    
    // Databases - NoSQL
    ["mongodb", ["mongodb"]],
    ["redis", ["redis"]],
    ["dynamodb", ["dynamodb"]],
    ["cassandra", ["cassandra"]],
    ["elasticsearch", ["elasticsearch"]],
    ["neo4j", ["neo4j"]],
    ["nosql", ["nosql"]],
    
    // Data Engineering
    ["datamodeling", ["data modeling", "database design"]],
    ["etl", ["etl"]],
    ["datawarehouse", ["data warehouse", "data warehousing"]],
    ["bigquery", ["bigquery"]],
    ["snowflake", ["snowflake"]],
    ["redshift", ["redshift"]],
    ["spark", ["spark", "apache spark"]],
    ["hadoop", ["hadoop"]],
    ["airflow", ["airflow", "apache airflow"]],
    ["flink", ["flink"]],
    ["beam", ["beam", "apache beam"]],
    
    // Cloud Providers
    ["aws", ["aws", "amazon web services"]],
    ["azure", ["azure", "microsoft azure"]],
    ["gcp", ["gcp", "google cloud platform"]],
    
    // Containers & Orchestration
    ["docker", ["docker"]],
    ["kubernetes", ["kubernetes", "k8s"]],
    ["ecs", ["ecs"]],
    ["eks", ["eks"]],
    
    // Serverless
    ["lambda", ["lambda", "aws lambda"]],
    ["serverless", ["serverless"]],
    
    // Infrastructure as Code
    ["terraform", ["terraform"]],
    ["cloudformation", ["cloudformation"]],
    ["ansible", ["ansible"]],
    ["packer", ["packer"]],
    ["infrastructureascode", ["infrastructure as code", "iac"]],
    
    // CI/CD
    ["cicd", ["ci/cd", "continuous integration", "continuous deployment"]],
    ["githubactions", ["github actions"]],
    ["jenkins", ["jenkins"]],
    ["gitlabci", ["gitlab ci"]],
    
    // Monitoring & Observability
    ["prometheus", ["prometheus"]],
    ["grafana", ["grafana"]],
    ["elk", ["elk", "elastic stack"]],
    ["observability", ["observability"]],
    ["logging", ["logging"]],
    ["distributed_tracing", ["distributed tracing"]],
    ["opentelemetry", ["opentelemetry"]],
    
    // Web Servers
    ["nginx", ["nginx"]],
    ["apache", ["apache"]],
    
    // Operating Systems
    ["linux", ["linux"]],
    ["windows", ["windows"]],
    ["unix", ["unix"]],
    ["bash", ["bash", "shell scripting"]],
    
    // Security
    ["applicationsecurity", ["application security", "appsec"]],
    ["owasp", ["owasp", "owasp top 10"]],
    ["authentication", ["authentication"]],
    ["authorization", ["authorization"]],
    ["encryption", ["encryption"]],
    ["tlsssl", ["tls", "ssl"]],
    ["iam", ["iam", "identity access management"]],
    ["secretsmanagement", ["secrets management", "vault"]],
    ["penetrationtesting", ["penetration testing", "pentest"]],
    ["vault", ["vault", "hashicorp vault"]],
    
    // Testing
    ["unittesting", ["unit testing"]],
    ["integrationtesting", ["integration testing"]],
    ["e2etesting", ["e2e testing", "end to end testing"]],
    ["tdd", ["tdd", "test driven development"]],
    ["bdd", ["bdd", "behavior driven development"]],
    ["mocking", ["mocking", "mocks"]],
    
    // Code Quality
    ["codereview", ["code review"]],
    ["staticanalysis", ["static analysis"]],
    ["eslint", ["eslint"]],
    ["prettier", ["prettier"]],
    
    // Mobile Development
    ["android", ["android"]],
    ["ios", ["ios"]],
    ["swift", ["swift"]],
    ["kotlinandroid", ["kotlin android"]],
    ["reactnative", ["react native"]],
    ["flutter", ["flutter"]],
    ["xamarin", ["xamarin"]],
    
    // Message Queues
    ["messagequeue", ["message queue", "message queues"]],
    ["kafka", ["kafka", "apache kafka"]],
    ["rabbitmq", ["rabbitmq"]],
    ["activemq", ["activemq"]],
    ["sqs", ["sqs", "amazon sqs"]],
    ["sns", ["sns", "amazon sns"]],
    ["pubsub", ["pubsub", "google pubsub"]],
    
    // Architecture & Design Patterns
    ["eventdrivenarchitecture", ["event driven architecture", "event-driven architecture"]],
    ["cqrs", ["cqrs"]],
    ["event_sourcing", ["event sourcing"]],
    ["monorepo", ["monorepo"]],
    ["polyrepo", ["polyrepo"]],
    ["api_gateway", ["api gateway", "api gateway pattern"]],
    ["service_mesh", ["service mesh"]],
    ["istio", ["istio"]],
    ["linkerd", ["linkerd"]],
    
    // Performance & Scalability
    ["loadbalancing", ["load balancing", "load balancer"]],
    ["caching", ["caching"]],
    ["rate_limiting", ["rate limiting"]],
    ["performance_optimization", ["performance optimization", "performance tuning"]],
    ["scalability", ["scalability", "scalable systems"]],
    ["high_availability", ["high availability", "ha"]],
    ["fault_tolerance", ["fault tolerance"]],
    ["disaster_recovery", ["disaster recovery"]],
    
    // DevOps & SRE
    ["sre", ["sre", "site reliability engineering"]],
    ["devops", ["devops"]],
    ["platform_engineering", ["platform engineering"]],
    ["incident_management", ["incident management"]],
    ["root_cause_analysis", ["root cause analysis", "rca"]],
    
    // Networking
    ["filesystem", ["file system", "filesystem"]],
    ["networking", ["networking", "computer networking"]],
    ["tcpip", ["tcp/ip"]],
    ["dns", ["dns"]],
    ["http", ["http"]],
    ["https", ["https"]],
    
    // Data Formats
    ["json", ["json"]],
    ["xml", ["xml"]],
    ["yaml", ["yaml", "yml"]],
    ["protobuf", ["protobuf", "protocol buffers"]],
    ["avro", ["avro"]],
    
    // Data Processing
    ["batch_processing", ["batch processing"]],
    ["stream_processing", ["stream processing"]],
    ["realtime_processing", ["real time processing", "realtime processing"]],
    ["data_ingestion", ["data ingestion"]],
    ["data_pipeline", ["data pipeline"]],
    ["data_lake", ["data lake"]],
    ["data_quality", ["data quality"]],
    ["data_governance", ["data governance"]],
    
    // Machine Learning & AI
    ["machine_learning", ["machine learning"]],
    ["deep_learning", ["deep learning"]],
    ["mlops", ["mlops"]],
    ["model_deployment", ["model deployment"]],
    ["feature_engineering", ["feature engineering"]],
    ["computer_vision", ["computer vision"]],
    ["nlp", ["nlp", "natural language processing"]],
    
    // Domain-Specific
    ["fintech", ["fintech"]],
    ["payments", ["payments", "payment processing"]],
    ["trading_systems", ["trading systems"]],
    ["risk_management", ["risk management"]],
    ["fraud_detection", ["fraud detection"]],
    ["healthcare", ["healthcare"]],
    ["hipaa", ["hipaa"]],
    ["hl7", ["hl7"]],
    ["fhir", ["fhir"]],
    
    // Compliance & Standards
    ["gdpr", ["gdpr"]],
    ["soc2", ["soc2"]],
    ["pci_dss", ["pci dss", "pci-dss"]],
    ["compliance", ["compliance"]],
    
    // Product & Project Management
    ["product_management", ["product management"]],
    ["roadmapping", ["roadmapping"]],
    ["backlog_management", ["backlog management"]],
    ["user_stories", ["user stories"]],
    ["agile", ["agile"]],
    ["scrum", ["scrum"]],
    ["kanban", ["kanban"]],
    ["stakeholdermanagement", ["stakeholder management"]],
    ["requirementsanalysis", ["requirements analysis"]],
    ["requirements_gathering", ["requirements gathering"]],
    ["estimation", ["estimation"]],
    ["capacity_planning", ["capacity planning"]],
    ["release_management", ["release management"]],
    
    // UX/UI
    ["ux", ["ux", "user experience"]],
    ["ui", ["ui", "user interface"]],
    ["accessibility", ["accessibility", "a11y"]],
    ["customer_facing", ["customer facing"]],
    
    // Soft Skills & Leadership
    ["communication", ["communication", "verbal communication"]],
    ["teamwork", ["teamwork", "collaboration"]],
    ["leadership", ["leadership"]],
    ["mentoring", ["mentoring", "coaching"]],
    ["problemsolving", ["problem solving"]],
    ["criticalthinking", ["critical thinking"]],
    ["timemanagement", ["time management"]],
    ["technical_leadership", ["technical leadership"]],
    ["decision_making", ["decision making"]],
    ["ownership", ["ownership"]],
    
    // Documentation
    ["documentation", ["documentation", "technical writing"]],
    
    // Build Tools & Package Managers
    ["gradle", ["gradle"]],
    ["maven", ["maven"]],
    ["npm", ["npm"]],
    ["yarn", ["yarn"]],
    ["pnpm", ["pnpm"]],
    
    // Libraries & Utilities
    ["rxjs", ["rxjs"]],
    ["lodash", ["lodash"]],
    ["axios", ["axios"]],
    ["jquery", ["jquery"]],
    ["storybook", ["storybook"]],
    
    // Service Discovery & Config
    ["consul", ["consul"]],
  ]);

  /**
   * Normalize a skill string to its canonical form
   * 
   * @param skill - The skill string to normalize (e.g., "Spring Boot", ".NET Core")
   * @returns The canonical skill name (e.g., "springboot", "dotnet")
   */
  public static normalize(skill: string): string {
    const normalized = skill.toLowerCase().trim();
    
    // Search through all canonical mappings
    for (const [canonical, variations] of this.SKILL_MAP.entries()) {
      if (variations.includes(normalized)) {
        return canonical;
      }
    }
    
    // If no mapping found, return the normalized input
    return normalized;
  }

  /**
   * Normalize an array of skills to their canonical forms
   * 
   * @param skills - Array of skill strings
   * @returns Array of canonical skill names (deduplicated)
   */
  public static normalizeArray(skills: string[]): string[] {
    const canonicalSkills = skills.map(skill => this.normalize(skill));
    // Remove duplicates by converting to Set and back to Array
    return Array.from(new Set(canonicalSkills));
  }

  /**
   * Get all variations for a canonical skill
   * 
   * @param canonical - The canonical skill name
   * @returns Array of all variations, or empty array if not found
   */
  public static getVariations(canonical: string): string[] {
    return this.SKILL_MAP.get(canonical.toLowerCase()) || [];
  }

  /**
   * Check if a skill has a canonical mapping
   * 
   * @param skill - The skill to check
   * @returns true if the skill has a canonical mapping
   */
  public static hasMapping(skill: string): boolean {
    const normalized = skill.toLowerCase().trim();
    for (const variations of this.SKILL_MAP.values()) {
      if (variations.includes(normalized)) {
        return true;
      }
    }
    return false;
  }
}
