import { describe, expect, it } from "vitest";
import { pluralize } from "../src/utils";

describe("pluralize", () => {
	it("should return singular form for count of 1", () => {
		expect(pluralize("branch", 1)).toBe("1 branch");
		expect(pluralize("file", 1)).toBe("1 file");
		expect(pluralize("item", 1)).toBe("1 item");
	});

	it("should return plural form for count of 0", () => {
		expect(pluralize("branch", 0)).toBe("0 branches");
		expect(pluralize("file", 0)).toBe("0 files");
		expect(pluralize("item", 0)).toBe("0 items");
	});

	it("should return plural form for count greater than 1", () => {
		expect(pluralize("branch", 2)).toBe("2 branches");
		expect(pluralize("branch", 5)).toBe("5 branches");
		expect(pluralize("branch", 10)).toBe("10 branches");
	});

	it("should use custom plural form when provided", () => {
		expect(pluralize("child", 1, "children")).toBe("1 child");
		expect(pluralize("child", 2, "children")).toBe("2 children");
		expect(pluralize("child", 0, "children")).toBe("0 children");
	});

	it("should handle edge cases with custom plural forms", () => {
		expect(pluralize("person", 1, "people")).toBe("1 person");
		expect(pluralize("person", 3, "people")).toBe("3 people");
		expect(pluralize("mouse", 1, "mice")).toBe("1 mouse");
		expect(pluralize("mouse", 5, "mice")).toBe("5 mice");
	});

	it("should handle decimal numbers (treat as plural)", () => {
		expect(pluralize("branch", 1.5)).toBe("1.5 branches");
		expect(pluralize("item", 0.5)).toBe("0.5 items");
	});
});
