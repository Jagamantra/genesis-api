import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);

    // Enable validation
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
    app.enableCors({
      origin: true, // Allow all origins in development
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
      exposedHeaders: ['Authorization'],
      credentials: true,
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
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'Authorization',
          in: 'header',
        },
        'JWT-auth',
      )
      .addTag(
        'Authentication',
        'User registration and authentication endpoints',
      )
      .addTag('Posts', 'Blog post management endpoints')
      .addTag('Customers', 'Customer management endpoints')
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
