import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

export const metadata = {
  applicationName: "app-base",
  title: {
    default: "app-base",
    template: "app-base",
  },
  description: "base for all apps",
  keywords: ["app-base"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "app-base",
    // startUpImage: [],
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "app-base",
    title: {
      default: "app-base",
      template: "app-base",
    },
    description: "base for all apps",
  }
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#FFFFFF",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
