#!/usr/bin/env node

import chalk from "chalk";
import { Command } from "commander";
import { listBranches } from "./commands";
import { EXITING_MESSAGE } from "./constants";

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
	.name("git-cleanup")
	.description("CLI tool to clean up stale git branches")
	.version("1.0.0");

program
	.command("list")
	.description("List stale branches with analysis")
	.option(
		"-s, --stale-days <days>",
		"Number of days to consider a branch stale",
		"30",
	)
	.action(async (options) => {
		const staleDays = parseInt(options.staleDays, 10);
		await listBranches(staleDays);
	});

program.parse(process.argv);
