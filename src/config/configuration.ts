export interface MongooseOptions {
  dbName: string;
  maxPoolSize: number;
  serverSelectionTimeoutMS: number;
  socketTimeoutMS: number;
  retryWrites: boolean;
  heartbeatFrequencyMS: number;
}

export interface CorsConfig {
  origin: string[] | boolean;
  methods: string[];
  allowedHeaders: string[];
  credentials: boolean;
}

export interface Config {
  database: {
    uri: string;
    options: MongooseOptions;
  };
  cors: CorsConfig;
}

export default (): Config => ({
  database: {
    uri: process.env.MONGODB_URI || '',
    options: {
      dbName: process.env.DB_NAME || 'genesis-api',
      maxPoolSize: Number(process.env.MONGODB_POOL_SIZE) || 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      heartbeatFrequencyMS: 10000,
    },
  },
  cors: {
    origin:
      process.env.NODE_ENV === 'production'
        ? [
            process.env.FRONTEND_URL || 'http://localhost:3000',
            process.env.BACKEND_URL || 'http://localhost:5500',
          ]
        : true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  },
});
