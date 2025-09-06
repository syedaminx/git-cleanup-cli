import { beforeEach, describe, expect, it, vi } from "vitest";
import { deleteBranches, deleteAllBranches } from "../src/deletion";
import * as gitUtils from "../src/git-utils";
import type { BranchInfo } from "../src/types";

// Mock the git-utils module
vi.mock("../src/git-utils", () => ({
	deleteBranch: vi.fn(),
}));

// Mock inquirer
vi.mock("inquirer", () => ({
	default: {
		prompt: vi.fn(),
	},
}));

// Mock console methods
const mockConsoleLog = vi.spyOn(console, "log").mockImplementation(() => {});

// Sample branch data for tests
const sampleBranches: BranchInfo[] = [
	{
		name: "feature/test-branch",
		lastCommitDate: new Date("2024-01-01"),
		lastCommitHash: "abc123",
		isMerged: false,
		commitsBehindMain: 2,
		isStale: true,
		isCurrent: false,
	},
	{
		name: "main",
		lastCommitDate: new Date("2024-06-01"),
		lastCommitHash: "def456",
		isMerged: true,
		commitsBehindMain: 0,
		isStale: false,
		isCurrent: true,
	},
	{
		name: "old/legacy-branch",
		lastCommitDate: new Date("2023-01-01"),
		lastCommitHash: "ghi789",
		isMerged: true,
		commitsBehindMain: 10,
		isStale: true,
		isCurrent: false,
	},
];

describe("deleteBranches", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should successfully delete all provided branches", async () => {
		const mockDeleteBranch = vi.mocked(gitUtils.deleteBranch);
		mockDeleteBranch.mockImplementation(() => true);

		const branchesToDelete = ["feature/test-branch", "old/legacy-branch"];
		
		await deleteBranches(branchesToDelete);

		// Verify deleteBranch was called for each branch
		expect(mockDeleteBranch).toHaveBeenCalledTimes(2);
		expect(mockDeleteBranch).toHaveBeenCalledWith("feature/test-branch");
		expect(mockDeleteBranch).toHaveBeenCalledWith("old/legacy-branch");

		// Verify success messages were logged
		expect(mockConsoleLog).toHaveBeenCalledWith(
			expect.stringContaining("✅ Deleted branch: feature/test-branch"),
		);
		expect(mockConsoleLog).toHaveBeenCalledWith(
			expect.stringContaining("✅ Deleted branch: old/legacy-branch"),
		);
		expect(mockConsoleLog).toHaveBeenCalledWith(
			expect.stringContaining("🎉 Branch deletion completed!"),
		);
	});

	it("should handle deletion errors gracefully", async () => {
		const mockDeleteBranch = vi.mocked(gitUtils.deleteBranch);
		mockDeleteBranch
			.mockImplementationOnce(() => {
				throw new Error("Cannot delete protected branch");
			})
			.mockImplementationOnce(() => true);

		const branchesToDelete = ["protected-branch", "regular-branch"];
		
		await deleteBranches(branchesToDelete);

		// Verify both branches were attempted
		expect(mockDeleteBranch).toHaveBeenCalledTimes(2);

		// Verify error message was logged for failed deletion
		expect(mockConsoleLog).toHaveBeenCalledWith(
			expect.stringContaining("❌ Failed to delete branch: protected-branch"),
		);
		expect(mockConsoleLog).toHaveBeenCalledWith(
			expect.stringContaining("Cannot delete protected branch"),
		);

		// Verify success message for successful deletion
		expect(mockConsoleLog).toHaveBeenCalledWith(
			expect.stringContaining("✅ Deleted branch: regular-branch"),
		);

		// Verify completion message still appears
		expect(mockConsoleLog).toHaveBeenCalledWith(
			expect.stringContaining("🎉 Branch deletion completed!"),
		);
	});

	it("should handle empty branch list", async () => {
		const mockDeleteBranch = vi.mocked(gitUtils.deleteBranch);
		
		await deleteBranches([]);

		// Verify no deletion attempts were made
		expect(mockDeleteBranch).not.toHaveBeenCalled();

		// Verify completion message still appears
		expect(mockConsoleLog).toHaveBeenCalledWith(
			expect.stringContaining("🎉 Branch deletion completed!"),
		);
	});

	it("should continue deleting remaining branches after one fails", async () => {
		const mockDeleteBranch = vi.mocked(gitUtils.deleteBranch);
		mockDeleteBranch
			.mockImplementationOnce(() => true) // First succeeds
			.mockImplementationOnce(() => {
				throw new Error("Network error");
			}) // Second fails
			.mockImplementationOnce(() => true); // Third succeeds

		const branchesToDelete = ["branch1", "branch2", "branch3"];
		
		await deleteBranches(branchesToDelete);

		// Verify all branches were attempted
		expect(mockDeleteBranch).toHaveBeenCalledTimes(3);
		expect(mockDeleteBranch).toHaveBeenCalledWith("branch1");
		expect(mockDeleteBranch).toHaveBeenCalledWith("branch2");
		expect(mockDeleteBranch).toHaveBeenCalledWith("branch3");

		// Verify appropriate messages were logged
		expect(mockConsoleLog).toHaveBeenCalledWith(
			expect.stringContaining("✅ Deleted branch: branch1"),
		);
		expect(mockConsoleLog).toHaveBeenCalledWith(
			expect.stringContaining("❌ Failed to delete branch: branch2"),
		);
		expect(mockConsoleLog).toHaveBeenCalledWith(
			expect.stringContaining("✅ Deleted branch: branch3"),
		);
		expect(mockConsoleLog).toHaveBeenCalledWith(
			expect.stringContaining("🎉 Branch deletion completed!"),
		);
	});
});

