const { Octokit } = require('@octokit/rest')
const { App } = require('@octokit/app')
const { retry } = require('@octokit/plugin-retry')
const Client = Octokit.plugin(retry)
const stripAnsi = require('strip-ansi')
const config = require('./config')
const utils = require('./utils')

// This is the FlakeTracker GitHub App ID. Can be found at github.com -> celo-org -> app settings
const flakeTrackerID = 71131

const defaults = {
  owner: config.org,
  repo: config.repo,
}

const statuses = {
  failure: 'flakey tests were found',
  neutral: 'flakey tests were skipped',
  success: 'no flakey tests found!',
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
      id: flakeTrackerID,
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

  async report(flakes, skippedTests) {
    const promises = []
    if (config.shouldCreateIssues) {
      // Check list of ALL flakey issues to ensure no duplicates
      // Note: we could technically still have duplicate issues if one is added by another build
      // right after we fetch the list of issues. This seems unlikely so we'll leave it for now and
      // revisit if duplicate issues start appearing.
      const knownFlakes = await this.fetchKnownFlakes()
      const newFlakes = flakes.filter((flake) => !knownFlakes.includes(flake.title))
      if (newFlakes.length) {
        promises.push(this.createIssues(newFlakes))
      }
    }
    if (config.shouldAddCheckToPR) {
      promises.push(this.addCheck(flakes, skippedTests))
    }
    console.log('\nSending flake tracker results to GitHub...\n')
    return Promise.all(promises)
  }

  async createIssues(flakes) {
    return Promise.all(flakes.map((f) => this.createIssue(f)))
  }

  async createIssue(flake) {
    if (process.env.CIRCLECI) {
      flake.body =
        'Discovered in PR ' + process.env.CIRCLE_PULL_REQUEST + '\n\n' + flake.body + '\n'
    }
    const fn = () => {
      return this.rest.issues.create({
        ...defaults,
        title: flake.title,
        body: stripAnsi(flake.body),
        labels: getLabels(),
      })
    }
    const errMsg = 'Failed to create issue for flakey test. ' + 'Title: "' + flake.title + '",'
    await this.safeExec(fn, errMsg)
  }

  async fetchMandatoryTestsForPR() {
    if (!process.env.CIRCLECI) return []
    const prNumber = utils.getPullNumber()
    const fn = () => {
      return this.rest.pulls.get({
        ...defaults,
        pull_number: prNumber,
      })
    }
    console.log('\nFetching mandatory tests for PR ' + prNumber + '...\n')
    const errMsg = 'Failed to fetch mandatory tests for PR ' + prNumber
    const prBody = (await this.safeExec(fn, errMsg)).data.body
    return utils.parseMandatoryTestIssuesFromPullBody(prBody)
  }

  async fetchFlakeIssues() {
    const fn = () => {
      return this.rest.paginate(this.rest.issues.listForRepo, {
        ...defaults,
        state: 'open',
        labels: getLabels(),
      })
    }
    console.log('\nFetching known flakey tests from GitHub...')
    const errMsg = 'Failed to fetch existing flakey test issues from GitHub.'
    return (await this.safeExec(fn, errMsg)) || []
  }

  async fetchKnownFlakesToSkip() {
    const flakeIssues = await this.fetchFlakeIssues()
    const mandatoryTests = await this.fetchMandatoryTestsForPR()
    const knownFlakesToSkip = flakeIssues.filter((i) => {
      return !mandatoryTests.includes(i.number.toString())
    })
    return knownFlakesToSkip.map((i) => i.title)
  }

  async fetchKnownFlakes() {
    const flakeIssues = await this.fetchFlakeIssues()
    return flakeIssues.map((i) => i.title)
  }

  // This is called only in a final job added to the workflow.
  // It adds a 'success' GitHub check to the PR when no flakiness has been reported.
  async addSummaryCheck() {
    // Get number of check runs added so far
    let fn = () => {
      return this.rest.checks.listSuitesForRef({
        ...defaults,
        ref: process.env.CIRCLE_SHA1,
        app_id: flakeTrackerID, // only list suites created by the FlakeTracker app
      })
    }
    let errMsg = 'Failed to list check suites.'
    const numCheckSuites = (await this.safeExec(fn, errMsg)).data.total_count

    // If a check suite has not yet been created by the FlakeTracker app, then no
    // flakiness has been detected in the earlier jobs.
    //if (!numCheckSuites) {
    if (true) {
      // Add a succesful check showing no flakiness has been detected.

      fn = () => {
        return this.rest.checks.create({
          ...defaults,
          name: 'Summary',
          head_sha: process.env.CIRCLE_SHA1,
          conclusion: 'success',
          output: {
            title: statuses['success'],
            summary: fmtSummary([], [], 0),
            images: [
              {
                image_url: utils.getRandomHoorayImage(),
                alt: 'Hooray!',
              },
            ],
          },
        })
      }
      errMsg = 'Failed to add summary check run.'
      await this.safeExec(fn, errMsg)
    }
  }

  async addCheck(flakes, skippedTests) {
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
      title: statuses[conclusion],
      summary: stripAnsi(summary_0),
      text: stripAnsi(summary_3),
      annotations: annotations,
    }

    const fn = () => {
      return this.rest.checks.create({
        ...defaults,
        name: utils.getTestSuiteTitles().join(' -> '),
        head_sha: process.env.CIRCLE_SHA1,
        conclusion: conclusion,
        output: output,
      })
    }
    const errMsg = 'Failed to add check run.'
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
