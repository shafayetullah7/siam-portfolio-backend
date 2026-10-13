import type { INestApplication } from '@nestjs/common';
import {
  DocumentBuilder,
  SwaggerModule,
  type SwaggerDocumentOptions,
} from '@nestjs/swagger';
import { createSchema } from 'zod-openapi';
import type { ZodType } from 'zod';

function isZodSchema(schema: unknown): schema is ZodType {
  return (
    !!schema &&
    typeof schema === 'object' &&
    (schema as { '~standard'?: { vendor?: string } })['~standard']?.vendor ===
      'zod'
  );
}

const swaggerDocumentOptions: SwaggerDocumentOptions = {
  standardSchemaConverter: (schema, { schemaType }) => {
    if (isZodSchema(schema)) {
      const { schema: converted, components } = createSchema(schema, {
        io: schemaType,
        openapiVersion: '3.0.0',
      });
      return { schema: converted, components };
    }
    return undefined;
  },
};

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('SIAM API')
    .setDescription('SIAM backend API')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(
    app,
    config,
    swaggerDocumentOptions,
  );
  SwaggerModule.setup('api', app, document);
}
