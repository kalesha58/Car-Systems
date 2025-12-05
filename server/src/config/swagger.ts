import swaggerJsdoc from 'swagger-jsdoc';
import { SwaggerDefinition } from 'swagger-jsdoc';

const swaggerDefinition: SwaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Car Connect API',
    version: '1.0.0',
    description: 'Backend API documentation for Car Connect application',
    contact: {
      name: 'API Support',
      email: 'support@carconnect.com',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: process.env.API_URL || 'http://localhost:5000',
      description: 'Development server',
    },
    {
      url: 'https://api.carconnect.com',
      description: 'Production server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT token',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false,
          },
          message: {
            type: 'string',
            example: 'Error message',
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: '507f1f77bcf86cd799439011',
          },
          name: {
            type: 'string',
            example: 'John Doe',
          },
          email: {
            type: 'string',
            example: 'john@example.com',
          },
          phone: {
            type: 'string',
            example: '1234567890',
          },
          role: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['user', 'admin', 'dealer'],
            },
            example: ['user'],
          },
        },
      },
      SignupRequest: {
        type: 'object',
        required: ['email', 'phone', 'password'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            example: 'user@example.com',
          },
          phone: {
            type: 'string',
            pattern: '^[0-9]{10}$',
            example: '1234567890',
          },
          password: {
            type: 'string',
            minLength: 8,
            example: 'SecurePassword123',
          },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            example: 'user@example.com',
          },
          password: {
            type: 'string',
            example: 'SecurePassword123',
          },
        },
      },
      LoginResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true,
          },
          Response: {
            $ref: '#/components/schemas/User',
          },
          token: {
            type: 'string',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
        },
      },
      ForgotPasswordRequest: {
        type: 'object',
        required: ['email'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            example: 'user@example.com',
          },
        },
      },
      ResetPasswordRequest: {
        type: 'object',
        required: ['email', 'code', 'password', 'confirmPassword'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            example: 'user@example.com',
          },
          code: {
            type: 'string',
            pattern: '^[0-9]{6}$',
            example: '123456',
            description: '6-digit reset code sent to email',
          },
          password: {
            type: 'string',
            minLength: 8,
            example: 'NewSecurePassword123',
          },
          confirmPassword: {
            type: 'string',
            minLength: 8,
            example: 'NewSecurePassword123',
          },
        },
      },
      SuccessResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true,
          },
          message: {
            type: 'string',
            example: 'Operation successful',
          },
        },
      },
      Product: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: '507f1f77bcf86cd799439011',
          },
          name: {
            type: 'string',
            example: 'Engine Oil 5W-30',
          },
          brand: {
            type: 'string',
            example: 'Mobil',
          },
          category: {
            type: 'string',
            example: 'Engine Parts',
          },
          price: {
            type: 'number',
            example: 29.99,
          },
          stock: {
            type: 'number',
            example: 100,
          },
          status: {
            type: 'string',
            enum: ['active', 'inactive', 'out_of_stock'],
            example: 'active',
          },
          images: {
            type: 'array',
            items: {
              type: 'string',
            },
            example: ['https://example.com/image.jpg'],
          },
          description: {
            type: 'string',
            example: 'High-quality synthetic engine oil',
          },
          vehicleType: {
            type: 'string',
            example: 'Car',
          },
          tags: {
            type: 'array',
            items: {
              type: 'string',
            },
            example: ['oil', 'engine'],
          },
          userId: {
            type: 'string',
            example: '507f1f77bcf86cd799439011',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-15T10:30:00.000Z',
          },
        },
      },
      CreateProductRequest: {
        type: 'object',
        required: ['name', 'brand', 'categoryId', 'price', 'stock'],
        properties: {
          name: {
            type: 'string',
            example: 'Engine Oil 5W-30',
          },
          brand: {
            type: 'string',
            example: 'Mobil',
          },
          categoryId: {
            type: 'string',
            example: '507f1f77bcf86cd799439011',
          },
          price: {
            type: 'number',
            minimum: 0,
            example: 29.99,
          },
          stock: {
            type: 'number',
            minimum: 0,
            example: 100,
          },
          description: {
            type: 'string',
            example: 'High-quality synthetic engine oil',
          },
          vehicleType: {
            type: 'string',
            example: 'Car',
          },
          tags: {
            type: 'array',
            items: {
              type: 'string',
            },
            example: ['oil', 'engine'],
          },
          specifications: {
            type: 'object',
            additionalProperties: true,
            example: {
              viscosity: '5W-30',
              volume: '5L',
            },
          },
        },
      },
      PaginationResponse: {
        type: 'object',
        properties: {
          page: {
            type: 'number',
            example: 1,
          },
          limit: {
            type: 'number',
            example: 10,
          },
          total: {
            type: 'number',
            example: 100,
          },
          totalPages: {
            type: 'number',
            example: 10,
          },
        },
      },
    },
  },
  tags: [
    {
      name: 'Authentication',
      description: 'User authentication endpoints (/api/auth/*)',
    },
    {
      name: 'Admin',
      description: 'Admin management endpoints (/admin/*)',
    },
    {
      name: 'User',
      description: 'User endpoints (/api/vehicles, /api/posts, /api/profile, /api/user/*)',
    },
    {
      name: 'Dealer',
      description: 'Dealer endpoints (/api/dealer/*)',
    },
    {
      name: 'Public',
      description: 'Public endpoints (/api/dealers, /api/services)',
    },
    {
      name: 'Dropdowns',
      description: 'Dropdown options endpoint (/api/dropdowns)',
    },
  ],
};

const options = {
  definition: swaggerDefinition,
  apis: [
    './src/routes/**/*.ts',
    './src/routes/**/*.js',
    './src/controllers/**/*.ts',
  ], // Paths to files containing OpenAPI definitions
};

export const swaggerSpec = swaggerJsdoc(options);

