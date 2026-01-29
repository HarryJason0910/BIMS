/**
 * Main entry point for the Job Bid and Interview Management System backend
 */

import dotenv from 'dotenv';
import { Container } from './infrastructure/container';
import { Server } from './infrastructure/server';

// Load environment variables
dotenv.config();

console.log('Job Bid and Interview Management System - Backend');
console.log('Initializing application...');

async function main() {
  // Initialize dependency injection container
  const container = Container.getInstance();

  // Determine repository type from environment
  const useInMemory = process.env.USE_MONGODB !== 'true';

  // Initialize container with configuration
  await container.initialize({
    useInMemory,
    mongoUri: process.env.MONGODB_URI,
    mongoDbName: process.env.MONGODB_DB_NAME,
  });

  // Initialize server with container
  const port = parseInt(process.env.PORT || '3000', 10);
  const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';

  const server = new Server({ port, corsOrigin }, container);

  // Start server
  console.log('Starting server...');
  server.start();

  // Handle graceful shutdown
  const shutdown = async () => {
    console.log('\nShutting down gracefully...');
    await container.shutdown();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  return { server, container };
}

// Start the application
main().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
