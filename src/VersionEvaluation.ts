export interface VersionEvaluation {
    branch: string;
    isSource: boolean;
    isTarget: boolean;

    sourceVersion: string;
    targetVersion: string;
    versionUnchanged: boolean;
    isNewValidVersion: boolean;

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

    versionValidReleaseMinimum: boolean;
    versionValidReleaseMaximum: boolean;
}


