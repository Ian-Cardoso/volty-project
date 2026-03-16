import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Volty API - E-commerce',
      version: '1.0.0',
      description: 'API REST para gerenciamento de e-commerce com autenticação JWT',
      termsOfService: 'http://swagger.io/terms/',
      contact: {
        name: 'Volty Support',
        url: 'https://github.com/ian/volty'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1
            },
            name: {
              type: 'string',
              example: 'João Silva'
            },
            email: {
              type: 'string',
              example: 'joao@email.com'
            },
            cep: {
              type: 'string',
              example: '01234-567'
            },
            street: {
              type: 'string',
              example: 'Rua Principal'
            },
            city: {
              type: 'string',
              example: 'São Paulo'
            },
            state: {
              type: 'string',
              example: 'SP'
            }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              example: 'joao@email.com'
            },
            password: {
              type: 'string',
              format: 'password',
              example: 'Senha123!'
            }
          }
        },
        LoginResponse: {
          type: 'object',
          properties: {
            accessToken: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
            },
            refreshToken: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
            },
            userId: {
              type: 'integer',
              example: 1
            }
          }
        },
        RegisterRequest: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name: {
              type: 'string',
              example: 'João Silva'
            },
            email: {
              type: 'string',
              example: 'joao@email.com'
            },
            password: {
              type: 'string',
              format: 'password',
              example: 'Senha123!'
            }
          }
        },
        Order: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1
            },
            user_id: {
              type: 'integer',
              example: 1
            },
            total: {
              type: 'number',
              example: 150.00
            },
            discount_amount: {
              type: 'number',
              example: 15.00
            },
            final_total: {
              type: 'number',
              example: 135.00
            },
            status: {
              type: 'string',
              enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
              example: 'confirmed'
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              example: 'Descrição do erro'
            }
          }
        }
      }
    },
    security: [
      {
        BearerAuth: []
      }
    ]
  },
  apis: ['./backend/server.js']
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
