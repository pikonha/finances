import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { listAccounts } from "#/server/accounts";
import { createCategory, listCategories } from "#/server/categories";
import { listFaturas } from "#/server/faturas";
import {
  createTransaction,
  createTransfer,
  listTransactions,
} from "#/server/transactions";
import type { CreateTransactionInput, TransferInput } from "#/server/schemas";
import type { Category, Transaction } from "#/db/schema";
import { balanceOf } from "#/lib/money";
import {
  financeQueryKeys,
  newestTransactions,
  optimisticCategory,
  optimisticId,
  optimisticTransaction,
  optimisticTransfer,
} from "#/lib/optimistic";
import { DashboardCharts } from "@/components/DashboardCharts";
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
  const [showValues, setShowValues] = useState(true);
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
  const { data: faturas = [] } = useQuery({
    queryKey: ["faturas"],
    queryFn: () => listFaturas(),
  });
  const statsTransactions = transactions.filter(
    (
      transaction
    ): transaction is typeof transaction & { type: "earn" | "expend" } =>
      transaction.type !== "transfer"
  );
  const create = useMutation({
    mutationFn: (data: CreateTransactionInput) => createTransaction({ data }),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: financeQueryKeys.transactions });
      const previous = queryClient.getQueryData<Transaction[]>(
        financeQueryKeys.transactions,
      );
      queryClient.setQueryData<Transaction[]>(
        financeQueryKeys.transactions,
        (current = []) =>
          newestTransactions([optimisticTransaction(data), ...current]),
      );
      return { previous };
    },
    onError: (_error, _data, context) =>
      queryClient.setQueryData(financeQueryKeys.transactions, context?.previous),
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: financeQueryKeys.transactions }),
        queryClient.invalidateQueries({
          queryKey: financeQueryKeys.installmentPlans,
        }),
      ]),
  });
  const createCategoryMutation = useMutation({
    mutationFn: (name: string) => createCategory({ data: { name } }),
    onMutate: async (name) => {
      await queryClient.cancelQueries({ queryKey: financeQueryKeys.categories });
      const previous = queryClient.getQueryData<Category[]>(
        financeQueryKeys.categories,
      );
      const temporaryId = optimisticId();
      queryClient.setQueryData<Category[]>(
        financeQueryKeys.categories,
        (current = []) =>
          [...current, optimisticCategory(name, temporaryId)].sort((a, b) =>
            a.name.localeCompare(b.name),
          ),
      );
      return { previous, temporaryId };
    },
    onSuccess: ({ id }, _name, context) =>
      queryClient.setQueryData<Category[]>(
        financeQueryKeys.categories,
        (current = []) =>
          current.map((category) =>
            category.id === context?.temporaryId
              ? { ...category, id, userId: category.userId }
              : category,
          ),
      ),
    onError: (_error, _name, context) =>
      queryClient.setQueryData(financeQueryKeys.categories, context?.previous),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: financeQueryKeys.categories }),
  });
  const transfer = useMutation({
    mutationFn: (data: TransferInput) => createTransfer({ data }),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: financeQueryKeys.transactions });
      const previous = queryClient.getQueryData<Transaction[]>(
        financeQueryKeys.transactions,
      );
      queryClient.setQueryData<Transaction[]>(
        financeQueryKeys.transactions,
        (current = []) =>
          newestTransactions([optimisticTransfer(data), ...current]),
      );
      return { previous };
    },
    onError: (_error, _data, context) =>
      queryClient.setQueryData(financeQueryKeys.transactions, context?.previous),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: financeQueryKeys.transactions }),
  });
  const displayMoney = (cents: number) =>
    showValues ? money(cents) : "••••••";

  return (
    <main className="page-wrap rise-in py-6 sm:py-10">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-foreground">Visão geral</p>
          <h1 className="display-title text-3xl font-bold sm:text-4xl">
            Seu dinheiro, com clareza.
          </h1>
        </div>
        <div
          className="flex items-center gap-2"
          aria-label="Ações de transação"
        >
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setShowValues((current) => !current)}
            aria-pressed={!showValues}
            aria-label={showValues ? "Ocultar valores" : "Mostrar valores"}
            title={showValues ? "Ocultar valores" : "Mostrar valores"}
          >
            {showValues ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </Button>
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
              await transfer.mutateAsync(data);
            }}
          />
        </div>
      </div>
      <DashboardCharts
        transactions={transactions}
        categories={categories}
        faturas={faturas}
        showValues={showValues}
      />
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">
            Saldo total
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold sm:text-4xl">
            {displayMoney(balanceOf(statsTransactions))}
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
              className="flex justify-between gap-3 border-b pb-3 last:border-0"
            >
              <span className="min-w-0 truncate">
                {transaction.note ||
                  (transaction.type === "earn" ? "Receita" : "Despesa")}
              </span>
              <span
                className={`shrink-0 ${
                  transaction.type === "earn"
                    ? "text-emerald-600"
                    : "text-destructive"
                }`}
              >
                {transaction.type === "earn" ? "+" : "−"}
                {displayMoney(transaction.amount)}
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
