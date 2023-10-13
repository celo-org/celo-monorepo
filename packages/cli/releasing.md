# how to release new versions

- change all @celo/** dependencies which are pointing to the unpublished -dev version to published versions

- update cli version in cli/package.json to next version with a pre-release (eg -beta.x) suffix

- run `yarn prepack`

- *IMPORTANT* double check version in package.json is correct!

- run `npm publish --otp XXXXXX --tag TAG` *you MUST run with --tag and provide alpha | beta for pre release*

- add back -dev suffics to @celo/** deps it was removed from in cli package (otherwise ci build will fail)

- run yarn

- commit
