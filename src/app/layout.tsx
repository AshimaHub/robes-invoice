import type { Metadata } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import { NavigationBusy } from "@/components/navigation-busy";
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
  title: "Robes Invoice",
  description:
    "Robes Invoice — company invoicing and NRS-compliant e-invoice tools (mock clearance; not live NRS).",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} h-full`}>
      <body className="min-h-full antialiased">
        <NavigationBusy />
        {children}
      </body>
    </html>
  );
}
