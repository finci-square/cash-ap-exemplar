// Data models for the ecommerce application

export type PaymentType = 'cash_app_pay' | 'afterpay';

export type PaymentStatus =
  | 'PENDING'
  | 'AUTHORIZED'
  | 'CAPTURED'
  | 'COMPLETED'
  | 'FAILED'
  | 'REFUNDED';

export type CartStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'COMPLETED';

export interface Item {
  id: string;
  name: string;
  description: string;
  price: number; // Price in cents
  imageUrl: string;
  sku: string;
}

export interface CartItem {
  itemId: string;
  quantity: number;
  price: number; // Price in cents at time of adding to cart
}

export interface Cart {
  id: string;
  sessionId: string;
  items: CartItem[];
  total: number; // Total price in cents
  status: CartStatus;
  paymentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Payment {
  id: string;
  cartId: string;
  type: PaymentType;
  status: PaymentStatus;
  amount: number; // Amount in cents
  currency: string;
  providerTransactionId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Helper function to calculate cart total from stored prices
export function calculateCart(cart: Cart): number {
  return cart.items.reduce((total, cartItem) => {
    return total + (cartItem.price * cartItem.quantity);
  }, 0);
}
