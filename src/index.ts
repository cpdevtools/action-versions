import { getBooleanInput, setFailed, setOutput } from '@actions/core';
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
    }
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

    applyFailed('validCanCreate', out);
    applyFailed('validIsNewVersion', out);
    applyFailed('validIsHighestVersionInBranch', out);
    applyFailed('validBranchVersionMinimum', out);
    applyFailed('vaildBranchVersionMaximum', out);
    applyFailed('validIsHighestVersion', out);
})();


