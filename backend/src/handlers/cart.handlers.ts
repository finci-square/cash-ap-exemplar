import { FastifyRequest, FastifyReply, FastifyInstance, RouteGenericInterface } from 'fastify';
import { CartService } from '../cart.service';
import { ItemsService } from '../items.service';
import { PaymentService } from '../payment.service';
import { AfterpayService, AfterpayCheckoutRequest, AfterpayConsumer, AfterpayCheckoutResponse } from '../afterpay.service';
import { Cart, PaymentType } from '../models';

// Route types
export interface GetCartRoute extends RouteGenericInterface {
  Reply: {
    cart?: Cart | null;
    error?: {
      message: string;
    };
  };
}

export interface AddItemToCartRoute extends RouteGenericInterface {
  Body: {
    itemId: string;
  };
  Reply: {
    cart?: Cart;
    error?: {
      message: string;
    };
  };
}

export interface CreateAfterpayCheckoutFromCartRoute extends RouteGenericInterface {
  Body: {
    consumer: AfterpayConsumer;
    isCashAppPay?: boolean;
  };
  Reply: {
    cart?: Cart;
    checkout?: AfterpayCheckoutResponse;
    error?: {
      message: string;
    };
  };
}

export interface PaymentResultRoute extends RouteGenericInterface {
  Querystring: {
    status: 'SUCCESS' | 'CANCELLED';
    provider?: string;
    token?: string;
  };
  Reply: {
    status?: string;
    provider?: string;
    message?: string;
    cart?: Cart;
    error?: {
      message: string;
    };
  };
}

export class CartHandlers {
  private config: FastifyInstance['config'];
  private cartService: CartService;
  private itemsService: ItemsService;
  private afterpayService: AfterpayService;
  private paymentService: PaymentService;

  constructor(
    cartService: CartService,
    itemsService: ItemsService,
    afterpayService: AfterpayService,
    paymentService: PaymentService,
    fastify: FastifyInstance
  ) {
    this.config = fastify.config;
    this.cartService = cartService;
    this.itemsService = itemsService;
    this.afterpayService = afterpayService;
    this.paymentService = paymentService;
  }

  async getCart(
    request: FastifyRequest<GetCartRoute>,
    reply: FastifyReply<GetCartRoute>
  ) {
    const sessionId = request.session.sessionId;
    const cart = this.cartService.getCartBySession(sessionId);

    if (!cart) {
      return { cart: null };
    }

    return { cart };
  }

  async addItemToCart(
    request: FastifyRequest<AddItemToCartRoute>,
    reply: FastifyReply<AddItemToCartRoute>
  ) {
    const { itemId } = request.body;
    const sessionId = request.session.sessionId;

    // Validate input
    if (!itemId) {
      return reply.code(400).send({
        error: { message: 'Invalid request. itemId is required.' }
      });
    }

    // Verify item exists
    const items = this.itemsService.getAllItems();
    const item = items.find(i => i.id === itemId);

    if (!item) {
      return reply.code(404).send({
        error: { message: 'Item not found' }
      });
    }

    // Add item to cart (quantity of 1)
    const cart = this.cartService.addItemToCart(sessionId, item);

    return reply.code(200).send({ cart });
  }

