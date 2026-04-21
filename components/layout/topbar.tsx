"use client";

import { signOut } from "next-auth/react";
import { LogOut, User } from "lucide-react";
import type { Session } from "next-auth";
import Link from "next/link";

interface TopBarProps {
  user: Session["user"];
}

export function TopBar({ user }: TopBarProps) {
  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-6 flex-shrink-0">
      {/* Mobile logo */}
      <span className="md:hidden font-bold text-primary text-sm">
        Florería Perla
      </span>

      <div className="hidden md:block" />

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </div>
          <div className="hidden sm:block">
            <p className="font-medium text-gray-900 leading-tight">{user?.name}</p>
            <p className="text-xs text-gray-500">{(user as any)?.role === "OWNER" ? "Propietario" : "Empleado"}</p>
          </div>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors px-2 py-1.5 rounded-lg hover:bg-gray-100"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Salir</span>
        </button>
      </div>
    </header>
  );
}
