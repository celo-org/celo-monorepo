const FLAGS = {
  development: {
    ECOFUND: true,
    ENV: 'development',
    LEADERBOARD: true,
    VALIDATORS: true,
    SDK: true,
  },
  production: {
    ECOFUND: true,
    ENV: 'production',
    LEADERBOARD: true,
    VALIDATORS: true,
    SDK: true,
  },
  staging: {
    ECOFUND: true,
    ENV: 'staging',
    LEADERBOARD: true,
    VALIDATORS: true,
    SDK: true,
  },
}
module.exports = FLAGS[process.env.DEPLOY_ENV]
