"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Flower2,
  ShoppingCart,
  CalendarHeart,
  Bell,
  Users,
  PackageOpen,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["OWNER", "EMPLOYEE"] },
  { href: "/inventory", label: "Inventario", icon: PackageOpen, roles: ["OWNER", "EMPLOYEE"] },
  { href: "/flowers", label: "Catálogo", icon: Flower2, roles: ["OWNER", "EMPLOYEE"] },
  { href: "/orders", label: "Pedidos", icon: ShoppingCart, roles: ["OWNER", "EMPLOYEE"] },
  { href: "/seasons", label: "Temporadas", icon: CalendarHeart, roles: ["OWNER", "EMPLOYEE"] },
  { href: "/alerts", label: "Alertas", icon: Bell, roles: ["OWNER", "EMPLOYEE"] },
  { href: "/users", label: "Usuarios", icon: Users, roles: ["OWNER"] },
];

export function Sidebar({ role }: { role: string }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = NAV.filter((n) => n.roles.includes(role));

  const nav = (
    <nav className="flex-1 px-2 py-4 space-y-0.5">
      {links.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              active
                ? "bg-primary text-white"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            )}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col w-56 bg-white border-r border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-2 px-4 py-5 border-b border-gray-200">
          <Flower2 className="w-6 h-6 text-primary" />
          <span className="font-bold text-gray-900 text-sm">Florería Perla</span>
        </div>
        {nav}
      </aside>

      {/* Mobile hamburger trigger – handled by TopBar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative z-50 w-64 h-full bg-white flex flex-col shadow-xl">
            <div className="flex items-center justify-between px-4 py-5 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Flower2 className="w-6 h-6 text-primary" />
                <span className="font-bold text-sm">Florería Perla</span>
              </div>
              <button onClick={() => setMobileOpen(false)}>
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            {nav}
          </aside>
        </div>
      )}
    </>
  );
}
