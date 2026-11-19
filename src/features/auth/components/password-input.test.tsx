/**
 * @vitest-environment jsdom
 */

import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PasswordInput } from "./password-input";

describe("PasswordInput", () => {
  it("renders a password field by default", () => {
    render(
      <PasswordInput
        id="password"
        name="password"
        value=""
        onChange={vi.fn()}
        autoComplete="new-password"
        placeholder="Enter your password"
      />,
    );

    expect(screen.getByLabelText("Enter your password")).toHaveAttribute(
      "type",
      "password",
    );

    expect(
      screen.getByRole("button", { name: "Show password" }),
    ).toBeInTheDocument();
  });

  it("shows the password when the user clicks Show", async () => {
    const user = userEvent.setup();

    render(
      <PasswordInput
        id="password"
        name="password"
        value="password123"
        onChange={vi.fn()}
        autoComplete="new-password"
        placeholder="Enter your password"
      />,
    );

    const passwordInput = screen.getByPlaceholderText("Enter your password");

    await user.click(screen.getByRole("button", { name: "Show password" }));

    expect(passwordInput).toHaveAttribute("type", "text");
    expect(
      screen.getByRole("button", { name: "Hide password" }),
    ).toBeInTheDocument();
  });

  it("hides the password again when the user clicks Hide", async () => {
    const user = userEvent.setup();

    render(
      <PasswordInput
        id="password"
        name="password"
        value="password123"
        onChange={vi.fn()}
        autoComplete="new-password"
        placeholder="Enter your password"
      />,
    );

    const passwordInput = screen.getByPlaceholderText("Enter your password");

    await user.click(screen.getByRole("button", { name: "Show password" }));

    await user.click(screen.getByRole("button", { name: "Hide password" }));

    expect(passwordInput).toHaveAttribute("type", "password");
  });

  it("calls onChange when the user types", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(
      <PasswordInput
        id="password"
        name="password"
        value=""
        onChange={handleChange}
        autoComplete="new-password"
        placeholder="Enter your password"
      />,
    );

    await user.type(
      screen.getByPlaceholderText("Enter your password"),
      "password123",
    );

    expect(handleChange).toHaveBeenCalled();
  });

  it("exposes invalid and description attributes", () => {
    render(
      <PasswordInput
        id="password"
        name="password"
        value=""
        onChange={vi.fn()}
        autoComplete="new-password"
        placeholder="Enter your password"
        invalid
        describedBy="password-error"
      />,
    );

    const passwordInput = screen.getByPlaceholderText("Enter your password");

    expect(passwordInput).toHaveAttribute("aria-invalid", "true");
    expect(passwordInput).toHaveAttribute("aria-describedby", "password-error");
  });
});
