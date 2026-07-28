import type { Account, Category, Transaction } from "#/db/schema";
import type {
  CreateTransactionInput,
  TransferInput,
} from "#/server/schemas";

export const financeQueryKeys = {
  accounts: ["accounts"] as const,
  categories: ["categories"] as const,
  faturas: ["faturas"] as const,
  installmentPlans: ["installmentPlans"] as const,
  transactions: ["transactions"] as const,
};

export const liveFinanceQuery = {
  refetchInterval: 2_000,
  refetchIntervalInBackground: true,
  staleTime: 1_000,
} as const;

export function optimisticId() {
  return `optimistic-${crypto.randomUUID()}`;
}

export function optimisticTransaction(
  input: CreateTransactionInput,
  id = optimisticId(),
): Transaction {
  return {
    id,
    userId: "optimistic",
    type: input.type,
    amount: input.amount,
    date: input.date,
    categoryId: input.category_id ?? null,
    accountId: input.account_id ?? null,
    counterAccountId: null,
    installmentPlanId: null,
    recurrenceRuleId: null,
    periodKey: null,
    note: input.note ?? null,
    createdAt: new Date(),
  };
}

export function optimisticTransfer(
  input: TransferInput,
  id = optimisticId(),
): Transaction {
  return {
    ...optimisticTransaction(
      {
        type: "expend",
        amount: input.amount,
        date: input.date,
        account_id: input.account_id,
        note: input.note,
      },
      id,
    ),
    type: "transfer",
    counterAccountId: input.counter_account_id,
  };
}

export function optimisticAccount(
  input: {
    name: string;
    kind: "credit_card" | "bank_account";
    limit?: number;
    closingDay?: number;
    dueDay?: number;
    prepaid?: boolean;
  },
  id = optimisticId(),
): Account {
  const isCreditCard = input.kind === "credit_card";
  const prepaid = isCreditCard && (input.prepaid ?? false);
  return {
    id,
    userId: "optimistic",
    name: input.name,
    kind: input.kind,
    limit: isCreditCard && !prepaid ? input.limit ?? null : null,
    closingDay: isCreditCard && !prepaid ? input.closingDay ?? null : null,
    dueDay: isCreditCard && !prepaid ? input.dueDay ?? null : null,
    prepaid,
  };
}

export function optimisticCategory(
  name: string,
  id = optimisticId(),
): Category {
  return { id, userId: "optimistic", name };
}

export function newestTransactions(rows: Transaction[]) {
  return [...rows].sort((a, b) => b.date.localeCompare(a.date));
}
