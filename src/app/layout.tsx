import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Beam — Faster feedback on websites, images, and PDFs.",
  description:
    "Internal visual-feedback app. Drop pin-style comments on images and PDFs; share with reviewers; approve faster than email.",
  applicationName: "Beam",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${plusJakarta.variable} h-full antialiased`}>
      <body className="min-h-full bg-background text-foreground">
        {children}
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  );
}
