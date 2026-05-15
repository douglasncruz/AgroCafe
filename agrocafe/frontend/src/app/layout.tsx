import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { HarvestProvider } from "@/context/HarvestContext";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "AgroCerradoCafé | Gestão Financeira para Lavoura",
  description: "Sistema completo de gestão financeira para propriedades cafeeiras.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased min-h-screen flex flex-col`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <HarvestProvider>
            {children}
            <Toaster position="top-right" richColors />
          </HarvestProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
