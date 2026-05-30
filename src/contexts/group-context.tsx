"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";
import type { Group, GroupMember, Profile } from "@/lib/types";

const ACTIVE_GROUP_KEY = "expense-calc-active-group";

interface GroupContextValue {
  groups: Group[];
  activeGroup: Group | null;
  members: (GroupMember & { profile?: Profile })[];
  profile: Profile | null;
  userId: string | null;
  loading: boolean;
  setActiveGroupId: (id: string) => void;
  refreshGroups: () => Promise<void>;
  refreshMembers: () => Promise<void>;
}

const GroupContext = createContext<GroupContextValue | null>(null);

export function GroupProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeGroupId, setActiveGroupIdState] = useState<string | null>(null);
  const [members, setMembers] = useState<(GroupMember & { profile?: Profile })[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const activeGroup = useMemo(
    () => groups.find((g) => g.id === activeGroupId) ?? null,
    [groups, activeGroupId]
  );

  const refreshGroups = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: memberships } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("user_id", user.id);

    if (!memberships?.length) {
      setGroups([]);
      return;
    }

    const groupIds = memberships.map((m) => m.group_id);
    const { data: groupData } = await supabase
      .from("groups")
      .select("*")
      .in("id", groupIds)
      .order("created_at", { ascending: true });

    setGroups((groupData as Group[]) ?? []);
  }, [supabase]);

  const refreshMembers = useCallback(async () => {
    if (!activeGroupId) {
      setMembers([]);
      return;
    }

    const { data } = await supabase
      .from("group_members")
      .select("*, profile:profiles(*)")
      .eq("group_id", activeGroupId);

    const mapped = (data ?? []).map((row) => {
      const r = row as GroupMember & { profile: Profile };
      return { ...r, profile: r.profile };
    });
    setMembers(mapped);
  }, [supabase, activeGroupId]);

  const setActiveGroupId = useCallback((id: string) => {
    setActiveGroupIdState(id);
    if (typeof window !== "undefined") {
      localStorage.setItem(ACTIVE_GROUP_KEY, id);
    }
  }, []);

  useEffect(() => {
    async function init() {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      setUserId(user.id);

      await supabase.rpc("ensure_profile");

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setProfile(profileData as Profile);

      const { data: memberships } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", user.id);

      if (memberships?.length) {
        const groupIds = memberships.map((m) => m.group_id);
        const { data: groupData } = await supabase
          .from("groups")
          .select("*")
          .in("id", groupIds)
          .order("created_at", { ascending: true });

        const loaded = (groupData as Group[]) ?? [];
        setGroups(loaded);

        const stored =
          typeof window !== "undefined"
            ? localStorage.getItem(ACTIVE_GROUP_KEY)
            : null;
        const validStored = loaded.find((g) => g.id === stored);
        setActiveGroupIdState(validStored?.id ?? loaded[0]?.id ?? null);
      }

      setLoading(false);
    }

    init();
  }, [supabase]);

  useEffect(() => {
    if (!activeGroupId) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("group_members")
        .select("*, profile:profiles(*)")
        .eq("group_id", activeGroupId);
      if (cancelled) return;
      const mapped = (data ?? []).map((row) => {
        const r = row as GroupMember & { profile: Profile };
        return { ...r, profile: r.profile };
      });
      setMembers(mapped);
    })();
    return () => {
      cancelled = true;
    };
  }, [activeGroupId, supabase]);

  useEffect(() => {
    if (!activeGroupId) return;

    const channel = supabase
      .channel(`group-members-${activeGroupId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "group_members",
          filter: `group_id=eq.${activeGroupId}`,
        },
        () => {
          refreshMembers();
          refreshGroups();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeGroupId, supabase, refreshMembers, refreshGroups]);

  const value: GroupContextValue = {
    groups,
    activeGroup,
    members,
    profile,
    userId,
    loading,
    setActiveGroupId,
    refreshGroups,
    refreshMembers,
  };

  return (
    <GroupContext.Provider value={value}>{children}</GroupContext.Provider>
  );
}

export function useGroup() {
  const ctx = useContext(GroupContext);
  if (!ctx) throw new Error("useGroup must be used within GroupProvider");
  return ctx;
}
