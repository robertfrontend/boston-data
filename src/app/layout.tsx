import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Boston Sweeper | Official Street Cleaning Schedule & Alerts",
  description: "Avoid parking tickets in Boston. Get real-time street sweeping schedules, winter season alerts, and precise cleaning times for every block in Boston.",
  keywords: ["Boston street cleaning", "street sweeping schedule Boston", "Boston parking tickets", "parking alerts Boston", "Boston municipal data"],
  authors: [{ name: "Robert Frontend" }],
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  openGraph: {
    title: "Boston Sweeper | Never Get a Parking Ticket Again",
    description: "The fastest way to check street cleaning schedules in Boston. Real-time API integration and precise location detection.",
    url: "https://boston-sweeper.vercel.app",
    siteName: "Boston Sweeper",
    images: [
      {
        url: "/new-logo.png",
        width: 800,
        height: 800,
        alt: "Boston Sweeper Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Boston Sweeper | Street Cleaning Schedule",
    description: "Avoid parking tickets in Boston with real-time street sweeping alerts.",
    images: ["/new-logo.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body className="min-h-screen antialiased transition-colors duration-300">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
