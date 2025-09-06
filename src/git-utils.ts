import { execSync } from "child_process";

const runGitCommand = (command: string) => {
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
    .filter((branch) => branch.length > 0) // Remove empty lines
    .filter((branch) => !branch.startsWith("*")); // Skip current branch
};
