export interface EkoPaymentRequest {
  internalTransactionId: string;
  orderId: string;
  customerName: string;
  customerMobile: string;
  amount: number;
  paymentMethod: "UPI" | "COD" | "DEMO";
  metadata?: Record<string, any>;
}

export interface EkoPaymentResponse {
  success: boolean;
  transactionReference: string;
  provider: "Eko";
  adapter: "MockEkoAdapter" | "EkoAdapter";
  environment: "Demo" | "Production";
  status: "INITIATED" | "PROCESSING" | "SUCCESS" | "FAILED";
  amount: number;
  timestamp: string;
  upiIntentUrl?: string;
  qrPayload?: string;
  message: string;
}

export interface EkoPaymentStatusResponse {
  transactionReference: string;
  status: "INITIATED" | "PROCESSING" | "SUCCESS" | "FAILED";
  amount: number;
  settledAt?: string;
  reason?: string;
}

export interface EkoAccountVerificationRequest {
  accountNumber: string;
  ifsc: string;
  beneficiaryName: string;
}

export interface EkoAccountVerificationResponse {
  verified: boolean;
  registeredName: string;
  bankName: string;
}

export interface EkoAdapter {
  createPayment(request: EkoPaymentRequest): Promise<EkoPaymentResponse>;
  getPaymentStatus(transactionReference: string): Promise<EkoPaymentStatusResponse>;
  verifyBankAccount(request: EkoAccountVerificationRequest): Promise<EkoAccountVerificationResponse>;
}
