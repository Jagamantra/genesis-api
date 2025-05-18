import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { CorsConfig } from './config/configuration';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);
    const configService = app.get(ConfigService);

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

    // Enable CORS using configuration
    const corsConfig = configService.get<CorsConfig>('cors');
    app.enableCors(corsConfig);

    // Swagger Setup
    const config = new DocumentBuilder()
      .setTitle('Genesis API')
      .setDescription('The Genesis API description')
      .setVersion('1.0')
      .addBearerAuth()
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
