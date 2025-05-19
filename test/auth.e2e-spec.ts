import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Logger } from '@nestjs/common';
import { AppModule } from './../src/app.module';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '../src/auth/schemas/user.schema';
import { Connection } from 'mongoose';
import { DatabaseService } from '../src/database/database.service';
import * as bcrypt from 'bcrypt';
import { TestAgent, createTestAgent } from './types';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let dbService: DatabaseService;
  let dbConnection: Connection;
  let agent: TestAgent;
  const logger = new Logger('AuthE2ETest');

  const testUser = {
    email: 'test@example.com',
    password: 'password123',
    role: UserRole.USER,
    isVerified: true,
  };

  const testAdmin = {
    email: 'admin@example.com',
    password: 'admin123',
    role: UserRole.ADMIN,
    isVerified: true,
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    agent = createTestAgent(app);
    jwtService = moduleFixture.get<JwtService>(JwtService);
    dbService = moduleFixture.get<DatabaseService>(DatabaseService);
    dbConnection = dbService.getConnection();

    // Verify we're using the test database
    const dbName = process.env.DB_NAME;
    if (!dbName?.includes('test')) {
      throw new Error(
        `Wrong database used in tests: ${dbName}. Must use a test database.`,
      );
    }
    logger.log(`Using test database: ${dbName}`);

    // Clean database before tests
    await dbService.cleanTestDb();

    // Create test users
    const hashedPassword = await bcrypt.hash(testUser.password, 10);
    const hashedAdminPassword = await bcrypt.hash(testAdmin.password, 10);

    await dbConnection.collection('users').insertMany([
      { ...testUser, password: hashedPassword },
      { ...testAdmin, password: hashedAdminPassword },
    ]);
  });

  beforeEach(async () => {
    // Clean database except users collection
    const db = dbConnection?.db;
    if (!db) {
      throw new Error('Database connection not initialized');
    }

    const collections = await db.collections();
    for (const collection of collections) {
      if (collection.collectionName !== 'users') {
        await collection.deleteMany({});
      }
    }
  });

  afterAll(async () => {
    await dbService.cleanTestDb();
    await app.close();
  });

  describe('Public Routes', () => {
    it('should allow access to register endpoint', () => {
      return agent
        .post('/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'newpass123',
        })
        .expect(201);
    });

    it('should allow access to login endpoint', () => {
      return agent
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);
    });
  });

  describe('Protected Routes with Different Roles', () => {
    let userToken: string;
    let adminToken: string;

    beforeEach(() => {
      userToken = jwtService.sign({
        sub: 'user-id',
        email: testUser.email,
        role: UserRole.USER,
      });

      adminToken = jwtService.sign({
        sub: 'admin-id',
        email: testAdmin.email,
        role: UserRole.ADMIN,
      });
    });

    describe('Posts Routes', () => {
      it('should allow users to read posts', () => {
        return agent
          .get('/posts')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200);
      });

      it('should deny users from creating posts', () => {
        return agent
          .post('/posts')
          .set('Authorization', `Bearer ${userToken}`)
          .send({ title: 'Test Post', content: 'Test Content' })
          .expect(403);
      });

      it('should allow admins to create posts', () => {
        return agent
          .post('/posts')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ title: 'Test Post', content: 'Test Content' })
          .expect(201);
      });
    });

    describe('Customers Routes', () => {
      it('should allow users to read customers', () => {
        return agent
          .get('/customers')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200);
      });

      it('should deny users from creating customers', () => {
        return agent
          .post('/customers')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            customerName: 'Test Customer',
            contactName: 'John Contact',
            advisorName: 'Jane Advisor',
          })
          .expect(403);
      });

      it('should allow admins to create customers', () => {
        return agent
          .post('/customers')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            customerName: 'Test Customer',
            contactName: 'John Contact',
            advisorName: 'Jane Advisor',
            notes: 'Test customer notes',
          })
          .expect(201);
      });
    });
  });

  describe('JWT Token Validation', () => {
    it('should reject requests with no token', () => {
      return agent.get('/posts').expect(401);
    });

    it('should reject requests with invalid token format', () => {
      return agent
        .get('/posts')
        .set('Authorization', 'Invalid-Token-Format')
        .expect(401);
    });

    it('should reject requests with malformed JWT', () => {
      return agent
        .get('/posts')
        .set('Authorization', 'Bearer invalid.jwt.token')
        .expect(401);
    });

    it('should reject requests with expired token', () => {
      const expiredToken = jwtService.sign(
        {
          sub: 'user-id',
          email: testUser.email,
          role: UserRole.USER,
        },
        { expiresIn: '0s' },
      );

      return agent
        .get('/posts')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
    });

    it('should accept requests with valid token', () => {
      const validToken = jwtService.sign({
        sub: 'user-id',
        email: testUser.email,
        role: UserRole.USER,
      });

      return agent
        .get('/posts')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);
    });
  });
});
