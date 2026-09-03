import crypto from "crypto";

export class TransactionSigner {
  /**
   * Generates a 2048-bit RSA key pair for settlement verification
   */
  public generateSettlementKeyPair(): { publicKey: string; privateKey: string } {
    const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: "spki",
        format: "pem",
      },
      privateKeyEncoding: {
        type: "pkcs8",
        format: "pem",
      },
    });

    return { publicKey, privateKey };
  }

  /**
   * Signs transaction data with RSA-SHA256
   */
  public signTransaction(data: string, privateKey: string): string {
    const sign = crypto.createSign("RSA-SHA256");
    sign.update(data);
    sign.end();
    return sign.sign(privateKey, "hex");
  }

  public verifyTransaction(data: string, signature: string, publicKey: string): boolean {
    const verify = crypto.createVerify("RSA-SHA256");
    verify.update(data);
    verify.end();
    return verify.verify(publicKey, signature, "hex");
  }
}
