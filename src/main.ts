/* eslint-disable prettier/prettier */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as session from 'express-session';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  app.use(
    session({
      secret: '8gfSM7kyUO4UVOIUc5Qj',
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: false,
        // maxAge: 60000
        maxAge: 86400000, // 1 hari
      },
    }),
  );

  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('API Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);

  document.tags = [
    {
      name: 'Dataset',
      description: 'API for Dataset',
    },
    {
      name: 'Freelance',
      description:
        'API for Freelance, including translation and non-translation features',
    },
    {
      name: 'Vendor',
      description: 'API for Vendor',
    },
  ];

  SwaggerModule.setup('api', app, document);

  app.enableCors({
    origin: 'http://localhost:5173',
  });

  const port: number = Number(process.env.PORT);
  await app.listen(port, '0.0.0.0');
}
bootstrap();
