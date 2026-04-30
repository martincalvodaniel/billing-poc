import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import SummaryCard from "./SummaryCard";

describe("SummaryCard", () => {
  it("renders label and value", () => {
    render(<SummaryCard label="Total Income" value="€100.00" />);
    expect(screen.getByText("Total Income")).toBeInTheDocument();
    expect(screen.getByText("€100.00")).toBeInTheDocument();
  });

  it("applies custom valueClassName", () => {
    render(
      <SummaryCard
        label="Net Balance"
        value="€50.00"
        valueClassName="text-green-600"
      />
    );
    const valueEl = screen.getByText("€50.00");
    expect(valueEl.className).toContain("text-green-600");
  });

  it("applies custom className", () => {
    const { container } = render(
      <SummaryCard label="Test" value="€0.00" className="custom-class" />
    );
    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("renders without optional props", () => {
    render(<SummaryCard label="Simple" value="€0.00" />);
    expect(screen.getByText("Simple")).toBeInTheDocument();
    expect(screen.getByText("€0.00")).toBeInTheDocument();
  });
});
