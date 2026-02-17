import { useEffect, useState, useCallback } from 'react';
import CartSummary, { Cart } from './CartSummary';
import PaymentSelector from './PaymentSelector';
import './CheckoutPage.css';

interface CheckoutResponse {
  token: string;
  expires: string;
  redirectCheckoutUrl: string;
}

declare global {
  interface Window {
    AfterPay?: {
      initializeForCashAppPay: (options: {
        countryCode: string;
        token: string;
        cashAppPayOptions: CashAppPayOptions;
      }) => void;
      initialize: (options: {
        countryCode: string;
        onComplete: (event: { data: { status: string; orderToken: string } }) => void;
        onError: (event: { data: { error: string } }) => void;
      }) => void;
      open: () => void;
    };
  }
}

interface CashAppPayOptions {
  button: {
    size: 'small' | 'medium';
    width: 'full' | 'static';
    theme: 'dark' | 'light';
    shape: 'round' | 'semiround';
  };
  onComplete: (event: { data: { status: string; cashtag?: string } }) => void;
  eventListeners: {
    CUSTOMER_INTERACTION: (data: { isMobile: boolean }) => void;
    CUSTOMER_REQUEST_DECLINED: () => void;
    CUSTOMER_REQUEST_APPROVED: () => void;
    CUSTOMER_REQUEST_FAILED: () => void;
  };
}

const BACKEND_URL = 'http://localhost:3000';

