"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavLinkProps {
  href: string;
  className?: string | ((props: { isActive: boolean }) => string);
  children: React.ReactNode;
}

export default function NavLink({ href, className, children }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + "/");

  const resolvedClass =
    typeof className === "function" ? className({ isActive }) : className;

  return (
    <Link href={href} className={cn(resolvedClass)}>
      {children}
    </Link>
  );
}