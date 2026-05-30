"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Copy, Check, Users, Plus } from "lucide-react";
import { toast } from "sonner";
import { useGroup } from "@/contexts/group-context";
import { createGroup, joinGroup } from "@/actions/groups";
import { groupSchema, joinGroupSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import type { z } from "zod";

type GroupForm = z.infer<typeof groupSchema>;
type JoinForm = z.infer<typeof joinGroupSchema>;

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function GroupsPage() {
  const {
    groups,
    activeGroup,
    members,
    setActiveGroupId,
    refreshGroups,
  } = useGroup();
  const [copied, setCopied] = useState(false);

  const createForm = useForm<GroupForm>({
    resolver: zodResolver(groupSchema),
    defaultValues: { name: "" },
  });

  const joinForm = useForm<JoinForm>({
    resolver: zodResolver(joinGroupSchema),
    defaultValues: { inviteCode: "" },
  });

  useEffect(() => {
    const join = new URLSearchParams(window.location.search).get("join");
    if (join) {
      joinForm.setValue("inviteCode", join.toUpperCase());
    }
  }, [joinForm]);

  const inviteLink =
    typeof window !== "undefined" && activeGroup
      ? `${window.location.origin}/dashboard/groups?join=${activeGroup.invite_code}`
      : "";

  const copyInvite = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(`${label} copied`);
    setTimeout(() => setCopied(false), 2000);
  };

  const onCreate = createForm.handleSubmit(async (values) => {
    const result = await createGroup(values.name);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Group created!");
    createForm.reset();
    await refreshGroups();
    if (result.data) setActiveGroupId(result.data.id);
  });

  const onJoin = joinForm.handleSubmit(async (values) => {
    const result = await joinGroup(values.inviteCode);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Joined group!");
    joinForm.reset();
    await refreshGroups();
    if (result.data) setActiveGroupId(result.data);
  });

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Groups</h2>
        <p className="text-sm text-muted-foreground">
          Create or join a household expense group
        </p>
      </div>

      {activeGroup && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {activeGroup.name}
            </CardTitle>
            <CardDescription>
              Invite your roommate with this code or link
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-lg bg-muted px-4 py-3 text-center text-lg font-mono font-bold tracking-widest">
                {activeGroup.invite_code}
              </code>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() =>
                  copyInvite(activeGroup.invite_code, "Invite code")
                }
                aria-label="Copy invite code"
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            {inviteLink && (
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => copyInvite(inviteLink, "Invite link")}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy invite link
              </Button>
            )}

            <Separator />

            <div>
              <p className="text-sm font-medium mb-3">Members</p>
              <ul className="space-y-2">
                {members.map((m) => (
                  <li
                    key={m.user_id}
                    className="flex items-center gap-3 rounded-lg border p-3"
                  >
                    <Avatar>
                      <AvatarFallback>
                        {initials(m.profile?.full_name ?? "?")}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">
                      {m.profile?.full_name ?? "Member"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {groups.length > 1 && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Switch group</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {groups.map((g) => (
              <Button
                key={g.id}
                variant={g.id === activeGroup?.id ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveGroupId(g.id)}
              >
                {g.name}
              </Button>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Plus className="h-4 w-4" />
            Create a new group
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onCreate} className="flex gap-2">
            <div className="flex-1 space-y-2">
              <Label htmlFor="groupName" className="sr-only">
                Group name
              </Label>
              <Input
                id="groupName"
                placeholder="Flat Expenses"
                {...createForm.register("name")}
              />
            </div>
            <Button type="submit" disabled={createForm.formState.isSubmitting}>
              Create
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Join with invite code</CardTitle>
          <CardDescription>
            Enter the 8-character code from your roommate
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onJoin} className="flex gap-2">
            <Input
              placeholder="ABCD1234"
              className="uppercase font-mono"
              {...joinForm.register("inviteCode")}
            />
            <Button type="submit" disabled={joinForm.formState.isSubmitting}>
              Join
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
