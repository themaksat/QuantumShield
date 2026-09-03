import crypto from "crypto";
import { HybridKeyExchangeProvider } from "./HybridKeyExchangeProvider";

/**
 * Hybrid Post-Quantum Key Agreement (X25519 + NIST FIPS 203 ML-KEM-768)
 * Defends against Harvest-Now-Decrypt-Later (HNDL) quantum adversaries.
 */
export class ServiceKeyExchange {
  private hybridProvider: HybridKeyExchangeProvider;

  constructor() {
    this.hybridProvider = new HybridKeyExchangeProvider();
  }

  public getPublicKey(): Buffer {
    return this.hybridProvider.getCompositePublicKey();
  }

  public computeSharedSecret(otherPublicKey: Buffer): Buffer {
    return this.hybridProvider.computeSharedSecret(otherPublicKey);
  }
}
