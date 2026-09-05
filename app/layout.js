import { Inter, Space_Grotesk } from "next/font/google";
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
  title: "410 Gone | True Kinetic Studios",
  description: "True Kinetic Studios web hizmetleri sonlandırılmıştır.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr" className="scroll-smooth">
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} font-sans bg-dark text-white antialiased selection:bg-accent-cyan selection:text-black`}
      >
        {children}
      </body>
    </html>
  );
}
