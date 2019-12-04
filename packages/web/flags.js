const FLAGS = {
  development: {
    ECOFUND: true,
    ENV: 'development',
    SDK: true,
    LEADERBOARD: true,
  },
  production: {
    ECOFUND: true,
    ENV: 'production',
    SDK: true,
    LEADERBOARD: false,
  },
  staging: {
    ECOFUND: true,
    ENV: 'staging',
    SDK: true,
    LEADERBOARD: true,
  },
}
module.exports = FLAGS[process.env.DEPLOY_ENV]
