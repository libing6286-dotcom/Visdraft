// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CreateSkillDialog } from "../src/components/skills/create-skill-dialog";

describe("CreateSkillDialog", () => {
  afterEach(() => {
    cleanup();
  });

  it("keeps the footer reachable when many attached files are added", async () => {
    const user = userEvent.setup();
    render(
      <CreateSkillDialog
        open
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    const addFileButton = screen.getByRole("button", { name: /添加/i });
    for (let i = 0; i < 12; i += 1) {
      await user.click(addFileButton);
    }

    const dialogContent = document.body.querySelector("[data-slot='dialog-content']");
    const scrollRegion = document.body.querySelector("[data-skill-dialog-scroll]");
    const footer = document.body.querySelector("[data-slot='dialog-footer']");

    expect(dialogContent).toHaveClass("max-h-[calc(100dvh-2rem)]");
    expect(scrollRegion).toHaveClass("min-h-0", "overflow-y-auto");
    expect(footer).toHaveClass("shrink-0");
    expect(screen.getByRole("button", { name: /创建/i })).toBeInTheDocument();
  });
});
