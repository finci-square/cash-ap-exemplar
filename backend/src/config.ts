// Environment variables type
export interface Envs {
  NODE_ENV: string;
  HOST: string;
  PORT: string;
  SESSION_SECRET_PATH: string;
  REDIRECT_BASE_URL: string;
  CASH_APP_PAY_API_KEY?: string;
  CASH_APP_PAY_CLIENT_ID?: string;
  AFTERPAY_API_KEY: string;
  AFTERPAY_MERCHANT_ID: string;
}

// Declare fastify config types
declare module 'fastify' {
  interface FastifyInstance {
    config: Envs;
  }
}

// Environment variable schema
export const envSchema = {
  type: 'object',
  required: ['NODE_ENV', 'SESSION_SECRET_PATH', 'REDIRECT_BASE_URL', 'AFTERPAY_API_KEY', 'AFTERPAY_MERCHANT_ID'],
  properties: {
    NODE_ENV: {
      type: 'string',
      default: 'development'
    },
    HOST: {
      type: 'string',
      default: '0.0.0.0'
    },
    PORT: {
      type: 'string',
      default: '3000'
    },
    SESSION_SECRET_PATH: {
      type: 'string'
    },
    REDIRECT_BASE_URL: {
      type: 'string'
    },
    AFTERPAY_API_KEY: {
      type: 'string'
    },
    AFTERPAY_MERCHANT_ID: {
      type: 'string'
    },
    CASH_APP_PAY_API_KEY: {
      type: 'string'
    },
    CASH_APP_PAY_CLIENT_ID: {
      type: 'string'
    },
  }
};
