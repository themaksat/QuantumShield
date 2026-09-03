import jwt from "jsonwebtoken";
import fs from "fs";

export interface TokenPayload {
  sub: string;
  role: string;
  tenantId: string;
  permissions: string[];
}

/**
 * Signs user authentication token using RSA-2048 (RS256).
 * VULNERABILITY: Shor's algorithm on quantum computer can derive the private key
 * from the public key, compromising all signed tokens.
 */
export class JwtAuthService {
  private privateKey: string;
  private publicKey: string;

  constructor() {
    this.privateKey = process.env.JWT_PRIVATE_KEY || "TEST_RSA_PRIVATE_KEY";
    this.publicKey = process.env.JWT_PUBLIC_KEY || "TEST_RSA_PUBLIC_KEY";
  }

  public signToken(payload: TokenPayload): string {
    return jwt.sign(payload, this.privateKey, {
      algorithm: "RS256",
      expiresIn: "1h",
      issuer: "auth.enterprise-payments.io"
    });
  }

  public verifyToken(token: string): TokenPayload {
    return jwt.verify(token, this.publicKey, {
      algorithms: ["RS256"]
    }) as TokenPayload;
  }
}
