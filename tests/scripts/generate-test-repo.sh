#!/bin/bash

# Script to generate a test git repository with branches for testing git-cleanup-cli

REPOS_DIR="$(dirname "$0")/../repos"
mkdir -p "$REPOS_DIR"

# Count existing test repos and increment
EXISTING_COUNT=$(find "$REPOS_DIR" -maxdepth 1 -name "test-repo-*" -type d | wc -l | tr -d ' ')
NEXT_INDEX=$((EXISTING_COUNT + 1))
REPO_NAME="test-repo-$NEXT_INDEX"
REPO_PATH="$REPOS_DIR/$REPO_NAME"

echo "Creating test repository: $REPO_NAME"

# Create and initialize the repository
mkdir -p "$REPO_PATH"
cd "$REPO_PATH"

git init
git config user.name "Test User"
git config user.email "test@example.com"

# Create main branch with initial commit
echo "# Test Repository $NEXT_INDEX" > README.md
git add README.md
git commit -m "Initial commit"

# Create some feature branches
git checkout -b feature/user-auth
echo "auth logic here" > auth.js
git add auth.js
git commit -m "Add user authentication"

git checkout -b feature/api-endpoints
echo "API endpoints" > api.js
git add api.js
git commit -m "Add API endpoints"

git checkout -b bugfix/memory-leak
echo "fixed memory leak" > fix.js
git add fix.js
git commit -m "Fix memory leak"

# Create an old branch (simulate stale branch)
git checkout -b old/legacy-code
echo "old code" > legacy.js
git add legacy.js

# Backdate this commit to make it "stale"
GIT_AUTHOR_DATE="2023-01-01 00:00:00" GIT_COMMITTER_DATE="2023-01-01 00:00:00" git commit -m "Legacy code from long ago"

# Create a merged branch
git checkout main
git checkout -b hotfix/critical-bug
echo "critical fix" > hotfix.js
git add hotfix.js
git commit -m "Critical hotfix"

# Merge it back to main
git checkout main
git merge hotfix/critical-bug --no-ff -m "Merge critical hotfix"

# Return to main
git checkout main

echo "Test repository created at: $REPO_PATH"
echo "Branches created:"
git branch -a

echo ""
echo "To use this repo for testing, run:"
echo "cd $REPO_PATH"