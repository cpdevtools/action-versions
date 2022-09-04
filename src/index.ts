import { setOutput, getBooleanInput, setFailed } from '@actions/core';
import { inspectVersion } from './inspectVersion';
import { VersionEvaluation } from './VersionEvaluation';

const failIfNotValidNew = getBooleanInput('failIfNotValidNew');

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

    if(failIfNotValidNew && !out.isNewValidVersion){
        const msg = `Error: ${out.targetVersion} is not a valid new version.`;
        setFailed(msg);
    }
})();