function CheckoutPage() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [cashAppPayReady, setCashAppPayReady] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Load afterpay.js script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://portal.sandbox.afterpay.com/afterpay.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Fetch cart on mount
  const fetchCart = useCallback(async () => {
    try {
      setFetchError(null);
      const response = await fetch(`${BACKEND_URL}/cart`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch cart');
      }
      const data: { cart: Cart | null } = await response.json();
      setCart(data.cart);
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Failed to load cart');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const handleUpdateQuantity = async (itemId: string, quantity: number) => {
    // The backend doesn't have a quantity update endpoint yet,
    // so we simulate it by re-adding items. For now, this is a placeholder
    // that will work once the backend supports PUT /cart/items/:itemId.
    try {
      const response = await fetch(`${BACKEND_URL}/cart/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ quantity }),
      });
      if (response.ok) {
        const data: { cart: Cart } = await response.json();
        setCart(data.cart);
      }
    } catch {
      // Silently fail - the backend may not support this yet
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/cart/items/${itemId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (response.ok) {
        const data: { cart: Cart } = await response.json();
        setCart(data.cart);
      }
    } catch {
      // Silently fail - the backend may not support this yet
    }
  };

  const initializeCashAppPay = (token: string) => {
    const checkAfterpay = setInterval(() => {
      if (window.AfterPay) {
        clearInterval(checkAfterpay);

        window.AfterPay.initializeForCashAppPay({
          countryCode: 'US',
          token,
          cashAppPayOptions: {
            button: {
              size: 'medium',
              width: 'full',
              theme: 'dark',
              shape: 'round',
            },
            onComplete: (event) => {
              const { status } = event.data;
              if (status === 'SUCCESS') {
                window.location.href = `/cart/payment/result?status=SUCCESS&provider=cash_app_pay&token=${token}`;
              }
            },
            eventListeners: {
              CUSTOMER_INTERACTION: ({ isMobile }) => {
                console.log(`Cash App Pay interaction - mobile: ${isMobile}`);
              },
              CUSTOMER_REQUEST_DECLINED: () => {
                setPaymentError('Payment request was declined');
                setPaymentLoading(false);
              },
              CUSTOMER_REQUEST_APPROVED: () => {
                console.log('Cash App Pay request approved');
              },
              CUSTOMER_REQUEST_FAILED: () => {
                setPaymentError('Payment request failed');
                setPaymentLoading(false);
              },
            },
          },
        });

        setCashAppPayReady(true);
        setPaymentLoading(false);
      }
    }, 100);

    setTimeout(() => {
      clearInterval(checkAfterpay);
      if (!window.AfterPay) {
        setPaymentError('Failed to load payment SDK. Please try again.');
        setPaymentLoading(false);
      }
    }, 10000);
  };

  const handleCashAppPay = async () => {
    if (!cart) return;
    setPaymentLoading(true);
    setPaymentError(null);

    try {
      const response = await fetch(`${BACKEND_URL}/cart/checkout/afterpay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          consumer: {
            email: 'customer@example.com',
            givenNames: 'Test',
            surname: 'Customer',
          },
          isCashAppPay: true,
        }),
      });

      if (!response.ok) {
        const errorData: { error?: { message: string } } = await response.json();
        throw new Error(errorData.error?.message || 'Failed to create checkout');
      }

      const data: { cart: Cart; checkout: CheckoutResponse } = await response.json();
      if (data.checkout?.token) {
        initializeCashAppPay(data.checkout.token);
      }
    } catch (err) {
      setPaymentError(err instanceof Error ? err.message : 'Payment initialization failed');
      setPaymentLoading(false);
    }
  };

  const handleAfterpay = async () => {
    if (!cart) return;
    setPaymentLoading(true);
    setPaymentError(null);

    try {
      const response = await fetch(`${BACKEND_URL}/cart/checkout/afterpay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          consumer: {
            email: 'customer@example.com',
            givenNames: 'Test',
            surname: 'Customer',
          },
          isCashAppPay: false,
        }),
      });

      if (!response.ok) {
        const errorData: { error?: { message: string } } = await response.json();
        throw new Error(errorData.error?.message || 'Failed to create Afterpay checkout');
      }

      const data: { cart: Cart; checkout: CheckoutResponse } = await response.json();

      if (data.checkout?.redirectCheckoutUrl) {
        window.location.href = data.checkout.redirectCheckoutUrl;
      } else if (data.checkout?.token && window.AfterPay) {
        // Use Afterpay popup if available
        window.AfterPay.initialize({
          countryCode: 'US',
          onComplete: (event) => {
            if (event.data.status === 'SUCCESS') {
              window.location.href = `/cart/payment/result?status=SUCCESS&provider=afterpay&token=${event.data.orderToken}`;
            } else {
              setPaymentError('Afterpay payment was cancelled');
              setPaymentLoading(false);
            }
          },
          onError: (event) => {
            setPaymentError(event.data.error || 'Afterpay error occurred');
            setPaymentLoading(false);
          },
        });
        window.AfterPay.open();
      }
    } catch (err) {
      setPaymentError(err instanceof Error ? err.message : 'Payment initialization failed');
      setPaymentLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="checkout-page">
        <div className="checkout-loading">
          <div className="loading-spinner" />
          <p>Loading your cart...</p>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="checkout-page">
        <div className="checkout-error">
          <h2>Something went wrong</h2>
          <p>{fetchError}</p>
          <button className="checkout-retry-btn" onClick={() => { setLoading(true); fetchCart(); }}>
            Try Again
          </button>
          <a href="/" className="checkout-home-link">Return to Home</a>
        </div>
      </div>
    );
  }

  const hasItems = cart && cart.items.length > 0;

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <h1 className="checkout-heading">Checkout</h1>

        <div className="checkout-layout">
          {/* Cart Section */}
          <section className="checkout-section">
            <CartSummary
              cart={cart || { id: '', sessionId: '', items: [], total: 0, status: '', createdAt: '', updatedAt: '' }}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
            />
          </section>

          {/* Payment Section */}
          {hasItems && (
            <section className="checkout-section">
              <PaymentSelector
                total={cart.total}
                onCashAppPay={handleCashAppPay}
                onAfterpay={handleAfterpay}
                cashAppPayReady={cashAppPayReady}
                loading={paymentLoading}
                error={paymentError}
              />
            </section>
          )}
        </div>

        <div className="checkout-footer">
          <a href="/" className="checkout-back-link">Continue Shopping</a>
        </div>
      </div>
    </div>
  );
}

export default CheckoutPage;
