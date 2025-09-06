export interface BranchInfo {
  name: string;
  lastCommitDate: Date;
  lastCommitHash: string;
  isMerged: boolean;
  commitsBehindMain: number;
  isStale: boolean; // Will calculate this later based on staleDays threshold
  isCurrent: boolean; // Track if this is the current branch
}
