import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "PhantomStrike Console",
  description: "Console v0 for live signal decision submission."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
