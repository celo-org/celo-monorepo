const { Octokit } = require('@octokit/rest')
const { App } = require('@octokit/app')
const { retry } = require('@octokit/plugin-retry')
const Client = Octokit.plugin(retry)
const AnsiToHtml = require('ansi-to-html')
const convert = new AnsiToHtml()
const { shouldCreateIssues, shouldAddCheckToPR, shouldSkipFlakes } = require('./config')

const FlakeLabel = 'FLAKEY'
const defaults = {
  owner: process.env.CIRCLE_PROJECT_USERNAME || 'celo-org',
  repo: process.env.CIRCLE_PROJECT_REPONAME || 'celo-monorepo',
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
      const newFlakes = knownFlakes.filter((flake) => !knownFlakes.includes(flake))
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
        body: convert.toHtml(flake.body),
        labels: [FlakeLabel, process.env.CIRCLE_JOB],
      })
    }

    const errMsg = 'Failed to create issue for flakey test. ' + 'Title: "' + flake.title + '",'

    await this.safeExec(fn, errMsg)
  }

  async startCheck() {
    const fn = () => {
      return this.rest.checks.create({
        ...defaults,
        name: 'Flake Tracker',
        head_sha: process.env.CIRCLE_SHA1,
        status: 'in_progress',
      })
    }

    const errMsg = 'Failed to start check run.'

    this.checkID = (await this.safeExec(fn, errMsg)).id
  }

  async endCheck(flakes, skippedTests) {
    const summaries = {
      failure: 'flakey tests found',
      neutral: 'some tests were skipped due to flakiness',
      success: 'no flakey tests found!',
    }

    let conclusion = 'failure'
    if (!flakes.length) {
      conclusion = skippedTests.length ? 'neutral' : 'success'
    }

    let text = ''
    flakes.forEach((flake) => {
      text += flake.title + '\n' + flake.body + '\n'
    })

    const annotations = flakes.map((f) => {
      const firstLineOfStack = f.body.split('at ')[1].split(':')
      return {
        title: f.title,
        path: firstLineOfStack[0],
        start_line: firstLineOfStack[1],
        end_line: firstLineOfStack[1],
        annotation_level: 'warning',
        message: f.body,
      }
    })

    const output = {
      title: process.env.CIRCLE_JOB,
      summary: summaries[conclusion],
      text: text,
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
        labels: [FlakeLabel, process.env.CIRCLE_JOB],
      })
    }

    const errMsg = 'Failed to fetch existing flakey test issues from GitHub.'

    console.log('\nFetching known flakey tests from GitHub...\n')

    const flakeIssues = (await this.safeExec(fn, errMsg)) || []

    return flakeIssues.map((i) => i.title.replace('[FLAKEY TEST]', '').trim())
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
      log: console,
    })
  } catch (error) {
    console.error('Flake Tracker App failed to authenticate as an installation ' + error)
    return rest // We're still authenticated by the JWT token, but it will expire sooner.
  }
}

module.exports = GitHub
