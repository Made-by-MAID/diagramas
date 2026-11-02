import { describe, expect, it } from "vitest";
import { personalTheme } from "./personal-theme";

describe("personalTheme", () => {
  it("keeps its identity: square corners, Zilla Slab and an orange accent", () => {
    expect(personalTheme.name).toBe("personal");
    expect(personalTheme.stroke.cornerRadius).toBe(0);
    expect(personalTheme.font.family).toBe("Zilla Slab");
    expect(personalTheme.colors.accent).toMatch(/^#[0-9A-F]{6}$/);
  });
});
