import { execSync } from "node:child_process";
import type { BranchInfo } from "./types";

export const runGitCommand = (command: string) => {
	try {
		const result = execSync(command, { encoding: "utf-8" });
		return result.trim();
	} catch (_error) {
		throw new Error(`Error running git command: ${command}`);
	}
};

const getAllBranchesWithAuthors = (): Array<{
	name: string;
	authorName: string;
	authorEmail: string;
}> => {
	const output = runGitCommand(
		"git for-each-ref --format='%(refname:short)|%(authorname)|%(authoremail)' refs/heads/ --sort=-committerdate",
	);

	return output
		.split("\n") // split into lines
		.map((line) => line.trim()) // trim whitespace
		.filter((line) => line.length > 0)
		.map((line) => {
			const [name, authorName, authorEmail] = line.split("|"); // split into name, author name, and author email
			return {
				name: name || "",
				authorName: authorName || "",
				authorEmail: authorEmail || "",
			};
		});
};

const getCurrentGitUser = (): { name: string; email: string } => {
	try {
		const name = runGitCommand("git config user.name").trim();
		const email = runGitCommand("git config user.email").trim();
		return { name, email };
	} catch {
		return { name: "", email: "" };
	}
};

const getLastCommitInfo = (branchName: string) => {
	const output = runGitCommand(`git log --format="%H|%ci" -1 ${branchName}`);
	const [hash, dateStr] = output.split("|");

	return {
		hash: hash?.trim(),
		date: new Date(dateStr?.trim() || ""),
	};
};

const isBranchMerged = (branchName: string, mainBranch: string = "main") => {
	try {
		// This command returns exit code 0 if branchName is an ancestor of mainBranch (i.e., merged)
		runGitCommand(`git merge-base --is-ancestor ${branchName} ${mainBranch}`);
		return true;
	} catch {
		// Exit code 1 means not merged, any other error also means not merged
		return false;
	}
};

const getCommitsBehindMain = (
	branchName: string,
	mainBranch: string = "main",
) => {
	try {
		const output = runGitCommand(
			`git rev-list --count ${mainBranch}..${branchName}`,
		);
		return parseInt(output.trim(), 10);
	} catch {
		return 0;
	}
};

export const analyzeBranches = (
	staleDays = 30,
	mergedOnly = false,
	myBranchesOnly = false,
) => {
	// Use optimized query to get branches with authors in one go
	const branchesWithAuthors = getAllBranchesWithAuthors();
	const currentBranch = runGitCommand("git branch --show-current").trim();
	const mainBranch = "main";

	// Get current user info for filtering if needed
	const currentUser = myBranchesOnly
		? getCurrentGitUser()
		: { name: "", email: "" };

	const branchInfo: BranchInfo[] = [];

	for (const branchData of branchesWithAuthors) {
		try {
			const { name: branch, authorName, authorEmail } = branchData;

			const lastCommitInfo = getLastCommitInfo(branch);
			const isStale =
				lastCommitInfo.date.getTime() <
				Date.now() - staleDays * 24 * 60 * 60 * 1000;

			if (!isStale) continue;

			const isMerged = isBranchMerged(branch, mainBranch);

			// If mergedOnly is true, skip branches that aren't merged
			if (mergedOnly && !isMerged) continue;

			// If myBranchesOnly is true, skip branches not authored by current user
			if (myBranchesOnly) {
				const isMyBranch =
					(currentUser.name && authorName === currentUser.name) ||
					(currentUser.email && authorEmail === currentUser.email);
				if (!isMyBranch) continue;
			}

			const commitsBehindMain = getCommitsBehindMain(branch, mainBranch);
			const isCurrent = branch === currentBranch;

			branchInfo.push({
				name: branch,
				lastCommitDate: lastCommitInfo.date,
				lastCommitHash: lastCommitInfo.hash,
				isMerged,
				commitsBehindMain,
				isStale,
				isCurrent,
			});
		} catch (error) {
			console.error(`Error analyzing branch ${branchData.name}:`, error);
		}
	}

	return branchInfo;
};

export const deleteBranch = (branchName: string, force = true) => {
	const deleteFlag = force ? "-D" : "-d";
	try {
		runGitCommand(`git branch ${deleteFlag} ${branchName}`);
		return true;
	} catch (error) {
		throw new Error(`Failed to delete branch ${branchName}: ${error}`);
	}
};
