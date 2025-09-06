import chalk from "chalk";
import Table from "cli-table3";
import inquirer from "inquirer";
import { MESSAGES, PROMPTS } from "./constants";
import { chooseDeletionMethod } from "./deletion";
import { analyzeBranches } from "./git-utils";
import { getFilterDescription } from "./utils";

export const listBranches = async (
	staleDays = 30,
	onlyMerged = false,
	myBranchesOnly = false,
) => {
	const filterDescription = getFilterDescription(
		myBranchesOnly,
		onlyMerged,
		staleDays,
	);

	console.log(chalk.blue(filterDescription));

	const branches = analyzeBranches(staleDays, onlyMerged, myBranchesOnly);

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
