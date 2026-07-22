import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { listAccounts } from "#/server/accounts";
import { createCategory, listCategories } from "#/server/categories";
import {
  createTransaction,
  createTransfer,
  listTransactions,
} from "#/server/transactions";
import type { CreateTransactionInput } from "#/server/schemas";
import { balanceOf } from "#/lib/money";
import { TransactionModal } from "@/components/TransactionModal";
import { TransferModal } from "@/components/TransferModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authed/")({ component: Dashboard });

function money(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function Dashboard() {
  const queryClient = useQueryClient();
  const { data: transactions = [] } = useQuery({
    queryKey: ["transactions"],
    queryFn: () => listTransactions(),
  });
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => listCategories(),
  });
  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts"],
    queryFn: () => listAccounts(),
  });
  const statsTransactions = transactions.filter(
    (
      transaction
    ): transaction is typeof transaction & { type: "earn" | "expend" } =>
      transaction.type !== "transfer"
  );
  const create = useMutation({
    mutationFn: (data: CreateTransactionInput) => createTransaction({ data }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["transactions"] });
      void queryClient.invalidateQueries({ queryKey: ["installmentPlans"] });
    },
  });
  const createCategoryMutation = useMutation({
    mutationFn: (name: string) => createCategory({ data: { name } }),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });
  const refreshTransactions = async () => {
    await queryClient.invalidateQueries({ queryKey: ["transactions"] });
  };

  return (
    <main className="page-wrap rise-in py-10">
      <div className="mb-7 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">Visão geral</p>
          <h1 className="display-title text-4xl font-bold">
            Seu dinheiro, com clareza.
          </h1>
        </div>
        <div
          className="flex items-center gap-2"
          aria-label="Ações de transação"
        >
          <TransactionModal
            type="earn"
            accounts={accounts}
            categories={categories}
            onCreate={(data) => create.mutateAsync(data)}
            onCreateCategory={async (name) =>
              (await createCategoryMutation.mutateAsync(name)).id
            }
          />
          <TransactionModal
            type="expend"
            accounts={accounts}
            categories={categories}
            onCreate={(data) => create.mutateAsync(data)}
            onCreateCategory={async (name) =>
              (await createCategoryMutation.mutateAsync(name)).id
            }
          />
          <TransferModal
            compact
            accounts={accounts}
            onTransfer={async (data) => {
              await createTransfer({ data });
              await refreshTransactions();
            }}
          />
        </div>
      </div>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">
            Saldo total
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold">
            {money(balanceOf(statsTransactions))}
          </p>
          <Button asChild className="mt-6">
            <Link to="/transactions">
              Gerenciar transações <ArrowRight className="size-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Transações recentes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {transactions.slice(0, 10).map((transaction) => (
            <div
              key={transaction.id}
              className="flex justify-between border-b pb-3 last:border-0"
            >
              <span>
                {transaction.note ||
                  (transaction.type === "earn" ? "Receita" : "Despesa")}
              </span>
              <span
                className={
                  transaction.type === "earn"
                    ? "text-emerald-600"
                    : "text-destructive"
                }
              >
                {transaction.type === "earn" ? "+" : "−"}
                {money(transaction.amount)}
              </span>
            </div>
          ))}
          {!transactions.length && (
            <p className="text-muted-foreground">Nenhuma transação ainda.</p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
