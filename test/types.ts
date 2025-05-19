import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { Server } from 'http';

declare module '@nestjs/common' {
  interface INestApplication {
    getHttpServer(): Server;
  }
}

/**
 * Type for the SuperTest agent used in tests
 * We use an explicit cast to suppress the type mismatch between SuperTest and NestJS
 */
export type TestAgent = ReturnType<typeof request>;

/**
 * Creates a SuperTest agent for testing HTTP endpoints
 * @param app The NestJS application instance
 */
export function createTestAgent(app: INestApplication): TestAgent {
  const server = app.getHttpServer();
  return request(server);
}
