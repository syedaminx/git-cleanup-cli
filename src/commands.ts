import chalk from "chalk";
import Table from "cli-table3";
import inquirer from "inquirer";
import { analyzeBranches, deleteBranch } from "./git-utils";
import type { BranchInfo } from "./types";
import { pluralize } from "./utils";

export const listBranches = async (
	staleDays = 30,
	mergedOnly = false,
	myBranchesOnly = false,
) => {
	let filterDescription = `\n🔍 Analyzing`;

	if (myBranchesOnly && mergedOnly) {
		filterDescription += ` your merged branches`;
	} else if (myBranchesOnly) {
		filterDescription += ` your branches`;
	} else if (mergedOnly) {
		filterDescription += ` merged branches`;
	} else {
		filterDescription += ` branches`;
	}

	filterDescription += ` that have been stale for ${pluralize("day", staleDays)}...\n`;

	console.log(chalk.blue(filterDescription));

	const branches = analyzeBranches(staleDays, mergedOnly, myBranchesOnly);

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
};

const chooseDeletionMethod = async (branches: BranchInfo[]) => {
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

	const { branchesToDelete } = await inquirer.prompt([
		{
			type: "checkbox",
			name: "branchesToDelete",
			message: "Select branches to delete:",
			choices: deletableBranches.map((branch) => ({
				name: `${branch.name} (${branch.isMerged ? "merged" : "not merged"})`,
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
		await confirmDeletion(branchesToDelete.length);

		console.log(
			chalk.yellow(
				`\n🗑️  Deleting ${pluralize("branch", branchesToDelete.length)}...\n`,
			),
		);

		await deleteBranches(branchesToDelete);
	}
};

const confirmDeletion = async (branchCount: number) => {
	await inquirer.prompt([
		{
			type: "input",
			name: "confirmation",
			message: `This will delete ${pluralize("branch", branchCount)}. Type '${chalk.red("delete")}' to confirm:`,
			validate: (input) => {
				if (input.toLowerCase() === "delete") {
					return true;
				}
				return "You must type 'delete' to confirm this action.";
			},
		},
	]);
};

const deleteAllBranches = async (branches: BranchInfo[]) => {
	const deletableBranchNames = branches.reduce<string[]>((acc, branch) => {
		if (!branch.isCurrent) acc.push(branch.name);
		return acc;
	}, []);

	if (deletableBranchNames.length === 0) {
		console.log(
			chalk.yellow(
				"\n⚠️  No branches available for deletion (current branch cannot be deleted).\n",
			),
		);
		return;
	}

	await confirmDeletion(deletableBranchNames.length);

	console.log(
		chalk.yellow(
			`\n🗑️  Deleting ${pluralize("branch", deletableBranchNames.length)}...\n`,
		),
	);

	await deleteBranches(deletableBranchNames);
};

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
};
