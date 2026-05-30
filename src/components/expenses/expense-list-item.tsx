"use client";

import { format, parseISO } from "date-fns";
import { Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { formatPKR } from "@/lib/currency";
import { deleteExpense } from "@/actions/expenses";
import { toast } from "sonner";
import type { ExpenseWithDetails } from "@/lib/types";

interface ExpenseListItemProps {
  expense: ExpenseWithDetails;
  currentUserId: string;
  onEdit: (expense: ExpenseWithDetails) => void;
  onDeleted: () => void;
}

export function ExpenseListItem({
  expense,
  currentUserId,
  onEdit,
  onDeleted,
}: ExpenseListItemProps) {
  const canModify = expense.created_by === currentUserId;
  const payerName = expense.payer?.full_name ?? "Someone";
  const participants =
    expense.participant_profiles?.map((p) => p.full_name).join(", ") ?? "";

  const handleDelete = async () => {
    const result = await deleteExpense(expense.id);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Expense deleted");
    onDeleted();
  };

  return (
    <article className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold truncate">{expense.title}</h3>
          <Badge variant="secondary">{expense.category}</Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {format(parseISO(expense.expense_date), "MMM d, yyyy")} · Paid by{" "}
          {payerName}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Split: {participants}
        </p>
        {expense.notes && (
          <p className="mt-1 text-xs text-muted-foreground italic">
            {expense.notes}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <p className="text-lg font-bold text-primary whitespace-nowrap">
          {formatPKR(expense.amount_minor)}
        </p>
        {canModify && (
          <div className="flex gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onEdit(expense)}
              aria-label="Edit expense"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Delete expense"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete expense?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently remove &quot;{expense.title}&quot; from
                    your group. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>
    </article>
  );
}
