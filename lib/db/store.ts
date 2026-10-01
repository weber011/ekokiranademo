import { Cart, Customer, Order, PaymentTransaction, Product } from "@/types";
import { initialProducts } from "@/data/products";
import { initialCustomers } from "@/data/customers";
import { initialOrders } from "@/data/orders";
import { initialPayments } from "@/data/payments";

// Singleton in-memory repository with initial seeded state
class StoreDatabase {
  private products: Map<string, Product> = new Map();
  private customers: Map<string, Customer> = new Map();
  private orders: Map<string, Order> = new Map();
  private payments: Map<string, PaymentTransaction> = new Map();
  private carts: Map<string, Cart> = new Map();
  private initialized = false;

  constructor() {
    this.seed();
  }

  private seed() {
    if (this.initialized) return;

    initialProducts.forEach((p) => this.products.set(p.id, { ...p }));
    initialCustomers.forEach((c) => this.customers.set(c.id, { ...c }));
    initialOrders.forEach((o) => this.orders.set(o.id, { ...o }));
    initialPayments.forEach((p) => this.payments.set(p.id, { ...p }));

    this.initialized = true;
  }

  // --- PRODUCTS ---
  getProducts(): Product[] {
    return Array.from(this.products.values());
  }

  getProductById(id: string): Product | undefined {
    return this.products.get(id);
  }

  searchProducts(query: string, category?: string): Product[] {
    const q = query.toLowerCase().trim();
    return Array.from(this.products.values()).filter((p) => {
      const matchCat = !category || category === "All" || p.category.toLowerCase() === category.toLowerCase();
      if (!matchCat) return false;
      if (!q) return true;

      const nameMatch = p.name.toLowerCase().includes(q);
      const brandMatch = p.brand.toLowerCase().includes(q);
      const descMatch = p.description.toLowerCase().includes(q);
      const tagMatch = p.tags?.some((t) => t.toLowerCase().includes(q));

      return nameMatch || brandMatch || descMatch || tagMatch;
    });
  }

  saveProduct(product: Product): Product {
    this.products.set(product.id, { ...product });
    return product;
  }

  deleteProduct(id: string): boolean {
    return this.products.delete(id);
  }

  updateStock(productId: string, delta: number): Product | undefined {
    const product = this.products.get(productId);
    if (!product) return undefined;
    const newStock = Math.max(0, product.stock + delta);
    product.stock = newStock;
    product.isAvailable = newStock > 0;
    this.products.set(productId, { ...product });
    return product;
  }

  // --- CUSTOMERS ---
  getCustomers(): Customer[] {
    return Array.from(this.customers.values());
  }

  getCustomerById(id: string): Customer | undefined {
    return this.customers.get(id);
  }

  saveCustomer(customer: Customer): Customer {
    this.customers.set(customer.id, { ...customer });
    return customer;
  }

  // --- ORDERS ---
  getOrders(): Order[] {
    // Sort descending by createdAt
    return Array.from(this.orders.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  getOrderById(id: string): Order | undefined {
    return this.orders.get(id);
  }

  saveOrder(order: Order): Order {
    this.orders.set(order.id, { ...order });
    return order;
  }

  updateOrderStatus(
    orderId: string,
    orderStatus: Order["orderStatus"],
    paymentStatus?: Order["paymentStatus"],
    transactionId?: string
  ): Order | undefined {
    const order = this.orders.get(orderId);
    if (!order) return undefined;

    order.orderStatus = orderStatus;
    if (paymentStatus) order.paymentStatus = paymentStatus;
    if (transactionId) order.transactionId = transactionId;

    // Push timeline update
    const now = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    if (orderStatus === "PAID" && !order.timeline.some((t) => t.title === "Payment Received")) {
      order.timeline.push({
        title: "Payment Received",
        time: now,
        done: true,
        description: `Settled via Eko Adapter (${transactionId || "UPI"})`,
      });
    }

    this.orders.set(orderId, { ...order });
    return order;
  }

  // --- PAYMENTS ---
  getPayments(): PaymentTransaction[] {
    return Array.from(this.payments.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  getPaymentById(id: string): PaymentTransaction | undefined {
    return this.payments.get(id);
  }

  getPaymentByInternalId(internalId: string): PaymentTransaction | undefined {
    return Array.from(this.payments.values()).find(
      (p) => p.internalTransactionId === internalId
    );
  }

  savePayment(payment: PaymentTransaction): PaymentTransaction {
    this.payments.set(payment.id, { ...payment });
    return payment;
  }

  // --- CARTS ---
  getCart(cartId: string): Cart {
    let cart = this.carts.get(cartId);
    if (!cart) {
      cart = {
        id: cartId,
        items: [],
        subtotal: 0,
        deliveryFee: 0,
        total: 0,
        updatedAt: new Date().toISOString(),
      };
      this.carts.set(cartId, cart);
    }
    return cart;
  }

  saveCart(cart: Cart): Cart {
    // Recompute totals strictly server-side
    const subtotal = cart.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const deliveryFee = subtotal > 0 && subtotal < 500 ? 30 : 0;
    cart.subtotal = subtotal;
    cart.deliveryFee = deliveryFee;
    cart.total = subtotal + deliveryFee;
    cart.updatedAt = new Date().toISOString();

    this.carts.set(cart.id, { ...cart });
    return cart;
  }

  clearCart(cartId: string): Cart {
    const emptyCart: Cart = {
      id: cartId,
      items: [],
      subtotal: 0,
      deliveryFee: 0,
      total: 0,
      updatedAt: new Date().toISOString(),
    };
    this.carts.set(cartId, emptyCart);
    return emptyCart;
  }
}

// Global singleton pattern to survive hot-reloading in development
declare global {
  var __digitalKiranaDb: StoreDatabase | undefined;
}

export const db: StoreDatabase =
  globalThis.__digitalKiranaDb ?? (globalThis.__digitalKiranaDb = new StoreDatabase());
