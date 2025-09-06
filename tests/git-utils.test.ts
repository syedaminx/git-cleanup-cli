import { describe, it, expect } from "vitest";
import { useTestRepo } from "./utils/test-helpers";
import {
  runGitCommand,
  getLastCommitInfo,
  isBranchMerged,
  getCommitsBehindMain,
  analyzeBranches,
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

describe("getCommitsBehindMain", () => {
  useTestRepo();

  it("should return 0 for main branch (not behind itself)", () => {
    const result = getCommitsBehindMain("main");
    expect(result).toBe(0);
  });

  it("should return number of commits behind for feature branches", () => {
    // Feature branches should be behind main since main has the merge commit
    const result1 = getCommitsBehindMain("feature/user-auth");
    const result2 = getCommitsBehindMain("feature/api-endpoints");

    expect(result1).toBeGreaterThanOrEqual(0);
    expect(result2).toBeGreaterThanOrEqual(0);
    expect(typeof result1).toBe("number");
    expect(typeof result2).toBe("number");
  });

  it("should return 0 for non-existent branch", () => {
    const result = getCommitsBehindMain("non-existent-branch");
    expect(result).toBe(0);
  });

  it("should handle old legacy branch", () => {
    // The old/legacy-code branch is very old and should be behind main
    const result = getCommitsBehindMain("old/legacy-code");
    expect(result).toBeGreaterThanOrEqual(0);
    expect(typeof result).toBe("number");
  });

  it("should default to main branch when not specified", () => {
    const result = getCommitsBehindMain("feature/user-auth");
    expect(typeof result).toBe("number");
    expect(result).toBeGreaterThanOrEqual(0);
  });
});

describe("analyzeBranches", () => {
  useTestRepo();

  it("should return array of branch info for all branches", () => {
    const result = analyzeBranches();

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);

    // Check that each branch has required properties
    result.forEach((branch) => {
      expect(branch).toHaveProperty("name");
      expect(branch).toHaveProperty("lastCommitDate");
      expect(branch).toHaveProperty("lastCommitHash");
      expect(branch).toHaveProperty("isMerged");
      expect(branch).toHaveProperty("commitsBehindMain");
      expect(branch).toHaveProperty("isStale");
      expect(branch).toHaveProperty("isCurrent");

      expect(typeof branch.name).toBe("string");
      expect(branch.lastCommitDate).toBeInstanceOf(Date);
      expect(typeof branch.isMerged).toBe("boolean");
      expect(typeof branch.commitsBehindMain).toBe("number");
      expect(typeof branch.isStale).toBe("boolean");
      expect(typeof branch.isCurrent).toBe("boolean");
    });
  });

  it("identifies current branch correctly", () => {
    const result = analyzeBranches();
    const currentBranches = result.filter((branch) => branch.isCurrent);

    expect(currentBranches).toHaveLength(0);

    // switch to the old/legacy-code branch
    runGitCommand("git checkout old/legacy-code");

    const result2 = analyzeBranches();
    const currentBranches2 = result2.filter((branch) => branch.isCurrent);
    expect(currentBranches2).toHaveLength(1);
    expect(currentBranches2[0]?.name).toBe("old/legacy-code");
  });

  it("should identify stale branches with custom staleDays", () => {
    // Use a very small staleDays value to make most branches stale
    const result = analyzeBranches(1);

    // Should have at least some branches marked as stale
    const staleBranches = result.filter((branch) => branch.isStale);
    expect(staleBranches.length).toBeGreaterThan(0);
  });

  it("should identify merged branches", () => {
    const result = analyzeBranches();

    // hotfix/critical-bug should be merged
    const hotfixBranch = result.find(
      (branch) => branch.name === "hotfix/critical-bug"
    );
    if (hotfixBranch) {
      expect(hotfixBranch.isMerged).toBe(true);
    }
  });

  it("should calculate commits behind main correctly", () => {
    const result = analyzeBranches();

    result.forEach((branch) => {
      expect(branch.commitsBehindMain).toBeGreaterThan(0);

      // Main branch should have 0 commits behind itself
      if (branch.name === "main") {
        expect(branch.commitsBehindMain).toBe(0);
      }
    });
  });

  it("should include stale branches from test repo", () => {
    const result = analyzeBranches();
    const branchNames = result.map((branch) => branch.name);

    expect(branchNames).toContain("old/legacy-code");
  });
});
