import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PaginationControls from "./PaginationControls";

describe("PaginationControls", () => {
  const defaultProps = {
    currentPage: 2,
    totalPages: 5,
    total: 50,
    pageSize: 10,
    hasPrevPage: true,
    hasNextPage: true,
    onPageChange: vi.fn(),
  };

  it("renders page info text", () => {
    render(<PaginationControls {...defaultProps} />);
    expect(screen.getByText("11")).toBeInTheDocument(); // startItem
    expect(screen.getByText("20")).toBeInTheDocument(); // endItem
    expect(screen.getByText("50")).toBeInTheDocument(); // total
  });

  it("renders current page and total pages", () => {
    render(<PaginationControls {...defaultProps} />);
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("calls onPageChange with prev page on Previous click", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(
      <PaginationControls {...defaultProps} onPageChange={onPageChange} />
    );
    await user.click(screen.getByText("Previous"));
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it("calls onPageChange with next page on Next click", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(
      <PaginationControls {...defaultProps} onPageChange={onPageChange} />
    );
    await user.click(screen.getByText("Next"));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it("disables Previous button when hasPrevPage is false", () => {
    render(
      <PaginationControls
        {...defaultProps}
        currentPage={1}
        hasPrevPage={false}
      />
    );
    expect(screen.getByText("Previous")).toBeDisabled();
  });

  it("disables Next button when hasNextPage is false", () => {
    render(
      <PaginationControls
        {...defaultProps}
        currentPage={5}
        hasNextPage={false}
      />
    );
    expect(screen.getByText("Next")).toBeDisabled();
  });

  it("shows correct items on last page with fewer items", () => {
    render(
      <PaginationControls
        {...defaultProps}
        currentPage={5}
        total={43}
        hasNextPage={false}
      />
    );
    expect(screen.getByText("41")).toBeInTheDocument(); // startItem
    // endItem and total are both 43, so use getAllByText
    const elements43 = screen.getAllByText("43");
    expect(elements43.length).toBe(2); // endItem and total
  });

  it("has accessible labels on navigation buttons", () => {
    render(<PaginationControls {...defaultProps} />);
    expect(screen.getByLabelText("Previous page")).toBeInTheDocument();
    expect(screen.getByLabelText("Next page")).toBeInTheDocument();
  });
});
