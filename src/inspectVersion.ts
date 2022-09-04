import { getInput, getMultilineInput } from '@actions/core';
import { context } from '@actions/github';
import { existsSync, readFileSync } from 'fs';
import semver from 'semver';
import simpleGit from 'simple-git';
import { evaluateVersion } from './evaluateVersion';
import { Octokit } from '@octokit/rest';
import { createTokenAuth } from "@octokit/auth-token";

export async function inspectVersion() {
    const branchInput = getInput('branch', { trimWhitespace: true }) || undefined;
    const versionFileInput = getInput('versionFile', { trimWhitespace: true }) || undefined;
    const versionInput = getInput('version', { trimWhitespace: true }) || undefined;
    const existingVersionsInput = getMultilineInput('existingVersions', { trimWhitespace: true });
    const githubTokenInput = getInput('githubToken', { trimWhitespace: true });

    const git = simpleGit('.');

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

    const pulls = await octokit.pulls.list({
        owner: context.repo.owner,
        repo: context.repo.repo,
        sort: 'created',
        direction: 'desc'
    });
    console.log(pulls.data[0]);

    return evaluateVersion(ver!, existingVersions, branch);
}
