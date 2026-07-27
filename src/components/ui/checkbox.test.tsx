// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { Checkbox } from "./checkbox";

function CheckboxHarness() {
  const [checked, setChecked] = useState(false);

  return (
    <label>
      <Checkbox
        checked={checked}
        onChange={(event) => setChecked(event.target.checked)}
      />
      Cartão pré-pago
    </label>
  );
}

describe("Checkbox", () => {
  it("toggles through its accessible label", () => {
    render(<CheckboxHarness />);

    const checkbox = screen.getByRole("checkbox", {
      name: "Cartão pré-pago",
    }) as HTMLInputElement;

    expect(checkbox.checked).toBe(false);
    fireEvent.click(screen.getByText("Cartão pré-pago"));
    expect(checkbox.checked).toBe(true);
  });
});
