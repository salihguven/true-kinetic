import { Inter, Space_Grotesk } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

export const metadata = {
  title: "True Kinetic Studios | Sınırları Kaldırın, Fikirleri Koda Döküyoruz",
  description: "Oyun geliştirme, Roblox varlık üretimi ve espor çözümleri sunan yeni nesil dijital stüdyo.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr" className="scroll-smooth">
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} font-sans bg-dark text-white antialiased selection:bg-accent-cyan selection:text-black`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}