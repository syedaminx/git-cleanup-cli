import { describe, expect, it } from "vitest";
import { parseCLIOutput, runCLI, runCLIWithInput } from "./utils/cli-helpers";
import { useTestRepo } from "./utils/test-helpers";

describe("CLI Integration Tests", () => {
	useTestRepo();

	it("should show no stale branches message when there are no stale branches", () => {
		// Use impossibly high stale period to ensure no branches are stale
		const result = runCLI("list --stale-days 99999");

		expect(result.exitCode).toBe(0);
		expect(result.stdout).toContain("No stale branches found");
	});

	it("should list stale branches with default 30 day threshold", () => {
		const result = runCLI("list");

		expect(result.exitCode).toBe(0);
		expect(result.stdout).toContain(
			"Analyzing branches that have been stale for",
		);
		expect(result.stdout).toContain("30 days");
	});

	it("should list stale branches with custom threshold", () => {
		const result = runCLI("list --stale-days 7");

		expect(result.exitCode).toBe(0);
		expect(result.stdout).toContain(
			"Analyzing branches that have been stale for",
		);
		expect(result.stdout).toContain("7 days");
	});

	it("should display branch table with correct columns", () => {
		const result = runCLI("list --stale-days 365"); // Very long period to catch all branches

		expect(result.exitCode).toBe(0);
		expect(result.stdout).toContain("Branch");
		expect(result.stdout).toContain("Last Commit");
		expect(result.stdout).toContain("Merged");
		expect(result.stdout).toContain("Commits Behind Main");
	});

	it("should parse branch information correctly", () => {
		const result = runCLI("list --stale-days 365");
		const parsed = parseCLIOutput(result.stdout);

		if (parsed.branches.length > 0) {
			const branch = parsed.branches[0];
			expect(branch).toHaveProperty("name");
			expect(branch).toHaveProperty("lastCommit");
			expect(branch).toHaveProperty("merged");
			expect(branch).toHaveProperty("commitsBehind");

			// Validate merge status format
			expect(["Yes", "No"]).toContain(branch.merged);

			// Validate commits behind is a number
			expect(parseInt(branch.commitsBehind, 10)).toBeGreaterThanOrEqual(0);
		}
	});

	it("should handle user declining to delete branches", () => {
		const result = runCLIWithInput("list --stale-days 365", ["n"]);

		expect(result.exitCode).toBe(0);
		expect(result.stdout).not.toContain("Type 'delete' to confirm");
	});

	it("should show deletion method options when user agrees to delete", () => {
		const result = runCLIWithInput("list --stale-days 365", ["y", "exit"]);

		expect(result.stdout).toContain(
			"How would you like to delete the stale branches?",
		);
		expect(result.stdout).toContain("Interactively choose specific branches");
		expect(result.stdout).toContain("Delete all");
	});

	it("should show help when requested", () => {
		const result = runCLI("--help");

		expect(result.exitCode).toBe(0);
		expect(result.stdout).toContain("git-cleanup");
		expect(result.stdout).toContain("clean up stale git branches");
		expect(result.stdout).toContain("list");
	});

	it("should show version when requested", () => {
		const result = runCLI("--version");

		expect(result.exitCode).toBe(0);
		expect(result.stdout).toContain("1.0.0");
	});

	it("should handle invalid commands gracefully", () => {
		const result = runCLI("invalid-command");

		expect(result.exitCode).not.toBe(0);
		expect(result.stderr.length).toBeGreaterThan(0);
	});
});
