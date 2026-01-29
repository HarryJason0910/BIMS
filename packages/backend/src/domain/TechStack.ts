/**
 * TechStack - Dynamic technology stack management
 * 
 * Manages available technology stacks that can be used in bids.
 * Stacks can be dynamically added by users.
 */

export class TechStack {
  private static stacks: Set<string> = new Set([
    // Frontend Frameworks & Libraries
    'React',
    'TypeScript',
    'JavaScript',
    'Next.js',
    'Redux',
    'Redux Toolkit',
    'Zustand',
    'Recoil',
    'Vue.js',
    'Pinia',
    'Vuex',
    'Nuxt.js',
    'Angular',
    'RxJS',
    'Svelte',
    'SvelteKit',
    'SolidJS',
    'Qwik',
    'Ember.js',
    'Backbone.js',
    'jQuery',
    
    // Mobile Development
    'React Native',
    'Expo',
    'Flutter',
    'Dart',
    'Swift',
    'SwiftUI',
    'Objective-C',
    'Kotlin',
    'Jetpack Compose',
    
    // Java Ecosystem
    'Java',
    'Spring',
    'Spring Boot',
    'Spring Security',
    'Spring Cloud',
    'Hibernate',
    'JPA',
    'MyBatis',
    'Micronaut',
    'Quarkus',
    'Dropwizard',
    
    // Node.js Ecosystem
    'Node.js',
    'NestJS',
    'Express.js',
    'Fastify',
    'Koa.js',
    'Hapi.js',
    
    // Python Ecosystem
    'Python',
    'FastAPI',
    'Django',
    'Django Rest Framework',
    'Flask',
    'Celery',
    'Gunicorn',
    'Uvicorn',
    
    // Go Ecosystem
    'Go',
    'Gin',
    'Fiber',
    'Echo',
    'Buffalo',
    
    // Rust Ecosystem
    'Rust',
    'Actix',
    'Rocket',
    'Axum',
    
    // .NET Ecosystem
    'C#',
    '.NET',
    '.NET Core',
    'ASP.NET Core',
    'Blazor',
    'F#',
    
    // PHP Ecosystem
    'PHP',
    'Laravel',
    'Symfony',
    'CodeIgniter',
    'Yii',
    
    // Ruby Ecosystem
    'Ruby',
    'Ruby on Rails',
    'Sinatra',
    
    // Other Languages & Frameworks
    'Elixir',
    'Phoenix',
    'Scala',
    'Play Framework',
    'Akka',
    'Kotlin Ktor',
    'Groovy',
    'Grails',
    
    // API Technologies
    'REST',
    'GraphQL',
    'Apollo GraphQL',
    'Relay',
    'gRPC',
    'Protobuf',
    'WebSockets',
    'Socket.IO',
    'tRPC',
    'OpenAPI',
    'Swagger',
    
    // SQL Databases
    'PostgreSQL',
    'MySQL',
    'MariaDB',
    'Oracle',
    'SQL Server',
    'CockroachDB',
    'Amazon Aurora',
    'SQLite',
    
    // NoSQL Databases
    'MongoDB',
    'DynamoDB',
    'Cassandra',
    'CouchDB',
    'Firebase Firestore',
    
    // Caching & Search
    'Redis',
    'Memcached',
    'Elasticsearch',
    'OpenSearch',
    'Solr',
    
    // Graph & Time-Series Databases
    'Neo4j',
    'JanusGraph',
    'InfluxDB',
    'TimescaleDB',
    'ClickHouse',
    
    // Data Warehouses
    'Snowflake',
    'BigQuery',
    'Redshift',
    
    // AWS Services
    'AWS',
    'EC2',
    'ECS',
    'EKS',
    'S3',
    'RDS',
    'Lambda',
    'API Gateway',
    'CloudFront',
    'DynamoDB Streams',
    
    // Azure Services
    'Azure',
    'Azure App Service',
    'Azure Functions',
    'Azure Kubernetes Service',
    'Cosmos DB',
    'Azure SQL',
    
    // GCP Services
    'GCP',
    'Compute Engine',
    'Cloud Run',
    'Cloud Functions',
    'GKE',
    'Firebase',
    'Supabase',
    
    // Container & Orchestration
    'Docker',
    'Docker Compose',
    'Kubernetes',
    'Helm',
    'Kustomize',
    
    // Infrastructure as Code
    'Terraform',
    'Pulumi',
    'CloudFormation',
    'Ansible',
    'Chef',
    'Puppet',
    
    // Message Queues & Streaming
    'Kafka',
    'Apache Pulsar',
    'RabbitMQ',
    'ActiveMQ',
    'AWS SQS',
    'AWS SNS',
    'AWS EventBridge',
    'Google Pub/Sub',
    'NATS',
    'ZeroMQ',
    
    // Authentication & Authorization
    'OAuth2',
    'OpenID Connect',
    'JWT',
    'Keycloak',
    'Auth0',
    'AWS Cognito',
    'Okta',
    'Firebase Auth',
    'LDAP',
    'SAML',
    
    // Monitoring & Observability
    'Prometheus',
    'Grafana',
    'ELK Stack',
    'OpenTelemetry',
    'Jaeger',
    'Zipkin',
    'Datadog',
    'New Relic',
    'Splunk',
    'Sentry',
    
    // Testing
    'JUnit',
    'TestNG',
    'Mockito',
    'Jest',
    'Vitest',
    'Mocha',
    'Chai',
    'Cypress',
    'Playwright',
    'Selenium',
    'PyTest',
    'Postman',
    'Insomnia',
    
    // Version Control & CI/CD
    'Git',
    'GitHub',
    'GitLab',
    'Bitbucket',
    'GitHub Actions',
    'GitLab CI',
    'Jenkins',
    'CircleCI',
    'Argo CD',
    'FluxCD',
    
    // Deployment Platforms
    'Vercel',
    'Netlify',
    'Heroku',
    'Fly.io',
    'Render',
    
    // Data Science & Scientific Computing
    'R',
    'Julia',
    'MATLAB',
    'NumPy',
    'SciPy',
    'Pandas',
    'Polars',
    'Dask',
    'Ray',
    'PyArrow',
    'Apache Arrow',
    'Jupyter',
    'JupyterLab',
    'Google Colab',
    'VS Code',
    
    // Machine Learning Frameworks
    'PyTorch',
    'TensorFlow',
    'Keras',
    'JAX',
    'MXNet',
    'FastAI',
    'ONNX',
    
    // AI & LLM Tools
    'Hugging Face Transformers',
    'Hugging Face Datasets',
    'Hugging Face Accelerate',
    'LangChain',
    'LlamaIndex',
    'Haystack',
    'OpenAI API',
    'Anthropic API',
    'Cohere API',
    'Mistral API',
    
    // Generative AI
    'Stable Diffusion',
    'Diffusers',
    'ControlNet',
    'LoRA',
    'QLoRA',
    
    // AI Agents
    'AutoGPT',
    'CrewAI',
    'AutoGen',
    'BabyAGI',
    
    // Workflow Orchestration
    'Airflow',
    'Prefect',
    'Dagster',
    'Luigi',
    
    // Big Data Processing
    'Apache Spark',
    'PySpark',
    'Spark SQL',
    
    // MLOps & Model Management
    'MLflow',
    'Kubeflow',
    'KServe',
    'Seldon',
    'BentoML',
    'Feast',
    'TFX',
    'Metaflow',
    'Weights & Biases',
    'ClearML',
    'Neptune.ai',
    
    // Data Quality & Monitoring
    'Great Expectations',
    'Deepchecks',
    'Evidently AI',
    'WhyLabs',
    
    // Stream Processing
    'Apache Flink',
    'Apache Beam',
    'Apache Storm',
    'Apache Kafka Streams',
    'ksqlDB',
    
    // Data Lake & Lakehouse
    'Delta Lake',
    'Apache Iceberg',
    'Apache Hudi',
    'Databricks',
    'Databricks MLflow',
    
    // Cloud ML Platforms
    'Snowflake',
    'BigQuery ML',
    'Redshift ML',
    'Amazon SageMaker',
    'SageMaker Pipelines',
    'SageMaker Feature Store',
    'Vertex AI',
    'Azure Machine Learning',
    
    // ML Inference & Optimization
    'OpenVINO',
    'TensorRT',
    'CUDA',
    'cuDNN',
    'ROCm',
    'NVIDIA Triton',
    'ONNX Runtime',
    'OpenMP',
    'MPI',
    
    // Data Versioning
    'DVC',
    'Pachyderm',
    'LakeFS',
    'Git LFS',
    
    // Business Intelligence
    'Apache Superset',
    'Metabase',
    'Power BI',
    'Tableau',
    'Looker',
    'Qlik',
    
    // Data Integration & ETL
    'DBT',
    'Airbyte',
    'Fivetran',
    'Stitch',
    'Kafka Connect',
    'Debezium',
    
    // Analytics Databases
    'SingleStore',
    'DuckDB',
    'Apache Druid',
    
    // Vector Databases
    'Faiss',
    'Milvus',
    'Weaviate',
    'Pinecone',
    'Qdrant',
    'Chroma',
    'Redis Vector',
    'OpenSearch Vector',
    'Elasticsearch Vector',
    
    // Smart Contract Languages
    'Solidity',
    'Vyper',
    
    // Blockchain Development Tools
    'Hardhat',
    'Foundry',
    'Truffle',
    'Brownie',
    
    // Web3 Libraries
    'Web3.js',
    'Ethers.js',
    'Wagmi',
    'RainbowKit',
    
    // Wallet Integration
    'MetaMask',
    'WalletConnect',
    
    // Blockchain Networks
    'Ethereum',
    'Polygon',
    'Arbitrum',
    'Optimism',
    'Solana',
    'Near',
    'Avalanche',
    'Cosmos',
    'Polkadot',
    'Substrate',
    
    // Enterprise Blockchain
    'Hyperledger Fabric',
    'Hyperledger Besu',
    'Hyperledger Sawtooth',
    
    // Web3 Infrastructure
    'Chainlink',
    'The Graph',
    'IPFS',
    'Filecoin',
    'Arweave',
    'Ceramic',
    'Lit Protocol',
    'ENS',
    
    // DeFi Protocols
    'Uniswap SDK',
    'Aave Protocol',
    'OpenZeppelin',
    
    // Layer 2 & Zero-Knowledge
    'zkSync',
    'StarkNet',
    'Cairo',
    'zkEVM',
    'Circom',
    'SnarkJS',
    
    // Blockchain Development & Testing
    'Foundry Anvil',
    'Tenderly',
    'Blockscout',
    'Etherscan API',
    
    // MEV & Infrastructure
    'Flashbots',
    'MEV-Boost',
    'Geth',
    'Nethermind'
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
