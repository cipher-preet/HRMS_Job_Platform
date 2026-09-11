import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ReduxProvider } from "./_redux/provider";
import "./globals.css";
import { defaultMetadata } from "./seo";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = defaultMetadata;

export const viewport: Viewport = {
  themeColor: "#0b0d12",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} data-scroll-behavior="smooth">
      <body className={`${inter.className} flex min-h-full flex-col`}>
        <ReduxProvider>{children}</ReduxProvider>
      </body>
    </html>
  );
}
