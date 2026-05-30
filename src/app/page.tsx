import Link from "next/link";
import {
  Wallet,
  Users,
  Zap,
  Shield,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Users,
    title: "Built for roommates",
    description:
      "Create a group, share an invite code, and track household spending together.",
  },
  {
    icon: Zap,
    title: "Updates in real time",
    description:
      "When your roommate adds an expense, you see it instantly—no refresh needed.",
  },
  {
    icon: Shield,
    title: "Fair & transparent",
    description:
      "Net-balance calculations show exactly who owes whom, in Pakistani Rupees.",
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-card/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Wallet className="h-5 w-5" />
            </div>
            <span className="font-bold text-lg">SplitFlat</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 py-20 text-center lg:py-28">
          <p className="mb-4 text-sm font-medium text-primary uppercase tracking-wide">
            Shared expense tracker
          </p>
          <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Split household bills fairly with your flatmates
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Track rent, groceries, utilities, and more. See who paid, who owes,
            and settle up with a clear monthly dashboard—in PKR.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" asChild className="gap-2">
              <Link href="/signup">
                Create free account
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">I have an account</Link>
            </Button>
          </div>
        </section>

        <section className="border-t bg-muted/30 py-20">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 md:grid-cols-3">
            {features.map(({ icon: Icon, title, description }) => (
              <Card key={title} className="shadow-sm">
                <CardContent className="p-6">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="font-semibold text-lg">{title}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <p>SplitFlat — simple shared expenses for roommates</p>
      </footer>
    </div>
  );
}
