import { getInput, setOutput } from '@actions/core';
import { context } from '@actions/github';
import { existsSync, readFileSync } from 'fs';
import semver, { SemVer } from 'semver';
import simpleGit from 'simple-git';

interface VersionOutputs {
    branch: string;
    branchLatest: string;
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
    versionValidReleaseMinimum: boolean;
    versionValidReleaseMaximum: boolean;
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

    const versionFile = getInput('version-file', { trimWhitespace: true });
    let ver: semver.SemVer = new semver.SemVer('0.0.0');
    if (existsSync(versionFile)) {
        const verObj = JSON.parse(readFileSync(versionFile, { encoding: 'utf-8' }));
        const verStr = (verObj.version ?? '') as string;
        ver = semver.parse(verStr) ?? new semver.SemVer('0.0.0');
    }

    const git = simpleGit('.');
    //const versionTags = (await git.tags()).all.map(tag => semver.parse(tag)).filter(ver => ver !== null) as semver.SemVer[];
    const versionTags = [
        'v0.0.1-dev.0',
        'v1.0.0',
        'some-other-tag',
        'v1.1.0',
        'v1.1.1',
        'v1.1.2',
        'v1.2.0-dev.0',
    ].map(tag => semver.parse(tag)).filter(ver => ver !== null) as semver.SemVer[];
    
    versionTags.sort(semver.compare).reverse();

    const latest = versionTags[0] ?? semver.parse('0.0.0');



    const isLatestBranch = branchMeta.version === 'latest';

    branchMeta.version = isLatestBranch ? latest.version : branchMeta.version;


    let branchTags:semver.SemVer[] = versionTags;
    const branchVersionParts = branchMeta.version!.split('.');
    let brachVersion: SemVer | null = new semver.SemVer(`0.0.0`);
    if (branchVersionParts.length === 1) {
        brachVersion = new semver.SemVer(`${branchVersionParts[0]}.0.0`);
        branchTags = versionTags.filter(t => t.major === +branchVersionParts[0]);
    } else if (branchVersionParts.length === 2) {
        brachVersion = new semver.SemVer(`${branchVersionParts[0]}.${branchVersionParts[1]}.0`);
        branchTags = versionTags.filter(t => 
            t.major === +branchVersionParts[0] &&
            t.minor === +branchVersionParts[1]
        );
    } else {
        brachVersion = new semver.SemVer(`${branchVersionParts[0]}.${branchVersionParts[1]}.${branchVersionParts[2]}`);
        if (!isLatestBranch) {
            branchTags = versionTags.filter(t => 
                t.major === +branchVersionParts[0] &&
                t.minor === +branchVersionParts[1] &&
                t.patch === +branchVersionParts[2]
            );
        }
    }

    const branchLatest = branchTags[0].version;

    

    
    let versionValidReleaseMinimum = semver.gt(ver, brachVersion);
    let versionValidReleaseMaximum = true;
    
  
    
    
    if (!isLatestBranch) {
        const highestBranchTag = branchTags[0];

        console.log('highestBranchTag', highestBranchTag);
        versionValidReleaseMinimum =  semver.gt(ver, highestBranchTag);


        if (branchVersionParts.length > 2) {
            versionValidReleaseMaximum = false;
        }
        if (branchVersionParts.length >= 1) {
            if (ver.major !== brachVersion.major) {
                versionValidReleaseMaximum = false;
            }
        }
        if (branchVersionParts.length === 2) {
            if (ver.minor !== brachVersion.minor) {
                versionValidReleaseMaximum = false;
            }
        }
    }

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
        versionValidReleaseMaximum,
        branchLatest
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