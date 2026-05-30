"use client";

import { HandCoins, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPKR } from "@/lib/currency";
import type { Transfer } from "@/lib/balances";
import type { Profile } from "@/lib/types";

interface SettlementCardProps {
  transfers: Transfer[];
  profiles: Record<string, Profile>;
  currentUserId: string;
}

export function SettlementCard({
  transfers,
  profiles,
  currentUserId,
}: SettlementCardProps) {
  const name = (id: string) => profiles[id]?.full_name ?? "Someone";

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <HandCoins className="h-5 w-5 text-primary" />
          Settlement
        </CardTitle>
      </CardHeader>
      <CardContent>
        {transfers.length === 0 ? (
          <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-4">
            <CheckCircle2 className="h-8 w-8 text-emerald-600 shrink-0" />
            <div>
              <p className="font-medium">Everyone is settled up</p>
              <p className="text-sm text-muted-foreground">
                No payments needed for this month.
              </p>
            </div>
          </div>
        ) : (
          <ul className="space-y-3">
            {transfers.map((t, i) => (
              <li
                key={`${t.fromId}-${t.toId}-${i}`}
                className="rounded-lg border bg-card p-4 text-center shadow-sm"
              >
                <p className="text-lg font-semibold tracking-tight">
                  <span
                    className={
                      t.fromId === currentUserId ? "text-amber-700" : ""
                    }
                  >
                    {name(t.fromId)}
                  </span>{" "}
                  pays{" "}
                  <span
                    className={
                      t.toId === currentUserId ? "text-emerald-700" : ""
                    }
                  >
                    {name(t.toId)}
                  </span>{" "}
                  <span className="text-primary">{formatPKR(t.amountMinor)}</span>
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
