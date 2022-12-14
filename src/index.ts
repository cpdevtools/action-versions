import { getBooleanInput, getInput, getMultilineInput, setFailed, setOutput } from '@actions/core';
import { context } from '@actions/github';
import { Octokit } from '@octokit/rest';
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
    return 1;
  }
  return 0;
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

  let fails = 0;
  fails += applyFailed('validCanCreate', out);
  fails += applyFailed('validIsNewVersion', out);
  fails += applyFailed('validIsHighestVersionInBranch', out);
  fails += applyFailed('validBranchVersionMinimum', out);
  fails += applyFailed('vaildBranchVersionMaximum', out);
  fails += applyFailed('validIsHighestVersion', out);

  if (!fails) {

    await applyTags(out);
  }

})();


const Tags = [
  'version',
  'latest',
  'next',
  'pre-release',
  'latest-major',
  'latest-minor',
] as const;

const TagAliases = {
  all: Tags,
  named: ['latest', 'next', 'pre-release'],
  versions: ['version', 'latest-major', 'latest-minor'],
  'version-components': ['latest-major', 'latest-minor']
} as const;


type TagType = typeof Tags[number];
type TagInput = TagType | keyof typeof TagAliases;


async function applyTags(versionStatus: VersionStatus) {
  const githubTokenInput = getInput('githubToken', { trimWhitespace: true });
  const octokit = new Octokit({ auth: githubTokenInput });

  const createTags = Array.from(new Set((getMultilineInput('createTags', { trimWhitespace: true }) as TagInput[])
    .map(tag => TagAliases[tag as keyof typeof TagAliases] as any as TagType[] ?? tag)
    .flat()
    .filter(tag => Tags.includes(tag))));

  if (createTags.includes('version')) {
    await applyTag(octokit, `v${versionStatus.targetVersion}`);
  }

  if (createTags.includes('latest') && versionStatus.isLatestVersion) {
    await applyTag(octokit, 'latest');
  }

  if (createTags.includes('next') && versionStatus.isHighestVersion) {
    await applyTag(octokit, 'next');
  }

  if (createTags.includes('pre-release') && versionStatus.isHighestVersion) {
    await applyTag(octokit, versionStatus.targetPrerelease!);
  }

  if (createTags.includes('latest-major') && versionStatus.isLatestMajor) {
    await applyTag(octokit, `v${versionStatus.targetMajor}`);
  }

  if (createTags.includes('latest-minor') && versionStatus.isLatestMinor) {
    await applyTag(octokit, `v${versionStatus.targetMajor}.${versionStatus.targetMinor}`);
  }
}

async function applyTag(github: Octokit, tag: string, throwIfExists?: boolean) {
  if (throwIfExists) {
    let exists = false;
    try {
      await github.git.getRef({
        owner: context.repo.owner,
        repo: context.repo.repo,
        ref: "tags/" + tag
      });
      exists = true;
    } catch { }

    if (exists) {
      throw new Error(`Tag '${tag}' already exists.`)
    }
  }
  let removed = false;
  try {
    await github.git.deleteRef({
      owner: context.repo.owner,
      repo: context.repo.repo,
      ref: "tags/" + tag
    });
    removed = true;
  } catch { }

  await github.git.createRef({
    owner: context.repo.owner,
    repo: context.repo.repo,
    ref: "refs/tags/" + tag,
    sha: context.sha
  });

  if (removed) {
    console.info(`Moved tag '${tag}' to ${context.sha}`);
  } else {
    console.info(`Added tag '${tag}' at ${context.sha}`);
  }
}
