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

	it("should filter to only merged branches with --merged", () => {
		const allBranchesResult = runCLI("list --stale-days 365");
		const onlyMergedResult = runCLI("list --stale-days 365 --merged");

		expect(allBranchesResult.exitCode).toBe(0);
		expect(onlyMergedResult.exitCode).toBe(0);

		// Should show "merged branches" in the analysis message
		expect(onlyMergedResult.stdout).toContain("Analyzing merged branches");

		// Parse both outputs to compare
		const allBranches = parseCLIOutput(allBranchesResult.stdout);
		const mergedBranches = parseCLIOutput(onlyMergedResult.stdout);

		// All branches in merged result should be marked as merged
		for (const branch of mergedBranches.branches) {
			expect(branch.merged).toBe("Yes");
		}

		// Should have fewer or equal branches when filtering to merged only
		expect(mergedBranches.branches.length).toBeLessThanOrEqual(
			allBranches.branches.length,
		);
	});

	it("should support --merged=true and --merged=false explicitly", () => {
		const mergedTrueResult = runCLI("list --stale-days 365 --merged=true");
		const mergedFalseResult = runCLI("list --stale-days 365 --merged=false");
		const noFlagResult = runCLI("list --stale-days 365");

		expect(mergedTrueResult.exitCode).toBe(0);
		expect(mergedFalseResult.exitCode).toBe(0);
		expect(noFlagResult.exitCode).toBe(0);

		// --merged=true should show "merged branches" message
		expect(mergedTrueResult.stdout).toContain("Analyzing merged branches");

		// --merged=false should show regular message (same as no flag)
		expect(mergedFalseResult.stdout).not.toContain("Analyzing merged branches");
		expect(noFlagResult.stdout).not.toContain("Analyzing merged branches");

		// --merged=false should give same results as no flag
		expect(mergedFalseResult.stdout).toBe(noFlagResult.stdout);
	});

	it("should filter to only current user branches with --my-branches", () => {
		// First, we need to create a branch with a different author in the test repo
		// This requires working directly with the test repo
		const { execSync } = require("node:child_process");

		// Get the test repo path from environment (set by useTestRepo)
		const testRepoPath = process.cwd();

		// Get current user info
		const currentUserName = execSync("git config user.name", {
			encoding: "utf-8",
			cwd: testRepoPath,
		}).trim();
		const currentUserEmail = execSync("git config user.email", {
			encoding: "utf-8",
			cwd: testRepoPath,
		}).trim();

		// Create a test branch with a different author
		const testBranchForOtherAuthor = "test/cli-different-author-branch";
		execSync(`git checkout -b ${testBranchForOtherAuthor}`, {
			cwd: testRepoPath,
		});

		// Set different author temporarily
		execSync("git config user.name 'CLI Test Author'", { cwd: testRepoPath });
		execSync("git config user.email 'cli-test@example.com'", {
			cwd: testRepoPath,
		});

		// Create a backdated commit to make it stale
		const pastDate = new Date();
		pastDate.setDate(pastDate.getDate() - 400); // 400 days ago
		const dateStr = pastDate.toISOString();

		execSync(
			`git commit --allow-empty -m 'CLI test commit by different author'`,
			{
				cwd: testRepoPath,
				env: {
					...process.env,
					GIT_AUTHOR_DATE: dateStr,
					GIT_COMMITTER_DATE: dateStr,
				},
			},
		);

		// Restore original user config
		execSync(`git config user.name '${currentUserName}'`, {
			cwd: testRepoPath,
		});
		execSync(`git config user.email '${currentUserEmail}'`, {
			cwd: testRepoPath,
		});

		// Switch back to main
		execSync("git checkout main", { cwd: testRepoPath });

		// Test CLI with and without --my-branches
		const allBranchesResult = runCLI("list --stale-days 365");
		const myBranchesResult = runCLI("list --stale-days 365 --my-branches");

		expect(allBranchesResult.exitCode).toBe(0);
		expect(myBranchesResult.exitCode).toBe(0);

		// Should show "your branches" in the analysis message
		expect(myBranchesResult.stdout).toContain("Analyzing your branches");

		// Parse both outputs to compare
		const allBranches = parseCLIOutput(allBranchesResult.stdout);
		const myBranches = parseCLIOutput(myBranchesResult.stdout);

		const allBranchNames = allBranches.branches.map((b) => b.name);
		const myBranchNames = myBranches.branches.map((b) => b.name);

		// The different-author branch should be in all branches but not in my branches
		expect(allBranchNames).toContain(testBranchForOtherAuthor);
		expect(myBranchNames).not.toContain(testBranchForOtherAuthor);

		// Should have fewer or equal branches when filtering to my branches only
		expect(myBranches.branches.length).toBeLessThanOrEqual(
			allBranches.branches.length,
		);
	});
});
