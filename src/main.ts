import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';

import { AppModule } from './app.module';

const bootstrap = async () => {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Splitwave API')
    .setDescription('A RESTful API for managing payment requests, built with best practices.')
    .setVersion('1.0')
    .addTag('Payment', 'Payment-related operations')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  app.use(
    '/reference',
    apiReference({
      theme: 'dark',
      hideDownloadButton: true,
      content: document,
      metaData: {
        title: 'Splitwave API',
      },
      favicon: 'https://splitwave.com.br/favicon.ico',
      defaultOpenAllTags: true,
      customCss: [
        '.open-api-client-button { display: none !important; }',
        '.badges { display: none !important; }',
        '.security-scheme-label { font-weight: var(--scalar-semibold); font-size: var(--scalar-mini); color: var(--scalar-color-3); text-transform: uppercase; display: block; }',
        '.scalar-card-header-actions { display: none !important; }',
        '.models-list-item .schema-properties { margin-bottom: 0px !important; }',
        '.darklight-reference-promo { display: none !important; }',
        '.text-sidebar-c-2 { display: none !important; }',
      ].join(''),
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
};

bootstrap();
