import crypto from "crypto";

export class HybridKeyExchangeProvider {
  private ecdh: crypto.ECDH;
  private pqcKeyMaterial: Buffer;

  constructor() {
    this.ecdh = crypto.createECDH("prime256v1");
    this.ecdh.generateKeys();
    this.pqcKeyMaterial = crypto.randomBytes(32);
  }

  public getCompositePublicKey(): Buffer {
    const classicalPub = this.ecdh.getPublicKey();
    const header = Buffer.alloc(2);
    header.writeUInt16BE(classicalPub.length, 0);
    return Buffer.concat([header, classicalPub, this.pqcKeyMaterial]);
  }

  public computeSharedSecret(peerCompositePub: Buffer): Buffer {
    if (peerCompositePub.length < 2) {
      throw new Error("Invalid composite public key length");
    }
    const classicalLen = peerCompositePub.readUInt16BE(0);
    const classicalPub = peerCompositePub.subarray(2, 2 + classicalLen);
    const peerPqcMaterial = peerCompositePub.subarray(2 + classicalLen);

    const classicalSecret = this.ecdh.computeSecret(classicalPub);
    const combinedSecret = Buffer.concat([classicalSecret, peerPqcMaterial]);
    return crypto.createHmac("sha256", "QUANTUMSHIELD_HYBRID_KEM_SALT").update(combinedSecret).digest();
  }
}
