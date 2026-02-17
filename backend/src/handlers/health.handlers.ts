import { FastifyRequest, FastifyReply, RouteGenericInterface } from 'fastify';

// Route types
export interface HealthCheckRoute extends RouteGenericInterface {
  Reply: {
    status?: string;
    timestamp?: string;
    error?: {
      message: string;
    };
  };
}

export interface GetMeRoute extends RouteGenericInterface {
  Reply: {
    sessionId?: string;
    error?: {
      message: string;
    };
  };
}

export class HealthHandlers {
  constructor() {
  }

  async healthCheck(
    request: FastifyRequest<HealthCheckRoute>,
    reply: FastifyReply<HealthCheckRoute>
  ) {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  async getMe(
    request: FastifyRequest<GetMeRoute>,
    reply: FastifyReply<GetMeRoute>
  ) {
    return {
      sessionId: request.session.sessionId
    };
  }
}
