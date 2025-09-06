import { describe, it, expect } from "vitest";
import { useTestRepo } from "./utils/test-helpers";
import {
  runGitCommand,
  getLastCommitInfo,
  isBranchMerged,
} from "../src/git-utils";

describe("runGitCommand", () => {
  useTestRepo();

  it("should return branch list", () => {
    const result = runGitCommand("git branch");

    expect(result).toContain("main");
    expect(result).toContain("feature/user-auth");
    expect(result).toContain("old/legacy-code");
  });

  it("should return current branch name", () => {
    const result = runGitCommand("git branch --show-current");

    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("should handle git log commands", () => {
    const result = runGitCommand("git log --oneline -5");

    expect(result).toContain("Critical hotfix");
    expect(result.split("\n").length).toBeGreaterThanOrEqual(1);
  });

  it("should throw error for invalid git command", () => {
    expect(() => runGitCommand("git invalid-command-xyz")).toThrow(
      "Error running git command"
    );
  });

  it("should handle git status", () => {
    const result = runGitCommand("git status --porcelain");

    expect(typeof result).toBe("string");
    // Should be empty since repo is clean
    expect(result).toBe("");
  });
});

describe("getLastCommitInfo", () => {
  useTestRepo();

  it("should return commit info for a branch", () => {
    const result = getLastCommitInfo("main");

    expect(result.hash).toBeDefined();
    expect(result.hash).toMatch(/^[a-f0-9]{40}$/); // Full git hash format
    expect(result.date).toBeInstanceOf(Date);
    expect(result.date.getTime()).toBeGreaterThan(0); // Valid date
  });

  it("should throw error for non-existent branch", () => {
    expect(() => getLastCommitInfo("non-existent-branch")).toThrow();
  });
});

describe("isBranchMerged", () => {
  useTestRepo();

  it("should return true for merged branch", () => {
    // hotfix/critical-bug was merged into main in our test repo
    const result = isBranchMerged("hotfix/critical-bug");
    expect(result).toBe(true);
  });

  it("should return false for unmerged branches", () => {
    // feature branches are not merged
    const result1 = isBranchMerged("feature/user-auth");
    const result2 = isBranchMerged("feature/api-endpoints");

    expect(result1).toBe(false);
    expect(result2).toBe(false);
  });

  it("should return true for master branch compared to itself", () => {
    const result = isBranchMerged("main");
    expect(result).toBe(true);
  });

  it("should default to 'main' branch when not specified", () => {
    const result = isBranchMerged("feature/user-auth");
    expect(typeof result).toBe("boolean");
  });

  it("should return false for non-existent branch", () => {
    const result = isBranchMerged("non-existent-branch");
    expect(result).toBe(false);
  });
});
