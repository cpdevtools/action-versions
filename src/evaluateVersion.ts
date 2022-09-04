import { context } from '@actions/github';
import semver, { SemVer } from 'semver';
import { compareVersions } from './compareVersions';
import { getBranchMeta } from './getBranchMeta';
import { VersionEvaluation } from './VersionEvaluation';

export function evaluateVersion(targetVersion: semver.SemVer, existingVersions: semver.SemVer[], branch: string = ''): VersionEvaluation {
    const branchMeta = getBranchMeta(branch);
    existingVersions = existingVersions.slice().sort(compareVersions).reverse();
    const latest = existingVersions[0] ?? semver.parse('0.0.0');
    const isLatestBranch = branchMeta.version === 'latest';
    branchMeta.version = isLatestBranch ? latest.version : branchMeta.version;

    let branchVersions: semver.SemVer[] = existingVersions;
    const branchVersionParts = branchMeta.version!.split('.');

    let brachVersion: SemVer | null = new semver.SemVer(`0.0.0`);
    if (branchVersionParts.length === 1) {
        brachVersion = new semver.SemVer(`${branchVersionParts[0]}.0.0`);
        branchVersions = existingVersions.filter(t => t.major === +branchVersionParts[0]);
    } else if (branchVersionParts.length === 2) {
        brachVersion = new semver.SemVer(`${branchVersionParts[0]}.${branchVersionParts[1]}.0`);
        branchVersions = existingVersions.filter(t => t.major === +branchVersionParts[0] &&
            t.minor === +branchVersionParts[1]
        );
    } else {
        brachVersion = new semver.SemVer(`${branchVersionParts[0]}.${branchVersionParts[1]}.${branchVersionParts[2]}`);
        if (!isLatestBranch) {
            branchVersions = existingVersions.filter(t => t.major === +branchVersionParts[0] &&
                t.minor === +branchVersionParts[1] &&
                t.patch === +branchVersionParts[2]
            );
        }
    }

    const branchVersion = branchVersions[0] ?? new semver.SemVer('0.0.0');
    const branchLatest = branchVersion.version;
    let versionValidReleaseMinimum = compareVersions(targetVersion, brachVersion) === 1;
    let versionValidReleaseMaximum = true;

    if (!isLatestBranch) {
        const highestBranchTag = branchVersions[0];

        versionValidReleaseMinimum = compareVersions(targetVersion, highestBranchTag) === 1;

        if (branchVersionParts.length > 2) {
            versionValidReleaseMaximum = false;
        }
        if (branchVersionParts.length >= 1) {
            if (targetVersion.major !== brachVersion.major) {
                versionValidReleaseMaximum = false;
            }
        }
        if (branchVersionParts.length === 2) {
            if (targetVersion.minor !== brachVersion.minor) {
                versionValidReleaseMaximum = false;
            }
        }
    }

    const isNewValidVersion =
        (branchMeta.isReleaseSourceBranch || branchMeta.isReleaseTargetBranch) &&
        targetVersion.version !== branchLatest &&
        versionValidReleaseMinimum &&
        versionValidReleaseMaximum;

    

    const out: VersionEvaluation = {
        branch: branchMeta.branch,
        isSource: branchMeta.isReleaseSourceBranch,
        isTarget: branchMeta.isReleaseTargetBranch,
        sourceVersion: branchLatest,
        targetVersion: targetVersion.version,
        versionUnchanged: targetVersion.version === branchLatest,
        isNewValidVersion,

        sourceMajor: branchVersion.major,
        sourceMinor: branchVersion.minor,
        sourcePatch: branchVersion.patch,
        sourceBuild: branchVersion.build as string[] | undefined,
        sourcePrerelease: (branchVersion.prerelease?.[0] as string) ?? undefined,
        sourcePrereleaseBuild: (branchVersion.prerelease?.[1] as number) ?? undefined,
        sourceIsPrerelease: !!branchVersion.prerelease?.length,
        sourceIsStable: !branchVersion.prerelease?.length && (branchVersion.major ?? 0) >= 1,

        targetMajor: targetVersion.major,
        targetMinor: targetVersion.minor,
        targetPatch: targetVersion.patch,
        targetBuild: targetVersion.build as string[] | undefined,
        targetPrerelease: (targetVersion.prerelease?.[0] as string) ?? undefined,
        targetPrereleaseBuild: (targetVersion.prerelease?.[1] as number) ?? undefined,
        targetIsPrerelease: !!targetVersion.prerelease?.length,
        targetIsStable: !targetVersion.prerelease?.length && (targetVersion.major ?? 0) >= 1,


        versionValidReleaseMinimum,
        versionValidReleaseMaximum,
    };

    return out;

}
