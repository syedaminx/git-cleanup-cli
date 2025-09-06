import { execSync } from "node:child_process";
import path from "node:path";

/**
 * Execute the CLI command and return the output
 * @param command - The CLI command to run (e.g., "list", "list --stale-days 7")
 * @param options - Additional options
 * @returns Object containing stdout, stderr, and exitCode
 */
export const runCLI = (command: string, options: { timeout?: number; input?: string } = {}) => {
	// Get the project root directory (3 levels up from tests/utils/cli-helpers.ts)
	const projectRoot = path.resolve(__dirname, "../..");
	const cliPath = path.resolve(projectRoot, "dist/index.js");
	const fullCommand = `node ${cliPath} ${command}`;
	
	try {
		const result = execSync(fullCommand, {
			encoding: "utf8",
			timeout: options.timeout || 2000,
			input: options.input || "\n", // Provide default input to avoid hanging
			stdio: ["pipe", "pipe", "pipe"],
		});
		
		return {
			stdout: result.toString(),
			stderr: "",
			exitCode: 0,
		};
	} catch (error: unknown) {
		const execError = error as { stdout?: Buffer; stderr?: Buffer; status?: number; signal?: string };
		
		// Handle timeout as a special case
		if (execError.signal === 'SIGTERM') {
			return {
				stdout: execError.stdout?.toString() || "",
				stderr: "Command timed out",
				exitCode: 124, // Common timeout exit code
			};
		}
		
		return {
			stdout: execError.stdout?.toString() || "",
			stderr: execError.stderr?.toString() || "",
			exitCode: execError.status || 1,
		};
	}
};

/**
 * Run CLI command with user input simulation
 * @param command - The CLI command to run
 * @param inputs - Array of inputs to send (e.g., ["n", "exit"])
 * @returns CLI execution result
 */
export const runCLIWithInput = (command: string, inputs: string[]) => {
	const inputString = `${inputs.join("\n")}\n`;
	return runCLI(command, { input: inputString });
};

/**
 * Parse the CLI table output into structured data
 * @param output - The stdout from CLI execution
 * @returns Parsed branch information
 */
export const parseCLIOutput = (output: string) => {
	const lines = output.split("\n");
	
	// Find the table start (after the headers)
	const tableStartIndex = lines.findIndex(line => 
		line.includes("Branch") && line.includes("Last Commit") && line.includes("Merged")
	);
	
	if (tableStartIndex === -1) {
		return {
			message: output.trim(),
			branches: [],
		};
	}
	
	const branches: Array<{
		name: string;
		lastCommit: string;
		merged: string;
		commitsBehind: string;
	}> = [];
	
	// Parse table rows (skip header and separator lines)
	for (let i = tableStartIndex + 2; i < lines.length; i++) {
		const line = lines[i].trim();
		if (!line || line.startsWith("│") === false) continue;
		
		// Simple table parsing - split by │ and clean up
		const parts = line.split("│").map(part => part.trim()).filter(part => part);
		if (parts.length >= 4) {
			branches.push({
				name: parts[0].replace("* ", ""), // Remove current branch indicator
				lastCommit: parts[1],
				merged: parts[2],
				commitsBehind: parts[3],
			});
		}
	}
	
	return {
		message: output.trim(),
		branches,
	};
};