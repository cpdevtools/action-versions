"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@actions/core");
const inspectVersion_1 = require("./inspectVersion");
const failIfNotValidNew = (0, core_1.getBooleanInput)('failIfNotValidNew');
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
    if (failIfNotValidNew && !out.validCanCreate) {
        let msg = `Error: ${out.targetVersion} is not a valid version.`;
        if (out.targetVersion === out.sourceVersion) {
            msg = `Error: ${out.targetVersion} is not a new version.`;
        }
        (0, core_1.setFailed)(msg);
    }
})();
