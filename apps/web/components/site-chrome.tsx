import Link from "next/link";
import { APP_BRAND, SIMULATOR_DISCLAIMER } from "@credora/shared";
import { ShieldCheck } from "lucide-react";

export function Disclaimer({ compact = false }: { compact?: boolean }) {
  return <p className={`text-xs leading-5 text-[#9cb7b5] ${compact ? "" : "rounded-xl border border-[#b9eae122] bg-[#b9eae108] p-3"}`}><ShieldCheck className="mr-1 inline h-3.5 w-3.5 text-[#61e6cf]" />{SIMULATOR_DISCLAIMER}</p>;
}
export function SiteChrome({ children }: { children: React.ReactNode }) {
  return <><header className="sticky top-0 z-20 border-b border-[#b9eae11c] bg-[#071411dd] backdrop-blur"><nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4"><Link href="/" className="font-semibold tracking-tight">{APP_BRAND.shortName}<span className="text-[#61e6cf]">.ai</span></Link><div className="hidden gap-5 text-sm text-[#b8d3cf] md:flex"><Link href="/product">Product</Link><Link href="/how-it-works">How it works</Link><Link href="/dashboard">Workspace</Link></div><div className="flex gap-2"><Link className="button button-secondary text-sm" href="/login">Sign in</Link><Link className="button button-primary text-sm" href="/demo">Try demo</Link></div></nav></header><main>{children}</main><footer className="mx-auto max-w-7xl px-5 py-10"><div className="border-t border-[#b9eae11c] pt-6"><Disclaimer compact /><p className="mt-3 text-xs text-[#6d8a86]">© 2026 {APP_BRAND.name}. Built as an engineering portfolio project.</p></div></footer></>;
}
