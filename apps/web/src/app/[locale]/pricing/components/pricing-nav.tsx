"use client";
import { Link } from "@/i18n/navigation";
import { motion } from "framer-motion";
import { VisdraftLogo } from "@/components/icons/visdraft-logo";
import { buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

export function PricingNav() {
  const { session, loading } = useAuth();
  return <motion.header initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-lg">
    <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6 py-3">
      <Link href="/" className="flex items-center gap-2"><VisdraftLogo className="size-7 text-foreground" /><span className="text-base font-semibold tracking-tight">Visdraft</span></Link>
      <div className="flex items-center gap-2">{!loading && !session ? <><Link href="/login" className={buttonVariants({ variant: "ghost", size: "sm" })}>登录</Link><Link href="/register" className={buttonVariants({ size: "sm" })}>免费开始</Link></> : <Link href="/home" className={buttonVariants({ size: "sm" })}>返回工作区</Link>}</div>
    </nav>
  </motion.header>;
}
