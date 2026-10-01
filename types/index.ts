export interface Product {
  id: string;
  name: string;
  category: string;
  brand: string;
  unit: string;
  price: number;
  mrp: number;
  stock: number;
  reorderLevel: number;
  image: string;
  description: string;
  isAvailable: boolean;
  tags?: string[];
}

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  address: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
}

export interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  updatedAt: string;
}

export type OrderStatus =
  | "PENDING"
  | "ACCEPTED"
  | "PREPARING"
  | "READY"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED"
  | "PAID";

export type PaymentMethod = "UPI" | "COD" | "DEMO";

export type PaymentStatus =
  | "INITIATED"
  | "PROCESSING"
  | "PENDING"
  | "SUCCESS"
  | "PAID"
  | "FAILED"
  | "REFUNDED";

export interface OrderTimelineEvent {
  title: string;
  time: string;
  done: boolean;
  description?: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  brand: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Order {
  id: string; // e.g. "DK-1048"
  customerName: string;
  customerMobile: string;
  deliveryAddress: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  transactionId?: string;
  createdAt: string;
  timeline: OrderTimelineEvent[];
}

export interface PaymentTransaction {
  id: string;
  internalTransactionId: string; // e.g. "WB-DK-20260908-1048"
  orderId: string;
  customerName: string;
  amount: number;
  provider: "Eko";
  adapter: "MockEkoAdapter" | "EkoAdapter";
  environment: "Demo" | "Production";
  method: PaymentMethod;
  status: PaymentStatus;
  createdAt: string;
  updatedAt: string;
  note?: string;
}

export interface Invoice {
  invoiceNumber: string;
  orderId: string;
  customerName: string;
  customerMobile: string;
  deliveryAddress: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: string;
  transactionRef: string;
  date: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  actionState?: string;
  quickActions?: {
    label: string;
    action: "checkout" | "view_cart" | "add_clarified" | "select_payment";
    payload?: any;
  }[];
  cartSummary?: {
    itemsCount: number;
    total: number;
  };
}
