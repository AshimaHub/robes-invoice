import type { Metadata } from "next";
import { Suspense } from "react";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import { NavigationBusy } from "@/components/navigation-busy";
import { APP_LOGO, APP_NAME } from "@/lib/brand";
import "./globals.css";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const body = Source_Sans_3({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: APP_NAME,
  description: `${APP_NAME} — company invoicing and NRS-compliant e-invoice tools (mock clearance; not live NRS).`,
  icons: { icon: APP_LOGO },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} h-full`}>
      <body className="min-h-full antialiased">
        <Suspense fallback={null}>
          <NavigationBusy />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
