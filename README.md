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

# Usage
```yml
    - uses: actions/checkout@v3
    - name: Auto Create 
        uses: cpdevtools/action-versions@latest
        with:
            # Path to a json file that contains the target verion.
            #
            # Default: './package.json'
            versionFile: ''

            # The target version.
            # if `versionFile` is set this is used as a failover if
            # the file is missing a version, Otherwide it ise used 
            # instead of loading from the default file. 
            #
            # Default: undefined
            version: ''

            # The branch name. 
            # Branch name is used to derive validation rules.
            #
            # Default: the current branch name, or the head branch
            # name on pull requests.
            branch: ''
            
            # The released versions. One per line
            #
            # Default: All repository tags that are 
            # valid semver versions
            existingVersions: ''

            # GitHub token used to authenticate the GitHub api
            #
            # Default: ${{ github.token }}
            githubToken: ${{ github.token }}

            # If true and `validCanCreate` output is false
            # then a failed state will be set on the action
            #
            # Default: false
            failInvalidCanCreate: false

            # If true and `validIsNewVersion` output is false
            # then a failed state will be set on the action
            #
            # Default: false
            failInvalidIsNewVersion: false

            # If true and `validIsHighestVersionInBranch` output 
            # is false then a failed state will be set on the action
            #
            # Default: false
            failInvalidIsHighestVersionInBranch: false

            # If true and `validIsHighestVersion` output is false
            # then a failed state will be set on the action
            #
            # Default: false
            failInvalidIsHighestVersion: false

            # If true and `validBranchVersionMinimum` output is false
            # then a failed state will be set on the action
            #
            # Default: false
            failInvalidBranchVersionMinimum: false

            # If true and `vaildBranchVersionMaximum` output is false
            # then a failed state will be set on the action
            #
            # Default: false
            failInvaildBranchVersionMaximum: false


            # if true, the `validCanCreate` output propety is true,
            # and there is no open pull request open between the
            # source and target branches, then creat a new pull
            # request.
            #
            # Note: This should only be used from "source" branches
            #
            # Default: false 
            autoCreatePullRequest: false


            # What tags to create. if they exist they are removed
            # and re-added at the current commit
            #
            # Values:
            #  'none'         - Don't create any tags
            #
            #  'named'
            #    latest       - the current commit will be 
            #                   tagged as 'latest' if it is the
            #                   highest non preprelease version
            #    next         - the current commit will be tagged 
            #                   as 'next' if it is the highest 
            #                   version
            #    {prerelease} - the current commit will be tagged 
            #                   as '{prerelease}'. 
            #                   Where {prerelease} is the  
            #                   prerelease component of the version.
            #                   eg. the 'beta' in 'v1.0.0-beta.2'
            #
            #  'components'
            #    If the version is a not a prerlease and it is the 
            #    highest version with a matching major component it
            #    will be tagged with `v{major}`
            #
            #    If the version is a not a prerlease and it is the 
            #    highest version with matching major & minor
            #    components it will be tagged with `v{major}.{minor}`
            #
            #  'all' 
            #     Apply both 'named' and 'components' tags
            #
            # Default: 'none'
            createTags: none
```

# Inputs
The outputs of this action are catagorized into the following scopes:

## Arguments

| input | type | default | description |
|-------| -----|---------|-------------|
| versionFile | string | './package.json' | Path to a json file that contains the target verion. |
| version | string |  | The target version.<br/> if `versionFile` is set this is used as a failover if the file is missing a version, Otherwide it ise used instead of loading from the default file. |
| branch | string | the current/head branch name | The branch name |
| existingVersions | Array<string> | All repository tags that are valid semver versions | The released versions. One per line |
| githubToken | string | ${{ github.token }} | GitHub token used to authenticate the GitHub api |

### Details

<br/>

## Validation

| input | type | default | description |
|-------| -----|---------|-------------|
| failInvalidCanCreate | boolean | false | If true and `validCanCreate` is false the action will fail |
| failInvalidIsNewVersion | boolean | false | If true and `validIsNewVersion` is false the action will fail |
| failInvalidIsHighestVersionInBranch | boolean | false | If true and `validIsHighestVersionInBranch` is false the action will fail |
| failInvalidIsHighestVersion | boolean | false | If true and `validIsHighestVersion` is false the action will fail |
| failInvalidBranchVersionMinimum | boolean | false | If true and `validBranchVersionMinimum` is false the action will fail |
| failInvaildBranchVersionMaximum | boolean | false | If true and `vaildBranchVersionMaximum` is false the action will fail |

### Details

<br/>

## Actions

