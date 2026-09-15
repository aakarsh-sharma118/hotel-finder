/**
 * Ambient type declaration for swagger-ui-express.
 * Ensures TypeScript build compiles cleanly even in environments where devDependencies are pruned.
 */
declare module 'swagger-ui-express' {
  import { RequestHandler } from 'express';

  export interface SwaggerUiOptions {
    [key: string]: any;
  }

  export const serve: RequestHandler[];
  export const serveFiles: (swaggerDoc?: any, opts?: SwaggerUiOptions) => RequestHandler[];
  export const setup: (swaggerDoc?: any, opts?: SwaggerUiOptions) => RequestHandler;
  export const generateHTML: (swaggerDoc?: any, opts?: SwaggerUiOptions) => string;
  export const serveWithOptions: (options?: SwaggerUiOptions) => RequestHandler[];

  const swaggerUi: {
    serve: RequestHandler[];
    serveFiles: (swaggerDoc?: any, opts?: SwaggerUiOptions) => RequestHandler[];
    setup: (swaggerDoc?: any, opts?: SwaggerUiOptions) => RequestHandler;
    generateHTML: (swaggerDoc?: any, opts?: SwaggerUiOptions) => string;
    serveWithOptions: (options?: SwaggerUiOptions) => RequestHandler[];
  };

  export default swaggerUi;
}
