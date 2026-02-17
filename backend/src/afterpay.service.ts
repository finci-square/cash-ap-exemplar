// Afterpay checkout request types
export interface AfterpayAmount {
  amount: string;
  currency: string;
}

export interface AfterpayConsumer {
  email: string;
  givenNames?: string;
  surname?: string;
  phoneNumber?: string;
}

export interface AfterpayCheckoutRequest {
  amount: AfterpayAmount;
  consumer: AfterpayConsumer;
  merchant?: {
    redirectConfirmUrl?: string;
    redirectCancelUrl?: string;
  };
  isCashAppPay?: boolean;
}

export interface AfterpayCheckoutResponse {
  token: string;
  expires: string;
  redirectCheckoutUrl: string;
}

export class AfterpayService {
  private baseUrl = 'https://global-api-sandbox.afterpay.com';
  private merchantId: string;
  private secretKey: string;

  constructor(merchantId: string, secretKey: string) {
    this.merchantId = merchantId;
    this.secretKey = secretKey;
  }

  /**
   * Create Basic Auth header
   */
  private getAuthHeader(): string {
    const credentials = Buffer.from(`${this.merchantId}:${this.secretKey}`).toString('base64');
    return `Basic ${credentials}`;
  }

  /**
   * Get Afterpay configuration
   * Retrieves merchant configuration including minimum and maximum order amounts
   */
  async getConfiguration() {
    const url = `${this.baseUrl}/v2/configuration`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': this.getAuthHeader(),
        'User-Agent': 'Afterpay-Exemplar-App',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Afterpay API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Create Afterpay checkout
   * Creates a checkout session and returns a token to redirect the customer
   */
  async createCheckout(checkoutRequest: AfterpayCheckoutRequest): Promise<AfterpayCheckoutResponse> {
    const url = `${this.baseUrl}/v2/checkouts`;

    // Log the checkout request
    console.log('Creating Afterpay/Cash App Pay checkout:', {
      url,
      body: {
        isCashAppPay: checkoutRequest.isCashAppPay || false,
        amount: checkoutRequest.amount,
        consumer: {
          email: checkoutRequest.consumer.email,
          // Don't log full consumer details for privacy
        },
      },
      timestamp: new Date().toISOString()
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': this.getAuthHeader(),
        'User-Agent': 'Afterpay-Exemplar-App',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(checkoutRequest)
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Afterpay checkout creation failed:', {
        status: response.status,
        error,
        timestamp: new Date().toISOString()
      });
      throw new Error(`Afterpay API error: ${response.status} - ${error}`);
    }

    const checkoutResponse = await response.json() as AfterpayCheckoutResponse;

    // Log successful checkout creation
    console.log('Afterpay/Cash App Pay checkout created successfully:', checkoutResponse);

    return checkoutResponse;
  }
}