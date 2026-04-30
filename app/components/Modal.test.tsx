import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Modal from "./Modal";

describe("Modal", () => {
  it("renders children when open", () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );
    expect(screen.getByText("Modal content")).toBeInTheDocument();
    expect(screen.getByText("Test Modal")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(
      <Modal isOpen={false} onClose={() => {}} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );
    expect(screen.queryByText("Modal content")).not.toBeInTheDocument();
  });

  it("renders footer when provided", () => {
    render(
      <Modal
        isOpen={true}
        onClose={() => {}}
        title="Test Modal"
        footer={<button>Save</button>}
      >
        <p>Content</p>
      </Modal>
    );
    expect(screen.getByText("Save")).toBeInTheDocument();
  });

  it("sets correct max width class", () => {
    const { container } = render(
      <Modal isOpen={true} onClose={() => {}} title="Test" maxWidth="lg">
        <p>Content</p>
      </Modal>
    );
    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog?.className).toContain("max-w-lg");
  });

  it("uses md as default max width", () => {
    const { container } = render(
      <Modal isOpen={true} onClose={() => {}} title="Test">
        <p>Content</p>
      </Modal>
    );
    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog?.className).toContain("max-w-md");
  });

  it("has proper ARIA attributes", () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Accessible Modal">
        <p>Content</p>
      </Modal>
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("aria-labelledby", "modal-title");
  });

  it("calls onClose on backdrop click when closeOnBackdropClick is true", async () => {
    const user = userEvent.setup();
    let closed = false;
    const { container } = render(
      <Modal
        isOpen={true}
        onClose={() => { closed = true; }}
        title="Test"
        closeOnBackdropClick={true}
      >
        <p>Content</p>
      </Modal>
    );
    const backdrop = container.querySelector('[role="presentation"]');
    if (backdrop) {
      await user.click(backdrop);
    }
    expect(closed).toBe(true);
  });

  it("does not call onClose on backdrop click when closeOnBackdropClick is false", async () => {
    const user = userEvent.setup();
    let closed = false;
    const { container } = render(
      <Modal
        isOpen={true}
        onClose={() => { closed = true; }}
        title="Test"
        closeOnBackdropClick={false}
      >
        <p>Content</p>
      </Modal>
    );
    const backdrop = container.querySelector('[role="presentation"]');
    if (backdrop) {
      await user.click(backdrop);
    }
    expect(closed).toBe(false);
  });
});
