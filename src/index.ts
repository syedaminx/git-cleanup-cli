#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { join } from "node:path";
import chalk from "chalk";
import { Command } from "commander";
import { listBranches } from "./commands";
import { EXITING_MESSAGE } from "./constants";

// Read version from package.json
const packageJsonPath = join(__dirname, "../package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
const version = packageJson.version;

// Global process event handlers for graceful exit
process.on("SIGINT", () => {
	console.log(chalk.gray(EXITING_MESSAGE));
	process.exit(0);
});

process.on("SIGTERM", () => {
	console.log(chalk.gray(EXITING_MESSAGE));
	process.exit(0);
});

// Handle EOF (Ctrl+D) - this is caught by inquirer as an error
process.on("uncaughtException", (error) => {
	if (error.message.includes("User force closed the prompt")) {
		console.log(chalk.gray(EXITING_MESSAGE));
		process.exit(0);
	}
	throw error;
});

const program = new Command();

program
	.name("branch-broom")
	.description("CLI tool to clean up stale git branches")
	.version(version);

program
	.command("list")
	.description("List stale branches with analysis")
	.option(
		"-s, --stale-days <days>",
		"Number of days to consider a branch stale",
		"30",
	)
	.option(
		"-m, --only-merged [value]",
		"Only show branches that have been merged into main (true/false)",
		"false",
	)
	.option("--my-branches", "Only show branches authored by you", false)
	.action(async (options) => {
		const staleDays = parseInt(options.staleDays, 10);
		const onlyMerged =
			options.onlyMerged === "true" || options.onlyMerged === true;
		const myBranches = options.myBranches;

		await listBranches(staleDays, onlyMerged, myBranches);
	});

program.parse(process.argv);
