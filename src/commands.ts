import chalk from "chalk";
import Table from "cli-table3";
import inquirer from "inquirer";
import { analyzeBranches } from "./git-utils";
import type { BranchInfo } from "./types";

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
      await chooseDeletionMethod(branches);
    }
  } catch (error) {
    // Handle Ctrl+C or Ctrl+D (EOF/interrupt)
    console.log(chalk.gray("Exiting...\n"));
    process.exit(0);
  }
};

const chooseDeletionMethod = async (branches: BranchInfo[]) => {
  try {
    const { deletionMethod } = await inquirer.prompt([
      {
        type: "list",
        name: "deletionMethod",
        message: "How would you like to delete the stale branches?",
        choices: [
          {
            name: "📋 Interactively choose specific branches to delete",
            value: "interactive",
          },
          {
            name: `🗑️  Delete all ${branches.length} stale branches`,
            value: "all",
          },
        ],
        default: "interactive",
      },
    ]);

    switch (deletionMethod) {
      case "interactive":
        console.log(chalk.yellow("\n🚧 Interactive selection coming soon!\n"));
        // TODO: Implement interactive branch selection
        break;
      case "all":
        console.log(chalk.yellow("\n🚧 Delete all branches coming soon!\n"));
        // TODO: Implement delete all with confirmation
        break;
    }
  } catch (error) {
    // Handle Ctrl+C or Ctrl+D
    console.log(chalk.gray("Exiting...\n"));
    process.exit(0);
  }
};
