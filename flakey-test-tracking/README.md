# FlakeTracker

## Overview

Flake Tracker integrates with Mocha and Jest to retry failed tests a configurable number of times. When tests pass on a retry, they are identified as flakey. Using the GitHub API, we automatically create new issues when flakey tests are found on `master` (i.e. only once they're merged).
Optionally, FlakeTracker can skip known flakey tests by fetching the list of flakey test issues from GitHub before each test suite. FlakeTracker authenticates with the GitHub API as a GitHub App, which allows it to provide rich feedback on PRs via GitHub Checks.

## Configuration

You can configure FlakeTracker via the following environment variables.

- `FLAKEY`
  - When running in CI, set `FLAKEY=false` to disable FlakeTracker, which will be enabled by default.
  - When running locally, set `FLAKEY=true` to enable FlakeTracker, which will be disabled by default.
- `LOG_ALL_RETRY_ERRORS`
  - Only relevant when flake tracker is enabled.
  - Enables error logging after retries even for tests that never pass. Defaults to `false`.
- `NUM_RETRIES`
  - Only relevant when flake tracker is enabled.
  - Specifies how many retries should be performed before a test is failed.
  - If you want a "fail fast without flakes" option (let's say you know a bunch of tests will fail, and you want to skip all the flakey tests without retrying each failed test a bunch of times) you can accomplish this by setting `NUM_RETRIES=0`.
- `SKIP_KNOWN_FLAKES`
  - Only relevant when flake tracker is enabled and tests are run in CI.
  - Set `SKIP_KNOWN_FLAKES=false` to disable the skipping of known flakes in CI. Defaults to `true`.
- `FLAKES_FAIL_CHECK_SUITE`
  - If true, new flakey tests will be reported as 'failures' on GitHub Checks. Note this does not affect the CI workflow.

## Disabling Skipping For Specific Tests

To ensure that a specific known flakey test is run for your PR, simply include the link to the flakey test's issue anywhere in the body of your PR.

## Still Seeing Flakey Tests?

Sometimes a flakey test will fail all retries. You can try bumping up the number of retries that are attempted by setting the `NUM_RETRIES` env variable.

Some flakey tests are not uncovered by retries. That is, if they fail the first time then every retry will also fail. If you encounter tests like this, please create an issue to track it. If you do so correctly, the flakey test will be disabled until the issue is closed.
To manually create a flakey test issue, mimic the format of issues created by the FlakeTracker bot. Specifically, make sure to add the `FLAKEY` label as well as labels for the package name and the ci job the test is run in. Also, include the `testID` of the test in the issue title.
The `testID` can be derived as follows: `jobName -> packageName -> rootDescribeBlockTitle -> ... -> testTitle`. The `testID` is printed each time the test is retried and can be found easily in the logs. Please also include the test error in the issue body.

It is important to note that some flakiness might exist in setup/teardown steps like `before` and `after` hooks. FlakeTracker does not currently address these cases, but you should still create issues to track them! Make sure to include the string `FLAKEY SETUP` in the title of the issue (see example at <https://github.com/celo-org/celo-monorepo/issues/4570>) so that FlakeTracker doesn't try to associate the issue with a test.

## Tricks For Fixing Flakey Tests

- You can configure FlakeTracker to print raw errors for all test retries (even those that don't eventually pass) by setting `LOG_ALL_RETRY_ERRORS=true`.
- You can test for flakiness locally by setting `FLAKEY=true`.
- You can save all FlakeTracker results to text files. See comments in `./db.js`

## Obsolete Flakey Test Issues

- If tests are removed, renamed or refactored their `testID` will change and any flakey test issues corresponding to them will be marked as obsolete. This happens when FlakeTracker no longer encounters the `testID` during the course of test execution. When obsolete issues are found on a PR that has not yet been merged, a GitHub Check will alert the PR's author and reviewers that the issue should be renamed with the updated `testID` if possible. Obsolete issues that are found on `master` (i.e. after the PR is merged) will be automatically closed. Note, changes to obsolete flakey test issues should occur only shortly before the PR is merged to avoid interfering with other workflows.

## Slack Notifications

To receive Slack notifications when new flakey tests are discovered, first [add GitHub to Slack](https://slack.github.com/). Then, send the following Slack command to the GitHub bot to subscribe to issues with the `FLAKEY` label.

```
/github subscribe celo-org/celo-monorepo issues +label:FLAKEY
```

To subscribe to flakey test issues for a specific job or package, just add the job or package name as another label filter

```
/github subscribe celo-org/celo-monorepo issues +label:FLAKEY +label:general-test +label:utils
```

## A Warning For Reviewers

When FlakeTracker is enabled, reviewers should exercise caution on PRs that have skipped flakey tests. Note that tests can now be disabled by just creating a github issue, so we should inspect every test that is skipped and ensure it is not relevant to the PR. If you find that a relevant test was skipped,
just include the link to the corresponding flakey test issue in the PR body and run the build again. This will force the flakey test to run. If you wish to disable skipping flakey tests entirely for a given job you can do so by setting `SKIP_KNOWN_FLAKES=false`.
