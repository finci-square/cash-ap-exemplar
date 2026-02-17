import Fastify from 'fastify';
import fastifyCookie from '@fastify/cookie';
import fastifySession from '@fastify/session';
import fastifyEnv from '@fastify/env';
import fastifyCors from '@fastify/cors';
import { readFileSync } from 'fs';
import { envSchema } from './config';
import { HealthHandlers, HealthCheckRoute, GetMeRoute } from './handlers/health.handlers';
import { ItemsHandlers, GetItemsRoute } from './handlers/items.handlers';
import { CartHandlers, GetCartRoute, AddItemToCartRoute, CreateAfterpayCheckoutFromCartRoute, PaymentResultRoute } from './handlers/cart.handlers';
import { AfterpayHandlers, GetAfterpayConfigurationRoute, CreateAfterpayCheckoutRoute } from './handlers/afterpay.handlers';
import { addItemToCartSchema, createAfterpayCheckoutFromCartSchema, createAfterpayCheckoutSchema } from './schemas';
import { itemsService } from './items.service';
import { cartService } from './cart.service';
import { paymentService } from './payment.service';
import { AfterpayService } from './afterpay.service';

const fastify = Fastify({ logger: true });

// Register environment variables (must be first)
fastify.register(fastifyEnv, {
  schema: envSchema,
  dotenv: true
});

// Wait for env plugin to load before accessing config
fastify.after(() => {
  // Register CORS support for localhost development
  fastify.register(fastifyCors, {
    origin: (origin, cb) => {
      // Allow requests from localhost with any port for development
      const allowedOrigins = [
        'http://localhost:5173', // Vite default
        'http://localhost:3000',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:3000'
      ];

      if (!origin || allowedOrigins.some(allowed => origin.startsWith(allowed.split(':').slice(0, 2).join(':')))) {
        cb(null, true);
        return;
      }

      cb(new Error('Not allowed by CORS'), false);
    },
    credentials: true, // Allow cookies to be sent
  });

  // Register cookie support (required for sessions)
  fastify.register(fastifyCookie);

  // Read session secret from file
  const sessionSecret = readFileSync(fastify.config.SESSION_SECRET_PATH, 'utf-8').trim();

  // Register session support
  fastify.register(fastifySession, {
    secret: sessionSecret,
    cookie: {
      secure: fastify.config.NODE_ENV === 'production', // Use secure cookies in production
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
    saveUninitialized: true, // Create session for all requests
    rolling: true, // Reset maxAge on every request
  });

  // Initialize services
  const afterpayService = new AfterpayService(
    fastify.config.AFTERPAY_MERCHANT_ID,
    fastify.config.AFTERPAY_API_KEY
  );

  // Initialize handlers
  const healthHandlers = new HealthHandlers();
  const itemsHandlers = new ItemsHandlers(itemsService);
  const afterpayHandlers = new AfterpayHandlers(afterpayService);
  const cartHandlers = new CartHandlers(cartService, itemsService, afterpayService, paymentService, fastify);

  // Register routes
  // Health routes
  fastify.get<HealthCheckRoute>('/health', (req, reply) => healthHandlers.healthCheck(req, reply));
  fastify.get<GetMeRoute>('/me', (req, reply) => healthHandlers.getMe(req, reply));

  // Items routes
  fastify.get<GetItemsRoute>('/items', (req, reply) => itemsHandlers.getAllItems(req, reply));

  // Cart routes
  fastify.get<GetCartRoute>('/cart', (req, reply) => cartHandlers.getCart(req, reply));
  fastify.post<AddItemToCartRoute>('/cart/items', { schema: addItemToCartSchema }, (req, reply) => cartHandlers.addItemToCart(req, reply));
  fastify.post<CreateAfterpayCheckoutFromCartRoute>('/cart/checkout/afterpay', { schema: createAfterpayCheckoutFromCartSchema }, (req, reply) => cartHandlers.createAfterpayCheckoutFromCart(req, reply));
  fastify.get<PaymentResultRoute>('/cart/payment/result', (req, reply) => cartHandlers.handlePaymentResult(req, reply));

  // Afterpay routes
  fastify.get<GetAfterpayConfigurationRoute>('/afterpay/configuration', (req, reply) => afterpayHandlers.getConfiguration(req, reply));
  fastify.post<CreateAfterpayCheckoutRoute>('/afterpay/checkout', { schema: createAfterpayCheckoutSchema }, (req, reply) => afterpayHandlers.createCheckout(req, reply));
});

// Start the server
const start = async (): Promise<void> => {
  try {
    // Wait for all plugins to load
    await fastify.ready();

    const port = parseInt(fastify.config.PORT, 10);
    const host = fastify.config.HOST;

    await fastify.listen({ port, host });
    console.log(`Server is running on http://${host}:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
