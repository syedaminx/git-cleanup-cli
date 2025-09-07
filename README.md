# Branch Broom CLI

A command-line tool to identify and clean up stale Git branches in your repositories.

![Demo](docs/demo.gif)

## Features

- Identifies branches that haven't been updated in a specified time period
- Shows last commit date, merge status, and commits behind main
- Filter by merged status or show only your own branches
- Delete multiple branches at once or select specific ones

## Installation

```bash
npm install -g branch-broom
```

## Quick Start

Navigate to any Git repository and run:

```bash
branch-broom list
```

This will show all branches that are stale (older than 30 days by default).

## Usage

### Basic Commands

#### List stale branches
```bash
# Show branches stale for 30+ days (default)
branch-broom list

# Show branches stale for 7+ days
branch-broom list --stale-days 7

# Show branches stale for 60+ days
branch-broom list -s 60
```

### Advanced Filtering

#### Filter by merge status
```bash
# Show only merged branches that are stale
branch-broom list --only-merged

# Explicitly show all branches (merged and unmerged)
branch-broom list --only-merged=false
```

#### Filter by author
```bash
# Show only your own stale branches
branch-broom list --my-branches

# Combine filters: show your merged branches that are stale
branch-broom list --my-branches --only-merged
```

## Commands

### `branch-broom list`

List and optionally delete stale branches.

#### Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--stale-days <days>` | `-s` | Number of days to consider a branch stale | 30 |
| `--only-merged [true/false]` | `-m` | Only show merged branches | false |
| `--my-branches` | | Only show branches authored by you | false |

#### Global Options

| Option | Short | Description |
|--------|-------|-------------|
| `--help` | `-h` | Show help information |
| `--version` | `-v` | Show version number |


## License

This project is licensed under the MIT License.
