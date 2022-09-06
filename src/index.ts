import { getBooleanInput, getInput, setFailed, setOutput } from '@actions/core';
import { Octokit } from '@octokit/rest';
import { VersionStatus } from 'VersionStatus';
import { inspectVersion } from './inspectVersion';
import { VersionEvaluation } from './VersionEvaluation';

type ValidationProperties =
    'validCanCreate' |
    'validIsNewVersion' |
    'validIsHighestVersionInBranch' |
    'validIsHighestVersion' |
    'vaildBranchVersionMaximum' |
    'validBranchVersionMinimum';

const ValidationErrorMessages = {
    validCanCreate: (data: VersionStatus) => {
        let msg = `Error: ${data.targetVersion} is not a valid version.`;
        if (data.targetVersion === data.sourceVersion) {
            msg = `Error: ${data.targetVersion} is not a new version.`;
        }
        return msg;
    },
    validIsNewVersion: (data: VersionStatus) => {
        return `Error: ${data.targetVersion} is not a new version.`;
    },
    validIsHighestVersionInBranch: (data: VersionStatus) => {
        return `Error: Target version should be the higest version in the branches range. ${data.targetVersion} > ${data.sourceVersion}`;
    },
    validIsHighestVersion: (data: VersionStatus) => {
        return `Error: ${data.targetVersion} is not the highest version. ${data.targetVersion} > ${data.highestVersion}`;
    },
    vaildBranchVersionMaximum: (data: VersionStatus) => {
        return `Error: ${data.targetVersion} does not meet the minimum restriction for branch ${data.branch}`;
    },
    validBranchVersionMinimum: (data: VersionStatus) => {
        return `Error: ${data.targetVersion} exceeds the maximum restriction for branch ${data.branch}`;
    }
}

function applyFailed(validationProp: ValidationProperties, data: VersionStatus) {
    const shouldFail = getBooleanInput(`failIn${validationProp}`);
    if (shouldFail && !data[validationProp]) {
        setFailed(ValidationErrorMessages[validationProp](data));
        return 1;
    }
    return 0;
}

(async () => {
    const out = await inspectVersion();

    const table: { key: string, value: string | number | boolean | string[] | undefined }[] = [];
    Object.keys(out).forEach((k) => {
        const key = k as keyof VersionEvaluation;
        const value = out[key];
        table.push({ key, value });
        setOutput(key, value);
    });
    console.table(table);

    let fails = 0;
    fails += applyFailed('validCanCreate', out);
    fails += applyFailed('validIsNewVersion', out);
    fails += applyFailed('validIsHighestVersionInBranch', out);
    fails += applyFailed('validBranchVersionMinimum', out);
    fails += applyFailed('vaildBranchVersionMaximum', out);
    fails += applyFailed('validIsHighestVersion', out);

    if (!fails) {

        await applyTags(out);
    }

})();

type TagType = 'none' | 'named' | 'components' | 'all';

async function applyTags(versionStatus: VersionStatus) {
    const createTags = getInput('createTags', { trimWhitespace: true }) as TagType;
    const githubTokenInput = getInput('githubToken', { trimWhitespace: true });
    const octokit = new Octokit({ auth: githubTokenInput });

    if (createTags === 'all' || createTags === 'named') {
        if (versionStatus.highestVersion) {
            await applyTag(octokit, 'next');
        }
        if (versionStatus.latestVersion) {
            await applyTag(octokit, 'latest');
        }
    }

    if (createTags === 'all' || createTags === 'components') {
        if(versionStatus.latestMajor){
            await applyTag(octokit, `v${versionStatus.targetMajor}`);
        }
        if(versionStatus.latestMinor){
            await applyTag(octokit, `v${versionStatus.targetMajor}.${versionStatus.targetMinor}`);
        }
    }
}

async function applyTag(octokit: Octokit, tag: string) {

}