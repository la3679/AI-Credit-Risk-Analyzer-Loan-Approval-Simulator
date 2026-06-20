"use client";
import Link from "next/link";
import { BarChart3, Home, ScanSearch, Sparkles, UserRound } from "lucide-react";
import { useAuth } from "../lib/auth";
const items = [[Home, "Home", "/"], [ScanSearch, "Analyze", "/analyzer"], [Sparkles, "Autopilot", "/autopilot"], [BarChart3, "Portfolio", "/portfolio"], [UserRound, "Account", "/dashboard"]] as const;
export function MobileNav() { const { user } = useAuth(); return <nav className="mobile-nav fixed inset-x-0 bottom-0 z-30 border-t border-[#b9eae11c] bg-[#071411ee] px-2 pt-2 backdrop-blur md:hidden"> <div className="mx-auto grid max-w-md grid-cols-5">{items.map(([Icon, label, href]) => <Link className="grid place-items-center gap-1 rounded-xl py-2 text-[10px] text-[#9cb7b5] transition hover:bg-white/5 hover:text-[#61e6cf]" href={href} key={label}><Icon className="h-4 w-4"/><span>{label === "Account" && user ? user.name.split(" ")[0] : label}</span></Link>)}</div></nav>; }
