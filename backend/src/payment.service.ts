import { Payment, PaymentType, PaymentStatus } from './models';
import { randomUUID } from 'crypto';

export class PaymentService {
  private payments: Map<string, Payment> = new Map();

  /**
   * Create a new payment record
   */
  createPayment(
    cartId: string,
    type: PaymentType,
    amount: number,
    currency: string,
    providerTransactionId?: string,
    metadata?: Record<string, any>
  ): Payment {
    const payment: Payment = {
      id: randomUUID(),
      cartId,
      type,
      status: 'PENDING',
      amount,
      currency,
      providerTransactionId,
      metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.payments.set(payment.id, payment);
    return payment;
  }

  /**
   * Update payment status
   */
  updatePaymentStatus(paymentId: string, status: PaymentStatus): Payment | undefined {
    const payment = this.payments.get(paymentId);
    if (!payment) return undefined;

    payment.status = status;
    payment.updatedAt = new Date();
    this.payments.set(payment.id, payment);

    return payment;
  }

  /**
   * Get payment by ID
   */
  getPaymentById(paymentId: string): Payment | undefined {
    return this.payments.get(paymentId);
  }

  /**
   * Get payments by cart ID
   */
  getPaymentsByCartId(cartId: string): Payment[] {
    return Array.from(this.payments.values()).filter(
      payment => payment.cartId === cartId
    );
  }
}

// Export singleton instance
export const paymentService = new PaymentService();
