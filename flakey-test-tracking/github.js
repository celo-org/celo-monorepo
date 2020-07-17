const { Octokit } = require('@octokit/rest')
const { App } = require('@octokit/app')
const { retry } = require('@octokit/plugin-retry')
const Client = Octokit.plugin(retry)
const stripAnsi = require('strip-ansi')
const { shouldCreateIssues, shouldAddCheckToPR } = require('./config')
const {
  fmtSummary,
  getTestSuiteTitles,
  parseErrLineNumberFromStack,
  parseFirstErrFromFlakeBody,
  parsePathFromStack,
  parseTestIdFromFlakeTitle,
} = require('./utils')

const FlakeLabel = 'FLAKEY'
const defaults = {
  owner: process.env.CIRCLE_PROJECT_USERNAME || 'celo-org',
  repo: process.env.CIRCLE_PROJECT_REPONAME || 'celo-monorepo',
}

const getLabels = () => {
  const labels = [FlakeLabel]
  if (process.env.CIRCLECI) {
    labels.push(process.env.CIRCLE_JOB)
  }
  return labels
}

class GitHub {
  constructor(app, rest) {
    if (typeof app === 'undefined' || typeof rest === 'undefined') {
      throw new Error('GitHub constructor should not be called directly. Please use GitHub.build()')
    }
    this.app = app
    this.rest = rest
  }

  static async build() {
    const app = new App({
      id: 71131,
      privateKey: process.env.FLAKE_TRACKER_SECRET.replace(/\\n/gm, '\n'),
      //privateKey: privateKey,
    })

    const rest = await auth(app)

    return new GitHub(app, rest)
  }

  async renew() {
    if (typeof this === 'undefined') {
      throw new Error('GitHub.renew() cannot be called before GitHub.build()')
    }
    this.rest = await auth(this.app)
  }

  async report(flakes, skippedTests) {
    const promises = []

    if (shouldCreateIssues) {
      // Check list of flakey issues again to prevent duplicates
      const knownFlakes = await this.fetchKnownFlakes()
      const newFlakes = flakes.filter((flake) => !knownFlakes.includes(flake))
      if (newFlakes.length) {
        promises.push(this.issues(newFlakes))
      }
    }

    if (shouldAddCheckToPR) {
      promises.push(this.endCheck(flakes, skippedTests))
    }

    console.log('\nSending flake tracker results to GitHub...\n')

    return Promise.all(promises)
  }

  async issues(flakes) {
    return Promise.all(newFlakes.map((f) => this.issue(f)))
  }

  async issue(flake) {
    if (process.env.CIRCLECI) {
      flake.body = 'Discovered in PR ' + process.env.CIRCLE_PULL_REQUEST + '\n' + flake.body
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

  async startCheck() {
    const fn = () => {
      return this.rest.checks.create({
        ...defaults,
        name: getTestSuiteTitles().join(' -> '),
        //head_sha: process.env.CIRCLE_SHA1,
        head_sha: '2945424b9d5d2be945851c1143adde027ec463ca',
        status: 'in_progress',
      })
    }

    const errMsg = 'Failed to start check run.'

    this.checkID = (await this.safeExec(fn, errMsg)).data.id
  }

  async endCheck(flakes, skippedTests) {
    const statuses = {
      failure: 'flakey tests were found',
      neutral: 'flakey tests were skipped',
      success: 'no flakey tests found!',
    }

    const summary_0 = fmtSummary(flakes, skippedTests, 0)
    const summary_2 = fmtSummary(flakes, skippedTests, 2)

    let conclusion = 'failure'
    if (!flakes.length) {
      conclusion = skippedTests.length ? 'neutral' : 'success'
    }

    const annotations = flakes.map((f) => {
      const firstErr = parseFirstErrFromFlakeBody(f.body)
      const lineNumber = parseErrLineNumberFromStack(firstErr)
      const path = parsePathFromStack(firstErr)
      return {
        title: f.title,
        path: path.slice(path.indexOf('packages/')),
        start_line: lineNumber,
        end_line: lineNumber + 1,
        annotation_level: 'warning',
        message: stripAnsi(parseFirstErrFromFlakeBody(f.body)),
      }
    })

    const output = {
      title: statuses[conclusion],
      summary: stripAnsi(summary_0),
      text: stripAnsi(summary_2),
      annotations: annotations,
    }

    const fn = () => {
      return this.rest.checks.update({
        ...defaults,
        check_run_id: this.checkID,
        conclusion: conclusion,
        output: output,
      })
    }

    const errMsg = 'Failed to end check run.'

    await this.safeExec(fn, errMsg)
  }

  async fetchKnownFlakes() {
    const fn = () => {
      return this.rest.paginate(this.rest.issues.listForRepo, {
        ...defaults,
        state: 'open',
        labels: getLabels(),
      })
    }

    const errMsg = 'Failed to fetch existing flakey test issues from GitHub.'

    console.log('\nFetching known flakey tests from GitHub...\n')

    const flakeIssues = (await this.safeExec(fn, errMsg)) || []

    return flakeIssues.map((i) => parseTestIdFromFlakeTitle(i.title))
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
