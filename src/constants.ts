export const EXITING_MESSAGE = "Exiting...";

// Filter description mappings
export const FILTER_DESCRIPTIONS = {
	all_branches: "branches",
	merged_only: "merged branches",
	my_branches_only: "your branches",
	my_merged_branches: "your merged branches",
} as const;

// Messages
export const MESSAGES = {
	NO_STALE_BRANCHES: "No stale branches found.\n",
	NO_DELETABLE_BRANCHES:
		"\n⚠️  No branches available for deletion (current branch cannot be deleted).\n",
	BRANCH_DELETION_COMPLETED: "\n🎉 Branch deletion completed!\n",
} as const;

// Prompts
export const PROMPTS = {
	DELETE_CONFIRMATION: "Would you like to delete any of these stale branches?",
	DELETION_METHOD: "How would you like to delete the stale branches?",
	SELECT_BRANCHES: "Select branches to delete:",
	BRANCH_SELECTION_REQUIRED: "You must choose at least one branch to delete.",
	TYPE_DELETE_TO_CONFIRM: "delete",
} as const;

// Deletion method choices
export const DELETION_METHODS = {
	INTERACTIVE: {
		name: "📋 Interactively choose specific branches to delete",
		value: "interactive",
	},
	ALL: {
		name: "🗑️  Delete all {count} stale branches",
		value: "all",
	},
} as const;
