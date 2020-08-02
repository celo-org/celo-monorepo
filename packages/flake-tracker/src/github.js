const { Octokit } = require('@octokit/rest')
const { App } = require('@octokit/app')
const { retry } = require('@octokit/plugin-retry')
const Client = Octokit.plugin(retry)
const stripAnsi = require('strip-ansi')
const config = require('./config')
const utils = require('./utils')

const defaults = {
  owner: config.org,
  repo: config.repo,
}

const FlakeLabel = 'FLAKEY'
const getLabels = () => {
  const labels = [FlakeLabel, utils.getPackageName()]
  if (process.env.CIRCLECI) {
    labels.push(process.env.CIRCLE_JOB)
  }
  return labels
}

class GitHub {
  constructor(app, rest) {
    if (app === undefined || rest === undefined) {
      throw new Error('GitHub constructor should not be called directly. Please use GitHub.build()')
    }
    this.app = app
    this.rest = rest
  }

  static async build() {
    const app = new App({
      id: config.flakeTrackerID,
      privateKey: process.env.FLAKE_TRACKER_SECRET.replace(/\\n/gm, '\n'),
    })
    const rest = await auth(app)
    return new GitHub(app, rest)
  }

  async renew() {
    if (this === undefined) {
      throw new Error('GitHub.renew() cannot be called before GitHub.build()')
    }
    this.rest = await auth(this.app)
  }

  async report(flakes, skippedTests, obsoleteIssues) {
    if (!process.env.CIRCLECI) return
    const promises = []
    if (config.shouldCreateIssues) {
      // Check list of ALL flakey issues to ensure no duplicates
      // Note: we could technically still have duplicate issues if one is added by another build
      // right after we fetch the list of issues. This seems unlikely so we'll leave it for now and
      // revisit if duplicate issues start appearing.
      const knownFlakes = (await this.fetchFlakeIssues()).map((i) => i.title)
      const newFlakes = flakes.filter((flake) => !knownFlakes.includes(flake.title))
      if (newFlakes.length) {
        promises.push(this.createIssues(newFlakes))
      }
    }
    if (config.shouldAddCheckToPR) {
      promises.push(this.addFlakeCheck(flakes, skippedTests))
      if (config.shouldSkipKnownFlakes && obsoleteIssues.length) {
        promises.push(this.handleObsoleteIssues(obsoleteIssues))
      }
    }
    console.log('\nSending flake tracker results to GitHub...\n')
    // This is intentionally not atomic. That is, we don't mind if a flakey test is only partly reported.
    return Promise.all(promises)
  }

  async createIssues(flakes) {
    if (!process.env.CIRCLECI) return
    return Promise.all(flakes.map((f) => this.createIssue(f)))
  }

  async createIssue(flake) {
    if (!process.env.CIRCLECI) return
    flake.body = 'Discovered in commit ' + process.env.CIRCLE_SHA1 + '\n\n' + flake.body + '\n'
    const fn = () =>
      this.rest.issues.create({
        ...defaults,
        title: flake.title,
        body: stripAnsi(flake.body),
        labels: getLabels(),
      })
    const errMsg = 'Failed to create issue for flakey test. ' + 'Title: "' + flake.title + '",'
    await this.safeExec(fn, errMsg)
  }

  async fetchMandatoryTestsForPR() {
    if (!process.env.CIRCLECI || process.env.CIRCLE_BRANCH === 'master') return []
    const prNumber = utils.getPullNumber()
    const fn = () =>
      this.rest.pulls.get({
        ...defaults,
        pull_number: prNumber,
      })
    console.log('\nFetching mandatory tests for PR ' + prNumber + '...\n')
    const errMsg = 'Failed to fetch mandatory tests for PR ' + prNumber
    const prBody = (await this.safeExec(fn, errMsg)).data.body
    return utils.parseMandatoryTestIssuesFromPullBody(prBody)
  }

  async fetchFlakeIssues() {
    const fn = () =>
      this.rest.paginate(this.rest.issues.listForRepo, {
        ...defaults,
        state: 'open',
        labels: getLabels(),
      })
    console.log('\nFetching known flakey tests from GitHub...')
    const errMsg = 'Failed to fetch existing flakey test issues from GitHub.'
    const issues = (await this.safeExec(fn, errMsg)) || []
    return issues.map(utils.parseDownFlakeIssue)
  }

