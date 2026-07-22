import { Link, useRouter } from "@tanstack/react-router";
import { LogOut, WalletCards } from "lucide-react";
import { authClient } from "#/lib/auth-client";
import { Button } from "./ui/button";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-lg">
      <nav className="page-wrap flex min-h-14 flex-wrap items-center gap-5 py-2">
        <Link
          to="/"
          className="flex items-center gap-2 font-semibold text-foreground no-underline"
        >
          <WalletCards className="size-5 text-primary" /> Finances
        </Link>
        {session?.user && (
          <div className="flex flex-1 flex-wrap items-center gap-4 text-sm font-medium">
            <Link
              to="/"
              className="nav-link"
              activeProps={{ className: "nav-link is-active" }}
            >
              Painel
            </Link>
            <Link
              to="/transactions"
              className="nav-link"
              activeProps={{ className: "nav-link is-active" }}
            >
              Transações
            </Link>
            <Link
              to="/accounts"
              className="nav-link"
              activeProps={{ className: "nav-link is-active" }}
            >
              Contas
            </Link>
            <Link
              to="/faturas"
              className="nav-link"
              activeProps={{ className: "nav-link is-active" }}
            >
              Faturas
            </Link>
          </div>
        )}
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          {session?.user && (
            <>
              <span className="hidden text-xs text-muted-foreground md:inline">
                {session.user.email}
              </span>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Sair"
                onClick={async () => {
                  await authClient.signOut();
                  await router.invalidate();
                  await router.navigate({ to: "/login" });
                }}
              >
                <LogOut className="size-4" />
              </Button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
