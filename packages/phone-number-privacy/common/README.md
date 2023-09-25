# ODIS Common Package

This package contains common code used across ODIS. It is depended on by the Combiner, Signer and Monitor services as well as the @celo/identity and @celo/encrypted-backup SDKS. In most cases where code will be re-used by multiple parts of ODIS, it probably belongs here.

## Notable Contents

- The request and response type schemas for all ODIS APIs.
- Error and Warning types used for monitoring and alerting in both the Combiner and Signer.
- The PEAR Sequential Delay rate limiting algorithm.

## Release Process

When updating the ODIS common package, it is important to remember that all changes must be published before they can be used in production ODIS services or SDKS. If your changes are needed in the SDKS, then you will need to also publish all the Celo SDKs. The instructions below detail this entire SDK release process, but if your changes are only needed in ODIS services you only need to do step 7 (remember to run `yarn && yarn build` before publishing, and consider reading the rest of the steps anyway for context)

These instructions assume the following scenario for readability:

- The latest released sdk version is `3.1.0`
- The SDK versions in the monorepo are all set to `3.1.1-dev`
- You are releasing version `3.2.0` of the SDKs
- The latest released ODIS common package version is `2.0.2`
- You are releasing version `2.0.3` of the ODIS common package

1. Checkout a new branch for the SDK release. Name it something like `<githandle>/release3.2.0`
2. Note that you should release version `3.2.0-beta.1` and `2.0.3-beta.1` and test that everything is working correctly before publishing them as `latest`. If everything is not working correctly, try again with `-beta.2`
3. Search and replace all instances of the current sdk version in the monorepo with the new sdk version you are releasing (check the search and replace changes do what you intend them to before hitting replace!)
   - i.e. search and replace `3.1.1-dev` with `3.2.0-beta.1` (note that we’ve removed the `-dev`)
4. Same idea as above -- ensure the version of the `@celo/phone-number-privacy-common` package is set to the version you are trying to release (i.e. `2.0.3-beta.1`) and that all other packages are importing this version.
5. From the monorepo root directory, run `yarn reset && yarn && yarn build` (expect this to take at least 10 mins)
6. Commit your changes with the message `3.2.0-beta.1`
7. Publish the ODIS common package by navigating to the `phone-number-privacy/common` directory and running `npm publish —-tag beta`
   - You will be prompted to enter your OTP
   - When publishing as `latest`, omit the `--tag beta`
8. Publish the sdks by running `npm run deploy-sdks` from the monorepo root directory
   - You will be prompted to enter a version number that you wish to publish. i.e. `3.2.0-beta.1`
   - You will be repeatedly asked to enter your OTP, which will be automatically supplied if you hit ‘enter’ (you do not have to paste it to the command line each time)
     - When your OTP expires, you will see an error and will have to re-enter the new one
   - Note the `deploy-sdks` script will automatically append `-dev` to all the sdk versions after they're published. You may need to search and replace to undue this if you were publishing a beta release.
9. Depending on what you're releasing, you may want to test that the newly published SDKs work as intended. This may be as simple as checking that CI runs successfully on your `3.2.0-beta.1` commit.
10. Once you are confident in the beta release, repeat steps 3 through 9 with versions `3.2.0` and `2.0.3`. The SDKs will be published with the `latest` tag.
11. The `deploy-sdks` script will automatically append `-dev` to all the sdk versions after they're published. For `latest` releases, it will also increment to the next patch version. Please ensure this happened correctly and commit the result with the message `3.2.1-dev`
12. Get your PR for the release branch reviewed and merged

    - If CI fails with output like below, it means that some packages outside of the SDK did not get incremented to `3.2.1-dev`. Please go through and make sure these are all incremented correctly and CI should pass.

    ```
    ./sdk/utils/src/address.ts(1,46): error TS2307: Cannot find module '@celo/base/lib/address' or its corresponding type declarations.
    ../sdk/utils/src/address.ts(27,8): error TS2307: Cannot find module '@celo/base/lib/address' or its corresponding type declarations.
    ../sdk/utils/src/async.ts(10,8): error TS2307: Cannot find module '@celo/base/lib/async' or its corresponding type declarations
    ```

13. Don’t forget to tag the PR commit as a release in GitHub and add Release Notes
