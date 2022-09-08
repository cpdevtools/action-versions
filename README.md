# CP Dev Tools Action: Versions

[![Test](https://github.com/cpdevtools/action-versions/actions/workflows/test.yml/badge.svg)](https://github.com/cpdevtools/action-versions/actions/workflows/test.yml)

This action can be used to parse semver versions either from input or from a specified file. The version is then compared to other versions in the repository. The action makes these properties available and provides the ability to tigger action failures, create release pull requests and tag releases



## Source Branch
The source branch is determind by the `branch` input property.
By default it is the branch that triggered the workflow, or if the workflow trigger is a pull request, the `head` branch is used

To be considered a vaild source branch the value must be in the form of `v/{major}[.{minor}]` or `v/latest`.  `main` and `master` branches  are equivilant to `v/latest`

`v/latest` does not have a minimum or maximum range

## Target Branch
The Target branch is determind by the `branch` input property.
The target branch is paied with the source branch. For example: 
source branch `v/1.1` becomes target branch `release/1.1`. 
source branch `main`(alias of `v/latest`) becomes target branch `release/latest`

## Example Source/Target Pairs 

| source | target         | description                      |
|--------|----------------|----------------------------------|
| main   | release/latest | This is the main release flow.   |
| v1     | release/1      | branch pair for v1.x.x releases. |
| v2.1   | release/2.1    | branch pair for v2.1.x releases. |

normaly a project can use only the `latest` pair, the version specific pairs are used to maintain legacy versions of the project (LTS versions for example).

## Other branches
All other branches are neither source nor target branches. In this case the source/target relative validations will not be calculated.


# Inputs

| input | type | default | description |
|-------| -----|---------|-------------|
| [versionFile](#versionFile) | string | './package.json' | Path to a json file that contains the target verion. |
| [version](#version) | string |  | The target version.<br/> if [versionFile](#versionFile) is set this is used as a failover if the file is missing a version, Otherwide it ise used instead of loading from the default file. |
| [branch](#branch) | string | the current/head branch name | The branch name |
| [existingVersions](#existingVersions) | Array<string> | All repository tags that are valid semver versions | The released versions. One per line |
| [githubToken](#githubToken) | string | ${{ github.token }} | GitHub token used to authenticate the GitHub api |
| [failInvalidCanCreate](#failInvalidCanCreate) | boolean | false | If true and [validCanCreate](#validCanCreate) is false the action will fail |
| [failInvalidIsNewVersion](#failInvalidIsNewVersion) | boolean | false | If true and [validIsNewVersion](#validIsNewVersion) is false the action will fail |
| [failInvalidIsHighestVersionInBranch](#failInvalidIsHighestVersionInBranch) | boolean | false | If true and [validIsHighestVersionInBranch](#validIsHighestVersionInBranch) is false the action will fail |
| [failInvalidIsHighestVersion](#failInvalidIsHighestVersion) | boolean | false | If true and [validIsHighestVersion](#validIsHighestVersion) is false the action will fail |
| [failInvalidBranchVersionMinimum](#failInvalidBranchVersionMinimum) | boolean | false | If true and [validBranchVersionMinimum](#validBranchVersionMinimum) is false the action will fail |
| [failInvaildBranchVersionMaximum](#failInvaildBranchVersionMaximum) | boolean | false | If true and [vaildBranchVersionMaximum](#vaildBranchVersionMaximum) is false the action will fail |
| [autoCreatePullRequest](#autoCreatePullRequest) | boolean | false | if true, the [validCanCreate](#validCanCreate) output propety is true, and there is no open pull request open between the source and target branches, then creat a new pull request.|
| [createTags](#createTags) | 'none' \| 'named' \| 'compnents' \| 'all' | 'none' | Applys tags to the current commit provided there is no failure state |

## Details

### `versionFile`
type: string
default: './package.json'

Path to a json file that contains the target verion. If neither [versionFile](#versionFile) nor [version](#version) are set then the version is loaded from './package.json'
If this argument is explicitly provided then [version](#version) functions as a fallback value

### `version`
type: string

The version to use as the target version. If [versionFile](#versionFile) is also provided this functions as a fallback value.

### `branch`
type: string

The branch name. Defaults to the current branch or source branch if the workflow was triggered by a pull request.

The brach name use used to determine the validation constraints

### `existingVersions`
type: Array<string>

An array of released versions. One per line. By default this is a list of all the tag in the repository that are valid semver versions.

This is used to determine the hightest, latest and existance to versions

### `githubToken`
type: string
default: ${{ github.token }}

GitHub token used to authenticate the GitHub api


### `failInvalidCanCreate`
type: boolean
default: false

If true and [validCanCreate](#validCanCreate) is false the action will fail

### `failInvalidIsNewVersion`
type: boolean
default: false

If true and [validIsNewVersion](#validIsNewVersion) is false the action will fail

### `failInvalidIsHighestVersionInBranch`
type: boolean
default: false

If true and [validIsHighestVersionInBranch](#validIsHighestVersionInBranch) is false the action will fail

### `failInvalidIsHighestVersion`
type: boolean
default: false

If true and [validIsHighestVersion](#validIsHighestVersion) is false the action will fail

### `validBranchVersionMinimum`
type: boolean
default: false

If true and [validBranchVersionMinimum](#validBranchVersionMinimum) is false the action will fail

### `vaildBranchVersionMaximum`
type: boolean
default: false

If true and [vaildBranchVersionMaximum](#vaildBranchVersionMaximum) is false the action will fail

### `autoCreatePullRequest`
type: boolean

Creates a new pull request between the source and target baranches.
If there is already a pull request btween those branches or [validCanCreate](#validCanCreate) is false, then no pr is created.

### `createTags`
type: "version" | "latest" | "next" | "pre-release" | "latest-major" | "latest-minor" | "all" | "named" | "versions" | "version-components"

Create tags by category. Each tag has its own rules that determine weather it is applied to the current commit or not as outlined below. If a tag exists it is removed and re-added at the current commit.


#### Aliases

Aliases are shortcuts to include multiple tags

| Alias | Tags |
|-|-|
| all | adds all tags |
| named | 'latest', 'next', 'pre-release' |
| versions | 'version', 'latest-major', 'latest-minor' |
| version-components | 'latest-major', 'latest-minor' |

#### Tags

| Value | Example Tag(s) | Applied When |
|-|-|-|
| version | v1.0.0<br/>v1.2.0-beta.3 | Always. Will Error if `v{targetVersion}` exists as a tag |        
| latest | latest | [targetVersion](#targetVersion) is the highest non preprelease version in [existingVersions](#existingVersions) |
| next | next | [targetVersion](#targetVersion) is the highest version in [existingVersions](#existingVersions) |
| pre-release | dev<br>alpha<br>beta<br>rc | [targetVersion](#targetVersion) has a pre-release compnent and is the highest version in [existingVersions](#existingVersions) |
| latest-major | v2 | [targetVersion](#targetVersion) is a not a pre-release and it is the highest version in [existingVersions](#existingVersions) with a matching major component |
| latest-minor | v1.2 | [targetVersion](#targetVersion) is a not a pre-release and it is the highest version in [existingVersions](#existingVersions) with matching major & minor components |
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;||

# Outputs
The outputs of this action are catagorized into the following scopes:

## General
 
| output                  | type           | description  |
|-------------------------|----------------|-----------------|
| [branch](#output_branch)| string  | the name of the current/head branch |
| [isSource](#isSource) | boolean | `true` if `branch` is a valid [source branch](#source-branch) |
| [isTarget](#isTarget) | boolean | `true` if `branch` is a valid [target branch](#target-branch) |
| [highestVersion](#highestVersion) | string | the highest version in [existingVersions](#existingVersions) |
| [latestVersion](#latestVersion) | string | the highest release version in  [existingVersions](#existingVersions) |

### Details

#### <a name="output_branch">`branch`</a>
type: string

the name of the branch. This is the resolved value of the [branch](#output_branch) input

#### `isSource`
type: boolean

whether or not the [branch](#output_branch) is a [source branch](#source-branch)

#### `isTarget`
type: boolean

whether or not the [branch](#output_branch) is a [target branch](#target-branch)

#### `highestVersion`
type: string

the highest version in [existingVersions](#existingVersions)


#### `latestVersion`
type: string

the highest release version in [existingVersions](#existingVersions)

## Source

| output | type | description  |
|-------------------------|----------------|---------------------------------------------------------|
| [sourceVersion](#sourceVersion) | string | the current highest version tag within the source range |
| [sourceMajor](#sourceMajor) | number | major component of [sourceVersion](#sourceVersion) |
| [sourceMinor](#sourceMinor) | number | number - mminor component of [sourceVersion](#sourceVersion) |
| [sourcePatch](#sourcePatch) | number | patch component of [sourceVersion](#sourceVersion) |
| [sourceBuild](#sourceBuild) | Array<number> | build components of [sourceVersion](#sourceVersion) |
| [sourcePrerelease](#sourcePrerelease) | string | prerelease component of [sourceVersion](#sourceVersion) |
| [sourcePrereleaseBuild](#sourcePrereleaseBuild) | Array<number> | prerelease build component of [sourceVersion](#sourceVersion) |
| [sourceIsPrerelease](#sourceIsPrerelease) | boolean | the [sourceVersion](#sourceVersion) is a prerelease version |
| [sourceIsStable](#sourceIsStable) | boolean | the [sourceVersion](#sourceVersion) is a >= v1.0.0 |

### Details

#### `sourceVersion`
type: string

#### `sourceMajor`
type: number

#### `sourceMinor`
type: number

#### `sourcePatch`
type: number

#### `sourceBuild`
type: Array<number>

#### `sourcePrerelease`
type: string

#### `sourcePrereleaseBuild`
type: number

#### `sourceIsPrerelease`
type: boolean

#### `sourceIsStable`
type: boolean


## Target

| output | type | description |
|-|-|-|
| [targetVersion](#targetVersion) | string | the version tag that is being targeted  |
| [targetMajor](#targetMajor) | number | major component of [targetVersion](#targetVersion) |
| [targetMinor](#targetMinor) | number | minor component of [targetVersion](#targetVersion) |
| [targetPatch](#targetPatch) | number | patch component of [targetVersion](#targetVersion) |
| [targetBuild](#targetBuild) | Array<number> | build components of [targetVersion](#targetVersion) |
| [targetPrerelease](#targetPrerelease) | string | prerelease component of [targetVersion](#targetVersion) |
| [targetPrereleaseBuild](#targetPrereleaseBuild) | number | prerelease build component of [targetVersion](#targetVersion) |
| [targetIsPrerelease](#targetIsPrerelease) | boolean | the [targetVersion](#targetVersion) is a prerelease version |
| [targetIsStable](#targetIsStable) | boolean | the [targetVersion](#targetVersion) is a >= v1.0.0 |
| [isHighestVersion](#isHighestVersion)  | boolean | [targetVersion](#targetVersion) is the highest version in the repository |
| [isHighestMajor](#isHighestMajor) | boolean | [targetVersion](#targetVersion) is the highest version with the same major component |
| [isHighestMinor](#isHighestMinor) | boolean | [targetVersion](#targetVersion) is the highest version with the same major & minor components |
| [isLatestVersion](#isLatestVersion) | boolean | [targetVersion](#targetVersion) is the highest release version in the repository |
| [isLatestMajor](#isLatestMajor) | boolean | [targetVersion](#targetVersion) is the highest release version with the same major component |
| [isLatestMinor](#isLatestMinor) | boolean | [targetVersion](#targetVersion) is the highest release version with the same major & minor components |


### Details

#### `targetVersion`
type: string

#### `targetMajor`
type: number

#### `targetMinor`
type: number

#### `targetPatch`
type: number

#### `targetBuild`
type: Array<number>

#### `targetPrerelease`
type: string

#### `targetPrereleaseBuild`
type: number

#### `targetIsPrerelease`
type: boolean

#### `targetIsStable`
type: boolean

#### `isHighestVersion`
type: boolean

#### `isHighestMajor`
type: boolean

#### `isHighestMinor`
type: boolean

#### `isLatestVersion`
type: boolean

#### `isLatestMajor`
type: boolean

#### `isLatestMinor`
type: boolean


## Validation

| output                  | type           | description                                                                           |
|-------------------------|----------------|---------------------------------------------------------------------------------------|
| [validCanCreate](#validCanCreate) | boolean | [targetVersion](#targetVersion) meets all validation and is ready to be created. True if the current branch is a a source or target branch, the [targetVersion](#targetVersion) does not yet exist, the [targetVersion](#targetVersion) will be the highest version in the branch and [validBranchVersionMinimum](#validBranchVersionMinimum) and [vaildBranchVersionMaximum](#vaildBranchVersionMaximum) are true. |
| [validBranchVersionMinimum](#validBranchVersionMinimum) | boolean | [targetVersion](#targetVersion) meets the minimum for the release range. This is always true in 'latest' branches |
| [vaildBranchVersionMaximum](#vaildBranchVersionMaximum) | boolean | [targetVersion](#targetVersion) meets the maximum for the release range. This is always true in 'latest' branches |
| [validIsNewVersion](#validIsNewVersion) | boolean | [targetVersion](#targetVersion) is a new version tag |
| [validIsHighestVersionInBranch](#validIsHighestVersionInBranch) | boolean | [targetVersion](#targetVersion) will be the highest version in the release range |
| [validIsHighestVersion](#validIsHighestVersion) | boolean | [targetVersion](#targetVersion) will be the highest version |

### Details

#### `validCanCreate`
type: boolean

#### `validBranchVersionMinimum`
type: boolean

#### `vaildBranchVersionMaximum`
type: boolean

#### `validIsNewVersion`
type: boolean

#### `validIsHighestVersionInBranch`
type: boolean

#### `validIsHighestVersion`
type: boolean


#  Examples