"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
  Users,
  Settings,
  Wallet,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { signOut } from "@/actions/auth";
import { useGroup } from "@/contexts/group-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/expenses", label: "Expenses", icon: Receipt },
  { href: "/dashboard/groups", label: "Groups", icon: Users },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { groups, activeGroup, setActiveGroupId } = useGroup();

  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:bg-card lg:shadow-sm">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Wallet className="h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold leading-tight">SplitFlat</p>
          <p className="text-xs text-muted-foreground">Shared expenses</p>
        </div>
      </div>

      {groups.length > 0 && (
        <div className="border-b px-4 py-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Active group
          </p>
          {groups.length === 1 ? (
            <p className="truncate text-sm font-medium">
              {activeGroup?.name ?? "—"}
            </p>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between font-normal"
                >
                  <span className="truncate">{activeGroup?.name ?? "Select"}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="start">
                <DropdownMenuLabel>Your groups</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {groups.map((g) => (
                  <DropdownMenuItem
                    key={g.id}
                    onClick={() => setActiveGroupId(g.id)}
                    className={cn(g.id === activeGroup?.id && "bg-accent")}
                  >
                    {g.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )}

      <nav className="flex-1 space-y-1 p-4">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/dashboard"
              ? pathname === href
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-4">
        <form action={signOut}>
          <Button
            type="submit"
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </Button>
        </form>
      </div>
    </aside>
  );
}
