import { Injectable, OnApplicationShutdown, Logger } from '@nestjs/common';
import { Connection } from 'mongoose';
import { InjectConnection } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Config } from '../config/configuration';

@Injectable()
export class DatabaseService implements OnApplicationShutdown {
  private readonly logger = new Logger(DatabaseService.name);
  private connectionState: number = 0;

  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly configService: ConfigService,
  ) {
    this.handleConnectionEvents();
    this.logConnectionInfo();
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

  isConnected(): boolean {
    return this.connectionState === 1;
  }

  getConnection(): Connection {
    return this.connection;
  }

  async onApplicationShutdown(): Promise<void> {
    this.logger.log('Closing database connection...');
    await this.connection.close();
    this.logger.log('Database connection closed');
  }
}
