import { Geist, Geist_Mono, DM_Sans, Audiowide } from "next/font/google";
import "./globals.css";
import "./fonts.css";
import Nav from "@/components/Nav";
import PageTransition from "@/components/PageTransition";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

const audiowide = Audiowide({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-audiowide",
  display: "swap",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "kondwani phiri — artist & engineer",
  description:
    "Portfolio of Kondwani Phiri — USC Viterbi mechanical engineering student, photographer, and designer based between Maryland, Los Angeles, and New York.",
  openGraph: {
    title: "kondwani phiri",
    description: "artist · engineer · usc viterbi '26",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${dmSans.variable} ${audiowide.variable} antialiased aero-body`}
        suppressHydrationWarning
      >
        {/* Sky bloom in the upper-right */}
        <div className="aero-sun" aria-hidden="true" />

        {/* Drifting bubbles — pure CSS, respects prefers-reduced-motion */}
        <div className="bubble-field" aria-hidden="true">
          <span className="bubble b1" />
          <span className="bubble b2" />
          <span className="bubble b3" />
          <span className="bubble b4" />
          <span className="bubble b5" />
          <span className="bubble b6" />
          <span className="bubble b7" />
          <span className="bubble b8" />
          <span className="bubble b9" />
          <span className="bubble b10" />
        </div>

        <div className="aero-page">
          <Nav />
          <main className="aero-main">
            <PageTransition>{children}</PageTransition>
          </main>
        </div>
      </body>
    </html>
  );
}
