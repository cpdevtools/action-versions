import { getInput, setOutput } from '@actions/core';
import { context } from '@actions/github';
import { existsSync, readFileSync } from 'fs';
import semver from 'semver';
import simpleGit from 'simple-git';

interface VersionOutputs {
    branch: string;
    isReleaseSourceBranch: boolean;
    isReleaseTargetBranch: boolean;
    version: string;
    versionMajor: number;
    versionMinor: number;
    versionPatch: number;
    versionBuild?: string[];
    versionPrerelease?: string;
    versionPrereleaseBuild?: number;
    versionIsPrerelease?: boolean;
    versionIsStable?: boolean;
    versionValidReleaseMinimum:boolean;
    versionValidReleaseMaximum:boolean;
}



function getBranchMeta(branch: string) {
    const scope = branch === 'main' || branch === 'master' ? 'v/latest' : branch;
    const isReleaseBranch = scope.startsWith('release/');
    const isPrepBranch = scope.startsWith('v/');
    const version = isReleaseBranch ? scope.slice(8) : (isPrepBranch ? scope.slice(2) : undefined);
    return {
        branch,
        isReleaseTargetBranch: isReleaseBranch,
        isReleaseSourceBranch: isPrepBranch,
        version
    };
}


(async () => {
    const branch = context.ref.slice("refs/heads/".length);
    const branchMeta = getBranchMeta(branch);

    console.log('branchMeta', branchMeta);

    const versionFile = getInput('version-file', { trimWhitespace: true });
    let ver: semver.SemVer = new semver.SemVer('0.0.0');
    if (existsSync(versionFile)) {
        const verObj = JSON.parse(readFileSync(versionFile, { encoding: 'utf-8' }));
        const verStr = (verObj.version ?? '') as string;
        ver = semver.parse(verStr) ?? new semver.SemVer('0.0.0');
    }

    const git = simpleGit('.');
    const versionTags = (await git.tags()).all.map(tag => semver.parse(tag)).filter(ver => ver !== null) as semver.SemVer[];
    versionTags.sort(semver.compare);

    const latest = versionTags[versionTags.length-1] ?? semver.parse('0.0.0');



    const isLatestBranch = branchMeta.version === 'latest';

    branchMeta.version = isLatestBranch ? latest.version : branchMeta.version;

console.log('branchMeta', branchMeta);
    
    const brachVersion = semver.parse('v' + branchMeta.version, true)!;
    console.log('brachVersion', brachVersion);

    const versionValidReleaseMinimum = semver.gt(ver, brachVersion);

    let versionValidReleaseMaximum = true;
    if(!isLatestBranch){

    }
    console.log('brachVersion', ver.version, brachVersion.version, semver.gt(ver, brachVersion));

  
    const out: VersionOutputs = {
        branch: branchMeta.branch,
        isReleaseSourceBranch: branchMeta.isReleaseSourceBranch,
        isReleaseTargetBranch: branchMeta.isReleaseTargetBranch,
        version: ver.version,
        versionMajor: ver.major,
        versionMinor: ver.minor,
        versionPatch: ver.patch,
        versionBuild: ver.build as string[] | undefined,
        versionPrerelease: (ver?.prerelease[0] as string) ?? undefined,
        versionPrereleaseBuild: (ver?.prerelease[1] as number) ?? undefined,
        versionIsPrerelease: !!ver?.prerelease.length,
        versionIsStable: !ver?.prerelease.length && (ver?.major ?? 0) >= 1,
        versionValidReleaseMinimum,
        versionValidReleaseMaximum
    };



    const table: { key: string, value: string | number | boolean | string[] | undefined }[] = [];

    Object.keys(out).forEach((k) => {
        const key = k as keyof VersionOutputs;
        const value = out[key];
        setOutput(key, value);
        table.push({ key, value });
    });

    console.table(table);
})();