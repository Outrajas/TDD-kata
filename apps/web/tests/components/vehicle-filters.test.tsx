import { describe, expect, it } from "vitest";
import { buildVehicleSearchQuery } from "../../src/lib/inventory";

describe("vehicle search filters", () => {
  it("omits blank values and trims text filters", () => {
    const query = buildVehicleSearchQuery({ make: " Volvo ", model: " ", category: "SUV", minPrice: "", maxPrice: "" });
    expect(query.toString()).toBe("make=Volvo&category=SUV");
  });

  it("preserves inclusive price range values", () => {
    const query = buildVehicleSearchQuery({ make: "", model: "XC60", category: "", minPrice: "20000", maxPrice: "35000" });
    expect(query.toString()).toBe("model=XC60&minPrice=20000&maxPrice=35000");
  });
});
