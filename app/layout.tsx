import type { Metadata, Viewport } from "next";
import { ReduxProvider } from "./_redux/provider";
import "./globals.css";
import { defaultMetadata } from "./seo";

export const metadata: Metadata = defaultMetadata;

export const viewport: Viewport = {
  themeColor: "#2563eb",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <ReduxProvider>{children}</ReduxProvider>
      </body>
    </html>
  );
}