  async createAfterpayCheckoutFromCart(
    request: FastifyRequest<CreateAfterpayCheckoutFromCartRoute>,
    reply: FastifyReply<CreateAfterpayCheckoutFromCartRoute>
  ) {
    try {
      // Check if Afterpay credentials are configured
      if (!this.config.AFTERPAY_MERCHANT_ID || !this.config.AFTERPAY_API_KEY) {
        return reply.code(503).send({
          error: { message: 'Afterpay is not configured. Please set AFTERPAY_MERCHANT_ID and AFTERPAY_API_KEY environment variables.' }
        });
      }

      const sessionId = request.session.sessionId;
      const { consumer, isCashAppPay } = request.body;

      // Validate required fields
      if (!consumer || !consumer.email) {
        return reply.code(400).send({
          error: { message: 'Invalid request. consumer.email is required.' }
        });
      }

      // Generate redirect URLs based on server configuration
      const baseUrl = this.config.REDIRECT_BASE_URL ||
        `${this.config.NODE_ENV === 'production' ? 'https' : 'http'}://${request.hostname}`;
      const redirectConfirmUrl = `${baseUrl}/cart/payment/result?provider=afterpay`;
      const redirectCancelUrl = `${baseUrl}/cart/payment/result?provider=afterpay`;

      // Get cart from session
      const cart = this.cartService.getCartBySession(sessionId);

      if (!cart) {
        return reply.code(404).send({
          error: { message: 'Cart not found for this session.' }
        });
      }

      if (cart.items.length === 0) {
        return reply.code(400).send({
          error: { message: 'Cart is empty. Add items before creating checkout.' }
        });
      }

      // Convert cart total from cents to Afterpay format (string with 2 decimal places)
      const amountInDollars = (cart.total / 100).toFixed(2);

      // Create Afterpay checkout request
      const checkoutRequest: AfterpayCheckoutRequest = {
        amount: {
          amount: amountInDollars,
          currency: 'USD'
        },
        consumer,
        merchant: {
          redirectConfirmUrl,
          redirectCancelUrl
        },
        isCashAppPay
      };

      const checkoutResponse = await this.afterpayService.createCheckout(checkoutRequest);

      return reply.code(200).send({
        cart,
        checkout: checkoutResponse
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        error: { message: error instanceof Error ? error.message : 'Failed to create Afterpay checkout from cart' }
      });
    }
  }

  async handlePaymentResult(
    request: FastifyRequest<PaymentResultRoute>,
    reply: FastifyReply<PaymentResultRoute>
  ) {
    try {
      const sessionId = request.session.sessionId;
      const { status, provider, token } = request.query;

      // Validate query parameters
      if (!status || !provider) {
        return reply.code(400).send({
          error: { message: 'Invalid request. status and provider query parameters are required.' }
        });
      }

      if (status !== 'SUCCESS' && status !== 'CANCELLED') {
        return reply.code(400).send({
          error: { message: 'Invalid status. Must be "SUCCESS" or "CANCELLED".' }
        });
      }

      if (provider !== 'afterpay' && provider !== 'cash_app_pay') {
        return reply.code(400).send({
          error: { message: 'Invalid provider. Must be "afterpay" or "cash_app_pay".' }
        });
      }

      // Get cart from session
      const cart = this.cartService.getCartBySession(sessionId);

      if (!cart) {
        return reply.code(404).send({
          error: { message: 'Cart not found for this session.' }
        });
      }

      if (status === 'SUCCESS') {
        // TODO: Verify payment with provider API using token from query params
        // For now, we'll trust the redirect and create the payment record

        // Create payment record
        const payment = this.paymentService.createPayment(
          cart.id,
          provider as PaymentType,
          cart.total,
          'USD',
          token, // Provider transaction ID from token
          {
            sessionId,
            completedAt: new Date().toISOString()
          }
        );

        // Update payment status to COMPLETED
        this.paymentService.updatePaymentStatus(payment.id, 'COMPLETED');

        // Update cart status to COMPLETED and link payment
        this.cartService.updateCartStatus(cart.id, 'COMPLETED', payment.id);

        // Get updated cart
        const updatedCart = this.cartService.getCartById(cart.id);

        return reply.code(200).send({
          status,
          provider,
          message: `Payment completed successfully with ${provider}`,
          cart: updatedCart
        });
      } else {
        // Payment was cancelled
        return reply.code(200).send({
          status,
          provider,
          message: `Payment was cancelled with ${provider}`,
          cart
        });
      }
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        error: { message: error instanceof Error ? error.message : 'Failed to process payment result' }
      });
    }
  }
}
