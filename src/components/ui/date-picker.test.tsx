// @vitest-environment jsdom
import { useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { DatePicker } from "./date-picker";

afterEach(cleanup);

function Harness() {
  const [value, setValue] = useState("2026-07-15");
  return (
    <div>
      <label htmlFor="test-date">Data</label>
      <DatePicker id="test-date" value={value} onChange={setValue} required />
      <output>{value}</output>
    </div>
  );
}

describe("DatePicker", () => {
  it("selects a date while preserving the YYYY-MM-DD contract", () => {
    render(<Harness />);

    const trigger = screen.getByLabelText("Data");
    expect(trigger.textContent).toContain("15/07/2026");
    fireEvent.click(trigger);

    const calendar = screen.getByRole("dialog", { name: "Escolher data" });
    fireEvent.click(
      screen.getByRole("gridcell", { name: /19 de julho de 2026/i }),
    );

    expect(screen.queryByRole("dialog", { name: "Escolher data" })).toBeNull();
    expect(trigger.textContent).toContain("19/07/2026");
    expect(screen.getByText("2026-07-19")).toBeTruthy();
    expect(calendar.isConnected).toBe(false);
  });

  it("navigates months and closes with Escape", () => {
    render(<Harness />);
    fireEvent.click(screen.getByLabelText("Data"));
    fireEvent.click(screen.getByRole("button", { name: "Próximo mês" }));
    expect(
      screen.getByRole("heading", { name: "agosto de 2026" }),
    ).toBeTruthy();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "Escolher data" })).toBeNull();
  });
});
