import { getBooleanInput, getInput, getMultilineInput } from '@actions/core';
import { context } from '@actions/github';
import { Octokit } from '@octokit/rest';
import { Endpoints } from "@octokit/types";
import { VersionEvaluation } from 'VersionEvaluation';
import { compareVersions } from 'compareVersions';
import { existsSync, readFileSync } from 'fs';
import { getBranchMeta } from 'getBranchMeta';
import semver, { SemVer } from 'semver';
import { VersionStatus } from './VersionStatus';
import { evaluateVersion } from './evaluateVersion';


export type PullRequest = Endpoints["GET /repos/{owner}/{repo}/pulls/{pull_number}"]["response"]["data"];
export type FileContentResponse = Endpoints["GET /repos/{owner}/{repo}/contents/{path}"]["response"];
export type FileContent = Endpoints["GET /repos/{owner}/{repo}/contents/{path}"]["response"]['data'];
export type TagResponse = Endpoints["GET /repos/{owner}/{repo}/tags"]["response"]['data'];


const githubTokenInput = getInput('githubToken', { trimWhitespace: true });
const octokit = new Octokit({ auth: githubTokenInput });

export async function getRepoVersions() {
    const versions = (await octokit.repos.listTags({
        owner: context.repo.owner,
        repo: context.repo.repo
    })).data
        .map(t => t.name)
        .filter(i => i.startsWith('v'))
        .map(i => semver.parse(i))
        .filter(i => !!i) as semver.SemVer[];

    versions.sort((a, b) => semver.rcompare(a, b));
    return versions;
}

