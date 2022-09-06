# CP Dev Tools Action: Versions

[![Test](https://github.com/cpdevtools/action-versions/actions/workflows/test.yml/badge.svg)](https://github.com/cpdevtools/action-versions/actions/workflows/test.yml)

This action can be used to parse semversions either from input or from a specified file. The version is then compared to other versions in the repository. The action makes these properties available and provides the ability to tigger action failures, create release pull requests and tag releases

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

# Output

The outputs of this action are catagorized into the floowing scopes:

## Source Branch
The source branch is determind by the `branch` input property.
By default the branch is the branch that triggered the workflow, or if the workflow trigger is a pull request, the `head` brach is used

To be considered a vaild source branch the value must be in the form of `v/{major}[.{minor}]` or `v/latest`.  `main` and `master` branches  are equivilant to `v/latest`

`v/latest` does not validate a maximum range

### Soure branch outputs:

`branch`: string - the name of the current/head branch

`isSource`: boolean - true if `branch` is a valid source branch

`sourceVersion`: string - the current highest version tag within the source range




