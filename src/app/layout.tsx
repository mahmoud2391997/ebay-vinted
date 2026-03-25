import type { Metadata } from "next";
import "../index.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "Vinted Scraper",
  description: "Search Vinted listings in real time",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

