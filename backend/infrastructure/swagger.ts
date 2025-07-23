import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Application } from 'express';

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Sovrane API',
      version: '1.0.0',
      description: 'API documentation for the Sovrane application',
    },
    // Optionally add servers, security, etc.
    servers: [
      {
        url: 'http://localhost:3000/api', // Adjust the URL as needed
      },
    ],
  },
  // Paths to files containing OpenAPI annotations (e.g., JSDoc in controllers)
  apis: [
    './adapters/controllers/rest/*.ts', // Adjust path if needed
  ],
});

export interface SetupSwaggerOptions {
  app: Application;
}

export function setupSwagger(app: Application): void {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}
