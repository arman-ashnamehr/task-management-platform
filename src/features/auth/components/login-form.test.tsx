import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { LoginForm } from "./login-form";

describe("LoginForm", () => {
  it("renders the login form", () => {
    render(<LoginForm />);

    expect(
      screen.getByRole("heading", {
        name: "Welcome back",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("textbox", {
        name: "Email address",
      }),
    ).toBeInTheDocument();

    expect(screen.getByLabelText("Password")).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Sign in",
      }),
    ).toBeInTheDocument();
  });

  it("displays validation errors when submitted empty", async () => {
    const user = userEvent.setup();

    render(<LoginForm />);

    await user.click(
      screen.getByRole("button", {
        name: "Sign in",
      }),
    );

    expect(
      screen.getByText("Please enter a valid email address."),
    ).toBeInTheDocument();

    expect(screen.getByText("Please enter your password.")).toBeInTheDocument();
  });

  it("allows the user to show and hide the password", async () => {
    const user = userEvent.setup();

    render(<LoginForm />);

    const passwordInput = screen.getByLabelText("Password");

    expect(passwordInput).toHaveAttribute("type", "password");

    await user.click(
      screen.getByRole("button", {
        name: "Show password",
      }),
    );

    expect(passwordInput).toHaveAttribute("type", "text");

    await user.click(
      screen.getByRole("button", {
        name: "Hide password",
      }),
    );

    expect(passwordInput).toHaveAttribute("type", "password");
  });

  it("shows the validation success message for valid input", async () => {
    const user = userEvent.setup();

    render(<LoginForm />);

    await user.type(
      screen.getByRole("textbox", {
        name: "Email address",
      }),
      "user@example.com",
    );

    await user.type(screen.getByLabelText("Password"), "password123");

    await user.click(
      screen.getByRole("button", {
        name: "Sign in",
      }),
    );
  });
});
