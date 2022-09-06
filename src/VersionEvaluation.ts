export interface VersionEvaluation {
    branch: string;
    isSource: boolean;
    isTarget: boolean;

    sourceVersion: string;
    targetVersion: string;

    sourceMajor: number;
    sourceMinor: number;
    sourcePatch: number;
    sourceBuild?: string[];
    sourcePrerelease?: string;
    sourcePrereleaseBuild?: number;
    sourceIsPrerelease?: boolean;
    sourceIsStable?: boolean;

    targetMajor: number;
    targetMinor: number;
    targetPatch: number;
    targetBuild?: string[];
    targetPrerelease?: string;
    targetPrereleaseBuild?: number;
    targetIsPrerelease?: boolean;
    targetIsStable?: boolean;

    validCanCreate:boolean;
    validBranchVersionMinimum: boolean;
    vaildBranchVersionMaximum: boolean;
    validIsNewVersion:boolean;
    validIsHighestVersion:boolean;
    validIsHighestVersionInBranch:boolean;
}


