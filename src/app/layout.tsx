import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "DOshomik IELTS",
  description:
    "Basic English foundations, original IELTS practice, mock tests, transparent AI feedback, and score prediction.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${poppins.variable} h-full antialiased`}>
      <body className="min-h-full bg-slate-gray text-midnight-text">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