export async function inspectPRVrsion() {

    const versions = await getRepoVersions();
    const highestVersion = versions[0];
    const latestVersion = versions.find(i => i.prerelease.length === 0) ?? highestVersion;


    const pr = context.payload.pull_request as PullRequest;
    const targetRef = pr.head.ref;
    const targetBranch = targetRef.startsWith("refs/heads/") ? targetRef.slice(11) : targetRef;

    const targetBranchMeta = getBranchMeta(targetBranch);

    let sourceRef = pr.base.ref;
    const sourceBranch = sourceRef.startsWith("refs/heads/") ? sourceRef.slice(11) : sourceRef;


    const targetPackageFileInfo = await octokit.repos.getContent({
        owner: context.repo.owner,
        repo: context.repo.repo,
        path: 'package.json',
        ref: targetRef
    }) as FileContentResponse;
    const sourcePackageFileInfo = await octokit.repos.getContent({
        owner: context.repo.owner,
        repo: context.repo.repo,
        path: 'package.json',
        ref: sourceRef
    }) as FileContentResponse;


    let branchVersionParts = targetBranch.split('/');
    branchVersionParts = branchVersionParts.pop()?.split('.') ?? [];

    if (branchVersionParts[0] === 'latest' || branchVersionParts[0] === 'main' || branchVersionParts[0] === 'master') {
        branchVersionParts = ['' + latestVersion.major, '' + latestVersion.minor, '' + latestVersion.patch];
    }

    let branchVersionMin: SemVer = new semver.SemVer(`0.0.0`);
    let branchVersionMax: number = Math.min(3, branchVersionParts.length);

    if (branchVersionParts.length === 1) {
        branchVersionMin = new semver.SemVer(`${branchVersionParts[0]}.0.0`);
    } else if (branchVersionParts.length === 2) {
        branchVersionMin = new semver.SemVer(`${branchVersionParts[0]}.${branchVersionParts[1]}.0`);
    } else {
        branchVersionMin = new semver.SemVer(`${branchVersionParts[0]}.${branchVersionParts[1]}.${branchVersionParts[2]}`);
    }


    let targetBranchVersions: semver.SemVer[] = versions.filter(v => {
        let isBranchV = semver.gte(v, branchVersionMin);
        if (isBranchV) {
            if (branchVersionMax === 3) {
                if (v.patch !== branchVersionMin.patch) {
                    return false;
                }
            }
            if (branchVersionMax >= 2) {
                if (v.minor !== branchVersionMin.minor) {
                    return false;
                }
            }
            if (branchVersionMax >= 1) {
                if (v.major !== branchVersionMin.major) {
                    return false;
                }
            }
        }
        return isBranchV;
    });


    const targetPackageFile = JSON.parse(Buffer.from((targetPackageFileInfo.data as any).content, 'base64').toString('utf-8'));
    const sourcePackageFile = JSON.parse(Buffer.from((sourcePackageFileInfo.data as any).content, 'base64').toString('utf-8'));

    const targetVersion = semver.parse(targetPackageFile.version) ?? semver.parse('0.0.0')!;
    const sourceVersion = semver.parse(sourcePackageFile.version) ?? semver.parse('0.0.0')!;

    // const targetBranchVersionData = extractVersionFromRef(targetRef);
    // const sourceBranchVersionData = extractVersionFromRef(sourceRef);


    const targetBranchVersionHighest = targetBranchVersions[0] ?? new semver.SemVer('0.0.0');
    const validIsHighestVersion = compareVersions(targetVersion, highestVersion) >= 0;
    const validIsHighestVersionInBranch = compareVersions(targetVersion, targetBranchVersionHighest) >= 0;
    const targetIsPrerelease = !!targetVersion.prerelease?.length;

    const existingHighestMajor = versions.find(v => v.major === targetVersion.major) ?? new semver.SemVer('0.0.0');
    const isHighestMajor = compareVersions(targetVersion, existingHighestMajor) >= 0;

    const existingHighestMinor = versions.find(v => v.major === targetVersion.major && v.minor === targetVersion.minor) ?? new semver.SemVer('0.0.0');
    const isHighestMinor = compareVersions(targetVersion, existingHighestMinor) >= 0;

    const existingLatestMajor = versions.find(v => !v.prerelease?.length && v.major === targetVersion.major) ?? new semver.SemVer('0.0.0');
    const isLatestMajor = targetIsPrerelease ? false : (compareVersions(targetVersion, existingLatestMajor) >= 0);

    const existingLatestMinor = versions.find(v => !v.prerelease?.length && v.major === targetVersion.major && v.minor === targetVersion.minor) ?? new semver.SemVer('0.0.0');
    const isLatestMinor = targetIsPrerelease ? false : (compareVersions(targetVersion, existingLatestMinor) >= 0);


    console.log('branchVersionMin', branchVersionMin);
    console.log('branchVersionMax', branchVersionMax);

    let validBranchVersionMinimum = compareVersions(targetVersion, branchVersionMin) >= 0;
    let vaildBranchVersionMaximum = !validBranchVersionMinimum;
    if (!vaildBranchVersionMaximum) {
        vaildBranchVersionMaximum = true;
        if (targetVersion.major > branchVersionMin.major) {
            vaildBranchVersionMaximum = false;
        }
        if (branchVersionMax >= 2 && targetVersion.major === branchVersionMin.major) {
            if (targetVersion.minor > branchVersionMin.minor) {
                vaildBranchVersionMaximum = false;
            }
            if (branchVersionMax >= 1 && targetVersion.minor === branchVersionMin.minor) {
                if (targetVersion.patch > branchVersionMin.patch) {
                    vaildBranchVersionMaximum = false;
                }
            }
        }
    }

    const validIsNewVersion = versions.find(v => v.version === targetVersion.version) === undefined;
    const validIsSourceOrTarget = targetBranchMeta.isReleaseSourceBranch || targetBranchMeta.isReleaseTargetBranch;

    const validCanCreate =
        validIsSourceOrTarget &&
        validIsNewVersion &&
        validBranchVersionMinimum &&
        vaildBranchVersionMaximum &&
        (validIsHighestVersion || validIsHighestVersionInBranch);

    const versionEvaluation: VersionEvaluation = {
        branch: targetBranch,
        sourceVersion: sourceVersion?.format() ?? '',
        targetVersion: targetVersion?.format() ?? '',
        highestVersion: highestVersion.format(),
        latestVersion: latestVersion.format(),
        sourceMajor: sourceVersion?.major ?? 0,
        sourceMinor: sourceVersion?.minor ?? 0,
        sourcePatch: sourceVersion?.patch ?? 0,
        sourceBuild: sourceVersion?.build as string[] | undefined,
        sourceIsPrerelease: !!sourceVersion?.prerelease?.length,
        sourcePrerelease: (sourceVersion?.prerelease?.[0] as string) ?? undefined,
        sourcePrereleaseBuild: (sourceVersion?.prerelease?.[1] as number) ?? undefined,
        sourceIsStable: (sourceVersion?.major ?? 0) >= 1,
        targetMajor: targetVersion?.major ?? 0,
        targetMinor: targetVersion?.minor ?? 0,
        targetPatch: targetVersion?.patch ?? 0,
        targetBuild: targetVersion?.build as string[] | undefined,
        targetIsPrerelease: !!targetVersion?.prerelease?.length,
        targetPrerelease: (targetVersion?.prerelease?.[0] as string) ?? undefined,
        targetPrereleaseBuild: (targetVersion?.prerelease?.[1] as number) ?? undefined,
        targetIsStable: (targetVersion?.major ?? 0) >= 1,
        isHighestVersion: semver.compare(targetVersion, highestVersion) >= 0,
        isLatestVersion: !targetVersion?.prerelease?.length && semver.compare(targetVersion, latestVersion) >= 0,
        isTarget: true,
        isSource: false,
        isHighestMajor,
        isHighestMinor,
        isLatestMajor,
        isLatestMinor,
        validIsHighestVersion,
        validIsHighestVersionInBranch,
        vaildBranchVersionMaximum,
        validBranchVersionMinimum,
        validCanCreate,
        validIsNewVersion
    };

    return {
        ...versionEvaluation,
        pullRequest: context.payload.pull_request?.id
    } as VersionStatus;

}


