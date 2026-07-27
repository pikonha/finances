// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { DashboardCharts } from "./DashboardCharts";
import type { Category, Transaction } from "#/db/schema";
import type { FaturaRow } from "#/server/faturas.core";

afterEach(cleanup);

const category: Category = { id: "cat-1", userId: "u1", name: "Mercado" };

function tx(overrides: Partial<Transaction>): Transaction {
  return {
    id: "t1",
    userId: "u1",
    type: "expend",
    amount: 1000,
    date: "2026-07-10",
    categoryId: null,
    accountId: null,
    counterAccountId: null,
    installmentPlanId: null,
    recurrenceRuleId: null,
    periodKey: null,
    note: null,
    createdAt: null,
    ...overrides,
  };
}

describe("DashboardCharts", () => {
  it("renders category breakdown, next fatura and committed timeline", () => {
    const transactions = [
      tx({ id: "t1", type: "expend", amount: 5000, categoryId: "cat-1" }),
      tx({ id: "t2", type: "earn", amount: 9000, categoryId: null }),
    ];
    const faturas: FaturaRow[] = [
      {
        accountId: "acc-1",
        accountName: "Nubank",
        closingDay: 5,
        cycleKey: "2026-07-05",
        isCurrent: true,
        total: 12000,
        vencimento: "2026-08-10",
        label: "Agosto",
        status: "open",
      },
    ];

    render(
      <DashboardCharts
        transactions={transactions}
        categories={[category]}
        faturas={faturas}
        showValues
      />
    );

    expect(screen.getByText("Nubank")).toBeTruthy();
    expect(screen.getByText("R$ 120,00")).toBeTruthy();
  });

  it("shows empty state when there is nothing in range", () => {
    render(
      <DashboardCharts
        transactions={[]}
        categories={[]}
        faturas={[]}
        showValues
      />
    );

    expect(
      screen.getByText("Nenhuma despesa no período selecionado.")
    ).toBeTruthy();
    expect(
      screen.getByText("Nenhum cartão de crédito cadastrado.")
    ).toBeTruthy();
  });

  it("masks monetary values when privacy mode is enabled", () => {
    render(
      <DashboardCharts
        transactions={[]}
        categories={[]}
        faturas={[
          {
            accountId: "acc-1",
            accountName: "Nubank",
            closingDay: 5,
            cycleKey: "2026-07-05",
            isCurrent: true,
            total: 12000,
            vencimento: "2026-08-10",
            label: "Agosto",
            status: "open",
          },
        ]}
        showValues={false}
      />
    );

    expect(screen.getByText("••••••")).toBeTruthy();
    expect(screen.queryByText("R$ 120,00")).toBeNull();
  });
});
