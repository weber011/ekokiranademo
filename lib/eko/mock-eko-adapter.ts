import {
  EkoAccountVerificationRequest,
  EkoAccountVerificationResponse,
  EkoAdapter,
  EkoPaymentRequest,
  EkoPaymentResponse,
  EkoPaymentStatusResponse,
} from "./eko-adapter";

export class MockEkoAdapter implements EkoAdapter {
  private static transactionStore: Map<string, EkoPaymentStatusResponse> = new Map();

  async createPayment(request: EkoPaymentRequest): Promise<EkoPaymentResponse> {
    // Generate standardized WebbyBuilder-Eko reference: WB-DK-YYYYMMDD-XXXX
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const transactionReference = request.internalTransactionId || `WB-DK-${dateStr}-${randSuffix}`;

    // Demo rule: if amount equals 404 or explicitly flagged, simulate bank failure
    const isSimulatedFailure = request.metadata?.simulateFailure === true || request.amount === 404;

    const initialStatus = isSimulatedFailure ? "FAILED" : "INITIATED";

    // Store in mock memory
    MockEkoAdapter.transactionStore.set(transactionReference, {
      transactionReference,
      status: initialStatus,
      amount: request.amount,
      settledAt: isSimulatedFailure ? undefined : new Date().toISOString(),
      reason: isSimulatedFailure ? "EKO_SIMULATED_DECLINE: Bank rejected transaction" : undefined,
    });

    return {
      success: !isSimulatedFailure,
      transactionReference,
      provider: "Eko",
      adapter: "MockEkoAdapter",
      environment: "Demo",
      status: initialStatus,
      amount: request.amount,
      timestamp: new Date().toISOString(),
      upiIntentUrl: `upi://pay?pa=sharmakirana@eko&pn=SharmaGeneralStore&am=${request.amount}&tr=${transactionReference}&cu=INR`,
      qrPayload: `00020101021226500010eko.in0112sharmakirana520454115303356540${request.amount}5802IN`,
      message: isSimulatedFailure
        ? "Simulated bank decline via MockEkoAdapter."
        : "Mock Eko payment initiated successfully. Environment: Demo.",
    };
  }

  async getPaymentStatus(transactionReference: string): Promise<EkoPaymentStatusResponse> {
    const existing = MockEkoAdapter.transactionStore.get(transactionReference);
    if (!existing) {
      return {
        transactionReference,
        status: "FAILED",
        amount: 0,
        reason: "Transaction reference not found in Eko mock registry",
      };
    }

    // Advance INITIATED -> SUCCESS after simulated latency
    if (existing.status === "INITIATED") {
      existing.status = "SUCCESS";
      existing.settledAt = new Date().toISOString();
      MockEkoAdapter.transactionStore.set(transactionReference, existing);
    }

    return existing;
  }

  async verifyBankAccount(request: EkoAccountVerificationRequest): Promise<EkoAccountVerificationResponse> {
    return {
      verified: true,
      registeredName: request.beneficiaryName || "Sharma General Store Ranchi",
      bankName: "State Bank of India (Main Branch Ranchi)",
    };
  }
}
