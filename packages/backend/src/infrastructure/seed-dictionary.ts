/**
 * Seed Dictionary Script
 * 
 * Initializes the skill dictionary with 300-500 canonical skills across all 6 layers.
 * Includes common skill variations for better matching.
 * 
 * Part of: enhanced-skill-matching feature
 * Requirements: 2.1
 * 
 * Usage: npm run seed-dictionary
 */

import { SkillDictionary } from '../domain/SkillDictionary';
import { MongoDBSkillDictionaryRepository } from './MongoDBSkillDictionaryRepository';
import { MongoDBConnection } from './MongoDBConnection';
import { TechLayer } from '../domain/JDSpecTypes';

interface SkillDefinition {
  name: string;
  category: TechLayer;
  variations?: string[];
}

// Comprehensive skill definitions across all 6 layers
const SEED_SKILLS: SkillDefinition[] = [
  // ===== FRONTEND LAYER =====
  // JavaScript Frameworks & Libraries
  { name: 'react', category: 'frontend', variations: ['reactjs', 'react.js'] },
  { name: 'vue', category: 'frontend', variations: ['vuejs', 'vue.js'] },
  { name: 'angular', category: 'frontend', variations: ['angularjs'] },
  { name: 'svelte', category: 'frontend', variations: ['sveltejs'] },
  { name: 'next.js', category: 'frontend', variations: ['nextjs'] },
  { name: 'nuxt.js', category: 'frontend', variations: ['nuxtjs'] },
  { name: 'gatsby', category: 'frontend', variations: ['gatsbyjs'] },
  { name: 'remix', category: 'frontend' },
  { name: 'solid', category: 'frontend', variations: ['solidjs'] },
  { name: 'qwik', category: 'frontend' },
  
  // State Management
  { name: 'redux', category: 'frontend', variations: ['redux-toolkit', 'rtk'] },
  { name: 'mobx', category: 'frontend' },
  { name: 'zustand', category: 'frontend' },
  { name: 'recoil', category: 'frontend' },
  { name: 'jotai', category: 'frontend' },
  { name: 'pinia', category: 'frontend' },
  { name: 'vuex', category: 'frontend' },
  { name: 'xstate', category: 'frontend' },
  
  // Core Languages
  { name: 'javascript', category: 'frontend', variations: ['js', 'ecmascript', 'es6', 'es2015'] },
  { name: 'typescript', category: 'frontend', variations: ['ts'] },
  { name: 'html', category: 'frontend', variations: ['html5'] },
  { name: 'css', category: 'frontend', variations: ['css3'] },
  
  // CSS Frameworks & Tools
  { name: 'tailwind', category: 'frontend', variations: ['tailwindcss'] },
  { name: 'bootstrap', category: 'frontend' },
  { name: 'material-ui', category: 'frontend', variations: ['mui', 'material ui'] },
  { name: 'chakra-ui', category: 'frontend', variations: ['chakra'] },
  { name: 'ant-design', category: 'frontend', variations: ['antd'] },
  { name: 'sass', category: 'frontend', variations: ['scss'] },
  { name: 'less', category: 'frontend' },
  { name: 'styled-components', category: 'frontend' },
  { name: 'emotion', category: 'frontend' },
  
  // Build Tools & Bundlers
  { name: 'webpack', category: 'frontend' },
  { name: 'vite', category: 'frontend' },
  { name: 'rollup', category: 'frontend' },
  { name: 'parcel', category: 'frontend' },
  { name: 'esbuild', category: 'frontend' },
  { name: 'turbopack', category: 'frontend' },
  
  // Testing
  { name: 'jest', category: 'frontend' },
  { name: 'vitest', category: 'frontend' },
  { name: 'cypress', category: 'frontend' },
  { name: 'playwright', category: 'frontend' },
  { name: 'testing-library', category: 'frontend', variations: ['react-testing-library', 'rtl'] },
  { name: 'enzyme', category: 'frontend' },
  
  // Mobile
  { name: 'react-native', category: 'frontend', variations: ['rn'] },
  { name: 'expo', category: 'frontend' },
  { name: 'flutter', category: 'frontend' },
  { name: 'ionic', category: 'frontend' },
  { name: 'cordova', category: 'frontend' },
  { name: 'capacitor', category: 'frontend' },
  
  // Graphics & Visualization
  { name: 'd3', category: 'frontend', variations: ['d3.js'] },
  { name: 'three.js', category: 'frontend', variations: ['threejs'] },
  { name: 'chart.js', category: 'frontend', variations: ['chartjs'] },
  { name: 'recharts', category: 'frontend' },
  { name: 'plotly', category: 'frontend' },
  
  // ===== BACKEND LAYER =====
  // Node.js Ecosystem
  { name: 'node.js', category: 'backend', variations: ['nodejs', 'node'] },
  { name: 'express', category: 'backend', variations: ['express.js', 'expressjs'] },
  { name: 'nestjs', category: 'backend', variations: ['nest.js', 'nest'] },
  { name: 'fastify', category: 'backend' },
  { name: 'koa', category: 'backend', variations: ['koa.js', 'koajs'] },
  { name: 'hapi', category: 'backend', variations: ['hapi.js'] },
  
  // Python Ecosystem
  { name: 'python', category: 'backend' },
  { name: 'django', category: 'backend' },
  { name: 'flask', category: 'backend' },
  { name: 'fastapi', category: 'backend' },
  { name: 'celery', category: 'backend' },
  { name: 'sqlalchemy', category: 'backend' },
  
  // Java Ecosystem
  { name: 'java', category: 'backend' },
  { name: 'spring', category: 'backend', variations: ['spring-framework'] },
  { name: 'spring-boot', category: 'backend', variations: ['springboot'] },
  { name: 'hibernate', category: 'backend' },
  { name: 'micronaut', category: 'backend' },
  { name: 'quarkus', category: 'backend' },
  
  // .NET Ecosystem
  { name: 'c#', category: 'backend', variations: ['csharp', 'c-sharp'] },
  { name: '.net', category: 'backend', variations: ['dotnet', '.net-core', 'asp.net'] },
  
  // Go Ecosystem
  { name: 'go', category: 'backend', variations: ['golang'] },
  { name: 'gin', category: 'backend' },
  { name: 'echo', category: 'backend' },
  { name: 'fiber', category: 'backend' },
  
  // Rust Ecosystem
  { name: 'rust', category: 'backend' },
  { name: 'actix', category: 'backend', variations: ['actix-web'] },
  { name: 'rocket', category: 'backend' },
  { name: 'axum', category: 'backend' },
  
  // PHP Ecosystem
  { name: 'php', category: 'backend' },
  { name: 'laravel', category: 'backend' },
  { name: 'symfony', category: 'backend' },
  { name: 'codeigniter', category: 'backend' },
  
  // Ruby Ecosystem
  { name: 'ruby', category: 'backend' },
  { name: 'rails', category: 'backend', variations: ['ruby-on-rails', 'ror'] },
  { name: 'sinatra', category: 'backend' },
  
  // Other Languages
  { name: 'scala', category: 'backend' },
  { name: 'kotlin', category: 'backend' },
  { name: 'elixir', category: 'backend' },
  { name: 'phoenix', category: 'backend' },
  
  // API Technologies
  { name: 'rest', category: 'backend', variations: ['restful', 'rest-api'] },
  { name: 'graphql', category: 'backend' },
  { name: 'grpc', category: 'backend' },
  { name: 'websocket', category: 'backend', variations: ['websockets'] },
  { name: 'socket.io', category: 'backend', variations: ['socketio'] },
  
  // Message Queues
  { name: 'rabbitmq', category: 'backend' },
  { name: 'kafka', category: 'backend', variations: ['apache-kafka'] },
  { name: 'redis-streams', category: 'backend' },
  { name: 'nats', category: 'backend' },
  
  // ===== DATABASE LAYER =====
  // SQL Databases
  { name: 'postgresql', category: 'database', variations: ['postgres', 'psql'] },
  { name: 'mysql', category: 'database' },
  { name: 'mariadb', category: 'database' },
  { name: 'sqlite', category: 'database' },
  { name: 'oracle', category: 'database', variations: ['oracle-db'] },
  { name: 'sql-server', category: 'database', variations: ['mssql', 'microsoft-sql-server'] },
  
  // NoSQL Databases
  { name: 'mongodb', category: 'database', variations: ['mongo'] },
  { name: 'dynamodb', category: 'database', variations: ['aws-dynamodb'] },
  { name: 'cassandra', category: 'database', variations: ['apache-cassandra'] },
  { name: 'couchdb', category: 'database' },
  { name: 'firebase', category: 'database', variations: ['firestore'] },
  
  // Caching & In-Memory
  { name: 'redis', category: 'database' },
  { name: 'memcached', category: 'database' },
  { name: 'hazelcast', category: 'database' },
  
  // Search Engines
  { name: 'elasticsearch', category: 'database', variations: ['elastic'] },
  { name: 'opensearch', category: 'database' },
  { name: 'solr', category: 'database', variations: ['apache-solr'] },
  { name: 'algolia', category: 'database' },
  
  // Graph Databases
  { name: 'neo4j', category: 'database' },
  { name: 'janusgraph', category: 'database' },
  { name: 'arangodb', category: 'database' },
  
  // Time-Series Databases
  { name: 'influxdb', category: 'database' },
  { name: 'timescaledb', category: 'database' },
  { name: 'prometheus', category: 'database' },
  
  // Data Warehouses
  { name: 'snowflake', category: 'database' },
  { name: 'bigquery', category: 'database', variations: ['google-bigquery'] },
  { name: 'redshift', category: 'database', variations: ['aws-redshift'] },
  { name: 'databricks', category: 'database' },
  
  // Vector Databases
  { name: 'pinecone', category: 'database' },
  { name: 'weaviate', category: 'database' },
  { name: 'milvus', category: 'database' },
  { name: 'qdrant', category: 'database' },
  { name: 'chroma', category: 'database', variations: ['chromadb'] },
  
  // ===== CLOUD LAYER =====
  // AWS Services
  { name: 'aws', category: 'cloud', variations: ['amazon-web-services'] },
  { name: 'ec2', category: 'cloud', variations: ['aws-ec2'] },
  { name: 's3', category: 'cloud', variations: ['aws-s3'] },
  { name: 'lambda', category: 'cloud', variations: ['aws-lambda'] },
  { name: 'rds', category: 'cloud', variations: ['aws-rds'] },
  { name: 'ecs', category: 'cloud', variations: ['aws-ecs'] },
  { name: 'eks', category: 'cloud', variations: ['aws-eks'] },
  { name: 'cloudfront', category: 'cloud', variations: ['aws-cloudfront'] },
  { name: 'api-gateway', category: 'cloud', variations: ['aws-api-gateway'] },
  { name: 'sqs', category: 'cloud', variations: ['aws-sqs'] },
  { name: 'sns', category: 'cloud', variations: ['aws-sns'] },
  { name: 'cloudformation', category: 'cloud', variations: ['aws-cloudformation'] },
  
  // Azure Services
  { name: 'azure', category: 'cloud', variations: ['microsoft-azure'] },
  { name: 'azure-functions', category: 'cloud' },
  { name: 'azure-app-service', category: 'cloud' },
  { name: 'azure-kubernetes', category: 'cloud', variations: ['aks'] },
  { name: 'cosmos-db', category: 'cloud', variations: ['azure-cosmos-db'] },
  
  // GCP Services
  { name: 'gcp', category: 'cloud', variations: ['google-cloud-platform', 'google-cloud'] },
  { name: 'compute-engine', category: 'cloud', variations: ['gce'] },
  { name: 'cloud-run', category: 'cloud', variations: ['gcp-cloud-run'] },
  { name: 'cloud-functions', category: 'cloud', variations: ['gcp-cloud-functions'] },
  { name: 'gke', category: 'cloud', variations: ['google-kubernetes-engine'] },
  
  // Serverless Platforms
  { name: 'vercel', category: 'cloud' },
  { name: 'netlify', category: 'cloud' },
  { name: 'heroku', category: 'cloud' },
  { name: 'railway', category: 'cloud' },
  { name: 'render', category: 'cloud' },
  { name: 'fly.io', category: 'cloud', variations: ['fly'] },
  
  // ===== DEVOPS LAYER =====
  // Containers & Orchestration
  { name: 'docker', category: 'devops' },
  { name: 'kubernetes', category: 'devops', variations: ['k8s'] },
  { name: 'helm', category: 'devops' },
  { name: 'kustomize', category: 'devops' },
  { name: 'docker-compose', category: 'devops' },
  
  // Infrastructure as Code
  { name: 'terraform', category: 'devops' },
  { name: 'pulumi', category: 'devops' },
  { name: 'ansible', category: 'devops' },
  { name: 'chef', category: 'devops' },
  { name: 'puppet', category: 'devops' },
  
  // CI/CD
  { name: 'github-actions', category: 'devops', variations: ['gh-actions'] },
  { name: 'gitlab-ci', category: 'devops', variations: ['gitlab-cicd'] },
  { name: 'jenkins', category: 'devops' },
  { name: 'circleci', category: 'devops', variations: ['circle-ci'] },
  { name: 'travis-ci', category: 'devops', variations: ['travis'] },
  { name: 'argo-cd', category: 'devops', variations: ['argocd'] },
  { name: 'flux', category: 'devops', variations: ['fluxcd'] },
  
  // Monitoring & Observability
  { name: 'grafana', category: 'devops' },
  { name: 'datadog', category: 'devops' },
  { name: 'new-relic', category: 'devops', variations: ['newrelic'] },
  { name: 'splunk', category: 'devops' },
  { name: 'elk-stack', category: 'devops', variations: ['elasticsearch-logstash-kibana'] },
  { name: 'jaeger', category: 'devops' },
  { name: 'zipkin', category: 'devops' },
  { name: 'sentry', category: 'devops' },
  
  // Version Control
  { name: 'git', category: 'devops' },
  { name: 'github', category: 'devops' },
  { name: 'gitlab', category: 'devops' },
  { name: 'bitbucket', category: 'devops' },
  
  // ===== OTHERS LAYER =====
  // Machine Learning & AI
  { name: 'pytorch', category: 'others' },
  { name: 'tensorflow', category: 'others' },
  { name: 'scikit-learn', category: 'others', variations: ['sklearn'] },
  { name: 'keras', category: 'others' },
  { name: 'huggingface', category: 'others', variations: ['transformers'] },
  { name: 'langchain', category: 'others' },
  { name: 'openai', category: 'others', variations: ['openai-api'] },
  
  // Data Science
  { name: 'pandas', category: 'others' },
  { name: 'numpy', category: 'others' },
  { name: 'jupyter', category: 'others', variations: ['jupyter-notebook'] },
  { name: 'matplotlib', category: 'others' },
  { name: 'seaborn', category: 'others' },
  
  // Big Data
  { name: 'spark', category: 'others', variations: ['apache-spark', 'pyspark'] },
  { name: 'hadoop', category: 'others', variations: ['apache-hadoop'] },
  { name: 'airflow', category: 'others', variations: ['apache-airflow'] },
  { name: 'kafka-streams', category: 'others' },
  
  // Authentication & Security
  { name: 'oauth', category: 'others', variations: ['oauth2'] },
  { name: 'jwt', category: 'others', variations: ['json-web-token'] },
  { name: 'auth0', category: 'others' },
  { name: 'keycloak', category: 'others' },
  { name: 'okta', category: 'others' },
  
  // Testing & Quality
  { name: 'selenium', category: 'others' },
  { name: 'postman', category: 'others' },
  { name: 'insomnia', category: 'others' },
  { name: 'sonarqube', category: 'others', variations: ['sonar'] },
  
  // Project Management & Collaboration
  { name: 'jira', category: 'others' },
  { name: 'confluence', category: 'others' },
  { name: 'slack', category: 'others' },
  { name: 'notion', category: 'others' },
  
  // Blockchain & Web3
  { name: 'solidity', category: 'others' },
  { name: 'ethereum', category: 'others' },
  { name: 'web3', category: 'others', variations: ['web3.js'] },
  { name: 'hardhat', category: 'others' },
];

