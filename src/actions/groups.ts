"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createGroup(name: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  await supabase.rpc("ensure_profile");

  const { data: group, error } = await supabase.rpc("create_group", {
    p_name: name.trim(),
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/groups");
  return { data: group };
}

export async function joinGroup(inviteCode: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  await supabase.rpc("ensure_profile");

  const { data, error } = await supabase.rpc("join_group_by_invite", {
    p_invite_code: inviteCode.trim(),
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/groups");
  return { data: data as string };
}
