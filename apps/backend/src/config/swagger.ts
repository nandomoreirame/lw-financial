// Swagger configuration types are inferred from the object structure

/**
 * Configuração do Swagger para documentação da API
 */
export const swaggerOptions = {
  openapi: {
    openapi: '3.0.0',
    info: {
      title: 'LW Financial API',
      description: 'API para operações bancárias e autenticação',
      version: '1.0.0',
      contact: {
        name: 'LW Financial',
        email: 'support@lwfinancial.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:3001',
        description: 'Servidor de desenvolvimento',
      },
    ],
    tags: [
      {
        name: 'auth',
        description: 'Endpoints de autenticação',
      },
      {
        name: 'health',
        description: 'Endpoints de saúde do sistema',
      },
      {
        name: 'bank',
        description: 'Endpoints de operações bancárias',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http' as const,
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT obtido através do endpoint /login',
        },
      },
    },
  },
};

/**
 * Configuração da UI do Swagger
 */
export const swaggerUiOptions = {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'list' as const,
    deepLinking: true,
    displayRequestDuration: true,
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    tryItOutEnabled: true,
  },
  uiHooks: {
    onRequest: function (_request: unknown, _reply: unknown, next: () => void) {
      next();
    },
    preHandler: function (
      _request: unknown,
      _reply: unknown,
      next: () => void
    ) {
      next();
    },
  },
  staticCSP: true,
  transformStaticCSP: (header: string) => header,
  transformSpecification: (swaggerObject: Record<string, unknown>) => {
    return swaggerObject;
  },
  transformSpecificationClone: true,
};
