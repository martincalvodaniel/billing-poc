import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ClientSearch from "./ClientSearch";

describe("ClientSearch", () => {
  it("renders search input", () => {
    render(<ClientSearch onSearch={vi.fn()} />);
    expect(
      screen.getByPlaceholderText("Search clients by name or tax ID...")
    ).toBeInTheDocument();
  });

  it("shows clear button when there is input", async () => {
    const user = userEvent.setup();
    render(<ClientSearch onSearch={vi.fn()} />);
    const input = screen.getByPlaceholderText("Search clients by name or tax ID...");
    await user.type(input, "test");
    expect(screen.getByLabelText("Clear search")).toBeInTheDocument();
  });

  it("does not show clear button when input is empty", () => {
    render(<ClientSearch onSearch={vi.fn()} />);
    expect(screen.queryByLabelText("Clear search")).not.toBeInTheDocument();
  });

  it("clears input when clear button is clicked", async () => {
    const user = userEvent.setup();
    render(<ClientSearch onSearch={vi.fn()} />);
    const input = screen.getByPlaceholderText("Search clients by name or tax ID...");
    await user.type(input, "test");
    expect(input).toHaveValue("test");
    await user.click(screen.getByLabelText("Clear search"));
    expect(input).toHaveValue("");
  });

  it("calls onSearch after debounce when typing", async () => {
    const onSearch = vi.fn();
    const user = userEvent.setup();
    render(<ClientSearch onSearch={onSearch} />);
    const input = screen.getByPlaceholderText("Search clients by name or tax ID...");
    await user.type(input, "query");
    // Wait for the debounce period (300ms) plus a bit extra
    await new Promise((resolve) => setTimeout(resolve, 500));
    expect(onSearch).toHaveBeenCalledWith("query");
  });
});
