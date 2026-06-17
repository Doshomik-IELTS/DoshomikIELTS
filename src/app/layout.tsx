import type { Metadata } from "next";
import { Geist_Mono, Poppins } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "900"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://doshomikielts.com"),
  title: {
    default: "DOshomik IELTS",
    template: "%s | DOshomik IELTS",
  },
  description:
    "Basic English foundations, original IELTS practice, mock tests, transparent AI feedback, and score prediction.",
  applicationName: "DOshomik IELTS",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon-96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    title: "DOshomik IELTS",
    description:
      "Basic English foundations, original IELTS practice, mock tests, transparent AI feedback, and score prediction.",
    siteName: "DOshomik IELTS",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "DOshomik IELTS" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "DOshomik IELTS",
    description:
      "Basic English foundations, original IELTS practice, mock tests, transparent AI feedback, and score prediction.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${poppins.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full bg-slate-gray text-text-primary">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
