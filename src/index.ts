import { getInput, setOutput } from '@actions/core';
import { context } from '@actions/github';
import { existsSync, readFileSync } from 'fs';
import semver from 'semver';
import simpleGit from 'simple-git';
import { evaluateVersion } from './evaluateVersion';
import { VersionEvaluation } from './VersionEvaluation';


(async () => {
    const branch = context.ref.slice("refs/heads/".length);
    let ver: semver.SemVer = new semver.SemVer('0.0.0');
    const versionFile = getInput('version-file', { trimWhitespace: true });

    if (existsSync(versionFile)) {
        const verObj = JSON.parse(readFileSync(versionFile, { encoding: 'utf-8' }));
        const verStr = (verObj.version ?? '') as string;
        ver = semver.parse(verStr) ?? new semver.SemVer('0.0.0');
    }

    const git = simpleGit('.');
    //const existingVersions = (await git.tags()).all.map(tag => semver.parse(tag)).filter(ver => ver !== null) as semver.SemVer[];
    const existingVersions = [
        'v0.0.1-dev.0',
        'v1.0.0',
        'some-other-tag',
        'v1.1.0',
        'v1.1.1',
        'v1.1.2',
        'v1.2.0-dev.0',
    ].map(tag => semver.parse(tag)).filter(ver => ver !== null) as semver.SemVer[];

    const out = evaluateVersion(branch, ver, existingVersions);

    const table: { key: string, value: string | number | boolean | string[] | undefined }[] = [];
    Object.keys(out).forEach((k) => {
        const key = k as keyof VersionEvaluation;
        const value = out[key];
        table.push({ key, value });
        setOutput(key, value);
    });
    console.table(table);
})();