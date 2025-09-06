import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { execSync } from "child_process";
import path from "path";
import { runGitCommand } from "../src/git-utils";

describe("runGitCommand", () => {
  const testRepoPath = path.resolve("./tests/repos/test-repo-1");
  const originalCwd = process.cwd();

  beforeEach(() => {
    process.chdir(testRepoPath);
    // Save current state
    try {
      execSync("git add -A", { stdio: "ignore" });
      execSync('git stash push -u -m "test-backup"', { stdio: "ignore" });
    } catch {
      // No changes to stash, that's fine
    }
  });

  afterEach(() => {
    // Restore state
    execSync("git reset --hard HEAD", { stdio: "ignore" });
    execSync("git clean -fd", { stdio: "ignore" });
    try {
      execSync("git stash pop", { stdio: "ignore" });
    } catch {
      // No stash to pop, that's fine
    }
    process.chdir(originalCwd);
  });

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
