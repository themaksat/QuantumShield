import type { Metadata } from "next";
import "./globals.css";
import { Shell } from "@/components/layout/Shell";

export const metadata: Metadata = {
  title: "QuantumShield | Cryptographic Control Plane & PQC Governance",
  description: "Enterprise post-quantum cryptographic discovery, CBOM, migration planning, and continuous governance.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased selection:bg-indigo-500/30 selection:text-cyan-300">
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
