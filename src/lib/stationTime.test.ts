import { describe, expect, it } from "vitest";
import {
  formatStationDateTime,
  stationDateInput,
  stationDateTimeInput,
  stationInputToIso,
  stationMinutesIntoDay,
} from "./stationTime";

describe("Mountain Time utilities", () => {
  it("converts winter station time using MST", () => {
    expect(stationInputToIso("2026-01-15T20:00")).toBe("2026-01-16T03:00:00.000Z");
  });

  it("converts summer station time using MDT", () => {
    expect(stationInputToIso("2026-07-15T20:00")).toBe("2026-07-16T02:00:00.000Z");
  });

  it("keeps date inputs on the station calendar day", () => {
    expect(stationDateInput(new Date("2026-01-01T06:30:00Z"))).toBe("2025-12-31");
    expect(stationDateTimeInput("2026-07-16T02:00:00Z")).toBe("2026-07-15T20:00");
  });

  it("calculates clock placement in Mountain Time", () => {
    expect(stationMinutesIntoDay("2026-07-16T02:15:00Z")).toBe(20 * 60 + 15);
  });

  it("formats a listener-facing station timestamp", () => {
    expect(formatStationDateTime("2026-01-16T03:00:00Z")).toContain("8:00 PM");
    expect(formatStationDateTime("2026-01-16T03:00:00Z")).toContain("MST");
  });
});
