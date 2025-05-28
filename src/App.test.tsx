import { describe, expect, it } from "vitest";

describe("App", () => {
  it("should pass basic test", () => {
    // 基本的なテストが通ることを確認
    expect(true).toBe(true);
  });

  it("should perform simple math", () => {
    expect(1 + 1).toBe(2);
  });
});
