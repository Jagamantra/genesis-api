import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule, MongooseModuleOptions } from '@nestjs/mongoose';
import { Config } from '../config/configuration';
import { DatabaseService } from './database.service';
import mongoose from 'mongoose';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService): MongooseModuleOptions => {
        const dbConfig = configService.get<Config['database']>('database');
        if (!dbConfig) {
          throw new Error('Database configuration not found');
        }

        // Set Mongoose global configuration
        mongoose.set('debug', process.env.NODE_ENV !== 'production');

        return {
          uri: dbConfig.uri,
          ...dbConfig.options,
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
