import 'reflect-metadata';
import { Logger, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const logger = new Logger('Bootstrap');

  const prefix = process.env.API_GLOBAL_PREFIX ?? 'api';
  const version = process.env.API_VERSION ?? '1';
  const port = Number(process.env.API_PORT ?? 4000);

  app.setGlobalPrefix(prefix);
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: version });

  app.use(helmet());
  app.enableCors({
    origin: (process.env.CORS_ORIGINS ?? '').split(',').filter(Boolean),
    credentials: true,
  });
  app.enableShutdownHooks();

  // Swagger only outside production.
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('SP Builders API')
      .setDescription('Enterprise real estate platform — REST v1')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const doc = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, doc);
  }

  await app.listen(port);
  logger.log(`API ready → http://localhost:${port}/${prefix}/v${version}`);
  logger.log(`Swagger  → http://localhost:${port}/docs`);
}

void bootstrap();
