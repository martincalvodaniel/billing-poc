import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import NavigationBar from "./NavigationBar";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/month",
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; className?: string; "aria-current"?: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

describe("NavigationBar", () => {
  it("renders subtitle", () => {
    render(<NavigationBar subtitle="Test Subtitle" />);
    expect(screen.getByText("Test Subtitle")).toBeInTheDocument();
  });

  it("renders navigation links", () => {
    render(<NavigationBar subtitle="Test" />);
    expect(screen.getByText("Monthly Overview")).toBeInTheDocument();
    expect(screen.getByText("Yearly Overview")).toBeInTheDocument();
    expect(screen.getByText("Clients")).toBeInTheDocument();
  });

  it("renders Billing label", () => {
    render(<NavigationBar subtitle="Test" />);
    expect(screen.getByText("Billing")).toBeInTheDocument();
  });

  it("links point to correct routes", () => {
    const { container } = render(<NavigationBar subtitle="Test" />);
    const links = container.querySelectorAll("a");
    const hrefs = Array.from(links).map((a) => a.getAttribute("href"));
    expect(hrefs).toContain("/");
    expect(hrefs).toContain("/year");
    expect(hrefs).toContain("/clients");
  });
});
