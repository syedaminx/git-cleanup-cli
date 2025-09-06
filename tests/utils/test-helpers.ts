import { beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';
import path from 'path';

export const useTestRepo = (repoName: string = 'test-repo-1') => {
  const testRepoPath = path.resolve(`./tests/repos/${repoName}`);
  const originalCwd = process.cwd();

  beforeEach(() => {
    process.chdir(testRepoPath);
    try {
      execSync('git add -A', { stdio: 'ignore' });
      execSync('git stash push -u -m "test-backup"', { stdio: 'ignore' });
    } catch {
      // No changes to stash, that's fine
    }
  });

  afterEach(() => {
    execSync('git reset --hard HEAD', { stdio: 'ignore' });
    execSync('git clean -fd', { stdio: 'ignore' });
    try {
      execSync('git stash pop', { stdio: 'ignore' });
    } catch {
      // No stash to pop, that's fine
    }
    process.chdir(originalCwd);
  });

  return testRepoPath;
};