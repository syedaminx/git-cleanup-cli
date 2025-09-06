import { analyzeBranches } from "./git-utils";
import chalk from "chalk";
import Table from "cli-table3";

export const listBranches = (staleDays: number = 30) => {
  console.log(
    chalk.blue(
      `\n🔍 Analyzing branches that have been stale for ${staleDays} days...\n`
    )
  );

  const branches = analyzeBranches(staleDays);

  if (branches.length === 0) {
    console.log(chalk.green("No stale branches found.\n"));
    return;
  }

  const table = new Table({
    head: ["Branch", "Last Commit", "Merged", "Commits Behind Main"],
    colWidths: [25, 12, 12, 15, 20],
  });

  branches.forEach((branch) => {
    table.push([
      branch.isCurrent ? chalk.yellow(`* ${branch.name}`) : branch.name,
      branch.lastCommitDate.toLocaleDateString(),
      branch.isMerged ? chalk.green("Yes") : chalk.blue("No"),
      branch.commitsBehindMain.toString(),
    ]);
  });

  console.log(table.toString());
};
