import { describe, expect, it } from "vitest";
import {
  calculateBalances,
  simplifyTransfers,
  splitAmountEvenly,
} from "./balances";

describe("splitAmountEvenly", () => {
  it("splits without losing paisa", () => {
    expect(splitAmountEvenly(10000, 2)).toEqual([5000, 5000]);
    expect(splitAmountEvenly(10001, 3).reduce((a, b) => a + b, 0)).toBe(10001);
  });
});

describe("calculateBalances", () => {
  it("matches two-roommate example", () => {
    const talha = "talha";
    const roommate = "roommate";

    const balances = calculateBalances([
      {
        amountMinor: 1_000_000,
        payerId: talha,
        participantIds: [talha, roommate],
      },
      {
        amountMinor: 600_000,
        payerId: roommate,
        participantIds: [talha, roommate],
      },
    ]);

    expect(balances[talha]).toBe(200_000);
    expect(balances[roommate]).toBe(-200_000);
  });

  it("returns zero for settled user with no expenses", () => {
    expect(calculateBalances([])).toEqual({});
  });
});

describe("simplifyTransfers", () => {
  it("produces single transfer for two people", () => {
    const transfers = simplifyTransfers({
      a: 200_000,
      b: -200_000,
    });
    expect(transfers).toHaveLength(1);
    expect(transfers[0]).toEqual({
      fromId: "b",
      toId: "a",
      amountMinor: 200_000,
    });
  });

  it("handles three-way settlement", () => {
    const transfers = simplifyTransfers({
      a: 300,
      b: 100,
      c: -200,
      d: -200,
    });
    const total = transfers.reduce((s, t) => s + t.amountMinor, 0);
    expect(total).toBe(400);
  });
});
