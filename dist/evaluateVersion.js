"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateVersion = void 0;
const semver_1 = __importDefault(require("semver"));
const compareVersions_1 = require("./compareVersions");
const getBranchMeta_1 = require("./getBranchMeta");
function evaluateVersion(targetVersion, existingVersions, branch = '') {
    const branchMeta = (0, getBranchMeta_1.getBranchMeta)(branch);
    existingVersions = existingVersions.slice().sort(compareVersions_1.compareVersions).reverse();
    const isLatestBranch = branchMeta.version === 'latest';
    const latest = existingVersions[0] ?? semver_1.default.parse('0.0.0');
    branchMeta.version = (isLatestBranch ? latest.version : branchMeta.version) ?? '0.0.0';
    const branchVersionParts = branchMeta.version.split('.');
    let brachVersionMin = new semver_1.default.SemVer(`0.0.0`);
    let branchVersionMax = Math.min(3, branchVersionParts.length);
    if (branchVersionParts.length === 1) {
        brachVersionMin = new semver_1.default.SemVer(`${branchVersionParts[0]}.0.0`);
    }
    else if (branchVersionParts.length === 2) {
        brachVersionMin = new semver_1.default.SemVer(`${branchVersionParts[0]}.${branchVersionParts[1]}.0`);
    }
    else {
        brachVersionMin = new semver_1.default.SemVer(`${branchVersionParts[0]}.${branchVersionParts[1]}.${branchVersionParts[2]}`);
    }
    let branchVersions = existingVersions.filter(v => {
        let isBranchV = semver_1.default.gte(v, brachVersionMin);
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
    const branchVersionHighest = branchVersions[0] ?? new semver_1.default.SemVer('0.0.0');
    const branchHighest = branchVersionHighest.version;
    let validBranchVersionMinimum = (0, compareVersions_1.compareVersions)(targetVersion, brachVersionMin) >= 0;
    let vaildBranchVersionMaximum = !validBranchVersionMinimum;
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
    const validIsHighestVersion = (0, compareVersions_1.compareVersions)(targetVersion, existingVersions[0]) >= 0;
    const validIsHighestVersionInBranch = (0, compareVersions_1.compareVersions)(targetVersion, branchVersionHighest) >= 0;
    console.log('existingVersions::', existingVersions);
    console.log('targetVersion.version::', targetVersion.version);
    const validIsNewVersion = existingVersions.find(v => v.version === targetVersion.version) === undefined;
    const validIsSourceOrTarget = branchMeta.isReleaseSourceBranch || branchMeta.isReleaseTargetBranch;
    const validCanCreate = validIsSourceOrTarget &&
        validIsNewVersion &&
        validBranchVersionMinimum &&
        vaildBranchVersionMaximum &&
        (validIsHighestVersion || validIsHighestVersionInBranch);
    const out = {
        branch: branchMeta.branch,
        isSource: branchMeta.isReleaseSourceBranch,
        isTarget: branchMeta.isReleaseTargetBranch,
        sourceVersion: branchHighest,
        targetVersion: targetVersion.version,
        sourceMajor: branchVersionHighest.major,
        sourceMinor: branchVersionHighest.minor,
        sourcePatch: branchVersionHighest.patch,
        sourceBuild: branchVersionHighest.build,
        sourcePrerelease: branchVersionHighest.prerelease?.[0] ?? undefined,
        sourcePrereleaseBuild: branchVersionHighest.prerelease?.[1] ?? undefined,
        sourceIsPrerelease: !!branchVersionHighest.prerelease?.length,
        sourceIsStable: !branchVersionHighest.prerelease?.length && (branchVersionHighest.major ?? 0) >= 1,
        targetMajor: targetVersion.major,
        targetMinor: targetVersion.minor,
        targetPatch: targetVersion.patch,
        targetBuild: targetVersion.build,
        targetPrerelease: targetVersion.prerelease?.[0] ?? undefined,
        targetPrereleaseBuild: targetVersion.prerelease?.[1] ?? undefined,
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
exports.evaluateVersion = evaluateVersion;
