import Script from "next/script";
import "./globals.css";

export const metadata = {
  applicationName: "상수동 길냥이 도감",
  title: {
    default: "상수동 길냥이 도감",
    template: "상수동 길냥이 도감",
  },
  description: "base for all apps",
  keywords: ["상수동 길냥이 도감"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "상수동 길냥이 도감",
    // startUpImage: [],
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "상수동 길냥이 도감",
    title: {
      default: "상수동 길냥이 도감",
      template: "상수동 길냥이 도감",
    },
    description: "base for all apps",
  },
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
        <Script
          strategy="beforeInteractive"
          src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${process.env.NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID}`}
        />
        {children}
      </body>
    </html>
  );
}