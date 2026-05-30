"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
  Users,
  Settings,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/dashboard/expenses", label: "Expenses", icon: Receipt },
  { href: "__add__", label: "Add", icon: Plus, highlight: true },
  { href: "/dashboard/groups", label: "Groups", icon: Users },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

interface MobileNavProps {
  onAddExpense: () => void;
}

export function MobileNav({ onAddExpense }: MobileNavProps) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:hidden">
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 pb-[env(safe-area-inset-bottom)] pt-2">
        {items.map(({ href, label, icon: Icon, highlight }) => {
          if (highlight) {
            return (
              <button
                key={href}
                type="button"
                onClick={onAddExpense}
                className="flex flex-col items-center gap-1"
                aria-label="Add expense"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
                  <Icon className="h-6 w-6" />
                </span>
                <span className="text-[10px] font-medium text-primary">
                  {label}
                </span>
              </button>
            );
          }

          const active =
            href === "/dashboard"
              ? pathname === href
              : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1 text-[10px] font-medium",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
