import { describe, expect, it } from "vitest";
import { canPurchase } from "../../src/lib/inventory";

describe("purchase availability", () => {
  it("allows an available vehicle while idle", () => {
    expect(canPurchase(1, false)).toBe(true);
  });

  it("disables purchase when stock is empty or a request is pending", () => {
    expect(canPurchase(0, false)).toBe(false);
    expect(canPurchase(4, true)).toBe(false);
  });
});
