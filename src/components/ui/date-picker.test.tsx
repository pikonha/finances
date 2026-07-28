// @vitest-environment jsdom
import { useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { DatePicker } from "./date-picker";

afterEach(cleanup);

function Harness({ initialValue = "2026-07-15" }) {
  const [value, setValue] = useState(initialValue);
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

  it("opens and selects dates using only arrow keys and Space", () => {
    render(<Harness />);
    const trigger = screen.getByLabelText("Data");
    trigger.focus();

    fireEvent.keyDown(trigger, { key: "ArrowDown" });

    const selectedDay = screen.getByRole("gridcell", {
      name: /15 de julho de 2026/i,
    });
    expect(document.activeElement).toBe(selectedDay);

    fireEvent.keyDown(selectedDay, { key: "ArrowRight" });
    const nextDay = screen.getByRole("gridcell", {
      name: /16 de julho de 2026/i,
    });
    expect(document.activeElement).toBe(nextDay);

    fireEvent.keyDown(nextDay, { key: "ArrowDown" });
    const nextWeek = screen.getByRole("gridcell", {
      name: /23 de julho de 2026/i,
    });
    expect(document.activeElement).toBe(nextWeek);

    fireEvent.keyDown(nextWeek, { key: " " });
    expect(screen.getByText("2026-07-23")).toBeTruthy();
    expect(screen.queryByRole("dialog", { name: "Escolher data" })).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it("moves keyboard focus across month boundaries", () => {
    render(<Harness initialValue="2026-07-29" />);
    const trigger = screen.getByLabelText("Data");
    fireEvent.keyDown(trigger, { key: "ArrowDown" });

    fireEvent.keyDown(
      screen.getByRole("gridcell", { name: /29 de julho de 2026/i }),
      { key: "ArrowDown" },
    );

    const augustDay = screen.getByRole("gridcell", {
      name: /^quarta-feira, 5 de agosto de 2026$/i,
    });
    expect(document.activeElement).toBe(augustDay);
    expect(
      screen.getByRole("heading", { name: "agosto de 2026" }),
    ).toBeTruthy();
  });
});
