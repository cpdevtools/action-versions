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
    console.log(existingVersions);
    const latest = existingVersions[0] ?? semver_1.default.parse('0.0.0');
    const isLatestBranch = branchMeta.version === 'latest';
    branchMeta.version = (isLatestBranch ? latest.version : branchMeta.version) ?? '0.0.0';
    let branchVersions = existingVersions;
    const branchVersionParts = branchMeta.version.split('.');
    let brachVersion = new semver_1.default.SemVer(`0.0.0`);
    if (branchVersionParts.length === 1) {
        brachVersion = new semver_1.default.SemVer(`${branchVersionParts[0]}.0.0`);
        branchVersions = existingVersions.filter(t => t.major === +branchVersionParts[0]);
    }
    else if (branchVersionParts.length === 2) {
        brachVersion = new semver_1.default.SemVer(`${branchVersionParts[0]}.${branchVersionParts[1]}.0`);
        branchVersions = existingVersions.filter(t => t.major === +branchVersionParts[0] &&
            t.minor === +branchVersionParts[1]);
    }
    else {
        brachVersion = new semver_1.default.SemVer(`${branchVersionParts[0]}.${branchVersionParts[1]}.${branchVersionParts[2]}`);
        if (!isLatestBranch) {
            branchVersions = existingVersions.filter(t => t.major === +branchVersionParts[0] &&
                t.minor === +branchVersionParts[1] &&
                t.patch === +branchVersionParts[2]);
        }
    }
    const branchVersion = branchVersions[0] ?? new semver_1.default.SemVer('0.0.0');
    const branchLatest = branchVersion.version;
    let versionValidReleaseMinimum = (0, compareVersions_1.compareVersions)(targetVersion, brachVersion) === 1;
    let versionValidReleaseMaximum = true;
    if (!isLatestBranch) {
        const highestBranchTag = branchVersions[0];
        versionValidReleaseMinimum = (0, compareVersions_1.compareVersions)(targetVersion, highestBranchTag) === 1;
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
    const isNewValidVersion = (branchMeta.isReleaseSourceBranch || branchMeta.isReleaseTargetBranch) &&
        targetVersion.version !== branchLatest &&
        versionValidReleaseMinimum &&
        versionValidReleaseMaximum;
    const out = {
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
        sourceBuild: branchVersion.build,
        sourcePrerelease: branchVersion.prerelease?.[0] ?? undefined,
        sourcePrereleaseBuild: branchVersion.prerelease?.[1] ?? undefined,
        sourceIsPrerelease: !!branchVersion.prerelease?.length,
        sourceIsStable: !branchVersion.prerelease?.length && (branchVersion.major ?? 0) >= 1,
        targetMajor: targetVersion.major,
        targetMinor: targetVersion.minor,
        targetPatch: targetVersion.patch,
        targetBuild: targetVersion.build,
        targetPrerelease: targetVersion.prerelease?.[0] ?? undefined,
        targetPrereleaseBuild: targetVersion.prerelease?.[1] ?? undefined,
        targetIsPrerelease: !!targetVersion.prerelease?.length,
        targetIsStable: !targetVersion.prerelease?.length && (targetVersion.major ?? 0) >= 1,
        versionValidReleaseMinimum,
        versionValidReleaseMaximum,
    };
    return out;
}
exports.evaluateVersion = evaluateVersion;
