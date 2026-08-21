import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Web3Provider } from "@/components/providers/Web3Provider";
import { Header } from "@/components/Header";
import { DisclaimerBanner } from "@/components/DisclaimerBanner";
import { Footer } from "@/components/Footer";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "AegisDAO — AI-Assisted Governance & Risk Analysis Platform",
  description: "Production-grade, security-conscious reference implementation of an AI-assisted DAO governance ecosystem backed by OpenZeppelin v5 smart contracts and OpenAI threat analysis.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${mono.variable}`}>
      <body className="min-h-screen flex flex-col font-sans antialiased text-slate-100 bg-slate-950">
        <Web3Provider>
          <DisclaimerBanner />
          <Header />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
          <Footer />
        </Web3Provider>
      </body>
    </html>
  );
}
