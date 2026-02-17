import { FastifyRequest, FastifyReply, RouteGenericInterface } from 'fastify';
import { AfterpayService, AfterpayCheckoutRequest, AfterpayCheckoutResponse } from '../afterpay.service';

// Route types
export interface GetAfterpayConfigurationRoute extends RouteGenericInterface {
  Reply: {
    configuration?: any;
    error?: {
      message: string;
    };
  };
}

export interface CreateAfterpayCheckoutRoute extends RouteGenericInterface {
  Body: AfterpayCheckoutRequest;
  Reply: AfterpayCheckoutResponse | {
    error: {
      message: string;
    };
  };
}

export class AfterpayHandlers {
  private afterpayService: AfterpayService;

  constructor(afterpayService: AfterpayService) {
    this.afterpayService = afterpayService;
  }

  async getConfiguration(
    request: FastifyRequest<GetAfterpayConfigurationRoute>,
    reply: FastifyReply<GetAfterpayConfigurationRoute>
  ) {
    try {
      const configuration = await this.afterpayService.getConfiguration();

      return reply.code(200).send({ configuration });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        error: { message: error instanceof Error ? error.message : 'Failed to fetch Afterpay configuration' }
      });
    }
  }

  async createCheckout(
    request: FastifyRequest<CreateAfterpayCheckoutRoute>,
    reply: FastifyReply<CreateAfterpayCheckoutRoute>
  ) {
    try {
      const checkoutRequest = request.body;

      // Validate required fields
      if (!checkoutRequest.amount || !checkoutRequest.amount.amount || !checkoutRequest.amount.currency) {
        return reply.code(400).send({
          error: { message: 'Invalid request. amount.amount and amount.currency are required.' }
        });
      }

      if (!checkoutRequest.consumer || !checkoutRequest.consumer.email) {
        return reply.code(400).send({
          error: { message: 'Invalid request. consumer.email is required.' }
        });
      }

      const checkoutResponse = await this.afterpayService.createCheckout(checkoutRequest);

      return reply.code(200).send(checkoutResponse);
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        error: { message: error instanceof Error ? error.message : 'Failed to create Afterpay checkout' }
      });
    }
  }
}
