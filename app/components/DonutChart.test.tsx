import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DonutChart from "./DonutChart";

const defaultColors = [
  "#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6",
  "#ec4899", "#06b6d4", "#f97316", "#6366f1", "#14b8a6",
];

describe("DonutChart", () => {
  it("renders 'No data' when data is empty", () => {
    render(<DonutChart data={{}} title="Test Chart" colors={defaultColors} />);
    expect(screen.getByText("No data")).toBeInTheDocument();
    expect(screen.getByText("Test Chart")).toBeInTheDocument();
  });

  it("renders title", () => {
    render(
      <DonutChart
        data={{ "Tag A": 100 }}
        title="Income by Tag"
        colors={defaultColors}
      />
    );
    expect(screen.getByText("Income by Tag")).toBeInTheDocument();
  });

  it("renders segments for each tag", () => {
    render(
      <DonutChart
        data={{ "Tag A": 50, "Tag B": 50 }}
        title="Test"
        colors={defaultColors}
      />
    );
    expect(screen.getByText("Tag A")).toBeInTheDocument();
    expect(screen.getByText("Tag B")).toBeInTheDocument();
  });

  it("shows correct percentages", () => {
    render(
      <DonutChart
        data={{ "A": 75, "B": 25 }}
        title="Test"
        colors={defaultColors}
      />
    );
    expect(screen.getByText("75.0%")).toBeInTheDocument();
    expect(screen.getByText("25.0%")).toBeInTheDocument();
  });

  it("handles single item (100%)", () => {
    render(
      <DonutChart
        data={{ "Only": 200 }}
        title="Test"
        colors={defaultColors}
      />
    );
    expect(screen.getByText("100.0%")).toBeInTheDocument();
  });

  it("renders sort buttons", () => {
    render(
      <DonutChart
        data={{ "A": 50, "B": 50 }}
        title="Test"
        colors={defaultColors}
      />
    );
    expect(screen.getByLabelText(/Sort by percentage/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Sort by name/)).toBeInTheDocument();
  });

  it("toggles sort order when clicking same sort button", async () => {
    const user = userEvent.setup();
    render(
      <DonutChart
        data={{ "B Tag": 30, "A Tag": 70 }}
        title="Test"
        colors={defaultColors}
      />
    );
    const percentBtn = screen.getByLabelText(/Sort by percentage/);
    // Default is percentage desc, clicking again toggles to asc
    await user.click(percentBtn);
    // The button text should now show ascending arrow
    expect(percentBtn.textContent).toContain("↑");
  });

  it("renders SVG element", () => {
    const { container } = render(
      <DonutChart
        data={{ "A": 50 }}
        title="Test"
        colors={defaultColors}
      />
    );
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});
