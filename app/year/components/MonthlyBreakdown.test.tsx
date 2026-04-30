import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import MonthlyBreakdown from "./MonthlyBreakdown";

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(amount);

const createMonthlyTotals = (overrides: Partial<{ monthIndex: number; income: number; outcome: number }>[] = []) => {
  return Array.from({ length: 12 }, (_, i) => {
    const override = overrides.find((o) => o.monthIndex === i) || {};
    const income = override.income ?? 0;
    const outcome = override.outcome ?? 0;
    return {
      monthIndex: i,
      income,
      outcome,
      net: income - outcome,
      totalVolume: income + outcome,
    };
  });
};

describe("MonthlyBreakdown", () => {
  it("renders 12 month cards", () => {
    const totals = createMonthlyTotals();
    const { container } = render(
      <MonthlyBreakdown
        monthlyTotals={totals}
        selectedYear={2025}
        formatCurrency={formatCurrency}
        maxMonthlyVolume={1000}
      />
    );
    const links = container.querySelectorAll("a");
    expect(links).toHaveLength(12);
  });

  it("shows month labels", () => {
    const totals = createMonthlyTotals();
    render(
      <MonthlyBreakdown
        monthlyTotals={totals}
        selectedYear={2025}
        formatCurrency={formatCurrency}
        maxMonthlyVolume={1000}
      />
    );
    expect(screen.getByText("Jan")).toBeInTheDocument();
    expect(screen.getByText("Dec")).toBeInTheDocument();
  });

  it("links to correct month URL", () => {
    const totals = createMonthlyTotals();
    const { container } = render(
      <MonthlyBreakdown
        monthlyTotals={totals}
        selectedYear={2025}
        formatCurrency={formatCurrency}
        maxMonthlyVolume={1000}
      />
    );
    const links = container.querySelectorAll("a");
    const hrefs = Array.from(links).map((a) => a.getAttribute("href"));
    expect(hrefs).toContain("/month?month=1&year=2025");
    expect(hrefs).toContain("/month?month=12&year=2025");
  });

  it("displays income and outcome values", () => {
    const totals = createMonthlyTotals([
      { monthIndex: 0, income: 1000, outcome: 500 },
    ]);
    const { container } = render(
      <MonthlyBreakdown
        monthlyTotals={totals}
        selectedYear={2025}
        formatCurrency={formatCurrency}
        maxMonthlyVolume={1500}
      />
    );
    // Currency formatted values appear in the rendered output  
    const textContent = container.textContent || "";
    expect(textContent).toContain(formatCurrency(1000));
    expect(textContent).toContain(formatCurrency(500));
  });

  it("renders heading", () => {
    const totals = createMonthlyTotals();
    render(
      <MonthlyBreakdown
        monthlyTotals={totals}
        selectedYear={2025}
        formatCurrency={formatCurrency}
        maxMonthlyVolume={1000}
      />
    );
    expect(screen.getByText("Monthly breakdown")).toBeInTheDocument();
  });
});
