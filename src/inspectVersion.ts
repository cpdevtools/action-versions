import { getInput, getMultilineInput, getBooleanInput } from '@actions/core';
import { context } from '@actions/github';
import { existsSync, readFileSync } from 'fs';
import semver from 'semver';
import simpleGit from 'simple-git';
import { evaluateVersion } from './evaluateVersion';
import { Octokit } from '@octokit/rest';
import { Endpoints } from "@octokit/types";
import { VersionStatus } from './VersionStatus';


export type PullRequest = Endpoints["GET /repos/{owner}/{repo}/pulls/{pull_number}"]["response"]["data"];
export type FileContentResponse = Endpoints["GET /repos/{owner}/{repo}/contents/{path}"]["response"];
export type FileContent = Endpoints["GET /repos/{owner}/{repo}/contents/{path}"]["response"]['data'];

export async function inspectPRVrsion() {
    const githubTokenInput = getInput('githubToken', { trimWhitespace: true });

    const pr = context.payload.pull_request as PullRequest;
    const targetRef = pr.base.ref;
    const targetBranch = targetRef.startsWith("refs/heads/") ? targetRef.slice(11) : targetRef;
    let sourceRef = pr.head.ref;
    const sourceBranch = sourceRef.startsWith("refs/heads/") ? sourceRef.slice(11) : sourceRef;

    const octokit = new Octokit({ auth: githubTokenInput });

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


    const targetPackageFile = JSON.parse(Buffer.from((targetPackageFileInfo.data as any).content, 'base64').toString('utf-8'));
    const sourcePackageFile = JSON.parse(Buffer.from((sourcePackageFileInfo.data as any).content, 'base64').toString('utf-8'));

    const targetVersion = semver.parse(targetPackageFile.version);
    const sourceVersion = semver.parse(sourcePackageFile.version);

    const targetBranchVersionData = extractVersionFromRef(targetRef);
    //const sourceBranchVersionData = extractVersionFromRef(sourceRef);


  //  console.log(targetVersion);
  //  console.log(sourceVersion);

}

export async function extractVersionFromRef(ref: string) {
    console.log(ref)
    const verStr = ref.split('/').pop();
    console.log(verStr)
    const version = semver.parse(verStr ?? '');
    console.log(version)
    if (!version) {
        return null;
    }
    return {
        version,
    };
}

export async function inspectVersion() {
    const branchInput = getInput('branch', { trimWhitespace: true }) || undefined;
    const versionFileInput = getInput('versionFile', { trimWhitespace: true }) || undefined;
    const versionInput = getInput('version', { trimWhitespace: true }) || undefined;
    const existingVersionsInput = getMultilineInput('existingVersions', { trimWhitespace: true });
    const githubTokenInput = getInput('githubToken', { trimWhitespace: true });
    const autoCreatePullRequestInput = getBooleanInput('autoCreatePullRequest');
    const draftPullRequestInput = getBooleanInput('draftPullRequest');

    if (context.eventName === 'pull_request') {
        await inspectPRVrsion();
        //return await inspectPRVrsion();
    }

    //    const git = simpleGit('.');
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

    const octokit = new Octokit({ auth: githubTokenInput });

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