async function seedDictionary(): Promise<void> {
  console.log('🌱 Starting dictionary seeding process...\n');

  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017';
    const mongoDbName = process.env.MONGO_DB_NAME || 'job-bid-system';
    
    console.log(`📡 Connecting to MongoDB at ${mongoUri}...`);
    const mongoConnection = MongoDBConnection.getInstance();
    await mongoConnection.connect(mongoUri, mongoDbName);
    console.log('✅ Connected to MongoDB\n');

    // Create repository
    const repository = new MongoDBSkillDictionaryRepository();

    // Check if dictionary already exists
    const existingDictionary = await repository.getCurrent();
    if (existingDictionary) {
      console.log(`⚠️  Dictionary already exists (version: ${existingDictionary.getVersion()})`);
      console.log('   To re-seed, please delete the existing dictionary first.\n');
      await mongoConnection.disconnect();
      return;
    }

    // Create new dictionary
    console.log('📚 Creating new skill dictionary (version 2024.1)...');
    const dictionary = SkillDictionary.create('2024.1');

    // Add all skills
    console.log(`\n📝 Adding ${SEED_SKILLS.length} canonical skills...\n`);
    
    let addedCount = 0;
    let variationCount = 0;
    
    for (const skillDef of SEED_SKILLS) {
      // Add canonical skill
      dictionary.addCanonicalSkill(skillDef.name, skillDef.category);
      addedCount++;
      
      // Add variations if any
      if (skillDef.variations) {
        for (const variation of skillDef.variations) {
          dictionary.addSkillVariation(variation, skillDef.name);
          variationCount++;
        }
      }
      
      // Progress indicator
      if (addedCount % 50 === 0) {
        console.log(`   ✓ Added ${addedCount} skills...`);
      }
    }

    console.log(`\n✅ Successfully added ${addedCount} canonical skills`);
    console.log(`✅ Successfully added ${variationCount} skill variations\n`);

    // Save to database
    console.log('💾 Saving dictionary to database...');
    await repository.save(dictionary);
    console.log('✅ Dictionary saved successfully!\n');

    // Display summary by category
    console.log('📊 Skills by category:');
    const categories: TechLayer[] = ['frontend', 'backend', 'database', 'cloud', 'devops', 'others'];
    for (const category of categories) {
      const categorySkills = dictionary.getSkillsByCategory(category);
      console.log(`   ${category.padEnd(10)}: ${categorySkills.length} skills`);
    }

    console.log('\n🎉 Dictionary seeding completed successfully!');
    console.log(`   Version: ${dictionary.getVersion()}`);
    console.log(`   Total skills: ${dictionary.getAllSkills().length}`);
    console.log(`   Total variations: ${variationCount}\n`);

    // Disconnect
    await mongoConnection.disconnect();
    console.log('👋 Disconnected from MongoDB');

  } catch (error) {
    console.error('\n❌ Error seeding dictionary:', error);
    process.exit(1);
  }
}

// Run the seed script
if (require.main === module) {
  seedDictionary()
    .then(() => {
      console.log('\n✨ Seed script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Seed script failed:', error);
      process.exit(1);
    });
}

export { seedDictionary, SEED_SKILLS };
