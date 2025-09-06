# Git Cleanup CLI

A command-line tool to identify and clean up stale Git branches in your repositories.

## Features

- Identifies branches that haven't been updated in a specified time period
- Shows last commit date, merge status, and commits behind main
- Filter by merged status or show only your own branches
- Delete multiple branches at once or select specific ones

## Installation

```bash
npm install -g git-cleanup-cli
```

## Quick Start

Navigate to any Git repository and run:

```bash
git-cleanup list
```

This will show all branches that are stale (older than 30 days by default).

## Usage

### Basic Commands

#### List stale branches
```bash
# Show branches stale for 30+ days (default)
git-cleanup list

# Show branches stale for 7+ days
git-cleanup list --stale-days 7

# Show branches stale for 60+ days
git-cleanup list -s 60
```

### Advanced Filtering

#### Filter by merge status
```bash
# Show only merged branches that are stale
git-cleanup list --merged

# Explicitly show all branches (merged and unmerged)
git-cleanup list --merged=false
```

#### Filter by author
```bash
# Show only your own stale branches
git-cleanup list --my-branches

# Combine filters: show your merged branches that are stale
git-cleanup list --my-branches --merged
```

## Commands

### `git-cleanup list`

List and optionally delete stale branches.

#### Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--stale-days <days>` | `-s` | Number of days to consider a branch stale | 30 |
| `--merged [true/false]` | `-m` | Only show merged branches | false |
| `--my-branches` | | Only show branches authored by you | false |

#### Global Options

| Option | Short | Description |
|--------|-------|-------------|
| `--help` | `-h` | Show help information |
| `--version` | `-v` | Show version number |


## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
