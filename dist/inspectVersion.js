"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.inspectVersion = void 0;
const core_1 = require("@actions/core");
const github_1 = require("@actions/github");
const fs_1 = require("fs");
const semver_1 = __importDefault(require("semver"));
const evaluateVersion_1 = require("./evaluateVersion");
const rest_1 = require("@octokit/rest");
async function inspectVersion() {
    const branchInput = (0, core_1.getInput)('branch', { trimWhitespace: true }) || undefined;
    const versionFileInput = (0, core_1.getInput)('versionFile', { trimWhitespace: true }) || undefined;
    const versionInput = (0, core_1.getInput)('version', { trimWhitespace: true }) || undefined;
    const existingVersionsInput = (0, core_1.getMultilineInput)('existingVersions', { trimWhitespace: true });
    const githubTokenInput = (0, core_1.getInput)('githubToken', { trimWhitespace: true });
    const autoCreatePullRequestInput = (0, core_1.getBooleanInput)('autoCreatePullRequest');
    //    const git = simpleGit('.');
    const pr = github_1.context.payload.pull_request;
    const sourceRef = github_1.context.eventName === 'pull_request' ? pr.head.ref : github_1.context.ref;
    const branch = branchInput ?? sourceRef.startsWith("refs/heads/") ? sourceRef.slice(11) : sourceRef;
    let ver = null;
    if (versionInput !== undefined && versionFileInput === undefined) {
        ver = semver_1.default.parse(versionInput);
    }
    else {
        const versionFile = versionFileInput ?? './package.json';
        if ((0, fs_1.existsSync)(versionFile)) {
            const verObj = JSON.parse((0, fs_1.readFileSync)(versionFile, { encoding: 'utf-8' }));
            const verStr = (verObj.version ?? '-');
            ver = semver_1.default.parse(verStr);
        }
        if (ver === null && versionInput !== undefined) {
            ver = semver_1.default.parse(versionInput);
        }
    }
    ver ??= semver_1.default.parse('0.0.0');
    const octokit = new rest_1.Octokit({ auth: githubTokenInput });
    let existingVerStrings = existingVersionsInput.length
        ? existingVersionsInput
        : (await octokit.repos.listTags({
            owner: github_1.context.repo.owner,
            repo: github_1.context.repo.repo
        })).data.map(t => t.name);
    let existingVersions = existingVerStrings
        .map(i => semver_1.default.parse(i))
        .filter(i => !!i);
    const data = (0, evaluateVersion_1.evaluateVersion)(ver, existingVersions, branch);
    let pullRequest;
    if (data.isNewValidVersion) {
        let baseTag = data.branch === 'main' || data.branch === 'master'
            ? 'latest'
            : data.branch.split('/')[1];
        const pulls = await octokit.pulls.list({
            owner: github_1.context.repo.owner,
            repo: github_1.context.repo.repo,
            state: 'open',
            sort: 'created',
            direction: 'desc',
            base: `release/${baseTag}`,
            head: `${github_1.context.repo.owner}:${data.branch}`
        });
        pullRequest = pulls.data[0]?.id;
        if (!pullRequest && autoCreatePullRequestInput) {
            console.log('create pull request');
            const r = await octokit.pulls.create({
                owner: github_1.context.repo.owner,
                repo: github_1.context.repo.repo,
                base: `release/${baseTag}`,
                head: data.branch,
                draft: true,
                title: `v${ver?.version}`,
                body: `Generated New Version. ${data.sourceVersion} -> ${data.targetVersion}`,
            });
            pullRequest = r.data.id;
        }
    }
    return {
        ...data,
        pullRequest
    };
}
exports.inspectVersion = inspectVersion;
