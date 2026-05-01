"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, CalendarDays, FileText, LayoutDashboard } from "lucide-react";

const tabs = [
  { href: "/",          label: "Dashboard", Icon: LayoutDashboard },
  { href: "/customers", label: "Customers", Icon: Users            },
  { href: "/schedule",  label: "Schedule",  Icon: CalendarDays     },
  { href: "/invoices",  label: "Invoices",  Icon: FileText         },
];

export default function BottomNav() {
  const path = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#ede8df] z-50">
      <div className="max-w-lg mx-auto flex">
        {tabs.map(({ href, label, Icon }) => {
          const active = href === "/" ? path === "/" : path.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center py-2 gap-0.5 text-[10px] font-medium transition-colors ${
                active ? "text-[#C9A96E]" : "text-gray-300"
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.2 : 1.7} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
