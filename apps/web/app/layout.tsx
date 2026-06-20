import type { Metadata } from "next";
import "./globals.css";
import { APP_BRAND } from "@credora/shared";
import { Providers } from "./providers";
import { SiteChrome } from "../components/site-chrome";

export const metadata: Metadata = { title: `${APP_BRAND.name} | Credit intelligence simulator`, description: APP_BRAND.tagline };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className="min-h-screen antialiased"><Providers><SiteChrome>{children}</SiteChrome></Providers></body></html>;
}
