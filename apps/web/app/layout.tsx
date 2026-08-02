import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { Geist } from "next/font/google";
import { cn } from "@/shared/utils";
import { ConditionalNav } from "@/components/Landing/ConditionalNav";
import { ThirdwebProvider } from "thirdweb/react";
import { ToastProvider } from "@/components/ui/Toast";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
});
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
});


const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vigil.xyz';
const SITE_NAME = 'Vigil';
const SITE_DESCRIPTION =
  'Autonomous protocol risk monitoring and consequence execution system. Vigil scores DeFi protocol health in real time and automatically reduces exposure before risk becomes loss.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Vigil — Autonomous Protocol Risk Monitoring',
    template: '%s · Vigil',
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    'DeFi risk monitoring',
    'protocol health score',
    'on-chain risk management',
    'yield vault safety',
    'automated de-risking',
    'DeFi security',
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  robots: { index: true, follow: true },
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: '/',
    siteName: SITE_NAME,
    title: 'Vigil — Autonomous Protocol Risk Monitoring',
    description: SITE_DESCRIPTION,
    locale: 'en_US',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Vigil — Autonomous protocol risk monitoring',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vigil — Autonomous Protocol Risk Monitoring',
    description: SITE_DESCRIPTION,
    images: ['/opengraph-image'],
  },
};

export const viewport: Viewport = {
  themeColor: '#0a0712',
  colorScheme: 'dark',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ThirdwebProvider>
          <ToastProvider>
            <ConditionalNav />
            {children}
          </ToastProvider>
        </ThirdwebProvider>
      </body>
    </html>
  );
}