describe("deleteAllBranches", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should delete all non-current branches after confirmation", async () => {
		const inquirer = await import("inquirer");
		const mockPrompt = vi.mocked(inquirer.default.prompt);
		const mockDeleteBranch = vi.mocked(gitUtils.deleteBranch);

		// Mock user confirmation
		mockPrompt.mockResolvedValue({ confirmation: "delete" });
		mockDeleteBranch.mockImplementation(() => true);

		await deleteAllBranches(sampleBranches);

		// Verify confirmation prompt was called
		expect(mockPrompt).toHaveBeenCalledWith([
			expect.objectContaining({
				type: "input",
				name: "confirmation",
				message: expect.stringContaining("This will delete 2 branches"),
			}),
		]);

		// Verify non-current branches were deleted (excluding main which is current)
		expect(mockDeleteBranch).toHaveBeenCalledTimes(2);
		expect(mockDeleteBranch).toHaveBeenCalledWith("feature/test-branch");
		expect(mockDeleteBranch).toHaveBeenCalledWith("old/legacy-branch");
		expect(mockDeleteBranch).not.toHaveBeenCalledWith("main");

		// Verify success messages
		expect(mockConsoleLog).toHaveBeenCalledWith(
			expect.stringContaining("✅ Deleted branch: feature/test-branch"),
		);
		expect(mockConsoleLog).toHaveBeenCalledWith(
			expect.stringContaining("✅ Deleted branch: old/legacy-branch"),
		);
	});

	it("should handle case where all branches are current (no deletable branches)", async () => {
		const branchesAllCurrent: BranchInfo[] = [
			{
				name: "main",
				lastCommitDate: new Date("2024-06-01"),
				lastCommitHash: "abc123",
				isMerged: true,
				commitsBehindMain: 0,
				isStale: false,
				isCurrent: true,
			},
		];

		const inquirer = await import("inquirer");
		const mockPrompt = vi.mocked(inquirer.default.prompt);
		const mockDeleteBranch = vi.mocked(gitUtils.deleteBranch);

		await deleteAllBranches(branchesAllCurrent);

		// Verify no confirmation prompt was called (no deletable branches)
		expect(mockPrompt).not.toHaveBeenCalled();

		// Verify no deletion attempts
		expect(mockDeleteBranch).not.toHaveBeenCalled();

		// Verify "no deletable branches" message was shown
		expect(mockConsoleLog).toHaveBeenCalledWith(
			expect.stringContaining("No branches available for deletion"),
		);
	});

	it("should handle empty branches array", async () => {
		const inquirer = await import("inquirer");
		const mockPrompt = vi.mocked(inquirer.default.prompt);
		const mockDeleteBranch = vi.mocked(gitUtils.deleteBranch);

		await deleteAllBranches([]);

		// Verify no confirmation prompt was called
		expect(mockPrompt).not.toHaveBeenCalled();

		// Verify no deletion attempts
		expect(mockDeleteBranch).not.toHaveBeenCalled();

		// Verify "no deletable branches" message was shown
		expect(mockConsoleLog).toHaveBeenCalledWith(
			expect.stringContaining("No branches available for deletion"),
		);
	});
});