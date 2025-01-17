// src/hosted-api.ts

import { OpenAPIObject } from 'openapi3-ts/oas31';

export const openApiSpec: OpenAPIObject = {
  openapi: '3.1.0',
  info: {
    title: 'FXN-Cloud-Agent API',
    description: 'AI Character Generation API',
    version: '0.1.0',
    contact: { name: 'Cipher009', email: 'support@example.com' }
  },
  servers: [{ url: 'http://localhost:8787', description: 'Local development server' }],
  paths: {
    '/': {
      get: {
        summary: 'Root endpoint',
        operationId: 'getRootInfo',
        responses: {
          200: {
            description: 'API Information',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { message: { type: 'string' }, author: { type: 'string' }, version: { type: 'string' } }
                }
              }
            }
          }
        }
      }
    },
    '/health': {
      get: {
        summary: 'Health check endpoint',
        operationId: 'getHealthCheck',
        responses: {
          200: {
            description: 'Server health status',
            content: {
              'application/json': {
                schema: { type: 'object', properties: { status: { type: 'string' }, timestamp: { type: 'string' } } }
              }
            }
          }
        }
      }
    }
  }
};
