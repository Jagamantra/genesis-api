import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { DatabaseService } from '../src/database/database.service';
import { AppModule } from './../src/app.module';
import { createTestAgent, TestAgent } from './types';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let agent: TestAgent;
  let dbService: DatabaseService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    agent = createTestAgent(app);
    dbService = moduleFixture.get<DatabaseService>(DatabaseService);
  });

  afterAll(async () => {
    if (process.env.NODE_ENV === 'test') {
      await dbService?.cleanTestDb();
    }
    await app.close();
  });

  it('/ (GET)', () => {
    return agent.get('/').expect(200).expect({
      message: 'Hello World!',
    });
  });
});
