import { useEffect, useState } from 'react';
import './CheckoutPage.css';

interface Cart {
  id: string;
  sessionId: string;
  items: Array<{
    itemId: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface CheckoutResponse {
  token: string;
  expires: string;
  redirectCheckoutUrl: string;
}

interface CheckoutData {
  cart: Cart;
  checkout: CheckoutResponse;
}

declare global {
  interface Window {
    AfterPay?: {
      initializeForCashAppPay: (options: {
        countryCode: string;
        token: string;
        cashAppPayOptions: CashAppPayOptions;
      }) => void;
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

function CheckoutPage() {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);

  useEffect(() => {
    // Load afterpay.js script
    const script = document.createElement('script');
    script.src = 'https://portal.sandbox.afterpay.com/afterpay.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Cleanup script on unmount
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    // Create checkout when component mounts
    createCheckout();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createCheckout = async () => {
    try {
      setLoading(true);
      setError(null);

      const backendUrl = 'http://localhost:3000';

      // First, get the cart to check if it has items
      const cartResponse = await fetch(`${backendUrl}/cart`, {
        credentials: 'include'
      });

      if (!cartResponse.ok) {
        throw new Error('Failed to fetch cart');
      }

      const cartData: { cart: Cart | null } = await cartResponse.json();

      if (!cartData.cart || cartData.cart.items.length === 0) {
        throw new Error('Cart is empty');
      }

      // Create Afterpay checkout with Cash App Pay enabled
      const checkoutResponse = await fetch(`${backendUrl}/cart/checkout/afterpay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          consumer: {
            email: 'customer@example.com',
            givenNames: 'Test',
            surname: 'Customer'
          },
          isCashAppPay: true
        })
      });

      if (!checkoutResponse.ok) {
        const errorData: { error?: { message: string } } = await checkoutResponse.json();
        throw new Error(errorData.error?.message || 'Failed to create checkout');
      }

      const data: CheckoutData = await checkoutResponse.json();
      setCheckoutData(data);

      // Initialize afterpay.js with the checkout token
      if (data.checkout && data.checkout.token) {
        initializeAfterpay(data.checkout.token);
      }

      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  const initializeAfterpay = (token: string) => {
    // Wait for afterpay.js to load
    const checkAfterpay = setInterval(() => {
      if (window.AfterPay) {
        clearInterval(checkAfterpay);

        // Initialize Cash App Pay with options
        const cashAppPayOptions = {
          button: {
            size: 'medium',
            width: 'full',
            theme: 'dark',
            shape: 'round'
          },
          onComplete: function(event) {
            const { status, cashtag } = event.data;
            console.log('Payment completed:', { status, cashtag });

            if (status === 'SUCCESS') {
              window.location.href = `/cart/payment/result?status=SUCCESS&provider=cash_app_pay&token=${token}`;
            }
          },
          eventListeners: {
            "CUSTOMER_INTERACTION": ({ isMobile }) => {
              console.log(`CUSTOMER_INTERACTION - isMobile: ${isMobile}`);
            },
            "CUSTOMER_REQUEST_DECLINED": () => {
              console.log('CUSTOMER_REQUEST_DECLINED');
              setError('Payment request was declined');
            },
            "CUSTOMER_REQUEST_APPROVED": () => {
              console.log('CUSTOMER_REQUEST_APPROVED');
            },
            "CUSTOMER_REQUEST_FAILED": () => {
              console.log('CUSTOMER_REQUEST_FAILED');
              setError('Payment request failed');
            }
          }
        };

        window.AfterPay.initializeForCashAppPay({
          countryCode: 'US',
          token: token,
          cashAppPayOptions
        });
      }
    }, 100);

    // Timeout after 10 seconds
    setTimeout(() => {
      clearInterval(checkAfterpay);
      if (!window.AfterPay) {
        setError('Failed to load Afterpay SDK');
      }
    }, 10000);
  };

  if (loading) {
    return (
      <div className="payment-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Initializing Cash App Pay...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="payment-page">
        <div className="error-container">
          <h2>Payment Error</h2>
          <p>{error}</p>
          <button onClick={() => window.location.href = '/'}>
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-page">
      <div className="payment-container">
        <h1>Pay with Cash App</h1>
        <p>Click the button below or scan the QR code with your Cash App to complete payment</p>

        {checkoutData && (
          <div className="checkout-info">
            <p>Amount: ${(checkoutData.cart.total / 100).toFixed(2)}</p>
          </div>
        )}

        <div id="cash-app-pay">
          {/* Cash App Pay button and QR code will be rendered here by afterpay.js */}
        </div>

        <button
          className="cancel-button"
          onClick={() => window.location.href = '/'}
        >
          Cancel Payment
        </button>
      </div>
    </div>
  );
}

export default CheckoutPage;
