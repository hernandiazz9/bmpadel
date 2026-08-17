import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Mono, Instrument_Sans } from "next/font/google";

import { Providers } from "@/components/providers";
import { ServiceWorkerRegistrar } from "@/components/service-worker";
import { strings } from "@/lib/strings";
import { TOKENS } from "@/lib/tokens";
import "./globals.css";

/* Display face. Variable weight plus the `wdth` axis, which the `headline`
   and `subhead` utilities push to the expanded end. */
const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  axes: ["wdth"],
  display: "swap",
});

/* Body face. */
const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument-sans",
  display: "swap",
});

/* Data face: times, levels, prices, slot counts. */
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: strings.app.name,
  description: strings.app.description,
  applicationName: strings.app.name,
  appleWebApp: {
    capable: true,
    title: strings.app.name,
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: TOKENS.glass,
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${instrumentSans.variable} ${plexMono.variable} h-full`}
    >
      <body className="min-h-full">
        <Providers>{children}</Providers>
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
