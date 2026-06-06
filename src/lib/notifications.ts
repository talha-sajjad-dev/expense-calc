import { formatPKR } from "@/lib/currency";
import { getAppUrl, sendEmail, sendEmailToMany } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/admin";

interface UserContact {
  id: string;
  email: string;
  fullName: string;
}

function getAdminOrWarn() {
  const admin = createAdminClient();
  if (!admin) {
    console.warn(
      "[notifications] SUPABASE_SERVICE_ROLE_KEY not set — cannot load group/member data"
    );
  }
  return admin;
}

async function resolveContacts(userIds: string[]): Promise<UserContact[]> {
  const uniqueIds = [...new Set(userIds)];
  if (uniqueIds.length === 0) return [];

  const admin = getAdminOrWarn();
  if (!admin) return [];

  const { data: profiles, error } = await admin
    .from("profiles")
    .select("id, full_name, email")
    .in("id", uniqueIds);

  if (error) {
    console.error("[notifications] profile lookup failed:", error.message);
    return [];
  }

  const contacts: UserContact[] = [];

  for (const profile of profiles ?? []) {
    let email = profile.email as string | null;

    if (!email) {
      const { data } = await admin.auth.admin.getUserById(profile.id);
      email = data.user?.email ?? null;
      if (email) {
        await admin
          .from("profiles")
          .update({ email })
          .eq("id", profile.id);
      }
    }

    if (!email) {
      console.warn("[notifications] no email for user", profile.id);
      continue;
    }

    contacts.push({
      id: profile.id,
      email,
      fullName: profile.full_name as string,
    });
  }

  return contacts;
}

function emailLayout(
  title: string,
  body: string,
  cta?: { label: string; href: string }
) {
  const ctaBlock = cta
    ? `<p style="margin:24px 0 0"><a href="${cta.href}" style="display:inline-block;background:#0f172a;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">${cta.label}</a></p>`
    : "";

  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:520px;background:#fff;border-radius:12px;border:1px solid #e2e8f0;padding:32px">
          <tr>
            <td>
              <p style="margin:0 0 8px;font-size:13px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.05em">SplitFlat</p>
              <h1 style="margin:0 0 16px;font-size:22px;color:#0f172a">${title}</h1>
              <div style="font-size:15px;line-height:1.6;color:#334155">${body}</div>
              ${ctaBlock}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function notifyExpenseCreated(params: {
  groupId: string;
  creatorId: string;
  creatorName: string;
  title: string;
  amountMinor: number;
  category: string;
  expenseDate: string;
}) {
  const admin = getAdminOrWarn();
  if (!admin) return;

  const [{ data: group }, { data: members, error: membersError }] =
    await Promise.all([
      admin.from("groups").select("name").eq("id", params.groupId).single(),
      admin
        .from("group_members")
        .select("user_id")
        .eq("group_id", params.groupId),
    ]);

  if (membersError) {
    console.error("[notifications] members lookup failed:", membersError.message);
    return;
  }

  const memberIds = (members ?? [])
    .map((m) => m.user_id)
    .filter((id) => id !== params.creatorId);

  if (memberIds.length === 0) {
    console.log(
      "[notifications] expense created — no other members to notify in group",
      params.groupId
    );
    return;
  }

  const contacts = await resolveContacts(memberIds);
  if (contacts.length === 0) {
    console.warn(
      "[notifications] expense created — members found but no emails resolved",
      memberIds
    );
    return;
  }

  const groupName = group?.name ?? "your group";
  const amount = formatPKR(params.amountMinor);
  const appUrl = getAppUrl();

  const body = `
    <p><strong>${params.creatorName}</strong> added a new expense in <strong>${groupName}</strong>:</p>
    <table style="margin:16px 0;width:100%;border-collapse:collapse">
      <tr><td style="padding:8px 0;color:#64748b">Title</td><td style="padding:8px 0;font-weight:600">${params.title}</td></tr>
      <tr><td style="padding:8px 0;color:#64748b">Amount</td><td style="padding:8px 0;font-weight:600">${amount}</td></tr>
      <tr><td style="padding:8px 0;color:#64748b">Category</td><td style="padding:8px 0">${params.category}</td></tr>
      <tr><td style="padding:8px 0;color:#64748b">Date</td><td style="padding:8px 0">${params.expenseDate}</td></tr>
    </table>
    <p style="color:#64748b;font-size:13px">You're receiving this because you're a member of ${groupName}.</p>
  `;

  await sendEmailToMany(
    contacts.map((c) => c.email),
    `New expense: ${params.title} (${amount})`,
    emailLayout("New shared expense", body, {
      label: "View expenses",
      href: `${appUrl}/dashboard/expenses`,
    })
  );
}

export async function notifyMemberJoined(params: {
  groupId: string;
  joinerId: string;
}) {
  const admin = getAdminOrWarn();
  if (!admin) return;

  const [{ data: group }, { data: members, error: membersError }] =
    await Promise.all([
      admin.from("groups").select("name").eq("id", params.groupId).single(),
      admin
        .from("group_members")
        .select("user_id")
        .eq("group_id", params.groupId),
    ]);

  if (membersError) {
    console.error("[notifications] members lookup failed:", membersError.message);
    return;
  }

  const memberIds = (members ?? [])
    .map((m) => m.user_id)
    .filter((id) => id !== params.joinerId);

  const [joinerContacts, memberContacts] = await Promise.all([
    resolveContacts([params.joinerId]),
    resolveContacts(memberIds),
  ]);

  const joinerName = joinerContacts[0]?.fullName ?? "Someone";
  const contacts = memberContacts;

  if (contacts.length === 0) {
    console.log(
      "[notifications] member joined — no existing members to notify",
      params.groupId
    );
    return;
  }

  const groupName = group?.name ?? "your group";
  const appUrl = getAppUrl();

  const body = `
    <p><strong>${joinerName}</strong> joined <strong>${groupName}</strong> on SplitFlat.</p>
    <p>They can now view shared expenses and add their own. Open the dashboard to see updated member balances.</p>
  `;

  await sendEmailToMany(
    contacts.map((c) => c.email),
    `${joinerName} joined ${groupName}`,
    emailLayout("New group member", body, {
      label: "Open dashboard",
      href: `${appUrl}/dashboard`,
    })
  );
}

export async function sendGroupInviteEmail(params: {
  groupId: string;
  inviteCode: string;
  inviterName: string;
  recipientEmail: string;
}) {
  const admin = getAdminOrWarn();
  if (!admin) {
    return { skipped: true as const };
  }

  const { data: group } = await admin
    .from("groups")
    .select("name")
    .eq("id", params.groupId)
    .single();

  const groupName = group?.name ?? "a shared expense group";
  const appUrl = getAppUrl();
  const inviteLink = `${appUrl}/dashboard/groups?join=${params.inviteCode}`;

  const body = `
    <p><strong>${params.inviterName}</strong> invited you to join <strong>${groupName}</strong> on SplitFlat — a shared expense tracker for roommates.</p>
    <p>Your invite code: <strong style="font-family:monospace;letter-spacing:0.1em">${params.inviteCode}</strong></p>
    <p>Sign up or log in, then join with the code above or use the button below.</p>
  `;

  return sendEmail({
    to: params.recipientEmail,
    subject: `${params.inviterName} invited you to ${groupName}`,
    html: emailLayout("You're invited!", body, {
      label: "Join group",
      href: inviteLink,
    }),
  });
}
