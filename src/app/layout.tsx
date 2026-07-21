import type { Metadata, Viewport } from "next";
import { Caveat, Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// marker handwriting for the whiteboard portal experience
const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ritankar Mondal — AI Systems Engineer",
  description:
    "An interactive 3D workspace. Explore the desk, the rack, the whiteboard — this is where systems get built.",
};

export const viewport: Viewport = {
  themeColor: "#1c1915",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} ${caveat.variable} antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