  async fetchKnownFlakesToSkip() {
    const flakeIssues = await this.fetchFlakeIssues()
    const mandatoryTests = await this.fetchMandatoryTestsForPR()
    const knownFlakesToSkip = flakeIssues.filter(
      // We filter out issues that have been referenced in the PR body or that correspond to
      // setup/teardown steps rather than actual tests.
      (i) => !i.title.includes('FLAKEY SETUP') && !mandatoryTests.includes(i.number.toString())
    )
    return knownFlakesToSkip
  }

  async handleObsoleteIssues(obsoleteIssues) {
    if (!process.env.CIRCLECI) return
    const promises = [this.addObsoleteIssuesCheck(obsoleteIssues)]
    if (process.env.CIRCLE_BRANCH === 'master') {
      promises.push(this.closeIssues(obsoleteIssues))
    }
    return Promise.all(promises)
  }

  async closeIssues(issues) {
    if (!process.env.CIRCLECI) return
    return Promise.all(issues.map((i) => this.closeIssue(i)))
  }

  async closeIssue(issue) {
    if (!process.env.CIRCLECI) return
    const fn = () =>
      this.rest.issues.update({
        ...defaults,
        issue_number: issue.number,
        state: 'closed',
        body:
          'FlakeTracker closed this issue after commit ' +
          process.env.CIRCLE_SHA1 +
          '\n\n' +
          issue.body,
      })
    console.log('\nClosing obsolete issue ' + issue.number + '...')
    const errMsg = 'Failed to close obsolete issue.'
    await this.safeExec(fn, errMsg)
  }

  async addObsoleteIssuesCheck(obsoleteIssues) {
    if (!process.env.CIRCLECI) return
    if (obsoleteIssues.length) {
      await this.addCheckRun(
        {
          ...defaults,
          name: utils.getTestSuiteTitles().join(' -> '),
          head_sha: process.env.CIRCLE_SHA1,
          conclusion: 'neutral',
          output: {
            title: 'Obsolete Issues',
            summary: 'Some flakey test issues no longer correspond to actual tests',
            text:
              (process.env.CIRCLE_BRANCH === 'master'
                ? 'Because these flakey test issues are now obsolete on master, they have been automatically closed.'
                : 'If tests have been refactored or renamed please update the following issues accordingly (but not too long before your PR is merged, as to avoid interfering with other concurrent workflows). If left unchanged, these issues will be automatically closed when this PR is merged.') +
              '\n\n' +
              obsoleteIssues.map((i) => i.html_url).join('\n\n'),
          },
        },
        'Failed to add obsolete issues check run.'
      )
    }
  }

  // addSummaryCheck is called in a final job added to the CI workflow.
  // It provides a breakdown of where flakey tests are located.
  async addSummaryCheck() {
    if (!process.env.CIRCLECI) return
    const title = 'Flakey Test Summary'
    const optsBase = { ...defaults, name: 'Summary', head_sha: process.env.CIRCLE_SHA1 }

    // Get FlakeTracker check runs added so far
    let fn = () =>
      this.rest.checks.listSuitesForRef({
        ...defaults,
        ref: process.env.CIRCLE_SHA1,
        app_id: config.flakeTrackerID,
      })

    let errMsg = 'Failed to list check suites.'
    const res = (await this.safeExec(fn, errMsg)).data
    const numCheckSuites = res.total_count

    // If a check suite has not yet been created by the FlakeTracker app, then no
    // flakiness has been detected in the earlier jobs.
    let opts = {
      ...optsBase,
      conclusion: 'success',
      output: {
        title: title,
        summary: utils.fmtSummary([], [], 0),
        images: [utils.getRandomSuccessImage()],
      },
    }

    if (numCheckSuites) {
      // There should only be one check suite for the FlakeTracker app
      const checkSuite = res.check_suites[0]

      fn = () =>
        this.rest.paginate(this.rest.checks.listForSuite, {
          ...defaults,
          check_suite_id: checkSuite.id,
        })

      errMsg = 'Failed to get check runs in suite.'

      const checkRuns = await this.safeExec(fn, errMsg)

      // If there exists a check run in the suite that is not just reporting obsolete issues,
      // then add summary check run with breakdown of flakey tests across the workflow.
      if (checkRuns.some((checkRun) => !checkRun.output.title.includes('Obsolete'))) {
        // Get breakdowns by test suite (keys are `jobName -> packageName`)
        const foundFlakes = {}
        const skippedFlakes = {}
        const totalFlakes = {}
        checkRuns.forEach((checkRun) => {
          const name = checkRun.name.slice(checkRun.name.search(/[a-zA-Z]/)) // remove emoji prefix if any
          const skipped = utils.parseNumFlakes(checkRun.output.text, /[0-9]+\sflakey/)
          const found = utils.parseNumFlakes(checkRun.output.text, /[0-9]+\snew\sflakey/)
          if (skipped) skippedFlakes[name] = skipped
          if (found) foundFlakes[name] = found
          if (found || skipped) totalFlakes[name] = skipped + found
        })

        const text = utils.fmtWorkflowSummary(foundFlakes, skippedFlakes, totalFlakes)

        console.log(text)

        opts = {
          ...optsBase,
          conclusion: 'neutral',
          output: {
            title: title,
            summary: utils.fmtSummary(Object.keys(foundFlakes), Object.keys(skippedFlakes), 0),
            text: text,
          },
        }
      }
    }

    await this.addCheckRun(opts, 'Failed to add summary check run.')
  }

