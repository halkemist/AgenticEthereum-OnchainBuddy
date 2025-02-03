// Style
import '@coinbase/onchainkit/styles.css';
import "./globals.css";

// Provider OnchainKit
import { Providers } from "./providers";
import Navigation from './components/shared/Navigation';

// Other Imports
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

// Fonts
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Metadata SEO
export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <Navigation/>
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
