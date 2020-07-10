const { Octokit } = require('@octokit/rest')
const { App } = require('@octokit/app')
const { retry } = require('@octokit/plugin-retry')
const Client = Octokit.plugin(retry)

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
      //privateKey: process.env.FLAKE_TRACKER_SECRET,
      //privateKey: privateKey,
    })

    const rest = await auth(app)

    return new GitHub(app, rest)
  }

  async renew() {
    if (typeof this === 'undefined') {
      throw new Error('renew() cannot be called before build()')
    }
    this.rest = await auth(this.app)
  }

  async issue(flake) {
    const fn = () => {
      return this.rest.issues.create({
        ...defaults,
        title: flake.title,
        body: flake.body,
        labels: [FlakeLabel],
      })
    }

    const errMsg = 'Failed to create issue for flakey test. ' + 'Title: "' + flake.title + '",'

    await this.safeExec(fn, errMsg)
  }

  async check(flake) {
    const fn = () => {
      return this.rest.checks.create({
        ...defaults,
        name: 'Flake Tracking',
        head_sha: process.env.CIRCLE_SHA1,
      })
    }

    const errMsg = 'Failed to create check run.'

    await this.safeExec(fn, errMsg)

    // TODO(Alec, next): add checks
    // console.log('PR COMMENT TRIGGERED \n')
    // const prNumber = process.env.CIRCLE_PR_NUMBER
    // console.log(prNumber)
    // console.log(process.env.CIRCLE_PR_REPONAME)
    // try {
    //   await this.rest.pulls.createReviewComment({
    //     ...defaults,
    //     pull_number: prNumber,
    //     commit_id: process.env.CIRCLE_SHA1,
    //     path: flake.title.slice(flake.title.indexOf('/packages'), flake.title.indexOf(':')),
    //     line: flake.title.split(':')[1],
    //     body: flake.title + '\n' + flake.body,
    //   })
    // } catch (error) {
    //
    //   console.error(
    //     '\nFailed to create PR comment for flakey test. ' +
    //       'Title: "' +
    //       flake.title +
    //       '", Client Error: ' +
    //       error
    //   )
    // }
  }

  async fetchKnownFlakes() {
    const fn = () => {
      return this.rest.paginate(this.rest.issues.listForRepo, {
        ...defaults,
        state: 'open',
        labels: [FlakeLabel],
      })
    }

    const errMsg = 'Failed to fetch existing flakey test issues from GitHub.'

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
    })
  } catch (error) {
    console.error('Flake Tracker App failed to authenticate as an installation ' + error)
    return rest // We're still authenticated by the JWT token, but it will expire sooner.
  }
}

module.exports = GitHub
