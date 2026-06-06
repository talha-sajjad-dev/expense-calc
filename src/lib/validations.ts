import { z } from "zod";
import { EXPENSE_CATEGORIES } from "./constants";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const signupSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const profileSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
});

export const groupSchema = z.object({
  name: z.string().min(2, "Group name must be at least 2 characters"),
});

export const joinGroupSchema = z.object({
  inviteCode: z
    .string()
    .min(4, "Enter a valid invite code")
    .transform((v) => v.trim().toUpperCase()),
});

export const inviteEmailSchema = z.object({
  email: z.string().email("Enter a valid email"),
});

export const expenseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  amount: z.string().min(1, "Amount is required"),
  category: z.enum(EXPENSE_CATEGORIES),
  expenseDate: z.string().min(1, "Date is required"),
  paidBy: z.string().uuid("Select who paid"),
  participantIds: z
    .array(z.string().uuid())
    .min(1, "Select at least one participant"),
  notes: z.string().optional(),
});

export type ExpenseFormValues = z.infer<typeof expenseSchema>;
