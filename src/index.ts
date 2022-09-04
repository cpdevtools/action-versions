import { setOutput } from '@actions/core';
import { inspectVersion } from './inspectVersion';
import { VersionEvaluation } from './VersionEvaluation';



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
})();


