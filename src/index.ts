import { getInput } from '@actions/core';
import { context } from '@actions/github';
import { existsSync, readFileSync } from 'fs';



const branch = context.ref.slice("refs/heads/".length);
const releaseScope = branch === 'main' || branch === 'master' ? 'v/latest' : branch;

const isStagingScope = releaseScope.startsWith('v/');
const scopeVersion = isStagingScope ? releaseScope.slice(2) : undefined;

const versionFile = getInput('version-file', { trimWhitespace: true });


console.log('branch', branch);
console.log('releaseScope', releaseScope);
console.log('scopeVersion', scopeVersion);
console.log('isStagingScope', isStagingScope);
console.log('versionFile', versionFile);
console.log('exists', existsSync(versionFile));

if (existsSync(versionFile)) {
    const verObj = JSON.parse(readFileSync(versionFile, { encoding: 'utf-8' }));
    const verStr = (verObj.version ?? '') as string;
    console.log('version', verStr);
}
