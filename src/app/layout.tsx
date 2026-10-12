import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const chicago = localFont({
  src: "../fonts/ChicagoFLF.ttf",
  variable: "--font-chicago",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-ibm-mono",
});

const ibmPlexSans = IBM_Plex_Sans({
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-ibm-sans",
});

export const metadata: Metadata = {
  title: "Roselina Kezia Rijadi",
  description: "Portfolio - Updated May 2026",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${chicago.variable} ${ibmPlexMono.variable} ${ibmPlexSans.variable}`}>
      <body className="h-screen w-screen overflow-hidden antialiased">
        {children}
      </body>
    </html>
  );
}
