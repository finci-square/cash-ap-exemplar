import { useState } from 'react';
import './CartSummary.css';

export interface CartItem {
  itemId: string;
  quantity: number;
  price: number;
}

export interface Cart {
  id: string;
  sessionId: string;
  items: CartItem[];
  total: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface CartSummaryProps {
  cart: Cart;
  onUpdateQuantity: (itemId: string, quantity: number) => Promise<void>;
  onRemoveItem: (itemId: string) => Promise<void>;
}

function CartSummary({ cart, onUpdateQuantity, onRemoveItem }: CartSummaryProps) {
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());

  const handleQuantityChange = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setUpdatingItems(prev => new Set(prev).add(itemId));
    try {
      await onUpdateQuantity(itemId, newQuantity);
    } finally {
      setUpdatingItems(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const handleRemove = async (itemId: string) => {
    setUpdatingItems(prev => new Set(prev).add(itemId));
    try {
      await onRemoveItem(itemId);
    } finally {
      setUpdatingItems(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  if (cart.items.length === 0) {
    return (
      <div className="cart-summary">
        <h2 className="cart-summary-title">Your Cart</h2>
        <div className="cart-empty">
          <p>Your cart is empty.</p>
          <a href="/" className="continue-shopping-link">Continue Shopping</a>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-summary">
      <h2 className="cart-summary-title">Your Cart</h2>
      <div className="cart-items">
        {cart.items.map((item) => {
          const isUpdating = updatingItems.has(item.itemId);
          return (
            <div key={item.itemId} className={`cart-item ${isUpdating ? 'cart-item-updating' : ''}`}>
              <div className="cart-item-details">
                <span className="cart-item-name">Item {item.itemId.slice(0, 8)}</span>
                <span className="cart-item-price">${(item.price / 100).toFixed(2)}</span>
              </div>
              <div className="cart-item-actions">
                <div className="quantity-controls">
                  <button
                    className="quantity-btn"
                    onClick={() => handleQuantityChange(item.itemId, item.quantity - 1)}
                    disabled={isUpdating || item.quantity <= 1}
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>
                  <span className="quantity-display">{item.quantity}</span>
                  <button
                    className="quantity-btn"
                    onClick={() => handleQuantityChange(item.itemId, item.quantity + 1)}
                    disabled={isUpdating}
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
                <span className="cart-item-subtotal">
                  ${((item.price * item.quantity) / 100).toFixed(2)}
                </span>
                <button
                  className="remove-btn"
                  onClick={() => handleRemove(item.itemId)}
                  disabled={isUpdating}
                  aria-label="Remove item"
                >
                  Remove
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <div className="cart-total">
        <span className="cart-total-label">Total</span>
        <span className="cart-total-amount">${(cart.total / 100).toFixed(2)}</span>
      </div>
    </div>
  );
}

export default CartSummary;
