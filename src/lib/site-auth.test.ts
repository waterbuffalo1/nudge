import { describe, expect, it } from "vitest";
import { siteAuthToken } from "./site-auth";

describe("siteAuthToken", () => {
  it("returns a stable hash for the same password", async () => {
    const first = await siteAuthToken("secret");
    const second = await siteAuthToken("secret");
    expect(first).toBe(second);
    expect(first).toMatch(/^[a-f0-9]{64}$/);
  });
});
