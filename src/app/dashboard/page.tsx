"use client";

import { useMemo } from "react";
import { useGroup } from "@/contexts/group-context";
import { useGroupExpenses } from "@/hooks/use-group-expenses";
import { useMonth } from "@/hooks/use-month";
import { getDashboardStats } from "@/lib/dashboard-stats";
import { MonthSelector } from "@/components/dashboard/month-selector";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { SettlementCard } from "@/components/dashboard/settlement-card";
import { CategoryBreakdown } from "@/components/dashboard/category-breakdown";
import { MemberBalances } from "@/components/dashboard/member-balances";
import { RecentExpenses } from "@/components/expenses/recent-expenses";
import { Skeleton } from "@/components/ui/skeleton";
import type { Profile } from "@/lib/types";

export default function DashboardPage() {
  const { activeGroup, members, userId } = useGroup();
  const { expenses, loading } = useGroupExpenses(activeGroup?.id ?? null);
  const { year, month, label, goPrev, goNext, goToday } = useMonth();

  const memberIds = members.map((m) => m.user_id);
  const profileMap = useMemo(() => {
    const map: Record<string, Profile> = {};
    members.forEach((m) => {
      if (m.profile) map[m.user_id] = m.profile;
    });
    return map;
  }, [members]);

  const stats = useMemo(() => {
    if (!userId) return null;
    return getDashboardStats(expenses, memberIds, userId, year, month);
  }, [expenses, memberIds, userId, year, month]);

  if (!activeGroup || !userId) return null;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight hidden lg:block">
            Dashboard
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            {activeGroup.name} · Monthly overview
          </p>
        </div>
        <MonthSelector
          label={label}
          onPrev={goPrev}
          onNext={goNext}
          onToday={goToday}
        />
      </div>

      {loading || !stats ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          <SummaryCards
            totalMinor={stats.totalMinor}
            userPaidMinor={stats.userPaidMinor}
            userShareMinor={stats.userShareMinor}
            userBalance={stats.userBalance}
          />

          <div className="grid gap-6 lg:grid-cols-2">
            <SettlementCard
              transfers={stats.transfers}
              profiles={profileMap}
              currentUserId={userId}
            />
            <CategoryBreakdown
              breakdown={stats.breakdown}
              totalMinor={stats.totalMinor}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <RecentExpenses expenses={stats.monthly} />
            <MemberBalances stats={stats.memberStats} profiles={profileMap} />
          </div>
        </>
      )}
    </div>
  );
}
