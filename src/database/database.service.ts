import { Injectable, OnApplicationShutdown, Logger } from '@nestjs/common';
import { Connection } from 'mongoose';
import { InjectConnection } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Config } from '../config/configuration';

@Injectable()
export class DatabaseService implements OnApplicationShutdown {
  private readonly logger = new Logger(DatabaseService.name);
  private connectionState = 0;

  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly configService: ConfigService,
  ) {
    this.handleConnectionEvents();
    this.logConnectionInfo();

    // Additional safety check for test environment
    if (process.env.NODE_ENV === 'test') {
      const currentDb = this.connection.db?.databaseName;
      if (!currentDb?.endsWith('-test')) {
        throw new Error(
          `Test environment must use a test database. Current database: ${currentDb}`,
        );
      }
    }
  }

  private handleConnectionEvents(): void {
    this.connection.on('connected', () => {
      this.connectionState = 1;
      this.logger.log('MongoDB connected successfully');
    });

    this.connection.on('error', (error: Error) => {
      this.logger.error('MongoDB connection error:', error);
    });

    this.connection.on('disconnected', () => {
      this.connectionState = 0;
      this.logger.warn('MongoDB disconnected');
    });
  }

  private logConnectionInfo(): void {
    const dbConfig = this.configService.get<Config['database']>('database');
    if (dbConfig) {
      this.logger.log(`Database Name: ${dbConfig.options.dbName}`);
      this.logger.log(`Max Pool Size: ${dbConfig.options.maxPoolSize}`);
    }
  }

  getConnection(): Connection {
    return this.connection;
  }

  async onApplicationShutdown() {
    if (this.connection) {
      await this.connection.close();
      this.logger.log('Database connection closed');
    }
  }

  // Method for test cleanup
  async cleanTestDb(): Promise<void> {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('cleanTestDb can only be called in test environment');
    }
    if (!process.env.DB_NAME?.includes('test')) {
      throw new Error('cleanTestDb can only be called on test databases');
    }

    const collections = (await this.connection.db?.collections()) || [];
    for (const collection of collections) {
      await collection.deleteMany({});
    }
    this.logger.log('Test database cleaned');
  }
}
