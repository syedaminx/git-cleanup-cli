import chalk from "chalk";
import Table from "cli-table3";
import inquirer from "inquirer";
import { analyzeBranches } from "./git-utils";

export const listBranches = async (staleDays: number = 30) => {
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
    wordWrap: true,
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

  try {
    const { shouldDelete } = await inquirer.prompt([
      {
        type: "confirm",
        name: "shouldDelete",
        message: "Would you like to delete any of these stale branches?",
        default: false,
      },
    ]);

    if (shouldDelete) {
      console.log(chalk.yellow("\n🚧 Branch deletion feature coming soon!\n"));
      // TODO: Implement branch selection and deletion
    }
  } catch (error) {
    // Handle Ctrl+C or Ctrl+D (EOF/interrupt)
    console.log(chalk.gray("Exiting...\n"));
    process.exit(0);
  }
};
