import { FastifySchema } from 'fastify';

export const addItemToCartSchema: FastifySchema = {
  body: {
    type: 'object',
    required: ['itemId'],
    properties: {
      itemId: { type: 'string' }
    }
  }
};

export const createAfterpayCheckoutFromCartSchema: FastifySchema = {
  body: {
    type: 'object',
    required: ['consumer'],
    properties: {
      consumer: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email' },
          givenNames: { type: 'string' },
          surname: { type: 'string' },
          phoneNumber: { type: 'string' }
        }
      },
      isCashAppPay: { type: 'boolean' }
    }
  }
};

export const createAfterpayCheckoutSchema: FastifySchema = {
  body: {
    type: 'object',
    required: ['amount', 'consumer'],
    properties: {
      amount: {
        type: 'object',
        required: ['amount', 'currency'],
        properties: {
          amount: { type: 'string' },
          currency: { type: 'string' }
        }
      },
      consumer: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email' },
          givenNames: { type: 'string' },
          surname: { type: 'string' },
          phoneNumber: { type: 'string' }
        }
      },
      merchant: {
        type: 'object',
        properties: {
          redirectConfirmUrl: { type: 'string', format: 'uri' },
          redirectCancelUrl: { type: 'string', format: 'uri' }
        }
      },
      isCashAppPay: { type: 'boolean' }
    }
  }
};
