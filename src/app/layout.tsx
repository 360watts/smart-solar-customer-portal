import type { Metadata } from "next";
import { Unbounded, DM_Sans, JetBrains_Mono, Poppins, Urbanist, Figtree, Biryani, IBM_Plex_Sans, Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider, THEME_BOOTSTRAP_SCRIPT } from "@/contexts/ThemeContext";

const unbounded = Unbounded({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// Navbar-specific: sharp, technical terminals — same design lineage as
// JetBrains Mono (both are engineered/precision-oriented typefaces), used to
// give navigation labels a crisper, more professional read than the soft
// DM Sans body copy without competing with the Unbounded brand wordmark.
const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-nav",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const urbanist = Urbanist({
  variable: "--font-urbanist",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const biryani = Biryani({
  variable: "--font-biryani",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

// Editorial serif used on marketing legal pages (privacy/terms) for a
// warmer, more trustworthy tone than the brand's display sans.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
});

// The official 360watts App design system (Figma) specifies Inter as its one
// typeface for the whole type scale (H1–H6 + Body Lg/Md/Sm/ExSm) — used only
// by the design-system components/demo, not a replacement for the portal's
// existing display/nav fonts.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://360watts.com"),
  applicationName: "360watts",
  title: {
    default: "360watts",
    template: "%s | 360watts",
  },
  description: "Smart solar and home automation customer portal.",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    title: "360watts",
    capable: true,
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    title: "360watts",
    description: "Smart solar and home automation customer portal.",
    url: "https://360watts.com",
    siteName: "360watts",
    images: [{ url: "/smartEnergy.webp", width: 1200, height: 630 }],
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${unbounded.variable} ${dmSans.variable} ${jetbrainsMono.variable} ${ibmPlexSans.variable} ${poppins.variable} ${urbanist.variable} ${figtree.variable} ${biryani.variable} ${fraunces.variable} ${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
