const FLAGS = {
  development: {
    ECOFUND: true,
    ENV: 'development',
    LEADERBOARD: true,
    SDK: true,
  },
  production: {
    ECOFUND: true,
    ENV: 'production',
    LEADERBOARD: true,
    SDK: true,
  },
  staging: {
    ECOFUND: true,
    ENV: 'staging',
    LEADERBOARD: true,
    SDK: true,
  },
}
module.exports = FLAGS[process.env.DEPLOY_ENV]
