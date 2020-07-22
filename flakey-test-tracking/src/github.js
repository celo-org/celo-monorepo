const { Octokit } = require('@octokit/rest')
const { App } = require('@octokit/app')
const { retry } = require('@octokit/plugin-retry')
const Client = Octokit.plugin(retry)
const stripAnsi = require('strip-ansi')
const { shouldCreateIssues, shouldAddCheckToPR } = require('./config')
const {
  fmtSummary,
  getPackageName,
  getPullNumber,
  getTestSuiteTitles,
  parseErrLineNumberFromStack,
  parseFirstErrFromFlakeBody,
  parseMandatoryTestIssuesFromPullBody,
  parsePathFromStack,
} = require('./utils')

const FlakeLabel = 'FLAKEY'
const defaults = {
  owner: process.env.CIRCLE_PROJECT_USERNAME || 'celo-org',
  repo: process.env.CIRCLE_PROJECT_REPONAME || 'celo-monorepo',
}

const getLabels = () => {
  return [FlakeLabel, getPackageName()]
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
      // Check list of ALL flakey issues to ensure no duplicates
      const knownFlakes = await this.fetchKnownFlakes()
      const newFlakes = flakes.filter((flake) => !knownFlakes.includes(flake.title))
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
    return Promise.all(flakes.map((f) => this.issue(f)))
  }

  async issue(flake) {
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

  async startCheck() {
    const fn = () => {
      return this.rest.checks.create({
        ...defaults,
        name: getTestSuiteTitles().join(' -> '),
        head_sha: process.env.CIRCLE_SHA1,
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
    const summary_3 = fmtSummary(flakes, skippedTests, 3)

    let conclusion = 'failure'
    if (!flakes.length) {
      conclusion = skippedTests.length ? 'neutral' : 'success'
    }

    const annotations = flakes.map((f) => {
      const firstErr = parseFirstErrFromFlakeBody(f.body)
      const lineNumber = parseErrLineNumberFromStack(firstErr) || 1
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
      text: stripAnsi(summary_3),
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

  async fetchMandatoryTestsForPR() {
    if (!process.env.CIRCLECI) return []

    const prNumber = getPullNumber()

    const fn = () => {
      return this.rest.pulls.get({
        ...defaults,
        pull_number: prNumber,
      })
    }

    const errMsg = 'Failed to fetch mandatory tests for PR ' + prNumber

    console.log('\nFetching mandatory tests for PR ' + prNumber + '...\n')

    const prBody = (await this.safeExec(fn, errMsg)).data.body

    return parseMandatoryTestIssuesFromPullBody(prBody)
  }

  async fetchFlakeIssues() {
    const fn = () => {
      return this.rest.paginate(this.rest.issues.listForRepo, {
        ...defaults,
        state: 'open',
        labels: getLabels(),
      })
    }

    const errMsg = 'Failed to fetch existing flakey test issues from GitHub.'

    console.log('\nFetching known flakey tests from GitHub...')

    return (await this.safeExec(fn, errMsg)) || []
  }

  async fetchKnownFlakesToSkip() {
    const flakeIssues = await this.fetchFlakeIssues()
    const mandatoryTests = await this.fetchMandatoryTestsForPR()
    console.log(JSON.stringify(mandatoryTests)) //TODO(Alec): delete logs
    const knownFlakesToSkip = flakeIssues.filter((i) => {
      console.log(JSON.stringify(i))
      return !mandatoryTests.includes(i.number.toString())
    })
    return knownFlakesToSkip.map((i) => i.title)
  }

  async fetchKnownFlakes() {
    const flakeIssues = await this.fetchFlakeIssues()
    return flakeIssues.map((i) => i.title)
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
