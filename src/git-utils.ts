import { execSync } from "child_process";

export const runGitCommand = (command: string) => {
  try {
    const result = execSync(command, { encoding: "utf-8" });
    return result.trim();
  } catch (error) {
    throw new Error(`Error running git command: ${command}`);
  }
};

const getAllGitBranches = () => {
  const branches = runGitCommand("git branch");

  return branches
    .split("\n")
    .map((branch) => branch.replace(/^\*?\s+/, "")) // Remove * and whitespace
    .filter((branch) => branch.length > 0); // Remove empty lines
};

export const getLastCommitInfo = (branchName: string) => {
  const output = runGitCommand(`git log --format="%H|%ci" -1 ${branchName}`);
  const [hash, dateStr] = output.split("|");

  return {
    hash: hash?.trim(),
    date: new Date(dateStr?.trim() || ""),
  };
};

export const isBranchMerged = (
  branchName: string,
  mainBranch: string = "main"
) => {
  try {
    // This command returns exit code 0 if branchName is an ancestor of mainBranch (i.e., merged)
    runGitCommand(`git merge-base --is-ancestor ${branchName} ${mainBranch}`);
    return true;
  } catch {
    // Exit code 1 means not merged, any other error also means not merged
    return false;
  }
};
