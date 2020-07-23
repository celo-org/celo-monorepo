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
  return [FlakeLabel, utils.getPackageName(), process.env.CIRCLE_JOB]
}

const statuses = {
  failure: 'flakey tests were found',
  neutral: 'flakey tests were skipped',
  success: 'no flakey tests found!',
}

const emojis = {
  failure: utils.redX,
  neutral: utils.warning,
  success: utils.greenCheck,
}

const getConclusion = (flakes, skippedTests) => {
  let conclusion = 'failure'
  if (!flakes.length) {
    conclusion = skippedTests.length ? 'neutral' : 'success'
  }
  return conclusion
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
      id: 71131, // This is the FlakeTracker GitHub App ID. Can be found at github.com -> celo-org -> app settings
      privateKey: process.env.FLAKE_TRACKER_SECRET.replace(/\\n/gm, '\n'),
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
    if (config.shouldCreateIssues) {
      // Check list of ALL flakey issues to ensure no duplicates
      const knownFlakes = await this.fetchKnownFlakes()
      const newFlakes = flakes.filter((flake) => !knownFlakes.includes(flake.title))
      if (newFlakes.length) {
        promises.push(this.createIssues(newFlakes))
      }
    }
    if (config.shouldAddCheckToPR) {
      promises.push(this.endCheck(flakes, skippedTests))
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

  // The first job to complete creates a 'summary' check run that is updated by subsequent jobs.
  // The last job to complete sets the conclusion status.
  async getSummaryCheck() {
    let fn = () => {
      return this.rest.checks.listForRef({
        ...defaults,
        ref: process.env.CIRCLE_SHA1,
        check_name: 'FlakeTracker',
      })
    }
    let errMsg = 'Failed to get summary check run.'
    const res = (await this.safeExec(fn, errMsg)).data

    // If summary check does not yet exist, create it
    if (res.total_count == 0) {
      fn = () => {
        return this.rest.checks.create({
          ...defaults,
          name: 'FlakeTracker',
          head_sha: process.env.CIRCLE_SHA1,
          status: 'in_progress',
        })
      }
      errMsg = 'Failed to start summary check run.'
      return (await this.safeExec(fn, errMsg)).data
    }

    return res.check_runs[0]
  }

  async updateSummaryCheck(flakes, skippedTests) {
    const conclusion = getConclusion(flakes, skippedTests)

    const summaryCheck = await this.getSummaryCheck()

    let body = summaryCheck.output ? summaryCheck.output.text : ''
    body += utils.getTestSuiteTitles().join(' -> ') + ' ' + emojis[conclusion] + '\n'
    const isLastJob = body.match('\n').length == config.numJobsBeingTracked

    if (body.includes(emojis['failure'])) {
      conclusion = 'failure'
    } else if (body.includes(emojis['neutral'])) {
      conclusion = 'neutral'
    } // else: we already have conclusion == 'success'

    const output = {
      title: statuses[conclusion],
      summary: statuses[conclusion] + ' ' + emojis[conclusion],
      text: body,
    }
    const opts = {
      ...defaults,
      check_run_id: summaryCheck.id,
      output: output,
    }
    if (isLastJob) {
      opts.conclusion = conclusion // Check run will show as 'pending' until a conclusion is set
      if (conclusion == 'success') {
        opts.output.summary = fmtSummary([], [], 0)
      }
    }

    const fn = () => {
      return this.rest.checks.update(opts)
    }
    const errMsg = 'Failed to add check run.'
    await this.safeExec(fn, errMsg)
  }

  async startCheck() {
    await this.getSummaryCheck()
  }

  // When a job finishes, endCheck() is called to
  // 1) update the summary check run
  // 2) add additional check runs (with detailed info) if job encountered flakiness or skipped tests.
  async endCheck(flakes, skippedTests) {
    await this.updateSummaryCheck(flakes, skippedTests)

    const conclusion = getConclusion(flakes, skippedTests)
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
