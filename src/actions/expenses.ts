"use server";

import { createClient } from "@/lib/supabase/server";
import { parseRupeesInput } from "@/lib/currency";
import { revalidatePath } from "next/cache";
import type { ExpenseCategory } from "@/lib/constants";

export interface ExpenseInput {
  groupId: string;
  title: string;
  amountRupees: string;
  category: ExpenseCategory;
  expenseDate: string;
  paidBy: string;
  participantIds: string[];
  notes?: string;
}

async function upsertParticipants(
  supabase: Awaited<ReturnType<typeof createClient>>,
  expenseId: string,
  participantIds: string[]
) {
  await supabase
    .from("expense_participants")
    .delete()
    .eq("expense_id", expenseId);

  if (participantIds.length > 0) {
    const { error } = await supabase.from("expense_participants").insert(
      participantIds.map((user_id) => ({
        expense_id: expenseId,
        user_id,
      }))
    );
    if (error) throw new Error(error.message);
  }
}

export async function createExpense(input: ExpenseInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const amountMinor = parseRupeesInput(input.amountRupees);
  if (!amountMinor) return { error: "Enter a valid amount" };

  const { data: expense, error } = await supabase
    .from("expenses")
    .insert({
      group_id: input.groupId,
      paid_by: input.paidBy,
      title: input.title.trim(),
      notes: input.notes?.trim() || null,
      category: input.category,
      amount_minor: amountMinor,
      expense_date: input.expenseDate,
      created_by: user.id,
    })
    .select()
    .single();

  if (error || !expense) {
    return { error: error?.message ?? "Failed to create expense" };
  }

  try {
    await upsertParticipants(supabase, expense.id, input.participantIds);
  } catch (e) {
    await supabase.from("expenses").delete().eq("id", expense.id);
    return { error: e instanceof Error ? e.message : "Failed to add participants" };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/expenses");
  return { data: expense };
}

export async function updateExpense(
  expenseId: string,
  input: ExpenseInput
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const amountMinor = parseRupeesInput(input.amountRupees);
  if (!amountMinor) return { error: "Enter a valid amount" };

  const { data: expense, error } = await supabase
    .from("expenses")
    .update({
      paid_by: input.paidBy,
      title: input.title.trim(),
      notes: input.notes?.trim() || null,
      category: input.category,
      amount_minor: amountMinor,
      expense_date: input.expenseDate,
    })
    .eq("id", expenseId)
    .eq("created_by", user.id)
    .select()
    .single();

  if (error || !expense) {
    return { error: error?.message ?? "Failed to update expense" };
  }

  try {
    await upsertParticipants(supabase, expense.id, input.participantIds);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to update participants" };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/expenses");
  return { data: expense };
}

export async function deleteExpense(expenseId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("expenses")
    .delete()
    .eq("id", expenseId)
    .eq("created_by", user.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/expenses");
  return { success: true };
}
