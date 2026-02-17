import { useState } from 'react';
import './PaymentSelector.css';

type PaymentMethod = 'cash-app-pay' | 'afterpay';

interface PaymentSelectorProps {
  total: number;
  onCashAppPay: () => void;
  onAfterpay: () => void;
  cashAppPayReady: boolean;
  loading: boolean;
  error: string | null;
}

function PaymentSelector({
  total,
  onCashAppPay,
  onAfterpay,
  cashAppPayReady,
  loading,
  error,
}: PaymentSelectorProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);

  const installmentAmount = (total / 4 / 100).toFixed(2);

  return (
    <div className="payment-selector">
      <h2 className="payment-selector-title">Payment Method</h2>

      {error && (
        <div className="payment-error" role="alert">
          <p>{error}</p>
        </div>
      )}

      <div className="payment-options">
        {/* Cash App Pay Option */}
        <div
          className={`payment-option ${selectedMethod === 'cash-app-pay' ? 'payment-option-selected' : ''}`}
          onClick={() => setSelectedMethod('cash-app-pay')}
          role="radio"
          aria-checked={selectedMethod === 'cash-app-pay'}
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedMethod('cash-app-pay'); }}
        >
          <div className="payment-option-header">
            <div className="payment-radio">
              <div className={`payment-radio-inner ${selectedMethod === 'cash-app-pay' ? 'payment-radio-checked' : ''}`} />
            </div>
            <div className="payment-option-info">
              <span className="payment-option-name">Cash App Pay</span>
              <span className="payment-option-description">Pay instantly with Cash App</span>
            </div>
          </div>

          {selectedMethod === 'cash-app-pay' && (
            <div className="payment-option-body">
              <div id="cash-app-pay" className="cash-app-pay-container">
                {/* Cash App Pay button and QR code rendered by afterpay.js */}
              </div>
              {!cashAppPayReady && !loading && (
                <button
                  className="payment-action-btn cash-app-btn"
                  onClick={(e) => { e.stopPropagation(); onCashAppPay(); }}
                  disabled={loading}
                >
                  {loading ? 'Initializing...' : 'Pay with Cash App'}
                </button>
              )}
              {loading && (
                <div className="payment-loading">
                  <div className="payment-spinner" />
                  <span>Initializing Cash App Pay...</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Afterpay Option */}
        <div
          className={`payment-option ${selectedMethod === 'afterpay' ? 'payment-option-selected' : ''}`}
          onClick={() => setSelectedMethod('afterpay')}
          role="radio"
          aria-checked={selectedMethod === 'afterpay'}
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedMethod('afterpay'); }}
        >
          <div className="payment-option-header">
            <div className="payment-radio">
              <div className={`payment-radio-inner ${selectedMethod === 'afterpay' ? 'payment-radio-checked' : ''}`} />
            </div>
            <div className="payment-option-info">
              <span className="payment-option-name">Afterpay</span>
              <span className="payment-option-description">Pay in 4 interest-free installments</span>
            </div>
          </div>

          {selectedMethod === 'afterpay' && (
            <div className="payment-option-body">
              <div className="afterpay-installments">
                <p className="afterpay-pay-in-4">4 interest-free payments of <strong>${installmentAmount}</strong></p>
                <div className="afterpay-timeline">
                  {[1, 2, 3, 4].map((n) => (
                    <div key={n} className="afterpay-step">
                      <div className="afterpay-step-dot" />
                      <span className="afterpay-step-label">
                        {n === 1 ? 'Today' : `${(n - 1) * 2} wks`}
                      </span>
                      <span className="afterpay-step-amount">${installmentAmount}</span>
                    </div>
                  ))}
                </div>
              </div>
              <button
                className="payment-action-btn afterpay-btn"
                onClick={(e) => { e.stopPropagation(); onAfterpay(); }}
                disabled={loading}
              >
                {loading ? 'Redirecting...' : 'Pay with Afterpay'}
              </button>
              <a
                className="afterpay-terms-link"
                href="https://www.afterpay.com/en-US/terms-of-service"
                target="_blank"
                rel="noopener noreferrer"
              >
                Afterpay Terms of Service
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PaymentSelector;
