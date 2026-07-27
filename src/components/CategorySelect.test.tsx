// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CategorySelect } from "./CategorySelect";

afterEach(cleanup);

describe("CategorySelect", () => {
  it("filters and selects an existing category", () => {
    const onChange = vi.fn();
    render(
      <CategorySelect
        categories={[
          { id: "groceries-id", name: "Groceries" },
          { id: "travel-id", name: "Travel" },
        ]}
        value=""
        onChange={onChange}
        onCreate={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Categoria: Nenhuma" }));
    fireEvent.change(screen.getByLabelText("Buscar ou criar categoria"), {
      target: { value: "trav" },
    });

    expect(screen.queryByRole("option", { name: "Groceries" })).toBeNull();
    fireEvent.click(screen.getByRole("option", { name: "Travel" }));

    expect(onChange).toHaveBeenCalledWith("travel-id");
    expect(screen.queryByLabelText("Buscar ou criar categoria")).toBeNull();
  });

  it("creates and selects a category inside the dropdown", async () => {
    const onChange = vi.fn();
    const onCreate = vi.fn().mockResolvedValue("new-id");
    render(
      <CategorySelect
        categories={[{ id: "existing-id", name: "Groceries" }]}
        value=""
        onChange={onChange}
        onCreate={onCreate}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Categoria: Nenhuma" }));
    fireEvent.change(screen.getByLabelText("Buscar ou criar categoria"), {
      target: { value: "  Travel  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Criar “Travel”" }));

    await waitFor(() => expect(onCreate).toHaveBeenCalledWith("Travel"));
    expect(onChange).toHaveBeenCalledWith("new-id");
    expect(screen.queryByLabelText("Buscar ou criar categoria")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Categoria: Nenhuma" }));
    expect(screen.getByRole("option", { name: "Travel" })).toBeTruthy();
  });

  it("selects an exact match on Enter instead of creating a duplicate", () => {
    const onChange = vi.fn();
    const onCreate = vi.fn();
    render(
      <CategorySelect
        categories={[{ id: "travel-id", name: "Travel" }]}
        value=""
        onChange={onChange}
        onCreate={onCreate}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Categoria: Nenhuma" }));
    const search = screen.getByLabelText("Buscar ou criar categoria");
    fireEvent.change(search, { target: { value: "travel" } });
    fireEvent.keyDown(search, { key: "Enter" });

    expect(onCreate).not.toHaveBeenCalled();
    expect(onChange).toHaveBeenCalledWith("travel-id");
  });

  it("keeps the dropdown open and reports creation failures", async () => {
    render(
      <CategorySelect
        categories={[]}
        value=""
        onChange={vi.fn()}
        onCreate={vi.fn().mockRejectedValue(new Error("Categoria duplicada"))}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Categoria: Nenhuma" }));
    fireEvent.change(screen.getByLabelText("Buscar ou criar categoria"), {
      target: { value: "Travel" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Criar “Travel”" }));

    expect((await screen.findByRole("alert")).textContent).toBe(
      "Categoria duplicada"
    );
    expect(screen.getByLabelText("Buscar ou criar categoria")).toBeTruthy();
  });

  it("closes on Escape without changing the selection", () => {
    const onChange = vi.fn();
    render(
      <CategorySelect
        categories={[]}
        value=""
        onChange={onChange}
        onCreate={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Categoria: Nenhuma" }));
    fireEvent.keyDown(screen.getByLabelText("Buscar ou criar categoria"), {
      key: "Escape",
    });

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByLabelText("Buscar ou criar categoria")).toBeNull();
  });
});
