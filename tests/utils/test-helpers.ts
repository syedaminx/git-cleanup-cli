import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach } from "vitest";

export const useTestRepo = (repoName: string = "test-repo-1") => {
	const sourceRepoPath = path.resolve(`./tests/repos/${repoName}`);
	const tempDir = path.resolve("./tests/repos/tmp");
	const uuid = randomUUID();
	const testRepoPath = path.resolve(tempDir, uuid);
	const originalCwd = process.cwd();

	beforeEach(() => {
		// Ensure temp directory exists
		if (!fs.existsSync(tempDir)) {
			fs.mkdirSync(tempDir, { recursive: true });
		}

		// Simply copy the entire source repo directory to get everything including all branches
		fs.cpSync(sourceRepoPath, testRepoPath, { recursive: true });

		// Change to the isolated test repo directory
		process.chdir(testRepoPath);
	});

	afterEach(() => {
		// Return to original directory first
		process.chdir(originalCwd);

		// Clean up the isolated test repo
		if (fs.existsSync(testRepoPath)) {
			fs.rmSync(testRepoPath, { recursive: true, force: true });
		}
	});

	return testRepoPath;
};
