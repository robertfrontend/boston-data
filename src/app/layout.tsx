import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Boston Hub | Official City Services & Real-time Alerts",
  description: "Your digital gateway to Boston. Access street cleaning schedules, food inspections, trash day, and other municipal data in one place.",
  keywords: ["Boston Hub", "Boston street cleaning", "Boston food inspections", "Boston trash day", "Boston municipal data", "Boston city services"],
  authors: [{ name: "robertfrontend" }],
  openGraph: {
    title: "Boston Hub | The Digital Pulse of the City",
    description: "Street cleaning, food inspections, and trash day from official Boston open data.",
    url: SITE_URL,
    siteName: SITE_NAME,
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
    title: "Boston Hub | City Services & Municipal Data",
    description: "Street cleaning, food inspections, and trash day from official Boston open data.",
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
    "name": SITE_NAME,
    "url": SITE_URL,
    "description": "Street cleaning, food inspections, and trash day from official Boston open data.",
    "publisher": {
      "@type": "Organization",
      "name": SITE_NAME,
      "logo": {
        "@type": "ImageObject",
        "url": `${SITE_URL}/new-logo.png`
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
