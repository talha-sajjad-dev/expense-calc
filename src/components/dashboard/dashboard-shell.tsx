"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { Sidebar } from "./sidebar";
import { MobileNav } from "./mobile-nav";
import { Button } from "@/components/ui/button";
import { ExpenseFormDialog } from "@/components/expenses/expense-form-dialog";
import { useGroup } from "@/contexts/group-context";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

interface DashboardShellProps {
  children: React.ReactNode;
  title?: string;
  action?: React.ReactNode;
}

export function DashboardShell({
  children,
  title,
  action,
}: DashboardShellProps) {
  const pathname = usePathname();
  const { activeGroup, members, loading, userId, groups } = useGroup();
  const [expenseOpen, setExpenseOpen] = useState(false);
  const isGroupsPage = pathname.startsWith("/dashboard/groups");

  const memberProfiles = members
    .map((m) => m.profile)
    .filter((p): p is NonNullable<typeof p> => !!p);

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <div className="hidden lg:block w-64 border-r p-6 space-y-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="flex-1 p-6 space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!groups.length && !isGroupsPage) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-bold">Welcome to SplitFlat</h1>
        <p className="mt-2 max-w-md text-muted-foreground">
          Create a household group or join one with an invite code to start
          tracking shared expenses.
        </p>
        <Button className="mt-6" asChild>
          <Link href="/dashboard/groups">Set up your group</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-muted/30">
      {groups.length > 0 && <Sidebar />}

      <div className="flex flex-1 flex-col lg:pl-0 pb-20 lg:pb-0">
        <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur px-4 py-4 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground lg:hidden">
                {activeGroup?.name}
              </p>
              {title && (
                <h1 className="text-xl font-bold tracking-tight">{title}</h1>
              )}
            </div>
            <div className="flex items-center gap-2">
              {action}
              <Button
                className="hidden sm:flex gap-2"
                onClick={() => setExpenseOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Add expense
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 lg:px-8">{children}</main>
      </div>

      {groups.length > 0 && (
        <MobileNav onAddExpense={() => setExpenseOpen(true)} />
      )}

      {activeGroup && userId && memberProfiles.length > 0 && (
        <ExpenseFormDialog
          open={expenseOpen}
          onOpenChange={setExpenseOpen}
          groupId={activeGroup.id}
          members={memberProfiles}
        />
      )}
    </div>
  );
}
