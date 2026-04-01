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
  title: "Boston Hub | Official City Services & Real-time Alerts",
  description: "Your digital gateway to Boston. Access real-time street cleaning schedules, food inspections, and municipal data in one elegant platform.",
  keywords: ["Boston Hub", "Boston street cleaning", "Boston food inspections", "Boston municipal data", "Boston city services"],
  authors: [{ name: "robertfrontend" }],
  openGraph: {
    title: "Boston Hub | The Digital Pulse of the City",
    description: "Access real-time municipal data and essential city services in one elegant, Apple-inspired dashboard.",
    url: "https://boston-hub.vercel.app",
    siteName: "Boston Hub",
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
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Boston Hub",
    "url": "https://boston-hub.vercel.app",
    "description": "Access real-time municipal data and essential city services in Boston.",
    "publisher": {
      "@type": "Organization",
      "name": "Boston Hub",
      "logo": {
        "@type": "ImageObject",
        "url": "https://boston-hub.vercel.app/new-logo.png"
      }
    }
  };

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen antialiased transition-colors duration-300">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
