# how to release new versions

1. change all @celo/** dependencies which are pointing to the unpublished -dev version to published versions

2. update cli version in cli/package.json to next version with a pre-release (eg -beta.x) suffix

3. run `yarn prepack`

4. *IMPORTANT* double check version in package.json is correct!

5. commit the the package.json and shrinkwrap

6. run `npm publish --otp XXXXXX --tag TAG` *you MUST run with --tag and provide alpha | beta for pre release*

7. add back -dev suffics to @celo/** deps it was removed from in cli package (otherwise ci build will fail)

8. run yarn

9. commit