export async function inspectVersion() {
    const branchInput = getInput('branch', { trimWhitespace: true }) || undefined;
    const versionFileInput = getInput('versionFile', { trimWhitespace: true }) || undefined;
    const versionInput = getInput('version', { trimWhitespace: true }) || undefined;
    const existingVersionsInput = getMultilineInput('existingVersions', { trimWhitespace: true });
    const autoCreatePullRequestInput = getBooleanInput('autoCreatePullRequest');
    const draftPullRequestInput = getBooleanInput('draftPullRequest');

    if (context.eventName === 'pull_request') {
        return await inspectPRVrsion();
    }

    const pr = context.payload.pull_request as any;
    const sourceRef = context.eventName === 'pull_request' ? pr.head.ref : context.ref;
    const branch = branchInput ?? sourceRef.startsWith("refs/heads/") ? sourceRef.slice(11) : sourceRef;

    let ver: semver.SemVer | null = null;
    if (versionInput !== undefined && versionFileInput === undefined) {
        ver = semver.parse(versionInput);
    } else {
        const versionFile = versionFileInput ?? './package.json';
        if (existsSync(versionFile)) {
            const verObj = JSON.parse(readFileSync(versionFile, { encoding: 'utf-8' }));
            const verStr = (verObj.version ?? '-') as string;
            ver = semver.parse(verStr);
        }
        if (ver === null && versionInput !== undefined) {
            ver = semver.parse(versionInput);
        }
    }
    ver ??= semver.parse('0.0.0');


    let existingVerStrings = existingVersionsInput.length
        ? existingVersionsInput
        : (await octokit.repos.listTags({
            owner: context.repo.owner,
            repo: context.repo.repo
        })).data.map(t => t.name);

    let existingVersions = existingVerStrings
        .map(i => semver.parse(i))
        .filter(i => !!i) as semver.SemVer[];



    const data = evaluateVersion(ver!, existingVersions, branch);
    let pullRequest: number | undefined;
    if (data.validCanCreate) {

        let baseTag = data.branch === 'main' || data.branch === 'master'
            ? 'latest'
            : data.branch.split('/')[1];

        const pulls = await octokit.pulls.list({
            owner: context.repo.owner,
            repo: context.repo.repo,
            state: 'open',
            sort: 'created',
            direction: 'desc',
            base: `release/${baseTag}`,
            head: `${context.repo.owner}:${data.branch}`
        });

        pullRequest = pulls.data[0]?.id;
        if (!pullRequest && autoCreatePullRequestInput) {
            const r = await octokit.pulls.create({
                owner: context.repo.owner,
                repo: context.repo.repo,
                base: `release/${baseTag}`,
                head: data.branch,
                draft: draftPullRequestInput,
                title: `v${ver?.version}`,
                body: `Generated New Version. ${data.sourceVersion} -> ${data.targetVersion}`,
            });
            pullRequest = r.data.id;
        }
    }
    return {
        ...data,
        pullRequest
    } as VersionStatus;
}
