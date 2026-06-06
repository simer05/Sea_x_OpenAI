import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "AdaptLink Post-Launch Seller",
  description: "Shopee seller intelligence dashboard for live product improvement"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
