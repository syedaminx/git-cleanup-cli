import { describe, it, expect } from "vitest";
import { useTestRepo } from "./utils/test-helpers";
import { runGitCommand, getLastCommitInfo } from "../src/git-utils";

describe("runGitCommand", () => {
  useTestRepo();

  it("should return branch list", () => {
    const result = runGitCommand("git branch");

    expect(result).toContain("master");
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
    const result = getLastCommitInfo("master");

    expect(result.hash).toBeDefined();
    expect(result.hash).toMatch(/^[a-f0-9]{40}$/); // Full git hash format
    expect(result.date).toBeInstanceOf(Date);
    expect(result.date.getTime()).toBeGreaterThan(0); // Valid date
  });

  it("should throw error for non-existent branch", () => {
    expect(() => getLastCommitInfo("non-existent-branch")).toThrow();
  });
});