  async addFlakeCheck(flakes, skippedTests) {
    if (!process.env.CIRCLECI) return
    const conclusion = utils.getConclusion(flakes, skippedTests)

    // Only add checks when there's flakiness (otherwise check suite gets cluttered)
    if (conclusion === 'success') return

    const summary_0 = utils.fmtSummary(flakes, skippedTests, 0)
    const summary_3 = utils.fmtSummary(flakes, skippedTests, 3)

    const annotations = flakes.map((f) => {
      const firstErr = utils.parseFirstErrFromFlakeBody(f.body)
      const lineNumber = utils.parseErrLineNumberFromStack(firstErr) || 1
      const path = utils.parsePathFromStack(firstErr)
      return {
        title: f.title,
        path: path.slice(path.indexOf('packages/')),
        start_line: lineNumber,
        end_line: lineNumber + 1,
        annotation_level: 'warning',
        message: stripAnsi(utils.parseFirstErrFromFlakeBody(f.body)),
      }
    })
    const output = {
      title: utils.statuses[conclusion],
      summary: stripAnsi(summary_0),
      text: stripAnsi(summary_3),
      annotations: annotations,
    }

    let name = utils.getTestSuiteTitles().join(' -> ')
    let conclusionToDisplay = conclusion
    if (!config.newFlakesShouldFailCheckSuite && conclusion !== 'success') {
      name = utils.emojis[conclusion] + ' ' + name
      conclusionToDisplay = 'neutral'
    }

    await this.addCheckRun(
      {
        ...defaults,
        name: name,
        head_sha: process.env.CIRCLE_SHA1,
        conclusion: conclusionToDisplay,
        output: output,
      },
      'Failed to add check run.'
    )
  }

  async addCheckRun(opts, errMsg) {
    if (!process.env.CIRCLECI) return
    const fn = () => {
      return this.rest.checks.create(opts)
    }
    await this.safeExec(fn, errMsg)
  }

  // Retries fn with fresh token if expired
  async safeExec(fn, errMsg) {
    for (let i = 0; i < 2; i++) {
      try {
        return await fn()
      } catch (error) {
        if (i > 0 || error !== 'HttpError: Bad credentials') {
          console.error('\n' + errMsg + ' ' + error)
          return
        }
        await this.renew()
      }
    }
  }
}

// Authenticate as an installation of the Flake Tracker GitHub App
const auth = async (app) => {
  const rest = new Client({
    auth: app.getSignedJsonWebToken(),
  })

  try {
    const installationId = (
      await rest.apps.getRepoInstallation({
        ...defaults,
      })
    ).data.id

    const installationAccessToken = await app.getInstallationAccessToken({
      installationId,
    })

    return new Client({
      auth: installationAccessToken,
    })
  } catch (error) {
    console.error('Flake Tracker App failed to authenticate as an installation ' + error)
    return rest // We're still authenticated by the JWT token, but it will expire sooner.
  }
}

module.exports = GitHub
