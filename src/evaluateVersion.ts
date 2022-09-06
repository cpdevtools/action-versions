import { context } from '@actions/github';
import semver, { SemVer } from 'semver';
import { compareVersions } from './compareVersions';
import { getBranchMeta } from './getBranchMeta';
import { VersionEvaluation } from './VersionEvaluation';

export function evaluateVersion(targetVersion: semver.SemVer, existingVersions: semver.SemVer[], branch: string = ''): VersionEvaluation {
    const branchMeta = getBranchMeta(branch);
    existingVersions = existingVersions.slice().sort(compareVersions).reverse();

    const isLatestBranch = branchMeta.version === 'latest';
    const latest = existingVersions[0] ?? semver.parse('0.0.0');

    branchMeta.version = (isLatestBranch ? latest.version : branchMeta.version) ?? '0.0.0';


    const branchVersionParts = branchMeta.version!.split('.');
    let brachVersionMin: SemVer = new semver.SemVer(`0.0.0`);
    let branchVersionMax: number = Math.min(3, branchVersionParts.length);

    if (branchVersionParts.length === 1) {
        brachVersionMin = new semver.SemVer(`${branchVersionParts[0]}.0.0`);
    } else if (branchVersionParts.length === 2) {
        brachVersionMin = new semver.SemVer(`${branchVersionParts[0]}.${branchVersionParts[1]}.0`);
    } else {
        brachVersionMin = new semver.SemVer(`${branchVersionParts[0]}.${branchVersionParts[1]}.${branchVersionParts[2]}`);
    }


    let branchVersions: semver.SemVer[] = existingVersions.filter(v => {
        let isBranchV = semver.gte(v, brachVersionMin);
        if (isBranchV) {
            if (branchVersionMax === 3) {
                if (v.patch !== brachVersionMin.patch) {
                    return false;
                }
            }
            if (branchVersionMax >= 2) {
                if (v.minor !== brachVersionMin.minor) {
                    return false;
                }
            }
            if (branchVersionMax >= 1) {
                if (v.major !== brachVersionMin.major) {
                    return false;
                }
            }
        }
        return isBranchV;
    });


    const branchVersionHighest = branchVersions[0] ?? new semver.SemVer('0.0.0');
    const branchHighest = branchVersionHighest.version;


    let validBranchVersionMinimum = compareVersions(targetVersion, brachVersionMin) >= 0;

    let vaildBranchVersionMaximum = isLatestBranch || !validBranchVersionMinimum;
    if (!vaildBranchVersionMaximum) {
        vaildBranchVersionMaximum = true;
        if (targetVersion.major > brachVersionMin.major) {
            vaildBranchVersionMaximum = false;
        }
        if (branchVersionMax >= 2 && targetVersion.major === brachVersionMin.major) {
            if (targetVersion.minor > brachVersionMin.minor) {
                vaildBranchVersionMaximum = false;
            }
            if (branchVersionMax >= 1 && targetVersion.minor === brachVersionMin.minor) {
                if (targetVersion.patch > brachVersionMin.patch) {
                    vaildBranchVersionMaximum = false;
                }
            }
        }
    }

    const validIsHighestVersion = compareVersions(targetVersion, existingVersions[0]) >= 0;
    const validIsHighestVersionInBranch = compareVersions(targetVersion, branchVersionHighest) >= 0;

    console.log('existingVersions::', existingVersions);
    console.log('targetVersion.version::', targetVersion.version);

    const validIsNewVersion = existingVersions.find(v => v.version === targetVersion.version) === undefined;

    const validIsSourceOrTarget = branchMeta.isReleaseSourceBranch || branchMeta.isReleaseTargetBranch;

    const validCanCreate =
        validIsSourceOrTarget &&
        validIsNewVersion &&
        validBranchVersionMinimum &&
        vaildBranchVersionMaximum &&
        (validIsHighestVersion || validIsHighestVersionInBranch);


    const out: VersionEvaluation = {
        branch: branchMeta.branch,
        isSource: branchMeta.isReleaseSourceBranch,
        isTarget: branchMeta.isReleaseTargetBranch,
        sourceVersion: branchHighest,
        targetVersion: targetVersion.version,

        sourceMajor: branchVersionHighest.major,
        sourceMinor: branchVersionHighest.minor,
        sourcePatch: branchVersionHighest.patch,
        sourceBuild: branchVersionHighest.build as string[] | undefined,
        sourcePrerelease: (branchVersionHighest.prerelease?.[0] as string) ?? undefined,
        sourcePrereleaseBuild: (branchVersionHighest.prerelease?.[1] as number) ?? undefined,
        sourceIsPrerelease: !!branchVersionHighest.prerelease?.length,
        sourceIsStable: !branchVersionHighest.prerelease?.length && (branchVersionHighest.major ?? 0) >= 1,

        targetMajor: targetVersion.major,
        targetMinor: targetVersion.minor,
        targetPatch: targetVersion.patch,
        targetBuild: targetVersion.build as string[] | undefined,
        targetPrerelease: (targetVersion.prerelease?.[0] as string) ?? undefined,
        targetPrereleaseBuild: (targetVersion.prerelease?.[1] as number) ?? undefined,
        targetIsPrerelease: !!targetVersion.prerelease?.length,
        targetIsStable: !targetVersion.prerelease?.length && (targetVersion.major ?? 0) >= 1,

        validBranchVersionMinimum,
        vaildBranchVersionMaximum,
        validIsHighestVersion,
        validIsHighestVersionInBranch,
        validIsNewVersion,
        validCanCreate
    };

    return out;

}
