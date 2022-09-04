export interface VersionEvaluation {
    branch: string;
    isSource: boolean;
    isTarget: boolean;

    sourceVersion: string;
    targetVersion: string;
    versionUnchanged: boolean;


    versionMajor: number;
    versionMinor: number;
    versionPatch: number;
    versionBuild?: string[];
    versionPrerelease?: string;
    versionPrereleaseBuild?: number;
    versionIsPrerelease?: boolean;
    versionIsStable?: boolean;
    versionValidReleaseMinimum: boolean;
    versionValidReleaseMaximum: boolean;
}
