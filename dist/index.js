"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@actions/core");
const inspectVersion_1 = require("./inspectVersion");
const ValidationErrorMessages = {
    validCanCreate: (data) => {
        let msg = `Error: ${data.targetVersion} is not a valid version.`;
        if (data.targetVersion === data.sourceVersion) {
            msg = `Error: ${data.targetVersion} is not a new version.`;
        }
        return msg;
    },
    validIsNewVersion: (data) => {
        return `Error: ${data.targetVersion} is not a new version.`;
    },
    validIsHighestVersionInBranch: (data) => {
        return `Error: Target version should be the higest version in the branches range. ${data.targetVersion} > ${data.sourceVersion}`;
    },
    validIsHighestVersion: (data) => {
        return `Error: ${data.targetVersion} is not the highest version. ${data.targetVersion} > ${data.highestVersion}`;
    },
    vaildBranchVersionMaximum: (data) => {
        return `Error: ${data.targetVersion} does not meet the minimum restriction for branch ${data.branch}`;
    },
    validBranchVersionMinimum: (data) => {
        return `Error: ${data.targetVersion} exceeds the maximum restriction for branch ${data.branch}`;
    }
};
function applyFailed(validationProp, data) {
    const shouldFail = (0, core_1.getBooleanInput)(`failIn${validationProp}`);
    if (shouldFail && !data[validationProp]) {
        (0, core_1.setFailed)(ValidationErrorMessages[validationProp](data));
    }
}
(async () => {
    const out = await (0, inspectVersion_1.inspectVersion)();
    const table = [];
    Object.keys(out).forEach((k) => {
        const key = k;
        const value = out[key];
        table.push({ key, value });
        (0, core_1.setOutput)(key, value);
    });
    console.table(table);
    applyFailed('validCanCreate', out);
    applyFailed('validIsNewVersion', out);
    applyFailed('validIsHighestVersionInBranch', out);
    applyFailed('validBranchVersionMinimum', out);
    applyFailed('vaildBranchVersionMaximum', out);
    applyFailed('validIsHighestVersion', out);
})();
