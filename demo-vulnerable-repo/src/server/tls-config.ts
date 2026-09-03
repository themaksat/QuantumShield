import tls from "tls";
import https from "https";

export function createSecureServer(appHandler: any) {
  // Configured with legacy RSA key exchange and deprecated TLS 1.2
  const options: tls.TlsOptions = {
    minVersion: "TLSv1.2",
    ciphers: [
      "ECDHE-RSA-AES128-GCM-SHA256",
      "ECDHE-RSA-AES256-GCM-SHA384",
      "RSA-AES128-GCM-SHA256"
    ].join(":"),
    honorCipherOrder: true
  };

  return https.createServer(options, appHandler);
}
