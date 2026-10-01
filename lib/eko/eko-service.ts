import { EkoAdapter } from "./eko-adapter";
import { MockEkoAdapter } from "./mock-eko-adapter";
import { RealEkoAdapter } from "./eko-adapter-impl";

let activeAdapter: EkoAdapter | null = null;

export function getEkoAdapter(): EkoAdapter {
  if (!activeAdapter) {
    const provider = process.env.PAYMENT_PROVIDER || "mock";
    if (provider.toLowerCase() === "eko") {
      activeAdapter = new RealEkoAdapter();
    } else {
      activeAdapter = new MockEkoAdapter();
    }
  }
  return activeAdapter;
}

export function isDemoEnvironment(): boolean {
  return (process.env.PAYMENT_PROVIDER || "mock").toLowerCase() !== "eko";
}
