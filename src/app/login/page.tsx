import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { Skeleton } from "@/components/ui/skeleton";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center p-4">
          <Skeleton className="h-96 w-full max-w-md rounded-xl" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
