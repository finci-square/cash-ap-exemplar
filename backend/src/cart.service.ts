import { Cart, Item, calculateCart } from './models';
import { randomUUID } from 'crypto';

export class CartService {
  private carts: Map<string, Cart> = new Map();

  /**
   * Get cart by session ID, create new cart if none exists
   */
  getOrCreateCart(sessionId: string): Cart {
    // Find existing cart for this session
    const existingCart = Array.from(this.carts.values()).find(
      cart => cart.sessionId === sessionId && cart.status === 'OPEN'
    );

    if (existingCart) {
      return existingCart;
    }

    // Create new cart
    const newCart: Cart = {
      id: randomUUID(),
      sessionId,
      items: [],
      total: 0,
      status: 'OPEN',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.carts.set(newCart.id, newCart);
    return newCart;
  }

  /**
   * Add item to cart (adds quantity of 1)
   */
  addItemToCart(sessionId: string, item: Item): Cart {
    const cart = this.getOrCreateCart(sessionId);

    // Check if item already exists in cart
    const existingItem = cart.items.find(cartItem => cartItem.itemId === item.id);

    if (existingItem) {
      // Increment quantity by 1
      existingItem.quantity += 1;
    } else {
      // Add new item with quantity 1
      cart.items.push({
        itemId: item.id,
        quantity: 1,
        price: item.price,
      });
    }

    cart.updatedAt = new Date();
    cart.total = calculateCart(cart);
    this.carts.set(cart.id, cart);

    return cart;
  }

  /**
   * Get cart for session
   */
  getCartBySession(sessionId: string): Cart | undefined {
    return Array.from(this.carts.values()).find(
      cart => cart.sessionId === sessionId && cart.status === 'OPEN'
    );
  }

  /**
   * Update item quantity in cart
   */
  updateItemQuantity(sessionId: string, itemId: string, quantity: number): Cart | undefined {
    const cart = this.getCartBySession(sessionId);
    if (!cart) return undefined;

    const item = cart.items.find(item => item.itemId === itemId);
    if (!item) return undefined;

    if (quantity <= 0) {
      // Remove item if quantity is 0 or negative
      cart.items = cart.items.filter(item => item.itemId !== itemId);
    } else {
      item.quantity = quantity;
    }

    cart.updatedAt = new Date();
    cart.total = calculateCart(cart);
    this.carts.set(cart.id, cart);

    return cart;
  }

  /**
   * Remove item from cart
   */
  removeItemFromCart(sessionId: string, itemId: string): Cart | undefined {
    const cart = this.getCartBySession(sessionId);
    if (!cart) return undefined;

    cart.items = cart.items.filter(item => item.itemId !== itemId);
    cart.updatedAt = new Date();
    cart.total = calculateCart(cart);
    this.carts.set(cart.id, cart);

    return cart;
  }

  /**
   * Update cart status
   */
  updateCartStatus(cartId: string, status: Cart['status'], paymentId?: string): Cart | undefined {
    const cart = this.carts.get(cartId);
    if (!cart) return undefined;

    cart.status = status;
    if (paymentId) {
      cart.paymentId = paymentId;
    }
    cart.updatedAt = new Date();
    this.carts.set(cart.id, cart);

    return cart;
  }

  /**
   * Get cart by ID
   */
  getCartById(cartId: string): Cart | undefined {
    return this.carts.get(cartId);
  }
}

// Export singleton instance
export const cartService = new CartService();
