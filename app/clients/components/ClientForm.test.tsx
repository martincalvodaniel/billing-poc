import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ClientForm from "./ClientForm";

describe("ClientForm", () => {
  const defaultProps = {
    onSubmit: vi.fn().mockResolvedValue(undefined),
    onCancel: vi.fn(),
  };

  it("renders all required fields", () => {
    render(<ClientForm {...defaultProps} />);
    expect(screen.getByText("Type")).toBeInTheDocument();
    expect(screen.getByText(/Name/)).toBeInTheDocument();
    expect(screen.getByText(/Tax ID/)).toBeInTheDocument();
    expect(screen.getByText(/Tax Address/)).toBeInTheDocument();
  });

  it("renders optional fields", () => {
    render(<ClientForm {...defaultProps} />);
    expect(screen.getByText("Phone Number")).toBeInTheDocument();
    expect(screen.getByText("Email Address")).toBeInTheDocument();
  });

  it("renders cancel and submit buttons", () => {
    render(<ClientForm {...defaultProps} />);
    expect(screen.getByText("Cancel")).toBeInTheDocument();
    expect(screen.getByText("Create Client")).toBeInTheDocument();
  });

  it("renders 'Update Client' when editing existing client", () => {
    const client = {
      _id: undefined,
      clientType: "individual" as const,
      name: "Test",
      taxId: "123",
      address: "Addr",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    render(<ClientForm {...defaultProps} client={client} />);
    expect(screen.getByText("Update Client")).toBeInTheDocument();
  });

  it("pre-fills form with client data", () => {
    const client = {
      _id: undefined,
      clientType: "company" as const,
      name: "ACME Corp",
      taxId: "B12345678",
      address: "123 Main St",
      phone: "+34 123 456 789",
      email: "info@acme.com",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    render(<ClientForm {...defaultProps} client={client} />);
    expect(screen.getByDisplayValue("ACME Corp")).toBeInTheDocument();
    expect(screen.getByDisplayValue("B12345678")).toBeInTheDocument();
    expect(screen.getByDisplayValue("123 Main St")).toBeInTheDocument();
    expect(screen.getByDisplayValue("+34 123 456 789")).toBeInTheDocument();
    expect(screen.getByDisplayValue("info@acme.com")).toBeInTheDocument();
  });

  it("calls onCancel when Cancel is clicked", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<ClientForm {...defaultProps} onCancel={onCancel} />);
    await user.click(screen.getByText("Cancel"));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("validates name cannot be empty", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<ClientForm onSubmit={onSubmit} onCancel={vi.fn()} />);
    const nameInput = screen.getByPlaceholderText(/John Doe/);
    // HTML5 required attribute prevents form submission when empty
    expect(nameInput).toBeRequired();
    // Also the JS validator checks trimmed name
    await user.type(nameInput, "   ");
    await user.type(screen.getByPlaceholderText(/12345678/), "123");
    await user.type(screen.getByPlaceholderText(/Calle/), "Address");
    await user.click(screen.getByText("Create Client"));
    // Form should show validation error since name trims to empty
    expect(screen.getByText("Name is required")).toBeInTheDocument();
  });

  it("calls onSubmit with form data on valid submission", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<ClientForm {...defaultProps} onSubmit={onSubmit} />);
    await user.type(screen.getByPlaceholderText(/John Doe/), "Test User");
    await user.type(screen.getByPlaceholderText(/12345678/), "12345678A");
    await user.type(screen.getByPlaceholderText(/Calle/), "Test Address");
    await user.click(screen.getByText("Create Client"));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Test User",
        taxId: "12345678A",
        address: "Test Address",
        clientType: "individual",
      })
    );
  });
});
