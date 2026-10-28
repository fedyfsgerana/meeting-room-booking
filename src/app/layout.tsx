import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk } from "next/font/google";
import { themeInitScript } from "@/lib/theme";
import "tom-select/dist/css/tom-select.css";
import "@/frontend/styles/01-tokens.css";
import "@/frontend/styles/02-base.css";
import "@/frontend/styles/03-brand.css";
import "@/frontend/styles/04-buttons.css";
import "@/frontend/styles/05-forms.css";
import "@/frontend/styles/06-badges.css";
import "@/frontend/styles/07-cards.css";
import "@/frontend/styles/08-layout.css";
import "@/frontend/styles/09-login.css";
import "@/frontend/styles/10-table.css";
import "@/frontend/styles/11-modal.css";
import "@/frontend/styles/12-dashboard.css";
import "@/frontend/styles/13-errors.css";
import { OfflineScreen } from "@/frontend/components/errors/offline-screen";

const hankenGrotesk = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Meeting Room Booking",
    template: "%s — Meeting Room Booking",
  },
  description:
    "Aplikasi booking ruang meeting dengan persetujuan bertingkat, monitoring pemakaian, dan riwayat aktivitas.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="id"
      className={hankenGrotesk.variable}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        {children}
        <OfflineScreen />
      </body>
    </html>
  );
}
