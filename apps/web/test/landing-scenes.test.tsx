import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LandingScenes } from "@/components/landing/landing-scenes";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

describe("LandingScenes", () => {
  it("renders every supplied scene and alternates the desktop layout", () => {
    render(
      <LandingScenes
        scenes={[
          {
            title: "Marketplace sellers",
            description: "Listing-ready images.",
            visual: <img src="/scene.webp" alt="Marketplace product image" />,
          },
          { title: "Online stores", description: "A consistent catalog." },
        ]}
      />,
    );

    expect(screen.getByRole("heading", { name: "Marketplace sellers" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Online stores" })).toBeInTheDocument();
    expect(screen.getAllByText("Scene image placeholder")).toHaveLength(1);
    expect(screen.getByRole("img", { name: "Marketplace product image" })).toHaveAttribute("src", "/scene.webp");
    expect(screen.getByText("Online stores").parentElement).toHaveClass("lg:order-2");
  });
});
