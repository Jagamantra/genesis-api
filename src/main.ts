import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);

    // Enable validation
    // Enable cookie parser middleware
    app.use(cookieParser());

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true, // strip properties that don't have decorators
        transform: true, // transform payloads to be objects typed according to their DTO classes
        forbidNonWhitelisted: true, // throw errors if properties without decorators are present
      }),
    );

    // Enable global exception filter
    app.useGlobalFilters(new AllExceptionsFilter());

    // Enable CORS with specific settings for Swagger UI
    // Enable CORS with secure cookie settings
    // const corsOrigin =
    //   process.env.NODE_ENV === 'production'
    //     ? process.env.CORS_ORIGIN || 'https://your-frontend-domain.com'
    //   : true; // Allow all origins in development

    app.enableCors({
      origin: process.env.FRONTEND_URL,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
      credentials: true, // Required for cookies
    });

    // Swagger Setup
    const config = new DocumentBuilder()
      .setTitle('Genesis API')
      .setDescription(
        `
        A modern RESTful API built with NestJS.
        
        ## Authentication
        The API uses JWT Bearer token authentication. To access protected endpoints:
        1. Register a new account (/auth/register)
        2. Login with your credentials (/auth/login)
        3. Verify the MFA code sent to your email (/auth/verify-mfa)
        4. In the response, copy your access token
        5. Click the "Authorize" button at the top and enter your token
           - Enter ONLY the token value, do not include "Bearer"
        
        ## Role-Based Access
        The API supports two roles:
        - User: Can read posts and customers
        - Admin: Can create and manage all resources
      `,
      )
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'apiKey',
          in: 'cookie',
          name: 'access_token',
        },
        'JWT-auth',
      )
      .addTag(
        'Authentication',
        'User registration and authentication endpoints',
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });

    const port = process.env.PORT ?? 3000;
    await app.listen(port);
    console.log(`Application is running on: http://localhost:${port}`);
    console.log(
      `Swagger documentation available at: http://localhost:${port}/api`,
    );
  } catch (error) {
    console.error('Error starting application:', error);
    process.exit(1);
  }
}

void bootstrap();
