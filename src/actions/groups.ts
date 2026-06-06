"use server";

import { createClient } from "@/lib/supabase/server";
import { notifyMemberJoined, sendGroupInviteEmail } from "@/lib/notifications";
import { scheduleNotification } from "@/lib/schedule-notification";
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

  scheduleNotification(() =>
    notifyMemberJoined({ groupId: data as string, joinerId: user.id })
  );

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/groups");
  return { data: data as string };
}

export async function inviteToGroupByEmail(groupId: string, email: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const trimmedEmail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    return { error: "Enter a valid email address" };
  }

  const { data: membership } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    return { error: "You are not a member of this group" };
  }

  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("name, invite_code")
    .eq("id", groupId)
    .single();

  if (groupError || !group) {
    return { error: "Group not found" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const result = await sendGroupInviteEmail({
    groupId,
    inviteCode: group.invite_code,
    inviterName: profile?.full_name ?? user.email?.split("@")[0] ?? "A roommate",
    recipientEmail: trimmedEmail,
  });

  if ("error" in result && result.error) {
    return { error: result.error };
  }

  if ("skipped" in result && result.skipped) {
    return {
      error:
        "Email is not configured. Add SMTP_USER and SMTP_PASS to your environment variables.",
    };
  }

  return { success: true };
}
