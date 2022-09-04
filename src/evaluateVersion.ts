import semver, { SemVer } from 'semver';
import { compareVersions } from './compareVersions';
import { getBranchMeta } from './getBranchMeta';
import { VersionEvaluation } from './VersionEvaluation';

export function evaluateVersion(branch: string, targetVersion: semver.SemVer, existingVersions: semver.SemVer[]): VersionEvaluation {
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

    const branchLatest = branchVersions[0].version;
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

    const out: VersionEvaluation = {
        branch: branchMeta.branch,
        isSource: branchMeta.isReleaseSourceBranch,
        isTarget: branchMeta.isReleaseTargetBranch,
        targetVersion: targetVersion.version,
        versionUnchanged: targetVersion.version === branchLatest,
        versionMajor: targetVersion.major,
        versionMinor: targetVersion.minor,
        versionPatch: targetVersion.patch,
        versionBuild: targetVersion.build as string[] | undefined,
        versionPrerelease: (targetVersion.prerelease?.[0] as string) ?? undefined,
        versionPrereleaseBuild: (targetVersion.prerelease?.[1] as number) ?? undefined,
        versionIsPrerelease: !!targetVersion.prerelease?.length,
        versionIsStable: !targetVersion.prerelease?.length && (targetVersion.major ?? 0) >= 1,
        versionValidReleaseMinimum,
        versionValidReleaseMaximum,
        sourceVersion: branchLatest
    };

    return out;

}