| input | type | default | description |
|-------| -----|---------|-------------|
| [autoCreatePullRequest](#autoCreatePullRequest) | boolean | false | if true, the `validCanCreate` output propety is true, and there is no open pull request open between the source and target branches, then creat a new pull request.|
| [createTags](#createTags) | 'none' \| 'named' \| 'compnents' \| 'all' | 'none' | Applys tags to the current commit provided there is no failure state |

### Details

#### autoCreatePullRequest
type: boolean

Creates a new pull request between the source and target baranches.
If there is already a pull request btween those branches or `validCanCreate` is false, then no pr is created.

#### createTags
type: 'none' | 'named' | 'compnents' | 'all'

What tags to create. If they exist they are removed and re-added at the current commit

| value | tag(s) applied | description |
|-------|----------------|-------------|
| none  |                | Don't create any tags |
| all | | Applies both 'named' and 'components' |        
| named | latest         | the current commit will be tagged as 'latest' if it is the highest non preprelease version |
|       | next           | the current commit will be tagged as 'next' if it is the highest version |
|       | {prerelease} | the current commit will be tagged as '{prerelease}'. eg. 'beta' or 'rc' |
| components | v{major} | When the version is a not a prerlease and it is the highest version with a matching major component. |
|            | v{major}.{minor} | When the version is a not a prerlease and it is the highest version with matching major & minor components


# Outputs
The outputs of this action are catagorized into the following scopes:

## General
 
| output                  | type           | description                                             |
|-------------------------|----------------|---------------------------------------------------------|
| branch                  | string         | the name of the current/head branch                     |
| isSource                | boolean        | `true` if `branch` is a valid source branch             |
| isTarget                | boolean        | `true` if `branch` is a valid target branch             |
| highestVersion          | string         | the highest version in `existingVersions`               |
| latestVersion           | string         | the highest release version in  `existingVersions`      |


## Source

| output                  | type           | description                                             |
|-------------------------|----------------|---------------------------------------------------------|
| sourceVersion           | string         | the current highest version tag within the source range |
| sourceMajor             | number         | major component of `sourceVersion`                      |
| sourceMinor             | number         | number - mminor component of `sourceVersion`            |
| sourcePatch             | number         | patch component of `sourceVersion`                      |
| sourceBuild             | Array<number>  | build components of `sourceVersion`                     |
| sourcePrerelease        | string         | prerelease component of `sourceVersion`                 |
| sourcePrereleaseBuild   | Array<number>  | prerelease build component of `sourceVersion`           |
| sourceIsPrerelease      | boolean        | the `sourceVersion` is a prerelease version             |
| sourceIsStable          | boolean        | the `sourceVersion` is a >= v1.0.0                      |


## Target

| output                  | type           | description                                                                           |
|-------------------------|----------------|---------------------------------------------------------------------------------------|
| targetVersion           | string         | the version tag that is being targeted                                                |
| targetMajor             | number         | major component of `targetVersion`                                                    |
| targetMinor             | number         | minor component of `targetVersion`                                                    |
| targetPatch             | number         | patch component of `targetVersion`                                                    |
| targetBuild             | Array<number>  | build components of `targetVersion`                                                   |
| targetPrerelease        | string         | prerelease component of `targetVersion`                                               |
| targetPrereleaseBuild   | number         | prerelease build component of `targetVersion`                                         |
| targetIsPrerelease      | boolean        | the `targetVersion` is a prerelease version                                           |
| targetIsStable          | boolean        | the `targetVersion` is a >= v1.0.0                                                    |
| isHighestVersion        | boolean        | `targetVersion` is the highest version in the repository                              |
| isHighestMajor          | boolean        | `targetVersion` is the highest version with the same major component                  |
| isHighestMinor          | boolean        | `targetVersion` is the highest version with the same major & minor components         |
| isLatestVersion         | boolean        | `targetVersion` is the highest release version in the repository                      |
| isLatestMajor           | boolean        | `targetVersion` is the highest release version with the same major component          |
| isLatestMinor           | boolean        | `targetVersion` is the highest release version with the same major & minor components |

## Validation

| output                  | type           | description                                                                           |
|-------------------------|----------------|---------------------------------------------------------------------------------------|
| validCanCreate | boolean | `targetVersion` meets all validation and is ready to be created. True if the current branch is a a source or target branch, the `targetVersion` does not yet exist, the `targetVersion` will be the highest version in the branch and `validBranchVersionMinimum` and `vaildBranchVersionMaximum` are true. |
| validBranchVersionMinimum | boolean | `targetVersion` meets the minimum for the release range. This is always true in 'latest' branches |
| vaildBranchVersionMaximum | boolean | `targetVersion` meets the maximum for the release range. This is always true in 'latest' branches |
| validIsNewVersion | boolean | `targetVersion` is a new version tag |
| validIsHighestVersionInBranch | boolean | `targetVersion` will be the highest version in the release range |
| validIsHighestVersion | boolean | `targetVersion` will be the highest version |


#  Examples