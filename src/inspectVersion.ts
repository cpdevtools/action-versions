import { getInput, getMultilineInput, getBooleanInput } from '@actions/core';
import { context } from '@actions/github';
import { existsSync, readFileSync } from 'fs';
import semver from 'semver';
import simpleGit from 'simple-git';
import { evaluateVersion } from './evaluateVersion';
import { Octokit } from '@octokit/rest';
import { VersionStatus } from './VersionStatus';

export async function inspectVersion() {

    console.log('--- action ---', context.payload.action);
   // console.log(context.payload.pull_request);
   // console.log(context.payload.repository);
    

    const branchInput = getInput('branch', { trimWhitespace: true }) || undefined;
    const versionFileInput = getInput('versionFile', { trimWhitespace: true }) || undefined;
    const versionInput = getInput('version', { trimWhitespace: true }) || undefined;
    const existingVersionsInput = getMultilineInput('existingVersions', { trimWhitespace: true });
    const githubTokenInput = getInput('githubToken', { trimWhitespace: true });
    const autoCreatePullRequestInput = getBooleanInput('autoCreatePullRequest');

    const git = simpleGit('.');

    // todo pull requests are broke
    const branch = branchInput ?? context.ref.startsWith("refs/heads/") ? context.ref.slice(11) : undefined;

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

    let existingVerStrings = existingVersionsInput.length ? existingVersionsInput : (await git.tags()).all;

    let existingVersions = existingVerStrings
        .map(i => semver.parse(i))
        .filter(i => !!i) as semver.SemVer[];

    const octokit = new Octokit({ auth: githubTokenInput });

    const data = evaluateVersion(ver!, existingVersions, branch);

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

    let pullRequest:number | undefined = pulls.data[0]?.id;
    if(!pullRequest && autoCreatePullRequestInput){
        console.log('create pull request');
        const r = await octokit.pulls.create({
            owner: context.repo.owner,
            repo: context.repo.repo,
            base: `release/${baseTag}`,
            head: data.branch,
            draft: true,
            title: `v${ver?.version}`,
            body: `Generated New Version. ${data.sourceVersion} -> ${data.targetVersion}`,
        });
        pullRequest = r.data.id;
    }

    return {
        ...data,
        pullRequest
    } as VersionStatus;
}
