import { getInput, getMultilineInput, setOutput } from '@actions/core';
import { context } from '@actions/github';
import { existsSync, readFileSync } from 'fs';
import semver from 'semver';
import simpleGit from 'simple-git';
import { evaluateVersion } from './evaluateVersion';
import { VersionEvaluation } from './VersionEvaluation';


const branchInput = getInput('branch', { trimWhitespace: true }) || undefined;
const versionFileInput = getInput('versionFile', { trimWhitespace: true }) || undefined;
const versionInput = getInput('version', { trimWhitespace: true }) || undefined;
const existingVersionsInput = getMultilineInput('branch', { trimWhitespace: true });


(async () => {
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

    /*

    'v0.0.1-dev.0',
            'v1.0.0',
            'some-other-tag',
            'v1.1.0',
            'v1.1.1',
            'v1.1.2',
            'v1.2.0-dev.0',
            */
    let existingVerStrings = existingVersionsInput.length ? existingVersionsInput : (await git.tags()).all;

    let existingVersions = existingVerStrings
        .map(i => semver.parse(i))
        .filter(i => !!i) as semver.SemVer[];

    const out = evaluateVersion(ver!, existingVersions, branch);

    const table: { key: string, value: string | number | boolean | string[] | undefined }[] = [];
    Object.keys(out).forEach((k) => {
        const key = k as keyof VersionEvaluation;
        const value = out[key];
        table.push({ key, value });
        setOutput(key, value);
    });
    console.table(table);
})();