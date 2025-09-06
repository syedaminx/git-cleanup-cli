import chalk from "chalk";
import Table from "cli-table3";
import inquirer from "inquirer";
import { analyzeBranches, deleteBranch } from "./git-utils";
import type { BranchInfo } from "./types";

export const listBranches = async (staleDays: number = 30) => {
	console.log(
		chalk.blue(
			`\n🔍 Analyzing branches that have been stale for ${staleDays} days...\n`,
		),
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
	} catch (_error) {
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
				await interactiveBranchDeletion(branches);
				break;
			case "all":
				await deleteAllBranches(branches);
				break;
		}
	} catch (_error) {
		// Handle Ctrl+C or Ctrl+D
		console.log(chalk.gray("Exiting...\n"));
		process.exit(0);
	}
};

const interactiveBranchDeletion = async (branches: BranchInfo[]) => {
	const deletableBranches = branches.filter((branch) => !branch.isCurrent);

	if (deletableBranches.length === 0) {
		console.log(
			chalk.yellow(
				"\n⚠️  No branches available for deletion (current branch cannot be deleted).\n",
			),
		);
		return;
	}

	try {
		const { branchesToDelete }: { branchesToDelete: string[] } = await inquirer.prompt([
			{
				type: "checkbox",
				name: "branchesToDelete",
				message: "Select branches to delete:",
				choices: deletableBranches.map((branch) => ({
					name: `${
						branch.name
					} (${branch.isMerged ? "merged" : "not merged"})`,
					value: branch.name,
					checked: false,
				})),
				validate: (answer) => {
					if (answer.length === 0) {
						return "You must choose at least one branch to delete.";
					}
					return true;
				},
			},
		]);

		if (branchesToDelete.length > 0) {
			console.log(
				chalk.yellow(
					`\n🗑️  Deleting ${branchesToDelete.length} branch(es)...\n`,
				),
			);

        await deleteBranches(branchesToDelete);
      }
	} catch (_error) {
		// Handle Ctrl+C or Ctrl+D
		console.log(chalk.gray("Exiting...\n"));
		process.exit(0);
	}
};

const deleteAllBranches = async (branches: BranchInfo[]) => {
  try {
    await inquirer.prompt([
      {
        type: "input",
        name: "confirmation",
        message: `This will delete ALL stale branches. Type '${chalk.red("delete")}' to confirm:`,
        validate: (input) => {
          if (input.toLowerCase() === "delete") {
            return true;
          }
          return "You must type 'delete' to confirm this action.";
        },
      },
    ]);

    // If we reach here, user typed "delete" correctly
    const deletableBranchNames = branches.reduce<string[]>((acc, branch) => {
      if (!branch.isCurrent) acc.push(branch.name);
      return acc;
    }, []);
    
    if (deletableBranchNames.length === 0) {
      console.log(chalk.yellow("\n⚠️  No branches available for deletion (current branch cannot be deleted).\n"));
      return;
    }

    console.log(chalk.yellow(`\n🗑️  Deleting ${deletableBranchNames.length} branch(es)...\n`));
    
    await deleteBranches(deletableBranchNames);
  } catch (_error) {
    // Handle Ctrl+C or Ctrl+D
    console.log(chalk.gray("Exiting...\n"));
    process.exit(0);
  }
}

const deleteBranches = async (branchNames: string[]) => {
  for (const branchName of branchNames) {
    try {
      deleteBranch(branchName);
      console.log(chalk.green(`✅ Deleted branch: ${branchName}`));
    } catch (error) {
      console.log(
        chalk.red(`❌ Failed to delete branch: ${branchName} - ${error}`),
      );
    }
  }

  console.log(chalk.green(`\n🎉 Branch deletion completed!\n`));
}
