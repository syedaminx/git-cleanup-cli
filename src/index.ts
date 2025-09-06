#!/usr/bin/env node

import { Command } from "commander";
import { listBranches } from "./commands";

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
    "30"
  )
  .action(async (options) => {
    const staleDays = parseInt(options.staleDays, 10);
    listBranches(staleDays);
  });

program.parse(process.argv);
