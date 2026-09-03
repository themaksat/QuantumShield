import crypto from "crypto";

/**
 * Key agreement between payment microservices using classical ECDH (Elliptic Curve Diffie-Hellman).
 * VULNERABILITY: Quantum computers solving ECDLP can reconstruct shared secret
 * allowing passive decryption of stored communications ("Harvest Now, Decrypt Later").
 */
export class ServiceKeyExchange {
  private ecdh: crypto.ECDH;

  constructor(curve = "secp256k1") {
    this.ecdh = crypto.createECDH(curve);
    this.ecdh.generateKeys();
  }

  public getPublicKey(): Buffer {
    return this.ecdh.getPublicKey();
  }

  public computeSharedSecret(otherPublicKey: Buffer): Buffer {
    return this.ecdh.computeSecret(otherPublicKey);
  }
}
