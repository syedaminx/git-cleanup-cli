import chalk from "chalk";
import Table from "cli-table3";
import inquirer from "inquirer";
import {
	DELETION_METHODS,
	FILTER_DESCRIPTIONS,
	MESSAGES,
	PROMPTS,
} from "./constants";
import { analyzeBranches, deleteBranch } from "./git-utils";
import type { BranchInfo } from "./types";
import { pluralize } from "./utils";

export const listBranches = async (
	staleDays = 30,
	mergedOnly = false,
	myBranchesOnly = false,
) => {
	const filterDescription = getFilterDescription(
		myBranchesOnly,
		mergedOnly,
		staleDays,
	);

	console.log(chalk.blue(filterDescription));

	const branches = analyzeBranches(staleDays, mergedOnly, myBranchesOnly);

	if (branches.length === 0) {
		console.log(chalk.green(MESSAGES.NO_STALE_BRANCHES));
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
			message: PROMPTS.DELETE_CONFIRMATION,
			default: false,
		},
	]);

	if (shouldDelete) {
		await chooseDeletionMethod(branches);
	}
};

const getFilterDescription = (
	myBranchesOnly: boolean,
	mergedOnly: boolean,
	staleDays: number,
) => {
	let key: keyof typeof FILTER_DESCRIPTIONS;
	if (myBranchesOnly && mergedOnly) {
		key = "my_merged_branches";
	} else if (myBranchesOnly) {
		key = "my_branches_only";
	} else if (mergedOnly) {
		key = "merged_only";
	} else {
		key = "all_branches";
	}

	return `\n🔍 Analyzing ${FILTER_DESCRIPTIONS[key]} that have been stale for ${pluralize("day", staleDays)}...\n`;
};

const chooseDeletionMethod = async (branches: BranchInfo[]) => {
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

const interactiveBranchDeletion = async (branches: BranchInfo[]) => {
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

const confirmDeletion = async (branchCount: number) => {
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

const deleteAllBranches = async (branches: BranchInfo[]) => {
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

	console.log(chalk.green(MESSAGES.BRANCH_DELETION_COMPLETED));
};
