import { describe, expect, it } from "vitest";
import { readLimitedBody } from "@/lib/security/request-body";

describe("request limits", () => {
  it("reads a bounded body", async () => {
    const result = await readLimitedBody(new Request("http://localhost", { method: "POST", body: "test" }), 4);
    expect(new TextDecoder().decode(result)).toBe("test");
  });
  it("rejects oversized streams without Content-Length", async () => {
    await expect(readLimitedBody(new Request("http://localhost", { method: "POST", body: "12345" }), 4)).rejects.toThrow("payload_too_large");
  });
  it("rejects oversized Content-Length before reading", async () => {
    await expect(readLimitedBody(new Request("http://localhost", { method: "POST", headers: { "content-length": "100" }, body: "x" }), 4)).rejects.toThrow("payload_too_large");
  });
});
