# FlakeTracker

## How It Works

Flake Tracker integrates with Mocha and Jest to retry failed tests a configurable number of times. When tests pass on a retry, they are identified as flakey. Using the GitHub API, we automatically create new issues for flakey tests.
Optionally, FlakeTracker can skip known flakey tests by fetching the list of flakey test issues from GitHub before each test suite. FlakeTracker authenticates with the GitHub API as a GitHub App, which allows it to provide rich feedback
on PRs via GitHub Checks.

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
  - Specifies how many retries should be performed before a test is failed. Defaults to 10.
- `SKIP_KNOWN_FLAKES`
  - Only relevant when flake tracker is enabled and tests are run in CI.
  - Set `SKIP_KNOWN_FLAKES=false` to disable the skipping of known flakes in CI. Defaults to `true`.

## Disabling Skipping For Specific Tests

To ensure that a specific known flakey test is run for your PR, simply include the link to the flakey test's issue anywhere in the body of your PR.

## Manually Reporting Flakey Tests

Some flakey tests are not uncovered by retries. That is, if they fail the first time then every retry will also fail. If you encounter tests like this, please create an issue to track it. If you do so correctly, the flakey test will be disabled until the issue is closed.
To manually create a flakey test issue, mimic the format of issues created by the FlakeTracker bot. Specifically, make sure to add the `FLAKEY` label as well as labels for the package name and the ci job the test is run in. Also, include the `testID` of the test in the issue title.
The `testID` can be derived as follows: `jobName -> packageName -> rootDescribeBlockTitle -> ... -> testTitle`. The effort of tracing down the title path will be well worth it! Please also include the test error in the issue body.

## Tricks For Fixing Flakey Tests

- You can configure FlakeTracker to print raw errors for all test retries (even those that don't eventually pass) by setting `LOG_ALL_RETRY_ERRORS=true`.
- You can test for flakiness locally by setting `FLAKEY=true`.
- You can save all FlakeTracker results to text files. See comments in `./db.js`

## Slack Notifications

To receive Slack notifications when new flakey tests are discovered, first [add GitHub to Slack](https://slack.github.com/). Then, send the following Slack command to the GitHub bot to subscribe to issues with the `FLAKEY` label.

```
/github subscribe celo-org/celo-monorepo issues +label:FLAKEY
```

To subscribe to flakey test issues for a specific job or package, just add the job or package name as another label filter

```
/github subscribe celo-org/celo-monorepo issues +label:FLAKEY +label:general-test +label:utils
```

## TODO

TODO(Alec): add option to log all errors on failure (DONE)

TODO(Alec): make checks less verbose (DONE)

TODO(Alec): cleanup code, add comments (DONE)

TODO(Alec): address PR comments

TODO(Alec): Fill in README (DONE)

TODO(Alec): ensure 100% coverage

TODO(Alec): manually make issues for flakey tests

TODO(Alec): Finalize config

TODO(Alec): remove fake flakey tests

TODO(Alec): go through git diff
