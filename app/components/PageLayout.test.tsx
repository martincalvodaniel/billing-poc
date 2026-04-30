import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import PageLayout from "./PageLayout";

// Mock NavigationBar since it depends on next/navigation
vi.mock("./NavigationBar", () => ({
  default: ({ subtitle }: { subtitle: string }) => (
    <nav data-testid="navigation-bar">{subtitle}</nav>
  ),
}));

describe("PageLayout", () => {
  it("renders title and subtitle", () => {
    render(
      <PageLayout
        title="Test Title"
        subtitle="Test Subtitle"
        navigationSubtitle="Nav Sub"
      >
        <p>Content</p>
      </PageLayout>
    );
    expect(screen.getByText("Test Title")).toBeInTheDocument();
    expect(screen.getByText("Test Subtitle")).toBeInTheDocument();
  });

  it("renders children", () => {
    render(
      <PageLayout
        title="Title"
        subtitle="Sub"
        navigationSubtitle="Nav"
      >
        <p>Page content here</p>
      </PageLayout>
    );
    expect(screen.getByText("Page content here")).toBeInTheDocument();
  });

  it("renders navigation bar with subtitle", () => {
    render(
      <PageLayout
        title="Title"
        subtitle="Sub"
        navigationSubtitle="Monthly Overview"
      >
        <p>Content</p>
      </PageLayout>
    );
    expect(screen.getByTestId("navigation-bar")).toHaveTextContent("Monthly Overview");
  });

  it("renders optional headerContent", () => {
    render(
      <PageLayout
        title="Title"
        subtitle="Sub"
        navigationSubtitle="Nav"
        headerContent={<div data-testid="header">Header content</div>}
      >
        <p>Content</p>
      </PageLayout>
    );
    expect(screen.getByTestId("header")).toBeInTheDocument();
    expect(screen.getByText("Header content")).toBeInTheDocument();
  });

  it("does not render headerContent when not provided", () => {
    const { container } = render(
      <PageLayout title="Title" subtitle="Sub" navigationSubtitle="Nav">
        <p>Content</p>
      </PageLayout>
    );
    expect(container.querySelector('[data-testid="header"]')).not.toBeInTheDocument();
  });
});
