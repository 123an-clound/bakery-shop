import { describe, expect, it } from "vitest";

import { escapeCsvCell } from "@/lib/utils/csv";

describe("escapeCsvCell", () => {
  it.each(["=1+1", "+SUM(A1:A2)", "-1+2", "@SUM(A1:A2)", "  =1+1"])(
    "marks formula-like input as text: %s",
    (value) => {
      expect(escapeCsvCell(value)).toBe(`"'${value}"`);
    },
  );

  it("quotes and doubles embedded quotes in ordinary values", () => {
    expect(escapeCsvCell('Baker "Mai"')).toBe('"Baker ""Mai"""');
  });
});
