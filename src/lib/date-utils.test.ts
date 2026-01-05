import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getRelativeDueDate, parseLocalDate } from "./date-utils";

describe("parseLocalDate", () => {
  it("parses date-only strings as local dates", () => {
    const date = parseLocalDate("2026-01-02");
    expect(date).not.toBeNull();
    expect(date?.getFullYear()).toBe(2026);
    expect(date?.getMonth()).toBe(0);
    expect(date?.getDate()).toBe(2);
    expect(date?.getHours()).toBe(0);
  });

  it("ignores time portions in ISO strings", () => {
    const date = parseLocalDate("2026-01-02T23:59:59Z");
    expect(date).not.toBeNull();
    expect(date?.getFullYear()).toBe(2026);
    expect(date?.getMonth()).toBe(0);
    expect(date?.getDate()).toBe(2);
  });

  it("returns null for empty or invalid inputs", () => {
    expect(parseLocalDate(undefined)).toBeNull();
    expect(parseLocalDate("not-a-date")).toBeNull();
  });
});

describe("getRelativeDueDate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 15, 12, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns no due date when missing", () => {
    const result = getRelativeDueDate(undefined, false);
    expect(result.text).toBe("No due date");
    expect(result.isOverdue).toBe(false);
  });

  it("detects overdue dates", () => {
    const result = getRelativeDueDate("2026-01-14", false);
    expect(result.text).toBe("Overdue by 1 day");
    expect(result.isOverdue).toBe(true);
  });

  it("detects due today", () => {
    const result = getRelativeDueDate("2026-01-15", false);
    expect(result.text).toBe("Due today");
    expect(result.isOverdue).toBe(false);
  });

  it("detects due tomorrow", () => {
    const result = getRelativeDueDate("2026-01-16", false);
    expect(result.text).toBe("Due tomorrow");
    expect(result.isOverdue).toBe(false);
  });

  it("uses relative future labels", () => {
    const result = getRelativeDueDate("2026-01-20", false);
    expect(result.text).toBe("Due in 5 days");
    expect(result.isOverdue).toBe(false);
  });

  it("formats completed tasks with locale-aware dates", () => {
    const result = getRelativeDueDate("2026-01-20", true, {
      locale: "en-US",
    });
    const dueDate = parseLocalDate("2026-01-20");
    const now = new Date();
    const yearOption =
      dueDate && dueDate.getFullYear() !== now.getFullYear()
        ? "numeric"
        : undefined;
    const expected = dueDate?.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: yearOption,
    });
    expect(result.text).toBe(expected);
    expect(result.isOverdue).toBe(false);
  });
});
