"use client";

import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  PiggyBank,
  Scale,
  Wallet,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatPKR } from "@/lib/currency";
import { cn } from "@/lib/utils";

interface SummaryCardsProps {
  totalMinor: number;
  userPaidMinor: number;
  userShareMinor: number;
  userBalance: number;
}

export function SummaryCards({
  totalMinor,
  userPaidMinor,
  userShareMinor,
  userBalance,
}: SummaryCardsProps) {
  const balanceState =
    userBalance > 0 ? "receive" : userBalance < 0 ? "owe" : "settled";

  const cards = [
    {
      label: "Total expenses",
      value: formatPKR(totalMinor),
      icon: Wallet,
      desc: "Group spending this month",
    },
    {
      label: "You paid",
      value: formatPKR(userPaidMinor),
      icon: PiggyBank,
      desc: "Amount you covered",
    },
    {
      label: "Your share",
      value: formatPKR(userShareMinor),
      icon: Scale,
      desc: "Your fair portion",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ label, value, icon: Icon, desc }) => (
        <Card key={label} className="shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
              </div>
              <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <Card
        className={cn(
          "shadow-sm border-2",
          balanceState === "receive" && "border-emerald-200 bg-emerald-50/50",
          balanceState === "owe" && "border-amber-200 bg-amber-50/50",
          balanceState === "settled" && "border-muted"
        )}
      >
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Your balance</p>
              {balanceState === "receive" && (
                <>
                  <p className="mt-1 flex items-center gap-1.5 text-lg font-bold text-emerald-700">
                    <ArrowDownLeft className="h-5 w-5" aria-hidden />
                    You should receive {formatPKR(userBalance)}
                  </p>
                  <p className="mt-1 text-xs text-emerald-600">Others owe you</p>
                </>
              )}
              {balanceState === "owe" && (
                <>
                  <p className="mt-1 flex items-center gap-1.5 text-lg font-bold text-amber-800">
                    <ArrowUpRight className="h-5 w-5" aria-hidden />
                    You need to pay {formatPKR(Math.abs(userBalance))}
                  </p>
                  <p className="mt-1 text-xs text-amber-700">You owe the group</p>
                </>
              )}
              {balanceState === "settled" && (
                <>
                  <p className="mt-1 flex items-center gap-1.5 text-lg font-bold">
                    <CheckCircle2 className="h-5 w-5 text-muted-foreground" aria-hidden />
                    You are settled up
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">All even</p>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
