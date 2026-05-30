"use client";

import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EXPENSE_CATEGORIES } from "@/lib/constants";
import { expenseSchema, type ExpenseFormValues } from "@/lib/validations";
import { createExpense, updateExpense } from "@/actions/expenses";
import { minorToRupees } from "@/lib/currency";
import type { ExpenseWithDetails, Profile } from "@/lib/types";

interface ExpenseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  members: Profile[];
  expense?: ExpenseWithDetails | null;
  onSuccess?: () => void;
}

export function ExpenseFormDialog({
  open,
  onOpenChange,
  groupId,
  members,
  expense,
  onSuccess,
}: ExpenseFormDialogProps) {
  const isEdit = !!expense;

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      title: "",
      amount: "",
      category: "Other",
      expenseDate: format(new Date(), "yyyy-MM-dd"),
      paidBy: members[0]?.id ?? "",
      participantIds: members.map((m) => m.id),
      notes: "",
    },
  });

  useEffect(() => {
    if (open) {
      if (expense) {
        form.reset({
          title: expense.title,
          amount: String(minorToRupees(expense.amount_minor)),
          category: expense.category,
          expenseDate: expense.expense_date,
          paidBy: expense.paid_by,
          participantIds: expense.participants.map((p) => p.user_id),
          notes: expense.notes ?? "",
        });
      } else {
        form.reset({
          title: "",
          amount: "",
          category: "Other",
          expenseDate: format(new Date(), "yyyy-MM-dd"),
          paidBy: members[0]?.id ?? "",
          participantIds: members.map((m) => m.id),
          notes: "",
        });
      }
    }
  }, [open, expense, members, form]);

  const participantIds =
    useWatch({
      control: form.control,
      name: "participantIds",
      defaultValue: members.map((m) => m.id),
    }) ?? [];

  const category = useWatch({ control: form.control, name: "category" });
  const paidBy = useWatch({ control: form.control, name: "paidBy" });

  const toggleParticipant = (id: string, checked: boolean) => {
    const current = form.getValues("participantIds");
    if (checked) {
      form.setValue("participantIds", [...new Set([...current, id])]);
    } else {
      const next = current.filter((x) => x !== id);
      if (next.length === 0) {
        toast.error("At least one participant is required");
        return;
      }
      form.setValue("participantIds", next);
    }
  };

  const onSubmit = form.handleSubmit(async (values) => {
    const payload = {
      groupId,
      title: values.title,
      amountRupees: values.amount,
      category: values.category,
      expenseDate: values.expenseDate,
      paidBy: values.paidBy,
      participantIds: values.participantIds,
      notes: values.notes,
    };

    const result = isEdit
      ? await updateExpense(expense!.id, payload)
      : await createExpense(payload);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(isEdit ? "Expense updated" : "Expense added");
    onOpenChange(false);
    onSuccess?.();
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit expense" : "Add expense"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" {...form.register("title")} placeholder="Rent" />
            {form.formState.errors.title && (
              <p className="text-xs text-destructive">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (PKR)</Label>
              <Input
                id="amount"
                type="text"
                inputMode="decimal"
                {...form.register("amount")}
                placeholder="10000"
              />
              {form.formState.errors.amount && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.amount.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="expenseDate">Date</Label>
              <Input
                id="expenseDate"
                type="date"
                {...form.register("expenseDate")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={category}
              onValueChange={(v) =>
                form.setValue("category", v as ExpenseFormValues["category"])
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXPENSE_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Paid by</Label>
            <Select
              value={paidBy}
              onValueChange={(v) => form.setValue("paidBy", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Shared with</Label>
            <div className="space-y-2 rounded-lg border p-3">
              {members.map((m) => (
                <label
                  key={m.id}
                  className="flex cursor-pointer items-center gap-3"
                >
                  <Checkbox
                    checked={participantIds.includes(m.id)}
                    onCheckedChange={(c) =>
                      toggleParticipant(m.id, c === true)
                    }
                  />
                  <span className="text-sm">{m.full_name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea id="notes" {...form.register("notes")} rows={2} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting
                ? "Saving..."
                : isEdit
                  ? "Save changes"
                  : "Add expense"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
