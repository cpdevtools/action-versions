export function getBranchMeta(branch: string) {
    const scope = branch === 'main' || branch === 'master' ? 'v/latest' : branch;
    const isReleaseBranch = scope.startsWith('release/');
    const isPrepBranch = scope.startsWith('v/');
    const version = isReleaseBranch ? scope.slice(8) : (isPrepBranch ? scope.slice(2) : undefined);                  
    
    return {
        branch,
        isReleaseTargetBranch: isReleaseBranch,
        isReleaseSourceBranch: isPrepBranch,
        version 
    };
}
