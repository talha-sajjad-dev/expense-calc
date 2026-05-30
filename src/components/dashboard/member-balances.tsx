"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatPKR } from "@/lib/currency";
import type { MemberStats } from "@/lib/balances";
import type { Profile } from "@/lib/types";

interface MemberBalancesProps {
  stats: MemberStats[];
  profiles: Record<string, Profile>;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function MemberBalances({ stats, profiles }: MemberBalancesProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Member balances</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {stats.map((s) => {
          const profile = profiles[s.userId];
          const name = profile?.full_name ?? "Member";
          const bal = s.netBalanceMinor;

          return (
            <div
              key={s.userId}
              className="flex flex-col gap-2 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>{initials(name)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{name}</p>
                  <p className="text-xs text-muted-foreground">
                    Paid {formatPKR(s.totalPaidMinor)} · Share{" "}
                    {formatPKR(s.totalShareMinor)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {bal > 0 && (
                  <Badge variant="success">
                    Receives {formatPKR(bal)}
                  </Badge>
                )}
                {bal < 0 && (
                  <Badge variant="warning">
                    Owes {formatPKR(Math.abs(bal))}
                  </Badge>
                )}
                {bal === 0 && (
                  <Badge variant="secondary">Settled</Badge>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
