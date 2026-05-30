"use client";

import { Toaster } from "sonner";
import { GroupProvider } from "@/contexts/group-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <GroupProvider>
      {children}
      <Toaster position="top-center" richColors closeButton />
    </GroupProvider>
  );
}
