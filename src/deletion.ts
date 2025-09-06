import chalk from "chalk";
import inquirer from "inquirer";
import { DELETION_METHODS, MESSAGES, PROMPTS } from "./constants";
import { deleteBranch } from "./git-utils";
import type { BranchInfo } from "./types";
import { pluralize } from "./utils";

/**
 * Prompts user to choose deletion method and executes the selected method
 * @param branches - Array of branch information
 */
export const chooseDeletionMethod = async (branches: BranchInfo[]) => {
	const { deletionMethod } = await inquirer.prompt([
		{
			type: "list",
			name: "deletionMethod",
			message: PROMPTS.DELETION_METHOD,
			choices: [
				DELETION_METHODS.INTERACTIVE,
				{
					name: DELETION_METHODS.ALL.name.replace(
						"{count}",
						branches.length.toString(),
					),
					value: DELETION_METHODS.ALL.value,
				},
			],
			default: DELETION_METHODS.INTERACTIVE.value,
		},
	]);

	switch (deletionMethod) {
		case DELETION_METHODS.INTERACTIVE.value:
			await interactiveBranchDeletion(branches);
			break;
		case DELETION_METHODS.ALL.value:
			await deleteAllBranches(branches);
			break;
	}
};

/**
 * Interactive branch deletion - allows user to select specific branches
 * @param branches - Array of branch information
 */
export const interactiveBranchDeletion = async (branches: BranchInfo[]) => {
	const deletableBranches = branches.filter((branch) => !branch.isCurrent);

	if (deletableBranches.length === 0) {
		console.log(chalk.yellow(MESSAGES.NO_DELETABLE_BRANCHES));
		return;
	}

	const { branchesToDelete } = await inquirer.prompt([
		{
			type: "checkbox",
			name: "branchesToDelete",
			message: PROMPTS.SELECT_BRANCHES,
			choices: deletableBranches.map((branch) => ({
				name: `${branch.name} (${branch.isMerged ? "merged" : "not merged"})`,
				value: branch.name,
				checked: false,
			})),
			validate: (answer) => {
				if (answer.length === 0) {
					return PROMPTS.BRANCH_SELECTION_REQUIRED;
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

/**
 * Prompts user for confirmation before deleting branches
 * @param branchCount - Number of branches to be deleted
 */
export const confirmDeletion = async (branchCount: number) => {
	await inquirer.prompt([
		{
			type: "input",
			name: "confirmation",
			message: `This will delete ${pluralize("branch", branchCount)}. Type '${chalk.red(PROMPTS.TYPE_DELETE_TO_CONFIRM)}' to confirm:`,
			validate: (input) => {
				if (
					input.toLowerCase() === PROMPTS.TYPE_DELETE_TO_CONFIRM.toLowerCase()
				) {
					return true;
				}
				return `You must type '${PROMPTS.TYPE_DELETE_TO_CONFIRM}' to confirm this action.`;
			},
		},
	]);
};

/**
 * Deletes all provided branches (non-current ones)
 * @param branches - Array of branch information
 */
export const deleteAllBranches = async (branches: BranchInfo[]) => {
	const deletableBranchNames = branches.reduce<string[]>((acc, branch) => {
		if (!branch.isCurrent) acc.push(branch.name);
		return acc;
	}, []);

	if (deletableBranchNames.length === 0) {
		console.log(chalk.yellow(MESSAGES.NO_DELETABLE_BRANCHES));
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

/**
 * Executes deletion of branches and handles errors
 * @param branchNames - Array of branch names to delete
 */
export const deleteBranches = async (branchNames: string[]) => {
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

	console.log(chalk.green(MESSAGES.BRANCH_DELETION_COMPLETED));
};
