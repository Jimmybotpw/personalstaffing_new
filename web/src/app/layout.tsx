import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Personal Staffing",
  description: "Secure staff planning for gyms and small teams.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
