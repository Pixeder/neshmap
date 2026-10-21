// src/scripts/generate-types.ts

import fs from 'fs';
import path from 'path';
import { compile } from 'json-schema-to-typescript';
import { swaggerSpec } from '../config/swagger.config.js';

async function generateTypes() {
  try {
    // 1. Save swagger.json for OpenAPI consumers
    const swaggerPath = path.resolve(process.cwd(), 'swagger.json');
    fs.writeFileSync(swaggerPath, JSON.stringify(swaggerSpec, null, 2));
    console.log('✔ swagger.json generated successfully.');

    // 2. Wrap schemas keeping OpenAPI components structure intact for $ref resolution
    const fullSchema = {
      title: 'ApiSchemas',
      type: 'object',
      components: (swaggerSpec as any).components || { schemas: {} },
      properties: (swaggerSpec as any).components?.schemas || {}
    };

    // 3. Compile types using valid json-schema-to-typescript Options
    const ts = await compile(fullSchema as any, 'ApiSchemas', {
      bannerComment:
        '/* tslint:disable */\n/**\n * Auto-generated OpenAPI TypeScript Definitions\n */',
      unreachableDefinitions: true
    });

    const outputPath = path.resolve(process.cwd(), 'frontend-api-types.ts');
    fs.writeFileSync(outputPath, ts);
    console.log('✔ frontend-api-types.ts generated successfully!');
  } catch (error) {
    console.error('Error generating types:', error);
    process.exit(1);
  }
}

generateTypes();